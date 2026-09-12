import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Order Processing & Inventory Stock Deductions', () => {
  // Pure helper simulating stock deduction logic
  const deductStock = (product, quantity) => {
    const qty = Number(quantity) || 1;
    const currentStock = product.stock !== undefined ? product.stock : (product.stockCount || 0);
    const newStock = Math.max(0, currentStock - qty);
    const status = newStock === 0 ? 'Out of Stock' : newStock < 15 ? 'Low Stock' : 'Active';
    const inStock = newStock > 0;

    return {
      ...product,
      stock: newStock,
      stockCount: newStock,
      status,
      inStock
    };
  };

  // Pure helper simulating stock restoration logic upon cancellation
  const restoreStock = (product, quantity) => {
    const qty = Number(quantity) || 1;
    const currentStock = product.stock !== undefined ? product.stock : (product.stockCount || 0);
    const newStock = currentStock + qty;
    const status = newStock === 0 ? 'Out of Stock' : newStock < 15 ? 'Low Stock' : 'Active';
    const inStock = newStock > 0;

    return {
      ...product,
      stock: newStock,
      stockCount: newStock,
      status,
      inStock
    };
  };

  it('correctly deducts item quantities from product inventory', () => {
    const product = { id: 'P-1', name: 'Fresh Apples 1kg', stock: 50, inStock: true, status: 'Active' };
    const updated = deductStock(product, 5);

    assert.equal(updated.stock, 45);
    assert.equal(updated.stockCount, 45);
    assert.equal(updated.status, 'Active');
    assert.equal(updated.inStock, true);
  });

  it('transitions product status to Low Stock when inventory falls below 15 units', () => {
    const product = { id: 'P-2', name: 'Almond Milk 1L', stock: 20, inStock: true, status: 'Active' };
    const updated = deductStock(product, 8); // 20 - 8 = 12

    assert.equal(updated.stock, 12);
    assert.equal(updated.status, 'Low Stock');
    assert.equal(updated.inStock, true);
  });

  it('transitions product status to Out of Stock when inventory reaches 0', () => {
    const product = { id: 'P-3', name: 'Gourmet Cheese', stock: 4, inStock: true, status: 'Low Stock' };
    const updated = deductStock(product, 4);

    assert.equal(updated.stock, 0);
    assert.equal(updated.status, 'Out of Stock');
    assert.equal(updated.inStock, false);
  });

  it('never drops stock below zero when ordering more than available', () => {
    const product = { id: 'P-4', name: 'Avocados', stock: 2, inStock: true, status: 'Low Stock' };
    const updated = deductStock(product, 10);

    assert.equal(updated.stock, 0);
    assert.equal(updated.status, 'Out of Stock');
    assert.equal(updated.inStock, false);
  });

  it('restores stock and updates status when a previously confirmed order is cancelled', () => {
    const depletedProduct = { id: 'P-5', name: 'Organic Honey', stock: 0, inStock: false, status: 'Out of Stock' };
    const restored = restoreStock(depletedProduct, 20); // 0 + 20 = 20

    assert.equal(restored.stock, 20);
    assert.equal(restored.status, 'Active');
    assert.equal(restored.inStock, true);
  });

  it('restores stock back into Low Stock state if restocked quantity is under 15', () => {
    const depletedProduct = { id: 'P-6', name: 'Olive Oil', stock: 0, inStock: false, status: 'Out of Stock' };
    const restored = restoreStock(depletedProduct, 5); // 0 + 5 = 5

    assert.equal(restored.stock, 5);
    assert.equal(restored.status, 'Low Stock');
    assert.equal(restored.inStock, true);
  });
});
