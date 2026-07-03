/**
 * PromptBuilder — 从模板 + 参数构建完整 Prompt
 *
 * 职责：
 * - 加载指定版本的 Prompt 模板
 * - 填充参数（destination, days, styleTags…）
 * - 返回可直接发送给 LLM 的完整 prompt 字符串
 *
 * 原则：
 * - Prompt 模板独立于代码（像代码一样版本管理）
 * - PromptBuilder 只做变量替换，不修改模板逻辑
 */

const logger = require('../../utils/logger');

// ========================
// Prompt 模板注册表
// 每个模板是一个 (params) => string 的函数
// ========================
const TEMPLATES = {
  'trip.generate.v1': require('./templates/trip.generate.v1'),
  'trip.modify.v1': require('./templates/trip.modify.v1'),
};

/**
 * 构建 Prompt
 *
 * @param {string} templateName - 模板名，如 'trip.generate.v1'
 * @param {Object} params - 模板参数
 * @param {string} params.destination - 目的地城市
 * @param {number} params.days - 天数
 * @param {string[]} [params.styleTags=[]] - 风格标签
 * @param {Object} [params.extra] - 额外参数（修改模式用）
 * @returns {string} 可直接发送给 LLM 的 prompt
 */
function build(templateName, params) {
  const template = TEMPLATES[templateName];

  if (!template) {
    throw new Error(
      `Prompt template not found: ${templateName}. Available: ${Object.keys(TEMPLATES).join(', ')}`,
    );
  }

  const prompt = template(params);
  logger.debug('Prompt built', { template: templateName, length: prompt.length });
  return prompt;
}

/**
 * 列出所有可用的模板
 */
function listTemplates() {
  return Object.keys(TEMPLATES);
}

module.exports = { build, listTemplates };
