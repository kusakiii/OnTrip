/**
 * 结构化日志 — 生产环境禁止 console.log
 *
 * 原则：
 * - debug: 开发调试（生产环境不输出）
 * - info: 关键业务流程节点
 * - warn: 可恢复异常
 * - error: 不可恢复异常
 *
 * 格式：`[TripFlow] [LEVEL] message { context }`
 */

const IS_DEV =
  typeof wx !== 'undefined' && wx.getSystemInfoSync
    ? wx.getSystemInfoSync().platform === 'devtools'
    : process.env.NODE_ENV !== 'production';

function formatMessage(level, message, context) {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[TripFlow] [${level}] [${timestamp}] ${message}${contextStr}`;
}

const logger = {
  debug(message, context) {
    if (IS_DEV) {
      console.log(formatMessage('DEBUG', message, context));
    }
  },

  info(message, context) {
    console.log(formatMessage('INFO', message, context));
  },

  warn(message, context) {
    console.warn(formatMessage('WARN', message, context));
  },

  error(message, context) {
    console.error(formatMessage('ERROR', message, context));
  },
};

module.exports = logger;
