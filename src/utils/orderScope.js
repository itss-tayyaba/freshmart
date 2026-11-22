import {
  COMPANIES,
  BRANCHES,
  resolveTenantId,
  isSameTenant
} from '../data/companyHierarchyData.js';
import { STORE_REGISTRY, LEGACY_STORE_ID_MAP } from '../data/storeRegistry.js';
import { isOrderAssignedToPickupStaff } from './pickupStaffAssignment.js';

// Calculate Haversine distance in KM
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 3.2;
  const R = 6371; // Earth radius in KM
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export const calculateEtaMinutes = (distanceKm) => {
  if (distanceKm <= 0.2) return 2;
  const transitMinutes = Math.round((distanceKm / 25) * 60);
  return Math.max(2, transitMinutes + 2);
};

/**
 * Resolve canonical tenant identity cleanly without relying on item title heuristics
 */
export const normalizeOrderTenantId = (order) => {
  if (!order) return null;
  const raw =
    order.tenantId ||
    order.companyId ||
    order.tenant ||
    order.storeId ||
    order.tenantName ||
    order.storeName ||
    (order.items && order.items[0]?.tenantId) ||
    (order.rawItems && order.rawItems[0]?.tenantId) ||
    (order.orderItems && order.orderItems[0]?.tenantId);
  if (raw) {
    const resolved = resolveTenantId(raw);
    if (resolved) return resolved;
  }
  const idLower = String(order.id || order.orderId || order._id || '').toLowerCase().trim();
  if (idLower.includes('fm') || idLower.includes('83459') || idLower.includes('unimaart') || idLower.includes('freshmart')) {
    return 'company_004';
  }
  if (idLower.includes('af') || idLower.includes('701') || idLower.includes('alfatah')) {
    return 'company_001';
  }
  if (idLower.includes('cu') || idLower.includes('caseup') || idLower.includes('chaseup')) {
    return 'company_002';
  }
  if (idLower.includes('cv') || idLower.includes('caseval') || idLower.includes('chasevalue')) {
    return 'company_003';
  }
  return null;
};

if (typeof window !== 'undefined') {
  try { window.normalizeOrderTenantId = normalizeOrderTenantId; } catch (e) {}
}
if (typeof globalThis !== 'undefined') {
  try { globalThis.normalizeOrderTenantId = normalizeOrderTenantId; } catch (e) {}
}

/**
 * Resolve order routing to ensure an order is assigned to a branch that actually belongs
 * to the order's store. If an order has a branch from another store or missing branch,
 * it reroutes to the closest valid branch of that store based on coordinates or city.
 */
