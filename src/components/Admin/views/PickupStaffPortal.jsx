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
  RefreshCw,
  Sparkles,
  ArrowRight,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { resolveTenantId, isSameTenant } from '../../../data/companyHierarchyData';

// Helper component: Live Elapsed Timer (Ticks every second like in the screenshot)
const ElapsedTimer = ({ createdAt, fallbackSeconds = 34 }) => {
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
    <div className="bg-[#ecfdf5] border border-[#a7f3d0] px-3.5 py-1 text-center rounded-xl min-w-[76px] shadow-2xs">
      <span className="font-mono font-black text-emerald-800 text-sm sm:text-base tracking-wider block leading-none">
        {mins}:{secs}
      </span>
      <span className="text-[9px] font-black uppercase tracking-widest text-[#059669] block mt-0.5">
        ELAPSED
      </span>
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
    adminRole,
    getProductSubstitutes,
    substituteOrderItem,
    resetToTestPickupOrder,
    currency
  } = useStore();

  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Pending' | 'Preparing' | 'Ready' | 'Dispatched'
  const [search, setSearch] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [pickedState, setPickedState] = useState({});

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
    const activeTenantId = user?.tenantId || currentTenant?.id;

    return list.filter((ord) => {
      if (!activeTenantId) return true;
      if (!ord.tenantId) return false;
      return isSameTenant(ord.tenantId, activeTenantId);
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [customerOrders, adminOrders, user?.tenantId, currentTenant?.id]);

  // Tab counts
  const counts = useMemo(() => {
    const isPending = (o) => ['Pending', 'pending', 'Pending_Kitchen', 'pending_kitchen', 'Order Placed', 'Received by Pickup Staff'].includes(o.status) || (!o.status);
    const isPreparing = (o) => ['Preparing', 'preparing', 'Processing', 'Picking', 'Packed'].includes(o.status);
    const isReady = (o) => ['Ready', 'ready', 'Ready for Dispatch', 'ready(dispatched)'].includes(o.status);
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

      if (activeTab === 'Pending' && !['pending', 'pending_kitchen', 'order placed', 'received by pickup staff'].includes(statusLower)) {
        return false;
      }
      if (activeTab === 'Preparing' && !['preparing', 'processing', 'picking', 'packed'].includes(statusLower)) {
        return false;
      }
      if (activeTab === 'Ready' && !['ready', 'ready for dispatch', 'ready(dispatched)'].includes(statusLower)) {
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

  // Stage Transitions
  const handleStartPreparing = async (order) => {
    await updateOrderFulfillment(order.id, {
      fulfillmentStage: 3,
      status: 'Picking',
      pickupStep: 'picking',
      pickingStartedAt: new Date().toISOString()
    });
    addToast('Order Preparing 🔥', `Started preparing order #${order.id}`);
  };

  const handlePackItems = async (order, itemsCount) => {
    // If not all items are picked yet, pick all automatically
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
      packedAt: new Date().toISOString()
    });
    addToast('Parcel Packed 📦', `Items verified and sealed in parcel ${parcelCode}`);
  };

  const handleMarkReadyForDispatch = async (order) => {
    await updateOrderFulfillment(order.id, {
      fulfillmentStage: 4,
      status: 'Ready for Dispatch',
      pickupStep: 'verified',
      isDispatched: false,
      parcelVerifiedAt: new Date().toISOString(),
      readyForDispatchAt: new Date().toISOString()
    });
    addToast('Order Ready for Dispatch ✅', `Order #${order.id} is Ready! Admin can now assign a rider.`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* 1. TOP HEADER */}
      <header className="bg-slate-950 text-white px-5 py-4 sm:px-8 flex items-center justify-between border-b border-slate-800 shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#059669]/20 border border-[#059669]/40 flex items-center justify-center text-[#6ee7b7] shadow-inner font-bold">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-extrabold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {currentTenant?.name || user?.tenantName || 'Store'} &bull; Pickup Desk
              </span>
              <span className="text-xs text-slate-400 font-mono">
                @{user?.username || 'staff_desk'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
              <span>{currentTenant?.logo || '🏬'}</span>
              <span>{currentTenant?.name || user?.tenantName || 'Store'} Packing Station</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              ← Back to Admin
            </button>
          )}

          <button
            onClick={adminLogout}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 flex-1 w-full">
        {/* TOP CONTROLS & FILTER BAR */}
        <div className="bg-white rounded-2xl border border-[#d1d5db] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Live Order Queue</span>
                <span className="bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] text-[11px] font-black px-2.5 py-0.5 rounded-full">
                  {allOrders.length} Orders
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Prepare customer orders row-by-row, pick items, and stage them as <b>Ready</b> for rider dispatch.
              </p>
            </div>

            {/* Actions: Test Order Button + Quick Search */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {typeof resetToTestPickupOrder === 'function' && (
                <button
                  type="button"
                  onClick={resetToTestPickupOrder}
                  className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                  title="Loads Order #ORD-701 with Dalda Ghee (Unavailable) and Olper's Milk (Available) to test picking and substitution"
                >
                  <Sparkles size={14} className="text-amber-600" />
                  <span>🧪 Test Picking &amp; Substitution Order</span>
                </button>
              )}

              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search by #order ID, customer, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Status Tabs Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: 'All', label: 'All Orders', count: counts.all },
              { id: 'Pending', label: 'Pending', count: counts.pending },
              { id: 'Preparing', label: 'Preparing', count: counts.preparing },
              { id: 'Ready', label: 'Ready (Dispatched)', count: counts.ready },
              { id: 'Dispatched', label: 'In Transit / Delivered', count: counts.dispatched }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#059669] text-white shadow-xs'
                    : 'bg-[#f8fafc] text-slate-600 hover:bg-[#d1fae5] border border-[#d1d5db]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === tab.id ? 'bg-black/20 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. ROW-WISE ORDERS LIST (Exact Image 1 Card Structure) */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#d1d5db] p-12 text-center text-slate-500 space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#f8fafc] border border-[#d1d5db] text-emerald-700 flex items-center justify-center mx-auto text-2xl">
              📦
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No Orders in this Queue</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ready to test item picking and smart alternatives? Click below to load the test picking order with unavailable Dalda Ghee and in-stock Milk.
            </p>
            {typeof resetToTestPickupOrder === 'function' && (
              <button
                type="button"
                onClick={resetToTestPickupOrder}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs inline-flex items-center gap-2"
              >
                <Sparkles size={14} />
                <span>🧪 Load Test Picking Order (Dalda Ghee + Milk)</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const orderId = order.id || order.orderId;
              const cleanId = String(orderId).replace(/^#/, '');
              const customerName = order.customerName || order.customer || 'Tayyaba Batool';
              const customerPhone = order.customerPhone || order.phone || '+923206551696';
              const orderType = order.orderType || (order.table ? 'DINE-IN' : 'DELIVERY');
              const items = Array.isArray(order.rawItems) && order.rawItems.length > 0
                ? order.rawItems
                : Array.isArray(order.items) && order.items.length > 0
                ? order.items
                : Array.isArray(order.orderItems) && order.orderItems.length > 0
                ? order.orderItems
                : [{ name: 'Cappuccino', quantity: 1, price: order.total || 810 }];

              const currentPicked = pickedState[orderId] || order.pickedItems || [];
              const isAllPicked = items.length > 0 && currentPicked.length === items.length;
              const isExpanded = Boolean(expandedOrders[orderId]);
              const statusRaw = (order.status || 'Pending').toLowerCase();
              const isReady = ['ready', 'ready for dispatch', 'ready(dispatched)'].includes(statusRaw);
              const isPreparing = ['preparing', 'processing', 'picking', 'packed'].includes(statusRaw);
              const isPending = ['pending', 'pending_kitchen', 'order placed', 'received by pickup staff'].includes(statusRaw) || !order.status;
              const isDispatched = ['dispatched', 'out for delivery', 'delivered'].includes(statusRaw) || order.isDispatched;

              // Top badge status text
              const statusBadgeText = isReady
                ? 'READY'
                : isPreparing
                ? (statusRaw === 'packed' ? 'PACKED' : 'PREPARING')
                : isDispatched
                ? 'DISPATCHED'
                : 'PENDING_KITCHEN';

              return (
              <article
                  key={orderId}
                  className="bg-white rounded-2xl sm:rounded-3xl border border-[#d1d5db] shadow-xs hover:shadow-md transition-all overflow-hidden border-t-4 border-t-[#059669]"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* TOP ROW: Order Code, Customer Info & Timer (Exact match to Image 1) */}
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Code, Dine-in/Delivery, Phone */}
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight leading-none">
                          #{cleanId}
                        </h2>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                          <span>{orderType}</span>
                          <span>-</span>
                          <span className="text-slate-800">{customerName}</span>
                          {order.table && (
                            <span className="bg-[#f8fafc] text-emerald-800 px-2 py-0.5 rounded border border-[#d1d5db] text-[10px]">
                              {order.table}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {customerPhone}
                        </div>
                      </div>

                      {/* Right: Status Pill & Elapsed Timer Box */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[10px] uppercase tracking-wider font-black text-emerald-900 bg-[#ecfdf5] border border-[#a7f3d0] px-3 py-0.5 rounded-full">
                          {statusBadgeText}
                        </span>

                        <ElapsedTimer createdAt={order.createdAt} />
                      </div>
                    </div>

                    {/* ITEMS ROW-WISE LIST (Exact match to Image 1) */}
                    <div className="space-y-2 pt-1 border-t border-[#e2e8f0]">
                      {items.map((item, idx) => {
                        const isPicked = currentPicked.includes(idx);
                        const qty = item.quantity || item.qty || 1;
                        const name = item.name || item.productName || item.title || 'Cappuccino';

                        return (
                          <div
                            key={idx}
                            onClick={() => toggleItemPick(orderId, idx)}
                            className="flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-[#f8fafc] transition cursor-pointer select-none group"
                          >
                            {/* Quantity and Name */}
                            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 min-w-0 flex-1">
                              <span className="text-emerald-700 font-black min-w-[24px]">
                                {qty}*
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className={`block truncate transition ${isPicked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                  {name}
                                </span>
                                {item.isSubstituted && item.originalProduct && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5">
                                    <span>🔄 Substituted</span>
                                    <span className="text-slate-500">(Orig: {item.originalProduct.name})</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions: Substitute Button + Square Checkbox */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isPicked && (
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenSubstitution(e, order, item, idx)}
                                  className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Item out of stock? Select smart product alternative."
                                >
                                  <span>🔄 Substitute</span>
                                </button>
                              )}

                              {/* Square Checkbox on right side */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleItemPick(orderId, idx);
                                }}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${
                                  isPicked
                                    ? 'bg-[#059669] border-[#059669] text-white shadow-2xs'
                                    : 'border-slate-300 bg-white hover:border-[#059669]'
                                }`}
                                aria-label={`Toggle pick for ${name}`}
                              >
                                {isPicked && <Check size={14} className="stroke-[3]" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* EXPANDABLE DETAILS TOGGLE */}
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(orderId)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer tracking-wider uppercase"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={14} />
                            <span>Hide Details</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            <span>▼ Show Full Details</span>
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-3.5 rounded-xl bg-[#f8fafc] border border-[#d1d5db] space-y-2 text-xs animate-in fade-in duration-150">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                            <div>
                              <span className="font-bold text-slate-400 block text-[10px] uppercase">Destination</span>
                              <span className="font-semibold text-slate-800">
                                {order.address || order.shippingAddress?.address || 'Cafe Dine-In Hub'} • {order.city || 'Lahore'}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 block text-[10px] uppercase">Payment</span>
                              <span className="font-semibold text-slate-800">
                                {order.paymentMethod || order.payment || 'Cash'} ({order.paymentStatus || 'Pending'})
                              </span>
                            </div>
                            {order.parcelCode && (
                              <div>
                                <span className="font-bold text-slate-400 block text-[10px] uppercase">Parcel ID</span>
                                <span className="font-mono font-bold text-emerald-800">{order.parcelCode}</span>
                              </div>
                            )}
                            {order.notes && (
                              <div className="sm:col-span-2">
                                <span className="font-bold text-slate-400 block text-[10px] uppercase">Special Notes</span>
                                <span className="text-slate-700 italic">"{order.notes}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BOTTOM ROW: Price on Left, Action Button on Right (Exact match to Image 1) */}
                    <div className="pt-3 border-t border-dashed border-[#cbd5e1] flex items-center justify-between gap-4">
                      {/* Price */}
                      <div className="font-mono font-black text-slate-900 text-lg sm:text-xl">
                        {order.currency === 'USD' || String(order.id).startsWith('EB-') ? (
                          <span>${Number(order.total || order.totalAmount || 810).toLocaleString()}</span>
                        ) : (
                          <span>Rs {Number(order.total || order.totalAmount || 810).toLocaleString()}</span>
                        )}
                      </div>

                      {/* Action Button */}
                      <div>
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleStartPreparing(order)}
                            className="bg-[#059669] hover:bg-[#047857] active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                          >
                            <Flame size={16} />
                            <span>START PREPARING</span>
                          </button>
                        )}

                        {isPreparing && statusRaw !== 'packed' && (
                          <button
                            type="button"
                            onClick={() => handlePackItems(order, items.length)}
                            className="bg-[#059669] hover:bg-[#047857] active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                          >
                            <PackageCheck size={16} />
                            <span>{isAllPicked ? 'PACK ITEMS' : `PACK ITEMS (${currentPicked.length}/${items.length})`}</span>
                          </button>
                        )}

                        {isPreparing && statusRaw === 'packed' && (
                          <button
                            type="button"
                            onClick={() => handleMarkReadyForDispatch(order)}
                            className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                          >
                            <CheckCircle2 size={16} />
                            <span>READY (DISPATCH)</span>
                          </button>
                        )}

                        {isReady && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
                              <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
                              <span>Ready for Dispatch</span>
                            </span>
                            <span className="text-[11px] text-slate-500 hidden sm:inline">
                              (Admin can assign rider)
                            </span>
                          </div>
                        )}

                        {isDispatched && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            <span>{order.assignedRider?.name ? `Courier: ${order.assignedRider.name}` : 'Dispatched'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* 🔄 SMART PRODUCT SUBSTITUTION MODAL FOR PICKUP STAFF */}
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
                    Order #{String(substitutionModal.order.id || substitutionModal.order.orderId).replace(/^#/, '')} • Item Unavailable in Store
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
                  Qty: {substitutionModal.item.quantity || 1} • Unit Price: Rs. {substitutionModal.item.price}
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
