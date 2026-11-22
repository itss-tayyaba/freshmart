import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deletePickupStaff,
  getPickupStaff,
  loadDiskPickupStaff,
  loadDiskDeletedPickupStaff,
  saveAllDiskPickupStaff
} from '../server/controllers/authController.js';
import {
  deleteRider,
  getRiders,
  loadDiskRiders,
  loadDiskDeletedRiders,
  saveAllDiskRiders
} from '../server/controllers/extraControllers.js';
import { ensureAllBranchesHavePickupStaff } from '../src/data/tenantData.js';
import router from '../server/routes/apiRoutes.js';

const createMockRes = () => {
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    }
  };
  return res;
};

test('Pickup Staff and Rider Permanent Deletion Suite', async (t) => {
  await t.test('1. Deleting pickup staff permanently purges them and records tombstones', async () => {
    const testStaffId = 'PCK-TEST-DEL-001';
    const testUsername = 'teststaffdel001';

    // Seed disk with test staff
    const initialStaff = loadDiskPickupStaff();
    const testStaffDoc = {
      id: testStaffId,
      staffId: testStaffId,
      name: 'Test Deletion Staff',
      username: testUsername,
      email: `${testUsername}@pickup.freshmart.pk`,
      phone: '+92 300 9998877',
      tenantId: 'tenant-alfatah',
      branchId: 'branch_af_fsd',
      role: 'pickup_staff'
    };
    saveAllDiskPickupStaff([testStaffDoc, ...initialStaff]);

    // Perform deletion
    const req = { params: { id: testStaffId }, user: { role: 'admin', branchId: 'all' } };
    const res = createMockRes();
    await deletePickupStaff(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonData.success, true);

    // Verify tombstones
    const deletedStaff = loadDiskDeletedPickupStaff();
    assert.ok(
      deletedStaff.includes(testStaffId.toLowerCase()),
      'Staff ID must be recorded in deleted tombstones'
    );
    assert.ok(
      deletedStaff.includes(testUsername.toLowerCase()),
      'Staff username must be recorded in deleted tombstones'
    );

    // Verify disk storage does not contain test staff
    const diskStaff = loadDiskPickupStaff();
    const foundOnDisk = diskStaff.some(
      (s) => s.id === testStaffId || s.username === testUsername
    );
    assert.equal(foundOnDisk, false, 'Staff must not be present in loadDiskPickupStaff');

    // Verify getPickupStaff does not return deleted staff
    const getReq = { query: {}, user: { role: 'superadmin' } };
    const getRes = createMockRes();
    await getPickupStaff(getReq, getRes);
    assert.equal(getRes.statusCode, 200);
    const returnedStaff = getRes.jsonData.staff || [];
    const foundInApi = returnedStaff.some(
      (s) => s.id === testStaffId || s.username === testUsername
    );
    assert.equal(foundInApi, false, 'Deleted pickup staff must not be returned by getPickupStaff API');
  });

  await t.test('2. Deleting rider permanently purges them and records tombstones', async () => {
    const testRiderId = 'RDR-TEST-DEL-001';
    const testRiderUser = 'testriderdel001';

    // Seed disk with test rider
    const initialRiders = loadDiskRiders();
    const testRiderDoc = {
      id: testRiderId,
      riderId: testRiderId,
      name: 'Test Deletion Rider',
      username: testRiderUser,
      phone: '+92 300 7776655',
      tenantId: 'tenant-alfatah',
      branchId: 'branch_af_fsd',
      status: 'Active'
    };
    saveAllDiskRiders([testRiderDoc, ...initialRiders]);

    // Perform deletion
    const req = { params: { id: testRiderId }, user: { role: 'admin', branchId: 'all' } };
    const res = createMockRes();
    await deleteRider(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonData.success, true);

    // Verify tombstones
    const deletedRiders = loadDiskDeletedRiders();
    assert.ok(
      deletedRiders.includes(testRiderId.toLowerCase()),
      'Rider ID must be in deleted tombstones'
    );
    assert.ok(
      deletedRiders.includes(testRiderUser.toLowerCase()),
      'Rider username must be in deleted tombstones'
    );

    // Verify disk storage does not contain test rider
    const diskRiders = loadDiskRiders();
    const foundOnDisk = diskRiders.some(
      (r) => r.id === testRiderId || r.username === testRiderUser
    );
    assert.equal(foundOnDisk, false, 'Rider must not be present in loadDiskRiders');

    // Verify getRiders does not return deleted rider
    const getReq = { query: {}, user: { role: 'superadmin' }, headers: {} };
    const getRes = createMockRes();
    await getRiders(getReq, getRes);
    assert.equal(getRes.statusCode, 200);
    const returnedRiders = getRes.jsonData.riders || [];
    const foundInApi = returnedRiders.some(
      (r) => r.id === testRiderId || r.username === testRiderUser
    );
    assert.equal(foundInApi, false, 'Deleted rider must not be returned by getRiders API');
  });

  await t.test('3. ensureAllBranchesHavePickupStaff never resurrects deleted staff', async () => {
    const deletedStaffSet = new Set(['pck-deleted-user', 'pck-test-del-001']);
    const stores = [{ id: 'branch_af_fsd', branchId: 'branch_af_fsd', name: 'Al-Fatah' }];
    const existing = [
      { id: 'pck-deleted-user', username: 'pck-deleted-user', branchId: 'branch_af_fsd' },
      { id: 'pck-valid-user', username: 'pck-valid-user', branchId: 'branch_af_fsd' }
    ];

    const result = ensureAllBranchesHavePickupStaff(stores, existing, deletedStaffSet);
    const hasDeleted = result.some((s) => s.id === 'pck-deleted-user');
    assert.equal(hasDeleted, false, 'Deleted staff must be filtered out');
    const hasValid = result.some((s) => s.id === 'pck-valid-user');
    assert.equal(hasValid, true, 'Valid staff must remain');
  });

  await t.test('4. apiRoutes has DELETE endpoints for both /pickup-staff and /riders', async () => {
    const routes = router.stack
      .filter((r) => r.route)
      .map((r) => ({
        path: r.route.path,
        methods: Object.keys(r.route.methods)
      }));

    const hasDeletePickupStaff = routes.some(
      (r) => (r.path === '/pickup-staff/:id' || r.path === '/auth/pickup-staff/:id') && r.methods.includes('delete')
    );
    assert.ok(hasDeletePickupStaff, 'router must register DELETE for pickup staff');

    const hasDeleteRider = routes.some(
      (r) => (r.path === '/riders/:id' || r.path === '/auth/riders/:id') && r.methods.includes('delete')
    );
    assert.ok(hasDeleteRider, 'router must register DELETE for riders');
  });
});
