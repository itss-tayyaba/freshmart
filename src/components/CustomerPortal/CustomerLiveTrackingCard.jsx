import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Navigation,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

// Custom Leaflet SVG Pins
const createPickupPin = (storeName = 'Store') =>
  L.divIcon({
    className: 'custom-customer-pickup-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #991b1b; border: 2.5px solid #ffffff; box-shadow: 0 6px 14px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <span style="font-size: 14px;">🏬</span>
        </div>
        <div style="margin-top: 2px; padding: 2px 6px; border-radius: 9999px; background: #7f1d1d; color: #fee2e2; font-size: 8px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${storeName}
        </div>
      </div>
    `,
    iconSize: [34, 48],
    iconAnchor: [17, 42],
    popupAnchor: [0, -42]
  });

const createDropoffPin = (customerName = 'You') =>
  L.divIcon({
    className: 'custom-customer-dropoff-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <span style="position: absolute; top: -2px; width: 34px; height: 34px; border-radius: 9999px; background: rgba(59, 130, 246, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 32px; height: 32px; border-radius: 9999px; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 6px 14px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="margin-top: 2px; padding: 2px 6px; border-radius: 9999px; background: #1e3a8a; color: #eff6ff; font-size: 8px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${customerName} (Drop-off)
        </div>
      </div>
    `,
    iconSize: [34, 48],
    iconAnchor: [17, 42],
    popupAnchor: [0, -42]
  });

