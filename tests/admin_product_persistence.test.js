import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  loadDiskProducts,
  saveDiskProduct,
  removeDiskProduct
} from '../server/controllers/productController.js';
import { ALL_BRANCH_PRODUCTS } from '../src/data/branchCatalogData.js';

describe('Admin Product Persistence & Landing Page Verification', () => {
  const PRODUCTS_FILE_PATH = path.resolve(process.cwd(), 'server/data/products_db.json');
  let originalDiskContent = '[]';

  before(() => {
    if (fs.existsSync(PRODUCTS_FILE_PATH)) {
      originalDiskContent = fs.readFileSync(PRODUCTS_FILE_PATH, 'utf-8');
    }
  });

  after(() => {
    // Restore clean disk database after test
    fs.writeFileSync(PRODUCTS_FILE_PATH, originalDiskContent, 'utf-8');
  });

  it('1. Initial catalog starts with only a few items per brand (5 items per brand, 20 total)', () => {
    assert.equal(ALL_BRANCH_PRODUCTS.length, 20, 'Curated base catalog must have only 20 clean items');
    
    const brands = ['tenant-alfatah', 'tenant-chasevalue', 'tenant-chaseup', 'tenant-freshmart'];
    brands.forEach((brand) => {
      const brandItems = ALL_BRANCH_PRODUCTS.filter((p) => p.tenantId === brand);
      assert.equal(brandItems.length, 5, `Brand ${brand} must only have 5 initial items, not bloated`);
    });
  });

  it('2. Adding an item from admin side saves directly to database (products_db.json)', async () => {
    const testProductPayload = {
      name: 'Organic Strawberry Jam Premium',
      price: 450,
      originalPrice: 500,
      discountPercent: 10,
      category: 'grocery-staples',
      categoryLabel: 'Grocery Staples',
      unit: '350g Glass Jar',
      image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80',
      stock: 35,
      tenantId: 'tenant-alfatah',
      tenantName: 'Al-Fatah Supermarket'
    };

    let statusCode = 0;
    let responseData = null;
    const mockReq = { body: testProductPayload };
    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await createProduct(mockReq, mockRes);
    assert.equal(statusCode, 201, 'Product creation should return HTTP 201');
    assert.ok(responseData.success, 'Response must be success');
    assert.equal(responseData.product.name, 'Organic Strawberry Jam Premium');

    // Verify it is physically written to products_db.json
    const diskItems = loadDiskProducts();
    const foundOnDisk = diskItems.find((p) => p.name === 'Organic Strawberry Jam Premium');
    assert.ok(foundOnDisk, 'Newly added product MUST exist in server/data/products_db.json database file');
    assert.equal(foundOnDisk.tenantId, 'tenant-alfatah');
  });

  it('3. GET /api/products returns the newly created admin item merged at the top for landing page', async () => {
    let responseData = null;
    const mockReq = {
      query: { tenantId: 'tenant-alfatah' },
      headers: {},
      user: null
    };
    const mockRes = {
      json(data) {
        responseData = data;
        return this;
      }
    };

    await getProducts(mockReq, mockRes);
    assert.ok(responseData.success);
    assert.ok(responseData.products.length >= 6, 'Al-Fatah catalog should now have 6 items (5 base + 1 admin)');

    // The newly created admin item should be in the returned list
    const found = responseData.products.find((p) => p.name === 'Organic Strawberry Jam Premium');
    assert.ok(found, 'Admin added item must be present in tenant products list for landing page');
  });

  it('4. Updating a product updates both database and live catalog', async () => {
    const diskItems = loadDiskProducts();
    const target = diskItems.find((p) => p.name === 'Organic Strawberry Jam Premium');
    assert.ok(target, 'Product must exist to update');

    let responseData = null;
    const mockReq = {
      params: { id: target.id || target.customId },
      body: { price: 499, description: 'Updated gourmet strawberry jam' }
    };
    const mockRes = {
      json(data) {
        responseData = data;
        return this;
      }
    };

    await updateProduct(mockReq, mockRes);
    assert.ok(responseData.success);

    const reloadedDisk = loadDiskProducts();
    const updatedDisk = reloadedDisk.find((p) => (p.id || p.customId) === (target.id || target.customId));
    assert.equal(updatedDisk.price, 499, 'Updated price must be saved on database disk file');
  });

  it('5. Deleting a product removes it cleanly from database', async () => {
    const diskItems = loadDiskProducts();
    const target = diskItems.find((p) => p.name === 'Organic Strawberry Jam Premium');
    assert.ok(target);

    let responseData = null;
    const mockReq = {
      params: { id: target.id || target.customId }
    };
    const mockRes = {
      json(data) {
        responseData = data;
        return this;
      }
    };

    await deleteProduct(mockReq, mockRes);
    assert.ok(responseData.success);

    const reloadedDisk = loadDiskProducts();
    const stillExists = reloadedDisk.find((p) => (p.id || p.customId) === (target.id || target.customId));
    assert.equal(stillExists, undefined, 'Deleted product must be removed from database disk file');
  });
});
