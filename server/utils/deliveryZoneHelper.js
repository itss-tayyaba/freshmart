/**
 * Reusable Delivery Zone & Distance Calculation Utility for Faisalabad Multi-Retailer Platform
 */

const EARTH_RADIUS_KM = 6371.0;
export const SEARCH_STEPS_KM = [0, 2, 3];
export const PROGRESSIVE_SEARCH_STAGES = [
  { stage: 1, key: 'zone_match', radiusKm: 0, label: 'Stage 1 — Customer Exact Location (Zone Match)' },
  { stage: 2, key: '2km_expansion', radiusKm: 2, label: 'Stage 2 — Nearby Branches (Within 2 km)' },
  { stage: 3, key: '3km_expansion', radiusKm: 3, label: 'Stage 3 — Extended Area (Within 3 km)' },
  { stage: 4, key: 'beyond_3km_fallback', radiusKm: null, label: 'Stage 4 — Beyond 3 km (Alternative Nearest Store)' }
];

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

  const x = Number(point.lng ?? point.longitude);
  const y = Number(point.lat ?? point.latitude);
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = Number(polygon[i].lng ?? polygon[i].longitude);
    const yi = Number(polygon[i].lat ?? polygon[i].latitude);
    const xj = Number(polygon[j].lng ?? polygon[j].longitude);
    const yj = Number(polygon[j].lat ?? polygon[j].latitude);

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

  // If outside highest tier, use highest tier or add per-km rate
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
 * Progressive Search Expansion & Overlapping Delivery Zone Finder
 *
 * @param {Object} customerCoords - { lat, lng }
 * @param {Array} branches - Array of branch objects
 * @param {Object} options - { maxSearchRadiusKm: 25, useRoadDistance: true }
 * @returns {Object} {
 *    eligibleRetailers: [],      // Retailers that CAN deliver to customer location
 *    unavailableRetailers: [],   // Retailers discovered but customer is outside their delivery zone
 *    searchRadiusKm: number,     // Radius at which discovery completed
 *    searchStepsTaken: [],       // History of expansion steps evaluated
 *    overlappingRetailersCount: number
 * }
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
      error: 'Invalid customer coordinates provided'
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

      // Check if user is inside a delivery zone covering/assigned to this store
      let insideMasterZone = false;
      let storeAreaPolygon = null;
      const zonesList = options.zones || [];
      const hasActiveDeliveryZones = Array.isArray(zonesList) && zonesList.some(
        (z) => z && z.isActive !== false && String(z.status || 'active').toLowerCase() !== 'inactive'
      );

      if (hasActiveDeliveryZones) {
        for (const z of zonesList) {
          if (!z || z.isActive === false || String(z.status || 'active').toLowerCase() === 'inactive') continue;

          let rawRing = null;
          if (z.geometry && Array.isArray(z.geometry.coordinates)) {
            rawRing = Array.isArray(z.geometry.coordinates[0]) && Array.isArray(z.geometry.coordinates[0][0])
              ? z.geometry.coordinates[0]
              : z.geometry.coordinates;
          } else if (z.polygon && Array.isArray(z.polygon.coordinates)) {
            rawRing = Array.isArray(z.polygon.coordinates[0]) && Array.isArray(z.polygon.coordinates[0][0])
              ? z.polygon.coordinates[0]
              : z.polygon.coordinates;
          } else if (Array.isArray(z.polygon)) {
            rawRing = z.polygon;
          } else if (Array.isArray(z.coordinates)) {
            rawRing = Array.isArray(z.coordinates[0]) && Array.isArray(z.coordinates[0][0])
              ? z.coordinates[0]
              : z.coordinates;
          }

          if (Array.isArray(rawRing) && rawRing.length >= 3) {
            const branchId = String(b._id || b.id || b.storeId || b.branchId || '').toLowerCase();
            const zId = String(z.zoneId || z._id || z.id || '').toLowerCase();
            const bDeliveryZone = String(b.deliveryZoneId || '').toLowerCase();
            const bAssignedZone = String(b.assignedZoneId || '').toLowerCase();

            const zoneMatches = (testZoneId) => {
              if (!testZoneId) return false;
              const tz = String(testZoneId).toLowerCase();
              if (tz === zId) return true;
              return false;
            };

            const isAssigned =
              zoneMatches(bDeliveryZone) ||
              zoneMatches(bAssignedZone) ||
              (Array.isArray(z.assignedStoreIds) && z.assignedStoreIds.some((sId) => String(sId).toLowerCase() === branchId)) ||
              (z.assignedStoreId && String(z.assignedStoreId).toLowerCase() === branchId) ||
              (Array.isArray(options.assignments) && options.assignments.some(
                (a) => String(a.zoneId || '').toLowerCase() === zId &&
                       String(a.storeId || '').toLowerCase() === branchId &&
                       a.isActive !== false
              ));

            const bInZone = isPointInPolygon({ lat: bLat, lng: bLng }, rawRing);
            const isStoreAssociatedWithZone = isAssigned || (!bDeliveryZone && !bAssignedZone && bInZone);

            if (isStoreAssociatedWithZone) {
              if (!storeAreaPolygon) {
                storeAreaPolygon = {
                  zoneId: z.zoneId || z._id,
                  name: z.name,
                  color: z.color || '#10b981',
                  deliveryCharge: z.deliveryCharge ?? z.deliveryFee
                };
              }

              const userInZone = isPointInPolygon({ lat: userLat, lng: userLng }, rawRing);
              if (userInZone) {
                insideMasterZone = true;
              }
            }
          }
        }
      }

      // STRICT ZONE BOUNDARY:
      // A store is in delivery zone polygon (Stage 1) IF:
      // 1) The customer location is inside a delivery zone assigned to this store (insideMasterZone), OR
      // 2) The store has its own explicit custom deliveryPolygon, and customer is inside it (hasPolygon && insidePolygon)
      const insideDeliveryZone = hasPolygon
        ? insidePolygon
        : (hasActiveDeliveryZones ? insideMasterZone : (effectiveDistKm <= configuredRadius));
      const isEligible = insideDeliveryZone;

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

  // Progressive Expansion Loop: 0 km → 2 km → 3 km → Beyond 3 km (Fallback)
  let searchStage = 1;
  let stageKey = 'zone_match';
  let stageLabel = 'Stage 1 — Customer Exact Location (Zone Match)';
  let searchRadiusKm = 0;
  const searchStepsTaken = [];
  let discoveredBranchesInRadius = [];
  let eligibleBranchesInRadius = [];

  // STAGE 1 — 0 km: Customer's exact location (Polygon Zone Match)
  searchStepsTaken.push(0);
  const stage1Eligible = branchEvaluations.filter((b) => b.insideDeliveryZone);

  if (stage1Eligible.length > 0) {
    searchStage = 1;
    stageKey = 'zone_match';
    stageLabel = 'Stage 1 — Customer Exact Location (Zone Match)';
    searchRadiusKm = 0;
    discoveredBranchesInRadius = stage1Eligible;
    eligibleBranchesInRadius = stage1Eligible;
  } else {
    // STAGE 2 — 2 km: Search nearby branches within 2 km
    searchStepsTaken.push(2);
    const within2Km = branchEvaluations.filter((b) => b.distanceKm <= 2.0);
    const stage2Eligible = within2Km.filter(
      (b) => b.isEligibleForDelivery || b.distanceKm <= b.deliveryRadiusKm
    );

    if (stage2Eligible.length > 0) {
      searchStage = 2;
      stageKey = '2km_expansion';
      stageLabel = 'Stage 2 — Nearby Branches (Within 2 km)';
      searchRadiusKm = 2;
      eligibleBranchesInRadius = stage2Eligible.map((b) => ({
        ...b,
        isEligibleForDelivery: true,
        deliveryType: 'nearby_branch_2km'
      }));
      const eligibleIds = new Set(eligibleBranchesInRadius.map((b) => b.id || b.storeId));
      discoveredBranchesInRadius = within2Km.map((b) => {
        const id = b.id || b.storeId;
        return eligibleIds.has(id)
          ? eligibleBranchesInRadius.find((e) => (e.id || e.storeId) === id)
          : b;
      });
    } else {
      // STAGE 3 — 3 km: Expand search further within 3 km
      searchStepsTaken.push(3);
      const within3Km = branchEvaluations.filter((b) => b.distanceKm <= 3.0);
      const stage3Eligible = within3Km.filter(
        (b) => b.isEligibleForDelivery || b.distanceKm <= b.deliveryRadiusKm
      );

      if (stage3Eligible.length > 0) {
        searchStage = 3;
        stageKey = '3km_expansion';
        stageLabel = 'Stage 3 — Extended Area (Within 3 km)';
        searchRadiusKm = 3;
        eligibleBranchesInRadius = stage3Eligible.map((b) => ({
          ...b,
          isEligibleForDelivery: true,
          deliveryType: 'extended_branch_3km'
        }));
        const eligibleIds = new Set(eligibleBranchesInRadius.map((b) => b.id || b.storeId));
        discoveredBranchesInRadius = within3Km.map((b) => {
          const id = b.id || b.storeId;
          return eligibleIds.has(id)
            ? eligibleBranchesInRadius.find((e) => (e.id || e.storeId) === id)
            : b;
        });
      } else {
        // STAGE 4 — Beyond 3 km: Display nearest store as an alternative
        searchStepsTaken.push('beyond_3km');
        searchStage = 4;
        stageKey = 'beyond_3km_fallback';
        stageLabel = 'Stage 4 — Beyond 3 km (Alternative Nearest Store)';
        const closest = branchEvaluations[0] || null;
        searchRadiusKm = closest ? Math.round(closest.distanceKm) : 5;
        discoveredBranchesInRadius = closest
          ? [
              {
                ...closest,
                isEligibleForDelivery: false,
                outsideDeliveryCoverage: true,
                isAlternative: true,
                badge: 'Outside Coverage • Alternative Store',
                deliveryNotice: 'Outside delivery coverage (pickup only, not delivering to your location)'
              }
            ]
          : [];
        eligibleBranchesInRadius = [];
      }
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
          reason: `Customer is outside the ${branch.deliveryRadiusKm} km delivery zone (Branch is ${branch.distanceKm} km away)`
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
    searchStage,
    stageKey,
    stageLabel,
    searchRadiusKm,
    searchStepsTaken,
    isDeliverable: eligibleRetailers.length > 0,
    outsideDeliveryCoverage: eligibleRetailers.length === 0,
    overlappingRetailersCount: eligibleRetailers.length,
    hasOverlappingZones: eligibleRetailers.length > 1
  };
}
