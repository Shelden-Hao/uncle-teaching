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

/** 错题销号：变式全部做对后调用；销号即"订正通过" */
export function retireWrongQuestion(id: string): void {
  updateWrongStatus(id, '订正通过')
}

/** 错题统计：按知识点聚合并计算掌握度（销号率） */
export interface KnowledgeStat {
  knowledgePoint: string
  total: number
  retired: number
  mastery: number // 0-100
}

export function getKnowledgeStats(): KnowledgeStat[] {
  const wrongs = listWrongQuestions()
  const map = new Map<string, { total: number; retired: number }>()
  wrongs.forEach((w) => {
    const key = w.knowledgePoint || '未分类'
    const entry = map.get(key) || { total: 0, retired: 0 }
    entry.total += 1
    if (w.correctionStatus === '订正通过') entry.retired += 1
    map.set(key, entry)
  })
  return Array.from(map.entries())
    .map(([knowledgePoint, v]) => ({
      knowledgePoint,
      total: v.total,
      retired: v.retired,
      mastery: v.total ? Math.round((v.retired / v.total) * 100) : 0
    }))
    .sort((a, b) => a.mastery - b.mastery) // 最薄弱的排最前
}

/* ---------- 学习打卡（激励体系数据层） ---------- */

const KEY_CHECKIN = 'checkin_days'

export interface CheckinData {
  days: string[] // YYYY-MM-DD 列表
  totalGraded: number // 累计批改题数
}

function getCheckin(): CheckinData {
  return (Taro.getStorageSync(KEY_CHECKIN) as CheckinData) || { days: [], totalGraded: 0 }
}

/** 记录一次学习（当天算打卡日）；totalGradedDelta 为本次批改题数 */
export function recordStudy(totalGradedDelta: number): void {
  const data = getCheckin()
  const today = new Date().toISOString().slice(0, 10)
  if (!data.days.includes(today)) {
    data.days.push(today)
    data.days.sort()
  }
  data.totalGraded += totalGradedDelta
  Taro.setStorageSync(KEY_CHECKIN, data)
}

export function getCheckinData(): CheckinData {
  return getCheckin()
}

/** 连续打卡天数（含今天或昨天截止） */
export function getStreak(): number {
  const days = getCheckin().days
  if (!days.length) return 0
  const set = new Set(days)
  let streak = 0
  const d = new Date()
  // 今天没学不打断连击，从昨天开始数
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1)
  while (set.has(d.toISOString().slice(0, 10))) {
    streak += 1
    d.setDate(d.getDate() - 1)
  }
  return streak
}

/* ---------- 图片缓存清理 ---------- */

export function cleanOldPhotos(days: number): void {
  const deadline = Date.now() - days * 24 * 3600 * 1000
  const list = listGradingRecords().filter((r) => r.createdAt >= deadline)
  setList(KEY_GRADING, list)
}
