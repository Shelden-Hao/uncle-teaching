# Git 工作流规范

本仓库的每一次修改（无论是改一个小 bug、调样式，还是新增功能）都必须遵循以下流程。

## 1. 分支模型

- `master`：始终可构建、可运行的稳定分支，只通过合并进入，不直接提交。
- 功能/修复分支从 `master` 最新提交切出，命名规范：
  - `feat/<功能名>`：新功能，如 `feat/wrong-question-book`
  - `fix/<问题名>`：bug 修复，如 `fix/photo-upload-cancel`
  - `chore/<事项名>`：构建、依赖、文档等杂项，如 `chore/bump-taro`
  - `docs/<主题>`：纯文档，如 `docs/prd-update`

## 2. 标准流程

```bash
git checkout master && git pull          # 1. 同步最新
git checkout -b fix/tutor-status-writeback  # 2. 切分支
# ...修改代码...
pnpm build:weapp && pnpm build:h5        # 3. 双端编译通过再提交
git add <相关文件>
git commit -m "fix: 讲解页订正通过后回写存储状态"   # 4. 规范提交
git checkout master && git merge --no-ff fix/tutor-status-writeback  # 5. 合并
git branch -d fix/tutor-status-writeback
```

## 3. Commit Message 规范（Conventional Commits）

格式：`<type>: <一句话说明（中文）>`

| type | 用途 |
|---|---|
| feat | 新功能 |
| fix | bug 修复 |
| style | 样式调整（不影响逻辑） |
| refactor | 重构（不加功能不修 bug） |
| docs | 文档 |
| chore | 构建/依赖/配置杂项 |
| test | 测试 |

示例：
- `feat: 错题本列表页`
- `fix: 拍照取消时不再弹"批改失败"提示`
- `chore: 锁定 webpack 5.91.0 修复 Taro 编译报错`

一次提交只做一件事；提交前必须双端（weapp + h5）编译通过。

## 4. 禁止事项

- 禁止直接向 `master` 提交（热修复也走分支，合并时可加 `--no-ff` 保留历史）；
- 禁止提交 `node_modules/`、`dist/`（已在 `.gitignore`）；
- 禁止把 API Key 等敏感信息写入代码或提交历史。
