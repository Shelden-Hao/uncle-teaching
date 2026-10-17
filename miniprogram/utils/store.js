/**
 * 本地存储层：批改记录 + 错题记录（MVP 单用户，直接用 wx.storage）
 * 表结构对应 PRD §7：grading_record / wrong_question
 */
const KEY_GRADING = 'grading_records';   // 批改记录列表（新在前）
const KEY_WRONG = 'wrong_questions';     // 错题记录列表（新在前）

function _getList(key) {
  return wx.getStorageSync(key) || [];
}

function _setList(key, list) {
  wx.setStorageSync(key, list);
}

/* ---------- 批改记录 ---------- */

function saveGradingRecord(record) {
  // record: { id, date, photoUrls[], total, wrong, rawResult }
  const list = _getList(KEY_GRADING);
  list.unshift(record);
  _setList(KEY_GRADING, list);
  return record;
}

function listGradingRecords() {
  return _getList(KEY_GRADING);
}

function getGradingRecord(id) {
  return _getList(KEY_GRADING).find(r => r.id === id) || null;
}

/* ---------- 错题记录 ---------- */

function saveWrongQuestions(gradingId, wrongList) {
  // wrongList: [{ questionText, kidAnswer, correctAnswer, knowledgePoint, errorType, aiConfidence }]
  const list = _getList(KEY_WRONG);
  const date = new Date().toISOString().slice(0, 10);
  wrongList.forEach(w => {
    list.unshift({
      id: `${gradingId}-${list.length + 1}`,
      gradingId,
      date,
      photoUrl: '',
      correctionStatus: '未订正', // 未订正 / 订正中 / 订正通过
      ...w
    });
  });
  _setList(KEY_WRONG, list);
}

function listWrongQuestions() {
  return _getList(KEY_WRONG);
}

function updateWrongStatus(id, status) {
  const list = _getList(KEY_WRONG);
  const item = list.find(w => w.id === id);
  if (item) {
    item.correctionStatus = status;
    _setList(KEY_WRONG, list);
  }
}

/* ---------- 图片缓存清理 ---------- */

function cleanOldPhotos(days) {
  const deadline = Date.now() - days * 24 * 3600 * 1000;
  const list = _getList(KEY_GRADING).filter(r => r.createdAt && r.createdAt >= deadline);
  _setList(KEY_GRADING, list);
}

module.exports = {
  saveGradingRecord,
  listGradingRecords,
  getGradingRecord,
  saveWrongQuestions,
  listWrongQuestions,
  updateWrongStatus,
  cleanOldPhotos
};
