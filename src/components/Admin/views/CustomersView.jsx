import React, { useState } from 'react';
import { Plus, Search, Mail, Phone, ShoppingBag, Eye, Trash2, UserPlus, Users } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const CustomersView = ({ onOpenAddCustomerModal }) => {
  const { customers, deleteCustomer, addToast } = useStore();
  const [search, setSearch] = useState('');

  const filtered = (customers || []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Customers</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer directory, contact profiles, and accounts</p>
        </div>

        <button
          onClick={onOpenAddCustomerModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
        
        {/* Search */}
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search customers by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Empty State vs Table */}
        {(!customers || customers.length === 0) ? (
          <div className="text-center py-16 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
              👥
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800">No Customers in Directory</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All sample customer data has been removed. You can register custom accounts or add customers directly.
              </p>
            </div>
            <button
              onClick={onOpenAddCustomerModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add First Customer</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No customers matching your search "{search}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-3">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Phone</th>
                  <th className="pb-3 font-semibold">Total Orders</th>
                  <th className="pb-3 font-semibold">Total Spent</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 font-bold text-slate-800 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[11px]">
                        {cust.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{cust.name}</span>
                    </td>
                    <td className="py-3.5 text-slate-500">{cust.email}</td>
                    <td className="py-3.5 font-mono text-slate-600">{cust.phone}</td>
                    <td className="py-3.5 font-semibold text-slate-800">{cust.totalOrders || 0}</td>
                    <td className="py-3.5 font-bold text-emerald-700">{cust.totalSpent || 'Rs. 0'}</td>
                    <td className="py-3.5">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {cust.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-slate-400">
                        <button
                          onClick={() => addToast('Customer Profile', `Viewing customer: ${cust.name}`)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCustomer(cust.id)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
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
