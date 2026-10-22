import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findNearestStore, riderServesArea } from '../src/utils/storeRouting.js';

describe('Store and rider area routing', () => {
  it('selects the closest configured branch for customer coordinates', () => {
    assert.equal(findNearestStore({ lat: 31.4697, lng: 74.2728 }, 'Lahore, Pakistan').id, 'store-1');
    assert.equal(findNearestStore({ lat: 31.5204, lng: 74.3587 }, 'Lahore, Pakistan').id, 'store-2');
  });

  it('does not route locations in cities without a configured physical branch', () => {
    assert.equal(findNearestStore({ lat: 24.8607, lng: 67.0011 }, 'Karachi, Pakistan'), null);
  });

  it('matches service zones and rejects unrelated delivery areas', () => {
    assert.equal(riderServesArea('Johar Town / Model Town', 'Johar Town'), true);
    assert.equal(riderServesArea('DHA Phase 5 & 6', 'DHA Phase 5'), true);
    assert.equal(riderServesArea('Gulberg / Main Hub', 'Johar Town'), false);
  });
});
