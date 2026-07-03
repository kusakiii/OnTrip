/**
 * ConversationRepository 接口
 *
 * @interface ConversationRepository
 */

const ConversationRepository = {
  /**
   * 按行程 ID 查找关联对话
   * @param {string} tripId
   * @returns {Promise<Object|null>}
   */
  async findByTripId(_tripId) {
    throw new Error('ConversationRepository.findByTripId not implemented');
  },

  /**
   * 保存对话
   * @param {string} tripId
   * @param {Object} conversation
   * @returns {Promise<void>}
   */
  async save(_tripId, _conversation) {
    throw new Error('ConversationRepository.save not implemented');
  },

  /**
   * 删除对话
   * @param {string} tripId
   * @returns {Promise<void>}
   */
  async delete(_tripId) {
    throw new Error('ConversationRepository.delete not implemented');
  },
};

module.exports = ConversationRepository;
