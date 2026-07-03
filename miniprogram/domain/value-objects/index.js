/**
 * Domain Value Objects — 不可变值对象
 *
 * 原则：
 * - 值对象不可变（创建后字段不修改，修改通过创建新实例）
 * - 值对象不包含业务逻辑（业务逻辑归 UseCase）
 * - 所有工厂方法返回冻结对象
 */

// ========================
// Destination — 目的地
// ========================
/**
 * @param {string} city - 城市名
 * @param {number} [lat]
 * @param {number} [lng]
 */
function createDestination(city, lat, lng) {
  if (!city || typeof city !== 'string') {
    throw new TypeError('Destination.city must be a non-empty string');
  }
  return Object.freeze({
    city,
    lat: lat ?? null,
    lng: lng ?? null,
  });
}

// ========================
// GeoPoint — 地理坐标
// ========================
/**
 * @param {number} lat - 纬度 [-90, 90]
 * @param {number} lng - 经度 [-180, 180]
 */
function createGeoPoint(lat, lng) {
  if (typeof lat !== 'number' || lat < -90 || lat > 90) {
    throw new TypeError('GeoPoint.lat must be a number in [-90, 90]');
  }
  if (typeof lng !== 'number' || lng < -180 || lng > 180) {
    throw new TypeError('GeoPoint.lng must be a number in [-180, 180]');
  }
  return Object.freeze({ lat, lng });
}

// ========================
// TransportSegment — 交通方式
// ========================
/**
 * @param {string} method - 步行|打车|地铁|公交
 * @param {number} duration - 分钟
 * @param {string} [distance]
 */
function createTransportSegment(method, duration, distance) {
  const validMethods = ['步行', '打车', '地铁', '公交'];
  if (!validMethods.includes(method)) {
    throw new TypeError(`TransportSegment.method must be one of: ${validMethods.join(',')}`);
  }
  if (typeof duration !== 'number' || duration <= 0) {
    throw new TypeError('TransportSegment.duration must be a positive number');
  }
  return Object.freeze({
    method,
    duration,
    distance: distance ?? null,
  });
}

// ========================
// DaySummary — 每日摘要
// ========================
/**
 * @param {string} totalDistance
 * @param {number} estimatedCost
 * @param {number} spotCount
 */
function createDaySummary(totalDistance, estimatedCost, spotCount) {
  return Object.freeze({
    totalDistance: totalDistance || '',
    estimatedCost: typeof estimatedCost === 'number' ? estimatedCost : 0,
    spotCount: typeof spotCount === 'number' ? spotCount : 0,
  });
}

// ========================
// Tag — 风格标签
// ========================
const VALID_TAG_IDS = ['art', 'food', 'family', 'nature', 'shop', 'relax', 'walk'];

/**
 * @param {string} id
 * @param {string} label
 */
function createTag(id, label) {
  if (!VALID_TAG_IDS.includes(id)) {
    throw new TypeError(`Tag.id must be one of: ${VALID_TAG_IDS.join(',')}, got: ${id}`);
  }
  if (!label || typeof label !== 'string') {
    throw new TypeError('Tag.label must be a non-empty string');
  }
  return Object.freeze({ id, label });
}

// ========================
// StyleTags 预设
// ========================
const STYLE_TAGS = Object.freeze([
  createTag('art', '文艺'),
  createTag('food', '美食'),
  createTag('family', '亲子'),
  createTag('nature', '自然'),
  createTag('shop', '购物'),
  createTag('relax', '休闲'),
  createTag('walk', '暴走'),
]);

module.exports = {
  createDestination,
  createGeoPoint,
  createTransportSegment,
  createDaySummary,
  createTag,
  STYLE_TAGS,
  VALID_TAG_IDS,
};
