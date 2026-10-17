import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { listGradingRecords } from '../../utils/store'
import './history.scss'

export default function History() {
  const records = listGradingRecords().map((r) => ({
    ...r,
    summary: `共 ${r.total} 题 · 错 ${r.wrong} 题`
  }))

  function onTapRecord(id: string) {
    Taro.navigateTo({ url: `/pages/result/result?id=${id}` })
  }

  return (
    <View>
      {records.length === 0 ? <View className="empty">还没有批改记录，去拍一拍吧！</View> : null}
      {records.map((r) => (
        <View key={r.id} className="card record" onClick={() => onTapRecord(r.id)}>
          <View className="date">{r.date}</View>
          <View className="summary">
            <Text>{r.summary}</Text>
          </View>
          <View className="arrow">›</View>
        </View>
      ))}
    </View>
  )
}
