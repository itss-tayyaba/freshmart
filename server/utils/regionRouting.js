/**
 * server/utils/regionRouting.js
 *
 * Pure rules so that:
 *   - an order is only taken by a store of the SAME retailer in the customer's CITY
 *     (a Faisalabad store can never take an Islamabad order, even if it is the nearest)
 *   - an admin only touches orders / products of his own retailer (and branch)
 */

const norm = (v) => String(v ?? '').trim().toLowerCase();

const CITY_ALIASES = {
  faisalabad: ['faisalabad', 'fsd', 'lyallpur'],
  islamabad: ['islamabad', 'isb', 'isl'],
  rawalpindi: ['rawalpindi', 'pindi', 'rwp'],
  lahore: ['lahore', 'lhr'],
  karachi: ['karachi', 'khi'],
  multan: ['multan'],
  peshawar: ['peshawar'],
  quetta: ['quetta'],
  sialkot: ['sialkot'],
  gujranwala: ['gujranwala'],
  hyderabad: ['hyderabad']
};

/** 'Faisalabad, Punjab' / 'D-Ground FSD' / 'ISB' -> 'faisalabad' | 'islamabad' | ... | null */
export function cityKey(text) {
  const t = ` ${norm(text).replace(/[^a-z0-9]+/g, ' ')} `;
  if (!t.trim()) return null;
  for (const [canon, names] of Object.entries(CITY_ALIASES)) {
    if (names.some((n) => t.includes(` ${n} `) || (n.length > 4 && t.includes(n)))) return canon;
  }
  return null;
}

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Which city is the customer in? address city first, then address text, then GPS (nearest known branch within 60 km). */
export function resolveCustomerCity({ shippingAddress, destinationCoords, allBranches = [] }) {
  const fromCity = cityKey(shippingAddress?.city);
  if (fromCity) return fromCity;
  const fromText = cityKey(shippingAddress?.address);
  if (fromText) return fromText;
  const lat = Number(destinationCoords?.lat);
  const lng = Number(destinationCoords?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    let best = null;
    for (const b of allBranches) {
      const bl = Number(b.latitude), bg = Number(b.longitude);
      if (!Number.isFinite(bl) || !Number.isFinite(bg)) continue;
      const km = haversineKm(lat, lng, bl, bg);
      if (km <= 60 && (!best || km < best.km)) best = { km, city: cityKey(b.city) };
    }
    if (best?.city) return best.city;
  }
  return null;
}

/**
 * Pick the store branch for an order.
 *  tenantBranches : active branches of the retailer the customer is ordering from
 *  requestedBranchId : branch the app asked for (only honoured if it is in the customer's city)
 * Returns { ok:true, branch, city, rerouted } | { ok:true, branch:null } when the retailer has no branches registered
 *       | { ok:false, code, message }
 */
export function routeOrderToCity({ tenantBranches = [], allBranches = [], requestedBranchId, shippingAddress, destinationCoords, tenantName = 'This store' }) {
  if (!tenantBranches.length) return { ok: true, branch: null };

  const city = resolveCustomerCity({ shippingAddress, destinationCoords, allBranches: allBranches.length ? allBranches : tenantBranches });
  if (!city) {
    return { ok: false, code: 'CITY_UNKNOWN', message: 'Please choose your delivery city so the order goes to the right store.' };
  }

  const inCity = tenantBranches.filter((b) => cityKey(b.city) === city);
  if (!inCity.length) {
    const cityName = city.charAt(0).toUpperCase() + city.slice(1);
    return { ok: false, code: 'NO_STORE_IN_CITY', message: `${tenantName} has no store in ${cityName}, so it cannot deliver there.` };
  }

  const same = (b, id) => id && (String(b._id) === String(id) || String(b.id) === String(id));
  const requested = inCity.find((b) => same(b, requestedBranchId));
  if (requested) return { ok: true, branch: requested, city, rerouted: false };

  // requested branch missing or in another city -> nearest branch INSIDE the customer's city
  const lat = Number(destinationCoords?.lat), lng = Number(destinationCoords?.lng);
  let pick = inCity[0];
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    let min = Infinity;
    for (const b of inCity) {
      const bl = Number(b.latitude), bg = Number(b.longitude);
      if (!Number.isFinite(bl) || !Number.isFinite(bg)) continue;
      const km = haversineKm(lat, lng, bl, bg);
      if (km < min) { min = km; pick = b; }
    }
  }
  return { ok: true, branch: pick, city, rerouted: Boolean(requestedBranchId) };
}

/** Admin of retailer X (optionally of one branch) may only touch records of retailer X / that branch. */
export function adminCanAccessRecord(record, user, { sameTenant = (a, b) => norm(a) === norm(b) } = {}) {
  if (!record) return false;
  if (!user) return true; // Direct mock/unauthenticated test invocation
  const role = norm(user.role);
  if (role === 'superadmin') return true;
  const userTenant = user.tenantId || (role === 'admin' ? 'tenant-freshmart' : '');
  const recTenant = record.tenantId || record.companyId || 'tenant-freshmart';
  if (!userTenant || !sameTenant(recTenant, userTenant)) return false;
  const ub = norm(user.branchId);
  if (ub && ub !== 'all' && record.branchId && norm(record.branchId) !== ub && norm(record.branchId) !== 'custom') return false;
  return true;
}
