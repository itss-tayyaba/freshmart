import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Cart & Coupon Business Logic', () => {
  // Helper for delivery calculation
  const calcDelivery = (subtotal) => (subtotal >= 1000 || subtotal === 0 ? 0 : 100);

  // Helper for coupon discount calculation
  const applyCoupon = (coupon, subtotal) => {
    if (!coupon) return { discount: 0, valid: true };
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return { discount: 0, valid: false, reason: `Minimum order of Rs. ${coupon.minOrder} required` };
    }
    if (coupon.discountType === 'percentage' || coupon.type === 'percentage') {
      const rate = Number(coupon.discountValue || coupon.discount || 0);
      const discount = Math.round((subtotal * rate) / 100);
      return { discount, valid: true };
    }
    if (coupon.discountType === 'fixed' || coupon.type === 'fixed' || coupon.type === 'flat') {
      const discount = Math.min(subtotal, Number(coupon.discountValue || coupon.discount || 0));
      return { discount, valid: true };
    }
    return { discount: 0, valid: true };
  };

  // Helper for final total calculation
  const calcTotal = (items, coupon) => {
    const subtotal = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
    const delivery = calcDelivery(subtotal);
    const couponResult = applyCoupon(coupon, subtotal);
    const discount = couponResult.valid ? couponResult.discount : 0;
    const total = Math.max(0, subtotal + delivery - discount);
    return { subtotal, delivery, discount, total, couponResult };
  };

  it('calculates subtotal correctly from multiple line items and quantities', () => {
    const items = [
      { id: '1', name: 'Farm Fresh Milk 1L', price: 250, quantity: 2 },
      { id: '2', name: 'Organic Brown Eggs', price: 320, quantity: 1 },
      { id: '3', name: 'Whole Wheat Bread', price: 180, quantity: 3 },
    ];
    // 250*2 + 320*1 + 180*3 = 500 + 320 + 540 = 1360
    const result = calcTotal(items, null);
    assert.equal(result.subtotal, 1360);
  });

  it('applies free delivery for orders of Rs. 1000 or greater', () => {
    const items = [{ id: '1', price: 1000, quantity: 1 }];
    const result = calcTotal(items, null);
    assert.equal(result.subtotal, 1000);
    assert.equal(result.delivery, 0);
    assert.equal(result.total, 1000);
  });

  it('charges Rs. 100 delivery fee for orders below Rs. 1000 threshold', () => {
    const items = [{ id: '1', price: 850, quantity: 1 }];
    const result = calcTotal(items, null);
    assert.equal(result.subtotal, 850);
    assert.equal(result.delivery, 100);
    assert.equal(result.total, 950);
  });

  it('charges 0 delivery fee for empty cart (Rs. 0 subtotal)', () => {
    const items = [];
    const result = calcTotal(items, null);
    assert.equal(result.subtotal, 0);
    assert.equal(result.delivery, 0);
    assert.equal(result.total, 0);
  });

  it('calculates percentage discount correctly (15% off)', () => {
    const items = [{ id: '1', price: 2000, quantity: 1 }];
    const coupon = { code: 'FRESH15', discountType: 'percentage', discountValue: 15, minOrder: 500 };
    const result = calcTotal(items, coupon);
    assert.equal(result.subtotal, 2000);
    assert.equal(result.couponResult.valid, true);
    assert.equal(result.discount, 300); // 15% of 2000 = 300
    assert.equal(result.delivery, 0);
    assert.equal(result.total, 1700); // 2000 + 0 - 300 = 1700
  });

  it('calculates fixed discount correctly (Rs. 150 off)', () => {
    const items = [{ id: '1', price: 800, quantity: 1 }];
    const coupon = { code: 'SAVE150', discountType: 'fixed', discountValue: 150, minOrder: 500 };
    const result = calcTotal(items, coupon);
    assert.equal(result.subtotal, 800);
    assert.equal(result.delivery, 100); // under 1000
    assert.equal(result.discount, 150);
    assert.equal(result.total, 750); // 800 + 100 - 150 = 750
  });

  it('rejects coupon when cart subtotal is below minimum order requirement', () => {
    const items = [{ id: '1', price: 400, quantity: 1 }];
    const coupon = { code: 'VIP200', discountType: 'fixed', discountValue: 200, minOrder: 1000 };
    const result = calcTotal(items, coupon);
    assert.equal(result.subtotal, 400);
    assert.equal(result.couponResult.valid, false);
    assert.equal(result.discount, 0);
    assert.equal(result.delivery, 100);
    assert.equal(result.total, 500); // 400 + 100 - 0 = 500
  });

  it('ensures final total never drops below 0 even with large discount', () => {
    const items = [{ id: '1', price: 100, quantity: 1 }];
    const coupon = { code: 'BIGDISCOUNT', discountType: 'fixed', discountValue: 500, minOrder: 50 };
    const result = calcTotal(items, coupon);
    assert.equal(result.total >= 0, true);
  });
});
