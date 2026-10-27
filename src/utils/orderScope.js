import {
  COMPANIES,
  BRANCHES,
  resolveTenantId,
  isSameTenant
} from '../data/companyHierarchyData.js';

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
    (order.items && order.items[0]?.tenantId) ||
    (order.rawItems && order.rawItems[0]?.tenantId) ||
    (order.orderItems && order.orderItems[0]?.tenantId);
  return resolveTenantId(raw);
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

  // Pickup Staff: strictly scoped to same store AND same branch
  if (role === 'pickup_staff' || role === 'staff') {
    if (!isSameTenant(orderTenant, targetTenant)) return false;
    if (user?.branchId && order.branchId && order.branchId !== user.branchId) {
      return false;
    }
    // Field staff sees tasks assigned to them or unassigned in their branch
    const staffId = user?.staffId || user?.id || user?._id;
    if (order.pickupStaffId && staffId && String(order.pickupStaffId) !== String(staffId)) {
      return false;
    }
    return true;
  }

  // Rider: strictly scoped to same store AND same branch
  if (role === 'rider') {
    if (!isSameTenant(orderTenant, targetTenant)) return false;
    if (user?.branchId && order.branchId && order.branchId !== user.branchId) {
      return false;
    }
    const riderId = user?.riderId || user?.id || user?._id;
    const assignedId = order.assignedRider?.id || order.assignedRider?.riderId;
    if (assignedId && riderId && String(assignedId) !== String(riderId)) {
      return false;
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

  if (!isSameTenant(orderTenant, riderTenant)) {
    return {
      allowed: false,
      reason: `Rider belongs to store [${rider.tenantId || 'unassigned'}] but order is for [${order.tenantId || 'unassigned'}]`
    };
  }

  // Enforce same branch if both have branchId specified
  if (order.branchId && rider.branchId && order.branchId !== rider.branchId) {
    return {
      allowed: false,
      reason: `Rider belongs to branch [${rider.branchName || rider.branchId}] but order is routed to branch [${order.branchName || order.branchId}]`
    };
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
 * Strict eligibility filter for riders: same store and same branch
 */
export const getStrictEligibleRiders = (order, ridersList = []) => {
  if (!order || !Array.isArray(ridersList)) return [];
  return ridersList.filter((rider) => {
    const res = canAssignRiderToOrder(order, rider);
    return res.allowed;
  });
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
