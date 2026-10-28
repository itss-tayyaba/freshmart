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
  Sparkles,
  PackageCheck,
  Store
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

// Custom Leaflet SVG Pins
const createPickupPin = (storeName = 'Store') =>
  L.divIcon({
    className: 'custom-customer-pickup-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #0369a1; border: 2.5px solid #ffffff; box-shadow: 0 6px 14px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <span style="font-size: 14px;">🏬</span>
        </div>
        <div style="margin-top: 2px; padding: 2px 6px; border-radius: 9999px; background: #075985; color: #e0f2fe; font-size: 8px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
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
        <span style="position: absolute; top: -2px; width: 34px; height: 34px; border-radius: 9999px; background: rgba(2, 132, 199, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 32px; height: 32px; border-radius: 9999px; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 6px 14px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="margin-top: 2px; padding: 2px 6px; border-radius: 9999px; background: #0c4a6e; color: #f0f9ff; font-size: 8px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${customerName} (Drop-off)
        </div>
      </div>
    `,
    iconSize: [34, 48],
    iconAnchor: [17, 42],
    popupAnchor: [0, -42]
  });

const createRiderPin = (riderName = 'Courier') =>
  L.divIcon({
    className: 'custom-customer-rider-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <span style="position: absolute; top: -3px; width: 38px; height: 38px; border-radius: 9999px; background: rgba(2, 132, 199, 0.45); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 36px; height: 36px; border-radius: 9999px; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 8px 16px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
          <span style="font-size: 17px; line-height: 1;">🛵</span>
        </div>
        <div style="margin-top: 2px; padding: 1px 7px; border-radius: 9999px; background: #082f49; color: #bae6fd; font-size: 8px; font-weight: 900; letter-spacing: 0.5px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${riderName} (LIVE)
        </div>
      </div>
    `,
    iconSize: [38, 52],
    iconAnchor: [19, 46],
    popupAnchor: [0, -46]
  });

