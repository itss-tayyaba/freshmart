import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Truck,
  Phone,
  MessageSquare,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Sparkles,
  Building,
  Home,
  Briefcase,
  ChevronRight,
  Plus,
  Compass,
  Zap,
  ShoppingBag,
  Info,
  Check,
  Trash2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

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
    activeDeliveryOrder
  } = useStore();

  // Active delivery tracker animation state
  const [etaMinutes, setEtaMinutes] = useState(12);
  const [etaSeconds, setEtaSeconds] = useState(30);
  const [riderPosition, setRiderPosition] = useState(45);
  const [isLocating, setIsLocating] = useState(false);

  // Add Address Form Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    address: '',
    city: 'Lahore, Pakistan',
    phone: ''
  });

  // Countdown timer for active orders
  useEffect(() => {
    if (!activeDeliveryOrder) return;
    const timer = setInterval(() => {
      setEtaSeconds((prevSec) => {
        if (prevSec > 0) return prevSec - 1;
        setEtaMinutes((prevMin) => (prevMin > 0 ? prevMin - 1 : 0));
        return 59;
      });
      setRiderPosition((prev) => (prev < 88 ? prev + 0.5 : 88));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeDeliveryOrder]);

  const format2Digits = (num) => String(num).padStart(2, '0');

  // GPS Auto-detect using browser API
  const handleDetectCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      addToast('GPS Not Supported', 'Geolocation is not supported by your browser.', 'error');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedAddress = {
          city: 'Lahore, Pakistan',
          address: `GPS Pin (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}) - Ultra-Fast Hub Zone`,
          label: 'Current GPS Location'
        };
        setDeliveryLocation(detectedAddress);
        setIsLocating(false);
        addToast('Location Detected 📍', 'Connected to nearest 10-min Dark Store Hub.');
      },
      (error) => {
        setIsLocating(false);
        addToast('GPS Location Required', 'Please enter your address manually or enable browser location permission.', 'info');
      },
      { timeout: 8000 }
    );
  };

  const handleCreateAddress = (e) => {
    e.preventDefault();
    if (!addressForm.address.trim()) return;

    addSavedAddress(addressForm);
    setIsAddModalOpen(false);
    setAddressForm({ label: 'Home', address: '', city: 'Lahore, Pakistan', phone: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 z-10 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-700/80 text-emerald-100 text-xs font-black uppercase tracking-wider shadow-xs">
            <Zap className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
            <span>LIVE GPS COURIER RADAR • 10-MINUTE DISPATCH</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Express Delivery & <br />
            <span className="text-emerald-400">Live GPS Tracker</span>
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
            Monitor your fresh groceries in real-time from our local refrigerated Dark Store straight to your doorstep.
          </p>
        </div>

        {/* Live Status Badge */}
        {activeDeliveryOrder ? (
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 text-center space-y-2 z-10 shrink-0 min-w-[200px]">
            <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider block">Estimated Arrival</span>
            <div className="text-3xl font-black font-mono tracking-tight text-white">
              {format2Digits(etaMinutes)} : {format2Digits(etaSeconds)}
            </div>
            <span className="text-xs font-bold text-emerald-200 block">⚡ Rider is in transit</span>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 text-center space-y-1.5 z-10 shrink-0">
            <span className="text-2xl">⚡</span>
            <span className="text-xs font-black text-emerald-300 block">10-Min Dark Store Ready</span>
            <p className="text-[11px] text-emerald-100/80 max-w-[160px]">Place an order to track live rider dispatch</p>
          </div>
        )}
      </div>

      {/* 2. Interactive Map & Live Rider Simulation (Main Two-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8 Cols: Visual GPS Map or Empty Order State */}
        <div className="lg:col-span-8 space-y-6">
          
          {activeDeliveryOrder ? (
            /* Active Live GPS Route Simulation */
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                    <Navigation className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">Live GPS Highway Route</h3>
                    <p className="text-xs text-slate-400">Order {activeDeliveryOrder.id} • Dispatched from Hub</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Rider Active (34 km/h)</span>
                  </span>
                </div>
              </div>

              {/* Simulated Road Route Map Canvas */}
              <div className="relative h-64 sm:h-80 rounded-3xl bg-slate-900 overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center p-6">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px]" />

                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <path
                    d="M 60 220 Q 200 60 400 160 T 750 100"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 60 220 Q 200 60 400 160 T 750 100"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="10 8"
                    className="animate-pulse"
                  />
                </svg>

                {/* Dark Store Node */}
                <div className="absolute left-6 bottom-8 bg-slate-800 text-white p-3 rounded-2xl border-2 border-emerald-500 shadow-2xl flex items-center gap-2.5 z-10">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                    🏬
                  </div>
                  <div className="text-left text-xs">
                    <span className="font-black text-emerald-400 block">Dark Store #1</span>
                    <span className="text-[10px] text-slate-300">Local Express Hub</span>
                  </div>
                </div>

                {/* Live Rider Position Marker */}
                <div
                  className="absolute transition-all duration-1000 z-20 flex flex-col items-center"
                  style={{ left: `${riderPosition}%`, top: '38%' }}
                >
                  <div className="bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl text-[10px] font-black shadow-lg mb-1 flex items-center gap-1 animate-bounce">
                    <span>🛵 Rider Ali (12 mins)</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-white shadow-2xl animate-pulse">
                    🛵
                  </div>
                </div>

                {/* Customer Destination Node */}
                <div className="absolute right-6 top-8 bg-slate-800 text-white p-3 rounded-2xl border-2 border-amber-400 shadow-2xl flex items-center gap-2.5 z-10">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 text-xs font-bold">
                    🏠
                  </div>
                  <div className="text-left text-xs">
                    <span className="font-black text-amber-300 block">Your Doorstep</span>
                    <span className="text-[10px] text-slate-300 truncate max-w-[120px]">
                      {deliveryLocation.label || 'Home'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rider Profile Card */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                    👨‍✈️
                  </div>
                  <div className="space-y-0.5 text-center sm:text-left">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <h4 className="font-black text-sm text-slate-900">Ali Khan</h4>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        ★ 4.9 (1,420 Deliveries)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Honda 125 • Reg: LEA-4892 • Vaccinated & Sanitized</p>
                    <p className="text-[11px] text-emerald-700 font-bold">❄️ Temperature Controlled Bag: Chilled to 3°C</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="tel:03009876543"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Rider</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Clean Standby State: No Active Delivery in Transit */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-card text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
                🚚
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-xl font-black text-slate-900">No Active Orders in Transit</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Set your delivery location on the right, or start a fresh grocery order to track your 10-minute courier in real time.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => navigateTo('shop')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Start Shopping Groceries</span>
                </button>
                <button
                  onClick={() => navigateTo('customer-portal')}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  View Past Orders in Portal
                </button>
              </div>

              {/* 4 Dispatch Guarantees */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-100 text-left text-xs">
                <div className="space-y-0.5">
                  <span className="font-black text-slate-800 block">⚡ 10-15 Mins</span>
                  <span className="text-[11px] text-slate-400">Ultra-fast dispatch</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-black text-slate-800 block">❄️ Cold Chain</span>
                  <span className="text-[11px] text-slate-400">3°C insulated bags</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-black text-slate-800 block">🛡️ Zero Contact</span>
                  <span className="text-[11px] text-slate-400">Doorstep drop option</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-black text-slate-800 block">📍 Live GPS</span>
                  <span className="text-[11px] text-slate-400">Direct courier radar</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right 4 Cols: Location Manager (User Adds & Manages Their Own Locations) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-slate-900">Delivery Location</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Location</span>
              </button>
            </div>

            {/* GPS Detect Button */}
            <button
              onClick={handleDetectCurrentLocation}
              disabled={isLocating}
              className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-black border border-emerald-200/80 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
              <span>{isLocating ? 'Detecting GPS Satellite...' : 'Use My Current GPS Location'}</span>
            </button>

            {/* Active Delivery Address Display */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Current Selected Drop-off:</span>
                <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <h4 className="font-black text-slate-900">{deliveryLocation.label || 'Home'}</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {deliveryLocation.address}, {deliveryLocation.city}
              </p>
            </div>

            {/* User Added Locations List */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Your Saved Locations ({savedDeliveryAddresses.length}):
              </span>

              {savedDeliveryAddresses.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 space-y-1.5">
                  <p>No saved custom locations yet.</p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    + Add your first address
                  </button>
                </div>
              ) : (
                savedDeliveryAddresses.map((addr) => {
                  const isSelected = deliveryLocation.address === addr.address;

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
                          className="text-slate-300 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dark Store Coverage Info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>Connected Dark Store:</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                FreshMart Ultra-Fast Hub (Stocked with 2,400+ refrigerated grocery items).
              </p>
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-700 pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Guaranteed 10-Minute Dispatch Radius</span>
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
              <h3 className="font-black text-base text-slate-900">Add New Delivery Address</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
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
                <label className="font-bold text-slate-700 block mb-1">Full Street Address</label>
                <textarea
                  rows={2}
                  required
                  placeholder="House/Apartment #, Street, Area"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  >
                    <option>Lahore, Pakistan</option>
                    <option>Karachi, Pakistan</option>
                    <option>Islamabad, Pakistan</option>
                    <option>Rawalpindi, Pakistan</option>
                    <option>Faisalabad, Pakistan</option>
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
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
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
