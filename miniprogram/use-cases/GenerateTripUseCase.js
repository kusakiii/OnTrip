/**
 * GenerateTripUseCase — 行程生成
 *
 * 职责：
 * - 校验用户输入（目的地、天数、风格标签）
 * - 创建 Trip 聚合根（draft → generating）
 * - 调用云函数 generate-trip
 * - 通过 ResponsePipeline 处理 AI 输出
 * - 保存 Trip 并返回
 *
 * 原则：
 * - 页面不直接调用 AI
 * - 页面不直接操作 Repository
 * - 所有 AI 输出必须经过 DTO 校验
 */

const { changeStatus, AppError, ErrorCodes, TripStatus, EventBus } = require('../domain');
const { processResponse } = require('../shared/dto/ResponsePipeline');
const TripRepository = require('../repositories/TripRepository');
const logger = require('../utils/logger');
const { TRIP_MIN_DAYS, TRIP_MAX_DAYS } = require('../utils/constants');

/**
 * 执行行程生成
 *
 * @param {Object} input
 * @param {string} input.destination - 目的地城市
 * @param {number} input.days - 天数 (1-15)
 * @param {string[]} [input.styleTags=[]] - 风格标签
 * @returns {Promise<Object>} 生成的 Trip 聚合根
 */
async function execute({ destination, days, styleTags = [] }) {
  // ── ① 输入校验 ──
  validateInput({ destination, days, styleTags });

  logger.info('GenerateTripUseCase started', { destination, days, styleTags });

  // ── ② 调用云函数生成 ──
  const rawResult = await callGenerateCloudFunction({ destination, days, styleTags });

  if (!rawResult.ok) {
    throw new AppError(
      rawResult.error || ErrorCodes.AI_TIMEOUT,
      rawResult.message || 'AI generation failed',
      { severity: 'error', recoverable: true, userMessage: '行程生成失败，请重试' },
    );
  }

  // ── ③ ResponsePipeline：AI JSON → 校验 → 修复 → Domain Trip ──
  // pipeline 负责创建 Trip（单一来源），不预先创建 draft
  const pipelineResult = await processResponse(
    JSON.stringify({ itinerary: rawResult.trip.itinerary }),
    { destination, days, styleTags },
  );

  if (!pipelineResult.success) {
    throw new AppError(ErrorCodes.AI_SCHEMA_MISMATCH, 'Response pipeline failed', {
      severity: 'error',
      recoverable: false,
      cause: pipelineResult.errors,
    });
  }

  // ── ④ 状态转换 ──
  const trip = changeStatus(pipelineResult.trip, TripStatus.GENERATED);

  // ── ⑤ 持久化 ──
  await TripRepository.save(trip);

  // ── ⑥ 发布领域事件 ──
  EventBus.emit('TripGenerated', trip);

  logger.info('GenerateTripUseCase completed', {
    tripId: trip.tripId,
    days: trip.itinerary.length,
    cards: getCardCount(trip),
    warnings: pipelineResult.warnings.length,
  });

  return trip;
}

// ========================
// 私有函数
// ========================

function validateInput({ destination, days }) {
  if (!destination || typeof destination !== 'string' || !destination.trim()) {
    throw AppError.validationFailed('destination', '目的地不能为空');
  }
  if (!days || typeof days !== 'number' || days < TRIP_MIN_DAYS || days > TRIP_MAX_DAYS) {
    throw AppError.validationFailed('days', `天数必须在 ${TRIP_MIN_DAYS}-${TRIP_MAX_DAYS} 之间`);
  }
}

/**
 * 调用云函数生成行程
 *
 * 抽取为独立函数，方便测试 mock。
 */
async function callGenerateCloudFunction({ destination, days, styleTags }) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'generate-trip',
      data: { destination: destination.trim(), days, styleTags },
      success: (res) => resolve(res.result || {}),
      fail: (err) =>
        reject(
          new AppError(ErrorCodes.NET_TIMEOUT, 'Cloud function call failed', {
            severity: 'error',
            recoverable: true,
            cause: err,
            userMessage: '网络异常，请检查网络后重试',
          }),
        ),
    });
  });
}

function getCardCount(trip) {
  return trip.itinerary.reduce((sum, day) => sum + day.cards.length, 0);
}

module.exports = { execute };
