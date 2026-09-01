import React, { useState } from 'react';
import { Search, Calendar, ChevronDown, Check, Clock, Eye, Edit3 } from 'lucide-react';
import { ADMIN_ORDERS_FULL } from '../../../data/adminSuiteData';
import { useStore } from '../../../context/StoreContext';

export const OrdersView = () => {
  const { addToast } = useStore();
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState(ADMIN_ORDERS_FULL);

  const handleStatusChange = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          let statusClass = 'bg-slate-100 text-slate-800';
          if (newStatus === 'Delivered') statusClass = 'bg-emerald-100 text-emerald-800';
          if (newStatus === 'Out for Delivery') statusClass = 'bg-amber-100 text-amber-800';
          if (newStatus === 'Preparing') statusClass = 'bg-blue-100 text-blue-800';
          if (newStatus === 'Confirmed') statusClass = 'bg-indigo-100 text-indigo-800';
          if (newStatus === 'Cancelled') statusClass = 'bg-rose-100 text-rose-800';
          return { ...o, status: newStatus, statusClass };
        }
        return o;
      })
    );
    addToast('Status Updated', `Order ${orderId} updated to ${newStatus}.`);
  };

  const filtered = orders.filter((o) => {
    if (activeTab !== 'All' && o.status !== activeTab) return false;
    if (search.trim()) {
      return (
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.toLowerCase().includes(search.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track and manage customer orders and fulfillment</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Today</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Orders Table Card matching screenshot */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4">
        
        {/* Search */}
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter Tabs matching screenshot */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
          {[
            { label: 'All', count: '1,248' },
            { label: 'Pending', count: 23 },
            { label: 'Confirmed', count: 14 },
            { label: 'Preparing', count: 158 },
            { label: 'Out for Delivery', count: 210 },
            { label: 'Delivered', count: 501 }
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab.label
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Table matching screenshot */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 pb-3">
                <th className="pb-3 font-semibold">Order ID</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Total</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Payment</th>
                <th className="pb-3 font-semibold">Time</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-800">{ord.id}</td>
                  <td className="py-3 font-semibold text-slate-800">{ord.customer}</td>
                  <td className="py-3 font-bold text-slate-900">Rs. {ord.total}</td>
                  <td className="py-3">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${ord.statusClass}`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 font-medium">{ord.payment}</td>
                  <td className="py-3 text-slate-400 text-[11px] font-mono">{ord.time}</td>
                  <td className="py-3 text-right">
                    <select
                      value={ord.status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      className="text-[10px] bg-slate-50 border border-slate-200 rounded p-1 font-semibold text-slate-700 cursor-pointer"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
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
