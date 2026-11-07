import * as turf from '@turf/turf';

/**
 * Validates GeoJSON Polygon coordinates
 * Accepts:
 * - Direct coordinate array: [[[lng, lat], [lng, lat], ...]]
 * - Single ring: [[lng, lat], [lng, lat], ...]
 * - Array of { lat, lng } points
 *
 * Returns normalized GeoJSON Polygon coordinates or throws descriptive error.
 */
export function validateAndNormalizePolygon(rawCoordinates) {
  if (!rawCoordinates) {
    throw new Error('Polygon coordinates are required.');
  }

  let ring = [];

  // Case 1: Array of { lat, lng } or { latitude, longitude }
  if (Array.isArray(rawCoordinates) && rawCoordinates.length > 0 && typeof rawCoordinates[0] === 'object' && !Array.isArray(rawCoordinates[0])) {
    ring = rawCoordinates.map((pt, idx) => {
      const lat = Number(pt.lat ?? pt.latitude);
      const lng = Number(pt.lng ?? pt.longitude);
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error(`Invalid coordinate at index ${idx}: lat and lng must be numbers.`);
      }
      return [lng, lat];
    });
  }
  // Case 2: [[[lng, lat], ...]] (GeoJSON coordinates format)
  else if (Array.isArray(rawCoordinates) && Array.isArray(rawCoordinates[0]) && Array.isArray(rawCoordinates[0][0])) {
    ring = rawCoordinates[0].map((pt, idx) => {
      const lng = Number(pt[0]);
      const lat = Number(pt[1]);
      if (isNaN(lng) || isNaN(lat)) {
        throw new Error(`Invalid coordinate at index ${idx}: lng and lat must be numbers.`);
      }
      return [lng, lat];
    });
  }
  // Case 3: [[lng, lat], ...]
  else if (Array.isArray(rawCoordinates) && Array.isArray(rawCoordinates[0])) {
    ring = rawCoordinates.map((pt, idx) => {
      const lng = Number(pt[0]);
      const lat = Number(pt[1]);
      if (isNaN(lng) || isNaN(lat)) {
        throw new Error(`Invalid coordinate at index ${idx}: lng and lat must be numbers.`);
      }
      return [lng, lat];
    });
  } else {
    throw new Error('Unsupported polygon coordinates format.');
  }

  // Validate bounds of every point (GeoJSON format: [lng, lat])
  for (let i = 0; i < ring.length; i++) {
    const [lng, lat] = ring[i];
    if (lat < -90 || lat > 90) {
      throw new Error(`Latitude ${lat} out of range [-90, 90] at vertex ${i + 1}.`);
    }
    if (lng < -180 || lng > 180) {
      throw new Error(`Longitude ${lng} out of range [-180, 180] at vertex ${i + 1}.`);
    }
  }

  // Check unique vertices
  const uniqueKeys = new Set(ring.map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`));
  if (uniqueKeys.size < 3) {
    throw new Error('A delivery zone polygon must contain at least 3 distinct vertices.');
  }

  // Ensure ring is closed (first point equals last point)
  const first = ring[0];
  const last = ring[ring.length - 1];
  const isClosed = Math.abs(first[0] - last[0]) < 1e-7 && Math.abs(first[1] - last[1]) < 1e-7;

  if (!isClosed) {
    ring.push([first[0], first[1]]);
  }

  // Construct Turf Polygon
  let polyFeature;
  try {
    polyFeature = turf.polygon([ring]);
  } catch (err) {
    throw new Error(`Invalid polygon geometry: ${err.message}`);
  }

  // Self-intersection check using Turf.js kinks
  const kinks = turf.kinks(polyFeature);
  if (kinks && kinks.features && kinks.features.length > 0) {
    throw new Error(
      `Self-intersecting polygon detected with ${kinks.features.length} intersection kink(s). Polygon boundaries cannot cross themselves.`
    );
  }

  return {
    type: 'Polygon',
    coordinates: [ring]
  };
}

/**
 * Checks if a customer coordinate is inside a polygon (boundary-inclusive)
 * @param {Number} lat Latitude
 * @param {Number} lng Longitude
 * @param {Object} geojsonPolygon GeoJSON Polygon object { type: 'Polygon', coordinates: [...] }
 */
export function isPointInsideZone(lat, lng, geojsonPolygon) {
  try {
    const ptLat = Number(lat);
    const ptLng = Number(lng);
    if (isNaN(ptLat) || isNaN(ptLng)) return false;

    const pt = turf.point([ptLng, ptLat]);
    const poly = turf.polygon(geojsonPolygon.coordinates);

    // Boundary-inclusive: ignoreBoundary: false
    return turf.booleanPointInPolygon(pt, poly, { ignoreBoundary: false });
  } catch (err) {
    return false;
  }
}

/**
 * Calculates straight line distance (km) from a point to a polygon centroid or boundary
 */
export function calculateDistanceToZoneKm(lat, lng, geojsonPolygon) {
  try {
    const pt = turf.point([Number(lng), Number(lat)]);
    const poly = turf.polygon(geojsonPolygon.coordinates);

    // If point is inside the polygon, distance is 0 km
    if (turf.booleanPointInPolygon(pt, poly, { ignoreBoundary: false })) {
      return 0;
    }

    // Distance to centroid
    const centroid = turf.centroid(poly);
    const distToCentroid = turf.distance(pt, centroid, { units: 'kilometers' });

    // Distance to polygon boundary vertices (find minimum)
    const ring = geojsonPolygon.coordinates[0];
    let minDistToBoundary = Infinity;
    for (const [vLng, vLat] of ring) {
      const vPt = turf.point([vLng, vLat]);
      const d = turf.distance(pt, vPt, { units: 'kilometers' });
      if (d < minDistToBoundary) minDistToBoundary = d;
    }

    return Number(minDistToBoundary.toFixed(2));
  } catch (err) {
    return Infinity;
  }
}

/**
 * Calculates delivery fee based on zone config and cart total
 */
export function calculateZoneDeliveryFee(zone, orderSubtotal = 0) {
  const subtotal = Number(orderSubtotal) || 0;
  const baseCharge = Number(zone.deliveryCharge ?? 100);
  const minOrder = Number(zone.minOrderAmount ?? 0);
  const freeThreshold = Number(zone.freeDeliveryThreshold ?? Infinity);

  if (subtotal < minOrder) {
    return {
      fee: baseCharge,
      baseFee: baseCharge,
      isFree: false,
      meetsMinOrder: false,
      minOrderAmount: minOrder,
      freeDeliveryThreshold: freeThreshold,
      estimatedDeliveryTime: zone.estimatedDeliveryTime || '25-40 mins'
    };
  }

  const isFree = freeThreshold > 0 && subtotal >= freeThreshold;
  return {
    fee: isFree ? 0 : baseCharge,
    baseFee: baseCharge,
    isFree,
    meetsMinOrder: true,
    minOrderAmount: minOrder,
    freeDeliveryThreshold: freeThreshold,
    estimatedDeliveryTime: zone.estimatedDeliveryTime || '25-40 mins'
  };
}
