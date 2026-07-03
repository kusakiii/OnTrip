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

    // ── 视图状态 ──
    activeDayIndex: 0, // 当前显示的天
    viewMode: 'timeline', // 'timeline' | 'map'
    dayTabs: [],

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
    try {
      // 优先从本地缓存加载（即时显示）
      const cached = this._getFromCache(tripId);
      if (cached) {
        this._renderTrip(cached);
      }

      // 从云数据库加载最新版本
      const trip = await this._fetchFromCloud(tripId);

      // 乐观锁：如果本地版本和远程版本不一致，使用远程版本
      this._renderTrip(trip);
      this._saveToCache(trip);
    } catch (err) {
      logger.error('Failed to load trip', { tripId, error: err.message });
      this._showToast('加载失败，请下拉刷新', 'error');
    } finally {
      this.setData({ loading: false });
    }
  },

  _renderTrip(trip) {
    const dayTabs = trip.itinerary.map((day, _idx) => ({
      index: day.dayIndex,
      label: `第${day.dayIndex}天`,
      summary: day.summary,
    }));

    this.setData({ trip, dayTabs });
  },

  // ═══════════════════════════════════
  //  Day 切换
  // ═══════════════════════════════════

  onDayTabTap(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({ activeDayIndex: index });
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
