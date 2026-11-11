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
 * Normalize point coordinates into { lat, lng } regardless of format:
 * - [lat, lng] array
 * - [lng, lat] GeoJSON array
 * - { lat, lng } object
 * - { latitude, longitude } object
 */
export function normalizeLatLng(pt) {
  if (!pt) return null;
  if (Array.isArray(pt)) {
    const v0 = Number(pt[0]);
    const v1 = Number(pt[1]);
    if (isNaN(v0) || isNaN(v1)) return null;
    // In Pakistan / South Asia (Lat: ~23-37, Lng: ~60-78):
    // If first element > 45, it is Longitude (GeoJSON format [lng, lat])
    if (Math.abs(v0) > Math.abs(v1) && Math.abs(v0) > 45) {
      return { lat: v1, lng: v0 };
    }
    return { lat: v0, lng: v1 };
  }
  if (typeof pt === 'object') {
    const lat = Number(pt.lat ?? pt.latitude);
    const lng = Number(pt.lng ?? pt.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

/**
 * Ray-casting algorithm to test if a point is inside a polygon boundary
 */
export function isPointInPolygon(point, polygon) {
  if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
    return false;
  }

  const pNorm = normalizeLatLng(point);
  if (!pNorm) return false;
  const x = pNorm.lng;
  const y = pNorm.lat;

  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const ptI = normalizeLatLng(polygon[i]);
    const ptJ = normalizeLatLng(polygon[j]);
    if (!ptI || !ptJ) continue;

    const xi = ptI.lng;
    const yi = ptI.lat;
    const xj = ptJ.lng;
    const yj = ptJ.lat;

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

      // Check if user is inside a master store area polygon (created in Super Admin) where this store lies
      let insideMasterZone = false;
      let storeAreaPolygon = null;
      const zonesList = options.zones || [];
      if (Array.isArray(zonesList) && zonesList.length > 0) {
        for (const z of zonesList) {
          if (z.isActive === false || String(z.status).toLowerCase() === 'inactive') continue;
          const rawRing = z.geometry?.coordinates?.[0] || z.coordinates?.[0] || z.coordinates;
          if (Array.isArray(rawRing) && rawRing.length >= 3) {
            // Check if store physically lies in this polygon or is assigned to this zone
            const bInZone = isPointInPolygon({ lat: bLat, lng: bLng }, rawRing);
            const branchId = String(b._id || b.id || b.storeId || '').toLowerCase();
            const isAssigned = (options.assignments || []).some(
              (a) => a.zoneId === z.zoneId && String(a.storeId || '').toLowerCase() === branchId
            ) || (z.assignedStoreId && String(z.assignedStoreId).toLowerCase() === branchId) ||
                 (b.assignedZoneId && String(b.assignedZoneId).toLowerCase() === String(z.zoneId || '').toLowerCase());

            const isStoreAssociatedWithZone = isAssigned || bInZone;

            if (isStoreAssociatedWithZone) {
              if (!storeAreaPolygon) {
                storeAreaPolygon = {
                  zoneId: z.zoneId,
                  name: z.name,
                  color: z.color || '#10b981',
                  deliveryCharge: z.deliveryCharge
                };
              }
            }

            // Check if customer doorstep is also in this polygon
            const userInZone = isPointInPolygon({ lat: userLat, lng: userLng }, rawRing);
            if (userInZone && isStoreAssociatedWithZone) {
              insideMasterZone = true;
            }
          }
        }
      }

      // Concept 2: Each store has its own delivery region polygon
      // The 3 main master polygons cover all stores (where stores lie).
      // Remaining polygons are individual delivery regions. If a store has a custom delivery region polygon,
      // it delivers strictly within its drawn delivery region boundary.
      const insideDeliveryZone = hasPolygon
        ? insidePolygon
        : (insideMasterZone || effectiveDistKm <= configuredRadius);
      const isExtendedSla = !insideDeliveryZone && Boolean(b.supportsExtendedDelivery) && effectiveDistKm <= (configuredRadius + 10);
      const isEligible = insideDeliveryZone || isExtendedSla;

      const fee = calculateBranchDeliveryFee(b, effectiveDistKm);
      const estimatedTime = isExtendedSla
        ? '45-60 mins (Regional Delivery)'
        : estimateDeliveryTime(effectiveDistKm);

      return {
        ...b,
        latitude: bLat,
        longitude: bLng,
        distanceKm: effectiveDistKm,
        straightLineKm,
        deliveryRadiusKm: configuredRadius,
        insideDeliveryZone,
        storeAreaPolygon,
        isEligibleForDelivery: isEligible,
        isExtendedDelivery: isExtendedSla,
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
