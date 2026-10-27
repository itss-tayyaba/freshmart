import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceKm,
  calculateEtaMinutes,
  normalizeOrderTenantId,
  resolveOrderRouting,
  isOrderVisibleToUser,
  canAssignRiderToOrder,
  canAssignStaffToOrder,
  getStrictEligibleRiders,
  getStrictEligibleStaff
} from '../src/utils/orderScope.js';
import { isSameTenant } from '../src/data/companyHierarchyData.js';
import {
  superAdminOnly,
  staffOrAdmin,
  requireRoles,
  requireTenantAccess
} from '../server/middleware/authMiddleware.js';

test('1. calculateDistanceKm and calculateEtaMinutes calculate accurately', () => {
  // Faisalabad hub to D-Ground (~1.2km)
  const dist = calculateDistanceKm(31.4125, 73.0995, 31.4147, 73.0872);
  assert.ok(dist > 1.0 && dist < 2.0, `Expected distance ~1.2km, got ${dist}`);

  const eta = calculateEtaMinutes(dist);
  assert.ok(eta >= 4 && eta <= 10, `Expected eta 4-10 mins, got ${eta}`);
});

test('2. resolveOrderRouting reroutes cross-store branch to store nearest branch', () => {
  // Customer ordering from Al-Fatah, but accidentally receives/specifies a FreshMart branch
  const routing = resolveOrderRouting({
    tenantId: 'tenant-alfatah',
    branchId: 'branch_um_fsd', // FreshMart Peoples Colony branch
    shippingAddress: {
      address: 'Main D-Ground, Faisalabad',
      city: 'Faisalabad'
    }
  });

  assert.ok(isSameTenant(routing.tenantId, 'tenant-alfatah'));
  assert.equal(routing.tenantId, 'company_001');
  // Must be rerouted to Al-Fatah's Faisalabad branch, not FreshMart's
  assert.equal(routing.branchId, 'branch_af_fsd');
  assert.equal(routing.rerouted, true);
  assert.ok(routing.branchName.includes('Al-Fatah') || routing.branchName.includes('D-Ground'));
});

test('3. isOrderVisibleToUser enforces strict tenant and branch isolation', () => {
  const alFatahOrder = {
    id: 'ORD-AF-001',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_af_fsd',
    customerName: 'Hamza Tariq', // Real customer name that used to be filtered out!
    items: [{ name: 'Sunridge Whole Wheat Atta', tenantId: 'tenant-alfatah' }]
  };

  const chaseUpOrder = {
    id: 'ORD-CU-001',
    tenantId: 'tenant-chaseup',
    branchId: 'branch_006',
    customerName: 'Zainab Merchant',
    items: [{ name: 'Olpers Milk', tenantId: 'tenant-chaseup' }]
  };

  const alFatahStoreAdmin = {
    role: 'admin',
    tenantId: 'tenant-alfatah'
  };

  const alFatahBranchAdmin = {
    role: 'admin',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_af_fsd'
  };

  const alFatahOtherBranchAdmin = {
    role: 'admin',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_002'
  };

  const chaseUpAdmin = {
    role: 'admin',
    tenantId: 'tenant-chaseup'
  };

  const superAdmin = {
    role: 'superadmin',
    isSuperAdmin: true
  };

  // Al-Fatah Store Admin can see Al-Fatah order, but NOT Chase Up order
  assert.equal(isOrderVisibleToUser(alFatahOrder, alFatahStoreAdmin), true);
  assert.equal(isOrderVisibleToUser(chaseUpOrder, alFatahStoreAdmin), false);

  // Chase Up Admin cannot see Al-Fatah order
  assert.equal(isOrderVisibleToUser(alFatahOrder, chaseUpAdmin), false);
  assert.equal(isOrderVisibleToUser(chaseUpOrder, chaseUpAdmin), true);

  // Super Admin can see both
  assert.equal(isOrderVisibleToUser(alFatahOrder, superAdmin), true);
  assert.equal(isOrderVisibleToUser(chaseUpOrder, superAdmin), true);

  // Branch Admin scoping: only sees orders for their branch
  assert.equal(isOrderVisibleToUser(alFatahOrder, alFatahBranchAdmin), true);
  assert.equal(isOrderVisibleToUser(alFatahOrder, alFatahOtherBranchAdmin), false);

  // Real customer names like Hamza Tariq are NOT filtered out
  assert.equal(isOrderVisibleToUser(alFatahOrder, alFatahStoreAdmin), true);
});

