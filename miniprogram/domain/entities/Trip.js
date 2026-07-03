/**
 * Trip 聚合根 — Architecture v2 §2.1
 *
 * Trip 是唯一聚合根，包含：
 * - 基础信息（目的地、天数、风格标签）
 * - Day[] → Card[] 行程结构
 * - Conversation 对话上下文
 * - Metadata 元数据
 *
 * 所有对 Trip 子实体的修改必须通过 Trip 聚合根方法。
 */

const { TripStatus, DataSource } = require('../enums');
const { createDestination, createDaySummary } = require('../value-objects');
const { createCard } = require('./Card');
const { transition } = require('../StateMachine');

/**
 * 生成唯一 ID（小程序环境兼容）
 */
function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
}

const MIN_DAYS = 1;
const MAX_DAYS = 15;

/**
 * 创建空白行程
 *
 * @param {Object} params
 * @param {string} params.city - 目的地城市
 * @param {number} params.days - 天数 (1-15)
 * @param {Array<{id:string, label:string}>} [params.styleTags=[]] - 风格标签
 * @returns {Object} 不可变 Trip 对象
 */
function createTrip({ city, days, styleTags = [] }) {
  if (!city || typeof city !== 'string') {
    throw new TypeError('Trip.city must be a non-empty string');
  }
  if (typeof days !== 'number' || days < MIN_DAYS || days > MAX_DAYS) {
    throw new TypeError(`Trip.days must be a number between ${MIN_DAYS} and ${MAX_DAYS}`);
  }

  const destination = createDestination(city);
  const now = new Date().toISOString();

  return Object.freeze({
    tripId: generateId('trip_'),
    destination,
    days,
    styleTags: [...styleTags],
    status: TripStatus.DRAFT,
    createdAt: now,
    updatedAt: now,

    itinerary: [],
    conversation: null,

    version: 1,
    editCount: 0,
  });
}

/**
 * 用 AI 生成的行程填充 Trip
 *
 * @param {Object} trip - 当前 Trip
 * @param {Array} rawItinerary - AI 返回的 itinerary 数组
 * @returns {Object} 新 Trip（状态变为 generated）
 */
function fillItinerary(trip, rawItinerary) {
  if (!Array.isArray(rawItinerary) || rawItinerary.length === 0) {
    throw new TypeError('rawItinerary must be a non-empty array');
  }

  const itinerary = rawItinerary.map((day) => {
    const cards = (day.cards || []).map((rawCard) =>
      createCard({
        cardId: rawCard.cardId || generateId('card_'),
        type: rawCard.type,
        name: rawCard.name,
        searchName: rawCard.searchName,
        timeRange: rawCard.timeRange,
        duration: rawCard.duration,
        description: rawCard.description,
        transportFromPrevious: rawCard.transportFromPrevious,
      }),
    );

    return Object.freeze({
      dayIndex: day.dayIndex,
      date: day.date || null,
      summary: createDaySummary(
        day.summary?.totalDistance || '',
        day.summary?.estimatedCost || 0,
        cards.length,
      ),
      cards: Object.freeze(cards),
    });
  });

  const newStatus = transition(trip.status, TripStatus.GENERATED);

  return Object.freeze({
    ...trip,
    itinerary: Object.freeze(itinerary),
    status: newStatus,
    updatedAt: new Date().toISOString(),
    version: trip.version + 1,
    editCount: trip.editCount + 1,
  });
}

/**
 * 状态转换（统一入口）
 */
function changeStatus(trip, newStatus) {
  return Object.freeze({
    ...trip,
    status: transition(trip.status, newStatus),
    updatedAt: new Date().toISOString(),
    version: trip.version + 1,
  });
}

/**
 * 替换某一天的卡片（对话修改用）
 *
 * @param {Object} trip
 * @param {number} dayIndex
 * @param {Array} newCards - 新的卡片数组
 * @returns {Object} 新 Trip
 */
function replaceDayCards(trip, dayIndex, newCards) {
  const itinerary = trip.itinerary.map((day) => {
    if (day.dayIndex !== dayIndex) {
      return day;
    }
    const cards = newCards.map((raw) =>
      createCard({
        cardId: raw.cardId || generateId('card_'),
        type: raw.type,
        name: raw.name,
        searchName: raw.searchName,
        timeRange: raw.timeRange,
        duration: raw.duration,
        description: raw.description,
        transportFromPrevious: raw.transportFromPrevious,
      }),
    );
    return Object.freeze({
      ...day,
      cards: Object.freeze(cards),
      summary: createDaySummary(
        day.summary?.totalDistance || '',
        day.summary?.estimatedCost || 0,
        cards.length,
      ),
    });
  });

  return Object.freeze({
    ...trip,
    itinerary: Object.freeze(itinerary),
    updatedAt: new Date().toISOString(),
    version: trip.version + 1,
    editCount: trip.editCount + 1,
    _dataSource: DataSource.USER,
  });
}

/**
 * 删除某张卡片
 */
function deleteCard(trip, dayIndex, cardId) {
  const itinerary = trip.itinerary.map((day) => {
    if (day.dayIndex !== dayIndex) {
      return day;
    }
    const cards = day.cards.filter((c) => c.cardId !== cardId);
    return Object.freeze({
      ...day,
      cards: Object.freeze(cards),
      summary: createDaySummary(
        day.summary?.totalDistance || '',
        day.summary?.estimatedCost || 0,
        cards.length,
      ),
    });
  });

  return Object.freeze({
    ...trip,
    itinerary: Object.freeze(itinerary),
    updatedAt: new Date().toISOString(),
    version: trip.version + 1,
    editCount: trip.editCount + 1,
  });
}

/**
 * 获取行程总卡片数
 */
function getTotalCardCount(trip) {
  return trip.itinerary.reduce((sum, day) => sum + day.cards.length, 0);
}

/**
 * 获取某天的卡片列表
 */
function getDayCards(trip, dayIndex) {
  const day = trip.itinerary.find((d) => d.dayIndex === dayIndex);
  return day ? day.cards : [];
}

module.exports = {
  createTrip,
  fillItinerary,
  changeStatus,
  replaceDayCards,
  deleteCard,
  getTotalCardCount,
  getDayCards,
  generateId,
};
