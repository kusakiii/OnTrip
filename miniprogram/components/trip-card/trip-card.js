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
    /** 卡片数据 */
    card: { type: Object, value: null },
    /** 是否首张卡片（不显示交通信息） */
    isFirst: { type: Boolean, value: false },
    /** 是否末张卡片（调整下方连线） */
    isLast: { type: Boolean, value: false },
    /** 所属天索引 */
    dayIndex: { type: Number, value: 0 },
    /** 卡片在当天的索引 */
    index: { type: Number, value: 0 },
    /** 日颜色（用于时间轴圆点） */
    dayColor: { type: String, value: '#2E7D32' },
  },

  computed: {},

  methods: {
    /** 点击卡片 → 弹出详情 BottomSheet */
    onCardTap() {
      this.triggerEvent('tap', {
        card: this.data.card,
        dayIndex: this.data.dayIndex,
        index: this.data.index,
      });
    },

    /** 切换收藏 */
    onStarTap(e) {
      e.stopPropagation();
      this.triggerEvent('star', { cardId: this.data.card.cardId });
    },

    /** 替换 */
    onReplaceTap(e) {
      e.stopPropagation();
      this.triggerEvent('replace', {
        cardId: this.data.card.cardId,
        dayIndex: this.data.dayIndex,
        index: this.data.index,
      });
    },

    /** 删除 */
    onDeleteTap(e) {
      e.stopPropagation();
      this.triggerEvent('delete', {
        cardId: this.data.card.cardId,
        dayIndex: this.data.dayIndex,
        index: this.data.index,
      });
    },

    /** POI 状态标签颜色 */
    _poiStatusColor(status) {
      const map = {
        verified: 'var(--color-success)',
        not_found: 'var(--color-warning)',
        api_error: 'var(--color-danger)',
        pending: 'var(--color-text-tertiary)',
        invalid_name: 'var(--color-danger)',
      };
      return map[status] || 'var(--color-text-tertiary)';
    },
  },
});
