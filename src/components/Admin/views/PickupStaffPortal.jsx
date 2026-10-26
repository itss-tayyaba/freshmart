import React, { useState, useMemo } from 'react';
import {
  Boxes,
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
  ArrowRight,
  Filter,
  LayoutGrid,
  List,
  CheckCheck,
  AlertCircle,
  Truck,
  Copy,
  ShoppingBag
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { resolveTenantId, isSameTenant } from '../../../data/companyHierarchyData';
import { isOrderAssignedToPickupStaff } from '../../../utils/pickupStaffAssignment';

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

export const PickupStaffPortal = ({ onBackToAdmin }) => {
  const {
    user,
    customerOrders = [],
    adminOrders = [],
    currentTenant,
    updateOrderFulfillment,
    adminLogout,
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
    }).filter((ord) => isOrderAssignedToPickupStaff(ord, user)).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [customerOrders, adminOrders, user, currentTenant?.id]);

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
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. COMPACT, SHARP TOP HEADER (NO TIME) */}
      <header className="bg-slate-900 text-white px-4 py-2.5 sm:px-6 flex items-center justify-between border-b border-slate-800 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold bg-emerald-950/90 px-1.5 py-0.2 rounded border border-emerald-500/30">
                {currentTenant?.name || user?.tenantName || 'Supermarket'} &bull; Packing Station
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Active</span>
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white leading-tight flex items-center gap-1.5">
              <span>{currentTenant?.logo || '🏬'}</span>
              <span>{currentTenant?.name || user?.tenantName || 'Store'} Fulfillment Hub</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 text-[11px]">Staff:</span>
            <span className="font-mono font-bold text-white text-[11px]">@{user?.username || 'staff_desk'}</span>
          </div>

          <button
            onClick={adminLogout}
            className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            title="Sign out"
          >
            <LogOut size={13} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN FULFILLMENT WORKSPACE */}
      <main className="max-w-7xl mx-auto p-3.5 sm:p-5 space-y-3.5 flex-1 w-full">
        {/* SHARP KPI SUMMARY ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Queue Total</span>
              <span className="text-xl font-bold text-slate-900 mt-0.5 block font-mono">{counts.all}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Boxes size={16} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-amber-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-700 block uppercase tracking-wider">To Pick</span>
              <span className="text-xl font-bold text-amber-900 mt-0.5 block font-mono">{counts.pending}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Package size={16} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-blue-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-700 block uppercase tracking-wider">Packing Now</span>
              <span className="text-xl font-bold text-blue-900 mt-0.5 block font-mono">{counts.preparing}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <Flame size={16} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 block uppercase tracking-wider">Ready for Rider</span>
              <span className="text-xl font-bold text-emerald-900 mt-0.5 block font-mono">{counts.ready}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={16} />
            </div>
          </div>
        </div>

        {/* SHARP FILTER & VIEW CONTROLS */}
        <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-2xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Left: Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
              {[
                { id: 'All', label: 'All', count: counts.all },
                { id: 'Pending', label: 'To Pick', count: counts.pending },
                { id: 'Preparing', label: 'Packing', count: counts.preparing },
                { id: 'Ready', label: 'Ready', count: counts.ready },
                { id: 'Dispatched', label: 'Dispatched', count: counts.dispatched }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white text-slate-700'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Right: View Toggle + Search */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-slate-600">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Cards View"
                >
                  <LayoutGrid size={13} />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Manifest Table View"
                >
                  <List size={13} />
                  <span>Table</span>
                </button>
              </div>

              <div className="relative flex-1 sm:w-52">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2.5 py-1 text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-700"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. ORDER QUEUE WORKSPACE */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 space-y-2 shadow-2xs">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
              <PackageCheck size={24} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">No Orders in Packing Queue</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Parcels appear here only after the store admin assigns them to you. Unassigned orders stay on the admin Pickup Staff page.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* SMALL, SHARP FULFILLMENT CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col overflow-hidden"
                >
                  {/* COMPACT CARD TOP STRIP (NO TIME) */}
                  <div className={`px-3 py-1.5 text-[11px] font-bold flex items-center justify-between border-b ${
                    isReady
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                      : isPreparing
                      ? 'bg-blue-50 border-blue-100 text-blue-800'
                      : isDispatched
                      ? 'bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-amber-50 border-amber-100 text-amber-800'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        isReady ? 'bg-emerald-500' : isPreparing ? 'bg-blue-500 animate-pulse' : isDispatched ? 'bg-slate-400' : 'bg-amber-500'
                      }`} />
                      <span className="uppercase tracking-wider font-extrabold text-[10px]">
                        {isReady
                          ? 'Ready for Courier'
                          : isPreparing
                          ? (statusRaw === 'packed' ? 'Packed' : 'Packing in Progress')
                          : isDispatched
                          ? 'Dispatched'
                          : 'Awaiting Fulfillment'}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {items.length} items
                    </span>
                  </div>

                  {/* CARD BODY */}
                  <div className="p-3 flex-1 flex flex-col space-y-2.5">
                    {/* ORDER ID & CUSTOMER BANNER */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyOrderId(cleanId)}
                            className="font-mono font-bold text-slate-900 text-sm tracking-tight hover:text-emerald-700 transition flex items-center gap-1 group/btn"
                            title="Click to copy Order ID"
                          >
                            <span>#{cleanId}</span>
                            <Copy size={11} className="text-slate-400 group-hover/btn:text-emerald-600 transition" />
                          </button>
                          {copiedId === cleanId && (
                            <span className="text-[9px] bg-slate-900 text-white px-1 py-0.2 rounded font-medium animate-in fade-in">
                              Copied!
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{customerName}</span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {orderType}
                          </span>
                        </div>

                        <a
                          href={`tel:${customerPhone}`}
                          className="text-[11px] text-slate-400 hover:text-slate-700 font-mono mt-0.5 inline-flex items-center gap-1 transition"
                        >
                          <Phone size={10} />
                          <span>{customerPhone}</span>
                        </a>
                      </div>

                      {order.pickupStaffName && (
                        <div className="text-right shrink-0">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Desk</span>
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 block mt-0.5">
                            {order.pickupStaffName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* SHARP PICKING PROGRESS METER */}
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600 text-[11px]">
                          Picked: <b className="font-mono text-slate-900">{currentPicked.length}/{items.length}</b> ({pickPercent}%)
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

                      <div className="w-full bg-slate-200 h-1.5 rounded-sm overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 rounded-sm ${
                            isAllPicked ? 'bg-emerald-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${pickPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* INTERACTIVE ITEM CHECKLIST (COMPACT & SHARP) */}
                    <div className="space-y-1 flex-1">
                      {items.map((item, idx) => {
                        const isPicked = currentPicked.includes(idx);
                        const qty = item.quantity || item.qty || 1;
                        const name = item.name || item.productName || item.title || 'Item';
                        const icon = getItemIcon(name);

                        return (
                          <div
                            key={idx}
                            onClick={() => toggleItemPick(orderId, idx)}
                            className={`p-1.5 px-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 select-none ${
                              isPicked
                                ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-400'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-800'
                            }`}
                          >
                            {/* Left: Icon, Qty Pill, Item Name */}
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span className="text-sm shrink-0">{icon}</span>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                isPicked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-900 text-white'
                              }`}>
                                {qty}x
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-semibold truncate leading-tight ${isPicked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                  {name}
                                </p>
                                {item.isSubstituted && item.originalProduct && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded mt-0.5">
                                    <span>Substituted: {item.name}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right: Substitute Button & Sharp Square Checkbox */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isPicked && (
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenSubstitution(e, order, item, idx)}
                                  className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold transition cursor-pointer"
                                  title="Replace out of stock item"
                                >
                                  Sub
                                </button>
                              )}

                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                  isPicked
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white hover:border-emerald-500'
                                }`}
                              >
                                {isPicked && <Check size={11} className="stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* EXPANDABLE DETAILS */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(orderId)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer tracking-wider uppercase"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={12} />
                            <span>Hide Details</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} />
                            <span>Details &amp; Address</span>
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs animate-in fade-in duration-100">
                          <div className="text-[11px] text-slate-600 space-y-0.5">
                            <div>
                              <span className="font-bold text-slate-400 text-[10px] uppercase">Destination: </span>
                              <span className="font-medium text-slate-800">
                                {order.address || order.shippingAddress?.address || 'Cafe Dine-In Hub'} &bull; {order.city || 'Faisalabad'}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 text-[10px] uppercase">Payment: </span>
                              <span className="font-medium text-slate-800">
                                {order.paymentMethod || order.payment || 'Cash on Delivery'}
                              </span>
                            </div>
                            {order.parcelCode && (
                              <div>
                                <span className="font-bold text-slate-400 text-[10px] uppercase">Parcel Code: </span>
                                <span className="font-mono font-bold text-emerald-800">{order.parcelCode}</span>
                              </div>
                            )}
                            {order.notes && (
                              <div>
                                <span className="font-bold text-slate-400 text-[10px] uppercase">Notes: </span>
                                <span className="italic text-slate-700">"{order.notes}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COMPACT CARD FOOTER */}
                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm">
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
                        <div className="flex items-center gap-1.5">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleStartPreparing(order)}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            >
                              <Flame size={12} />
                              <span>Start</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleMarkReadyForDispatch(order, items.length)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title="Mark parcel prepared and notify admin to assign rider"
                          >
                            <CheckCircle2 size={13} />
                            <span>Mark Prepared ✅</span>
                          </button>
                        </div>
                      ) : isReady ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Ready for Rider</span>
                        </div>
                      ) : isDispatched ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200/80 text-slate-800 border border-slate-300">
                          <Truck size={12} className="text-emerald-600" />
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
          /* HIGH-EFFICIENCY MANIFEST TABLE VIEW (SHARP & NO TIME) */
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Customer &amp; Area</th>
                    <th className="py-2.5 px-3">Items Checklist</th>
                    <th className="py-2.5 px-3">Progress</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
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
                        {/* Order ID */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 block text-xs">#{cleanId}</span>
                        </td>

                        {/* Customer & Area */}
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block text-xs">{customerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{customerPhone}</span>
                        </td>

                        {/* Items Checklist */}
                        <td className="py-2.5 px-3 max-w-sm">
                          <div className="space-y-0.5">
                            {items.map((item, idx) => {
                              const isPicked = currentPicked.includes(idx);
                              const qty = item.quantity || item.qty || 1;
                              const name = item.name || item.productName || item.title || 'Item';

                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleItemPick(orderId, idx)}
                                  className="flex items-center gap-1.5 cursor-pointer select-none"
                                >
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition ${
                                    isPicked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                                  }`}>
                                    {isPicked && <Check size={9} className="stroke-[3]" />}
                                  </div>
                                  <span className={`text-[11px] truncate ${isPicked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    <span className="font-mono font-bold text-emerald-700">{qty}x</span> {name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Progress */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono text-[11px] font-bold text-slate-800 block">
                            {currentPicked.length}/{items.length}
                          </span>
                          <div className="w-16 bg-slate-200 h-1 rounded-sm overflow-hidden mt-0.5">
                            <div
                              className="bg-emerald-500 h-full rounded-sm transition-all"
                              style={{ width: `${items.length > 0 ? (currentPicked.length / items.length) * 100 : 100}%` }}
                            />
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
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
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {!isReady && !isDispatched ? (
                            <button
                              type="button"
                              onClick={() => handleMarkReadyForDispatch(order, items.length)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition cursor-pointer"
                            >
                              Mark Ready ✅
                            </button>
                          ) : isReady ? (
                            <span className="text-emerald-700 font-bold text-[10px]">Staged</span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Done</span>
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

      {/* 4. SMART PRODUCT SUBSTITUTION MODAL */}
      {substitutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 shadow-xl border border-slate-200 space-y-3 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                  🔄
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Product Substitution
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Order #{String(substitutionModal.order.id || substitutionModal.order.orderId).replace(/^#/, '')} &bull; Item Unavailable
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubstitutionModal(null)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Currently Ordered Item */}
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 block">
                  Unavailable Item
                </span>
                <h4 className="font-bold text-slate-900 text-xs truncate">
                  {substitutionModal.item.name || substitutionModal.item.productName}
                </h4>
                <p className="text-[11px] text-slate-600 font-mono">
                  Qty: {substitutionModal.item.quantity || 1} &bull; Rs. {substitutionModal.item.price}
                </p>
              </div>
              <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[9px] font-bold uppercase shrink-0">
                Out of Stock
              </span>
            </div>

            {/* Suggested Smart Alternatives List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                In-Stock Alternatives ({modalSubstitutes.length}):
              </span>

              {modalSubstitutes.length > 0 ? (
                modalSubstitutes.map((cand) => {
                  const isSelected = selectedAlternative?.id === cand.id;
                  const priceDiff = (cand.price || 0) - (substitutionModal.item.price || 0);

                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedAlternative(cand)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={cand.image}
                          alt={cand.name}
                          className="w-10 h-10 rounded-md object-cover bg-slate-50 border border-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-900 text-xs truncate">
                            {cand.name}
                          </h5>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono font-bold text-xs text-emerald-800">
                              Rs. {cand.price}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({priceDiff === 0 ? 'Same Price' : priceDiff > 0 ? `+Rs. ${priceDiff}` : `-Rs. ${Math.abs(priceDiff)}`})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check size={10} className="stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No direct alternatives found for this item.
                </div>
              )}
            </div>

            {/* Reason & Action */}
            <div className="pt-2 border-t border-slate-100 space-y-2 shrink-0">
              <input
                type="text"
                value={substitutionReason}
                onChange={(e) => setSubstitutionReason(e.target.value)}
                placeholder="Reason (e.g. Customer approved via phone)"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-700"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubstitutionModal(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedAlternative}
                  onClick={handleConfirmSubstitution}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    selectedAlternative
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check size={13} />
                  <span>Confirm</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
