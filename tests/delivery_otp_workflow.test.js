import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createOrder,
  verifyDeliveryOtp,
  getRiderOrders,
  assignPickupStaffToOrder,
  getPickupStaffOrders,
  updatePickupStaffOrderStatus,
  assignRiderToOrder,
  updateOrderStatus
} from '../server/controllers/orderController.js';
import { ADMIN_ORDERS_FULL } from '../src/data/adminSuiteData.js';

const invoke = async (handler, req) => {
  let statusCode = 200;
  let data = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(response) {
      data = response;
      return response;
    }
  };
  await handler(req, res);
  return { statusCode, data };
};

const createTestOrder = async (id) => {
  const order = {
    id,
    orderId: id,
    branchId: 'store-1',
    branchName: 'Johar Town Store',
    branchCoords: { lat: 31.4697, lng: 74.2728 },
    destinationCoords: { lat: 31.4697, lng: 74.2728 },
    customerName: 'Test Customer',
    customerPhone: '+92 300 1234567',
    shippingAddress: {
      address: 'House 55, Johar Town',
      area: 'Johar Town',
      city: 'Lahore',
      coords: { lat: 31.4697, lng: 74.2728 }
    },
    orderItems: [{ name: 'Fresh Farm Milk 1L', price: 240, quantity: 1 }],
    totalPrice: 240,
    paymentMethod: 'Cash on Delivery',
    status: 'Pending',
    deliveryOtp: '7429',
    assignedRider: null,
    createdAt: new Date()
  };
  ADMIN_ORDERS_FULL.unshift(order);
  return order;
};

const assignPickupAndMarkReady = async (orderId) => {
  const assigned = await invoke(assignPickupStaffToOrder, {
    params: { id: orderId },
    body: { id: '64b000000000000000000001', name: 'Pickup Staff One' }
  });
  assert.equal(assigned.statusCode, 503);
  const order = ADMIN_ORDERS_FULL.find((item) => item.orderId === orderId);
  assert.ok(order, 'test order should exist in the in-memory order fixture');
  order.assignedPickupStaff = { id: '64b000000000000000000001', name: 'Pickup Staff One' };
  assert.equal(order.status, 'Pending');

  const adminPreparing = await invoke(updateOrderStatus, {
    params: { id: orderId },
    body: { status: 'Preparing' }
  });
  assert.equal(adminPreparing.statusCode, 400);

  const adminReady = await invoke(updateOrderStatus, {
    params: { id: orderId },
    body: { status: 'Ready for Pickup' }
  });
  assert.equal(adminReady.statusCode, 400);

  order.status = 'Ready for Pickup';
};

const assignTestRider = (orderId) =>
  invoke(assignRiderToOrder, {
    params: { id: orderId },
    body: {
      riderId: 'RDR-TEST',
      rider: {
        id: 'RDR-TEST',
        name: 'Test Rider',
        zone: 'Johar Town / Model Town',
        coordinates: { lat: 31.47, lng: 74.27 }
      }
    }
  });

