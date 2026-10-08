import React, { useState } from 'react';
import { Package, Clock, CheckCircle2, Truck, RefreshCw, FileText, ChevronRight, MapPin, X, Star, ShoppingBag, Navigation } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { CustomerLiveTrackingCard } from '../CustomerLiveTrackingCard';

export const OrdersView = () => {
  const { customerOrders = [], currency = 'PKR', addToCart, addToast, navigateTo, verifyOrderDeliveryOtp } = useStore();
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(null);
  const [expandedTrackerOrderId, setExpandedTrackerOrderId] = useState(null);

  const handleReorderAll = (order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        if (item.product) {
          addToCart(item.product, item.quantity || 1);
        }
      });
      addToast('Items Added to Basket 🛒', `All items from order ${order.id} reordered.`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-emerald-50/40 to-teal-50/30 p-6 rounded-3xl border border-emerald-100 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-900/20">
            📦
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">My Orders & Invoices</h2>
            <p className="text-xs text-slate-500">Track current grocery dispatches and view itemized receipts</p>
          </div>
        </div>
        <button
          onClick={() => navigateTo('shop')}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-900/20 transition-all cursor-pointer hover:scale-105 self-start sm:self-auto"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Shop Fresh Groceries</span>
        </button>
      </div>

      {/* Orders List or Clean Empty State */}
      {customerOrders.length === 0 ? (
        <div className="bg-gradient-to-b from-white to-emerald-50/40 rounded-3xl p-8 sm:p-12 border border-emerald-100 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl shadow-xs">
            📦
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-base text-slate-900">No orders placed yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your grocery orders will appear here once placed, with real-time live tracking and downloadable tax receipts.
            </p>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-900/20 cursor-pointer transition-all hover:scale-105"
          >
            Start Your First Order
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {customerOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-5 border border-emerald-100/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100/70">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-lg border border-emerald-200/60">
                    🛍️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900 font-mono">{order.id}</span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {order.status || 'Confirmed'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{order.dateFormatted || 'Recently'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-emerald-700 font-mono">
                    PKR {order.totalAmount}
                  </span>
                  <button
                    onClick={() => setShowInvoiceModal(order)}
                    className="p-2 text-slate-400 hover:text-emerald-700 rounded-xl hover:bg-emerald-50 cursor-pointer transition-colors border border-transparent hover:border-emerald-200"
                    title="View Receipt"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order items */}
              <div className="text-xs text-slate-600 space-y-1 bg-emerald-50/30 p-3 rounded-2xl border border-emerald-100/60">
                <div className="flex justify-between text-slate-400 font-bold text-[10px] uppercase pb-1">
                  <span>Destination</span>
                  <span>Delivery Slot</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="truncate max-w-[240px] text-slate-800 font-semibold">{order.address || 'Standard Address'}</span>
                  <span className="text-emerald-700 font-bold">{order.deliverySlot || 'Express 10-Min'}</span>
                </div>
              </div>

              {/* Substituted items notification */}
              {(() => {
                const orderItems = Array.isArray(order.orderItems) ? order.orderItems : Array.isArray(order.rawItems) ? order.rawItems : Array.isArray(order.items) ? order.items : [];
                const subs = orderItems.filter((it) => it && (it.isSubstituted || it.originalProduct));
                if (subs.length === 0) return null;
                return (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 text-xs space-y-1">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px]">
                      <span>🔄 Product Substitution</span>
                    </span>
                    {subs.map((sub, sIdx) => (
                      <p key={sIdx} className="text-slate-700 text-[11px]">
                        Supplied: <strong className="text-slate-900">{sub.name}</strong> (Originally: <span className="line-through text-slate-500">{sub.originalProduct?.name}</span>)
                      </p>
                    ))}
                  </div>
                );
              })()}

              {['dispatched', 'out for delivery'].includes(String(order.status || '').toLowerCase()) && (
                <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-2xl px-4 py-3">
                  <Truck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-sky-950">
                      {String(order.status).toLowerCase() === 'dispatched' ? 'Your parcel has been dispatched' : 'Your parcel is out for delivery'}
                    </p>
                    <p className="text-[11px] text-sky-800 mt-0.5">
                      {String(order.status).toLowerCase() === 'dispatched'
                        ? 'The pickup staff handed your parcel to the courier.'
                        : 'The courier is on the way to your delivery address.'}
                      {order.fulfillmentUpdatedAt && (
                        <span> Updated {new Date(order.fulfillmentUpdatedAt).toLocaleString()}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Handover OTP PIN Section */}
              {order.status !== 'Delivered' ? (
                <div className="flex items-center justify-between bg-amber-50/90 border border-amber-200/90 rounded-2xl px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      🔐
                    </div>
                    <div>
                      <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <span>Doorstep Handover OTP</span>
                        <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold uppercase">Required</span>
                      </div>
                      <div className="text-[10px] text-amber-800 font-medium">Share this 4-digit PIN with your delivery rider upon arrival</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-base px-3 py-1 bg-white border border-amber-300 rounded-xl text-amber-950 tracking-widest shadow-2xs">
                      {order.deliveryOtp || '7412'}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(order.deliveryOtp || '7412');
                        addToast('OTP Copied 📋', `Share PIN ${order.deliveryOtp || '7412'} with rider on delivery.`);
                      }}
                      className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg cursor-pointer transition-colors text-xs"
                      title="Copy OTP PIN"
                    >
                      📋
                    </button>
                    <button
                      onClick={async () => {
                        if (verifyOrderDeliveryOtp) {
                          const pin = order.deliveryOtp || '7412';
                          const res = await verifyOrderDeliveryOtp(order.id || order.orderId, pin, order.assignedRider?.id, pin);
                          if (res && res.success) {
                            addToast('Order Completed 🎉', `Order #${String(order.id || '').replace(/^#/, '')} marked as Delivered!`);
                          }
                        }
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition shadow-2xs flex items-center gap-1"
                      title="Verify and complete delivery"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verify & Complete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Doorstep Delivery Verified & Completed</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md">
                    OTP Verified
                  </span>
                </div>
              )}

              {/* Optional Inline Live InDrive Tracking Map */}
              {expandedTrackerOrderId === order.id && (
                <div className="pt-2">
                  <CustomerLiveTrackingCard activeOrder={order} />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setExpandedTrackerOrderId(expandedTrackerOrderId === order.id ? null : order.id)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-emerald-200/60 flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{expandedTrackerOrderId === order.id ? 'Hide Live Map' : 'InDrive Live Map 📍'}</span>
                </button>
                <button
                  onClick={() => handleReorderAll(order)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs hover:scale-105"
                >
                  Order Again
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs border border-emerald-100">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Order Receipt {showInvoiceModal.id}</h3>
                <span className="text-[10px] text-slate-400">{showInvoiceModal.dateFormatted}</span>
              </div>
              <button onClick={() => setShowInvoiceModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <div className="space-y-2 bg-gradient-to-b from-emerald-50/50 to-white p-4 rounded-2xl border border-emerald-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-emerald-700">{showInvoiceModal.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount</span>
                <span className="font-black font-mono text-emerald-800 text-sm">PKR {showInvoiceModal.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address</span>
                <span className="font-medium text-slate-800 truncate max-w-[200px]">{showInvoiceModal.address}</span>
              </div>
            </div>

            {/* Itemized Order Line Items */}
            {(() => {
              const list = Array.isArray(showInvoiceModal.orderItems) ? showInvoiceModal.orderItems : Array.isArray(showInvoiceModal.rawItems) ? showInvoiceModal.rawItems : Array.isArray(showInvoiceModal.items) ? showInvoiceModal.items : [];
              if (!list || list.length === 0) return null;
              return (
                <div className="border border-emerald-100 rounded-2xl p-3 space-y-2 max-h-48 overflow-y-auto bg-slate-50/50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Ordered Items</span>
                  {list.map((it, i) => (
                    <div key={i} className="flex justify-between items-start text-xs border-b border-slate-100 pb-1.5 last:border-b-0">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-800 block truncate">{it.quantity || 1}× {it.name}</span>
                        {it.isSubstituted && it.originalProduct && (
                          <span className="block text-[10px] text-amber-800 font-semibold mt-0.5">
                            🔄 Substituted (Originally: {it.originalProduct.name})
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900 shrink-0">PKR {Number(it.price || 0) * Number(it.quantity || 1)}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="pt-2 text-right">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold cursor-pointer shadow-md"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
