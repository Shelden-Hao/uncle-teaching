import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useMemo, useState } from 'react'
import { getGradingRecord } from '../../utils/store'
import type { GradeItem } from '../../utils/ai'
import './result.scss'

export default function Result() {
  const router = useRouter()
  // 用户点"确认"后移除题干序号，使该题恢复可点击
  const [confirmedNos, setConfirmedNos] = useState<string[]>([])

  const record = useMemo(() => getGradingRecord(router.params.id || ''), [router.params.id])

  const items = useMemo(() => {
    if (!record) return []
    return ((record.rawResult as { items: GradeItem[] }).items || []).map((it) => ({
      ...it,
      statusText: it.isCorrect ? '✓' : '✗',
      // AI 置信度低的错题需人工核对后才能进入讲解
      needConfirm: !it.isCorrect && it.confidence < 0.7 && !confirmedNos.includes(it.no)
    }))
  }, [record, confirmedNos])

  if (!record) {
    return <View className="empty">记录不存在</View>
  }

  /** 点错题 → 进入讲解 */
  function onTapItem(no: string, isCorrect: boolean) {
    if (isCorrect) {
      Taro.showToast({ title: '这题做对啦', icon: 'success' })
      return
    }
    Taro.navigateTo({ url: `/pages/tutor/tutor?gradingId=${record!.id}&no=${encodeURIComponent(no)}` })
  }

  return (
    <View>
      <View className="summary card">
        共批改 {record.total} 题，错 {record.wrong} 题
        {record.wrong === 0 ? <Text className="cheer">全部正确，太棒了！🎉</Text> : null}
      </View>

      {items.map((item) => (
        <View
          key={item.no}
          className={`card item ${item.isCorrect ? 'ok' : 'bad'} ${item.needConfirm ? 'uncertain' : ''}`}
          onClick={() => onTapItem(item.no, item.isCorrect)}
        >
          <View className="row">
            <View className="mark">{item.statusText}</View>
            <View className="no">第 {item.no} 题</View>
            {!item.isCorrect ? <View className="kp">{item.knowledgePoint}</View> : null}
          </View>
          <View className="q">{item.questionText}</View>
          {item.kidAnswer ? <View className="ans">你的答案：{item.kidAnswer}</View> : null}
          {!item.isCorrect ? <View className="ans correct">正确答案：{item.correctAnswer}</View> : null}

          {item.needConfirm ? (
            <View className="confirm-tip">
              <Text>AI 不太确定这题，点开讲一讲时老师会先和你核对</Text>
            </View>
          ) : null}

          {!item.isCorrect ? <View className="tap-hint">点这里让 AI 老师讲讲 →</View> : null}
        </View>
      ))}
    </View>
  )
}
