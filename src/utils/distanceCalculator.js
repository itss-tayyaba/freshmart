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
 * Calculate interior point or centroid guaranteed to lie inside polygon boundary
 */
export function getPolygonCentroidAndInsidePoint(polygonCoords) {
  if (!polygonCoords) return null;
  const coords = Array.isArray(polygonCoords[0]) && Array.isArray(polygonCoords[0][0])
    ? polygonCoords[0]
    : (Array.isArray(polygonCoords) ? polygonCoords : null);

  if (!coords || coords.length < 3) return null;

  let sumLat = 0;
  let sumLng = 0;
  let count = 0;
  const normalizedPoints = [];

  coords.forEach((pt) => {
    const norm = normalizeLatLng(pt);
    if (norm) {
      sumLat += norm.lat;
      sumLng += norm.lng;
      count++;
      normalizedPoints.push([norm.lat, norm.lng]);
    }
  });

  if (count < 3) return null;

  const centroid = [
    Number((sumLat / count).toFixed(5)),
    Number((sumLng / count).toFixed(5))
  ];

  if (isPointInPolygon(centroid, normalizedPoints)) {
    return centroid;
  }

  // If centroid is outside (e.g. concave/L-shaped polygon), test triangle centroid
  const p0 = normalizedPoints[0];
  const p1 = normalizedPoints[1];
  const p2 = normalizedPoints[2];
  const triCenter = [
    Number(((p0[0] + p1[0] + p2[0]) / 3).toFixed(5)),
    Number(((p0[1] + p1[1] + p2[1]) / 3).toFixed(5))
  ];
  if (isPointInPolygon(triCenter, normalizedPoints)) {
    return triCenter;
  }

  // Fallback to midpoint towards first vertex
  const fallback = [
    Number(((centroid[0] + p0[0]) / 2).toFixed(5)),
    Number(((centroid[1] + p0[1]) / 2).toFixed(5))
  ];
  return isPointInPolygon(fallback, normalizedPoints) ? fallback : centroid;
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
              if (tz.includes('samanabad') && (zId.includes('001') || zId.includes('samanabad'))) return true;
              if (tz.includes('madina') && (zId.includes('002') || zId.includes('madina'))) return true;
              if (tz.includes('dground') && (zId.includes('003') || zId.includes('dground') || zId.includes('d-ground'))) return true;
              if (tz.includes('peoples') && (zId.includes('004') || zId.includes('peoples'))) return true;
              if (tz.includes('canal') && (zId.includes('canal') || zId.includes('002'))) return true;
              if (tz.includes('clock') && (zId.includes('clock') || zId.includes('001') || zId.includes('003'))) return true;
              return false;
            };

            const isAssigned =
              zoneMatches(bDeliveryZone) ||
              zoneMatches(bAssignedZone) ||
              (Array.isArray(z.assignedStoreIds) && z.assignedStoreIds.some((sId) => String(sId).toLowerCase() === branchId)) ||
              (z.assignedStoreId && String(z.assignedStoreId).toLowerCase() === branchId) ||
              (Array.isArray(options.assignments) && options.assignments.some(
                (a) => (String(a.zoneId || '').toLowerCase() === zId || zoneMatches(a.zoneId)) &&
                       String(a.storeId || '').toLowerCase() === branchId &&
                       a.isActive !== false
              ));

            // Fallback: If store has NO assigned zone, check if store physical location lies inside zone
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

              // Check if customer doorstep is also in this polygon
              const userInZone = isPointInPolygon({ lat: userLat, lng: userLng }, rawRing);
              if (userInZone) {
                insideMasterZone = true;
              }
            }
          }
        }
      }

      // STRICT ZONE BOUNDARY:
      // If delivery zones are defined in the platform:
      // A store is deliverable IF AND ONLY IF:
      // 1) The customer location is inside a delivery zone covering/assigned to this store (insideMasterZone), OR
      // 2) The store has its own explicit custom deliveryPolygon, and customer is inside it (hasPolygon && insidePolygon)
      // When no delivery zones are configured, falls back to distance radius.
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
        storeAreaPolygon,
        isEligibleForDelivery: isEligible,
        isExtendedDelivery: false,
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
    if (s.includes('alfatah') || s.includes('fatah') || s.includes('alfateh') || s.includes('fateh') || s === 'company001') return 'tenant-alfatah';
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
      const currentIsZoneAssigned = Boolean(group.bestBranch.insideMasterZone || group.bestBranch.insideDeliveryZone);
      const newIsZoneAssigned = Boolean(branch.insideMasterZone || branch.insideDeliveryZone);

      if (newIsZoneAssigned && !currentIsZoneAssigned) {
        group.bestBranch = branch;
        group.distanceKm = branch.distanceKm;
        group.deliveryFee = branch.deliveryFee;
        group.estimatedTime = branch.estimatedTime;
      } else if (newIsZoneAssigned === currentIsZoneAssigned && branch.distanceKm < group.bestBranch.distanceKm) {
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

/**
 * Resolves the exact physical branch of a retailer assigned to the customer's delivery zone polygon.
 * 
 * Pipeline:
 * 1. Customer Location (lat, lng)
 * 2. Match coordinates with active Delivery Polygons
 * 3. Find matching Delivery Zone (e.g. Zone 2 - Canal Road)
 * 4. Find physical store of tenantId assigned to this zone (e.g. Al-Fatah - Canal Road Hub)
 * 5. Return that exact physical branch
 */
export function resolveBranchForCustomerLocation(tenantId, customerCoords, branches = [], options = {}) {
  const normUser = normalizeLatLng(customerCoords);
  if (!normUser) return null;
  const userLat = normUser.lat;
  const userLng = normUser.lng;

  // 1. Get delivery zones
  let zonesList = options.zones || [];
  if (!Array.isArray(zonesList) || zonesList.length === 0) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('freshmart_master_zones') || window.localStorage.getItem('freshmart_zones');
        if (raw) zonesList = JSON.parse(raw);
      }
    } catch (e) {}
  }

  // 2. Determine which zone polygon contains the customer coordinates
  let matchedZone = null;
  if (Array.isArray(zonesList) && zonesList.length > 0) {
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
        if (isPointInPolygon({ lat: userLat, lng: userLng }, rawRing)) {
          matchedZone = z;
          break;
        }
      }
    }
  }

  const normalizeTenantId = (raw) => {
    if (!raw) return 'unknown';
    const s = String(raw).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s.includes('alfatah') || s.includes('fatah') || s.includes('alfateh') || s.includes('fateh') || s === 'company001') return 'tenant-alfatah';
    if (s.includes('chaseup') || s.includes('caseup') || s === 'cu' || s === 'company002') return 'tenant-chaseup';
    if (s.includes('chaseval') || s.includes('caseval') || s === 'cv' || s === 'company003') return 'tenant-chasevalue';
    if (s.includes('freshmart') || s.includes('unimart') || s.includes('unimaart') || s === 'company004') return 'tenant-freshmart';
    return String(raw);
  };

  // 3. Filter branches belonging to this retailer (tenantId)
  const normTenant = normalizeTenantId(tenantId);
  const retailerBranches = (branches || []).filter((b) => {
    const rawT = b.tenantId || b.companyId || b.retailerId;
    return normalizeTenantId(rawT) === normTenant;
  });

  if (retailerBranches.length === 0) return null;

  // 4. If matchedZone was found, find the physical branch assigned to this zone
  if (matchedZone) {
    const zId = String(matchedZone.zoneId || matchedZone._id || matchedZone.id || '').toLowerCase();
    const zName = String(matchedZone.name || matchedZone.shortName || '').toLowerCase();

    const zoneMatches = (testZoneId) => {
      if (!testZoneId) return false;
      const tz = String(testZoneId).toLowerCase();
      if (tz === zId) return true;
      if (tz.includes('samanabad') && (zId.includes('001') || zId.includes('samanabad') || zName.includes('samanabad'))) return true;
      if (tz.includes('madina') && (zId.includes('002') || zId.includes('madina') || zName.includes('madina'))) return true;
      if (tz.includes('canal') && (zId.includes('002') || zId.includes('canal') || zName.includes('canal') || zName.includes('madina'))) return true;
      if (tz.includes('dground') && (zId.includes('003') || zId.includes('dground') || zId.includes('d-ground') || zName.includes('d-ground'))) return true;
      if (tz.includes('peoples') && (zId.includes('004') || zId.includes('peoples') || zName.includes('people'))) return true;
      if (tz.includes('clock') && (zId.includes('clock') || zId.includes('001') || zId.includes('003') || zName.includes('clock'))) return true;
      return false;
    };

    // Check explicit assignments
    const assignedBranch = retailerBranches.find((b) => {
      const bId = String(b.storeId || b.branchId || b._id || b.id || '').toLowerCase();
      const bDeliveryZone = String(b.deliveryZoneId || '').toLowerCase();
      const bAssignedZone = String(b.assignedZoneId || '').toLowerCase();
      const bName = String(b.name || b.branchName || '').toLowerCase();

      if (zoneMatches(bDeliveryZone) || zoneMatches(bAssignedZone)) return true;
      if (Array.isArray(matchedZone.assignedStoreIds) && matchedZone.assignedStoreIds.some((sId) => String(sId).toLowerCase() === bId)) return true;
      if (matchedZone.assignedStoreId && String(matchedZone.assignedStoreId).toLowerCase() === bId) return true;
      if (Array.isArray(options.assignments) && options.assignments.some(
        (a) => (String(a.zoneId || '').toLowerCase() === zId || zoneMatches(a.zoneId)) &&
               String(a.storeId || '').toLowerCase() === bId &&
               a.isActive !== false
      )) return true;

      // Smart name / hub matching
      if ((zName.includes('canal') || zId.includes('canal') || zId.includes('002')) && (bName.includes('canal') || bId.includes('canal'))) return true;
      if ((zName.includes('madina') || zId.includes('002')) && (bName.includes('madina') || bId.includes('madina') || bName.includes('canal'))) return true;
      if ((zName.includes('d-ground') || zId.includes('003')) && (bName.includes('d-ground') || bName.includes('flagship') || bId.includes('fsd'))) return true;
      if ((zName.includes('samanabad') || zId.includes('001')) && (bName.includes('samanabad') || bName.includes('main branch') || bId.includes('samanabad'))) return true;
      if ((zName.includes('people') || zId.includes('004')) && (bName.includes('people') || bName.includes('kohinoor') || bId.includes('kohinoor'))) return true;

      return false;
    });

    if (assignedBranch) {
      return {
        ...assignedBranch,
        servingZone: matchedZone,
        servingZoneName: matchedZone.name,
        isAssignedToCustomerZone: true
      };
    }
  }

  // 5. Fallback: Closest branch by Euclidean distance
  let closest = retailerBranches[0];
  let minD = Infinity;
  for (const b of retailerBranches) {
    const bLat = Number(b.latitude ?? b.coordinates?.lat);
    const bLng = Number(b.longitude ?? b.coordinates?.lng);
    if (!isNaN(bLat) && !isNaN(bLng)) {
      const d = calculateHaversineDistanceKm(userLat, userLng, bLat, bLng);
      if (d < minD) {
        minD = d;
        closest = b;
      }
    }
  }

  return {
    ...closest,
    servingZone: matchedZone || null,
    servingZoneName: matchedZone?.name || null,
    isAssignedToCustomerZone: Boolean(matchedZone)
  };
}
