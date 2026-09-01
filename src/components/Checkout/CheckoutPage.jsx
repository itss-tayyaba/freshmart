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
  Check,
  Smartphone,
  Wallet,
  Coins,
  ChevronRight,
  Plus,
  Tag,
  AlertCircle,
  Building2,
  Receipt,
  QrCode,
  Copy,
  Landmark
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';
import { apiService } from '../../services/api';

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
    setDeliveryLocation,
    currency,
    appliedCoupon,
    addToast,
    placeCustomerOrder
  } = useStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState('⚡ Instant 10-15 Mins Express Delivery');
  const [selectedPayment, setSelectedPayment] = useState('cod'); // 'cod' | 'jazzcash' | 'easypaisa' | 'sadapay' | 'nayapay' | 'bank' | 'card' | 'wallet'
  const [riderTip, setRiderTip] = useState(0);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);

  // Address Form State
  const [addressData, setAddressData] = useState({
    recipientName: 'Aimen Yasin',
    label: deliveryLocation.label || 'Home',
    address: deliveryLocation.address || 'House 12, Street 4, Sector B, Johar Town',
    city: deliveryLocation.city || 'Lahore, Pakistan',
    phone: '0300-1234567',
    notes: 'Please ring bell and leave on the porch if unavailable.'
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Payment Form States
  const [jazzcashPhone, setJazzcashPhone] = useState('0300-1234567');
  const [easypaisaPhone, setEasypaisaPhone] = useState('0312-9876543');
  const [sadapayAccount, setSadapayAccount] = useState('@aimen_fresh');
  const [nayapayAccount, setNayapayAccount] = useState('@nayapay_aimen');
  const [bankTransferDetails, setBankTransferDetails] = useState({
    selectedBank: 'Meezan Bank (Islamic)',
    transactionId: '',
    senderAccountName: ''
  });
  const [cardData, setCardData] = useState({
    cardNumber: '4532 •••• •••• 8842',
    cardName: 'Aimen Yasin',
    expiry: '08/28',
    cvv: '•••'
  });

  const grandTotalWithTip = cartTotal + riderTip;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      addToast('Cart is Empty', 'Please add grocery items before checkout.', 'error');
      return;
    }

    const orderId = '#FM' + Math.floor(10000 + Math.random() * 90000);
    const orderPayload = {
      id: orderId,
      items: cart.map((i) => ({
        id: i.product.id || i.product._id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        unit: i.unit || i.product.unit
      })),
      subtotal: cartSubtotal,
      deliveryCharges,
      discountAmount,
      riderTip,
      totalAmount: grandTotalWithTip,
      paymentMethod: selectedPayment.toUpperCase(),
      deliverySlot: selectedSlot,
      address: `${addressData.address}, ${addressData.city}`,
      recipientName: addressData.recipientName,
      phone: addressData.phone,
      status: 'Out for Delivery',
      createdAt: new Date().toISOString()
    };

    setPlacedOrderDetails(orderPayload);
    setIsOrderPlaced(true);

    if (placeCustomerOrder) {
      await placeCustomerOrder(orderPayload);
    } else {
      clearCart();
    }

    try {
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    addToast('Order Placed Successfully! 🎉', `Order ${orderId} confirmed for 10-minute dispatch.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Stepper Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Express Checkout
          </h1>
          <p className="text-xs text-slate-500">Fast 10-minute grocery dispatch and secure payment gateway</p>
        </div>

        {/* 4-Step Indicator */}
        <div className="flex items-center justify-between max-w-2xl bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          {[
            { num: 1, label: 'Delivery Address' },
            { num: 2, label: 'Delivery Slot' },
            { num: 3, label: 'Payment Method' },
            { num: 4, label: 'Order Review' }
          ].map((s, idx) => {
            const isCompleted = isOrderPlaced || currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <React.Fragment key={s.num}>
                <div
                  onClick={() => !isOrderPlaced && setCurrentStep(s.num)}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : isCurrent
                        ? 'bg-slate-900 text-white ring-2 ring-emerald-500'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-bold hidden sm:inline ${
                      isCurrent ? 'text-slate-900' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
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
        /* Order Placed Success Confirmation Screen */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl text-center max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce-soft">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Payment Confirmed • In Transit
            </span>
            <h2 className="text-3xl font-black text-slate-900">Order Confirmed!</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Order <strong className="text-slate-900 font-mono">{placedOrderDetails?.id}</strong> has been assigned to Express Courier (ETA 12 mins).
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2.5">
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-semibold">Delivery Time:</span>
              <span className="font-black text-slate-900">{placedOrderDetails?.deliverySlot}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-semibold">Destination:</span>
              <span className="font-bold text-slate-800 truncate max-w-[240px]">{placedOrderDetails?.address}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-semibold">Payment Option:</span>
              <span className="font-black text-emerald-700 uppercase">{placedOrderDetails?.paymentMethod}</span>
            </div>
            <div className="flex justify-between pt-1 font-black text-sm">
              <span className="text-slate-900">Total Paid:</span>
              <span className="text-emerald-700 font-mono">PKR {placedOrderDetails?.totalAmount}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              onClick={() => navigateTo('delivery')}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Track on Live GPS Map</span>
            </button>
            <button
              onClick={() => navigateTo('customer-portal')}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              View Order in Portal
            </button>
          </div>
        </div>
      ) : cart.length === 0 ? (
        /* Empty Cart State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
            🛒
          </div>
          <h2 className="text-xl font-black text-slate-900">Your basket is empty</h2>
          <p className="text-xs text-slate-500">
            Please add grocery items to your basket before checking out.
          </p>
          <button
            onClick={() => navigateTo('shop')}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
          >
            Browse Products
          </button>
        </div>
      ) : (
        /* Active Checkout Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Steps (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Step 1: Delivery Address */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Delivery Address</h3>
                    <p className="text-[11px] text-slate-400">Where should we deliver your fresh order?</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  {isEditingAddress ? 'Done Editing' : 'Edit Address'}
                </button>
              </div>

              {isEditingAddress ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Receiver Name</label>
                    <input
                      type="text"
                      value={addressData.recipientName}
                      onChange={(e) => setAddressData({ ...addressData, recipientName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={addressData.phone}
                      onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Street Address</label>
                    <input
                      type="text"
                      value={addressData.address}
                      onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Delivery Instructions</label>
                    <input
                      type="text"
                      value={addressData.notes}
                      onChange={(e) => setAddressData({ ...addressData, notes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                      placeholder="e.g. Leave with guard, ring doorbell"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{addressData.recipientName} • <span className="text-emerald-700 font-bold">{addressData.label}</span></span>
                    <span className="font-mono text-slate-500 font-normal">{addressData.phone}</span>
                  </div>
                  <p className="text-slate-600 font-medium">{addressData.address}, {addressData.city}</p>
                  {addressData.notes && (
                    <p className="text-[11px] text-slate-400 italic">Note: {addressData.notes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Delivery Slot */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Select Delivery Slot</h3>
                  <p className="text-[11px] text-slate-400">Choose 10-minute dispatch or a convenient time window</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { id: '⚡ Instant 10-15 Mins Express Delivery', label: '⚡ Instant Express (10-15 Mins)', tag: 'Fastest' },
                  { id: 'Today 2 PM - 4 PM', label: 'Today 2:00 PM - 4:00 PM', tag: 'Standard' },
                  { id: 'Today 6 PM - 8 PM', label: 'Today 6:00 PM - 8:00 PM', tag: 'Standard' },
                  { id: 'Tomorrow 9 AM - 11 AM', label: 'Tomorrow Morning 9:00 AM - 11:00 AM', tag: 'Standard' }
                ].map((slot) => (
                  <label
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedSlot === slot.id
                        ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="deliverySlotRadio"
                        checked={selectedSlot === slot.id}
                        onChange={() => {}}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{slot.label}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {slot.tag}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3: Payment Options (Complete Pakistani Payment Suite) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Choose Payment Method</h3>
                  <p className="text-[11px] text-slate-400">Cash on delivery, mobile wallets, online banking, and cards</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                {/* 1. Cash on Delivery (COD) */}
                <div
                  onClick={() => setSelectedPayment('cod')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedPayment === 'cod'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs font-bold text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Coins className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block text-slate-900">Cash on Delivery (COD)</span>
                    <span className="text-[11px] text-slate-500 font-normal">Pay cash or scan QR at your doorstep</span>
                  </div>
                </div>

                {/* 2. JazzCash */}
                <div
                  onClick={() => setSelectedPayment('jazzcash')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedPayment === 'jazzcash'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs font-bold text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black block text-slate-900">JazzCash</span>
                      <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">Mobile</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal">Instant OTP prompt on your mobile</span>

                    {selectedPayment === 'jazzcash' && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200">
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">JazzCash Mobile Account Number</label>
                        <input
                          type="text"
                          value={jazzcashPhone}
                          onChange={(e) => setJazzcashPhone(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono text-xs"
                          placeholder="0300-XXXXXXX"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. EasyPaisa */}
                <div
                  onClick={() => setSelectedPayment('easypaisa')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedPayment === 'easypaisa'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs font-bold text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black block text-slate-900">EasyPaisa</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Mobile</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal">Pay via EasyPaisa in-app approval</span>

                    {selectedPayment === 'easypaisa' && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200">
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">EasyPaisa Account Number</label>
                        <input
                          type="text"
                          value={easypaisaPhone}
                          onChange={(e) => setEasypaisaPhone(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono text-xs"
                          placeholder="0312-XXXXXXX"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. SadaPay */}
                <div
                  onClick={() => setSelectedPayment('sadapay')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedPayment === 'sadapay'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs font-bold text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black block text-slate-900">SadaPay</span>
                      <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-1.5 py-0.5 rounded">SadaBiz</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal">Send to SadaPay username or number</span>

                    {selectedPayment === 'sadapay' && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200">
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">SadaPay Username / Number</label>
                        <input
                          type="text"
                          value={sadapayAccount}
                          onChange={(e) => setSadapayAccount(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono text-xs"
                          placeholder="@username or 03XX-XXXXXXX"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. NayaPay */}
                <div
                  onClick={() => setSelectedPayment('nayapay')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedPayment === 'nayapay'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs font-bold text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black block text-slate-900">NayaPay</span>
                      <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.5 rounded">Wallet</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal">Pay directly via NayaPay ID</span>

                    {selectedPayment === 'nayapay' && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200">
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">NayaPay ID / Mobile</label>
                        <input
                          type="text"
                          value={nayapayAccount}
                          onChange={(e) => setNayapayAccount(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono text-xs"
                          placeholder="@nayapay_id or 03XX-XXXXXXX"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Direct Bank Transfer (Online Banking) */}
                <div
                  onClick={() => setSelectedPayment('bank')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 sm:col-span-2 ${
                    selectedPayment === 'bank'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs font-bold text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Landmark className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black block text-slate-900">Direct Bank Transfer (Online Banking)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">HBL • Meezan • Alfalah</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal">Transfer via IBAN / Raast and confirm instantly</span>

                    {selectedPayment === 'bank' && (
                      <div className="mt-3 p-3 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Bank Name:</span>
                            <span className="font-bold text-slate-900">Meezan Bank Ltd</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account Title:</span>
                            <span className="font-bold text-slate-900">FreshMart Retail Pvt Ltd</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account #:</span>
                            <span className="font-bold text-slate-900">0123-45678901234</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">IBAN:</span>
                            <span className="font-bold text-emerald-700">PK36MEZN0001234567890123</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block mb-1">Sender Bank & Name</label>
                            <input
                              type="text"
                              value={bankTransferDetails.senderAccountName}
                              onChange={(e) => setBankTransferDetails({ ...bankTransferDetails, senderAccountName: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                              placeholder="e.g. Aimen Yasin (HBL)"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block mb-1">Transaction Ref / ID</label>
                            <input
                              type="text"
                              value={bankTransferDetails.transactionId}
                              onChange={(e) => setBankTransferDetails({ ...bankTransferDetails, transactionId: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                              placeholder="e.g. TRX-984210"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 7. FreshMart Wallet */}
                <div
                  onClick={() => setSelectedPayment('wallet')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 sm:col-span-2 ${
                    selectedPayment === 'wallet'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs font-bold text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block text-slate-900">FreshMart Wallet</span>
                    <span className="text-[11px] text-slate-500 font-normal">Instant 1-Tap Pay (Wallet Balance: PKR 320)</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Step 4: Optional Delivery Tip */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <h4 className="text-xs font-black text-slate-900">Rider Appreciation Tip</h4>
                <p className="text-[11px] text-slate-400">100% of tip goes directly to your express courier.</p>
              </div>

              <div className="flex items-center gap-2">
                {[0, 50, 100, 200].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setRiderTip(amount)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      riderTip === amount
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {amount === 0 ? 'None' : `PKR ${amount}`}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary & Action (4 Columns) */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-sm text-slate-900">Order Summary ({cart.length} Items)</h3>
                <span className="text-xs font-bold text-emerald-700">{selectedSlot.split(' ')[0]}</span>
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                      />
                      <div className="space-y-0.5 max-w-[140px]">
                        <span className="font-bold text-slate-800 truncate block">{item.product.name}</span>
                        <span className="text-[10px] text-slate-400">{item.quantity}x • {item.unit || item.product.unit}</span>
                      </div>
                    </div>

                    <span className="font-black text-slate-900">
                      PKR {item.product.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Applied Coupon Tag */}
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-xl font-bold">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Coupon: {appliedCoupon.code}</span>
                  </span>
                  <span>-PKR {discountAmount}</span>
                </div>
              )}

              {/* Pricing Breakdown */}
              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Basket Subtotal</span>
                  <span className="font-semibold text-slate-800">PKR {cartSubtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Discount</span>
                    <span>-PKR {discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-800">
                    {deliveryCharges === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : `PKR ${deliveryCharges}`}
                  </span>
                </div>
                {riderTip > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Rider Tip</span>
                    <span className="font-semibold">PKR {riderTip}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-emerald-700 font-mono">PKR {grandTotalWithTip}</span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
                <span>Place Order • PKR {grandTotalWithTip}</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Guaranteed 10-Minute Fresh Delivery</span>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
