const store = require('../../utils/store');

Page({
  data: {
    records: []
  },

  onShow() {
    this.setData({
      records: store.listGradingRecords().map(r => ({
        ...r,
        displayDate: r.date,
        summary: `共 ${r.total} 题 · 错 ${r.wrong} 题`
      }))
    });
  },

  onTapRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/result/result?id=${id}` });
  }
});
