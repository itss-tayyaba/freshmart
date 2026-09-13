import React, { useState, useEffect } from 'react';
import { X, Search, Truck, CheckCircle2, Clock, MapPin, Phone, MessageSquare, User, Package, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { apiService } from '../../services/api';

export const OrderTrackerModal = () => {
  const { isOrderTrackerOpen, setIsOrderTrackerOpen, customerOrders, navigateTo, trackOrderRemote } = useStore();
  const [orderInput, setOrderInput] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Format a real order (from local store or backend API) into tracker modal format
  const formatOrderForTracking = (rawOrder) => {
    if (!rawOrder) return null;
    const isAssigned = !!rawOrder.assignedRider;
    const status = (rawOrder.status || 'Pending').toLowerCase();
    const isDelivered = status === 'delivered' || status === 'completed';
    const isOutForDelivery = status.includes('out') || status.includes('transit') || isAssigned;

    const shipping = rawOrder.shippingAddress || {};
    const addr = typeof shipping === 'string' ? shipping : (shipping.address || rawOrder.address || 'Delivery Address');
    const city = typeof shipping === 'object' ? (shipping.city || rawOrder.city || 'Pakistan') : (rawOrder.city || 'Pakistan');
    const slot = typeof shipping === 'object' ? (shipping.deliverySlot || rawOrder.deliverySlot || '⚡ 15-25 Mins Express Delivery') : (rawOrder.deliverySlot || '⚡ 15-25 Mins Express Delivery');

    const totalStr = rawOrder.totalPrice !== undefined ? `PKR ${rawOrder.totalPrice}` : `PKR ${rawOrder.totalAmount || rawOrder.total || 0}`;
    const rawItemsCount = rawOrder.orderItems?.length || rawOrder.rawItems?.length || (Array.isArray(rawOrder.items) ? rawOrder.items.length : 1);

    const rider = rawOrder.assignedRider || null;
    const eta = rider?.eta || rawOrder.eta || '15-25 mins';

    // Build or use timeline
    const timeline = Array.isArray(rawOrder.timeline) && rawOrder.timeline.length > 0
      ? rawOrder.timeline
      : [
          {
            title: '1. Order Confirmed',
            time: rawOrder.time || 'Completed',
            desc: `Payment: ${rawOrder.paymentMethod || rawOrder.payment || 'Cash on Delivery'}`,
            completed: true
          },
          {
            title: '2. Dark Store Packing',
            time: isOutForDelivery || isDelivered ? 'Completed' : 'In Progress',
            desc: 'Quality checked & packed at logistics hub',
            completed: isOutForDelivery || isDelivered
          },
          {
            title: '3. Courier Dispatched',
            time: isDelivered ? 'Completed' : isOutForDelivery ? `ETA: ${eta}` : 'Pending',
            desc: isAssigned
              ? `Assigned to courier ${rider.name} (${rider.vehicle || rider.vehicleType || 'Motorbike'})`
              : 'Dispatch manager reviewing address to assign fleet rider',
            completed: isOutForDelivery || isDelivered
          },
          {
            title: '4. Delivered to Doorstep',
            time: isDelivered ? 'Delivered' : 'Pending',
            desc: `Handover at ${addr}`,
            completed: isDelivered
          }
        ];

    return {
      orderId: rawOrder.orderId || rawOrder.id || rawOrder._id,
      customer: rawOrder.customerName || rawOrder.customer || 'Customer',
      placedAt: rawOrder.time || rawOrder.createdAt ? (rawOrder.time || new Date(rawOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : 'Today',
      estimatedDelivery: slot,
      itemsCount: rawItemsCount,
      total: totalStr,
      address: addr,
      city: city,
      status: rawOrder.status || 'Pending',
      deliveryOtp: rawOrder.deliveryOtp || '9999',
      isDelivered,
      driverName: rider?.name || 'Awaiting Courier Assignment',
      driverPhone: rider?.phone || null,
      driverVehicle: rider?.vehicle || rider?.vehicleType || 'Fleet Courier',
      driverZone: rider?.zone || 'Central Zone',
      isAssigned,
      eta,
      distanceKm: rawOrder.distanceKm || null,
      timeline
    };
  };

  // Initialize with latest placed customer order if available
  useEffect(() => {
    if (isOrderTrackerOpen) {
      setSearchError('');
      if (customerOrders.length > 0) {
        const topOrder = customerOrders[0];
        setOrderInput(topOrder.id);
        setCurrentOrder(formatOrderForTracking(topOrder));
      } else {
        setOrderInput('');
        setCurrentOrder(null);
      }
    }
  }, [isOrderTrackerOpen, customerOrders]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOrderTrackerOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Real-Time Order & Rider Tracking</h2>
              <p className="text-xs text-emerald-200">Database verified milestone progress & courier dispatch</p>
            </div>
          </div>
          <button
            onClick={() => setIsOrderTrackerOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/90 focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Order Search Input */}
          <div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Order ID (e.g. #FM92841 or ORD-1024)"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 uppercase font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{isSearching ? 'Searching...' : 'Track'}</span>
              </button>
            </form>

            {/* Placed Customer Orders Quick Select */}
            {customerOrders.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                <span className="font-semibold">Your Placed Orders:</span>
                {customerOrders.map((o) => (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => selectOrder(o)}
                    className="font-mono text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                  >
                    {o.id} ({o.status || 'Pending'})
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
            <div className="space-y-6">
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Order Number
                  </span>
                  <h3 className="text-base font-black text-slate-800 font-mono">
                    {currentOrder.orderId}
                  </h3>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Placed At
                  </span>
                  <p className="text-xs font-semibold text-slate-700">{currentOrder.placedAt}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Fulfillment Slot
                  </span>
                  <p className="text-xs font-bold text-emerald-700">{currentOrder.estimatedDelivery}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Items & Total
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {currentOrder.itemsCount} items • {currentOrder.total}
                  </p>
                </div>
              </div>

              {/* Delivery Destination Address */}
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/70 flex items-start gap-2.5 text-xs">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Drop-off Address: </span>
                  <span className="text-slate-700">{currentOrder.address || 'Standard Delivery Address'}</span>
                  <span className="text-slate-400 block text-[11px] font-mono">{currentOrder.city || 'Lahore'}</span>
                </div>
              </div>

              {/* Handover OTP PIN */}
              {!currentOrder.isDelivered ? (
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
                      {currentOrder.deliveryOtp || '9999'}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentOrder.deliveryOtp || '9999');
                      }}
                      className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg cursor-pointer transition-colors text-xs"
                      title="Copy OTP PIN"
                    >
                      📋
                    </button>
                  </div>
                </div>
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
              <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
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
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Driver</span>
                    </a>
                  )}
                  <button
                    onClick={handleOpenDeliveryPage}
                    className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Full Delivery Tracker</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
