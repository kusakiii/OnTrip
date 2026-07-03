/**
 * trip-card — 行程卡片（整个产品的核心组件，80% 设计精力）
 *
 * 状态：
 * - normal：普通显示
 * - skeleton：POI 富化中（灰色占位骨架）
 * - expanded：展开显示更多（照片、标签、营业时间）
 *
 * 每个卡片承载：
 * 时间轴 → 类型图标 → 名称 → 评分 → 交通 → 描述 → POI标签 → 操作按钮
 */
Component({
  options: { styleIsolation: 'shared' },

  properties: {
    card: { type: Object, value: null },
    isFirst: { type: Boolean, value: false },
    isLast: { type: Boolean, value: false },
    dayIndex: { type: Number, value: 0 },
    index: { type: Number, value: 0 },
    dayColor: { type: String, value: '#2E7D32' },
  },

  observers: {
    card(card) {
      if (!card) {
        return;
      }
      // 计算交通显示文本（兼容字符串和对象两种格式）
      const transport = card.transportFromPrevious;
      let transportText = '';
      if (transport && typeof transport === 'object') {
        transportText = `${transport.method || ''} ${transport.duration || ''}分钟`;
      } else if (typeof transport === 'string' && transport !== 'null') {
        transportText = transport;
      }
      this.setData({ transportText });
    },
  },

  methods: {
    onCardTap() {
      this.triggerEvent('tap', {
        card: this.data.card,
        dayIndex: this.data.dayIndex,
        index: this.data.index,
      });
    },

    onStarTap(e) {
      e.stopPropagation();
      this.triggerEvent('star', { cardId: this.data.card.cardId });
    },

    onReplaceTap(e) {
      e.stopPropagation();
      this.triggerEvent('replace', {
        cardId: this.data.card.cardId,
        dayIndex: this.data.dayIndex,
        index: this.data.index,
      });
    },

    onDeleteTap(e) {
      e.stopPropagation();
      this.triggerEvent('delete', {
        cardId: this.data.card.cardId,
        dayIndex: this.data.dayIndex,
        index: this.data.index,
      });
    },
  },
});
