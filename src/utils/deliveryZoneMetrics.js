import { area as turfArea } from '@turf/turf';

export const calculateDeliveryPolygonAreaKm2 = (points) => {
  if (!Array.isArray(points) || points.length < 3) return null;

  const ring = points.map((point) => {
    if (Array.isArray(point)) {
      return [Number(point[1]), Number(point[0])];
    }
    return [
      Number(point?.lng ?? point?.longitude),
      Number(point?.lat ?? point?.latitude)
    ];
  });

  if (
    ring.some(
      ([lng, lat]) =>
        !Number.isFinite(lng) ||
        !Number.isFinite(lat) ||
        Math.abs(lng) > 180 ||
        Math.abs(lat) > 90
    )
  ) {
    return null;
  }

  const uniquePoints = new Set(ring.map(([lng, lat]) => `${lng},${lat}`));
  if (uniquePoints.size < 3) return null;

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }

  const squareMeters = turfArea({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [ring]
    }
  });

  return Number.isFinite(squareMeters) ? squareMeters / 1_000_000 : null;
};

export const calculateDeliveryZoneReachKm = (points, storeLocation) => {
  if (!Array.isArray(points) || points.length < 3 || !storeLocation) return null;

  const centerLat = Number(storeLocation.lat ?? storeLocation.latitude);
  const centerLng = Number(storeLocation.lng ?? storeLocation.longitude);
  if (
    !Number.isFinite(centerLat) ||
    !Number.isFinite(centerLng) ||
    Math.abs(centerLat) > 90 ||
    Math.abs(centerLng) > 180
  ) {
    return null;
  }

  const distances = points.map((point) => {
    const lat = Number(Array.isArray(point) ? point[0] : point?.lat ?? point?.latitude);
    const lng = Number(Array.isArray(point) ? point[1] : point?.lng ?? point?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return null;
    }

    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const latDelta = toRadians(lat - centerLat);
    const lngDelta = toRadians(lng - centerLng);
    const haversine =
      Math.sin(latDelta / 2) ** 2 +
      Math.cos(toRadians(centerLat)) *
        Math.cos(toRadians(lat)) *
        Math.sin(lngDelta / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  });

  if (distances.some((distance) => distance === null)) return null;
  return Math.max(...distances);
};
