import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  ChevronDown,
  Clock,
  Package,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  CreditCard,
  Truck,
  ExternalLink,
  MessageSquare,
  FileText,
  Printer,
  Sparkles,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Check,
  Ban
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const OrdersView = ({ onNavigateToCustomers }) => {
  const {
    customerOrders,
    adminOrders,
    customers,
    riders,
    updateDeliveryOrderStatus,
    assignRiderToOrder,
    addToast
  } = useStore();

  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('All Time');

  // Selected Order for Right Side Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Selected Customer for Customer Profile & History Modal
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);

  // Combine live orders
  const liveOrders = useMemo(() => {
    if (customerOrders && customerOrders.length > 0) return customerOrders;
    if (adminOrders && adminOrders.length > 0) return adminOrders;
    return [];
  }, [customerOrders, adminOrders]);

  // Statistics KPI counts
  const stats = useMemo(() => {
    const total = liveOrders.length;
    const preparing = liveOrders.filter((o) => o.status === 'Preparing').length;
    const outForDelivery = liveOrders.filter(
      (o) => o.status === 'Out for Delivery' || o.status === 'Dispatched to Rider'
    ).length;
    const delivered = liveOrders.filter((o) => o.status === 'Delivered').length;
    const cancelled = liveOrders.filter((o) => o.status === 'Cancelled').length;

    return { total, preparing, outForDelivery, delivered, cancelled };
  }, [liveOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return liveOrders.filter((o) => {
      // Tab filter
      if (activeTab === 'Preparing' && o.status !== 'Preparing') return false;
      if (
        activeTab === 'Out for Delivery' &&
        o.status !== 'Out for Delivery' &&
        o.status !== 'Dispatched to Rider'
      )
        return false;
      if (activeTab === 'Delivered' && o.status !== 'Delivered') return false;
      if (activeTab === 'Cancelled' && o.status !== 'Cancelled') return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesId = o.id && o.id.toLowerCase().includes(q);
        const matchesCustomer = o.customer && o.customer.toLowerCase().includes(q);
        const matchesEmail = o.customerEmail && o.customerEmail.toLowerCase().includes(q);
        const matchesPhone = o.customerPhone && o.customerPhone.toLowerCase().includes(q);
        const matchesAddress = o.address && o.address.toLowerCase().includes(q);
        if (!matchesId && !matchesCustomer && !matchesEmail && !matchesPhone && !matchesAddress)
          return false;
      }

      return true;
    });
  }, [liveOrders, activeTab, search]);

  const handleStatusChange = (orderId, newStatus) => {
    updateDeliveryOrderStatus(orderId, newStatus);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    addToast('Status Updated 📦', `Order ${orderId} marked as ${newStatus}.`);
  };

  const handleAssignRider = (orderId, riderId) => {
    assignRiderToOrder(orderId, riderId);
    const assignedRiderObj = riders.find((r) => r.id === riderId);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              assignedRider: assignedRiderObj,
              status: 'Dispatched to Rider'
            }
          : null
      );
    }
  };

  // Helper: Open customer profile modal from order customer details
  const openCustomerDetailsModal = (customerName, customerEmail, customerPhone, customerAddress) => {
    // Look up in customers directory or build profile
    const existing = (customers || []).find(
      (c) =>
        (customerEmail && c.email && c.email.toLowerCase() === customerEmail.toLowerCase()) ||
        (customerPhone && c.phone && c.phone === customerPhone) ||
        (c.name && c.name.toLowerCase() === (customerName || '').toLowerCase())
    );

    // Find all past orders placed by this customer
    const customerOrderHistory = liveOrders.filter((o) => {
      const matchName = o.customer && customerName && o.customer.toLowerCase() === customerName.toLowerCase();
      const matchEmail = o.customerEmail && customerEmail && o.customerEmail.toLowerCase() === customerEmail.toLowerCase();
      const matchPhone = o.customerPhone && customerPhone && o.customerPhone === customerPhone;
      return matchName || matchEmail || matchPhone;
    });

    const totalSpentCalculated = customerOrderHistory.reduce(
      (sum, ord) => sum + (Number(ord.total) || Number(ord.totalAmount) || 0),
      0
    );

    const customerObj = {
      name: customerName || existing?.name || 'Customer',
      email: customerEmail || existing?.email || 'customer@freshmart.pk',
      phone: customerPhone || existing?.phone || '+92 300 1234567',
      address: customerAddress || existing?.address || 'House 12, Johar Town, Lahore',
      totalOrders: customerOrderHistory.length || existing?.totalOrders || 1,
      totalSpent: totalSpentCalculated > 0 ? `Rs. ${totalSpentCalculated.toLocaleString()}` : existing?.totalSpent || 'Rs. 0',
      history: customerOrderHistory,
      joinedDate: existing?.joinedDate || 'Active Customer'
    };

    setSelectedCustomerModal(customerObj);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Out for Delivery':
      case 'Dispatched to Rider':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Confirmed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Orders</span>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              {liveOrders.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track, manage, and fulfill customer orders in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              window.print();
            }}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Report</span>
          </button>

          <div className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-lime-300 animate-ping" />
            <span>Live Dispatch Active</span>
          </div>
        </div>
      </div>

      {/* 2. Top KPI Summary Cards matching Screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* All Orders */}
        <div
          onClick={() => setActiveTab('All')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'All'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">All Orders</span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xs">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">View all orders</span>
        </div>

        {/* Preparing */}
        <div
          onClick={() => setActiveTab('Preparing')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Preparing'
              ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-blue-700">Preparing</span>
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.preparing}</div>
          <span className="text-[10px] text-blue-600 font-medium mt-1 block">View preparing</span>
        </div>

        {/* Out for Delivery */}
        <div
          onClick={() => setActiveTab('Out for Delivery')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Out for Delivery'
              ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-purple-700">Out for Delivery</span>
            <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.outForDelivery}</div>
          <span className="text-[10px] text-purple-600 font-medium mt-1 block">View in-transit</span>
        </div>

        {/* Delivered */}
        <div
          onClick={() => setActiveTab('Delivered')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Delivered'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-700">Delivered</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.delivered}</div>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 block">View delivered</span>
        </div>

        {/* Cancelled */}
        <div
          onClick={() => setActiveTab('Cancelled')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Cancelled'
              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-700">Cancelled</span>
            <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.cancelled}</div>
          <span className="text-[10px] text-rose-600 font-medium mt-1 block">View cancelled</span>
        </div>

      </div>

      {/* 3. Main Orders Workspace (Table + Optional Side Drawer) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side: Table & Search Card */}
        <div className="flex-1 w-full bg-white rounded-3xl border border-slate-100 shadow-card p-5 sm:p-6 space-y-5">
          
          {/* Search & Filter Bar matching Screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by order ID, customer, phone, address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-8 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All Time">All Time</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status Tabs Pills matching Screenshot */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { label: 'All', count: stats.total },
              { label: 'Preparing', count: stats.preparing },
              { label: 'Out for Delivery', count: stats.outForDelivery },
              { label: 'Delivered', count: stats.delivered },
              { label: 'Cancelled', count: stats.cancelled }
            ].map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.label
                    ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-600/20'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Orders Table matching Screenshot */}
          {liveOrders.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
                📦
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-base">No Customer Orders Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  When a customer (like Hafsa or Aimen) completes checkout in FreshMart, their live order and historical statistics will automatically appear here.
                </p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 bg-slate-50/40 rounded-2xl">
              No orders found matching "{search}" in {activeTab}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3.5 pl-1">ORDER ID</th>
                    <th className="pb-3.5">CUSTOMER (CLICK TO VIEW)</th>
                    <th className="pb-3.5">ITEMS</th>
                    <th className="pb-3.5">TOTAL AMOUNT</th>
                    <th className="pb-3.5">PAYMENT</th>
                    <th className="pb-3.5">STATUS</th>
                    <th className="pb-3.5">ORDER DATE</th>
                    <th className="pb-3.5 text-right pr-2">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.map((ord) => {
                    const isSelected = selectedOrder?.id === ord.id;
                    const itemsText =
                      ord.items ||
                      (Array.isArray(ord.rawItems)
                        ? `${ord.rawItems.length} item${ord.rawItems.length > 1 ? 's' : ''}`
                        : 'Items');

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className={`transition-colors cursor-pointer group ${
                          isSelected ? 'bg-emerald-50/80 font-medium' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Order ID */}
                        <td className="py-4 pl-1 font-mono font-black text-emerald-700">
                          {ord.id}
                        </td>

                        {/* Customer (Clickable -> Opens Customer Details Modal!) */}
                        <td className="py-4">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              openCustomerDetailsModal(
                                ord.customer,
                                ord.customerEmail,
                                ord.customerPhone,
                                ord.address
                              );
                            }}
                            className="flex items-center gap-2.5 group/cust cursor-pointer"
                            title="Click to view Customer Profile & Order History"
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-200/50 group-hover/cust:scale-110 transition-transform">
                              {(ord.customer || 'C').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block group-hover/cust:text-emerald-700 group-hover/cust:underline transition-colors flex items-center gap-1">
                                <span>{ord.customer || 'Customer'}</span>
                                <User className="w-3 h-3 text-slate-400 group-hover/cust:text-emerald-600 opacity-0 group-hover/cust:opacity-100 transition-opacity" />
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal block font-mono">
                                {ord.customerPhone || ord.customerEmail || ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Items */}
                        <td className="py-4 text-slate-600 font-medium">
                          {itemsText}
                        </td>

                        {/* Total Amount */}
                        <td className="py-4 font-black text-slate-900 font-mono">
                          Rs. {Number(ord.total || ord.totalAmount || 0).toLocaleString()}
                        </td>

                        {/* Payment */}
                        <td className="py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                            <CreditCard className="w-3 h-3 text-slate-500" />
                            {ord.payment || 'Cash on Delivery'}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                              ord.status
                            )}`}
                          >
                            {ord.status || 'Preparing'}
                          </span>
                        </td>

                        {/* Order Date */}
                        <td className="py-4 text-slate-500 text-[11px]">
                          <span className="block font-medium">
                            {ord.dateFormatted || ord.time || 'Recently'}
                          </span>
                          {ord.time && ord.dateFormatted && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {ord.time}
                            </span>
                          )}
                        </td>

                        {/* Action View Button */}
                        <td className="py-4 text-right pr-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(ord);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredOrders.length} of {liveOrders.length} orders
            </span>
            <span className="text-[11px] text-slate-400">
              💡 Tip: Click on any <b>Customer Name</b> to inspect their lifetime order history.
            </span>
          </div>

        </div>

        {/* Right Side Drawer / Order Details Panel matching Screenshot */}
        {selectedOrder && (
          <aside className="w-full lg:w-[420px] shrink-0 bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 space-y-5 animate-in slide-in-from-right-4 duration-200">
            
            {/* Header: Order ID & Close */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 font-mono">
                    Order {selectedOrder.id}
                  </h3>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {selectedOrder.dateFormatted || 'Today'} • {selectedOrder.time || '10:30 AM'}
                </span>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Information Card (with click to inspect history!) */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Customer Information</span>
                </span>
                
                <button
                  onClick={() =>
                    openCustomerDetailsModal(
                      selectedOrder.customer,
                      selectedOrder.customerEmail,
                      selectedOrder.customerPhone,
                      selectedOrder.address
                    )
                  }
                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-black hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View History</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {selectedOrder.customer || 'Customer'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {selectedOrder.customerPhone || '+92 300 1234567'}
                  </p>
                  {selectedOrder.customerEmail && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      {selectedOrder.customerEmail}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${selectedOrder.customerPhone || '03001234567'}`}
                    className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-500 flex items-center justify-center transition-colors shadow-2xs"
                    title="Call customer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() =>
                      addToast('Message Copied 💬', `Customer phone ${selectedOrder.customerPhone || '03001234567'} ready to WhatsApp.`)
                    }
                    className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-500 flex items-center justify-center transition-colors shadow-2xs"
                    title="Send message"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  Delivery Address
                </span>
                <p className="text-slate-700 text-[11px] font-medium leading-snug">
                  {selectedOrder.address || '123 Main Street, Sector B, Johar Town, Lahore'}
                </p>
              </div>
            </div>

            {/* Order Items List */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Order Items ({Array.isArray(selectedOrder.rawItems) ? selectedOrder.rawItems.length : 1})</span>
              </span>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                {Array.isArray(selectedOrder.rawItems) && selectedOrder.rawItems.length > 0 ? (
                  selectedOrder.rawItems.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'}
                          alt={item.name}
                          className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-900 truncate text-xs">{item.name}</h5>
                          <span className="text-[10px] text-slate-400">Qty: {item.quantity || 1} {item.unit ? `• ${item.unit}` : ''}</span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 font-mono shrink-0">
                        Rs. {(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between font-medium text-slate-700">
                    <span>{selectedOrder.items || 'Standard Order Items'}</span>
                    <span className="font-bold font-mono">Rs. {Number(selectedOrder.total || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">Rs. {Number(selectedOrder.subtotal || selectedOrder.total || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {selectedOrder.deliveryCharges ? `Rs. ${selectedOrder.deliveryCharges}` : 'FREE'}
                </span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="text-emerald-700 font-mono">
                  Rs. {Number(selectedOrder.total || selectedOrder.totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <div>
                  <span className="font-bold text-slate-900 block">{selectedOrder.payment || 'Cash on Delivery'}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Payment Status: Paid / Verified</span>
                </div>
              </div>
              <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                PAID
              </span>
            </div>

            {/* Assigned Rider */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Assigned Delivery Courier
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedOrder.assignedRider?.id || ''}
                  onChange={(e) => handleAssignRider(selectedOrder.id, e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">-- Assign Rider to Order --</option>
                  {(riders || []).map((r) => (
                    <option key={r.id} value={r.id}>
                      🛵 {r.name} ({r.zone || 'Lahore Hub'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Status Update Buttons */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Update Fulfillment Status
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'Preparing')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedOrder.status === 'Preparing'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  👨‍🍳 Preparing
                </button>
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'Out for Delivery')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedOrder.status === 'Out for Delivery' || selectedOrder.status === 'Dispatched to Rider'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  🛵 Out for Delivery
                </button>
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'Delivered')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedOrder.status === 'Delivered'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  ✅ Delivered
                </button>
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'Cancelled')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedOrder.status === 'Cancelled'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  ❌ Cancel Order
                </button>
              </div>
            </div>

          </aside>
        )}

      </div>

      {/* 4. CUSTOMER PROFILE & ORDER HISTORY MODAL (Matching User's Diagram!) */}
      {selectedCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCustomerModal(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-lime-300 text-base border border-white/10 shadow-inner">
                  {selectedCustomerModal.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">{selectedCustomerModal.name}</h3>
                  <p className="text-xs text-emerald-200">Customer Profile & Order History</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerModal(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/90 focus:outline-none cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Contact Information Bar */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Phone:</span>
                  </span>
                  <span className="font-bold text-slate-900 font-mono">
                    {selectedCustomerModal.phone}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Email:</span>
                  </span>
                  <span className="font-bold text-slate-900 font-mono truncate max-w-[220px]">
                    {selectedCustomerModal.email}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 pt-1 border-t border-slate-200/50">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Address:</span>
                  </span>
                  <span className="font-medium text-slate-700 text-right leading-snug text-[11px]">
                    {selectedCustomerModal.address}
                  </span>
                </div>
              </div>

              {/* Lifetime Metrics Summary Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                    Total Orders Placed
                  </span>
                  <div className="text-2xl font-black text-emerald-950 font-mono">
                    {selectedCustomerModal.totalOrders}
                  </div>
                </div>

                <div className="p-3.5 bg-teal-50/70 border border-teal-200/60 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">
                    Total Lifetime Spent
                  </span>
                  <div className="text-2xl font-black text-teal-950 font-mono">
                    {selectedCustomerModal.totalSpent}
                  </div>
                </div>
              </div>

              {/* Recent Orders History List (Matching User's ASCII Diagram) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recent Orders History ({selectedCustomerModal.history?.length || 0})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Click order to inspect</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedCustomerModal.history && selectedCustomerModal.history.length > 0 ? (
                    selectedCustomerModal.history.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setSelectedCustomerModal(null);
                        }}
                        className="p-3 bg-white hover:bg-emerald-50/60 rounded-xl border border-slate-200/80 hover:border-emerald-500 transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 transition-colors">
                            📦
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                                {order.id}
                              </span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${getStatusBadgeClass(
                                  order.status
                                )}`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {order.dateFormatted || order.time || 'Recent'} • {order.items || 'Items'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-slate-900 block">
                            Rs. {Number(order.total || order.totalAmount || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold group-hover:underline flex items-center justify-end gap-0.5">
                            <span>Details</span>
                            <ChevronDown className="w-2.5 h-2.5 -rotate-90" />
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                      No order history found for this customer.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Action Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedCustomerModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              {onNavigateToCustomers && (
                <button
                  onClick={() => {
                    setSelectedCustomerModal(null);
                    onNavigateToCustomers();
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>View Full Profile in Customers</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
