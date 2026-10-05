import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { calculateDistanceKm, findNearestCity, PAKISTAN_CITIES } from '../src/data/pakistanLocations.js';
import { INITIAL_TENANTS } from '../src/data/tenantData.js';
import { BRANCHES, resolveTenantId } from '../src/data/companyHierarchyData.js';

describe('Customer Location → Nearby Supermarkets & Branch Routing Pipeline', () => {

  const FAISALABAD_COORDS = { lat: 31.4125, lng: 73.0995 }; // D-Ground Peoples Colony

  // Re-usable helper mimicking getNearbyStores logic
  const calculateNearbyStores = (userCoords) => {
    return INITIAL_TENANTS.map((tenant) => {
      const canonicalId = resolveTenantId(tenant.id);
      const tenantBranches = BRANCHES.filter((b) => b.tenantId === canonicalId);

      let nearestBranch = tenantBranches[0];
      let minDistance = Infinity;

      for (const branch of tenantBranches) {
        const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, branch.latitude, branch.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearestBranch = branch;
        }
      }

      return {
        tenantId: tenant.id,
        name: tenant.name,
        nearestBranch,
        distanceKm: Number(minDistance.toFixed(1)),
        isDeliverable: minDistance <= 35
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  };

  it('1. Accurately calculates proximity from customer location in Faisalabad', () => {
    const nearby = calculateNearbyStores(FAISALABAD_COORDS);

    assert.equal(nearby.length, 4, 'Should return all 4 major supermarket brands');

    // Find each store
    const alFatah = nearby.find((s) => s.tenantId === 'tenant-alfatah');
    const chaseUp = nearby.find((s) => s.tenantId === 'tenant-chaseup');
    const chaseValue = nearby.find((s) => s.tenantId === 'tenant-chasevalue');
    const unimaart = nearby.find((s) => s.tenantId === 'tenant-freshmart');

    assert.ok(alFatah, 'Al-Fatah must be present in nearby stores');
    assert.ok(chaseUp, 'Chase Up must be present in nearby stores');
    assert.ok(chaseValue, 'Chase Value must be present in nearby stores');
    assert.ok(unimaart, 'Unimaart must be present in nearby stores');

    // Exact proximity matching user specification
    assert.equal(alFatah.distanceKm, 1.2, 'Al-Fatah must be ~1.2 km away from D-Ground Faisalabad');
    assert.equal(chaseUp.distanceKm, 1.5, 'Chase Up must be ~1.5 km away from D-Ground Faisalabad');
    assert.equal(chaseValue.distanceKm, 2.0, 'Chase Value must be ~2.0 km away from D-Ground Faisalabad');
    assert.equal(unimaart.distanceKm, 0.8, 'Unimaart must be ~0.8 km away from D-Ground Faisalabad');
  });

  it('2. Correctly flags all nearby stores as Deliverable within express zone (< 35km)', () => {
    const nearby = calculateNearbyStores(FAISALABAD_COORDS);
    for (const store of nearby) {
      assert.equal(store.isDeliverable, true, `${store.name} must be deliverable`);
      assert.ok(store.nearestBranch, `${store.name} must have an assigned nearest branch`);
      assert.equal(store.nearestBranch.city, 'Faisalabad', `${store.name} branch must be in Faisalabad`);
    }
  });

  it('3. Recalculates store proximity when customer changes location to Lahore', () => {
    const LAHORE_GULBERG = { lat: 31.5204, lng: 74.3587 };
    const nearbyLhr = calculateNearbyStores(LAHORE_GULBERG);

    const alFatahLhr = nearbyLhr.find((s) => s.tenantId === 'tenant-alfatah');
    assert.ok(alFatahLhr, 'Al-Fatah should be available in Lahore');
    assert.ok(alFatahLhr.distanceKm < 2.0, 'Al-Fatah Gulberg Mall branch must be within 2km of Gulberg');
    assert.equal(alFatahLhr.nearestBranch.city, 'Lahore');
  });

  it('4. GPS findNearestCity identifies Faisalabad from coordinates', () => {
    const res = findNearestCity(FAISALABAD_COORDS.lat, FAISALABAD_COORDS.lng);
    assert.ok(res.city.city.includes('Faisalabad'));
    assert.ok(res.distanceKm < 1.0);
  });
});
