import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { isDbOnline, getDbStatus } from '../server/config/db.js';
import {
  STORE_DEPARTMENTS,
  getDepartmentsByTenant,
  getDepartmentById,
  getAllDepartments
} from '../src/data/departmentData.js';
import {
  ALFATAH_PRODUCTS,
  CHASEVALUE_PRODUCTS,
  CHASEUP_PRODUCTS,
  FRESHMART_PRODUCTS_CATALOG,
  ALL_BRANCH_PRODUCTS
} from '../src/data/branchCatalogData.js';
import { getCategories, getCategoryById } from '../server/controllers/categoryController.js';
import { getProducts, getProductById } from '../server/controllers/productController.js';
import { saveCustomerLocation, getCustomerLocation } from '../server/controllers/extraControllers.js';

describe('Backend Robustness & Unique Department/Product Architecture', () => {

  // =========================================================================
  // 1. Database Connection & Health Telemetry
  // =========================================================================
  describe('1. Database Connection & Resilience', () => {
    it('provides resilient getDbStatus() reporting state and models without throwing', () => {
      const status = getDbStatus();
      assert.ok(status !== null && typeof status === 'object', 'Status must be an object');
      assert.ok(typeof status.online === 'boolean', 'status.online must be a boolean');
      assert.ok(typeof status.readyState === 'number', 'status.readyState must be a number');
      assert.ok(Array.isArray(status.modelsLoaded), 'status.modelsLoaded must be an array');
    });

    it('safely distinguishes test environment without establishing unwanted network locks', () => {
      // In test mode, isDbOnline() cleanly reports false and allows graceful fallback
      assert.equal(isDbOnline(), false, 'isDbOnline() must return false in test environment to avoid blocking test runners');
    });
  });

  // =========================================================================
  // 2. Department Uniqueness & Multi-Tenant Mapping
  // =========================================================================
  describe('2. Unique Department IDs & Store Differentiation', () => {
    it('defines distinct departments for all 4 supermarket brands', () => {
      const afDepts = getDepartmentsByTenant('tenant-alfatah');
      const cuDepts = getDepartmentsByTenant('tenant-chaseup');
      const cvDepts = getDepartmentsByTenant('tenant-chasevalue');
      const umDepts = getDepartmentsByTenant('tenant-freshmart');

      assert.ok(afDepts.length >= 7, 'Al-Fatah must have at least 7 luxury departments');
      assert.ok(cuDepts.length >= 7, 'Chase Up must have at least 7 family departments');
      assert.ok(cvDepts.length >= 7, 'Chase Value must have at least 7 wholesale departments');
      assert.ok(umDepts.length >= 7, 'Unimaart must have at least 7 farm-fresh departments');

      // Every department must have unique departmentId
      const allDeptIds = STORE_DEPARTMENTS.map((d) => d.departmentId);
      const uniqueDeptIds = new Set(allDeptIds);
      assert.equal(allDeptIds.length, uniqueDeptIds.size, 'Every departmentId across platform must be unique');

      // Every department must have unique composite ID
      const allIds = STORE_DEPARTMENTS.map((d) => d.id);
      const uniqueIds = new Set(allIds);
      assert.equal(allIds.length, uniqueIds.size, 'Every department ID across platform must be unique');
    });

    it('enforces store-specific department naming, codes, and metadata', () => {
      const afStaples = getDepartmentById('dept-af-staples');
      assert.ok(afStaples, 'Al-Fatah staples department must exist');
      assert.equal(afStaples.departmentCode, 'DEPT-AF-01');
      assert.equal(afStaples.name, 'Gourmet Staples & Royal Grains');
      assert.equal(afStaples.tenantId, 'tenant-alfatah');

      const cvStaples = getDepartmentById('dept-cv-staples');
      assert.ok(cvStaples, 'Chase Value staples department must exist');
      assert.equal(cvStaples.departmentCode, 'DEPT-CV-01');
      assert.equal(cvStaples.name, 'Wholesale Sacks (Atta, Rice & Pulses)');
      assert.equal(cvStaples.tenantId, 'tenant-chasevalue');

      const cuPantry = getDepartmentById('dept-cu-pantry');
      assert.ok(cuPantry, 'Chase Up pantry department must exist');
      assert.equal(cuPantry.departmentCode, 'DEPT-CU-02');
      assert.equal(cuPantry.name, 'Essential Pantry, Spices & Recipe Mixes');
      assert.equal(cuPantry.tenantId, 'tenant-chaseup');

      const umProduce = getDepartmentById('dept-um-produce');
      assert.ok(umProduce, 'Unimaart produce department must exist');
      assert.equal(umProduce.departmentCode, 'DEPT-UM-01');
      assert.equal(umProduce.name, 'Fresh Farm Fruits & Organic Vegetables');
      assert.equal(umProduce.tenantId, 'tenant-freshmart');
    });

    it('returns tenant-scoped categories via categoryController.getCategories', async () => {
      let responseData = null;
      const req = {
        query: { tenantId: 'tenant-alfatah' },
        headers: {}
      };
      const res = {
        json(data) { responseData = data; return data; }
      };

      await getCategories(req, res);
      assert.equal(responseData.success, true);
      assert.equal(responseData.tenantId, 'tenant-alfatah');
      assert.ok(responseData.departments.length > 0);

      // Verify all returned departments belong to Al-Fatah
      responseData.departments.forEach((dept) => {
        assert.ok(
          dept.tenantId === 'tenant-alfatah' || dept.companyId === 'company_001',
          `Department ${dept.departmentId} must belong to Al-Fatah`
        );
      });
    });
  });

  // =========================================================================
  // 3. Product Catalog Uniqueness & Department Mapping
  // =========================================================================
  describe('3. Product Unique IDs, Tenant Scoping & Department Mapping', () => {
    it('ensures every product has a customId, departmentId, and departmentCode', () => {
      ALL_BRANCH_PRODUCTS.forEach((product) => {
        assert.ok(product.id, 'Product must have an id');
        assert.ok(product.customId, `Product ${product.id} must have customId`);
        assert.ok(product.tenantId, `Product ${product.id} must have tenantId`);
        assert.ok(product.departmentId, `Product ${product.id} must have departmentId`);
        assert.ok(product.departmentCode, `Product ${product.id} must have departmentCode`);
        assert.ok(product.price > 0, `Product ${product.id} must have price > 0`);
      });
    });

    it('scopes product queries strictly to the requested tenant without bleed', async () => {
      let responseData = null;
      const req = {
        query: { tenantId: 'tenant-chasevalue', limit: 50 },
        headers: {}
      };
      const res = {
        json(data) { responseData = data; return data; }
      };

      await getProducts(req, res);
      assert.equal(responseData.success, true);
      assert.equal(responseData.tenantId, 'tenant-chasevalue');
      assert.ok(responseData.products.length > 0);

      // Verify zero products from Al-Fatah or Chase Up leak into Chase Value
      responseData.products.forEach((p) => {
        assert.equal(p.tenantId, 'tenant-chasevalue', `Product ${p.id} must belong to Chase Value`);
        assert.ok(!p.name.includes('Lindt'), 'No luxury chocolates should appear in Chase Value');
        assert.ok(!p.name.includes('Borges'), 'No Spanish luxury oils should appear in Chase Value');
      });
    });

    it('filters products by departmentId via productController', async () => {
      let responseData = null;
      const req = {
        query: { tenantId: 'tenant-alfatah', departmentId: 'dept-af-staples', limit: 50 },
        headers: {}
      };
      const res = {
        json(data) { responseData = data; return data; }
      };

      await getProducts(req, res);
      assert.equal(responseData.success, true);
      assert.ok(responseData.products.length > 0);

      // Verify all products belong to the staples department
      responseData.products.forEach((p) => {
        assert.equal(p.departmentId, 'dept-af-staples');
      });
    });

    it('resolves individual product by customId with full relative info', async () => {
      let responseData = null;
      const req = {
        params: { id: 'alfatah-basmati-rice-5kg' },
        query: { tenantId: 'tenant-alfatah' },
        headers: {}
      };
      const res = {
        json(data) { responseData = data; return data; },
        status() { return this; }
      };

      await getProductById(req, res);
      assert.equal(responseData.success, true);
      assert.ok(responseData.product);
      assert.equal(responseData.product.customId, 'alfatah-basmati-rice-5kg');
      assert.equal(responseData.product.departmentId, 'dept-af-staples');
      assert.equal(responseData.product.departmentCode, 'DEPT-AF-01');
      assert.ok(responseData.product.nutrition, 'Product must include relative nutritional info');
      assert.ok(responseData.product.description.length > 20, 'Product must include detailed description');
    });
  });

  // =========================================================================
  // 4. Delivery Location Persistence & Order Type Enforcement
  // =========================================================================
  describe('4. Delivery Location Persistence & Order Type Enforcement', () => {
    it('persists customer location with city, address, and enforces orderType as Delivery', async () => {
      let responseData = null;
      let statusCode = 200;
      const req = {
        body: {
          city: 'Faisalabad',
          address: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
          area: 'Peoples Colony 1',
          coords: { lat: 31.4125, lng: 73.0995 },
          phone: '+92 300 1234567',
          tenantId: 'tenant-alfatah',
          sessionId: 'test_session_123'
        },
        headers: {}
      };
      const res = {
        status(code) { statusCode = code; return this; },
        json(data) { responseData = data; return data; }
      };

      await saveCustomerLocation(req, res);
      assert.equal(statusCode, 200);
      assert.equal(responseData.success, true);
      assert.equal(responseData.location.city, 'Faisalabad');
      assert.equal(responseData.location.orderType, 'Delivery');
      assert.ok(responseData.location.address.includes('Peoples Colony'));
    });

    it('retrieves previously saved delivery location by session or user', async () => {
      let responseData = null;
      const req = {
        query: { sessionId: 'test_session_123' },
        headers: {}
      };
      const res = {
        json(data) { responseData = data; return data; },
        status() { return this; }
      };

      await getCustomerLocation(req, res);
      assert.equal(responseData.success, true);
      assert.ok(responseData.location);
      assert.equal(responseData.location.city, 'Faisalabad');
      assert.equal(responseData.location.orderType, 'Delivery');
    });
  });

});
