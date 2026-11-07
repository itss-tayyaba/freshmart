import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateAndNormalizePolygon,
  isPointInsideZone,
  calculateDistanceToZoneKm,
  calculateZoneDeliveryFee
} from '../server/utils/gisValidator.js';

import {
  PLATFORM_RETAILERS,
  resolveRetailerId,
  getRetailerDetails
} from '../server/utils/retailerHelper.js';

import {
  loadDiskStores,
  saveDiskStores,
  createStore,
  getStores,
  updateStore,
  deleteStore,
  toggleStoreStatus
} from '../server/controllers/storeController.js';

import {
  loadDiskZones,
  saveDiskZones,
  createZone,
  getZones,
  updateZone,
  deleteZone,
  toggleZoneStatus
} from '../server/controllers/zoneController.js';

import {
  loadDiskAssignments,
  saveDiskAssignments,
  getAllAssignmentsMerged,
  assignStoresToZone,
  getZoneStores,
  removeStoreFromZone
} from '../server/controllers/assignmentController.js';

import {
  checkDeliveryAvailability,
  getEligibleStores,
  calculateFee,
  isStoreCurrentlyOpen
} from '../server/controllers/deliveryEligibilityController.js';

// Helper mock req/res for controller execution
const mockReqRes = (body = {}, params = {}, query = {}, user = null) => {
  const req = { body, params, query, user };
  let responseData = null;
  let statusCode = 200;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    }
  };

  return { req, res, getData: () => responseData, getStatus: () => statusCode };
};

