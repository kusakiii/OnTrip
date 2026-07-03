/**
 * t-button — 统一按钮组件
 *
 * 变体：primary（绿底白字）、ghost（绿字白底绿边框）、danger（红底白字）
 * 状态：normal / loading / disabled
 * 尺寸：lg（52h）/ md（40h）/ sm（32h）
 */
Component({
  options: { styleIsolation: 'shared' },

  properties: {
    /** 按钮文字 */
    text: { type: String, value: '' },
    /** primary | ghost | danger */
    variant: { type: String, value: 'primary' },
    /** lg(52) | md(40) | sm(32) */
    size: { type: String, value: 'lg' },
    /** 是否加载中 */
    loading: { type: Boolean, value: false },
    /** 是否禁用 */
    disabled: { type: Boolean, value: false },
    /** 是否占满宽度 */
    block: { type: Boolean, value: true },
  },

  methods: {
    onTap() {
      if (this.data.disabled || this.data.loading) {
        return;
      }
      this.triggerEvent('tap');
    },
  },
});
