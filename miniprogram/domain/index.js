/**
 * Domain 层统一导出
 *
 * 外部模块只能通过此入口引用 Domain 层，禁止直接 import 子模块。
 */

// 实体
const {
  createCard,
  enrichCard,
  markPOIStatus,
  toggleStar,
  updateUserNote,
} = require('./entities/Card');
const {
  createTrip,
  fillItinerary,
  changeStatus,
  replaceDayCards,
  deleteCard,
  getTotalCardCount,
  getDayCards,
} = require('./entities/Trip');
const {
  createConversation,
  addMessage,
  pushSnapshot,
  popSnapshot,
  getMessageCount,
} = require('./entities/Conversation');

// 值对象
const {
  createDestination,
  createGeoPoint,
  createTransportSegment,
  createDaySummary,
  createTag,
  STYLE_TAGS,
} = require('./value-objects');

// 枚举
const { CardType, TripStatus, POIStatus, DataSource, ChatAction } = require('./enums');

// 错误
const AppError = require('./errors/AppError');
const { ErrorCodes, UserMessages } = require('./errors/ErrorCodes');

// 状态机
const { canTransition, transition, getAvailableActions } = require('./StateMachine');

// 事件
const EventBus = require('./events/EventBus');

module.exports = {
  // Entities
  createCard,
  enrichCard,
  markPOIStatus,
  toggleStar,
  updateUserNote,
  createTrip,
  fillItinerary,
  changeStatus,
  replaceDayCards,
  deleteCard,
  getTotalCardCount,
  getDayCards,
  createConversation,
  addMessage,
  pushSnapshot,
  popSnapshot,
  getMessageCount,

  // Value Objects
  createDestination,
  createGeoPoint,
  createTransportSegment,
  createDaySummary,
  createTag,
  STYLE_TAGS,

  // Enums
  CardType,
  TripStatus,
  POIStatus,
  DataSource,
  ChatAction,

  // Errors
  AppError,
  ErrorCodes,
  UserMessages,

  // StateMachine
  canTransition,
  transition,
  getAvailableActions,

  // Events
  EventBus,
};
