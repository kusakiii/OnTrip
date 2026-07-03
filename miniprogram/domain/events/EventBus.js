/**
 * EventBus — 领域事件总线（轻量发布/订阅）
 *
 * 原则：
 * - 异步执行，单个 handler 失败不影响其他 handler
 * - 不使用 EventEmitter（小程序环境可能不支持）
 * - 事件名使用 PascalCase（与 Architecture v2 保持一致）
 */

/** @type {Record<string, Array<Function>>} */
const handlers = {};

/**
 * 注册事件监听
 *
 * @param {string} event - 事件名（如 'TripGenerated'）
 * @param {Function} handler - 处理函数 (payload) => void
 * @returns {Function} 取消订阅函数
 */
function on(event, handler) {
  if (!handlers[event]) {
    handlers[event] = [];
  }
  handlers[event].push(handler);

  // 返回取消订阅函数
  return () => {
    const idx = handlers[event].indexOf(handler);
    if (idx !== -1) {
      handlers[event].splice(idx, 1);
    }
  };
}

/**
 * 触发事件（异步，fire-and-forget）
 *
 * @param {string} event - 事件名
 * @param {*} payload - 事件载荷
 * @returns {Promise<void>}
 */
async function emit(event, payload) {
  const subs = handlers[event];
  if (!subs || subs.length === 0) {
    return;
  }

  // 异步执行，单个 handler 失败不影响其他
  const results = await Promise.allSettled(
    subs.map((handler) => {
      try {
        return handler(payload);
      } catch (err) {
        console.warn(`[EventBus] Handler for "${event}" threw synchronously:`, err);
        return Promise.reject(err);
      }
    }),
  );

  // 记录失败（不抛出，fire-and-forget 语义）
  results.forEach((result, idx) => {
    if (result.status === 'rejected') {
      console.warn(`[EventBus] Handler #${idx} for "${event}" failed:`, result.reason);
    }
  });
}

/**
 * 移除所有监听器（用于测试清理）
 */
function clear() {
  Object.keys(handlers).forEach((key) => {
    delete handlers[key];
  });
}

/**
 * 获取当前注册的事件列表（用于调试）
 */
function listEvents() {
  return Object.keys(handlers);
}

module.exports = { on, emit, clear, listEvents };
