/**
 * t-toast — 轻提示
 *
 * 用法：页面上放一个 t-toast，通过 triggerEvent 唤起
 * 变体：success（绿）/ error（红）/ info（灰）
 * 自动消失：2 秒
 */
Component({
  options: { styleIsolation: 'shared' },
  properties: {
    message: { type: String, value: '' },
    type: { type: String, value: 'info' },
    show: { type: Boolean, value: false },
    duration: { type: Number, value: 2000 },
  },
  observers: {
    show(val) {
      if (val) {
        setTimeout(() => {
          this.triggerEvent('hide');
        }, this.data.duration);
      }
    },
  },
});
