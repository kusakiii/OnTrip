# ADR-004：领域模型驱动 vs 功能驱动

**状态**：已接受
**日期**：2026-07-03

## 背景

PRD 按功能模块（F1-F7）组织，适合产品决策。但开发代码按功能组织会导致：

- 领域逻辑散落在多个云函数中
- 换数据库/换 AI 模型需要改动大量文件
- 新功能开发时容易破坏已有功能

## 决策

代码按 **领域模型（Domain Model）** 组织，功能只是调用领域。

```
Domain: Trip → Day → Card → POI → Conversation
UseCase: GenerateTrip / ModifyTrip / EnrichPOI
Infrastructure: CloudBaseRepository / DeepSeekClient / AmapProvider
```

## 理由

- 领域模型反映业务本质（Trip 包含 Day 包含 Card），不随功能增删而变化
- Repository 接口隔离数据库实现，换 CloudBase → Supabase 只改一个文件
- LLMClient 接口隔离 AI 模型，加新模型只增加一个 Client 实现
- 单元测试可以 mock Repository 和 LLMClient，不依赖外部服务

## 后果

- ✅ 长期维护成本显著降低
- ✅ 新增功能几乎不用改旧代码
- ❌ 初期搭建架构骨架需要额外 2-3 天（Sprint 0）
- ❌ 对开发者有架构能力要求（需理解分层和依赖反转）
