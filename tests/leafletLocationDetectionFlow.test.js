import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { calculateDistanceKm, findNearestCity, PAKISTAN_CITIES } from '../src/data/pakistanLocations.js';
import { INITIAL_TENANTS } from '../src/data/tenantData.js';
import { BRANCHES, resolveTenantId } from '../src/data/companyHierarchyData.js';

describe('Leaflet GPS Map & Multi-Stage Location Detection Pipeline', () => {

  const USER_COORDS_FAISALABAD = { lat: 31.4125, lng: 73.0995 }; // D-Ground Peoples Colony
  const USER_COORDS_LAHORE_GULBERG = { lat: 31.5204, lng: 74.3587 }; // MM Alam Road Gulberg
  const USER_COORDS_KARACHI_CLIFTON = { lat: 24.8190, lng: 67.0320 }; // Clifton Marine Promenade

  // Haversine calculator mimicking Leaflet map and StoreContext logic
  const calculateRankedStores = (userCoords) => {
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
        branchName: nearestBranch?.name,
        branchCoords: { lat: nearestBranch?.latitude, lng: nearestBranch?.longitude },
        distanceKm: Number(minDistance.toFixed(1)),
        isDeliverable: minDistance <= 35
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  };

  it('1. Computes exact Haversine distance between customer coordinates and supermarket branches', () => {
    // Al-Fatah D-Ground branch (31.4147, 73.0872) from user (31.4125, 73.0995)
    const distAlFatah = calculateDistanceKm(31.4125, 73.0995, 31.4147, 73.0872);
    assert.equal(Number(distAlFatah.toFixed(1)), 1.2, 'Distance to Al-Fatah should be 1.2 km');

    // Chase Up Clock Tower branch (31.4187, 73.0855) from user (31.4125, 73.0995)
    const distChaseUp = calculateDistanceKm(31.4125, 73.0995, 31.4187, 73.0855);
    assert.equal(Number(distChaseUp.toFixed(1)), 1.5, 'Distance to Chase Up should be 1.5 km');

    // Chase Value Wholesale Hub (31.4215, 73.0815) from user (31.4125, 73.0995)
    const distChaseValue = calculateDistanceKm(31.4125, 73.0995, 31.4215, 73.0815);
    assert.equal(Number(distChaseValue.toFixed(1)), 2.0, 'Distance to Chase Value should be 2.0 km');

    // Unimaart Peoples Colony Dark Store (31.4125, 73.0915) from user (31.4125, 73.0995)
    const distUnimaart = calculateDistanceKm(31.4125, 73.0995, 31.4125, 73.0915);
    assert.equal(Number(distUnimaart.toFixed(1)), 0.8, 'Distance to Unimaart should be 0.8 km');
  });

  it('2. Automatically identifies nearest store (rank 1) for customer in Faisalabad', () => {
    const stores = calculateRankedStores(USER_COORDS_FAISALABAD);
    assert.equal(stores.length, 4);

    const nearestStore = stores[0];
    assert.equal(nearestStore.tenantId, 'tenant-freshmart');
    assert.equal(nearestStore.distanceKm, 0.8);
    assert.equal(nearestStore.isDeliverable, true);

    // Verify ordering: nearest to farthest
    assert.ok(stores[0].distanceKm <= stores[1].distanceKm);
    assert.ok(stores[1].distanceKm <= stores[2].distanceKm);
    assert.ok(stores[2].distanceKm <= stores[3].distanceKm);
  });

  it('3. Reranks nearest store when customer changes Leaflet map pin to Lahore Gulberg', () => {
    const stores = calculateRankedStores(USER_COORDS_LAHORE_GULBERG);
    assert.equal(stores.length, 4);

    // In Lahore Gulberg, Al-Fatah Gulberg Mall branch (31.5204, 74.3587) is right at 0 km
    const nearestStore = stores[0];
    assert.equal(nearestStore.tenantId, 'tenant-alfatah');
    assert.equal(nearestStore.distanceKm, 0.0);
    assert.equal(nearestStore.branchName, 'Gulberg Mall');
  });

  it('4. Reranks nearest store when customer changes Leaflet map pin to Karachi Clifton', () => {
    const stores = calculateRankedStores(USER_COORDS_KARACHI_CLIFTON);
    assert.equal(stores.length, 4);

    // In Karachi Clifton, Chase Up Clifton branch (24.8138, 67.0299) is nearest
    const nearestStore = stores[0];
    assert.equal(nearestStore.tenantId, 'tenant-chaseup');
    assert.equal(nearestStore.branchName, 'Clifton Karachi');
    assert.ok(nearestStore.distanceKm < 1.0);
  });

  it('5. findNearestCity identifies correct city hub from Leaflet GPS coordinates', () => {
    const resFsd = findNearestCity(31.4125, 73.0995);
    assert.equal(resFsd.city.id, 'faisalabad');

    const resLhr = findNearestCity(31.5204, 74.3587);
    assert.equal(resLhr.city.id, 'lahore');

    const resKhi = findNearestCity(24.8190, 67.0320);
    assert.equal(resKhi.city.id, 'karachi');
  });
});
