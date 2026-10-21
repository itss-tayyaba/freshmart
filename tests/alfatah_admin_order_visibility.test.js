import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTenantId, isSameTenant } from '../src/data/companyHierarchyData.js';
import { sanitizeOrder } from '../src/utils/orderSanitizer.js';

describe('Al-Fatah Store Admin Order Visibility & Multi-Tenant Isolation', () => {
  it('preserves Al-Fatah tenant identity in sanitizeOrder even when customer is Tayyaba Batool', () => {
    const rawOrder = {
      id: 'ORD-701',
      orderId: 'ORD-701',
      tenantId: 'tenant-alfatah',
      tenantName: 'Al-Fatah Supermarket',
      customer: 'Tayyaba Batool',
      customerName: 'Tayyaba Batool',
      customerPhone: '+923206551696',
      address: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
      city: 'Faisalabad',
      status: 'Pending',
      total: 970
    };

    const sanitized = sanitizeOrder(rawOrder);
    assert.equal(sanitized.id, 'ORD-701');
    assert.equal(sanitized.tenantId, 'tenant-alfatah');
    assert.equal(sanitized.tenantName, 'Al-Fatah Supermarket');
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-alfatah'), true);
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-freshmart'), false);
  });

  it('preserves Unimaart tenant identity for #FM83459 in sanitizeOrder', () => {
    const rawFmOrder = {
      id: '#FM83459',
      orderId: '#FM83459',
      tenantId: 'tenant-freshmart',
      tenantName: 'Unimaart (Market Store)',
      customer: 'Tayyaba',
      customerName: 'Tayyaba',
      address: 'Peoples Colony No.01, Faisalabad',
      status: 'Pending',
      total: 140
    };

    const sanitized = sanitizeOrder(rawFmOrder);
    assert.equal(sanitized.tenantId, 'tenant-freshmart');
    assert.equal(sanitized.tenantName, 'Unimaart (Market Store)');
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-freshmart'), true);
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-alfatah'), false);
  });

  it('robustly resolves all Al-Fatah naming variants via resolveTenantId and isSameTenant', () => {
    const variants = [
      'tenant-alfatah',
      'company_001',
      'al-fatah',
      'Al-Fatah',
      'Al-Fatah Supermarket',
      'alfatah',
      'Al Fatah'
    ];

    variants.forEach((v) => {
      assert.equal(resolveTenantId(v), 'company_001', `Failed resolving variant: ${v}`);
      assert.equal(isSameTenant(v, 'tenant-alfatah'), true, `isSameTenant failed for ${v} against tenant-alfatah`);
      assert.equal(isSameTenant(v, 'company_001'), true, `isSameTenant failed for ${v} against company_001`);
      assert.equal(isSameTenant(v, 'tenant-freshmart'), false, `isSameTenant falsely matched ${v} against tenant-freshmart`);
    });
  });

  it('Al-Fatah Store Admin live orders filter includes ORD-701 and excludes Unimaart orders', () => {
    const orders = [
      {
        id: 'ORD-701',
        orderId: 'ORD-701',
        tenantId: 'tenant-alfatah',
        tenantName: 'Al-Fatah Supermarket',
        customer: 'Tayyaba Batool',
        status: 'Pending',
        total: 970
      },
      {
        id: '#FM83459',
        orderId: '#FM83459',
        tenantId: 'tenant-freshmart',
        tenantName: 'Unimaart (Market Store)',
        customer: 'Tayyaba',
        status: 'Pending',
        total: 140
      }
    ];

    // Simulate Al-Fatah Store Admin view
    const targetTenantId = 'tenant-alfatah';
    const alfatahAdminOrders = orders.filter((o) => {
      const orderTenant = o.tenantId || o.companyId || o.tenantName;
      return isSameTenant(orderTenant, targetTenantId);
    });

    assert.equal(alfatahAdminOrders.length, 1);
    assert.equal(alfatahAdminOrders[0].id, 'ORD-701');

    // Simulate Unimaart Store Admin view
    const unimaartTenantId = 'tenant-freshmart';
    const unimaartAdminOrders = orders.filter((o) => {
      const orderTenant = o.tenantId || o.companyId || o.tenantName;
      return isSameTenant(orderTenant, unimaartTenantId);
    });

    assert.equal(unimaartAdminOrders.length, 1);
    assert.equal(unimaartAdminOrders[0].id, '#FM83459');
  });

  it('recovers corrupted ORD-701 that was mistakenly marked as tenant-freshmart back to Al-Fatah', () => {
    const corruptedOrder = {
      id: 'ORD-701',
      orderId: 'ORD-701',
      tenantId: 'tenant-freshmart', // previously corrupted
      tenantName: 'Unimaart',
      customer: 'Tayyaba Batool',
      address: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad'
    };

    const recovered = sanitizeOrder(corruptedOrder);
    assert.equal(recovered.tenantId, 'tenant-alfatah');
    assert.equal(recovered.tenantName, 'Al-Fatah Supermarket');
    assert.equal(isSameTenant(recovered.tenantId, 'tenant-alfatah'), true);
  });
});
