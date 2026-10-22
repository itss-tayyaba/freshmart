import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Clock,
  Check,
  CheckCircle2,
  Package,
  PackageCheck,
  Flame,
  Search,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
  LogOut,
  Sparkles,
  ArrowRight,
  Filter,
  LayoutGrid,
  List,
  CheckCheck,
  AlertCircle,
  Truck,
  Copy,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { resolveTenantId, isSameTenant } from '../../../data/companyHierarchyData';

// Helper: category/grocery item icon
const getItemIcon = (name = '') => {
  const n = String(name || '').toLowerCase();
  if (n.includes('milk') || n.includes('yogurt') || n.includes('cheese') || n.includes('butter') || n.includes('dairy') || n.includes('olper') || n.includes('dairy omung')) return '🥛';
  if (n.includes('bread') || n.includes('bun') || n.includes('toast') || n.includes('croissant') || n.includes('rusk') || n.includes('dawn')) return '🍞';
  if (n.includes('oil') || n.includes('ghee') || n.includes('dalda') || n.includes('banaspati') || n.includes('canola') || n.includes('cooking')) return '🧴';
  if (n.includes('egg') || n.includes('anda')) return '🥚';
  if (n.includes('rice') || n.includes('atta') || n.includes('flour') || n.includes('sugar') || n.includes('daal') || n.includes('pulse')) return '🌾';
  if (n.includes('chip') || n.includes('lays') || n.includes('biscuit') || n.includes('cookie') || n.includes('snack') || n.includes('oreo') || n.includes('kurkure') || n.includes('chocol')) return '🍪';
  if (n.includes('cappuccino') || n.includes('coffee') || n.includes('tea') || n.includes('chai') || n.includes('nescafe')) return '☕';
  if (n.includes('coke') || n.includes('pepsi') || n.includes('juice') || n.includes('water') || n.includes('soda') || n.includes('drink')) return '🥤';
  if (n.includes('soap') || n.includes('shampoo') || n.includes('surf') || n.includes('detergent') || n.includes('cleaner')) return '🧼';
  return '📦';
};

