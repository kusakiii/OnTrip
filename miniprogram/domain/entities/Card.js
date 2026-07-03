/**
 * Card 实体 — 行程卡片
 *
 * 每张卡片代表行程中的一项活动（景点/餐厅/购物/酒店/交通）
 *
 * 字段分类：
 * - AI 生成字段：type, name, searchName, timeRange, duration, description, transportFromPrevious
 * - POI 富化字段：location, address, rating, ticketPrice, openHours, photos, tags, businessArea
 * - 用户修改字段：isStarred, userNote
 * - 系统字段：cardId, _poiStatus, _dataSource, _version
 */

const { CardType, POIStatus, DataSource } = require('../enums');
const { createGeoPoint, createTransportSegment } = require('../value-objects');

const DEFAULT_PHOTOS = [];

/**
 * 创建一张新卡片
 *
 * @param {Object} params
 * @param {string} params.cardId
 * @param {string} params.type - CardType
 * @param {string} params.name - AI 生成的名称
 * @param {string} [params.searchName] - 用于地图搜索的简洁名称
 * @param {string} [params.timeRange] - 如 "09:00-11:00"
 * @param {number} [params.duration] - 分钟
 * @param {string} [params.description]
 * @param {Object} [params.transportFromPrevious] - {method, duration, distance}
 * @returns {Object} 不可变的 Card 对象
 */
function createCard({
  cardId,
  type,
  name,
  searchName = null,
  timeRange = null,
  duration = null,
  description = null,
  transportFromPrevious = null,
}) {
  // 必填字段校验
  if (!cardId || typeof cardId !== 'string') {
    throw new TypeError('Card.cardId must be a non-empty string');
  }
  if (!CardType.isValid(type)) {
    throw new TypeError(`Card.type must be a valid CardType, got: ${type}`);
  }
  if (!name || typeof name !== 'string') {
    throw new TypeError('Card.name must be a non-empty string');
  }

  // 构建交通段值对象
  let transport = null;
  if (transportFromPrevious) {
    transport = createTransportSegment(
      transportFromPrevious.method,
      transportFromPrevious.duration,
      transportFromPrevious.distance,
    );
  }

  return Object.freeze({
    cardId,
    type,
    name,
    searchName,
    timeRange,
    duration: duration ?? null,
    description: description ?? null,
    transportFromPrevious: transport,

    // POI 富化字段（初始为 null）
    location: null,
    address: null,
    rating: null,
    ticketPrice: null,
    openHours: null,
    photos: DEFAULT_PHOTOS,
    tags: [],
    businessArea: null,

    // 用户修改字段
    isStarred: false,
    userNote: null,

    // 系统字段
    _poiStatus: POIStatus.PENDING,
    _dataSource: DataSource.AI,
    _version: 1,
  });
}

/**
 * 将 POI 富化数据写入卡片（返回新对象，不修改原对象）
 *
 * @param {Object} card - 原卡片
 * @param {Object} poiData - 富化数据
 * @returns {Object} 新卡片
 */
function enrichCard(card, poiData) {
  return Object.freeze({
    ...card,
    name: poiData.name || card.name,
    location: poiData.location
      ? createGeoPoint(poiData.location.lat, poiData.location.lng)
      : card.location,
    address: poiData.address ?? card.address,
    rating: poiData.rating ?? card.rating,
    ticketPrice: poiData.ticketPrice ?? card.ticketPrice,
    openHours: poiData.openHours ?? card.openHours,
    photos: poiData.photos && poiData.photos.length > 0 ? [...poiData.photos] : card.photos,
    tags: poiData.tags && poiData.tags.length > 0 ? [...poiData.tags] : card.tags,
    businessArea: poiData.businessArea ?? card.businessArea,
    _poiStatus: POIStatus.VERIFIED,
    _dataSource: DataSource.AMAP,
    _version: card._version + 1,
  });
}

/**
 * 标记 POI 状态（返回新对象）
 */
function markPOIStatus(card, status) {
  if (!POIStatus.isValid(status)) {
    throw new TypeError(`Invalid POIStatus: ${status}`);
  }
  return Object.freeze({
    ...card,
    _poiStatus: status,
    _version: card._version + 1,
  });
}

/**
 * 切换收藏状态（返回新对象）
 */
function toggleStar(card) {
  return Object.freeze({
    ...card,
    isStarred: !card.isStarred,
    _dataSource: card._dataSource === DataSource.AI ? DataSource.USER : card._dataSource,
    _version: card._version + 1,
  });
}

/**
 * 更新用户备注（返回新对象）
 */
function updateUserNote(card, note) {
  return Object.freeze({
    ...card,
    userNote: note,
    _dataSource: card._dataSource === DataSource.AI ? DataSource.USER : card._dataSource,
    _version: card._version + 1,
  });
}

module.exports = {
  createCard,
  enrichCard,
  markPOIStatus,
  toggleStar,
  updateUserNote,
};