export const CustomerLiveTrackingCard = ({ activeOrder }) => {
  const {
    riderLiveTelemetry,
    currentTenant,
    addToast,
    verifyOrderDeliveryOtp,
    assignNearestRiderToOrder
  } = useStore();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const lastOrderIdRef = useRef(null);

  // Normalize order metadata
  const orderId = activeOrder?.id || activeOrder?.orderId || 'ORD-LIVE';
  const cleanId = String(orderId).replace(/^#/, '');
  const orderStatus = String(activeOrder?.status || '').toLowerCase();
  const fulfillmentStage = Number(activeOrder?.fulfillmentStage || 1);

  const isDelivered =
    orderStatus === 'delivered' ||
    orderStatus === 'completed' ||
    activeOrder?.isDelivered === true ||
    fulfillmentStage >= 7;

  // Courier is only active when an actual rider object with a name/id is assigned AND order is out for delivery/dispatched
  const hasAssignedRiderData = Boolean(
    activeOrder?.assignedRider &&
    (activeOrder.assignedRider.name || activeOrder.assignedRider.id || activeOrder.assignedRider.riderName)
  );

  const isDispatchedStatus =
    ['out for delivery', 'dispatched', 'in transit', 'delivered'].includes(orderStatus) ||
    Boolean(activeOrder?.isDispatched);

  const isRiderAssigned = hasAssignedRiderData && isDispatchedStatus;

  // Real-time telemetry check: only apply if this exact order matches
  const isThisOrderTelemetry = Boolean(
    riderLiveTelemetry &&
    String(riderLiveTelemetry.orderId || '').replace(/^#/, '').toLowerCase() === cleanId.toLowerCase() &&
    isRiderAssigned
  );

  const assignedRider = activeOrder?.assignedRider;
  const riderName =
    (isThisOrderTelemetry ? riderLiveTelemetry.riderName : null) ||
    assignedRider?.name ||
    assignedRider?.riderName ||
    null;

  const riderPhone =
    (isThisOrderTelemetry ? riderLiveTelemetry.riderPhone : null) ||
    assignedRider?.phone ||
    null;

  const riderVehicle =
    (isThisOrderTelemetry ? riderLiveTelemetry.vehicle : null) ||
    assignedRider?.vehicle ||
    assignedRider?.vehicleType ||
    '🏍️ Honda CD 70';

  const riderSpeed = (isThisOrderTelemetry ? riderLiveTelemetry.speed : null) || '28 km/h';

  // Accurate OTP PIN
  const deliveryOtp = String(activeOrder?.deliveryOtp || '7412');

  // Coords fallback (Faisalabad digital hub)
  const pickup = useMemo(() => {
    return activeOrder?.pickupCoords || { lat: 31.4147, lng: 73.0872 };
  }, [activeOrder]);

  const dropoff = useMemo(() => {
    return activeOrder?.dropoffCoords || activeOrder?.destinationCoords || { lat: 31.4082, lng: 73.1023 };
  }, [activeOrder]);

  // Current live rider position
  const riderCoords = useMemo(() => {
    if (!isRiderAssigned) return null;
    if (isThisOrderTelemetry && riderLiveTelemetry?.coords && typeof riderLiveTelemetry.coords.lat === 'number') {
      return riderLiveTelemetry.coords;
    }
    if (assignedRider?.coordinates && typeof assignedRider.coordinates.lat === 'number') {
      return assignedRider.coordinates;
    }
    return {
      lat: (pickup.lat + dropoff.lat) / 2,
      lng: (pickup.lng + dropoff.lng) / 2
    };
  }, [isRiderAssigned, isThisOrderTelemetry, riderLiveTelemetry, assignedRider, pickup, dropoff]);

  // Dynamic distance in KM
  const distanceKm = useMemo(() => {
    if (!riderCoords) return 1.6;
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
  const storeLabel =
    activeOrder?.branchName ||
    currentTenant?.displayName ||
    currentTenant?.name ||
    'Unimaart Store';

  // Initialize Map ONCE & Update smoothly without recreation (ZERO FLICKER)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const centerCoords = isRiderAssigned && riderCoords ? [riderCoords.lat, riderCoords.lng] : [pickup.lat, pickup.lng];
      const map = L.map(mapContainerRef.current, {
        center: centerCoords,
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
        icon: createPickupPin(storeLabel)
      }).addTo(map);
      pickupMarker.bindPopup(`<b>${storeLabel}</b><br/>Store Pickup & Packing Point`);
      pickupMarkerRef.current = pickupMarker;

      // Customer Drop-off Marker
      const dropoffMarker = L.marker([dropoff.lat, dropoff.lng], {
        icon: createDropoffPin(activeOrder?.customerName || 'Your Location')
      }).addTo(map);
      dropoffMarker.bindPopup(`<b>Your Delivery Address</b><br/>${activeOrder?.shippingAddress?.address || 'Doorstep Drop-off'}`).openPopup();
      dropoffMarkerRef.current = dropoffMarker;

      if (isRiderAssigned && riderCoords && riderName) {
        // Live Courier Marker
        const riderMarker = L.marker([riderCoords.lat, riderCoords.lng], {
          icon: createRiderPin(riderName),
          zIndexOffset: 1000
        }).addTo(map);
        riderMarkerRef.current = riderMarker;

        // Route: Store -> Rider -> Customer
        const routeCoords = [
          [pickup.lat, pickup.lng],
          [riderCoords.lat, riderCoords.lng],
          [dropoff.lat, dropoff.lng]
        ];
        const polyline = L.polyline(routeCoords, {
          color: '#0284c7', // Unimaart Sky Blue
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
          lineCap: 'round'
        }).addTo(map);
        routePolylineRef.current = polyline;

        map.fitBounds(L.latLngBounds([pickup, riderCoords, dropoff]), { padding: [35, 35] });
      } else {
        // No rider assigned yet: Parcel is being packed in dark store
        const routeCoords = [
          [pickup.lat, pickup.lng],
          [dropoff.lat, dropoff.lng]
        ];
        const polyline = L.polyline(routeCoords, {
          color: '#94a3b8',
          weight: 3,
          opacity: 0.6,
          dashArray: '5, 8',
          lineCap: 'round'
        }).addTo(map);
        routePolylineRef.current = polyline;

        map.fitBounds(L.latLngBounds([pickup, dropoff]), { padding: [40, 40] });
      }

      lastOrderIdRef.current = cleanId;
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    } else {
      // Map instance exists: update positions and markers reactively
      const map = mapInstanceRef.current;
      pickupMarkerRef.current?.setLatLng([pickup.lat, pickup.lng]);
      dropoffMarkerRef.current?.setLatLng([dropoff.lat, dropoff.lng]);

      if (isRiderAssigned && riderCoords && riderName) {
        if (!riderMarkerRef.current) {
          riderMarkerRef.current = L.marker([riderCoords.lat, riderCoords.lng], {
            icon: createRiderPin(riderName),
            zIndexOffset: 1000
          }).addTo(map);
        } else {
          riderMarkerRef.current.setLatLng([riderCoords.lat, riderCoords.lng]);
        }

        routePolylineRef.current?.setLatLngs([
          [pickup.lat, pickup.lng],
          [riderCoords.lat, riderCoords.lng],
          [dropoff.lat, dropoff.lng]
        ]);
        routePolylineRef.current?.setStyle({ color: '#0284c7', weight: 4, opacity: 0.85 });
        map.fitBounds(L.latLngBounds([pickup, riderCoords, dropoff]), { padding: [35, 35] });
      } else {
        if (riderMarkerRef.current) {
          map.removeLayer(riderMarkerRef.current);
          riderMarkerRef.current = null;
        }
        routePolylineRef.current?.setLatLngs([
          [pickup.lat, pickup.lng],
          [dropoff.lat, dropoff.lng]
        ]);
        routePolylineRef.current?.setStyle({ color: '#94a3b8', weight: 3, opacity: 0.6 });
        map.fitBounds(L.latLngBounds([pickup, dropoff]), { padding: [40, 40] });
      }
    }
  }, [cleanId, isRiderAssigned, riderName, riderCoords?.lat, riderCoords?.lng]);

  // Clean up map only on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Smooth position update on live telemetry
  useEffect(() => {
    if (!isRiderAssigned || !riderCoords) return;
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
  }, [riderCoords?.lat, riderCoords?.lng, isRiderAssigned]);

  return (
    <div className="bg-white rounded-3xl border border-sky-100 shadow-xl overflow-hidden space-y-4">
      
      {/* Top Header Bar: Unimaart Blue/Slate Brand Palette */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
            {isDelivered ? '✅' : isRiderAssigned ? '🛵' : '📦'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-black text-sm text-white">#{cleanId}</span>
              {isDelivered ? (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-white">
                  Delivered &bull; Handover Verified
                </span>
              ) : isRiderAssigned ? (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-400 text-slate-950 flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-950"></span>
                  <span>InDrive Live Tracking</span>
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-950 animate-ping"></span>
                  <span>Packing In Dark Store</span>
                </span>
              )}
            </div>
            <p className="text-xs text-sky-200 mt-0.5 flex items-center gap-1">
              {isDelivered ? (
                <span>Order safely delivered to your doorstep</span>
              ) : isRiderAssigned ? (
                <span>Rider {riderName} is sharing live GPS telemetry &amp; en route</span>
              ) : (
                <span>Parcel is being packed in store &bull; Will be ready for dispatch in a few minutes</span>
              )}
            </p>
          </div>
        </div>

        {/* Dynamic Distance & ETA badge */}
        {!isDelivered && (
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl px-3.5 py-2 self-start sm:self-auto text-xs">
            <Clock className="w-4 h-4 text-amber-300 shrink-0" />
            <div>
              {isRiderAssigned ? (
                <>
                  <div className="font-black text-amber-300">~{etaMinutes} mins ({distanceKm} km away)</div>
                  <div className="text-[10px] text-slate-300">Speed: {riderSpeed}</div>
                </>
              ) : (
                <>
                  <div className="font-black text-amber-300">Est. Ready in ~3-5 mins</div>
                  <div className="text-[10px] text-slate-300">Dark Store Packing</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Leaflet Dual Map Container */}
      <div className="px-4 sm:px-5">
        <div className="relative isolate z-0 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
          <div ref={mapContainerRef} className="h-64 sm:h-72 w-full z-10" />

          {/* Map Overlay Badge */}
          <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
            </span>
            <span className="text-[11px]">
              {isRiderAssigned
                ? "Rider sees your location • You see rider's live route"
                : `Store Packing Desk: ${storeLabel} • Preparing parcel`}
            </span>
          </div>
        </div>
      </div>

      {/* Lower Row: Courier / Store Details + Handover OTP PIN */}
      <div className="px-4 sm:px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Box: Courier Card (When Dispatched) OR Store Packing Card (When Preparing) */}
        {isRiderAssigned && riderName ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-300 text-sky-900 flex items-center justify-center font-black text-lg shrink-0">
                🛵
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-900 text-sm truncate">{riderName}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">★ 4.9</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{riderVehicle}</p>
                <p className="text-[10px] text-sky-700 font-bold mt-0.5">Assigned Delivery Courier</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {riderPhone && (
                <>
                  <a
                    href={`tel:${riderPhone}`}
                    className="p-2.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 hover:text-sky-700 transition shadow-2xs cursor-pointer"
                    title="Call Rider"
                  >
                    <Phone className="w-4 h-4 text-sky-600" />
                  </a>
                  <a
                    href={`https://wa.me/${riderPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 hover:text-sky-700 transition shadow-2xs cursor-pointer"
                    title="WhatsApp Rider"
                  >
                    <MessageCircle className="w-4 h-4 text-sky-600" />
                  </a>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-2.5 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center font-black text-lg shrink-0">
                🏬
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">Awaiting Courier Assignment</span>
                  <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">Store Packing</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  {storeLabel} packing staff are currently preparing your parcel.
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Once ready in a few minutes, the nearest available on-duty rider will be automatically dispatched.
                </p>
              </div>
            </div>

            {/* Quick Dispatch Action Button */}
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 mt-1">
              <span className="text-[10px] text-slate-500 font-medium">Ready in ~3 mins</span>
              <button
                type="button"
                onClick={() => {
                  if (assignNearestRiderToOrder) {
                    assignNearestRiderToOrder(activeOrder.id || activeOrder.orderId, true);
                  }
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                title="Dispatch to the nearest available on-duty rider"
              >
                <span>⚡ Dispatch to Nearest Rider</span>
              </button>
            </div>
          </div>
        )}

        {/* Right Box: Handover OTP Verification */}
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
        ) : isRiderAssigned ? (
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
                  Tell this 4-digit code to rider {riderName} upon arrival
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
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                title="Confirm and verify delivery"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify & Complete</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                🔒
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800 text-xs">Customer Handover OTP</span>
                  <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.2 rounded uppercase">Awaiting Rider</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">
                  OTP will activate once your parcel is dispatched to the courier
                </p>
              </div>
            </div>
            <span className="font-mono font-bold text-sm px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-400 tracking-widest shadow-2xs">
              ••••
            </span>
          </div>
        )}

      </div>

    </div>
  );
};
