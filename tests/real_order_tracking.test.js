import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceKm,
  calculateEtaMinutes,
  resolveDestinationCoords,
  resolveHubCoords,
  buildDynamicTimeline,
  trackOrder,
  assignRiderToOrder,
  updateRiderLocation
} from '../server/controllers/orderController.js';
import { ADMIN_ORDERS_FULL } from '../src/data/adminSuiteData.js';

describe('Production Real Order Tracking & GPS Telemetry Pipeline', () => {
  it('computes accurate Haversine distance and dynamic ETA in minutes', () => {
    // Distance between Gulberg SuperHub (31.5150, 74.3450) and Johar Town (31.4697, 74.2728)
    const dist = calculateDistanceKm(31.5150, 74.3450, 31.4697, 74.2728);
    assert.ok(dist > 5 && dist < 12, `Distance should be ~8.5km, got ${dist}km`);

    const eta = calculateEtaMinutes(dist);
    assert.ok(eta >= 15 && eta <= 30, `ETA should be between 15 and 30 mins, got ${eta} mins`);

    // Proximity doorstep delivery (< 0.2km)
    const doorstepDist = calculateDistanceKm(31.5150, 74.3450, 31.5151, 74.3451);
    const doorstepEta = calculateEtaMinutes(doorstepDist);
    assert.equal(doorstepEta, 2, 'Doorstep ETA should be 2 mins');
  });

  it('resolves real destination coordinates for Pakistani delivery locations', () => {
    const joharCoords = resolveDestinationCoords({ address: 'House 42, Block G-3, Johar Town', city: 'Lahore, Pakistan' });
    assert.equal(joharCoords.lat, 31.4697);
    assert.equal(joharCoords.lng, 74.2728);

    const cliftonCoords = resolveDestinationCoords({ address: 'Flat 4B, Block 4, Clifton', city: 'Karachi, Pakistan' });
    assert.equal(cliftonCoords.lat, 24.8270);
    assert.equal(cliftonCoords.lng, 67.0251);

    const f7Coords = resolveDestinationCoords({ address: 'House 12, Street 5, Sector F-7/2', city: 'Islamabad, Pakistan' });
    assert.equal(f7Coords.lat, 33.7215);
    assert.equal(f7Coords.lng, 73.0565);
  });

  it('resolves correct Dark Store SuperHub for fulfillment cities', () => {
    const lhrHub = resolveHubCoords('Lahore, Pakistan');
    assert.equal(lhrHub.lat, 31.5150);
    assert.equal(lhrHub.lng, 74.3450);

    const khiHub = resolveHubCoords('Karachi, Pakistan');
    assert.equal(khiHub.lat, 24.8190);
    assert.equal(khiHub.lng, 67.0320);
  });

  it('builds authentic chronological timeline matching real order status', () => {
    const unassignedOrder = {
      orderId: 'ORD-TEST-001',
      status: 'Confirmed',
      paymentMethod: 'Cash on Delivery',
      createdAt: new Date(),
      assignedRider: null
    };

    const tl1 = buildDynamicTimeline(unassignedOrder);
    assert.equal(tl1[0].completed, true, 'Order Confirmed should be completed');
    assert.equal(tl1[1].completed, false, 'Packing not yet complete for Confirmed');
    assert.equal(tl1[2].completed, false, 'Dispatch pending rider assignment');
    assert.ok(tl1[2].desc.includes('Dispatch team is reviewing'));

    const outForDeliveryOrder = {
      orderId: 'ORD-TEST-002',
      status: 'Out for Delivery',
      paymentMethod: 'JazzCash',
      createdAt: new Date(),
      assignedRider: {
        name: 'Usman Tariq',
        vehicle: '🏍️ Honda 125 (LEK-8921)',
        eta: '14 mins'
      }
    };

    const tl2 = buildDynamicTimeline(outForDeliveryOrder);
    assert.equal(tl2[0].completed, true);
    assert.equal(tl2[1].completed, true);
    assert.equal(tl2[2].completed, true);
    assert.equal(tl2[3].completed, false);
    assert.ok(tl2[2].desc.includes('Usman Tariq'));
  });

  it('returns HTTP 404 for non-existent orders without fake fallback data', async () => {
    let statusCode = 200;
    let jsonResponse = null;

    const mockReq = { params: { orderId: 'NON_EXISTENT_ORDER_99999' } };
    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
        return this;
      }
    };

    await trackOrder(mockReq, mockRes);
    assert.equal(statusCode, 404, 'Non-existent order should return 404 status code');
    assert.equal(jsonResponse.success, false);
    assert.ok(jsonResponse.message.includes('not found'), 'Response should state order was not found');
  });

  it('assigns real rider, attaches coordinates, and updates order timeline', async () => {
    const testOrderId = 'ORD-REAL-101';
    ADMIN_ORDERS_FULL.unshift({
      id: testOrderId,
      orderId: testOrderId,
      customerName: 'Sana Malik',
      address: 'House 18, Block G, Johar Town, Lahore',
      city: 'Lahore, Pakistan',
      status: 'Confirmed',
      assignedRider: null
    });

    let assignResponse = null;
    const mockReq = {
      params: { id: testOrderId },
      body: {
        rider: {
          id: 'RDR-501',
          name: 'Hamza Farooq',
          phone: '+92 302 9876543',
          vehicle: 'Yamaha YBR 125',
          zone: 'Lahore Hub',
          coordinates: { lat: 31.5150, lng: 74.3450 }
        }
      }
    };
    const mockRes = {
      status() { return this; },
      json(data) {
        assignResponse = data;
        return this;
      }
    };

    await assignRiderToOrder(mockReq, mockRes);
    assert.equal(assignResponse.success, true);
    assert.equal(assignResponse.order.assignedRider.name, 'Hamza Farooq');
    assert.equal(assignResponse.order.status, 'Out for Delivery');
    assert.ok(assignResponse.order.assignedRider.etaMinutes > 0);

    // Verify live location update
    let locResponse = null;
    const locReq = {
      params: { id: testOrderId },
      body: { lat: 31.4800, lng: 74.2900 }
    };
    const locRes = {
      status() { return this; },
      json(data) {
        locResponse = data;
        return this;
      }
    };

    await updateRiderLocation(locReq, locRes);
    assert.equal(locResponse.success, true);
    assert.equal(locResponse.order.assignedRider.coordinates.lat, 31.4800);
    assert.equal(locResponse.order.assignedRider.coordinates.lng, 74.2900);
  });
});
