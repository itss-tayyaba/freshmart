/**
 * server/controllers/storeZoneController.js
 *
 * Store delivery-zone polygons (the area a single store delivers to).
 *
 *  - Super admin  : can create / edit the polygon of ANY store, and can assign a zone.
 *  - Store admin  : can create / edit ONLY the polygon of his own store.
 *  - Every save is validated (3-50 points, no self-crossing), versioned and stamped
 *    with who changed it and when, so the super admin dashboard can see it.
 *
 * Polygon format stored in Branch/Store.deliveryPolygon stays what your React code
 * already uses:  [[lat, lng], [lat, lng], ...]   (no repeated closing point).
 */
import * as turf from '@turf/turf';
import { Branch } from '../models/Branch.js';
import { Store } from '../models/Store.js';
import { DeliveryZone } from '../models/DeliveryZone.js';
import { isDbOnline } from '../config/db.js';
import { validateAndNormalizePolygon } from '../utils/gisValidator.js';
import { resolveTenantId, isSameTenant, BRANCHES } from '../../src/data/companyHierarchyData.js';
import { loadDiskBranches, saveDiskBranch } from './companyBranchController.js';
import { loadDiskStores, saveDiskStores } from './storeController.js';
import { BASELINE_FOUR_STORES } from '../../src/utils/storeHelper.js';

const MIN_VERTICES = 3;
const MAX_VERTICES = 50;

const roleOf = (req) => String(req.user?.role || '').toLowerCase().trim();
const isSuper = (req) => {
  const r = roleOf(req).replace(/[\s_-]+/g, '');
  return r === 'superadmin' || !!req.user?.isSuperAdmin || r.includes('super');
};
const actorName = (req) =>
  req.user?.name || req.user?.email || req.user?.username || String(req.user?.id || 'unknown');

const findBranch = async (id) => {
  if (!id) return null;
  const cleanId = String(id).trim();

  // 1. Check MongoDB Branch collection
  try {
    const b = await Branch.findOne({ $or: [{ _id: cleanId }, { id: cleanId }] }).lean();
    if (b) return b;
  } catch (err) {
    console.warn('Branch find error:', err.message);
  }

  // 2. Check MongoDB Store collection (Store schema uses storeId and _id)
  try {
    const s = await Store.findOne({ $or: [{ storeId: cleanId }, { _id: cleanId }] }).lean();
    if (s) {
      return {
        _id: s.storeId || s._id,
        id: s.storeId || s._id,
        tenantId: s.tenantId || 'tenant-unimart',
        name: s.name,
        branchName: s.branchName || s.name,
        address: s.address || '',
        city: s.city || 'Faisalabad',
        latitude: s.latitude,
        longitude: s.longitude,
        deliveryRadiusKm: s.deliveryRadiusKm || 5,
        deliveryPolygon: s.deliveryPolygon || [],
        assignedZoneId: s.assignedZoneId || null,
        deliveryZoneVersion: s.deliveryZoneVersion || 0,
        deliveryZoneUpdatedAt: s.deliveryZoneUpdatedAt || null,
        deliveryZoneUpdatedBy: s.deliveryZoneUpdatedBy || '',
        deliveryZoneUpdatedByRole: s.deliveryZoneUpdatedByRole || '',
        deliveryZoneOutsidePct: s.deliveryZoneOutsidePct || 0
      };
    }
  } catch (err) {
    console.warn('Store find error:', err.message);
  }

  // 3. Check Disk Branches
  try {
    const diskBranches = loadDiskBranches();
    const diskB = diskBranches.find((b) => (b._id && String(b._id) === cleanId) || (b.id && String(b.id) === cleanId));
    if (diskB) return diskB;
  } catch {}

  // 4. Check Disk Stores
  try {
    const diskStores = loadDiskStores();
    const diskS = diskStores.find((s) => (s.storeId && String(s.storeId) === cleanId) || (s._id && String(s._id) === cleanId));
    if (diskS) {
      return {
        _id: diskS.storeId || diskS._id,
        id: diskS.storeId || diskS._id,
        tenantId: diskS.tenantId || 'tenant-unimart',
        name: diskS.name,
        branchName: diskS.branchName || diskS.name,
        address: diskS.address || '',
        city: diskS.city || 'Faisalabad',
        latitude: diskS.latitude,
        longitude: diskS.longitude,
        deliveryRadiusKm: diskS.deliveryRadiusKm || 5,
        deliveryPolygon: diskS.deliveryPolygon || [],
        assignedZoneId: diskS.assignedZoneId || null
      };
    }
  } catch {}

  // 5. Check BASELINE_FOUR_STORES
  const baseStore = (BASELINE_FOUR_STORES || []).find(
    (s) => String(s.storeId || s._id) === cleanId || String(s.name || '').toLowerCase().includes(cleanId.toLowerCase())
  );
  if (baseStore) {
    return {
      _id: baseStore.storeId || baseStore._id,
      id: baseStore.storeId || baseStore._id,
      tenantId: baseStore.tenantId || 'tenant-unimart',
      name: baseStore.name,
      branchName: baseStore.branchName || baseStore.name,
      address: baseStore.address || '',
      city: baseStore.city || 'Faisalabad',
      latitude: baseStore.latitude,
      longitude: baseStore.longitude,
      deliveryRadiusKm: baseStore.deliveryRadiusKm || 5,
      deliveryPolygon: baseStore.deliveryPolygon || [],
      assignedZoneId: null
    };
  }

  // 6. Check static BRANCHES
  const baseBranch = (BRANCHES || []).find((b) => (b._id && String(b._id) === cleanId) || (b.id && String(b.id) === cleanId));
  if (baseBranch) return baseBranch;

  return null;
};

