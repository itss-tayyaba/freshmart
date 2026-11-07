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
import { switchMapTileLayer } from '../../utils/mapTiles';

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
  const [isRegionExpanded, setIsRegionExpanded] = useState(false);

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

  // Leaflet map refs & Layer mode
  const [mapViewMode, setMapViewMode] = useState('street'); // 'street' | 'satellite' | 'hybrid'
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const storeMarkersRef = useRef([]);
  const deliveryCirclesRef = useRef([]);

  const currentCityObj = PAKISTAN_CITIES.find((c) => c.id === selectedCityId) || PAKISTAN_CITIES[0];

  // Dynamically calculate nearby grocery stores based on current customer coordinates
  const nearbyStores = useMemo(() => {
    if (typeof getNearbyStores === 'function') {
      return getNearbyStores(currentCoords);
    }
    return [];
  }, [getNearbyStores, currentCoords]);

  // Reset expanded region when user picks new pin
  useEffect(() => {
    setIsRegionExpanded(false);
  }, [currentCoords.lat, currentCoords.lng]);

  // STRICT REQUIREMENT: Only display and allow selection of stores where customer is INSIDE delivery zone
  // When isRegionExpanded is true (InDrive logic), allow nearest stores up to 25 km with regional delivery SLA
  const deliverableStores = useMemo(() => {
    const direct = (nearbyStores || []).filter((s) => s.isDeliverable);
    if (direct.length > 0) return direct;
    if (isRegionExpanded) {
      return (nearbyStores || []).slice(0, 4).map((s) => ({
        ...s,
        isDeliverable: true,
        isExpandedRegion: true,
        estimatedTime: '45-60 mins (Regional Delivery)'
      }));
    }
    return [];
  }, [nearbyStores, isRegionExpanded]);

  const outsideStores = useMemo(() => {
    return (nearbyStores || []).filter((s) => !s.isDeliverable);
  }, [nearbyStores]);

  const closestStore = deliverableStores && deliverableStores.length > 0 ? deliverableStores[0] : null;
  const isOutsideDeliveryZone = deliverableStores.length === 0;

  // Dynamically resolve relative store: strictly from DELIVERABLE stores
  const effectiveStore = useMemo(() => {
    if (selectedStoreId) {
      const match = deliverableStores.find((s) => s.id === selectedStoreId);
      if (match) return match;
    }
    return closestStore || null;
  }, [selectedStoreId, deliverableStores, closestStore]);

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

    switchMapTileLayer(map, mapViewMode, tileLayerRef);

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
          userMarker.bindPopup(`
            <div style="font-family: inherit; font-size: 11px;">
              <strong style="color: #059669; font-size: 13px;">📍 ${rev.area || 'Pinned Location'}</strong>
              <p style="margin: 3px 0 0; color: #475569;">${rev.formatted}</p>
              <div style="margin-top: 4px; font-weight: 700; color: #0284c7;">
                GPS: ${fixedLat.toFixed(4)}°N, ${fixedLng.toFixed(4)}°E
              </div>
            </div>
          `).openPopup();
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

  const handleLayerChange = (layerKey) => {
    setMapViewMode(layerKey);
    if (mapInstanceRef.current) {
      switchMapTileLayer(mapInstanceRef.current, layerKey, tileLayerRef);
    }
  };

  // Update store markers and delivery radius circles on the Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear previous store markers and delivery circles
    storeMarkersRef.current.forEach((m) => map.removeLayer(m));
    storeMarkersRef.current = [];
    deliveryCirclesRef.current.forEach((c) => map.removeLayer(c));
    deliveryCirclesRef.current = [];

    // Render store markers and delivery radius circles on the Leaflet Map
    // Displays all supermarket branches in the city at their authentic physical coordinates
    const storesToRender = nearbyStores;

    storesToRender.forEach((st) => {
      const bLat = Number(st.nearestBranch?.latitude ?? st.nearestBranch?.coordinates?.lat);
      const bLng = Number(st.nearestBranch?.longitude ?? st.nearestBranch?.coordinates?.lng);
      if (!Number.isFinite(bLat) || !Number.isFinite(bLng)) return;

      const storeColor = st.color || st.theme?.primaryColor || '#0284c7';
      const radiusKm = Number(st.nearestBranch?.deliveryRadiusKm || st.nearestBranch?.deliveryRadius || 3.5);
      const radiusMeters = radiusKm * 1000;
      const isDeliverable = st.isDeliverable;

      // Draw delivery zone circle with separate styling:
      // Active in-range stores have distinct clean borders and fills;
      // Outside stores have soft dashed borders so they don't blob over the map
      const circle = L.circle([bLat, bLng], {
        radius: radiusMeters,
        color: storeColor,
        weight: isDeliverable ? 2 : 1,
        opacity: isDeliverable ? 0.75 : 0.35,
        fillColor: storeColor,
        fillOpacity: isDeliverable ? 0.14 : 0.05,
        dashArray: isDeliverable ? null : '6, 6'
      }).addTo(map);

      circle.bindTooltip(`${st.displayName || st.name} (${radiusKm} km Zone • ${isDeliverable ? 'Deliverable' : 'Outside Zone'})`, {
        sticky: true,
        className: 'delivery-zone-tooltip'
      });

      deliveryCirclesRef.current.push(circle);

      const marker = L.marker([bLat, bLng], {
        icon: createStorePin(st),
        zIndexOffset: isDeliverable ? 600 : 300,
        opacity: isDeliverable ? 1.0 : 0.65
      }).addTo(map);

      marker.on('click', () => {
        if (!isDeliverable) {
          addToast(
            `${st.displayName || st.name} 📍`,
            `Branch located at ${st.nearestBranch?.name || 'Hub'} (${st.distanceFormatted} away). Your current pin is outside its ${radiusKm} km delivery zone.`,
            'info'
          );
          return;
        }
        setSelectedStoreId(st.id);
        addToast('Store Selected 🏬', `Selected ${st.displayName || st.name}`);
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 11px; line-height: 1.4; min-width: 150px;">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 2px;">
            <span style="font-size: 14px;">${st.logo || '🏬'}</span>
            <strong style="color: #0f172a; font-size: 12px;">${st.displayName || st.name}</strong>
          </div>
          <div style="margin-bottom: 3px; font-size: 10px; color: #64748b; font-weight: 600;">
            🏢 ${st.nearestBranch?.name || 'Branch'}
          </div>
          <div style="display: inline-block; padding: 2px 6px; border-radius: 9999px; background: ${isDeliverable ? '#ecfdf5' : '#fef2f2'}; color: ${isDeliverable ? '#047857' : '#b91c1c'}; font-weight: 800; font-size: 10px; margin-bottom: 3px;">
            📍 ${st.distanceFormatted || '1.2 km'} away (${isDeliverable ? 'Inside Delivery Zone' : 'Outside Zone'})
          </div>
          <p style="margin: 0; color: #475569; font-size: 10px;">
            ⚡ Fast Delivery: <strong>${st.estimatedTime || '15-25 mins'}</strong>
          </p>
          <p style="margin: 2px 0 0; color: #64748b; font-size: 9px;">
            🛵 Delivery Radius: <strong>${radiusKm} km</strong> • Fee: <strong>${st.deliveryFee === 0 ? 'Free' : `Rs. ${st.deliveryFee}`}</strong>
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
    if (deliverableStores.length === 0) {
      addToast('Choose different location (no store found) ⚠️', 'Sorry, delivery is currently unavailable at your location. Please change your location so that you fall in the retailer delivery zone.', 'warning');
      return;
    }
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
          <div className="rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-xs bg-slate-100 dark:bg-slate-900 relative isolate z-0">
            <div ref={mapContainerRef} className="w-full h-48 sm:h-56 z-0" />

            {/* 🛰️ Top-Right Map Layer Controls: Street View vs Satellite View vs Hybrid */}
            <div className="absolute top-2 right-2 z-[1000] flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-0.5 shadow-md border border-slate-200/90 dark:border-slate-700 text-[10px] font-bold gap-0.5">
              <button
                type="button"
                onClick={() => handleLayerChange('street')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  mapViewMode === 'street'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                🗺️ Street
              </button>
              <button
                type="button"
                onClick={() => handleLayerChange('satellite')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  mapViewMode === 'satellite'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                🛰️ Satellite
              </button>
              <button
                type="button"
                onClick={() => handleLayerChange('hybrid')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  mapViewMode === 'hybrid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                🏙️ Hybrid
              </button>
            </div>

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
            <div className="mt-2.5 p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 text-left animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-black block text-xs text-rose-950">
                  Choose different location (no store found)
                </span>
                <span className="text-[11px] text-rose-800 leading-tight block mt-0.5">
                  Your pin is {closestStore?.distanceKm ? `${closestStore.distanceKm} km` : 'far away'} from the nearest store and outside retailer delivery zones. Please change your location or drag your pin closer so that you fall in the retailer delivery zone.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 🏪 4. NEARBY GROCERY STORES FROM YOUR PIN (Strictly Deliverable Stores Only) */}
        {deliverableStores.length > 0 ? (
          <div className="mt-4 text-left p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  Nearby Grocery Stores Delivering to Your Pin:
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                LIVE PROXIMITY
              </span>
            </div>

            {/* Overlapping Zones Notice (Multi-retailer deliverability) */}
            {deliverableStores.length > 1 && (
              <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-semibold flex items-center justify-between">
                <span>🎯 In range of {deliverableStores.length} overlapping delivery zones</span>
                <span className="text-[10px] text-emerald-700 font-medium">Select your preferred store</span>
              </div>
            )}

            {/* Progressive Search Expansion Banner */}
            {closestStore?.searchRadiusKm > 1 && (
              <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-semibold flex items-center justify-between">
                <span>🔍 Progressive search: Found in-range stores at {closestStore.searchRadiusKm} km</span>
                <span className="text-[10px] text-blue-700 font-medium">Expanded from 1 km</span>
              </div>
            )}

            {/* 2x2 Interactive Retailer Selection Grid (Deliverable Stores Only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {deliverableStores.map((store, idx) => {
                const isSelected = selectedStoreId
                  ? store.id === selectedStoreId
                  : store.id === effectiveStore?.id;
                const isNearest = idx === 0;

                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => {
                      setSelectedStoreId(store.id);
                      addToast('Store Selected 🏬', `Selected ${store.displayName || store.name}`);
                    }}
                    className={`relative p-3 rounded-2xl text-left transition-all cursor-pointer border flex items-center gap-3 ${
                      isSelected
                        ? 'border-2 border-emerald-500 bg-white shadow-md ring-1 ring-emerald-500/20'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Brand Emblem / Icon */}
                    <div
                      style={{ backgroundColor: store.color || '#0284c7' }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0 shadow-xs"
                    >
                      {store.logo && store.logo.startsWith('http') ? (
                        <img src={store.logo} alt={store.name} className="w-6 h-6 object-contain" />
                      ) : (
                        <span>{store.logo || '🛒'}</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {store.displayName || store.name}
                        </span>
                        <span className="text-xs font-black text-slate-800 shrink-0">
                          {store.distanceFormatted}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="text-amber-600 font-bold flex items-center gap-0.5">
                          ⚡ {store.estimatedTime}
                        </span>
                        {isNearest && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            NEAREST
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Informative: Other stores in city outside current delivery zone */}
            {outsideStores && outsideStores.length > 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/90 text-left">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs">📍</span>
                    <span>Other Stores in {currentCityObj.city.split(',')[0]} ({outsideStores.length}):</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Click to view on map</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {outsideStores.map((os) => (
                    <button
                      key={os.id}
                      type="button"
                      onClick={() => {
                        if (mapInstanceRef.current && os.nearestBranch) {
                          const bLat = Number(os.nearestBranch.latitude ?? os.nearestBranch.coordinates?.lat);
                          const bLng = Number(os.nearestBranch.longitude ?? os.nearestBranch.coordinates?.lng);
                          if (Number.isFinite(bLat) && Number.isFinite(bLng)) {
                            mapInstanceRef.current.setView([bLat, bLng], 14, { animate: true });
                            addToast(
                              `${os.displayName || os.name} 📍`,
                              `${os.nearestBranch.name || 'Branch'} is ${os.distanceFormatted} away (${os.nearestBranch.address || ''}). Drag your pin inside its circle to order.`,
                              'info'
                            );
                          }
                        }
                      }}
                      className="text-[10px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <span>{os.logo || '🏬'}</span>
                      <span className="font-bold">{os.displayName || os.name}</span>
                      <span className="text-slate-400">({os.distanceFormatted} • {os.nearestBranch?.name || 'Hub'})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50/90 border-2 border-rose-200 text-rose-900 text-left space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-black text-xs text-rose-950">
                Choose different location (no store found)
              </span>
            </div>
            <p className="text-[11px] text-rose-800 leading-tight">
              No grocery supermarkets currently deliver to this pin. Please choose a different location or select an area below so that you fall in the retailer delivery zone.
            </p>

            {/* InDrive-style Expand Delivery Region Option */}
            <div className="pt-1.5 pb-1">
              <button
                type="button"
                onClick={() => setIsRegionExpanded(true)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Compass className="w-4 h-4 text-emerald-200" />
                <span>Expand Delivery Region (+10 km Regional Delivery)</span>
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-1">
                Dispatches riders from regional fulfillment hubs with extended delivery radius.
              </p>
            </div>
            {/* Quick Suggestions to Fall into Delivery Zone */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block mb-1.5">
                Suggested Deliverable Areas in {currentCityObj.city.split(',')[0]}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentCityObj.neighborhoods.slice(0, 4).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleSelectArea(n)}
                    className="text-[10px] font-bold bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <span>📍</span>
                    <span>{n.name}</span>
                  </button>
                ))}
              </div>
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
            disabled={isSaving || deliverableStores.length === 0}
            style={{ backgroundColor: deliverableStores.length === 0 ? '#e11d48' : tenantThemeColor }}
            className={`w-full py-3 px-6 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
              deliverableStores.length === 0
                ? 'opacity-90 cursor-not-allowed bg-rose-600'
                : 'hover:shadow-lg hover:opacity-95 cursor-pointer active:scale-[0.99]'
            }`}
          >
            {isSaving ? (
              <span>Saving Location to Store & Database...</span>
            ) : deliverableStores.length === 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-white" />
                <span>Choose different location (no store found)</span>
              </>
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
