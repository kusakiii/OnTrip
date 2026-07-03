/**
 * Business Validator — 业务规则校验（Schema 校验之后）
 *
 * Architecture v2 §3.3 步骤③：
 * - 每天至少 1 张卡片
 * - 时间不重叠
 * - 坐标在目的地城市范围内（可选）
 *
 * 与 Schema 校验的区别：
 * - Schema 校验：字段存在 + 类型正确
 * - Business 校验：字段含义是否合理
 */

/**
 * 业务校验结果
 * @typedef {Object} BusinessCheckResult
 * @property {boolean} valid
 * @property {Array<{path:string, message:string, severity:'error'|'warn'}>} issues
 */

/**
 * 执行全部业务规则校验
 *
 * @param {Object} data - DTO 校验后的行程数据
 * @param {string} destination - 目的地城市（用于坐标校验）
 * @returns {BusinessCheckResult}
 */
function validate(data, _destination) {
  const issues = [];

  checkMinCardsPerDay(data, issues);
  checkTimeNonOverlap(data, issues);
  checkAtLeastOneMeal(data, issues);
  checkFirstCardNoTransport(data, issues);

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

/**
 * 规则①：每天至少 1 张卡片
 */
function checkMinCardsPerDay(data, issues) {
  const itinerary = data.itinerary || [];
  itinerary.forEach((day, idx) => {
    if (!day.cards || day.cards.length === 0) {
      issues.push({
        path: `$.itinerary[${idx}]`,
        message: `Day ${day.dayIndex || idx + 1} has no cards`,
        severity: 'error',
      });
    }
  });
}

/**
 * 规则②：同一天内卡片时间不重叠
 */
function checkTimeNonOverlap(data, issues) {
  const itinerary = data.itinerary || [];
  itinerary.forEach((day, idx) => {
    if (!day.cards || day.cards.length < 2) {
      return;
    }

    const intervals = day.cards.map((card) => {
      const times = (card.timeRange || '00:00-00:00').split('-');
      return {
        cardId: card.cardId || 'unknown',
        start: parseTimeToMinutes(times[0]),
        end: parseTimeToMinutes(times[1]),
      };
    });

    for (let i = 0; i < intervals.length - 1; i++) {
      if (intervals[i].end > intervals[i + 1].start) {
        issues.push({
          path: `$.itinerary[${idx}].cards`,
          message: `Time overlap between card #${i + 1} and card #${i + 2} in Day ${day.dayIndex || idx + 1}`,
          severity: 'warn',
        });
      }
    }
  });
}

/**
 * 规则③：每天至少包含一餐（food 类型卡片）
 * 这是 warn 级别，不阻塞
 */
function checkAtLeastOneMeal(data, issues) {
  const itinerary = data.itinerary || [];
  itinerary.forEach((day, idx) => {
    const hasMeal = (day.cards || []).some((c) => c.type === 'food');
    if (!hasMeal) {
      issues.push({
        path: `$.itinerary[${idx}]`,
        message: `Day ${day.dayIndex || idx + 1} has no meal (food type) card`,
        severity: 'warn',
      });
    }
  });
}

/**
 * 规则④：每天首张卡片不应有 transportFromPrevious
 */
function checkFirstCardNoTransport(data, issues) {
  const itinerary = data.itinerary || [];
  itinerary.forEach((day, idx) => {
    const cards = day.cards || [];
    if (cards.length > 0 && cards[0].transportFromPrevious) {
      issues.push({
        path: `$.itinerary[${idx}].cards[0]`,
        message: `First card of Day ${day.dayIndex || idx + 1} should not have transportFromPrevious`,
        severity: 'warn',
      });
      // 自动修复：移除首张卡片的交通信息
      cards[0].transportFromPrevious = null;
    }
  });
}

/**
 * "HH:MM" → 分钟数
 */
function parseTimeToMinutes(timeStr) {
  const parts = (timeStr || '00:00').split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

module.exports = { validate };
