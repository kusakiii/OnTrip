# 途灵（TripFlow）— Architecture v2（开发版）

**版本**：v2.0-dev
**日期**：2026-07-03
**定位**：开发总蓝图——不替代 PRD，而是 PRD 之下的工程架构骨架
**前置阅读**：途灵TripFlow-PRD-v1.0.md / 途灵TripFlow-技术选型方案.md

---

## 一、分层架构（核心变更）

```
┌──────────────────────────────────────────────┐
│                   UI 层                       │
│  pages/  components/  stores/                │
│  ┌──────────────────────────────────────┐   │
│  │  MobX Store（承担 ViewModel 职责）     │   │
│  └────────────────┬─────────────────────┘   │
│                   │                          │
├───────────────────┴──────────────────────────┤
│              Application 层                   │
│  use-cases/  (TripUseCase / ChatUseCase)      │
│  编排业务流程，调用 Domain + Repository        │
├──────────────────────────────────────────────┤
│               Domain 层                       │
│  domain/                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐   │
│  │ Trip │ │ Card │ │ POI  │ │Conversation│   │
│  └──┬───┘ └──┬───┘ └──┬───┘ └─────┬────┘   │
│     │        │        │           │          │
│  ┌──┴────────┴────────┴───────────┴────┐    │
│  │          StateMachine               │    │
│  │  Domain Events  /  ErrorCodes       │    │
│  └─────────────────────────────────────┘    │
├──────────────────────────────────────────────┤
│            Infrastructure 层                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │Repository│ │ LLMClient│ │  POIProvider │ │
│  │(TripRepo)│ │(抽象接口)│ │  (高德/腾讯)  │ │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
│       │            │              │          │
│  ┌────┴────────────┴──────────────┴───────┐  │
│  │  CloudBase DB  DeepSeek/Qwen  高德API  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**关键原则**：

- Domain 层**不依赖**任何框架、数据库、AI API、HTTP
- Repository 是 Domain 定义的接口，Infrastructure 实现
- UI 只接触 ViewModel，不直接消费 Domain Model

---

## 二、领域模型（Domain Model）

### 2.1 聚合根：Trip

```
Trip (aggregate root)
│
├── tripId:        string (uuid)
├── destination:   Destination ─── city, lat, lng
├── days:          number (1-15)
├── styleTags:     Tag[] (food/art/nature/shop/relax/walk/family)
├── status:        TripStatus (状态机 — 见 §5)
├── createdAt:     ISO datetime
├── updatedAt:     ISO datetime
│
├── Day[] ─────────────────────────────────
│   ├── dayIndex:    number
│   ├── date?:       string (可选，出行日期)
│   ├── summary:     DaySummary
│   │   ├── totalDistance: string
│   │   ├── estimatedCost:  number
│   │   └── spotCount:      number
│   │
│   └── Card[] ─────────────────────────
│       ├── cardId:        string
│       ├── type:          CardType (spot|food|shop|hotel|transport)
│       ├── name:          string        [AI生成 + POI修正]
│       ├── searchName:    string?       [AI生成，供POI匹配]
│       ├── timeRange:     string        [AI生成] "09:00-11:00"
│       ├── duration:      number (分钟)  [AI生成]
│       ├── description:   string        [AI生成]
│       ├── location:      GeoPoint?     [POI富化]
│       ├── address:       string?       [POI富化]
│       ├── rating:        number?       [POI富化] (5分制)
│       ├── ticketPrice:   string?       [POI富化]
│       ├── openHours:     string?       [POI富化]
│       ├── photos:        string[]      [POI富化] URL列表
│       ├── tags:          string[]      [POI富化] 特色标签
│       ├── businessArea:  string?       [POI富化]
│       ├── transportFromPrevious: TransportSegment? [AI生成+修正]
│       │   ├── method:    string (步行|打车|地铁|公交)
│       │   ├── duration:  number (分钟)
│       │   └── distance:  string?
│       ├── isStarred:     boolean       [用户修改]
│       ├── userNote:      string?       [用户修改]
│       ├── _poiStatus:    POIStatus     [系统] verified|not_found|api_error|pending
│       ├── _dataSource:   DataSource    [系统] ai|amap|tencent|user
│       └── _version:      number        [系统] 乐观锁
│
├── Conversation ────────────────────────────
│   ├── conversationId: string
│   ├── messages:       Message[]
│   │   ├── role:       user|ai|system
│   │   ├── text:       string
│   │   ├── action?:    ChatAction (replace|add|delete|reorder|global|style|query)
│   │   ├── undoable:   boolean
│   │   └── timestamp:  ISO datetime
│   └── snapshotStack:  TripSnapshot[] (用于撤销，最多10层)
│
└── Metadata ────────────────────────────────
    ├── version:        number (乐观锁)
    ├── editCount:      number
    └── lastViewedAt:   ISO datetime
