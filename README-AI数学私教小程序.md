# AI 数学私教

对应产品文档：`PRD-AI数学私教-MVP.md`。核心链路：**孩子拍照 → AI 批改 → 点错题 → AI 分步讲解（不给答案）→ 错题落库**。

## 技术栈

- **框架**：Taro v4.3.0（最新稳定版）+ React 18 + TypeScript + Sass
- **目标端**：
  - **H5（主目标）**：移动端 / 平板浏览器，`pnpm dev:h5`
  - **微信小程序（快速验证）**：`pnpm dev:weapp`
- **包管理**：pnpm

## 目录结构

```
├── config/                  # Taro 构建配置（index/dev/prod）
├── src/
│   ├── app.ts / app.config.ts / app.scss
│   ├── pages/
│   │   ├── index/     # 首页：拍照上传 + 今日统计
│   │   ├── result/    # 批改结果页：逐题 ✓/✗，低置信度标"待确认"
│   │   ├── tutor/     # AI 讲解对话页："看一步提示/换个说法/我会了"
│   │   └── history/   # 历史批改记录
│   ├── utils/
│   │   ├── config.ts       # ★ MODE: 'mock' | 'api' 切换
│   │   ├── ai.ts           # 批改/讲解调用层 + Prompt（含 Mock）
│   │   ├── store.ts        # 本地存储：grading_record / wrong_question
│   │   └── knowledge.ts    # 人教版五上知识点体系
│   └── assets/icons/       # TabBar 图标
└── project.config.json     # 微信开发者工具配置（miniprogramRoot: dist/）
```

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev:h5           # H5 开发（浏览器预览，主目标端）
pnpm build:h5         # H5 生产构建 → dist/
pnpm dev:weapp        # 小程序开发（配合微信开发者工具打开项目根目录）
pnpm build:weapp      # 小程序生产构建 → dist/
```

## 微信开发者工具联调

工具中「导入项目」选择**项目根目录**（`project.config.json` 所在层），`miniprogramRoot` 指向 `dist/`，先执行 `pnpm dev:weapp` 保持 watch 编译。默认 `MODE: 'mock'` 无需后端。

## 后端约定（API 模式）

API Key 一律放服务端。需实现两个接口（详见 `src/utils/ai.ts`）：

- `POST /grade` — `{ images: [base64...] }` → `{ items: [{no, questionText, kidAnswer, correctAnswer, isCorrect, knowledgePoint, confidence}] }`
- `POST /chat` — `{ messages: [...] }` → `{ reply }`（System Prompt 见 `TUTOR_SYSTEM_PROMPT`）

## Git 工作流规范

见 `CONTRIBUTING.md`。要点：任何修改（含小 bug）都必须走 Git 流程——独立分支 + 规范化 commit message + 合并回 master。

## MVP 验证指标

- 题目级批改准确率 ≥ 90%
- 讲解后订正通过率 ≥ 70%
- 孩子每周主动使用 ≥ 4 天

## 二期待办

- 错题本 UI、变式题推送（数据已落库）
- 家长周报、掌握度雷达图
- 图片长期保存（当前临时路径）
- 订正通过状态回写（当前仅在对话中验证）
