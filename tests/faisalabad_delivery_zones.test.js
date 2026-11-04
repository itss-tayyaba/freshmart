import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateHaversineDistanceKm,
  calculateRoadDistanceKm,
  isPointInPolygon,
  calculateBranchDeliveryFee,
  estimateDeliveryTime,
  findAvailableRetailers,
  SEARCH_STEPS_KM
} from '../server/utils/deliveryZoneHelper.js';

import {
  calculateHaversineDistanceKm as clientHaversine,
  calculateRoadDistanceKm as clientRoad,
  findAvailableRetailers as clientFindAvailable
} from '../src/utils/distanceCalculator.js';

import { BRANCHES, COMPANIES, resolveTenantId } from '../src/data/companyHierarchyData.js';
import { loadDiskBranches } from '../server/controllers/companyBranchController.js';

describe('Dynamic Multi-Retailer Delivery Zones – Faisalabad Verification Suite', () => {

  // Faisalabad authentic reference points
  const D_GROUND_COORDS = { lat: 31.4125, lng: 73.0995 };
  const GHANTA_GHAR_COORDS = { lat: 31.4187, lng: 73.0791 };
  const OUTSKIRTS_COORDS = { lat: 31.3200, lng: 72.9800 }; // ~14 km away

  it('1. Four supermarket tenants are configured for Faisalabad with genuine coordinates', () => {
    const diskBranches = loadDiskBranches();
    const allBranches = [...BRANCHES, ...diskBranches];

    const requiredTenants = [
      'company_001', // Al-Fatah
      'company_002', // Chase Up
      'company_003', // Chase Value / CaseValue
      'company_004'  // FreshMart / Unimaart
    ];

    for (const tenantId of requiredTenants) {
      const branches = allBranches.filter(
        (b) => b.tenantId === tenantId || resolveTenantId(b.tenantId) === tenantId
      );
      assert.ok(branches.length > 0, `Tenant ${tenantId} must have registered branches`);

      const fsdBranch = branches.find((b) => b.city === 'Faisalabad');
      assert.ok(fsdBranch, `Tenant ${tenantId} must have an active branch in Faisalabad`);
      assert.ok(fsdBranch.latitude >= 31.3 && fsdBranch.latitude <= 31.5, 'Must have authentic Faisalabad latitude');
      assert.ok(fsdBranch.longitude >= 73.0 && fsdBranch.longitude <= 73.2, 'Must have authentic Faisalabad longitude');
      assert.ok(
        (fsdBranch.deliveryRadiusKm || fsdBranch.deliveryRadius) >= 2.5 &&
        (fsdBranch.deliveryRadiusKm || fsdBranch.deliveryRadius) <= 5.5,
        'Configured delivery radius must be between 2.5 and 5.5 km'
      );
    }
  });

  it('2. Multiple branches can be configured per retailer with distinct coordinates and zones', () => {
    const diskBranches = loadDiskBranches();
    const seen = new Set();
    const uniqueBranches = [];
    for (const b of [...BRANCHES, ...diskBranches]) {
      const id = b._id || b.id;
      if (!seen.has(id)) {
        seen.add(id);
        uniqueBranches.push(b);
      }
    }

    // Check Al-Fatah has at least 2 branches in Faisalabad
    const afBranches = uniqueBranches.filter(
      (b) => (b.tenantId === 'company_001' || b.tenantId === 'tenant-alfatah') && b.city === 'Faisalabad'
    );
    assert.ok(afBranches.length >= 2, 'Al-Fatah must support multiple branches in Faisalabad');

    // Distinct GPS coordinates
    const coordsSet = new Set(afBranches.map((b) => `${b.latitude},${b.longitude}`));
    assert.equal(coordsSet.size, afBranches.length, 'Each branch must have its own distinct coordinates');
  });

  it('3. Accurate Haversine and road distance calculation (1.22x urban curvature factor)', () => {
    const lat1 = 31.4125;
    const lon1 = 73.0995;
    const lat2 = 31.4015;
    const lon2 = 73.0830;

    const straightLine = calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);
    assert.ok(straightLine > 0 && straightLine < 5, 'Haversine distance must be reasonable');

    const roadDist = calculateRoadDistanceKm(lat1, lon1, lat2, lon2, 1.22);
    assert.ok(roadDist > straightLine, 'Road distance with 1.22x curvature must be greater than straight line');
    assert.equal(Number((straightLine * 1.22).toFixed(2)), roadDist);

    // Client-side utility matches server-side utility exactly
    const clientDist = clientHaversine(lat1, lon1, lat2, lon2);
    assert.equal(clientDist, straightLine);
  });

  it('4. Overlapping Delivery Zones: returns ALL eligible retailers when customer is in multiple zones', () => {
    const diskBranches = loadDiskBranches();
    const allBranches = [...BRANCHES, ...diskBranches];

    const result = findAvailableRetailers(D_GROUND_COORDS, allBranches, { maxSearchRadiusKm: 10 });

    assert.ok(result.eligibleRetailers.length >= 2, 'Must return multiple overlapping eligible retailers');
    assert.equal(result.hasOverlappingZones, true, 'hasOverlappingZones flag must be true');

    // Customer can see all eligible retailers, not just a single nearest one
    const tenantIds = result.eligibleRetailers.map((r) => r.tenantId);
    assert.ok(tenantIds.length >= 2, 'At least 2 retailers must be deliverable to D-Ground');
  });

  it('5. Progressive Search Expansion: expands from 5km to 10km to 15km if no store is within 5km', () => {
    // Branch located ~18 km away from customer
    const mockFarBranches = [
      {
        _id: 'branch_far_01',
        tenantId: 'company_001',
        name: 'Far Branch',
        latitude: 31.3000,
        longitude: 72.9500,
        deliveryRadiusKm: 25, // explicitly delivers up to 25 km
        deliveryStatus: 'active'
      }
    ];

    const result = findAvailableRetailers(D_GROUND_COORDS, mockFarBranches, { maxSearchRadiusKm: 25 });

    // Should have expanded past 5 km, 10 km, and 15 km to reach 20 km
    assert.ok(result.searchRadiusKm >= 15, `Search must have expanded (got ${result.searchRadiusKm} km)`);
    assert.ok(result.searchStepsTaken.includes(5), 'Search must have evaluated 5 km step');
    assert.ok(result.searchStepsTaken.includes(10), 'Search must have evaluated 10 km step');
    assert.ok(result.eligibleRetailers.length > 0, 'Found branch after progressive expansion');
  });

  it('6. Progressive search expansion does NOT make out-of-zone retailers eligible for delivery', () => {
    // Branch located 8 km away, but its delivery radius is only 5 km
    const mockRestrictedBranch = [
      {
        _id: 'branch_restricted',
        tenantId: 'company_002',
        name: 'Strict 5km Branch',
        latitude: 31.4125 + 0.07, // ~7.8 km away
        longitude: 73.0995,
        deliveryRadiusKm: 5, // Branch ONLY delivers up to 5 km
        deliveryStatus: 'active'
      }
    ];

    const result = findAvailableRetailers(D_GROUND_COORDS, mockRestrictedBranch, { maxSearchRadiusKm: 15 });

    // The retailer is discovered in search, but must NOT be marked eligible for delivery
    assert.equal(result.eligibleRetailers.length, 0, 'Must NOT be eligible for delivery');
    assert.equal(result.unavailableRetailers.length, 1, 'Must be categorized under unavailableRetailers');
    assert.equal(result.unavailableRetailers[0].isEligible, false);
    assert.ok(result.unavailableRetailers[0].reason.includes('delivery zone'));
  });

  it('7. Delivery fee calculation correctly maps distance to branch fee tiers', () => {
    const branchWithTiers = {
      deliveryTiers: [
        { distanceKm: 1, fee: 0 },
        { distanceKm: 2, fee: 40 },
        { distanceKm: 3, fee: 80 },
        { distanceKm: 5, fee: 120 }
      ]
    };

    assert.equal(calculateBranchDeliveryFee(branchWithTiers, 0.8), 0, 'Within 1 km must be free (Rs. 0)');
    assert.equal(calculateBranchDeliveryFee(branchWithTiers, 1.5), 40, '1.5 km must be tier 2 (Rs. 40)');
    assert.equal(calculateBranchDeliveryFee(branchWithTiers, 2.7), 80, '2.7 km must be tier 3 (Rs. 80)');
    assert.equal(calculateBranchDeliveryFee(branchWithTiers, 4.2), 120, '4.2 km must be tier 5 (Rs. 120)');
    // Outside 5 km gets surcharge
    assert.equal(calculateBranchDeliveryFee(branchWithTiers, 6.0), 120 + 25, '6.0 km adds extra per km rate');
  });

  it('8. Polygon delivery boundary: isPointInPolygon detects inside and outside coordinates', () => {
    // Geofence square around D-Ground
    const polygon = [
      { lat: 31.4000, lng: 73.0800 },
      { lat: 31.4200, lng: 73.0800 },
      { lat: 31.4200, lng: 73.1100 },
      { lat: 31.4000, lng: 73.1100 }
    ];

    const insidePoint = { lat: 31.4100, lng: 73.0950 };
    const outsidePoint = { lat: 31.4500, lng: 73.1500 };

    assert.equal(isPointInPolygon(insidePoint, polygon), true, 'Point inside polygon must return true');
    assert.equal(isPointInPolygon(outsidePoint, polygon), false, 'Point outside polygon must return false');
  });

  it('9. Client-side distanceCalculator behaves identically to server helper', () => {
    const diskBranches = loadDiskBranches();
    const allBranches = [...BRANCHES, ...diskBranches];

    const serverResult = findAvailableRetailers(D_GROUND_COORDS, allBranches);
    const clientResult = clientFindAvailable(D_GROUND_COORDS, allBranches);

    assert.equal(serverResult.eligibleRetailers.length, clientResult.eligibleRetailers.length);
    assert.equal(serverResult.searchRadiusKm, clientResult.searchRadiusKm);
    assert.equal(serverResult.hasOverlappingZones, clientResult.hasOverlappingZones);
  });

  it('10. Delivery time estimation scales intuitively with distance', () => {
    assert.equal(estimateDeliveryTime(1.0), '10-20 mins');
    assert.equal(estimateDeliveryTime(2.5), '20-30 mins');
    assert.equal(estimateDeliveryTime(4.0), '30-45 mins');
    assert.equal(estimateDeliveryTime(8.0), '45-60 mins');
    assert.equal(estimateDeliveryTime(12.0), '60-80 mins');
    assert.equal(estimateDeliveryTime(20.0), '90+ mins');
  });

});
