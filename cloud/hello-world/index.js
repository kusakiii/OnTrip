/**
 * hello-world — CloudBase 连通性验证
 *
 * 用途：验证云开发环境是否正常初始化
 * 预期：调用返回 { ok: true, timestamp, env }
 */
exports.main = async (event, context) => {
  return {
    ok: true,
    message: 'TripFlow CloudBase is ready.',
    timestamp: new Date().toISOString(),
    env: context?.ENV || 'unknown',
  };
};
