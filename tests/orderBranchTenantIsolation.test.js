import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createOrder,
  getOrders
} from '../server/controllers/orderController.js';
import { resolveTenantId } from '../src/data/companyHierarchyData.js';

describe('Multi-Tenant Store and Branch Order Isolation (Zero Cross-Store Order Leaks)', () => {
  it('stamps Chase Value orders with tenantId, tenantName, branchId, and branchName', async () => {
    let orderResData = null;
    const req = {
      body: {
        orderId: '#CV-TEST-9001',
        customerName: 'Kashif Ali',
        customerPhone: '+92 321 4455667',
        tenantId: 'tenant-chasevalue',
        tenantName: 'Chase Value',
        branchId: 'branch_cv_fsd',
        branchName: 'Wholesale Express Hub',
        shippingAddress: {
          address: 'Jaranwala Road, Near Peoples Colony, Faisalabad',
          city: 'Faisalabad'
        },
        orderItems: [{ name: 'Chakki Atta 10kg', price: 1250, quantity: 2 }],
        totalPrice: 2500,
        paymentMethod: 'Cash on Delivery'
      }
    };
    const res = {
      status() { return this; },
      json(d) { orderResData = d; return d; }
    };

    await createOrder(req, res);
    assert.equal(orderResData.success, true);
    assert.equal(orderResData.order.tenantId, 'tenant-chasevalue');
    assert.equal(orderResData.order.tenantName, 'Chase Value');
    assert.equal(orderResData.order.branchId, 'branch_cv_fsd');
    assert.equal(orderResData.order.branchName, 'Wholesale Express Hub');
  });

  it('stamps Al-Fatah orders with tenantId, tenantName, branchId, and branchName', async () => {
    let orderResData = null;
    const req = {
      body: {
        orderId: '#AF-TEST-9002',
        customerName: 'Zainab Bibi',
        customerPhone: '+92 300 7788990',
        tenantId: 'tenant-alfatah',
        tenantName: 'Al-Fatah Supermarket',
        branchId: 'branch_001',
        branchName: 'DHA Lahore',
        shippingAddress: {
          address: 'Sector Y, Phase 3, DHA Lahore',
          city: 'Lahore'
        },
        orderItems: [{ name: 'Borges Extra Virgin Olive Oil 1L', price: 2950, quantity: 1 }],
        totalPrice: 2950,
        paymentMethod: 'Credit / Debit Card'
      }
    };
    const res = {
      status() { return this; },
      json(d) { orderResData = d; return d; }
    };

    await createOrder(req, res);
    assert.equal(orderResData.success, true);
    assert.equal(orderResData.order.tenantId, 'tenant-alfatah');
    assert.equal(orderResData.order.tenantName, 'Al-Fatah Supermarket');
    assert.equal(orderResData.order.branchId, 'branch_001');
    assert.equal(orderResData.order.branchName, 'DHA Lahore');
  });

  it('Chase Value store admin ONLY sees Chase Value orders and NEVER Al-Fatah orders', async () => {
    let cvOrdersData = null;
    const req = {
      user: { role: 'admin', tenantId: 'tenant-chasevalue' },
      headers: { 'x-tenant-id': 'tenant-chasevalue' },
      query: {}
    };
    const res = {
      status() { return this; },
      json(d) { cvOrdersData = d; return d; }
    };

    await getOrders(req, res);
    assert.equal(cvOrdersData.success, true);
    assert.ok(Array.isArray(cvOrdersData.orders));

    // Every single returned order must belong to Chase Value
    cvOrdersData.orders.forEach((o) => {
      assert.equal(o.tenantId, 'tenant-chasevalue', 'Chase Value store admin must only receive Chase Value orders');
      assert.notEqual(o.tenantId, 'tenant-alfatah', 'Al-Fatah orders must NEVER leak to Chase Value store admin');
    });

    const hasChaseValueOrder = cvOrdersData.orders.some((o) => o.orderId === '#CV-TEST-9001');
    assert.ok(hasChaseValueOrder, 'Chase Value test order #CV-TEST-9001 must appear in Chase Value dashboard');
  });

  it('Al-Fatah store admin ONLY sees Al-Fatah orders and NEVER Chase Value orders', async () => {
    let afOrdersData = null;
    const req = {
      user: { role: 'admin', tenantId: 'tenant-alfatah' },
      headers: { 'x-tenant-id': 'tenant-alfatah' },
      query: {}
    };
    const res = {
      status() { return this; },
      json(d) { afOrdersData = d; return d; }
    };

    await getOrders(req, res);
    assert.equal(afOrdersData.success, true);
    assert.ok(Array.isArray(afOrdersData.orders));

    // Every single returned order must belong to Al-Fatah
    afOrdersData.orders.forEach((o) => {
      assert.equal(o.tenantId, 'tenant-alfatah', 'Al-Fatah store admin must only receive Al-Fatah orders');
      assert.notEqual(o.tenantId, 'tenant-chasevalue', 'Chase Value orders must NEVER leak to Al-Fatah store admin');
    });

    const hasAlFatahOrder = afOrdersData.orders.some((o) => o.orderId === '#AF-TEST-9002');
    assert.ok(hasAlFatahOrder, 'Al-Fatah test order #AF-TEST-9002 must appear in Al-Fatah dashboard');
  });

  it('correctly maps canonical company IDs via resolveTenantId', () => {
    assert.equal(resolveTenantId('tenant-chasevalue'), 'company_003');
    assert.equal(resolveTenantId('tenant-alfatah'), 'company_001');
    assert.equal(resolveTenantId('tenant-chaseup'), 'company_002');
    assert.equal(resolveTenantId('tenant-freshmart'), 'company_004');
  });
});
