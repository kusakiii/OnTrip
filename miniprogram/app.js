/**
 * TripFlow — AI 行程规划微信小程序入口
 *
 * 职责：
 * - 初始化微信云开发
 * - 全局错误捕获
 * - 全局状态注入（MobX Store Provider）
 *
 * 架构原则：App 只做初始化，不包含任何业务逻辑。
 */

App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('[TripFlow] 请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      env: 'tripflow-prod',
      traceUser: true,
    });

    this._initGlobalErrorHandler();
  },

  /**
   * 全局未捕获错误处理
   * 原则：用户看到友好提示，开发者拿到完整错误栈
   */
  _initGlobalErrorHandler() {
    wx.onUnhandledRejection((res) => {
      console.error('[TripFlow] Unhandled Rejection:', res.reason);
      wx.showToast({
        title: '系统繁忙，请稍后重试',
        icon: 'none',
        duration: 2000,
      });
    });
  },

  /**
   * 获取全局数据（供页面通过 getApp() 访问）
   */
  globalData: {
    userInfo: null,
    openId: null,
  },
});