test('4. canAssignRiderToOrder and getStrictEligibleRiders reject cross-store and cross-branch', () => {
  const alFatahOrder = {
    id: 'ORD-AF-001',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub'
  };

  const sameBranchRider = {
    id: 'RDR-ALI',
    name: 'Ali Khan',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_af_fsd'
  };

  const differentBranchRider = {
    id: 'RDR-AF-OTHER',
    name: 'Tariq Al-Fatah',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_002'
  };

  const chaseUpRider = {
    id: 'RDR-CU',
    name: 'Kamran CU',
    tenantId: 'tenant-chaseup',
    branchId: 'branch_006'
  };

  // Same store & branch: ALLOWED
  const check1 = canAssignRiderToOrder(alFatahOrder, sameBranchRider);
  assert.equal(check1.allowed, true);

  // Cross-branch: REJECTED
  const check2 = canAssignRiderToOrder(alFatahOrder, differentBranchRider);
  assert.equal(check2.allowed, false);

  // Cross-store: REJECTED
  const check3 = canAssignRiderToOrder(alFatahOrder, chaseUpRider);
  assert.equal(check3.allowed, false);

  // getStrictEligibleRiders returns only eligible rider
  const eligible = getStrictEligibleRiders(alFatahOrder, [sameBranchRider, differentBranchRider, chaseUpRider]);
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].id, 'RDR-ALI');
});

test('5. canAssignStaffToOrder rejects cross-store and cross-branch staff', () => {
  const alFatahOrder = {
    id: 'ORD-AF-001',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_af_fsd'
  };

  const validStaff = {
    id: 'PCK-HAFSA',
    name: 'Hafsa',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_af_fsd'
  };

  const crossBranchStaff = {
    id: 'PCK-LAHORE',
    name: 'Lahore Staff',
    tenantId: 'tenant-alfatah',
    branchId: 'branch_002'
  };

  const crossStoreStaff = {
    id: 'PCK-CHASE',
    name: 'Chase Staff',
    tenantId: 'tenant-chaseup',
    branchId: 'branch_006'
  };

  assert.equal(canAssignStaffToOrder(alFatahOrder, validStaff).allowed, true);
  assert.equal(canAssignStaffToOrder(alFatahOrder, crossBranchStaff).allowed, false);
  assert.equal(canAssignStaffToOrder(alFatahOrder, crossStoreStaff).allowed, false);
});

test('6. Security Guards: superAdminOnly and staffOrAdmin enforce role boundaries', () => {
  const mockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.body = data;
      return res;
    };
    return res;
  };

  // superAdminOnly blocks store admin
  let calledNext = false;
  const reqAdmin = { user: { role: 'admin', tenantId: 'tenant-alfatah' } };
  const resAdmin = mockRes();
  superAdminOnly(reqAdmin, resAdmin, () => { calledNext = true; });
  assert.equal(calledNext, false);
  assert.equal(resAdmin.statusCode, 403);

  // superAdminOnly allows superadmin
  calledNext = false;
  const reqSuper = { user: { role: 'superadmin' } };
  const resSuper = mockRes();
  superAdminOnly(reqSuper, resSuper, () => { calledNext = true; });
  assert.equal(calledNext, true);

  // staffOrAdmin allows pickup_staff
  calledNext = false;
  const reqStaff = { user: { role: 'pickup_staff', tenantId: 'tenant-alfatah' } };
  const resStaff = mockRes();
  staffOrAdmin(reqStaff, resStaff, () => { calledNext = true; });
  assert.equal(calledNext, true);

  // staffOrAdmin blocks rider
  calledNext = false;
  const reqRider = { user: { role: 'rider', tenantId: 'tenant-alfatah' } };
  const resRider = mockRes();
  staffOrAdmin(reqRider, resRider, () => { calledNext = true; });
  assert.equal(calledNext, false);
  assert.equal(resRider.statusCode, 403);
});
