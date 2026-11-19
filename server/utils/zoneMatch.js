// Pure helpers (no DB / turf imports) so they can be unit-tested.
// GeoJSON polygons use [lng, lat] order.
export const pointInRing = (lat, lng, ring = []) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
};

export const zoneContainsPoint = (zone, lat, lng) => {
  const ring = zone?.geometry?.coordinates?.[0];
  return Array.isArray(ring) && ring.length >= 4 && pointInRing(Number(lat), Number(lng), ring);
};

// Delivery polygons (not the big store-area clusters) that contain the point.
export const suggestZonesForPoint = (zones = [], lat, lng) =>
  zones
    .filter((z) => z && z.isActive !== false && String(z.status || 'active').toLowerCase() === 'active')
    .filter((z) => zoneContainsPoint(z, lat, lng))
    .sort((a, b) => Number(Boolean(a.isStoreAreaPolygon)) - Number(Boolean(b.isStoreAreaPolygon)))
    .map((z) => ({ zoneId: z.zoneId, name: z.name, isStoreAreaPolygon: Boolean(z.isStoreAreaPolygon) }));
