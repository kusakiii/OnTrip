/**
 * t-bottom-sheet — 底部浮层
 *
 * 用途：卡片详情、对话面板、POI 信息等所有"不跳新页面"的编辑操作
 * 动画：从底部滑入（spring 弹性曲线）
 */
const ANIMATION_FRAME_DELAY = 50;
const SHEET_CLOSE_DELAY = 300;

Component({
  options: { styleIsolation: 'shared' },

  properties: {
    /** 是否显示 */
    show: { type: Boolean, value: false },
    /** 标题 */
    title: { type: String, value: '' },
    /** 最大高度占比（如 0.6 表示 60vh） */
    maxHeightRatio: { type: Number, value: 0.6 },
  },

  data: {
    animating: false,
    _show: false,
  },

  observers: {
    show(val) {
      if (val) {
        this.setData({ _show: true });
        setTimeout(() => this.setData({ animating: true }), ANIMATION_FRAME_DELAY);
      } else {
        this.setData({ animating: false });
        setTimeout(() => this.setData({ _show: false }), SHEET_CLOSE_DELAY);
      }
    },
  },

  methods: {
    /** 点击遮罩关闭 */
    onOverlayTap() {
      this.triggerEvent('close');
    },
    onContentTap() {
      // 阻止冒泡
    },
  },
});
