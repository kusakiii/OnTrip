/**
 * Trip 聚合根单元测试
 *
 * 覆盖：
 * - 创建空白行程
 * - 填入 AI 生成的 itinerary
 * - 状态转换
 * - 替换/删除卡片
 * - 边界条件：最少/最多天数、无卡片日等
 */

const {
  createTrip,
  fillItinerary,
  changeStatus,
  replaceDayCards,
  deleteCard,
  getTotalCardCount,
  getDayCards,
} = require('../../../miniprogram/domain/entities/Trip');
const { TripStatus } = require('../../../miniprogram/domain/enums');

// Mock 数据：AI 返回的 2 日杭州行程
const MOCK_RAW_ITINERARY = [
  {
    dayIndex: 1,
    cards: [
      {
        cardId: 'c1',
        type: 'spot',
        name: '西湖断桥残雪',
        searchName: '断桥残雪',
        timeRange: '09:00-11:00',
        duration: 120,
        description: '西湖十景之一',
        transportFromPrevious: null,
      },
      {
        cardId: 'c2',
        type: 'food',
        name: '知味观·味庄(杨公堤店)',
        searchName: '知味观·味庄',
        timeRange: '11:30-13:00',
        duration: 90,
        description: '杭帮菜',
        transportFromPrevious: { method: '步行', duration: 15, distance: '1.2km' },
      },
    ],
  },
  {
    dayIndex: 2,
    cards: [
      {
        cardId: 'c3',
        type: 'spot',
        name: '灵隐寺',
        searchName: '灵隐寺',
        timeRange: '09:00-11:00',
        duration: 120,
        description: '千年古刹',
        transportFromPrevious: null,
      },
      {
        cardId: 'c4',
        type: 'food',
        name: '楼外楼(孤山店)',
        searchName: '楼外楼',
        timeRange: '12:00-13:30',
        duration: 90,
        description: '西湖名店',
        transportFromPrevious: { method: '打车', duration: 25, distance: '8km' },
      },
    ],
  },
];

describe('Trip 聚合根', () => {
  describe('createTrip', () => {
    test('应创建空白行程（draft 状态）', () => {
      const trip = createTrip({
        city: '杭州',
        days: 3,
        styleTags: [{ id: 'food', label: '美食' }],
      });

      expect(trip.tripId).toMatch(/^trip_/);
      expect(trip.destination.city).toBe('杭州');
      expect(trip.days).toBe(3);
      expect(trip.status).toBe(TripStatus.DRAFT);
      expect(trip.itinerary).toEqual([]);
      expect(trip.version).toBe(1);
      expect(trip.editCount).toBe(0);
    });

    test('应拒绝空城市名', () => {
      expect(() => createTrip({ city: '', days: 3 })).toThrow(TypeError);
    });

    test('应拒绝超出范围的天数', () => {
      expect(() => createTrip({ city: '杭州', days: 0 })).toThrow(TypeError);
      expect(() => createTrip({ city: '杭州', days: 16 })).toThrow(TypeError);
    });

    test('应接受边界值天数', () => {
      expect(() => createTrip({ city: '杭州', days: 1 })).not.toThrow();
      expect(() => createTrip({ city: '杭州', days: 15 })).not.toThrow();
    });
  });

  describe('fillItinerary', () => {
    test('应用 AI 数据填充行程', () => {
      const trip = createTrip({ city: '杭州', days: 2 });
      const filled = fillItinerary(trip, MOCK_RAW_ITINERARY);

      expect(filled.itinerary).toHaveLength(2);
      expect(filled.itinerary[0].cards).toHaveLength(2);
      expect(filled.itinerary[1].cards).toHaveLength(2);
      expect(filled.status).toBe(TripStatus.GENERATED);
      expect(filled.version).toBe(2);
      expect(filled.editCount).toBe(1);
    });

    test('应拒绝空的 itinerary', () => {
      const trip = createTrip({ city: '杭州', days: 2 });
      expect(() => fillItinerary(trip, [])).toThrow(TypeError);
    });

    test('填充后的卡片应为不可变对象', () => {
      const trip = createTrip({ city: '杭州', days: 2 });
      const filled = fillItinerary(trip, MOCK_RAW_ITINERARY);

      const firstCard = filled.itinerary[0].cards[0];
      expect(firstCard.type).toBe('spot');
      expect(firstCard._poiStatus).toBe('pending');
      expect(firstCard._dataSource).toBe('ai');
    });

    test('不应修改原始 trip 对象', () => {
      const trip = createTrip({ city: '杭州', days: 2 });
      fillItinerary(trip, MOCK_RAW_ITINERARY);

      expect(trip.itinerary).toEqual([]);
      expect(trip.status).toBe(TripStatus.DRAFT);
    });
  });

  describe('changeStatus', () => {
    test('应执行合法的状态转换', () => {
      const trip = createTrip({ city: '杭州', days: 2 });
      const filled = fillItinerary(trip, MOCK_RAW_ITINERARY);

      expect(filled.status).toBe(TripStatus.GENERATED);

      const enriched = changeStatus(filled, TripStatus.ENRICHING);
      expect(enriched.status).toBe(TripStatus.ENRICHING);
    });

    test('应拒绝非法状态转换', () => {
      const trip = createTrip({ city: '杭州', days: 2 });
      // draft → ready 不合法
      expect(() => changeStatus(trip, TripStatus.READY)).toThrow();
    });
  });

  describe('replaceDayCards', () => {
    test('应替换指定天的卡片', () => {
      const trip = createTrip({ city: '杭州', days: 2 });
      const filled = fillItinerary(trip, MOCK_RAW_ITINERARY);

      const newCards = [
        {
          cardId: 'n1',
          type: 'spot',
          name: '雷峰塔',
          timeRange: '09:00-10:30',
          duration: 90,
          description: '西湖标志性景点',
        },
      ];

      const replaced = replaceDayCards(filled, 1, newCards);

      expect(replaced.itinerary[0].cards).toHaveLength(1);
      expect(replaced.itinerary[0].cards[0].name).toBe('雷峰塔');
      expect(replaced.itinerary[1].cards).toHaveLength(2); // Day 2 不变
      expect(replaced.editCount).toBe(2);
    });
  });

  describe('deleteCard', () => {
    test('应删除指定卡片', () => {
      const trip = createTrip({ city: '杭州', days: 2 });
      const filled = fillItinerary(trip, MOCK_RAW_ITINERARY);

      expect(getTotalCardCount(filled)).toBe(4);

      const afterDelete = deleteCard(filled, 1, 'c1');
      expect(getTotalCardCount(afterDelete)).toBe(3);
      expect(afterDelete.itinerary[0].cards[0].cardId).toBe('c2');
    });
  });

  describe('getTotalCardCount', () => {
    test('应正确计算总卡片数', () => {
      const trip = createTrip({ city: '杭州', days: 2 });
      const filled = fillItinerary(trip, MOCK_RAW_ITINERARY);

      expect(getTotalCardCount(filled)).toBe(4);
    });
  });

  describe('getDayCards', () => {
    test('应按 dayIndex 获取卡片', () => {
      const trip = createTrip({ city: '杭州', days: 2 });
      const filled = fillItinerary(trip, MOCK_RAW_ITINERARY);

      const day1Cards = getDayCards(filled, 1);
      expect(day1Cards).toHaveLength(2);
      expect(day1Cards[0].name).toBe('西湖断桥残雪');
    });

    test('找不到天时应返回空数组', () => {
      const trip = createTrip({ city: '杭州', days: 2 });
      expect(getDayCards(trip, 99)).toEqual([]);
    });
  });
});
