import React, { useState, useEffect, useRef } from 'react';
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
  Trash2,
  Radio,
  ThermometerSnowflake,
  ExternalLink,
  RotateCcw,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PAKISTAN_CITIES, findNearestCity, calculateDistanceKm } from '../../data/pakistanLocations';

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
    activeDeliveryOrder?.id || (customerOrders.length > 0 ? customerOrders[0].id : '#ORD-1049')
  );

  // Live GPS simulation state
  const [isPlaying, setIsPlaying] = useState(true);
  const [riderProgress, setRiderProgress] = useState(35); // 0% to 100%
  const [riderSpeed, setRiderSpeed] = useState(34); // km/h
  const [etaSecondsTotal, setEtaSecondsTotal] = useState(540); // 9 mins
  const [bagTemp, setBagTemp] = useState(3.2); // Celsius
  const [isLocating, setIsLocating] = useState(false);
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

  // Live GPS Telemetry Simulation Interval
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setRiderProgress((prev) => {
        if (prev >= 100) return 100;
        return Number((prev + 0.5).toFixed(1));
      });

      setEtaSecondsTotal((prev) => (prev > 0 ? prev - 1 : 0));

      // Fluctuating realistic city speed (30-38 km/h)
      setRiderSpeed((prev) => {
        const delta = (Math.random() - 0.5) * 2;
        const newSpeed = Math.min(39, Math.max(28, prev + delta));
        return Math.round(newSpeed);
      });

      // Subtle refrigerated bag temperature sensor
      setBagTemp((prev) => {
        const delta = (Math.random() - 0.5) * 0.1;
        return Number(Math.min(3.8, Math.max(2.8, prev + delta)).toFixed(1));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Calculate dynamic coordinates for moving rider along route
  const hubCoords = selectedCity.hubCoords;
  const destCoords = selectedNeighborhood.coords;
  const currentRiderLat = hubCoords.lat + (destCoords.lat - hubCoords.lat) * (riderProgress / 100);
  const currentRiderLng = hubCoords.lng + (destCoords.lng - hubCoords.lng) * (riderProgress / 100);
  
  const totalTripDistanceKm = calculateDistanceKm(hubCoords.lat, hubCoords.lng, destCoords.lat, destCoords.lng);
  const distanceRemainingKm = Number((totalTripDistanceKm * (1 - riderProgress / 100)).toFixed(2));

  const formatEta = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Determine active assigned rider dynamically from Admin-created fleet or active order
  const activeOrder = activeDeliveryOrder || customerOrders.find((o) => o.id === trackedOrderId) || customerOrders[0];
  const assignedRider = activeOrder?.assignedRider || (Array.isArray(riders) && riders.length > 0 ? riders[0] : null);

  // Real-time Geolocation via Browser API
  const handleAutoDetectGPS = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      addToast('GPS Not Supported', 'Geolocation is not supported by your browser.', 'error');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const { city, distanceKm } = findNearestCity(latitude, longitude);

        let closestNeighborhood = city.neighborhoods[0];
        let minD = Infinity;
        city.neighborhoods.forEach((n) => {
          const d = calculateDistanceKm(latitude, longitude, n.coords.lat, n.coords.lng);
          if (d < minD) {
            minD = d;
            closestNeighborhood = n;
          }
        });

        setSelectedCity(city);
        setSelectedNeighborhood(closestNeighborhood);
        setDeliveryLocation({
          city: city.city,
          address: `${closestNeighborhood.defaultAddress} (Exact GPS ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          neighborhood: closestNeighborhood.name,
          coords: { lat: latitude, lng: longitude },
          hubName: city.hubName,
          label: 'Current GPS Location'
        });

        setIsLocating(false);
        setRiderProgress(15);
        setEtaSecondsTotal(620);
        addToast('Exact GPS Locked 🎯', `Connected to ${city.hubName} (${distanceKm} km away)`);
      },
      (err) => {
        setIsLocating(false);
        addToast('GPS Permission Needed', 'Please allow location permission in your browser or select your city manually.', 'info');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
    setRiderProgress(20);
    setEtaSecondsTotal(580);
    addToast('City Switched 📍', `Now tracking delivery from ${city.hubName}`);
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
    setRiderProgress(25);
    setEtaSecondsTotal(520);
    addToast('Neighborhood Set 📍', `Destination updated to ${n.name}, ${selectedCity.city}`);
  };

  const handleResetSimulation = () => {
    setRiderProgress(0);
    setEtaSecondsTotal(660);
    setIsPlaying(true);
    addToast('Route Reset 🔄', 'Live dispatch animation restarted from Dark Store Hub.');
  };

  const handleCreateAddress = (e) => {
    e.preventDefault();
    if (!addressForm.address.trim()) return;

    addSavedAddress(addressForm);
    setIsAddModalOpen(false);
    setAddressForm({ label: 'Home', address: '', city: selectedCity.city, phone: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header Banner & Live Telemetry HUD */}
      <div className="bg-gradient-to-r from-[#04281e] via-[#074132] to-[#0f243a] rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-emerald-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2.5 z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-black uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>EXACT SATELLITE GPS RADAR • 10-15 MIN DARK STORE DISPATCH</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Live Order Tracking & <br />
            <span className="text-emerald-400">Express Courier Radar</span>
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/85 font-medium leading-relaxed">
            Direct telemetry from <strong className="text-white">{selectedCity.hubName}</strong> straight to <strong className="text-white">{selectedNeighborhood.name}</strong>.
          </p>
        </div>

        {/* Live HUD Telemetry Card */}
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4 z-10 shrink-0">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Estimated Arrival</span>
            <div className="text-2xl font-black font-mono tracking-tight text-white flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-amber-300" />
              <span>{formatEta(etaSecondsTotal)}</span>
            </div>
            <span className="text-[10px] text-emerald-200 font-semibold">{riderProgress >= 100 ? 'Arrived at Doorstep' : 'Rider in transit'}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Distance Remaining</span>
            <div className="text-2xl font-black font-mono tracking-tight text-white flex items-center gap-1.5">
              <Navigation className="w-5 h-5 text-emerald-300" />
              <span>{distanceRemainingKm} <span className="text-xs text-emerald-200 font-bold">km</span></span>
            </div>
            <span className="text-[10px] text-emerald-200 font-semibold">Speed: {riderSpeed} km/h</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Cold Chain Chilled</span>
            <div className="text-2xl font-black font-mono tracking-tight text-white flex items-center gap-1.5">
              <ThermometerSnowflake className="w-5 h-5 text-cyan-300" />
              <span>{bagTemp}°C</span>
            </div>
            <span className="text-[10px] text-cyan-200 font-semibold">Freshness Guaranteed</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">GPS Satellite Lock</span>
            <div className="text-2xl font-black font-mono tracking-tight text-emerald-300 flex items-center gap-1.5">
              <Radio className="w-5 h-5 text-emerald-400 animate-ping" />
              <span className="text-lg">4G LTE</span>
            </div>
            <span className="text-[10px] text-emerald-200 font-semibold">High Accuracy Pin</span>
          </div>
        </div>
      </div>

      {/* 2. City Switcher Tabs */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Select City & Logistics Hub:</span>
          </div>
          <button
            onClick={handleAutoDetectGPS}
            disabled={isLocating}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-200"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Use Exact GPS'}</span>
          </button>
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

        {/* Neighborhood Pills for Active City */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">Neighborhood:</span>
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

      {/* 3. Main Grid: Interactive Map Radar & Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8 Cols: Interactive Route Map Radar */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-5">
            
            {/* Map Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                  <Navigation className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900">Live GPS Highway Radar</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Order {trackedOrderId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    GPS Coordinates: <span className="font-mono text-slate-600">{currentRiderLat.toFixed(4)}°N, {currentRiderLng.toFixed(4)}°E</span>
                  </p>
                </div>
              </div>

              {/* Simulation Action Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title={isPlaying ? 'Pause simulation' : 'Resume simulation'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Resume'}</span>
                </button>
                <button
                  onClick={handleResetSimulation}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Restart route animation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart</span>
                </button>
              </div>
            </div>

            {/* Interactive Vector Route Radar Canvas */}
            <div className="relative h-72 sm:h-96 rounded-3xl bg-[#091522] overflow-hidden border border-slate-800 shadow-2xl p-6 select-none">
              
              {/* Tactical Grid Background */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] [background-size:48px_48px]" />

              {/* Satellite City Watermark */}
              <div className="absolute top-4 left-6 text-[11px] font-mono text-emerald-400/60 uppercase tracking-widest z-0 pointer-events-none">
                SECTOR: {selectedCity.city.toUpperCase()} • HUB LAT {hubCoords.lat}°N / LNG {hubCoords.lng}°E
              </div>

              {/* Road Polyline SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                {/* Secondary Street Network */}
                <path d="M 0 140 L 900 140" stroke="#1e293b" strokeWidth="3" strokeDasharray="4 4" />
                <path d="M 0 260 L 900 260" stroke="#1e293b" strokeWidth="3" strokeDasharray="4 4" />
                <path d="M 280 0 L 280 400" stroke="#1e293b" strokeWidth="3" strokeDasharray="4 4" />
                <path d="M 580 0 L 580 400" stroke="#1e293b" strokeWidth="3" strokeDasharray="4 4" />

                {/* Primary Express Route */}
                <path
                  d="M 80 280 C 260 280, 240 120, 500 120 C 680 120, 720 180, 820 80"
                  fill="none"
                  stroke="#1e3a5f"
                  strokeWidth="20"
                  strokeLinecap="round"
                />
                <path
                  d="M 80 280 C 260 280, 240 120, 500 120 C 680 120, 720 180, 820 80"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M 80 280 C 260 280, 240 120, 500 120 C 680 120, 720 180, 820 80"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  className="animate-pulse"
                />
              </svg>

              {/* Node 1: Dark Store Hub */}
              <div className="absolute left-6 bottom-6 bg-slate-900/90 text-white p-3 rounded-2xl border-2 border-emerald-500 shadow-2xl flex items-center gap-3 z-10 backdrop-blur-xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                  🏬
                </div>
                <div className="text-left text-xs">
                  <span className="font-black text-emerald-400 block">{selectedCity.hubName.split('(')[0].trim()}</span>
                  <span className="text-[10px] text-slate-300 font-mono">{hubCoords.lat.toFixed(3)}°N, {hubCoords.lng.toFixed(3)}°E</span>
                </div>
              </div>

              {/* Node 2: Live Rider Marker (interpolated along path) */}
              <div
                className="absolute transition-all duration-1000 z-20 flex flex-col items-center"
                style={{
                  left: `${Math.min(84, Math.max(8, 8 + riderProgress * 0.74))}%`,
                  top: `${Math.min(75, Math.max(15, 68 - Math.sin((riderProgress / 100) * Math.PI) * 45))}%`
                }}
              >
                {/* Rider Telemetry Tooltip */}
                <div className="bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl text-[10px] font-black shadow-xl mb-1.5 flex items-center gap-1.5 border border-amber-300 shrink-0 whitespace-nowrap animate-bounce">
                  <span>🛵 {assignedRider ? assignedRider.name : 'Express Courier'}</span>
                  <span className="bg-slate-950 text-white px-1.5 py-0.2 rounded-md font-mono">{riderSpeed} km/h</span>
                </div>

                {/* Pulsing Beacon */}
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-white shadow-2xl text-lg font-bold">
                    🛵
                  </div>
                  <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                </div>
              </div>

              {/* Node 3: Customer Destination Doorstep */}
              <div className="absolute right-6 top-6 bg-slate-900/90 text-white p-3 rounded-2xl border-2 border-amber-400 shadow-2xl flex items-center gap-3 z-10 backdrop-blur-xs">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 text-lg font-bold shadow-md">
                  🏠
                </div>
                <div className="text-left text-xs max-w-[140px]">
                  <span className="font-black text-amber-300 block">{selectedNeighborhood.name}</span>
                  <span className="text-[10px] text-slate-300 font-mono truncate block">{destCoords.lat.toFixed(3)}°N, {destCoords.lng.toFixed(3)}°E</span>
                </div>
              </div>

            </div>

            {/* Rider Profile & Contact Bar */}
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
                        ★ {assignedRider.rating || 5.0} ({assignedRider.deliveriesCount || 0} deliveries)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {assignedRider.vehicleNumber || assignedRider.vehicle || assignedRider.vehicleType || 'Motorbike'} • FreshMart Certified Courier
                    </p>
                    <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Admin-Registered Rider • Insulated Cold-Chain Bag Attached</span>
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
                      href={`https://wa.me/${assignedRider.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(assignedRider.name)},%20checking%20on%20my%20order%20${trackedOrderId}`}
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
              <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-3xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    🛵
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">Awaiting Rider Assignment</h4>
                    <p className="text-xs text-slate-500">The Store Admin will register and assign a fleet rider to this dispatch.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigateTo('admin')}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105"
                >
                  Manage Fleet in Admin &rarr;
                </button>
              </div>
            )}

            {/* 4-Stage Real-Time Lifecycle Timeline */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Dispatch Lifecycle Status
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>1. Confirmed</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Order invoice & picking list generated</p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>2. Packed (3°C)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Refrigerated items packed in cold chain</p>
                </div>

                <div className={`p-3 rounded-2xl border space-y-1 ${riderProgress < 100 ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>3. In Transit</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Rider moving with live GPS telemetry</p>
                </div>

                <div className={`p-3 rounded-2xl border space-y-1 ${riderProgress >= 100 ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <CheckCircle2 className={`w-4 h-4 ${riderProgress >= 100 ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>4. Delivered</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Doorstep drop & OTP confirmation</p>
                </div>
              </div>
            </div>

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
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Active Delivery Drop-Off:</span>
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
