import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

import {
  findAvailableRetailers,
  SEARCH_STEPS_KM,
  PROGRESSIVE_SEARCH_STAGES,
  calculatePointDistanceKm
} from '../src/utils/distanceCalculator.js';

import {
  executeProgressiveSearch,
  persistDeliverySearch
} from '../server/controllers/deliveryEligibilityController.js';

import {
  getAllZonesMerged
} from '../server/controllers/zoneController.js';

import {
  getAllAssignmentsMerged
} from '../server/controllers/assignmentController.js';

describe('Progressive Delivery Search Pipeline (0 km → 2 km → 3 km → Fallback)', () => {
  // Test Mock Data
  const mockZoneCoordinates = [
    [73.072, 31.432],
    [73.120, 31.432],
    [73.120, 31.385],
    [73.072, 31.385],
    [73.072, 31.432]
  ];

  const mockZone = {
    zoneId: 'ZONE-TEST-CENTRAL',
    _id: 'ZONE-TEST-CENTRAL',
    name: 'Test Central Delivery Zone',
    city: 'Faisalabad',
    isActive: true,
    status: 'active',
    geometry: {
      type: 'Polygon',
      coordinates: [mockZoneCoordinates]
    }
  };

  const mockStoreInsideZone = {
    id: 'store_test_001',
    storeId: 'store_test_001',
    name: 'Supermarket Central Branch',
    tenantId: 'tenant-alfatah',
    city: 'Faisalabad',
    latitude: 31.4125,
    longitude: 73.0995,
    deliveryRadiusKm: 5,
    assignedZoneId: 'ZONE-TEST-CENTRAL',
    isActive: true,
    status: 'active'
  };

  const mockStoreOutsideZoneNearby = {
    id: 'store_test_002',
    storeId: 'store_test_002',
    name: 'Express Mini Branch',
    tenantId: 'tenant-unimart',
    city: 'Faisalabad',
    latitude: 31.4450,
    longitude: 73.1350,
    deliveryRadiusKm: 2.5,
    assignedZoneId: null,
    isActive: true,
    status: 'active'
  };

  it('Stage 1 — Exact Location (0 km): Customer inside active delivery zone', () => {
    // Center of mock zone: [31.4085, 73.096]
    const customerCoords = { lat: 31.4085, lng: 73.0960 };

    const result = findAvailableRetailers(
      customerCoords,
      [mockStoreInsideZone, mockStoreOutsideZoneNearby],
      { zones: [mockZone] }
    );

    assert.equal(result.searchStage, 1, 'Should resolve at Stage 1');
    assert.equal(result.stageKey, 'zone_match', 'Stage key must be zone_match');
    assert.equal(result.searchRadiusKm, 0, 'Radius at Stage 1 must strictly be 0 km');
    assert.equal(result.isDeliverable, true, 'Delivery must be available');
    assert.ok(result.eligibleRetailers.length > 0, 'Must return at least 1 eligible retailer');
    assert.equal(result.eligibleRetailers[0].bestBranch.assignedZoneId, 'ZONE-TEST-CENTRAL');
  });

  it('Stage 2 — Nearby Branch (2 km): Customer outside zone but within 2 km of eligible branch', () => {
    // Point ~1.2 km away from mockStoreOutsideZoneNearby (31.4450, 73.1350), outside mockZone
    const customerCoords = { lat: 31.4520, lng: 73.1420 };
    const dist = calculatePointDistanceKm(
      customerCoords.lat,
      customerCoords.lng,
      mockStoreOutsideZoneNearby.latitude,
      mockStoreOutsideZoneNearby.longitude
    );
    assert.ok(dist <= 2.0, `Distance should be <= 2km (was ${dist.toFixed(2)} km)`);

    // Ensure not in mockZone
    const result = findAvailableRetailers(
      customerCoords,
      [mockStoreOutsideZoneNearby],
      { zones: [mockZone] }
    );

    assert.equal(result.searchStage, 2, 'Should expand and resolve at Stage 2');
    assert.equal(result.stageKey, '2km_expansion', 'Stage key must be 2km_expansion');
    assert.equal(result.searchRadiusKm, 2, 'Search radius must be 2 km');
    assert.equal(result.isDeliverable, true, 'Delivery must be available at Stage 2');
    assert.ok(result.eligibleRetailers.length > 0, 'Must find eligible nearby branch');
  });

  it('Stage 3 — Extended Search (3 km): Customer outside 2 km but within 3 km of eligible branch', () => {
    // Point ~2.4 km away from mockStoreOutsideZoneNearby
    const customerCoords = { lat: 31.4630, lng: 73.1480 };
    const dist = calculatePointDistanceKm(
      customerCoords.lat,
      customerCoords.lng,
      mockStoreOutsideZoneNearby.latitude,
      mockStoreOutsideZoneNearby.longitude
    );
    assert.ok(dist > 2.0 && dist <= 3.0, `Distance should be > 2km and <= 3km (was ${dist.toFixed(2)} km)`);

    // Give store enough radius so it is allowed to deliver at 2.4 km
    const branchWith3KmRadius = {
      ...mockStoreOutsideZoneNearby,
      deliveryRadiusKm: 4.0
    };

    const result = findAvailableRetailers(
      customerCoords,
      [branchWith3KmRadius],
      { zones: [mockZone] }
    );

    assert.equal(result.searchStage, 3, 'Should expand and resolve at Stage 3');
    assert.equal(result.stageKey, '3km_expansion', 'Stage key must be 3km_expansion');
    assert.equal(result.searchRadiusKm, 3, 'Search radius must be 3 km');
    assert.equal(result.isDeliverable, true, 'Delivery must be available at Stage 3');
  });

  it('Delivery Eligibility Rule: 2 km / 3 km searches do NOT bypass store delivery eligibility', () => {
    // Customer is 1.5 km away from branch, but store's configured delivery radius is only 1.0 km
    const customerCoords = { lat: 31.4540, lng: 73.1430 };
    const dist = calculatePointDistanceKm(
      customerCoords.lat,
      customerCoords.lng,
      mockStoreOutsideZoneNearby.latitude,
      mockStoreOutsideZoneNearby.longitude
    );
    assert.ok(dist <= 2.0, 'Customer is physically within 2km');

    const restrictedStore = {
      ...mockStoreOutsideZoneNearby,
      deliveryRadiusKm: 0.8 // Restricted delivery radius!
    };

    const result = findAvailableRetailers(
      customerCoords,
      [restrictedStore],
      { zones: [mockZone] }
    );

    // Because store's delivery radius does not reach the customer, it cannot deliver!
    assert.equal(result.isDeliverable, false, 'Store cannot deliver when customer is outside its delivery radius');
    assert.equal(result.searchStage, 4, 'Should fall back to Stage 4');
    assert.equal(result.outsideDeliveryCoverage, true, 'Outside delivery coverage flag must be set');
  });

  it('Stage 4 — Beyond 3 km: Returns nearest branch as alternative with NO delivery promise', () => {
    // Point 10 km away in rural outskirts
    const customerCoords = { lat: 31.3000, lng: 73.0000 };

    const result = findAvailableRetailers(
      customerCoords,
      [mockStoreInsideZone, mockStoreOutsideZoneNearby],
      { zones: [mockZone] }
    );

    assert.equal(result.searchStage, 4, 'Must fall back to Stage 4');
    assert.equal(result.stageKey, 'beyond_3km_fallback', 'Stage key must be beyond_3km_fallback');
    assert.equal(result.isDeliverable, false, 'Delivery must be unavailable');
    assert.equal(result.outsideDeliveryCoverage, true, 'Must indicate outside delivery coverage');
    assert.ok(result.alternativeStore, 'Must return alternativeStore');
    assert.equal(result.alternativeStore.isEligibleForDelivery, false, 'Alternative store must not promise delivery');
    assert.ok(result.alternativeStore.deliveryNotice.includes('Outside delivery coverage'), 'Must show pickup/browsing notice');
  });

  it('Backend executeProgressiveSearch executes all 4 stages consistently', async () => {
    const zones = await getAllZonesMerged();
    const assignments = await getAllAssignmentsMerged();

    // 1. D-Ground commercial point (inside FSD Central Blue zone)
    const insideCoords = { lat: 31.4125, lng: 73.0995 };
    const resInside = await executeProgressiveSearch({
      latitude: insideCoords.lat,
      longitude: insideCoords.lng,
      zones,
      assignments
    });
    assert.equal(resInside.searchStage, 1, 'D-Ground must resolve at Stage 1');
    assert.equal(resInside.stageKey, 'zone_match');
    assert.equal(resInside.isDeliverable, true);

    // 2. Far outskirts point (15 km away)
    const farCoords = { lat: 31.2000, lng: 72.8500 };
    const resFar = await executeProgressiveSearch({
      latitude: farCoords.lat,
      longitude: farCoords.lng,
      zones,
      assignments
    });
    assert.equal(resFar.searchStage, 4, 'Far coordinates must resolve at Stage 4');
    assert.equal(resFar.stageKey, 'beyond_3km_fallback');
    assert.equal(resFar.isDeliverable, false);
    assert.equal(resFar.outsideDeliveryCoverage, true);
    assert.ok(resFar.alternativeStore, 'Should return alternativeStore');
  });

  it('Backend persistDeliverySearch writes search log to database/disk', async () => {
    const logData = {
      latitude: 31.4125,
      longitude: 73.0995,
      address: 'D-Ground Commercial Test',
      city: 'Faisalabad',
      searchStage: 1,
      stageKey: 'zone_match',
      searchRadiusKm: 0,
      isDeliverable: true,
      eligibleStoresCount: 3,
      eligibleStores: [{ storeId: 'STR-TEST-01', name: 'Test Store' }],
      clientIp: '127.0.0.1'
    };

    const savedLog = await persistDeliverySearch(logData);
    assert.ok(savedLog, 'Log record must be returned');
    assert.equal(savedLog.searchStage, 1);
    assert.equal(savedLog.isDeliverable, true);

    // Verify disk fallback file exists and contains the log
    const diskPath = path.resolve('server/data/delivery_search_logs.json');
    assert.ok(fs.existsSync(diskPath), 'Disk search logs file must exist');
    const logs = JSON.parse(fs.readFileSync(diskPath, 'utf-8'));
    assert.ok(Array.isArray(logs), 'Search logs must be an array');
    const found = logs.find((l) => l.address === 'D-Ground Commercial Test');
    assert.ok(found, 'Log entry must be persisted on disk');
  });
});
