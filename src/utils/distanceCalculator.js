/**
 * Frontend Reusable Distance & Delivery Zone Calculation Utility for Faisalabad
 */

const EARTH_RADIUS_KM = 6371.0;
export const SEARCH_STEPS_KM = [5, 10, 15, 20, 25];

/**
 * Calculate accurate straight-line distance using the Haversine formula
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return Infinity;
  }

  const toRad = (val) => (val * Math.PI) / 180;
  const dLat = toRad(nLat2 - nLat1);
  const dLon = toRad(nLon2 - nLon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(nLat1)) * Math.cos(toRad(nLat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = EARTH_RADIUS_KM * c;
  return Number(dist.toFixed(2));
}

/**
 * Estimate road driving distance using Faisalabad urban curvature factor (1.22x)
 */
export function calculateRoadDistanceKm(lat1, lon1, lat2, lon2, roadFactor = 1.22) {
  const straightLine = calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);
  if (!Number.isFinite(straightLine)) return Infinity;
  return Number((straightLine * roadFactor).toFixed(2));
}

/**
 * Ray-casting algorithm to test if a point is inside a polygon boundary
 */
export function isPointInPolygon(point, polygon) {
  if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
    return false;
  }

  const x = Number(point.lng ?? point.longitude ?? (Array.isArray(point) ? point[1] : NaN));
  const y = Number(point.lat ?? point.latitude ?? (Array.isArray(point) ? point[0] : NaN));
  if (isNaN(x) || isNaN(y)) return false;

  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const ptI = polygon[i];
    const ptJ = polygon[j];
    const xi = Number(Array.isArray(ptI) ? ptI[1] : (ptI?.lng ?? ptI?.longitude));
    const yi = Number(Array.isArray(ptI) ? ptI[0] : (ptI?.lat ?? ptI?.latitude));
    const xj = Number(Array.isArray(ptJ) ? ptJ[1] : (ptJ?.lng ?? ptJ?.longitude));
    const yj = Number(Array.isArray(ptJ) ? ptJ[0] : (ptJ?.lat ?? ptJ?.latitude));

    if (isNaN(xi) || isNaN(yi) || isNaN(xj) || isNaN(yj)) continue;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Resolve delivery fee based on branch delivery tiers
 */
export function calculateBranchDeliveryFee(branch, distanceKm) {
  const tiers = Array.isArray(branch.deliveryTiers) && branch.deliveryTiers.length > 0
    ? [...branch.deliveryTiers].sort((a, b) => a.distanceKm - b.distanceKm)
    : [
        { distanceKm: 1, fee: 0 },
        { distanceKm: 2, fee: 40 },
        { distanceKm: 3, fee: 80 },
        { distanceKm: 5, fee: 120 }
      ];

  for (const tier of tiers) {
    if (distanceKm <= tier.distanceKm) {
      return tier.fee;
    }
  }

  const lastTier = tiers[tiers.length - 1];
  const extraKm = Math.max(0, distanceKm - lastTier.distanceKm);
  return lastTier.fee + Math.round(extraKm * 25);
}

/**
 * Estimate delivery arrival time based on distance
 */
export function estimateDeliveryTime(distanceKm) {
  if (distanceKm <= 1.5) return '10-20 mins';
  if (distanceKm <= 3.0) return '20-30 mins';
  if (distanceKm <= 5.0) return '30-45 mins';
  if (distanceKm <= 10.0) return '45-60 mins';
  if (distanceKm <= 15.0) return '60-80 mins';
  return '90+ mins';
}

/**
 * Progressive Search Expansion & Overlapping Delivery Zone Finder for Frontend
 */
