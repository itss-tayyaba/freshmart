import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loginUser,
  createPickupStaff,
  getPickupStaff,
  updatePickupStaff,
  deletePickupStaff,
  loadDiskPickupStaff
} from '../server/controllers/authController.js';
import {
  updateRider,
  deleteRider,
  loadDiskRiders
} from '../server/controllers/extraControllers.js';

test('Rider and Pickup Staff Edit & Database/Disk Persistence Test Suite', async (t) => {
  // Mock response helper
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

  await t.test('1. Edit rider username, name and password -> saves to disk & allows login', async () => {
    // Edit RDR-AHMAD to ahamd / new password
    const updateReq = {
      params: { id: 'RDR-AHMAD' },
      body: {
        name: 'ahamd',
        username: 'ahamd',
        phone: '03206551696',
        password: 'ahamd_secret_2026',
        city: 'Faisalabad',
        region: 'Peoples Colony No. 1 (Faisalabad)',
        zone: 'Peoples Colony No. 1 (Faisalabad)'
      }
    };
    const updateRes = createMockRes();
    await updateRider(updateReq, updateRes);

    assert.equal(updateRes.statusCode, 200);
    assert.equal(updateRes.jsonData.success, true);
    assert.equal(updateRes.jsonData.rider.username, 'ahamd');
    assert.equal(updateRes.jsonData.rider.name, 'ahamd');

    // Verify disk storage updated
    const diskRiders = loadDiskRiders();
    const updatedOnDisk = diskRiders.find((r) => r.id === 'RDR-AHMAD' || r.username === 'ahamd');
    assert.ok(updatedOnDisk, 'Rider must exist on disk database');
    assert.equal(updatedOnDisk.username, 'ahamd');
    assert.equal(updatedOnDisk.password, 'ahamd_secret_2026');

    // Test Login with updated username 'ahamd' and updated password
    const loginReq = {
      body: {
        email: 'ahamd',
        password: 'ahamd_secret_2026'
      }
    };
    const loginRes = createMockRes();
    await loginUser(loginReq, loginRes);

    assert.equal(loginRes.statusCode, 200);
    assert.equal(loginRes.jsonData.success, true);
    assert.equal(loginRes.jsonData.role, 'rider');
    assert.equal(loginRes.jsonData.name, 'ahamd');
    assert.ok(loginRes.jsonData.token, 'Token must be issued upon rider login');

    // Test Login with rider phone number '03206551696' and updated password
    const loginByPhoneReq = {
      body: {
        email: '03206551696',
        password: 'ahamd_secret_2026'
      }
    };
    const loginByPhoneRes = createMockRes();
    await loginUser(loginByPhoneReq, loginByPhoneRes);

    assert.equal(loginByPhoneRes.statusCode, 200);
    assert.equal(loginByPhoneRes.jsonData.success, true);
    assert.equal(loginByPhoneRes.jsonData.role, 'rider');

    // Clean up test rider so fleet remains empty
    await deleteRider({ params: { id: 'RDR-AHMAD' } }, createMockRes());
  });

  await t.test('2. Create and Edit pickup staff credentials -> saves to disk & allows login', async () => {
    // Create new staff
    const createReq = {
      body: {
        name: 'Tariq Mehmood',
        username: 'tariq_pack',
        password: 'initial_pass123',
        phone: '03129876543',
        tenantId: 'tenant-freshmart',
        branchId: 'branch_um_fsd',
        branchName: 'Peoples Colony Dark Store'
      }
    };
    const createRes = createMockRes();
    await createPickupStaff(createReq, createRes);

    assert.equal(createRes.statusCode, 201);
    assert.equal(createRes.jsonData.success, true);
    const staffId = createRes.jsonData.staff.id;

    // Verify disk storage has staff
    const diskStaff = loadDiskPickupStaff();
    const createdOnDisk = diskStaff.find((s) => s.id === staffId || s.username === 'tariq_pack');
    assert.ok(createdOnDisk, 'Created pickup staff must be persisted on disk');

    // Edit staff username, name and password
    const updateReq = {
      params: { id: staffId },
      body: {
        name: 'Tariq M. Senior',
        username: 'tariq_senior',
        password: 'tariq_new_pass2026',
        phone: '03129876543'
      }
    };
    const updateRes = createMockRes();
    await updatePickupStaff(updateReq, updateRes);

    assert.equal(updateRes.statusCode, 200);
    assert.equal(updateRes.jsonData.success, true);
    assert.equal(updateRes.jsonData.staff.name, 'Tariq M. Senior');
    assert.equal(updateRes.jsonData.staff.username, 'tariq_senior');

    // Verify disk storage updated
    const diskStaffAfter = loadDiskPickupStaff();
    const updatedStaffOnDisk = diskStaffAfter.find((s) => s.id === staffId || s.username === 'tariq_senior');
    assert.ok(updatedStaffOnDisk, 'Updated pickup staff must be persisted on disk');
    assert.equal(updatedStaffOnDisk.username, 'tariq_senior');
    assert.equal(updatedStaffOnDisk.password, 'tariq_new_pass2026');

    // Test Login with updated username 'tariq_senior' and updated password
    const loginReq = {
      body: {
        email: 'tariq_senior',
        password: 'tariq_new_pass2026'
      }
    };
    const loginRes = createMockRes();
    await loginUser(loginReq, loginRes);

    assert.equal(loginRes.statusCode, 200);
    assert.equal(loginRes.jsonData.success, true);
    assert.equal(loginRes.jsonData.role, 'pickup_staff');
    assert.equal(loginRes.jsonData.name, 'Tariq M. Senior');
    assert.ok(loginRes.jsonData.token, 'Token must be issued upon pickup staff login');

    // Clean up test staff
    const deleteReq = { params: { id: staffId } };
    const deleteRes = createMockRes();
    await deletePickupStaff(deleteReq, deleteRes);
  });
});