```

### 2.2 值对象

```
Destination        { city: string, lat?: number, lng?: number }
GeoPoint           { lat: number, lng: number }
TransportSegment   { method: string, duration: number, distance?: string }
DaySummary          { totalDistance: string, estimatedCost: number, spotCount: number }
Tag                { id: string, label: string }
```

### 2.3 枚举

```
CardType:    "spot" | "food" | "shop" | "hotel" | "transport"
TripStatus:  "draft" | "generating" | "generated" | "enriching" | "ready" | "archived"
POIStatus:   "pending" | "verified" | "not_found" | "api_error" | "invalid_name"
DataSource:  "ai" | "amap" | "tencent" | "user"
ChatAction:  "replace" | "add" | "delete" | "reorder" | "global" | "style" | "query" | "clarify"
```

---

## 三、AI 层抽象（解决 Reviewer 问题 3/4/5）

### 3.1 管线架构

```
                    ┌──────────────┐
                    │  UseCase     │  (业务层)
                    └──────┬───────┘
                           │ 调用
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼─────┐     ┌──────▼──────┐    ┌──────▼──────┐
   │TripGen   │     │Conversation │    │POIEnrich    │
   │UseCase   │     │UseCase      │    │UseCase      │
   └────┬─────┘     └──────┬──────┘    └──────┬──────┘
        │                  │                  │
   ┌────▼──────────────────▼──────────────────▼────┐
   │              LLM Service (抽象)                 │
   │                                                 │
   │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
   │  │Prompt    │→│ LLM      │→│ Response     │ │
   │  │Builder   │ │ Client   │ │ Pipeline     │ │
   │  │          │ │          │ │              │ │
   │  │从模板+   │ │DeepSeek  │ │ Parse→Repair │ │
   │  │参数构建  │ │Qwen      │ │ →Validate    │ │
   │  │prompt    │ │Claude..  │ │ →DomainModel │ │
   │  └──────────┘  └──────────┘  └──────────────┘ │
   └────────────────────────────────────────────────┘
```

### 3.2 Prompt 版本管理

```
cloud/ai-chat/prompts/
├── trip.generate.v1.js      # 当前版本
├── trip.generate.v2.js      # 实验版（名称标准化）
├── trip.modify.v1.js
├── trip.recommend.v1.js
├── poi.verify.v1.js
│
├── _archive/                # 退役版本
│   └── trip.generate.v0.js
│
└── _test-fixtures/          # 🆕 测试用例
    ├── generate/
    │   ├── hangzhou-food.json     # 输入: {destination, days, tags}
    │   ├── chengdu-nature.json
    │   └── expected/
    │       ├── hangzhou-food.schema.json  # 期望 Schema
    │       └── hangzhou-food.rules.json   # 期望规则（必含美食卡片 etc）
    ├── modify/
    │   ├── replace-outdoor.json
    │   ├── delete-museum.json
    │   ├── budget-lower.json
    │   └── fuzzy-intent.json
    └── run-tests.js          # 批量跑所有 fixture，输出通过率
```

### 3.3 Response Pipeline（补充 DTO）

```
LLM 原始响应 (string)
  │
  ▼
① JSON.parse() ────────────── 失败 → 重试1次 → 仍失败 → 降级模板
  │
  ▼
② DTO 校验 (JSON Schema) ─── 失败 → 自动修复（缺失字段补默认值）
  │
  ▼
③ Business Validator ─────── 失败 → 标记 _poiStatus=invalid
  │   - 每天至少1张卡片
  │   - 时间不重叠
  │   - 坐标在目的地城市范围内
  │
  ▼
④ Domain Model Mapper ────── 原始 JSON → Trip 领域对象
  │
  ▼
⑤ 返回给 UseCase
```

---

## 四、Repository 层

### 4.1 接口定义（Domain 层定义，Infrastructure 实现）

```javascript
// domain/repositories/TripRepository.js（接口契约，JSDoc 约束）

/**
 * @interface TripRepository
 */
