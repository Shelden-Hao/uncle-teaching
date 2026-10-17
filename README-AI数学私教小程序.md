# AI 数学私教

对应产品文档：`PRD-AI数学私教-MVP.md`。核心链路：**孩子拍照 → AI 批改 → 点错题 → AI 分步讲解（不给答案）→ 错题落库**。

## 技术栈与架构定位

- **框架**：Taro v4.3.0 + **React 18.3.1** + TypeScript + Sass
- **⚠️ React 版本约束（重要）**：Taro 4.x 的小程序运行时依赖 React 18 内部 API（`ReactCurrentBatchConfig` 等），
  **不支持 React 19**——实测升到 React 19 会导致小程序**白屏**（逻辑层报 `Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')`）。
  因此本仓库锁定 React 18.3.1；**React 19 留给将来的 RN 端使用**（RN 新版基于 React 19，与本目标的最终架构一致）。
  若后续 Taro 官方支持 React 19，再统一升级。
- **架构定位（重要）**：
  - 本仓库 = **微信小程序 MVP**，唯一目的是快速验证产品思路，不追求长期演进；
  - **最终移动端（移动 App / 平板）将使用 React Native 独立实现**，Taro 不承担该目标；
  - 因此 `src/utils/` 下的业务逻辑层（AI 调用 `ai.ts`、存储 `store.ts`、知识点 `knowledge.ts`）必须保持**平台与框架无关**（纯 TS，仅通过 `@tarojs/taro` 的存储/请求 API 做薄封装），将来 RN 端只替换这层薄封装即可整体复用；
  - 不要在 `src/pages/` 里写复杂业务逻辑，保持页面组件只做展示与交互编排。
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
pnpm dev:weapp        # 小程序开发（配合微信开发者工具打开项目根目录）
pnpm build:weapp      # 小程序生产构建 → dist/
```

## 微信开发者工具联调

工具中「导入项目」选择**项目根目录**（`project.config.json` 所在层），`miniprogramRoot` 指向 `dist/`，先执行 `pnpm dev:weapp` 保持 watch 编译。默认 `MODE: 'mock'` 无需后端。

> **若改动后模拟器表现异常（白屏等）**：先删 `dist/` 重新完整编译，再重启开发者工具。
> 旧产物残留会令逻辑层加载失效代码。

## 自动化测试

```bash
# 1. 以自动化端口打开项目（需先在工具「设置→安全设置」开启服务端口）
& "C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" auto --project <项目根目录> --auto-port 9420
# 2. 另开终端运行（需已编译最新版到 dist/）
pnpm build:weapp
node scripts/e2e-mock.js
```

`scripts/e2e-mock.js` 覆盖 Mock 模式下的核心链路：首页按钮 → 结果页渲染/对错标记/低置信度提示 → 跳转讲解页 → AI 开局引导 → 快捷按钮追问 → 历史记录 → 错题 ID 约定与状态回写，共 12 项断言。

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
