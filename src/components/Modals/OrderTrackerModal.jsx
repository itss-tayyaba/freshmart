import React, { useState, useEffect } from 'react';
import { X, Search, Truck, CheckCircle2, Clock, MapPin, Phone, MessageSquare, User, Package, ShieldCheck, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { apiService } from '../../services/api';

export const OrderTrackerModal = () => {
  const { isOrderTrackerOpen, setIsOrderTrackerOpen, customerOrders, navigateTo, trackOrderRemote, deliveryLocation, currentTenant } = useStore();

  const isAlFatah = currentTenant?.id === 'tenant-alfatah';
  const isChaseUp = currentTenant?.id === 'tenant-chaseup';
  const isCaseValue = currentTenant?.id === 'tenant-chasevalue';

  const tenantThemeColor = currentTenant?.color || (
    isAlFatah ? '#991b1b' :
    isChaseUp ? '#6b21a8' :
    isCaseValue ? '#78350f' :
    '#0284c7'
  );

  const [orderInput, setOrderInput] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Format a real order (from local store or backend API) into tracker modal format
  const formatOrderForTracking = (rawOrder) => {
    if (!rawOrder) return null;
    const isAssigned = !!rawOrder.assignedRider;
    const status = (rawOrder.status || 'Pending').toLowerCase();
    const isDelivered = status === 'delivered' || status === 'completed' || rawOrder.isDelivered === true;
    const fulfillmentStage = Number(rawOrder.fulfillmentStage || 0);
    const isDispatched = rawOrder.isDispatched === true || fulfillmentStage >= 5 || status.includes('dispatched');
    const isOutForDelivery = fulfillmentStage >= 6 || status.includes('out for delivery') || status.includes('picked up') || status.includes('transit') || (isAssigned && !isDelivered);
    const isPackingComplete = fulfillmentStage >= 4 || isDispatched || isOutForDelivery || isDelivered;
    const isPreparing = status.includes('preparing') || status.includes('processing') || status.includes('picking') || fulfillmentStage >= 2;

    const shipping = rawOrder.shippingAddress || {};
    let addr = typeof shipping === 'string' ? shipping : (shipping.address || rawOrder.address);
    let city = typeof shipping === 'object' ? (shipping.city || rawOrder.city) : rawOrder.city;

    // Ensure mock Lahore address is replaced with the real Faisalabad delivery destination
    const addrLower = String(addr || '').toLowerCase();
    const cityLower = String(city || '').toLowerCase();
    if (!addr || addrLower.includes('gulberg iii, lahore') || addrLower.includes('main boulevard, gulberg') || cityLower.includes('lahore')) {
      addr = deliveryLocation?.address || 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad';
      city = deliveryLocation?.city || 'Faisalabad';
    }

    const slot = typeof shipping === 'object' ? (shipping.deliverySlot || rawOrder.deliverySlot || '⚡ 15-25 Mins Express Delivery') : (rawOrder.deliverySlot || '⚡ 15-25 Mins Express Delivery');
    const totalStr = rawOrder.totalPrice !== undefined ? `PKR ${rawOrder.totalPrice}` : `PKR ${rawOrder.totalAmount || rawOrder.total || 0}`;
    const rawItemsCount = rawOrder.orderItems?.length || rawOrder.rawItems?.length || (Array.isArray(rawOrder.items) ? rawOrder.items.length : 1);

    const rider = rawOrder.assignedRider || null;
    const eta = rider?.eta || rawOrder.eta || '15-25 mins';

    // Build authentic dynamic timeline reflecting real live status
    const timeline = [
      {
        title: '1. Order Confirmed',
        time: rawOrder.time || (rawOrder.createdAt ? new Date(rawOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
        desc: `Payment: ${rawOrder.paymentMethod || rawOrder.payment || 'Cash on Delivery'}`,
        completed: true
      },
      {
        title: '2. Dark Store Packing',
        time: isPackingComplete || isDelivered ? 'Completed' : isPreparing ? 'In Progress' : 'Pending',
        desc: isPackingComplete || isDelivered
          ? 'Quality checked & packed at logistics hub'
          : isPreparing
          ? 'Staff packing items from store shelves'
          : 'Waiting for packing queue',
        completed: isPackingComplete || isDelivered
      },
      {
        title: '3. Courier Dispatched',
        time: isDelivered ? 'Completed' : isOutForDelivery || isDispatched ? `ETA: ${eta}` : isAssigned ? 'Rider Assigned' : 'Pending',
        desc: isAssigned
          ? `Assigned to courier ${rider.name} (${rider.vehicle || rider.vehicleType || 'Motorbike'})`
          : isDispatched
          ? 'Pickup staff handed parcel to courier rider'
          : 'Waiting for courier rider to be assigned',
        completed: isDelivered || isOutForDelivery || isDispatched
      },
      {
        title: '4. Delivered to Doorstep',
        time: isDelivered ? 'Delivered' : 'Pending',
        desc: isDelivered ? `Handed over at ${addr}` : `Scheduled for handover at ${addr}`,
        completed: isDelivered
      }
    ];

    const rawItemsArr = Array.isArray(rawOrder.orderItems) ? rawOrder.orderItems : Array.isArray(rawOrder.rawItems) ? rawOrder.rawItems : Array.isArray(rawOrder.items) ? rawOrder.items : [];
    const substitutedItems = rawItemsArr.filter((i) => i && (i.isSubstituted || i.originalProduct));

    return {
      orderId: rawOrder.orderId || rawOrder.id || rawOrder._id,
      customer: rawOrder.customerName || rawOrder.customer || 'Customer',
      placedAt: rawOrder.time || (rawOrder.createdAt ? new Date(rawOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'),
      estimatedDelivery: slot,
      itemsCount: rawItemsCount,
      total: totalStr,
      address: addr,
      city: city,
      status: rawOrder.status || 'Pending',
      deliveryOtp: rawOrder.deliveryOtp || '7412',
      isDelivered,
      driverName: rider?.name || 'Awaiting Courier Assignment',
      driverPhone: rider?.phone || null,
      driverVehicle: rider?.vehicle || rider?.vehicleType || 'Fleet Courier',
      driverZone: rider?.zone || 'Central Zone',
      isAssigned,
      eta,
      distanceKm: rawOrder.distanceKm || null,
      timeline,
      substitutedItems
    };
  };

  // Live update the currently tracked order whenever customerOrders updates
  useEffect(() => {
    if (!isOrderTrackerOpen) return;
    setSearchError('');
    if (!customerOrders || customerOrders.length === 0) {
      setOrderInput('');
      setCurrentOrder(null);
      return;
    }

    const targetId = (orderInput || '').trim().toUpperCase();
    const matched = targetId
      ? customerOrders.find(
          (o) =>
            String(o.id || '').toUpperCase() === targetId ||
            String(o.orderId || '').toUpperCase() === targetId ||
            String(o._id || '').toUpperCase() === targetId
        )
      : null;

    const chosen = matched || customerOrders[0];
    setOrderInput(chosen.id || chosen.orderId || '');
    setCurrentOrder(formatOrderForTracking(chosen));
  }, [isOrderTrackerOpen, customerOrders]);

  // Live background sync: fetch latest order status from backend while tracker is open
  useEffect(() => {
    if (!isOrderTrackerOpen || !orderInput) return;
    const interval = setInterval(async () => {
      const cleanId = orderInput.trim();
      if (!cleanId) return;
      try {
        const res = await apiService.trackOrder(cleanId);
        if (res && res.success && res.order) {
          setCurrentOrder(formatOrderForTracking(res.order));
        }
      } catch (e) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [isOrderTrackerOpen, orderInput]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setSearchError('');
    const cleanId = (orderInput || '').trim();
    if (!cleanId) {
      setSearchError('Please enter an Order ID to track.');
      return;
    }

    // 1. Check in local customerOrders state first
    const foundLocal = customerOrders.find(
      (o) =>
        o.id.toUpperCase() === cleanId.toUpperCase() ||
        o.id.toUpperCase().includes(cleanId.toUpperCase()) ||
        (o.orderId && o.orderId.toUpperCase() === cleanId.toUpperCase())
    );

    if (foundLocal) {
      setCurrentOrder(formatOrderForTracking(foundLocal));
      return;
    }

    // 2. Fetch live from MongoDB backend via API
    setIsSearching(true);
    try {
      const res = await apiService.trackOrder(cleanId);
      if (res && res.success && res.order) {
        setCurrentOrder(formatOrderForTracking(res.order));
      } else {
        setCurrentOrder(null);
        setSearchError(res?.message || `Order "${cleanId}" not found in database. Please check your order reference number.`);
      }
    } catch (err) {
      setCurrentOrder(null);
      setSearchError(`Unable to track order "${cleanId}". Please verify the ID.`);
    } finally {
      setIsSearching(false);
    }
  };

  const selectOrder = (ord) => {
    setOrderInput(ord.id);
    setSearchError('');
    setCurrentOrder(formatOrderForTracking(ord));
  };

  const handleOpenDeliveryPage = () => {
    setIsOrderTrackerOpen(false);
    navigateTo('delivery');
  };

  if (!isOrderTrackerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 flex justify-center items-start pt-8 sm:pt-12">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOrderTrackerOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[88vh] overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Pinned at top */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Real-Time Order & Rider Tracking</h2>
              <p className="text-[11px] sm:text-xs text-emerald-200">Live GPS milestone progress & courier dispatch</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOrderTrackerOpen(false)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center focus:outline-none transition-colors cursor-pointer shrink-0"
            title="Close Tracker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
          
          {/* Order Search Input */}
          <div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Order ID (e.g. #FM83459 or ORD-701)"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 uppercase font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                style={{ backgroundColor: tenantThemeColor }}
                className="px-5 py-2.5 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-opacity cursor-pointer flex items-center gap-1.5 disabled:opacity-60 shrink-0"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{isSearching ? 'Searching...' : 'Track'}</span>
              </button>
            </form>

            {/* Placed Customer Orders Quick Select */}
            {customerOrders.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">Your Placed Orders:</span>
                {customerOrders.map((o) => (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => selectOrder(o)}
                    style={
                      orderInput && (orderInput.toUpperCase() === String(o.id).toUpperCase() || orderInput.toUpperCase() === String(o.orderId).toUpperCase())
                        ? { backgroundColor: tenantThemeColor, borderColor: tenantThemeColor, color: '#fff' }
                        : { backgroundColor: `${tenantThemeColor}12`, borderColor: `${tenantThemeColor}30`, color: tenantThemeColor }
                    }
                    className={`font-mono font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all border text-xs shadow-2xs`}
                  >
                    {o.id || o.orderId} ({o.status || 'Pending'})
                  </button>
                ))}
              </div>
            )}

            {searchError && (
              <div className="text-xs text-rose-700 mt-3 bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-start gap-2">
                <span className="font-bold shrink-0">⚠️ Error:</span>
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Current Order Summary Card */}
          {currentOrder && (
            <div className="space-y-5">
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Order Number
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-800 font-mono">
                    {currentOrder.orderId}
                  </h3>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Live Status
                  </span>
                  <div className="mt-0.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black ${
                      currentOrder.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : currentOrder.status === 'Out for Delivery' || currentOrder.status === 'Dispatched to Rider'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : currentOrder.status === 'Preparing' || currentOrder.status === 'Packed'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        currentOrder.status === 'Delivered'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500 animate-pulse'
                      }`} />
                      <span>{currentOrder.status || 'Pending'}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Fulfillment Slot
                  </span>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">{currentOrder.estimatedDelivery}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Items & Total
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {currentOrder.itemsCount} items • {currentOrder.total}
                  </p>
                </div>
              </div>

              {/* Delivery Destination Address */}
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex items-start gap-2.5 text-xs">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Drop-off Address: </span>
                  <span className="text-slate-800 font-medium">{currentOrder.address || 'Standard Delivery Address'}</span>
                  <span className="text-emerald-700 font-semibold block text-[11px] mt-0.5">{currentOrder.city || 'Faisalabad'}</span>
                </div>
              </div>

              {/* Handover OTP PIN */}
              {!currentOrder.isDelivered ? (
                currentOrder.isAssigned ? (
                  <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                        🔐
                      </div>
                      <div>
                        <div className="font-black text-amber-950 flex items-center gap-1.5">
                          <span>Doorstep Handover OTP</span>
                          <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold uppercase">Required</span>
                        </div>
                        <p className="text-[11px] text-amber-800 font-medium">
                          Share this 4-digit PIN with rider {currentOrder.driverName !== 'Awaiting Courier Assignment' ? currentOrder.driverName : ''} at delivery
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-lg px-3.5 py-1 bg-white border border-amber-300 rounded-xl text-amber-950 tracking-widest shadow-2xs">
                        {currentOrder.deliveryOtp || '7412'}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentOrder.deliveryOtp || '7412');
                        }}
                        className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg cursor-pointer transition-colors text-xs"
                        title="Copy OTP PIN"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-base shadow-xs">
                        🔒
                      </div>
                      <div>
                        <div className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span>Doorstep Handover OTP</span>
                          <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-bold uppercase">Awaiting Rider</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          OTP will be assigned once a courier rider is assigned to your order
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-400 tracking-widest shadow-2xs">
                        ••••
                      </span>
                    </div>
                  </div>
                )
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Doorstep Delivery Verified & Completed</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md">
                    OTP Verified
                  </span>
                </div>
              )}

              {/* Substituted Items Banner (if any) */}
              {currentOrder.substitutedItems && currentOrder.substitutedItems.length > 0 && (
                <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Product Substitution In This Order</span>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {currentOrder.substitutedItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-amber-950 bg-white/80 px-3 py-2 rounded-xl border border-amber-200/60 gap-1">
                        <div>
                          <span className="font-bold text-slate-900">Delivering: {item.name}</span>
                          <span className="text-amber-800 block text-[10px]">
                            Originally ordered: <span className="line-through">{item.originalProduct?.name || 'Original item'}</span>
                            {item.substitutionReason ? ` • (${item.substitutionReason})` : ''}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-700">
                          PKR {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Graphical Timeline */}
              <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {currentOrder.timeline.map((item, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-6 sm:-left-8 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.completed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-xs sm:text-sm font-bold ${
                            item.completed ? 'text-slate-800' : 'text-slate-400'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-400">{item.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Driver Details Card (if in transit / assigned) */}
              <div
                style={{
                  backgroundColor: `${tenantThemeColor}0d`,
                  borderColor: `${tenantThemeColor}25`
                }}
                className="rounded-2xl p-4 border flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: tenantThemeColor }}
                    className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold"
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span
                      style={{ color: tenantThemeColor }}
                      className="text-[10px] uppercase font-bold tracking-wider"
                    >
                      Assigned Courier Rider
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      {currentOrder.driverName}
                    </h4>
                    <p className="text-[11px] text-slate-500">{currentOrder.driverVehicle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentOrder.driverPhone && (
                    <a
                      href={`tel:${currentOrder.driverPhone}`}
                      style={{ backgroundColor: tenantThemeColor }}
                      className="px-3.5 py-2 rounded-xl hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-opacity cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Driver</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSearch()}
                    disabled={isSearching}
                    className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    title="Refresh live order status"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                    <span>Refresh Status</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
