import React, { useState } from 'react';
import { Boxes, AlertTriangle, AlertCircle, Search, RefreshCw, Plus, Minus, Check, Layers, ArrowUpRight } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const InventoryView = () => {
  const { products, updateProductStock, toggleProductStockStatus, addToast, categories } = useStore();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'low' | 'out' | categoryId

  // Live Inventory Statistics derived from real store products
  const totalUnits = (products || []).reduce((sum, p) => sum + (p.stock ?? (p.inStock !== false ? 50 : 0)), 0);
  const lowStockProducts = (products || []).filter((p) => {
    const stock = p.stock ?? (p.inStock !== false ? 50 : 0);
    return stock > 0 && stock < 15;
  });
  const outOfStockProducts = (products || []).filter((p) => {
    const stock = p.stock ?? (p.inStock !== false ? 50 : 0);
    return stock === 0 || p.inStock === false;
  });

  const handleQuickAdjust = (productId, currentStock, delta) => {
    const nextStock = Math.max(0, currentStock + delta);
    updateProductStock(productId, nextStock);
  };

  const handleRestockAllLow = () => {
    if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
      addToast('Inventory Healthy', 'All products have adequate stock levels.', 'info');
      return;
    }
    [...lowStockProducts, ...outOfStockProducts].forEach((p) => {
      const curStock = p.stock ?? 0;
      updateProductStock(p.id || p._id, curStock + 30);
    });
    addToast('Restocked Successfully! 📦', `Added 30 units to ${lowStockProducts.length + outOfStockProducts.length} low/out-of-stock items.`);
  };

  const filtered = (products || []).filter((p) => {
    const stock = p.stock ?? (p.inStock !== false ? 50 : 0);
    if (selectedFilter === 'low' && (stock <= 0 || stock >= 15)) return false;
    if (selectedFilter === 'out' && stock > 0 && p.inStock !== false) return false;
    if (selectedFilter !== 'all' && selectedFilter !== 'low' && selectedFilter !== 'out' && p.category !== selectedFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Inventory & Stock Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Control live product stock levels, availability, and low-stock alerts</p>
        </div>

        <button
          onClick={handleRestockAllLow}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restock All Low Items (+30 Units)</span>
        </button>
      </div>

      {/* 4 Live Inventory KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Stock */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span>Total Units in Catalog</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">{totalUnits.toLocaleString()}</h3>
          <span className="text-[11px] text-slate-400 font-medium">{products?.length || 0} Products active</span>
        </div>

        {/* Low Stock (< 15) */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Low Stock (Under 15)</span>
          </div>
          <h3 className="text-2xl font-black text-amber-900 mt-2">{lowStockProducts.length}</h3>
          <span className="text-[11px] text-amber-700 font-medium">Reorder suggested</span>
        </div>

        {/* Out of Stock (0) */}
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-rose-900 text-xs font-bold uppercase">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Out of Stock</span>
          </div>
          <h3 className="text-2xl font-black text-rose-900 mt-2">{outOfStockProducts.length}</h3>
          <span className="text-[11px] text-rose-700 font-medium">Replenish immediately</span>
        </div>

        {/* Total SKUs */}
        <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-purple-900 text-xs font-bold uppercase">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Total Catalog SKUs</span>
          </div>
          <h3 className="text-2xl font-black text-purple-900 mt-2">{products?.length || 0}</h3>
          <span className="text-[11px] text-purple-700 font-medium">Synced with Storefront</span>
        </div>

      </div>

      {/* Inventory Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-5">
        
        {/* Search & Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <input
              type="text"
              placeholder="Search product inventory by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Items ({products?.length || 0})
            </button>
            <button
              onClick={() => setSelectedFilter('low')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                selectedFilter === 'low'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Low Stock ({lowStockProducts.length})
            </button>
            <button
              onClick={() => setSelectedFilter('out')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                selectedFilter === 'out'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Out of Stock ({outOfStockProducts.length})
            </button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No products match the selected filter or search term "{search}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-3 font-semibold">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-center">Live Stock Level</th>
                  <th className="pb-3 text-right">Quick Adjustments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((prod) => {
                  const id = prod.id || prod._id;
                  const currentStock = prod.stock ?? (prod.inStock !== false ? 50 : 0);
                  const isLow = currentStock > 0 && currentStock < 15;
                  const isOut = currentStock === 0 || prod.inStock === false;

                  return (
                    <tr key={id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Product Thumbnail & Name */}
                      <td className="py-3 font-bold text-slate-800 flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0 bg-slate-50"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{prod.name}</span>
                          <span className="text-[10px] text-slate-400 block">{prod.unit || '1 Unit'}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 text-slate-600 font-medium">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-700">
                          {prod.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 font-bold text-slate-900">
                        Rs. {prod.price}
                      </td>

                      {/* Status Badge & Toggle */}
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => toggleProductStockStatus(id)}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full cursor-pointer transition-transform hover:scale-105 ${
                            isOut
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                          title="Click to toggle In Stock / Out of Stock"
                        >
                          {isOut ? '✕ Out of Stock' : isLow ? '⚠️ Low Stock' : '✓ In Stock'}
                        </button>
                      </td>

                      {/* Live Stock Counter / Input */}
                      <td className="py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
                          <input
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) => updateProductStock(id, e.target.value)}
                            className="w-14 text-center font-mono font-black text-sm text-slate-900 bg-transparent focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Units</span>
                        </div>
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleQuickAdjust(id, currentStock, -10)}
                            className="px-2 py-1 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                            title="Subtract 10 units"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(id, currentStock, -1)}
                            className="p-1 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                            title="Subtract 1 unit"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(id, currentStock, +1)}
                            className="p-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                            title="Add 1 unit"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(id, currentStock, +10)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(id, currentStock, +50)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                            title="Add 50 units"
                          >
                            +50
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};

