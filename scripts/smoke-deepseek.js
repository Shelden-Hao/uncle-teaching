/* eslint-disable */
/**
 * DeepSeek 真实调用冒烟测试（Node 环境，验证 Prompt 质量）
 * 运行：node scripts/smoke-deepseek.js
 * 不需要小程序，直接验证 AI 返回质量与 JSON 稳定性
 */
const KEY = require('../src/utils/secret.example.ts') // 占位，下面直接内联读取真实 key

// 从 secret.ts 读 key（Node 不能直接 require TS，手动解析）
const fs = require('fs')
const secretSrc = fs.readFileSync(__dirname + '/../src/utils/secret.ts', 'utf8')
const m = secretSrc.match(/DEEPSEEK_API_KEY\s*=\s*'([^']+)'/)
const API_KEY = m && !m[1].includes('你的') ? m[1] : null

if (!API_KEY) {
  console.error('secret.ts 中没有有效的 API Key')
  process.exit(1)
}

const BASE = 'https://api.deepseek.com'

async function chat(model, messages, jsonMode = true) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      max_tokens: 2000,
      temperature: 0.3
    })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return data.choices[0].message.content
}

function extractJson(text) {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const s = cleaned.indexOf('{')
  const e = cleaned.lastIndexOf('}')
  return JSON.parse(cleaned.slice(s, e + 1))
}

async function main() {
  const results = []
  const log = (name, ok, detail = '') => {
    results.push(ok)
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`)
  }

  // ===== 测试 1：讲解对话（deepseek-chat，验证引导式讲解铁律） =====
  console.log('\n[1] 讲解对话铁律测试...')
  const wrongItem = {
    no: '1',
    questionText: '用竖式计算 53.06 + 9.75',
    kidAnswer: '62.71',
    correctAnswer: '62.81',
    knowledgePoint: '小数加法'
  }
  const tutorSys = `你是一位面向 10 岁孩子的数学辅导老师，正在辅导一道错题。
铁律：
1. 永远不要说出最终完整答案或最终计算结果；
2. 每次回复不超过 3 句话，以一个引导性提问结尾；
3. 每次只引导一小步；
4. 语言要鼓励、具体，用小学五年级学生能听懂的话；
5. 孩子说"我会了"时，出一道同类型的简短口算/口答题验证，若答对就表扬并说"订正通过"。
当前错题：${JSON.stringify(wrongItem)}`
  const reply1 = await chat('deepseek-chat', [
    { role: 'system', content: tutorSys },
    { role: 'user', content: `AI 老师，第 1 题我做错了，题目是：${wrongItem.questionText}。我的答案是 ${wrongItem.kidAnswer}，请引导我一步一步搞懂。` }
  ], false)
  const noLeak = !reply1.includes('62.81')
  const hasQuestion = /[？?]\s*$/.test(reply1.trim())
  const short = reply1.length <= 150
  log('讲解不给最终答案', noLeak, reply1.slice(0, 80))
  log('讲解以提问结尾', hasQuestion)
  log('讲解简短（≤150字符）', short, `${reply1.length} 字符`)

  // ===== 测试 2：变式题生成 =====
  console.log('\n[2] 变式题生成测试...')
  const vReply = await chat('deepseek-chat', [
    { role: 'system', content: `你是小学数学出题老师。基于下面的错题，生成 3 道考查同一知识点、难度相近但不雷同的变式题。
只输出 JSON：{"items":[{"no":1,"questionText":"...","correctAnswer":"...","knowledgePoint":"..."}]}
错题：${JSON.stringify(wrongItem)}` },
    { role: 'user', content: '请生成变式题。' }
  ])
  const variants = extractJson(vReply).items
  log('变式题生成 3 道', variants.length === 3, `实际 ${variants.length}`)
  log('变式题字段完整', variants.every(v => v.questionText && v.correctAnswer))
  const notSame = variants.every(v => v.questionText !== wrongItem.questionText)
  log('变式题不与原题雷同', notSame)

  // ===== 测试 3：判答 =====
  console.log('\n[3] 变式判答测试...')
  const q1 = variants[0]
  const check = async (answer) => {
    const r = await chat('deepseek-chat', [
      { role: 'system', content: `你是小学数学老师。判定学生答案是否正确。
题目：${JSON.stringify(q1)}
学生答案：${answer}
只输出 JSON：{"correct":true/false,"hint":"一句话反馈"}` },
      { role: 'user', content: '请判定。' }
    ])
    return extractJson(r)
  }
  // 数值正确答案（从生成结果算）
  const numeric = q1.correctAnswer.toString().replace(/[^0-9.\-]/g, '')
  const right = await check(numeric)
  const wrong = await check('0')
  log('正确答案判定为对', right.correct === true, `hint: ${right.hint.slice(0, 40)}`)
  log('错误答案判定为错', wrong.correct === false, `hint: ${wrong.hint.slice(0, 40)}`)

  // ===== 测试 4：批改（文本模拟——vision 模型无法在此测试，验证 JSON 结构与知识点评定） =====
  console.log('\n[4] 批改 JSON 结构测试（文本输入模拟）...')
  const gradeReply = await chat('deepseek-chat', [
    { role: 'system', content: `你是一位小学数学批改老师。用户会描述作业题与孩子作答。
请逐题批改，严格输出 JSON：{"items":[{"no":"题号","questionText":"题目","kidAnswer":"孩子答案","correctAnswer":"正确答案","isCorrect":true/false,"knowledgePoint":"知识点","confidence":0.0-1.0}]}
知识点必须从清单选：${['小数加法', '小数减法', '小数乘法', '小数除法', '简算'].join('、')}` },
    { role: 'user', content: '第1题：用竖式计算 53.06 + 9.75，孩子算出 62.71。第2题：5.33 + 4.68，孩子算出 10.01。' }
  ])
  const gradeResult = extractJson(gradeReply)
  log('批改返回 items 数组', Array.isArray(gradeResult.items) && gradeResult.items.length === 2, `${(gradeResult.items || []).length} 题`)
  log('批改判定第1题为错', gradeResult.items?.[0]?.isCorrect === false)
  log('批改判定第2题为对', gradeResult.items?.[1]?.isCorrect === true)
  log('批改字段含知识点', !!gradeResult.items?.[0]?.knowledgePoint)

  const pass = results.filter(Boolean).length
  console.log(`\n冒烟结果：${pass}/${results.length} 通过`)
  process.exit(pass === results.length ? 0 : 1)
}

main().catch(e => { console.error('冒烟失败:', e.message); process.exit(2) })
