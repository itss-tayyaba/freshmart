import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FRESHMART_PRODUCTS, FRESHMART_BRANDS, FRESHMART_CATEGORIES } from '../src/data/freshMartData.js';

describe('Real Brand Products Catalog & Images Verification', () => {
  it('contains authentic Lays potato chip varieties with valid images', () => {
    const laysProducts = FRESHMART_PRODUCTS.filter((p) => p.brand === 'Lays');
    assert.ok(laysProducts.length >= 4, `Expected at least 4 Lays products, got ${laysProducts.length}`);
    
    const classic = laysProducts.find((p) => p.id === 'lays-classic-salted');
    assert.ok(classic, 'Classic Salted Lays missing');
    assert.ok(classic.image.startsWith('http'), 'Classic Salted image must be a valid URL');
    assert.strictEqual(classic.category, 'snacks');

    const wavy = laysProducts.find((p) => p.id === 'lays-wavy-masala');
    assert.ok(wavy, 'Wavy Masala Lays missing');

    const cheese = laysProducts.find((p) => p.id === 'lays-french-cheese');
    assert.ok(cheese, 'French Cheese Lays missing');
  });

  it('contains popular biscuit & cookie brands (Oreo, Prince, Sooper, Chocolicious, Biscoff)', () => {
    const biscuitIds = [
      'oreo-original-cookies',
      'lu-prince-chocolate-biscuits',
      'peek-freans-chocolicious',
      'peek-freans-sooper',
      'lotus-biscoff-cookies',
      'mcvities-digestive-biscuits'
    ];

    for (const bId of biscuitIds) {
      const found = FRESHMART_PRODUCTS.find((p) => p.id === bId);
      assert.ok(found, `Expected biscuit product "${bId}" to exist`);
      assert.ok(found.image.startsWith('http'), `Expected image for ${bId}`);
      assert.ok(found.price > 0, `Expected valid price for ${bId}`);
    }
  });

  it('contains authentic chocolate brand products (Cadbury Silk, KitKat, Ferrero Rocher, Snickers, Nutella, Toblerone)', () => {
    const chocolateIds = [
      'cadbury-dairy-milk-silk',
      'kitkat-4-finger-wafer',
      'ferrero-rocher-16pcs-box',
      'snickers-peanut-bar',
      'nutella-hazelnut-cocoa-spread',
      'toblerone-swiss-milk-chocolate'
    ];

    for (const cId of chocolateIds) {
      const found = FRESHMART_PRODUCTS.find((p) => p.id === cId);
      assert.ok(found, `Expected chocolate product "${cId}" to exist`);
      assert.ok(found.image.startsWith('http'), `Expected image for ${cId}`);
      assert.ok(found.description.length > 10, `Expected rich description for ${cId}`);
    }
  });

  it('contains fresh bread & bakery items (Dawn Bread, Whole Wheat, Gourmet Milky Bread, Burger Buns, Parathas)', () => {
    const bakeryIds = [
      'dawn-bread-white-large',
      'dawn-bread-whole-wheat-bran',
      'gourmet-milky-bread-sweet',
      'dawn-burger-buns-4pcs',
      'gourmet-butter-croissants-2pcs',
      'dawn-plain-paratha-pack'
    ];

    for (const bId of bakeryIds) {
      const found = FRESHMART_PRODUCTS.find((p) => p.id === bId);
      assert.ok(found, `Expected bakery product "${bId}" to exist`);
      assert.strictEqual(found.category, 'bakery');
      assert.ok(found.image.startsWith('http'), `Expected image for ${bId}`);
    }
  });

  it('contains real snack brands (Cheetos, Doritos, Pringles, Kurkure, Mitchells, Knorr)', () => {
    const snackBrands = ['Cheetos', 'Doritos', 'Pringles', 'Kurkure', "Mitchell's", 'Knorr'];
    for (const brand of snackBrands) {
      const found = FRESHMART_PRODUCTS.find((p) => p.brand === brand);
      assert.ok(found, `Expected at least one product for brand ${brand}`);
    }
  });

  it('includes all newly added brands in FRESHMART_BRANDS registry', () => {
    const requiredBrands = ['Lays', 'Cadbury', 'Nestle', 'Oreo', 'Lu', 'Peek Freans', 'Ferrero', 'Dawn', 'Gourmet Bakery', 'Lotus', 'Snickers', 'Doritos', 'Cheetos', 'Pringles', 'Kurkure'];
    for (const reqBrand of requiredBrands) {
      assert.ok(FRESHMART_BRANDS.includes(reqBrand), `FRESHMART_BRANDS should include ${reqBrand}`);
    }
  });
});
