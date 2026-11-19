import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestZonesForPoint, zoneContainsPoint } from '../server/utils/zoneMatch.js';
import { getAllUnifiedStores } from '../src/utils/storeHelper.js';
import { STORE_REGISTRY } from '../src/data/storeRegistry.js';

const square = (id, name, minLng, minLat, maxLng, maxLat, extra = {}) => ({
  zoneId: id,
  name,
  isActive: true,
  status: 'active',
  geometry: { type: 'Polygon', coordinates: [[[minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat]]] },
  ...extra
});

test('a store pin is matched to the polygon that contains it', () => {
  const a = square('ZONE-A', 'Zone A', 73.0, 31.4, 73.1, 31.5);
  const b = square('ZONE-B', 'Zone B', 73.1, 31.4, 73.2, 31.5);
  assert.equal(zoneContainsPoint(a, 31.45, 73.05), true);
  assert.equal(zoneContainsPoint(a, 31.45, 73.15), false);
  assert.deepEqual(suggestZonesForPoint([a, b], 31.45, 73.15).map((z) => z.zoneId), ['ZONE-B']);
  assert.deepEqual(suggestZonesForPoint([a, b], 30.0, 70.0), []);
});

test('delivery polygons are suggested before big store-area clusters; inactive zones are ignored', () => {
  const cluster = square('CLUSTER', 'Cluster', 73.0, 31.4, 73.2, 31.5, { isStoreAreaPolygon: true });
  const delivery = square('DELIVERY', 'Delivery', 73.0, 31.4, 73.2, 31.5);
  const off = square('OFF', 'Off', 73.0, 31.4, 73.2, 31.5, { isActive: false, status: 'inactive' });
  assert.deepEqual(suggestZonesForPoint([cluster, delivery, off], 31.45, 73.1).map((z) => z.zoneId), ['DELIVERY', 'CLUSTER']);
});

test('every screen gets the same store count: registry stores + only genuinely new stores', () => {
  assert.equal(getAllUnifiedStores([], []).length, STORE_REGISTRY.length);
  // legacy duplicate ids and unrelated branch lists do not inflate the count
  const withLegacy = getAllUnifiedStores(
    [{ storeId: 'STR-AF-001', tenantId: 'tenant-alfatah', name: 'old copy' }, { storeId: 'STR-CHA-3330', tenantId: 'tenant-chasevalue' }],
    [{ _id: 'branch_x', name: 'ignored legacy branch', city: 'Faisalabad' }]
  );
  assert.equal(withLegacy.length, 10);
  // a really new store adds exactly one
  const plusOne = getAllUnifiedStores([{ storeId: 'STR-NEW-1', tenantId: 'tenant-chaseup', name: 'New', city: 'Faisalabad' }]);
  assert.equal(plusOne.length, 11);
});
