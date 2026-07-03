/**
 * trip-manager 云函数 — 行程 CRUD
 *
 * 操作：
 * - get:    按 tripId 获取行程
 * - list:   获取用户所有行程摘要（分页）
 * - save:   创建/更新行程
 * - delete: 删除行程
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const COLLECTION = 'trips';

exports.main = async (event, _context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();

  switch (action) {
    case 'get':
      return getTrip(event.tripId);
    case 'list':
      return listTrips(OPENID, event.page || 1, event.pageSize || 20);
    case 'save':
      return saveTrip(OPENID, event.trip);
    case 'delete':
      return deleteTrip(event.tripId);
    default:
      return { ok: false, error: 'INVALID_ACTION', message: `Unknown action: ${action}` };
  }
};

async function getTrip(tripId) {
  if (!tripId) {
    return { ok: false, error: 'VAL002', message: 'tripId is required' };
  }
  try {
    const result = await db.collection(COLLECTION).doc(tripId).get();
    if (!result.data || result.data.length === 0) {
      return { ok: false, error: 'NOT_FOUND', message: 'Trip not found' };
    }
    return { ok: true, trip: result.data[0] };
  } catch (err) {
    console.error('[trip-manager] get failed:', err.message);
    return { ok: false, error: 'DB002', message: 'Failed to read trip' };
  }
}

async function listTrips(openId, page, pageSize) {
  try {
    const result = await db
      .collection(COLLECTION)
      .where({ _openid: openId })
      .orderBy('updatedAt', 'desc')
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

    const trips = (result.data || []).map((item) => ({
      tripId: item.tripId,
      destination: item.destination?.city || '',
      days: item.days,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return { ok: true, trips };
  } catch (err) {
    console.error('[trip-manager] list failed:', err.message);
    return { ok: false, error: 'DB002', message: 'Failed to list trips' };
  }
}

async function saveTrip(openId, trip) {
  if (!trip || !trip.tripId) {
    return { ok: false, error: 'VAL002', message: 'trip with tripId is required' };
  }
  try {
    const doc = {
      ...trip,
      _openid: openId,
      _id: trip.tripId,
      updatedAt: new Date().toISOString(),
    };

    // upsert: 先查是否存在
    const existing = await db
      .collection(COLLECTION)
      .doc(trip.tripId)
      .get()
      .catch(() => ({ data: [] }));

    if (existing.data && existing.data.length > 0) {
      await db.collection(COLLECTION).doc(trip.tripId).update({ data: doc });
    } else {
      await db.collection(COLLECTION).add({ data: doc });
    }

    return { ok: true, tripId: trip.tripId };
  } catch (err) {
    console.error('[trip-manager] save failed:', err.message);
    return { ok: false, error: 'DB001', message: 'Failed to save trip' };
  }
}

async function deleteTrip(tripId) {
  if (!tripId) {
    return { ok: false, error: 'VAL002', message: 'tripId is required' };
  }
  try {
    await db.collection(COLLECTION).doc(tripId).remove();
    return { ok: true };
  } catch (err) {
    console.error('[trip-manager] delete failed:', err.message);
    return { ok: false, error: 'DB001', message: 'Failed to delete trip' };
  }
}
