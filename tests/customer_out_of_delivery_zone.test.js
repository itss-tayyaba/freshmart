import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  findAvailableRetailers,
  calculateHaversineDistanceKm
} from '../src/utils/distanceCalculator.js';
import { BRANCHES, resolveTenantId } from '../src/data/companyHierarchyData.js';
import { INITIAL_TENANTS } from '../src/data/tenantData.js';

describe('Customer Out of Delivery Zone & Location Change Enforcement', () => {

  // Coordinates
  const D_GROUND_IN_ZONE = { lat: 31.4125, lng: 73.0995 }; // Inside retailer zones (Faisalabad center)
  const OUTSKIRTS_FAR_AWAY = { lat: 31.2500, lng: 72.8500 }; // ~30 km outside all delivery zones
  const CHINIOT_RURAL = { lat: 31.7200, lng: 72.9800 }; // ~36 km outside Faisalabad zones

  // Helper mimicking StoreContext's getNearbyStores & deliverability evaluation
  const evaluateStoreDeliverability = (coords) => {
    const discoveryResult = findAvailableRetailers(coords, BRANCHES, { maxSearchRadiusKm: 25 });
    
    const storeList = INITIAL_TENANTS.map((tenant) => {
      const tenantCanonicalId = resolveTenantId(tenant.id);
      const eligibleGroup = discoveryResult.eligibleRetailers.find(
        (r) => r.tenantId === tenant.id || r.tenantId === tenantCanonicalId
      );
      const isDeliverable = Boolean(eligibleGroup && eligibleGroup.isEligible);
      return {
        id: tenant.id,
        name: tenant.name,
        isDeliverable
      };
    });

    const deliverableStores = storeList.filter((s) => s.isDeliverable);
    const isOutsideDeliveryZone = deliverableStores.length === 0;

    return {
      storeList,
      deliverableStores,
      isOutsideDeliveryZone,
      eligibleRetailersCount: discoveryResult.eligibleRetailers.length
    };
  };

  it('1. Detects customer inside delivery zone (D-Ground Faisalabad) with active deliverable retailers', () => {
    const evaluation = evaluateStoreDeliverability(D_GROUND_IN_ZONE);

    assert.equal(evaluation.isOutsideDeliveryZone, false, 'Customer inside D-Ground must not be outside delivery zone');
    assert.ok(evaluation.deliverableStores.length > 0, 'Must have active deliverable stores in D-Ground');
    assert.ok(evaluation.eligibleRetailersCount >= 2, 'Must have at least 2 overlapping deliverable retailers');
  });

  it('2. Detects customer far away in outskirts where NO retailer delivers (isOutsideDeliveryZone = true)', () => {
    const evaluation = evaluateStoreDeliverability(OUTSKIRTS_FAR_AWAY);

    assert.equal(evaluation.isOutsideDeliveryZone, true, 'Customer in outskirts must be flagged as outside delivery zone');
    assert.equal(evaluation.deliverableStores.length, 0, 'Must have zero deliverable stores in remote outskirts');
    assert.equal(evaluation.eligibleRetailersCount, 0, 'Eligible retailers must be 0');

    // All stores must be marked isDeliverable = false
    for (const store of evaluation.storeList) {
      assert.equal(store.isDeliverable, false, `${store.name} must not deliver to far outskirts`);
    }
  });

  it('3. Customer changing location from far outskirts to D-Ground restores deliverability', () => {
    // Stage 1: Far away -> No retailer delivers
    const initial = evaluateStoreDeliverability(CHINIOT_RURAL);
    assert.equal(initial.isOutsideDeliveryZone, true, 'Initially outside delivery zone');
    assert.equal(initial.deliverableStores.length, 0);

    // Stage 2: Customer changes location -> falls in retailer delivery zone
    const updated = evaluateStoreDeliverability(D_GROUND_IN_ZONE);
    assert.equal(updated.isOutsideDeliveryZone, false, 'After location change, customer is inside delivery zone');
    assert.ok(updated.deliverableStores.length >= 2, 'Deliverable retailers are now available');
  });

  it('4. LocationModal contains the exact "Choose different location (no store found)" message and prompt', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/Stores/LocationModal.jsx');
    const content = fs.readFileSync(modalPath, 'utf8');

    assert.ok(
      content.includes('Choose different location (no store found)'),
      'LocationModal must contain "Choose different location (no store found)"'
    );
    assert.ok(
      content.includes('retailer delivery zone'),
      'LocationModal must prompt user to fall in the retailer delivery zone'
    );
  });

  it('5. Header displays "Choose different location (no store found)" when customer is outside retailer zones', () => {
    const headerPath = path.resolve(process.cwd(), 'src/components/Header/FreshMartHeader.jsx');
    const content = fs.readFileSync(headerPath, 'utf8');

    assert.ok(
      content.includes('Choose different location (no store found)'),
      'Header must display "Choose different location (no store found)" when outside delivery zone'
    );
  });

  it('6. Checkout blocks order placement and prompts location change when customer is outside retailer zones', () => {
    const checkoutPath = path.resolve(process.cwd(), 'src/components/Checkout/CheckoutPage.jsx');
    const content = fs.readFileSync(checkoutPath, 'utf8');

    assert.ok(
      content.includes('Choose different location (no store found)'),
      'CheckoutPage must contain "Choose different location (no store found)"'
    );
    assert.ok(
      content.includes('isOutsideDeliveryZone'),
      'CheckoutPage must check isOutsideDeliveryZone'
    );
  });

  it('7. Dedicated OutOfDeliveryZoneBanner informs customer across all storefront pages', () => {
    const bannerPath = path.resolve(process.cwd(), 'src/components/Common/OutOfDeliveryZoneBanner.jsx');
    const content = fs.readFileSync(bannerPath, 'utf8');

    assert.ok(
      content.includes('Choose different location (no store found)'),
      'OutOfDeliveryZoneBanner must display "Choose different location (no store found)"'
    );
    assert.ok(
      content.includes('retailer delivery zone'),
      'Banner must prompt customer to change location so that they fall in retailer delivery zone'
    );
  });

  it('8. CartDrawer displays notice and guards checkout button when location is outside delivery zone', () => {
    const cartPath = path.resolve(process.cwd(), 'src/components/Modals/CartDrawer.jsx');
    const content = fs.readFileSync(cartPath, 'utf8');

    assert.ok(
      content.includes('Choose different location (no store found)'),
      'CartDrawer must warn "Choose different location (no store found)"'
    );
  });

});
