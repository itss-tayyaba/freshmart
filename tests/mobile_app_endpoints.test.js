import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMyOrders,
  getAssignedRiderOrders,
  getPickupAssignedOrders,
  updateOrderPickupStatus,
  updateMyRiderLocation
} from '../server/controllers/orderController.js';
import { ADMIN_ORDERS_FULL } from '../src/data/adminSuiteData.js';

test('Mobile App Backend Endpoints Suite', async (t) => {
  const testOrderId = 'TEST-MOB-101';
  const testOrder = {
    id: testOrderId,
    orderId: `#${testOrderId}`,
    user: 'user_cust_123',
    customerEmail: 'mobile.shopper@freshmart.pk',
    customerPhone: '+92 300 1234567',
    tenantId: 'tenant-freshmart',
    companyId: 'company_004',
    branchId: 'branch_001',
    status: 'Pending',
    assignedRider: {
      id: 'rider_mob_01',
      riderId: 'rider_mob_01',
      name: 'Usman Mobile Rider',
      phone: '+92 311 9876543'
    },
    pickupStaffId: 'staff_mob_01',
    orderItems: [{ name: 'Fresh Milk', quantity: 2, price: 200 }],
    totalPrice: 400
  };
  ADMIN_ORDERS_FULL.unshift(testOrder);

  await t.test('1. getMyOrders returns authenticated customer history', async () => {
    const req = {
      user: {
        id: 'user_cust_123',
        email: 'mobile.shopper@freshmart.pk',
        role: 'customer'
      }
    };
    let jsonResult;
    const res = {
      json: (data) => { jsonResult = data; return res; },
      status: () => res
    };

    await getMyOrders(req, res);
    assert.equal(jsonResult.success, true);
    assert.ok(jsonResult.orders.length > 0);
    const found = jsonResult.orders.find((o) => (o.id || o.orderId).includes(testOrderId));
    assert.ok(found, 'Should find customer order');
    assert.equal(found.totalPrice, 400);
  });

  await t.test('2. getAssignedRiderOrders returns orders assigned to logged in rider', async () => {
    const req = {
      user: {
        id: 'rider_mob_01',
        riderId: 'rider_mob_01',
        name: 'Usman Mobile Rider',
        role: 'rider'
      }
    };
    let jsonResult;
    const res = {
      json: (data) => { jsonResult = data; return res; },
      status: () => res
    };

    await getAssignedRiderOrders(req, res);
    assert.equal(jsonResult.success, true);
    const found = jsonResult.orders.find((o) => (o.id || o.orderId).includes(testOrderId));
    assert.ok(found, 'Rider should see assigned order');
    assert.equal(found.assignedRider.name, 'Usman Mobile Rider');
  });

  await t.test('3. getPickupAssignedOrders returns orders for pickup staff queue', async () => {
    const req = {
      user: {
        id: 'staff_mob_01',
        staffId: 'staff_mob_01',
        tenantId: 'tenant-freshmart',
        branchId: 'branch_001',
        role: 'pickup_staff'
      }
    };
    let jsonResult;
    const res = {
      json: (data) => { jsonResult = data; return res; },
      status: () => res
    };

    await getPickupAssignedOrders(req, res);
    assert.equal(jsonResult.success, true);
    const found = jsonResult.orders.find((o) => (o.id || o.orderId).includes(testOrderId));
    assert.ok(found, 'Staff should see orders queued for pickup');
  });

  await t.test('4. updateOrderPickupStatus transitions status to Preparing and Ready for Pickup', async () => {
    const reqPrep = {
      params: { id: testOrderId },
      body: { status: 'Preparing' },
      user: { staffId: 'staff_mob_01', name: 'Packing Staff 1', role: 'pickup_staff' }
    };
    let prepResult;
    const resPrep = {
      json: (data) => { prepResult = data; return resPrep; },
      status: () => resPrep
    };

    await updateOrderPickupStatus(reqPrep, resPrep);
    assert.equal(prepResult.success, true);
    assert.equal(prepResult.order.status, 'Preparing');
    assert.equal(prepResult.order.fulfillmentStage, 2);

    const reqReady = {
      params: { id: testOrderId },
      body: { status: 'Ready for Pickup' },
      user: { staffId: 'staff_mob_01', name: 'Packing Staff 1', role: 'pickup_staff' }
    };
    let readyResult;
    const resReady = {
      json: (data) => { readyResult = data; return resReady; },
      status: () => resReady
    };

    await updateOrderPickupStatus(reqReady, resReady);
    assert.equal(readyResult.success, true);
    assert.equal(readyResult.order.status, 'Ready for Pickup');
    assert.equal(readyResult.order.fulfillmentStage, 3);
    assert.equal(readyResult.order.isDispatchedByStaff, true);
  });

  await t.test('5. updateMyRiderLocation updates telemetry and coordinates', async () => {
    // Put test order in ADMIN_ORDERS_FULL to Out for Delivery so active coordinates update
    const memOrder = ADMIN_ORDERS_FULL.find((o) => (o.id || o.orderId).includes(testOrderId));
    if (memOrder) memOrder.status = 'Out for Delivery';

    const req = {
      user: {
        id: 'rider_mob_01',
        riderId: 'rider_mob_01',
        role: 'rider'
      },
      body: {
        lat: 31.5204,
        lng: 74.3587,
        speed: 28,
        heading: 180
      }
    };
    let locResult;
    const res = {
      json: (data) => { locResult = data; return res; },
      status: () => res
    };

    await updateMyRiderLocation(req, res);
    assert.equal(locResult.success, true);
    assert.equal(locResult.coordinates.lat, 31.5204);
    assert.equal(locResult.coordinates.lng, 74.3587);
    assert.equal(memOrder.assignedRider.coordinates.lat, 31.5204);
    assert.equal(memOrder.assignedRider.speed, 28);
  });

  // Cleanup test order
  const idx = ADMIN_ORDERS_FULL.findIndex((o) => (o.id || o.orderId).includes(testOrderId));
  if (idx >= 0) ADMIN_ORDERS_FULL.splice(idx, 1);
});
