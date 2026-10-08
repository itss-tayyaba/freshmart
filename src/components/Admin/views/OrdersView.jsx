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
  Ban,
  Boxes
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { DeliverToStaffModal } from '../modals/DeliverToStaffModal';
import { resolveTenantId } from '../../../data/companyHierarchyData';

// Helper: Extract human-readable order items count/summary safely (never returns an object/array)
const formatOrderItemsSummary = (ord) => {
  if (!ord) return 'Items';
  if (typeof ord.items === 'string' && ord.items.trim()) return ord.items;
  if (Array.isArray(ord.items) && ord.items.length > 0) {
    return `${ord.items.length} item${ord.items.length > 1 ? 's' : ''}`;
  }
  if (Array.isArray(ord.rawItems) && ord.rawItems.length > 0) {
    return `${ord.rawItems.length} item${ord.rawItems.length > 1 ? 's' : ''}`;
  }
  if (Array.isArray(ord.orderItems) && ord.orderItems.length > 0) {
    return `${ord.orderItems.length} item${ord.orderItems.length > 1 ? 's' : ''}`;
  }
  return '1 item';
};

// Helper: Extract list of items for detailed receipt/drawer inspection
const getOrderItemsList = (ord) => {
  if (!ord) return [];
  if (Array.isArray(ord.rawItems) && ord.rawItems.length > 0) return ord.rawItems;
  if (Array.isArray(ord.items) && ord.items.length > 0) return ord.items;
  if (Array.isArray(ord.orderItems) && ord.orderItems.length > 0) return ord.orderItems;
  return [];
};

// Helper: Format detailed comma-separated items line matching Image 2
const formatDetailedItemsLine = (ord) => {
  if (!ord) return '—';
  const list = getOrderItemsList(ord);
  if (Array.isArray(list) && list.length > 0) {
    return list
      .map((it) => {
        const base = `${it.quantity || it.qty || 1}× ${it.name || it.productName || it.title || 'Item'}`;
        if (it.isSubstituted && it.originalProduct) {
          return `${base} [🔄 Substituted, was: ${it.originalProduct.name}]`;
        }
        return base;
      })
      .join(', ');
  }
  if (typeof ord.items === 'string') return ord.items;
  return '1× Item';
};

// Helper: Safely get customer display name (handles string, object, or fallback)
const getCustomerDisplayName = (customerVal, fallback = 'Customer') => {
  if (!customerVal) return fallback;
  if (typeof customerVal === 'string') return customerVal;
  if (typeof customerVal === 'object') {
    return customerVal.name || customerVal.fullName || customerVal.customerName || fallback;
  }
  return fallback;
};

// Helper: Render status pill badge matching Image 2
const renderStatusBadge = (status) => {
  const s = String(status || 'Pending').toLowerCase();
  if (s === 'ready' || s === 'ready for dispatch' || s === 'ready(dispatched)') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
        <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
        <span>Ready</span>
      </span>
    );
  }
  if (s === 'pending' || s === 'pending_kitchen') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span>Pending</span>
      </span>
    );
  }
  if (s === 'preparing' || s === 'processing' || s === 'packed' || s === 'picking') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span>Preparing</span>
      </span>
    );
  }
  if (s === 'dispatched' || s === 'out for delivery') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
        <span className="w-2 h-2 rounded-full bg-purple-500" />
        <span>Dispatched</span>
      </span>
    );
  }
  if (s === 'delivered') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>Completed</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
      <span className="w-2 h-2 rounded-full bg-slate-400" />
      <span>{status || 'Pending'}</span>
    </span>
  );
};