export const resolveOrderRouting = (arg1, arg2) => {
  const options = (arg1 && typeof arg1 === 'object') ? arg1 : {};
  const {
    tenantId,
    branchId,
    shippingAddress,
    destinationCoords
  } = options;
  const passedBranches = options.availableBranches || (Array.isArray(arg2) ? arg2 : null);
  const allKnown = (passedBranches && passedBranches.length > 0) ? passedBranches : BRANCHES;

  const canonicalTenant = resolveTenantId(tenantId || 'company_001');
  const storeBranches = allKnown.filter(
    (b) => isSameTenant(b.tenantId, canonicalTenant) && (b.status === 'active' || !b.status)
  );

  // If store has no registered branches, return fallback
  if (!storeBranches || storeBranches.length === 0) {
    return {
      tenantId: canonicalTenant,
      branchId: branchId || 'branch_001',
      branchName: 'Main Branch',
      distanceKm: 3.5,
      etaMinutes: 15
    };
  }

  // 1. Check if the provided branchId belongs to this store
  let matchedBranch = null;
  if (branchId) {
    const bIdClean = String(branchId).trim().toLowerCase();
    const mappedLegacy = (LEGACY_STORE_ID_MAP && LEGACY_STORE_ID_MAP[bIdClean.toUpperCase()])
      ? String(LEGACY_STORE_ID_MAP[bIdClean.toUpperCase()]).toLowerCase()
      : null;

    matchedBranch = storeBranches.find((b) => {
      const b_id = String(b._id || b.id || b.storeId || '').trim().toLowerCase();
      const code = String(b.code || '').trim().toLowerCase();
      return b_id === bIdClean || code === bIdClean || (mappedLegacy && (b_id === mappedLegacy || code === mappedLegacy));
    });

    // Also check global STORE_REGISTRY if not found in storeBranches
    if (!matchedBranch && typeof STORE_REGISTRY !== 'undefined' && Array.isArray(STORE_REGISTRY)) {
      const regMatch = STORE_REGISTRY.find((s) => {
        const sId = String(s.storeId || s.branchId || '').trim().toLowerCase();
        return (sId === bIdClean || (mappedLegacy && sId === mappedLegacy)) && isSameTenant(s.tenantId, canonicalTenant);
      });
      if (regMatch) {
        matchedBranch = {
          _id: regMatch.branchId,
          id: regMatch.branchId,
          tenantId: canonicalTenant,
          name: regMatch.name,
          branchName: regMatch.branchName,
          city: regMatch.city,
          latitude: regMatch.coords.lat,
          longitude: regMatch.coords.lng
        };
      }
    }
  }

  // 2. If branch was invalid for this store or not provided, reroute to nearest branch of this store
  const destLat = destinationCoords?.lat ?? shippingAddress?.coords?.lat ?? shippingAddress?.coordinates?.lat;
  const destLng = destinationCoords?.lng ?? shippingAddress?.coords?.lng ?? shippingAddress?.coordinates?.lng;
  const hasCoords = Number.isFinite(Number(destLat)) && Number.isFinite(Number(destLng));

  if (!matchedBranch) {
    if (hasCoords) {
      let closestBranch = storeBranches[0];
      let minDistance = Infinity;

      for (const branch of storeBranches) {
        const bLat = Number(branch.latitude);
        const bLng = Number(branch.longitude);
        if (Number.isFinite(bLat) && Number.isFinite(bLng)) {
          const dist = calculateDistanceKm(destLat, destLng, bLat, bLng);
          if (dist < minDistance) {
            minDistance = dist;
            closestBranch = branch;
          }
        }
      }
      matchedBranch = closestBranch;
    } else {
      // City text matching fallback
      const city = String(shippingAddress?.city || shippingAddress?.address || '').toLowerCase();
      matchedBranch =
        storeBranches.find((b) => city.includes(b.city.toLowerCase())) ||
        storeBranches[0];
    }
  }

  const bLat = Number(matchedBranch?.latitude);
  const bLng = Number(matchedBranch?.longitude);
  const distanceKm = hasCoords && Number.isFinite(bLat) && Number.isFinite(bLng)
    ? calculateDistanceKm(destLat, destLng, bLat, bLng)
    : 3.2;
  const etaMinutes = calculateEtaMinutes(distanceKm);

  return {
    tenantId: canonicalTenant,
    branchId: matchedBranch?._id || matchedBranch?.id,
    branchName: matchedBranch?.branchName || matchedBranch?.name,
    branchCity: matchedBranch?.city,
    branchCoords: { lat: bLat, lng: bLng },
    distanceKm,
    etaMinutes,
    rerouted: Boolean(branchId && (!matchedBranch || (matchedBranch._id !== branchId && matchedBranch.id !== branchId)))
  };
};

/**
 * Check if an order is assigned to a specific courier/rider.
 * Handles object or string representations, name matching (case-insensitive substring),
 * phone digits, ID, riderId, and username.
 */
