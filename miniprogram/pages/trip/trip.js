/**
 * 行程详情页 — Trip Detail
 *
 * 核心交互：
 * - 时间轴视图（默认）
 * - Day 切换（Tab）
 * - 卡片详情 BottomSheet
 * - 对话面板 BottomSheet（浮动按钮触发）
 *
 * 职责：
 * - 管理视图状态（当前 day、sheet 显隐）
 * - 委托 UseCase 执行修改操作
 * - 不包含业务逻辑
 */

const logger = require('../../utils/logger');

Page({
  data: {
    // ── 行程数据 ──
    trip: null,
    loading: true,
    totalCards: 0,

    // ── 折叠状态（key=dayIndex, value=true 表示已折叠） ──
    collapsedDays: {},

    // ── BottomSheet 状态 ──
    detailSheetShow: false,
    detailSheetCard: null,
    chatSheetShow: false,

    // ── Toast ──
    toastShow: false,
    toastMessage: '',
    toastType: 'info',
  },

  onLoad(options) {
    const { tripId } = options;
    if (!tripId) {
      this._showToast('行程不存在', 'error');
      return;
    }
    this._loadTrip(tripId);
  },

  // ═══════════════════════════════════
  //  数据加载
  // ═══════════════════════════════════

  async _loadTrip(tripId) {
    // ── ① 本地存储（即时显示，主要数据源）──
    const cached = this._getFromCache(tripId);

    if (cached) {
      this._renderTrip(cached);
      this.setData({ loading: false });
    }

    // ── ② 云数据库（后台同步，不阻塞）──
    try {
      const trip = await this._fetchFromCloud(tripId);
      if (trip) {
        this._renderTrip(trip);
        this._saveToCache(trip);
      }
    } catch (_err) {
      // 云同步失败不阻塞，本地缓存已足够
      logger.warn('Cloud sync failed, using cache', { tripId });
    } finally {
      this.setData({ loading: false });
    }

    // ── ③ 无数据 → 显示空状态 ──
    if (!cached && !this.data.trip) {
      this._showToast('该行程不存在或已被删除', 'error');
    }
  },

  _renderTrip(trip) {
    const totalCards = trip.itinerary.reduce((sum, day) => sum + day.cards.length, 0);
    this.setData({ trip, totalCards });
  },

  // ═══════════════════════════════════
  //  Day 折叠/展开
  // ═══════════════════════════════════

  onDayToggle(e) {
    const { dayIndex } = e.currentTarget.dataset;
    const collapsedDays = { ...this.data.collapsedDays };
    // 切换折叠状态
    if (collapsedDays[dayIndex]) {
      delete collapsedDays[dayIndex];
    } else {
      collapsedDays[dayIndex] = true;
    }
    this.setData({ collapsedDays });
  },

  // ═══════════════════════════════════
  //  卡片交互
  // ═══════════════════════════════════

  onCardTap(e) {
    const { card, dayIndex, index } = e.detail;
    this.setData({
      detailSheetShow: true,
      detailSheetCard: { ...card, dayIndex, index },
    });
  },

  onStarTap(e) {
    const { cardId } = e.detail;
    // TODO: 委托 UseCase
    logger.info('Toggle star', { cardId });
  },

  onReplaceTap(e) {
    // 弹出对话面板，预设"替换"意图
    this.setData({ chatSheetShow: true });
    logger.info('Replace card', e.detail);
  },

  onDeleteTap(e) {
    const { cardId } = e.detail;
    wx.showModal({
      title: '确认删除',
      content: '删除后将无法恢复',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          // TODO: 委托 UseCase
          logger.info('Delete card confirmed', { cardId });
        }
      },
    });
  },

  // ═══════════════════════════════════
  //  BottomSheet 控制
  // ═══════════════════════════════════

  onDetailSheetClose() {
    this.setData({ detailSheetShow: false, detailSheetCard: null });
  },

  onChatToggle() {
    this.setData({ chatSheetShow: !this.data.chatSheetShow });
  },

  onChatSheetClose() {
    this.setData({ chatSheetShow: false });
  },

  // ═══════════════════════════════════
  //  地图视图
  // ═══════════════════════════════════

  onViewModeToggle() {
    const next = this.data.viewMode === 'timeline' ? 'map' : 'timeline';
    this.setData({ viewMode: next });
  },

  // ═══════════════════════════════════
  //  导出/分享
  // ═══════════════════════════════════

  onExport() {
    // TODO: 长图导出
    wx.showToast({ title: '导出功能开发中', icon: 'none' });
  },

  // ═══════════════════════════════════
  //  私有方法
  // ═══════════════════════════════════

  _fetchFromCloud(tripId) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'trip-manager',
        data: { action: 'get', tripId },
        success: (res) => {
          if (res.result?.trip) {
            resolve(res.result.trip);
          } else {
            reject(new Error('Trip not found'));
          }
        },
        fail: reject,
      });
    });
  },

  _getFromCache(tripId) {
    try {
      const key = `tripflow_trip_${tripId}`;
      const cached = wx.getStorageSync(key);
      return cached || null;
    } catch {
      return null;
    }
  },

  _saveToCache(trip) {
    try {
      const key = `tripflow_trip_${trip.tripId}`;
      wx.setStorageSync(key, trip);
    } catch {
      /* 静默失败 */
    }
  },

  _showToast(message, type = 'info') {
    this.setData({ toastShow: true, toastMessage: message, toastType: type });
    setTimeout(() => this.setData({ toastShow: false }), 2000);
  },

  onToastHide() {
    this.setData({ toastShow: false });
  },
});
