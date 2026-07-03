/**
 * style-tags — 风格标签选择器
 *
 * 7 个固定风格标签，可多选
 * 数据源来自 Domain 层 STYLE_TAGS
 */
const { STYLE_TAGS } = require('../../domain');

Component({
  options: { styleIsolation: 'shared' },

  properties: {
    /** 已选中的标签 id 列表 */
    selected: { type: Array, value: [] },
    /** 最大可选数量 */
    max: { type: Number, value: 3 },
  },

  data: {
    tags: STYLE_TAGS.map((t) => ({
      ...t,
      icon: TAG_ICONS[t.id] || '',
      _selected: false,
    })),
  },

  observers: {
    selected(ids) {
      const tags = this.data.tags.map((t) => ({
        ...t,
        _selected: (ids || []).includes(t.id),
      }));
      this.setData({ tags });
    },
  },

  methods: {
    onTagTap(e) {
      const { id } = e.currentTarget.dataset;
      const selected = this.data.selected || [];
      const max = this.data.max;

      if (selected.includes(id)) {
        // 取消选择
        this.triggerEvent('change', { selected: selected.filter((s) => s !== id) });
      } else {
        if (selected.length >= max) {
          wx.showToast({ title: `最多选择 ${max} 个风格`, icon: 'none', duration: 1500 });
          return;
        }
        this.triggerEvent('change', { selected: [...selected, id] });
      }
    },
  },
});

const TAG_ICONS = {
  art: '🎨',
  food: '🍜',
  family: '👨‍👩‍👧',
  nature: '🌿',
  shop: '🛍',
  relax: '☕',
  walk: '👟',
};
