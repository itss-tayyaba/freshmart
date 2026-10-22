import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, LogOut, MapPin, Package, Phone, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { apiService } from '../../services/api';

const normalizeOrder = (order) => ({
  ...order,
  id: order.orderId || order.id || String(order._id),
  customer: order.customerName || order.customer || 'Customer',
  phone: order.customerPhone || order.phone || '',
  address: order.shippingAddress?.address || order.address || '',
  city: order.shippingAddress?.city || order.city || '',
  items: Array.isArray(order.orderItems) ? order.orderItems : Array.isArray(order.rawItems) ? order.rawItems : []
});

export const PickupStaffDashboard = () => {
  const { user, adminLogout, addToast } = useStore();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  const loadOrders = useCallback(async ({ showSpinner = false } = {}) => {
    if (showSpinner) setIsLoading(true);
    setRefreshing(true);
    const response = await apiService.getPickupStaffOrders();
    if (!response?.success || !Array.isArray(response.orders)) {
      setError(response?.message || response?.error || 'Could not load your assigned orders.');
      setRefreshing(false);
      setIsLoading(false);
      return;
    }
    setOrders(response.orders.map(normalizeOrder));
    setError('');
    setRefreshing(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadOrders({ showSpinner: true });
    const timer = setInterval(() => loadOrders(), 15000);
    return () => clearInterval(timer);
  }, [loadOrders, user?.id]);

  const updateStatus = async (order, status) => {
    setUpdatingId(order.id);
    const response = await apiService.updatePickupStaffOrderStatus(order.id, status);
    if (!response?.success || !response.order) {
      const message = response?.message || response?.error || 'Could not update this order.';
      setError(message);
      addToast('Order Update Failed', message, 'error');
      setUpdatingId('');
      return;
    }
    const updated = normalizeOrder(response.order);
    setOrders((current) => current.map((item) => (item.id === order.id ? updated : item)));
    setError('');
    addToast('Order Updated', `${order.id} is now ${status === 'Preparing' ? 'being picked and packed' : 'ready for dispatch'}.`);
    setUpdatingId('');
    await loadOrders();
  };

  const activeCount = orders.filter((order) => ['Pending', 'Confirmed', 'Preparing'].includes(order.status)).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-950 px-4 py-4 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <Package className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Pickup Staff Desk</p>
              <h1 className="text-lg font-black">{user?.name || 'Pickup Staff'}</h1>
              <p className="text-xs text-slate-400">{user?.branchId || 'Branch not assigned'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadOrders({ showSpinner: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={adminLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900">My Assigned Orders</h2>
            <p className="mt-1 text-sm text-slate-500">Prepare assigned parcels, then mark each one ready for rider dispatch.</p>
          </div>
          <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
            {activeCount} to prepare
          </div>
        </section>

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => loadOrders({ showSpinner: true })} className="font-black underline">
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading assigned orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-4 font-black text-slate-900">No orders assigned yet</h3>
            <p className="mt-1 text-sm text-slate-500">New orders assigned to your account will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {orders.map((order) => {
              const canStart = ['Pending', 'Confirmed'].includes(order.status);
              const canFinish = order.status === 'Preparing';
              return (
                <article key={order.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Order ID</p>
                      <h3 className="mt-1 font-mono text-lg font-black text-slate-900">{order.id}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{order.branchName || order.branchId}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1.5 text-[11px] font-black ${
                      canFinish ? 'bg-blue-50 text-blue-700' : order.status === 'Ready for Pickup'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {canFinish ? 'Picking / Packing' : order.status === 'Ready for Pickup' ? 'Ready for Dispatch' : order.status}
                    </span>
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Customer</p>
                        <p className="mt-1 font-bold text-slate-900">{order.customer}</p>
                        {order.phone && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="h-3.5 w-3.5" /> {order.phone}
                          </p>
                        )}
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Delivery address</p>
                        <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-slate-800">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{order.address}{order.city ? `, ${order.city}` : ''}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                        Items ({order.items.length})
                      </p>
                      <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                        {order.items.map((item, index) => (
                          <div key={`${item.id || item.product || item.name}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                            <span className="font-semibold text-slate-800">{item.name || item.product?.name || 'Grocery item'}</span>
                            <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">
                              × {Number(item.quantity || 1)} {item.unit || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {canStart && (
                      <button
                        type="button"
                        onClick={() => updateStatus(order, 'Preparing')}
                        disabled={updatingId === order.id}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updatingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                        Start Picking & Packing
                      </button>
                    )}
                    {canFinish && (
                      <button
                        type="button"
                        onClick={() => updateStatus(order, 'Ready for Pickup')}
                        disabled={updatingId === order.id}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {updatingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Mark Ready for Dispatch
                      </button>
                    )}
                    {order.status === 'Ready for Pickup' && (
                      <p className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                        <Clock3 className="h-4 w-4" /> Parcel ready; waiting for branch admin to assign a rider.
                      </p>
                    )}
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