const TripRepository = {
  /**
   * @param {string} tripId
   * @returns {Promise<Trip|null>}
   */
  findById: async (tripId) => {},

  /**
   * @param {Trip} trip
   * @returns {Promise<void>}
   */
  save: async (trip) => {},

  /**
   * @param {string} userId
   * @param {number} page
   * @param {number} pageSize
   * @returns {Promise<TripSummary[]>}
   */
  findByUser: async (userId, page, pageSize) => {},

  /**
   * @param {string} tripId
   * @returns {Promise<void>}
   */
  delete: async (tripId) => {},
};
```

### 4.2 实现

```
infrastructure/repositories/
├── CloudBaseTripRepository.js   # 当前实现
├── CloudBaseConversationRepository.js
├── CloudBasePOICacheRepository.js
│
└── (未来)
    ├── SupabaseTripRepository.js
    └── MySQLTripRepository.js
```

---

## 五、状态机（TripStatus）

```
                  ┌──────────┐
                  │  draft   │  用户创建空白行程（未生成）
                  └────┬─────┘
                       │ 用户点击「生成行程」
                       ▼
                  ┌──────────────┐
                  │  generating  │  DeepSeek 生成中（加载动画）
                  └──────┬───────┘
                         │ AI 返回 JSON + DTO 校验通过
                         ▼
                  ┌──────────────┐
                  │  generated   │  行程已生成，等待 POI 富化
                  └──────┬───────┘
                         │ POI 富化完成（或跳过）
                         ▼
                  ┌──────────────┐
                  │  enriching   │  POI 查询中（并发）
                  └──────┬───────┘
                         │ 富化完成
                         ▼
                  ┌──────────┐
                  │  ready   │  可编辑、可分享、可导出
                  └────┬─────┘
                       │ 用户主动归档 / 旅行结束
                       ▼
                  ┌──────────┐
                  │ archived │  只读，不出现在活跃列表
                  └──────────┘

合法转换:
  draft → generating
  generating → generated
  generated → enriching
  enriching → ready
  ready → archived
  archived → ready (恢复)
  any → error (生成/富化失败，但保留骨架数据)
```

### 前端状态映射

| TripStatus   | UI 行为                            |
| ------------ | ---------------------------------- |
| `draft`      | 首页空状态（或输入面板）           |
| `generating` | 加载动画 + 进度文案                |
| `generated`  | 卡片骨架态（灰色占位）             |
| `enriching`  | 卡片渐进点亮（照片浮现、评分弹出） |
| `ready`      | 完整交互（编辑/对话/地图/导出）    |
| `archived`   | 只读查看模式                       |

---

## 六、事件系统（Domain Events）

```
事件名                    触发时机                      消费者
─────────────────────────────────────────────────────────────
TripCreated            用户点击「生成行程」          埋点
TripGenerated          AI 返回 + DTO 通过           埋点 / 缓存预填
TripEnriched           POI 富化完成                 埋点 / 质量监控
CardStarred            用户标记「必去」             埋点 / 偏好学习
CardReplaced           对话/菜单替换卡片             埋点 / 撤销栈
CardDeleted            删除卡片                    埋点 / 撤销栈
ConversationSent       用户发送对话消息             埋点 / 意图分析
ConversationReplied    AI 回复对话                 埋点 / 响应时间监控
TripSaved              手动/自动保存                埋点 / 同步触发
TripExported           导出长图/分享                埋点
ErrorOccurred          任何异常（AI/API/DB）        日志 / 告警
```

**实现方式**：

```javascript
// domain/events/EventBus.js
const EventBus = {
  _handlers: {},

  on(event, handler) {
    (this._handlers[event] ||= []).push(handler);
  },

  async emit(event, payload) {
    const handlers = this._handlers[event] || [];
    // 异步执行，单个handler失败不影响其他
    await Promise.allSettled(handlers.map((h) => h(payload)));
  },
};

// 使用
EventBus.on('TripGenerated', async (trip) => {
  await analytics.track('trip_generated', { destination, days, cardCount });
  await cache.warmup(trip.destination);
});
```

---

## 七、错误码体系

### 7.1 错误码规范

格式：`{DOMAIN}{NNN}`

| 类别   | 前缀 | 范围          |
| ------ | ---- | ------------- |
| AI     | AI   | AI001-AI099   |
| 地图   | MAP  | MAP001-MAP099 |
| 数据库 | DB   | DB001-DB099   |
| 网络   | NET  | NET001-NET099 |
| 校验   | VAL  | VAL001-VAL099 |
| 通用   | SYS  | SYS001-SYS099 |

### 7.2 错误码表

```
AI001  AI_TIMEOUT           AI 响应超时（>60s）
AI002  AI_JSON_INVALID      AI 返回非法 JSON
AI003  AI_SCHEMA_MISMATCH   AI 返回不符合 Schema
AI004  AI_HALLUCINATION     POI 校验失败（地图无此地点）
AI005  AI_EMPTY_RESPONSE    AI 返回空内容
AI006  AI_RATE_LIMITED      模型 API 限流

