# TripFlow API 契约

## trip-manager 云函数

### POST trip-manager.create

从 AI 生成的 JSON 创建行程。

```
Request:
{
  "action": "create",
  "trip": { ... }        // AI 生成 + DTO 校验过的行程 JSON
}

Response (200):
{
  "tripId": "trip_abc123",
  "version": 1,
  "status": "ready"
}

Error:
SYS001 未知错误
DB001  保存失败
```

### POST trip-manager.update

更新已存在的行程（自动保存 + 手动保存）。

```
Request:
{
  "action": "update",
  "tripId": "trip_abc123",
  "version": 3,          // 乐观锁
  "trip": { ... }
}

Response (200):
{
  "version": 4
}

Error:
DB003  乐观锁冲突（版本号不匹配）→ 前端重新拉取最新版本后重试
DB001  保存失败
```

### POST trip-manager.get

获取单个行程详情。

```
Request:
{
  "action": "get",
  "tripId": "trip_abc123"
}

Response (200):
{
  "trip": { ... },
  "version": 4
}

Error:
DB002  读取失败
```

### POST trip-manager.list

获取用户的历史行程列表。

```
Request:
{
  "action": "list",
  "page": 1,
  "pageSize": 10
}

Response (200):
{
  "trips": [
    {
      "tripId": "trip_abc123",
      "destination": "杭州",
      "days": 3,
      "styleTags": ["food"],
      "createdAt": "2026-07-03T10:00:00+08:00",
      "cardCount": 13,
      "status": "ready"
    }
  ],
  "total": 5,
  "hasMore": false
}
```

### POST trip-manager.delete

删除行程（二次确认后）。

```
Request:
{
  "action": "delete",
  "tripId": "trip_abc123"
}

Response (200):
{ "deleted": true }
```

---

## ai-chat 云函数

### POST ai-chat.generate

生成行程。

```
Request:
{
  "action": "generate",
  "destination": "杭州",
  "days": 3,
  "styleTags": ["food"]
}

Response (200 — 富化成功):
{
  "trip": { ... },       // 已通过 DTO + POI 富化的完整行程
  "stats": {
    "generateTimeMs": 12000,
    "enrichTimeMs": 1500,
    "cardsTotal": 13,
    "cardsEnriched": 11,
    "cardsNotFound": 2,
    "model": "deepseek-v4-flash",
    "promptVersion": "trip.generate.v1"
  }
}

Error:
AI001  超时
AI002  JSON 非法
AI003  Schema 不匹配
AI006  限流
```

### POST ai-chat.modify

对话微调行程。

```
Request:
{
  "action": "modify",
  "userMessage": "第二天下午换个户外景点",
  "tripSummary": "D1: 西湖→知味观→灵隐寺 | D2: 西溪→外婆家→博物馆→太子湾",
  "activeDayIndex": 2,
  "conversationHistory": [...]
}

Response (200):
{
  "intent": "replace",
  "confidence": 0.92,
  "changes": [
    {
      "cardId": "card_008",
      "action": "replace",
      "candidates": [
        { "name": "九溪烟树", "searchName": "九溪烟树", "type": "spot", "reason": "..." },
        { "name": "龙井村", "searchName": "龙井村", "type": "spot", "reason": "..." },
        { "name": "云栖竹径", "searchName": "云栖竹径", "type": "spot", "reason": "..." }
      ]
    }
  ],
  "undoable": true
}

Error:
AI001  超时
AI003  Schema 不匹配
```

---

## poi-search 云函数

### POST poi-search.verify

校验单个 POI 并返回富化数据。

```
Request:
{
  "action": "verify",
  "name": "断桥残雪",
  "city": "杭州",
  "type": "spot"
}

Response (200 — 匹配成功):
{
  "status": "verified",
  "poi": {
    "name": "断桥残雪",
    "rating": 4.6,
    "avgPrice": null,
    "photos": ["https://..."],
    "location": { "lat": 30.259, "lng": 120.149 },
    "address": "杭州市西湖区北山街",
    "tags": ["西湖十景", "历史遗迹"],
    "businessArea": "西湖风景区",
    "poiId": "B000A8U5Y8"
  }
}

Response (200 — 未匹配):
{
  "status": "not_found"
}

Error:
MAP001  POI 未找到
MAP002  超时
MAP003  API 错误
```
