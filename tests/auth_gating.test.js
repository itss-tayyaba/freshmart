import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { protect, adminOnly } from '../server/middleware/authMiddleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'freshmart_secret_key_2026';

describe('Authentication & Authorization Gating', () => {
  it('generates valid JWT with correct payload structure for admin', () => {
    const payload = { id: 'admin-root', role: 'admin', email: 'admin@freshmart.com' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    assert.ok(token);

    const decoded = jwt.verify(token, JWT_SECRET);
    assert.equal(decoded.id, 'admin-root');
    assert.equal(decoded.role, 'admin');
    assert.equal(decoded.email, 'admin@freshmart.com');
  });

  it('generates valid JWT with vendorId for supplier / vendor roles', () => {
    const payload = { id: 'VND-101', role: 'vendor', vendorId: 'VND-101', email: 'vendor@freshmart.com' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const decoded = jwt.verify(token, JWT_SECRET);
    assert.equal(decoded.vendorId, 'VND-101');
    assert.equal(decoded.role, 'vendor');
  });

  it('rejects tampered or forged JWT tokens', () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_signature';
    assert.throws(() => {
      jwt.verify(fakeToken, JWT_SECRET);
    });
  });

  it('protect middleware returns 401 when no authorization header is provided', async () => {
    const req = { headers: {} };
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
    const next = () => { nextCalled = true; };

    await protect(req, res, next);
    assert.equal(statusCode, 401);
    assert.equal(responseBody.success, false);
    assert.equal(nextCalled, false);
  });

  it('protect middleware returns 401 when bearer token is invalid', async () => {
    const req = { headers: { authorization: 'Bearer invalid_garbage_token' } };
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
    const next = () => { nextCalled = true; };

    await protect(req, res, next);
    assert.equal(statusCode, 401);
    assert.equal(responseBody.success, false);
    assert.equal(nextCalled, false);
  });

  it('protect middleware attaches user context and calls next on valid token', async () => {
    const token = jwt.sign({ id: 'USR-99', role: 'customer', name: 'John Doe' }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    let nextCalled = false;
    const res = {
      status() { return { json() {} }; }
    };
    const next = () => { nextCalled = true; };

    await protect(req, res, next);
    assert.equal(nextCalled, true);
    assert.ok(req.user);
    assert.equal(req.user.role, 'customer');
  });

  it('adminOnly middleware blocks non-admin users with 403 Forbidden', () => {
    const req = { user: { id: 'USR-99', role: 'customer' } };
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
    const next = () => { nextCalled = true; };

    adminOnly(req, res, next);
    assert.equal(statusCode, 403);
    assert.equal(responseBody.success, false);
    assert.equal(nextCalled, false);
  });

  it('adminOnly middleware allows admin and superadmin roles', () => {
    const req1 = { user: { id: 'admin-1', role: 'admin' } };
    let nextCalled1 = false;
    adminOnly(req1, {}, () => { nextCalled1 = true; });
    assert.equal(nextCalled1, true);

    const req2 = { user: { id: 'admin-2', role: 'superadmin' } };
    let nextCalled2 = false;
    adminOnly(req2, {}, () => { nextCalled2 = true; });
    assert.equal(nextCalled2, true);
  });
});