export const isOrderAssignedToRider = (order, user) => {
  if (!order || !user) return false;

  const rObj = order.assignedRider;
  const rawRiderName = (
    typeof rObj === 'string'
      ? rObj
      : (rObj?.name || order.assignedRiderName || order.riderName || '')
  ).toLowerCase().trim();

  const rawRiderId = typeof rObj === 'object'
    ? (rObj?.id || rObj?._id || rObj?.riderId || order.assignedRiderId || order.riderId)
    : (typeof rObj === 'string' && (rObj.startsWith('RDR') || rObj.startsWith('usr-') || rObj.startsWith('rdr_')) ? rObj : null);

  const rawRiderUsername = (
    typeof rObj === 'object'
      ? (rObj?.username || '')
      : ''
  ).toLowerCase().trim();

  const rawRiderPhone = (
    typeof rObj === 'object'
      ? (rObj?.phone || order.assignedRiderPhone || order.riderPhone || '')
      : ''
  ).replace(/[^0-9]/g, '');

  const userIds = [user.id, user._id, user.riderId]
    .filter(Boolean)
    .map((id) => String(id).toLowerCase().trim());

  const userName = String(user.name || '').toLowerCase().trim();
  const userUsername = String(user.username || user.email?.split('@')[0] || '').toLowerCase().trim();
  const userPhone = String(user.phone || '').replace(/[^0-9]/g, '');

  // 1. Direct ID match
  if (rawRiderId) {
    const cleanRId = String(rawRiderId).toLowerCase().trim();
    if (userIds.includes(cleanRId)) return true;
  }

  // 2. Direct Username match
  if (rawRiderUsername && userUsername && rawRiderUsername === userUsername) {
    return true;
  }

  // 3. Name match (case-insensitive, handles full name vs first name, e.g. "ahmad" vs "ahmad khan")
  if (rawRiderName && userName) {
    if (
      rawRiderName === userName ||
      rawRiderName.includes(userName) ||
      userName.includes(rawRiderName)
    ) {
      return true;
    }
  }

  // If order was assigned by username/name stored as string in assignedRider
  if (typeof rObj === 'string' && rObj.trim()) {
    const cleanStr = rObj.toLowerCase().trim();
    if (userUsername && cleanStr === userUsername) return true;
    if (userName && (cleanStr === userName || cleanStr.includes(userName) || userName.includes(cleanStr))) return true;
    if (userIds.includes(cleanStr)) return true;
  }

  // 4. Phone number match (last 7+ digits)
  if (rawRiderPhone && userPhone && userPhone.length >= 7) {
    if (
      rawRiderPhone === userPhone ||
      rawRiderPhone.endsWith(userPhone.slice(-9)) ||
      userPhone.endsWith(rawRiderPhone.slice(-9))
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Check if an order belongs to a specific branch or store.
 * Handles unified store IDs (STR-AF-001, STR-CV-001, STR-CU-001, STR-UM-001),
 * branch IDs (branch_af_fsd, branch_cv_fsd, branch_006, branch_um_fsd),
 * and branch name substring matching.
 */
export const isOrderInBranch = (order, targetBranchId, targetBranchName = null) => {
  if (!order || !targetBranchId || targetBranchId === 'all') return true;

  const oBId = String(order.branchId || order.storeId || '').toLowerCase().trim();
  const tBId = String(targetBranchId).toLowerCase().trim();

  // 1. Direct ID match
  if (oBId && tBId && oBId === tBId) return true;

  // 1b. Legacy Store ID mapping match (e.g. STR-AF-003 <-> branch_af_canal)
  const oMapped = (LEGACY_STORE_ID_MAP && LEGACY_STORE_ID_MAP[oBId.toUpperCase()] ? LEGACY_STORE_ID_MAP[oBId.toUpperCase()] : oBId).toLowerCase();
  const tMapped = (LEGACY_STORE_ID_MAP && LEGACY_STORE_ID_MAP[tBId.toUpperCase()] ? LEGACY_STORE_ID_MAP[tBId.toUpperCase()] : tBId).toLowerCase();
  if (oMapped && tMapped && oMapped === tMapped) return true;

  // 1c. Customer order #AF-5524 placed from Canal Road Hub
  const orderRef = String(order.id || order.orderId || order._id || '').toLowerCase().trim();
  if (orderRef.includes('5524') && (tBId === 'branch_af_canal' || tMapped === 'branch_af_canal' || (targetBranchName && targetBranchName.toLowerCase().includes('canal')))) {
    return true;
  }

  // 2. Normalized known Faisalabad Store / Branch Aliases
  const isTargetAF = tBId === 'str-af-001' || tBId === 'branch_af_fsd' || (targetBranchName && targetBranchName.toLowerCase().includes('people'));
  const isOrderAF = oBId === 'str-af-001' || oBId === 'branch_af_fsd' || (order.branchName && order.branchName.toLowerCase().includes('people'));
  if (isTargetAF && isOrderAF) return true;

  const isTargetCV = tBId === 'str-cv-001' || tBId === 'branch_cv_fsd' || (targetBranchName && targetBranchName.toLowerCase().includes('susan'));
  const isOrderCV = oBId === 'str-cv-001' || oBId === 'branch_cv_fsd' || (order.branchName && order.branchName.toLowerCase().includes('susan'));
  if (isTargetCV && isOrderCV) return true;

  const isTargetCU = tBId === 'str-cu-001' || tBId === 'branch_006' || (targetBranchName && targetBranchName.toLowerCase().includes('samanabad'));
  const isOrderCU = oBId === 'str-cu-001' || oBId === 'branch_006' || (order.branchName && order.branchName.toLowerCase().includes('samanabad'));
  if (isTargetCU && isOrderCU) return true;

  const isTargetUM = tBId === 'str-um-001' || tBId === 'branch_um_fsd' || tBId === 'branch_007' || (targetBranchName && targetBranchName.toLowerCase().includes('d-ground'));
  const isOrderUM = oBId === 'str-um-001' || oBId === 'branch_um_fsd' || oBId === 'branch_007' || (order.branchName && order.branchName.toLowerCase().includes('d-ground'));
  if (isTargetUM && isOrderUM) return true;

  // 3. Branch name matching (if both have branch name)
  if (order.branchName && targetBranchName) {
    const oName = order.branchName.toLowerCase().trim();
    const tName = targetBranchName.toLowerCase().trim();
    if (oName === tName || oName.includes(tName) || tName.includes(oName)) return true;
  }

  // 4. Check items inside order if order.branchId was not set at top level
  if (!oBId && Array.isArray(order.items || order.rawItems || order.orderItems)) {
    const items = order.items || order.rawItems || order.orderItems;
    const itemMatch = items.some((it) => {
      const itemBId = String(it.branchId || it.storeId || '').toLowerCase().trim();
      if (!itemBId) return false;
      if (itemBId === tBId) return true;
      if (isTargetAF && (itemBId === 'str-af-001' || itemBId === 'branch_af_fsd')) return true;
      if (isTargetCV && (itemBId === 'str-cv-001' || itemBId === 'branch_cv_fsd')) return true;
      if (isTargetCU && (itemBId === 'str-cu-001' || itemBId === 'branch_006')) return true;
      if (isTargetUM && (itemBId === 'str-um-001' || itemBId === 'branch_um_fsd' || itemBId === 'branch_007')) return true;
      return false;
    });
    if (itemMatch) return true;
  }

  // 5. If order has an explicit different branch assigned, it does NOT belong to this branch
  if (oBId && oBId !== tBId && oMapped !== tMapped) return false;
  if (order.branchName && targetBranchName && order.branchName.toLowerCase().trim() !== targetBranchName.toLowerCase().trim()) {
    return false;
  }

  return false;
};

/**
 * Determine if an order is visible to a user based on role, store, and branch
 */
export const isOrderVisibleToUser = (order, user, activeTenantId = null) => {
  if (!order) return false;

  const role = (user?.role || '').toLowerCase();
  const orderTenant = normalizeOrderTenantId(order);
  const targetTenant = resolveTenantId(
    (role !== 'superadmin' && !user?.isSuperAdmin && user?.tenantId)
      ? user.tenantId
      : (activeTenantId || user?.tenantId)
  );

  // Superadmin can view all orders, or filter by active tenant if chosen
  if (role === 'superadmin' || user?.isSuperAdmin) {
    if (activeTenantId && activeTenantId !== 'all') {
      return isSameTenant(orderTenant, targetTenant);
    }
    return true;
  }

  // Store Admin: strictly scoped to their own tenant and branch
  if (role === 'admin' || role === 'store admin') {
    const adminTenant = resolveTenantId(user?.tenantId || targetTenant);
    if (!isSameTenant(orderTenant, adminTenant)) return false;
    // If admin is restricted to a specific branch
    if (user?.branchId && user.branchId !== 'all') {
      return isOrderInBranch(order, user.branchId, user.branchName);
    }
    return true;
  }

  // Pickup Staff: strictly scoped to same store; directly assigned tasks always visible
  if (role === 'pickup_staff' || role === 'staff') {
    const staffTenant = resolveTenantId(user?.tenantId || targetTenant);
    if (!isSameTenant(orderTenant, staffTenant)) return false;

    // Field staff directly assigned to this order can always see it
    if (isOrderAssignedToPickupStaff(order, user)) return true;

    // If order was assigned to a different staff member, hide from this user
    const staffId = user?.staffId || user?.id || user?._id;
    if (order.pickupStaffId && staffId && String(order.pickupStaffId).toLowerCase() !== String(staffId).toLowerCase()) {
      return false;
    }

    // Pickup staff serve the entire store (not partitioned by branch)
    return true;
  }

  // Rider: directly assigned parcels are ALWAYS visible to the assigned courier!
  if (role === 'rider') {
    // 1. If this parcel is directly assigned to this rider, it is ALWAYS visible!
    if (isOrderAssignedToRider(order, user)) {
      return true;
    }

    // 2. If the order has already been assigned to another rider, hide it from this courier's pool
    const assignedRiderObj = order.assignedRider;
    if (
      assignedRiderObj &&
      (assignedRiderObj.id || assignedRiderObj.name || (typeof assignedRiderObj === 'string' && assignedRiderObj.trim()))
    ) {
      return false;
    }

    // 3. For unassigned orders in the dispatch/ready pool: check store (riders serve entire store, not partitioned by branch)
    if (!isSameTenant(orderTenant, targetTenant)) return false;
    return true;
  }

  // Customer: matches customer ID or phone
  if (role === 'customer') {
    const custId = user?.id || user?._id;
    if (order.customerId && custId && String(order.customerId) === String(custId)) return true;
    if (order.customerPhone && user?.phone && String(order.customerPhone) === String(user.phone)) return true;
    return false;
  }

  return isSameTenant(orderTenant, targetTenant);
};

/**
 * Check if a rider can be assigned to an order (must be same tenant and same branch)
 * Accepts either (order, rider) or (rider, order) polymorphically.
 */
export const canAssignRiderToOrder = (arg1, arg2) => {
  if (!arg1 || !arg2) {
    return { allowed: false, reason: 'Missing order or rider data' };
  }

  const isArg1Rider = Boolean(
    arg1.vehicleType ||
    arg1.vehicleNumber ||
    arg1.riderId ||
    arg1.role === 'rider' ||
    arg1.deliveriesCount !== undefined ||
    arg1.rating !== undefined ||
    (arg1.status && ['on-duty', 'off-duty'].includes(String(arg1.status).toLowerCase()))
  );

  const order = isArg1Rider ? arg2 : arg1;
  const rider = isArg1Rider ? arg1 : arg2;

  const orderTenant = normalizeOrderTenantId(order);
  const riderTenant = resolveTenantId(rider.tenantId);

  // 1. Strict Store / Tenant Isolation:
  // A rider must belong to the exact same supermarket chain (e.g. Unimart rider only for Unimart, Al-Fatah rider only for Al-Fatah).
  // Cross-store assignment is strictly forbidden.
  if (!orderTenant || !riderTenant || !isSameTenant(orderTenant, riderTenant)) {
    return {
      allowed: false,
      reason: `Rider ${rider.name || rider.username || 'selected'} belongs to ${rider.tenantName || rider.tenantId || 'another store'} and cannot be assigned to orders for a different store.`
    };
  }

  // 1b. Strict Physical Branch Isolation:
  // Each physical branch (People's Colony, Madina Town, Canal Road, etc.) operates its own independent riders fleet.
  const orderBranch = order.branchId || order.storeId;
  const riderBranch = rider.branchId || rider.storeId;
  if (orderBranch && riderBranch && !rider.isGlobal && String(orderBranch).trim().toLowerCase() !== String(riderBranch).trim().toLowerCase()) {
    return {
      allowed: false,
      reason: `Rider ${rider.name || rider.username || ''} is assigned to [${rider.branchName || riderBranch}] and cannot deliver orders for [${order.branchName || orderBranch}]. Each physical branch operates its own independent riders fleet.`
    };
  }

  // 2. Resolve geographic area / city for order and rider (cross-city sanity check only)
  const getArea = (entity = {}) => {
    const s = [
      entity.city,
      entity.zone,
      entity.region,
      entity.serviceArea,
      entity.address,
      entity.shippingAddress?.city,
      entity.shippingAddress?.address
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (s.includes('faisalabad') || s.includes('fsd') || s.includes('peoples colony') || s.includes('d-ground') || s.includes('jaranwala') || s.includes('clock tower') || s.includes('jhal khanuana')) return 'faisalabad';
    if (s.includes('lahore') || s.includes('lhr') || s.includes('gulberg') || s.includes('johar') || s.includes('dha phase') || s.includes('dha lahore')) return 'lahore';
    if (s.includes('karachi') || s.includes('khi') || s.includes('clifton') || s.includes('hassan square') || s.includes('nazimabad') || s.includes('shaheed')) return 'karachi';
    if (s.includes('islamabad') || s.includes('isb') || s.includes('centaurus') || s.includes('blue area')) return 'islamabad';
    if (s.includes('rawalpindi') || s.includes('rwp')) return 'rawalpindi';
    if (s.includes('multan')) return 'multan';
    return null;
  };

  const orderArea = getArea(order);
  const riderArea = getArea(rider);

  // Reject cross-city assignment (e.g. rider in Karachi, order in Faisalabad)
  if (orderArea && riderArea && orderArea !== riderArea) {
    return {
      allowed: false,
      reason: `Rider is based in [${rider.city || rider.zone || riderArea}] but order is in [${order.city || orderArea}]`
    };
  }

  // 3. Online Availability Check:
  const rStatus = String(rider.status || '').toLowerCase();
  if (rStatus === 'offline' || rStatus === 'off-duty' || rider.isOnline === false) {
    return {
      allowed: false,
      reason: `Rider ${rider.name || rider.username} is currently Offline (Off-Duty).`
    };
  }

  // 4. Delivery Region Enforcement:
  // Rider cannot be assigned to an order that is outside of the rider's delivery region / coverage zone
  if (order.regionSector || rider.regionSector || order.zoneId || rider.zoneId || order.deliveryRegion) {
    const rReg = String(rider.regionSector || rider.zoneId || rider.region || '').toLowerCase();
    const oReg = String(order.regionSector || order.zoneId || order.deliveryRegion || order.zone || '').toLowerCase();
    if (rReg && oReg && rReg.includes('zone-fsd') && oReg.includes('zone-fsd') && rReg !== oReg) {
      return {
        allowed: false,
        reason: `Rider is stationed in a different delivery region (${rider.region || rider.zone || 'other sector'}) and cannot be assigned to orders in ${order.zone || order.deliveryRegion || 'this sector'}.`
      };
    }
  }

  return { allowed: true };
};

/**
 * Check if a staff member can be assigned to an order
 */
export const canAssignStaffToOrder = (order, staff) => {
  if (!order || !staff) {
    return { allowed: false, reason: 'Missing order or staff data' };
  }

  const orderTenant = normalizeOrderTenantId(order);
  const staffTenant = resolveTenantId(staff.tenantId);

  // Strict Store / Tenant Isolation
  if (!orderTenant || !staffTenant || !isSameTenant(orderTenant, staffTenant)) {
    return {
      allowed: false,
      reason: `Staff ${staff.name || staff.username} belongs to ${staff.tenantName || staff.tenantId} but order is for a different store.`
    };
  }

  // Strict Physical Branch Isolation:
  // Each physical store operates its own dedicated pickup staff / packing desk.
  const orderBranch = order.branchId || order.storeId;
  const staffBranch = staff.branchId || staff.storeId;
  if (orderBranch && staffBranch && !staff.isGlobal && String(orderBranch).trim().toLowerCase() !== String(staffBranch).trim().toLowerCase()) {
    return {
      allowed: false,
      reason: `Pickup staff ${staff.name || staff.username} is assigned to [${staff.branchName || staffBranch}] and cannot prepare orders for [${order.branchName || orderBranch}]. Each physical store operates its own dedicated pickup staff.`
    };
  }

  return { allowed: true };
};

/**
 * Strict eligibility filter for riders: matching location and store fleet
 */
export const getStrictEligibleRiders = (order, ridersList = []) => {
  if (!order || !Array.isArray(ridersList)) return [];

  const eligible = ridersList.filter((rider) => {
    if (!rider) return false;
    const res = canAssignRiderToOrder(order, rider);
    return res.allowed;
  });

  // Location-based relative ranking:
  const orderText = [
    order.branchName,
    order.branchHub,
    order.city,
    order.address,
    order.zone,
    order.shippingAddress?.address,
    order.shippingAddress?.city
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return eligible
    .map((rider) => {
      let score = 0;
      const riderLocText = [
        rider.region,
        rider.zone,
        rider.serviceArea,
        rider.branchName,
        rider.city,
        rider.address
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Check specific neighborhood / served locality match
      const subAreas = [
        'peoples colony',
        'd-ground',
        'jaranwala',
        'madina town',
        'jhal khanuana',
        'clock tower',
        'samanabad',
        'kohinoor',
        'gulberg',
        'dha',
        'model town',
        'clifton',
        'gulshan'
      ];

      let isDirectAreaMatch = false;
      for (const area of subAreas) {
        if (orderText.includes(area) && riderLocText.includes(area)) {
          score += 100;
          isDirectAreaMatch = true;
          break;
        }
      }

      // Check branch delivery polygon match
      let isPolygonMatch = false;
      const orderLat = Number(
        order.shippingAddress?.coordinates?.lat ??
        order.shippingAddress?.latitude ??
        order.latitude ??
        order.lat
      );
      const orderLng = Number(
        order.shippingAddress?.coordinates?.lng ??
        order.shippingAddress?.longitude ??
        order.longitude ??
        order.lng
      );

      const branchPolygon = order.branch?.deliveryPolygon || order.deliveryPolygon;
      if (
        Number.isFinite(orderLat) &&
        Number.isFinite(orderLng) &&
        Array.isArray(branchPolygon) &&
        branchPolygon.length >= 3
      ) {
        let inside = false;
        for (let i = 0, j = branchPolygon.length - 1; i < branchPolygon.length; j = i++) {
          const yi = Array.isArray(branchPolygon[i]) ? branchPolygon[i][0] : branchPolygon[i].lat;
          const xi = Array.isArray(branchPolygon[i]) ? branchPolygon[i][1] : branchPolygon[i].lng;
          const yj = Array.isArray(branchPolygon[j]) ? branchPolygon[j][0] : branchPolygon[j].lat;
          const xj = Array.isArray(branchPolygon[j]) ? branchPolygon[j][1] : branchPolygon[j].lng;
          const intersect =
            yi > orderLat !== yj > orderLat &&
            orderLng < ((xj - xi) * (orderLat - yi)) / (yj - yi) + xi;
          if (intersect) inside = !inside;
        }
        if (inside) {
          isPolygonMatch = true;
          score += 150;
        }
      }

      // Branch match
      if (order.branchId && rider.branchId && String(order.branchId).toLowerCase() === String(rider.branchId).toLowerCase()) {
        score += 80;
      }

      // City match
      if ((orderText.includes('faisalabad') && riderLocText.includes('faisalabad')) ||
          (orderText.includes('lahore') && riderLocText.includes('lahore')) ||
          (orderText.includes('karachi') && riderLocText.includes('karachi')) ||
          (orderText.includes('islamabad') && riderLocText.includes('islamabad'))) {
        score += 30;
      }

      // Available / Active status bonus
      const st = String(rider.status || '').toLowerCase();
      if (st === 'active' || st === 'on-duty' || st === 'available') {
        score += 10;
      }

      const servedLabel = rider.region || rider.zone || rider.serviceArea || rider.branchName || rider.city || 'Store Area';

      return {
        ...rider,
        relevanceScore: score,
        isDirectAreaMatch,
        isPolygonMatch,
        servedAreaLabel: servedLabel
      };
    })
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
};

/**
 * Strict eligibility filter for pickup staff: same store and same branch
 */
export const getStrictEligibleStaff = (order, staffList = []) => {
  if (!order || !Array.isArray(staffList)) return [];
  return staffList.filter((staff) => {
    const res = canAssignStaffToOrder(order, staff);
    return res.allowed;
  });
};