MAP001  POI_NOT_FOUND       地图未找到该 POI
MAP002  POI_API_TIMEOUT     地图 API 超时
MAP003  POI_API_ERROR       地图 API 返回错误
MAP004  GEO_OUT_OF_RANGE    坐标超出目的地城市范围
MAP005  PHOTO_LOAD_FAILED   照片 URL 加载失败

DB001  DB_SAVE_FAILED       保存失败
DB002  DB_READ_FAILED       读取失败
DB003  DB_CONFLICT          乐观锁冲突（版本不一致）
DB004  DB_QUOTA_EXCEEDED    数据库配额超限

NET001  NET_OFFLINE          网络离线
NET002  NET_TIMEOUT          网络超时
NET003  NET_RETRY_EXHAUSTED  重试耗尽

VAL001  VAL_INVALID_INPUT    用户输入不合法
VAL002  VAL_FIELD_MISSING    必填字段缺失
VAL003  VAL_TYPE_MISMATCH    字段类型错误

SYS001  SYS_COLD_START       云函数冷启动（非错误，仅日志）
SYS002  SYS_UNKNOWN          未分类异常
```

### 7.3 使用方式

```javascript
class AppError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code; // AI001
    this.severity = details.severity || 'error'; // error|warn|info
    this.recoverable = details.recoverable ?? true;
    this.userMessage = details.userMessage || '系统繁忙，请稍后重试';
  }
}

// 使用
throw new AppError('AI001', 'AI response timeout after 60s', {
  severity: 'error',
  recoverable: true,
  userMessage: '生成超时了，请再试一次',
});
```

---

## 八、测试矩阵

```
tests/
├── unit/
│   ├── domain/
│   │   ├── Trip.test.js
│   │   ├── Card.test.js
│   │   └── StateMachine.test.js
│   ├── services/
│   │   ├── PromptBuilder.test.js
│   │   ├── DTOValidator.test.js
│   │   └── POIEnricher.test.js
│   └── utils/
│       ├── levenshtein.test.js
│       └── nameCleaner.test.js
│
├── integration/
│   ├── ai-chat/
│   │   ├── generate.test.js       # 调真实 DeepSeek API
│   │   └── modify.test.js
│   ├── poi/
│   │   └── amap-provider.test.js   # 调真实高德 API
│   └── repository/
│       └── cloudbase-trip.test.js
│
├── prompt/                         # 🆕 Prompt 回归测试
│   ├── fixtures/
│   │   ├── generate/hangzhou-food.json
│   │   ├── generate/chengdu-nature.json
│   │   ├── modify/replace-outdoor.json
│   │   ├── modify/delete-museum.json
│   │   ├── modify/budget-lower.json
│   │   └── modify/fuzzy-intent.json
│   └── run-tests.js                # npm run test:prompts
│
├── mock/                           # 🆕 Mock 数据
│   ├── trips/
│   │   ├── hangzhou-3day-food.json
│   │   ├── chengdu-2day-nature.json
│   │   └── xiamen-4day-relax.json
│   └── responses/
│       ├── amap-hangzhou.json
│       └── deepseek-hangzhou.json
│
└── e2e/
    └── user-journey/
        ├── generate-and-edit.test.js
        └── offline-view.test.js
