/**
 * Conversation 实体 — 对话上下文
 *
 * 存储所有对话消息 + 撤销栈
 * 撤销栈最多保留 10 层快照，用于撤销对话修改。
 */

const MAX_SNAPSHOT_STACK = 10;

/**
 * 创建对话
 *
 * @param {string} [conversationId] - 可选，不提供则自动生成
 * @returns {Object} 不可变 Conversation 对象
 */
function createConversation(conversationId) {
  return Object.freeze({
    conversationId:
      conversationId ||
      `conv_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`,
    messages: [],
    snapshotStack: [],
  });
}

/**
 * 添加消息
 *
 * @param {Object} conversation
 * @param {'user'|'ai'|'system'} role
 * @param {string} text
 * @param {Object} [options]
 * @param {string} [options.action] - ChatAction 类型
 * @param {boolean} [options.undoable=false]
 * @returns {Object} 新 Conversation
 */
function addMessage(conversation, role, text, options = {}) {
  const message = Object.freeze({
    role,
    text,
    action: options.action || null,
    undoable: options.undoable ?? false,
    timestamp: new Date().toISOString(),
  });

  return Object.freeze({
    ...conversation,
    messages: Object.freeze([...conversation.messages, message]),
  });
}

/**
 * 推入撤销快照
 *
 * @param {Object} conversation
 * @param {Object} tripSnapshot - Trip 的序列化快照
 * @returns {Object} 新 Conversation
 */
function pushSnapshot(conversation, tripSnapshot) {
  const stack = [...conversation.snapshotStack, tripSnapshot];
  // 超过上限则丢弃最旧的
  if (stack.length > MAX_SNAPSHOT_STACK) {
    stack.shift();
  }
  return Object.freeze({
    ...conversation,
    snapshotStack: Object.freeze(stack),
  });
}

/**
 * 弹出最近一个撤销快照（用于撤销操作）
 *
 * @param {Object} conversation
 * @returns {{ conversation: Object, snapshot: Object|null }}
 */
function popSnapshot(conversation) {
  if (conversation.snapshotStack.length === 0) {
    return { conversation, snapshot: null };
  }
  const stack = [...conversation.snapshotStack];
  const snapshot = stack.pop();
  return {
    conversation: Object.freeze({
      ...conversation,
      snapshotStack: Object.freeze(stack),
    }),
    snapshot,
  };
}

/**
 * 获取对话消息数量
 */
function getMessageCount(conversation) {
  return conversation.messages.length;
}

module.exports = {
  createConversation,
  addMessage,
  pushSnapshot,
  popSnapshot,
  getMessageCount,
  MAX_SNAPSHOT_STACK,
};
