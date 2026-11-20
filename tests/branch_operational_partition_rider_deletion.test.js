import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAssignRiderToOrder,
  canAssignStaffToOrder,
  getStrictEligibleRiders
} from '../src/utils/orderScope.js';
import {
  addRider,
  deleteRider,
  loadDiskRiders,
  loadDiskDeletedRiders
} from '../server/controllers/extraControllers.js';

test('FreshMart Branch Operational Hierarchy & Rider Deletion Suite', async (t) => {
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

  // 1. Two-level FreshMart hierarchy validation:
  // Parent Retailer: Al-Fatah
  // Branch A: People's Colony (branch_af_fsd)
  // Branch B: Canal Road Hub (branch_af_canal)
  const branchA_Order = {
    id: 'ORD-AF-BRANCH-A',
    orderId: 'ORD-AF-BRANCH-A',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_fsd',
    storeId: 'branch_af_fsd',
    branchName: "Al-Fatah — People's Colony Hub"
  };

  const branchB_Order = {
    id: 'ORD-AF-BRANCH-B',
    orderId: 'ORD-AF-BRANCH-B',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_canal',
    storeId: 'branch_af_canal',
    branchName: 'Al-Fatah — Canal Road Hub'
  };

  const branchA_Rider = {
    id: 'RDR-BRANCH-A',
    name: 'Aslam Rider A',
    username: 'aslam_a',
    phone: '03001112233',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_af_fsd',
    storeId: 'branch_af_fsd',
    branchName: "Al-Fatah — People's Colony Hub",
    status: 'Active',
    isOnline: true
  };

  const branchB_Rider = {
    id: 'RDR-BRANCH-B',
    name: 'Babar Rider B',
    username: 'babar_b',
    phone: '03004445566',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_af_canal',
    storeId: 'branch_af_canal',
    branchName: 'Al-Fatah — Canal Road Hub',
    status: 'Active',
    isOnline: true
  };

  const branchA_Staff = {
    id: 'PCK-BRANCH-A',
    name: 'Staff A',
    username: 'staff_a',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_af_fsd',
    storeId: 'branch_af_fsd',
    branchName: "Al-Fatah — People's Colony Hub"
  };

  const branchB_Staff = {
    id: 'PCK-BRANCH-B',
    name: 'Staff B',
    username: 'staff_b',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_af_canal',
    storeId: 'branch_af_canal',
    branchName: 'Al-Fatah — Canal Road Hub'
  };

  await t.test('1. Branch A rider can deliver Branch A order, but is REJECTED for Branch B order', () => {
    const resA = canAssignRiderToOrder(branchA_Order, branchA_Rider);
    assert.equal(resA.allowed, true, 'Branch A rider should be allowed for Branch A order');

    const resCross = canAssignRiderToOrder(branchB_Order, branchA_Rider);
    assert.equal(resCross.allowed, false, 'Branch A rider MUST NOT deliver Branch B order');
    assert.match(resCross.reason, /independent riders fleet/i);
  });

  await t.test('2. Branch B rider can deliver Branch B order, but is REJECTED for Branch A order', () => {
    const resB = canAssignRiderToOrder(branchB_Order, branchB_Rider);
    assert.equal(resB.allowed, true, 'Branch B rider should be allowed for Branch B order');

    const resCross = canAssignRiderToOrder(branchA_Order, branchB_Rider);
    assert.equal(resCross.allowed, false, 'Branch B rider MUST NOT deliver Branch A order');
  });

  await t.test('3. getStrictEligibleRiders only returns riders of the order’s exact physical branch', () => {
    const eligibleForA = getStrictEligibleRiders(branchA_Order, [branchA_Rider, branchB_Rider]);
    assert.equal(eligibleForA.length, 1);
    assert.equal(eligibleForA[0].id, 'RDR-BRANCH-A');

    const eligibleForB = getStrictEligibleRiders(branchB_Order, [branchA_Rider, branchB_Rider]);
    assert.equal(eligibleForB.length, 1);
    assert.equal(eligibleForB[0].id, 'RDR-BRANCH-B');
  });

  await t.test('4. Branch A pickup staff can pack Branch A order, but is REJECTED for Branch B order', () => {
    const resStaffA = canAssignStaffToOrder(branchA_Order, branchA_Staff);
    assert.equal(resStaffA.allowed, true);

    const resCrossStaff = canAssignStaffToOrder(branchB_Order, branchA_Staff);
    assert.equal(resCrossStaff.allowed, false, 'Branch A staff cannot pack Branch B orders');
    assert.match(resCrossStaff.reason, /dedicated pickup staff/i);

    const resStaffB = canAssignStaffToOrder(branchB_Order, branchB_Staff);
    assert.equal(resStaffB.allowed, true);
  });

  await t.test('5. Permanent Rider Deletion: deleted rider is permanently removed from DB & disk, cannot be resurrected', async () => {
    // 1. Add a test rider to Branch A
    const testRiderId = 'RDR-PERM-TEST';
    const addReq = {
      body: {
        id: testRiderId,
        name: 'Perm Test Courier',
        username: 'perm_courier_test',
        phone: '03110009988',
        password: 'perm_test_password',
        city: 'Faisalabad',
        latitude: 31.4125,
        longitude: 73.0995,
        serviceArea: 'Peoples Colony No. 1',
        region: 'Peoples Colony No. 1 (Faisalabad)',
        vehicleType: '🏍️ Honda 125',
        vehicleNumber: 'FSD-7711',
        tenantId: 'tenant-alfatah',
        branchId: 'branch_af_fsd',
        branchName: "Al-Fatah — People's Colony Hub",
        isGlobal: true
      }
    };
    const addRes = createMockRes();
    await addRider(addReq, addRes);
    assert.equal(addRes.statusCode, 201);

    // Verify present on disk
    let diskRiders = loadDiskRiders();
    assert.ok(diskRiders.some((r) => r.id === testRiderId), 'Rider must exist after add');

    // 2. Delete the rider permanently
    const delReq = { params: { id: testRiderId } };
    const delRes = createMockRes();
    await deleteRider(delReq, delRes);
    assert.equal(delRes.statusCode, 200);
    assert.equal(delRes.jsonData.success, true);

    // 3. Verify rider is permanently gone from disk database
    diskRiders = loadDiskRiders();
    assert.equal(diskRiders.some((r) => r.id === testRiderId), false, 'Deleted rider must NOT exist in loadDiskRiders()');

    // 4. Verify recorded in tombstone file
    const tombstones = loadDiskDeletedRiders();
    assert.ok(tombstones.includes(testRiderId.toLowerCase()), 'Tombstone must contain deleted rider ID');
  });
});
