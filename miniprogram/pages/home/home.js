/**
 * 首页 — TripFlow
 *
 * 原则：一屏只做一件事
 * 流程：输入目的地 → 选天数 → 选风格 → 点击生成
 *
 * 职责：
 * - 管理输入状态（destination, days, styles）
 * - 调用 GenerateTripUseCase
 * - 不包含业务逻辑（业务归 UseCase）
 */

const logger = require('../../utils/logger');
const { execute: generateTrip } = require('../../use-cases/GenerateTripUseCase');

Page({
  data: {
    // ── 输入状态 ──
    destination: '',
    days: 3,
    selectedStyles: ['food'],

    // ── 可选 ──
    showCitySuggestions: false,
    recentTrips: [],

    // ── 流程状态 ──
    loading: false,
    loadingText: '正在规划路线…',

    // ── Toast ──
    toastShow: false,
    toastMessage: '',
    toastType: 'info',
  },

  onLoad() {
    this._loadRecentTrips();
  },

  // ═══════════════════════════════════
  //  输入处理
  // ═══════════════════════════════════

  onDestinationInput(e) {
    this.setData({ destination: e.detail.value });
  },

  onDaysChange(e) {
    const days = e.detail.value;
    this.setData({ days });
  },

  onStyleChange(e) {
    this.setData({ selectedStyles: e.detail.selected });
  },

  // ═══════════════════════════════════
  //  生成行程
  // ═══════════════════════════════════

  async onGenerate() {
    const { destination, days, selectedStyles } = this.data;

    // 输入校验
    if (!destination.trim()) {
      return this._showToast('请输入目的地', 'error');
    }

    logger.info('User clicked generate', { destination, days, styles: selectedStyles });

    // 进入生成状态
    this.setData({ loading: true, loadingText: `正在为 ${destination} 规划 ${days} 天行程…` });

    try {
      // 调用 UseCase（内部：CloudBase → AI → DTO → Domain → Repository）
      const trip = await generateTrip({
        destination: destination.trim(),
        days,
        styleTags: selectedStyles,
      });

      // 保存到本地存储（trip 页面通过 tripId 读取）
      this._saveTripToStorage(trip);

      // 保存到最近历史
      this._addToRecentTrips(trip);

      // 跳转到行程详情页
      wx.navigateTo({
        url: `/pages/trip/trip?tripId=${trip.tripId}`,
      });
    } catch (err) {
      logger.error('Generate trip failed', { error: err.message });
      this._showToast(err.userMessage || '生成失败，请重试', 'error');
    } finally {
      this.setData({ loading: false });
    }
  },

  // ═══════════════════════════════════
  //  私有方法
  // ═══════════════════════════════════

  _loadRecentTrips() {
    try {
      const stored = wx.getStorageSync('tripflow_recent_trips');
      if (stored && Array.isArray(stored)) {
        this.setData({ recentTrips: stored.slice(0, 3) });
      }
    } catch (_err) {
      // 首次打开或无缓存，静默跳过
    }
  },

  _saveTripToStorage(trip) {
    try {
      const key = `tripflow_trip_${trip.tripId}`;
      wx.setStorageSync(key, trip);
    } catch (_err) {
      // 存储满时静默失败
    }
  },

  _addToRecentTrips(trip) {
    try {
      const stored = wx.getStorageSync('tripflow_recent_trips') || [];
      const entry = {
        tripId: trip.tripId,
        destination: trip.destination.city,
        days: trip.days,
        createdAt: trip.createdAt,
      };
      // 去重后插入头部，保留最近 10 条
      const updated = [entry, ...stored.filter((s) => s.tripId !== trip.tripId)].slice(0, 10);
      wx.setStorageSync('tripflow_recent_trips', updated);
      this.setData({ recentTrips: updated.slice(0, 3) });
    } catch (_err) {
      // 静默
    }
  },

  _showToast(message, type = 'info') {
    this.setData({ toastShow: true, toastMessage: message, toastType: type });
    setTimeout(() => this.setData({ toastShow: false }), 2000);
  },

  onToastHide() {
    this.setData({ toastShow: false });
  },

  // ═══════════════════════════════════
  //  用户操作
  // ═══════════════════════════════════

  /** 点击历史行程 */
  onRecentTripTap(e) {
    const { tripId } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/trip/trip?tripId=${tripId}` });
  },
});
