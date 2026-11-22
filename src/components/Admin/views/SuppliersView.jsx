import React, { useState, useMemo } from 'react';
import { Plus, Search, Phone, Mail, Building, Trash2 } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const SuppliersView = ({ onOpenAddSupplierModal }) => {
  const { suppliers = [], addToast } = useStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase().trim();
    return (suppliers || []).filter(
      (s) =>
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.contact?.toLowerCase().includes(q) ||
        s.ownerName?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.category?.toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Wholesale Suppliers & Distributors
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage verified commodity suppliers, FMCG distribution contracts, and inventory partners.
          </p>
        </div>

        <button
          onClick={onOpenAddSupplierModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Supplier</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
        
        {/* Search */}
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search suppliers by company name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Building className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No suppliers found</h3>
            <p className="text-xs text-slate-400">
              No registered suppliers match your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-3">
                  <th className="pb-3 font-semibold">Supplier Company</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Contact Person</th>
                  <th className="pb-3 font-semibold">Phone & Email</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((sup) => {
                  const sId = sup.supplierId || sup.id || sup._id;
                  return (
                    <tr key={sId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-bold text-slate-800 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-bold text-slate-900">{sup.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{sId}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-700 font-medium">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                          {sup.category || 'Wholesale Goods'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <p className="font-semibold text-slate-800 text-xs">{sup.contact || sup.ownerName || sup.name}</p>
                      </td>
                      <td className="py-3.5">
                        <p className="font-mono text-slate-800 text-xs">{sup.phone || '+92 300 0000000'}</p>
                        {sup.email && <p className="text-slate-400 text-[11px]">{sup.email}</p>}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                          {sup.status || 'Active Partner'}
                        </span>
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
