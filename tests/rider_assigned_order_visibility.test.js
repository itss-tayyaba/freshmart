import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isOrderVisibleToUser,
  isOrderAssignedToRider,
  canAssignRiderToOrder
} from '../src/utils/orderScope.js';

test('Rider Dashboard Assignment Visibility - Exact User Bug Reproduction & Fix', async (t) => {
  // 1. Order created in Unimaart (Market Store), Peoples Colony Dark Store, Faisalabad
  const unimaartOrder = {
    id: '#83459',
    orderId: '#83459',
    tenantId: 'tenant-freshmart',
    companyId: 'company_004',
    branchId: 'branch_um_fsd',
    branchName: 'Peoples Colony Dark Store',
    city: 'Faisalabad',
    customerName: 'Ahmad User',
    customerPhone: '+92 320 6551696',
    address: 'Peoples Colony No. 1, Faisalabad',
    items: [{ name: 'Farm-To-Table Vine-Ripened Tomatoes 1kg', price: 180, quantity: 1 }],
    totalAmount: 180,
    status: 'Out for Delivery',
    deliveryOtp: '6179',
    assignedRider: {
      id: 'RDR-AHMAD-01',
      name: 'ahmad',
      phone: '+92 300 1234567',
      vehicle: 'Honda 125 (FSD-5973)',
      zone: 'Peoples Colony (Faisalabad)'
    }
  };

  // 2. Rider logged in as Ahmad (registered under Al-Fatah or default tenant-alfatah)
  const ahmadRiderUser = {
    id: 'usr-ahmad-99',
    riderId: 'RDR-AHMAD-01',
    name: 'ahmad',
    username: 'ahmad',
    phone: '+92 300 1234567',
    role: 'rider',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_fsd',
    branchName: 'Al-Fatah D-Ground SuperHub'
  };

  await t.test('isOrderAssignedToRider correctly identifies Ahmad as assigned courier', () => {
    assert.equal(isOrderAssignedToRider(unimaartOrder, ahmadRiderUser), true);
  });

  await t.test('isOrderVisibleToUser returns true for assigned courier even with differing store/tenant', () => {
    // Note: Active tenant in rider portal might be tenant-alfatah, but order is tenant-freshmart
    const visible = isOrderVisibleToUser(unimaartOrder, ahmadRiderUser, 'tenant-alfatah');
    assert.equal(visible, true, 'Assigned order must be visible to the courier regardless of tenant mismatch');
  });

  await t.test('isOrderVisibleToUser matches by name even if ID format differs', () => {
    const orderWithPartialRider = {
      ...unimaartOrder,
      assignedRider: {
        name: 'Ahmad',
        phone: '03001234567'
      }
    };
    const riderWithDifferentId = {
      ...ahmadRiderUser,
      id: 'usr-different',
      riderId: 'RDR-DIFFERENT'
    };
    assert.equal(isOrderAssignedToRider(orderWithPartialRider, riderWithDifferentId), true);
    assert.equal(isOrderVisibleToUser(orderWithPartialRider, riderWithDifferentId, 'tenant-alfatah'), true);
  });

  await t.test('isOrderVisibleToUser hides order if assigned to someone else', () => {
    const usmanOrder = {
      ...unimaartOrder,
      assignedRider: {
        id: 'RDR-USMAN',
        name: 'Usman Courier',
        phone: '+92 301 9876543'
      }
    };
    assert.equal(isOrderAssignedToRider(usmanOrder, ahmadRiderUser), false);
    assert.equal(isOrderVisibleToUser(usmanOrder, ahmadRiderUser, 'tenant-alfatah'), false);
  });

  await t.test('unassigned order from different store is not visible to rider', () => {
    const unassignedChaseUpOrder = {
      id: '#CU-1001',
      tenantId: 'tenant-chaseup',
      branchId: 'branch_cu_khi',
      assignedRider: null,
      status: 'Ready for Dispatch'
    };
    assert.equal(isOrderVisibleToUser(unassignedChaseUpOrder, ahmadRiderUser, 'tenant-alfatah'), false);
  });

  await t.test('canAssignRiderToOrder allows dispatching Ahmad to Unimaart order in Faisalabad', () => {
    const riderProfile = {
      id: 'RDR-AHMAD-01',
      name: 'ahmad',
      city: 'Faisalabad',
      serviceArea: 'Peoples Colony',
      isGlobal: true,
      tenantId: 'tenant-alfatah'
    };
    const result = canAssignRiderToOrder(unimaartOrder, riderProfile);
    assert.equal(result.allowed, true);
  });
});