const createRiderPin = (riderName = 'Rider') =>
  L.divIcon({
    className: 'custom-customer-rider-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <span style="position: absolute; top: -3px; width: 38px; height: 38px; border-radius: 9999px; background: rgba(16, 185, 129, 0.45); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 36px; height: 36px; border-radius: 9999px; background: #059669; border: 2.5px solid #ffffff; box-shadow: 0 8px 16px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
          <span style="font-size: 17px; line-height: 1;">🛵</span>
        </div>
        <div style="margin-top: 2px; padding: 1px 7px; border-radius: 9999px; background: #064e3b; color: #a7f3d0; font-size: 8px; font-weight: 900; letter-spacing: 0.5px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${riderName} (LIVE)
        </div>
      </div>
    `,
    iconSize: [38, 52],
    iconAnchor: [19, 46],
    popupAnchor: [0, -46]
  });

export const CustomerLiveTrackingCard = ({ activeOrder }) => {
  const { riderLiveTelemetry, currentTenant, addToast, verifyOrderDeliveryOtp } = useStore();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const lastOrderIdRef = useRef(null);

  // Normalize order metadata
  const orderId = activeOrder?.id || activeOrder?.orderId || 'EB-9SMVJA';
  const cleanId = String(orderId).replace(/^#/, '');
  const isDelivered = activeOrder?.status === 'Delivered';

  // Coords fallback (Faisalabad digital hub)
  const pickup = useMemo(() => {
    return activeOrder?.pickupCoords || { lat: 31.4147, lng: 73.0872 };
  }, [activeOrder]);

  const dropoff = useMemo(() => {
    return activeOrder?.dropoffCoords || activeOrder?.destinationCoords || { lat: 31.4082, lng: 73.1023 };
  }, [activeOrder]);

  // Current live rider position: from broadcasted telemetry if active, or pickup coords
  const isSharing = riderLiveTelemetry?.isSharing !== false;
  const riderCoords = useMemo(() => {
    if (riderLiveTelemetry?.coords && typeof riderLiveTelemetry.coords.lat === 'number') {
      return riderLiveTelemetry.coords;
    }
    return activeOrder?.assignedRider?.coordinates || { lat: 31.4115, lng: 73.0945 };
  }, [riderLiveTelemetry, activeOrder]);

  const riderName = riderLiveTelemetry?.riderName || activeOrder?.assignedRider?.name || 'Ahmad Khan';
  const riderPhone = riderLiveTelemetry?.riderPhone || activeOrder?.assignedRider?.phone || '+92 320 6551696';
  const riderVehicle = riderLiveTelemetry?.vehicle || activeOrder?.assignedRider?.vehicle || '🏍️ Honda 125 (LEK-4821)';
  const riderSpeed = riderLiveTelemetry?.speed || '34 km/h';

  // Accurate OTP PIN
  const deliveryOtp = String(activeOrder?.deliveryOtp || '7412');

  // Calculate dynamic distance in KM
  const distanceKm = useMemo(() => {
    const lat1 = riderCoords.lat;
    const lon1 = riderCoords.lng;
    const lat2 = dropoff.lat;
    const lon2 = dropoff.lng;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.max(0.2, Math.round(R * c * 10) / 10);
  }, [riderCoords, dropoff]);

  const etaMinutes = Math.max(1, Math.round((distanceKm / 28) * 60 + 2));

  // Initialize Map ONCE & Update smoothly without recreation (ZERO FLICKER)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [riderCoords.lat, riderCoords.lng],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: false
      });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Store Pickup Marker
      const pickupMarker = L.marker([pickup.lat, pickup.lng], {
        icon: createPickupPin(currentTenant?.name || 'Al-Fatah Store')
      }).addTo(map);
      pickupMarker.bindPopup(`<b>${currentTenant?.name || 'Al-Fatah Hub'}</b><br/>Store Pickup Point`);
      pickupMarkerRef.current = pickupMarker;

      // Customer Drop-off Marker
      const dropoffMarker = L.marker([dropoff.lat, dropoff.lng], {
        icon: createDropoffPin(activeOrder?.customerName || 'Your Location')
      }).addTo(map);
      dropoffMarker.bindPopup(`<b>Your Address</b><br/>${activeOrder?.shippingAddress?.address || 'Doorstep Drop-off'}`).openPopup();
      dropoffMarkerRef.current = dropoffMarker;

      // Live Courier Marker
      const riderMarker = L.marker([riderCoords.lat, riderCoords.lng], {
        icon: createRiderPin(riderName),
        zIndexOffset: 1000
      }).addTo(map);
      riderMarkerRef.current = riderMarker;

      // Connecting Polyline Route
      const routeCoords = [
        [pickup.lat, pickup.lng],
        [riderCoords.lat, riderCoords.lng],
        [dropoff.lat, dropoff.lng]
      ];
      const polyline = L.polyline(routeCoords, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.8,
        dashArray: '6, 8',
        lineCap: 'round'
      }).addTo(map);
      routePolylineRef.current = polyline;

      const bounds = L.latLngBounds([pickup, riderCoords, dropoff]);
      map.fitBounds(bounds, { padding: [35, 35] });
      lastOrderIdRef.current = cleanId;

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    } else {
      // If order changed, update endpoints
      if (lastOrderIdRef.current !== cleanId) {
        lastOrderIdRef.current = cleanId;
        pickupMarkerRef.current?.setLatLng([pickup.lat, pickup.lng]);
        dropoffMarkerRef.current?.setLatLng([dropoff.lat, dropoff.lng]);
        riderMarkerRef.current?.setLatLng([riderCoords.lat, riderCoords.lng]);
        routePolylineRef.current?.setLatLngs([
          [pickup.lat, pickup.lng],
          [riderCoords.lat, riderCoords.lng],
          [dropoff.lat, dropoff.lng]
        ]);
        mapInstanceRef.current.fitBounds(L.latLngBounds([pickup, riderCoords, dropoff]), { padding: [35, 35] });
      }
    }
  }, [cleanId]);

  // Clean up map only on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Smooth position update on live telemetry without re-rendering map
  useEffect(() => {
    if (!riderCoords) return;
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([riderCoords.lat, riderCoords.lng]);
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.setLatLngs([
        [pickup.lat, pickup.lng],
        [riderCoords.lat, riderCoords.lng],
        [dropoff.lat, dropoff.lng]
      ]);
    }
  }, [riderCoords?.lat, riderCoords?.lng]);

  return (
    <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl overflow-hidden space-y-4">
      
      {/* Top InDrive Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
            🛵
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-black text-sm text-white">#{cleanId}</span>
              {isDelivered ? (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-white">
                  Delivered &bull; Handover Verified
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-950"></span>
                  <span>InDrive Live Tracking</span>
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-200 mt-0.5 flex items-center gap-1">
              <span>Rider {riderName} is sharing live GPS telemetry</span>
            </p>
          </div>
        </div>

        {/* Dynamic Distance & ETA badge */}
        {!isDelivered && (
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl px-3.5 py-2 self-start sm:self-auto text-xs">
            <Clock className="w-4 h-4 text-amber-300 shrink-0" />
            <div>
              <div className="font-black text-amber-300">~{etaMinutes} mins ({distanceKm} km away)</div>
              <div className="text-[10px] text-slate-300">Speed: {riderSpeed}</div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Leaflet Dual Map Container */}
      <div className="px-4 sm:px-5">
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
          <div ref={mapContainerRef} className="h-64 sm:h-72 w-full z-10" />

          {/* Map Overlay Badge: InDrive Dual Telemetry indicator */}
          <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[11px]">Rider sees your location &bull; You see rider's live route</span>
          </div>
        </div>
      </div>

      {/* Lower Row: InDrive Courier Details + Handover OTP PIN */}
      <div className="px-4 sm:px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Driver Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center font-black text-lg shrink-0">
              🛵
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-sm truncate">{riderName}</span>
                <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">★ 4.9</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{riderVehicle}</p>
              <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Assigned Delivery Courier</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`tel:${riderPhone}`}
              className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-700 transition shadow-2xs cursor-pointer"
              title="Call Rider"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
            </a>
            <a
              href={`https://wa.me/${riderPhone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-700 transition shadow-2xs cursor-pointer"
              title="WhatsApp Rider"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
            </a>
          </div>
        </div>

        {/* Handover OTP Verification Box */}
        {isDelivered ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <span className="font-black text-emerald-950 text-sm block">Doorstep Delivery Completed</span>
                <span className="text-[11px] text-emerald-700">Handover OTP verified and parcel safely delivered.</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-1 rounded-lg">
              COMPLETED
            </span>
          </div>
        ) : (
          <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                🔐
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-amber-950 text-xs">Customer Handover OTP</span>
                  <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded uppercase">Required</span>
                </div>
                <p className="text-[10px] text-amber-800 leading-tight mt-0.5 truncate">
                  Tell this 4-digit code to the rider upon parcel arrival
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono font-black text-base px-3 py-1 bg-white border border-amber-400 rounded-xl text-amber-950 tracking-widest shadow-2xs">
                {deliveryOtp}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(deliveryOtp);
                  addToast('OTP Copied 📋', `Share PIN ${deliveryOtp} with rider on delivery.`);
                }}
                className="p-2 bg-amber-200/80 hover:bg-amber-300 text-amber-950 rounded-xl cursor-pointer transition shadow-2xs"
                title="Copy Handover PIN"
              >
                <Copy className="w-4 h-4 text-amber-900" />
              </button>
              <button
                onClick={async () => {
                  if (verifyOrderDeliveryOtp) {
                    const res = await verifyOrderDeliveryOtp(orderId, deliveryOtp, activeOrder?.assignedRider?.id, deliveryOtp);
                    if (res && res.success) {
                      addToast('Delivery Confirmed 🎉', 'Handover verified and order marked as Delivered!');
                    }
                  }
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                title="Confirm and verify delivery"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify & Complete</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
