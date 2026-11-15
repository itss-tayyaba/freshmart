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
import { resolveTenantId, isSameTenant } from '../../src/data/companyHierarchyData.js';

const MIN_VERTICES = 3;
const MAX_VERTICES = 50;

const roleOf = (req) => String(req.user?.role || '').toLowerCase();
const isSuper = (req) => roleOf(req) === 'superadmin' || !!req.user?.isSuperAdmin;
const actorName = (req) =>
  req.user?.name || req.user?.email || req.user?.username || String(req.user?.id || 'unknown');

const findBranch = (id) =>
  Branch.findOne({ $or: [{ _id: id }, { id }] }).lean();

/** Store admin may only touch his own branch. Super admin may touch all. */
const canEditBranch = (req, branch) => {
  if (isSuper(req)) return true;
  if (!['admin', 'store admin'].includes(roleOf(req))) return false;

  const userTenant = resolveTenantId(req.user?.tenantId);
  const branchTenant = resolveTenantId(branch.tenantId);
  if (!userTenant || !branchTenant || !isSameTenant(userTenant, branchTenant)) return false;

  const userBranch = String(req.user?.branchId || '').trim();
  if (!userBranch || userBranch === 'all') return true; // tenant-wide admin
  return userBranch === String(branch._id) || userBranch === String(branch.id || '');
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
    if (!isDbOnline()) return res.status(503).json({ success: false, message: 'Database offline' });
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
    if (!isDbOnline()) {
      return res.status(503).json({ success: false, message: 'Database offline - zone not saved.' });
    }

    const { id } = req.params;
    const branch = await findBranch(id);
    if (!branch) return res.status(404).json({ success: false, message: 'Store not found' });

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

    // 4) How far does the store polygon stick out of its assigned zone?
    if (storeGeo) {
      const zoneId = updates.assignedZoneId ?? branch.assignedZoneId;
      const pct = await outsideZonePct(storeGeo, zoneId);
      updates.deliveryZoneOutsidePct = pct;
      if (pct > 0) {
        warning = `${pct}% of this delivery area is outside the zone assigned by the super admin.`;
      }
    }

    // 5) Audit trail (only when the polygon changed)
    if ('deliveryPolygon' in updates) {
      updates.deliveryZoneUpdatedAt = new Date();
      updates.deliveryZoneUpdatedBy = actorName(req);
      updates.deliveryZoneUpdatedByRole = isSuper(req) ? 'superadmin' : 'store admin';
    }

    const incr = 'deliveryPolygon' in updates ? { deliveryZoneVersion: 1 } : {};
    const saved = await Branch.findOneAndUpdate(
      { _id: branch._id },
      { $set: updates, ...(Object.keys(incr).length ? { $inc: incr } : {}) },
      { new: true }
    ).lean();

    // Keep the Store collection in sync (no upsert: never create junk stores)
    try {
      await Store.updateOne(
        { $or: [{ storeId: String(branch._id) }, { _id: String(branch._id) }] },
        { $set: updates, ...(Object.keys(incr).length ? { $inc: incr } : {}) }
      );
    } catch {
      /* Store doc may not exist for this branch - not fatal */
    }

    return res.json({ success: true, warning, store: publicShape(saved) });
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
