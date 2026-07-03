/**
 * 应用常量 — 集中管理所有 magic number/string
 *
 * 原则：
 * - 所有可调参数必须有注释说明含义和影响范围
 * - 禁止在代码中直接使用数字/字符串字面量
 */

module.exports = Object.freeze({
  // ── 行程约束 ──
  TRIP_MIN_DAYS: 1,
  TRIP_MAX_DAYS: 15,
  TRIP_MIN_CARDS_PER_DAY: 1,
  TRIP_MAX_CARDS_PER_DAY: 10,
  TRIP_MAX_TOTAL_CARDS: 150,

  // ── AI ──
  AI_TIMEOUT_MS: 60000, // AI 请求超时（60s）
  AI_MAX_RETRIES: 1, // 最大重试次数
  AI_RETRY_DELAY_MS: 2000, // 重试间隔

  // ── POI ──
  POI_SEARCH_TIMEOUT_MS: 5000, // 高德单次搜索超时（5s）
  POI_ENRICH_CONCURRENCY: 5, // POI 富化并发数
  POI_CACHE_TTL_DAYS: 7, // POI 缓存 TTL
  POI_CACHE_TTL_MS: 7 * 24 * 3600 * 1000,

  // ── 撤销 ──
  MAX_UNDO_STACK: 10, // 最大撤销深度

  // ── 分页 ──
  DEFAULT_PAGE_SIZE: 20,

  // ── UI ──
  LOADING_TEXT_INTERVAL_MS: 1200,
  TOAST_DURATION_MS: 2000,
  DEBOUNCE_DELAY_MS: 300,

  // ── 存储 Key ──
  STORAGE_KEY_USER_INFO: 'tripflow_user_info',
  STORAGE_KEY_DRAFT_TRIP: 'tripflow_draft_trip',
  STORAGE_KEY_LAST_VIEWED: 'tripflow_last_viewed',
});
