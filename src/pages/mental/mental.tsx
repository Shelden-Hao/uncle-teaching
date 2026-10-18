import { useState } from 'react'
import { View, Text, Input, Button, Progress } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { generateMentalQuestions, type MentalQuestion } from '../../utils/mental'
import { saveWrongQuestions, recordStudy } from '../../utils/store'
import './mental.scss'

const TOTAL = 10
const SECONDS = 120

interface Result {
  q: MentalQuestion
  userAnswer: string
  correct: boolean
}

export default function Mental() {
  const [phase, setPhase] = useState<'idle' | 'running' | 'result'>('idle')
  const [questions, setQuestions] = useState<MentalQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [secondsLeft, setSecondsLeft] = useState(SECONDS)
  const [startedAt, setStartedAt] = useState(0)

  function start() {
    const qs = generateMentalQuestions(TOTAL)
    setQuestions(qs)
    setIdx(0)
    setInput('')
    setResults([])
    setSecondsLeft(SECONDS)
    setStartedAt(Date.now())
    setPhase('running')
    tick()
  }

  function tick() {
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer)
          finish(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  function finish(timeout = false) {
    // 剩余未答的题记为空
    setPhase('result')
    const elapsed = Math.round((Date.now() - startedAt) / 1000)
    const answered = results.length
    const unanswered = questions.slice(answered).map((q) => ({ q, userAnswer: '', correct: false }))
    const all = [...results, ...unanswered]
    setResults(all)
    recordStudy(all.length)

    // 错题进错题本（形成与小猿口算差异化的闭环）
    const wrongs = all.filter((r) => !r.correct)
    if (wrongs.length) {
      saveWrongQuestions(
        `mental-${Date.now()}`,
        wrongs.map((r) => ({
          no: String(r.q.text),
          questionText: r.q.text.replace(' = ?', ''),
          kidAnswer: r.userAnswer || '（超时未答）',
          correctAnswer: String(r.q.answer),
          knowledgePoint: `口算练习：${r.q.type}`,
          aiConfidence: 1
        }))
      )
    }

    const score = all.filter((r) => r.correct).length
    Taro.showToast({
      title: timeout ? `时间到！答对 ${score} 题` : `完成！答对 ${score} 题，用时 ${elapsed} 秒`,
      icon: 'none',
      duration: 2500
    })
  }

  function submit() {
    const q = questions[idx]
    const userAnswer = input.trim()
    const correct = userAnswer !== '' && Math.abs(Number(userAnswer) - q.answer) < 0.001
    const next = [...results, { q, userAnswer, correct }]
    setResults(next)
    setInput('')

    if (idx + 1 >= questions.length) {
      setPhase('result')
      setResults(next)
      recordStudy(questions.length)
      const score = next.filter((r) => r.correct).length
      const elapsed = Math.round((Date.now() - startedAt) / 1000)
      if (next.some((r) => !r.correct)) {
        saveWrongQuestions(
          `mental-${Date.now()}`,
          next.filter((r) => !r.correct).map((r) => ({
            no: String(r.q.text),
            questionText: r.q.text.replace(' = ?', ''),
            kidAnswer: r.userAnswer || '（未答）',
            correctAnswer: String(r.q.answer),
            knowledgePoint: `口算练习：${r.q.type}`,
            aiConfidence: 1
          }))
        )
      }
      Taro.showToast({ title: `完成！答对 ${score} 题，用时 ${elapsed} 秒`, icon: 'none', duration: 2500 })
    } else {
      setIdx(idx + 1)
    }
  }

  if (phase === 'idle') {
    return (
      <View className="mental">
        <View className="card intro">
          <View className="i-title">⚡ 口算挑战</View>
          <Text className="i-desc">{TOTAL} 道题 · {SECONDS} 秒限时 · 答错的自动进错题本</Text>
          <Button className="btn-primary" onClick={start}>开始挑战</Button>
        </View>
      </View>
    )
  }

  if (phase === 'running') {
    const q = questions[idx]
    return (
      <View className="mental">
        <View className="hud">
          <Text className="hud-item">{idx + 1}/{TOTAL}</Text>
          <Text className="hud-item warn">⏱ {secondsLeft}s</Text>
        </View>
        <Progress percent={((idx) / TOTAL) * 100} strokeWidth={4} activeColor="#FF8A3C" />
        <View className="card q-card">
          <Text className="q-text">{q.text}</Text>
          <Input
            className="a-input"
            value={input}
            type="digit"
            focus
            onInput={(e) => setInput(e.detail.value)}
            onConfirm={submit}
            placeholder="输入答案"
          />
          <Button className="btn-primary" onClick={submit}>
            {idx + 1 >= questions.length ? '交卷' : '下一题'}
          </Button>
        </View>
      </View>
    )
  }

  // 结果页
  const right = results.filter((r) => r.correct).length
  return (
    <View className="mental">
      <View className="card result-head">
        <Text className="r-score">{right}/{results.length}</Text>
        <Text className="r-sub">答错 {results.length - right} 道已自动收进错题本</Text>
      </View>
      {results.map((r, i) => (
        <View key={i} className={`card r-item ${r.correct ? 'ok' : 'bad'}`}>
          <Text className="r-q">{r.q.text.replace(' = ?', '')} = {r.q.answer}</Text>
          <Text className="r-a">{r.correct ? '✓ 你的答案正确' : `✗ 你的答案：${r.userAnswer || '（未答）'}`}</Text>
        </View>
      ))}
      <Button className="btn-primary again" onClick={start}>再来一轮</Button>
    </View>
  )
}
