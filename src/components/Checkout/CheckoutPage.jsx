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
  Copy,
  Home,
  Building,
  Navigation,
  Leaf,
  Heart,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';
import { PaymentMethodCard } from './PaymentMethodCard';

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
    applyCouponCode,
    removeCouponCode,
    addToast,
    placeCustomerOrder,
    customerUser
  } = useStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState('⚡ Instant 10-15 Mins Express Delivery');
  const [selectedPayment, setSelectedPayment] = useState('card'); // 'card' | 'wallet_raast' | 'bank' | 'cod'
  const [riderTip, setRiderTip] = useState(50);
  const [isEcoFriendly, setIsEcoFriendly] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Direct Address State
  const [addressData, setAddressData] = useState({
    recipientName: customerUser?.name || 'Hafsa',
    phone: customerUser?.phone || '0300-1234567',
    address: deliveryLocation.address || 'House 12, Street 4, Sector B, Johar Town, Lahore',
    city: deliveryLocation.city || 'Lahore, Pakistan',
    notes: 'Please ring bell and leave package at doorstep.'
  });

  const grandTotalWithTip = cartTotal + riderTip;

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const ok = await applyCouponCode(couponInput.trim());
    if (ok) setCouponInput('');
  };

  const handleCopyOrderId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedOrderId(true);
    addToast('Copied Order ID! 📋', `Order ID ${id} copied to clipboard.`);
    setTimeout(() => setCopiedOrderId(false), 3000);
  };

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
        unit: i.unit || i.product.unit,
        image: i.product.image
      })),
      subtotal: cartSubtotal,
      deliveryCharges,
      discountAmount,
      riderTip,
      isEcoFriendly,
      totalAmount: grandTotalWithTip,
      paymentMethod: selectedPayment.toUpperCase().replace('_', ' / '),
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
        particleCount: 180,
        spread: 100,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    addToast('Order Placed Successfully! 🎉', `Order ${orderId} confirmed for 10-minute dispatch.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header & Stepper */}
      <div className="bg-gradient-to-r from-[#eef9f2] via-white to-[#f7faf8] rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1">
            <span className="hover:text-emerald-700 cursor-pointer" onClick={() => navigateTo('home')}>Home</span>
            <span>/</span>
            <span className="hover:text-emerald-700 cursor-pointer" onClick={() => navigateTo('shop')}>Shop</span>
            <span>/</span>
            <span className="text-emerald-700 font-bold">Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Express Checkout</span>
            <span className="text-xs bg-emerald-600 text-white font-bold px-3 py-1 rounded-full uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-lime-300" />
              <span>10-Min Fast Dispatch</span>
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Zero contact delivery, farm-fresh cold storage packaging, and 100% money-back guarantee.
          </p>
        </div>

        {/* 3-Step Stepper Progress */}
        <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          {[
            { num: 1, label: 'Address' },
            { num: 2, label: 'Payment' },
            { num: 3, label: 'Preferences' }
          ].map((s, idx) => {
            const isCompleted = isOrderPlaced || currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <React.Fragment key={s.num}>
                <div
                  onClick={() => !isOrderPlaced && setCurrentStep(s.num)}
                  className="flex items-center gap-1.5 cursor-pointer group"
                  title={`Step ${s.num}: ${s.label}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-emerald-950 text-white ring-2 ring-emerald-500 ring-offset-1'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-bold hidden sm:inline ${
                      isCurrent ? 'text-slate-900 font-black' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                {idx < 2 && (
                  <div
                    className={`w-4 sm:w-8 h-0.5 rounded-full transition-all ${
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
        /* ========================================================================= */
        /* ORDER SUCCESS CELEBRATION SCREEN                                          */
        /* ========================================================================= */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-100 shadow-2xl shadow-emerald-950/10 text-center max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
          
          {/* Animated Celebration Icon */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-600 to-teal-400 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-900/30 rotate-3 transform hover:rotate-0 transition-transform">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md animate-pulse">
              Confirmed
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Order Confirmed & In Transit! 🚀
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Your grocery basket has been packed in temperature-controlled boxes and handed to our express rider.
            </p>
          </div>

          {/* Order Reference Box */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50/60 p-4 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Order Reference Number</span>
              <span className="font-mono font-black text-lg text-emerald-950">{placedOrderDetails?.id}</span>
            </div>
            <button
              onClick={() => handleCopyOrderId(placedOrderDetails?.id)}
              className="px-3 py-1.5 bg-white hover:bg-emerald-100/70 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedOrderId ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          {/* ETA Live Timeline Box */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 text-left space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Clock className="w-4 h-4 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Estimated Arrival: <strong className="text-emerald-700">10-14 Minutes</strong></span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Express Courier
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-200/60 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Destination Address:</span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[220px]">{placedOrderDetails?.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Receiver:</span>
                <span className="font-bold text-slate-800">{placedOrderDetails?.recipientName} ({placedOrderDetails?.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="font-bold text-emerald-800">{placedOrderDetails?.paymentMethod}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-200 text-slate-900">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-700 font-mono">{currency.symbol}{placedOrderDetails?.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigateTo('delivery')}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-emerald-900/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Track Courier on Live GPS Map</span>
            </button>
            <button
              onClick={() => navigateTo('customer-portal')}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>View Order in Customer Portal</span>
            </button>
          </div>

        </div>
      ) : cart.length === 0 ? (
        /* Empty Cart State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-4xl shadow-inner">
            🛒
          </div>
          <h2 className="text-2xl font-black text-slate-900">Your basket is empty</h2>
          <p className="text-xs text-slate-500">
            Please add farm-fresh produce and groceries to your basket before checking out.
          </p>
          <button
            onClick={() => navigateTo('shop')}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md shadow-emerald-900/20 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Browse Products</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Active Checkout Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Steps (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Step 1: Delivery Address */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-emerald-950/5 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shadow-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Delivery Address</h3>
                    <p className="text-[11px] text-slate-400">Enter recipient details and drop-off location</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Doorstep Delivery</span>
                </div>
              </div>

              {/* Direct Address Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    Receiver Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressData.recipientName}
                    onChange={(e) => setAddressData({ ...addressData, recipientName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="e.g. Hafsa"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressData.phone}
                    onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all font-mono"
                    placeholder="e.g. 0300-1234567"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1.5">
                    Full Delivery Address (Street, House/Flat No, Area) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressData.address}
                    onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="e.g. House 12, Street 4, Sector B, Johar Town, Lahore"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1.5">
                    Delivery Instructions / Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressData.notes}
                    onChange={(e) => setAddressData({ ...addressData, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="e.g. Near Emporium Mall, ring doorbell upon arrival"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Gateway */}
            <PaymentMethodCard
              selectedPayment={selectedPayment}
              setSelectedPayment={setSelectedPayment}
            />

            {/* Step 3: Eco Packaging & Rider Tip */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-emerald-950/5 space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shadow-xs">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Preferences & Courier Appreciation</h3>
                  <p className="text-[11px] text-slate-400">Customize packaging and support our delivery partners</p>
                </div>
              </div>

              {/* Eco Packaging Toggle */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950">100% Eco-Friendly Biodegradable Packaging</h4>
                    <p className="text-[11px] text-emerald-800">Use zero-plastic paper totes and chilled ice-pads that are recyclable.</p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isEcoFriendly}
                  onChange={(e) => setIsEcoFriendly(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Rider Tip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="space-y-0.5 text-center sm:text-left">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>Rider Appreciation Tip</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">100% of tips go directly into your courier's pocket.</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {[0, 50, 100, 200, 500].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setRiderTip(amount)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        riderTip === amount
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500 ring-offset-1'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {amount === 0 ? 'No Tip' : `${currency.symbol}${amount}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary Sticky Panel (4 Columns) */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xl shadow-emerald-950/5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-sm text-slate-900">
                  Order Summary <span className="text-slate-400 font-normal">({cart.length} items)</span>
                </h3>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {currency.symbol}{grandTotalWithTip.toLocaleString()}
                </span>
              </div>

              {/* Items List Preview */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-11 h-11 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 truncate block">{item.product.name}</span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {item.quantity}x • {item.unit || item.product.unit || 'pack'}
                        </span>
                      </div>
                    </div>

                    <span className="font-black text-slate-900 shrink-0 font-mono">
                      {currency.symbol}{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Code Box */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Promo Code (WELCOME20)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    Apply
                  </button>
                </form>

                {/* Applied Coupon Display */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 p-2.5 rounded-xl font-bold">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-mono block">{appliedCoupon.code}</span>
                        <span className="text-[10px] text-emerald-700 font-normal">{appliedCoupon.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-emerald-800">-{currency.symbol}{discountAmount.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={removeCouponCode}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        title="Remove coupon"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    <span className="text-slate-400 font-bold">Try:</span>
                    {['WELCOME20', 'FRESH15', 'FLASH30'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => applyCouponCode(c)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-md font-mono font-bold transition-colors cursor-pointer"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed Bill Breakdown */}
              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Basket Subtotal</span>
                  <span className="font-bold text-slate-800 font-mono">{currency.symbol}{cartSubtotal.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Coupon Discount</span>
                    <span className="font-mono">-{currency.symbol}{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-slate-800">
                    {deliveryCharges === 0 ? (
                      <span className="text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded">FREE</span>
                    ) : (
                      `${currency.symbol}${deliveryCharges}`
                    )}
                  </span>
                </div>

                {riderTip > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Rider Tip</span>
                    <span className="font-mono">+{currency.symbol}{riderTip.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-emerald-700 font-mono text-lg">{currency.symbol}{grandTotalWithTip.toLocaleString()}</span>
                </div>
              </div>

              {/* Big Shimmering CTA Button */}
              <button
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/25 hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
                <span>Place Order • {currency.symbol}{grandTotalWithTip.toLocaleString()}</span>
              </button>

              {/* Safety Badges */}
              <div className="space-y-2 pt-2 text-[11px] text-slate-400">
                <div className="flex items-center justify-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50/60 p-2 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Quality & Freshness Money-Back Guarantee</span>
                </div>
                <p className="text-center text-[10px] text-slate-400">
                  By clicking Place Order you agree to FreshMart terms of service and delivery policy.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
