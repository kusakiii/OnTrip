/**
 * TripStatus 状态机单元测试
 */

const {
  canTransition,
  transition,
  getAvailableActions,
} = require('../../../miniprogram/domain/StateMachine');
const { TripStatus } = require('../../../miniprogram/domain/enums');

describe('StateMachine — TripStatus', () => {
  describe('合法转换', () => {
    const validTransitions = [
      [TripStatus.DRAFT, TripStatus.GENERATING],
      [TripStatus.GENERATING, TripStatus.GENERATED],
      [TripStatus.GENERATED, TripStatus.ENRICHING],
      [TripStatus.ENRICHING, TripStatus.READY],
      [TripStatus.READY, TripStatus.ARCHIVED],
      [TripStatus.ARCHIVED, TripStatus.READY],
    ];

    test.each(validTransitions)('%s → %s 应合法', (from, to) => {
      expect(canTransition(from, to)).toBe(true);
      expect(() => transition(from, to)).not.toThrow();
    });
  });

  describe('非法转换', () => {
    const invalidTransitions = [
      [TripStatus.DRAFT, TripStatus.READY],
      [TripStatus.GENERATING, TripStatus.READY],
      [TripStatus.GENERATED, TripStatus.DRAFT],
      [TripStatus.ARCHIVED, TripStatus.GENERATING],
      [TripStatus.READY, TripStatus.DRAFT],
    ];

    test.each(invalidTransitions)('%s → %s 应非法', (from, to) => {
      expect(canTransition(from, to)).toBe(false);
      expect(() => transition(from, to)).toThrow(/Illegal transition/);
    });
  });

  describe('any → error', () => {
    // 所有状态（除 error 自身）都可以转入 error
    const allStates = TripStatus.values().filter((s) => s !== TripStatus.ERROR);

    test.each(allStates)('%s → error 应合法', (from) => {
      expect(canTransition(from, TripStatus.ERROR)).toBe(true);
    });
  });

  describe('getAvailableActions', () => {
    test('draft 状态允许生成和生成结束', () => {
      const actions = getAvailableActions(TripStatus.DRAFT);
      expect(actions.length).toBeGreaterThanOrEqual(1);
      expect(actions.some((a) => a.action === 'generate')).toBe(true);
    });

    test('ready 状态允许归档', () => {
      const actions = getAvailableActions(TripStatus.READY);
      expect(actions.some((a) => a.action === 'archive')).toBe(true);
    });

    test('archived 状态允许恢复', () => {
      const actions = getAvailableActions(TripStatus.ARCHIVED);
      expect(actions.some((a) => a.action === 'restore')).toBe(true);
    });
  });
});
