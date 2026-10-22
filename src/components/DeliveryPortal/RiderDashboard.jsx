import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, LogOut, MapPin, Package, Phone, RefreshCw, Truck } from 'lucide-react';
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

const statusStyles = {
  'Out for Delivery': 'border-blue-200 bg-blue-50 text-blue-700',
  Delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

export const RiderDashboard = () => {
  const { user, adminLogout, verifyOrderDeliveryOtp } = useStore();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState('');
  const [error, setError] = useState('');
  const [otpOrder, setOtpOrder] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const loadOrders = useCallback(async ({ showSpinner = false } = {}) => {
    if (showSpinner) setIsLoading(true);
    setRefreshing(true);
    const response = await apiService.getAssignedRiderOrders();
    if (!response?.success || !Array.isArray(response.orders)) {
      setError(response?.message || response?.error || 'Could not load your assigned deliveries.');
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
  }, [loadOrders, user?.riderId]);

  const submitOtp = async (event) => {
    event.preventDefault();
    if (!otpOrder || !/^\d{4}$/.test(otp.trim())) {
      setOtpError('Enter the customer’s 4-digit delivery code.');
      return;
    }
    setLoadingOrderId(otpOrder.id);
    setOtpError('');
    const result = await verifyOrderDeliveryOtp(otpOrder.id, otp.trim(), user?.riderId);
    setLoadingOrderId('');
    if (!result?.success) {
      setOtpError(result?.message || 'Could not verify this delivery code.');
      return;
    }
    setOtpOrder(null);
    setOtp('');
    await loadOrders();
  };

  const activeOrders = orders.filter((order) => order.status === 'Out for Delivery');
  const deliveredCount = orders.filter((order) => order.status === 'Delivered').length;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">FreshMart · Rider Portal</p>
              <h1 className="text-base font-extrabold text-slate-900">{user?.name || 'Delivery Rider'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadOrders({ showSpinner: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={adminLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-7 sm:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-lg sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Delivery workspace</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">My deliveries</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                View parcels assigned to you and confirm handover with the customer’s delivery code.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="min-w-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <p className="text-2xl font-black">{activeOrders.length}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">In delivery</p>
              </div>
              <div className="min-w-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <p className="text-2xl font-black">{deliveredCount}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">Completed</p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => loadOrders({ showSpinner: true })} className="font-bold underline">Retry</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-500 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading your deliveries…
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <Package className="mx-auto h-11 w-11 text-slate-400" />
            <h3 className="mt-4 font-black text-slate-900">No deliveries assigned</h3>
            <p className="mt-1 text-sm text-slate-500">New parcels assigned by your branch will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isDelivered = order.status === 'Delivered';
              const isActive = order.status === 'Out for Delivery';
              return (
                <article key={order.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order reference</p>
                      <h3 className="mt-0.5 font-mono text-lg font-black text-slate-900">{order.id}</h3>
                    </div>
                    <span className={`rounded-full border px-3 py-1.5 text-[11px] font-extrabold ${statusStyles[order.status] || 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Customer</p>
                        <p className="mt-1 font-bold text-slate-900">{order.customer}</p>
                        {order.phone && (
                          <a href={`tel:${order.phone}`} className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                            <Phone className="h-3.5 w-3.5" /> {order.phone}
                          </a>
                        )}
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Delivery address</p>
                        <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-slate-800">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{order.address}{order.city ? `, ${order.city}` : ''}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Parcel items · {order.items.length}</p>
                      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                        {order.items.map((item, index) => (
                          <div key={`${item.id || item.product || item.name}-${index}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                            <span className="font-semibold text-slate-800">{item.name || item.product?.name || 'Grocery item'}</span>
                            <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                              × {Number(item.quantity || 1)} {item.unit || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Amount to collect</p>
                        <p className="mt-0.5 font-mono text-lg font-black text-slate-900">
                          PKR {Number(order.totalPrice || order.totalAmount || order.total || 0).toLocaleString()}
                        </p>
                      </div>
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => { setOtpOrder(order); setOtp(''); setOtpError(''); }}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-emerald-800"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Verify delivery code
                        </button>
                      )}
                      {isDelivered && (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-4 w-4" /> Delivered and verified
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {otpOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
          <form onSubmit={submitOtp} className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delivery-otp-heading">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Delivery confirmation</p>
              <h2 id="delivery-otp-heading" className="mt-1 text-xl font-black text-slate-900">Verify customer code</h2>
              <p className="mt-1 text-sm text-slate-500">Ask the customer for the 4-digit code for {otpOrder.id}.</p>
            </div>
            <input
              autoFocus
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center font-mono text-2xl font-black tracking-[0.4em] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              aria-label="4-digit delivery code"
            />
            {otpError && <p className="text-sm font-semibold text-rose-700" role="alert">{otpError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setOtpOrder(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={loadingOrderId === otpOrder.id} className="flex-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-50">
                {loadingOrderId === otpOrder.id ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Confirm delivery'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
