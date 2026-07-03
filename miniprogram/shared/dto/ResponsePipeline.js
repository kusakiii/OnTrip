/**
 * AI Response Pipeline — Architecture v2 §3.3 完整管线
 *
 * 流程：
 *   ① JSON.parse() ─── 失败 → 重试1次 → 仍失败 → 降级模板
 *   ② DTO 校验 ────── 失败 → 自动修复
 *   ③ Business 校验 ─── 失败 → 标记警告
 *   ④ Domain Mapper ─── 原始 JSON → Trip 领域对象
 *   ⑤ 返回给 UseCase
 */

const { validate: dtoValidate } = require('./DTOValidator');
const { validate: businessValidate } = require('./BusinessValidator');
const { createTrip, fillItinerary, AppError } = require('../../domain');

/**
 * 管线处理结果
 * @typedef {Object} PipelineResult
 * @property {boolean} success
 * @property {Object|null} trip - 处理成功时的 Trip 对象
 * @property {Array} errors - 错误列表
 * @property {Array} warnings - 警告列表
 * @property {boolean} degraded - 是否使用了降级策略
 */

/**
 * 运行完整的 AI 响应处理管线
 *
 * @param {string} rawResponse - AI 返回的原始文本
 * @param {Object} params - 请求参数
 * @param {string} params.destination - 目的地城市
 * @param {number} params.days - 天数
 * @param {Array} [params.styleTags] - 风格标签
 * @returns {Promise<PipelineResult>}
 */
async function processResponse(rawResponse, params) {
  const { destination, days, styleTags = [] } = params;
  const warnings = [];

  // ─── 步骤①：JSON 解析 ───
  let parsed;
  try {
    parsed = parseJSON(rawResponse);
  } catch (parseErr) {
    // JSON 解析失败 → 不可恢复，直接报错
    throw AppError.aiJsonInvalid(rawResponse);
  }

  // ─── 步骤②：DTO Schema 校验 + 自动修复 ───
  const dtoResult = dtoValidate(parsed);
  if (!dtoResult.valid) {
    // 记录所有修复操作
    dtoResult.errors.forEach((err) => {
      warnings.push({ type: 'schema_fix', ...err });
    });
  }

  const repairedData = dtoResult.data;

  // ─── 步骤③：业务规则校验 ───
  const businessResult = businessValidate(repairedData, destination);
  businessResult.issues.forEach((issue) => {
    if (issue.severity === 'error') {
      warnings.push({ type: 'business_error', ...issue });
    } else {
      warnings.push({ type: 'business_warn', ...issue });
    }
  });

  // ─── 步骤④：Domain Model Mapper ───
  const trip = mapToDomain(repairedData, { destination, days, styleTags });

  // ─── 步骤⑤：返回结果 ───
  return {
    success: true,
    trip,
    errors: [],
    warnings,
    degraded:
      dtoResult.errors.length > 0 || businessResult.issues.some((i) => i.severity === 'error'),
  };
}

/**
 * 从 AI 文本中提取 JSON（兼容 markdown code block 包裹）
 */
function parseJSON(raw) {
  // 去掉可能的 markdown ```json ... ``` 包裹
  let text = raw.trim();

  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`JSON parse failed: ${err.message}`);
  }
}

/**
 * 将 AI 返回的原始数据映射为 Domain Trip 对象
 */
function mapToDomain(data, params) {
  const { destination, days, styleTags } = params;

  // 创建空白 Trip
  let trip = createTrip({
    city: destination,
    days,
    styleTags,
  });

  // 填入 AI 生成的 itinerary
  trip = fillItinerary(trip, data.itinerary);

  return trip;
}

module.exports = { processResponse, parseJSON };
