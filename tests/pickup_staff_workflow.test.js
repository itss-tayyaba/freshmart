import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPickupStaffSchema } from '../server/middleware/validationMiddleware.js';
import { pickupStaffOnly } from '../server/middleware/authMiddleware.js';
import { createPickupStaff, getPickupStaff } from '../server/controllers/pickupStaffController.js';
import { getOrders, getPickupStaffOrders, updatePickupStaffOrderStatus } from '../server/controllers/orderController.js';

const invoke = async (handler, req) => {
  let statusCode = 200;
  let data;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(response) {
      data = response;
      return response;
    }
  };
  await handler(req, res, () => {
    data = { next: true };
  });
  return { statusCode, data };
};

describe('Pickup staff account and order access', () => {
  it('validates registered staff details and requires strong passwords', () => {
    const valid = createPickupStaffSchema.safeParse({
      name: 'Pickup Staff',
      email: 'picker@example.com',
      password: 'secure-pass-123'
    });
    const invalid = createPickupStaffSchema.safeParse({
      name: 'P',
      email: 'not-an-email',
      password: 'short'
    });

    assert.equal(valid.success, true);
    assert.equal(invalid.success, false);
  });

  it('allows only authenticated branch pickup staff through the staff gate', () => {
    const allowed = invoke(pickupStaffOnly, {
      user: { id: 'staff-1', role: 'pickupstaff', branchId: 'store-1' }
    });
    const denied = invoke(pickupStaffOnly, {
      user: { id: 'admin-1', role: 'admin', branchId: 'store-1' }
    });

    return Promise.all([allowed, denied]).then(([allowedResult, deniedResult]) => {
      assert.equal(allowedResult.data.next, true);
      assert.equal(deniedResult.statusCode, 403);
    });
  });

  it('reports database unavailability instead of creating or serving fake staff data', async () => {
    const admin = { id: 'admin-1', role: 'admin', branchId: 'store-1' };
    const create = await invoke(createPickupStaff, {
      user: admin,
      body: { name: 'Pickup Staff', email: 'picker@example.com', password: 'secure-pass-123' }
    });
    const list = await invoke(getPickupStaff, { user: admin, query: {} });

    assert.equal(create.statusCode, 503);
    assert.equal(list.statusCode, 503);
    assert.equal(create.data.success, false);
    assert.equal(list.data.success, false);
  });

  it('does not expose pickup queues or allow status changes to other roles', async () => {
    const admin = await invoke(getPickupStaffOrders, {
      user: { id: 'admin-1', role: 'admin', branchId: 'store-1' }
    });
    const riderUpdate = await invoke(updatePickupStaffOrderStatus, {
      params: { id: '#FM-1' },
      user: { id: 'rider-1', role: 'rider', branchId: 'store-1' },
      body: { status: 'Ready for Pickup' }
    });

    assert.equal(admin.statusCode, 403);
    assert.equal(riderUpdate.statusCode, 403);
  });

  it('returns a database error for admin order reads instead of a successful empty queue', async () => {
    const response = await invoke(getOrders, {
      user: { id: 'admin-1', role: 'admin', branchId: 'store-1' }
    });
    assert.equal(response.statusCode, 503);
    assert.equal(response.data.success, false);
    assert.match(response.data.message, /database reconnects/i);
  });
});
