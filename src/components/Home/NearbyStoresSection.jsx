import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Store,
  MapPin,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  Truck,
  Building2,
  Tag,
  Zap,
  ChevronRight,
  Check,
  Layers,
  Crosshair
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { MAP_LAYERS, switchMapTileLayer } from '../../utils/mapTiles';

// Custom Map Marker Icons
const createUserPin = () =>
  L.divIcon({
    className: 'custom-customer-pin',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; background: rgba(16, 185, 129, 0.4); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 28px; height: 28px; background: #059669; border: 2.5px solid white; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">
          📍
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });

const createStorePin = (logo = '🏬', color = '#10b981', isSelected = false) =>
  L.divIcon({
    className: 'custom-store-pin',
    html: `
      <div style="position: relative; width: ${isSelected ? '38px' : '32px'}; height: ${isSelected ? '38px' : '32px'}; display: flex; align-items: center; justify-content: center;">
        <div style="width: 100%; height: 100%; background: ${color}; border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'}; border-radius: 12px; box-shadow: ${isSelected ? '0 8px 20px rgba(0,0,0,0.45), 0 0 0 3px ' + color : '0 4px 10px rgba(0,0,0,0.25)'}; display: flex; align-items: center; justify-content: center; font-size: ${isSelected ? '16px' : '13px'}; color: white;">
          ${logo}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });

export const NearbyStoresSection = ({ nearbyStores = [], onSelectStore }) => {
  const { currentTenant, deliveryLocation } = useStore();

  const [mapViewMode, setMapViewMode] = useState('street'); // 'street' | 'satellite' | 'hybrid'
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersGroupRef = useRef([]);
  const routeLineRef = useRef(null);

  // Customer Coordinates
  const customerLat = Number(deliveryLocation?.coords?.lat || deliveryLocation?.latitude || 31.4187);
  const customerLng = Number(deliveryLocation?.coords?.lng || deliveryLocation?.longitude || 73.0791);

  // Active / Selected store
  const activeStore = nearbyStores.find(
    (s) => currentTenant?.id === s.id || (currentTenant?.slug && currentTenant.slug === s.tenant?.slug)
  ) || nearbyStores[0];

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [customerLat, customerLng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false
      });
      mapInstanceRef.current = map;

      // Add Tile Layer
      switchMapTileLayer(map, mapViewMode, tileLayerRef);
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    markersGroupRef.current.forEach((m) => {
      try {
        map.removeLayer(m);
      } catch (e) {}
    });
    markersGroupRef.current = [];

    if (routeLineRef.current) {
      try {
        map.removeLayer(routeLineRef.current);
      } catch (e) {}
      routeLineRef.current = null;
    }

    const bounds = L.latLngBounds();

    // 1. Add Customer Doorstep Marker
    const userMarker = L.marker([customerLat, customerLng], {
      icon: createUserPin(),
      zIndexOffset: 1000
    }).addTo(map);

    const userAddr = deliveryLocation?.address || 'Your Delivery Doorstep';
    userMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
        <strong style="color: #059669; font-size: 12px;">📍 Your Delivery Address</strong>
        <p style="margin: 2px 0 0; color: #475569;">${userAddr}</p>
      </div>
    `);
    markersGroupRef.current.push(userMarker);
    bounds.extend([customerLat, customerLng]);

    // 2. Add Supermarket Store Markers
    nearbyStores.forEach((store) => {
      const bLat = Number(store.nearestBranch?.latitude || store.nearestBranch?.coordinates?.lat || 31.4125);
      const bLng = Number(store.nearestBranch?.longitude || store.nearestBranch?.coordinates?.lng || 73.0995);
      const isSelected = activeStore?.id === store.id;

      const storeMarker = L.marker([bLat, bLng], {
        icon: createStorePin(store.logo, store.color, isSelected),
        zIndexOffset: isSelected ? 800 : 500
      }).addTo(map);

      storeMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
          <strong style="color: ${store.color || '#0f172a'}; font-size: 13px;">${store.logo} ${store.name}</strong>
          <p style="margin: 2px 0 0; font-weight: 600; color: #334155;">Branch: ${store.nearestBranch?.name || 'Main Hub'}</p>
          <p style="margin: 2px 0 0; color: #059669; font-weight: bold;">📍 ${store.distanceFormatted} away • ~${store.estimatedTime}</p>
        </div>
      `);

      storeMarker.on('click', () => {
        if (onSelectStore) {
          onSelectStore(store.tenant, store.nearestBranch);
        }
      });

      markersGroupRef.current.push(storeMarker);
      bounds.extend([bLat, bLng]);

      // Draw route connecting customer to active store
      if (isSelected) {
        const polyline = L.polyline(
          [
            [bLat, bLng],
            [customerLat, customerLng]
          ],
          {
            color: store.color || '#10b981',
            weight: 3.5,
            opacity: 0.85,
            dashArray: '8, 8'
          }
        ).addTo(map);
        routeLineRef.current = polyline;
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    // Call invalidateSize after slight delay to guarantee tiles are 100% visible
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [nearbyStores, activeStore, customerLat, customerLng, deliveryLocation]);

  // Handle Layer Switch
  const handleLayerChange = (layerKey) => {
    setMapViewMode(layerKey);
    if (mapInstanceRef.current) {
      switchMapTileLayer(mapInstanceRef.current, layerKey, tileLayerRef);
    }
  };

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([customerLat, customerLng], 14, { animate: true });
  };

  return (
    <section className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Deliverable Supermarket Network
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Live Radius Check • 100% Doorstep Coverage
            </span>
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <span>Nearby / Deliverable Stores</span>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
              ({nearbyStores.length} Stores Available)
            </span>
          </h3>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Stores ranked by proximity to your delivery coordinates
        </div>
      </div>

      {/* 🗺️ LIVE INTERACTIVE MAP WITH SATELLITE & STREET VIEW */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-900 isolate z-0">
        
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-64 sm:h-80 md:h-96 z-0" />

        {/* 🛰️ Top-Right Map View Mode Controls: Street View vs Satellite View vs Hybrid */}
        <div className="absolute top-3 right-3 z-[1000] flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-slate-200/90 dark:border-slate-700 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => handleLayerChange('street')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              mapViewMode === 'street'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>🗺️</span>
            <span>Street View</span>
          </button>

          <button
            type="button"
            onClick={() => handleLayerChange('satellite')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              mapViewMode === 'satellite'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>🛰️</span>
            <span>Satellite View</span>
          </button>

          <button
            type="button"
            onClick={() => handleLayerChange('hybrid')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              mapViewMode === 'hybrid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>🏙️</span>
            <span>Hybrid</span>
          </button>
        </div>

        {/* 🎯 Bottom Controls Overlay: Recenter & Active Route Badge */}
        <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none gap-2 flex-wrap">
          <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-2xl shadow-md text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>📍 Active Route:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-black">
              {activeStore?.name || 'Supermarket'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-600 dark:text-slate-300">
              {activeStore?.distanceFormatted || 'Nearby'} (~{activeStore?.estimatedTime || '15-25m'})
            </span>
          </div>

          <button
            type="button"
            onClick={handleRecenter}
            className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-1.5 rounded-xl shadow-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
            <span>Center on Doorstep</span>
          </button>
        </div>
      </div>

      {/* Grid of Nearby Grocery Stores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {nearbyStores.map((store, idx) => {
          const isSelected = currentTenant?.id === store.id || (currentTenant?.slug && currentTenant.slug === store.tenant.slug);
          const isNearest = idx === 0;
          const bLat = Number(store.nearestBranch?.latitude || store.nearestBranch?.coordinates?.lat || 31.4125);
          const bLng = Number(store.nearestBranch?.longitude || store.nearestBranch?.coordinates?.lng || 73.0995);
          
          return (
            <div
              key={store.id}
              onClick={() => onSelectStore && onSelectStore(store.tenant, store.nearestBranch)}
              className={`group relative rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-2 shadow-xl ring-4 ring-emerald-500/10 dark:ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg'
              }`}
              style={{
                borderColor: isSelected ? (store.color || '#10b981') : undefined
              }}
            >
              {/* Floating Top Ribbons */}
              <div className="absolute -top-3 left-4 right-4 flex items-center justify-between pointer-events-none">
                {isNearest ? (
                  <span className="px-2.5 py-0.5 rounded-full text-slate-950 bg-amber-400 border border-amber-300 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    <span>Nearest Store ({store.distanceFormatted})</span>
                  </span>
                ) : <span />}

                {isSelected && (
                  <span
                    style={{ backgroundColor: store.color || '#10b981' }}
                    className="px-3 py-0.5 rounded-full text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active Store</span>
                  </span>
                )}
              </div>

              {/* Card Header: Store Logo, Name, Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{ backgroundColor: store.color || '#0f172a' }}
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl text-white shadow-sm shrink-0"
                    >
                      {store.logo}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition truncate">
                        {store.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate mt-0.5">
                        {store.badge}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-[11px] font-black shrink-0">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{store.rating}</span>
                  </div>
                </div>

                {/* Tagline / Description */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {store.tagline || 'Fresh groceries delivered right to your doorstep.'}
                </p>

                {/* Key Metrics: Distance & Express ETA */}
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Distance:</span>
                    </span>
                    <span className="font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      {store.distanceFormatted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Express Time:</span>
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {store.estimatedTime}
                    </span>
                  </div>

                  {/* Fulfilling Branch & Exact GPS Coordinates */}
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5">
                    <div className="flex items-start gap-1.5">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        Branch: <strong className="text-slate-800 dark:text-slate-200">{store.nearestBranch?.name || 'Central Hub'}</strong>
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono pl-4.5">
                      GPS: {bLat.toFixed(4)}° N, {bLng.toFixed(4)}° E
                    </div>
                  </div>
                </div>

                {/* Delivery Eligibility & Free Delivery Tag */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    🟢 {store.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    🚚 {store.deliveryFeeText}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  style={{
                    backgroundColor: isSelected ? (store.color || '#10b981') : undefined
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-md'
                      : 'bg-slate-900 dark:bg-slate-800 hover:bg-black text-white hover:shadow-md'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Shopping This Store</span>
                    </>
                  ) : (
                    <>
                      <span>Shop {store.name.split(' ')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