export function findAvailableRetailers(customerCoords, branches = [], options = {}) {
  const userLat = Number(customerCoords?.lat ?? customerCoords?.latitude);
  const userLng = Number(customerCoords?.lng ?? customerCoords?.longitude);

  if (isNaN(userLat) || isNaN(userLng)) {
    return {
      eligibleRetailers: [],
      unavailableRetailers: [],
      allDiscoveredBranches: [],
      searchRadiusKm: 5,
      searchStepsTaken: [5],
      overlappingRetailersCount: 0,
      hasOverlappingZones: false
    };
  }

  const maxSearchLimit = options.maxSearchRadiusKm || 25;
  const useRoadDist = options.useRoadDistance ?? false;

  // Pre-calculate distance to all active branches
  const branchEvaluations = branches
    .filter((b) => {
      const activeStatus = String(b.deliveryStatus || b.status || 'active').toLowerCase();
      return activeStatus !== 'inactive';
    })
    .map((b) => {
      const bLat = Number(b.latitude ?? b.coordinates?.lat);
      const bLng = Number(b.longitude ?? b.coordinates?.lng);
      const straightLineKm = calculateHaversineDistanceKm(userLat, userLng, bLat, bLng);
      const effectiveDistKm = useRoadDist
        ? calculateRoadDistanceKm(userLat, userLng, bLat, bLng)
        : straightLineKm;

      const configuredRadius = Number(b.deliveryRadiusKm ?? b.deliveryRadius ?? 5);
      const hasPolygon = Array.isArray(b.deliveryPolygon) && b.deliveryPolygon.length >= 3;
      const insidePolygon = hasPolygon
        ? isPointInPolygon({ lat: userLat, lng: userLng }, b.deliveryPolygon)
        : false;

      // When super admin draws a custom boundary polygon, the polygon governs eligibility; otherwise radius is used
      const insideDeliveryZone = hasPolygon
        ? insidePolygon
        : (effectiveDistKm <= configuredRadius);
      const isEligible = insideDeliveryZone || (b.supportsExtendedDelivery && effectiveDistKm <= 20);

      const fee = calculateBranchDeliveryFee(b, effectiveDistKm);
      const estimatedTime = estimateDeliveryTime(effectiveDistKm);

      return {
        ...b,
        latitude: bLat,
        longitude: bLng,
        distanceKm: effectiveDistKm,
        straightLineKm,
        deliveryRadiusKm: configuredRadius,
        insideDeliveryZone,
        isEligibleForDelivery: isEligible,
        deliveryFee: fee,
        estimatedTime
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // Progressive Expansion Loop: 1 km -> 3 km -> 5 km -> 10 km -> 15 km -> 20 km -> 25 km
  let searchRadiusKm = SEARCH_STEPS_KM[0] || 1;
  const searchStepsTaken = [];
  let discoveredBranchesInRadius = [];
  let eligibleBranchesInRadius = [];

  for (const stepKm of SEARCH_STEPS_KM) {
    if (stepKm > maxSearchLimit) break;
    searchRadiusKm = stepKm;
    searchStepsTaken.push(stepKm);

    discoveredBranchesInRadius = branchEvaluations.filter((b) => b.distanceKm <= stepKm);
    eligibleBranchesInRadius = discoveredBranchesInRadius.filter((b) => b.isEligibleForDelivery);

    if (eligibleBranchesInRadius.length > 0) {
      break;
    }
  }

  const normalizeTenantId = (raw) => {
    if (!raw) return 'unknown';
    const s = String(raw).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s.includes('alfatah') || s.includes('fatah') || s === 'company001') return 'tenant-alfatah';
    if (s.includes('chaseup') || s.includes('caseup') || s === 'cu' || s === 'company002') return 'tenant-chaseup';
    if (s.includes('chaseval') || s.includes('caseval') || s === 'cv' || s === 'company003') return 'tenant-chasevalue';
    if (s.includes('freshmart') || s.includes('unimart') || s.includes('unimaart') || s === 'company004') return 'tenant-freshmart';
    return String(raw);
  };

  // Group by retailer (tenantId)
  const retailerMap = new Map();
  const unavailableRetailerMap = new Map();

  for (const branch of discoveredBranchesInRadius) {
    const rawId = String(branch.tenantId || branch.companyId || 'unknown');
    const tId = normalizeTenantId(rawId);
    const tenantName = branch.tenantName || (
      tId === 'tenant-alfatah' ? 'Al-Fatah Supermarket' :
      tId === 'tenant-chaseup' ? 'Chase Up' :
      tId === 'tenant-chasevalue' ? 'Chase Value' :
      tId === 'tenant-freshmart' ? 'FreshMart Direct / UniMart' :
      branch.name || tId
    );

    if (branch.isEligibleForDelivery) {
      if (!retailerMap.has(tId)) {
        retailerMap.set(tId, {
          tenantId: tId,
          tenantName,
          branches: [],
          bestBranch: branch,
          distanceKm: branch.distanceKm,
          deliveryFee: branch.deliveryFee,
          estimatedTime: branch.estimatedTime,
          isEligible: true
        });
      }
      const group = retailerMap.get(tId);
      group.branches.push(branch);
      if (branch.distanceKm < group.bestBranch.distanceKm) {
        group.bestBranch = branch;
        group.distanceKm = branch.distanceKm;
        group.deliveryFee = branch.deliveryFee;
        group.estimatedTime = branch.estimatedTime;
      }
    } else {
      if (!unavailableRetailerMap.has(tId) && !retailerMap.has(tId)) {
        unavailableRetailerMap.set(tId, {
          tenantId: tId,
          tenantName,
          branches: [branch],
          bestBranch: branch,
          distanceKm: branch.distanceKm,
          deliveryFee: branch.deliveryFee,
          estimatedTime: branch.estimatedTime,
          isEligible: false,
          reason: `Outside ${branch.deliveryRadiusKm} km delivery zone (${branch.distanceKm} km away)`
        });
      }
    }
  }

  const eligibleRetailers = Array.from(retailerMap.values()).sort(
    (a, b) => a.distanceKm - b.distanceKm
  );
  const unavailableRetailers = Array.from(unavailableRetailerMap.values()).sort(
    (a, b) => a.distanceKm - b.distanceKm
  );

  return {
    eligibleRetailers,
    unavailableRetailers,
    allDiscoveredBranches: discoveredBranchesInRadius,
    searchRadiusKm,
    searchStepsTaken,
    overlappingRetailersCount: eligibleRetailers.length,
    hasOverlappingZones: eligibleRetailers.length > 1
  };
}
