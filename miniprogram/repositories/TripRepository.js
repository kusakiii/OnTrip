/**
 * TripRepository 接口（Domain 层定义，Infrastructure 实现）
 *
 * 契约：
 * - 所有方法返回 Promise
 * - find 类方法返回 null 表示未找到（不抛异常）
 * - save/delete 操作失败时抛 AppError
 *
 * @interface TripRepository
 */

const TripRepository = {
  /**
   * 按 ID 查找行程
   * @param {string} tripId
   * @returns {Promise<Object|null>}
   */
  async findById(_tripId) {
    throw new Error('TripRepository.findById not implemented');
  },

  /**
   * 保存行程（新增或更新）
   * @param {Object} trip
   * @returns {Promise<void>}
   */
  async save(_trip) {
    throw new Error('TripRepository.save not implemented');
  },

  /**
   * 按用户分页查找行程摘要列表
   * @param {string} userId
   * @param {number} page
   * @param {number} pageSize
   * @returns {Promise<Array<{tripId:string, destination:string, days:number, status:string, createdAt:string}>>}
   */
  async findByUser(_userId, _page = 1, _pageSize = 20) {
    throw new Error('TripRepository.findByUser not implemented');
  },

  /**
   * 删除行程
   * @param {string} tripId
   * @returns {Promise<void>}
   */
  async delete(_tripId) {
    throw new Error('TripRepository.delete not implemented');
  },
};

module.exports = TripRepository;