```

---

## 九、开发目录结构（修订版）

```
tripflow/
├── miniprogram/                    # 小程序前端
│   ├── app.js / app.json / app.wxss
│   ├── pages/
│   │   ├── home/                   # 首页（输入面板）
│   │   ├── trip/                   # 行程详情（时间轴/地图）
│   │   └── history/                # 历史行程
│   ├── components/
│   │   ├── trip-card/
│   │   ├── chat-panel/
│   │   ├── card-detail-sheet/
│   │   ├── map-view/
│   │   ├── style-tags/
│   │   └── satisfaction/
│   ├── view-models/                # 🆕 ViewModel 层
│   │   ├── TripViewModel.js
│   │   ├── CardViewModel.js
│   │   └── ChatViewModel.js
│   ├── use-cases/                  # 🆕 Application 层
│   │   ├── GenerateTripUseCase.js
│   │   ├── ModifyTripUseCase.js
│   │   └── EnrichPOIUseCase.js
│   ├── stores/                     # MobX
│   │   ├── tripStore.js
│   │   └── chatStore.js
│   ├── services/
│   │   ├── api.js
│   │   ├── storage.js
│   │   └── sync.js
│   └── utils/
│       ├── constants.js
│       ├── errorCodes.js           # 🆕 错误码映射
│       └── logger.js               # 🆕 结构化日志
│
├── cloud/                          # 云函数
│   ├── ai-chat/
│   │   ├── index.js                # 入口
│   │   ├── prompts/                # Prompt 版本管理
│   │   │   ├── trip.generate.v1.js
│   │   │   ├── trip.modify.v1.js
│   │   │   ├── trip.recommend.v1.js
│   │   │   ├── _archive/
│   │   │   └── _test-fixtures/
│   │   ├── llm/                    # 🆕 LLM 抽象层
│   │   │   ├── PromptBuilder.js
│   │   │   ├── LLMClient.js        # DeepSeek/Qwen 统一接口
│   │   │   └── ResponsePipeline.js # Parse → Repair → Validate
│   │   ├── validators/
│   │   │   ├── schema.js           # DTO 校验
│   │   │   └── business.js         # 🆕 业务校验
│   │   └── enrichers/
│   │       └── poi-enricher.js
│   ├── trip-manager/
│   │   └── index.js
│   └── poi-search/
│       └── index.js
│
├── shared/                         # 🆕 共享代码
│   ├── domain/                     # 领域模型
│   │   ├── Trip.js
│   │   ├── Card.js
│   │   ├── POI.js
│   │   ├── Conversation.js
│   │   ├── StateMachine.js         # 状态机
│   │   ├── ErrorCodes.js           # 错误码
│   │   └── events/                 # 领域事件
│   │       ├── EventBus.js
│   │       └── events.js
│   ├── repositories/               # Repository 接口
│   │   └── TripRepository.js
│   └── infrastructure/             # 基础设施实现
│       ├── repositories/
│       │   └── CloudBaseTripRepository.js
│       └── llm/
│           ├── DeepSeekClient.js
│           └── QwenClient.js
│
├── docs/                           # 🆕 文档
│   ├── adr/                        # 架构决策记录
│   │   ├── 001-cloudbase.md
│   │   ├── 002-map-sdk.md
│   │   ├── 003-llm-strategy.md
│   │   ├── 004-domain-model.md
│   │   ├── 005-cache-strategy.md
│   │   └── 006-prompt-versioning.md
│   └── api/                        # API 契约
│       ├── trip-api.md
│       ├── conversation-api.md
│       └── poi-api.md
│
├── tests/                          # 测试
├── mock/                           # 🆕 Mock 数据
│   ├── trips/
│   └── responses/
│
├── project.config.json
└── README.md
```

---

## 十、Sprint 实施顺序（架构驱动的开发顺序）

| 阶段         | 内容              | 产出                                                                 | 依赖     |
| ------------ | ----------------- | -------------------------------------------------------------------- | -------- |
| **Sprint 0** | 架构骨架搭建      | Domain 模型 + StateMachine + ErrorCodes + EventBus + Repository 接口 | —        |
| **Sprint 1** | LLM 抽象层        | PromptBuilder + LLMClient + ResponsePipeline + 测试 fixtures         | Sprint 0 |
| **Sprint 2** | F1 行程生成       | GenerateTripUseCase → CloudBase 实现 → 首页                          | Sprint 1 |
| **Sprint 3** | F2 卡片 + F6 保存 | CardViewModel → 时间轴渲染 → 自动保存                                | Sprint 2 |
| **Sprint 4** | F3 对话微调       | ModifyTripUseCase → chat-panel → 撤销栈                              | Sprint 3 |
| **Sprint 5** | F7 POI 富化       | EnrichPOIUseCase → 渐进渲染 → 照片降级                               | Sprint 2 |
| **Sprint 6** | F5 地图 + F6 分享 | 静态地图 + 导出长图 + 微信分享                                       | Sprint 4 |
| **Sprint 7** | 首次引导 + 打磨   | US-18 首次引导 + 审核准备 + Bug 修复                                 | Sprint 6 |

---

## 附录：与 PRD 功能编号的映射

| PRD 功能 | 架构中的定位                                        |
| -------- | --------------------------------------------------- |
| F1 生成  | GenerateTripUseCase → Trip domain → LLMClient       |
| F2 卡片  | Card domain → CardViewModel → trip-card 组件        |
| F3 对话  | ModifyTripUseCase → Conversation domain → LLMClient |
| F4 拖拽  | **V2.0** → Card domain 扩展                         |
| F5 地图  | MapView 组件 → POIProvider（静态标注版）            |
| F6 管理  | TripRepository.save/export/share                    |
| F7 富化  | EnrichPOIUseCase → POIProvider → Card domain        |
