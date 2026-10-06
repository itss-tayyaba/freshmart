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
    <div className="bg-[#fef9ee] border border-[#f3ddab] px-3.5 py-1 text-center rounded-xl min-w-[76px] shadow-2xs">
      <span className="font-mono font-black text-amber-800 text-sm sm:text-base tracking-wider block leading-none">
        {mins}:{secs}
      </span>
      <span className="text-[9px] font-black uppercase tracking-widest text-[#b88628] block mt-0.5">
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
    adminRole
  } = useStore();

  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Pending' | 'Preparing' | 'Ready' | 'Dispatched'
  const [search, setSearch] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [pickedState, setPickedState] = useState({});

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
    const activeTenantId = user?.tenantId || currentTenant?.id || 'tenant-freshmart';

    return list.filter((ord) => {
      // Allow tenant match or fallback
      const tenantMatch = !ord.tenantId || ord.tenantId === activeTenantId || activeTenantId === 'tenant-freshmart';
      return tenantMatch;
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [customerOrders, adminOrders, user, currentTenant]);

  // Tab counts
  const counts = useMemo(() => {
    const isPending = (o) => ['Pending', 'pending', 'Pending_Kitchen', 'pending_kitchen', 'Order Placed'].includes(o.status) || (!o.status);
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

      if (activeTab === 'Pending' && !['pending', 'pending_kitchen', 'order placed'].includes(statusLower)) {
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
      status: 'Preparing',
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
      parcelCode,
      packedAt: new Date().toISOString()
    });
    addToast('Parcel Packed 📦', `Items verified and sealed in parcel ${parcelCode}`);
  };

  const handleMarkReadyForDispatch = async (order) => {
    await updateOrderFulfillment(order.id, {
      fulfillmentStage: 4,
      status: 'Ready',
      pickupStep: 'ready',
      isDispatched: false,
      readyForDispatchAt: new Date().toISOString()
    });
    addToast('Order Ready for Dispatch ✅', `Order #${order.id} is Ready! Admin can now assign a rider.`);
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] text-slate-800 flex flex-col font-sans">
      {/* 1. TOP HEADER */}
      <header className="bg-slate-950 text-white px-5 py-4 sm:px-8 flex items-center justify-between border-b border-slate-800 shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#c8922c]/20 border border-[#c8922c]/40 flex items-center justify-center text-[#e8b558] shadow-inner font-bold">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-amber-300 font-extrabold bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Pickup Staff Dashboard
              </span>
              <span className="text-xs text-slate-400 font-mono">
                @{user?.username || 'staff_desk'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white mt-0.5">
              Kitchen & Packing Desk
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
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5 flex-1 w-full">
        {/* TOP CONTROLS & FILTER BAR */}
        <div className="bg-white rounded-2xl border border-[#e8dfd3] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Live Order Queue</span>
                <span className="bg-[#fef9ee] text-[#b88628] border border-[#f3ddab] text-[11px] font-black px-2.5 py-0.5 rounded-full">
                  {allOrders.length} Orders
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Prepare customer orders row-by-row, pick items, and stage them as <b>Ready</b> for rider dispatch.
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by #order ID, customer, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-[#faf7f2] border border-[#e0d6c5] rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                    ? 'bg-[#b88628] text-white shadow-xs'
                    : 'bg-[#faf7f2] text-slate-600 hover:bg-[#ede5d8] border border-[#e8dfd3]'
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
          <div className="bg-white rounded-3xl border border-[#e8dfd3] p-12 text-center text-slate-500 space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#faf7f2] border border-[#e8dfd3] text-amber-700 flex items-center justify-center mx-auto text-2xl">
              ☕
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No Orders in this Queue</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {allOrders.length === 0
                ? 'No orders placed yet. New customer orders will show up here row-wise in real time.'
                : 'No orders matching current filter or search criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
              const isPending = ['pending', 'pending_kitchen', 'order placed'].includes(statusRaw) || !order.status;
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
                  className="bg-white rounded-2xl sm:rounded-3xl border border-[#e8dfd3] shadow-xs hover:shadow-md transition-all overflow-hidden border-t-4 border-t-[#c8922c]"
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
                            <span className="bg-[#faf7f2] text-amber-800 px-2 py-0.5 rounded border border-[#e8dfd3] text-[10px]">
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
                        <span className="text-[10px] uppercase tracking-wider font-black text-amber-900 bg-[#fef9ee] border border-[#f3ddab] px-3 py-0.5 rounded-full">
                          {statusBadgeText}
                        </span>

                        <ElapsedTimer createdAt={order.createdAt} />
                      </div>
                    </div>

                    {/* ITEMS ROW-WISE LIST (Exact match to Image 1) */}
                    <div className="space-y-2 pt-1 border-t border-[#f2ebe0]">
                      {items.map((item, idx) => {
                        const isPicked = currentPicked.includes(idx);
                        const qty = item.quantity || item.qty || 1;
                        const name = item.name || item.productName || item.title || 'Cappuccino';

                        return (
                          <div
                            key={idx}
                            onClick={() => toggleItemPick(orderId, idx)}
                            className="flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-[#faf7f2] transition cursor-pointer select-none group"
                          >
                            {/* Quantity and Name */}
                            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
                              <span className="text-amber-700 font-black min-w-[24px]">
                                {qty}*
                              </span>
                              <span className={`transition ${isPicked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {name}
                              </span>
                            </div>

                            {/* Square Checkbox on right side */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItemPick(orderId, idx);
                              }}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${
                                isPicked
                                  ? 'bg-[#b88628] border-[#b88628] text-white shadow-2xs'
                                  : 'border-slate-300 bg-white hover:border-[#b88628]'
                              }`}
                              aria-label={`Toggle pick for ${name}`}
                            >
                              {isPicked && <Check size={14} className="stroke-[3]" />}
                            </button>
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
                        <div className="mt-3 p-3.5 rounded-xl bg-[#faf7f2] border border-[#e8dfd3] space-y-2 text-xs animate-in fade-in duration-150">
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
                                <span className="font-mono font-bold text-amber-800">{order.parcelCode}</span>
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
                    <div className="pt-3 border-t border-dashed border-[#e6dcce] flex items-center justify-between gap-4">
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
                            className="bg-[#b88628] hover:bg-[#a17420] active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                          >
                            <Flame size={16} />
                            <span>START PREPARING</span>
                          </button>
                        )}

                        {isPreparing && statusRaw !== 'packed' && (
                          <button
                            type="button"
                            onClick={() => handlePackItems(order, items.length)}
                            className="bg-[#b88628] hover:bg-[#a17420] active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
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
    </div>
  );
};
