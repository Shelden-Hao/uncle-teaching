/* eslint-disable */
/** 口算挑战链路测试 */
const automator = require('miniprogram-automator')

const results = []
function log(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`)
}

async function main() {
  const mini = await automator.connect({ wsEndpoint: 'ws://localhost:9420' })

  // 清场
  await mini.evaluate(function () {
    wx.removeStorageSync('wrong_questions')
    wx.removeStorageSync('grading_records')
    wx.removeStorageSync('checkin_days')
  })

  let page = await mini.reLaunch('/pages/mental/mental')
  await page.waitFor(1200)
  page = await mini.currentPage()

  const introBtn = await page.$('.intro .btn-primary')
  log('口算首页存在开始按钮', !!introBtn)

  await introBtn.tap()
  await page.waitFor(800)
  page = await mini.currentPage()

  const qText = await page.$('.q-text')
  const q1 = qText ? String(await qText.wxml()) : ''
  log('出题渲染（含 = ?）', q1.includes('?'), q1.slice(0, 60))
  const hud = await page.$('.hud-item')
  log('进度 HUD 渲染', !!hud)

  // 答 3 题：第 1 题答错、第 2 题不填交卷（错）、第 3 题跳过——保证有错题入库
  for (let i = 0; i < 3; i++) {
    const input = await page.$('.a-input')
    if (i === 0) await input.input('999') // 故意错
    // 第 2、3 题留空
    const btns = await page.$('.q-card .btn-primary')
    await btns.tap()
    await page.waitFor(600)
  }

  // 直接看存储（继续答完不必要，验证前 3 题写入路径）
  // 注意：交卷逻辑在最后一题才落库；这里改用完成全部 10 题的方式太长，
  // 改为验证中途不落库 + 手动补齐剩余题目
  const midCheck = await mini.evaluate(function () {
    return (wx.getStorageSync('wrong_questions') || []).length
  })
  log('中途未交卷不落库', midCheck === 0, `当前错题 ${midCheck} 条`)

  // 快速答完剩余 7 题（全部空答，都会进错题本）
  for (let i = 0; i < 7; i++) {
    const btns = await page.$('.q-card .btn-primary')
    if (!btns) break
    await btns.tap()
    await page.waitFor(400)
  }
  await page.waitFor(1200)

  const afterCheck = await mini.evaluate(function () {
    const ws = wx.getStorageSync('wrong_questions') || []
    return {
      total: ws.length,
      mental: ws.filter(function (w) { return String(w.knowledgePoint || '').indexOf('口算练习') === 0 }).length
    }
  })
  log('交卷后错题入库', afterCheck.mental >= 8, `口算错题 ${afterCheck.mental} 条（至少 8：前3空/错 + 后7空）`)
  log('错题知识点带口算前缀', afterCheck.total === afterCheck.mental, `总 ${afterCheck.total} 条`)

  // 结果页渲染
  page = await mini.currentPage()
  const rScore = await page.$('.r-score')
  log('结果页得分展示', !!rScore)
  const rItems = await page.$$('.r-item')
  log('逐题回顾渲染', rItems.length === 10, `回顾 ${rItems.length} 条`)
  const again = await page.$('.again')
  log('再来一轮按钮', !!again)

  // 错题本里能看到口算错题
  page = await mini.reLaunch('/pages/book/book')
  await page.waitFor(1000)
  const bookItems = await page.$$('.wrong-item')
  log('错题本收录口算错题', bookItems.length >= 8, `错题本 ${bookItems.length} 条`)

  // 清理
  await mini.evaluate(function () {
    wx.removeStorageSync('wrong_questions')
    wx.removeStorageSync('grading_records')
    wx.removeStorageSync('checkin_days')
  })
  log('清理测试数据', true)

  const failed = results.filter(r => !r.ok).length
  console.log(`\n结果：${results.length - failed} 通过 / ${failed} 失败`)
  process.exit(failed ? 1 : 0)
}

main().catch(e => { console.error('测试执行失败：', e.message); process.exit(2) })
