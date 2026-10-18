import { useMemo, useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { generateVariants, checkVariantAnswer, type VariantQuestion } from '../../utils/ai'
import { listWrongQuestions, retireWrongQuestion } from '../../utils/store'
import './wrong-detail.scss'

export default function WrongDetail() {
  const router = useRouter()
  const [variants, setVariants] = useState<VariantQuestion[] | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [feedback, setFeedback] = useState<Record<number, { correct: boolean; hint: string }>>({})
  const [allDone, setAllDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const wrong = useMemo(
    () => listWrongQuestions().find((w) => w.id === decodeURIComponent(router.params.id || '')),
    [router.params.id]
  )

  if (!wrong) {
    return <View className="empty">错题不存在</View>
  }

  async function startVariants() {
    setLoading(true)
    try {
      const qs = await generateVariants({
        no: wrong!.id.split('-').pop() || '',
        questionText: wrong!.questionText,
        kidAnswer: wrong!.kidAnswer,
        correctAnswer: wrong!.correctAnswer,
        isCorrect: false,
        knowledgePoint: wrong!.knowledgePoint,
        confidence: wrong!.aiConfidence
      })
      setVariants(qs)
    } finally {
      setLoading(false)
    }
  }

  async function submitVariant(q: VariantQuestion) {
    const answer = (answers[q.no] || '').trim()
    if (!answer) {
      Taro.showToast({ title: '先写出你的答案', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await checkVariantAnswer(q, answer)
      setFeedback((prev) => ({ ...prev, [q.no]: res }))
      if (res.correct) {
        // 3 道全对 → 销号
        const done = Object.values({ ...feedback, [q.no]: res }).filter((f) => f.correct).length
        if (done >= variants!.length) {
          retireWrongQuestion(wrong!.id)
          setAllDone(true)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function goTutor() {
    Taro.navigateTo({
      url: `/pages/tutor/tutor?gradingId=${wrong!.gradingId}&no=${encodeURIComponent(wrong!.id.split('-').pop() || '')}`
    })
  }

  return (
    <View className="detail">
      <View className="card">
        <View className="row">
          <Text className={`status status-${wrong.correctionStatus === '未订正' ? 'todo' : wrong.correctionStatus === '订正中' ? 'doing' : 'done'}`}>{wrong.correctionStatus}</Text>
          <Text className="date">{wrong.date}</Text>
        </View>
        <View className="q">{wrong.questionText}</View>
        {wrong.kidAnswer ? <View className="ans">当时的答案：{wrong.kidAnswer}</View> : <View className="ans">（当时空着没做）</View>}
        <View className="ans correct">正确答案：{wrong.correctAnswer}</View>
        <View className="kp">{wrong.knowledgePoint}</View>
      </View>

      <View className="card actions">
        <Button className="btn-primary" onClick={goTutor}>
          🎓 让 AI 老师再讲一遍
        </Button>
        {!variants && wrong.correctionStatus !== '订正通过' ? (
          <Button className="btn-variant" loading={loading} onClick={startVariants}>
            ✏️ 来 3 道变式题，做对就销号
          </Button>
        ) : null}
      </View>

      {allDone ? (
        <View className="card done-card">🎉 全部变式做对，这道题销号了！</View>
      ) : null}

      {variants ? (
        <View className="card variants">
          <View className="v-title">变式练习（全部做对即销号）</View>
          {variants.map((q) => (
            <View key={q.no} className="v-item">
              <View className="v-q">
                {q.no}. {q.questionText}
              </View>
              <View className="v-input">
                <Input
                  value={answers[q.no] || ''}
                  onInput={(e) => setAnswers((prev) => ({ ...prev, [q.no]: e.detail.value }))}
                  placeholder="你的答案"
                  disabled={feedback[q.no]?.correct || allDone}
                />
                <Button size="mini" disabled={feedback[q.no]?.correct || allDone} loading={loading} onClick={() => submitVariant(q)}>
                  提交
                </Button>
              </View>
              {feedback[q.no] ? (
                <View className={`v-fb ${feedback[q.no].correct ? 'ok' : 'bad'}`}>{feedback[q.no].hint}</View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}
