import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALFATAH_PRODUCTS,
  CHASEVALUE_PRODUCTS,
  CHASEUP_PRODUCTS,
  FRESHMART_PRODUCTS_CATALOG,
  ALL_BRANCH_PRODUCTS
} from '../src/data/branchCatalogData.js';
import {
  matchesProductCategory,
  isOilProduct,
  isBeverageProduct,
  isDryFoodProduct,
  getAvailableCategories
} from '../src/utils/categoryHelper.js';

describe('Store Products Count & Category Isolation Logic', () => {
  const stores = [
    { name: 'Al-Fatah', products: ALFATAH_PRODUCTS, id: 'tenant-alfatah' },
    { name: 'Chase Value', products: CHASEVALUE_PRODUCTS, id: 'tenant-chasevalue' },
    { name: 'Chase Up', products: CHASEUP_PRODUCTS, id: 'tenant-chaseup' },
    { name: 'FreshMart', products: FRESHMART_PRODUCTS_CATALOG, id: 'tenant-freshmart' }
  ];

  it('1. Each store has exactly 10 products (40 products total across platform)', () => {
    assert.equal(ALL_BRANCH_PRODUCTS.length, 40, 'Total combined products must be 40');

    stores.forEach((store) => {
      assert.equal(
        store.products.length,
        10,
        `Store ${store.name} must have exactly 10 items, but got ${store.products.length}`
      );
    });
  });

  it('2. Each store has genuine Beverage items and Dry Food items', () => {
    stores.forEach((store) => {
      const beverages = store.products.filter((p) => matchesProductCategory(p, 'beverages'));
      const dryFoods = store.products.filter((p) => matchesProductCategory(p, 'dry-foods'));
      const oils = store.products.filter((p) => matchesProductCategory(p, 'oil-ghee'));

      assert.ok(
        beverages.length >= 1,
        `Store ${store.name} must have at least 1 beverage product (found ${beverages.length})`
      );
      assert.ok(
        dryFoods.length >= 1,
        `Store ${store.name} must have at least 1 dry food product (found ${dryFoods.length})`
      );
      assert.ok(
        oils.length >= 1,
        `Store ${store.name} must have at least 1 cooking oil product (found ${oils.length})`
      );
    });
  });

  it('3. Filtering by Beverage NEVER returns Cooking Oil or Banaspati', () => {
    ['beverage', 'beverages', 'drinks'].forEach((term) => {
      ALL_BRANCH_PRODUCTS.forEach((product) => {
        if (matchesProductCategory(product, term)) {
          assert.equal(
            isOilProduct(product),
            false,
            `Product "${product.name}" matched "${term}" but is an oil product!`
          );
          assert.ok(
            !product.name.toLowerCase().includes('cooking oil'),
            `Cooking oil "${product.name}" must not appear under beverage filter`
          );
          assert.ok(
            !product.name.toLowerCase().includes('banaspati'),
            `Banaspati "${product.name}" must not appear under beverage filter`
          );
        }
      });
    });
  });

  it('4. Filtering by Dry Foods / Food / Dyr Foods NEVER returns Cooking Oil', () => {
    ['dry-foods', 'dry foods', 'dry food', 'dyr foods', 'food', 'foods', 'staples'].forEach((term) => {
      ALL_BRANCH_PRODUCTS.forEach((product) => {
        if (matchesProductCategory(product, term)) {
          assert.equal(
            isOilProduct(product),
            false,
            `Product "${product.name}" matched "${term}" but is an oil product!`
          );
          assert.ok(
            !product.name.toLowerCase().includes('cooking oil'),
            `Cooking oil "${product.name}" must not appear under dry foods/food filter`
          );
          assert.ok(
            !product.name.toLowerCase().includes('banaspati'),
            `Banaspati "${product.name}" must not appear under dry foods/food filter`
          );
        }
      });
    });
  });

  it('5. Filtering by Cooking Oil strictly returns oil and ghee products', () => {
    ['oil', 'oils', 'oil-ghee', 'cooking-oil'].forEach((term) => {
      const matched = ALL_BRANCH_PRODUCTS.filter((p) => matchesProductCategory(p, term));
      assert.ok(matched.length >= 4, 'Must match at least 4 cooking oil products across stores');

      matched.forEach((product) => {
        assert.equal(
          isOilProduct(product),
          true,
          `Product "${product.name}" was matched by "${term}" but is not marked as oil`
        );
        assert.equal(
          isBeverageProduct(product),
          false,
          `Cooking oil "${product.name}" must not be classified as beverage`
        );
        assert.equal(
          isDryFoodProduct(product),
          false,
          `Cooking oil "${product.name}" must not be classified as dry food`
        );
      });
    });
  });

  it('6. Only AVAILABLE categories (with count > 0) are shown for each store', () => {
    stores.forEach((store) => {
      const available = getAvailableCategories(store.products);
      assert.ok(available.length > 0, `Store ${store.name} must have available categories`);

      available.forEach((cat) => {
        assert.ok(cat.count > 0, `Category ${cat.name} must have items > 0`);
      });

      // Categories with 0 items must not exist in available list
      const hasFrozen = available.some((c) => c.id === 'frozen-foods');
      const hasPetFood = available.some((c) => c.id === 'pet-food');
      assert.equal(hasFrozen, false, 'Empty frozen-foods must not be in available categories');
      assert.equal(hasPetFood, false, 'Empty pet-food must not be in available categories');
    });
  });
});
