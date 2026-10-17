# AI 数学私教 · 微信小程序（MVP）

对应 `PRD-AI数学私教-MVP.md`。核心链路：**孩子拍照 → AI 批改 → 点错题 → AI 分步讲解（不给答案）→ 错题落库**。

## 目录结构

```
miniprogram/
├── app.js / app.json / app.wxss      # 全局（TabBar：拍一拍 / 历史）
├── pages/
│   ├── index/    # 首页：拍照上传 + 今日统计
│   ├── result/   # 批改结果页：逐题 ✓/✗，低置信度标"待确认"
│   ├── tutor/    # AI 讲解对话页：快捷按钮"看一步提示/换个说法/我会了"
│   └── history/  # 历史批改记录
└── utils/
    ├── config.js       # ★ MODE: 'mock' | 'api' 切换
    ├── ai.js           # 批改/讲解调用层 + Prompt（含 Mock 实现）
    ├── store.js        # 本地存储：grading_record / wrong_question
    └── knowledge.js    # 人教版五上知识点体系（批改 Prompt 参照）
```

## 运行

1. 用微信开发者工具「导入项目」选择本目录（`project.config.json` 所在层），AppID 用测试号即可。
2. 默认 `MODE: 'mock'`：无需任何后端，拍照后返回假批改数据，先把 UI 和流程跑通。
3. 接真实 AI：把 `utils/config.js` 的 `MODE` 改为 `'api'`，并填入你的后端地址。

## 后端约定（API 模式）

API Key 一律放服务端，不落小程序。需实现两个接口：

- `POST /grade` — 入参 `{ images: [base64...] }`，出参：
  ```json
  { "items": [{ "no": "1", "questionText": "...", "kidAnswer": "...",
                "correctAnswer": "...", "isCorrect": false,
                "knowledgePoint": "...", "confidence": 0.92 }] }
  ```
  Prompt 参考 `utils/ai.js` 中的 `GRADE_SYSTEM_PROMPT`（已内嵌知识点清单）。
- `POST /chat` — 入参 `{ messages: [{role, content}...] }`，出参 `{ "reply": "..." }`。
  System Prompt 参考 `TUTOR_SYSTEM_PROMPT`（不给答案、每次 ≤3 句、以提问结尾）。

## MVP 验证指标（用真实数据记录）

- 题目级批改准确率 ≥ 90%
- 讲解后订正通过率 ≥ 70%
- 孩子每周主动使用 ≥ 4 天

## 已知留待事项（二期）

- 错题本 UI、变式题推送（数据已从现在开始落库：`store.saveWrongQuestions`）
- 家长周报、掌握度雷达图
- 图片长期保存（当前存临时路径，如需保留需上传至云存储）
- 订正通过时同型验算小题的自动判分（当前由 AI 在对话中口头验证）
