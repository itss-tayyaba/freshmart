import React, { useMemo } from 'react';
import { CheckCircle2, Clock3, LogOut, MapPin, PackageCheck, Play, ScanLine } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const PickupStaffPortal = () => {
  const { user, customerOrders, currentTenant, updateOrderFulfillment, assignNearestRiderToOrder, adminLogout } = useStore();
  const orders = useMemo(() => (customerOrders || [])
    .filter((order) => order.tenantId === (user?.tenantId || currentTenant?.id) && order.pickupStaffId === user?.id)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
  [customerOrders, user, currentTenant]);

  const updateStage = (order, stage, status, extra = {}) => {
    updateOrderFulfillment(order.id, {
      ...extra,
      fulfillmentStage: stage,
      status,
      fulfillmentUpdatedAt: new Date().toISOString(),
      fulfillmentUpdatedBy: user?.name
    });
    if (stage === 5) assignNearestRiderToOrder(order.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-950 text-white px-5 py-4 sm:px-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-300 font-bold">Pickup Staff Workspace</p>
          <h1 className="text-xl font-black mt-1">Welcome, {user?.name || 'Staff'}</h1>
        </div>
        <button onClick={adminLogout} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold flex items-center gap-2">
          <LogOut size={16} /> Sign out
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-5 sm:p-8 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
          <div><h2 className="font-black">Assigned Parcels</h2><p className="text-sm text-slate-500 mt-1">Accept each handoff, pick and pack items, then stage the sealed parcel for dispatch.</p></div>
          <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-sm font-bold">{orders.length} assigned</span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">No parcels have been assigned to you yet.</div>
        ) : orders.map((order) => {
          const stage = Number(order.fulfillmentStage || 1);
          const items = order.rawItems || order.items || order.orderItems || [];
          const customer = order.customer?.name || order.customerName || order.shippingAddress?.fullName || 'Customer';
          const location = order.address || order.shippingAddress?.address || order.city || order.shippingAddress?.city || 'Delivery address unavailable';
          return (
            <article key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-mono text-emerald-700 font-black">{order.id}</p><h3 className="font-bold mt-1">{customer}</h3><p className="text-xs text-slate-500 flex gap-1 mt-1"><MapPin size={14}/>{location}</p></div>
                <div className="text-right"><span className="inline-block rounded-full bg-blue-50 text-blue-800 px-3 py-1 text-xs font-bold">{order.status || 'Assigned'}</span><p className="text-xs text-slate-500 mt-2"><Clock3 size={13} className="inline mr-1"/>Placed {order.time || (order.createdAt ? new Date(order.createdAt).toLocaleString() : 'time unavailable')}</p></div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <h4 className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-2">Items to pick</h4>
                {items.length ? <ul className="space-y-1">{items.map((item, index) => <li key={item.id || item.productId || index} className="text-sm flex justify-between gap-3"><span>{item.name || item.productName || item.title || 'Product'}</span><b>× {item.quantity || item.qty || 1}</b></li>)}</ul> : <p className="text-sm text-slate-500">Order item details are unavailable.</p>}
              </div>
              <div className="flex flex-wrap justify-between items-center gap-3 border-t pt-4">
                <div className="text-xs text-slate-500">{order.parcelCode ? `Parcel ${order.parcelCode}` : 'Parcel ID will be created when packed'}</div>
                {stage < 2 ? <button onClick={() => updateStage(order, 2, 'Processing', { pickupAcceptedAt: new Date().toISOString() })} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center gap-2"><CheckCircle2 size={16}/>Accept Order</button>
                  : stage === 2 ? <button onClick={() => updateStage(order, 3, 'Picking')} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center gap-2"><Play size={16}/>Start Picking</button>
                  : stage === 3 || stage === 4 ? <button onClick={() => updateStage(order, 5, 'Ready for Dispatch', { parcelCode: order.parcelCode || `PRCL-${String(order.id).replace(/\W/g, '').slice(-8).toUpperCase()}`, sealedAt: new Date().toISOString() })} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center gap-2"><PackageCheck size={16}/>Packed · Ready for Dispatch</button>
                  : <span className="text-emerald-700 font-bold text-sm flex items-center gap-2"><ScanLine size={16}/>Ready for rider handoff</span>}
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
};
