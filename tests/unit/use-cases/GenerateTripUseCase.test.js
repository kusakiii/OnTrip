/**
 * GenerateTripUseCase 单元测试
 *
 * 测试策略：
 * - Mock wx.cloud.callFunction（不调真实 AI）
 * - Mock TripRepository（不写真实数据库）
 * - 验证输入校验、状态转换、错误处理
 */

// Mock 必须在 import 之前
jest.mock('../../../miniprogram/repositories/TripRepository', () => ({
  save: jest.fn().mockResolvedValue(undefined),
  findById: jest.fn().mockResolvedValue(null),
}));

// Mock wx 全局对象
global.wx = {
  cloud: {
    callFunction: jest.fn(),
  },
};

const { execute } = require('../../../miniprogram/use-cases/GenerateTripUseCase');
const TripRepository = require('../../../miniprogram/repositories/TripRepository');
const { TripStatus } = require('../../../miniprogram/domain/enums');

// Mock AI 返回的合法 itinerary JSON
const MOCK_AI_ITINERARY = [
  {
    dayIndex: 1,
    cards: [
      {
        type: 'spot',
        name: '西湖风景名胜区-断桥残雪',
        searchName: '断桥残雪',
        amapCategory: '风景名胜',
        timeRange: '09:00-11:00',
        duration: 120,
        description: '西湖十景之一',
        ticketPrice: '免费',
        transportFromPrevious: null,
        rating: 4.6,
      },
      {
        type: 'food',
        name: '知味观·味庄(杨公堤店)',
        searchName: '知味观·味庄',
        amapCategory: '餐饮',
        timeRange: '11:30-13:00',
        duration: 90,
        description: '杭帮菜代表',
        ticketPrice: '¥120/人',
        transportFromPrevious: { method: '步行', duration: 15, distance: '1.2km' },
        rating: 4.5,
      },
    ],
  },
  {
    dayIndex: 2,
    cards: [
      {
        type: 'spot',
        name: '灵隐寺',
        searchName: '灵隐寺',
        amapCategory: '风景名胜',
        timeRange: '09:00-11:00',
        duration: 120,
        description: '千年古刹',
        ticketPrice: '¥75',
        transportFromPrevious: null,
        rating: 4.7,
      },
    ],
  },
];

function mockCloudSuccess() {
  wx.cloud.callFunction.mockImplementationOnce(({ success }) => {
    success({
      result: {
        ok: true,
        trip: { itinerary: MOCK_AI_ITINERARY },
      },
    });
  });
}

function mockCloudFailure(errorCode, message) {
  wx.cloud.callFunction.mockImplementationOnce(({ success }) => {
    success({
      result: { ok: false, error: errorCode, message },
    });
  });
}

describe('GenerateTripUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════
  //  AC-01: 正常输入 → 返回完整 Trip
  // ═══════════════════════════════════
  describe('AC-01: 正常生成行程', () => {
    test('输入杭州 2天 美食 → 返回 Trip 对象', async () => {
      mockCloudSuccess();

      const trip = await execute({
        destination: '杭州',
        days: 2,
        styleTags: ['food'],
      });

      // 基础信息
      expect(trip.tripId).toMatch(/^trip_/);
      expect(trip.destination.city).toBe('杭州');
      expect(trip.days).toBe(2);

      // 状态应为 generated
      expect(trip.status).toBe(TripStatus.GENERATED);

      // itinerary 应有 2 天
      expect(trip.itinerary).toHaveLength(2);
      expect(trip.itinerary[0].cards).toHaveLength(2);
      expect(trip.itinerary[1].cards).toHaveLength(1);

      // Repository 应被调用保存（仅 1 次 — pipeline 创建 Trip 后持久化）
      expect(TripRepository.save).toHaveBeenCalledTimes(1);
    });

    test('输入成都 1天 无风格 → 返回 Trip', async () => {
      const singleDayItinerary = [
        {
          dayIndex: 1,
          cards: [
            {
              type: 'spot',
              name: '大熊猫基地',
              searchName: '大熊猫基地',
              timeRange: '08:00-11:00',
              duration: 180,
              description: '看熊猫',
              transportFromPrevious: null,
              rating: 4.7,
            },
          ],
        },
      ];

      wx.cloud.callFunction.mockImplementationOnce(({ success }) => {
        success({ result: { ok: true, trip: { itinerary: singleDayItinerary } } });
      });

      const trip = await execute({
        destination: '成都',
        days: 1,
        styleTags: [],
      });

      expect(trip.destination.city).toBe('成都');
      expect(trip.days).toBe(1);
      expect(trip.itinerary).toHaveLength(1);
      expect(trip.status).toBe(TripStatus.GENERATED);
    });
  });

  // ═══════════════════════════════════
  //  AC-02: 无效输入 → 抛出校验错误
  // ═══════════════════════════════════
  describe('AC-02: 输入校验', () => {
    test('空目的地 → 抛 VAL_INVALID_INPUT', async () => {
      await expect(execute({ destination: '', days: 3 })).rejects.toThrow();
      await expect(execute({ destination: '', days: 3 })).rejects.toMatchObject({
        code: 'VAL001',
      });
    });

    test('目的地为非字符串 → 抛错', async () => {
      await expect(execute({ destination: null, days: 3 })).rejects.toThrow();
    });

    test('天数为 0 → 抛 VAL_INVALID_INPUT', async () => {
      await expect(execute({ destination: '杭州', days: 0 })).rejects.toThrow();
    });

    test('天数超过 15 → 抛 VAL_INVALID_INPUT', async () => {
      await expect(execute({ destination: '杭州', days: 20 })).rejects.toThrow();
    });

    test('天数不是数字 → 抛错', async () => {
      await expect(execute({ destination: '杭州', days: 'abc' })).rejects.toThrow();
    });
  });

  // ═══════════════════════════════════
  //  AC-03: 云函数失败 → 抛出 AI 错误
  // ═══════════════════════════════════
  describe('AC-03: AI 生成失败', () => {
    test('云函数返回 error → 抛 AppError', async () => {
      mockCloudFailure('AI001', 'AI 超时');

      await expect(execute({ destination: '杭州', days: 3 })).rejects.toThrow();
    });

    test('云函数网络异常 → 抛 NET 错误', async () => {
      wx.cloud.callFunction.mockImplementationOnce(({ fail }) => {
        fail({ errMsg: 'cloud function timeout' });
      });

      await expect(execute({ destination: '杭州', days: 3 })).rejects.toMatchObject({
        code: 'NET002',
      });
    });
  });

  // ═══════════════════════════════════
  //  AC-04: 边界值测试
  // ═══════════════════════════════════
  describe('AC-04: 边界值', () => {
    test('最小天数 1 → 正常生成', async () => {
      mockCloudSuccess();
      const trip = await execute({ destination: '杭州', days: 1 });
      expect(trip.days).toBe(1);
    });

    test('最大天数 15 → 正常生成', async () => {
      mockCloudSuccess();
      const trip = await execute({ destination: '杭州', days: 15 });
      expect(trip.days).toBe(15);
    });

    test('所有风格标签 → 正常传递', async () => {
      mockCloudSuccess();
      const trip = await execute({
        destination: '杭州',
        days: 3,
        styleTags: ['food', 'art', 'nature'],
      });
      expect(trip.styleTags).toEqual(['food', 'art', 'nature']);
    });
  });
});
