/** 口算出题器：按人教五上进度生成题目（本地生成，零延迟零成本） */
export interface MentalQuestion {
  text: string // "3.6 + 0.75 = ?"
  answer: number
  type: string // 题型标签（进错题本用）
}

type Gen = () => MentalQuestion

const rnd = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 100) / 100

/** 生成两位小数，避免浮点误差（保留两位内） */
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100)
}

const generators: Record<string, Gen> = {
  小数加法: () => {
    const a = rnd(1, 50)
    const b = rnd(0.1, 9.9)
    return { text: `${fmt(a)} + ${fmt(b)} = ?`, answer: Math.round((a + b) * 100) / 100, type: '小数加法' }
  },
  小数减法: () => {
    const a = rnd(5, 80)
    const b = rnd(0.1, 4.9)
    return { text: `${fmt(a)} - ${fmt(b)} = ?`, answer: Math.round((a - b) * 100) / 100, type: '小数减法' }
  },
  小数乘法: () => {
    const a = rnd(2, 20)
    const b = Math.round(Math.random() * 9 + 1) / 10 // 0.1~1.0 一位小数
    return { text: `${fmt(a)} × ${fmt(b)} = ?`, answer: Math.round(a * b * 100) / 100, type: '小数乘法' }
  },
  小数除法: () => {
    const b = Math.round(Math.random() * 8 + 1) // 1~9 整数除数
    const ans = rnd(0.5, 9.9)
    const a = Math.round(b * ans * 100) / 100
    return { text: `${fmt(a)} ÷ ${b} = ?`, answer: Math.round(ans * 100) / 100, type: '小数除法' }
  },
  简算: () => {
    // a + b + c，其中 b + c 凑整
    const a = rnd(2, 30)
    const b = rnd(1, 5)
    const c = Math.round((10 - (b % 10)) * 100) / 100 // 与 b 凑整
    return {
      text: `${fmt(a)} + ${fmt(b)} + ${fmt(Math.round(c * 100) / 100)} = ?（想一想怎么算快）`,
      answer: Math.round((a + b + c) * 100) / 100,
      type: '简算'
    }
  }
}

export const MENTAL_TYPES = Object.keys(generators)

/** 随机出 n 道题（类型随机分布） */
export function generateMentalQuestions(n: number): MentalQuestion[] {
  const keys = MENTAL_TYPES
  const out: MentalQuestion[] = []
  for (let i = 0; i < n; i++) {
    out.push(generators[keys[Math.floor(Math.random() * keys.length)]]())
  }
  return out
}
