/**
 * server/utils/orderVisibility.js
 *
 * Pure rules (no DB, no Express) for:
 *   1. which orders a pickup staff member may see / touch
 *   2. which orders a rider may see / touch, and in which phase they are
 *   3. whether a rider's base location is inside the store's delivery region
 *
 * Lifecycle:
 *   placed -> admin assigns PICKUP STAFF  -> staff sees it, status Preparing/Picking
 *          -> admin assigns RIDER         -> rider sees it as phase "preparing"
 *          -> staff marks Ready/Prepared  -> order is DISPATCHED to the assigned rider
 *                                            (phase "dispatched", rider may start delivery)
 */

const norm = (v) => String(v ?? '').trim().toLowerCase();
const defaultSameTenant = (a, b) => norm(a) === norm(b);

export const TERMINAL_STATUSES = new Set([
  'delivered', 'completed', 'cancelled', 'canceled', 'failed', 'returned', 'refunded'
]);

const DISPATCHED_STATUSES = new Set([
  'out for delivery', 'dispatched', 'picked up', 'in transit', 'arriving', 'on the way'
]);

export const READY_STATUSES = new Set(['prepared', 'ready', 'ready for dispatch', 'ready for pickup']);

const staffIdOf = (user) => norm(user?.staffId || user?.id || user?._id);
const riderIdOf = (user) => norm(user?.riderId || user?.id || user?._id);
const assignedRiderIdOf = (order) =>
  norm(order?.assignedRider?.id || order?.assignedRider?.riderId || order?.assignedRider?._id || order?.riderId);

/** Tenant + branch scope shared by staff and riders. */
const inScope = (order, user, sameTenant) => {
  const orderTenant = order?.tenantId || order?.companyId;
  if (user?.tenantId && orderTenant && !sameTenant(orderTenant, user.tenantId)) return false;
  const userBranch = norm(user?.branchId);
  if (userBranch && userBranch !== 'all' && order?.branchId && norm(order.branchId) !== userBranch) return false;
  return true;
};

/**
 * Pickup staff see an order ONLY after the admin assigned it to them
 * (order.pickupStaffId === their id). Unassigned orders are invisible.
 */
export function pickupStaffCanSee(order, user, { sameTenant = defaultSameTenant } = {}) {
  if (!order) return false;
  const staffId = staffIdOf(user);
  if (!staffId) return false;
  if (norm(order.pickupStaffId) !== staffId) return false;
  return inScope(order, user, sameTenant);
}

/** 'dispatched' once staff handed it over (or status says it is on the road), else 'preparing'. */
export function riderPhase(order) {
  const status = norm(order?.status);
  if (order?.isDispatched || DISPATCHED_STATUSES.has(status)) return 'dispatched';
  return 'preparing';
}

/**
 * Riders see an order ONLY when the admin assigned it to them (by id, never by
 * fuzzy name/phone matching). Active orders are shown in both phases
 * (preparing, dispatched); finished orders only with { history: true }.
 */
export function riderCanSee(order, user, { sameTenant = defaultSameTenant, history = false } = {}) {
  if (!order) return false;
  const riderId = riderIdOf(user);
  if (!riderId) return false;
  if (assignedRiderIdOf(order) !== riderId) return false;
  if (!inScope(order, user, sameTenant)) return false;
  if (!history && TERMINAL_STATUSES.has(norm(order.status))) return false;
  return true;
}

/** A rider may start the trip only after the pickup staff handed the parcel over. */
export function canRiderStartDelivery(order) {
  return riderPhase(order) === 'dispatched' || Boolean(order?.isDispatchedByStaff);
}

/**
 * Called when pickup staff marks an order Ready / Prepared.
 * If a rider is already assigned the order goes straight to "Out for Delivery".
 * Returns true when it was dispatched.
 */
export function dispatchToAssignedRider(order, now = new Date()) {
  order.isDispatchedByStaff = true;
  order.readyForDispatchAt = order.readyForDispatchAt || now.toISOString();
  if (!order.assignedRider) return false;
  order.status = 'Out for Delivery';
  order.dispatchStatus = 'Out for Delivery';
  order.isDispatched = true;
  order.fulfillmentStage = 3;
  order.dispatchedAt = now.toISOString();
  if (!order.deliveryOtp) order.deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));
  return true;
}

/* ---------------- delivery-region geometry ---------------- */

const toPairs = (poly) =>
  (Array.isArray(poly) ? poly : [])
    .map((p) => (Array.isArray(p) ? [Number(p[0]), Number(p[1])] : [Number(p?.lat ?? p?.latitude), Number(p?.lng ?? p?.longitude)]))
    .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));

/** Ray casting. polygon = [[lat,lng],...] */
export function pointInPolygon(lat, lng, polygon) {
  const pts = toPairs(polygon);
  if (pts.length < 3) return false;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [yi, xi] = pts[i];
    const [yj, xj] = pts[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Is (lat,lng) inside the store's delivery region?
 *  - drawn polygon (3+ points)  -> must be inside it
 *  - no polygon, has a radius   -> must be within the radius of the store
 *  - neither                    -> not ok (the admin must draw the region first)
 */
export function checkPointInBranchRegion(branch, lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!branch) return { ok: false, mode: 'none', reason: 'Store not found, cannot verify its delivery region.' };
  if (!Number.isFinite(la) || !Number.isFinite(ln)) {
    return { ok: false, mode: 'none', reason: 'Pick an area inside the store delivery region (no location was given).' };
  }
  if (toPairs(branch.deliveryPolygon).length >= 3) {
    const ok = pointInPolygon(la, ln, branch.deliveryPolygon);
    return { ok, mode: 'polygon', reason: ok ? '' : 'This area is outside the store delivery region.' };
  }
  const radius = Number(branch.deliveryRadiusKm ?? branch.deliveryRadius);
  const bLat = Number(branch.latitude ?? branch.coordinates?.lat);
  const bLng = Number(branch.longitude ?? branch.coordinates?.lng);
  if (Number.isFinite(radius) && radius > 0 && Number.isFinite(bLat) && Number.isFinite(bLng)) {
    const km = haversineKm(bLat, bLng, la, ln);
    const ok = km <= radius;
    return { ok, mode: 'radius', reason: ok ? '' : `This area is ${km.toFixed(1)} km from the store, outside its ${radius} km delivery radius.` };
  }
  return { ok: false, mode: 'none', reason: 'This store has no delivery region yet. Draw its delivery zone first.' };
}
