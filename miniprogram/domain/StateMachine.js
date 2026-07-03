/**
 * TripStatus 状态机 — Architecture v2 §5
 *
 * 合法转换:
 *   draft → generating
 *   draft → generated   (AI 直接返回结果，跳过生成中状态)
 *   generating → generated
 *   generated → enriching
 *   enriching → ready
 *   ready → archived
 *   archived → ready (恢复)
 *   any → error (除 error 自身)
 */

const { TripStatus } = require('./enums');

/**
 * 状态转换表：从 from 状态可以转换到哪些 to 状态
 */
const ALLOWED_TRANSITIONS = Object.freeze({
  [TripStatus.DRAFT]: [TripStatus.GENERATING, TripStatus.GENERATED, TripStatus.ERROR],
  [TripStatus.GENERATING]: [TripStatus.GENERATED, TripStatus.ERROR],
  [TripStatus.GENERATED]: [TripStatus.ENRICHING, TripStatus.ERROR],
  [TripStatus.ENRICHING]: [TripStatus.READY, TripStatus.ERROR],
  [TripStatus.READY]: [TripStatus.ARCHIVED, TripStatus.ERROR],
  [TripStatus.ARCHIVED]: [TripStatus.READY, TripStatus.ERROR],
  [TripStatus.ERROR]: [TripStatus.DRAFT, TripStatus.GENERATED],
});

/**
 * 校验状态转换是否合法
 *
 * @param {string} from - 当前状态
 * @param {string} to - 目标状态
 * @returns {boolean}
 */
function canTransition(from, to) {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed) {
    return false;
  }
  return allowed.includes(to);
}

/**
 * 执行状态转换
 *
 * @param {string} from - 当前状态
 * @param {string} to - 目标状态
 * @throws {Error} 非法状态转换时抛出
 * @returns {string} 新状态
 */
function transition(from, to) {
  if (!canTransition(from, to)) {
    throw new Error(`[StateMachine] Illegal transition: ${from} → ${to}`);
  }
  return to;
}

/**
 * 获取当前状态下允许的下一步操作（面向 UI 的辅助方法）
 *
 * @param {string} status - 当前状态
 * @returns {Array<{action: string, target: string, label: string}>}
 */
function getAvailableActions(status) {
  const allowed = ALLOWED_TRANSITIONS[status] || [];
  return allowed.map((target) => {
    switch (target) {
      case TripStatus.GENERATING:
        return { action: 'generate', target, label: '生成行程' };
      case TripStatus.ENRICHING:
        return { action: 'enrich', target, label: '获取POI信息' };
      case TripStatus.ARCHIVED:
        return { action: 'archive', target, label: '归档' };
      case TripStatus.READY:
        return { action: 'restore', target, label: '恢复编辑' };
      case TripStatus.ERROR:
        return { action: 'error', target, label: '出错了' };
      default:
        return { action: target, target, label: target };
    }
  });
}

module.exports = {
  canTransition,
  transition,
  getAvailableActions,
  ALLOWED_TRANSITIONS,
};
