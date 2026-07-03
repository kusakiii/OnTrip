/**
 * CloudBase 实现 — TripRepository
 *
 * 职责：将 Trip 聚合根持久化到微信云数据库
 * 原则：Repository 只做数据存取，不包含业务逻辑
 */

const { AppError, ErrorCodes } = require('../../domain');
const logger = require('../../utils/logger');

const COLLECTION_NAME = 'trips';

/**
 * 获取数据库集合引用
 */
function getCollection() {
  const db = wx.cloud.database();
  return db.collection(COLLECTION_NAME);
}

/**
 * @implements {import('../../repositories/TripRepository')}
 */
const CloudBaseTripRepository = {
  async findById(tripId) {
    try {
      const coll = getCollection();
      const result = await coll.doc(tripId).get();
      if (!result.data || result.data.length === 0) {
        return null;
      }
      return result.data[0];
    } catch (err) {
      logger.error('Failed to find trip by id', { tripId, error: err.message });
      throw new AppError(ErrorCodes.DB_READ_FAILED, 'Failed to read trip', {
        severity: 'error',
        recoverable: true,
        cause: err,
        userMessage: '加载失败，请下拉刷新',
      });
    }
  },

  async save(trip) {
    try {
      const coll = getCollection();
      const data = {
        ...trip,
        _id: trip.tripId,
        _updateTime: Date.now(),
      };

      // 检查是否已存在（upsert）
      const existing = await coll
        .doc(trip.tripId)
        .get()
        .catch(() => ({ data: [] }));
      if (existing.data && existing.data.length > 0) {
        // 乐观锁检查
        const saved = existing.data[0];
        if (saved.version !== trip.version - 1 && saved.version !== trip.version) {
          throw new AppError(ErrorCodes.DB_CONFLICT, 'Optimistic lock conflict', {
            severity: 'error',
            recoverable: true,
            userMessage: '数据已被更新，请刷新后重试',
          });
        }
        await coll.doc(trip.tripId).update({ data });
      } else {
        await coll.add({ data });
      }
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      logger.error('Failed to save trip', { tripId: trip.tripId, error: err.message });
      throw new AppError(ErrorCodes.DB_SAVE_FAILED, 'Failed to save trip', {
        severity: 'error',
        recoverable: true,
        cause: err,
        userMessage: '保存失败，请检查网络后重试',
      });
    }
  },

  async findByUser(userId, page = 1, pageSize = 20) {
    try {
      const coll = getCollection();
      const result = await coll
        .where({ _openid: userId })
        .orderBy('_updateTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .field({
          tripId: true,
          'destination.city': true,
          days: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        })
        .get();

      return (result.data || []).map((item) => ({
        tripId: item.tripId,
        destination: item.destination?.city || '',
        days: item.days,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
    } catch (err) {
      logger.error('Failed to find trips by user', { userId, error: err.message });
      throw new AppError(ErrorCodes.DB_READ_FAILED, 'Failed to read trips', {
        severity: 'error',
        recoverable: true,
        cause: err,
        userMessage: '加载失败，请下拉刷新',
      });
    }
  },

  async delete(tripId) {
    try {
      const coll = getCollection();
      await coll.doc(tripId).remove();
    } catch (err) {
      logger.error('Failed to delete trip', { tripId, error: err.message });
      throw new AppError(ErrorCodes.DB_SAVE_FAILED, 'Failed to delete trip', {
        severity: 'error',
        recoverable: true,
        cause: err,
        userMessage: '删除失败，请稍后重试',
      });
    }
  },
};

module.exports = CloudBaseTripRepository;
