import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Branch } from '../server/models/Branch.js';
import {
  getAllBranches,
  createBranch,
  loadDiskBranches,
  saveDiskBranch
} from '../server/controllers/companyBranchController.js';
import { BRANCHES, resolveTenantId, isSameTenant } from '../src/data/companyHierarchyData.js';
import { calculateDistanceKm } from '../src/data/pakistanLocations.js';
import { INITIAL_TENANTS } from '../src/data/tenantData.js';

describe('Nearest Store by Customer Location & Branch Pinning Suite', () => {
  const BRANCHES_FILE_PATH = path.resolve(process.cwd(), 'server/data/branches_db.json');
  let originalDisk = '[]';

  before(() => {
    if (fs.existsSync(BRANCHES_FILE_PATH)) {
      originalDisk = fs.readFileSync(BRANCHES_FILE_PATH, 'utf-8');
    }
  });

  after(() => {
    fs.writeFileSync(BRANCHES_FILE_PATH, originalDisk, 'utf-8');
  });

  it('1. Branch model requires real latitude and longitude and has no silent defaults', () => {
    const latPath = Branch.schema.paths.latitude;
    const lngPath = Branch.schema.paths.longitude;

    assert.equal(latPath.isRequired, true, 'latitude must be required in Branch schema');
    assert.equal(lngPath.isRequired, true, 'longitude must be required in Branch schema');
    assert.equal(latPath.defaultValue, undefined, 'latitude should have no silent default');
    assert.equal(lngPath.defaultValue, undefined, 'longitude should have no silent default');
  });

  it('2. createBranch API rejects branches without coordinates', async () => {
    let statusCode = 0;
    let responseData = null;
    const req = {
      body: {
        name: 'No Pin Branch',
        tenantId: 'tenant-alfatah',
        city: 'Faisalabad'
        // latitude and longitude missing
      }
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await createBranch(req, res);
    assert.equal(statusCode, 400, 'Should reject branch creation when coordinates are missing');
    assert.equal(responseData.success, false);
    assert.match(responseData.message, /latitude and longitude coordinates are required/i);
  });

  it('3. createBranch saves exact pin coordinates to database and disk file', async () => {
    let statusCode = 0;
    let responseData = null;
    const req = {
      body: {
        name: 'Gulberg Greens Islamabad Hub',
        tenantId: 'tenant-alfatah',
        city: 'Islamabad',
        address: 'Executive Block, Gulberg Greens, Islamabad',
        latitude: 33.6007,
        longitude: 73.1342,
        deliveryRadius: 20
      }
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await createBranch(req, res);
    assert.equal(statusCode, 201, 'Branch should be successfully created');
    assert.ok(responseData.success);
    assert.equal(responseData.branch.latitude, 33.6007);
    assert.equal(responseData.branch.longitude, 73.1342);

    // Verify written to branches_db.json
    const diskList = loadDiskBranches();
    const foundOnDisk = diskList.find((b) => b.name === 'Gulberg Greens Islamabad Hub');
    assert.ok(foundOnDisk, 'Branch must be saved to branches_db.json');
    assert.equal(foundOnDisk.latitude, 33.6007);
    assert.equal(foundOnDisk.longitude, 73.1342);
  });

  it('4. getAllBranches returns all base platform BRANCHES plus custom pinned branches', async () => {
    let responseData = null;
    const req = {};
    const res = {
      json(data) {
        responseData = data;
        return this;
      }
    };

    await getAllBranches(req, res);
    assert.ok(responseData.success);
    assert.ok(responseData.branches.length >= BRANCHES.length, 'Must return all platform branches, never start empty');
    
    // Check that branches exist for all tenants
    const alfatahBranches = responseData.branches.filter((b) => isSameTenant(b.tenantId, 'tenant-alfatah'));
    assert.ok(alfatahBranches.length >= 4, 'Al-Fatah must have real branches');
  });

  it('5. Nearest store logic correctly identifies closest supermarket based on customer location', () => {
    // Test Location A: Faisalabad Al-Fatah Canal Road coordinates (31.4382, 73.1292)
    const fsdCustomer = { lat: 31.4382, lng: 73.1292 };

    const getNearestStoreForCoords = (userCoords) => {
      const stores = INITIAL_TENANTS.map((tenant) => {
        const tenantCanonicalId = resolveTenantId(tenant.id);
        const branches = BRANCHES.filter(
          (b) => isSameTenant(b.tenantId, tenant.id) || b.tenantId === tenantCanonicalId
        );

        let nearestBranch = null;
        let minDistance = Infinity;

        for (const b of branches) {
          const bLat = Number(b.latitude);
          const bLng = Number(b.longitude);
          const d = calculateDistanceKm(userCoords.lat, userCoords.lng, bLat, bLng);
          if (d < minDistance) {
            minDistance = d;
            nearestBranch = b;
          }
        }

        return {
          tenantId: tenant.id,
          name: tenant.name,
          nearestBranch,
          distanceKm: Number(minDistance.toFixed(2))
        };
      }).sort((a, b) => a.distanceKm - b.distanceKm);

      return stores;
    };

    const fsdStores = getNearestStoreForCoords(fsdCustomer);
    assert.ok(fsdStores.length === 4, 'Must return all 4 supermarkets ranked by distance');
    // In Faisalabad, Al-Fatah Flagship Hub is at 31.4382, 73.1292 (0 km distance)
    assert.equal(fsdStores[0].tenantId, 'tenant-alfatah', 'Al-Fatah should be closest at its Faisalabad Flagship Hub');
    assert.equal(fsdStores[0].distanceKm, 0, 'Distance to Flagship hub should be ~0 km');

    // Test Location B: Karachi Clifton coordinates (24.8138, 67.0299)
    const karachiCustomer = { lat: 24.8138, lng: 67.0299 };
    const khiStores = getNearestStoreForCoords(karachiCustomer);
    // In Clifton Karachi, Chase Up Clifton is at 24.8138, 67.0299 (0 km distance)
    assert.equal(khiStores[0].tenantId, 'tenant-chaseup', 'Chase Up should be closest in Clifton Karachi');
    assert.equal(khiStores[0].distanceKm, 0, 'Distance to Clifton hub should be ~0 km');

    // Test Location C: Lahore Gulberg coordinates (31.5126, 74.3436)
    const lahoreCustomer = { lat: 31.5126, lng: 74.3436 };
    const lhrStores = getNearestStoreForCoords(lahoreCustomer);
    // In Gulberg Lahore, FreshMart/Unimaart Gulberg SuperHub is at 31.5126, 74.3436 (0 km distance)
    assert.equal(lhrStores[0].tenantId, 'tenant-freshmart', 'FreshMart/Unimaart should be closest in Gulberg Lahore');
    assert.equal(lhrStores[0].distanceKm, 0, 'Distance to Gulberg hub should be ~0 km');
  });
});
