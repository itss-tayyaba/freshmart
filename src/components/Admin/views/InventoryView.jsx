import React, { useState } from 'react';
import { Boxes, AlertTriangle, Clock, AlertCircle, Search, RefreshCw, Plus } from 'lucide-react';
import { ADMIN_INVENTORY_ITEMS } from '../../../data/adminSuiteData';
import { useStore } from '../../../context/StoreContext';

export const InventoryView = () => {
  const { addToast } = useStore();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(ADMIN_INVENTORY_ITEMS);

  const handleRestock = (id, name) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stock: item.stock + 50, status: 'In Stock', badge: 'bg-emerald-100 text-emerald-800' } : item
      )
    );
    addToast('Restocked', `Added 50 units to "${name}".`);
  };

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Inventory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage stock levels, reorder points, and expiry warnings</p>
        </div>

        <button
          onClick={() => addToast('Auto-Restock Initiated', 'Purchase orders sent to suppliers.')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restock Low Items</span>
        </button>
      </div>

      {/* 4 KPI Summary Cards matching screenshot: Total Stock, Low Stock, Out of Stock, Expiring Soon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Stock */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span>Total Stock</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">2,456</h3>
          <span className="text-[11px] text-slate-400 font-medium">In 12 warehouses</span>
        </div>

        {/* Low Stock */}
        <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Low Stock</span>
          </div>
          <h3 className="text-2xl font-black text-amber-900 mt-2">38</h3>
          <span className="text-[11px] text-amber-700 font-medium">Needs attention</span>
        </div>

        {/* Out of Stock */}
        <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-rose-900 text-xs font-bold uppercase">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Out of Stock</span>
          </div>
          <h3 className="text-2xl font-black text-rose-900 mt-2">12</h3>
          <span className="text-[11px] text-rose-700 font-medium">Replenish now</span>
        </div>

        {/* Expiring Soon */}
        <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-purple-900 text-xs font-bold uppercase">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Expiring Soon</span>
          </div>
          <h3 className="text-2xl font-black text-purple-900 mt-2">8</h3>
          <span className="text-[11px] text-purple-700 font-medium">Within 7 days</span>
        </div>

      </div>

      {/* Inventory Table Card matching screenshot */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4">
        
        {/* Search */}
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 pb-3">
                <th className="pb-3 font-semibold">Product</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Stock</th>
                <th className="pb-3 font-semibold">Min Stock</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-bold text-slate-800">{item.name}</td>
                  <td className="py-3 text-slate-600 font-medium">{item.category}</td>
                  <td className="py-3 font-mono font-bold text-slate-900">{item.stock}</td>
                  <td className="py-3 font-mono text-slate-500">{item.minStock}</td>
                  <td className="py-3">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${item.badge}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleRestock(item.id, item.name)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-[11px] transition-colors"
                    >
                      Restock +50
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
