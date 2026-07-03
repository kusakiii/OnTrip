# TripFlow — 数据库 Schema

**版本**：v1.0
**日期**：2026-07-03
**数据库**：CloudBase NoSQL（文档型）

---

## 1. trips 集合

```json
{
  "_id": "trip_abc123",
  "_openid": "user_openid_xxx",
  "destination": "杭州",
  "days": 3,
  "styleTags": ["food"],
  "status": "ready",
  "createdAt": "2026-07-03T10:00:00+08:00",
  "updatedAt": "2026-07-03T11:30:00+08:00",
  "version": 4,
  "editCount": 12,
  "lastViewedAt": "2026-07-05T09:00:00+08:00",

  "itinerary": [
    {
      "dayIndex": 1,
      "date": null,
      "summary": {
        "totalDistance": "8.5km",
        "estimatedCost": 420,
        "spotCount": 5
      },
      "cards": [
        {
          "cardId": "card_001",
          "type": "spot",
          "name": "西湖风景名胜区-断桥残雪",
          "searchName": "断桥残雪",
          "timeRange": "09:00-11:00",
          "duration": 120,
          "description": "西湖十景之一",
          "location": { "lat": 30.259, "lng": 120.149 },
          "address": "杭州市西湖区北山街",
          "rating": 4.6,
          "ticketPrice": "免费",
          "openHours": "全天",
          "photos": ["https://..."],
          "tags": ["西湖十景", "历史遗迹"],
          "businessArea": "西湖风景区",
          "transportFromPrevious": null,
          "isStarred": false,
          "userNote": null,
          "_poiStatus": "verified",
          "_dataSource": "amap",
          "_version": 1
        }
      ]
    }
  ],

  "conversation": {
    "conversationId": "conv_abc123",
    "messages": [
      {
        "role": "user",
        "text": "第二天下午换个户外景点",
        "timestamp": "2026-07-03T11:30:00+08:00"
      },
      {
        "role": "ai",
        "text": "好的，我为你推荐3个替代景点...",
        "action": "replace",
        "undoable": true,
        "timestamp": "2026-07-03T11:30:05+08:00"
      }
    ],
    "snapshotStack": [{ "snapshotId": "snap_001", "tripJson": "...", "createdAt": "..." }]
  }
}
```

### 字段来源标注

| 字段                    | 来源               | 可空 | 说明                                 |
| ----------------------- | ------------------ | ---- | ------------------------------------ |
| `cardId`                | 系统生成           | ❌   | UUID                                 |
| `type`                  | AI 生成            | ❌   | spot/food/shop/hotel/transport       |
| `name`                  | AI 生成 → POI 修正 | ❌   | 标准全称                             |
| `searchName`            | AI 生成            | ❌   | 去括号后缀的简洁版                   |
| `timeRange`             | AI 生成            | ❌   | "HH:MM-HH:MM"                        |
| `duration`              | AI 生成            | ❌   | 分钟                                 |
| `description`           | AI 生成            | ❌   | 20 字内                              |
| `location`              | POI 富化           | ✅   | 精确坐标                             |
| `address`               | POI 富化           | ✅   | 详细地址                             |
| `rating`                | POI 富化           | ✅   | 5 分制                               |
| `ticketPrice`           | POI 富化           | ✅   | "¥120/人" 或 "免费"                  |
| `openHours`             | POI 富化           | ✅   | "11:00-14:00,17:00-21:00"            |
| `photos`                | POI 富化           | ✅   | URL 数组                             |
| `tags`                  | POI 富化           | ✅   | 特色标签数组                         |
| `businessArea`          | POI 富化           | ✅   | 商圈名                               |
| `transportFromPrevious` | AI 生成 → 修正     | ✅   | null 表示首站                        |
| `isStarred`             | 用户修改           | ❌   | 默认 false                           |
| `userNote`              | 用户修改           | ✅   | 自由文本                             |
| `_poiStatus`            | 系统               | ❌   | verified/not_found/api_error/pending |
| `_dataSource`           | 系统               | ❌   | ai/amap/tencent/user                 |
| `_version`              | 系统               | ❌   | 乐观锁                               |

---

## 2. poi_cache 集合

```json
{
  "_id": "B000A8U5Y8",
  "data": {
    "name": "断桥残雪",
    "rating": 4.6,
    "avgPrice": null,
    "photos": ["https://..."],
    "location": { "lat": 30.259, "lng": 120.149 },
    "address": "杭州市西湖区北山街",
    "tags": ["西湖十景", "历史遗迹"],
    "businessArea": "西湖风景区",
    "openHours": "全天"
  },
  "_updateTime": 1688371200000
}
```

| 字段          | 说明                             |
| ------------- | -------------------------------- |
| `_id`         | 高德 POI ID（缓存 Key）          |
| `data`        | 标准化 POI 数据                  |
| `_updateTime` | 写入时间戳（用于 7 天 TTL 判断） |

---

## 3. 索引设计

```javascript
// trips 集合
db.collection('trips').createIndex({ _openid: 1, updatedAt: -1 }); // 用户行程列表
db.collection('trips').createIndex({ status: 1 }); // 按状态筛选

// poi_cache 集合
db.collection('poi_cache').createIndex({ _updateTime: 1 }, { expireAfterSeconds: 604800 }); // 7天 TTL
```
