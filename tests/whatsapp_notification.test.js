import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeWhatsAppPhone,
  formatOrderItemsSummary,
  buildWhatsAppDeliveryMessage,
  buildWhatsAppEnRouteMessage,
  getWhatsAppDeliveryLink,
  getWhatsAppEnRouteLink,
  getWhatsAppOrderStatusLink
} from '../src/utils/whatsappHelper.js';

test('WhatsApp Notification Suite - Phone Number Normalizer', async (t) => {
  await t.test('converts local Pakistani 03xx format to international 923xx', () => {
    assert.equal(normalizeWhatsAppPhone('03206551696'), '923206551696');
    assert.equal(normalizeWhatsAppPhone('03001234567'), '923001234567');
  });

  await t.test('strips spaces, dashes, parentheses and plus signs', () => {
    assert.equal(normalizeWhatsAppPhone('+92 320-6551696'), '923206551696');
    assert.equal(normalizeWhatsAppPhone('(0320) 655 1696'), '923206551696');
  });

  await t.test('handles 10-digit format starting with 3', () => {
    assert.equal(normalizeWhatsAppPhone('3206551696'), '923206551696');
  });

  await t.test('handles international 0092 format', () => {
    assert.equal(normalizeWhatsAppPhone('00923206551696'), '923206551696');
  });

  await t.test('returns safe fallback for invalid or empty phone inputs', () => {
    assert.equal(normalizeWhatsAppPhone(''), '923206551696');
    assert.equal(normalizeWhatsAppPhone(null), '923206551696');
    assert.equal(normalizeWhatsAppPhone('123'), '923206551696');
  });
});

test('WhatsApp Notification Suite - Delivery Message Builder', async (t) => {
  const dummyOrder = {
    id: '#ORD-8821',
    orderId: 'ORD-8821',
    customerName: 'Ahmad Raza',
    customerPhone: '0320-1122334',
    totalAmount: 2450,
    paymentMethod: 'Cash on Delivery',
    address: 'House 42, Street 7, Peoples Colony No. 1, Faisalabad',
    itemsList: [
      { name: 'Fresh Farm Milk 1L', quantity: 2 },
      { name: 'Dawn Whole Wheat Bread', quantity: 1 }
    ]
  };

  const dummyRider = {
    name: 'Muhammad Ali',
    vehicleNumber: 'FD-18-9941',
    vehicleType: 'Honda CD 70'
  };

  await t.test('builds formatted delivery confirmation receipt with all required elements', () => {
    const msg = buildWhatsAppDeliveryMessage(dummyOrder, dummyRider, 'Handed directly to recipient');
    
    assert.ok(msg.includes('FreshMart - Delivery Confirmed'));
    assert.ok(msg.includes('Ahmad Raza'));
    assert.ok(msg.includes('ORD-8821'));
    assert.ok(msg.includes('Rs. 2,450'));
    assert.ok(msg.includes('Muhammad Ali'));
    assert.ok(msg.includes('Fresh Farm Milk 1L (x2)'));
    assert.ok(msg.includes('Dawn Whole Wheat Bread (x1)'));
    assert.ok(msg.includes('Handed directly to recipient'));
  });

  await t.test('generates valid wa.me URL with encoded delivery receipt', () => {
    const link = getWhatsAppDeliveryLink(dummyOrder, dummyRider);
    
    assert.ok(link.startsWith('https://wa.me/923201122334?text='));
    assert.ok(link.includes(encodeURIComponent('FreshMart - Delivery Confirmed')));
    assert.ok(link.includes(encodeURIComponent('ORD-8821')));
  });
});

test('WhatsApp Notification Suite - En-Route Transit Message Builder', async (t) => {
  const transitOrder = {
    id: 'ORD-5544',
    customerName: 'Fatima Zahra',
    customerPhone: '0300 9876543',
    deliveryOtp: '8832',
    address: 'Kohinoor City, Jaranwala Road, Faisalabad'
  };

  const dummyRider = {
    name: 'Tariq Mehmood',
    vehicleNumber: 'FD-2022'
  };

  await t.test('builds en-route courier arrival message with customer PIN', () => {
    const msg = buildWhatsAppEnRouteMessage(transitOrder, dummyRider);
    
    assert.ok(msg.includes('FreshMart - Order In Transit'));
    assert.ok(msg.includes('Fatima Zahra'));
    assert.ok(msg.includes('Tariq Mehmood'));
    assert.ok(msg.includes('8832'));
    assert.ok(msg.includes('Kohinoor City'));
  });

  await t.test('generates valid wa.me en-route URL', () => {
    const link = getWhatsAppEnRouteLink(transitOrder, dummyRider);
    
    assert.ok(link.startsWith('https://wa.me/923009876543?text='));
    assert.ok(link.includes(encodeURIComponent('FreshMart - Order In Transit')));
  });
});
