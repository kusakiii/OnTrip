/**
 * AppError — 统一错误类
 *
 * 原则：
 * - 所有异常必须 throw AppError，禁止 throw string
 * - 携带 code（错误码）、severity（严重级别）、recoverable（是否可恢复）
 * - userMessage 面向用户，message 面向开发者
 */

const { ErrorCodes } = require('./ErrorCodes');

class AppError extends Error {
  /**
   * @param {string} code - 错误码，如 'AI001'（见 ErrorCodes）
   * @param {string} message - 开发者日志信息（英文）
   * @param {Object} [details={}] - 附加信息
   * @param {'error'|'warn'|'info'} [details.severity='error']
   * @param {boolean} [details.recoverable=true] - 是否可通过重试恢复
   * @param {string} [details.userMessage] - 用户友好提示
   * @param {*} [details.cause] - 原始错误对象
   */
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = details.severity || 'error';
    this.recoverable = details.recoverable ?? true;
    this.userMessage = details.userMessage || '系统繁忙，请稍后重试';
    this.cause = details.cause || null;
    this.timestamp = new Date().toISOString();

    // 保持正确的 stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * 便捷工厂：AI 超时
   */
  static aiTimeout(message = 'AI response timeout after 60s') {
    return new AppError(ErrorCodes.AI_TIMEOUT, message, {
      severity: 'error',
      recoverable: true,
      userMessage: '生成超时了，请再试一次',
    });
  }

  /**
   * 便捷工厂：AI 返回非法 JSON
   */
  static aiJsonInvalid(rawResponse) {
    return new AppError(ErrorCodes.AI_JSON_INVALID, 'AI returned invalid JSON', {
      severity: 'error',
      recoverable: true,
      cause: rawResponse,
      userMessage: 'AI 返回了无法识别的数据，正在重新生成',
    });
  }

  /**
   * 便捷工厂：网络离线
   */
  static netOffline() {
    return new AppError(ErrorCodes.NET_OFFLINE, 'Network is offline', {
      severity: 'error',
      recoverable: true,
      userMessage: '当前无网络连接，请联网后重试',
    });
  }

  /**
   * 便捷工厂：校验失败
   */
  static validationFailed(field, reason) {
    return new AppError(ErrorCodes.VAL_INVALID_INPUT, `Validation failed: ${field} - ${reason}`, {
      severity: 'warn',
      recoverable: true,
      userMessage: '请输入有效的目的地',
    });
  }

  /**
   * 序列化为日志友好格式
   */
  toLogFormat() {
    return {
      code: this.code,
      severity: this.severity,
      message: this.message,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
    };
  }
}

module.exports = AppError;
