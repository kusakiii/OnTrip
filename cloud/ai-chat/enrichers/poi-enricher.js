/* eslint-disable no-useless-escape, no-unused-vars, eqeqeq, no-useless-catch */
/**
 * POI 富化层 — 用高德地图 API 校验和补全 AI 生成的行程卡片
 *
 * 调用时机：ai-chat 云函数内，DTO 校验通过后，返回前端之前
 * 富化策略：并发查询（上限 5） + 独立降级 + 缓存穿透保护
 *
 * 约束：
 * - 城市约束是强制性的（所有搜索带 destination 参数）
 * - 富化失败绝不阻塞行程返回
 * - 缓存 Key 使用高德 POI ID（非 AI 生成的名称）
 */

// ========================
// 1. Provider 接口抽象
// ========================

/**
 * 标准化 POI 查询结果（领域模型，非高德响应 1:1 映射）
 * @typedef {Object} NormalizedPOI
 * @property {string}  name          - 标准名称
 * @property {string}  address       - 详细地址
 * @property {{lat:number, lng:number}} location
 * @property {number}  [rating]      - 评分（5 分制）
 * @property {number}  [avgPrice]    - 人均消费（元）
 * @property {string[]} photos       - 照片 URL 列表
 * @property {string[]} tags         - 特色标签（如["烤鱼","麻辣香锅"]）
 * @property {string}  [businessArea]- 所属商圈
 * @property {string}  [openHours]   - 营业时间
 * @property {string}  poiId         - 厂商 POI ID（用于缓存 Key）
 */

/**
 * POI Provider 接口
 * @typedef {Object} POIProvider
 * @property {(query: string, city: string, type: string) => Promise<NormalizedPOI|null>} search
 */

// ========================
// 2. 高德 Provider 实现
// ========================

const AMAP_KEY = process.env.AMAP_KEY; // 云函数环境变量，前端不接触
const AMAP_SEARCH_URL = 'https://restapi.amap.com/v3/place/text';

const TYPE_TO_AMAP_CATEGORY = {
  spot: '110000|140000', // 风景名胜 + 公园广场
  food: '050000', // 餐饮服务
  shop: '060000', // 购物服务
  hotel: '080000', // 住宿服务
};

