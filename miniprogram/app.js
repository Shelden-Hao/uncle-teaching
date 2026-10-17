App({
  globalData: {
    userInfo: null
  },

  onLaunch() {
    // 单用户阶段：冷启动时清理超过 90 天的本地批改图片缓存
    const store = require('./utils/store');
    store.cleanOldPhotos(90);
  }
});
