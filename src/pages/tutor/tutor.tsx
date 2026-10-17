import { useRef, useState } from 'react'
import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { chat, type ChatMessage, type GradeItem } from '../../utils/ai'
import { getGradingRecord, updateWrongStatus } from '../../utils/store'
import './tutor.scss'

interface Bubble extends ChatMessage {
  id: string
}

export default function Tutor() {
  const router = useRouter()
  const [messages, setMessages] = useState<Bubble[]>([])
  const [inputValue, setInputValue] = useState('')
  const [scrollInto, setScrollInto] = useState('')
  const wrongItemRef = useRef<GradeItem | null>(null)
  const wrongIdRef = useRef('')
  const initializedRef = useRef(false)

  if (!initializedRef.current) {
    initializedRef.current = true
    const record = getGradingRecord(router.params.gradingId || '')
    const no = decodeURIComponent(router.params.no || '')
    const item = record && ((record.rawResult as { items: GradeItem[] }).items || []).find((i) => i.no === no)
    if (item) {
      wrongItemRef.current = item
      wrongIdRef.current = `${record.id}-${item.no}`
      // 讲解开局：AI 先给第一步提示（异步 fire-and-forget）
      setTimeout(() => {
        send([
          `AI 老师，第 ${item.no} 题我做错了，题目是：${item.questionText}。我的答案是 ${
            item.kidAnswer || '（空着没做）'
          }，请引导我一步一步搞懂。`
        ])
      }, 0)
    } else {
      Taro.showToast({ title: '题目不存在', icon: 'none' })
    }
  }

  function push(role: ChatMessage['role'], content: string) {
    setMessages((prev) => {
      const next = [...prev, { role, content, id: `m${Date.now()}${prev.length}` }]
      setTimeout(() => setScrollInto(`bubble-${next.length - 1}`), 50)
      return next
    })
  }

  async function send(userTexts: string[]) {
    const history: ChatMessage[] = [...messages.map((m) => ({ role: m.role, content: m.content }))]
    for (const text of userTexts) {
      history.push({ role: 'user', content: text })
      push('user', text)
    }
    Taro.showLoading({ title: '老师思考中…' })
    try {
      const res = await chat(history, wrongItemRef.current!)
      Taro.hideLoading()
      push('assistant', res.reply)
      updateWrongStatus(wrongIdRef.current, '订正中')
    } catch {
      Taro.hideLoading()
      push('assistant', '哎呀，老师走神了，再点一次试试？')
    }
  }

  function onSend() {
    const v = inputValue.trim()
    if (!v) return
    send([v])
  }

  function onQuick(type: 'hint' | 'rephrase' | 'done') {
    const map = { hint: '看一步提示', rephrase: '换个说法讲讲', done: '我会了！' }
    send([map[type]])
  }

  return (
    <View className="tutor-page">
      <ScrollView className="chat" scrollY scrollIntoView={scrollInto} scrollWithAnimation>
        {messages.map((m, i) => (
          <View key={m.id} id={`bubble-${i}`} className={`bubble-wrap ${m.role === 'user' ? 'me' : ''}`}>
            <View className="bubble">{m.content}</View>
          </View>
        ))}
        {messages.length === 0 ? <Text className="loading-hint">AI 老师正在看你的错题…</Text> : null}
      </ScrollView>

      <View className="quick">
        <Button size="mini" onClick={() => onQuick('hint')}>
          看一步提示
        </Button>
        <Button size="mini" onClick={() => onQuick('rephrase')}>
          换个说法
        </Button>
        <Button size="mini" className="done" onClick={() => onQuick('done')}>
          我会了！
        </Button>
      </View>

      <View className="input-bar">
        <Input
          value={inputValue}
          onInput={(e) => setInputValue(e.detail.value)}
          onConfirm={onSend}
          confirmType="send"
          placeholder="输入你的想法…"
        />
        <Button size="mini" onClick={onSend}>
          发送
        </Button>
      </View>
    </View>
  )
}
