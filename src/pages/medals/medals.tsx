import { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import {
  getMedals, getWeekGoal, setWeekGoal, getThisWeekDays, getStreak,
  listWrongQuestions, listGradingRecords, getCheckinData, type Medal
} from '../../utils/store'
import './medals.scss'

export default function Medals() {
  const [medals, setMedals] = useState<Medal[]>([])
  const [streak, setStreak] = useState(0)
  const [weekDays, setWeekDays] = useState(0)
  const [target, setTarget] = useState(5)
  const [totalGraded, setTotalGraded] = useState(0)
  const [perfectCount, setPerfectCount] = useState(0)

  useDidShow(() => {
    setMedals(getMedals())
    setStreak(getStreak())
    setWeekDays(getThisWeekDays())
    setTarget(getWeekGoal().targetDays)
    const ck = getCheckinData()
    setTotalGraded(ck.totalGraded)
    setPerfectCount(listGradingRecords().filter((r) => r.total > 0 && r.wrong === 0).length)
  })

  const earnedCount = medals.filter((m) => m.earned).length
  const goalDone = weekDays >= target
  const weekProgress = Math.min(100, Math.round((weekDays / target) * 100))

  function adjustGoal(delta: number) {
    const next = Math.max(1, Math.min(7, target + delta))
    setTarget(next)
    setWeekGoal(next)
  }

  return (
    <View className="medals-page">
      <View className="card hero">
        <View className="streak-big">
          <Text className="streak-num">{streak}</Text>
          <Text className="streak-label">连续打卡（天）</Text>
        </View>
        <View className="hero-stats">
          <Text className="hs">累计批改 {totalGraded} 题</Text>
          <Text className="hs">满分 {perfectCount} 次</Text>
        </View>
      </View>

      <View className="card goal-card">
        <View className="goal-head">
          <Text className="goal-title">🎯 本周目标：学 {target} 天</Text>
          <View className="goal-adjust">
            <Button size="mini" onClick={() => adjustGoal(-1)}>−</Button>
            <Button size="mini" onClick={() => adjustGoal(1)}>＋</Button>
          </View>
        </View>
        <View className="goal-bar">
          <View className={`goal-fill ${goalDone ? 'done' : ''}`} style={`width: ${weekProgress}%`} />
        </View>
        <Text className="goal-status">
          本周已学 {weekDays} 天{goalDone ? '，目标达成！🎉' : `，还差 ${target - weekDays} 天`}
        </Text>
      </View>

      <View className="card section">
        <View className="sec-title">
          🏅 勋章墙（{earnedCount}/{medals.length}）
        </View>
        <View className="medal-grid">
          {medals.map((m) => (
            <View key={m.id} className={`medal ${m.earned ? 'earned' : 'locked'}`}>
              <Text className="m-icon">{m.earned ? m.icon : '🔒'}</Text>
              <Text className="m-name">{m.name}</Text>
              <Text className="m-desc">{m.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
