/**
 * LLMClient — AI 模型调用抽象层
 *
 * 职责：
 * - 统一封装 DeepSeek / Qwen / Claude 等模型调用
 * - 超时控制 + 重试 + fallback
 * - 不关心 Prompt 内容（Prompt 由 PromptBuilder 构建）
 * - 不关心 Response 解析（Response 由 ResponsePipeline 处理）
 *
 * 原则：
 * - 单一职责：只负责"发请求、收文本"
 * - 对 UseCase 隐藏具体模型和 API 细节
 */

const { AppError, ErrorCodes } = require('../../../domain');
const logger = require('../../../utils/logger');
const { AI_TIMEOUT_MS, AI_MAX_RETRIES, AI_RETRY_DELAY_MS } = require('../../../utils/constants');

// ========================
// 模型配置
// ========================
const MODELS = Object.freeze({
  DEEPSEEK: 'deepseek-chat',
  QWEN: 'qwen-plus',
});

const DEFAULT_MODEL = MODELS.DEEPSEEK;

const FALLBACK_CHAIN = [MODELS.DEEPSEEK, MODELS.QWEN];

// ========================
// LLMClient
// ========================
const LLMClient = {
  /**
   * 发送聊天请求（文本进，文本出）
   *
   * @param {string} prompt - 完整 prompt 文本
   * @param {Object} [options]
   * @param {string} [options.model] - 模型名，默认 deepseek-chat
   * @param {number} [options.temperature=0.7]
   * @param {number} [options.maxTokens=4096]
   * @param {number} [options.timeout=AI_TIMEOUT_MS]
   * @param {number} [options.retries=AI_MAX_RETRIES]
   * @returns {Promise<{content: string, model: string, usage: {promptTokens: number, completionTokens: number}}>}
   */
  async chat(prompt, options = {}) {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 4096,
      timeout = AI_TIMEOUT_MS,
      retries = AI_MAX_RETRIES,
    } = options;

    const startTime = Date.now();

    // 尝试主模型
    try {
      const result = await this._callWithRetry(prompt, {
        model,
        temperature,
        maxTokens,
        timeout,
        retries,
      });
      logger.info('LLM call succeeded', {
        model: result.model,
        duration: Date.now() - startTime,
        tokens: result.usage.completionTokens,
      });
      return result;
    } catch (err) {
      // 主模型失败，尝试 fallback 链
      logger.warn(`LLM primary model ${model} failed, trying fallback`, {
        error: err.message,
      });

      for (const fallbackModel of FALLBACK_CHAIN) {
        if (fallbackModel === model) {
          continue;
        }
        try {
          const result = await this._callWithRetry(prompt, {
            model: fallbackModel,
            temperature,
            maxTokens,
            timeout,
            retries: 0,
          });
          logger.info('LLM fallback succeeded', { model: result.model });
          return result;
        } catch (fallbackErr) {
          logger.warn(`LLM fallback ${fallbackModel} also failed`, {
            error: fallbackErr.message,
          });
        }
      }

      // 所有模型都失败
      throw new AppError(
        ErrorCodes.AI_TIMEOUT,
        `All LLM models failed. Last error: ${err.message}`,
        {
          severity: 'error',
          recoverable: true,
          userMessage: 'AI 服务暂时不可用，请稍后再试',
        },
      );
    }
  },

  /**
   * 带重试的单次调用
   */
  async _callWithRetry(prompt, { model, temperature, maxTokens, timeout, retries }) {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this._singleCall(prompt, { model, temperature, maxTokens, timeout });
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          logger.warn(`LLM retry ${attempt + 1}/${retries} for ${model}`);
          await this._sleep(AI_RETRY_DELAY_MS);
        }
      }
    }

    throw lastError;
  },

  /**
   * 单次 HTTP 调用（云函数环境执行）
   *
   * 在小程序端，此方法会通过 wx.cloud.callFunction 间接调用；
   * 在云函数端，此方法直接 fetch DeepSeek/Qwen API。
   */
  async _singleCall(prompt, { model, temperature, maxTokens, timeout }) {
    // 检测运行环境
    if (typeof wx !== 'undefined' && wx.cloud) {
      // 小程序端 → 通过云函数中转
      return this._callViaCloudFunction(prompt, { model, temperature, maxTokens });
    }

    // 云函数端 → 直接调用 API
    return this._callDirectAPI(prompt, { model, temperature, maxTokens, timeout });
  },

  /**
   * 小程序端：通过云函数中转
   */
  async _callViaCloudFunction(prompt, { model, temperature, maxTokens }) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'ai-chat',
        data: {
          action: 'chat',
          prompt,
          model,
          temperature,
          maxTokens,
        },
        success: (res) => {
          if (res.result?.error) {
            reject(new Error(res.result.error));
          } else {
            resolve(res.result);
          }
        },
        fail: (err) => reject(new Error(err.errMsg || 'Cloud function call failed')),
      });
    });
  },

  /**
   * 云函数端：直接调用 DeepSeek / Qwen API
   */
  async _callDirectAPI(prompt, { model, temperature, maxTokens, timeout }) {
    const apiUrl = getAPIUrl(model);
    const apiKey = getAPIKey(model);

    if (!apiKey) {
      throw new AppError(ErrorCodes.SYS_UNKNOWN, `No API key configured for model: ${model}`, {
        severity: 'error',
        recoverable: false,
        userMessage: 'AI 服务配置异常',
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
      }

      const data = await response.json();

      return {
        content: data.choices?.[0]?.message?.content || '',
        model: data.model || model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
        },
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new AppError(ErrorCodes.AI_TIMEOUT, `LLM timeout after ${timeout}ms`, {
          severity: 'error',
          recoverable: true,
          userMessage: 'AI 响应超时，请重试',
        });
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  },

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};

// ========================
// 私有辅助
// ========================

function getAPIUrl(model) {
  if (model.includes('deepseek')) {
    return 'https://api.deepseek.com/v1/chat/completions';
  }
  if (model.includes('qwen')) {
    return 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  }
  throw new Error(`Unknown model: ${model}`);
}

function getAPIKey(model) {
  if (model.includes('deepseek')) {
    return process.env.DEEPSEEK_API_KEY || '';
  }
  if (model.includes('qwen')) {
    return process.env.QWEN_API_KEY || '';
  }
  return '';
}

module.exports = { LLMClient, MODELS };
