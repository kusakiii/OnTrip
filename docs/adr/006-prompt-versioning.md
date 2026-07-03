# ADR-006：Prompt 版本管理 — 像代码一样管理 Prompt

**状态**：已接受
**日期**：2026-07-03

## 背景

Prompt 是 AI 产品的核心资产。改一行 prompt 可能让匹配率从 85% 跌到 40%。需要：

- 追踪每次 prompt 变更
- 回滚到历史版本
- 升级前自动化回归测试

## 决策

1. **命名规范**：`{domain}.{action}.v{version}.js`（如 `trip.generate.v1.js`）
2. **存储**：跟随代码仓库（Git），`cloud/ai-chat/prompts/` 目录
3. **退役机制**：旧版本移入 `_archive/`，不删除
4. **测试驱动**：每个 prompt 版本配 fixture（`_test-fixtures/`），升级前跑 `npm run test:prompts`

## 理由

- Prompt 是代码，不是配置——应该享受和代码一样的版本管理
- Git diff 可以精确看到 prompt 变更了什么
- Fixture 回归测试可以量化为"这次改动让匹配率从 X% 变到 Y%"
- Archive 保留历史版本，出问题时可以秒级回滚

## 后果

- ✅ Prompt 变更可追溯、可回滚、可量化
- ✅ 双模型（DeepSeek/Qwen）可以各自维护最优版本
- ❌ 增加了 prompt 管理的仪式感——每次改 prompt 要走"改→跑测试→commit"流程
- ❌ Fixture 需要持续更新（新增目的地、新风格标签）
