import React, { useState } from 'react';
import { Package, Clock, CheckCircle2, Truck, RefreshCw, FileText, ChevronRight, MapPin, X, Star } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const OrdersView = ({ onTrackOrder }) => {
  const { adminOrders, currency, addToCart, addToast } = useStore();
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(null);

  // Customer specific orders
  const customerOrdersList = [
    {
      id: '#FM-9482',
      date: 'Today, 10:24 AM',
      itemsCount: 4,
      total: 1280,
      status: 'Out for Delivery',
      statusClass: 'bg-amber-100 text-amber-800 border-amber-200',
      eta: '12 mins (Rider Ali)',
      slot: 'Express 10-Min Delivery',
      address: '123 Main Street, Johar Town, Lahore',
      payment: 'Cash on Delivery',
      items: [
        { name: "Olper's Full Cream Milk 1L", qty: 2, price: 210, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80' },
        { name: 'Fresh Farm Bananas (1 Dozen)', qty: 1, price: 180, img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=200&q=80' },
        { name: "Lay's Classic Salted Potato Chips 104g", qty: 2, price: 210, img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=200&q=80' },
        { name: 'Farm Fresh Brown Eggs (Tray of 12)', qty: 1, price: 260, img: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=200&q=80' }
      ]
    },
    {
      id: '#FM-8931',
      date: '28 Aug 2026, 04:15 PM',
      itemsCount: 3,
      total: 850,
      status: 'Delivered',
      statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      eta: 'Delivered',
      slot: 'Scheduled: 4 PM - 6 PM',
      address: '123 Main Street, Johar Town, Lahore',
      payment: 'FreshMart Wallet',
      items: [
        { name: 'Red Royal Gala Apples (1 Kg)', qty: 1, price: 340, img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=200&q=80' },
        { name: 'Whole Wheat Farm Bread 400g', qty: 2, price: 160, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80' },
        { name: 'Nestle Pure Life Water 1.5L', qty: 1, price: 110, img: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=200&q=80' }
      ]
    },
    {
      id: '#FM-7820',
      date: '21 Aug 2026, 11:30 AM',
      itemsCount: 5,
      total: 2450,
      status: 'Delivered',
      statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      eta: 'Delivered',
      slot: 'Express 10-Min Delivery',
      address: 'Office: Tech Hub, Gulberg III, Lahore',
      payment: 'Visa Card •••• 4242',
      items: [
        { name: 'Fresh Boneless Chicken Breast (1 Kg)', qty: 2, price: 850, img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=200&q=80' },
        { name: 'Basmati Super Kernel Rice (2 Kg)', qty: 1, price: 520, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80' },
        { name: 'Organic Extra Virgin Olive Oil 500ml', qty: 1, price: 950, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80' }
      ]
    }
  ];

  const handleReorder = (order) => {
    order.items.forEach((item) => {
      addToCart({
        id: `reorder-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: item.name,
        price: item.price,
        unit: '1 unit',
        image: item.img
      }, item.qty);
    });
    addToast('Reordered Items 🛒', `Added ${order.items.length} items from ${order.id} to your basket.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Active Express Order Live Alert Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Live Express Delivery in Progress
          </div>
          <h3 className="text-xl sm:text-2xl font-black">Order #FM-9482 is on its way!</h3>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-lg">
            Courier Rider Ali has picked up your fresh groceries and is estimated to arrive in <strong className="text-amber-300">12 minutes</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => onTrackOrder('#FM-9482')}
            className="px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-900 rounded-2xl text-xs sm:text-sm font-black shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Track on Live GPS Map</span>
          </button>
        </div>
      </div>

      {/* Order History Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">Your Order History</h3>
          <p className="text-xs text-slate-500">Track current orders, review past grocery receipts & reorder in 1 click.</p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
          {customerOrdersList.length} Total Orders
        </span>
      </div>

      {/* Orders List Cards */}
      <div className="space-y-4">
        {customerOrdersList.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4"
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{order.id}</span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${order.statusClass}`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium block mt-0.5">{order.date} • {order.slot}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setShowInvoiceModal(order)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                  title="View Receipt"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>
                <button
                  onClick={() => handleReorder(order)}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reorder</span>
                </button>
              </div>
            </div>

            {/* Items Mini Thumbnail Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                  <img src={item.img} alt={item.name} className="w-10 h-10 rounded-xl object-cover bg-white shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{item.qty}x • {currency.symbol}{item.price}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Card Footer Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 text-xs text-slate-500 gap-2 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-xs sm:max-w-md">{order.address}</span>
              </div>
              <div className="flex items-center gap-4 self-end sm:self-auto">
                <span>Payment: <strong className="text-slate-700 font-semibold">{order.payment}</strong></span>
                <span className="text-sm font-black text-slate-900">Total: {currency.symbol}{order.total}</span>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Tax Invoice / Receipt</h3>
                <p className="text-xs text-slate-400">Order {showInvoiceModal.id}</p>
              </div>
              <button
                onClick={() => setShowInvoiceModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between">
                <div>
                  <span className="text-slate-400 block font-semibold">Billed To:</span>
                  <p className="font-bold text-slate-800">Alex Morgan</p>
                  <p className="text-slate-500">{showInvoiceModal.address}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-semibold">Store:</span>
                  <p className="font-bold text-emerald-700">FreshMart Superstore</p>
                  <p className="text-slate-500">NTN: 8294719-4</p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {showInvoiceModal.items.map((it, i) => (
                      <tr key={i}>
                        <td className="p-2.5 font-medium text-slate-800">{it.name}</td>
                        <td className="p-2.5 text-center">{it.qty}</td>
                        <td className="p-2.5 text-right font-bold">{currency.symbol}{it.price * it.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="space-y-1.5 pt-2 text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{currency.symbol}{showInvoiceModal.total}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charges</span>
                  <span className="text-emerald-600 font-bold">FREE (VIP Gold)</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-100 pt-2">
                  <span>Total Amount Paid</span>
                  <span>{currency.symbol}{showInvoiceModal.total}</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Print / Download PDF Receipt
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