function createAmapProvider(apiKey) {
  return {
    async search(query, city, type) {
      const types = TYPE_TO_AMAP_CATEGORY[type] || '';
      const params = new URLSearchParams({
        key: apiKey,
        keywords: query,
        city: city,
        types: types,
        offset: 5,
        extensions: 'all',
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s 单次超时

      try {
        const res = await fetch(`${AMAP_SEARCH_URL}?${params}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          return null;
        }

        const data = await res.json();
        if (data.status !== '1' || !data.pois?.length) {
          return null;
        }

        return normalizeAmapPOI(data.pois[0]);
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn(`[POI] amap timeout for "${query}" in ${city}`);
        }
        return null; // 超时或其他网络错误 → 静默降级
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

function normalizeAmapPOI(raw) {
  return {
    name: raw.name,
    address: raw.address,
    location: raw.location
      ? { lat: parseFloat(raw.location.split(',')[1]), lng: parseFloat(raw.location.split(',')[0]) }
      : null,
    rating: raw.biz_ext?.rating ? parseFloat(raw.biz_ext.rating) : undefined,
    avgPrice: raw.cost ? parseFloat(raw.cost) : undefined,
    photos: (raw.photos || []).map((p) => p.url).filter(Boolean),
    tags: raw.tag
      ? raw.tag
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    businessArea: raw.business_area || undefined,
    openHours: raw.biz_ext?.opentime || undefined,
    poiId: raw.id, // 高德 POI ID → 缓存 Key
  };
}

// ========================
// 3. 名称匹配策略
// ========================

/**
 * 找到高德返回的 POI 列表中与 AI 名称最佳匹配的条目
 * 策略：精确匹配 → 包含匹配 → 编辑距离 < min(3, name.length*0.3) → 放弃
 *
 * @param {string} aiName - AI 生成的景点名（已清洗）
 * @param {NormalizedPOI[]} pois - 高德返回的 POI 列表
 * @returns {NormalizedPOI|null}
 */
function findBestMatch(aiName, pois) {
  if (!pois.length) {
    return null;
  }

  const cleaned = cleanName(aiName);
  if (!cleaned) {
    return null;
  }

  for (const poi of pois) {
    const poiName = poi.name;

    // ① 精确匹配
    if (poiName === cleaned || cleaned === poiName) {
      return poi;
    }

    // ② 包含匹配
    if (poiName.includes(cleaned) || cleaned.includes(poiName)) {
      return poi;
    }
  }

  // ③ 编辑距离匹配
  const maxDist = Math.min(3, Math.floor(cleaned.length * 0.3));
  for (const poi of pois) {
    if (levenshtein(cleaned, poi.name) <= maxDist) {
      return poi;
    }
  }

  return null;
}

/**
 * 清洗 AI 生成的名称——去掉括号注释、修饰前缀、多余标点
 */
function cleanName(name) {
  return name
    .replace(/[（(][^)）]*[)）]/g, '') // 去括号
    .replace(/[【\[]{1}[^】\]]*[】\]]{1}/g, '') // eslint-disable-line no-useless-escape
    .replace(/[！!。，,、·「」""'']/g, '')
    .replace(/^(网红|必去|推荐|打卡|热门)/, '')
    .trim();
}

/**
 * Levenshtein 编辑距离
 */
function levenshtein(a, b) {
  const m = a.length,
    n = b.length;
  if (m === 0) {
    return n;
  }
  if (n === 0) {
    return m;
  }

  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ========================
// 4. 缓存层
// ========================

const CACHE_TTL = 7 * 24 * 3600; // 7 天

/**
 * @param {string} poiId - 高德 POI ID（非 AI 名称！）
 */
async function getCache(poiId) {
  try {
    const db = require('./db'); // 云数据库实例
    const coll = db.collection('poi_cache');
    const doc = await coll.doc(poiId).get();
    if (!doc.data?.length) {
      return null;
    }

    const cached = doc.data[0];
    if (Date.now() - cached._updateTime > CACHE_TTL * 1000) {
      return null;
    }
    return cached.data;
  } catch {
    return null; // 缓存读失败静默降级
  }
}

async function setCache(poiId, data) {
  try {
    const db = require('./db');
    const coll = db.collection('poi_cache');
    await coll.doc(poiId).set({
      data: data,
      _updateTime: Date.now(),
    });
  } catch (err) {
    // 缓存写失败不应影响主流程，但需要记录
    console.warn(`[POI] cache write failed for ${poiId}:`, err.message);
  }
}

// ========================
// 5. 主富化函数
// ========================

/**
 * 对行程中所有卡片做 POI 数据富化（并发，城市约束强制）
 *
 * @param {Object} trip - AI 生成的原始行程 JSON
 * @param {string} destination - 目的地城市（如"杭州"）
 * @returns {Object} 富化后的行程（深拷贝，不修改入参）
 */
async function enrichWithPOI(trip, destination) {
  // --- 输入校验（fail-fast）---
  if (!trip || typeof trip !== 'object') {
    throw new TypeError('[POI] trip must be a non-null object');
  }
  if (!Array.isArray(trip.itinerary) || trip.itinerary.length === 0) {
    throw new TypeError('[POI] trip.itinerary must be a non-empty array');
  }
  if (!destination || typeof destination !== 'string') {
    throw new TypeError('[POI] destination is required and must be a string');
  }

  // --- 深拷贝，不修改入参 ---
  const enrichedTrip = JSON.parse(JSON.stringify(trip));

  // --- 展开所有卡片 + 并发限流 ---
  const provider = createAmapProvider(AMAP_KEY);
  const flatCards = [];
  for (const day of enrichedTrip.itinerary) {
    for (const card of day.cards) {
      flatCards.push({ day, card });
    }
  }

  const CONCURRENCY = 5;
  const results = await batchWithConcurrency(
    flatCards,
    ({ card }) => enrichSingleCard(card, destination, provider),
    CONCURRENCY,
  );

  return enrichedTrip;
}

/**
 * 单个卡片的富化逻辑（独立 try-catch，失败不影响其他卡片）
 */
async function enrichSingleCard(card, destination, provider) {
  try {
    // 1. 查缓存（用城市+清洗后的名称作为查询条件，但缓存 Key 用 POI ID）
    const cleanedName = cleanName(card.name);
    if (!cleanedName) {
      card._poiStatus = 'invalid_name';
      card._dataSource = 'ai';
      return;
    }

    // 2. 调高德 API（城市约束强制）
    const pois = await provider.search(cleanedName, destination, card.type);
    if (!pois) {
      // API 错误 / 超时 / 无结果
      card._poiStatus = 'api_error';
      card._dataSource = 'ai';
      return;
    }

    // 3. 名称匹配
    const best = findBestMatch(cleanedName, [pois]); // pois 此时是单个 NormalizedPOI
    if (!best) {
      card._poiStatus = 'not_found';
      card._dataSource = 'ai';
      return;
    }

    // 4. 富化字段
    card.rating = best.rating ?? card.rating;
    card.ticketPrice = best.avgPrice != null ? `¥${best.avgPrice}/人` : card.ticketPrice;
    card.photos = best.photos.length > 0 ? best.photos : card.photos;
    if (best.location) {
      card.location = best.location;
    }
    card.address = best.address;
    card.tags = best.tags;
    card.businessArea = best.businessArea;
    card.openHours = best.openHours ?? card.openHours;
    card._poiStatus = 'verified';
    card._dataSource = 'amap';

    // 5. 写缓存（独立 try-catch，失败不影响已富化数据）
    if (best.poiId) {
      await setCache(best.poiId, {
        rating: best.rating,
        avgPrice: best.avgPrice,
        photos: best.photos,
        location: best.location,
        address: best.address,
        tags: best.tags,
        businessArea: best.businessArea,
        openHours: best.openHours,
      }).catch((cacheErr) => {
        console.warn(`[POI] cache write failed (non-blocking):`, cacheErr.message);
      });
    }
  } catch (err) {
    // 只降级网络/API 错误；TypeError/ReferenceError 必须抛出
    if (err instanceof TypeError || err instanceof ReferenceError) {
      throw err;
    }
    card._poiStatus = 'enrich_error';
    card._dataSource = 'ai';
    console.warn(`[POI] enrich failed for "${card.name}":`, err.message);
  }
}

// ========================
// 6. 并发工具
// ========================

async function batchWithConcurrency(items, fn, limit) {
  const results = [];
  const queue = [...items];

  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      try {
        results.push(await fn(item));
      } catch (err) {
        // fn 内部的 TypeError/ReferenceError 应在此处向上传播
        throw err;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ========================
// 7. 导出
// ========================

module.exports = {
  enrichWithPOI,
  createAmapProvider,
  findBestMatch,
  cleanName,
  // 仅测试用
  _internals: { levenshtein, normalizeAmapPOI },
};