export const OrdersView = ({ onNavigateToCustomers }) => {
  const {
    customerOrders,
    adminOrders,
    customers,
    assignRiderToOrder,
    getEligibleRidersForOrder,
    addToast,
    currentTenant
  } = useStore();

  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('All Time');
  const [selectedRiderMap, setSelectedRiderMap] = useState({});

  // Selected Order for Right Side Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Selected Order for 7-Stage Fulfillment Pipeline Modal

  // Selected Order for Deliver to Staff Modal
  const [deliverToStaffOrder, setDeliverToStaffOrder] = useState(null);

  // Selected Customer for Customer Profile & History Modal
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);

  // Combine live orders filtered strictly by active supermarket branch (prioritizing Delivered status)
  const liveOrders = useMemo(() => {
    const combined = [...(customerOrders || []), ...(adminOrders || [])];
    const uniqueMap = new Map();
    combined.forEach((ord) => {
      if (ord && (ord.id || ord.orderId || ord._id)) {
        const bareKey = String(ord.id || ord.orderId || ord._id).replace(/^#/, '').trim().toLowerCase();
        const existing = uniqueMap.get(bareKey);
        if (!existing) {
          uniqueMap.set(bareKey, ord);
        } else if (ord.status === 'Delivered' || ord.isDelivered || Number(ord.fulfillmentStage) >= 4) {
          uniqueMap.set(bareKey, ord);
        }
      }
    });
    const raw = Array.from(uniqueMap.values());
    if (!currentTenant?.id) return raw;
    return raw.filter((o) => {
      if (!o.tenantId) return false;
      return o.tenantId === currentTenant.id || resolveTenantId(o.tenantId) === resolveTenantId(currentTenant.id);
    });
  }, [customerOrders, adminOrders, currentTenant]);

  // Statistics KPI counts
  const stats = useMemo(() => {
    const total = liveOrders.length;
    const pending = liveOrders.filter((o) => o.status === 'Pending').length;
    const deliverToStaff = liveOrders.filter(
      (o) => o.status === 'Deliver to Staff' || o.status === 'Delivered to Staff'
    ).length;
    const preparing = liveOrders.filter((o) => o.status === 'Preparing').length;
    const outForDelivery = liveOrders.filter(
      (o) => o.status === 'Out for Delivery' || o.status === 'Dispatched to Rider'
    ).length;
    const delivered = liveOrders.filter((o) => o.status === 'Delivered').length;
    const cancelled = liveOrders.filter((o) => o.status === 'Cancelled').length;

    return { total, pending, deliverToStaff, preparing, outForDelivery, delivered, cancelled };
  }, [liveOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return liveOrders.filter((o) => {
      // Tab filter
      if (activeTab === 'Pending' && o.status !== 'Pending') return false;
      if (
        activeTab === 'Deliver to Staff' &&
        o.status !== 'Deliver to Staff' &&
        o.status !== 'Delivered to Staff'
      )
        return false;
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
        const matchesId = o.id && String(o.id).toLowerCase().includes(q);
        const custNameStr = getCustomerDisplayName(o.customer || o.customerName, '');
        const matchesCustomer = custNameStr && custNameStr.toLowerCase().includes(q);
        const matchesEmail = typeof o.customerEmail === 'string' && o.customerEmail.toLowerCase().includes(q);
        const matchesPhone = typeof o.customerPhone === 'string' && o.customerPhone.toLowerCase().includes(q);
        const matchesAddress = (typeof o.address === 'string' ? o.address : (o.shippingAddress?.address || '')).toLowerCase().includes(q);
        const matchesCity = (typeof o.city === 'string' ? o.city : (o.shippingAddress?.city || '')).toLowerCase().includes(q);
        if (!matchesId && !matchesCustomer && !matchesEmail && !matchesPhone && !matchesAddress && !matchesCity)
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
  };

  const handleAssignRider = async (orderId) => {
    const riderId = selectedRiderMap[orderId];
    if (!riderId) {
      addToast('Select a Rider 🛵', 'Please select a rider from the dropdown first.', 'error');
      return;
    }
    if (assignRiderToOrder) {
      await assignRiderToOrder(orderId, riderId, 'Ready for Dispatch');
    }
  };

  // Helper: Open customer profile modal from order customer details
  const openCustomerDetailsModal = (customerName, customerEmail, customerPhone, customerAddress) => {
    const cleanName = getCustomerDisplayName(customerName, 'Customer');
    const cleanEmail = typeof customerEmail === 'string' ? customerEmail : '';
    const cleanPhone = typeof customerPhone === 'string' ? customerPhone : '';
    const cleanAddr = typeof customerAddress === 'string' ? customerAddress : (customerAddress?.address || 'Lahore');

    // Look up in customers directory or build profile
    const existing = (customers || []).find(
      (c) =>
        (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail.toLowerCase()) ||
        (cleanPhone && c.phone && c.phone === cleanPhone) ||
        (c.name && cleanName && c.name.toLowerCase() === cleanName.toLowerCase())
    );

    // Find all past orders placed by this customer
    const customerOrderHistory = liveOrders.filter((o) => {
      const oCustName = getCustomerDisplayName(o.customer || o.customerName, '');
      const matchName = oCustName && cleanName && oCustName.toLowerCase() === cleanName.toLowerCase();
      const matchEmail = cleanEmail && o.customerEmail && o.customerEmail.toLowerCase() === cleanEmail.toLowerCase();
      const matchPhone = cleanPhone && o.customerPhone && o.customerPhone === cleanPhone;
      return matchName || matchEmail || matchPhone;
    });

    const totalSpentCalculated = customerOrderHistory.reduce(
      (sum, ord) => sum + (Number(ord.total) || Number(ord.totalAmount) || 0),
      0
    );

    const customerObj = {
      name: cleanName || existing?.name || 'Customer',
      email: cleanEmail || existing?.email || 'customer@freshmart.pk',
      phone: cleanPhone || existing?.phone || '+92 300 1234567',
      address: cleanAddr || existing?.address || 'House 12, Johar Town, Lahore',
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
      case 'Deliver to Staff':
      case 'Delivered to Staff':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 font-bold';
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
            <span>{currentTenant?.name || 'Store'} Orders</span>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              {liveOrders.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track, manage, and fulfill customer orders for {currentTenant?.name || 'this supermarket'} in real-time.
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

      {/* 2. Top KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* All Orders */}
        <div
          onClick={() => setActiveTab('All')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'All'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500">All Orders</span>
            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs">
              <ShoppingBag className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{stats.total}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Total volume</span>
        </div>

        {/* Pending (Awaiting Rider) */}
        <div
          onClick={() => setActiveTab('Pending')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Pending'
              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-amber-700">Pending</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-900">{stats.pending}</div>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Awaiting Processing</span>
        </div>

        {/* Deliver to Staff */}
        <div
          onClick={() => setActiveTab('Deliver to Staff')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Deliver to Staff'
              ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-indigo-700">Deliver to Staff</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
              <Boxes className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-950">{stats.deliverToStaff}</div>
          <span className="text-[10px] text-indigo-600 font-medium mt-0.5 block">Packing Desk</span>
        </div>

        {/* Preparing */}
        <div
          onClick={() => setActiveTab('Preparing')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Preparing'
              ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-blue-700">Preparing</span>
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
              <Package className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{stats.preparing}</div>
          <span className="text-[10px] text-blue-600 font-medium mt-0.5 block">In Packing</span>
        </div>

        {/* Out for Delivery */}
        <div
          onClick={() => setActiveTab('Out for Delivery')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Out for Delivery'
              ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-purple-700">In Transit</span>
            <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
              <Truck className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{stats.outForDelivery}</div>
          <span className="text-[10px] text-purple-600 font-medium mt-0.5 block">Out for Delivery</span>
        </div>

        {/* Delivered */}
        <div
          onClick={() => setActiveTab('Delivered')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Delivered'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-emerald-700">Delivered</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{stats.delivered}</div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Completed</span>
        </div>

        {/* Cancelled */}
        <div
          onClick={() => setActiveTab('Cancelled')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'Cancelled'
              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-rose-700">Cancelled</span>
            <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs">
              <AlertCircle className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900">{stats.cancelled}</div>
          <span className="text-[10px] text-rose-600 font-medium mt-0.5 block">Cancelled</span>
        </div>

      </div>

      {/* 3. Main Orders Workspace (Table + Optional Side Drawer) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side: Table & Search Card */}
        <div className="flex-1 w-full bg-white rounded-3xl border border-slate-100 shadow-card p-5 sm:p-6 space-y-5">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by order ID, customer, phone, address, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-8 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
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

          {/* Status Tabs Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { label: 'All', count: stats.total },
              { label: 'Pending', count: stats.pending, sub: 'Awaiting Processing' },
              { label: 'Preparing', count: stats.preparing },
              { label: 'Out for Delivery', count: stats.outForDelivery },
              { label: 'Delivered', count: stats.delivered },
              { label: 'Cancelled', count: stats.cancelled }
            ].map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.label
                    ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-600/20'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Orders Table */}
          {liveOrders.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
                📦
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-base">No Customer Orders Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  When a customer completes checkout, their order will appear here with delivery address details for you to assign a fleet courier.
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
                    <th className="pb-3.5 pl-2">Customer</th>
                    <th className="pb-3.5">Type</th>
                    <th className="pb-3.5">Table</th>
                    <th className="pb-3.5">Items</th>
                    <th className="pb-3.5">Total & Payment</th>
                    <th className="pb-3.5">Assign Rider</th>
                    <th className="pb-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((ord) => {
                    const customerName = getCustomerDisplayName(ord.customer || ord.customerName);
                    const customerPhone = typeof ord.customerPhone === 'string' ? ord.customerPhone : (ord.customer?.phone || ord.phone || '+92 300 0000000');
                    const orderType = ord.orderType || (ord.table ? 'Dine-In' : 'Delivery');
                    const tableRef = ord.table || '—';
                    const itemsLine = formatDetailedItemsLine(ord);
                    const paymentBadgeLabel = `${ord.paymentMethod || 'JAZZCASH'} · ${ord.paymentStatus || 'PENDING'}`.toUpperCase();
                    const eligibleRiders = getEligibleRidersForOrder ? getEligibleRidersForOrder(ord) : [];
                    const orderIsReady = Number(ord.fulfillmentStage || 0) >= 4 || ord.status === 'Ready for Dispatch';

                    return (
                      <tr
                        key={ord.id}
                        className="transition-colors group hover:bg-slate-50/70"
                      >
                        {/* 1. Customer Column */}
                        <td className="py-4 pl-2 min-w-[140px]">
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-amber-800 transition-colors">
                              {customerName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {customerPhone}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold block mt-0.5">
                              #{String(ord.id).replace(/^#/, '')}
                            </span>
                          </div>
                        </td>

                        {/* 2. Type Column (Delivery / Dine-in) */}
                        <td className="py-4 text-slate-700 font-medium whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {orderType}
                          </span>
                        </td>

                        {/* 3. Table Column (— or Table #) */}
                        <td className="py-4 text-slate-400 font-bold whitespace-nowrap">
                          {tableRef}
                        </td>

                        {/* 4. Items Column (1× Truffle Angus Burger, 1× Cold Brew Coffee) */}
                        <td className="py-4 max-w-[240px]">
                          <p className="text-slate-800 text-xs font-semibold leading-relaxed line-clamp-2">
                            {itemsLine}
                          </p>
                        </td>

                        {/* 5. Total & Payment Column (Rs 1,620.00, JAZZCASH · PENDING, 🔍 Verify Deposit) */}
                        <td className="py-4 font-mono min-w-[150px]">
                          <div>
                            <span className="font-black text-slate-900 text-xs block">
                              Rs {Number(ord.total || ord.totalAmount || 0).toLocaleString()}
                            </span>
                            <div className="mt-1">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider inline-block ${
                                  ord.paymentStatus === 'Verified' || ord.isPaymentVerified
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]'
                                }`}
                              >
                                {paymentBadgeLabel}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 7. Assign Rider Column (Choose rider... dropdown + Assign button) */}
                        <td className="py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col items-start gap-1.5 min-w-[130px]">
                            {ord.status === 'Delivered' ? (
                              <div className="space-y-0.5">
                                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                  ✓ Handover Verified
                                </span>
                                {ord.assignedRider && (
                                  <span className="text-[10px] text-slate-500 block">
                                    Delivered by {ord.assignedRider.name}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <>
                                <select
                                  value={ord.assignedRider?.id || selectedRiderMap[ord.id] || ''}
                                  onChange={(e) =>
                                    setSelectedRiderMap((prev) => ({ ...prev, [ord.id]: e.target.value }))
                                  }
                                  disabled={eligibleRiders.length === 0}
                                  className="bg-[#f5efe6] hover:bg-[#ede5d8] border border-[#ded5c5] rounded-xl px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer w-full max-w-[160px]"
                                >
                                  <option value="">Choose rider...</option>
                                  {eligibleRiders.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name} · {r.distanceKm.toFixed(1)} km
                                    </option>
                                  ))}
                                </select>
                                {eligibleRiders.length === 0 && (
                                  <span className="text-[10px] text-rose-600">No on-duty rider covers this GPS area</span>
                                )}

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleAssignRider(ord.id)}
                                    disabled={!selectedRiderMap[ord.id] && !ord.assignedRider}
                                    className="px-3.5 py-1 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Assign
                                  </button>
                                  {ord.assignedRider && (
                                    <span className="text-[10px] text-purple-700 font-bold">
                                      ✓ {ord.assignedRider.name}
                                    </span>
                                  )}
                                </div>
                                {ord.deliveryOtp && (
                                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                                    OTP: {ord.deliveryOtp}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-4 whitespace-nowrap">{renderStatusBadge(ord.status)}</td>
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
            <span className="text-[11px] text-slate-400">Status updates come from pickup staff and riders.</span>
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
                    {getCustomerDisplayName(selectedOrder.customer || selectedOrder.customerName)}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {typeof selectedOrder.customerPhone === 'string' ? selectedOrder.customerPhone : (selectedOrder.customer?.phone || '+92 300 1234567')}
                  </p>
                  {selectedOrder.customerEmail && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      {typeof selectedOrder.customerEmail === 'string' ? selectedOrder.customerEmail : (selectedOrder.customer?.email || '')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${typeof selectedOrder.customerPhone === 'string' ? selectedOrder.customerPhone : '03001234567'}`}
                    className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-500 flex items-center justify-center transition-colors shadow-2xs"
                    title="Call customer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() =>
                      addToast('Message Copied 💬', `Customer phone ${typeof selectedOrder.customerPhone === 'string' ? selectedOrder.customerPhone : '03001234567'} ready to WhatsApp.`)
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
                  {typeof selectedOrder.address === 'string' ? selectedOrder.address : (selectedOrder.shippingAddress?.address || '123 Main Street, Sector B, Johar Town, Lahore')}
                </p>
              </div>
            </div>

            {/* Order Items List */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Order Items ({getOrderItemsList(selectedOrder).length || 1})</span>
              </span>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                {getOrderItemsList(selectedOrder).length > 0 ? (
                  getOrderItemsList(selectedOrder).map((item, idx) => {
                    const itemName = typeof item === 'object' ? item.name || 'Order Item' : String(item);
                    const itemQty = typeof item === 'object' ? item.quantity || 1 : 1;
                    const itemPrice = typeof item === 'object' ? Number(item.price || 0) : 0;
                    const itemUnit = typeof item === 'object' && item.unit ? `• ${item.unit}` : '';
                    const itemImg = typeof item === 'object' && item.image
                      ? item.image
                      : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80';

                    return (
                      <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={itemImg}
                            alt={itemName}
                            className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-900 truncate text-xs">{itemName}</h5>
                            {item.isSubstituted && item.originalProduct && (
                              <div className="mt-0.5 space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                                  <span>🔄 Substituted</span>
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  Originally: <strong className="text-slate-700">{item.originalProduct.name}</strong> (Rs. {item.originalProduct.price})
                                </span>
                              </div>
                            )}
                            <span className="text-[10px] text-slate-400">
                              Qty: {itemQty} {itemUnit}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 font-mono shrink-0">
                          Rs. {(itemPrice * itemQty).toLocaleString()}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between font-medium text-slate-700">
                    <span>
                      {typeof selectedOrder.items === 'string' && selectedOrder.items.trim()
                        ? selectedOrder.items
                        : 'Standard Order Items'}
                    </span>
                    <span className="font-bold font-mono">
                      Rs. {Number(selectedOrder.total || selectedOrder.totalAmount || 0).toLocaleString()}
                    </span>
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

            {/* Deliver Parcel to Staff Button */}
            <div className="pt-2">
              <button
                onClick={() => setDeliverToStaffOrder(selectedOrder)}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border border-indigo-500/30"
              >
                <Boxes className="w-4 h-4 text-indigo-200" />
                <span>📦 Deliver Parcel to Staff (Pick & Pack)</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fulfillment status</span>
              <p className="text-xs text-slate-600">{selectedOrder.status || 'Pending'} · Pickup staff update preparation and dispatch from their assigned workspace.</p>
              {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && <button onClick={() => handleStatusChange(selectedOrder.id, 'Cancelled')} className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">Cancel Order</button>}
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
                              {order.dateFormatted || order.time || 'Recent'} • {formatOrderItemsSummary(order)}
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


      {/* Deliver Parcel to Staff Modal */}
      {deliverToStaffOrder && (
        <DeliverToStaffModal
          order={deliverToStaffOrder}
          isOpen={Boolean(deliverToStaffOrder)}
          onClose={() => setDeliverToStaffOrder(null)}
          onSuccess={(updates) => {
            if (selectedOrder && selectedOrder.id === deliverToStaffOrder.id) {
              setSelectedOrder((prev) => ({ ...prev, ...updates }));
            }
          }}
        />
      )}

    </div>
  );
};
