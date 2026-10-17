import Taro from '@tarojs/taro'
import { MODE, API_BASE } from './config'
import { KNOWLEDGE_PROMPT } from './knowledge'

/* ---------- 类型定义 ---------- */

export interface GradeItem {
  no: string
  questionText: string
  kidAnswer: string
  correctAnswer: string
  isCorrect: boolean
  knowledgePoint: string
  confidence: number
}

export interface GradeResult {
  items: GradeItem[]
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/* ---------- Prompt 定义 ---------- */

export const GRADE_SYSTEM_PROMPT = `你是一位小学数学批改老师。用户会上传人教版五年级上册数学作业/试卷照片。
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
知识点清单：${KNOWLEDGE_PROMPT}
要求：题目按题号完整覆盖，不遗漏；看不清或不确定时 isCorrect 判 false 且 confidence 降低。`

export const TUTOR_SYSTEM_PROMPT = `你是一位面向 10 岁孩子的数学辅导老师，正在辅导一道错题。
铁律：
1. 永远不要说出最终完整答案或最终计算结果；
2. 每次回复不超过 3 句话，以一个引导性提问结尾；
3. 每次只引导一小步（先让孩子复述题意/找到已知条件/指出卡住的步骤）；
4. 语言要鼓励、具体，用小学五年级学生能听懂的话；
5. 孩子说"我会了"时，出一道同类型的简短口算/口答题验证，若答对就表扬并说"订正通过"。`

/* ---------- Mock 实现 ---------- */

function mockGradeResult(): GradeResult {
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
  }
}

const MOCK_CHAT_REPLY = '我们先把题目读一遍：这道题已知哪两个条件，要求的又是什么呢？'

/* ---------- 对外接口 ---------- */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 批改：images 为本地图片路径数组 */
export async function grade(images: string[]): Promise<GradeResult> {
  if (MODE === 'mock') {
    await delay(600)
    return mockGradeResult()
  }
  const bases = await Promise.all(images.map(toBase64))
  return post<GradeResult>('/grade', { images: bases })
}

/** 讲解对话：返回 { reply } */
export async function chat(history: ChatMessage[], wrongItem: GradeItem): Promise<{ reply: string }> {
  if (MODE === 'mock') {
    await delay(400)
    return { reply: MOCK_CHAT_REPLY }
  }
  const sys: ChatMessage = {
    role: 'system',
    content: `${TUTOR_SYSTEM_PROMPT}\n当前错题：${JSON.stringify(wrongItem)}`
  }
  return post<{ reply: string }>('/chat', { messages: [sys, ...history] })
}

/* ---------- 内部工具 ---------- */

function post<T>(path: string, data: unknown): Promise<T> {
  return Taro.request({
    url: `${API_BASE}${path}`,
    method: 'POST',
    data,
    timeout: 60000
  }).then((r) => {
    if (r.statusCode === 200) return r.data as T
    throw new Error(`HTTP ${r.statusCode}`)
  })
}

function toBase64(filePath: string): Promise<string> {
  const fs = Taro.getFileSystemManager()
  return new Promise((resolve, reject) => {
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (r) => resolve(r.data as string),
      fail: reject
    })
  })
}
