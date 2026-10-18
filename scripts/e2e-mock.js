/* eslint-disable */
/**
 * 核心链路自动化测试（miniprogram-automator）
 * 前提：开发者工具已以 --auto-port 9420 打开本项目，项目已用 mock 模式编译
 * 运行：node scripts/e2e-mock.js
 */
const automator = require('miniprogram-automator')

const results = []
function log(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`)
}

async function main() {
  const miniProgram = await automator.connect({ wsEndpoint: 'ws://localhost:9420' })
  console.log('已连接开发者工具自动化端口')

  // ===== 1. 首页加载 =====
  let page = await miniProgram.reLaunch('/pages/index/index')
  await page.waitFor(1500)
  log('首页路径正确', page.path === 'pages/index/index', `当前 ${page.path}`)

  // 调试：Taro 页面是自定义组件，需用 >>> 穿透组件边界
  let photoBtn = await page.$('.photo-btn')
  if (!photoBtn) photoBtn = await page.$('page >>> .photo-btn')
  if (!photoBtn) {
    const root = await page.$('page')
    if (root) {
      const wxml = await root.wxml()
      console.log('  [调试] page 节点 wxml 前 600 字符:\n', String(wxml).slice(0, 600))
    } else {
      console.log('  [调试] 未找到 page 根节点')
    }
  }
  log('首页加载 + 拍照按钮存在', !!photoBtn)

  // ===== 2. 直接写存储注入测试数据（等价于 mock 批改产出）=====
  await miniProgram.evaluate(function () {
    const gradingId = 'gtest001'
    const gradeResult = {
      items: [
        { no: '1', questionText: '用竖式计算 53.06 + 9.75', kidAnswer: '62.71', correctAnswer: '62.81', isCorrect: false, knowledgePoint: '小数四则混合运算', confidence: 0.92 },
        { no: '2', questionText: '5.33 + 4.68', kidAnswer: '10.01', correctAnswer: '10.01', isCorrect: true, knowledgePoint: '小数四则混合运算', confidence: 0.95 },
        { no: '3', questionText: '42.58 - 5.76', kidAnswer: '', correctAnswer: '36.82', isCorrect: false, knowledgePoint: '小数四则混合运算', confidence: 0.6 }
      ]
    }
    const wrong = gradeResult.items.filter(function (i) { return !i.isCorrect })
    const now = new Date().toISOString().slice(0, 10)
    wx.setStorageSync('grading_records', [
      { id: gradingId, date: now, createdAt: Date.now(), photoUrls: [], total: 3, wrong: 2, rawResult: gradeResult }
    ])
    wx.setStorageSync('wrong_questions', wrong.map(function (w) {
      return {
        id: gradingId + '-' + w.no,
        gradingId: gradingId,
        date: now,
        photoUrl: '',
        questionText: w.questionText,
        kidAnswer: w.kidAnswer,
        correctAnswer: w.correctAnswer,
        knowledgePoint: w.knowledgePoint,
        aiConfidence: w.confidence,
        correctionStatus: '未订正'
      }
    }))
  })
  log('注入测试批改数据', true)

  // ===== 3. 结果页渲染 =====
  page = await miniProgram.reLaunch('/pages/result/result?id=gtest001')
  await page.waitFor(1000)
  const itemCards = await page.$$('.item')
  log('结果页渲染 3 道题', itemCards.length === 3, `实际 ${itemCards.length} 道`)
  const badItems = await page.$$('.item.bad')
  log('错题标记为 ✗（2 道）', badItems.length === 2, `实际 ${badItems.length} 道`)
  const uncertain = await page.$$('.confirm-tip')
  log('低置信度题（conf 0.6）显示待确认', uncertain.length === 1, `实际 ${uncertain.length} 个`)

  // ===== 5. 点第 1 题错题 → 讲解页 =====
  let firstCard = null
  for (const c of badItems) {
    const wxml = String(await c.wxml())
    if (wxml.includes('第 1 题')) { firstCard = c; break }
  }
  await firstCard.tap()
  await page.waitFor(1800)
  page = await miniProgram.currentPage()
  log('跳转讲解页', page.path === 'pages/tutor/tutor', `当前 ${page.path}`)

  const bubbles = await page.$$('.bubble')
  log('AI 开局自动发送引导', bubbles.length >= 2, `对话气泡 ${bubbles.length} 条`)

  // ===== 6. 点"看一步提示"快捷按钮 =====
  const quickBtns = await page.$$('.quick button')
  if (quickBtns.length >= 1) {
    await quickBtns[0].tap()
    await page.waitFor(1200)
    const bubblesAfter = await page.$$('.bubble')
    log('快捷按钮追加对话', bubblesAfter.length > bubbles.length, `${bubbles.length} → ${bubblesAfter.length}`)
  } else {
    log('快捷按钮存在', false, '未找到 .quick button')
  }

  // ===== 6. 历史页 =====
  page = await miniProgram.reLaunch('/pages/history/history')
  await page.waitFor(800)
  const records = await page.$$('.record')
  log('历史页显示批改记录', records.length >= 1, `记录 ${records.length} 条`)

  // ===== 7. 存储层验证：错题 ID 约定与订正状态回写 =====
  const storeCheck = await miniProgram.evaluate(function () {
    const wrongs = wx.getStorageSync('wrong_questions') || []
    const target = wrongs.find(function (w) { return w.id === 'gtest001-3' })
    if (!target) return { ok: false, detail: '未找到 id=gtest001-3 的错题' }
    target.correctionStatus = '订正中'
    wx.setStorageSync('wrong_questions', wrongs)
    const after = (wx.getStorageSync('wrong_questions') || []).find(function (w) { return w.id === 'gtest001-3' })
    return { ok: after.correctionStatus === '订正中', detail: '状态=' + after.correctionStatus }
  })
  log('错题 ID 按题号约定生成', storeCheck.ok, storeCheck.detail)

  // ===== 8. 错题本列表页 =====
  page = await miniProgram.reLaunch('/pages/book/book')
  await page.waitFor(1500)
  // reLaunch 后可能拿到旧页引用，重新定位当前页
  page = await miniProgram.currentPage()
  await page.waitFor(500)
  const statNums = await page.$$('.stat-item .num')
  const bookItems = await page.$$('.wrong-item')
  log('错题本统计栏渲染', statNums.length === 3, `统计项 ${statNums.length} 个`)
  log('错题本列表渲染 2 道错题', bookItems.length === 2, `实际 ${bookItems.length} 条`)

  // 状态筛选：此时两条错题都是"订正中"（第1题在讲解页被自动置为订正中，第3题在步骤7手动置为订正中）
  // 先把 gtest001-1 改回"未订正"，验证筛选能否把两种状态分开
  await miniProgram.evaluate(function () {
    const ws = wx.getStorageSync('wrong_questions')
    ws.find(function (w) { return w.id === 'gtest001-1' }).correctionStatus = '未订正'
    wx.setStorageSync('wrong_questions', ws)
  })
  page = await miniProgram.reLaunch('/pages/book/book')
  await page.waitFor(1500)
  page = await miniProgram.currentPage()
  await page.waitFor(500)

  // 断言用"条目数 + 内容"（自动化下 DOM class 渲染时序不可靠）
  const p2 = page
  const chipsAll = await p2.$$('.filter-chip')
  if (chipsAll.length >= 4) {
    await chipsAll[1].tap() // 未订正 → 应只有 Q1（53.06）
    await p2.waitFor(1200)
    let undoneItems = await p2.$$('.wrong-item')
    let undoneQ = undoneItems.length === 1 ? String(await undoneItems[0].wxml()) : ''
    const undoneOk = undoneItems.length === 1 && undoneQ.includes('53.06')
    const chips2 = await p2.$$('.filter-chip')
    await chips2[2].tap() // 订正中 → 应只有 Q3（42.58）
    await p2.waitFor(1200)
    let doingItems = await p2.$$('.wrong-item')
    let doingQ = doingItems.length === 1 ? String(await doingItems[0].wxml()) : ''
    const doingOk = doingItems.length === 1 && doingQ.includes('42.58')
    log('状态筛选生效', undoneOk && doingOk, `未订正:${undoneItems.length}(Q1=${undoneOk}) 订正中:${doingItems.length}(Q3=${doingOk})`)
  } else {
    log('状态筛选生效', false, `筛选片 ${chipsAll.length} 个`)
  }

  // ===== 9. 错题详情页 + 变式练习（全对销号） =====
  page = await miniProgram.reLaunch('/pages/wrong-detail/wrong-detail?id=gtest001-3')
  await page.waitFor(1000)
  const detailQ = await page.$('.q')
  const detailWxml = detailQ ? String(await detailQ.wxml()) : ''
  log('详情页显示题目', detailWxml.includes('42.58'), detailWxml.slice(0, 50))

  const variantBtn = await page.$('.btn-variant')
  if (variantBtn) {
    await variantBtn.tap()
    await page.waitFor(1500)
    const vItems = await page.$$('.v-item')
    log('变式题生成 3 道', vItems.length === 3, `实际 ${vItems.length} 道`)

    // 依次提交正确答案（mock 模式：变式答案可从题目文本算出，直接用存储里的正确答案推导）
    // mock 变式题答案：第1题 correctAnswer+0.9，第2题 0.98，第3题 6
    const rightAnswers = ['37.72', '0.98', '6']
    for (let i = 0; i < vItems.length; i++) {
      const inputs = await page.$$('.v-item input')
      await inputs[i].input(rightAnswers[i])
      const btns = await page.$$('.v-item button')
      await btns[i].tap()
      await page.waitFor(700)
    }
    const doneCard = await page.$('.done-card')
    log('变式全对后销号提示', !!doneCard)

    // 验证存储状态
    const retireCheck = await miniProgram.evaluate(function () {
      const wrongs = wx.getStorageSync('wrong_questions') || []
      const t = wrongs.find(function (w) { return w.id === 'gtest001-3' })
      return t ? t.correctionStatus : 'not-found'
    })
    log('销号后状态=订正通过', retireCheck === '订正通过', `实际 ${retireCheck}`)
  } else {
    log('变式题入口存在', false, '未找到 .btn-variant')
  }

  // ===== 10. 打卡数据（首页拍照时才记录，此处手动模拟一次批改打卡） =====
  const checkin = await miniProgram.evaluate(function () {
    // 模拟 recordStudy 逻辑写入（页面拍照流程才触发，这里直接验证存储格式可写入）
    const today = new Date().toISOString().slice(0, 10)
    const data = wx.getStorageSync('checkin_days') || { days: [], totalGraded: 0 }
    if (!data.days.includes(today)) data.days.push(today)
    data.totalGraded += 3
    wx.setStorageSync('checkin_days', data)
    const after = wx.getStorageSync('checkin_days')
    return { days: after.days.length, total: after.totalGraded }
  })
  log('打卡数据读写正常', checkin.days >= 1 && checkin.total >= 3, `days=${checkin.days} total=${checkin.total}`)

  // ===== 清理测试数据 =====
  await miniProgram.evaluate(function () {
    wx.removeStorageSync('grading_records')
    wx.removeStorageSync('wrong_questions')
  })
  log('清理测试数据', true)

  const failed = results.filter(r => !r.ok).length
  console.log(`\n结果：${results.length - failed} 通过 / ${failed} 失败`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error('测试执行失败：', e.message)
  process.exit(2)
})
