/**
 * DTO 校验器单元测试
 */

const { validate } = require('../../../miniprogram/shared/dto/DTOValidator');

describe('DTOValidator', () => {
  describe('完整有效数据', () => {
    const validData = {
      itinerary: [
        {
          dayIndex: 1,
          cards: [
            {
              type: 'spot',
              name: '西湖断桥残雪',
              timeRange: '09:00-11:00',
              duration: 120,
              description: '西湖十景之一',
              rating: 4.6,
            },
            {
              type: 'food',
              name: '知味观·味庄',
              timeRange: '11:30-13:00',
              duration: 90,
              description: '杭帮菜',
              transportFromPrevious: { method: '步行', duration: 15 },
            },
          ],
        },
      ],
    };

    test('应通过校验', () => {
      const result = validate(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('缺少 itinerary', () => {
    test('应检测并修复', () => {
      const result = validate({});
      expect(result.valid).toBe(false);
      expect(result.data.itinerary).toEqual([]);
    });
  });

  describe('缺少卡片必填字段', () => {
    test('缺少 name 应修复为默认值', () => {
      const data = {
        itinerary: [{ dayIndex: 1, cards: [{ type: 'spot', timeRange: '09:00-10:00' }] }],
      };
      const result = validate(data);
      // 修复后应有默认 name
      expect(result.data.itinerary[0].cards[0].name).toBe('未命名地点');
    });

    test('缺少 timeRange 应修复为默认值', () => {
      const data = {
        itinerary: [{ dayIndex: 1, cards: [{ type: 'spot', name: '测试景点' }] }],
      };
      const result = validate(data);
      expect(result.data.itinerary[0].cards[0].timeRange).toBe('09:00-10:00');
    });
  });

  describe('无效 type', () => {
    test('无效 type 应降级为 spot', () => {
      const data = {
        itinerary: [
          {
            dayIndex: 1,
            cards: [{ type: 'invalid_type', name: 'test', timeRange: '09:00-10:00' }],
          },
        ],
      };
      const result = validate(data);
      expect(result.data.itinerary[0].cards[0].type).toBe('spot');
    });
  });

  describe('交通字符串解析', () => {
    test('"步行 15分钟" 应解析为对象', () => {
      const data = {
        itinerary: [
          {
            dayIndex: 1,
            cards: [
              {
                type: 'spot',
                name: 'test',
                timeRange: '09:00-11:00',
                transportFromPrevious: '步行 15分钟',
              },
            ],
          },
        ],
      };
      const result = validate(data);
      const transport = result.data.itinerary[0].cards[0].transportFromPrevious;
      expect(transport.method).toBe('步行');
      expect(transport.duration).toBe(15);
    });
  });

  describe('缺少 dayIndex', () => {
    test('缺少 dayIndex 应用数组下标修复', () => {
      const data = {
        itinerary: [
          { cards: [{ type: 'spot', name: 'Day1景点', timeRange: '09:00-10:00' }] },
          { cards: [{ type: 'food', name: 'Day2餐厅', timeRange: '12:00-13:00' }] },
        ],
      };
      const result = validate(data);
      expect(result.data.itinerary[0].dayIndex).toBe(1);
      expect(result.data.itinerary[1].dayIndex).toBe(2);
    });
  });

  describe('rating 范围修复', () => {
    test('rating > 5 应裁剪为 5', () => {
      const data = {
        itinerary: [
          {
            dayIndex: 1,
            cards: [{ type: 'spot', name: 'test', timeRange: '09:00-10:00', rating: 10 }],
          },
        ],
      };
      const result = validate(data);
      expect(result.data.itinerary[0].cards[0].rating).toBe(5);
    });

    test('rating < 0 应裁剪为 0', () => {
      const data = {
        itinerary: [
          {
            dayIndex: 1,
            cards: [{ type: 'spot', name: 'test', timeRange: '09:00-10:00', rating: -1 }],
          },
        ],
      };
      const result = validate(data);
      expect(result.data.itinerary[0].cards[0].rating).toBe(0);
    });
  });
});
