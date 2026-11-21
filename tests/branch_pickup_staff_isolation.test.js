import test from 'node:test';
import assert from 'node:assert/strict';
import { STORE_REGISTRY } from '../src/data/storeRegistry.js';
import {
  INITIAL_PICKUP_STAFF,
  ensureAllBranchesHavePickupStaff,
  generateBranchPickupStaff
} from '../src/data/tenantData.js';
import { canAssignStaffToOrder, getStrictEligibleStaff } from '../src/utils/orderScope.js';
import { pickLeastBusyPickupStaff } from '../src/utils/pickupStaffAssignment.js';
import { SEED_PICKUP_STAFF } from '../server/config/seedCoreEntities.js';
import fs from 'node:fs';
import path from 'node:path';

test('1. Every store branch in STORE_REGISTRY has dedicated pickup staff', () => {
  const branches = STORE_REGISTRY.map((s) => s.branchId);
  assert.equal(branches.length, 10, 'Must have 10 registered physical branches');

  for (const branchId of branches) {
    const staffForBranch = INITIAL_PICKUP_STAFF.filter((s) => s.branchId === branchId);
    assert.ok(
      staffForBranch.length >= 1,
      `Branch ${branchId} must have at least 1 dedicated pickup staff member (found ${staffForBranch.length})`
    );
  }
});

test('2. No store branch shares pickup staff with another store branch', () => {
  const staffByBranch = new Map();

  for (const staff of INITIAL_PICKUP_STAFF) {
    assert.ok(staff.branchId, `Staff ${staff.username} must have a branchId`);
    assert.ok(staff.name, `Staff ${staff.username} must have a name`);
    assert.ok(staff.username, `Staff ${staff.id} must have a username`);

    // Check that this staff member is not claimed by another branch
    if (staffByBranch.has(staff.id)) {
      assert.equal(
        staffByBranch.get(staff.id),
        staff.branchId,
        `Staff ID ${staff.id} is shared across branches!`
      );
    }
    staffByBranch.set(staff.id, staff.branchId);
  }

  // Verify that all 10 branches have different, distinct pickup staff accounts
  for (const storeA of STORE_REGISTRY) {
    const staffA = INITIAL_PICKUP_STAFF.filter((s) => s.branchId === storeA.branchId);
    for (const storeB of STORE_REGISTRY) {
      if (storeA.branchId === storeB.branchId) continue;
      const staffB = INITIAL_PICKUP_STAFF.filter((s) => s.branchId === storeB.branchId);

      const staffAUsernames = new Set(staffA.map((s) => s.username.toLowerCase()));
      const staffBUsernames = new Set(staffB.map((s) => s.username.toLowerCase()));

      for (const u of staffAUsernames) {
        assert.ok(
          !staffBUsernames.has(u),
          `Branches ${storeA.branchId} and ${storeB.branchId} share pickup staff username: ${u}`
        );
      }
    }
  }
});

test('3. canAssignStaffToOrder strictly rejects cross-branch staff assignment', () => {
  // Al-Fatah D-Ground order
  const dGroundOrder = {
    id: '#AF-101',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub'
  };

  const dGroundStaff = INITIAL_PICKUP_STAFF.find((s) => s.branchId === 'branch_af_fsd');
  const canalStaff = INITIAL_PICKUP_STAFF.find((s) => s.branchId === 'branch_af_canal');
  const kohinoorStaff = INITIAL_PICKUP_STAFF.find((s) => s.branchId === 'branch_af_kohinoor');
  const chaseUpStaff = INITIAL_PICKUP_STAFF.find((s) => s.branchId === 'branch_006');

  // Same branch allowed
  const checkSame = canAssignStaffToOrder(dGroundOrder, dGroundStaff);
  assert.equal(checkSame.allowed, true, 'Same branch staff must be allowed');

  // Different branch of same retailer rejected
  const checkCanal = canAssignStaffToOrder(dGroundOrder, canalStaff);
  assert.equal(checkCanal.allowed, false, 'Canal Road staff must be rejected for D-Ground order');
  assert.match(checkCanal.reason, /assigned to/i);

  const checkKohinoor = canAssignStaffToOrder(dGroundOrder, kohinoorStaff);
  assert.equal(checkKohinoor.allowed, false, 'Kohinoor staff must be rejected for D-Ground order');

  // Cross retailer rejected
  const checkChaseUp = canAssignStaffToOrder(dGroundOrder, chaseUpStaff);
  assert.equal(checkChaseUp.allowed, false, 'Chase Up staff must be rejected for Al-Fatah order');
});

test('4. getStrictEligibleStaff only returns staff assigned to the order branch', () => {
  const canalOrder = {
    id: '#AF-202',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_af_canal',
    branchName: 'Canal Road Hub'
  };

  const eligible = getStrictEligibleStaff(canalOrder, INITIAL_PICKUP_STAFF);
  assert.ok(eligible.length >= 1, 'Should find eligible staff for Canal Road');

  for (const st of eligible) {
    assert.equal(st.branchId, 'branch_af_canal', `Eligible staff ${st.name} must belong to branch_af_canal`);
    assert.equal(st.tenantId, 'tenant-alfatah');
  }
});

test('5. Dynamic custom store auto-provisions dedicated distinct pickup staff', () => {
  const customStore = {
    storeId: 'branch_custom_satiana_express',
    branchId: 'branch_custom_satiana_express',
    branchName: 'Satiana Express Mart',
    tenantId: 'tenant-freshmart',
    tenantName: 'FreshMart Custom Mart'
  };

  const autoStaff1 = generateBranchPickupStaff(customStore, 1);
  const autoStaff2 = generateBranchPickupStaff(customStore, 2);

  assert.equal(autoStaff1.branchId, 'branch_custom_satiana_express');
  assert.equal(autoStaff2.branchId, 'branch_custom_satiana_express');
  assert.notEqual(autoStaff1.username, autoStaff2.username);

  const allStaff = ensureAllBranchesHavePickupStaff(
    [...STORE_REGISTRY, customStore],
    INITIAL_PICKUP_STAFF
  );

  const customBranchStaff = allStaff.filter((s) => s.branchId === 'branch_custom_satiana_express');
  assert.equal(customBranchStaff.length, 2, 'Custom branch must have 2 dedicated staff members');

  // Verify none of the custom branch staff overlap with existing branches
  const existingUsernames = new Set(INITIAL_PICKUP_STAFF.map((s) => s.username.toLowerCase()));
  for (const cs of customBranchStaff) {
    assert.ok(!existingUsernames.has(cs.username.toLowerCase()), 'Custom staff must have unique username');
  }
});

test('6. Backend disk database and seed entities cover all 10 branches', () => {
  const diskData = JSON.parse(
    fs.readFileSync(path.resolve('server/data/pickup_staff_db.json'), 'utf-8')
  );

  for (const store of STORE_REGISTRY) {
    const diskStaff = diskData.filter((s) => s.branchId === store.branchId);
    assert.ok(
      diskStaff.length >= 1,
      `Disk database must have pickup staff for branch ${store.branchId} (found ${diskStaff.length})`
    );

    const seedStaff = SEED_PICKUP_STAFF.filter((s) => s.branchId === store.branchId);
    assert.ok(
      seedStaff.length >= 1,
      `Seed entities must have pickup staff for branch ${store.branchId} (found ${seedStaff.length})`
    );
  }
});
