import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  PackageCheck,
  Play,
  ScanLine,
  Boxes,
  Check,
  Package,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const PickupStaffPortal = () => {
  const {
    user,
    customerOrders,
    adminOrders,
    currentTenant,
    updateOrderFulfillment,
    assignNearestRiderToOrder,
    adminLogout,
    addToast
  } = useStore();

  // Picked item state per order: { [orderId]: number[] (indexes) }
  const [pickedState, setPickedState] = useState({});

  // Merge and deduplicate all live orders
  const orders = useMemo(() => {
    const all = [...(customerOrders || []), ...(adminOrders || [])];
    const uniqueMap = new Map();
    all.forEach((ord) => {
      if (ord && ord.id && !uniqueMap.has(ord.id)) {
        uniqueMap.set(ord.id, ord);
      }
    });
    const uniqueList = Array.from(uniqueMap.values());

    return uniqueList.filter((ord) => {
      const activeTId = user?.tenantId || currentTenant?.id;
      const tenantMatch = ord.tenantId === activeTId || (!ord.tenantId && activeTId === 'tenant-freshmart');
      const staffMatch = ord.pickupStaffId === user?.id;
      return tenantMatch && staffMatch;
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [customerOrders, adminOrders, user, currentTenant]);

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

  const updateStage = async (order, stage, status, extra = {}) => {
    const currentPicked = pickedState[order.id] || order.pickedItems || [];
    const updated = await updateOrderFulfillment(order.id, {
      ...extra,
      fulfillmentStage: stage,
      status,
      pickedItems: currentPicked,
      fulfillmentUpdatedAt: new Date().toISOString(),
      fulfillmentUpdatedBy: user?.name
    });
    if (!updated) return;
    if (stage === 4) {
      if (assignNearestRiderToOrder) assignNearestRiderToOrder(order.id);
    }
    addToast('Order Status Updated 📦', `Order ${order.id}: ${status}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="bg-slate-950 text-white px-5 py-4 sm:px-8 flex items-center justify-between shadow-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-extrabold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Pickup Staff Workspace
              </span>
              <span className="text-xs text-slate-400 font-mono">
                @{user?.username || 'staff'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white mt-0.5">
              Welcome, {user?.name || 'Staff Member'}
            </h1>
          </div>
        </div>

        <button
          onClick={adminLogout}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6 flex-1 w-full">
        
        {/* STATS BANNER */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">Assigned Parcel Queues</h2>
              <span className="rounded-full bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 text-xs">
                {orders.length} Parcels
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Inspect parcels delivered to your desk, pick shelf items line-by-line, package securely, and mark ready for courier dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <Clock3 className="w-4 h-4 text-emerald-600" />
            <span>Store Hub: <b>{currentTenant?.name || user?.tenantName || 'Main Store'}</b></span>
          </div>
        </div>

        {/* PARCEL CARDS LIST */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-500 space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No Parcels Assigned Right Now</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              When the Store Admin updates orders with <b>"Deliver to Staff"</b>, they will immediately appear here for shelf picking and packing.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const stage = Number(order.fulfillmentStage || 1);
            const items = order.rawItems || order.items || order.orderItems || [];
            const customer = order.customer?.name || order.customerName || order.customer || 'Customer';
            const location = order.address || order.shippingAddress?.address || order.city || order.shippingAddress?.city || 'Delivery Address';
            const city = order.city || order.shippingAddress?.city || 'Lahore';
            const isDispatched = Boolean(order.isDispatched || stage >= 5 || ['dispatched', 'out for delivery', 'delivered'].includes((order.status || '').toLowerCase()));
            const currentPicked = pickedState[order.id] || order.pickedItems || [];
            const isAllPicked = items.length > 0 && currentPicked.length === items.length;

            return (
              <article
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-sm hover:shadow-md transition-all"
              >
                {/* TOP HEADER */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-700 font-black text-sm">
                        {order.id}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        {order.status || 'Assigned to Staff'}
                      </span>
                      {order.packageType && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          📦 {order.packageType}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mt-1">{customer}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin size={14} className="text-rose-500 shrink-0" />
                      <span>{location} • <b>{city}</b></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-slate-900 text-base block">
                      Rs. {Number(order.total || order.totalAmount || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      <Clock3 size={13} className="inline mr-1 text-slate-400" />
                      {order.time || (order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent')}
                    </span>
                  </div>
                </div>

                {/* LINE-WISE PICKING CHECKLIST */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-slate-700 font-black flex items-center gap-1.5">
                        <Package size={14} className="text-emerald-600" />
                        <span>Line-Wise Shelf Pick Checklist ({currentPicked.length} of {items.length} Picked)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Check off each item as you collect it from store shelves.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePickAll(order.id, items.length)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
                    >
                      <Check size={14} />
                      <span>{isAllPicked ? 'Uncheck All' : 'Pick All'}</span>
                    </button>
                  </div>

                  {items.length ? (
                    <div className="divide-y divide-slate-200/60 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {items.map((item, idx) => {
                        const isPicked = currentPicked.includes(idx);
                        const aisleLetters = ['A', 'B', 'C', 'D'];
                        const shelfLocation = `Aisle ${aisleLetters[idx % 4]} • Shelf ${((idx * 2) % 6) + 1}`;
                        const qty = item.quantity || item.qty || 1;

                        return (
                          <div
                            key={item.id || item.productId || idx}
                            onClick={() => toggleItemPick(order.id, idx)}
                            className={`p-3 flex items-center justify-between gap-3 text-xs transition cursor-pointer hover:bg-slate-50 ${
                              isPicked ? 'bg-emerald-50/60' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                  isPicked
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isPicked && <Check size={14} className="stroke-[3]" />}
                              </div>

                              <div className="min-w-0">
                                <span className={`font-bold block truncate ${isPicked ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                  {item.name || item.productName || item.title || 'Product'}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                  📍 {shelfLocation}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-black text-xs text-slate-800 block">
                                × {qty}
                              </span>
                              <span className={`text-[10px] font-bold ${isPicked ? 'text-emerald-700' : 'text-amber-600'}`}>
                                {isPicked ? '✓ Verified' : 'To Pick'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Order item details are not available.</p>
                  )}
                </div>

                {/* BOTTOM ACTIONS */}
                <div className="flex flex-wrap justify-between items-center gap-3 border-t border-slate-100 pt-3">
                  <div className="text-xs text-slate-500 font-medium">
                    {order.parcelCode ? (
                      <span className="font-mono font-bold text-slate-800">
                        📦 Parcel ID: <b>{order.parcelCode}</b>
                      </span>
                    ) : (
                      <span>Parcel ID will be generated upon packing confirmation.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {stage < 2 || order.status === 'Deliver to Staff' || order.status === 'Delivered to Staff' ? (
                      <button
                        onClick={() =>
                          updateStage(order, 2, 'Packing', {
                            pickupAcceptedAt: new Date().toISOString()
                          })
                        }
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                      >
                        <CheckCircle2 size={16} />
                        <span>Accept Parcel & Start Packing</span>
                      </button>
                    ) : stage === 2 ? (
                      <button
                        onClick={() => updateStage(order, 3, 'Picking')}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                      >
                        <Play size={16} />
                        <span>Start Line-Wise Picking</span>
                      </button>
                    ) : stage === 3 && isAllPicked ? (
                      <button
                        onClick={() =>
                          updateStage(order, 4, 'Ready for Dispatch', {
                            parcelCode:
                              order.parcelCode ||
                              `PRCL-${String(order.id).replace(/\W/g, '').slice(-8).toUpperCase()}`,
                            sealedAt: new Date().toISOString(),
                            isDispatched: false,
                            dispatchStatus: 'Ready for Dispatch',
                            readyForDispatchAt: new Date().toISOString()
                          })
                        }
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                      >
                        <PackageCheck size={16} />
                        <span>Pack & Mark Ready for Dispatch</span>
                      </button>
                    ) : stage === 3 ? (
                      <span className="text-amber-700 text-xs font-bold">Pick every item before sealing this parcel.</span>
                    ) : stage === 4 && order.assignedRider ? (
                      <button onClick={() => updateStage(order, 5, 'Dispatched', { isDispatched: true, dispatchStatus: 'Dispatched', dispatchedAt: new Date().toISOString() })} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2">
                        <PackageCheck size={16}/><span>Hand to {order.assignedRider.name} · Mark Dispatched</span>
                      </button>
                    ) : stage === 4 ? (
                      <button onClick={() => assignNearestRiderToOrder?.(order.id)} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">Find Nearby Rider</button>
                    ) : (
                      <span className="text-emerald-700 font-bold text-xs flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <ScanLine size={16} />
                        <span>Dispatched · handed to courier</span>
                      </span>
                    )}
                  </div>
                </div>

              </article>
            );
          })
        )}
      </main>
    </div>
  );
};
