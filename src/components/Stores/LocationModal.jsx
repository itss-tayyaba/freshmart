import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  X,
  MapPin,
  Check,
  Zap,
  ShieldCheck,
  ChevronDown,
  Compass,
  Store,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PAKISTAN_CITIES, findNearestCity } from '../../data/pakistanLocations';
import { detectUserLocation, reverseGeocodeAddress } from '../../utils/geolocationHelper';
import { apiService } from '../../services/api';

// Custom Modern SVG Pin for User Location to guarantee zero missing asset issues in Vite
const createUserPin = () =>
  L.divIcon({
    className: 'custom-user-leaflet-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <span style="position: absolute; top: -2px; width: 34px; height: 34px; border-radius: 9999px; background: rgba(16, 185, 129, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 34px; height: 34px; border-radius: 9999px; background: #059669; border: 2.5px solid #ffffff; box-shadow: 0 8px 12px -2px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin: auto;">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="margin-top: 2px; padding: 2px 7px; border-radius: 9999px; background: #064e3b; color: white; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; white-space: nowrap; box-shadow: 0 3px 5px -1px rgba(0,0,0,0.2);">
          YOUR LOCATION
        </div>
      </div>
    `,
    iconSize: [36, 52],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44]
  });

// Custom Store Pin for Supermarket Stores on Leaflet Map
const createStorePin = (store) => {
  const color = store.color || '#0284c7';
  const logo = store.logo || '🏬';
  return L.divIcon({
    className: 'custom-store-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="width: 30px; height: 30px; border-radius: 10px; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">
          <span>${logo}</span>
        </div>
        <div style="margin-top: 2px; padding: 1px 5px; border-radius: 5px; background: #0f172a; color: white; font-size: 8px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${store.displayName || store.name}
        </div>
      </div>
    `,
    iconSize: [34, 46],
    iconAnchor: [17, 38],
    popupAnchor: [0, -38]
  });
};

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
    setCurrentTenant,
    getNearbyStores,
    selectStoreAndBranch,
    addToast
  } = useStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locateStatus, setLocateStatus] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  // Editable coordinates state (defaults to Muhammad Nagar, Faisalabad: 31.3973, 73.1180)
  const [currentCoords, setCurrentCoords] = useState(() => ({
    lat: Number(deliveryLocation?.lat || deliveryLocation?.coords?.lat || 31.3973),
    lng: Number(deliveryLocation?.lng || deliveryLocation?.coords?.lng || 73.1180)
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

  // Leaflet map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const storeMarkersRef = useRef([]);

  const currentCityObj = PAKISTAN_CITIES.find((c) => c.id === selectedCityId) || PAKISTAN_CITIES[0];

  // Dynamically calculate nearby grocery stores based on current customer coordinates
  const nearbyStores = useMemo(() => {
    if (typeof getNearbyStores === 'function') {
      return getNearbyStores(currentCoords);
    }
    return [];
  }, [getNearbyStores, currentCoords]);

  const closestStore = nearbyStores && nearbyStores.length > 0 ? nearbyStores[0] : null;
  const isOutsideDeliveryZone = closestStore ? closestStore.distanceKm > 35 : false;

  // Dynamically resolve relative store: either manually selected or relative nearest for customer pin
  const effectiveStore = useMemo(() => {
    if (selectedStoreId) {
      const match = nearbyStores.find((s) => s.id === selectedStoreId);
      if (match) return match;
    }
    return closestStore || null;
  }, [selectedStoreId, nearbyStores, closestStore]);

  // Sync internal state when deliveryLocation changes
  useEffect(() => {
    if (deliveryLocation) {
      const lat = Number(deliveryLocation?.lat || deliveryLocation?.coords?.lat || 31.3973);
      const lng = Number(deliveryLocation?.lng || deliveryLocation?.coords?.lng || 73.1180);
      setCurrentCoords({ lat, lng });
      if (deliveryLocation.address) setAddressInput(deliveryLocation.address);

      const matched = PAKISTAN_CITIES.find(
        (c) => c.city.toLowerCase().includes((deliveryLocation?.city || '').toLowerCase().split(',')[0])
      );
      if (matched) setSelectedCityId(matched.id);
    }
  }, [deliveryLocation]);

  // Initialize interactive Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up any stale map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialLat = currentCoords.lat;
    const initialLng = currentCoords.lng;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Draggable user location pin
    const userMarker = L.marker([initialLat, initialLng], {
      icon: createUserPin(),
      draggable: true,
      zIndexOffset: 1000
    }).addTo(map);

    userMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
        <strong style="color: #059669; font-size: 12px;">📍 Delivery Location</strong>
        <p style="margin: 3px 0 0; color: #475569;">Drag this pin or click anywhere on the map to set your exact doorstep.</p>
      </div>
    `);

    // Helper to update coordinates, sync city, and reverse-geocode address
    const handleUpdateCoords = async (lat, lng) => {
      const fixedLat = Number(lat.toFixed(5));
      const fixedLng = Number(lng.toFixed(5));
      setCurrentCoords({ lat: fixedLat, lng: fixedLng });
      userMarker.setLatLng([fixedLat, fixedLng]);
      // Reset manual selection so the relative nearest store to the new pin is automatically highlighted
      setSelectedStoreId(null);

      // 1. Automatically sync nearest city so city dropdown and neighborhood pills track the dragged pin
      const nearest = findNearestCity(fixedLat, fixedLng);
      if (nearest && nearest.city && nearest.city.id) {
        setSelectedCityId(nearest.city.id);
      }

      // 2. Reverse geocode to exact street, neighborhood, or outskirts
      try {
        const rev = await reverseGeocodeAddress(fixedLat, fixedLng);
        if (rev && rev.formatted) {
          setAddressInput(rev.formatted);
        }
      } catch (err) {
        // preserve current input
      }
    };

    // On Marker Drag
    userMarker.on('dragend', () => {
      const pos = userMarker.getLatLng();
      handleUpdateCoords(pos.lat, pos.lng);
    });

    // On Map Click
    map.on('click', (e) => {
      handleUpdateCoords(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    userMarkerRef.current = userMarker;

    // Invalidate size once rendered inside modal to ensure tiles draw smoothly
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update store markers on the Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear previous store markers
    storeMarkersRef.current.forEach((m) => map.removeLayer(m));
    storeMarkersRef.current = [];

    nearbyStores.forEach((st) => {
      const bLat = Number(st.nearestBranch?.latitude || st.nearestBranch?.coordinates?.lat || 31.4125);
      const bLng = Number(st.nearestBranch?.longitude || st.nearestBranch?.coordinates?.lng || 73.0995);
      if (!bLat || !bLng) return;

      const marker = L.marker([bLat, bLng], {
        icon: createStorePin(st),
        zIndexOffset: 500
      }).addTo(map);

      marker.on('click', () => {
        setSelectedStoreId(st.id);
        addToast('Store Selected 🏬', `Selected ${st.displayName || st.name}`);
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 11px; line-height: 1.4; min-width: 140px;">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 2px;">
            <span style="font-size: 14px;">${st.logo || '🏬'}</span>
            <strong style="color: #0f172a; font-size: 12px;">${st.displayName || st.name}</strong>
          </div>
          <div style="display: inline-block; padding: 2px 6px; border-radius: 9999px; background: #ecfdf5; color: #047857; font-weight: 800; font-size: 10px; margin-bottom: 3px;">
            📍 ${st.distanceFormatted || '1.2 km'} away
          </div>
          <p style="margin: 0; color: #475569; font-size: 10px;">
            ⚡ Fast Delivery: <strong>${st.estimatedTime || '15-25 mins'}</strong>
          </p>
        </div>
      `);

      storeMarkersRef.current.push(marker);
    });
  }, [nearbyStores]);

  // 🎯 DETECT CURRENT LOCATION (Auto-Locate GPS)
  const handleDetectLocation = async () => {
    setIsLocating(true);
    setLocateStatus('Requesting GPS Coordinates...');

    try {
      const result = await detectUserLocation({
        onProgress: (status) => setLocateStatus(status)
      });

      if (result) {
        const detectedLat = Number(result.lat.toFixed(5));
        const detectedLng = Number(result.lng.toFixed(5));

        setCurrentCoords({ lat: detectedLat, lng: detectedLng });
        setSelectedStoreId(null);
        if (result.matchedCityId) {
          setSelectedCityId(result.matchedCityId);
        }
        if (result.address) {
          setAddressInput(result.address);
        }

        // Pan map and update marker
        if (mapInstanceRef.current && userMarkerRef.current) {
          userMarkerRef.current.setLatLng([detectedLat, detectedLng]);
          mapInstanceRef.current.setView([detectedLat, detectedLng], 16, { animate: true });
        }

        addToast(
          'Location Detected 🎯',
          `Centered map at ${result.city} (${result.label || 'GPS'})`
        );
      } else {
        addToast('GPS Notice', 'Could not retrieve GPS coordinates. You can drag the pin on the map.', 'info');
      }
    } catch (err) {
      addToast('GPS Notice', 'Location access blocked. You can click or drag the pin on the Leaflet map.', 'info');
    } finally {
      setIsLocating(false);
      setLocateStatus('');
    }
  };

  // City selection from dropdown
  const handleSelectCity = (cityObj) => {
    setSelectedCityId(cityObj.id);
    setSelectedStoreId(null);
    const defaultNeighborhood = cityObj.neighborhoods[0];
    const coords = defaultNeighborhood.coords;

    setCurrentCoords({ lat: coords.lat, lng: coords.lng });
    setAddressInput(defaultNeighborhood.defaultAddress);

    if (mapInstanceRef.current && userMarkerRef.current) {
      userMarkerRef.current.setLatLng([coords.lat, coords.lng]);
      mapInstanceRef.current.setView([coords.lat, coords.lng], 15, { animate: true });
    }

    addToast('City Selected 📍', `Switched to ${cityObj.city}`);
  };

  // Quick Area Pill Click (e.g. Muhammad Nagar)
  const handleSelectArea = (n) => {
    setAddressInput(n.defaultAddress);
    setCurrentCoords({ lat: n.coords.lat, lng: n.coords.lng });
    setSelectedStoreId(null);

    if (mapInstanceRef.current && userMarkerRef.current) {
      userMarkerRef.current.setLatLng([n.coords.lat, n.coords.lng]);
      mapInstanceRef.current.setView([n.coords.lat, n.coords.lng], 16, { animate: true });
    }

    addToast('Area Selected 📍', `${n.name}, ${currentCityObj.city}`);
  };

  // Final confirmation: Locks location, saves to store and database, and auto-routes to relative nearest or chosen store
  const handleConfirmLocation = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const nearest = findNearestCity(currentCoords.lat, currentCoords.lng);
    const resolvedCity = currentCityObj?.city || nearest?.city?.city || 'Faisalabad, Pakistan';
    const cleanArea = addressInput.split(',')[0].trim();

    const locObj = {
      city: resolvedCity,
      address: addressInput.trim() || currentCityObj.hubAddress || 'Main Commercial Area',
      neighborhood: cleanArea || currentCityObj.neighborhoods[0]?.name || 'Central',
      area: cleanArea || currentCityObj.neighborhoods[0]?.area || 'Hub Zone',
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      coords: currentCoords,
      hubName: currentCityObj.hubName || nearest?.city?.hubName || 'Local Fulfillment Hub',
      orderType: 'Delivery',
      isDeliverable: !isOutsideDeliveryZone
    };

    const chosenStore = effectiveStore || closestStore;
    const storeTenant = chosenStore?.tenant || chosenStore;
    const branch = chosenStore?.nearestBranch || null;

    // 1. Immediately activate relative store across storefront & dashboard
    if (storeTenant && selectStoreAndBranch) {
      selectStoreAndBranch(storeTenant, branch);
    } else if (storeTenant && setCurrentTenant) {
      setCurrentTenant(storeTenant);
    }

    // 2. Store in the store context & localStorage
    if (confirmDeliveryLocation) {
      confirmDeliveryLocation(locObj, chosenStore);
    } else {
      setIsLocationModalOpen(false);
    }

    // 3. Persist to MongoDB database with chosen store
    try {
      await apiService.saveLocation({
        ...locObj,
        tenantId: storeTenant?.id || currentTenant?.id || 'tenant-freshmart',
        tenantName: storeTenant?.displayName || storeTenant?.name || currentTenant?.name || 'Store'
      });
    } catch (err) {
      console.warn('Location DB persistence fallback:', err.message);
    }

    setIsSaving(false);
    setIsLocationModalOpen(false);
  };

  // Dismiss or close modal
  const handleCloseModal = () => {
    try {
      sessionStorage.setItem('freshmart_session_location_confirmed', 'true');
    } catch (e) {}
    if (!isLocationConfirmed) {
      if (confirmDeliveryLocation) {
        confirmDeliveryLocation(deliveryLocation, effectiveStore || closestStore);
      }
    }
    setIsLocationModalOpen(false);
  };

  const activeStoreTenant = effectiveStore?.tenant || effectiveStore || currentTenant;
  const tenantThemeColor =
    effectiveStore?.color ||
    activeStoreTenant?.color ||
    activeStoreTenant?.theme?.primaryColor ||
    (activeStoreTenant?.id === 'tenant-alfatah'
      ? '#991b1b'
      : activeStoreTenant?.id === 'tenant-chaseup'
      ? '#6b21a8'
      : activeStoreTenant?.id === 'tenant-chasevalue'
      ? '#78350f'
      : '#0284c7');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
        onClick={handleCloseModal}
      />

      {/* Clean Modal Card with Leaflet Map & Grocery Stores */}
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden z-10 border border-slate-100 p-5 sm:p-7 text-center max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCloseModal}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-20"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Store Brand Emblem at top dynamically matching relative or chosen store */}
        <div className="flex flex-col items-center justify-center mb-2">
          <div
            style={{ backgroundColor: `${tenantThemeColor}15`, borderColor: `${tenantThemeColor}30` }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs border mb-1.5 overflow-hidden transition-all duration-200"
          >
            {activeStoreTenant?.logo && activeStoreTenant.logo.startsWith('http') ? (
              <img src={activeStoreTenant.logo} alt={activeStoreTenant?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{activeStoreTenant?.logo || '🛒'}</span>
            )}
          </div>
          <h3 className="text-base font-black text-slate-900 tracking-tight transition-colors">
            {activeStoreTenant?.displayName || activeStoreTenant?.name || 'FreshMart Supermarket'}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            {activeStoreTenant?.tagline || 'Online Supermarket • 100% Express Doorstep Delivery'}
          </p>
        </div>

        {/* 1. Order Type - DELIVERY ONLY */}
        <div className="my-2.5">
          <div className="flex justify-center">
            <div
              style={{ backgroundColor: tenantThemeColor }}
              className="text-white px-7 py-2 rounded-full font-bold text-xs shadow-md inline-flex items-center gap-2 select-none"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>Delivery</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Doorstep delivery directly to your home or office
          </p>
        </div>

        {/* 2. Select City / Region Dropdown */}
        <div className="text-left mt-3">
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Select City / Region
          </label>
          <div className="relative">
            <select
              value={selectedCityId}
              onChange={(e) => {
                const city = PAKISTAN_CITIES.find((c) => c.id === e.target.value);
                if (city) handleSelectCity(city);
              }}
              className="w-full text-xs font-bold bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none transition-all shadow-xs"
            >
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

        {/* 3. 🗺️ LEAFLET MAP & DETECT CURRENT LOCATION ACTION */}
        <div className="mt-3.5 text-left space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Interactive Leaflet Map & Grocery Stores</span>
            </label>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              Exact Doorstep Pin
            </span>
          </div>

          {/* 🎯 DETECT CURRENT LOCATION BUTTON */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? (locateStatus || 'Locating Your Exact GPS...') : '🎯 Detect Current Location (Auto-Locate GPS)'}</span>
          </button>

          {/* Map Box */}
          <div className="rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-xs bg-slate-100 relative">
            <div ref={mapContainerRef} className="w-full h-48 sm:h-56 z-0" />

            {/* Live Coordinate Badge at bottom-left */}
            <div className="absolute bottom-2 left-2 z-[1000] bg-slate-900/90 backdrop-blur-md text-white text-[9px] font-mono px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1.5 pointer-events-none max-w-[70%]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">{addressInput ? addressInput.split(',')[0] : `${currentCoords.lat.toFixed(4)}°, ${currentCoords.lng.toFixed(4)}°`}</span>
            </div>

            {/* Helper Hint at bottom-right */}
            <div className="absolute bottom-2 right-2 z-[1000] bg-white/95 backdrop-blur-xs text-slate-700 text-[9px] font-bold px-2 py-1 rounded-md shadow-xs pointer-events-none">
              👆 Drag pin or click map
            </div>
          </div>

          {/* Delivery Zone Notice for Far Locations */}
          {isOutsideDeliveryZone && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 text-left animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[11px]">Notice: Location is Outside Standard 35 km Delivery Zone</span>
                <span className="text-[10px] text-amber-800 leading-tight block mt-0.5">
                  Your pin is {closestStore?.distanceKm} km from the nearest store. Standard express delivery operates within 35 km.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 🏬 4. NEARBY GROCERY STORES & DISTANCE FROM CURRENT LOCATION */}
        {nearbyStores && nearbyStores.length > 0 && (
          <div className="mt-3 p-3 bg-slate-50/90 rounded-2xl border border-slate-200/90 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                Nearby Grocery Stores from Your Pin:
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Live Proximity
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {nearbyStores.map((store, idx) => {
                const isSelectedStore = effectiveStore ? effectiveStore.id === store.id : (idx === 0);
                const isClosest = idx === 0;

                return (
                  <div
                    key={store.id}
                    onClick={() => {
                      setSelectedStoreId(store.id);
                      addToast('Store Selected 🏬', `Selected ${store.displayName || store.name}`);
                    }}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                      isSelectedStore
                        ? 'bg-white border-emerald-500 shadow-xs ring-2 ring-emerald-500'
                        : 'bg-white/80 hover:bg-white border-slate-200'
                    }`}
                    title={`Click to shop at ${store.displayName || store.name}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        style={{ backgroundColor: store.color || '#0284c7' }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] shrink-0 font-bold shadow-2xs"
                      >
                        {store.logo || '🏬'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-900 block truncate leading-tight">
                          {store.displayName || store.name}
                        </span>
                        <span className="text-[9px] text-slate-400 block truncate">
                          ⚡ {store.estimatedTime || '15-25 mins'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-black text-emerald-700 block font-mono leading-tight">
                        {store.distanceFormatted || '1.2 km'}
                      </span>
                      {isClosest ? (
                        <span className="text-[8px] font-black uppercase text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                          Nearest
                        </span>
                      ) : isSelectedStore ? (
                        <span className="text-[8px] font-black uppercase text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300">
                          Selected
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Full Street Address Input */}
        <div className="text-left mt-3">
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Delivery Address (Street / House / Sector)
          </label>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="e.g. Muhammad Nagar, Faisalabad"
            className="w-full text-xs font-semibold bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
          />
        </div>

        {/* 6. Select & Confirm Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleConfirmLocation}
            disabled={isSaving}
            style={{ backgroundColor: tenantThemeColor }}
            className="w-full py-3 px-6 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {isSaving ? (
              <span>Saving Location to Store & Database...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Select Delivery Location • Shop at {activeStoreTenant?.displayName || activeStoreTenant?.name || 'Selected Store'}</span>
              </>
            )}
          </button>

          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Saved to store & database • 100% Express Doorstep Delivery</span>
          </div>
        </div>

      </div>
    </div>
  );
};
