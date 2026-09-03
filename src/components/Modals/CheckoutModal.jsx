import React, { useState } from 'react';
import { X, Check, MapPin, Clock, CreditCard, ShieldCheck, ShoppingBag, ArrowRight, Truck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';

export const CheckoutModal = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartTotal,
    cartSubtotal,
    discountAmount,
    shippingFee,
    clearCart,
    setIsOrderTrackerOpen,
    currency,
    addToast
  } = useStore();

  const [step, setStep] = useState(1); // 1: Delivery Details, 2: Payment, 3: Success
  const [formData, setFormData] = useState({
    name: 'Alex Morgan',
    phone: '+1 (555) 019-2834',
    address: '742 Evergreen Terrace, Apt 4B',
    city: 'Springfield',
    deliverySlot: 'Today, 5:00 PM - 7:00 PM',
    deliveryNotes: 'Please leave by the front porch gate.',
    paymentMethod: 'card'
  });

  const [placedOrderId, setPlacedOrderId] = useState('GROC-8924');

  if (!isCheckoutOpen) return null;

  const handlePlaceOrder = () => {
    // Generate random order ID
    const newOrderId = 'GROC-' + Math.floor(1000 + Math.random() * 9000);
    setPlacedOrderId(newOrderId);
    setStep(3);
    clearCart();

    // Trigger celebratory confetti
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });

    addToast('Order Placed Successfully! 🥗', `Order ${newOrderId} has been confirmed.`, 'success');
  };

  const handleTrackOrder = () => {
    setIsCheckoutOpen(false);
    setIsOrderTrackerOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (step !== 3) setIsCheckoutOpen(false);
        }}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-brand-green text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-lime-400" />
              <span>Checkout & Express Delivery</span>
            </h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              Step {step} of 3 • Fast, Fresh & Guaranteed
            </p>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-white/90 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          
          {/* STEP 1: Delivery Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Delivery Address & Contact</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Delivery Window */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Choose Delivery Time Slot</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    'Today, 4:00 PM - 6:00 PM',
                    'Today, 6:00 PM - 8:00 PM',
                    'Tomorrow Morning, 8:00 AM'
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData({ ...formData, deliverySlot: slot })}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                        formData.deliverySlot === slot
                          ? 'border-brand-green bg-emerald-50/70 text-emerald-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Cart Total: <strong className="text-slate-800">{currency.symbol}{Math.round(cartTotal * (currency.rate || 1)).toLocaleString()}</strong>
                </span>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-brand-green hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment Method */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Select Payment Option</span>
              </h3>

              <div className="space-y-2.5">
                {[
                  { id: 'card', label: 'Credit / Debit Card (Visa, Mastercard)', desc: 'Instant & 256-bit Encrypted' },
                  { id: 'applepay', label: 'Apple Pay / Google Pay', desc: 'One-touch fast checkout' },
                  { id: 'cod', label: 'Cash on Delivery (COD)', desc: 'Pay when your groceries arrive at your door' }
                ].map((item) => (
                  <label
                    key={item.id}
                    onClick={() => setFormData({ ...formData, paymentMethod: item.id })}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      formData.paymentMethod === item.id
                        ? 'border-brand-green bg-emerald-50/60 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={formData.paymentMethod === item.id}
                      onChange={() => {}}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                      <span className="text-[11px] text-slate-500">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              {formData.paymentMethod === 'card' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8921"
                      defaultValue="4532 8900 1234 8921"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        defaultValue="08/28"
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        defaultValue="892"
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Final Summary */}
              <div className="p-3 bg-emerald-50/50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{currency.symbol}{Math.round(cartSubtotal * (currency.rate || 1)).toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-{currency.symbol}{Math.round(discountAmount * (currency.rate || 1)).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-emerald-100">
                  <span>Total Due:</span>
                  <span className="text-brand-green">{currency.symbol}{Math.round(cartTotal * (currency.rate || 1)).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  ← Back to Address
                </button>
                <button
                  onClick={handlePlaceOrder}
                  className="px-6 py-3 bg-brand-accent hover:bg-brand-accentHover text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Place Order • {currency.symbol}{Math.round(cartTotal * (currency.rate || 1)).toLocaleString()}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Order Placed Success */}
          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-brand-green rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce-soft">
                <Check className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Thank You For Your Order!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your grocery items are now being handpicked fresh from our local store!
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 max-w-md mx-auto border border-slate-100 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono font-bold text-brand-green">{placedOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Slot:</span>
                  <span className="font-semibold text-slate-800">{formData.deliverySlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">{formData.address}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  onClick={handleTrackOrder}
                  className="w-full sm:w-auto px-6 py-2.5 bg-brand-green hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>Track Live Delivery</span>
                </button>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
