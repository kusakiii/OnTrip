/**
 * t-tag — 风格标签组件
 *
 * 状态：selected（绿底绿字）/ unselected（灰底灰字）
 * 用于首页风格选择和卡片功能标签
 */
Component({
  options: { styleIsolation: 'shared' },
  properties: {
    label: { type: String, value: '' },
    icon: { type: String, value: '' },
    selected: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
  },
  methods: {
    onTap() {
      if (this.data.disabled) {
        return;
      }
      this.triggerEvent('tap');
    },
  },
});
