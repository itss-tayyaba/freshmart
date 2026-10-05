import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Search,
  Check,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Clock,
  Building2,
  Store,
  ChevronDown,
  X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PAKISTAN_CITIES, findNearestCity, calculateDistanceKm } from '../../data/pakistanLocations';

export const CustomerLocationBanner = ({ onLocationConfirmed }) => {
  const {
    deliveryLocation,
    setDeliveryLocation,
    currentTenant,
    currentBranch,
    setIsLocationModalOpen,
    addToast
  } = useStore();

  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState(() => {
    const matched = PAKISTAN_CITIES.find(
      (c) => c.city.toLowerCase().includes((deliveryLocation?.city || '').toLowerCase().split(',')[0])
    );
    return matched ? matched.id : 'faisalabad';
  });

  const [addressInput, setAddressInput] = useState(
    deliveryLocation?.address || 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad'
  );
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const currentCityObj = PAKISTAN_CITIES.find((c) => c.id === selectedCityId) || PAKISTAN_CITIES[0];

  // Quick GPS detection
  const handleDetectGPS = () => {
    setIsLocatingGPS(true);
    if (!navigator.geolocation) {
      addToast('GPS Not Supported', 'Geolocation is not supported by your browser.', 'error');
      setIsLocatingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const { city, distanceKm } = findNearestCity(latitude, longitude);

        // Find closest neighborhood in that city
        let closestNeighborhood = city.neighborhoods[0];
        let minNeighborhoodDist = Infinity;
        city.neighborhoods.forEach((n) => {
          const d = calculateDistanceKm(latitude, longitude, n.coords.lat, n.coords.lng);
          if (d < minNeighborhoodDist) {
            minNeighborhoodDist = d;
            closestNeighborhood = n;
          }
        });

        setSelectedCityId(city.id);
        const resolvedAddress = `${closestNeighborhood.defaultAddress} (GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        setAddressInput(resolvedAddress);

        const newLoc = {
          city: city.city,
          address: resolvedAddress,
          neighborhood: closestNeighborhood.name,
          area: closestNeighborhood.area,
          lat: latitude,
          lng: longitude,
          coords: { lat: latitude, lng: longitude },
          hubName: city.hubName,
          label: 'Current GPS Location'
        };

        setDeliveryLocation(newLoc);
        try {
          localStorage.setItem('freshmart_delivery_location', JSON.stringify(newLoc));
          localStorage.setItem('freshmart_location_confirmed', 'true');
        } catch (e) {}

        setIsLocatingGPS(false);
        setIsEditingAddress(false);
        addToast('Exact GPS Locked 🎯', `Connected to nearest hub in ${city.city} (${distanceKm} km away)`);
        if (onLocationConfirmed) onLocationConfirmed(newLoc);
      },
      (err) => {
        setIsLocatingGPS(false);
        addToast('GPS Permission Needed', 'Please allow location permission in your browser or select your city manually.', 'info');
      },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  };

  const handleSelectCity = (cityObj) => {
    setSelectedCityId(cityObj.id);
    const defaultN = cityObj.neighborhoods[0];
    const newAddress = defaultN.defaultAddress;
    setAddressInput(newAddress);

    const newLoc = {
      city: cityObj.city,
      address: newAddress,
      neighborhood: defaultN.name,
      area: defaultN.area,
      lat: defaultN.coords.lat,
      lng: defaultN.coords.lng,
      coords: defaultN.coords,
      hubName: cityObj.hubName,
      label: defaultN.name
    };

    setDeliveryLocation(newLoc);
    try {
      localStorage.setItem('freshmart_delivery_location', JSON.stringify(newLoc));
      localStorage.setItem('freshmart_location_confirmed', 'true');
    } catch (e) {}

    addToast('City Selected 📍', `Switched to ${cityObj.city}`);
    if (onLocationConfirmed) onLocationConfirmed(newLoc);
  };

  const handleSelectNeighborhood = (neighborhood) => {
    const newAddress = neighborhood.defaultAddress;
    setAddressInput(newAddress);

    const newLoc = {
      city: currentCityObj.city,
      address: newAddress,
      neighborhood: neighborhood.name,
      area: neighborhood.area,
      lat: neighborhood.coords.lat,
      lng: neighborhood.coords.lng,
      coords: neighborhood.coords,
      hubName: currentCityObj.hubName,
      label: neighborhood.name
    };

    setDeliveryLocation(newLoc);
    try {
      localStorage.setItem('freshmart_delivery_location', JSON.stringify(newLoc));
      localStorage.setItem('freshmart_location_confirmed', 'true');
    } catch (e) {}

    setIsEditingAddress(false);
    addToast('Delivery Pin Updated 📍', `Delivering to ${neighborhood.name}, ${currentCityObj.city}`);
    if (onLocationConfirmed) onLocationConfirmed(newLoc);
  };

  const handleSaveCustomAddress = (e) => {
    e.preventDefault();
    if (!addressInput.trim()) return;

    const newLoc = {
      ...deliveryLocation,
      city: currentCityObj.city,
      address: addressInput.trim(),
      lat: deliveryLocation?.lat || currentCityObj.neighborhoods[0]?.coords.lat || 31.4125,
      lng: deliveryLocation?.lng || currentCityObj.neighborhoods[0]?.coords.lng || 73.0995,
      coords: {
        lat: deliveryLocation?.lat || currentCityObj.neighborhoods[0]?.coords.lat || 31.4125,
        lng: deliveryLocation?.lng || currentCityObj.neighborhoods[0]?.coords.lng || 73.0995
      }
    };

    setDeliveryLocation(newLoc);
    try {
      localStorage.setItem('freshmart_delivery_location', JSON.stringify(newLoc));
      localStorage.setItem('freshmart_location_confirmed', 'true');
    } catch (e) {}

    setIsEditingAddress(false);
    addToast('Address Confirmed 📍', `Delivering to: ${addressInput.trim()}`);
    if (onLocationConfirmed) onLocationConfirmed(newLoc);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Decorative ambient glows */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        
        {/* Step 1 Badge & Heading */}
        <div className="text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Step 1: Set Customer Location</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            Find Nearby Supermarkets & Fast Delivery Branches
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Enter your city & address or use GPS to calculate real-time distance to the closest branches of Al-Fatah, Chase Up, Chase Value, and Unimaart.
          </p>
        </div>

        {/* Action Controls Container */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
          
          {/* Top Row: Quick Cities & GPS Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* City Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                City:
              </span>
              {PAKISTAN_CITIES.map((c) => {
                const isActive = c.id === selectedCityId;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCity(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-extrabold'
                        : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    <span>{c.city.split(',')[0]}</span>
                    {isActive && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>

            {/* GPS Auto-Detect Button */}
            <button
              onClick={handleDetectGPS}
              disabled={isLocatingGPS}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-teal-500/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
              title="Detect exact coordinates via device GPS"
            >
              {isLocatingGPS ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Locating Coordinates...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Use Current Location (GPS)</span>
                </>
              )}
            </button>
          </div>

          {/* Middle Row: Street Address / Neighborhood Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Selected Address in {currentCityObj.city}:</span>
              </span>
              <button
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                {isEditingAddress ? 'Close Custom Entry' : 'Change / Enter Custom Address'}
              </button>
            </div>

            {isEditingAddress ? (
              <form onSubmit={handleSaveCustomAddress} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Enter street name, house/flat number, landmark..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  {addressInput && (
                    <button
                      type="button"
                      onClick={() => setAddressInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer"
                >
                  Set Pin
                </button>
              </form>
            ) : (
              <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {deliveryLocation?.address || addressInput}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Lat: {Number(deliveryLocation?.lat || 31.4125).toFixed(4)}, Lng: {Number(deliveryLocation?.lng || 73.0995).toFixed(4)} • Hub: {currentCityObj.hubName}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                  Active Delivery Pin
                </span>
              </div>
            )}

            {/* Popular Neighborhood Quick Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Popular Areas:
              </span>
              {currentCityObj.neighborhoods.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleSelectNeighborhood(n)}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  📍 {n.name}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
