const ai = require('../../utils/ai');

Page({
  data: {
    todayWrong: 0,
    todayTotal: 0
  },

  onShow() {
    const store = require('../../utils/store');
    const records = store.listGradingRecords();
    const today = new Date().toISOString().slice(0, 10);
    const todayRec = records.filter(r => r.date === today);
    this.setData({
      todayTotal: todayRec.reduce((s, r) => s + (r.total || 0), 0),
      todayWrong: todayRec.reduce((s, r) => s + (r.wrong || 0), 0)
    });
  },

  /** 主入口：拍照或从相册选择（1~3 张） */
  async takePhoto() {
    try {
      const res = await wx.chooseMedia({
        count: 3,
        mediaType: ['image'],
        sourceType: ['camera', 'album'],
        sizeType: ['compressed']
      });
      const paths = res.tempFiles.map(f => f.tempFilePath);
      wx.showLoading({ title: 'AI 批改中…', mask: true });
      const result = await ai.grade(paths);
      wx.hideLoading();

      const gradingId = `g${Date.now()}`;
      const items = result.items || [];
      const wrong = items.filter(i => !i.isCorrect);

      require('../../utils/store').saveGradingRecord({
        id: gradingId,
        date: new Date().toISOString().slice(0, 10),
        createdAt: Date.now(),
        photoUrls: paths, // 单用户阶段临时路径即可；如需长期保留需上传
        total: items.length,
        wrong: wrong.length,
        rawResult: result
      });
      if (wrong.length) {
        require('../../utils/store').saveWrongQuestions(gradingId, wrong);
      }

      wx.navigateTo({
        url: `/pages/result/result?id=${gradingId}`
      });
    } catch (e) {
      wx.hideLoading();
      if (e && e.errMsg && e.errMsg.includes('cancel')) return;
      wx.showToast({ title: '批改失败，请重试', icon: 'none' });
    }
  }
});
