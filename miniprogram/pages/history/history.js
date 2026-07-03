/**
 * 历史行程页 — History
 *
 * 极简列表：目的地 + 日期 + 状态
 * 原则：只有导航功能，不包含任何编辑操作
 */
Page({
  data: {
    trips: [],
    loading: true,
  },

  onShow() {
    this._loadTrips();
  },

  async _loadTrips() {
    this.setData({ loading: true });
    try {
      // 从本地缓存读取（快速）
      const cached = this._getCachedHistory();
      if (cached.length > 0) {
        this.setData({ trips: cached, loading: false });
      }

      // 从云端同步（后台刷新）
      const remote = await this._fetchHistory();
      this.setData({ trips: remote, loading: false });
      this._setCachedHistory(remote);
    } catch (err) {
      // 云同步失败不阻塞，用缓存兜底
      if (this.data.trips.length === 0) {
        this.setData({ trips: [], loading: false });
      }
    }
  },

  onTripTap(e) {
    const { tripId } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/trip/trip?tripId=${tripId}` });
  },

  // ═══════════════════════════════════
  //  私有方法
  // ═══════════════════════════════════

  _fetchHistory() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'trip-manager',
        data: { action: 'list' },
        success: (res) => resolve(res.result?.trips || []),
        fail: reject,
      });
    });
  },

  _getCachedHistory() {
    try {
      return wx.getStorageSync('tripflow_history') || [];
    } catch {
      return [];
    }
  },

  _setCachedHistory(trips) {
    try {
      wx.setStorageSync('tripflow_history', trips);
    } catch {
      /* 静默 */
    }
  },

  onPullDownRefresh() {
    this._loadTrips().then(() => wx.stopPullDownRefresh());
  },
});
