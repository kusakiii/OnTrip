/**
 * DTO 校验器 — Architecture v2 §3.3 步骤②
 *
 * 职责：
 * - 根据 JSON Schema 校验 AI 输出
 * - 校验失败时自动修复（缺失字段补默认值、类型错误尝试转换）
 * - 返回修复后的数据 + 诊断信息
 *
 * 注意：小程序环境使用轻量 Schema 校验（自实现），
 * 而非 ajv（体积太大）。如需严格校验，可在云函数端使用 ajv。
 */

// Schema 定义文件，供未来 ajv 严格模式使用
// const TRIP_SCHEMA = require('../schema/trip.schema.json');

// ========================
// 1. Schema 校验引擎（轻量）
// ========================

/**
 * 校验行程输出是否符合 Schema
 *
 * @param {Object} data - AI 返回的 JSON
 * @returns {{ valid: boolean, errors: Array<{path:string, message:string}>, repaired: Object }}
 */
function validateTripOutput(data) {
  const errors = [];
  const repaired = JSON.parse(JSON.stringify(data)); // 深拷贝

  // 顶层校验
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: [{ path: '$', message: 'Output must be a non-null object' }],
      repaired: null,
    };
  }

  // itinerary 必填
  if (!Array.isArray(data.itinerary)) {
    errors.push({ path: '$.itinerary', message: 'itinerary must be an array' });
    repaired.itinerary = [];
    return { valid: false, errors, repaired };
  }

  if (data.itinerary.length === 0) {
    errors.push({ path: '$.itinerary', message: 'itinerary must have at least 1 day' });
  }

  // 逐日校验
  repaired.itinerary = data.itinerary.map((day, dayIdx) => validateDay(day, dayIdx, errors));

  return {
    valid: errors.length === 0,
    errors,
    repaired,
  };
}

/**
 * 校验单天数据
 */
function validateDay(day, dayIdx, errors) {
  const prefix = `$.itinerary[${dayIdx}]`;
  const repaired = { ...day };

  // dayIndex
  if (typeof day.dayIndex !== 'number') {
    errors.push({ path: `${prefix}.dayIndex`, message: 'dayIndex must be a number' });
    repaired.dayIndex = dayIdx + 1; // 修复：用数组下标+1
  }

  // cards
  if (!Array.isArray(day.cards)) {
    errors.push({ path: `${prefix}.cards`, message: 'cards must be an array' });
    repaired.cards = [];
  } else if (day.cards.length === 0) {
    errors.push({ path: `${prefix}.cards`, message: 'cards must have at least 1 card' });
  }

  repaired.cards = (repaired.cards || []).map((card, cardIdx) =>
    validateCard(card, dayIdx, cardIdx, errors),
  );

  // summary 补充
  if (!repaired.summary) {
    repaired.summary = {
      totalDistance: '',
      estimatedCost: 0,
      spotCount: repaired.cards.length,
    };
  }

  return repaired;
}

/**
 * 校验单张卡片
 */
function validateCard(card, dayIdx, cardIdx, errors) {
  const prefix = `$.itinerary[${dayIdx}].cards[${cardIdx}]`;
  const repaired = { ...card };

  // type
  const validTypes = ['spot', 'food', 'shop', 'hotel', 'transport'];
  if (!card.type || !validTypes.includes(card.type)) {
    errors.push({
      path: `${prefix}.type`,
      message: `type must be one of: ${validTypes.join(',')}`,
    });
    repaired.type = 'spot'; // 降级默认值
  }

  // name
  if (!card.name || typeof card.name !== 'string') {
    errors.push({ path: `${prefix}.name`, message: 'name is required' });
    repaired.name = '未命名地点';
  }

  // timeRange
  if (!card.timeRange || typeof card.timeRange !== 'string') {
    errors.push({ path: `${prefix}.timeRange`, message: 'timeRange is required' });
    repaired.timeRange = '09:00-10:00'; // 降级默认值
  }

  // duration（修复非数字）
  if (card.duration !== undefined && typeof card.duration !== 'number') {
    errors.push({ path: `${prefix}.duration`, message: 'duration must be a number' });
    repaired.duration = 120; // 降级默认值
  }

  // rating（修复范围）
  if (card.rating !== undefined) {
    if (typeof card.rating !== 'number') {
      repaired.rating = null;
    } else if (card.rating < 0 || card.rating > 5) {
      repaired.rating = Math.max(0, Math.min(5, card.rating));
    }
  }

  // transportFromPrevious（修复格式）
  if (card.transportFromPrevious && typeof card.transportFromPrevious === 'string') {
    // AI 返回字符串格式 "步行 15分钟" → 解析为对象
    const parsed = parseTransportString(card.transportFromPrevious);
    repaired.transportFromPrevious = parsed;
  }

  return repaired;
}

/**
 * 解析字符串格式的交通信息
 * "步行 15分钟" → { method: "步行", duration: 15 }
 */
function parseTransportString(str) {
  if (!str || str === 'null' || str === '首站') {
    return null;
  }
  const match = str.match(/^(步行|打车|地铁|公交)\s*(\d+)/);
  if (match) {
    return {
      method: match[1],
      duration: parseInt(match[2], 10),
    };
  }
  return null;
}

/**
 * 校验 + 修复入口
 *
 * @param {Object} data - AI 返回的 JSON
 * @returns {{ valid: boolean, errors: Array, data: Object }}
 */
function validate(data) {
  const { valid, errors, repaired } = validateTripOutput(data);
  return { valid, errors, data: repaired };
}

module.exports = { validate, validateTripOutput, parseTransportString };
