/**
 * 行程生成 Prompt v1 — DeepSeek V4 Flash 版本
 *
 * 核心约束：
 * 1. POI 名称必须使用可被地图 API 搜索到的标准全称
 * 2. 输出严格 JSON，任何非 JSON 文字将导致解析错误
 * 3. 每天 3-5 个卡片，覆盖景点 + 餐饮
 *
 * 版本记录：
 * v1 (2026-07-03): 初始版本，含名称标准化约束
 * v0 (已归档): 无搜索名称字段
 */

function build(params) {
  const { destination, days, styleTags = [] } = params;
  const styleDesc = styleTags.length > 0 ? styleTags.join('、') : '综合推荐';

  return `你是一个专业的旅行规划师。#NO_TALK
你的输出直接被程序解析，JSON 之外的任何文字都会导致错误。

---TASK---
为${destination}规划一份${days}天的行程，风格偏好：${styleDesc}。

---RULES---
1. 每天安排 3-5 个行程节点，包含景点和餐饮。
2. 合理安排时间（景点 2-3 小时，餐厅 1-1.5 小时），确保路线顺畅。
3. 景点名称必须使用可被地图 API 搜索到的标准全称，例如：
   - "西湖风景名胜区-断桥残雪" 而非 "西湖断桥"
   - "知味观·味庄(杨公堤店)" 而非 "知味观·味庄"
   - "灵隐寺" 而非 "杭州灵隐寺"
4. 每个节点除了 name 外，额外输出 searchName（去掉括号后缀的简洁版本，用于地图搜索）。
5. 每个节点输出 amapCategory（高德分类码）：景点用"风景名胜"或"公园广场"，餐饮用"餐饮"。
6. 交通方式用步行/打车/地铁，标注预估时间。

---CONTEXT---
目的地：${destination}（城市）
天数：${days}天
风格：${styleDesc}

---FORMAT---
严格按以下 JSON Schema 输出，不要添加任何解释文字：

{
  "itinerary": [
    {
      "dayIndex": 1,
      "cards": [
        {
          "type": "spot",
          "name": "标准全称",
          "searchName": "去掉括号后缀的简洁版",
          "amapCategory": "风景名胜",
          "timeRange": "09:00-11:00",
          "duration": 120,
          "description": "20 字内简介",
          "ticketPrice": "免费或价格",
          "transportFromPrevious": "步行 15分钟|打车 20分钟|地铁 3站|null(首站)",
          "rating": 4.5,
          "isStarred": false
        }
      ]
    }
  ]
}

---EXAMPLES---
正确示例：
{"name": "西湖风景名胜区-断桥残雪", "searchName": "断桥残雪", "amapCategory": "风景名胜", "type": "spot"}
{"name": "知味观·味庄(杨公堤店)", "searchName": "知味观·味庄", "amapCategory": "餐饮", "type": "food"}
{"name": "湖滨银泰in77", "searchName": "湖滨银泰in77", "amapCategory": "购物", "type": "shop"}

错误示例（不要这样）：
{"name": "西湖", ...}  → 太模糊，无法搜索
{"name": "外婆家", ...} → 缺少分店名，全国几百家
{"name": "必去的网红打卡地——洪崖洞", ...} → 不要加修饰词`;
}

module.exports = build;
