/**
 * 行程修改 Prompt v1
 *
 * 根据用户对话消息，调整已有行程。
 * 支持意图：替换/新增/删除/全局调整/风格变更/查询
 */

function build(params) {
  const { destination, currentItinerary, userMessage, conversationHistory = [] } = params;

  const historyText = conversationHistory
    .slice(-6) // 最近 6 轮对话
    .map((m) => `${m.role === 'user' ? '用户' : 'AI'}: ${m.text}`)
    .join('\n');

  const itineraryJson = JSON.stringify(currentItinerary, null, 2);

  return `你是一个专业的旅行规划师。#NO_TALK
你的输出直接被程序解析，JSON 之外的任何文字都会导致错误。

---TASK---
用户正在规划${destination}的旅行，以下是当前行程：

\`\`\`json
${itineraryJson}
\`\`\`

用户说：「${userMessage}」

请根据用户的要求修改行程，返回完整的修改后行程 JSON。

---RULES---
1. 只修改用户明确要求的部分，其余保持不变。
2. 保持每天 1-5 个行程节点，包含景点和餐饮。
3. 景点名称必须使用可被地图 API 搜索到的标准全称。
4. 每个节点必须包含：type, name, searchName, timeRange, duration, description。
5. 如果是新增节点，需要合理插入到时间线中。
6. 如果是删除节点，移除后调整后续时间线。

---CONTEXT---
目的地：${destination}
${historyText ? `\n对话历史：\n${historyText}\n` : ''}

---FORMAT---
返回完整的 itinerary JSON 数组（仅 itinerary，不含外层包装）：

[
  {
    "dayIndex": 1,
    "cards": [
      {
        "type": "spot",
        "name": "标准全称",
        "searchName": "简洁搜索名",
        "amapCategory": "风景名胜",
        "timeRange": "09:00-11:00",
        "duration": 120,
        "description": "简介",
        "ticketPrice": "价格",
        "transportFromPrevious": "步行 15分钟",
        "rating": 4.5
      }
    ]
  }
]`;
}

module.exports = build;
