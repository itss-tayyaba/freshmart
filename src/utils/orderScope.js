import {
  COMPANIES,
  BRANCHES,
  resolveTenantId,
  isSameTenant
} from '../data/companyHierarchyData.js';
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

/**
 * Resolve order routing to ensure an order is assigned to a branch that actually belongs
 * to the order's store. If an order has a branch from another store or missing branch,
 * it reroutes to the closest valid branch of that store based on coordinates or city.
 */
export const resolveOrderRouting = ({
  tenantId,
  branchId,
  shippingAddress,
  destinationCoords,
  availableBranches = BRANCHES
}) => {
  const canonicalTenant = resolveTenantId(tenantId || 'company_001');
  const storeBranches = (availableBranches || BRANCHES).filter(
    (b) => b.tenantId === canonicalTenant && (b.status === 'active' || !b.status)
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
    matchedBranch = storeBranches.find((b) => b._id === branchId || b.id === branchId);
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
    branchName: matchedBranch?.name,
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
 * Determine if an order is visible to a user based on role, store, and branch
 */
export const isOrderVisibleToUser = (order, user, activeTenantId = null) => {
  if (!order) return false;

  const role = (user?.role || '').toLowerCase();
  const orderTenant = normalizeOrderTenantId(order);
  const targetTenant = resolveTenantId(activeTenantId || user?.tenantId);

  // Superadmin can view all orders, or filter by active tenant if chosen
  if (role === 'superadmin' || user?.isSuperAdmin) {
    if (activeTenantId && activeTenantId !== 'all') {
      return isSameTenant(orderTenant, targetTenant);
    }
    return true;
  }

  // Store Admin: scoped to their own tenant
  if (role === 'admin' || role === 'store admin') {
    if (!isSameTenant(orderTenant, targetTenant)) return false;
    // If admin is restricted to a specific branch
    if (user?.branchId && user.branchId !== 'all') {
      return !order.branchId || order.branchId === user.branchId;
    }
    return true;
  }

  // Pickup Staff: strictly scoped to same store; directly assigned tasks always visible
  if (role === 'pickup_staff' || role === 'staff') {
    if (!isSameTenant(orderTenant, targetTenant)) return false;

    // Field staff directly assigned to this order can always see it regardless of branch
    if (isOrderAssignedToPickupStaff(order, user)) return true;

    // If order was assigned to a different staff member, hide from this user
    const staffId = user?.staffId || user?.id || user?._id;
    if (order.pickupStaffId && staffId && String(order.pickupStaffId).toLowerCase() !== String(staffId).toLowerCase()) {
      return false;
    }

    // For unassigned pool, check branch
    if (user?.branchId && user.branchId !== 'all' && order.branchId && order.branchId !== 'all') {
      if (order.branchId !== user.branchId) return false;
    }
    return true;
  }

  // Rider: directly assigned parcels are ALWAYS visible to the assigned courier!
  if (role === 'rider') {
    // 1. If this parcel is directly assigned to this rider, it is ALWAYS visible!
    // Direct dispatch assignment guarantees the courier can view their active orders regardless of store/branch origin.
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

    // 3. For unassigned orders in the dispatch/ready pool: check store and branch
    if (!isSameTenant(orderTenant, targetTenant)) return false;
    if (user?.branchId && user.branchId !== 'all' && user.branchId !== 'custom' && order.branchId && order.branchId !== 'all') {
      if (order.branchId !== user.branchId) {
        return false;
      }
    }
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
 */
export const canAssignRiderToOrder = (order, rider) => {
  if (!order || !rider) {
    return { allowed: false, reason: 'Missing order or rider data' };
  }

  const orderTenant = normalizeOrderTenantId(order);
  const riderTenant = resolveTenantId(rider.tenantId);

  // 1. Store / Tenant Matching:
  // A rider is allowed if:
  // - They belong to the same tenant, OR
  // - They are flagged as global fleet courier (rider.isGlobal), OR
  // - They have no store restriction (!rider.tenantId)
  const isTenantMatch = !rider.tenantId || rider.isGlobal === true || isSameTenant(orderTenant, riderTenant);

  // 2. Resolve geographic area / city for order and rider
  const getArea = (entity = {}) => {
    const s = [
      entity.city,
      entity.zone,
      entity.region,
      entity.serviceArea,
      entity.branchName,
      entity.branchId,
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

  // Reject cross-city / cross-region assignment (e.g. rider in Karachi, order in Faisalabad)
  if (orderArea && riderArea && orderArea !== riderArea) {
    return {
      allowed: false,
      reason: `Rider is based in [${rider.city || rider.zone || rider.region || riderArea}] but order is in [${order.city || order.branchName || orderArea}]`
    };
  }

  // Cross-store rejection (if rider is from another store and NOT in global fleet)
  if (!isTenantMatch) {
    return {
      allowed: false,
      reason: `Rider belongs to store [${rider.tenantId || 'unassigned'}] but order is for [${order.tenantId || 'unassigned'}]`
    };
  }

  // Strict branch mismatch fallback (only if both have different explicit non-matching branch IDs and rider is not global)
  if (order.branchId && rider.branchId && order.branchId !== 'all' && rider.branchId !== 'all' && order.branchId !== 'custom' && rider.branchId !== 'custom') {
    if (String(order.branchId).toLowerCase() !== String(rider.branchId).toLowerCase()) {
      if (!rider.isGlobal) {
        return {
          allowed: false,
          reason: `Rider belongs to branch [${rider.branchName || rider.branchId}] but order is routed to branch [${order.branchName || order.branchId}]`
        };
      }
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

  if (!isSameTenant(orderTenant, staffTenant)) {
    return {
      allowed: false,
      reason: `Staff belongs to store [${staff.tenantId}] but order is for [${order.tenantId}]`
    };
  }

  if (order.branchId && staff.branchId && order.branchId !== staff.branchId) {
    return {
      allowed: false,
      reason: `Staff belongs to branch [${staff.branchName || staff.branchId}] but order is in branch [${order.branchName || order.branchId}]`
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

      // Branch match
      if (order.branchId && rider.branchId && String(order.branchId).toLowerCase() === String(rider.branchId).toLowerCase()) {
        score += 50;
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
