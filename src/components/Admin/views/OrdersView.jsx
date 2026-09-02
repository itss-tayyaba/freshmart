import React, { useState } from 'react';
import { Search, Calendar, ChevronDown, Clock, Package, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const OrdersView = () => {
  const { customerOrders, adminOrders, updateDeliveryOrderStatus, addToast } = useStore();
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  // Combine live orders from customerOrders / adminOrders
  const liveOrders = customerOrders && customerOrders.length > 0 ? customerOrders : adminOrders || [];

  const handleStatusChange = (orderId, newStatus) => {
    updateDeliveryOrderStatus(orderId, newStatus);
    addToast('Status Updated', `Order ${orderId} marked as ${newStatus}.`);
  };

  const filtered = liveOrders.filter((o) => {
    if (activeTab !== 'All' && o.status !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.customer && o.customer.toLowerCase().includes(q)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'Out for Delivery':
      case 'Dispatched to Rider':
        return 'bg-amber-100 text-amber-800';
      case 'Preparing':
        return 'bg-blue-100 text-blue-800';
      case 'Confirmed':
        return 'bg-indigo-100 text-indigo-800';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track and manage customer orders, fulfillments & payments</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Live Orders ({liveOrders.length})</span>
          </div>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4">
        
        {/* Search */}
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search by order ID, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
          {[
            { label: 'All', count: liveOrders.length },
            { label: 'Preparing', count: liveOrders.filter((o) => o.status === 'Preparing').length },
            { label: 'Out for Delivery', count: liveOrders.filter((o) => o.status === 'Out for Delivery' || o.status === 'Dispatched to Rider').length },
            { label: 'Delivered', count: liveOrders.filter((o) => o.status === 'Delivered').length },
            { label: 'Cancelled', count: liveOrders.filter((o) => o.status === 'Cancelled').length }
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.label
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Table or Clean Zero-State */}
        {liveOrders.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
              📦
            </div>
            <h3 className="font-black text-slate-800 text-sm">No Orders Placed Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When a customer completes a checkout order in the FreshMart store, the live order details will appear here automatically.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            No orders found matching "{search}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-3 font-semibold">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 font-semibold text-right">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-mono font-bold text-emerald-700">{ord.id}</td>
                    <td className="py-3">
                      <span className="font-semibold text-slate-900 block">{ord.customer || 'Customer'}</span>
                      <span className="text-[10px] text-slate-400 block">{ord.customerPhone || ord.customerEmail || ''}</span>
                    </td>
                    <td className="py-3 text-slate-600 font-medium">
                      {ord.items || (Array.isArray(ord.rawItems) ? `${ord.rawItems.length} Items` : 'Items')}
                    </td>
                    <td className="py-3 font-bold text-slate-900">Rs. {ord.total || ord.totalAmount || 0}</td>
                    <td className="py-3 text-slate-600 font-medium">{ord.payment || 'Cash on Delivery'}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${getStatusBadge(ord.status)}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <select
                        value={ord.status}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-500"
                      >
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
        )}

      </div>

    </div>
  );
};

