import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loginUser
} from '../server/controllers/authController.js';
import {
  addRider,
  deleteRider,
  clearAllRiders,
  loadDiskRiders
} from '../server/controllers/extraControllers.js';

test('Rider Clear, Custom Registration & Authentication Suite', async (t) => {
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
    return res;
  };

  await t.test('1. Clearing fleet removes all riders and leaves disk database empty []', async () => {
    const clearReq = {
      user: { role: 'admin', tenantId: 'tenant-freshmart' }
    };
    const clearRes = createMockRes();
    await clearAllRiders(clearReq, clearRes);

    assert.equal(clearRes.statusCode, 200);
    assert.equal(clearRes.jsonData.success, true);

    const diskRiders = loadDiskRiders();
    assert.equal(Array.isArray(diskRiders), true);
    assert.equal(diskRiders.length, 0, 'Disk database must be completely empty []');
  });

  await t.test('2. Adding a new rider with custom password saves to disk database', async () => {
    const addReq = {
      body: {
        id: 'RDR-ZAHID',
        name: 'Zahid Hussain',
        username: 'zahid_courier',
        phone: '03009876543',
        password: 'zahid_secure_pass_2026',
        city: 'Faisalabad',
        serviceArea: 'Peoples Colony No. 1',
        region: 'Peoples Colony No. 1 (Faisalabad)',
        vehicleType: '🏍️ Honda 125',
        vehicleNumber: 'FSD-9988',
        tenantId: 'tenant-alfatah',
        branchId: 'branch_af_fsd',
        branchName: 'D-Ground Flagship Hub',
        isGlobal: true
      }
    };
    const addRes = createMockRes();
    await addRider(addReq, addRes);

    assert.equal(addRes.statusCode, 201);
    assert.equal(addRes.jsonData.success, true);
    assert.equal(addRes.jsonData.rider.name, 'Zahid Hussain');
    assert.equal(addRes.jsonData.rider.username, 'zahid_courier');
    assert.equal(addRes.jsonData.rider.password, 'zahid_secure_pass_2026');

    // Verify stored on disk
    const diskRiders = loadDiskRiders();
    assert.equal(diskRiders.length, 1);
    const saved = diskRiders.find((r) => r.username === 'zahid_courier');
    assert.ok(saved, 'Rider must exist in loadDiskRiders()');
    assert.equal(saved.password, 'zahid_secure_pass_2026');
    assert.equal(saved.phone, '03009876543');
    assert.equal(saved.city, 'Faisalabad');
  });

  await t.test('3. Rider logs in correctly with username and custom password', async () => {
    const loginReq = {
      body: {
        email: 'zahid_courier',
        password: 'zahid_secure_pass_2026'
      }
    };
    const loginRes = createMockRes();
    await loginUser(loginReq, loginRes);

    assert.equal(loginRes.statusCode, 200);
    assert.equal(loginRes.jsonData.success, true);
    assert.equal(loginRes.jsonData.role, 'rider');
    assert.equal(loginRes.jsonData.name, 'Zahid Hussain');
    assert.equal(loginRes.jsonData.phone, '03009876543');
    assert.ok(loginRes.jsonData.token, 'Must return JWT token');
  });

  await t.test('4. Rider logs in correctly with phone number and custom password', async () => {
    const loginReq = {
      body: {
        email: '03009876543',
        password: 'zahid_secure_pass_2026'
      }
    };
    const loginRes = createMockRes();
    await loginUser(loginReq, loginRes);

    assert.equal(loginRes.statusCode, 200);
    assert.equal(loginRes.jsonData.success, true);
    assert.equal(loginRes.jsonData.role, 'rider');
    assert.equal(loginRes.jsonData.name, 'Zahid Hussain');
  });

  await t.test('5. Login with incorrect password is rejected', async () => {
    const loginReq = {
      body: {
        email: 'zahid_courier',
        password: 'wrong_password_999'
      }
    };
    const loginRes = createMockRes();
    await loginUser(loginReq, loginRes);

    assert.equal(loginRes.statusCode, 401);
    assert.equal(loginRes.jsonData.success, false);
    assert.match(loginRes.jsonData.message, /invalid/i);
  });

  await t.test('6. Individual rider deletion removes rider from fleet', async () => {
    const delReq = {
      params: { id: 'RDR-ZAHID' }
    };
    const delRes = createMockRes();
    await deleteRider(delReq, delRes);

    assert.equal(delRes.statusCode, 200);
    const diskRiders = loadDiskRiders();
    assert.equal(diskRiders.length, 0);
  });
});
