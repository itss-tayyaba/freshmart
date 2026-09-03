import React, { useState } from 'react';
import { Plus, Search, Phone, Mail, Building, Eye, Trash2, Building2 } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const SuppliersView = ({ onOpenAddSupplierModal }) => {
  const { suppliers, deleteSupplier, addToast, adminRole } = useStore();
  const [search, setSearch] = useState('');

  const isSupplierRole = adminRole === 'supplier';

  const filtered = (suppliers || []).filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contact && s.contact.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {isSupplierRole ? 'Supplier Portal & Invoices' : 'Suppliers & Vendors'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSupplierRole
              ? 'View your vendor supply records, delivery invoices, and reorder requests'
              : 'Admin control: Manage vendors, farm contacts, register new suppliers & credentials'}
          </p>
        </div>

        {/* Only Admin can add suppliers */}
        {!isSupplierRole && (
          <button
            onClick={onOpenAddSupplierModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Supplier</span>
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
        
        {/* Search */}
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search suppliers by name or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Empty State vs Table */}
        {(!suppliers || suppliers.length === 0) ? (
          <div className="text-center py-16 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
              🏢
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800">No Suppliers in Directory</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isSupplierRole
                  ? 'No vendor contracts linked to this account.'
                  : 'All sample supplier records have been removed. Click "+ Add Supplier" to register your official vendors and farms.'}
              </p>
            </div>
            {!isSupplierRole && (
              <button
                onClick={onOpenAddSupplierModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add First Supplier</span>
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No suppliers matching your search "{search}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-3">
                  <th className="pb-3 font-semibold">Supplier</th>
                  <th className="pb-3 font-semibold">Domain / Category</th>
                  <th className="pb-3 font-semibold">Contact & Phone</th>
                  <th className="pb-3 font-semibold">Login Username</th>
                  <th className="pb-3 font-semibold">Status</th>
                  {!isSupplierRole && <th className="pb-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 font-bold text-slate-800 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900">{sup.name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{sup.id}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-700 font-medium">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        {sup.category || 'Fresh Milk & Pure Dairy'}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <p className="font-semibold text-slate-800 text-xs">{sup.contact || sup.name}</p>
                      <p className="font-mono text-slate-500 text-[11px]">{sup.phone || sup.email}</p>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                          {sup.username || sup.name?.toLowerCase().replace(/\s+/g, '_')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {sup.status || 'Active'}
                      </span>
                    </td>
                    {!isSupplierRole && (
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-slate-400">
                          <button
                            onClick={() => addToast('Supplier Contract', `Viewing details for ${sup.name}`)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteSupplier(sup.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
