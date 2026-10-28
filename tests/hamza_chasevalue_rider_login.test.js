import test from 'node:test';
import assert from 'node:assert/strict';
import { loginUser } from '../server/controllers/authController.js';
import { INITIAL_RIDERS } from '../src/data/tenantData.js';

test('Hamza Chase Value Rider Authentication & Multi-Tenant Registry Suite', async (t) => {
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

  await t.test('1. INITIAL_RIDERS contains Hamza for Chase Value', () => {
    const hamza = INITIAL_RIDERS.find((r) => r.username === 'hamza' || r.name === 'Hamza');
    assert.ok(hamza, 'Hamza rider must exist in INITIAL_RIDERS');
    assert.equal(hamza.tenantId, 'tenant-chasevalue');
    assert.equal(hamza.tenantName, 'Chase Value');
    assert.equal(hamza.password, 'rider123');
    assert.equal(hamza.branchId, 'branch_cv_fsd');
    assert.equal(hamza.branchName, 'Wholesale Express Hub');
  });

  await t.test('2. Hamza logs in with username "hamza" and password "rider123"', async () => {
    const req = {
      body: {
        email: 'hamza',
        password: 'rider123',
        tenantId: 'tenant-chasevalue'
      }
    };
    const res = createMockRes();
    await loginUser(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonData.success, true);
    assert.equal(res.jsonData.role, 'rider');
    assert.equal(res.jsonData.name, 'Hamza');
    assert.equal(res.jsonData.tenantId, 'tenant-chasevalue');
    assert.ok(res.jsonData.token, 'Must return signed JWT token');
  });

  await t.test('3. Hamza logs in even without tenantId passed in payload', async () => {
    const req = {
      body: {
        email: 'hamza',
        password: 'rider123'
      }
    };
    const res = createMockRes();
    await loginUser(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonData.success, true);
    assert.equal(res.jsonData.role, 'rider');
    assert.equal(res.jsonData.name, 'Hamza');
    assert.equal(res.jsonData.tenantId, 'tenant-chasevalue');
  });

  await t.test('4. Hamza logs in with assigned phone number', async () => {
    const req = {
      body: {
        email: '03001234567',
        password: 'rider123',
        tenantId: 'tenant-chasevalue'
      }
    };
    const res = createMockRes();
    await loginUser(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonData.success, true);
    assert.equal(res.jsonData.role, 'rider');
    assert.equal(res.jsonData.tenantId, 'tenant-chasevalue');
  });
});

