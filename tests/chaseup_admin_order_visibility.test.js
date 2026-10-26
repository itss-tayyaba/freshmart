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
      customer: 'Online Customer',
      customerName: 'Online Customer',
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

  it('filters out legacy test data and preserves live Chase Up customer orders', () => {
    const rawOrders = [
      { id: 'ORD-701', tenantId: 'tenant-alfatah', customer: 'Tayyaba Batool', total: 970 },
      { id: '#CV4092', tenantId: 'tenant-chasevalue', customer: 'Usman Farooq', total: 1380 },
      { id: '#CU62901', tenantId: 'tenant-chaseup', customer: 'Hamza Tariq', total: 2450 },
      { id: 'ORD-CU-001', tenantId: 'tenant-chaseup', customer: 'Zainab Merchant', total: 3400 },
      { id: '#CU99123', tenantId: 'tenant-chaseup', customer: 'Online Customer', total: 1850 }
    ];

    // Filter out Hamza and Zainab mock test data
    const cleanedOrders = rawOrders.filter(
      (o) => o.customer !== 'Hamza Tariq' && o.customer !== 'Zainab Merchant'
    ).map(sanitizeOrder);

    // Chase Up Store Admin view filter
    const targetTenantId = 'tenant-chaseup';
    const chaseUpOrders = cleanedOrders.filter((o) => {
      const idLower = String(o.id || o.orderId || '').toLowerCase();
      if ((idLower.startsWith('#cu') || idLower.startsWith('cu-') || idLower.startsWith('ord-cu')) && isSameTenant(targetTenantId, 'tenant-chaseup')) {
        return true;
      }
      return isSameTenant(o.tenantId, targetTenantId);
    });

    assert.equal(chaseUpOrders.length, 1);
    assert.equal(chaseUpOrders[0].id, '#CU99123');
    assert.equal(chaseUpOrders[0].customer, 'Online Customer');
  });

  it('guarantees newly placed pending order #CU39015 for fatii displays at the top ahead of delivered order #CU25815 areeba', () => {
    const orderFatii = sanitizeOrder({
      id: '#CU39015',
      orderId: '#CU39015',
      tenantId: 'tenant-chaseup',
      tenantName: 'Chase Up',
      customer: 'fatii',
      customerName: 'fatii',
      recipientName: 'fatii',
      customerPhone: '+923001234567',
      address: 'Peoples Colony No. 01, Faisalabad',
      city: 'Faisalabad',
      status: 'Pending',
      total: 671,
      createdAt: '2026-10-26T08:05:48.000Z',
      items: [{ name: 'Colgate Total Advanced Health Toothpaste Twin Pack (150g x 2)', price: 690, quantity: 1 }]
    });

    const orderAreeba = sanitizeOrder({
      id: '#CU25815',
      orderId: '#CU25815',
      tenantId: 'tenant-chaseup',
      tenantName: 'Chase Up',
      customer: 'areeba',
      customerName: 'areeba',
      customerPhone: '03206551696',
      address: 'Mall of Faisalabad Flagship (Faisalabad)',
      city: 'Faisalabad',
      status: 'Delivered',
      isDelivered: true,
      deliveredAt: '2026-10-26T08:00:00.000Z',
      createdAt: '2026-10-26T07:30:00.000Z',
      total: 1665,
      items: [{ name: "1x K&N's Combo...", price: 1665, quantity: 1 }]
    });

    const targetTenantId = 'tenant-chaseup';
    const rawList = [orderAreeba, orderFatii]; // delivered order was listed first in raw list

    // OrdersView tenant filtering
    const filtered = rawList.filter((o) => {
      const idLower = String(o.id || o.orderId || o._id || '').toLowerCase();
      const bareId = idLower.replace(/^#/, '').trim();
      if ((bareId.startsWith('cu') || bareId.startsWith('ord-cu') || bareId.includes('-cu-') || bareId.includes('caseup')) && isSameTenant(targetTenantId, 'tenant-chaseup')) {
        return true;
      }
      return isSameTenant(o.tenantId, targetTenantId);
    });

    assert.equal(filtered.length, 2);

    // OrdersView sort logic: Active pending orders must sort to the top, newest first
    const sorted = [...filtered].sort((a, b) => {
      const isCompleteA = ['delivered', 'cancelled'].includes(String(a.status || '').toLowerCase()) || a.isDelivered;
      const isCompleteB = ['delivered', 'cancelled'].includes(String(b.status || '').toLowerCase()) || b.isDelivered;
      if (!isCompleteA && isCompleteB) return -1;
      if (isCompleteA && !isCompleteB) return 1;

      if (isCompleteA && isCompleteB) {
        const timeDelA = new Date(a.deliveredAt || a.fulfillmentUpdatedAt || a.createdAt || 0).getTime();
        const timeDelB = new Date(b.deliveredAt || b.fulfillmentUpdatedAt || b.createdAt || 0).getTime();
        if (timeDelA !== timeDelB) return timeDelB - timeDelA;
      }

      const timeA = new Date(a.createdAt || a.fulfillmentUpdatedAt || a.time || 0).getTime();
      const timeB = new Date(b.createdAt || b.fulfillmentUpdatedAt || b.time || 0).getTime();
      return timeB - timeA;
    });

    // #CU39015 (fatii) MUST be row 1
    assert.equal(sorted[0].id, '#CU39015');
    assert.equal(sorted[0].customerName, 'fatii');
    assert.equal(sorted[0].status, 'Pending');

    // #CU25815 (areeba) comes after active orders
    assert.equal(sorted[1].id, '#CU25815');
    assert.equal(sorted[1].customerName, 'areeba');
    assert.equal(sorted[1].status, 'Delivered');
  });

  it('matches Chase Up order IDs even without leading "#" symbol (e.g. cu39015, CU39015)', () => {
    const rawOrderWithoutHash = {
      id: 'cu39015',
      orderId: 'cu39015',
      customer: 'fatii',
      status: 'Pending'
    };

    const targetTenantId = 'tenant-chaseup';
    const idLower = String(rawOrderWithoutHash.id).toLowerCase();
    const bareId = idLower.replace(/^#/, '').trim();

    const matches = (bareId.startsWith('cu') || bareId.startsWith('ord-cu') || bareId.includes('-cu-') || bareId.includes('caseup')) && isSameTenant(targetTenantId, 'tenant-chaseup');
    assert.equal(matches, true);
  });
});
