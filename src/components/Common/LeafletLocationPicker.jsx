import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, MapPin, Navigation, Store, Check, Info } from 'lucide-react';
import { calculateDistanceKm } from '../../data/pakistanLocations';
import { reverseGeocodeAddress } from '../../utils/geolocationHelper';

// Custom modern SVG Leaflet DivIcons to avoid broken asset URL issues in Vite
const createUserIcon = () =>
  L.divIcon({
    className: 'custom-user-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <span style="position: absolute; top: -2px; width: 36px; height: 36px; border-radius: 9999px; background: rgba(16, 185, 129, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 36px; height: 36px; border-radius: 9999px; background: #059669; border: 3px solid #ffffff; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); display: flex; items-align: center; justify-content: center; color: white;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin: auto;">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="margin-top: 2px; padding: 2px 8px; border-radius: 9999px; background: #064e3b; color: white; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; white-space: nowrap; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">
          YOUR LOCATION
        </div>
      </div>
    `,
    iconSize: [40, 56],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48]
  });

const createStoreIcon = (store) => {
  const color = store.color || '#0284c7';
  const logo = store.logo || '🛒';
  return L.divIcon({
    className: 'custom-store-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="width: 32px; height: 32px; border-radius: 12px; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 8px 12px -2px rgba(0,0,0,0.3); display: flex; items-align: center; justify-content: center; color: white; font-size: 14px;">
          <span style="margin: auto;">${logo}</span>
        </div>
        <div style="margin-top: 2px; padding: 1px 6px; border-radius: 6px; background: #0f172a; color: white; font-size: 9px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${store.displayName || store.name}
        </div>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 40],
    popupAnchor: [0, -40]
  });
};

export const LeafletLocationPicker = ({
  coords,
  onCoordsChange,
  nearbyStores = [],
  isLocating = false,
  onLocateCurrent = null,
  activeCityName = ''
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const storeMarkersRef = useRef([]);

  const currentLat = Number(coords?.lat || 31.4125);
  const currentLng = Number(coords?.lng || 73.0995);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove any previous map instance to prevent "Map container is already initialized"
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Draggable User Location Marker
    const userMarker = L.marker([currentLat, currentLng], {
      icon: createUserIcon(),
      draggable: true,
      zIndexOffset: 1000
    }).addTo(map);

    userMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
        <strong style="color: #059669; font-size: 13px;">📍 Your Delivery Location</strong>
        <p style="margin: 4px 0 0; color: #475569;">Drag this pin or click anywhere on the map to set your exact address.</p>
      </div>
    `);

    // Handle Marker Drag
    userMarker.on('dragend', async () => {
      const pos = userMarker.getLatLng();
      if (onCoordsChange) {
        onCoordsChange({
          lat: Number(pos.lat.toFixed(5)),
          lng: Number(pos.lng.toFixed(5))
        });
      }
    });

    // Handle Map Click
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      userMarker.setLatLng([lat, lng]);
      if (onCoordsChange) {
        onCoordsChange({
          lat: Number(lat.toFixed(5)),
          lng: Number(lng.toFixed(5))
        });
      }
    });

    mapInstanceRef.current = map;
    userMarkerRef.current = userMarker;

    // Invalidate size after layout renders
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

  // Update map and user marker position when coords change
  useEffect(() => {
    if (!mapInstanceRef.current || !userMarkerRef.current) return;
    const curPos = userMarkerRef.current.getLatLng();
    if (Math.abs(curPos.lat - currentLat) > 0.0001 || Math.abs(curPos.lng - currentLng) > 0.0001) {
      userMarkerRef.current.setLatLng([currentLat, currentLng]);
      mapInstanceRef.current.panTo([currentLat, currentLng], { animate: true });
    }
  }, [currentLat, currentLng]);

  // Render Store markers on map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old store markers
    storeMarkersRef.current.forEach((m) => map.removeLayer(m));
    storeMarkersRef.current = [];

    nearbyStores.forEach((store) => {
      const bLat = Number(store.nearestBranch?.latitude || store.nearestBranch?.coordinates?.lat);
      const bLng = Number(store.nearestBranch?.longitude || store.nearestBranch?.coordinates?.lng);

      if (!bLat || !bLng) return;

      const dist = calculateDistanceKm(currentLat, currentLng, bLat, bLng);
      const marker = L.marker([bLat, bLng], {
        icon: createStoreIcon(store),
        zIndexOffset: 500
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 170px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="font-size: 16px;">${store.logo || '🛒'}</span>
            <strong style="color: #0f172a; font-size: 13px;">${store.displayName || store.name}</strong>
          </div>
          <p style="margin: 0 0 4px; color: #64748b; font-size: 11px;">
            Branch: <strong>${store.nearestBranch?.name || 'Local Hub'}</strong>
          </p>
          <div style="display: inline-block; padding: 2px 8px; border-radius: 9999px; background: #ecfdf5; color: #047857; font-weight: 800; font-size: 11px; margin-bottom: 6px;">
            📍 ${dist} km from you
          </div>
          <p style="margin: 0; color: #334155; font-size: 10px;">
            ⚡ Delivery: <strong>${store.estimatedTime || '15-25 mins'}</strong>
          </p>
        </div>
      `);

      storeMarkersRef.current.push(marker);
    });
  }, [nearbyStores, currentLat, currentLng]);

  return (
    <div className="space-y-3">
      {/* Interactive Map Box */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-md bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-64 sm:h-72 z-0" />

        {/* Floating Quick Action: Auto-Detect GPS / IP button */}
        {onLocateCurrent && (
          <button
            type="button"
            onClick={onLocateCurrent}
            disabled={isLocating}
            className="absolute top-3 right-3 z-[1000] bg-white/95 hover:bg-emerald-600 hover:text-white text-slate-800 text-xs font-black px-3.5 py-2 rounded-xl shadow-lg border border-slate-200/80 backdrop-blur-xs flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
          >
            <Compass className={`w-4 h-4 text-emerald-600 group-hover:text-white ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Locate Me (GPS)'}</span>
          </button>
        )}

        {/* Live Coordinate Badge at bottom-left */}
        <div className="absolute bottom-2 left-2 z-[1000] bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-mono px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Lat: {currentLat.toFixed(4)}° • Lng: {currentLng.toFixed(4)}°
          </span>
        </div>

        {/* Helper Badge at bottom-right */}
        <div className="absolute bottom-2 right-2 z-[1000] bg-white/90 backdrop-blur-xs text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs hidden sm:flex items-center gap-1 pointer-events-none">
          <span>👆 Drag pin or click map to move</span>
        </div>
      </div>

      {/* Real-time Distance Proximity Summary to Supermarket Stores */}
      {nearbyStores && nearbyStores.length > 0 && (
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50/60 rounded-xl border border-emerald-200/80 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-black text-slate-800 text-[11px] flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-700" />
              Calculated Distance to Nearby Stores (Haversine GPS Formula):
            </span>
            <span className="text-[10px] text-emerald-800 font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-200">
              Live Real-Time
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {nearbyStores.map((st, idx) => {
              const bLat = Number(st.nearestBranch?.latitude || st.nearestBranch?.coordinates?.lat || 31.4125);
              const bLng = Number(st.nearestBranch?.longitude || st.nearestBranch?.coordinates?.lng || 73.0995);
              const realDist = calculateDistanceKm(currentLat, currentLng, bLat, bLng);
              const isClosest = idx === 0;

              return (
                <div
                  key={st.id}
                  className={`p-2 rounded-lg border transition-all text-center ${
                    isClosest
                      ? 'bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-white/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm">{st.logo || '🛒'}</span>
                    <span className="font-black text-slate-900 text-[11px] truncate">{st.displayName || st.name}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <span className="text-xs font-black text-emerald-700">{realDist} km</span>
                    {isClosest && (
                      <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">
                        Nearest
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
