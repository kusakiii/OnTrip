/**
 * 错误码体系 — Architecture v2 §7
 *
 * 格式：{DOMAIN}{NNN}
 * - AI: AI 相关错误 (AI001-AI099)
 * - MAP: 地图相关错误 (MAP001-MAP099)
 * - DB: 数据库相关错误 (DB001-DB099)
 * - NET: 网络相关错误 (NET001-NET099)
 * - VAL: 校验相关错误 (VAL001-VAL099)
 * - SYS: 系统通用错误 (SYS001-SYS099)
 */

const ErrorCodes = Object.freeze({
  // ── AI 错误 ──
  AI_TIMEOUT: 'AI001',
  AI_JSON_INVALID: 'AI002',
  AI_SCHEMA_MISMATCH: 'AI003',
  AI_HALLUCINATION: 'AI004',
  AI_EMPTY_RESPONSE: 'AI005',
  AI_RATE_LIMITED: 'AI006',

  // ── 地图错误 ──
  POI_NOT_FOUND: 'MAP001',
  POI_API_TIMEOUT: 'MAP002',
  POI_API_ERROR: 'MAP003',
  GEO_OUT_OF_RANGE: 'MAP004',
  PHOTO_LOAD_FAILED: 'MAP005',

  // ── 数据库错误 ──
  DB_SAVE_FAILED: 'DB001',
  DB_READ_FAILED: 'DB002',
  DB_CONFLICT: 'DB003',
  DB_QUOTA_EXCEEDED: 'DB004',

  // ── 网络错误 ──
  NET_OFFLINE: 'NET001',
  NET_TIMEOUT: 'NET002',
  NET_RETRY_EXHAUSTED: 'NET003',

  // ── 校验错误 ──
  VAL_INVALID_INPUT: 'VAL001',
  VAL_FIELD_MISSING: 'VAL002',
  VAL_TYPE_MISMATCH: 'VAL003',

  // ── 系统错误 ──
  SYS_COLD_START: 'SYS001',
  SYS_UNKNOWN: 'SYS002',
});

/**
 * 错误码 → 用户友好提示映射
 */
const UserMessages = Object.freeze({
  [ErrorCodes.AI_TIMEOUT]: '生成超时了，请再试一次',
  [ErrorCodes.AI_JSON_INVALID]: 'AI 返回了无法识别的数据，正在重新生成',
  [ErrorCodes.AI_SCHEMA_MISMATCH]: '行程数据格式异常，正在自动修复',
  [ErrorCodes.AI_HALLUCINATION]: '部分地点未能在地图上找到',
  [ErrorCodes.AI_EMPTY_RESPONSE]: 'AI 暂时没有响应，请再试一次',
  [ErrorCodes.AI_RATE_LIMITED]: '请求过于频繁，请稍后再试',
  [ErrorCodes.POI_NOT_FOUND]: '部分地点信息暂未收录',
  [ErrorCodes.POI_API_TIMEOUT]: '地图服务繁忙，正在重试',
  [ErrorCodes.POI_API_ERROR]: '地图服务异常，请稍后查看',
  [ErrorCodes.GEO_OUT_OF_RANGE]: '坐标超出城市范围，已用默认位置替代',
  [ErrorCodes.PHOTO_LOAD_FAILED]: '部分照片加载失败',
  [ErrorCodes.DB_SAVE_FAILED]: '保存失败，请检查网络后重试',
  [ErrorCodes.DB_READ_FAILED]: '加载失败，请下拉刷新',
  [ErrorCodes.DB_CONFLICT]: '数据已被更新，请刷新后重试',
  [ErrorCodes.DB_QUOTA_EXCEEDED]: '存储空间不足，请清理历史行程',
  [ErrorCodes.NET_OFFLINE]: '当前无网络连接，请联网后重试',
  [ErrorCodes.NET_TIMEOUT]: '网络超时，请检查网络后重试',
  [ErrorCodes.NET_RETRY_EXHAUSTED]: '网络连接失败，请稍后重试',
  [ErrorCodes.VAL_INVALID_INPUT]: '请输入有效的目的地',
  [ErrorCodes.VAL_FIELD_MISSING]: '信息填写不完整，请补充后重试',
  [ErrorCodes.VAL_TYPE_MISMATCH]: '输入格式不正确，请重新输入',
  [ErrorCodes.SYS_COLD_START]: '服务正在启动，请稍候',
  [ErrorCodes.SYS_UNKNOWN]: '系统繁忙，请稍后重试',
});

module.exports = { ErrorCodes, UserMessages };