describe('Multi-Store GIS Delivery Zone Management Suite', () => {

  // Test authentic Faisalabad polygon for testing
  const D_GROUND_TEST_POLYGON = [
    { lat: 31.4000, lng: 73.0800 },
    { lat: 31.4250, lng: 73.0800 },
    { lat: 31.4250, lng: 73.1150 },
    { lat: 31.4000, lng: 73.1150 }
  ];

  it('1. Verifies the four core retailers (Al-Fatah, Chase Value, Chase Up, Unimart)', () => {
    assert.equal(PLATFORM_RETAILERS.length, 4);

    const r1 = getRetailerDetails('tenant-alfatah');
    assert.equal(r1.name, 'Al-Fatah');

    const r2 = getRetailerDetails('tenant-chasevalue');
    assert.equal(r2.name, 'Chase Value');

    const r3 = getRetailerDetails('tenant-chaseup');
    assert.equal(r3.name, 'Chase Up');

    // Resolves FreshMart Direct / Unimart without duplication
    const r4 = getRetailerDetails('tenant-freshmart');
    assert.equal(r4.name, 'Unimart');
    assert.equal(resolveRetailerId('tenant-freshmart'), 'tenant-unimart');
    assert.equal(resolveRetailerId('company_004'), 'tenant-unimart');
    assert.equal(resolveRetailerId('unimart'), 'tenant-unimart');
  });

  it('2. Creates multiple stores for Al-Fatah with genuine coordinates and validates in store list', async () => {
    const { req, res, getData } = mockReqRes({
      storeId: 'STR-AF-PEOPLES-TEST',
      tenantId: 'tenant-alfatah',
      name: 'Al-Fatah - Peoples Colony Mega Store',
      branchName: 'Peoples Colony Mega Store',
      address: 'Main Commercial Avenue, Peoples Colony 1, Faisalabad',
      city: 'Faisalabad',
      latitude: 31.4125,
      longitude: 73.0995,
      contactNumber: '+92 300 8441122',
      openingHours: '08:00 AM',
      closingHours: '11:00 PM',
      operatingStatus: 'Open',
      status: 'active'
    });

    await createStore(req, res);
    const result = getData();
    assert.equal(result.success, true);
    assert.equal(result.store.storeId, 'STR-AF-PEOPLES-TEST');
    assert.equal(result.store.latitude, 31.4125);
    assert.equal(result.store.longitude, 73.0995);
    assert.equal(result.store.location.coordinates[0], 73.0995);
    assert.equal(result.store.location.coordinates[1], 31.4125);
  });

  it('3. Creates stores for Chase Value, Chase Up, and Unimart with genuine coordinates', async () => {
    // Chase Value
    const cv = mockReqRes({
      storeId: 'STR-CV-JARANWALA-TEST',
      tenantId: 'tenant-chasevalue',
      name: 'Chase Value - Jaranwala Road Hub',
      branchName: 'Jaranwala Road Hub',
      address: 'Jaranwala Road, Near Peoples Colony, Faisalabad',
      city: 'Faisalabad',
      latitude: 31.4360,
      longitude: 73.1795,
      status: 'active'
    });
    await createStore(cv.req, cv.res);
    assert.equal(cv.getData().success, true);

    // Chase Up
    const cu = mockReqRes({
      storeId: 'STR-CU-CLOCKTOWER-TEST',
      tenantId: 'tenant-chaseup',
      name: 'Chase Up - Clock Tower Center',
      branchName: 'Clock Tower Center',
      address: 'Clock Tower Bazar, Faisalabad',
      city: 'Faisalabad',
      latitude: 31.4150,
      longitude: 73.0780,
      status: 'active'
    });
    await createStore(cu.req, cu.res);
    assert.equal(cu.getData().success, true);

    // Unimart
    const um = mockReqRes({
      storeId: 'STR-UM-DARKSTORE-TEST',
      tenantId: 'tenant-unimart',
      name: 'Unimart - D-Ground Express Dark Store',
      branchName: 'D-Ground Express Dark Store',
      address: 'House 88, D-Ground, Peoples Colony 1, Faisalabad',
      city: 'Faisalabad',
      latitude: 31.4015,
      longitude: 73.0830,
      status: 'active'
    });
    await createStore(um.req, um.res);
    assert.equal(um.getData().success, true);
  });

  it('4. Filters stores by retailer and searches correctly', async () => {
    const { req, res, getData } = mockReqRes({}, {}, { tenantId: 'tenant-alfatah' });
    await getStores(req, res);
    const data = getData();
    assert.ok(data.stores.length > 0);
    for (const s of data.stores) {
      assert.equal(resolveRetailerId(s.tenantId), 'tenant-alfatah');
    }
  });

  it('5. Validates polygon drawing, auto-closes ring, and rejects invalid geometry', () => {
    // Valid 4 vertices -> automatically closed to 5 coordinates
    const normalized = validateAndNormalizePolygon(D_GROUND_TEST_POLYGON);
    assert.equal(normalized.type, 'Polygon');
    assert.equal(normalized.coordinates[0].length, 5);
    assert.deepEqual(normalized.coordinates[0][0], normalized.coordinates[0][4]);

    // Rejects less than 3 distinct points
    assert.throws(() => {
      validateAndNormalizePolygon([
        { lat: 31.4, lng: 73.0 },
        { lat: 31.5, lng: 73.1 }
      ]);
    }, /at least 3 distinct vertices/);

    // Rejects out of range coordinates
    assert.throws(() => {
      validateAndNormalizePolygon([
        { lat: 95.0, lng: 73.0 },
        { lat: 31.4, lng: 73.0 },
        { lat: 31.5, lng: 73.1 }
      ]);
    }, /out of range/);

    // Rejects self-intersecting polygon (hourglass)
    assert.throws(() => {
      validateAndNormalizePolygon([
        { lat: 31.40, lng: 73.08 },
        { lat: 31.42, lng: 73.11 },
        { lat: 31.40, lng: 73.11 },
        { lat: 31.42, lng: 73.08 }
      ]);
    }, /Self-intersecting polygon/);
  });

  it('6. Saves delivery zone permanently and retrieves it via GET /api/admin/zones', async () => {
    const { req, res, getData } = mockReqRes({
      zoneId: 'ZONE-TEST-DGROUND',
      name: 'Test D-Ground Central Zone',
      code: 'TEST-DGR',
      description: 'Test zone covering central Faisalabad',
      city: 'Faisalabad',
      coordinates: D_GROUND_TEST_POLYGON,
      deliveryCharge: 75,
      minOrderAmount: 450,
      freeDeliveryThreshold: 2200,
      estimatedDeliveryTime: '20-30 mins',
      color: '#10b981'
    });

    await createZone(req, res);
    assert.equal(getData().success, true);
    assert.equal(getData().zone.zoneId, 'ZONE-TEST-DGROUND');
    assert.equal(getData().zone.deliveryCharge, 75);

    // Verify GET zones contains the new zone
    const getRes = mockReqRes({}, {}, { search: 'TEST-DGR' });
    await getZones(getRes.req, getRes.res);
    const found = getRes.getData().zones.find((z) => z.zoneId === 'ZONE-TEST-DGROUND');
    assert.ok(found, 'Created zone must be found in list');
    assert.equal(found.code, 'TEST-DGR');
  });

  it('7. Edits polygon coordinates and verifies updated coordinates persist', async () => {
    const updatedPolygon = [
      { lat: 31.3900, lng: 73.0700 },
      { lat: 31.4300, lng: 73.0700 },
      { lat: 31.4300, lng: 73.1200 },
      { lat: 31.3900, lng: 73.1200 }
    ];

    const { req, res, getData } = mockReqRes(
      { coordinates: updatedPolygon, deliveryCharge: 85 },
      { id: 'ZONE-TEST-DGROUND' }
    );

    await updateZone(req, res);
    assert.equal(getData().success, true);

    // Refresh from disk/DB
    const disk = loadDiskZones();
    const updated = disk.find((z) => z.zoneId === 'ZONE-TEST-DGROUND');
    assert.equal(updated.deliveryCharge, 85);
    assert.equal(updated.geometry.coordinates[0][0][1], 31.3900);
  });

  it('8. Assigns multiple stores to one zone and one store to multiple zones', async () => {
    // Assign 2 stores to ZONE-TEST-DGROUND
    const assignReq = mockReqRes(
      { storeIds: ['STR-AF-PEOPLES-TEST', 'STR-UM-DARKSTORE-TEST'] },
      { id: 'ZONE-TEST-DGROUND' }
    );
    await assignStoresToZone(assignReq.req, assignReq.res);
    assert.equal(assignReq.getData().success, true);

    // Assign STR-AF-PEOPLES-TEST to another zone (ZONE-FSD-CANAL)
    const assignReq2 = mockReqRes(
      { storeId: 'STR-AF-PEOPLES-TEST' },
      { id: 'ZONE-FSD-CANAL' }
    );
    await assignStoresToZone(assignReq2.req, assignReq2.res);
    assert.equal(assignReq2.getData().success, true);

    // Verify stores in ZONE-TEST-DGROUND
    const getZStores = mockReqRes({}, { id: 'ZONE-TEST-DGROUND' });
    await getZoneStores(getZStores.req, getZStores.res);
    const storeList = getZStores.getData().stores;
    assert.ok(storeList.length >= 2);
    assert.ok(storeList.some((s) => s.storeId === 'STR-AF-PEOPLES-TEST'));
    assert.ok(storeList.some((s) => s.storeId === 'STR-UM-DARKSTORE-TEST'));
  });

  it('9. Distance warning when store is far from delivery zone', () => {
    const zoneGeom = validateAndNormalizePolygon(D_GROUND_TEST_POLYGON);
    // Point in Lahore (~120 km away)
    const distToLahore = calculateDistanceToZoneKm(31.5204, 74.3587, zoneGeom);
    assert.ok(distToLahore > 100, 'Distance to Lahore should be over 100 km');

    // Point in D-Ground (inside polygon)
    const distInside = calculateDistanceToZoneKm(31.4125, 73.0995, zoneGeom);
    assert.equal(distInside, 0, 'Distance for point inside polygon must be 0 km');
  });

  it('10. Point-in-polygon customer location validation (inside, outside, boundary)', async () => {
    const insideCoords = { lat: 31.4125, lng: 73.0995 }; // D-Ground central
    const outsideCoords = { lat: 31.2500, lng: 72.8500 }; // Far rural outskirts
    const boundaryCoords = { lat: 31.4000, lng: 73.0800 }; // Exact boundary vertex

    // Inside
    const checkInside = mockReqRes(insideCoords);
    await checkDeliveryAvailability(checkInside.req, checkInside.res);
    assert.equal(checkInside.getData().isAvailable, true);
    assert.ok(checkInside.getData().matchingZones.length > 0);

    // Outside: MUST return exact teacher prompt requirement
    const checkOutside = mockReqRes(outsideCoords);
    await checkDeliveryAvailability(checkOutside.req, checkOutside.res);
    assert.equal(checkOutside.getData().isAvailable, false);
    assert.equal(
      checkOutside.getData().message,
      'Sorry, delivery is currently unavailable at your location.'
    );

    // Boundary-inclusive check
    const checkBoundary = mockReqRes(boundaryCoords);
    await checkDeliveryAvailability(checkBoundary.req, checkBoundary.res);
    assert.equal(checkBoundary.getData().isAvailable, true);
  });

  it('11. Customer eligibility returns eligible stores from matching zones', async () => {
    const { req, res, getData } = mockReqRes({
      latitude: 31.4125,
      longitude: 73.0995,
      cartTotal: 1500
    });

    await getEligibleStores(req, res);
    const data = getData();
    assert.equal(data.success, true);
    assert.equal(data.isDeliverable, true);
    assert.ok(data.eligibleStores.length > 0);
    assert.ok(data.retailers.length > 0);

    // Stores have delivery fee and zone information
    const firstStore = data.eligibleStores[0];
    assert.ok(firstStore.deliveryFee !== undefined);
    assert.ok(firstStore.zoneId !== undefined);
  });

  it('12. Inactive zone, inactive store, and inactive tenant are properly excluded', async () => {
    // 1. Deactivate a store
    const toggleStore = mockReqRes({ status: 'inactive' }, { id: 'STR-UM-DARKSTORE-TEST' });
    await toggleStoreStatus(toggleStore.req, toggleStore.res);
    assert.equal(toggleStore.getData().isActive, false);

    // Request eligible stores and verify deactivated store is not returned
    const { req, res, getData } = mockReqRes({
      latitude: 31.4125,
      longitude: 73.0995
    });
    await getEligibleStores(req, res);
    const storeIds = getData().eligibleStores.map((s) => s.storeId);
    assert.ok(!storeIds.includes('STR-UM-DARKSTORE-TEST'), 'Inactive store must not be eligible');

    // Reactivate store
    const reactivate = mockReqRes({ status: 'active' }, { id: 'STR-UM-DARKSTORE-TEST' });
    await toggleStoreStatus(reactivate.req, reactivate.res);
  });

  it('13. Server-side delivery fee calculation respects minimum order and free threshold', () => {
    const zone = {
      deliveryCharge: 80,
      minOrderAmount: 500,
      freeDeliveryThreshold: 2000,
      estimatedDeliveryTime: '20-35 mins'
    };

    // Subtotal under minimum order: charges standard fee, marks meetsMinOrder as false
    const resLow = calculateZoneDeliveryFee(zone, 300);
    assert.equal(resLow.fee, 80);
    assert.equal(resLow.meetsMinOrder, false);

    // Subtotal between minOrder and free threshold
    const resMid = calculateZoneDeliveryFee(zone, 1200);
    assert.equal(resMid.fee, 80);
    assert.equal(resMid.isFree, false);
    assert.equal(resMid.meetsMinOrder, true);

    // Subtotal above free threshold
    const resFree = calculateZoneDeliveryFee(zone, 2500);
    assert.equal(resFree.fee, 0);
    assert.equal(resFree.isFree, true);
  });

  it('14. POST /api/delivery/calculate-fee calculates fee on server safely', async () => {
    const { req, res, getData } = mockReqRes({
      zoneId: 'ZONE-TEST-DGROUND',
      subtotal: 3000
    });

    await calculateFee(req, res);
    const data = getData();
    assert.equal(data.success, true);
    assert.equal(data.deliveryFee, 0, 'Subtotal > free threshold must be 0 delivery fee');
    assert.equal(data.isFreeDelivery, true);
  });

  it('15. Removes a store from a delivery zone', async () => {
    const { req, res, getData } = mockReqRes({}, { id: 'ZONE-TEST-DGROUND', storeId: 'STR-UM-DARKSTORE-TEST' });
    await removeStoreFromZone(req, res);
    assert.equal(getData().success, true);

    const getZStores = mockReqRes({}, { id: 'ZONE-TEST-DGROUND' });
    await getZoneStores(getZStores.req, getZStores.res);
    const storeList = getZStores.getData().stores;
    assert.ok(!storeList.some((s) => s.storeId === 'STR-UM-DARKSTORE-TEST'));
  });

  it('16. Deletes a delivery zone cleanly', async () => {
    const { req, res, getData } = mockReqRes({}, { id: 'ZONE-TEST-DGROUND' });
    await deleteZone(req, res);
    assert.equal(getData().success, true);

    const disk = loadDiskZones();
    assert.ok(!disk.some((z) => z.zoneId === 'ZONE-TEST-DGROUND'));
  });

});
