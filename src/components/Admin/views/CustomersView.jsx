import React, { useState } from 'react';
import { Plus, Search, Mail, Phone, ShoppingBag, Eye, Trash2 } from 'lucide-react';
import { ADMIN_CUSTOMERS_DATA } from '../../../data/adminSuiteData';
import { useStore } from '../../../context/StoreContext';

export const CustomersView = ({ onOpenAddCustomerModal }) => {
  const { addToast } = useStore();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState(ADMIN_CUSTOMERS_DATA);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Customers</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer directory and purchase histories</p>
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4">
        
        {/* Search */}
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search customers..."
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
                  <td className="py-3 font-bold text-slate-800">{cust.name}</td>
                  <td className="py-3 text-slate-500">{cust.email}</td>
                  <td className="py-3 font-mono text-slate-600">{cust.phone}</td>
                  <td className="py-3 font-semibold text-slate-800">{cust.totalOrders}</td>
                  <td className="py-3 font-bold text-emerald-700">{cust.totalSpent}</td>
                  <td className="py-3">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {cust.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-slate-400">
                      <button
                        onClick={() => addToast('Customer History', `Viewing history for ${cust.name}`)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                        title="View Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
