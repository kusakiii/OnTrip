/**
 * generate-trip 云函数 — 行程生成
 *
 * 流程：
 *  ① 参数校验（destination, days, styleTags）
 *  ② 构建 Prompt（用 trip.generate.v1 模板）
 *  ③ 调用 DeepSeek API（fallback Qwen）
 *  ④ JSON 解析 + 基础校验
 *  ⑤ 返回 Trip 数据给前端
 *
 * 前端收到数据后，通过 ResponsePipeline 做完整校验和 Domain 映射。
 */

// ========================
// 配置（云函数环境变量）
// ========================
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const QWEN_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

const TIMEOUT_MS = 60000;

// ========================
// 主入口
// ========================
exports.main = async (event, _context) => {
  const startTime = Date.now();
  const { destination, days, styleTags = [] } = event;

  // ── ① 参数校验 ──
  if (!destination || typeof destination !== 'string' || !destination.trim()) {
    return { ok: false, error: 'VAL001', message: '目的地不能为空' };
  }
  if (!days || typeof days !== 'number' || days < 1 || days > 15) {
    return { ok: false, error: 'VAL001', message: '天数必须在 1-15 之间' };
  }

  console.log(`[generate-trip] Start: ${destination}, ${days}天, styles: ${styleTags.join(',')}`);

  // ── ② 构建 Prompt ──
  const prompt = buildPrompt({ destination: destination.trim(), days, styleTags });

  // ── ③ 调用 LLM ──
  let llmResult;
  try {
    llmResult = await callLLM(prompt);
  } catch (err) {
    console.error('[generate-trip] LLM call failed:', err.message);
    return {
      ok: false,
      error: 'AI001',
      message: 'AI 生成失败：' + (err.userMessage || err.message),
      duration: Date.now() - startTime,
    };
  }

  // ── ④ 解析 JSON ──
  let parsed;
  try {
    parsed = parseLLMResponse(llmResult.content);
  } catch (err) {
    console.error('[generate-trip] JSON parse failed:', err.message);
    return {
      ok: false,
      error: 'AI002',
      message: 'AI 返回数据格式异常',
      rawPreview: llmResult.content.slice(0, 200),
      duration: Date.now() - startTime,
    };
  }

  // ── ⑤ 基础校验（详细校验由前端 ResponsePipeline 完成） ──
  if (!parsed.itinerary || !Array.isArray(parsed.itinerary) || parsed.itinerary.length === 0) {
    return {
      ok: false,
      error: 'AI003',
      message: 'AI 生成的行程数据不完整',
      duration: Date.now() - startTime,
    };
  }

  // ── ⑥ 组装返回 ──
  const tripData = {
    destination: destination.trim(),
    days,
    styleTags,
    itinerary: parsed.itinerary,
    model: llmResult.model,
    usage: llmResult.usage,
    duration: Date.now() - startTime,
  };

  console.log(
    `[generate-trip] Success: ${tripData.itinerary.length} days, ${countCards(tripData)} cards, ${tripData.duration}ms`,
  );

  return { ok: true, trip: tripData };
};

// ========================
// Prompt 构建
// ========================
function buildPrompt({ destination, days, styleTags }) {
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
7. 每天的首张卡片 transportFromPrevious 必须为 null。

---CONTEXT---
目的地：${destination}（城市）
天数：${days}天
风格：${styleDesc}

---FORMAT---
严格按以下 JSON 输出，不要添加任何解释文字：

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
          "transportFromPrevious": null,
          "rating": 4.5
        },
        {
          "type": "food",
          "name": "餐厅全称(分店名)",
          "searchName": "餐厅简洁名",
          "amapCategory": "餐饮",
          "timeRange": "11:30-13:00",
          "duration": 90,
          "description": "简介",
          "ticketPrice": "¥80/人",
          "transportFromPrevious": "步行 15分钟",
          "rating": 4.3
        }
      ]
    }
  ]
}

---EXAMPLES---
正确：
{"name": "西湖风景名胜区-断桥残雪", "searchName": "断桥残雪", "type": "spot"}
{"name": "知味观·味庄(杨公堤店)", "searchName": "知味观·味庄", "type": "food"}

错误（不要这样）：
{"name": "西湖" ...} → 太模糊
{"name": "外婆家" ...} → 缺少分店名`;
}

// ========================
// LLM 调用
// ========================
async function callLLM(prompt) {
  // 主模型: DeepSeek
  try {
    return await callDeepSeek(prompt);
  } catch (err) {
    console.warn('[generate-trip] DeepSeek failed, trying Qwen fallback:', err.message);
    try {
      return await callQwen(prompt);
    } catch (qwenErr) {
      console.error('[generate-trip] All models failed:', qwenErr.message);
      throw qwenErr;
    }
  }
}

async function callDeepSeek(prompt) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }
  return callOpenAICompatibleAPI(DEEPSEEK_URL, DEEPSEEK_API_KEY, 'deepseek-chat', prompt);
}

async function callQwen(prompt) {
  if (!QWEN_API_KEY) {
    throw new Error('QWEN_API_KEY not configured');
  }
  return callOpenAICompatibleAPI(QWEN_URL, QWEN_API_KEY, 'qwen-plus', prompt);
}

async function callOpenAICompatibleAPI(url, apiKey, model, prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${body.slice(0, 300)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      throw new Error('Empty response from LLM');
    }

    return {
      content,
      model: data.model || model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

// ========================
// JSON 解析
// ========================
function parseLLMResponse(raw) {
  let text = raw.trim();

  // 去掉可能的 markdown ```json ... ``` 包裹
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  return JSON.parse(text);
}

// ========================
// 辅助
// ========================
function countCards(tripData) {
  return tripData.itinerary.reduce((sum, day) => sum + (day.cards ? day.cards.length : 0), 0);
}
