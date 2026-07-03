/**
 * Card 实体单元测试
 */

const {
  createCard,
  enrichCard,
  markPOIStatus,
  toggleStar,
  updateUserNote,
} = require('../../../miniprogram/domain/entities/Card');
const { CardType, POIStatus, DataSource } = require('../../../miniprogram/domain/enums');

const MOCK_CARD_PARAMS = {
  cardId: 'c_test_001',
  type: CardType.SPOT,
  name: '西湖断桥残雪',
  searchName: '断桥残雪',
  timeRange: '09:00-11:00',
  duration: 120,
  description: '西湖十景之一',
};

const MOCK_POI_DATA = {
  name: '西湖风景名胜区-断桥残雪',
  location: { lat: 30.259, lng: 120.1486 },
  rating: 4.6,
  ticketPrice: '免费',
  photos: ['https://example.com/photo.jpg'],
  tags: ['西湖十景', '历史遗迹'],
  businessArea: '西湖风景区',
};

describe('Card 实体', () => {
  describe('createCard', () => {
    test('应创建完整的卡片', () => {
      const card = createCard(MOCK_CARD_PARAMS);

      expect(card.cardId).toBe('c_test_001');
      expect(card.type).toBe(CardType.SPOT);
      expect(card.name).toBe('西湖断桥残雪');
      expect(card.isStarred).toBe(false);
      expect(card._poiStatus).toBe(POIStatus.PENDING);
      expect(card._dataSource).toBe(DataSource.AI);
      expect(card._version).toBe(1);
    });

    test('应拒绝无效的 cardId', () => {
      expect(() => createCard({ ...MOCK_CARD_PARAMS, cardId: '' })).toThrow(TypeError);
    });

    test('应拒绝无效的 type', () => {
      expect(() => createCard({ ...MOCK_CARD_PARAMS, type: 'invalid' })).toThrow(TypeError);
    });

    test('应拒绝空 name', () => {
      expect(() => createCard({ ...MOCK_CARD_PARAMS, name: '' })).toThrow(TypeError);
    });

    test('transportFromPrevious 应被解析为值对象', () => {
      const card = createCard({
        ...MOCK_CARD_PARAMS,
        transportFromPrevious: { method: '步行', duration: 15, distance: '1km' },
      });

      expect(card.transportFromPrevious.method).toBe('步行');
      expect(card.transportFromPrevious.duration).toBe(15);
    });

    test('首站卡片 transportFromPrevious 可为 null', () => {
      const card = createCard({ ...MOCK_CARD_PARAMS, transportFromPrevious: null });
      expect(card.transportFromPrevious).toBeNull();
    });
  });

  describe('enrichCard', () => {
    test('应用 POI 数据富化卡片', () => {
      const card = createCard(MOCK_CARD_PARAMS);
      const enriched = enrichCard(card, MOCK_POI_DATA);

      expect(enriched.rating).toBe(4.6);
      expect(enriched.ticketPrice).toBe('免费');
      expect(enriched.photos).toHaveLength(1);
      expect(enriched.location.lat).toBe(30.259);
      expect(enriched._poiStatus).toBe(POIStatus.VERIFIED);
      expect(enriched._dataSource).toBe(DataSource.AMAP);
      expect(enriched._version).toBe(2);
    });

    test('不应修改原卡片', () => {
      const card = createCard(MOCK_CARD_PARAMS);
      enrichCard(card, MOCK_POI_DATA);

      expect(card.rating).toBeNull();
      expect(card._poiStatus).toBe(POIStatus.PENDING);
      expect(card._version).toBe(1);
    });

    test('缺少的照片字段应保留原值', () => {
      const card = createCard(MOCK_CARD_PARAMS);
      const enriched = enrichCard(card, { name: 'test' });

      expect(enriched.photos).toEqual([]);
      expect(enriched.rating).toBeNull();
    });
  });

  describe('markPOIStatus', () => {
    test('应标记 POI 状态', () => {
      const card = createCard(MOCK_CARD_PARAMS);
      const marked = markPOIStatus(card, POIStatus.NOT_FOUND);

      expect(marked._poiStatus).toBe(POIStatus.NOT_FOUND);
      expect(marked._version).toBe(2);
    });

    test('应拒绝无效的 POI 状态', () => {
      const card = createCard(MOCK_CARD_PARAMS);
      expect(() => markPOIStatus(card, 'invalid_status')).toThrow(TypeError);
    });
  });

  describe('toggleStar', () => {
    test('应切换收藏状态', () => {
      const card = createCard(MOCK_CARD_PARAMS);
      const starred = toggleStar(card);

      expect(starred.isStarred).toBe(true);
      expect(starred._version).toBe(2);
    });

    test('再次切换应取消收藏', () => {
      const card = createCard(MOCK_CARD_PARAMS);
      const starred = toggleStar(card);
      const unstarred = toggleStar(starred);

      expect(unstarred.isStarred).toBe(false);
    });
  });

  describe('updateUserNote', () => {
    test('应更新用户备注', () => {
      const card = createCard(MOCK_CARD_PARAMS);
      const updated = updateUserNote(card, '一定要去！');

      expect(updated.userNote).toBe('一定要去！');
      expect(updated._dataSource).toBe(DataSource.USER);
    });
  });
});
