import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';
import { isSameTenant } from '../../data/companyHierarchyData';
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
    promotions,
    customerUser,
    addToast,
    placeCustomerOrder,
    currentTenant,
    currentBranch,
    getNearbyStores
  } = useStore();

  const isCaseValue = isSameTenant(currentTenant?.id, 'tenant-chasevalue');
  const isAlFatah = isSameTenant(currentTenant?.id, 'tenant-alfatah');
  const isChaseUp = isSameTenant(currentTenant?.id, 'tenant-chaseup');
  const isUnimaart = !isCaseValue && !isAlFatah && !isChaseUp;

  const nearbyInfo = React.useMemo(() => {
    if (typeof getNearbyStores === 'function') {
      const list = getNearbyStores(deliveryLocation?.coords || deliveryLocation);
      return list.find((s) => s.id === currentTenant?.id) || list[0];
    }
    return null;
  }, [getNearbyStores, deliveryLocation, currentTenant]);

  const theme = {
    primaryBg: isUnimaart
      ? 'bg-[#0284c7] hover:bg-[#0369a1]'
      : isCaseValue
      ? 'bg-[#5c3417] hover:bg-[#43230c]'
      : isAlFatah
      ? 'bg-[#991b1b] hover:bg-[#7f1d1d]'
      : isChaseUp
      ? 'bg-[#6b21a8] hover:bg-[#581c87]'
      : 'bg-[#0284c7] hover:bg-[#0369a1]',
    primaryText: isUnimaart
      ? 'text-[#0284c7]'
      : isCaseValue
      ? 'text-[#5c3417]'
      : isAlFatah
      ? 'text-[#991b1b]'
      : isChaseUp
      ? 'text-[#6b21a8]'
      : 'text-[#0284c7]',
    softBg: isUnimaart
      ? 'bg-sky-50 text-sky-800 border-sky-200'
      : isCaseValue
      ? 'bg-[#f4ebe0] text-[#5c3417] border-[#ebdcc7]'
      : isAlFatah
      ? 'bg-rose-50 text-rose-800 border-rose-200'
      : isChaseUp
      ? 'bg-purple-50 text-purple-800 border-purple-200'
      : 'bg-sky-50 text-sky-800 border-sky-200',
    accentColor: isUnimaart
      ? '#0284c7'
      : isCaseValue
      ? '#78350f'
      : isAlFatah
      ? '#991b1b'
      : isChaseUp
      ? '#6b21a8'
      : '#0284c7',
    iconGradient: isUnimaart
      ? 'from-[#0284c7] to-sky-400'
      : isCaseValue
      ? 'from-[#5c3417] to-amber-600'
      : isAlFatah
      ? 'from-[#991b1b] to-rose-600'
      : isChaseUp
      ? 'from-[#6b21a8] to-purple-500'
      : 'from-[#0284c7] to-sky-400',
    cardBorder: isUnimaart
      ? 'border-sky-100 shadow-sky-950/5'
      : isCaseValue
      ? 'border-[#ebdcc7] shadow-amber-950/5'
      : isAlFatah
      ? 'border-rose-100 shadow-rose-950/5'
      : isChaseUp
      ? 'border-purple-100 shadow-purple-950/5'
      : 'border-sky-100 shadow-sky-950/5',
    refBoxBg: isUnimaart
      ? 'bg-gradient-to-r from-sky-50 to-blue-50/60 border-sky-200/80'
      : isCaseValue
      ? 'bg-gradient-to-r from-[#fdfaf4] to-[#f4ebe0]/60 border-[#ebdcc7]'
      : isAlFatah
      ? 'bg-gradient-to-r from-rose-50 to-amber-50/50 border-rose-200/80'
      : isChaseUp
      ? 'bg-gradient-to-r from-purple-50 to-indigo-50/50 border-purple-200/80'
      : 'bg-gradient-to-r from-sky-50 to-blue-50/60 border-sky-200/80',
    refText: isUnimaart
      ? 'text-sky-800'
      : isCaseValue
      ? 'text-[#5c3417]'
      : isAlFatah
      ? 'text-rose-800'
      : isChaseUp
      ? 'text-purple-800'
      : 'text-sky-800',
    refIdText: isUnimaart
      ? 'text-sky-950'
      : isCaseValue
      ? 'text-[#3d2314]'
      : isAlFatah
      ? 'text-rose-950'
      : isChaseUp
      ? 'text-purple-950'
      : 'text-sky-950',
    badge: isUnimaart
      ? 'bg-sky-100 text-sky-800'
      : isCaseValue
      ? 'bg-[#f4ebe0] text-[#5c3417]'
      : isAlFatah
      ? 'bg-rose-100 text-rose-800'
      : isChaseUp
      ? 'bg-purple-100 text-purple-800'
      : 'bg-sky-100 text-sky-800',
    focusRing: isUnimaart
      ? 'focus:ring-sky-500 focus:border-sky-500'
      : isCaseValue
      ? 'focus:ring-[#5c3417] focus:border-[#5c3417]'
      : isAlFatah
      ? 'focus:ring-rose-500 focus:border-rose-500'
      : isChaseUp
      ? 'focus:ring-purple-500 focus:border-purple-500'
      : 'focus:ring-sky-500 focus:border-sky-500'
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState('⚡ Instant 10-15 Mins Express Delivery');
  const [selectedPayment, setSelectedPayment] = useState('card'); // 'card' | 'wallet_raast' | 'bank' | 'cod'
  const [riderTip, setRiderTip] = useState(0);
  const [isEcoFriendly, setIsEcoFriendly] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  const placedItemsList = React.useMemo(() => {
    if (!placedOrderDetails) return [];
    if (Array.isArray(placedOrderDetails.rawItems)) return placedOrderDetails.rawItems;
    if (Array.isArray(placedOrderDetails.orderItems)) return placedOrderDetails.orderItems;
    if (Array.isArray(placedOrderDetails.items)) return placedOrderDetails.items;
    return [];
  }, [placedOrderDetails]);

  const [addressData, setAddressData] = useState({
    recipientName: customerUser?.name || '',
    phone: customerUser?.phone || '',
    address: deliveryLocation.address || 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
    city: deliveryLocation.city || 'Faisalabad, Pakistan',
    notes: ''
  });

  useEffect(() => {
    if (deliveryLocation?.address) {
      setAddressData((prev) => ({
        ...prev,
        address: deliveryLocation.address,
        city: deliveryLocation.city || prev.city
      }));
    }
  }, [deliveryLocation]);

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

    // Infer tenant from cart items or active store
    const cartItemTenant = (cart || []).find((i) => {
      const p = i.product && typeof i.product === 'object' ? i.product : i;
      return p.tenantId || i.tenantId;
    });
    const cartProductTenantId = cartItemTenant?.product?.tenantId || cartItemTenant?.tenantId;
    const finalTenantId =
      currentTenant?.id ||
      cartProductTenantId ||
      'tenant-freshmart';

    const isOrderChaseValue = isSameTenant(finalTenantId, 'tenant-chasevalue');
    const isOrderChaseUp = isSameTenant(finalTenantId, 'tenant-chaseup');
    const isOrderAlfatah = isSameTenant(finalTenantId, 'tenant-alfatah');

    const orderPrefix = isOrderChaseValue ? '#CV' : isOrderChaseUp ? '#CU' : isOrderAlfatah ? '#AF' : '#FM';
    const orderId = orderPrefix + Math.floor(10000 + Math.random() * 90000);

    const cityOrAddr = `${addressData.address || ''} ${addressData.city || ''}`.toLowerCase();
    const isFaisalabad = cityOrAddr.includes('faisalabad') || cityOrAddr.includes('peoples colony') || cityOrAddr.includes('fsd');

    let resolvedBranchId = currentBranch?._id || currentBranch?.id || nearbyInfo?.nearestBranch?._id;
    let resolvedBranchName = currentBranch?.name || nearbyInfo?.nearestBranch?.name;

    if (!resolvedBranchId || (isOrderChaseValue && !resolvedBranchId.includes('cv')) || (isOrderChaseUp && !resolvedBranchId.includes('004') && !resolvedBranchId.includes('006')) || (isOrderAlfatah && !resolvedBranchId.includes('af'))) {
      if (isOrderChaseValue) {
        resolvedBranchId = isFaisalabad ? 'branch_cv_fsd' : 'branch_007';
        resolvedBranchName = isFaisalabad ? 'Wholesale Express Hub' : 'Shaheed-e-Millat Main Branch (Karachi)';
      } else if (isOrderChaseUp) {
        resolvedBranchId = isFaisalabad ? 'branch_006' : 'branch_004';
        resolvedBranchName = isFaisalabad ? 'Faisalabad Clock Tower Hub' : 'Clifton Main Branch (Karachi)';
      } else if (isOrderAlfatah) {
        resolvedBranchId = isFaisalabad ? 'branch_af_fsd' : 'branch_002';
        resolvedBranchName = isFaisalabad ? 'D-Ground Flagship Hub' : 'Gulberg Mall';
      } else {
        resolvedBranchId = isFaisalabad ? 'branch_um_fsd' : 'branch_010';
        resolvedBranchName = isFaisalabad ? 'Peoples Colony Dark Store' : 'Gulberg SuperHub';
      }
    }

    const resolvedTenantName =
      currentTenant?.displayName ||
      currentTenant?.name ||
      (isOrderChaseValue ? 'Case Value (Local Grocery)' :
       isOrderChaseUp ? 'Chase Up' :
       isOrderAlfatah ? 'Al-Fatah Supermarket' :
       'Unimaart (Market Store)');

    const orderItems = cart.map((i) => ({
      product: i.product?.id || i.product?._id,
      id: i.product?.id || i.product?._id,
      name: i.product?.name || 'Grocery Item',
      price: Number(i.product?.price || 0),
      quantity: Number(i.quantity || 1),
      unit: i.unit || i.product?.unit || '1 unit',
      image: i.product?.image || '',
      vendorId: i.product?.vendorId || 'VND-101',
      tenantId: i.product?.tenantId || i.tenantId || finalTenantId,
      branchId: resolvedBranchId || 'branch_um_fsd'
    }));

    const orderPayload = {
      id: orderId,
      orderId,
      orderItems,
      rawItems: orderItems,
      items: orderItems,
      subtotal: cartSubtotal,
      deliveryCharges,
      discountAmount,
      riderTip,
      isEcoFriendly,
      totalAmount: grandTotalWithTip,
      totalPrice: grandTotalWithTip,
      paymentMethod: selectedPayment.toUpperCase().replace('_', ' / '),
      deliverySlot: selectedSlot,
      shippingAddress: {
        address: addressData.address,
        city: addressData.city,
        deliverySlot: selectedSlot
      },
      address: `${addressData.address}, ${addressData.city}`,
      city: addressData.city,
      customerName: addressData.recipientName,
      recipientName: addressData.recipientName,
      customerPhone: addressData.phone,
      phone: addressData.phone,
      tenantId: finalTenantId,
      tenantName: resolvedTenantName,
      branchId: resolvedBranchId || 'branch_cv_fsd',
      branchName: resolvedBranchName || 'Wholesale Express Hub',
      distanceKm: nearbyInfo?.distanceKm || 1.2,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    let resultOrder = orderPayload;
    if (placeCustomerOrder) {
      resultOrder = (await placeCustomerOrder(orderPayload)) || orderPayload;
    } else {
      clearCart();
    }

    setPlacedOrderDetails(resultOrder);
    setIsOrderPlaced(true);

    try {
      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    addToast('Order Placed Successfully! 🎉', `Order ${resultOrder.id || orderId} has been confirmed and is being prepared.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header & Stepper */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1">
            <span className="hover:opacity-80 cursor-pointer" onClick={() => navigateTo('home')}>Home</span>
            <span>/</span>
            <span className="hover:opacity-80 cursor-pointer" onClick={() => navigateTo('shop')}>Shop</span>
            <span>/</span>
            <span className={`${theme.primaryText} font-bold`}>Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Checkout
          </h1>
        </div>

        {/* 2-Step Stepper Progress */}
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          {[
            { num: 1, label: 'Address' },
            { num: 2, label: 'Payment' }
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
                        ? `${theme.primaryBg} text-white shadow-xs`
                        : isCurrent
                        ? `bg-slate-900 text-white ring-2 ring-slate-800 ring-offset-1`
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-bold hidden sm:inline ${
                      isCurrent ? 'text-slate-900 font-black' : isCompleted ? theme.primaryText : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                {idx < 1 && (
                  <div
                    className={`w-4 sm:w-8 h-0.5 rounded-full transition-all ${
                      currentStep > idx + 1 || isOrderPlaced ? theme.primaryBg.split(' ')[0] : 'bg-slate-200'
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
        /* ORDER SUCCESS CELEBRATION SCREEN (Compact, Responsive & Theme-Branded)    */
        /* ========================================================================= */
        <div className={`bg-white rounded-3xl p-5 sm:p-6 border ${theme.cardBorder} shadow-xl text-center max-w-lg mx-auto space-y-4 animate-in zoom-in-95 duration-300`}>
          
          {/* Animated Celebration Icon */}
          <div className="relative w-14 h-14 mx-auto">
            <div className={`w-14 h-14 bg-gradient-to-tr ${theme.iconGradient} text-white rounded-2xl flex items-center justify-center shadow-lg rotate-2 transform hover:rotate-0 transition-transform`}>
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -top-1 -right-2 bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs animate-pulse">
              Confirmed
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Order Confirmed & In Transit! 🚀
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your grocery basket has been packed in temperature-controlled boxes and handed to our express rider.
            </p>
          </div>

          {/* Order Reference Box */}
          <div className={`${theme.refBoxBg} p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between`}>
            <div className="text-left">
              <span className={`text-[10px] uppercase font-bold ${theme.refText} tracking-wider block`}>
                Order Reference Number
              </span>
              <span className={`font-mono font-black text-base sm:text-lg ${theme.refIdText}`}>
                {placedOrderDetails?.id}
              </span>
            </div>
            <button
              onClick={() => handleCopyOrderId(placedOrderDetails?.id)}
              className={`px-2.5 py-1.5 bg-white hover:opacity-90 ${theme.refText} rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs`}
            >
              {copiedOrderId ? <Check className={`w-3.5 h-3.5 ${theme.primaryText}`} /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedOrderId ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          {/* ETA Live Timeline Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Clock className={`w-4 h-4 ${theme.primaryText} animate-spin`} style={{ animationDuration: '6s' }} />
                <span>
                  Estimated Arrival: <strong className={theme.primaryText}>10-14 Minutes</strong>
                </span>
              </div>
              <span className={`text-[10px] font-bold ${theme.badge} px-2 py-0.5 rounded-full`}>
                Express Courier
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-200/60 pt-2.5">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 shrink-0">Destination Address:</span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[240px]">
                  {placedOrderDetails?.address}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 shrink-0">Receiver:</span>
                <span className="font-bold text-slate-800 truncate">
                  {placedOrderDetails?.recipientName || 'Valued Customer'}{' '}
                  {placedOrderDetails?.phone ? `(${placedOrderDetails.phone})` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 shrink-0">Payment Gateway:</span>
                <span className={`font-bold ${theme.primaryText}`}>
                  {placedOrderDetails?.paymentMethod || 'COD'}
                </span>
              </div>

              {/* Ordered Items Preview */}
              {placedItemsList.length > 0 && (
                <div className="border-t border-slate-200/60 pt-3 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Items in This Order ({placedItemsList.length})
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {placedItemsList.reduce((s, i) => s + (Number(i.quantity) || 1), 0)} units total
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                    {placedItemsList.map((it, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {it.image && (
                            <img
                              src={it.image}
                              alt={it.name || 'Product'}
                              className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate leading-tight">{it.name || 'Product'}</p>
                            <p className="text-[10px] text-slate-400">{it.quantity || 1}x • {it.unit || 'pack'}</p>
                          </div>
                        </div>
                        <span className="font-bold font-mono text-slate-900 shrink-0">
                          {currency.symbol}{(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center font-black text-sm pt-2 border-t border-slate-200 text-slate-900">
                <span>Total Amount Paid:</span>
                <span className={`${theme.primaryText} font-mono`}>
                  {currency.symbol}{placedOrderDetails?.totalAmount?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              onClick={() => navigateTo('delivery')}
              className={`flex-1 py-3 ${theme.primaryBg} text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-2`}
            >
              <Truck className="w-4 h-4" />
              <span>Track Courier on Live GPS Map</span>
            </button>
            <button
              onClick={() => navigateTo('customer-portal')}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>View Order in Customer Portal</span>
            </button>
          </div>

        </div>
      ) : cart.length === 0 ? (
        /* Empty Cart State */
        <div className={`bg-white rounded-3xl p-12 text-center border ${theme.cardBorder} shadow-sm max-w-lg mx-auto space-y-4`}>
          <div className={`w-20 h-20 rounded-full ${theme.badge} flex items-center justify-center mx-auto text-4xl shadow-inner`}>
            🛒
          </div>
          <h2 className="text-2xl font-black text-slate-900">Your basket is empty</h2>
          <p className="text-xs text-slate-500">
            Please add farm-fresh produce and groceries to your basket before checking out.
          </p>
          <button
            onClick={() => navigateTo('shop')}
            className={`px-8 py-3.5 ${theme.primaryBg} text-white font-black rounded-2xl text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2`}
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
            
            {/* Mobile / Tablet Quick Items Summary (Visible on small screens where right column is below) */}
            {Array.isArray(cart) && cart.length > 0 && (
              <div className="lg:hidden bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className={`w-4 h-4 ${theme.primaryText}`} />
                    <h3 className="font-black text-xs text-slate-900">
                      Selected Items ({cart.length})
                    </h3>
                  </div>
                  <span className={`text-xs font-black ${theme.badge} px-2.5 py-0.5 rounded-full font-mono`}>
                    {currency.symbol}{grandTotalWithTip.toLocaleString()}
                  </span>
                </div>
                
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.product?.image && (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-9 h-9 rounded-lg object-cover bg-slate-50 border border-slate-100 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 truncate block text-[11px]">{item.product?.name}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {item.quantity}x • {item.unit || item.product?.unit || 'pack'}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0 font-mono text-[11px]">
                        {currency.symbol}{((item.product?.price || 0) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Delivery Address */}
            <div className={`bg-white rounded-3xl p-6 sm:p-8 border ${theme.cardBorder} shadow-xl space-y-5`}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl ${theme.badge} flex items-center justify-center font-black text-xs shadow-xs`}>
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Delivery Address</h3>
                    <p className="text-[11px] text-slate-400">Enter recipient details and drop-off location</p>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 text-xs font-bold ${theme.softBg} px-3 py-1 rounded-full border`}>
                  <MapPin className={`w-3.5 h-3.5 ${theme.primaryText}`} />
                  <span>Doorstep Delivery</span>
                </div>
              </div>

              {/* Fulfilling Store & Branch Routing Banner */}
              <div className={`${theme.refBoxBg} rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}>
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: currentTenant?.color || '#0284c7' }}
                    className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0"
                  >
                    {currentTenant?.logo || '🏬'}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 leading-tight">
                      Fulfilling Store: {currentTenant?.displayName || currentTenant?.name} — {currentBranch?.name || nearbyInfo?.nearestBranch?.name || 'Central Hub'}
                    </h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Branch Distance: <strong className={theme.primaryText}>{nearbyInfo?.distanceFormatted || '1.2 km'} away</strong> • Estimated Delivery: <strong className="text-slate-800">{nearbyInfo?.estimatedTime || '20-30 mins'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 bg-white border ${theme.cardBorder} rounded-lg ${theme.primaryText} font-extrabold text-[10px] shadow-2xs`}>
                    🟢 In Delivery Zone
                  </span>
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
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:bg-white focus:ring-2 ${theme.focusRing} focus:outline-none transition-all`}
                    placeholder="e.g. Your Name"
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
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:bg-white focus:ring-2 ${theme.focusRing} focus:outline-none transition-all font-mono`}
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
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:bg-white focus:ring-2 ${theme.focusRing} focus:outline-none transition-all`}
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
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:bg-white focus:ring-2 ${theme.focusRing} focus:outline-none transition-all`}
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

          </div>

          {/* Right Column: Order Summary Sticky Panel (4 Columns) */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            
            <div className={`bg-white rounded-3xl p-6 sm:p-7 border ${theme.cardBorder} shadow-xl space-y-5`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-sm text-slate-900">
                  Order Summary <span className="text-slate-400 font-normal">({cart.length} items)</span>
                </h3>
                <span className={`text-xs font-black ${theme.badge} px-2.5 py-1 rounded-full`}>
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
                      placeholder="Promo Code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className={`w-full text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2 py-2.5 focus:bg-white focus:outline-none focus:ring-2 ${theme.focusRing}`}
                    />
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="submit"
                    className={`px-4 py-2.5 ${theme.primaryBg} text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs`}
                  >
                    Apply
                  </button>
                </form>

                {/* Applied Coupon Display */}
                {appliedCoupon ? (
                  <div className={`flex items-center justify-between text-xs ${theme.softBg} p-2.5 rounded-xl font-bold border animate-in fade-in`}>
                    <div className="flex items-center gap-2">
                      <Sparkles className={`w-4 h-4 ${theme.primaryText} shrink-0`} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono block">{appliedCoupon.code}</span>
                          <span className={`text-[9px] font-black uppercase ${theme.primaryBg} text-white px-1.5 py-0.5 rounded-md`}>
                            {appliedCoupon.isAutoApplied ? 'Auto-Applied' : 'Active'}
                          </span>
                        </div>
                        <span className={`text-[10px] ${theme.primaryText} font-normal block`}>{appliedCoupon.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-black ${theme.primaryText} shrink-0`}>-{currency.symbol}{discountAmount.toLocaleString()}</span>
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
                  promotions && promotions.filter(p => p.status === 'Active').length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <span className="text-slate-400 font-bold">Try:</span>
                      {promotions
                        .filter(p => p.status === 'Active')
                        .slice(0, 3)
                        .map((p) => (
                          <button
                            key={p.code}
                            type="button"
                            onClick={() => applyCouponCode(p.code)}
                            className={`px-2 py-0.5 bg-slate-100 hover:${theme.softBg} text-slate-700 rounded-md font-mono font-bold transition-colors cursor-pointer`}
                          >
                            {p.code}
                          </button>
                        ))}
                    </div>
                  )
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
                      <span className={`text-xs font-black ${theme.badge} px-2 py-0.5 rounded`}>FREE</span>
                    ) : (
                      `${currency.symbol}${deliveryCharges}`
                    )}
                  </span>
                </div>

                {riderTip > 0 && (
                  <div className={`flex justify-between ${theme.primaryText} font-bold`}>
                    <span>Rider Tip</span>
                    <span className="font-mono">+{currency.symbol}{riderTip.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className={`${theme.primaryText} font-mono text-lg`}>{currency.symbol}{grandTotalWithTip.toLocaleString()}</span>
                </div>
              </div>

              {/* Big Shimmering CTA Button */}
              <button
                onClick={handlePlaceOrder}
                className={`w-full py-4 ${theme.primaryBg} text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-0.5`}
              >
                <ShieldCheck className="w-5 h-5 opacity-80" />
                <span>Place Order • {currency.symbol}{grandTotalWithTip.toLocaleString()}</span>
              </button>

              {/* Safety Badges */}
              <div className="space-y-2 pt-2 text-[11px] text-slate-400">
                <div className={`flex items-center justify-center gap-1.5 font-semibold ${theme.softBg} p-2 rounded-xl border`}>
                  <ShieldCheck className={`w-4 h-4 ${theme.primaryText} shrink-0`} />
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
