import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createOrderSchema } from '../server/middleware/validationMiddleware.js';

describe('Checkout → Backend Order Pipeline & ID Synchronization', () => {
  it('validates standard payload with orderItems array and shippingAddress object', () => {
    const payload = {
      orderItems: [
        { product: '65f123456789012345678901', name: 'Lays Classic Salted', price: 100, quantity: 2 }
      ],
      customerName: 'Aimen Yasin',
      customerPhone: '0320-6551699',
      shippingAddress: {
        address: '123, Block A, Gulberg 3, Lahore',
        city: 'Lahore, Pakistan',
        deliverySlot: '⚡ 15-25 Mins Express Delivery'
      },
      paymentMethod: 'Cash on Delivery',
      subtotal: 200,
      totalAmount: 300
    };

    const parseResult = createOrderSchema.safeParse(payload);
    assert.equal(parseResult.success, true, 'Standard payload should pass schema validation');
  });

  it('validates flexible frontend payload with rawItems and top-level address', () => {
    const payload = {
      rawItems: [
        { id: 'lays-wavy-masala', name: 'Lays Wavy Masala', price: 100, quantity: 1 }
      ],
      customer: 'Tayyaba',
      phone: '0300-1234567',
      address: 'Street 5, DHA Phase 6, Lahore',
      payment: 'Credit / Debit Card',
      totalAmount: 200
    };

    const parseResult = createOrderSchema.safeParse(payload);
    assert.equal(parseResult.success, true, 'Frontend rawItems payload should pass schema validation');
  });

  it('rejects order with empty items list', () => {
    const payload = {
      orderItems: [],
      customerName: 'Aimen',
      shippingAddress: { address: 'Johar Town' }
    };

    const parseResult = createOrderSchema.safeParse(payload);
    assert.equal(parseResult.success, false, 'Empty items should fail validation');
  });

  it('normalizes items price and free delivery threshold correctly', () => {
    const orderItems = [
      { name: 'Cadbury Silk', price: 520, quantity: 2 }, // 1040 (>= 1000 => free delivery)
    ];

    const itemsPrice = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const deliveryPrice = itemsPrice >= 1000 || itemsPrice === 0 ? 0 : 100;
    const discount = 0;
    const totalPrice = itemsPrice + deliveryPrice - discount;

    assert.equal(itemsPrice, 1040);
    assert.equal(deliveryPrice, 0, 'Orders Rs. 1000+ qualify for free delivery');
    assert.equal(totalPrice, 1040);
  });

  it('calculates Rs. 100 delivery fee for sub-Rs. 1000 orders', () => {
    const orderItems = [
      { name: 'Lays French Cheese', price: 100, quantity: 3 } // 300 (< 1000 => Rs. 100 delivery)
    ];

    const itemsPrice = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const deliveryPrice = itemsPrice >= 1000 || itemsPrice === 0 ? 0 : 100;
    const totalPrice = itemsPrice + deliveryPrice;

    assert.equal(itemsPrice, 300);
    assert.equal(deliveryPrice, 100);
    assert.equal(totalPrice, 400);
  });

  it('correctly maps client-side cart items to standard orderItems format', () => {
    const cart = [
      {
        product: { id: 'lays-classic', name: 'Lays Classic', price: 100, unit: '65g', image: 'https://img.com/lays.png', vendorId: 'VND-101' },
        quantity: 3
      }
    ];

    const mapped = cart.map((i) => {
      const p = i.product;
      return {
        product: p._id || p.id,
        id: p.id || p._id,
        name: p.name,
        price: Number(p.price || 0),
        quantity: Number(i.quantity || 1),
        unit: p.unit || '1 unit',
        image: p.image || '',
        vendorId: p.vendorId || 'VND-101'
      };
    });

    assert.equal(mapped.length, 1);
    assert.equal(mapped[0].name, 'Lays Classic');
    assert.equal(mapped[0].price, 100);
    assert.equal(mapped[0].quantity, 3);
    assert.equal(mapped[0].vendorId, 'VND-101');
  });
});
