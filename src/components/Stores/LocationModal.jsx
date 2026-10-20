import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Compass,
  Check,
  Zap,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PAKISTAN_CITIES, findNearestCity } from '../../data/pakistanLocations';
import { detectUserLocation } from '../../utils/geolocationHelper';
import { apiService } from '../../services/api';

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
    currentTenant,
    addToast
  } = useStore();

  const [locateStatus, setLocateStatus] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable coordinates state
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
    deliveryLocation?.address || 'Muhammad Nagar, Faisalabad'
  );

  // Sync internal state when deliveryLocation changes
  useEffect(() => {
    if (deliveryLocation) {
      const lat = Number(deliveryLocation?.lat || deliveryLocation?.coords?.lat || 31.4125);
      const lng = Number(deliveryLocation?.lng || deliveryLocation?.coords?.lng || 73.0995);
      setCurrentCoords({ lat, lng });
      if (deliveryLocation.address) setAddressInput(deliveryLocation.address);

      const matched = PAKISTAN_CITIES.find(
        (c) => c.city.toLowerCase().includes((deliveryLocation?.city || '').toLowerCase().split(',')[0])
      );
      if (matched) setSelectedCityId(matched.id);
    }
  }, [deliveryLocation]);

  const currentCityObj = PAKISTAN_CITIES.find((c) => c.id === selectedCityId) || PAKISTAN_CITIES[0];

  // Auto-Detect Location (GPS with graceful permission denial fallback)
  const handleAutoDetect = async () => {
    setIsLocating(true);
    setLocateStatus('Fetching Location...');
    setPermissionBlocked(false);

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
          'Location Detected 🎯',
          `Detected location in ${result.city}`
        );
      } else {
        setPermissionBlocked(true);
        addToast('Location Info', 'GPS not available. Please choose your city/region from the list below.', 'info');
      }
    } catch (err) {
      setPermissionBlocked(true);
      addToast('Location Info', 'Location access was blocked. Please choose your city from the list below.', 'info');
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
    addToast('City Selected 📍', `Switched to ${cityObj.city}`);
  };

  // Final confirmation: Locks location, saves to store and database
  const handleConfirmLocation = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const locObj = {
      city: currentCityObj.city,
      address: addressInput.trim() || currentCityObj.hubAddress || 'Main Commercial Area',
      neighborhood: currentCityObj.neighborhoods[0]?.name || 'Central',
      area: currentCityObj.neighborhoods[0]?.area || 'Hub Zone',
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      coords: currentCoords,
      hubName: currentCityObj.hubName,
      orderType: 'Delivery'
    };

    // 1. Store in the store context & localStorage
    if (confirmDeliveryLocation) {
      confirmDeliveryLocation(locObj);
    } else {
      setIsLocationModalOpen(false);
    }

    // 2. Persist to MongoDB database
    try {
      await apiService.saveLocation({
        ...locObj,
        tenantId: currentTenant?.id || 'tenant-freshmart',
        tenantName: currentTenant?.name || 'Store'
      });
    } catch (err) {
      console.warn('Location DB persistence fallback:', err.message);
    }

    setIsSaving(false);
    setIsLocationModalOpen(false);
  };

  // Dismiss or close modal
  const handleCloseModal = () => {
    if (!isLocationConfirmed) {
      if (confirmDeliveryLocation) {
        confirmDeliveryLocation(deliveryLocation);
      }
    }
    setIsLocationModalOpen(false);
  };

  const tenantThemeColor =
    currentTenant?.color ||
    currentTenant?.theme?.primaryColor ||
    (currentTenant?.id === 'tenant-alfatah'
      ? '#991b1b'
      : currentTenant?.id === 'tenant-chaseup'
      ? '#6b21a8'
      : currentTenant?.id === 'tenant-chasevalue'
      ? '#78350f'
      : '#991b1b');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={handleCloseModal}
      />

      {/* Clean Modal Card (Matching Reference Design) */}
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden z-10 border border-slate-100 p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCloseModal}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Store Brand Emblem at top */}
        <div className="flex flex-col items-center justify-center mb-3">
          <div
            style={{ backgroundColor: `${tenantThemeColor}15`, borderColor: `${tenantThemeColor}30` }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xs border mb-2 overflow-hidden"
          >
            {currentTenant?.logo && currentTenant.logo.startsWith('http') ? (
              <img src={currentTenant.logo} alt={currentTenant?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{currentTenant?.logo || '🏬'}</span>
            )}
          </div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            {currentTenant?.displayName || currentTenant?.name || 'FreshMart Supermarket'}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            {currentTenant?.tagline || 'Online Supermarket • 100% Express Doorstep Delivery'}
          </p>
        </div>

        {/* 1. Select your order type - DELIVERY ONLY (Zero pickup button as requested) */}
        <div className="my-4">
          <h4 className="text-sm font-bold text-slate-900 mb-2.5">
            Select your order type
          </h4>
          <div className="flex justify-center">
            <div
              style={{ backgroundColor: tenantThemeColor }}
              className="text-white px-8 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md inline-flex items-center gap-2 select-none"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>Delivery</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Doorstep delivery directly to your home or office
          </p>
        </div>

        {/* 2. Please select your location */}
        <div className="my-4 pt-3 border-t border-slate-100">
          <h4 className="text-sm font-bold text-slate-800 mb-2.5">
            Please select your location
          </h4>

          {/* Quick Locate Button with graceful blocked handling */}
          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={isLocating}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              isLocating
                ? 'bg-slate-100 border-slate-300 text-slate-600'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
            }`}
          >
            <Compass className={`w-4 h-4 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? (locateStatus || 'Fetching Location...') : '🎯 Fetch Current Location'}</span>
          </button>
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">
            💡 Laptops/PCs estimate location via internet provider. You can tap your exact area below or type your street.
          </p>

          {/* Location permission block alert if browser denied GPS permission */}
          {permissionBlocked && (
            <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 text-left flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <div>
                <span className="font-bold block">Browser Location Blocked</span>
                Location access was denied or blocked by browser settings. Please pick your city/region and enter your street address below.
              </div>
            </div>
          )}
        </div>

        {/* 3. Select City / Region Dropdown */}
        <div className="text-left mt-3">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Select City / Region
          </label>
          <div className="relative">
            <select
              value={selectedCityId}
              onChange={(e) => {
                const city = PAKISTAN_CITIES.find((c) => c.id === e.target.value);
                if (city) handleSelectCity(city);
              }}
              className="w-full text-xs font-bold bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none transition-all shadow-xs"
            >
              <option value="" disabled>Select City / Region</option>
              {PAKISTAN_CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  📍 {c.city}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 4. Street Address Input */}
        <div className="text-left mt-3">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Delivery Address (Street / House / Sector)
          </label>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="e.g. Muhammad Nagar, Faisalabad"
            className="w-full text-xs font-semibold bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
          />

          {/* Quick-Select Areas in Selected City (e.g. Muhammad Nagar) */}
          {currentCityObj?.neighborhoods?.length > 0 && (
            <div className="mt-2.5 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Popular areas in {currentCityObj.city.split(',')[0]}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentCityObj.neighborhoods.map((n) => {
                  const isSelected = addressInput.toLowerCase().includes(n.name.toLowerCase());
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setAddressInput(n.defaultAddress);
                        setCurrentCoords({ lat: n.coords.lat, lng: n.coords.lng });
                        addToast('Area Selected 📍', `${n.name}, ${currentCityObj.city}`);
                      }}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      📍 {n.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 5. Confirmation Action Button ("Select") */}
        <div className="mt-5">
          <button
            type="button"
            onClick={handleConfirmLocation}
            disabled={isSaving}
            style={{ backgroundColor: tenantThemeColor }}
            className="w-full py-3.5 px-6 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {isSaving ? (
              <span>Saving Location to Store & Database...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Select</span>
              </>
            )}
          </button>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Saved to store & database • 100% Express Doorstep Delivery</span>
          </div>
        </div>

      </div>
    </div>
  );
};
