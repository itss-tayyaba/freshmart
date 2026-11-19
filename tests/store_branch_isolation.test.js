import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORE_REGISTRY,
  getRetailerStoreCounts,
  findNearestStoreForTenant,
  toStoreRecord
} from '../src/data/storeRegistry.js';
import { STORE_LOCATIONS } from '../src/data/freshMartData.js';
import { buildBranchScope, canAccessOrder, filterOrdersForUser } from '../server/utils/branchScope.js';

test('registry has 10 unique stores: Al-Fatah 3, Chase Up 3, Chase Value 2, Unimart 2', () => {
  assert.equal(STORE_REGISTRY.length, 10);
  assert.equal(new Set(STORE_REGISTRY.map((s) => s.storeId)).size, 10);
  assert.deepEqual(getRetailerStoreCounts(), {
    'tenant-alfatah': 3,
    'tenant-chaseup': 3,
    'tenant-chasevalue': 2,
    'tenant-unimart': 2
  });
  assert.equal(STORE_REGISTRY.filter((s) => s.isNew).length, 6);
});

test('checkout/admin-login store list is the same list as the registry', () => {
  assert.equal(STORE_LOCATIONS.length, STORE_REGISTRY.length);
  assert.deepEqual(STORE_LOCATIONS.map((s) => s.id).sort(), STORE_REGISTRY.map((s) => s.storeId).sort());
});

test('every store has coordinates in the Faisalabad area and storeId equals branchId', () => {
  for (const s of STORE_REGISTRY) {
    assert.equal(s.storeId, s.branchId);
    assert.ok(s.coords.lat > 31.3 && s.coords.lat < 31.6, `${s.storeId} lat`);
    assert.ok(s.coords.lng > 72.9 && s.coords.lng < 73.3, `${s.storeId} lng`);
    assert.ok(toStoreRecord(s).deliveryPolygon.length === 5);
  }
});

test('nearest store is always chosen from the SAME retailer', () => {
  const nearAlFatahOnly = { lat: 31.4125, lng: 73.0995 }; // right next to Al-Fatah D-Ground
  for (const tenantId of Object.keys(getRetailerStoreCounts())) {
    const st = findNearestStoreForTenant(nearAlFatahOnly, tenantId);
    assert.equal(st.tenantId, tenantId);
  }
  assert.equal(findNearestStoreForTenant(nearAlFatahOnly, 'tenant-alfatah').storeId, 'branch_af_fsd');
});

test('admin sees only own branch; admin without branch is refused; superadmin sees all', () => {
  assert.deepEqual(buildBranchScope({ role: 'admin', branchId: 'branch_af_canal' }), {
    ok: true,
    filter: { branchId: 'branch_af_canal' }
  });
  assert.equal(buildBranchScope({ role: 'admin', branchId: '' }).ok, false);
  assert.equal(buildBranchScope({ role: 'admin', branchId: 'all' }).ok, false);
  assert.deepEqual(buildBranchScope({ role: 'superadmin' }), { ok: true, filter: {} });
  assert.equal(buildBranchScope({ role: 'customer' }).ok, false);
});

test('pickup staff and riders are locked to their own branch', () => {
  assert.equal(buildBranchScope({ role: 'pickupstaff', branchId: 'branch_cu_satiana' }).filter.branchId, 'branch_cu_satiana');
  assert.equal(buildBranchScope({ role: 'rider', branchId: 'branch_um_madina' }).filter.branchId, 'branch_um_madina');
  assert.equal(buildBranchScope({ role: 'rider', branchId: '' }).ok, false);
});

test('other branches\u2019 orders are never visible', () => {
  const orders = STORE_REGISTRY.map((s, i) => ({ orderId: `#T${i}`, branchId: s.storeId }));
  for (const s of STORE_REGISTRY) {
    for (const role of ['admin', 'pickupstaff', 'rider']) {
      const user = { role, branchId: s.storeId };
      const visible = filterOrdersForUser(user, orders);
      assert.equal(visible.length, 1);
      assert.equal(visible[0].branchId, s.storeId);
      assert.equal(canAccessOrder(user, { branchId: 'some_other_branch' }), false);
    }
  }
  assert.equal(filterOrdersForUser({ role: 'superadmin' }, orders).length, 10);
  assert.equal(filterOrdersForUser({ role: 'admin', branchId: '' }, orders).length, 0);
});