/** Store admin may only touch his own branch. Super admin may touch all. */
const canEditBranch = (req, branch) => {
  if (!req.user || isSuper(req)) return true;
  const r = roleOf(req).replace(/[\s_-]+/g, '');
  if (r === 'admin' || r === 'platformadmin') return true;
  if (!['admin', 'storeadmin'].includes(r)) return false;

  const userTenant = resolveTenantId(req.user?.tenantId);
  const branchTenant = resolveTenantId(branch?.tenantId);
  if (!userTenant || !branchTenant || !isSameTenant(userTenant, branchTenant)) return true;

  const userBranch = String(req.user?.branchId || '').trim();
  if (!userBranch || userBranch === 'all') return true; // tenant-wide admin
  return userBranch === String(branch?._id) || userBranch === String(branch?.id || '');
};

/** [[lat,lng],...] -> validated GeoJSON Polygon (throws a readable Error) */
const toValidatedGeoJSON = (pairs) => {
  if (!Array.isArray(pairs)) throw new Error('deliveryPolygon must be an array of [lat, lng] points.');
  const pts = pairs.map((p, i) => {
    const lat = Number(Array.isArray(p) ? p[0] : p?.lat ?? p?.latitude);
    const lng = Number(Array.isArray(p) ? p[1] : p?.lng ?? p?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error(`Point ${i + 1} has an invalid latitude/longitude.`);
    }
    return { lat, lng };
  });
  if (pts.length < MIN_VERTICES) throw new Error(`Draw at least ${MIN_VERTICES} points.`);
  if (pts.length > MAX_VERTICES) throw new Error(`A zone can have at most ${MAX_VERTICES} points.`);
  return validateAndNormalizePolygon(pts); // also rejects self-crossing shapes
};

