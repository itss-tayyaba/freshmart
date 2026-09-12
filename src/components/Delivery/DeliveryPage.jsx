import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Truck,
  Phone,
  MessageSquare,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Building,
  Home,
  Briefcase,
  Plus,
  Zap,
  ShoppingBag,
  Info,
  Check,
  Trash2,
  AlertCircle,
  Sparkles,
  Search,
  ChevronRight,
  User,
  CheckCircle,
  Package,
  Loader2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { apiService } from '../../services/api';
import { PAKISTAN_CITIES } from '../../data/pakistanLocations';

export const DeliveryPage = () => {
  const {
    deliveryLocation,
    setDeliveryLocation,
    navigateTo,
    currency,
    cart,
    addToast,
    savedDeliveryAddresses,
    addSavedAddress,
    removeSavedAddress,
    customerOrders,
    activeDeliveryOrder,
    riders
  } = useStore();

  // Active City & Hub state
  const initialCity = PAKISTAN_CITIES.find((c) => c.city === deliveryLocation?.city) || PAKISTAN_CITIES[0];
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(
    initialCity.neighborhoods.find((n) => n.name === deliveryLocation?.neighborhood) || initialCity.neighborhoods[0]
  );

  // Active tracked order selection
  const [trackedOrderId, setTrackedOrderId] = useState(
    activeDeliveryOrder?.id || (customerOrders.length > 0 ? customerOrders[0].id : '')
  );
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  const [deliveryNote, setDeliveryNote] = useState('call_gate'); // 'doorstep' | 'ring' | 'call_gate'

  // Add Address Form Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    address: '',
    city: initialCity.city,
    phone: ''
  });

  // Keep city in sync if store deliveryLocation changes externally
  useEffect(() => {
    if (deliveryLocation?.city) {
      const match = PAKISTAN_CITIES.find((c) => c.city === deliveryLocation.city);
      if (match) {
        setSelectedCity(match);
        const matchN = match.neighborhoods.find((n) => n.name === deliveryLocation.neighborhood);
        if (matchN) setSelectedNeighborhood(matchN);
      }
    }
  }, [deliveryLocation]);

  const [remoteOrder, setRemoteOrder] = useState(null);
  const [isSearchingOrder, setIsSearchingOrder] = useState(false);

  // Keep trackedOrderId synced if activeDeliveryOrder updates
  useEffect(() => {
    if (activeDeliveryOrder?.id) {
      setTrackedOrderId(activeDeliveryOrder.id);
    } else if (!trackedOrderId && customerOrders.length > 0) {
      setTrackedOrderId(customerOrders[0].id);
    }
  }, [activeDeliveryOrder, customerOrders]);

  // Current active order being tracked (from remote DB lookup, local state, or active delivery)
  const currentOrder =
    (remoteOrder && (remoteOrder.id === trackedOrderId || remoteOrder.orderId === trackedOrderId))
      ? remoteOrder
      : customerOrders.find((o) => o.id === trackedOrderId || o.orderId === trackedOrderId) ||
        activeDeliveryOrder ||
        (customerOrders.length > 0 ? customerOrders[0] : null);

  const assignedRider = currentOrder?.assignedRider || null;

  // Calculate actual Haversine distance in KM between rider / hub and drop-off
  const dropoffCoords = currentOrder?.destinationCoords || selectedNeighborhood.coords;
  const hubCoords = currentOrder?.hubCoords || selectedCity.hubCoords;
  const riderCoords = assignedRider?.coordinates || (assignedRider?.currentLat ? { lat: assignedRider.currentLat, lng: assignedRider.currentLng } : hubCoords);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 3.2;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const dynamicDistanceKm = calculateDistance(riderCoords.lat, riderCoords.lng, dropoffCoords.lat, dropoffCoords.lng);
  const dynamicEtaMins = dynamicDistanceKm <= 0.2 ? 2 : Math.max(2, Math.round((dynamicDistanceKm / 25) * 60 + 2));
  const dynamicEtaText = assignedRider ? (dynamicDistanceKm <= 0.2 ? 'Arriving now (1-2 mins)' : `${dynamicEtaMins} mins`) : `${dynamicEtaMins} mins (Upon dispatch)`;

  const handleCityChange = (city) => {
    setSelectedCity(city);
    const n = city.neighborhoods[0];
    setSelectedNeighborhood(n);
    setDeliveryLocation({
      city: city.city,
      address: n.defaultAddress,
      neighborhood: n.name,
      coords: n.coords,
      hubName: city.hubName,
      label: 'Home'
    });
    addToast('City Switched 📍', `Selected ${city.city} (${city.hubName})`);
  };

  const handleNeighborhoodChange = (n) => {
    setSelectedNeighborhood(n);
    setDeliveryLocation({
      city: selectedCity.city,
      address: n.defaultAddress,
      neighborhood: n.name,
      coords: n.coords,
      hubName: selectedCity.hubName,
      label: 'Home'
    });
    addToast('Area Updated 📍', `Drop-off area set to ${n.name}, ${selectedCity.city}`);
  };

  const handleCreateAddress = (e) => {
    e.preventDefault();
    if (!addressForm.address.trim()) return;

    addSavedAddress(addressForm);
    setIsAddModalOpen(false);
    setAddressForm({ label: 'Home', address: '', city: selectedCity.city, phone: '' });
  };

  const handleSearchOrder = async (e) => {
    if (e) e.preventDefault();
    const q = orderSearchQuery.trim();
    if (!q) return;

    // 1. Check in local customerOrders state first
    const foundLocal = customerOrders.find(
      (o) =>
        o.id.toUpperCase() === q.toUpperCase() ||
        o.id.toUpperCase().includes(q.toUpperCase()) ||
        (o.orderId && o.orderId.toUpperCase() === q.toUpperCase())
    );

    if (foundLocal) {
      setTrackedOrderId(foundLocal.id);
      addToast('Order Found 📦', `Tracking Order ${foundLocal.id}`);
      return;
    }

    // 2. Query real MongoDB backend via API
    setIsSearchingOrder(true);
    try {
      const res = await apiService.trackOrder(q);
      if (res && res.success && res.order) {
        const bOrder = res.order;
        const normalized = {
          ...bOrder,
          id: bOrder.orderId || bOrder.id || bOrder._id,
          orderId: bOrder.orderId || bOrder.id || bOrder._id,
          customer: bOrder.customerName || bOrder.customer || 'Customer',
          totalAmount: bOrder.totalPrice !== undefined ? bOrder.totalPrice : bOrder.totalAmount,
          address: typeof bOrder.shippingAddress === 'string' ? bOrder.shippingAddress : (bOrder.shippingAddress?.address || bOrder.address),
          city: typeof bOrder.shippingAddress === 'object' ? (bOrder.shippingAddress?.city || bOrder.city) : bOrder.city,
          deliverySlot: typeof bOrder.shippingAddress === 'object' ? (bOrder.shippingAddress?.deliverySlot || bOrder.deliverySlot) : bOrder.deliverySlot,
          statusClass: bOrder.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : bOrder.status === 'Out for Delivery' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
        };
        setRemoteOrder(normalized);
        setTrackedOrderId(normalized.id);
        addToast('Order Found 📦', `Live Database Order ${normalized.id} retrieved.`);
      } else {
        addToast('Order Not Found', res?.message || `No database order matching "${q}".`, 'error');
      }
    } catch (err) {
      addToast('Search Error', `Could not reach backend to track order "${q}".`, 'error');
    } finally {
      setIsSearchingOrder(false);
    }
  };

  // Determine active milestone stage
  const getStageIndex = (order) => {
    if (!order) return 1;
    const s = (order.status || '').toLowerCase();
    if (s.includes('delivered') || s.includes('completed')) return 5;
    if (s.includes('arrived') || s.includes('doorstep')) return 4;
    if (s.includes('out for delivery') || s.includes('picked up') || s.includes('transit') || order.assignedRider) return 3;
    if (s.includes('packing') || s.includes('processing')) return 2;
    return 1; // Pending / Placed
  };

  const activeStage = getStageIndex(currentOrder);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#04281e] via-[#074132] to-[#0f243a] rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-emerald-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2.5 z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-black uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>EXPRESS COLD-CHAIN DISPATCH • 15-30 MIN FULFILLMENT</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Order Fulfillment & <br />
            <span className="text-emerald-400">Address-Based Delivery Tracker</span>
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/85 font-medium leading-relaxed">
            Every order is dispatched from <strong className="text-white">{selectedCity.hubName}</strong> straight to your delivery address.
          </p>
        </div>

        {/* Quick Order Stats / Status Widget */}
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 grid grid-cols-2 sm:grid-cols-3 gap-4 z-10 shrink-0 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Hub Zone</span>
            <div className="text-sm font-black text-white flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>{selectedCity.city}</span>
            </div>
            <span className="text-[10px] text-emerald-200">{selectedCity.hubName.split('(')[0]}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Fulfillment Slot</span>
            <div className="text-sm font-black text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>{currentOrder?.deliverySlot ? currentOrder.deliverySlot.replace(/[^0-9- ]/g, '').trim() || 'Express' : '15-25 Mins'}</span>
            </div>
            <span className="text-[10px] text-emerald-200 font-semibold">Priority Dispatch</span>
          </div>

          <div className="space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Order Status</span>
            <div className="text-sm font-black text-emerald-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{currentOrder?.status || 'Active Order'}</span>
            </div>
            <span className="text-[10px] text-emerald-200">
              {assignedRider ? `Assigned: ${assignedRider.name}` : 'Awaiting Rider Assignment'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. City & Hub Selector */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Logistics Hub & Service Cities:</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Dark Store fulfillment across Pakistan</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {PAKISTAN_CITIES.map((c) => {
            const isCityActive = selectedCity.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleCityChange(c)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isCityActive
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-md ring-2 ring-emerald-600/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-black block">{c.city.split(',')[0]}</span>
                <span className={`text-[10px] font-medium block truncate ${isCityActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {c.neighborhoods.map((n) => n.name).slice(0, 2).join(', ')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Neighborhood Area Selector */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">Popular Delivery Areas:</span>
          {selectedCity.neighborhoods.map((n) => {
            const isNActive = selectedNeighborhood.id === n.id;
            return (
              <button
                key={n.id}
                onClick={() => handleNeighborhoodChange(n)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isNActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {n.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Tracking & Order Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8 Cols: Order Milestone Progress & Assigned Courier */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Order Search & Order Switcher */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Order Delivery Progression</h3>
                  <p className="text-xs text-slate-400">
                    {currentOrder ? `Tracking Order ID: ${currentOrder.id}` : 'No active order selected'}
                  </p>
                </div>
              </div>

              {/* Order Search Input */}
              <form onSubmit={handleSearchOrder} className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Order ID..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-40 sm:w-48 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Track
                </button>
              </form>
            </div>

            {/* If Placed Customer Orders exist, show quick pill switcher */}
            {customerOrders.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-bold shrink-0">Your Placed Orders:</span>
                {customerOrders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => setTrackedOrderId(ord.id)}
                    className={`px-3 py-1 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      trackedOrderId === ord.id
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {ord.id} ({ord.status || 'Pending'})
                  </button>
                ))}
              </div>
            )}

            {/* Current Order Summary Card */}
            {currentOrder ? (
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Order ID</span>
                    <span className="font-mono font-black text-slate-900 text-sm">{currentOrder.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Customer</span>
                    <span className="font-bold text-slate-800">{currentOrder.customer || 'Customer'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Amount</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">PKR {currentOrder.totalAmount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Payment</span>
                    <span className="font-bold text-slate-700">{currentOrder.payment || 'Cash on Delivery'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Order Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${currentOrder.statusClass || 'bg-amber-100 text-amber-800'}`}>
                      {currentOrder.status || 'Pending Dispatch'}
                    </span>
                  </div>
                </div>

                {/* Delivery Destination Snapshot */}
                <div className="pt-3 border-t border-slate-200/60 flex items-start gap-2.5 text-xs">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">Destination: </span>
                    <span className="text-slate-600">{currentOrder.address || selectedNeighborhood.defaultAddress}</span>
                    <span className="text-slate-400 block text-[11px]">
                      {currentOrder.city || selectedCity.city} • Recipient Contact: {currentOrder.customerPhone || '+92 300 1234567'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <p className="text-xs text-slate-500 font-medium">No order placed yet. Place an order from the shop to track delivery.</p>
                <button
                  onClick={() => navigateTo('shop')}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 cursor-pointer shadow-xs"
                >
                  Start Shopping &rarr;
                </button>
              </div>
            )}

            {/* 5-Step Order Milestone Tracker */}
            <div className="pt-2 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Fulfillment Milestones
              </span>

              <div className="space-y-3">
                
                {/* Milestone 1: Order Placed */}
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-emerald-900">1. Order Received & Invoiced</h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Order details received and verified by the fulfillment center for packing.
                    </p>
                  </div>
                </div>

                {/* Milestone 2: Packing */}
                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                  activeStage >= 2 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    activeStage >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {activeStage >= 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold ${activeStage >= 2 ? 'text-emerald-900' : 'text-slate-700'}`}>
                        2. Dark Store Packing & Cold-Chain Prep
                      </h4>
                      {activeStage >= 2 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Completed</span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Items carefully verified and packed in insulated chilled packaging at {selectedCity.hubName}.
                    </p>
                  </div>
                </div>

                {/* Milestone 3: Rider Assigned */}
                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                  assignedRider
                    ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20'
                    : activeStage === 1
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    assignedRider
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {assignedRider ? <CheckCircle2 className="w-4 h-4" /> : '3'}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold ${assignedRider ? 'text-emerald-900' : 'text-amber-900'}`}>
                        3. Courier Allocation & Dispatch
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        assignedRider ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {assignedRider ? 'Rider Assigned' : 'Awaiting Courier Assignment'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      {assignedRider
                        ? `Assigned to courier ${assignedRider.name} (${assignedRider.vehicle || assignedRider.vehicleType}). Parcel handed over for express dispatch.`
                        : `The dispatch manager is reviewing your drop-off address and assigning the closest on-duty courier from ${selectedCity.city}.`}
                    </p>
                  </div>
                </div>

                {/* Milestone 4: Out for Delivery */}
                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                  activeStage >= 4 ? 'bg-emerald-50 border-emerald-200' : activeStage === 3 ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/20' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    activeStage >= 4 ? 'bg-emerald-600 text-white' : activeStage === 3 ? 'bg-purple-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {activeStage >= 4 ? <CheckCircle2 className="w-4 h-4" /> : '4'}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold ${activeStage >= 3 ? 'text-purple-900' : 'text-slate-700'}`}>
                        4. Out for Delivery & Heading to Destination
                      </h4>
                      {activeStage === 3 && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full animate-pulse">In Progress</span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Rider is en route to <strong className="text-slate-800">{currentOrder?.address || selectedNeighborhood.name}</strong>.
                    </p>
                  </div>
                </div>

                {/* Milestone 5: Delivered */}
                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                  activeStage === 5 ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    activeStage === 5 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {activeStage === 5 ? <CheckCircle2 className="w-4 h-4" /> : '5'}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold ${activeStage === 5 ? 'text-emerald-900' : 'text-slate-700'}`}>
                        5. Delivered to Doorstep
                      </h4>
                      {activeStage === 5 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Delivered</span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Package handed over at delivery address. Thank you for shopping with FreshMart!
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Courier Contact Card */}
            {assignedRider ? (
              <div className="bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-black text-2xl shadow-md">
                    👨‍✈️
                  </div>
                  <div className="space-y-0.5 text-center sm:text-left">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <h4 className="font-black text-sm text-slate-900">{assignedRider.name}</h4>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        ★ {assignedRider.rating || 5.0} Certified Courier
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {assignedRider.vehicle || assignedRider.vehicleType || 'Motorbike'} • FreshMart Fleet ({assignedRider.zone || 'Central Zone'})
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                      <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1">
                        📍 GPS: {riderCoords.lat.toFixed(4)}, {riderCoords.lng.toFixed(4)}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                        📏 {dynamicDistanceKm} km away
                      </span>
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                        ⚡ ETA: {dynamicEtaText}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 pt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Fleet Courier • Chilled Insulated Box</span>
                    </p>
                  </div>
                </div>

                {/* Direct Communication Buttons */}
                {assignedRider.phone && (
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${assignedRider.phone}`}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:scale-105"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Rider</span>
                    </a>
                    <a
                      href={`https://wa.me/${assignedRider.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(assignedRider.name)},%20checking%20on%20my%20order%20${currentOrder?.id || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:scale-105"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50/70 p-4 sm:p-5 rounded-3xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    ⏳
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">Order Received & Awaiting Dispatch</h4>
                    <p className="text-xs text-slate-600">
                      Our dispatch manager is reviewing your delivery address ({currentOrder?.address || selectedNeighborhood.defaultAddress}) to assign the nearest fleet courier.
                    </p>
                  </div>
                </div>
                <div className="px-3.5 py-1.5 bg-amber-100/90 border border-amber-300/80 text-amber-900 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Awaiting Courier Assignment</span>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right 4 Cols: Location Manager & Drop-off Instructions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Location Manager Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-slate-900">Delivery Destination</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>

            {/* Current Selected Drop-off Display */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Active Drop-off:</span>
                <span className="text-emerald-800 font-bold text-[10px] bg-emerald-200 px-2 py-0.5 rounded-full">Selected</span>
              </div>
              <h4 className="font-black text-slate-900">{selectedNeighborhood.name}</h4>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                {deliveryLocation?.address || selectedNeighborhood.defaultAddress}
              </p>
              <span className="text-[10px] font-mono text-emerald-700 font-bold block pt-1">
                {selectedCity.city} • Postal Code: {selectedNeighborhood.postalCode}
              </span>
            </div>

            {/* Drop-off Instructions Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Rider Delivery Instructions:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'call_gate', label: '📞 Call upon gate arrival' },
                  { id: 'doorstep', label: '📦 Leave at doorstep / reception' },
                  { id: 'ring', label: '🔔 Ring doorbell & handover' }
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => {
                      setDeliveryNote(opt.id);
                      addToast('Instruction Saved 📝', opt.label);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer text-[11px] ${
                      deliveryNote === opt.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Delivery Addresses List */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Saved Locations ({savedDeliveryAddresses.length}):
              </span>

              {savedDeliveryAddresses.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 space-y-1">
                  <p>No custom addresses saved.</p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    + Add your address
                  </button>
                </div>
              ) : (
                savedDeliveryAddresses.map((addr) => {
                  const isSelected = deliveryLocation?.address === addr.address;

                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setDeliveryLocation({
                          city: addr.city,
                          address: addr.address,
                          label: addr.label
                        });
                        addToast('Location Updated 📍', `Switched delivery to ${addr.label}.`);
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-0.5 text-xs">
                        <span className="font-bold text-slate-900 block">{addr.label}</span>
                        <p className="text-slate-600 text-[11px] line-clamp-1">{addr.address}</p>
                        <span className="text-[10px] text-slate-400">{addr.city}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSavedAddress(addr.id);
                          }}
                          className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Quality & Cold-Chain Badges */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3 text-xs">
            <h4 className="font-black text-slate-800 text-xs">FreshMart Delivery Guarantee</h4>
            <div className="space-y-2 text-slate-600 text-[11px]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Halal certified & fresh farm-picked produce</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Insulated thermal bags maintain 3°C cold chain</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Contact-free doorstep delivery option available</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Add New Address Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Add Delivery Address</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Address Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home, Office, Gym, Studio"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Address</label>
                <textarea
                  rows={2}
                  required
                  placeholder="House/Apartment #, Street, Sector"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <select
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium cursor-pointer"
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c.id} value={c.city}>{c.city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 cursor-pointer shadow-md"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
