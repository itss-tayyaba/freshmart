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
  RotateCcw
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const DeliveryPage = () => {
  const {
    deliveryLocation,
    setDeliveryLocation,
    navigateTo,
    currency,
    cart,
    addToast
  } = useStore();

  // Active delivery order tracker simulation
  const [etaMinutes, setEtaMinutes] = useState(11);
  const [etaSeconds, setEtaSeconds] = useState(45);
  const [riderPosition, setRiderPosition] = useState(60); // % across the route
  const [isLocating, setIsLocating] = useState(false);

  // Saved locations
  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: 'loc-1',
      label: 'Home (Default)',
      icon: 'home',
      address: '123 Main Street, Sector B, Johar Town',
      city: 'Lahore, Pakistan',
      phone: '0300-1234567',
      darkStore: 'FreshMart Dark Store #1 - Johar Town',
      deliveryTime: '10-12 Mins'
    },
    {
      id: 'loc-2',
      label: 'Office / Workplace',
      icon: 'work',
      address: '45-B Tech Tower, Main Boulevard, Gulberg III',
      city: 'Lahore, Pakistan',
      phone: '0321-9876543',
      darkStore: 'FreshMart Dark Store #2 - Gulberg III',
      deliveryTime: '10-15 Mins'
    },
    {
      id: 'loc-3',
      label: 'Parents Residence',
      icon: 'family',
      address: 'House 88, Street 12, Phase 5, DHA',
      city: 'Lahore, Pakistan',
      phone: '0302-5554321',
      darkStore: 'FreshMart Dark Store #3 - DHA Phase 5',
      deliveryTime: '12-15 Mins'
    }
  ]);

  const [activeAddressId, setActiveAddressId] = useState('loc-1');
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    label: 'Gym / Other',
    address: '',
    city: 'Lahore, Pakistan',
    phone: '0300-1234567'
  });

  // Rider ETA Countdown & Movement Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaSeconds((prevSec) => {
        if (prevSec > 0) return prevSec - 1;
        setEtaMinutes((prevMin) => (prevMin > 0 ? prevMin - 1 : 0));
        return 59;
      });
      setRiderPosition((prev) => (prev < 90 ? prev + 0.5 : 90));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format2Digits = (num) => String(num).padStart(2, '0');

  // Use Browser Geolocation
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
          address: `Detected GPS Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}) - Johar Town Express Zone`,
          label: 'Current GPS'
        };
        setDeliveryLocation(detectedAddress);
        setIsLocating(false);
        addToast('Location Detected 📍', 'Connected to nearest 10-min Dark Store #1.');
      },
      (error) => {
        setIsLocating(false);
        setDeliveryLocation({
          city: 'Lahore, Pakistan',
          address: '123 Main Street, Sector B, Johar Town',
          label: 'Home'
        });
        addToast('Location Updated 📍', 'Defaulted to Johar Town 10-Minute Express Zone.');
      },
      { timeout: 8000 }
    );
  };

  const handleSelectAddress = (addr) => {
    setActiveAddressId(addr.id);
    setDeliveryLocation({
      city: addr.city,
      address: addr.address,
      label: addr.label
    });
    addToast('Delivery Location Set 📍', `Switched delivery to ${addr.label} (${addr.deliveryTime}).`);
  };

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (!newAddressForm.address.trim()) return;

    const newLoc = {
      id: `loc-${Date.now()}`,
      label: newAddressForm.label,
      icon: 'home',
      address: newAddressForm.address,
      city: newAddressForm.city,
      phone: newAddressForm.phone,
      darkStore: 'FreshMart Express Hub',
      deliveryTime: '10-15 Mins'
    };

    setSavedAddresses([...savedAddresses, newLoc]);
    handleSelectAddress(newLoc);
    setIsAddAddressModalOpen(false);
    setNewAddressForm({ label: 'Custom', address: '', city: 'Lahore, Pakistan', phone: '0300-1234567' });
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
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 text-center space-y-2 z-10 shrink-0 min-w-[200px]">
          <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider block">Estimated Arrival</span>
          <div className="text-3xl font-black font-mono tracking-tight text-white">
            {format2Digits(etaMinutes)} : {format2Digits(etaSeconds)}
          </div>
          <span className="text-xs font-bold text-emerald-200 block">⚡ Rider Ali is 1.2 km away</span>
        </div>
      </div>

      {/* 2. Interactive Map & Live Rider Simulation (Main Two-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8 Cols: Interactive Visual GPS Map */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Visual GPS Simulation Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Live GPS Highway Route</h3>
                  <p className="text-xs text-slate-400">Order #FM-9482 • Dispatched from Johar Town Hub</p>
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
              {/* Map Grid Texture */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Road Path SVG */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                {/* Road Line */}
                <path
                  d="M 60 220 Q 200 60 400 160 T 750 100"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                {/* Animated Glowing Active Delivery Line */}
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

              {/* Dark Store Node (Start) */}
              <div className="absolute left-6 bottom-8 bg-slate-800 text-white p-3 rounded-2xl border-2 border-emerald-500 shadow-2xl flex items-center gap-2.5 z-10">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                  🏬
                </div>
                <div className="text-left text-xs">
                  <span className="font-black text-emerald-400 block">Dark Store #1</span>
                  <span className="text-[10px] text-slate-300">Johar Town Hub</span>
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

              {/* Customer Destination Node (End) */}
              <div className="absolute right-6 top-8 bg-slate-800 text-white p-3 rounded-2xl border-2 border-amber-400 shadow-2xl flex items-center gap-2.5 z-10">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 text-xs font-bold">
                  🏠
                </div>
                <div className="text-left text-xs">
                  <span className="font-black text-amber-300 block">Your Location</span>
                  <span className="text-[10px] text-slate-300 truncate max-w-[120px]">
                    {deliveryLocation.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Rider Profile & Direct Call / Chat */}
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
                <button
                  onClick={() => addToast('Courier Chat', 'Opening live chat with Rider Ali...', 'info')}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Message</span>
                </button>
              </div>
            </div>

            {/* 4 Fulfillment Stages Timeline */}
            <div className="pt-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider block mb-4">
                Order Timeline & Tracking Stages
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { title: 'Order Confirmed', time: '02:15 PM', status: 'done', desc: 'Payment verified' },
                  { title: 'Packed at Hub', time: '02:17 PM', status: 'done', desc: '100% freshness inspected' },
                  { title: 'Courier Dispatched', time: '02:20 PM', status: 'active', desc: 'Rider on the road' },
                  { title: 'Doorstep Delivery', time: '02:30 PM (Est.)', status: 'pending', desc: 'OTP verification' }
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                      step.status === 'active'
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : step.status === 'done'
                        ? 'border-slate-200 bg-slate-50 text-slate-700'
                        : 'border-slate-100 bg-white text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{step.time}</span>
                      {step.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : step.status === 'active' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </div>
                    <h5 className="font-black text-slate-900">{step.title}</h5>
                    <p className="text-[11px] text-slate-500">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right 4 Cols: Location Manager & Dark Store Coverage */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Location Picker & GPS Auto Detect */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-slate-900">Delivery Location</h3>
              </div>
              <button
                onClick={() => setIsAddAddressModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New</span>
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

            {/* Saved Addresses List */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Saved Drop-off Locations:
              </span>

              {savedAddresses.map((addr) => {
                const isSelected = activeAddressId === addr.id;

                return (
                  <div
                    key={addr.id}
                    onClick={() => handleSelectAddress(addr)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {addr.icon === 'work' ? (
                          <Briefcase className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Home className="w-4 h-4 text-emerald-600" />
                        )}
                        <h4 className="font-black text-xs text-slate-900">{addr.label}</h4>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 font-black" />}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">{addr.address}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>{addr.city}</span>
                      <span className="font-mono font-bold text-emerald-700">{addr.deliveryTime}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Dark Store Hub Coverage Info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>Connected Dark Store:</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                FreshMart Ultra-Fast Hub #1 (Johar Town, Lahore). Stocked with 2,400+ refrigerated grocery items.
              </p>
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-700 pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Guaranteed 10-Minute Dispatch Radius</span>
              </div>
            </div>

          </div>

          {/* Return to Shopping or Orders */}
          <div className="space-y-2">
            <button
              onClick={() => navigateTo('shop')}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Shopping Groceries</span>
            </button>
            <button
              onClick={() => navigateTo('customer-portal')}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              View Order Invoices in Portal
            </button>
          </div>

        </div>

      </div>

      {/* Add New Address Modal */}
      {isAddAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Add New Delivery Location</h3>
              <button onClick={() => setIsAddAddressModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddNewAddress} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Location Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gym, Studio, Friend's Place"
                  value={newAddressForm.label}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Street Address</label>
                <textarea
                  rows={2}
                  required
                  placeholder="House / Flat #, Street, Area"
                  value={newAddressForm.address}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <select
                    value={newAddressForm.city}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
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
                    required
                    value={newAddressForm.phone}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddAddressModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
