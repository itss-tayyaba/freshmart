import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ALFATAH_PRODUCTS,
  CHASEVALUE_PRODUCTS,
  CHASEUP_PRODUCTS,
  FRESHMART_PRODUCTS_CATALOG,
  ALL_BRANCH_PRODUCTS,
  BRANCH_METRICS
} from '../src/data/branchCatalogData.js';

describe('Multi-Tenant Supermarket Branch Product & Dashboard Isolation', () => {

  it('ensures each supermarket branch has a dedicated, non-empty product catalog', () => {
    assert.ok(ALFATAH_PRODUCTS.length >= 10, 'Al-Fatah must have at least 10 luxury items');
    assert.ok(CHASEVALUE_PRODUCTS.length >= 10, 'Chase Value must have at least 10 wholesale items');
    assert.ok(CHASEUP_PRODUCTS.length >= 10, 'Chase Up must have at least 10 retail FMCG items');
    assert.ok(FRESHMART_PRODUCTS_CATALOG.length >= 10, 'FreshMart must have at least 10 organic farm items');
    assert.equal(
      ALL_BRANCH_PRODUCTS.length,
      ALFATAH_PRODUCTS.length + CHASEVALUE_PRODUCTS.length + CHASEUP_PRODUCTS.length + FRESHMART_PRODUCTS_CATALOG.length,
      'ALL_BRANCH_PRODUCTS must be the composite of all 4 branch catalogs'
    );
  });

  it('guarantees complete product uniqueness: Al-Fatah and Chase Value have completely different items', () => {
    const alFatahNames = new Set(ALFATAH_PRODUCTS.map((p) => p.name.toLowerCase()));
    const chaseValueNames = new Set(CHASEVALUE_PRODUCTS.map((p) => p.name.toLowerCase()));

    // Check intersection between Al-Fatah (luxury/imported) and Chase Value (wholesale/bulk)
    const intersection = [...alFatahNames].filter((name) => chaseValueNames.has(name));
    assert.deepEqual(intersection, [], 'Al-Fatah and Chase Value must not share identical product names');

    // Confirm distinct brand identities
    assert.ok(
      ALFATAH_PRODUCTS.some((p) => p.name.includes('Basmati') || p.name.includes('Lindt') || p.name.includes('Borges')),
      'Al-Fatah must feature gourmet items'
    );
    assert.ok(
      CHASEVALUE_PRODUCTS.some((p) => p.name.includes('Atta') || p.name.includes('Cooking Oil') || p.name.includes('Detergent')),
      'Chase Value must feature bulk wholesale sacks'
    );
  });

  it('guarantees complete product uniqueness across all 4 supermarket branches', () => {
    const branches = [
      { name: 'Al-Fatah', products: ALFATAH_PRODUCTS, tenantId: 'tenant-alfatah' },
      { name: 'Chase Value', products: CHASEVALUE_PRODUCTS, tenantId: 'tenant-chasevalue' },
      { name: 'Chase Up', products: CHASEUP_PRODUCTS, tenantId: 'tenant-chaseup' },
      { name: 'FreshMart', products: FRESHMART_PRODUCTS_CATALOG, tenantId: 'tenant-freshmart' }
    ];

    // Every product must be explicitly tagged with its correct tenantId
    branches.forEach((b) => {
      b.products.forEach((p) => {
        assert.equal(p.tenantId, b.tenantId, `Product ${p.id} must be tagged with ${b.tenantId}`);
      });
    });

    // Check all product IDs are mutually unique
    const allIds = ALL_BRANCH_PRODUCTS.map((p) => p.id);
    const uniqueIds = new Set(allIds);
    assert.equal(allIds.length, uniqueIds.size, 'Every product across all branches must have a unique ID');
  });

  it('provides distinct dashboard metrics, KPIs, and hubs for each supermarket', () => {
    const alFatahMetrics = BRANCH_METRICS['tenant-alfatah'];
    const chaseValueMetrics = BRANCH_METRICS['tenant-chasevalue'];
    const chaseUpMetrics = BRANCH_METRICS['tenant-chaseup'];
    const freshMartMetrics = BRANCH_METRICS['tenant-freshmart'];

    // All must exist
    assert.ok(alFatahMetrics, 'Al-Fatah metrics must exist');
    assert.ok(chaseValueMetrics, 'Chase Value metrics must exist');
    assert.ok(chaseUpMetrics, 'Chase Up metrics must exist');
    assert.ok(freshMartMetrics, 'FreshMart metrics must exist');

    // Theme colors must be distinct
    assert.notEqual(alFatahMetrics.themeColor, chaseValueMetrics.themeColor);
    assert.notEqual(chaseValueMetrics.themeColor, chaseUpMetrics.themeColor);
    assert.notEqual(chaseUpMetrics.themeColor, freshMartMetrics.themeColor);

    // KPIs must reflect distinct branch business models
    assert.ok(alFatahMetrics.kpis.averageOrderValue > chaseValueMetrics.kpis.averageOrderValue, 'Al-Fatah has higher AOV due to luxury products');
    assert.ok(chaseValueMetrics.kpis.totalOrders > alFatahMetrics.kpis.totalOrders, 'Chase Value has higher wholesale order volume');

    // Hubs must be distinct regional locations
    const alFatahHubs = alFatahMetrics.hubs.map((h) => h.name);
    const chaseValueHubs = chaseValueMetrics.hubs.map((h) => h.name);
    assert.ok(alFatahHubs.some((h) => h.includes('Gulberg') || h.includes('DHA Phase 5')));
    assert.ok(chaseValueHubs.some((h) => h.includes('Shaheed-e-Millat') || h.includes('North Nazimabad')));

    // Special operational widgets must be distinct
    assert.equal(alFatahMetrics.specialWidget.title, 'Gourmet Import Clearance & Cold-Chain Telematics');
    assert.equal(chaseValueMetrics.specialWidget.title, 'Wholesale Pallet Inventory & Bulk Truck Dispatch');
    assert.equal(chaseUpMetrics.specialWidget.title, 'Family FMCG Velocity & Departmental POS Sync');
    assert.equal(freshMartMetrics.specialWidget.title, 'Dark Store 10-Min Dispatch Telematics & Perishable Tracking');
  });

});
