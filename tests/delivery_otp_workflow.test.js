import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createOrder,
  verifyDeliveryOtp,
  assignRiderToOrder
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
});
