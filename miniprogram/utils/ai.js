/**
 * AI 调用层：批改 + 讲解
 *
 * 两种模式（config.js 里 MODE 切换）：
 *  - 'mock'  : 无需后端，本地返回假数据，用于先把 UI/流程跑通
 *  - 'api'   : 调你自己的后端服务（服务端再调多模态大模型，Key 不落小程序）
 *
 * API 模式约定（你后端要实现的两个接口）：
 *  POST /grade  body: { images: [base64...] }  → 返回 PRD §5.2 的批改 JSON
 *  POST /chat   body: { history: [{role, content}] } → 返回 { reply }
 */
const config = require('./config');
const knowledge = require('./knowledge');

/* ---------- Prompt 定义 ---------- */

const GRADE_SYSTEM_PROMPT = `你是一位小学数学批改老师。用户会上传人教版五年级上册数学作业/试卷照片。
请逐题识别并批改，严格输出 JSON（不要输出其他文字），格式：
{
  "items": [
    {
      "no": "题号",
      "questionText": "识别出的题目文本（手写答案部分原样描述）",
      "kidAnswer": "孩子的作答（无作答则为空字符串）",
      "correctAnswer": "正确答案",
      "isCorrect": true/false,
      "knowledgePoint": "知识点标签，必须从下面的清单中选",
      "confidence": 0.0-1.0 的批改置信度
    }
  ]
}
知识点清单：${knowledge.units.map(u => u.name + '：' + u.points.join('、')).join('；')}
要求：题目按题号完整覆盖，不遗漏；看不清或不确定时 isCorrect 判 false 且 confidence 降低。`;

const TUTOR_SYSTEM_PROMPT = `你是一位面向 10 岁孩子的数学辅导老师，正在辅导一道错题。
铁律：
1. 永远不要说出最终完整答案或最终计算结果；
2. 每次回复不超过 3 句话，以一个引导性提问结尾；
3. 每次只引导一小步（先让孩子复述题意/找到已知条件/指出卡住的步骤）；
4. 语言要鼓励、具体，用小学五年级学生能听懂的话；
5. 孩子说"我会了"时，出一道同类型的简短口算/口答题验证，若答对就表扬并说"订正通过"。`;

/* ---------- Mock 实现 ---------- */

function mockGradeResult() {
  return {
    items: [
      {
        no: '1',
        questionText: '用竖式计算 53.06 + 9.75',
        kidAnswer: '62.71',
        correctAnswer: '62.81',
        isCorrect: false,
        knowledgePoint: '8 总复习（含计算综合）：小数四则混合运算',
        confidence: 0.92
      },
      {
        no: '2',
        questionText: '5.33 + 4.68',
        kidAnswer: '10.01',
        correctAnswer: '10.01',
        isCorrect: true,
        knowledgePoint: '8 总复习（含计算综合）：小数四则混合运算',
        confidence: 0.95
      },
      {
        no: '3',
        questionText: '42.58 - 5.76',
        kidAnswer: '',
        correctAnswer: '36.82',
        isCorrect: false,
        knowledgePoint: '8 总复习（含计算综合）：小数四则混合运算',
        confidence: 0.6
      }
    ]
  };
}

function mockChatReply() {
  return '我们先把题目读一遍：这道题已知哪两个条件，要求的又是什么呢？';
}

/* ---------- 对外接口 ---------- */

/** 批改：images 为本地图片路径数组，返回统一结构 { items } */
async function grade(images) {
  if (config.MODE === 'mock') {
    await _delay(600);
    return mockGradeResult();
  }
  const bases = await Promise.all(images.map(_toBase64));
  const res = await _post('/grade', { images: bases });
  return res;
}

/**
 * 讲解对话：history = [{ role: 'user'|'assistant', content }]
 * wrongItem 为当前错题上下文；返回 { reply }
 */
async function chat(history, wrongItem) {
  if (config.MODE === 'mock') {
    await _delay(400);
    return { reply: mockChatReply() };
  }
  const sys = TUTOR_SYSTEM_PROMPT + `\n当前错题：${JSON.stringify(wrongItem)}`;
  const res = await _post('/chat', {
    messages: [{ role: 'system', content: sys }, ...history]
  });
  return res;
}

/* ---------- 内部工具 ---------- */

function _delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function _post(path, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.API_BASE}${path}`,
      method: 'POST',
      data,
      timeout: 60000,
      success: r => (r.statusCode === 200 ? resolve(r.data) : reject(new Error(`HTTP ${r.statusCode}`))),
      fail: reject
    });
  });
}

function _toBase64(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: r => resolve(r.data),
      fail: reject
    });
  });
}

module.exports = {
  GRADE_SYSTEM_PROMPT,
  TUTOR_SYSTEM_PROMPT,
  grade,
  chat
};
