import test from 'node:test';
import assert from 'node:assert/strict';
import { cityKey, routeOrderToCity, adminCanAccessRecord } from '../server/utils/regionRouting.js';

const af = [
  { id: 'af_fsd', name: 'AF Faisalabad', city: 'Faisalabad', latitude: 31.41, longitude: 73.08 },
  { id: 'af_isb', name: 'AF Islamabad', city: 'Islamabad', latitude: 33.68, longitude: 73.04 }
];
const cv = [{ id: 'cv_fsd', name: 'CV Faisalabad', city: 'Faisalabad', latitude: 31.42, longitude: 73.09 }];
const all = [...af, ...cv];

test('city detection', () => {
  assert.equal(cityKey('Faisalabad, Punjab'), 'faisalabad');
  assert.equal(cityKey('ISB'), 'islamabad');
  assert.equal(cityKey('House 5 D-Ground FSD'), 'faisalabad');
  assert.equal(cityKey('Nowhereville'), null);
});
test('Islamabad customer is never given the Faisalabad store, even if the app asked for it', () => {
  const r = routeOrderToCity({ tenantBranches: af, allBranches: all, requestedBranchId: 'af_fsd',
    shippingAddress: { city: 'Islamabad' }, destinationCoords: { lat: 33.7, lng: 73.05 } });
  assert.equal(r.ok, true);
  assert.equal(r.branch.id, 'af_isb');
  assert.equal(r.rerouted, true);
});
test('Faisalabad customer keeps the Faisalabad store', () => {
  const r = routeOrderToCity({ tenantBranches: af, allBranches: all, requestedBranchId: 'af_fsd', shippingAddress: { city: 'Faisalabad' } });
  assert.equal(r.branch.id, 'af_fsd');
  assert.equal(r.rerouted, false);
});
test('retailer without a store in the customer city is rejected (no nearest-store fallback)', () => {
  const r = routeOrderToCity({ tenantBranches: cv, allBranches: all, requestedBranchId: 'cv_fsd',
    shippingAddress: { city: 'Islamabad' }, destinationCoords: { lat: 33.7, lng: 73.05 }, tenantName: 'Chase Value' });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'NO_STORE_IN_CITY');
});
test('city is taken from GPS when the address has none; unknown location is rejected', () => {
  const ok = routeOrderToCity({ tenantBranches: af, allBranches: all, shippingAddress: {}, destinationCoords: { lat: 33.69, lng: 73.05 } });
  assert.equal(ok.branch.id, 'af_isb');
  const bad = routeOrderToCity({ tenantBranches: af, allBranches: all, shippingAddress: {}, destinationCoords: { lat: 10, lng: 10 } });
  assert.equal(bad.code, 'CITY_UNKNOWN');
});
test('admins only touch their own retailer and branch', () => {
  const order = { tenantId: 'tenant-alfatah', branchId: 'af_fsd' };
  assert.equal(adminCanAccessRecord(order, { role: 'admin', tenantId: 'tenant-alfatah', branchId: 'all' }), true);
  assert.equal(adminCanAccessRecord(order, { role: 'admin', tenantId: 'tenant-unimart', branchId: 'all' }), false);
  assert.equal(adminCanAccessRecord(order, { role: 'admin', tenantId: 'tenant-alfatah', branchId: 'af_isb' }), false);
  assert.equal(adminCanAccessRecord(order, { role: 'superadmin' }), true);
  assert.equal(adminCanAccessRecord(order, { role: 'admin' }), false);
});
