/**
 * 本地存储层：批改记录 + 错题记录（MVP 单用户，用 Taro 存储 API，双端通用）
 * 表结构对应 PRD §7：grading_record / wrong_question
 */
import Taro from '@tarojs/taro'

const KEY_GRADING = 'grading_records' // 批改记录列表（新在前）
const KEY_WRONG = 'wrong_questions' // 错题记录列表（新在前）

export type CorrectionStatus = '未订正' | '订正中' | '订正通过'

export interface WrongQuestion {
  id: string
  gradingId: string
  date: string
  photoUrl: string
  questionText: string
  kidAnswer: string
  correctAnswer: string
  knowledgePoint: string
  errorType?: string
  aiConfidence: number
  correctionStatus: CorrectionStatus
}

export interface GradingRecord {
  id: string
  date: string
  createdAt: number
  photoUrls: string[]
  total: number
  wrong: number
  rawResult: { items: unknown[] }
}

function getList<T>(key: string): T[] {
  return (Taro.getStorageSync(key) as T[]) || []
}

function setList<T>(key: string, list: T[]): void {
  Taro.setStorageSync(key, list)
}

/* ---------- 批改记录 ---------- */

export function saveGradingRecord(record: GradingRecord): GradingRecord {
  const list = getList<GradingRecord>(KEY_GRADING)
  list.unshift(record)
  setList(KEY_GRADING, list)
  return record
}

export function listGradingRecords(): GradingRecord[] {
  return getList<GradingRecord>(KEY_GRADING)
}

export function getGradingRecord(id: string): GradingRecord | null {
  return listGradingRecords().find((r) => r.id === id) || null
}

/* ---------- 错题记录 ---------- */

export function saveWrongQuestions(gradingId: string, wrongList: (Omit<WrongQuestion, 'id' | 'gradingId' | 'date' | 'photoUrl' | 'correctionStatus'> & { no: string })[]): void {
  const list = getList<WrongQuestion>(KEY_WRONG)
  const date = new Date().toISOString().slice(0, 10)
  wrongList.forEach((w) => {
    list.unshift({
      // ID 约定：gradingId + 题号，tutor 页按同样约定回写订正状态
      id: `${gradingId}-${w.no}`,
      gradingId,
      date,
      photoUrl: '',
      correctionStatus: '未订正',
      ...w
    } as WrongQuestion)
  })
  setList(KEY_WRONG, list)
}

export function listWrongQuestions(): WrongQuestion[] {
  return getList<WrongQuestion>(KEY_WRONG)
}

export function updateWrongStatus(id: string, status: CorrectionStatus): void {
  const list = getList<WrongQuestion>(KEY_WRONG)
  const item = list.find((w) => w.id === id)
  if (item) {
    item.correctionStatus = status
    setList(KEY_WRONG, list)
  }
}

/* ---------- 图片缓存清理 ---------- */

export function cleanOldPhotos(days: number): void {
  const deadline = Date.now() - days * 24 * 3600 * 1000
  const list = listGradingRecords().filter((r) => r.createdAt >= deadline)
  setList(KEY_GRADING, list)
}
