import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractBrand,
  extractSizeAndUnit,
  extractProductType,
  parseProductAttributes,
  isProductOutOfStock,
  findProductSubstitutes,
  createSubstitutedOrderItem
} from '../src/utils/productSubstitution.js';

test('Smart Product Substitution - Unit & Integration Test Suite', async (t) => {

  await t.test('1. Product Attribute Parser', () => {
    // Brand detection
    assert.equal(extractBrand('Dalda Banaspati Ghee 1kg'), 'Dalda');
    assert.equal(extractBrand('Habib Cooking Oil 1L'), 'Habib');
    assert.equal(extractBrand('Olper\'s Full Cream Milk 1000ml'), 'Olper\'s');

    // Size and Unit normalization
    const size1kg = extractSizeAndUnit('Dalda Banaspati Ghee 1kg');
    assert.equal(size1kg.quantity, 1);
    assert.equal(size1kg.unit, 'kg');
    assert.equal(size1kg.normalized, '1kg');
    assert.equal(size1kg.type, 'weight');

    const size500g = extractSizeAndUnit('Tapal Danedar Tea 500g');
    assert.equal(size500g.quantity, 500);
    assert.equal(size500g.unit, 'g');
    assert.equal(size500g.normalized, '500g');

    const size1L = extractSizeAndUnit('Olpers Milk 1L');
    assert.equal(size1L.quantity, 1);
    assert.equal(size1L.unit, 'l');
    assert.equal(size1L.normalized, '1L');
    assert.equal(size1L.type, 'volume');

    // Product Type Classification with Taxonomy
    const gheeType = extractProductType({ name: 'Dalda Banaspati Ghee 1kg', category: 'Cooking Essentials' });
    assert.equal(gheeType.id, 'banaspati-ghee');
    assert.equal(gheeType.label, 'Banaspati Ghee');

    const oilType = extractProductType({ name: 'Dalda Supreme Cooking Oil 1L', category: 'Cooking Essentials' });
    assert.equal(oilType.id, 'cooking-oil');
    assert.equal(oilType.label, 'Cooking Oil');

    // Out of Stock flag detection
    assert.equal(isProductOutOfStock({ inStock: false }), true);
    assert.equal(isProductOutOfStock({ stock: 0 }), true);
    assert.equal(isProductOutOfStock({ status: 'Out of Stock' }), true);
    assert.equal(isProductOutOfStock({ inStock: true, stock: 15 }), false);
  });

  await t.test('2. Exact Example from User: Dalda Banaspati Ghee 1kg (OOS)', () => {
    const targetProduct = {
      id: 'dalda-ghee-1kg',
      name: 'Dalda Banaspati Ghee 1kg',
      category: 'Cooking Essentials',
      price: 590,
      unit: '1 kg pouch',
      inStock: false,
      stock: 0,
      status: 'Out of Stock'
    };

    const candidatePool = [
      {
        id: 'habib-ghee-1kg',
        name: 'Habib Banaspati Ghee 1kg',
        category: 'Cooking Essentials',
        price: 580,
        unit: '1 kg pouch',
        inStock: true,
        stock: 35,
        status: 'In Stock'
      },
      {
        id: 'kashmir-ghee-1kg',
        name: 'Kashmir Banaspati Ghee 1kg',
        category: 'Cooking Essentials',
        price: 595,
        unit: '1 kg pouch',
        inStock: true,
        stock: 40,
        status: 'In Stock'
      },
      {
        id: 'sufi-ghee-1kg',
        name: 'Sufi Banaspati Ghee 1kg',
        category: 'Cooking Essentials',
        price: 575,
        unit: '1 kg pouch',
        inStock: true,
        stock: 25,
        status: 'In Stock'
      },
      // Different size candidate (5kg)
      {
        id: 'habib-ghee-5kg',
        name: 'Habib Banaspati Ghee 5kg Tin',
        category: 'Cooking Essentials',
        price: 2850,
        unit: '5 kg tin',
        inStock: true,
        stock: 12,
        status: 'In Stock'
      },
      // Unrelated product 1: Cooking Oil (same brand, but different product type)
      {
        id: 'dalda-oil-1l',
        name: 'Dalda Supreme Cooking Oil 1L',
        category: 'Cooking Essentials',
        price: 585,
        unit: '1 Litre pouch',
        inStock: true,
        stock: 50,
        status: 'In Stock'
      },
      // Unrelated product 2: Detergent
      {
        id: 'surf-excel-1kg',
        name: 'Surf Excel Washing Powder 1kg',
        category: 'Household & Cleaning',
        price: 610,
        unit: '1 kg pack',
        inStock: true,
        stock: 80,
        status: 'In Stock'
      },
      // Unrelated product 3: Butter
      {
        id: 'nurpur-butter-200g',
        name: 'Nurpur Salted Butter 200g',
        category: 'Dairy & Eggs',
        price: 360,
        unit: '200g pack',
        inStock: true,
        stock: 20,
        status: 'In Stock'
      },
      // Unavailable alternative (OOS)
      {
        id: 'mezan-ghee-1kg',
        name: 'Mezan Banaspati Ghee 1kg',
        category: 'Cooking Essentials',
        price: 570,
        unit: '1 kg pouch',
        inStock: false,
        stock: 0,
        status: 'Out of Stock'
      }
    ];

    const results = findProductSubstitutes(targetProduct, candidatePool, { limit: 5 });

    // Verify exactly the requested brands are present:
    // Habib Banaspati Ghee 1kg, Kashmir Banaspati Ghee 1kg, Sufi Banaspati Ghee 1kg
    const resultIds = results.map(r => r.id);
    assert.ok(resultIds.includes('habib-ghee-1kg'), 'Should suggest Habib Banaspati Ghee 1kg');
    assert.ok(resultIds.includes('kashmir-ghee-1kg'), 'Should suggest Kashmir Banaspati Ghee 1kg');
    assert.ok(resultIds.includes('sufi-ghee-1kg'), 'Should suggest Sufi Banaspati Ghee 1kg');

    // Strictly exclude unrelated products
    assert.ok(!resultIds.includes('dalda-oil-1l'), 'Must NOT suggest Cooking Oil when looking for Banaspati Ghee');
    assert.ok(!resultIds.includes('surf-excel-1kg'), 'Must NOT suggest Surf Excel Washing Powder');
    assert.ok(!resultIds.includes('nurpur-butter-200g'), 'Must NOT suggest Butter');
    assert.ok(!resultIds.includes('mezan-ghee-1kg'), 'Must NOT suggest an Out of Stock product');

    // Size / Quantity fidelity: 1kg substitutes MUST rank higher than 5kg tin
    const habib1kgIndex = results.findIndex(r => r.id === 'habib-ghee-1kg');
    const habib5kgIndex = results.findIndex(r => r.id === 'habib-ghee-5kg');
    if (habib5kgIndex !== -1) {
      assert.ok(habib1kgIndex < habib5kgIndex, '1kg Habib Ghee must rank above 5kg Habib Ghee');
    }
  });

  await t.test('3. Cross-Category Isolation (No False Matches)', () => {
    const oosRice = {
      id: 'guard-rice-1kg',
      name: 'Guard Super Kernel Basmati Rice 1kg',
      category: 'Grains & Staples',
      price: 450,
      inStock: false
    };

    const staplesPool = [
      {
        id: 'falak-rice-1kg',
        name: 'Falak Extreme Basmati Rice 1kg',
        category: 'Grains & Staples',
        price: 460,
        inStock: true,
        stock: 20
      },
      {
        id: 'sunridge-flour-1kg',
        name: 'Sunridge Chakki Atta Whole Wheat Flour 1kg',
        category: 'Grains & Staples',
        price: 180,
        inStock: true,
        stock: 50
      },
      {
        id: 'national-daal-1kg',
        name: 'National Daal Chana 1kg',
        category: 'Grains & Staples',
        price: 320,
        inStock: true,
        stock: 15
      }
    ];

    const riceSubstitutes = findProductSubstitutes(oosRice, staplesPool);
    const subIds = riceSubstitutes.map(s => s.id);

    // Should recommend Falak Rice
    assert.ok(subIds.includes('falak-rice-1kg'));
    // Should NOT recommend Flour or Daal
    assert.ok(!subIds.includes('sunridge-flour-1kg'), 'Basmati Rice should not substitute with Wheat Flour');
    assert.ok(!subIds.includes('national-daal-1kg'), 'Basmati Rice should not substitute with Daal Chana');
  });

  await t.test('4. Order Line Item Substitution Preservation Schema', () => {
    const originalItem = {
      id: 'dalda-ghee-1kg',
      name: 'Dalda Banaspati Ghee 1kg',
      price: 590,
      quantity: 2,
      unit: '1 kg pouch',
      image: '/images/dalda-ghee.jpg'
    };

    const replacement = {
      id: 'kashmir-ghee-1kg',
      name: 'Kashmir Banaspati Ghee 1kg',
      price: 595,
      unit: '1 kg pouch',
      image: '/images/kashmir-ghee.jpg'
    };

    const substitutedLineItem = createSubstitutedOrderItem(originalItem, replacement, {
      reason: 'Original item out of stock; Kashmir Ghee confirmed with customer',
      substitutedBy: 'Staff Member Tariq'
    });

    // Active item values are updated
    assert.equal(substitutedLineItem.id, 'kashmir-ghee-1kg');
    assert.equal(substitutedLineItem.name, 'Kashmir Banaspati Ghee 1kg');
    assert.equal(substitutedLineItem.price, 595);
    assert.equal(substitutedLineItem.quantity, 2);

    // Audit trail flags & original product preserved
    assert.equal(substitutedLineItem.isSubstituted, true);
    assert.deepEqual(substitutedLineItem.originalProduct, {
      id: 'dalda-ghee-1kg',
      name: 'Dalda Banaspati Ghee 1kg',
      brand: 'Dalda',
      price: 590,
      unit: '1 kg pouch',
      image: '/images/dalda-ghee.jpg'
    });
    assert.equal(substitutedLineItem.substitutedBy, 'Staff Member Tariq');
    assert.ok(substitutedLineItem.substitutionReason.includes('Kashmir Ghee confirmed'));
    assert.ok(substitutedLineItem.substitutedAt);
  });

  await t.test('5. Order Level Price & History Recalculation', () => {
    // Simulate order state before substitution
    const originalOrder = {
      id: 'ORD-TEST-999',
      orderId: 'ORD-TEST-999',
      customer: 'Sobia Khan',
      orderItems: [
        {
          id: 'dalda-ghee-1kg',
          name: 'Dalda Banaspati Ghee 1kg',
          price: 590,
          quantity: 2
        },
        {
          id: 'milk-1l',
          name: 'Olper\'s Milk 1L',
          price: 290,
          quantity: 3
        }
      ],
      totalAmount: 590 * 2 + 290 * 3, // 1180 + 870 = 2050
      status: 'Packing'
    };

    // Staff performs substitution of item 0 (Dalda Ghee -> Kashmir Ghee at 595)
    const replacement = {
      id: 'kashmir-ghee-1kg',
      name: 'Kashmir Banaspati Ghee 1kg',
      price: 595
    };

    const updatedItems = originalOrder.orderItems.map((item, idx) => {
      if (idx === 0) {
        return createSubstitutedOrderItem(item, replacement, {
          reason: 'Customer agreed to Kashmir Banaspati Ghee 1kg substitution'
        });
      }
      return item;
    });

    const newTotal = updatedItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

    const updatedOrder = {
      ...originalOrder,
      orderItems: updatedItems,
      totalAmount: newTotal
    };

    // Substituted item is properly flagged
    assert.equal(updatedOrder.orderItems[0].isSubstituted, true);
    assert.equal(updatedOrder.orderItems[0].name, 'Kashmir Banaspati Ghee 1kg');
    assert.equal(updatedOrder.orderItems[0].originalProduct.name, 'Dalda Banaspati Ghee 1kg');

    // Unmodified item remains unchanged
    assert.equal(updatedOrder.orderItems[1].isSubstituted, undefined);
    assert.equal(updatedOrder.orderItems[1].name, 'Olper\'s Milk 1L');

    // Total recalculated accurately: 595 * 2 + 290 * 3 = 1190 + 870 = 2060
    assert.equal(updatedOrder.totalAmount, 2060);
  });

  await t.test('6. Pickup Staff Picking & Unavailable Item Substitution Flow', () => {
    // 1. Order with only the test items:
    // Item 0: Dalda Banaspati Ghee 1kg (Unavailable / Out of Stock on shelf)
    // Item 1: Olper's Full Cream Milk 1L (Present / In Stock on shelf)
    const testOrder = {
      id: 'ORD-701',
      orderId: 'ORD-701',
      customerName: 'Tayyaba Batool',
      orderType: 'Delivery',
      status: 'Pending',
      items: [
        {
          id: 'dalda-banaspati-ghee-1kg',
          name: 'Dalda Banaspati Ghee 1kg',
          brand: 'Dalda',
          category: 'grocery-staples',
          price: 550,
          quantity: 1,
          unit: '1kg Pouch',
          inStock: false
        },
        {
          id: 'olpers-milk-1l',
          name: "Olper's Full Cream Milk 1L",
          brand: "Olper's",
          category: 'dairy-eggs',
          price: 210,
          quantity: 2,
          unit: '1 Litre Pack',
          inStock: true
        }
      ]
    };

    // Store picking state simulation (tracking picked item indices)
    const pickedItems = new Set();

    // Check picking logic for available item (Item 1: Olper's Milk)
    pickedItems.add(1);
    assert.equal(pickedItems.has(1), true, 'Olper\'s Milk should be marked as picked');

    // Item 0 (Dalda Ghee) is NOT present on the shelf!
    // What will the system do? Suggest other brand items from the catalog:
    const catalogPool = [
      {
        id: 'habib-banaspati-ghee-1kg',
        name: 'Habib Banaspati Ghee 1kg',
        brand: 'Habib',
        category: 'grocery-staples',
        price: 540,
        unit: '1kg Pouch',
        inStock: true,
        stock: 45
      },
      {
        id: 'kashmir-banaspati-ghee-1kg',
        name: 'Kashmir Banaspati Ghee 1kg',
        brand: 'Kashmir',
        category: 'grocery-staples',
        price: 550,
        unit: '1kg Pouch',
        inStock: true,
        stock: 50
      },
      {
        id: 'sufi-banaspati-ghee-1kg',
        name: 'Sufi Banaspati Ghee 1kg',
        brand: 'Sufi',
        category: 'grocery-staples',
        price: 535,
        unit: '1kg Pouch',
        inStock: true,
        stock: 38
      }
    ];

    const suggestedBrands = findProductSubstitutes(testOrder.items[0], catalogPool);
    assert.equal(suggestedBrands.length >= 3, true, 'Must suggest at least 3 alternative brands');
    const brandNames = suggestedBrands.map(s => s.brand);
    assert.ok(brandNames.includes('Habib'), 'Must include Habib brand');
    assert.ok(brandNames.includes('Kashmir'), 'Must include Kashmir brand');
    assert.ok(brandNames.includes('Sufi'), 'Must include Sufi brand');

    // Staff picks Habib Banaspati Ghee as substitution with customer approval
    const selectedAlternative = suggestedBrands.find(b => b.brand === 'Habib') || suggestedBrands[0];
    const substitutedLine = createSubstitutedOrderItem(testOrder.items[0], selectedAlternative, {
      reason: 'Original item out of stock; Habib Banaspati Ghee approved by customer',
      substitutedBy: 'Pickup Staff'
    });

    testOrder.items[0] = substitutedLine;
    pickedItems.add(0);

    // Verify order line was updated
    assert.equal(testOrder.items[0].isSubstituted, true);
    assert.equal(testOrder.items[0].originalProduct.name, 'Dalda Banaspati Ghee 1kg');
    assert.equal(testOrder.items[0].brand, selectedAlternative.brand);

    // Both items are now successfully picked
    assert.equal(pickedItems.size, 2, 'All 2 items are now picked/substituted');
  });
});
