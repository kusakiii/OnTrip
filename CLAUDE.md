# CLAUDE.md

> TripFlow 开发规范（Claude Code）

本项目为个人长期维护项目。

Claude 在修改任何代码之前，必须遵守以下所有规范。

违反任何规范，都应停止生成代码并提醒开发者。

---

# 一、项目目标

TripFlow 是一个 AI 行程规划微信小程序。

目标：

输入目的地

↓

AI生成旅行计划

↓

POI富化

↓

用户编辑

↓

保存分享

整个项目优先：

稳定

可维护

低耦合

而不是快速堆功能。

---

# 二、第一原则

始终遵循：

> Clean Architecture

以及：

> Domain Driven Design（轻量版）

禁止：

业务逻辑写进页面

页面调用数据库

页面调用AI

页面直接处理JSON

所有业务必须经过：

UI

↓

Store

↓

UseCase

↓

Repository

↓

Infrastructure

---

# 三、禁止事项

禁止：

- 超过300行的文件
- 超过50行的方法
- 一个方法负责多个业务
- 页面写业务逻辑
- 复制粘贴相同代码
- 魔法字符串
- 魔法数字
- console.log 调试代码提交
- any 类型（TypeScript）
- 忽略错误处理
- Promise 不捕获异常

发现以上情况：

必须主动重构。

---

# 四、目录规范

严格按照：

miniprogram/

components/

pages/

stores/

use-cases/

services/

utils/

shared/

domain/

repositories/

infrastructure/

cloud/

进行开发。

禁止新增随意目录。

---

# 五、Domain规范

Domain：

不能依赖：

微信API

CloudBase

HTTP

AI

Storage

SDK

Domain：

只允许：

实体

值对象

状态机

领域事件

错误定义

---

# 六、UseCase规范

所有业务必须写在：

use-cases/

例如：

GenerateTripUseCase

ModifyTripUseCase

EnrichPOIUseCase

禁止：

页面直接：

callCloudFunction()

---

# 七、Repository规范

所有数据库操作：

必须经过：

Repository。

禁止：

页面：

db.collection()

禁止：

UseCase：

wx.cloud.database()

必须：

TripRepository

ConversationRepository

POIRepository

统一管理。

---

# 八、AI规范

禁止：

页面直接请求AI。

统一：

LLMClient

↓

PromptBuilder

↓

ResponsePipeline

↓

DTO

↓

Domain

Prompt：

必须版本管理。

例如：

trip.generate.v1.js

trip.modify.v1.js

禁止：

Prompt 写死。

---

# 九、DTO规范

AI返回：

必须：

Raw JSON

↓

DTO

↓

Schema Validate

↓

Repair

↓

Business Validate

↓

Domain

禁止：

AI JSON

直接渲染页面。

---

# 十、错误处理

所有异常：

必须：

throw AppError。

例如：

AI.TIMEOUT

MAP.NOT_FOUND

DB.SAVE_FAILED

禁止：

throw "error"

禁止：

return false

---

# 十一、状态管理

统一：

MobX。

页面：

禁止：

维护复杂状态。

Store：

负责：

数据。

View：

负责：

显示。

Store 即 ViewModel，不额外加一层。

---

# 十二、命名规范

类：

PascalCase

变量：

camelCase

常量：

UPPER_CASE

文件：

PascalCase（类）

camelCase（工具）

禁止：

test2.js

newFile.js

tmp.js

---

# 十三、组件规范

组件：

单一职责。

一个组件：

一个功能。

超过：

200行：

必须拆分。

---

# 十四、函数规范

函数：

必须：

职责单一。

推荐：

20行以内。

最长：

50行。

参数：

超过4个：

必须：

封装对象。

---

# 十五、提交代码前

Claude 必须检查：

✓ ESLint

✓ 类型错误

✓ 重复代码

✓ 未使用变量

✓ TODO

✓ FIXME

✓ console.log

✓ 死代码

发现问题：

优先修复。

---

# 十六、修改原则

Claude：

优先：

修改已有代码。

禁止：

无意义重写。

禁止：

改变架构。

禁止：

修改接口。

除非：

开发者明确要求。

---

# 十七、性能原则

优先：

减少：

AI请求

数据库请求

重复渲染

重复计算

缓存：

优先。

---

# 十八、代码风格

优先：

可读性。

宁愿：

多写几行。

不要：

一行完成所有逻辑。

禁止：

三层以上嵌套。

推荐：

提前return。

---

# 十九、测试

新增：

UseCase：

必须：

补测试。

新增：

Prompt：

必须：

补Fixture。

---

# 二十、生成代码要求

Claude：

每次生成代码：

必须：

1.

说明修改原因。

2.

说明影响范围。

3.

说明风险。

4.

说明是否破坏兼容。

5.

列出新增文件。

禁止：

直接输出大量代码。

---

# 二十一、开发模式

Claude 不要一次完成多个需求。

每次：

只完成一个 User Story。

例如：

US-01

完成：

✓ Domain

✓ DTO

✓ Repository

✓ UseCase

✓ Store

✓ UI

✓ Test

完成以后：

停止。

等待下一步。

禁止：

顺手完成其它Story。

---

# 二十二、架构守护

Claude 有责任维护整个项目架构。

如果开发者提出的需求：

会导致：

- 增加耦合
- 破坏分层
- 重复代码
- 绕过Repository
- 绕过UseCase
- 绕过DTO
- 页面直接调用AI
- 页面直接访问数据库

Claude 必须：

指出问题。

给出更合理方案。

未经开发者确认：

不得生成违反架构的代码。
