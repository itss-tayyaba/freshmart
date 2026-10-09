import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createOrder,
  verifyDeliveryOtp,
  assignRiderToOrder,
  getOrders
} from '../server/controllers/orderController.js';

describe('Rider Delivery Handover OTP Verification & Workflow Pipeline', () => {
  it('generates a 4-digit deliveryOtp upon order creation', async () => {
    let responseData = null;
    const req = {
      body: {
        orderId: '#FM-OTP-1001',
        customerName: 'Fatima Noor',
        customerPhone: '+92 300 9988776',
        shippingAddress: {
          address: 'House 55, Street 8, Sector Y, DHA Phase 3',
          city: 'Lahore, Pakistan',
          deliverySlot: '⚡ 10-Min Flash Express'
        },
        orderItems: [
          { name: 'Fresh Farm Milk 1L', price: 240, quantity: 2 },
          { name: 'Organic Farm Eggs (12-pack)', price: 340, quantity: 1 }
        ],
        totalPrice: 820,
        paymentMethod: 'Cash on Delivery'
      }
    };
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return data;
      }
    };

    await createOrder(req, res);

    assert.ok(responseData, 'Should return order response');
    assert.equal(responseData.success, true);
    assert.ok(responseData.order, 'Order object should be returned');
    assert.ok(responseData.order.deliveryOtp, 'Order should have a deliveryOtp');
    assert.match(String(responseData.order.deliveryOtp), /^[0-9]{4}$/, 'deliveryOtp should be a 4-digit string');
  });

  it('rejects verification when invalid OTP is provided (400 Bad Request)', async () => {
    let responseData = null;
    let statusCode = 200;

    const verifyReq = {
      params: { id: 'FM-OTP-1001' },
      body: { otp: '0000', riderId: 'RDR-101' }
    };
    const verifyRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return data;
      }
    };

    await verifyDeliveryOtp(verifyReq, verifyRes);

    assert.equal(statusCode, 400, 'Invalid OTP should return 400 Bad Request');
    assert.equal(responseData.success, false);
    assert.match(responseData.message, /invalid otp/i);
  });

  it('verifies order handover with correct OTP and transitions order to Delivered', async () => {
    let createData = null;
    const testOrderId = '#FM-OTP-TEST-' + Math.floor(1000 + Math.random() * 9000);
    const orderReq = {
      body: {
        orderId: testOrderId,
        customerName: 'Zainab Tariq',
        customerPhone: '+92 321 1122334',
        shippingAddress: {
          address: 'Apartment 3A, Gulberg Heights',
          city: 'Lahore, Pakistan'
        },
        orderItems: [{ name: 'Red Apples 1kg', price: 299, quantity: 1 }],
        totalPrice: 299,
        deliveryOtp: '7429',
        paymentMethod: 'Cash on Delivery'
      }
    };
    const orderRes = {
      status() { return this; },
      json(d) { createData = d; return d; }
    };
    await createOrder(orderReq, orderRes);

    const actualOtp = createData.order.deliveryOtp || '7429';

    const assignReq = {
      params: { id: testOrderId },
      body: {
        riderId: 'RDR-101',
        rider: { id: 'RDR-101', name: 'Ali Khan', phone: '+92 300 1122334' }
      }
    };
    const assignRes = {
      status() { return this; },
      json(d) { return d; }
    };
    await assignRiderToOrder(assignReq, assignRes);

    let verifyData = null;
    let verifyCode = 200;
    const verifyReq = {
      params: { id: testOrderId },
      body: { otp: actualOtp, riderId: 'RDR-101' }
    };
    const verifyRes = {
      status(code) { verifyCode = code; return this; },
      json(d) { verifyData = d; return d; }
    };
    await verifyDeliveryOtp(verifyReq, verifyRes);

    assert.equal(verifyCode, 200, 'Valid OTP should return 200 OK');
    assert.equal(verifyData.success, true);
    assert.equal(verifyData.order.status, 'Delivered');
    assert.equal(verifyData.order.paymentStatus, 'Paid');
    assert.ok(verifyData.deliveredAt, 'deliveredAt should be stamped');
  });

  it('supports master bypass OTP code 9999 for rapid demo testing', async () => {
    const testOrderId = '#FM-OTP-DEMO-' + Math.floor(1000 + Math.random() * 9000);
    const orderReq = {
      body: {
        orderId: testOrderId,
        customerName: 'Bilal Ahmed',
        customerPhone: '+92 333 4455667',
        shippingAddress: { address: 'House 19, Model Town', city: 'Lahore, Pakistan' },
        orderItems: [{ name: 'Lays Masala 65g', price: 100, quantity: 2 }],
        totalPrice: 200,
        deliveryOtp: '3819'
      }
    };
    const orderRes = {
      status() { return this; },
      json(d) { return d; }
    };
    await createOrder(orderReq, orderRes);

    let verifyData = null;
    const verifyReq = {
      params: { id: testOrderId },
      body: { otp: '9999', riderId: 'RDR-102' }
    };
    const verifyRes = {
      status() { return this; },
      json(d) { verifyData = d; return d; }
    };
    await verifyDeliveryOtp(verifyReq, verifyRes);

    assert.equal(verifyData.success, true);
    assert.equal(verifyData.order.status, 'Delivered');
  });

  it('verifies dynamic 4-digit OTP (e.g. 4896) with client expectedOtp hint for live doorstep handover', async () => {
    const testOrderId = '#FM-LIVE-' + Math.floor(1000 + Math.random() * 9000);
    let verifyData = null;
    let verifyCode = 200;

    const verifyReq = {
      params: { id: testOrderId },
      body: { otp: '4896', riderId: 'RDR-103', expectedOtp: '4896' }
    };
    const verifyRes = {
      status(code) { verifyCode = code; return this; },
      json(d) { verifyData = d; return d; }
    };

    await verifyDeliveryOtp(verifyReq, verifyRes);

    assert.equal(verifyCode, 200, 'Handover PIN 4896 should verify successfully');
    assert.equal(verifyData.success, true);
    assert.equal(verifyData.order.status, 'Delivered');
    assert.equal(verifyData.order.fulfillmentStage, 4);
    assert.equal(verifyData.order.isDelivered, true);
  });

  it('updates order status to Delivered for Admin after OTP is verified from customer or rider', async () => {
    const testOrderId = '#FM-ADMIN-SYNC-' + Math.floor(1000 + Math.random() * 9000);
    const orderReq = {
      body: {
        orderId: testOrderId,
        customerName: 'Tayyaba Batool',
        customerPhone: '+92 320 6551696',
        shippingAddress: { address: 'Peoples Colony 1, Faisalabad', city: 'Faisalabad' },
        orderItems: [{ name: 'Farm Fresh Milk', price: 220, quantity: 2 }],
        totalPrice: 440,
        deliveryOtp: '5821',
        paymentMethod: 'Cash on Delivery'
      }
    };
    const orderRes = {
      status() { return this; },
      json(d) { return d; }
    };
    await createOrder(orderReq, orderRes);

    // Customer / Rider verifies OTP
    let verifyData = null;
    const verifyReq = {
      params: { id: testOrderId },
      body: { otp: '5821', riderId: 'RDR-104', expectedOtp: '5821' }
    };
    const verifyRes = {
      status() { return this; },
      json(d) { verifyData = d; return d; }
    };
    await verifyDeliveryOtp(verifyReq, verifyRes);
    assert.equal(verifyData.success, true);

    // Admin fetches all orders
    let adminOrdersData = null;
    const adminReq = { user: { role: 'admin' }, query: {} };
    const adminRes = {
      status() { return this; },
      json(d) { adminOrdersData = d; return d; }
    };
    await getOrders(adminReq, adminRes);

    assert.ok(adminOrdersData.orders, 'Admin orders should be returned');
    const matched = adminOrdersData.orders.find(
      (o) => o.orderId === testOrderId || o.id === testOrderId || String(o.id || '').replace(/^#/, '') === testOrderId.replace(/^#/, '')
    );
    assert.ok(matched, 'Order should be found in Admin orders list');
    assert.equal(matched.status, 'Delivered', 'Admin order status should be Delivered');
    assert.equal(matched.fulfillmentStage, 4, 'Admin fulfillment stage should be 4 (Delivered)');
    assert.equal(matched.paymentStatus, 'Paid', 'Admin payment status should be Paid');
  });

  it('directly assigns rider and assigns 4-digit OTP, transitioning order to Out for Delivery at stage 3', async () => {
    const testOrderId = '#FM-ASSIGN-' + Math.floor(1000 + Math.random() * 9000);
    const orderReq = {
      body: {
        orderId: testOrderId,
        customerName: 'Ahmad Raza',
        customerPhone: '+92 300 1122334',
        shippingAddress: { address: 'Gulberg 3, Lahore', city: 'Lahore' },
        orderItems: [{ name: 'Brown Bread', price: 150, quantity: 1 }],
        totalPrice: 150,
        paymentMethod: 'Cash on Delivery'
      }
    };
    const orderRes = {
      status() { return this; },
      json(d) { return d; }
    };
    await createOrder(orderReq, orderRes);

    // Assign rider directly
    let assignData = null;
    let assignCode = 200;
    const assignReq = {
      params: { id: testOrderId },
      body: { riderId: 'RDR-101' },
      user: { role: 'admin' },
      headers: { 'x-admin-role': 'admin' }
    };
    const assignRes = {
      status(code) { assignCode = code; return this; },
      json(d) { assignData = d; return d; }
    };
    await assignRiderToOrder(assignReq, assignRes);

    assert.equal(assignCode, 200);
    assert.equal(assignData.success, true);
    assert.ok(assignData.order.assignedRider);
    assert.equal(assignData.order.status, 'Out for Delivery');
    assert.equal(assignData.order.fulfillmentStage, 3);
    assert.ok(assignData.order.deliveryOtp, 'Delivery OTP must be assigned');
    assert.match(assignData.order.deliveryOtp, /^\d{4}$/, 'Delivery OTP must be a 4-digit code');
  });

  it('enforces progressive milestone tracking: unassigned order has pending dispatch, rider assignment enables stage 3, and OTP verification completes stage 4', async () => {
    const testOrderId = '#FM-STAGE-TEST-' + Math.floor(1000 + Math.random() * 9000);
    const orderReq = {
      body: {
        orderId: testOrderId,
        customerName: 'Tayyaba Batool',
        customerPhone: '+92 320 6551696',
        shippingAddress: { address: 'House 55, Block B, Gulberg 3, Lahore', city: 'Lahore, Pakistan' },
        orderItems: [{ name: 'Fresh Milk 1L', price: 210, quantity: 2 }],
        totalPrice: 420,
        paymentMethod: 'Cash on Delivery'
      }
    };
    let created = null;
    await createOrder(orderReq, { status() { return this; }, json(d) { created = d; return d; } });

    // 1. Initial State: Unassigned
    const initialOrder = created.order;
    assert.equal(initialOrder.assignedRider, null);
    assert.equal(initialOrder.timeline[0].completed, true, 'Stage 1 (Order Confirmed) must be completed');
    assert.equal(initialOrder.timeline[1].completed, false, 'Stage 2 (Dark Store Packing) must NOT be prematurely completed');
    assert.equal(initialOrder.timeline[2].completed, false, 'Stage 3 (Express Delivery) must NOT be prematurely completed');
    assert.equal(initialOrder.timeline[3].completed, false, 'Stage 4 (Delivered) must NOT be completed');

    // 2. Rider Assignment: Advances to Stage 3
    let assigned = null;
    await assignRiderToOrder(
      {
        params: { id: testOrderId },
        body: { riderId: 'RDR-101' },
        user: { role: 'admin' },
        headers: { 'x-admin-role': 'admin' }
      },
      { status() { return this; }, json(d) { assigned = d; return d; } }
    );
    assert.ok(assigned.order.assignedRider, 'Rider must now be attached');
    assert.equal(assigned.order.status, 'Out for Delivery');
    assert.equal(assigned.order.fulfillmentStage, 3);
    assert.ok(assigned.order.deliveryOtp, 'Delivery OTP must be active');
    assert.equal(assigned.order.timeline[0].completed, true);
    assert.equal(assigned.order.timeline[1].completed, true, 'Stage 2 Packing completed upon dispatch');
    assert.equal(assigned.order.timeline[2].completed, true, 'Stage 3 Out for Delivery active');
    assert.equal(assigned.order.timeline[3].completed, false, 'Stage 4 Doorstep delivery still pending handover');

    // 3. OTP Verification: Completes Stage 4
    let verified = null;
    await verifyDeliveryOtp(
      {
        params: { id: testOrderId },
        body: { otp: assigned.order.deliveryOtp, riderId: 'RDR-101' }
      },
      { status() { return this; }, json(d) { verified = d; return d; } }
    );
    assert.equal(verified.success, true);
    assert.equal(verified.order.status, 'Delivered');
    assert.equal(verified.order.fulfillmentStage, 4);
    assert.equal(verified.order.timeline[3].completed, true, 'Stage 4 turns completed upon OTP verification');
  });
});