describe('Branch order handover workflow', () => {
  it('requires pickup staff identity for the cross-device pickup queue', async () => {
    const unauthorized = await invoke(getPickupStaffOrders, {
      user: { id: 'admin-1', role: 'admin', branchId: 'store-1' }
    });

    it('rejects pickup assignment without persistent registered staff storage', async () => {
      const response = await invoke(assignPickupStaffToOrder, {
        params: { id: '#FM-NO-DATABASE' },
        body: { id: '64b000000000000000000001', name: 'Pickup Staff One' },
        user: { id: 'admin-1', role: 'admin', branchId: 'store-1' }
      });
      assert.equal(response.statusCode, 503);
      assert.match(response.data.message, /database connection/i);
    });

    it('rejects name-only pickup assignments', async () => {
      const response = await invoke(assignPickupStaffToOrder, {
        params: { id: '#FM-NAME-ONLY' },
        body: { id: 'pickup-staff-name', name: 'Pickup Staff One' },
        user: { id: 'admin-1', role: 'admin', branchId: 'store-1' }
      });
      assert.equal(response.statusCode, 400);
      assert.match(response.data.message, /account id is invalid/i);
    });
    assert.equal(unauthorized.statusCode, 403);

    const unavailable = await invoke(getPickupStaffOrders, {
      user: { id: 'staff-1', role: 'pickupstaff', branchId: 'store-1' }
    });
    assert.equal(unavailable.statusCode, 503);
    assert.match(unavailable.data.message, /database connection/i);
  });

  it('does not allow non-pickup roles to update pickup orders', async () => {
    const response = await invoke(updatePickupStaffOrderStatus, {
      params: { id: '#FM-UNAUTHORIZED-PICKUP' },
      user: { id: 'rider-1', role: 'rider', branchId: 'store-1' },
      body: { status: 'Ready for Pickup' }
    });
    assert.equal(response.statusCode, 403);
  });

  it('creates an order with a customer delivery OTP and branch assignment', async () => {
    const response = await invoke(createOrder, {
      body: {
        orderId: `#FM-OTP-CREATE-${Date.now()}`,
        branchId: 'store-1',
        shippingAddress: { address: 'House 55, Johar Town', city: 'Lahore', area: 'Johar Town' },
        orderItems: [{ name: 'Milk', price: 240, quantity: 1 }]
      }
    });

    assert.equal(response.statusCode, 503);
    assert.equal(response.data.success, false);
    assert.match(response.data.message, /database connection/i);
  });

  it('does not show checkout success when durable order storage is unavailable', async () => {
    const response = await invoke(createOrder, {
      body: {
        orderId: `#FM-UNTRUSTED-DISPATCH-${Date.now()}`,
        branchId: 'store-1',
        customerName: 'Test Customer',
        customerPhone: '+92 300 1234567',
        shippingAddress: { address: 'House 55, Johar Town', area: 'Johar Town', city: 'Lahore' },
        orderItems: [{ name: 'Milk', price: 240, quantity: 1 }],
        status: 'Out for Delivery',
        assignedRider: { id: 'forged-rider', name: 'Forged Rider' }
      }
    });

    assert.equal(response.statusCode, 503);
    assert.equal(response.data.success, false);
  });

  it('rejects orders without a configured branch', async () => {
    const response = await invoke(createOrder, {
      body: {
        orderId: `#FM-OTP-NOBRANCH-${Date.now()}`,
        shippingAddress: { address: 'House 55', city: 'Lahore' },
        orderItems: [{ name: 'Milk', price: 240, quantity: 1 }]
      }
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.data.success, false);
  });

  it('rejects a branch that is not nearest to the delivery coordinates', async () => {
    const response = await invoke(createOrder, {
      body: {
        orderId: `#FM-OTP-WRONG-BRANCH-${Date.now()}`,
        branchId: 'store-2',
        shippingAddress: {
          address: 'House 55, Johar Town',
          area: 'Johar Town',
          city: 'Lahore',
          coords: { lat: 31.4697, lng: 74.2728 }
        },
        orderItems: [{ name: 'Milk', price: 240, quantity: 1 }]
      }
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.data.message, /nearest configured store/i);
  });

  it('requires pickup readiness before rider dispatch and the actual OTP for delivery', async () => {
    const id = `#FM-OTP-FLOW-${Date.now()}`;
    await createTestOrder(id);

    const prematureAssignment = await assignTestRider(id);
    assert.equal(prematureAssignment.statusCode, 409);

    await assignPickupAndMarkReady(id);
    const assignment = await assignTestRider(id);
    assert.equal(assignment.statusCode, 200);
    assert.equal(assignment.data.order.status, 'Out for Delivery');
    assert.equal(Object.hasOwn(assignment.data.order, 'deliveryOtp'), false);

    const riderOrders = await invoke(getRiderOrders, {
      user: { role: 'rider', riderId: 'RDR-TEST' }
    });
    assert.equal(riderOrders.statusCode, 200);
    assert.equal(riderOrders.data.orders.some((order) => order.orderId === id), true);
    assert.equal(Object.hasOwn(riderOrders.data.orders.find((order) => order.orderId === id), 'deliveryOtp'), false);

    const wrongRider = await invoke(verifyDeliveryOtp, {
      params: { id },
      user: { role: 'rider', riderId: 'RDR-OTHER' },
      body: { otp: '7429', riderId: 'RDR-TEST' }
    });
    assert.equal(wrongRider.statusCode, 403);

    const wrongOtp = await invoke(verifyDeliveryOtp, {
      params: { id },
      body: { otp: '9999', riderId: 'RDR-TEST' }
    });
    assert.equal(wrongOtp.statusCode, 400);
    assert.equal(wrongOtp.data.success, false);
    assert.match(wrongOtp.data.message, /invalid otp/i);

    const correctOtp = await invoke(verifyDeliveryOtp, {
      params: { id },
      body: { otp: '7429', riderId: 'RDR-TEST' }
    });
    assert.equal(correctOtp.statusCode, 200);
    assert.equal(correctOtp.data.success, true);
    assert.equal(correctOtp.data.order.status, 'Delivered');
    assert.equal(correctOtp.data.order.paymentStatus, 'Paid');
    assert.ok(correctOtp.data.deliveredAt);
  });

  it('rejects a rider whose service zone does not cover the delivery area', async () => {
    const id = `#FM-OTP-ZONE-${Date.now()}`;
    await createTestOrder(id);
    await assignPickupAndMarkReady(id);

    const response = await invoke(assignRiderToOrder, {
      params: { id },
      body: {
        riderId: 'RDR-OTHER-ZONE',
        rider: { id: 'RDR-OTHER-ZONE', name: 'Other Zone Rider', zone: 'Gulberg / Main Hub' }
      }
    });

    assert.equal(response.statusCode, 409);
    assert.match(response.data.message, /does not serve/i);
  });
});