// Helper: Live Elapsed Packing Timer
const ElapsedTimer = ({ createdAt, fallbackSeconds = 42 }) => {
  const [elapsed, setElapsed] = useState(() => {
    if (!createdAt) return fallbackSeconds;
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    return diff > 0 ? diff : fallbackSeconds;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="inline-flex items-center gap-1.5 bg-slate-900/5 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80 font-mono text-xs font-bold shadow-2xs">
      <Clock size={12} className="text-emerald-600 animate-pulse" />
      <span>{mins}:{secs}</span>
      <span className="text-[9px] uppercase font-semibold text-slate-400">elapsed</span>
    </div>
  );
};

export const PickupStaffPortal = ({ onBackToAdmin }) => {
  const {
    user,
    customerOrders = [],
    adminOrders = [],
    currentTenant,
    updateOrderFulfillment,
    adminLogout,
    addToast,
    getProductSubstitutes,
    substituteOrderItem,
    currency
  } = useStore();

  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Pending' | 'Preparing' | 'Ready' | 'Dispatched'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [search, setSearch] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [pickedState, setPickedState] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Smart Product Substitution modal state for unavailable items
  const [substitutionModal, setSubstitutionModal] = useState(null); // { order, item, idx }
  const [substitutionReason, setSubstitutionReason] = useState('Customer approved substitution via phone');
  const [selectedAlternative, setSelectedAlternative] = useState(null);

  // Merge & deduplicate live orders from customer & admin orders
  const allOrders = useMemo(() => {
    const combined = [...(customerOrders || []), ...(adminOrders || [])];
    const uniqueMap = new Map();
    combined.forEach((ord) => {
      if (ord && (ord.id || ord.orderId)) {
        const id = String(ord.id || ord.orderId);
        if (!uniqueMap.has(id)) {
          uniqueMap.set(id, ord);
        }
      }
    });

    const list = Array.from(uniqueMap.values());
    const activeTenantId = currentTenant?.id || user?.tenantId;

    return list.filter((ord) => {
      if (!activeTenantId) return true;
      const tId =
        ord.tenantId ||
        ord.companyId ||
        ord.tenantName ||
        ord.storeName ||
        ord.tenant ||
        ord.items?.[0]?.tenantId ||
        ord.rawItems?.[0]?.tenantId ||
        ord.orderItems?.[0]?.tenantId;

      const rawItemList = Array.isArray(ord.rawItems)
        ? ord.rawItems
        : Array.isArray(ord.orderItems)
        ? ord.orderItems
        : Array.isArray(ord.items)
        ? ord.items
        : [];

      const hasCaseValue = rawItemList.some((it) => {
        const n = String(it?.name || it?.productName || '').toLowerCase();
        const b = String(it?.brand || '').toLowerCase();
        return n.includes('chase value') || n.includes('case value') || b.includes('chase value') || b.includes('case value') || isSameTenant(it?.tenantId, 'tenant-chasevalue');
      });
      if (hasCaseValue && isSameTenant(activeTenantId, 'tenant-chasevalue')) return true;
      if (hasCaseValue && !isSameTenant(activeTenantId, 'tenant-chasevalue')) return false;

      const hasChaseUp = rawItemList.some((it) => {
        const n = String(it?.name || it?.productName || '').toLowerCase();
        const b = String(it?.brand || '').toLowerCase();
        return n.includes('chase up') || n.includes('case up') || n.includes('caseup') || b.includes('chase up') || b.includes('case up') || b.includes('caseup') || isSameTenant(it?.tenantId, 'tenant-chaseup');
      });
      if (hasChaseUp && isSameTenant(activeTenantId, 'tenant-chaseup')) return true;
      if (hasChaseUp && !isSameTenant(activeTenantId, 'tenant-chaseup')) return false;

      if (!tId) {
        const idLower = String(ord.id || ord.orderId || '').toLowerCase();
        if (idLower.includes('701') || idLower.includes('af')) return isSameTenant('tenant-alfatah', activeTenantId);
        if (idLower.includes('fm') || idLower.includes('83459')) return isSameTenant('tenant-freshmart', activeTenantId);
        if (idLower.includes('cv')) return isSameTenant('tenant-chasevalue', activeTenantId);
        if (idLower.includes('cu') || idLower.includes('caseup')) return isSameTenant('tenant-chaseup', activeTenantId);
        return false;
      }
      return isSameTenant(tId, activeTenantId);
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [customerOrders, adminOrders, user?.tenantId, currentTenant?.id]);

  // Tab counts
  const counts = useMemo(() => {
    const isPending = (o) => ['Pending', 'pending', 'Pending_Kitchen', 'pending_kitchen', 'Order Placed', 'Received by Pickup Staff', 'Deliver to Staff', 'Delivered to Staff'].includes(o.status) || (!o.status);
    const isPreparing = (o) => ['Preparing', 'preparing', 'Processing', 'Picking', 'Packed'].includes(o.status);
    const isReady = (o) => ['Prepared', 'prepared', 'Ready', 'ready', 'Ready for Dispatch', 'ready(dispatched)'].includes(o.status) || o.isDispatchedByStaff;
    const isDispatched = (o) => ['Dispatched', 'dispatched', 'Out for Delivery', 'Delivered'].includes(o.status) || o.isDispatched;

    return {
      all: allOrders.length,
      pending: allOrders.filter(isPending).length,
      preparing: allOrders.filter(isPreparing).length,
      ready: allOrders.filter(isReady).length,
      dispatched: allOrders.filter(isDispatched).length
    };
  }, [allOrders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return allOrders.filter((ord) => {
      const statusLower = (ord.status || 'pending').toLowerCase();

      if (activeTab === 'Pending' && !['pending', 'pending_kitchen', 'order placed', 'received by pickup staff', 'deliver to staff', 'delivered to staff'].includes(statusLower)) {
        return false;
      }
      if (activeTab === 'Preparing' && !['preparing', 'processing', 'picking', 'packed'].includes(statusLower)) {
        return false;
      }
      if ((activeTab === 'Ready' || activeTab === 'Prepared') && !['prepared', 'ready', 'ready for dispatch', 'ready(dispatched)'].includes(statusLower) && !ord.isDispatchedByStaff) {
        return false;
      }
      if (activeTab === 'Dispatched' && !['dispatched', 'out for delivery', 'delivered'].includes(statusLower) && !ord.isDispatched) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesId = (ord.id || ord.orderId || '').toLowerCase().includes(q);
        const matchesName = (ord.customerName || ord.customer || '').toLowerCase().includes(q);
        const matchesPhone = (ord.customerPhone || ord.phone || '').includes(q);
        return matchesId || matchesName || matchesPhone;
      }

      return true;
    });
  }, [allOrders, activeTab, search]);

  const toggleExpanded = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const toggleItemPick = (orderId, idx) => {
    setPickedState((prev) => {
      const current = prev[orderId] || [];
      const updated = current.includes(idx) ? current.filter((i) => i !== idx) : [...current, idx];
      return { ...prev, [orderId]: updated };
    });
  };

  const handlePickAll = (orderId, totalCount) => {
    setPickedState((prev) => {
      const current = prev[orderId] || [];
      const isAll = current.length === totalCount;
      return {
        ...prev,
        [orderId]: isAll ? [] : Array.from({ length: totalCount }, (_, i) => i)
      };
    });
  };

  const copyOrderId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Dynamically compute ranked smart substitutes for the selected unavailable item
  const modalSubstitutes = useMemo(() => {
    if (!substitutionModal?.item) return [];
    return typeof getProductSubstitutes === 'function'
      ? getProductSubstitutes(substitutionModal.item, {
          tenantId: substitutionModal.order?.tenantId || currentTenant?.id,
          limit: 5
        })
      : [];
  }, [substitutionModal, getProductSubstitutes, currentTenant]);

  const handleOpenSubstitution = (e, order, item, idx) => {
    e.stopPropagation();
    setSubstitutionModal({ order, item, idx });
    setSelectedAlternative(null);
    setSubstitutionReason('Item Out of Stock - Customer approved substitution');
  };

  const handleConfirmSubstitution = async () => {
    if (!substitutionModal || !selectedAlternative) return;
    const orderId = substitutionModal.order.id || substitutionModal.order.orderId;
    await substituteOrderItem(orderId, substitutionModal.idx, selectedAlternative, substitutionReason);
    setSubstitutionModal(null);
    setSelectedAlternative(null);
  };

  // Stage Transitions
  const handleStartPreparing = async (order) => {
    await updateOrderFulfillment(order.id, {
      fulfillmentStage: 3,
      status: 'Preparing',
      pickupStep: 'picking',
      preparingStartedAt: new Date().toISOString(),
      pickingStartedAt: new Date().toISOString(),
      prepEstimatedMinutes: 10,
      isDispatchedByStaff: false
    });
    addToast('Order Preparing 🔥', `Started packing Order #${order.id}. Delivery rider can now see estimated packing time.`);
  };

  const handlePackItems = async (order, itemsCount) => {
    setPickedState((prev) => ({
      ...prev,
      [order.id]: Array.from({ length: itemsCount }, (_, i) => i)
    }));

    const parcelCode = order.parcelCode || `PRCL-${String(order.id).replace(/\W/g, '').slice(-6).toUpperCase()}`;
    await updateOrderFulfillment(order.id, {
      fulfillmentStage: 3,
      status: 'Packed',
      pickupStep: 'packed',
      pickedItems: Array.from({ length: itemsCount }, (_, i) => i),
      parcelCode,
      sealedAt: new Date().toISOString(),
      packedAt: new Date().toISOString(),
      prepEstimatedMinutes: 2,
      isDispatchedByStaff: false
    });
    addToast('Parcel Packed 📦', `Items verified and sealed in parcel ${parcelCode}`);
  };

  const handleMarkReadyForDispatch = async (order, itemsCount = 0) => {
    const totalItems = itemsCount || (Array.isArray(order.items) ? order.items.length : 1);
    setPickedState((prev) => ({
      ...prev,
      [order.id]: Array.from({ length: totalItems }, (_, i) => i)
    }));

    const parcelCode = order.parcelCode || `PRCL-${String(order.id).replace(/\W/g, '').slice(-6).toUpperCase()}`;
    await updateOrderFulfillment(order.id, {
      fulfillmentStage: 4,
      status: 'Prepared',
      pickupStep: 'verified',
      pickedItems: Array.from({ length: totalItems }, (_, i) => i),
      parcelCode,
      isDispatched: false,
      isDispatchedByStaff: true,
      parcelVerifiedAt: new Date().toISOString(),
      readyForDispatchAt: new Date().toISOString(),
      preparedAt: new Date().toISOString(),
      dispatchedAt: new Date().toISOString()
    });
    addToast('Parcel Prepared & Staged ✅', `Order #${order.id} is staged! Admin can now assign a delivery rider.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. TOP EXECUTIVE FULFILLMENT HEADER */}
      <header className="bg-slate-900 text-white px-5 py-3.5 sm:px-8 flex items-center justify-between border-b border-slate-800 shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner font-bold text-lg">
            <PackageCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-extrabold bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {currentTenant?.name || user?.tenantName || 'Supermarket'} &bull; Packing Desk
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Station Active</span>
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
              <span>{currentTenant?.logo || '🏬'}</span>
              <span>{currentTenant?.name || user?.tenantName || 'Store'} Order Fulfillment Hub</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Desk Operator:</span>
            <span className="font-mono font-bold text-white">@{user?.username || 'staff_desk'}</span>
          </div>

          <button
            onClick={adminLogout}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Sign out of staff session"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN FULFILLMENT WORKSPACE */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 flex-1 w-full">
        {/* TOP KPI CARDS BANNER */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Queue Total</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{counts.all}</span>
              <span className="text-[11px] text-slate-400">All active orders</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Boxes size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-700 block uppercase tracking-wider">Awaiting Pick</span>
              <span className="text-2xl font-black text-amber-900 mt-1 block font-mono">{counts.pending}</span>
              <span className="text-[11px] text-amber-600">Ready to start</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Clock size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-blue-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-700 block uppercase tracking-wider">Packing Now</span>
              <span className="text-2xl font-black text-blue-900 mt-1 block font-mono">{counts.preparing}</span>
              <span className="text-[11px] text-blue-600">Being picked &amp; sealed</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <Flame size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 block uppercase tracking-wider">Staged &amp; Ready</span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block font-mono">{counts.ready}</span>
              <span className="text-[11px] text-emerald-600">Awaiting courier pickup</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        {/* CONTROLS & FILTER TOOLBAR */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Stage Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {[
                { id: 'All', label: 'All Orders', count: counts.all },
                { id: 'Pending', label: 'To Pick', count: counts.pending },
                { id: 'Preparing', label: 'Packing', count: counts.preparing },
                { id: 'Ready', label: 'Staged & Ready', count: counts.ready },
                { id: 'Dispatched', label: 'Dispatched', count: counts.dispatched }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === tab.id ? 'bg-black/20 text-white' : 'bg-white text-slate-700'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Right: View Toggle + Search + Test Button */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* View mode toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-slate-600">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Fulfillment Cards View"
                >
                  <LayoutGrid size={14} />
                  <span className="hidden md:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Fulfillment Table View"
                >
                  <List size={14} />
                  <span className="hidden md:inline">Manifest</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-56">
                <input
                  type="text"
                  placeholder="Search ID, customer, item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. ORDER QUEUE WORKSPACE */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-500 space-y-3 shadow-2xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
              <PackageCheck size={28} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No Orders in Packing Queue</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              New customer orders placed for this store branch will appear here in real-time for item picking, packing, and courier staging.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* MODERN FULFILLMENT CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredOrders.map((order) => {
              const orderId = order.id || order.orderId;
              const cleanId = String(orderId).replace(/^#/, '');
              const customerName = order.customerName || order.customer || 'Customer';
              const customerPhone = order.customerPhone || order.phone || '+92 300 0000000';
              const orderType = order.orderType || (order.table ? 'DINE-IN' : 'EXPRESS DELIVERY');
              const items = Array.isArray(order.rawItems) && order.rawItems.length > 0
                ? order.rawItems
                : Array.isArray(order.items) && order.items.length > 0
                ? order.items
                : Array.isArray(order.orderItems) && order.orderItems.length > 0
                ? order.orderItems
                : [{ name: 'Order Item', quantity: 1, price: order.total || 810 }];

              const currentPicked = pickedState[orderId] || order.pickedItems || [];
              const isAllPicked = items.length > 0 && currentPicked.length === items.length;
              const isExpanded = Boolean(expandedOrders[orderId]);
              const statusRaw = (order.status || 'Pending').toLowerCase();
              const isReady = ['prepared', 'ready', 'ready for dispatch', 'ready(dispatched)'].includes(statusRaw) || Boolean(order.isDispatchedByStaff);
              const isPreparing = ['preparing', 'processing', 'picking', 'packed'].includes(statusRaw);
              const isPending = ['pending', 'pending_kitchen', 'order placed', 'received by pickup staff', 'deliver to staff', 'delivered to staff'].includes(statusRaw) || !order.status;
              const isDispatched = ['dispatched', 'out for delivery', 'delivered'].includes(statusRaw) || Boolean(order.isDispatched);

              const pickPercent = items.length > 0 ? Math.round((currentPicked.length / items.length) * 100) : 100;

              return (
                <div
                  key={orderId}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
                >
                  {/* CARD ACCENT TOP BANNER */}
                  <div className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
                    isReady
                      ? 'bg-emerald-50/90 border-emerald-100 text-emerald-800'
                      : isPreparing
                      ? 'bg-blue-50/90 border-blue-100 text-blue-800'
                      : isDispatched
                      ? 'bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-amber-50/90 border-amber-100 text-amber-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        isReady ? 'bg-emerald-500 ring-2 ring-emerald-300' : isPreparing ? 'bg-blue-500 animate-pulse' : isDispatched ? 'bg-slate-400' : 'bg-amber-500'
                      }`} />
                      <span className="uppercase tracking-wider text-[11px] font-extrabold">
                        {isReady
                          ? 'Ready for Courier Pickup'
                          : isPreparing
                          ? (statusRaw === 'packed' ? 'Parcel Packed & Sealed' : 'Packing in Progress')
                          : isDispatched
                          ? 'Dispatched with Courier'
                          : 'Awaiting Fulfillment'}
                      </span>
                    </div>

                    <ElapsedTimer createdAt={order.createdAt} />
                  </div>

                  {/* CARD BODY */}
                  <div className="p-5 flex-1 flex flex-col space-y-4">
                    {/* ORDER ID & CUSTOMER BANNER */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyOrderId(cleanId)}
                            className="font-mono font-black text-slate-900 text-xl tracking-tight hover:text-emerald-700 transition flex items-center gap-1 group/btn"
                            title="Click to copy Order ID"
                          >
                            <span>#{cleanId}</span>
                            <Copy size={13} className="text-slate-400 group-hover/btn:text-emerald-600 transition" />
                          </button>
                          {copiedId === cleanId && (
                            <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-medium animate-in fade-in">
                              Copied!
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-slate-800">{customerName}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200/60">
                            {orderType}
                          </span>
                        </div>

                        <a
                          href={`tel:${customerPhone}`}
                          className="text-xs text-slate-400 hover:text-slate-700 font-mono mt-0.5 inline-flex items-center gap-1 transition"
                        >
                          <Phone size={11} />
                          <span>{customerPhone}</span>
                        </a>
                      </div>

                      {order.pickupStaffName && (
                        <div className="text-right shrink-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Desk</span>
                          <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 block mt-0.5">
                            {order.pickupStaffName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* LIVE PICKING PROGRESS BAR */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <span>Items Picked:</span>
                          <span className="font-mono text-slate-900">
                            {currentPicked.length} / {items.length}
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-mono font-black ${isAllPicked ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {pickPercent}%
                          </span>
                          {!isReady && !isDispatched && items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handlePickAll(orderId, items.length)}
                              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                            >
                              {isAllPicked ? 'Uncheck All' : 'Check All'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-slate-200/90 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isAllPicked ? 'bg-emerald-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${pickPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* INTERACTIVE ITEM CHECKLIST */}
                    <div className="space-y-2 flex-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">
                        Picking Checklist ({items.length} Line Items)
                      </span>

                      <div className="space-y-1.5">
                        {items.map((item, idx) => {
                          const isPicked = currentPicked.includes(idx);
                          const qty = item.quantity || item.qty || 1;
                          const name = item.name || item.productName || item.title || 'Item';
                          const icon = getItemIcon(name);

                          return (
                            <div
                              key={idx}
                              onClick={() => toggleItemPick(orderId, idx)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                                isPicked
                                  ? 'bg-emerald-50/50 border-emerald-200/80 text-slate-500'
                                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-900'
                              }`}
                            >
                              {/* Left: Icon, Qty Pill, Item Name */}
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className="text-base shrink-0 p-1 bg-slate-100 rounded-lg">{icon}</span>
                                <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md shrink-0 ${
                                  isPicked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-900 text-white'
                                }`}>
                                  {qty}x
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs font-bold truncate leading-tight ${isPicked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                    {name}
                                  </p>
                                  {item.isSubstituted && item.originalProduct && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5">
                                      <span>🔄 Substituted</span>
                                      <span className="text-slate-500">(Orig: {item.originalProduct.name})</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right: Substitute Button & Modern Round Checkbox */}
                              <div className="flex items-center gap-2 shrink-0">
                                {!isPicked && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenSubstitution(e, order, item, idx)}
                                    className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                    title="Out of stock? Replace with smart in-store substitute"
                                  >
                                    <span>🔄 Sub</span>
                                  </button>
                                )}

                                <div
                                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    isPicked
                                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs scale-105'
                                      : 'border-slate-300 bg-white hover:border-emerald-500'
                                  }`}
                                >
                                  {isPicked && <Check size={14} className="stroke-[3]" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* EXPANDABLE DETAILS DRAWER */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(orderId)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer tracking-wider uppercase"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={13} />
                            <span>Hide Delivery Details</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={13} />
                            <span>Delivery Details &amp; Notes</span>
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs animate-in fade-in duration-150">
                          <div className="grid grid-cols-2 gap-2 text-slate-600">
                            <div className="col-span-2">
                              <span className="font-bold text-slate-400 block text-[10px] uppercase">Destination Address</span>
                              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                                <MapPin size={12} className="text-emerald-600 shrink-0" />
                                <span>{order.address || order.shippingAddress?.address || 'Cafe Dine-In Hub'} &bull; {order.city || 'Faisalabad'}</span>
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 block text-[10px] uppercase">Payment</span>
                              <span className="font-semibold text-slate-800">
                                {order.paymentMethod || order.payment || 'Cash on Delivery'}
                              </span>
                            </div>
                            {order.parcelCode && (
                              <div>
                                <span className="font-bold text-slate-400 block text-[10px] uppercase">Parcel Tracking Code</span>
                                <span className="font-mono font-bold text-emerald-800">{order.parcelCode}</span>
                              </div>
                            )}
                            {order.notes && (
                              <div className="col-span-2">
                                <span className="font-bold text-slate-400 block text-[10px] uppercase">Customer Notes</span>
                                <span className="text-slate-700 italic">"{order.notes}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CARD ACTION FOOTER */}
                  <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Order Value</span>
                      <span className="font-mono font-black text-slate-900 text-base sm:text-lg">
                        {order.currency === 'USD' || String(order.id).startsWith('EB-') ? (
                          <span>${Number(order.total || order.totalAmount || 810).toLocaleString()}</span>
                        ) : (
                          <span>Rs. {Number(order.total || order.totalAmount || 810).toLocaleString()}</span>
                        )}
                      </span>
                    </div>

                    {/* Stage transition actions */}
                    <div>
                      {!isReady && !isDispatched ? (
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleStartPreparing(order)}
                              className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                            >
                              <Flame size={14} />
                              <span>Start Packing</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleMarkReadyForDispatch(order, items.length)}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                            title="Mark parcel prepared and notify admin to assign rider"
                          >
                            <CheckCircle2 size={15} />
                            <span>Mark Prepared ✅</span>
                          </button>
                        </div>
                      ) : isReady ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Staged &bull; Ready for Rider</span>
                        </div>
                      ) : isDispatched ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200/80 text-slate-800 border border-slate-300">
                          <Truck size={14} className="text-emerald-600" />
                          <span>{order.assignedRider?.name ? `Courier: ${order.assignedRider.name}` : 'Dispatched'}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* HIGH-EFFICIENCY MANIFEST TABLE VIEW */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3.5 px-4">Order &amp; Time</th>
                    <th className="py-3.5 px-4">Customer &amp; Area</th>
                    <th className="py-3.5 px-4">Items Picking Checklist</th>
                    <th className="py-3.5 px-4">Progress</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredOrders.map((order) => {
                    const orderId = order.id || order.orderId;
                    const cleanId = String(orderId).replace(/^#/, '');
                    const customerName = order.customerName || order.customer || 'Customer';
                    const customerPhone = order.customerPhone || order.phone || '+92 300 0000000';
                    const items = Array.isArray(order.rawItems) && order.rawItems.length > 0
                      ? order.rawItems
                      : Array.isArray(order.items) && order.items.length > 0
                      ? order.items
                      : Array.isArray(order.orderItems) && order.orderItems.length > 0
                      ? order.orderItems
                      : [{ name: 'Order Item', quantity: 1, price: order.total || 810 }];

                    const currentPicked = pickedState[orderId] || order.pickedItems || [];
                    const isAllPicked = items.length > 0 && currentPicked.length === items.length;
                    const statusRaw = (order.status || 'Pending').toLowerCase();
                    const isReady = ['prepared', 'ready', 'ready for dispatch', 'ready(dispatched)'].includes(statusRaw) || Boolean(order.isDispatchedByStaff);
                    const isPreparing = ['preparing', 'processing', 'picking', 'packed'].includes(statusRaw);
                    const isPending = ['pending', 'pending_kitchen', 'order placed', 'received by pickup staff', 'deliver to staff', 'delivered to staff'].includes(statusRaw) || !order.status;
                    const isDispatched = ['dispatched', 'out for delivery', 'delivered'].includes(statusRaw) || Boolean(order.isDispatched);

                    return (
                      <tr key={orderId} className="hover:bg-slate-50/60 transition">
                        {/* Order & Time */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 block text-sm">#{cleanId}</span>
                          <div className="mt-1">
                            <ElapsedTimer createdAt={order.createdAt} />
                          </div>
                        </td>

                        {/* Customer & Area */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{customerName}</span>
                          <span className="text-[11px] text-slate-400 font-mono block">{customerPhone}</span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[180px] block mt-0.5">
                            {order.address || order.city || 'Express Delivery'}
                          </span>
                        </td>

                        {/* Items Checklist */}
                        <td className="py-3 px-4 max-w-sm">
                          <div className="space-y-1">
                            {items.map((item, idx) => {
                              const isPicked = currentPicked.includes(idx);
                              const qty = item.quantity || item.qty || 1;
                              const name = item.name || item.productName || item.title || 'Item';

                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleItemPick(orderId, idx)}
                                  className="flex items-center gap-2 cursor-pointer group select-none"
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                                    isPicked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 group-hover:border-emerald-500'
                                  }`}>
                                    {isPicked && <Check size={10} className="stroke-[3]" />}
                                  </div>
                                  <span className={`text-xs truncate ${isPicked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    <span className="font-mono font-bold text-emerald-700">{qty}x</span> {name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Progress */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-slate-800 block">
                            {currentPicked.length}/{items.length} items
                          </span>
                          <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${items.length > 0 ? (currentPicked.length / items.length) * 100 : 100}%` }}
                            />
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isReady
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isPreparing
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : isDispatched
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isReady ? 'bg-emerald-500' : isPreparing ? 'bg-blue-500 animate-pulse' : isDispatched ? 'bg-slate-400' : 'bg-amber-500'
                            }`} />
                            <span>
                              {isReady ? 'Ready' : isPreparing ? 'Packing' : isDispatched ? 'Dispatched' : 'Pending'}
                            </span>
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {!isReady && !isDispatched ? (
                            <button
                              type="button"
                              onClick={() => handleMarkReadyForDispatch(order, items.length)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                            >
                              Mark Ready ✅
                            </button>
                          ) : isReady ? (
                            <span className="text-emerald-700 font-bold text-xs">Staged for Courier</span>
                          ) : (
                            <span className="text-slate-400 text-xs">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 4. 🔄 SMART PRODUCT SUBSTITUTION MODAL FOR PICKUP STAFF */}
      {substitutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-xs">
                  🔄
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Smart Product Substitution
                  </h3>
                  <p className="text-xs text-slate-500">
                    Order #{String(substitutionModal.order.id || substitutionModal.order.orderId).replace(/^#/, '')} &bull; Item Unavailable in Store
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubstitutionModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Currently Ordered Item (Out of Stock) */}
            <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                  Unavailable Ordered Item
                </span>
                <h4 className="font-bold text-slate-900 text-sm truncate mt-0.5">
                  {substitutionModal.item.name || substitutionModal.item.productName}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 font-mono">
                  Qty: {substitutionModal.item.quantity || 1} &bull; Unit Price: Rs. {substitutionModal.item.price}
                </p>
              </div>
              <span className="px-2.5 py-1 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 shadow-2xs">
                Out of Stock
              </span>
            </div>

            {/* Suggested Smart Alternatives List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Recommended Alternatives ({modalSubstitutes.length}):
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">
                  Matched by category, type &amp; size
                </span>
              </div>

              {modalSubstitutes.length > 0 ? (
                modalSubstitutes.map((cand) => {
                  const isSelected = selectedAlternative?.id === cand.id;
                  const priceDiff = (cand.price || 0) - (substitutionModal.item.price || 0);

                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedAlternative(cand)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={cand.image}
                          alt={cand.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            {cand.brand}
                          </span>
                          <h5 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {cand.name}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono font-extrabold text-xs text-emerald-800">
                              Rs. {cand.price}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              {priceDiff === 0 ? 'Same Price' : priceDiff > 0 ? `+Rs. ${priceDiff}` : `-Rs. ${Math.abs(priceDiff)}`}
                            </span>
                            {cand.matchDetails?.sizeMatchLabel && (
                              <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                                {cand.matchDetails.sizeMatchLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-semibold block text-right">
                          Stock: {cand.stockCount || cand.stock || 25}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} className="stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No direct in-stock alternatives found in the store for this item.
                </div>
              )}
            </div>

            {/* Substitution Reason & Confirm Footer */}
            <div className="pt-3 border-t border-slate-100 space-y-3 shrink-0">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Customer Confirmation / Reason:
                </label>
                <input
                  type="text"
                  value={substitutionReason}
                  onChange={(e) => setSubstitutionReason(e.target.value)}
                  placeholder="e.g. Customer approved substitution via phone call"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSubstitutionModal(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedAlternative}
                  onClick={handleConfirmSubstitution}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                    selectedAlternative
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check size={15} />
                  <span>Confirm Substitution</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