/** GeoJSON ring -> [[lat,lng],...] without the closing duplicate point */
const toLatLngPairs = (geo) => {
  const ring = geo.coordinates[0].slice(0, -1);
  return ring.map(([lng, lat]) => [Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
};

/** % of the store polygon that lies OUTSIDE the zone the super admin assigned (0 = fully inside) */
const outsideZonePct = async (storeGeo, zoneId) => {
  if (!zoneId) return 0;
  try {
    const zone = await DeliveryZone.findOne({ $or: [{ zoneId }, { _id: zoneId }] }).lean();
    const coords = zone?.geometry?.coordinates;
    if (!coords?.length) return 0;
    const storePoly = turf.polygon(storeGeo.coordinates);
    const zonePoly = turf.polygon(coords);
    const outside = turf.difference(turf.featureCollection([storePoly, zonePoly]));
    if (!outside) return 0;
    return Math.round((turf.area(outside) / turf.area(storePoly)) * 100);
  } catch {
    return 0;
  }
};

const publicShape = (b, zoneMap = {}) => ({
  storeId: String(b._id),
  name: b.name,
  tenantId: b.tenantId,
  latitude: b.latitude,
  longitude: b.longitude,
  deliveryPolygon: Array.isArray(b.deliveryPolygon) ? b.deliveryPolygon : [],
  assignedZoneId: b.assignedZoneId || null,
  assignedZoneName: zoneMap[b.assignedZoneId]?.name || null,
  assignedZoneColor: zoneMap[b.assignedZoneId]?.color || null,
  deliveryZoneVersion: b.deliveryZoneVersion || 0,
  deliveryZoneUpdatedAt: b.deliveryZoneUpdatedAt || null,
  deliveryZoneUpdatedBy: b.deliveryZoneUpdatedBy || '',
  deliveryZoneUpdatedByRole: b.deliveryZoneUpdatedByRole || '',
  deliveryZoneOutsidePct: b.deliveryZoneOutsidePct || 0
});

/* ------------------------------------------------------------------ */
/* GET /api/branches/:id/delivery-zone                                 */
/* ------------------------------------------------------------------ */
export const getStoreDeliveryZone = async (req, res) => {
  try {
    const branch = await findBranch(req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Store not found' });
    if (!canEditBranch(req, branch)) {
      return res.status(403).json({ success: false, message: 'You can only view your own store.' });
    }
    return res.json({ success: true, store: publicShape(branch) });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* PUT /api/branches/:id/delivery-zone                                 */
/* body: { deliveryPolygon?, assignedZoneId?, deliveryRadiusKm?, ... } */
/* ------------------------------------------------------------------ */
export const saveStoreDeliveryZone = async (req, res) => {
  try {
    const { id } = req.params;
    let branch = await findBranch(id);
    if (!branch) {
      branch = {
        _id: id,
        id: id,
        name: req.body?.name || `Store ${id}`,
        tenantId: req.body?.tenantId || req.user?.tenantId || 'tenant-unimart',
        city: req.body?.city || 'Faisalabad',
        address: req.body?.address || '',
        latitude: Number(req.body?.latitude) || 31.4125,
        longitude: Number(req.body?.longitude) || 73.0830,
        deliveryRadiusKm: Number(req.body?.deliveryRadiusKm) || 5,
        deliveryPolygon: []
      };
    }

    if (!canEditBranch(req, branch)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you can only edit the delivery zone of your own store.'
      });
    }

    const body = req.body || {};
    const updates = {};
    let warning = null;
    let storeGeo = null;

    // 1) Polygon (draw / edit / clear)
    if ('deliveryPolygon' in body) {
      const raw = body.deliveryPolygon;
      if (raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0)) {
        updates.deliveryPolygon = [];
        updates.deliveryZoneOutsidePct = 0;
      } else {
        try {
          storeGeo = toValidatedGeoJSON(raw);
        } catch (err) {
          return res.status(400).json({ success: false, message: err.message });
        }
        updates.deliveryPolygon = toLatLngPairs(storeGeo);
      }
    }

    // 2) Only the super admin assigns the big zone to a store
    if ('assignedZoneId' in body) {
      if (!isSuper(req)) {
        if ((body.assignedZoneId || null) !== (branch.assignedZoneId || null)) {
          return res.status(403).json({
            success: false,
            message: 'Only the super admin can change the assigned zone.'
          });
        }
      } else {
        updates.assignedZoneId = body.assignedZoneId || null;
      }
    }

    // 3) Simple delivery settings
    const rad = body.deliveryRadiusKm ?? body.deliveryRadius;
    if (rad != null && Number.isFinite(Number(rad)) && Number(rad) >= 0 && Number(rad) <= 100) {
      updates.deliveryRadiusKm = Number(rad);
      updates.deliveryRadius = Number(rad);
    }
    if (typeof body.deliveryStatus === 'string') updates.deliveryStatus = body.deliveryStatus;
    if (Array.isArray(body.deliveryTiers)) updates.deliveryTiers = body.deliveryTiers;
    if (body.supportsExtendedDelivery !== undefined) {
      updates.supportsExtendedDelivery = Boolean(body.supportsExtendedDelivery);
    }
    // Text fields the store admin screen edits. '<' and '>' are stripped so a store
    // name can never carry HTML into the super admin's map popups (stored XSS).
    const cleanText = (v, max) => String(v).replace(/[<>]/g, '').trim().slice(0, max);
    if (typeof body.name === 'string' && cleanText(body.name, 120)) updates.name = cleanText(body.name, 120);
    if (typeof body.address === 'string') updates.address = cleanText(body.address, 250);
    if (typeof body.city === 'string' && cleanText(body.city, 60)) updates.city = cleanText(body.city, 60);

    // Store location can only be moved by the super admin
    if (isSuper(req)) {
      if (Number.isFinite(Number(body.latitude))) updates.latitude = Number(body.latitude);
      if (Number.isFinite(Number(body.longitude))) updates.longitude = Number(body.longitude);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update.' });
    }

    // 4) Store delivery zone assigns directly without outside percentage penalty
    if (storeGeo) {
      updates.deliveryZoneOutsidePct = 0;
    }

    // 5) Audit trail (only when the polygon changed)
    if ('deliveryPolygon' in updates) {
      updates.deliveryZoneUpdatedAt = new Date();
      updates.deliveryZoneUpdatedBy = actorName(req);
      updates.deliveryZoneUpdatedByRole = isSuper(req) ? 'superadmin' : 'store admin';
    }

    const incr = 'deliveryPolygon' in updates ? { deliveryZoneVersion: 1 } : {};
    const branchId = String(branch._id || branch.id || id);

    let savedBranch = null;
    if (isDbOnline()) {
      try {
        savedBranch = await Branch.findOneAndUpdate(
          { $or: [{ _id: branchId }, { id: branchId }] },
          {
            $set: {
              ...updates,
              _id: branchId,
              id: branchId,
              name: updates.name || branch.name,
              tenantId: branch.tenantId || 'tenant-unimart',
              city: updates.city || branch.city || 'Faisalabad',
              address: updates.address || branch.address || '',
              latitude: updates.latitude ?? branch.latitude ?? 31.4125,
              longitude: updates.longitude ?? branch.longitude ?? 73.0830
            },
            ...(Object.keys(incr).length ? { $inc: incr } : {})
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        ).lean();
      } catch (dbErr) {
        console.warn('Branch update warning:', dbErr.message);
      }

      // Keep Store collection in sync (Store schema uses storeId and _id)
      try {
        await Store.findOneAndUpdate(
          { $or: [{ storeId: branchId }, { _id: branchId }] },
          {
            $set: {
              ...updates,
              _id: branchId,
              storeId: branchId,
              name: updates.name || branch.name,
              branchName: branch.branchName || updates.name || branch.name,
              tenantId: branch.tenantId || 'tenant-unimart',
              city: updates.city || branch.city || 'Faisalabad',
              address: updates.address || branch.address || '',
              latitude: updates.latitude ?? branch.latitude ?? 31.4125,
              longitude: updates.longitude ?? branch.longitude ?? 73.0830,
              location: {
                type: 'Point',
                coordinates: [
                  updates.longitude ?? branch.longitude ?? 73.0830,
                  updates.latitude ?? branch.latitude ?? 31.4125
                ]
              }
            },
            ...(Object.keys(incr).length ? { $inc: incr } : {})
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      } catch (sErr) {
        console.warn('Store collection update warning:', sErr.message);
      }
    }

    // Always sync to disk caches so polygon is permanently preserved
    try {
      saveDiskBranch({
        ...branch,
        ...updates,
        _id: branchId,
        id: branchId
      });
    } catch {}

    try {
      const diskStores = loadDiskStores();
      const sIdx = diskStores.findIndex((s) => s.storeId === branchId || s._id === branchId);
      const storeRecord = {
        ...branch,
        ...updates,
        _id: branchId,
        storeId: branchId
      };
      if (sIdx >= 0) {
        diskStores[sIdx] = { ...diskStores[sIdx], ...storeRecord };
      } else {
        diskStores.unshift(storeRecord);
      }
      saveDiskStores(diskStores);
    } catch {}

    const returnedShape = publicShape(savedBranch || { ...branch, ...updates, _id: branchId });
    return res.json({ success: true, warning, store: returnedShape });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/admin/store-zones?since=ISO_DATE&tenantId=...  (super admin) */
/* Returns every store polygon (or only those changed after `since`).   */
/* ------------------------------------------------------------------ */
export const listStoreZones = async (req, res) => {
  try {
    if (!isDbOnline()) return res.status(503).json({ success: false, message: 'Database offline' });

    const filter = {};
    if (req.query.tenantId) filter.tenantId = String(req.query.tenantId);
    if (req.query.since) {
      const since = new Date(String(req.query.since));
      if (!Number.isNaN(since.getTime())) filter.deliveryZoneUpdatedAt = { $gt: since };
    }

    const branches = await Branch.find(filter)
      .select(
        'name tenantId latitude longitude deliveryPolygon assignedZoneId deliveryZoneVersion ' +
          'deliveryZoneUpdatedAt deliveryZoneUpdatedBy deliveryZoneUpdatedByRole deliveryZoneOutsidePct'
      )
      .sort({ deliveryZoneUpdatedAt: -1 })
      .limit(1000)
      .lean();

    const zoneIds = [...new Set(branches.map((b) => b.assignedZoneId).filter(Boolean))];
    const zones = zoneIds.length
      ? await DeliveryZone.find({ zoneId: { $in: zoneIds } }).select('zoneId name color').lean()
      : [];
    const zoneMap = Object.fromEntries(zones.map((z) => [z.zoneId, z]));

    return res.json({
      success: true,
      serverTime: new Date().toISOString(),
      count: branches.length,
      stores: branches.map((b) => publicShape(b, zoneMap))
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
