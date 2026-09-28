import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  COMPANIES,
  BRANCHES,
  PRODUCTS,
  INVENTORY,
  ORDERS,
  resolveTenantId,
  getBranchesByTenant,
  getProductsByTenant,
  getInventoryByBranch,
  getOrdersByBranch,
  updateBranchInventory,
  validateTenantBranchAccess
} from '../src/data/companyHierarchyData.js';

describe('Multi-Company & Branch Architecture (User → Tenant → Branch → Data)', () => {

  // =========================================================================
  // 1. COMPANIES SCHEMA & HIERARCHY
  // =========================================================================
  describe('1. Companies Collection Schema & Data', () => {
    it('defines the required companies: Al-Fatah, Chase Up, CaseValue, Unimaart', () => {
      assert.ok(COMPANIES.length >= 4, 'Expected at least 4 companies');

      const companyNames = COMPANIES.map((c) => c.name);
      assert.ok(companyNames.includes('Al-Fatah'), 'Al-Fatah must exist');
      assert.ok(companyNames.includes('Chase Up'), 'Chase Up must exist');
      assert.ok(companyNames.includes('CaseValue'), 'CaseValue must exist');
      assert.ok(companyNames.includes('Unimaart'), 'Unimaart must exist');
    });

    it('enforces exact company schema (_id, name, slug, logo, status)', () => {
      for (const comp of COMPANIES) {
        assert.ok(comp._id, `Company ${comp.name} must have _id`);
        assert.ok(comp.name, `Company ${comp.name} must have name`);
        assert.ok(comp.slug, `Company ${comp.name} must have slug`);
        assert.ok(comp.logo, `Company ${comp.name} must have logo`);
        assert.equal(comp.status, 'active', `Company ${comp.name} must be active`);
      }

      // Check example company_001
      const alFatah = COMPANIES.find((c) => c._id === 'company_001');
      assert.deepEqual(
        {
          _id: alFatah._id,
          name: alFatah.name,
          slug: alFatah.slug,
          logo: alFatah.logo,
          status: alFatah.status
        },
        {
          _id: 'company_001',
          name: 'Al-Fatah',
          slug: 'al-fatah',
          logo: '🏬',
          status: 'active'
        }
      );
    });
  });

  // =========================================================================
  // 2. BRANCHES SCHEMA & MULTI-TENANT ISOLATION
  // =========================================================================
  describe('2. Branches Collection Schema & Scoping', () => {
    it('enforces exact branch schema (_id, tenantId, name, city, latitude, longitude)', () => {
      for (const branch of BRANCHES) {
        assert.ok(branch._id, `Branch ${branch.name} must have _id`);
        assert.ok(branch.tenantId, `Branch ${branch.name} must have tenantId`);
        assert.ok(branch.name, `Branch ${branch.name} must have name`);
        assert.ok(branch.city, `Branch ${branch.name} must have city`);
        assert.equal(typeof branch.latitude, 'number', `Branch ${branch.name} must have numeric latitude`);
        assert.equal(typeof branch.longitude, 'number', `Branch ${branch.name} must have numeric longitude`);
      }

      // Check example branch_001
      const dha = BRANCHES.find((b) => b._id === 'branch_001');
      assert.deepEqual(
        {
          _id: dha._id,
          tenantId: dha.tenantId,
          name: dha.name,
          city: dha.city,
          latitude: dha.latitude,
          longitude: dha.longitude
        },
        {
          _id: 'branch_001',
          tenantId: 'company_001',
          name: 'DHA Lahore',
          city: 'Lahore',
          latitude: 31.4697,
          longitude: 74.4082
        }
      );
    });

    it('correctly associates branches with their respective companies', () => {
      const alFatahBranches = getBranchesByTenant('company_001');
      assert.ok(alFatahBranches.length >= 2, 'Al-Fatah must have multiple branches');
      assert.ok(alFatahBranches.some((b) => b.name === 'DHA Lahore'));
      assert.ok(alFatahBranches.some((b) => b.name === 'Gulberg Mall'));

      const chaseUpBranches = getBranchesByTenant('company_002');
      assert.ok(chaseUpBranches.some((b) => b.name === 'Clifton Karachi'));

      const chaseValBranches = getBranchesByTenant('company_003');
      assert.ok(chaseValBranches.some((b) => b.name === 'Shaheed-e-Millat Karachi'));

      const unimaartBranches = getBranchesByTenant('company_004');
      assert.ok(unimaartBranches.some((b) => b.name === 'Gulberg SuperHub'));
    });
  });

  // =========================================================================
  // 3. PRODUCTS SCHEMA & COMPANY TENANT SCOPING
  // =========================================================================
  describe('3. Products Collection Schema & Scoping', () => {
    it('enforces product schema (_id, tenantId, name, categoryId)', () => {
      for (const prod of PRODUCTS) {
        assert.ok(prod._id, `Product ${prod.name} must have _id`);
        assert.ok(prod.tenantId, `Product ${prod.name} must have tenantId`);
        assert.ok(prod.name, `Product ${prod.name} must have name`);
        assert.ok(prod.categoryId, `Product ${prod.name} must have categoryId`);
      }

      // Check example product_001
      const milk = PRODUCTS.find((p) => p._id === 'product_001');
      assert.deepEqual(
        {
          _id: milk._id,
          tenantId: milk.tenantId,
          name: milk.name,
          categoryId: milk.categoryId
        },
        {
          _id: 'product_001',
          tenantId: 'company_001',
          name: 'Nestle Milk 1L',
          categoryId: 'dairy'
        }
      );
    });

    it('isolates products strictly per company', () => {
      const alFatahProds = getProductsByTenant('company_001');
      const chaseUpProds = getProductsByTenant('company_002');

      assert.ok(alFatahProds.some((p) => p.name === 'Nestle Milk 1L'));
      assert.ok(!chaseUpProds.some((p) => p.name === 'Nestle Milk 1L'), 'Chase Up must not own Al-Fatah products');
    });
  });

  // =========================================================================
  // 4. INVENTORY PER BRANCH (tenantId, branchId, productId, price, stock)
  // =========================================================================
  describe('4. Inventory Collection Schema & Branch Scoping', () => {
    it('enforces branch inventory schema (tenantId, branchId, productId, price, stock)', () => {
      for (const item of INVENTORY) {
        assert.ok(item.tenantId, 'Inventory must have tenantId');
        assert.ok(item.branchId, 'Inventory must have branchId');
        assert.ok(item.productId, 'Inventory must have productId');
        assert.equal(typeof item.price, 'number', 'Inventory must have numeric price');
        assert.equal(typeof item.stock, 'number', 'Inventory must have numeric stock');
      }

      // Check example inventory item at DHA Lahore
      const item = INVENTORY.find(
        (i) => i.tenantId === 'company_001' && i.branchId === 'branch_001' && i.productId === 'product_001'
      );
      assert.deepEqual(
        {
          tenantId: item.tenantId,
          branchId: item.branchId,
          productId: item.productId,
          price: item.price,
          stock: item.stock
        },
        {
          tenantId: 'company_001',
          branchId: 'branch_001',
          productId: 'product_001',
          price: 350,
          stock: 120
        }
      );
    });

    it('updates stock and price strictly for a target branch without affecting others', () => {
      const updatedDha = updateBranchInventory('company_001', 'branch_001', 'product_001', { stock: 140, price: 360 });
      assert.equal(updatedDha.stock, 140);
      assert.equal(updatedDha.price, 360);

      // Verify Gulberg branch stock was untouched
      const gulbergItem = INVENTORY.find(
        (i) => i.tenantId === 'company_001' && i.branchId === 'branch_002' && i.productId === 'product_001'
      );
      assert.equal(gulbergItem.stock, 85, 'Gulberg stock must remain separate and intact');
    });
  });

  // =========================================================================
  // 5. ORDERS PER BRANCH (tenantId, branchId, customerId, items, total, status)
  // =========================================================================
  describe('5. Orders Collection Schema & Branch Routing', () => {
    it('enforces branch order schema (tenantId, branchId, customerId, items, total, status)', () => {
      for (const order of ORDERS) {
        assert.ok(order.tenantId, 'Order must have tenantId');
        assert.ok(order.branchId, 'Order must have branchId');
        assert.ok(order.customerId, 'Order must have customerId');
        assert.ok(Array.isArray(order.items), 'Order must have items array');
        assert.equal(typeof order.total, 'number', 'Order must have numeric total');
        assert.ok(order.status, 'Order must have status');
      }

      // Check example order_001
      const order1 = ORDERS.find((o) => o._id === 'order_001');
      assert.equal(order1.tenantId, 'company_001');
      assert.equal(order1.branchId, 'branch_001');
      assert.equal(order1.customerId, 'customer_123');
      assert.equal(order1.total, 1400);
      assert.equal(order1.status, 'preparing');
    });

    it('filters orders accurately per branch', () => {
      const dhaOrders = getOrdersByBranch('company_001', 'branch_001');
      assert.ok(dhaOrders.length >= 1);
      assert.ok(dhaOrders.every((o) => o.branchId === 'branch_001'));
    });
  });

  // =========================================================================
  // 6. ENFORCEMENT LOGIC: User → Tenant → Branch → Data
  // =========================================================================
  describe('6. Security & Isolation Policy (User → Tenant → Branch → Data)', () => {
    it('allows Super Admin full cross-company and cross-branch access', () => {
      const superAdminUser = { id: 'super-1', role: 'superadmin' };
      const check = validateTenantBranchAccess(superAdminUser, 'company_001', 'branch_001');
      assert.equal(check.allowed, true);

      const checkOther = validateTenantBranchAccess(superAdminUser, 'company_002', 'branch_004');
      assert.equal(checkOther.allowed, true);
    });

    it('allows Store Admin access to their own company and its branches', () => {
      const alFatahAdmin = { id: 'user-af-1', role: 'admin', tenantId: 'company_001' };
      const checkSelf = validateTenantBranchAccess(alFatahAdmin, 'company_001', 'branch_001');
      assert.equal(checkSelf.allowed, true);

      const checkBranch2 = validateTenantBranchAccess(alFatahAdmin, 'company_001', 'branch_002');
      assert.equal(checkBranch2.allowed, true);
    });

    it('STRICTLY BLOCKS cross-company access attempt with 403 Forbidden', () => {
      const alFatahAdmin = { id: 'user-af-1', role: 'admin', tenantId: 'company_001' };
      const crossAttempt = validateTenantBranchAccess(alFatahAdmin, 'company_002', 'branch_004');

      assert.equal(crossAttempt.allowed, false);
      assert.equal(crossAttempt.statusCode, 403);
      assert.ok(crossAttempt.error.includes('Cross-company access violation'));
    });

    it('STRICTLY BLOCKS cross-branch access for branch-restricted staff with 403 Forbidden', () => {
      const dhaStaffUser = { id: 'staff-dha', role: 'staff', tenantId: 'company_001', branchId: 'branch_001' };
      
      // Allowed on their branch
      const selfCheck = validateTenantBranchAccess(dhaStaffUser, 'company_001', 'branch_001');
      assert.equal(selfCheck.allowed, true);

      // Blocked on other branch
      const foreignBranch = validateTenantBranchAccess(dhaStaffUser, 'company_001', 'branch_002');
      assert.equal(foreignBranch.allowed, false);
      assert.equal(foreignBranch.statusCode, 403);
      assert.ok(foreignBranch.error.includes('Cross-branch access violation'));
    });
  });
});
