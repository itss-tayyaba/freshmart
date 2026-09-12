import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { protectVendor } from '../server/middleware/authMiddleware.js';

describe('Vendor Security & Multi-Tenant IDOR Protection', () => {
  it('protectVendor returns 401 if req.user is absent', () => {
    const req = {};
    let statusCode = null;
    let responseBody = null;
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(body) {
            responseBody = body;
          }
        };
      }
    };
    let nextCalled = false;
    protectVendor(req, res, () => { nextCalled = true; });

    assert.equal(statusCode, 401);
    assert.equal(responseBody.success, false);
    assert.equal(nextCalled, false);
  });

  it('protectVendor returns 403 when a standard customer role attempts access', () => {
    const req = { user: { id: 'CUST-10', role: 'customer' }, query: {}, body: {} };
    let statusCode = null;
    let responseBody = null;
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(body) {
            responseBody = body;
          }
        };
      }
    };
    let nextCalled = false;
    protectVendor(req, res, () => { nextCalled = true; });

    assert.equal(statusCode, 403);
    assert.equal(responseBody.success, false);
    assert.equal(nextCalled, false);
  });

  it('protectVendor blocks IDOR attack: Vendor VND-101 attempting to query VND-102 via req.query', () => {
    const req = {
      user: { id: 'VND-101', vendorId: 'VND-101', role: 'vendor' },
      query: { vendorId: 'VND-102' },
      body: {}
    };
    let statusCode = null;
    let responseBody = null;
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(body) {
            responseBody = body;
          }
        };
      }
    };
    let nextCalled = false;
    protectVendor(req, res, () => { nextCalled = true; });

    assert.equal(statusCode, 403);
    assert.match(responseBody.message, /another vendor/i);
    assert.equal(nextCalled, false);
  });

  it('protectVendor blocks IDOR attack: Vendor VND-101 attempting to modify VND-102 via req.body', () => {
    const req = {
      user: { id: 'VND-101', vendorId: 'VND-101', role: 'vendor' },
      query: {},
      body: { vendorId: 'VND-102', payoutAmount: 50000 }
    };
    let statusCode = null;
    let responseBody = null;
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(body) {
            responseBody = body;
          }
        };
      }
    };
    let nextCalled = false;
    protectVendor(req, res, () => { nextCalled = true; });

    assert.equal(statusCode, 403);
    assert.equal(nextCalled, false);
  });

  it('protectVendor allows legitimate Vendor VND-101 requesting VND-101 data', () => {
    const req = {
      user: { id: 'VND-101', vendorId: 'VND-101', role: 'vendor' },
      query: { vendorId: 'VND-101' },
      body: {}
    };
    let nextCalled = false;
    protectVendor(req, {}, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.user.vendorId, 'VND-101');
  });

  it('protectVendor allows Admin / Superadmin to view or manage any vendor partition', () => {
    const req = {
      user: { id: 'admin-root', role: 'admin' },
      query: { vendorId: 'VND-102' },
      body: {}
    };
    let nextCalled = false;
    protectVendor(req, {}, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
  });
});
