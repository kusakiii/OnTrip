/**
 * TripFlow Design Tokens
 *
 * 单一设计真相源。所有组件必须引用此文件，禁止写死颜色/字号/间距。
 *
 * 设计语言：Apple Human Interface + 微信原生 + Notion 极简信息层级
 * 关键词：极简 / 留白 / 卡片 / 圆角 / 自然
 */

// ========================
// 1. 颜色 — 低饱和中性色 + 浅绿唯一品牌色
// ========================
const Color = Object.freeze({
  // 品牌色
  Primary: '#2E7D32',
  PrimaryLight: '#E8F5E9',
  PrimaryDark: '#1B5E20',

  // 背景
  Background: '#FFFFFF',
  Surface: '#F7F8FA',
  SurfaceHover: '#EEF0F2',

  // 边框
  Border: '#E5E7EB',
  BorderLight: '#F0F1F3',

  // 文字
  Text: '#1F2937',
  TextSecondary: '#6B7280',
  TextTertiary: '#9CA3AF',
  TextInverse: '#FFFFFF',

  // 语义色
  Danger: '#EF4444',
  DangerLight: '#FEE2E2',
  Warning: '#F59E0B',
  WarningLight: '#FEF3C7',
  Success: '#10B981',
  SuccessLight: '#D1FAE5',

  // 卡片类型色（仅用于类型标记，不用做大面积色）
  Spot: '#3B82F6',
  Food: '#F97316',
  Shop: '#8B5CF6',
  Hotel: '#EC4899',
  Transport: '#06B6D4',
});

// ========================
// 2. 字体 — 只有 5 个字号
// ========================
const Typography = Object.freeze({
  H1: { size: 28, weight: 'bold', lineHeight: 1.3 },
  H2: { size: 22, weight: 'bold', lineHeight: 1.3 },
  Title: { size: 18, weight: 'medium', lineHeight: 1.4 },
  Body: { size: 16, weight: 'normal', lineHeight: 1.6 },
  Caption: { size: 13, weight: 'normal', lineHeight: 1.5 },
});

// ========================
// 3. 间距 — 6 个档位
// ========================
const Spacing = Object.freeze({
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  XXL: 32,
  XXXL: 48,
});

// ========================
// 4. 圆角 — 4 个档位
// ========================
const Radius = Object.freeze({
  Button: 12,
  Card: 16,
  Dialog: 20,
  Avatar: 999,
});

// ========================
// 5. 阴影 — 只有 1 级
// ========================
const Shadow = Object.freeze({
  Card: '0 2rpx 12rpx rgba(0, 0, 0, 0.08)',
  Dialog: '0 8rpx 32rpx rgba(0, 0, 0, 0.12)',
});

// ========================
// 6. 动画 — 只有 3 种
// ========================
const Animation = Object.freeze({
  Duration: {
    Fast: 150,
    Normal: 250,
    Slow: 400,
  },
  Easing: {
    Default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    Spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
});

// ========================
// 7. 图标名 — 不超过 40 个
// ========================
const IconName = Object.freeze({
  // 导航
  BACK: 'back',
  CLOSE: 'close',
  MORE: 'more',
  // 地点类型
  SPOT: 'landmark',
  FOOD: 'utensils',
  SHOP: 'shopping-bag',
  HOTEL: 'building',
  TRANSPORT: 'navigation',
  // 操作
  STAR: 'star',
  STAR_FILLED: 'star-filled',
  CHAT: 'message-circle',
  SHARE: 'share',
  DELETE: 'trash-2',
  REPLACE: 'refresh-cw',
  LOCATION: 'map-pin',
  CLOCK: 'clock',
  // 系统
  LOADING: 'loader',
  CHECK: 'check',
  ALERT: 'alert-triangle',
});

// ========================
// 8. 语义 Token（组件直接引用）
// ========================
const ButtonToken = Object.freeze({
  Height: 48,
  Radius: Radius.Button,
  PrimaryBg: Color.Primary,
  PrimaryText: Color.TextInverse,
  DisabledBg: Color.Border,
  DisabledText: Color.TextTertiary,
});

const InputToken = Object.freeze({
  Height: 52,
  Radius: Radius.Button,
  Bg: Color.Surface,
  Border: Color.Border,
  FocusBorder: Color.Primary,
  Padding: Spacing.LG,
});

const CardToken = Object.freeze({
  Radius: Radius.Card,
  Shadow: Shadow.Card,
  Bg: Color.Background,
  Padding: Spacing.LG,
  Gap: Spacing.MD,
});

const TagToken = Object.freeze({
  Height: 32,
  Radius: Radius.Button,
  Padding: `${Spacing.SM}rpx ${Spacing.LG}rpx`,
  SelectedBg: Color.PrimaryLight,
  SelectedText: Color.Primary,
  UnselectedBg: Color.Surface,
  UnselectedText: Color.TextSecondary,
});

module.exports = {
  Color,
  Typography,
  Spacing,
  Radius,
  Shadow,
  Animation,
  IconName,
  ButtonToken,
  InputToken,
  CardToken,
  TagToken,
};
