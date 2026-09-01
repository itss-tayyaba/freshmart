import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  CreditCard,
  CheckCircle2,
  Truck,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';

export const CheckoutPage = () => {
  const {
    cart,
    cartSubtotal,
    deliveryCharges,
    discountAmount,
    cartTotal,
    clearCart,
    navigateTo,
    deliveryLocation,
    currency,
    addToast
  } = useStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState('Today 2 PM - 4 PM');
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('FM-8924');

  const [addressData, setAddressData] = useState({
    label: 'Home',
    address: '123 Main Street, Johar Town, Lahore, Pakistan',
    phone: '0300-1234567'
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const handlePlaceOrder = () => {
    const randomId = '#FM' + Math.floor(1000 + Math.random() * 9000);
    setPlacedOrderId(randomId);
    setIsOrderPlaced(true);
    clearCart();

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    addToast('Order Placed Successfully! 🎉', `Order ${randomId} confirmed.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Title & 4-Step Stepper matching screenshot: 1 Address -> 2 Delivery -> 3 Payment -> 4 Review */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-6">
          Checkout
        </h1>

        <div className="flex items-center justify-between max-w-2xl">
          {[
            { num: 1, label: 'Address' },
            { num: 2, label: 'Delivery' },
            { num: 3, label: 'Payment' },
            { num: 4, label: 'Review' }
          ].map((s, idx) => {
            const isCompleted = isOrderPlaced || currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <React.Fragment key={s.num}>
                <div
                  onClick={() => !isOrderPlaced && setCurrentStep(s.num)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted || isCurrent
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-bold hidden sm:inline ${
                      isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                {idx < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 ${
                      currentStep > idx + 1 || isOrderPlaced ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {isOrderPlaced ? (
        /* Order Placed Success Confirmation */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-card text-center max-w-xl mx-auto space-y-5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce-soft">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">Order Confirmed!</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Your grocery order <strong className="text-slate-800 font-mono">{placedOrderId}</strong> is now packed and dispatched for express delivery.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery Window:</span>
              <span className="font-bold text-slate-800">{selectedSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery Address:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[220px]">{addressData.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Option:</span>
              <span className="font-bold text-emerald-700 capitalize">{selectedPayment.replace('-', ' ')}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigateTo('home')}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              Back to Home
            </button>
            <button
              onClick={() => navigateTo('shop')}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      ) : (
        /* Checkout Grid matching screenshot: Left Address/Slots/Payment + Right Order Summary */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Address, Slots, Payment (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Delivery Address Card matching screenshot */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Delivery Address</span>
                </h3>
                <button
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  {isEditingAddress ? 'Done' : 'Change'}
                </button>
              </div>

              {isEditingAddress ? (
                <div className="space-y-3 pt-2">
                  <input
                    type="text"
                    value={addressData.address}
                    onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    placeholder="Enter full address"
                  />
                  <input
                    type="text"
                    value={addressData.phone}
                    onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    placeholder="Phone number"
                  />
                </div>
              ) : (
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs space-y-1">
                  <span className="font-bold text-slate-800 block">{addressData.label}</span>
                  <p className="text-slate-600">{addressData.address}</p>
                  <p className="text-slate-500 font-mono">{addressData.phone}</p>
                </div>
              )}
            </div>

            {/* 2. Delivery Slot matching screenshot */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Delivery Slot</span>
              </h3>
              <p className="text-xs text-slate-400 mb-3">Select Delivery Slot</p>

              <div className="space-y-2">
                {[
                  'Today 2 PM - 4 PM',
                  'Today 4 PM - 6 PM',
                  'Tomorrow 10 AM - 12 PM',
                  'Express 10-Minute Instant Delivery'
                ].map((slot) => (
                  <label
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedSlot === slot
                        ? 'border-emerald-600 bg-emerald-50/60 font-bold text-emerald-950 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 text-xs'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliverySlot"
                      checked={selectedSlot === slot}
                      onChange={() => {}}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs">{slot}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. Payment Method matching screenshot */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Payment Method</span>
              </h3>

              <div className="space-y-2">
                {[
                  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay with cash upon arrival' },
                  { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, PayPak' },
                  { id: 'easypaisa', label: 'Easypaisa / JazzCash', desc: 'Instant mobile account payment' },
                  { id: 'bank', label: 'Bank Transfer', desc: 'Direct online IBFT transfer' }
                ].map((method) => (
                  <label
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedPayment === method.id
                        ? 'border-emerald-600 bg-emerald-50/60 font-bold text-emerald-950 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 text-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={selectedPayment === method.id}
                        onChange={() => {}}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold block">{method.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{method.desc}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Order Summary matching screenshot (4 Columns) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-card sticky top-24 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100">
                Order Summary
              </h3>

              {/* Items in Checkout Preview */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto divide-y divide-slate-50 text-xs">
                {cart.map((item) => (
                  <div key={item.product.id} className="pt-2 first:pt-0 flex justify-between">
                    <span className="text-slate-600">
                      {item.product.name} <strong className="text-slate-800">x{item.quantity}</strong>
                    </span>
                    <span className="font-bold text-slate-900">
                      {currency.symbol}{item.product.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown matching screenshot */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{currency.symbol}{cartSubtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-slate-900">
                    {deliveryCharges === 0 ? 'FREE' : `${currency.symbol}${deliveryCharges}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span>- {currency.symbol}{discountAmount}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-emerald-700 text-base">{currency.symbol}{cartTotal}</span>
                </div>
              </div>

              {/* Place Order Button matching screenshot */}
              <button
                onClick={handlePlaceOrder}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer"
              >
                Place Order
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                By placing your order, you agree to FreshMart's Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
