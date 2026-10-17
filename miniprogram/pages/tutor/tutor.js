const ai = require('../../utils/ai');
const store = require('../../utils/store');

Page({
  data: {
    messages: [],     // [{ role: 'assistant'|'user', content }]
    inputValue: '',
    wrongItem: null,
    wrongId: '',
    scrollInto: ''
  },

  onLoad(options) {
    // 找到该批改记录中对应题号的错题
    const record = store.getGradingRecord(options.gradingId);
    const item = record && (record.rawResult.items || []).find(i => i.no === decodeURIComponent(options.no));
    if (!item) {
      wx.showToast({ title: '题目不存在', icon: 'none' });
      return;
    }
    this.setData({ wrongItem: item, wrongId: `${options.gradingId}-${item.no}` });

    // 讲解开局：AI 先给第一步提示
    const opening = `AI 老师，第 ${item.no} 题我做错了，题目是：${item.questionText}。我的答案是 ${item.kidAnswer || '（空着没做）'}，请引导我一步一步搞懂。`;
    this._send([opening]);
  },

  async _send(userTexts) {
    const history = [...this.data.messages.map(m => ({ role: m.role, content: m.content }))];
    for (const text of userTexts) {
      history.push({ role: 'user', content: text });
      this._push('user', text);
    }
    wx.showLoading({ title: '老师思考中…' });
    try {
      const res = await ai.chat(history, this.data.wrongItem);
      wx.hideLoading();
      this._push('assistant', res.reply);
      store.updateWrongStatus(this.data.wrongId, '订正中');
    } catch (e) {
      wx.hideLoading();
      this._push('assistant', '哎呀，老师走神了，再点一次试试？');
    }
  },

  _push(role, content) {
    const messages = this.data.messages.concat([{ role, content, id: `m${Date.now()}` }]);
    this.setData({ messages, inputValue: '', scrollInto: `m${messages.length - 1}` });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  onSend() {
    const v = (this.data.inputValue || '').trim();
    if (!v) return;
    this._send([v]);
  },

  onQuick(e) {
    const t = e.currentTarget.dataset.type;
    const map = {
      hint: '看一步提示',
      rephrase: '换个说法讲讲',
      done: '我会了！'
    };
    this._send([map[t]]);
  }
});
