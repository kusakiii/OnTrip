# ADR-003：LLM 策略 — DeepSeek V4 Flash（主）+ Qwen3-Plus（备）+ 统一抽象层

**状态**：已接受
**日期**：2026-07-03

## 背景

AI 行程生成和对话微调依赖大模型。需要选择主力模型和备选模型，并设计 prompt 兼容和 fallback 策略。

## 决策

1. 主力模型：**DeepSeek V4 Flash**（非高峰 0.02 元/百万 token 输入）
2. 备选模型：**Qwen3-Plus**（7000 万 tokens 免费额度）
3. 统一抽象层：**LLMClient 接口**，不直接在业务代码中调特定模型

```
UseCase → LLMClient.complete(prompt) → DeepSeekClient / QwenClient
```

## 理由

- DeepSeek 成本极低（单次生成 < 0.005 元），OpenAI 兼容格式
- Qwen 有大量免费额度，适合开发调试和 fallback
- 统一接口方便未来增加 Claude/Gemini/GPT 等模型
- **双模型需要差异化 prompt**：Qwen 对中文名称规范化的遵循度不如 DeepSeek，需要更多 few-shot 示例和 prefill 技巧

## 后果

- ✅ 单次生成成本几乎为零，个人项目可持续
- ✅ 双模型保障可用性
- ❌ 需维护两套 prompt 模板（generate_deepseek.js / generate_qwen.js）
- ❌ Prompt 升级时需要双模型回归测试
- ❌ Qwen free 额度有有效期限制
