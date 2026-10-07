import React, { useState, useEffect, useMemo } from 'react';
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
  Bookmark,
  Store,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PAKISTAN_CITIES, findNearestCity, calculateDistanceKm } from '../../data/pakistanLocations';
import { LeafletLocationPicker } from '../Common/LeafletLocationPicker';
import { detectUserLocation, reverseGeocodeAddress } from '../../utils/geolocationHelper';

export const LocationModal = () => {
  const { isLocationModalOpen } = useStore();
  return isLocationModalOpen ? <LocationModalContent /> : null;
};

const LocationModalContent = () => {
  const {
    setIsLocationModalOpen,
    isLocationConfirmed,
    deliveryLocation,
    confirmDeliveryLocation,
    getNearbyStores,
    savedDeliveryAddresses = [],
    addSavedAddress,
    customerUser,
    addToast
  } = useStore();

  // Active view tab: 'map' (interactive Leaflet map) | 'cities' | 'saved'
  const [activeTab, setActiveTab] = useState('map');
  const [citySearch, setCitySearch] = useState('');
  const [locateStatus, setLocateStatus] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Editable coordinates state (synced with Leaflet map)
  const [currentCoords, setCurrentCoords] = useState(() => ({
    lat: Number(deliveryLocation?.lat || deliveryLocation?.coords?.lat || 31.4125),
    lng: Number(deliveryLocation?.lng || deliveryLocation?.coords?.lng || 73.0995)
  }));

  // Selected City ID
  const [selectedCityId, setSelectedCityId] = useState(() => {
    const matched = PAKISTAN_CITIES.find(
      (c) => c.city.toLowerCase().includes((deliveryLocation?.city || '').toLowerCase().split(',')[0])
    );
    return matched ? matched.id : 'faisalabad';
  });

  // Custom address input form state
  const [addressInput, setAddressInput] = useState(
    deliveryLocation?.address || 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad'
  );
  const [addressLabel, setAddressLabel] = useState(deliveryLocation?.label || 'Home');
  const [contactPhone, setContactPhone] = useState(customerUser?.phone || '+92 300 1234567');

  // Sync internal state when deliveryLocation changes or modal opens
  useEffect(() => {
    if (deliveryLocation) {
      const lat = Number(deliveryLocation?.lat || deliveryLocation?.coords?.lat || 31.4125);
      const lng = Number(deliveryLocation?.lng || deliveryLocation?.coords?.lng || 73.0995);
      setCurrentCoords({ lat, lng });
      if (deliveryLocation.address) setAddressInput(deliveryLocation.address);
      if (deliveryLocation.label) setAddressLabel(deliveryLocation.label);

      const matched = PAKISTAN_CITIES.find(
        (c) => c.city.toLowerCase().includes((deliveryLocation?.city || '').toLowerCase().split(',')[0])
      );
      if (matched) setSelectedCityId(matched.id);
    }
  }, [deliveryLocation]);

  const currentCityObj = PAKISTAN_CITIES.find((c) => c.id === selectedCityId) || PAKISTAN_CITIES[0];

  // Dynamic nearby stores computed live from current coordinates
  const liveNearbyStores = useMemo(() => {
    if (typeof getNearbyStores === 'function') {
      return getNearbyStores(currentCoords);
    }
    return [];
  }, [getNearbyStores, currentCoords]);

  const nearestStore = liveNearbyStores[0] || null;

  // Handle coordinate change from Leaflet map (drag or map click)
  const handleMapCoordsChange = async (newCoords) => {
    setCurrentCoords(newCoords);

    // Identify nearest city for these coordinates
    const { city: nearestCity } = findNearestCity(newCoords.lat, newCoords.lng);
    if (nearestCity && nearestCity.id !== selectedCityId) {
      setSelectedCityId(nearestCity.id);
    }

    // Reverse geocode to update address text
    setLocateStatus('Resolving street address...');
    const geo = await reverseGeocodeAddress(newCoords.lat, newCoords.lng);
    setLocateStatus('');
    if (geo?.formatted) {
      setAddressInput(geo.formatted);
    } else {
      setAddressInput(
        `Custom Pin Location (${newCoords.lat.toFixed(4)}, ${newCoords.lng.toFixed(4)}), ${nearestCity?.city || 'Pakistan'}`
      );
    }
  };

  // Auto-Detect Location (GPS with Wi-Fi + IP fallback)
  const handleAutoDetect = async () => {
    setIsLocating(true);
    setLocateStatus('Finding your location...');

    try {
      const result = await detectUserLocation({
        onProgress: (status) => setLocateStatus(status)
      });

      if (result) {
        setCurrentCoords({ lat: result.lat, lng: result.lng });
        if (result.matchedCityId) {
          setSelectedCityId(result.matchedCityId);
        }
        if (result.address) {
          setAddressInput(result.address);
        }
        addToast(
          'Location Found 🎯',
          `Position locked in ${result.city} (${result.source === 'browser_gps' ? 'Exact GPS' : 'Network/Wi-Fi'})`
        );
      }
    } catch (err) {
      addToast('Location Notice', 'Could not detect automatically. You can pick your city and drag the map pin.', 'info');
    } finally {
      setIsLocating(false);
      setLocateStatus('');
    }
  };

  // City selection from dropdown
  const handleSelectCity = (cityObj) => {
    setSelectedCityId(cityObj.id);
    const defaultNeighborhood = cityObj.neighborhoods[0];
    const coords = defaultNeighborhood.coords;

    setCurrentCoords({ lat: coords.lat, lng: coords.lng });
    setAddressInput(defaultNeighborhood.defaultAddress);
    addToast('City Changed 📍', `Switched map to ${cityObj.city}`);
  };

  // Select neighborhood
  const handleSelectNeighborhood = (cityObj, n) => {
    setSelectedCityId(cityObj.id);
    setCurrentCoords({ lat: n.coords.lat, lng: n.coords.lng });
    setAddressInput(n.defaultAddress);
    setActiveTab('map');
    addToast('Neighborhood Set 📍', `Map focused on ${n.name}, ${cityObj.city}`);
  };

  // Final confirmation: Locks location and auto-selects closest store
  const handleConfirmLocation = (e) => {
    if (e) e.preventDefault();

    const locObj = {
      city: currentCityObj.city,
      address: addressInput.trim() || currentCityObj.hubAddress,
      neighborhood: currentCityObj.neighborhoods[0]?.name || 'Central',
      area: currentCityObj.neighborhoods[0]?.area || 'Hub Zone',
      label: addressLabel,
      phone: contactPhone,
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      coords: currentCoords,
      hubName: currentCityObj.hubName
    };

    if (confirmDeliveryLocation) {
      confirmDeliveryLocation(locObj);
    } else {
      setIsLocationModalOpen(false);
    }

    if (addSavedAddress) {
      addSavedAddress(locObj);
    }
  };

  // Dismiss or close modal (preserving confirmed state if already set, or confirming default)
  const handleCloseModal = () => {
    if (!isLocationConfirmed) {
      if (confirmDeliveryLocation) {
        confirmDeliveryLocation(deliveryLocation);
      }
    }
    setIsLocationModalOpen(false);
  };

  // Filter cities for search
  const filteredCities = PAKISTAN_CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.neighborhoods.some((n) =>
        n.name.toLowerCase().includes(citySearch.toLowerCase()) ||
        n.area.toLowerCase().includes(citySearch.toLowerCase())
      )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={handleCloseModal}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden z-10 border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-950 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner border border-white/15">
                <Navigation className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Select Your City & Location
                  </h2>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wider">
                    Leaflet GPS
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  Calculates real-time distance & finds your nearest supermarket
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseModal}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick 1-Click Detect Bar */}
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleAutoDetect}
              disabled={isLocating}
              className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.01]"
            >
              <Compass className={`w-4 h-4 text-slate-950 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? (locateStatus || 'Locating You...') : '🎯 Use Current Location (GPS / Network)'}</span>
            </button>

            {/* City Dropdown in Header */}
            <div className="w-full sm:w-56">
              <select
                value={selectedCityId}
                onChange={(e) => {
                  const city = PAKISTAN_CITIES.find((c) => c.id === e.target.value);
                  if (city) handleSelectCity(city);
                }}
                className="w-full text-xs font-bold bg-white/15 hover:bg-white/20 border border-white/20 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                    📍 {c.city.split(',')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/90 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Leaflet Map</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cities')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'cities'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Cities & Hubs</span>
          </button>
          {savedDeliveryAddresses.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({savedDeliveryAddresses.length})</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* TAB 1: INTERACTIVE LEAFLET MAP & PIN */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              {/* Leaflet Map Component */}
              <LeafletLocationPicker
                coords={currentCoords}
                onCoordsChange={handleMapCoordsChange}
                nearbyStores={liveNearbyStores}
                isLocating={isLocating}
                onLocateCurrent={handleAutoDetect}
                activeCityName={currentCityObj.city}
              />

              {/* Editable Street Address and Details */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    Street Address / House / Flat <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="e.g. House 88, Main D-Ground, Peoples Colony 1"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                    />
                    <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Address Label
                    </label>
                    <div className="flex gap-2">
                      {['Home', 'Office', 'Other'].map((lbl) => (
                        <button
                          type="button"
                          key={lbl}
                          onClick={() => setAddressLabel(lbl)}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                            addressLabel === lbl
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Rider Phone Contact
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CITIES & HUBS DIRECT PICKER */}
          {activeTab === 'cities' && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Pakistani city or neighborhood..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredCities.map((item) => {
                  const isSelected = selectedCityId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        onClick={() => {
                          handleSelectCity(item);
                          setActiveTab('map');
                        }}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{item.city}</h4>
                            <span className="text-[10px] text-slate-500">
                              {item.hubName.split('(')[0].trim()}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-xl">
                          Select City ➔
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {item.neighborhoods.map((n) => (
                          <button
                            type="button"
                            key={n.id}
                            onClick={() => handleSelectNeighborhood(item, n)}
                            className="p-1.5 bg-white hover:bg-emerald-600 hover:text-white rounded-lg border border-slate-200 text-left text-[10px] font-bold text-slate-700 transition cursor-pointer"
                          >
                            {n.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === 'saved' && (
            <div className="space-y-2">
              {savedDeliveryAddresses.map((addr) => {
                const isSelected = deliveryLocation?.address === addr.address;

                return (
                  <div
                    key={addr.id}
                    onClick={() => {
                      if (addr.coords) setCurrentCoords(addr.coords);
                      if (addr.address) setAddressInput(addr.address);
                      setActiveTab('map');
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">{addr.label}</span>
                        {isSelected && (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700">{addr.address}</p>
                      <span className="text-[10px] text-slate-400">{addr.city}</span>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                    >
                      Use
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Nearest Store Proximity Highlight */}
          {nearestStore && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: nearestStore.color || '#0284c7' }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shrink-0 shadow-xs"
                >
                  {nearestStore.logo || '🛒'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200/70 text-emerald-900 px-1.5 py-0.2 rounded">
                      Nearest Store
                    </span>
                    <strong className="text-xs font-black text-slate-900">
                      {nearestStore.displayName || nearestStore.name}
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Only <strong className="text-emerald-700 font-extrabold">{nearestStore.distanceFormatted || `${nearestStore.distanceKm} km`}</strong> away • Branch: {nearestStore.nearestBranch?.name || 'Local Store'}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-black text-slate-900 block">
                  ⚡ {nearestStore.estimatedTime || '15-25 mins'}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">Fastest Dispatch</span>
              </div>
            </div>
          )}

          {liveNearbyStores.length === 0 && (
            <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50 text-sm text-amber-900">
              <strong className="block text-xs font-black">No store can deliver to this location yet</strong>
              <span className="text-xs">Choose another neighborhood or adjust the map pin to see available stores.</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>Delivering to: </span>
            <strong className="text-slate-900 font-bold truncate inline-block max-w-[280px] align-bottom">
              {addressInput}
            </strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmLocation}
              className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <span>Confirm Location & View Stores</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
