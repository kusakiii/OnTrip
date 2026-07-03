/**
 * card-detail-sheet — 卡片详情 BottomSheet 内容
 *
 * 结构：照片 → 评分 → 营业信息 → 描述 → 操作按钮
 * 所有编辑操作都在 Sheet 内完成，不跳新页面
 */
Component({
  options: { styleIsolation: 'shared' },
  properties: {
    card: { type: Object, value: null },
  },
  methods: {
    onStar() {
      this.triggerEvent('star', { cardId: this.data.card?.cardId });
    },
    onReplace() {
      this.triggerEvent('replace', { cardId: this.data.card?.cardId });
    },
    onDelete() {
      this.triggerEvent('delete', { cardId: this.data.card?.cardId });
    },
  },
});
