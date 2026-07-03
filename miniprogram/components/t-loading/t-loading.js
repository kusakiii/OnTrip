/**
 * t-loading — 加载动画
 *
 * 用途：行程生成中、POI 富化中等等待态
 * 风格：极简绿色圆环旋转 + 动态文案
 */
Component({
  options: { styleIsolation: 'shared' },
  properties: {
    text: { type: String, value: '正在生成行程…' },
  },
});
