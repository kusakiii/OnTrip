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
    errorState: false, // US-02: 超时/失败后显示重试
    errorMessage: '',

    // ── Toast ──
    toastShow: false,
    toastMessage: '',
    toastType: 'info',
  },

  // US-02 进度文案（4 段轮播）
  progressTexts: [
    '正在搜索 {city} 的热门景点…',
    '正在规划最佳路线…',
    '正在匹配 {style} 推荐…',
    '正在生成行程…',
  ],
  _progressTimer: null,

  onLoad() {
    this._loadRecentTrips();
  },

  onHide() {
    // 清理进度轮播定时器，防止内存泄漏
    this._stopProgressTimer();
  },

  onUnload() {
    this._stopProgressTimer();
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

    // 清除之前的错误状态
    this.setData({ errorState: false, errorMessage: '' });

    // 开始执行
    await this._executeGeneration(destination.trim(), days, selectedStyles);
  },

  /** US-02: 重试（点击错误状态中的重试按钮） */
  onRetry() {
    const { destination, days, selectedStyles } = this.data;
    this._executeGeneration(destination.trim(), days, selectedStyles);
  },

  /** 执行生成（抽取出来方便重试调用） */
  async _executeGeneration(destination, days, styles) {
    // 进入生成状态
    this.setData({ loading: true, loadingText: this._formatProgress(0, destination, styles) });
    this._startProgressTimer(destination, styles);

    try {
      const trip = await generateTrip({ destination, days, styleTags: styles });

      // 成功 → 保存 + 跳转
      this._saveTripToStorage(trip);
      this._addToRecentTrips(trip);
      wx.navigateTo({ url: `/pages/trip/trip?tripId=${trip.tripId}` });
    } catch (err) {
      logger.error('Generate trip failed', { error: err.message });
      // US-02: 显示错误状态 + 重试按钮（不跳转，留在首页）
      const userMsg = err.userMessage || '生成超时了，请再试一次';
      this.setData({
        errorState: true,
        errorMessage: userMsg,
      });
    } finally {
      this.setData({ loading: false });
      this._stopProgressTimer();
    }
  },

  // ═══════════════════════════════════
  //  US-02: 进度文案轮播
  // ═══════════════════════════════════

  _startProgressTimer(destination, styles) {
    let idx = 0;
    this._progressTimer = setInterval(() => {
      idx = (idx + 1) % this.progressTexts.length;
      this.setData({ loadingText: this._formatProgress(idx, destination, styles) });
    }, 1500);
  },

  _stopProgressTimer() {
    if (this._progressTimer) {
      clearInterval(this._progressTimer);
      this._progressTimer = null;
    }
  },

  _formatProgress(idx, city, styles) {
    const styleDesc = styles.length > 0 ? styles.join('、') : '综合';
    return this.progressTexts[idx].replace('{city}', city).replace('{style}', styleDesc);
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
