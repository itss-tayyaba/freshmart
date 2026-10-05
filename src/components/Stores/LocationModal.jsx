import React, { useState } from 'react';
import {
  X,
  MapPin,
  Search,
  Check,
  Zap,
  Building,
  Compass,
  Navigation,
  ChevronRight,
  ShieldCheck,
  Plus,
  Home,
  Briefcase,
  Bookmark
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PAKISTAN_CITIES, findNearestCity, calculateDistanceKm } from '../../data/pakistanLocations';
import { STORE_LOCATIONS } from '../../data/freshMartData';

export const LocationModal = () => {
  const {
    isLocationModalOpen,
    setIsLocationModalOpen,
    deliveryLocation,
    setDeliveryLocation,
    savedDeliveryAddresses = [],
    addSavedAddress,
    customerUser,
    addToast
  } = useStore();

  const [activeTab, setActiveTab] = useState('custom'); // 'custom' | 'cities' | 'saved'
  const [citySearch, setCitySearch] = useState('');
  const [selectedCityId, setSelectedCityId] = useState(
    PAKISTAN_CITIES.find((c) => c.city === deliveryLocation?.city)?.id || 'lahore'
  );
  const [isLocating, setIsLocating] = useState(false);

  // Custom address input form state
  const [customAddress, setCustomAddress] = useState(deliveryLocation?.address || '');
  const [customCity, setCustomCity] = useState(deliveryLocation?.city || 'Lahore, Pakistan');
  const [customLabel, setCustomLabel] = useState(deliveryLocation?.label || 'Home');
  const [customPhone, setCustomPhone] = useState(customerUser?.phone || '+92 300 1234567');

  if (!isLocationModalOpen) return null;

  const currentCityObj = PAKISTAN_CITIES.find((c) => c.id === selectedCityId) || PAKISTAN_CITIES[0];

  const handleSaveCustomAddress = (e) => {
    e.preventDefault();
    if (!customAddress.trim()) {
      addToast('Address Required', 'Please enter your street or house address.', 'warning');
      return;
    }

    const matchedCity = PAKISTAN_CITIES.find((c) => c.city === customCity) || currentCityObj;
    const defaultCoords = matchedCity?.neighborhoods[0]?.coords || { lat: 31.4125, lng: 73.0995 };

    const locObj = {
      city: customCity,
      address: customAddress.trim(),
      label: customLabel,
      phone: customPhone,
      lat: defaultCoords.lat,
      lng: defaultCoords.lng,
      coords: defaultCoords
    };

    setDeliveryLocation(locObj);
    try {
      localStorage.setItem('freshmart_delivery_location', JSON.stringify(locObj));
    } catch (err) {}

    // Also add to saved addresses list if not already present
    if (addSavedAddress) {
      addSavedAddress(locObj);
    }

    setIsLocationModalOpen(false);
    addToast('Delivery Address Set 📍', `Delivering to: ${customAddress.trim()}, ${customCity}`);
  };

  const handleSelectCity = (cityObj) => {
    setSelectedCityId(cityObj.id);
    const defaultN = cityObj.neighborhoods[0];
    const locObj = {
      city: cityObj.city,
      address: defaultN.defaultAddress,
      neighborhood: defaultN.name,
      lat: defaultN.coords.lat,
      lng: defaultN.coords.lng,
      coords: defaultN.coords,
      hubName: cityObj.hubName,
      label: 'Home'
    };
    setDeliveryLocation(locObj);
    try {
      localStorage.setItem('freshmart_delivery_location', JSON.stringify(locObj));
    } catch (err) {}
    addToast('City Selected 📍', `Switched delivery hub to ${cityObj.city}`);
  };

  const handleSelectNeighborhood = (cityObj, neighborhood) => {
    const locObj = {
      city: cityObj.city,
      address: neighborhood.defaultAddress,
      neighborhood: neighborhood.name,
      lat: neighborhood.coords.lat,
      lng: neighborhood.coords.lng,
      coords: neighborhood.coords,
      hubName: cityObj.hubName,
      label: 'Home'
    };
    setDeliveryLocation(locObj);
    try {
      localStorage.setItem('freshmart_delivery_location', JSON.stringify(locObj));
    } catch (err) {}
    setIsLocationModalOpen(false);
    addToast('Delivery Pin Set 📍', `Delivering to ${neighborhood.name}, ${cityObj.city}`);
  };

  const handleSelectSavedAddress = (addr) => {
    const matchedCity = PAKISTAN_CITIES.find((c) => c.city === addr.city) || currentCityObj;
    const defaultCoords = addr.coords || matchedCity?.neighborhoods[0]?.coords || { lat: 31.4125, lng: 73.0995 };
    const locObj = {
      city: addr.city,
      address: addr.address,
      label: addr.label,
      phone: addr.phone,
      lat: addr.lat || defaultCoords.lat,
      lng: addr.lng || defaultCoords.lng,
      coords: defaultCoords
    };
    setDeliveryLocation(locObj);
    try {
      localStorage.setItem('freshmart_delivery_location', JSON.stringify(locObj));
    } catch (err) {}
    setIsLocationModalOpen(false);
    addToast('Active Address Changed 📍', `Switched delivery to ${addr.label}: ${addr.address}`);
  };

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
        const locObj = {
          city: city.city,
          address: `${closestNeighborhood.defaultAddress} (Exact GPS ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          neighborhood: closestNeighborhood.name,
          coords: { lat: latitude, lng: longitude },
          hubName: city.hubName,
          label: 'Current GPS Location'
        };
        setDeliveryLocation(locObj);
        try {
          localStorage.setItem('freshmart_delivery_location', JSON.stringify(locObj));
        } catch (err) {}
        setIsLocating(false);
        setIsLocationModalOpen(false);
        addToast('Exact GPS Location Locked 🎯', `Connected to ${city.hubName} (${distanceKm} km away)`);
      },
      (err) => {
        setIsLocating(false);
        addToast('GPS Permission Needed', 'Please allow location permission in your browser or select your city below.', 'info');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filteredCities = PAKISTAN_CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.neighborhoods.some((n) =>
        n.name.toLowerCase().includes(citySearch.toLowerCase()) ||
        n.area.toLowerCase().includes(citySearch.toLowerCase())
      )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsLocationModalOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
              <Navigation className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Set Delivery Address & Hub</h2>
              <p className="text-xs text-emerald-200">10-15 Min Express Grocery Dispatch across Pakistan</p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/90 focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'custom'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✏️ Enter Address
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cities')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'cities'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏢 Cities & GPS
          </button>
          {savedDeliveryAddresses.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                activeTab === 'saved'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⭐ Saved ({savedDeliveryAddresses.length})
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* TAB 1: CUSTOM ADDRESS FORM */}
          {activeTab === 'custom' && (
            <form onSubmit={handleSaveCustomAddress} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Street Address / House / Flat Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House 45, Street 12, Phase 5, DHA or Askari 11"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    City / Fulfillment Hub
                  </label>
                  <select
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 cursor-pointer"
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c.id} value={c.city}>
                        {c.city} ({c.hubName.split('(')[0].trim()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Address Label
                  </label>
                  <div className="flex gap-2">
                    {['Home', 'Office', 'Other'].map((lbl) => (
                      <button
                        type="button"
                        key={lbl}
                        onClick={() => setCustomLabel(lbl)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          customLabel === lbl
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Contact Phone for Delivery Rider
                </label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.01]"
              >
                <Check className="w-4 h-4" />
                <span>Save & Set Delivery Address</span>
              </button>
            </form>
          )}

          {/* TAB 2: CITIES & GPS AUTO-DETECT */}
          {activeTab === 'cities' && (
            <div className="space-y-4">
              {/* GPS Auto Detect Banner */}
              <button
                type="button"
                onClick={handleAutoDetectGPS}
                disabled={isLocating}
                className="w-full py-2.5 px-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl text-xs flex items-center justify-between shadow-md transition-all cursor-pointer hover:scale-[1.01]"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locking GPS Satellites...' : 'Auto-Detect Exact Current GPS Location'}</span>
                </div>
                <span className="text-[10px] bg-white/20 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  1-Click
                </span>
              </button>

              {/* Quick Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search city or neighborhood (e.g. Gulberg, Clifton, F-7)..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Available Cities */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filteredCities.map((item) => {
                  const isSelected = deliveryLocation?.city === item.city;
                  const isExpanded = selectedCityId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-500'
                          : isExpanded
                          ? 'border-emerald-300 bg-emerald-50/30'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        onClick={() => handleSelectCity(item)}
                        className="p-3 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-900">{item.city}</h4>
                              <span className="text-[9px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.2 rounded-full">
                                {item.hubName.split('(')[0].trim()}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {item.neighborhoods.map((n) => n.name).join(' • ')}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3 text-emerald-700" />
                            Active
                          </span>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="p-2.5 pt-0 border-t border-emerald-100/80 mt-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {item.neighborhoods.map((n) => (
                            <button
                              type="button"
                              key={n.id}
                              onClick={() => handleSelectNeighborhood(item, n)}
                              className="p-2 bg-white hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-200 text-left text-[11px] transition-all cursor-pointer group shadow-2xs"
                            >
                              <span className="font-bold text-slate-900 group-hover:text-white block">{n.name}</span>
                              <span className="text-[9px] text-slate-400 group-hover:text-emerald-100 truncate block">{n.area}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === 'saved' && (
            <div className="space-y-2.5">
              {savedDeliveryAddresses.map((addr) => {
                const isSelected = deliveryLocation?.address === addr.address;

                return (
                  <div
                    key={addr.id}
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{addr.label}</span>
                        {isSelected && (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 truncate">{addr.address}</p>
                      <span className="text-[10px] text-slate-400">{addr.city}</span>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {isSelected ? 'Selected ✓' : 'Deliver Here'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Current Selected Destination Summary */}
          {deliveryLocation && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Active Drop-off: {deliveryLocation.label ? `(${deliveryLocation.label})` : ''}
                </span>
                <span className="font-bold text-slate-900 truncate block">
                  {deliveryLocation.address || deliveryLocation.city}
                </span>
                {deliveryLocation.address && (
                  <span className="text-[10px] text-emerald-700 font-semibold block">{deliveryLocation.city}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all shrink-0"
              >
                Confirm Pin
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
