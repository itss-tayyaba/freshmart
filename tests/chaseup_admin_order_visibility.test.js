import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTenantId, isSameTenant } from '../src/data/companyHierarchyData.js';
import { sanitizeOrder } from '../src/utils/orderSanitizer.js';

describe('Chase Up / Case Up Store Admin Order Visibility & Multi-Tenant Isolation', () => {
  it('resolves "case up", "caseup", "cu", and "chaseup" to company_002 (tenant-chaseup)', () => {
    assert.equal(resolveTenantId('case up'), 'company_002');
    assert.equal(resolveTenantId('caseup'), 'company_002');
    assert.equal(resolveTenantId('case-up'), 'company_002');
    assert.equal(resolveTenantId('chase up'), 'company_002');
    assert.equal(resolveTenantId('chaseup'), 'company_002');
    assert.equal(resolveTenantId('cu'), 'company_002');
    assert.equal(resolveTenantId('tenant-chaseup'), 'company_002');

    assert.equal(isSameTenant('case up', 'tenant-chaseup'), true);
    assert.equal(isSameTenant('caseup', 'tenant-chaseup'), true);
    assert.equal(isSameTenant('cu', 'tenant-chaseup'), true);
    assert.equal(isSameTenant('case up', 'company_002'), true);
    assert.equal(isSameTenant('case up', 'tenant-chasevalue'), false);
    assert.equal(isSameTenant('case up', 'tenant-alfatah'), false);
  });

  it('preserves Chase Up / Case Up tenant identity and branch in sanitizeOrder', () => {
    const rawCuOrder = {
      id: '#CU62901',
      orderId: '#CU62901',
      tenantId: 'tenant-chaseup',
      tenantName: 'Chase Up',
      customer: 'Hamza Tariq',
      customerName: 'Hamza Tariq',
      customerPhone: '+923001234567',
      address: 'Clock Tower Hub, Faisalabad',
      city: 'Faisalabad',
      status: 'Pending',
      total: 2450,
      items: [
        {
          id: 'cu-grocery-01',
          name: 'Case Up Premium Basmati Rice 5kg',
          price: 2450,
          quantity: 1
        }
      ]
    };

    const sanitized = sanitizeOrder(rawCuOrder);
    assert.equal(sanitized.id, '#CU62901');
    assert.equal(sanitized.tenantId, 'tenant-chaseup');
    assert.equal(sanitized.branchId, 'branch_006');
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-chaseup'), true);
    assert.equal(isSameTenant(sanitized.tenantId, 'company_002'), true);
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-chasevalue'), false);
    assert.equal(isSameTenant(sanitized.tenantId, 'tenant-alfatah'), false);
  });

  it('isolates orders between Chase Up, Case Value, and Al-Fatah without cross-tenant mixing', () => {
    const orderCu = sanitizeOrder({
      id: '#CU1001',
      tenantId: 'tenant-chaseup',
      tenantName: 'Chase Up',
      customer: 'Client A',
      city: 'Faisalabad',
      items: [{ name: 'Case Up Basmati Rice', price: 1000 }]
    });

    const orderCv = sanitizeOrder({
      id: '#CV2002',
      tenantId: 'tenant-chasevalue',
      tenantName: 'Chase Value',
      customer: 'Client B',
      city: 'Faisalabad',
      items: [{ name: 'Case Value Atta 10kg', price: 1380 }]
    });

    const orderAf = sanitizeOrder({
      id: 'ORD-701',
      tenantId: 'tenant-alfatah',
      tenantName: 'Al-Fatah Supermarket',
      customer: 'Client C',
      city: 'Faisalabad',
      items: [{ name: 'Al-Fatah Gourmet Milk', price: 250 }]
    });

    const allOrders = [orderCu, orderCv, orderAf];

    // Filter simulation for Chase Up Admin: user.tenantId takes priority over storefront currentTenant
    const userRoleAdmin = { role: 'admin', tenantId: 'tenant-chaseup', tenantName: 'Chase Up Admin' };
    const storefrontTenant = { id: 'tenant-alfatah', name: 'Al-Fatah' }; // Customer had Al-Fatah open on web

    const adminActiveTenantId = userRoleAdmin?.tenantId || storefrontTenant?.id;
    assert.equal(adminActiveTenantId, 'tenant-chaseup'); // Never overridden by storefront!

    const chaseUpAdminOrders = allOrders.filter((ord) => {
      const rawItemList = ord.rawItems || ord.items || [];
      const hasCaseValue = rawItemList.some((it) => {
        const n = String(it?.name || '').toLowerCase();
        return n.includes('chase value') || n.includes('case value');
      });
      if (hasCaseValue && isSameTenant(adminActiveTenantId, 'tenant-chasevalue')) return true;
      if (hasCaseValue && !isSameTenant(adminActiveTenantId, 'tenant-chasevalue')) return false;

      const hasChaseUp = rawItemList.some((it) => {
        const n = String(it?.name || '').toLowerCase();
        return n.includes('chase up') || n.includes('case up') || n.includes('caseup');
      });
      if (hasChaseUp && isSameTenant(adminActiveTenantId, 'tenant-chaseup')) return true;
      if (hasChaseUp && !isSameTenant(adminActiveTenantId, 'tenant-chaseup')) return false;

      return isSameTenant(ord.tenantId, adminActiveTenantId);
    });

    assert.equal(chaseUpAdminOrders.length, 1);
    assert.equal(chaseUpAdminOrders[0].id, '#CU1001');
    assert.equal(chaseUpAdminOrders[0].tenantId, 'tenant-chaseup');

    // Case Value Admin filter simulation
    const caseValueActiveTenantId = 'tenant-chasevalue';
    const caseValueAdminOrders = allOrders.filter((ord) => {
      const rawItemList = ord.rawItems || ord.items || [];
      const hasCaseValue = rawItemList.some((it) => {
        const n = String(it?.name || '').toLowerCase();
        return n.includes('chase value') || n.includes('case value');
      });
      if (hasCaseValue && isSameTenant(caseValueActiveTenantId, 'tenant-chasevalue')) return true;
      if (hasCaseValue && !isSameTenant(caseValueActiveTenantId, 'tenant-chasevalue')) return false;

      const hasChaseUp = rawItemList.some((it) => {
        const n = String(it?.name || '').toLowerCase();
        return n.includes('chase up') || n.includes('case up') || n.includes('caseup');
      });
      if (hasChaseUp && isSameTenant(caseValueActiveTenantId, 'tenant-chaseup')) return true;
      if (hasChaseUp && !isSameTenant(caseValueActiveTenantId, 'tenant-chaseup')) return false;

      return isSameTenant(ord.tenantId, caseValueActiveTenantId);
    });

    assert.equal(caseValueAdminOrders.length, 1);
    assert.equal(caseValueAdminOrders[0].id, '#CV2002');
  });

  it('safely handles branch filter bleed when switching across stores', () => {
    const chaseUpBranches = [
      { id: 'branch_006', tenantId: 'tenant-chaseup', name: 'Faisalabad Clock Tower Hub' },
      { id: 'branch_004', tenantId: 'tenant-chaseup', name: 'Clifton Main Branch (Karachi)' }
    ];

    // Persisted filter was an Al-Fatah branch ID
    const currentBranchFilter = 'branch_002';
    const isFilterBelongToTenant = chaseUpBranches.some((b) => b.id === currentBranchFilter);

    // It should not filter out Chase Up orders when the filter belongs to another store
    assert.equal(isFilterBelongToTenant, false);

    const cuOrder = { id: '#CU1001', branchId: 'branch_006', tenantId: 'tenant-chaseup' };
    let list = [cuOrder];

    if (currentBranchFilter && currentBranchFilter !== 'all' && isFilterBelongToTenant) {
      list = list.filter((o) => o.branchId === currentBranchFilter);
    }

    // Orders are preserved and not zeroed out
    assert.equal(list.length, 1);
    assert.equal(list[0].id, '#CU1001');
  });
});
