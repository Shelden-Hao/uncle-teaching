import { useState } from 'react'
import { View, Text, Button, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { grade } from '../../utils/ai'
import { saveGradingRecord, saveWrongQuestions, listGradingRecords } from '../../utils/store'
import './index.scss'

export default function Index() {
  const [todayTotal, setTodayTotal] = useState(0)
  const [todayWrong, setTodayWrong] = useState(0)
  const [lastPhoto, setLastPhoto] = useState('')

  useDidShow(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayRecs = listGradingRecords().filter((r) => r.date === today)
    setTodayTotal(todayRecs.reduce((s, r) => s + r.total, 0))
    setTodayWrong(todayRecs.reduce((s, r) => s + r.wrong, 0))
  })

  /** 主入口：拍照或从相册选择（1~3 张） */
  async function takePhoto() {
    try {
      const res = await Taro.chooseMedia({
        count: 3,
        mediaType: ['image'],
        sourceType: ['camera', 'album'],
        sizeType: ['compressed']
      })
      const paths = res.tempFiles.map((f) => f.tempFilePath)
      setLastPhoto(paths[0] || '')
      Taro.showLoading({ title: 'AI 批改中…', mask: true })
      const result = await grade(paths)
      Taro.hideLoading()

      const gradingId = `g${Date.now()}`
      const items = result.items || []
      const wrong = items.filter((i) => !i.isCorrect)

      saveGradingRecord({
        id: gradingId,
        date: new Date().toISOString().slice(0, 10),
        createdAt: Date.now(),
        photoUrls: paths, // 单用户阶段临时路径即可；如需长期保留需上传
        total: items.length,
        wrong: wrong.length,
        rawResult: result
      })
      if (wrong.length) {
        saveWrongQuestions(
          gradingId,
          wrong.map((w) => ({
            no: w.no,
            questionText: w.questionText,
            kidAnswer: w.kidAnswer,
            correctAnswer: w.correctAnswer,
            knowledgePoint: w.knowledgePoint,
            aiConfidence: w.confidence
          }))
        )
      }

      Taro.navigateTo({ url: `/pages/result/result?id=${gradingId}` })
    } catch (e) {
      Taro.hideLoading()
      const msg = (e as { errMsg?: string })?.errMsg || ''
      if (msg.includes('cancel')) return
      Taro.showToast({ title: '批改失败，请重试', icon: 'none' })
    }
  }

  return (
    <View className="container">
      <View className="hero">
        <View className="hero-title">今天的数学作业写完了吗？</View>
        <View className="hero-sub">拍下来，让 AI 老师帮你检查</View>
      </View>

      {lastPhoto ? <Image className="last-photo" src={lastPhoto} mode="aspectFit" /> : null}

      <Button className="btn-primary photo-btn" onClick={takePhoto}>
        📷 拍照批改
      </Button>

      <View className="card stats">
        <View className="stat">
          <View className="num">{todayTotal}</View>
          <View className="label">今日批改</View>
        </View>
        <View className="stat">
          <View className="num warn">{todayWrong}</View>
          <View className="label">今日错题</View>
        </View>
      </View>

      <View className="tips">小贴士：照片尽量拍清楚整页，光线充足、字迹完整，AI 才看得准哦。</View>
    </View>
  )
}
