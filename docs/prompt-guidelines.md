# Prompt 编写规范

> TripFlow — AI Prompt 工程约束

---

## 一、版本管理

所有 Prompt 必须版本化，跟随 Git：

```
prompts/
├── trip.generate.v1.js       # 当前版本
├── trip.generate.v2.js       # 实验版
├── trip.modify.v1.js
├── trip.recommend.v1.js
├── _archive/                  # 退役版本（不删除）
│   └── trip.generate.v0.js
└── _test-fixtures/            # 每个 Prompt 配测试
    ├── generate/
    │   ├── hangzhou-food.json
    │   └── expected/
    │       ├── hangzhou-food.schema.json
    │       └── hangzhou-food.rules.json
    └── modify/
        ├── replace-outdoor.json
        └── delete-museum.json
```

---

## 二、Prompt 结构

```javascript
function buildPrompt(params) {
  return `
你是一个专业的旅行规划师。#NO_TALK
你的输出直接被程序解析，JSON 之外的任何文字都会导致错误。

---TASK---
${taskDescription}

---RULES---
1. ${rule1}
2. ${rule2}

---CONTEXT---
${JSON.stringify(context)}

---FORMAT---
严格按以下 JSON Schema 输出：
${JSON.stringify(schema, null, 2)}

---EXAMPLES---
正确示例：
${correctExample}

错误示例（不要这样）：
${wrongExample}
`;
}
```

**规则**：

- `#NO_TALK` 必须放在第一行
- 使用 `---SECTION---` 分隔符，不用自然语言段落
- 约束放在首尾（模型对首尾注意力最高）
- Few-shot 示例 3-5 个足够，不必多

---

## 三、Prompt 测试

每个 Prompt 版本必须配 fixture 测试：

```json
{
  "description": "杭州3天美食之旅",
  "input": {
    "destination": "杭州",
    "days": 3,
    "styleTags": ["food"]
  },
  "expected": {
    "itinerary.length": 3,
    "eachDay.minCards": 3,
    "eachDay.maxCards": 5,
    "hasFoodCard": true,
    "timeFormat": "HH:MM-HH:MM",
    "nameNotEmpty": true,
    "searchNameNotEmpty": true
  }
}
```

升级 Prompt 前必须跑：`npm run test:prompts`

---

## 四、名称标准化

AI 必须输出**可被地图 API 搜索的标准名称**：

```
✅ "西湖风景名胜区-断桥残雪"
✅ "知味观·味庄(杨公堤店)"
✅ "灵隐寺"

❌ "西湖"
❌ "外婆家"
❌ "必去的网红打卡地——洪崖洞"
```

每个 Card 额外输出 `searchName`（去掉括号后缀的简洁版）和 `amapCategory`（高德分类码）。

---

## 五、双模型适配

DeepSeek 和 Qwen 对 prompt 的遵循度不同：

| 策略          | DeepSeek | Qwen                        |
| ------------- | -------- | --------------------------- |
| Few-shot 数量 | 3-5 个   | 5-8 个                      |
| 约束风格      | 精简     | 正向约束优先                |
| Prefill       | 不需要   | 预填 `{"itinerary": [` 开头 |

维护两套模板：

- `trip.generate.v1.js`（DeepSeek 版本）
- `trip.generate.v1.qwen.js`（Qwen 版本）

---

## 六、Token 预算

| Prompt    | 预算（input tokens） |
| --------- | -------------------- |
| generate  | ≤ 2500               |
| modify    | ≤ 2000               |
| recommend | ≤ 1500               |

对话传行程上下文时，使用**骨架摘要**而非全量 JSON：

```
D1: [09:00-11:00 断桥残雪(spot)] → [11:30-13:00 知味观·味庄(restaurant)] → [14:00-16:00 灵隐寺(spot)]
```

---

## 七、Golden Test

固定输入 → 固定期望，验证 Prompt 升级不退化：

```
杭州 + 3天 + 美食 → 必须包含 at least 1 个杭帮菜餐厅
成都 + 2天 + 自然 → 必须包含户外景点
```

Golden Test 全部通过，才能合入新版本 Prompt。
