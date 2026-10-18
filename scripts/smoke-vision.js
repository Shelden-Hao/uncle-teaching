/* eslint-disable */
/**
 * 视觉批改真实测试：用真实照片调 DeepSeek 视觉模型
 * 运行：node scripts/smoke-vision.js <图片路径>
 * 可用你孩子练习册的照片（如 C:\Users\86139\.dsh\attachments\ 下的练习册图）
 */
const fs = require('fs')
const path = require('path')

// 读 key
const secretSrc = fs.readFileSync(__dirname + '/../src/utils/secret.ts', 'utf8')
const m = secretSrc.match(/DEEPSEEK_API_KEY\s*=\s*'([^']+)'/)
const API_KEY = m && !m[1].includes('你的') ? m[1] : null
if (!API_KEY) { console.error('secret.ts 无有效 key'); process.exit(1) }

const imgArg = process.argv[2]
if (!imgArg || !fs.existsSync(imgArg)) {
  console.error('用法: node scripts/smoke-vision.js <图片路径>')
  process.exit(1)
}
const ext = path.extname(imgArg).slice(1) || 'jpeg'
const b64 = fs.readFileSync(imgArg).toString('base64')
console.log(`图片: ${imgArg} (${Math.round(b64.length / 1024)} KB base64)`)

async function main() {
  const body = {
    model: 'deepseek-flash',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: `你是小学数学批改老师。请识别图中所有数学题并批改（若图中没有手写答案，把未做的题 isCorrect 判 false 且 kidAnswer 为空）。
严格输出 JSON：{"items":[{"no":"题号","questionText":"题目文本","kidAnswer":"孩子作答","correctAnswer":"正确答案","isCorrect":true/false,"knowledgePoint":"知识点","confidence":0.0-1.0}]}
知识点从清单选：小数加法、小数减法、小数乘法、小数除法、简算、其他` },
        { type: 'image_url', image_url: { url: `data:image/${ext};base64,${b64}` } }
      ]
    }],
    response_format: { type: 'json_object' },
    max_tokens: 16000,
    temperature: 0.2
  }
  console.log('调用 deepseek-vl2 批改中...')
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const err = await res.text()
    console.error(`HTTP ${res.status}: ${err.slice(0, 400)}`)
    // 模型不存在时提示
    if (res.status === 400 && err.includes('model')) console.error('→ deepseek-vl2 可能不可用，可尝试改为其他支持视觉的模型')
    process.exit(2)
  }
  const data = await res.json()
  const text = data.choices[0].message.content
  console.log(`finish: ${data.choices[0].finish_reason}, reasoning_tokens: ${data.usage?.completion_tokens_details?.reasoning_tokens || 0}`)
  if (!text || !text.trim()) {
    console.error('模型返回空内容（可能是推理模型把 token 花在了思考上），提高 max_tokens 重试')
    process.exit(2)
  }
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const s = cleaned.indexOf('{'); const e = cleaned.lastIndexOf('}')
  const parsed = JSON.parse(cleaned.slice(s, e + 1))
  console.log(`\n识别出 ${parsed.items.length} 道题：`)
  parsed.items.slice(0, 8).forEach(it => {
    console.log(`  [${it.no}] ${String(it.questionText).slice(0, 40)} | 孩子答:${String(it.kidAnswer).slice(0, 15) || '(空)'} | 正确:${it.isCorrect ? '✓' : '✗'} | 置信:${it.confidence}`)
  })
  const usage = data.usage
  console.log(`\ntokens: 输入 ${usage.prompt_tokens} + 输出 ${usage.completion_tokens}`)
}
main().catch(e => { console.error('失败:', e.message); process.exit(2) })
