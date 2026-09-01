import React, { useState } from 'react';
import { Package, Clock, CheckCircle2, Truck, RefreshCw, FileText, ChevronRight, MapPin, X, Star, ShoppingBag } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const OrdersView = () => {
  const { customerOrders, currency, addToCart, addToast, navigateTo } = useStore();
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900">My Orders & Invoices</h2>
          <p className="text-xs text-slate-400">View your grocery order history and download receipts</p>
        </div>
        <button
          onClick={() => navigateTo('shop')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Shop New Items</span>
        </button>
      </div>

      {/* Orders List or Clean Empty State */}
      {customerOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-2xs">
            📦
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-sm text-slate-900">No orders placed yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your past and active grocery orders will appear here once you checkout.
            </p>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            Start Your First Order
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {customerOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">
                    📦
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900 font-mono">{order.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {order.status || 'Confirmed'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{order.dateFormatted || 'Recently'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900 font-mono">
                    PKR {order.totalAmount}
                  </span>
                  <button
                    onClick={() => setShowInvoiceModal(order)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer"
                    title="View Receipt"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order items */}
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex justify-between text-slate-400 font-bold text-[10px] uppercase pb-1">
                  <span>Destination</span>
                  <span>Delivery Slot</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="truncate max-w-[240px]">{order.address || 'Standard Address'}</span>
                  <span className="text-emerald-700 font-bold">{order.deliverySlot || 'Express 10-Min'}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => navigateTo('delivery')}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Track on Map
                </button>
                <button
                  onClick={() => handleReorderAll(order)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Order Invoice {showInvoiceModal.id}</h3>
                <span className="text-[10px] text-slate-400">{showInvoiceModal.dateFormatted}</span>
              </div>
              <button onClick={() => setShowInvoiceModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-emerald-700">{showInvoiceModal.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount</span>
                <span className="font-black font-mono">PKR {showInvoiceModal.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address</span>
                <span className="font-medium text-slate-800 truncate max-w-[200px]">{showInvoiceModal.address}</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
