/**
 * Domain Enums — 所有领域枚举定义
 *
 * 原则：
 * - 枚举统一管理，禁止 magic string
 * - 使用 Object.freeze 防止运行时修改
 * - 提供 isValid 校验方法
 */

// ========================
// CardType — 卡片类型
// ========================
const CardType = Object.freeze({
  SPOT: 'spot',
  FOOD: 'food',
  SHOP: 'shop',
  HOTEL: 'hotel',
  TRANSPORT: 'transport',

  values() {
    return [this.SPOT, this.FOOD, this.SHOP, this.HOTEL, this.TRANSPORT];
  },

  isValid(value) {
    return this.values().includes(value);
  },
});

// ========================
// TripStatus — 行程状态
// ========================
const TripStatus = Object.freeze({
  DRAFT: 'draft',
  GENERATING: 'generating',
  GENERATED: 'generated',
  ENRICHING: 'enriching',
  READY: 'ready',
  ARCHIVED: 'archived',
  ERROR: 'error',

  values() {
    return [
      this.DRAFT,
      this.GENERATING,
      this.GENERATED,
      this.ENRICHING,
      this.READY,
      this.ARCHIVED,
      this.ERROR,
    ];
  },

  isValid(value) {
    return this.values().includes(value);
  },
});

// ========================
// POIStatus — POI 校验状态
// ========================
const POIStatus = Object.freeze({
  PENDING: 'pending',
  VERIFIED: 'verified',
  NOT_FOUND: 'not_found',
  API_ERROR: 'api_error',
  INVALID_NAME: 'invalid_name',

  values() {
    return [this.PENDING, this.VERIFIED, this.NOT_FOUND, this.API_ERROR, this.INVALID_NAME];
  },

  isValid(value) {
    return this.values().includes(value);
  },
});

// ========================
// DataSource — 数据来源
// ========================
const DataSource = Object.freeze({
  AI: 'ai',
  AMAP: 'amap',
  TENCENT: 'tencent',
  USER: 'user',

  values() {
    return [this.AI, this.AMAP, this.TENCENT, this.USER];
  },

  isValid(value) {
    return this.values().includes(value);
  },
});

// ========================
// ChatAction — 对话操作类型
// ========================
const ChatAction = Object.freeze({
  REPLACE: 'replace',
  ADD: 'add',
  DELETE: 'delete',
  REORDER: 'reorder',
  GLOBAL: 'global',
  STYLE: 'style',
  QUERY: 'query',
  CLARIFY: 'clarify',

  values() {
    return [
      this.REPLACE,
      this.ADD,
      this.DELETE,
      this.REORDER,
      this.GLOBAL,
      this.STYLE,
      this.QUERY,
      this.CLARIFY,
    ];
  },

  isValid(value) {
    return this.values().includes(value);
  },
});

module.exports = {
  CardType,
  TripStatus,
  POIStatus,
  DataSource,
  ChatAction,
};
