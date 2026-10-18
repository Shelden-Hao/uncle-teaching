import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { getKnowledgeStats, listWrongQuestions, listGradingRecords, getCheckinData, type KnowledgeStat, type WrongQuestion } from '../../utils/store'
import './report.scss'

interface WeekTrend {
  thisWeek: { graded: number; wrong: number }
  lastWeek: { graded: number; wrong: number }
}

export default function Report() {
  const [stats, setStats] = useState<KnowledgeStat[]>([])
  const [trend, setTrend] = useState<WeekTrend>({ thisWeek: { graded: 0, wrong: 0 }, lastWeek: { graded: 0, wrong: 0 } })
  const [checkin, setCheckin] = useState({ days: 0, totalGraded: 0 })
  const [retiredCount, setRetiredCount] = useState(0)
  const [totalWrong, setTotalWrong] = useState(0)
  const [advice, setAdvice] = useState('')

  useDidShow(() => {
    setStats(getKnowledgeStats())
    const ck = getCheckinData()
    setCheckin({ days: ck.days.length, totalGraded: ck.totalGraded })

    const wrongs: WrongQuestion[] = listWrongQuestions()
    setTotalWrong(wrongs.length)
    setRetiredCount(wrongs.filter((w) => w.correctionStatus === '订正通过').length)

    // 周趋势：以今天为终点，往前各取 7 天
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10)
    const today = now.toISOString().slice(0, 10)
    const records = listGradingRecords()
    const inRange = (r: { date: string }, from: string, to: string) => r.date >= from && r.date <= to
    const thisWeek = records.filter((r) => inRange(r, weekAgo, today))
    const lastWeek = records.filter((r) => inRange(r, twoWeeksAgo, weekAgo))
    const t = {
      thisWeek: { graded: thisWeek.reduce((s, r) => s + r.total, 0), wrong: thisWeek.reduce((s, r) => s + r.wrong, 0) },
      lastWeek: { graded: lastWeek.reduce((s, r) => s + r.total, 0), wrong: lastWeek.reduce((s, r) => s + r.wrong, 0) }
    }
    setTrend(t)

    setAdvice(buildAdvice(stats2Advice(t, getKnowledgeStats())))
  })

  const overallMastery = totalWrong ? Math.round((retiredCount / totalWrong) * 100) : 100

  return (
    <View className="report">
      <View className="card overall">
        <View className="mastery-ring">
          <Text className="mastery-num">{overallMastery}</Text>
          <Text className="mastery-unit">分</Text>
        </View>
        <View className="overall-desc">
          <Text className="title">错题攻克率</Text>
          <Text className="sub">共 {totalWrong} 道错题，已销号 {retiredCount} 道</Text>
        </View>
      </View>

      <View className="card section">
        <View className="section-title">📅 学习坚持</View>
        <View className="kv-row">
          <Text className="kv-label">累计学习</Text>
          <Text className="kv-value">{checkin.days} 天</Text>
        </View>
        <View className="kv-row">
          <Text className="kv-label">累计批改</Text>
          <Text className="kv-value">{checkin.totalGraded} 题</Text>
        </View>
        <View className="kv-row">
          <Text className="kv-label">本周批改</Text>
          <Text className="kv-value">{trend.thisWeek.graded} 题</Text>
        </View>
      </View>

      <View className="card section">
        <View className="section-title">📈 错题趋势（本周 vs 上周）</View>
        <View className="trend-row">
          <View className="trend-col">
            <Text className="trend-num">{trend.thisWeek.wrong}</Text>
            <Text className="trend-label">本周错题</Text>
          </View>
          <View className="trend-arrow">
            {trend.thisWeek.wrong < trend.lastWeek.wrong ? '↓ 减少' : trend.thisWeek.wrong > trend.lastWeek.wrong ? '↑ 增多' : '→ 持平'}
          </View>
          <View className="trend-col">
            <Text className="trend-num">{trend.lastWeek.wrong}</Text>
            <Text className="trend-label">上周错题</Text>
          </View>
        </View>
        <View className="kv-row">
          <Text className="kv-label">本周正确率</Text>
          <Text className="kv-value">
            {trend.thisWeek.graded ? Math.round(((trend.thisWeek.graded - trend.thisWeek.wrong) / trend.thisWeek.graded) * 100) : '--'}%
          </Text>
        </View>
      </View>

      <View className="card section">
        <View className="section-title">📚 知识点掌握（薄弱在前）</View>
        {stats.length === 0 ? (
          <View className="empty-line">还没有错题数据，先去拍一拍吧</View>
        ) : (
          stats.map((s) => (
            <View key={s.knowledgePoint} className="kp-row">
              <View className="kp-head">
                <Text className="kp-name">{s.knowledgePoint}</Text>
                <Text className={`kp-score ${s.mastery >= 80 ? 'good' : s.mastery >= 40 ? 'mid' : 'bad'}`}>{s.mastery}</Text>
              </View>
              <View className="bar">
                <View className={`bar-fill ${s.mastery >= 80 ? 'good' : s.mastery >= 40 ? 'mid' : 'bad'}`} style={`width: ${s.mastery}%`} />
              </View>
              <Text className="kp-sub">错 {s.total} 道 · 销号 {s.retired} 道</Text>
            </View>
          ))
        )}
      </View>

      <View className="card advice">
        <View className="section-title">💡 给家长的一句话</View>
        <Text className="advice-text">{advice}</Text>
      </View>
    </View>
  )
}

/** 生成给家长的建议（本地规则，api 模式下可换成 LLM 生成） */
function stats2Advice(t: WeekTrend, stats: KnowledgeStat[]): string {
  if (!stats.length) return '孩子刚开始使用，等第一批错题进来后，这里会给出针对性的辅导建议。'
  const weakest = stats[0]
  const parts: string[] = []
  if (t.thisWeek.graded > 0 && t.lastWeek.graded > 0) {
    const acc1 = (t.thisWeek.graded - t.thisWeek.wrong) / t.thisWeek.graded
    const acc0 = (t.lastWeek.graded - t.lastWeek.wrong) / t.lastWeek.graded
    if (acc1 > acc0) parts.push('本周正确率比上周有进步')
    else if (acc1 < acc0) parts.push('本周正确率比上周略有下滑，别给孩子压力，多鼓励')
  }
  if (weakest.mastery < 50) {
    parts.push(`「${weakest.knowledgePoint}」还很薄弱（销号率 ${weakest.mastery}%），建议抽 10 分钟陪孩子把错题本的这道题再讲一遍`)
  } else if (weakest.mastery < 100) {
    parts.push(`「${weakest.knowledgePoint}」接近掌握，继续用变式练习巩固`)
  } else {
    parts.push('所有出现过的错题都已销号，可以适当提高题目难度了')
  }
  return parts.join('；') + '。'
}

function buildAdvice(s: string): string {
  return s
}
