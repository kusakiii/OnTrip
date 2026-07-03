# 途灵 TripFlow

AI 行程规划微信小程序 — 输入目的地 + 天数 → AI 一键生成行程 → 对话微调 + POI 校验。

> 个人长期维护项目。架构原则：稳定 > 可维护 > 低耦合 > 功能。

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 用微信开发者工具打开项目根目录
#    设置 AppID → 开通云开发 → 创建环境 tripflow-prod

# 3. 验证环境连通性
#    开发者工具 → 云开发控制台 → 上传 cloud/hello-world
#    调用 hello-world → 返回 { ok: true }

# 4. 开始开发
npm run check   # Lint + Format + Test 一键检查
```

---

## 开发命令

| 命令                   | 用途                                 |
| ---------------------- | ------------------------------------ |
| `npm run check`        | 提交前检查：Format + Lint + 单元测试 |
| `npm run format`       | Prettier 格式化全部代码              |
| `npm run format:check` | 检查格式（CI 用）                    |
| `npm run lint`         | ESLint 检查                          |
| `npm run lint:fix`     | ESLint 自动修复                      |
| `npm test`             | 运行全部测试                         |
| `npm run test:unit`    | 仅单元测试                           |
| `npm run test:prompts` | Prompt 回归测试                      |

---

## 项目结构

```
trip/
├── miniprogram/                # 微信小程序前端
│   ├── app.js / json / wxss    # 入口
│   ├── domain/                 # 领域层（实体 / 值对象 / 枚举 / 错误 / 状态机 / 事件）
│   ├── repositories/           # Repository 接口（Domain 定义）
│   ├── infrastructure/         # CloudBase 实现
│   ├── shared/
│   │   ├── dto/                # AI 响应校验管线（parse → validate → repair → map）
│   │   └── schema/             # AI 输出 JSON Schema
│   ├── design/                 # Design Token（颜色 / 字体 / 间距 / 圆角 / 阴影）
│   ├── components/             # 组件（t-button / t-tag / trip-card / …）
│   ├── pages/                  # 页面（home / trip / history）
│   ├── stores/                 # MobX 状态管理
│   ├── use-cases/              # Application 层（业务编排）
│   ├── services/               # API / Storage / Sync
│   └── utils/                  # 常量 / 日志
├── cloud/                      # 云函数
│   ├── hello-world/            # CloudBase 连通性验证
│   ├── generate-trip/          # 行程生成（AI → DTO → Trip）
│   ├── modify-trip/            # 对话微调
│   ├── trip-manager/           # 行程 CRUD
│   └── poi-search/             # POI 搜索 + 富化
├── tests/                      # 测试
│   ├── unit/                   # 单元测试（domain / services / utils）
│   ├── integration/            # 集成测试（ai-chat / poi / repository）
│   ├── prompt/                 # Prompt 回归测试
│   └── e2e/                    # 端到端测试
├── mock/                       # Mock 数据
├── docs/                       # 文档（ADR / API 契约）
├── design/                     # 🆕 设计规范
├── .husky/                     # Git Hook（pre-commit → lint-staged）
├── .editorconfig               # 编辑器统一编码
├── .eslintrc.json              # ESLint 配置
├── .prettierrc                 # Prettier 配置
├── package.json                # NPM 脚本 + Jest 配置
└── project.config.json         # 微信小程序配置
```

---

## 架构

```
UI 层        pages/ + components/ + stores/
Application  use-cases/  （业务编排）
Domain       domain/     （实体 / 值对象 / 状态机 / 错误码）
Infrastructure/CloudBase/LLM/POIProvider
```

**关键约束：**

- Domain 层不依赖微信 API、CloudBase、HTTP、AI、Storage
- 所有数据库操作必须经过 Repository
- 所有 AI 输出必须经过 DTO 校验管线
- 页面不写业务逻辑，不直接调用 AI 或数据库

详见 [Architecture v2](Architecture-v2-开发版.md)。

---

## Design Token

所有视觉决策集中在 `miniprogram/design/tokens.js`：

- **Color** — 1 个品牌色 `#2E7D32` + 4 层级文字 + 5 卡片类型色
- **Typography** — 5 个字号（28/22/18/16/13）
- **Spacing** — 6 个间距档位（4/8/12/16/24/32/48）
- **Radius** — 4 个圆角档位（12/16/20/999）
- **Shadow** — 1 级卡片阴影

设计语言：Apple HIG + 微信原生 + Notion 极简层级。

---

## 开发流程（Story + DoD）

每个 Story 使用固定模板：

| 项    | 内容                                         |
| ----- | -------------------------------------------- |
| Story | 一句话用户价值                               |
| AC    | 3-8 条 Given/When/Then                       |
| DoD   | Lint 通过、可运行、测试通过、无 TODO、Commit |
| Demo  | 可演示成果                                   |

每次只完成一个 Story，验证通过后再进入下一个。

详见 [CLAUDE.md](CLAUDE.md)。

---

## 技术栈

| 层   | 选型                                 |
| ---- | ------------------------------------ |
| 前端 | 原生微信小程序 + MobX                |
| AI   | DeepSeek V4 Flash 主 + Qwen3-Plus 备 |
| 后端 | 微信云开发（CloudBase）              |
| 存储 | 云数据库 NoSQL + 本地 Storage        |
| 地图 | 腾讯地图 SDK                         |

---

## License

MIT
