import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDeliveryPolygonAreaKm2,
  calculateDeliveryZoneReachKm
} from '../src/utils/deliveryZoneMetrics.js';

describe('delivery zone coverage metrics', () => {
  it('calculates polygon coverage area in square kilometers', () => {
    const area = calculateDeliveryPolygonAreaKm2([
      [0, 0],
      [0, 0.01],
      [0.01, 0.01],
      [0.01, 0]
    ]);

    assert.ok(area > 1.2 && area < 1.3);
  });

  it('accepts a closed polygon ring without double-counting its closing point', () => {
    const openRing = [[0, 0], [0, 0.01], [0.01, 0.01], [0.01, 0]];
    const closedRing = [...openRing, openRing[0]];

    assert.equal(
      calculateDeliveryPolygonAreaKm2(openRing),
      calculateDeliveryPolygonAreaKm2(closedRing)
    );
  });

  it('returns null when the store does not have a valid polygon', () => {
    assert.equal(calculateDeliveryPolygonAreaKm2([]), null);
    assert.equal(calculateDeliveryPolygonAreaKm2([[0, 0], [1, 1]]), null);
    assert.equal(calculateDeliveryPolygonAreaKm2([[0, 0], [0, 0], [1, 1]]), null);
    assert.equal(calculateDeliveryPolygonAreaKm2([[0, 0], [0, 181], [1, 1]]), null);
  });

  it('calculates the farthest polygon boundary distance from the store pin', () => {
    const reachKm = calculateDeliveryZoneReachKm(
      [[0, 0.01], [0.01, 0], [0, -0.01], [-0.01, 0]],
      { latitude: 0, longitude: 0 }
    );

    assert.ok(reachKm > 1.1 && reachKm < 1.2);
  });
});
