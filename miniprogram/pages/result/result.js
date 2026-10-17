const store = require('../../utils/store');

Page({
  data: {
    record: null,
    items: []
  },

  onLoad(options) {
    const record = store.getGradingRecord(options.id);
    if (!record) {
      wx.showToast({ title: '记录不存在', icon: 'none' });
      return;
    }
    const items = (record.rawResult.items || []).map(it => ({
      ...it,
      statusText: it.isCorrect ? '✓' : '✗',
      needConfirm: !it.isCorrect && it.confidence < 0.7
    }));
    this.setData({ record, items });
  },

  /** 点错题 → 进入讲解 */
  onTapItem(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.items[idx];
    if (item.isCorrect) {
      wx.showToast({ title: '这题做对啦', icon: 'success' });
      return;
    }
    wx.navigateTo({
      url: `/pages/tutor/tutor?gradingId=${this.data.record.id}&no=${encodeURIComponent(item.no)}`
    });
  },

  /** 待确认题：手动确认 AI 判断 */
  onConfirmItem(e) {
    const idx = e.currentTarget.dataset.index;
    const key = `items[${idx}].needConfirm`;
    this.setData({ [key]: false });
  }
});
