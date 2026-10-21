import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTenantId, isSameTenant } from '../src/data/companyHierarchyData.js';
import { sanitizeOrder } from '../src/utils/orderSanitizer.js';

describe('Al-Fatah Store Admin Order Visibility & Multi-Tenant Isolation', () => {
  it('preserves Al-Fatah tenant identity in sanitizeOrder even when customer is Tayyaba Batool', () => {
    const rawOrder = {
      id: 'ORD-701',
      orderId: 'ORD-701',
      tenantId: 'tenant-alfatah',
      tenantName: 'Al-Fatah Supermarket',
      customer: 'Tayyaba Batool',
      customerName: 'Tayyaba Batool',
      customerPhone: '+923206551696',
      address: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
      city: 'Faisalabad',
      status: 'Pending',
      total: 970
    };

    const sanitized = sanitizeOrder(rawOrder);
    assert.equal(sanitized.id, 'ORD-701');
    assert.equal(sanitized.tenantId, 'tenant-alfatah');
    assert.equal(sanitized.tenantName, 'Al-Fatah Supermarket');
    assert.equal(sanitized.branchId, 'branch_af_fsd');
    assert.equal(sanitized.branchName, 'D-Ground Flagship Hub');
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-alfatah'), true);
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-freshmart'), false);
  });

  it('corrects Al-Fatah order if it was previously stamped with Peoples Colony Dark Store', () => {
    const orderWithWrongBranch = {
      id: 'ORD-701',
      orderId: 'ORD-701',
      tenantId: 'tenant-alfatah',
      tenantName: 'Al-Fatah Supermarket',
      branchId: 'branch_um_fsd',
      branchName: 'Peoples Colony Dark Store',
      customer: 'Tayyaba Batool',
      address: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
      city: 'Faisalabad'
    };

    const sanitized = sanitizeOrder(orderWithWrongBranch);
    assert.equal(sanitized.branchId, 'branch_af_fsd');
    assert.equal(sanitized.branchName, 'D-Ground Flagship Hub');
  });

  it('preserves Unimaart tenant identity for #FM83459 in sanitizeOrder', () => {
    const rawFmOrder = {
      id: '#FM83459',
      orderId: '#FM83459',
      tenantId: 'tenant-freshmart',
      tenantName: 'Unimaart (Market Store)',
      customer: 'Tayyaba',
      customerName: 'Tayyaba',
      address: 'Peoples Colony No.01, Faisalabad',
      status: 'Pending',
      total: 140
    };

    const sanitized = sanitizeOrder(rawFmOrder);
    assert.equal(sanitized.tenantId, 'tenant-freshmart');
    assert.equal(sanitized.tenantName, 'Unimaart (Market Store)');
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-freshmart'), true);
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-alfatah'), false);
  });

  it('robustly resolves all Al-Fatah naming variants via resolveTenantId and isSameTenant', () => {
    const variants = [
      'tenant-alfatah',
      'company_001',
      'al-fatah',
      'Al-Fatah',
      'Al-Fatah Supermarket',
      'alfatah',
      'Al Fatah'
    ];

    variants.forEach((v) => {
      assert.equal(resolveTenantId(v), 'company_001', `Failed resolving variant: ${v}`);
      assert.equal(isSameTenant(v, 'tenant-alfatah'), true, `isSameTenant failed for ${v} against tenant-alfatah`);
      assert.equal(isSameTenant(v, 'company_001'), true, `isSameTenant failed for ${v} against company_001`);
      assert.equal(isSameTenant(v, 'tenant-freshmart'), false, `isSameTenant falsely matched ${v} against tenant-freshmart`);
    });
  });

  it('Al-Fatah Store Admin live orders filter includes ORD-701 and excludes Unimaart orders', () => {
    const orders = [
      {
        id: 'ORD-701',
        orderId: 'ORD-701',
        tenantId: 'tenant-alfatah',
        tenantName: 'Al-Fatah Supermarket',
        customer: 'Tayyaba Batool',
        status: 'Pending',
        total: 970
      },
      {
        id: '#FM83459',
        orderId: '#FM83459',
        tenantId: 'tenant-freshmart',
        tenantName: 'Unimaart (Market Store)',
        customer: 'Tayyaba',
        status: 'Pending',
        total: 140
      }
    ];

    // Simulate Al-Fatah Store Admin view
    const targetTenantId = 'tenant-alfatah';
    const alfatahAdminOrders = orders.filter((o) => {
      const orderTenant = o.tenantId || o.companyId || o.tenantName;
      return isSameTenant(orderTenant, targetTenantId);
    });

    assert.equal(alfatahAdminOrders.length, 1);
    assert.equal(alfatahAdminOrders[0].id, 'ORD-701');

    // Simulate Unimaart Store Admin view
    const unimaartTenantId = 'tenant-freshmart';
    const unimaartAdminOrders = orders.filter((o) => {
      const orderTenant = o.tenantId || o.companyId || o.tenantName;
      return isSameTenant(orderTenant, unimaartTenantId);
    });

    assert.equal(unimaartAdminOrders.length, 1);
    assert.equal(unimaartAdminOrders[0].id, '#FM83459');
  });

  it('validates multi-step fulfillment lifecycle: Assign Staff -> Staff Prepares -> Rider sees countdown -> Staff Dispatches -> Admin assigns Rider', () => {
    // 1. Order Placed in Pending (No staff yet)
    let order = {
      id: 'ORD-701',
      status: 'Pending',
      tenantId: 'tenant-alfatah',
      customer: 'Tayyaba Batool',
      total: 970
    };
    const hasStaffAssignedInitially = Boolean(order.pickupStaffId || order.pickupStaffName);
    assert.equal(hasStaffAssignedInitially, false, 'Step 1: Order starts with no pickup staff assigned');

    // 2. Admin assigns order to pickup staff
    const staff = { id: 'PCK-ALFATAH', name: 'Al-Fatah Packing Desk' };
    order = {
      ...order,
      pickupStaffId: staff.id,
      pickupStaffName: staff.name,
      status: 'Deliver to Staff',
      fulfillmentStage: 2,
      pickupStep: 'received'
    };
    assert.equal(order.status, 'Deliver to Staff');
    assert.equal(order.pickupStaffName, 'Al-Fatah Packing Desk');

    // 3. Pickup staff starts preparing
    order = {
      ...order,
      status: 'Preparing',
      pickupStep: 'picking',
      preparingStartedAt: new Date().toISOString(),
      prepEstimatedMinutes: 10,
      isDispatchedByStaff: false
    };
    assert.equal(order.status, 'Preparing');
    assert.equal(order.isDispatchedByStaff, false);

    // Rider sees preparation time left
    const now = Date.now();
    const started = new Date(order.preparingStartedAt).getTime();
    const remainingMins = Math.ceil((10 * 60 * 1000 - (now - started)) / (60 * 1000));
    assert.ok(remainingMins <= 10 && remainingMins >= 0);

    // 4. Pickup staff dispatches the parcel
    order = {
      ...order,
      status: 'Ready for Dispatch',
      pickupStep: 'verified',
      isDispatchedByStaff: true,
      dispatchedAt: new Date().toISOString(),
      fulfillmentStage: 4
    };
    assert.equal(order.isDispatchedByStaff, true);
    assert.equal(order.status, 'Ready for Dispatch');

    // 5. Admin can now assign rider
    const rider = { id: 'RDR-001', name: 'Ahmad Khan', phone: '+923001234567' };
    order = {
      ...order,
      status: 'Out for Delivery',
      assignedRider: rider,
      fulfillmentStage: 5
    };
    assert.equal(order.status, 'Out for Delivery');
    assert.equal(order.assignedRider.name, 'Ahmad Khan');
  });

  it('preserves Case Value tenant identity in sanitizeOrder and verifies Case Value Store Admin visibility', () => {
    const rawCvOrder = {
      id: '#CV4092',
      orderId: '#CV4092',
      tenantId: 'tenant-chasevalue',
      tenantName: 'Case Value (Local Grocery)',
      customer: 'Usman Farooq',
      customerName: 'Usman Farooq',
      customerPhone: '+923017654321',
      address: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
      city: 'Faisalabad',
      status: 'Pending',
      total: 1380,
      items: [
        {
          id: 'chasevalue-atta-10kg',
          name: 'Chase Value Mega Saver Whole Wheat Chakki Atta (10kg)',
          price: 1380,
          quantity: 1
        }
      ]
    };

    const sanitized = sanitizeOrder(rawCvOrder);
    assert.equal(sanitized.tenantId, 'tenant-chasevalue');
    assert.equal(sanitized.branchId, 'branch_cv_fsd');
    assert.equal(sanitized.branchName, 'Wholesale Express Hub');
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-chasevalue'), true);
    assert.equal(isSameTenant(sanitized.tenantId, 'company_003'), true);
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-freshmart'), false);

    // Verify recovery even if order was stamped with #FM ID
    const cvWithFmId = {
      id: '#FM58291',
      orderId: '#FM58291',
      tenantId: 'tenant-chasevalue',
      tenantName: 'Case Value (Local Grocery)',
      address: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
      items: [
        {
          id: 'chasevalue-atta-10kg',
          name: 'Chase Value Mega Saver Whole Wheat Chakki Atta (10kg)',
          price: 1380
        }
      ]
    };
    const sanitizedWithFmId = sanitizeOrder(cvWithFmId);
    assert.equal(sanitizedWithFmId.tenantId, 'tenant-chasevalue');
    assert.equal(isSameTenant(sanitizedWithFmId.tenantId, 'tenant-chasevalue'), true);

    // Verify Case Value Store Admin filter includes this order
    const orders = [
      sanitized,
      { id: 'ORD-701', tenantId: 'tenant-alfatah', total: 970 },
      { id: '#FM83459', tenantId: 'tenant-freshmart', total: 140 }
    ];
    const targetTenantId = 'tenant-chasevalue';
    const caseValueOrders = orders.filter((o) => {
      const orderTenant = o.tenantId || o.companyId || o.tenantName;
      return isSameTenant(orderTenant, targetTenantId);
    });

    assert.equal(caseValueOrders.length, 1);
    assert.equal(caseValueOrders[0].id, '#CV4092');
  });
});
