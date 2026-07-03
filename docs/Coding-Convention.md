# TripFlow — 编码规范

**版本**：v1.0
**日期**：2026-07-03

---

## 1. 文件命名

| 类型           | 规范                         | 示例                                  |
| -------------- | ---------------------------- | ------------------------------------- |
| 页面目录       | kebab-case                   | `home/` `trip/` `history/`            |
| 组件文件       | kebab-case                   | `trip-card.js` `chat-panel.js`        |
| Domain 模型    | PascalCase                   | `Trip.js` `Card.js` `Conversation.js` |
| UseCase        | PascalCase + UseCase 后缀    | `GenerateTripUseCase.js`              |
| Repository     | PascalCase + Repository 后缀 | `CloudBaseTripRepository.js`          |
| Store          | camelCase + Store 后缀       | `tripStore.js` `chatStore.js`         |
| Service        | camelCase                    | `api.js` `storage.js` `sync.js`       |
| Cloud Function | kebab-case                   | `generate-trip/` `modify-trip/`       |
| Prompt         | kebab-case + v 版本          | `trip.generate.v1.js`                 |
| Test           | 文件名 + .test.js 后缀       | `Trip.test.js`                        |
| ADR            | NNN-kebab-case               | `001-cloudbase.md`                    |

---

## 2. 目录结构（强制）

```
tripflow/
├── miniprogram/
│   ├── pages/           # 页面（仅 page 级别）
│   │   ├── home/        # home.js / home.wxml / home.wxss / home.json
│   │   ├── trip/        # trip.js / trip.wxml / trip.wxss / trip.json
│   │   └── history/
│   ├── components/      # 可复用组件
│   ├── stores/          # MobX Store（承担 ViewModel）
│   ├── use-cases/       # Application 层（编排业务流程）
│   ├── services/        # API / Storage / Sync
│   └── utils/           # 纯函数工具
├── cloud/
│   ├── generate-trip/   # 行程生成
│   ├── modify-trip/     # 对话微调
│   ├── trip-manager/    # 行程 CRUD
│   └── poi-search/      # POI 搜索 + 富化
├── shared/              # 跨平台共享代码
│   ├── domain/          # 领域模型（不依赖框架）
│   ├── repositories/    # Repository 接口
│   └── infrastructure/  # Repository + LLM Client 实现
├── docs/
│   ├── adr/             # 架构决策记录
│   └── api/             # API 契约
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── prompt/          # Prompt 回归测试
│   └── e2e/
└── mock/                # Mock 数据
```

---

## 3. 命名规范

### 3.1 变量/函数

```javascript
// ✅ camelCase
const tripStore = {};
function generateTrip() {}
let isLoading = false;

// ❌ 禁止
const trip_store = {};
function GenerateTrip() {}
```

### 3.2 类/构造函数

```javascript
// ✅ PascalCase
class Trip {}
class CloudBaseTripRepository {}
```

### 3.3 常量

```javascript
// ✅ UPPER_SNAKE_CASE
const MAX_CARDS_PER_DAY = 8;
const AMAP_KEY = process.env.AMAP_KEY;
```

### 3.4 私有字段

```javascript
// ✅ _ 前缀
card._poiStatus = 'verified';
card._dataSource = 'amap';
```

---

## 4. MobX Store 规范

```javascript
// stores/tripStore.js
import { makeAutoObservable, runInAction } from 'mobx-miniprogram';

class TripStore {
  // --- 状态 ---
  trip = null;
  status = 'idle'; // idle | loading | ready | error
  viewMode = 'timeline'; // timeline | map
  expandedDay = null;
  activeDayTab = 0;

  constructor() {
    makeAutoObservable(this);
  }

  // --- Actions ---
  async generateTrip(destination, days, styleTags) {
    this.status = 'loading';
    try {
      const trip = await GenerateTripUseCase.execute(destination, days, styleTags);
      runInAction(() => {
        this.trip = trip;
        this.status = 'ready';
      });
    } catch (err) {
      runInAction(() => {
        this.status = 'error';
      });
    }
  }

  // --- Computed ---
  get cardCount() {
    return this.trip?.itinerary.reduce((sum, d) => sum + d.cards.length, 0) ?? 0;
  }
}

export const tripStore = new TripStore();
```

**规则**：

- Store 即 ViewModel，不额外加一层
- Action 调用 UseCase，不直接调 API
- Computed 只做纯计算，不触发副作用

---

## 5. UseCase 规范

```javascript
// use-cases/GenerateTripUseCase.js
class GenerateTripUseCase {
  static async execute(destination, days, styleTags) {
    // 1. 调 LLM
    const rawJson = await LLMClient.generate(destination, days, styleTags);

    // 2. DTO → Domain
    const trip = ResponsePipeline.process(rawJson);

    // 3. POI 富化
    await POIEnricher.enrich(trip, destination);

    // 4. 保存
    await TripRepository.save(trip);

    // 5. 发事件
    EventBus.emit('TripGenerated', trip);

    return trip;
  }
}
```

---

## 6. 错误处理规范

```javascript
// ✅ 使用 AppError
throw new AppError('AI.TIMEOUT', 'AI response timeout', {
  recoverable: true,
  userMessage: '生成超时了，请再试一次',
});

// ❌ 禁止裸字符串
throw new Error('timeout');
throw 'error';

// ❌ 禁止静默吞错误（除非故意降级）
try {
  await riskyOp();
} catch {} // 至少 console.warn
```

---

## 7. 导入顺序

```javascript
// 1. 第三方库
import { makeAutoObservable } from 'mobx-miniprogram';

// 2. 领域层
import { Trip } from '../../shared/domain/Trip';

// 3. UseCase
import { GenerateTripUseCase } from '../../use-cases/GenerateTripUseCase';

// 4. 工具
import { formatDate } from '../../utils/date';
```

---

## 8. Git 提交规范

```
feat: 行程生成功能
fix: POI 名称匹配编辑距离阈值修正
refactor: 将 ViewModel 职责合并到 MobX Store
docs: 新增数据库 Schema 文档
test: 增加 Prompt 回归测试 fixture
chore: 更新 ESLint 配置
```
