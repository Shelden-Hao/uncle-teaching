import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { listWrongQuestions, type WrongQuestion } from '../../utils/store'
import './book.scss'

type Filter = 'all' | '未订正' | '订正中' | '订正通过'

export default function Book() {
  const [wrongs, setWrongs] = useState<WrongQuestion[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  useDidShow(() => {
    setWrongs(listWrongQuestions())
  })

  // 筛选变化时也要立即重读（useDidShow 在同页 setData 后不触发）
  const filtered = wrongs.filter((w) => filter === 'all' || w.correctionStatus === filter)
  const retired = wrongs.filter((w) => w.correctionStatus === '订正通过').length

  function changeFilter(f: Filter) {
    setFilter(f)
    setWrongs(listWrongQuestions())
  }

  function onTapItem(id: string) {
    Taro.navigateTo({ url: `/pages/wrong-detail/wrong-detail?id=${encodeURIComponent(id)}` })
  }

  return (
    <View className="book">
      <View className="report-entry card" onClick={() => Taro.navigateTo({ url: '/pages/report/report' })}>
        <Text className="re-title">📊 学情报告</Text>
        <Text className="re-sub">掌握度 · 周趋势 · 给家长的建议</Text>
        <Text className="re-arrow">›</Text>
      </View>

      <View className="stat-bar card">
        <View className="stat-item">
          <Text className="num">{wrongs.length}</Text>
          <Text className="label">累计错题</Text>
        </View>
        <View className="stat-item">
          <Text className="num done">{retired}</Text>
          <Text className="label">已销号</Text>
        </View>
        <View className="stat-item">
          <Text className="num warn">{wrongs.length - retired}</Text>
          <Text className="label">待攻克</Text>
        </View>
      </View>

      <View className="filters">
        {(['all', '未订正', '订正中', '订正通过'] as Filter[]).map((f) => (
          <View
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => changeFilter(f)}
          >
            <Text>{f === 'all' ? '全部' : f}</Text>
          </View>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View className="empty">这里还是空的{filter !== 'all' ? '，换个分类看看' : ''}</View>
      ) : (
        filtered.map((w) => (
          <View key={w.id} className="card wrong-item" onClick={() => onTapItem(w.id)}>
            <View className="row">
              <Text className={`status status-${w.correctionStatus === '未订正' ? 'todo' : w.correctionStatus === '订正中' ? 'doing' : 'done'}`}>{w.correctionStatus}</Text>
              <Text className="date">{w.date}</Text>
            </View>
            <View className="q">{w.questionText}</View>
            <View className="kp">{w.knowledgePoint}</View>
          </View>
        ))
      )}
    </View>
  )
}
