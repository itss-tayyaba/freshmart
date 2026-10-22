import { STORE_LOCATIONS } from '../data/freshMartData.js';
import { calculateDistanceKm } from '../data/pakistanLocations.js';

export const findNearestStore = (coords, city) => {
  const nearbyStores = STORE_LOCATIONS.filter((store) => store.city === city);
  if (!coords || nearbyStores.length === 0) return null;

  return nearbyStores
    .map((store) => ({
      ...store,
      distanceKm: calculateDistanceKm(coords.lat, coords.lng, store.coords.lat, store.coords.lng)
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];
};

export const riderServesArea = (riderZone, deliveryArea) => {
  if (!deliveryArea?.trim()) return true;
  const area = deliveryArea.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const zones = String(riderZone || '')
    .split(/[\/,|]/)
    .map((zone) => zone.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim())
    .filter((zone) => zone && zone !== 'main hub');

  return zones.some((zone) => area.includes(zone) || zone.includes(area));
};
