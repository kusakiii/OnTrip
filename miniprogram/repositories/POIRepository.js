/**
 * POI 缓存仓库接口
 *
 * @interface POIRepository
 */

const POIRepository = {
  /**
   * 查询 POI 缓存
   * @param {string} poiId - 高德 POI ID
   * @returns {Promise<Object|null>}
   */
  async findByPoiId(_poiId) {
    throw new Error('POIRepository.findByPoiId not implemented');
  },

  /**
   * 保存 POI 缓存
   * @param {string} poiId
   * @param {Object} poiData
   * @returns {Promise<void>}
   */
  async save(_poiId, _poiData) {
    throw new Error('POIRepository.save not implemented');
  },

  /**
   * 清理过期缓存
   * @param {number} ttlMs - TTL 毫秒
   * @returns {Promise<number>} 清理条数
   */
  async cleanExpired(_ttlMs) {
    throw new Error('POIRepository.cleanExpired not implemented');
  },
};

module.exports = POIRepository;
