import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Compass,
  Layers,
  Settings2,
  Store,
  Navigation,
  Info
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { switchMapTileLayer } from '../../../utils/mapTiles';

// Custom SVG pin for Store Branch
const createStoreBranchPin = (name, color = '#059669') =>
  L.divIcon({
    className: 'custom-branch-leaflet-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <span style="position: absolute; top: -3px; width: 38px; height: 38px; border-radius: 9999px; background: ${color}33; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 36px; height: 36px; border-radius: 12px; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 8px 16px -2px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
            <path d="M2 7h20"/>
          </svg>
        </div>
        <div style="margin-top: 3px; padding: 2px 8px; border-radius: 9999px; background: #0f172a; color: white; font-size: 10px; font-weight: 800; letter-spacing: 0.3px; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.25);">
          ${name}
        </div>
      </div>
    `,
    iconSize: [40, 56],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48]
  });

export const DeliveryZoneView = () => {
  const { currentTenant, allBranches, BRANCHES, addToast, updateBranch } = useStore();

  // 1. Get branches belonging to current tenant
  const tenantBranches = useMemo(() => {
    const list = (allBranches && allBranches.length > 0) ? allBranches : BRANCHES;
    const tId = currentTenant?.id || 'company_001';
    const legacy = currentTenant?.legacyId || '';
    return list.filter(
      (b) =>
        b.tenantId === tId ||
        b.tenantId === legacy ||
        (b.companyId && b.companyId === tId) ||
        (currentTenant?.slug && b.slug === currentTenant.slug)
    );
  }, [allBranches, BRANCHES, currentTenant]);

  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    return tenantBranches[0]?._id || tenantBranches[0]?.id || 'branch_001';
  });

  const activeBranch = useMemo(() => {
    return (
      tenantBranches.find((b) => (b._id || b.id) === selectedBranchId) ||
      tenantBranches[0] || {
        _id: 'branch_default',
        name: 'Store Branch (Faisalabad)',
        latitude: 31.4087,
        longitude: 73.1118,
        deliveryRadiusKm: 5,
        deliveryStatus: 'active',
        deliveryTiers: [
          { distanceKm: 1, fee: 0 },
          { distanceKm: 2, fee: 50 },
          { distanceKm: 3, fee: 100 },
          { distanceKm: 4, fee: 150 },
          { distanceKm: 5, fee: 200 }
        ],
        address: 'D-Ground Commercial Area, Faisalabad'
      }
    );
  }, [tenantBranches, selectedBranchId]);

  // Form states
  const [branchName, setBranchName] = useState(activeBranch.name || '');
  const [address, setAddress] = useState(activeBranch.address || '');
  const [lat, setLat] = useState(Number(activeBranch.latitude || 31.4087));
  const [lng, setLng] = useState(Number(activeBranch.longitude || 73.1118));
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(
    Number(activeBranch.deliveryRadiusKm || activeBranch.deliveryRadius || 5)
  );
  const [deliveryStatus, setDeliveryStatus] = useState(activeBranch.deliveryStatus || 'active');
  const [deliveryTiers, setDeliveryTiers] = useState(() => {
    if (Array.isArray(activeBranch.deliveryTiers) && activeBranch.deliveryTiers.length > 0) {
      return activeBranch.deliveryTiers;
    }
    return [
      { distanceKm: 1, fee: 0 },
      { distanceKm: 2, fee: 50 },
      { distanceKm: 3, fee: 100 },
      { distanceKm: 4, fee: 150 },
      { distanceKm: 5, fee: 200 }
    ];
  });

  const [isSaving, setIsSaving] = useState(false);
  const [mapViewMode, setMapViewMode] = useState('street');

  // Leaflet references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const branchMarkerRef = useRef(null);
  const concentricCirclesRef = useRef([]);

  // Sync internal state when active branch changes
  useEffect(() => {
    setBranchName(activeBranch.name || '');
    setAddress(activeBranch.address || '');
    setLat(Number(activeBranch.latitude || 31.4087));
    setLng(Number(activeBranch.longitude || 73.1118));
    setDeliveryRadiusKm(Number(activeBranch.deliveryRadiusKm || activeBranch.deliveryRadius || 5));
    setDeliveryStatus(activeBranch.deliveryStatus || 'active');
    setDeliveryTiers(
      Array.isArray(activeBranch.deliveryTiers) && activeBranch.deliveryTiers.length > 0
        ? activeBranch.deliveryTiers
        : [
            { distanceKm: 1, fee: 0 },
            { distanceKm: 2, fee: 50 },
            { distanceKm: 3, fee: 100 },
            { distanceKm: 4, fee: 150 },
            { distanceKm: 5, fee: 200 }
          ]
    );
  }, [activeBranch]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: true
    });

    switchMapTileLayer(map, mapViewMode, tileLayerRef);

    const themeColor = currentTenant?.color || '#0284c7';
    const marker = L.marker([lat, lng], {
      icon: createStoreBranchPin(branchName || 'Branch Hub', themeColor),
      draggable: true,
      zIndexOffset: 1000
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: inherit; font-size: 11px;">
        <strong style="color: #0f172a; font-size: 13px;">${branchName}</strong>
        <p style="margin: 3px 0 0; color: #475569;">${address || 'Faisalabad Branch Location'}</p>
        <div style="margin-top: 4px; font-weight: 700; color: #059669;">
          📍 GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}
        </div>
      </div>
    `);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const nLat = Number(pos.lat.toFixed(5));
      const nLng = Number(pos.lng.toFixed(5));
      setLat(nLat);
      setLng(nLng);
    });

    map.on('click', (e) => {
      const nLat = Number(e.latlng.lat.toFixed(5));
      const nLng = Number(e.latlng.lng.toFixed(5));
      setLat(nLat);
      setLng(nLng);
      marker.setLatLng([nLat, nLng]);
    });

    mapInstanceRef.current = map;
    branchMarkerRef.current = marker;

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
  }, [selectedBranchId]);

  // Update concentric circles on the map when lat, lng, or deliveryTiers change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear previous circles
    concentricCirclesRef.current.forEach((c) => map.removeLayer(c));
    concentricCirclesRef.current = [];

    if (branchMarkerRef.current) {
      branchMarkerRef.current.setLatLng([lat, lng]);
    }

    const themeColor = currentTenant?.color || '#0284c7';

    // Sort tiers by distance ascending
    const sortedTiers = [...deliveryTiers].sort((a, b) => a.distanceKm - b.distanceKm);

    // Draw concentric circles for each tier
    sortedTiers.forEach((tier, idx) => {
      const radiusMeters = Number(tier.distanceKm) * 1000;
      if (isNaN(radiusMeters) || radiusMeters <= 0) return;

      const opacityStep = 0.08 + idx * 0.04;
      const circle = L.circle([lat, lng], {
        radius: radiusMeters,
        color: themeColor,
        weight: idx === sortedTiers.length - 1 ? 2.5 : 1.2,
        dashArray: idx === sortedTiers.length - 1 ? null : '5, 5',
        opacity: 0.7,
        fillColor: themeColor,
        fillOpacity: Math.min(0.25, opacityStep)
      }).addTo(map);

      circle.bindTooltip(`Radius ${tier.distanceKm} km • Fee: Rs. ${tier.fee}`, {
        sticky: true,
        className: 'concentric-radius-tooltip'
      });

      concentricCirclesRef.current.push(circle);
    });
  }, [lat, lng, deliveryTiers, currentTenant]);

  const handleLayerChange = (layerKey) => {
    setMapViewMode(layerKey);
    if (mapInstanceRef.current) {
      switchMapTileLayer(mapInstanceRef.current, layerKey, tileLayerRef);
    }
  };

  // Add new tier (+ Add Radius Tier)
  const handleAddTier = () => {
    const nextDistance =
      deliveryTiers.length > 0
        ? Math.max(...deliveryTiers.map((t) => Number(t.distanceKm) || 0)) + 1
        : 1;
    const lastFee =
      deliveryTiers.length > 0
        ? deliveryTiers[deliveryTiers.length - 1].fee
        : 0;
    const newTier = { distanceKm: nextDistance, fee: lastFee + 50 };
    setDeliveryTiers([...deliveryTiers, newTier]);
    if (nextDistance > deliveryRadiusKm) {
      setDeliveryRadiusKm(nextDistance);
    }
  };

  // Remove tier
  const handleRemoveTier = (index) => {
    if (deliveryTiers.length <= 1) {
      addToast('Warning', 'The store must have at least one delivery radius tier.', 'info');
      return;
    }
    const updated = deliveryTiers.filter((_, idx) => idx !== index);
    setDeliveryTiers(updated);
  };

  // Update tier fields
  const handleTierChange = (index, field, value) => {
    const updated = [...deliveryTiers];
    updated[index] = {
      ...updated[index],
      [field]: Number(value) || 0
    };
    setDeliveryTiers(updated);
  };

  // Save changes to backend and sync with StoreContext
  const handleSaveDeliveryZone = async () => {
    setIsSaving(true);
    const branchId = activeBranch._id || activeBranch.id;

    const maxTierDist = deliveryTiers.length > 0
      ? Math.max(...deliveryTiers.map((t) => Number(t.distanceKm) || 0))
      : Number(deliveryRadiusKm);

    const payload = {
      name: branchName,
      address,
      latitude: lat,
      longitude: lng,
      deliveryRadiusKm: Math.max(Number(deliveryRadiusKm), maxTierDist),
      deliveryRadius: Math.max(Number(deliveryRadiusKm), maxTierDist),
      deliveryStatus,
      deliveryTiers: [...deliveryTiers].sort((a, b) => a.distanceKm - b.distanceKm)
    };

    // 1. Immediately update local StoreContext and allBranches state
    if (typeof updateBranch === 'function') {
      try {
        await updateBranch(branchId, payload);
      } catch (e) {}
    }

    // 2. Persist to backend delivery-zone API endpoint
    try {
      const response = await fetch(`/api/branches/${encodeURIComponent(branchId)}/delivery-zone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      addToast(
        'Delivery Zones Saved! 💾',
        `Settings successfully saved for ${branchName} (${payload.deliveryRadiusKm} km coverage radius).`
      );
    } catch (err) {
      // Local fallback
      Object.assign(activeBranch, payload);
      addToast(
        'Delivery Zones Saved! 💾',
        `Settings saved locally for ${branchName} (${payload.deliveryRadiusKm} km coverage radius).`
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs: Delivery Zones | Home / Locations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            <span>Delivery Zones</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Coverage Radius, Delivery Zones & Distance-Based Pricing (Faisalabad Hubs)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Home / Locations</span>

          {/* Status Toggle: Store Open / Store Closed */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className={`w-2 h-2 rounded-full ${deliveryStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {deliveryStatus === 'active' ? 'Store Open (Express Delivery)' : 'Store Closed'}
            </span>
            <button
              type="button"
              onClick={() => setDeliveryStatus(deliveryStatus === 'active' ? 'inactive' : 'active')}
              className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                deliveryStatus === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {deliveryStatus === 'active' ? 'Active' : 'Pause'}
            </button>
          </div>
        </div>
      </div>

      {/* Branch Selector if retailer operates multiple branches */}
      {tenantBranches.length > 1 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Selected Branch / Hub:
              </span>
              <span className="text-[11px] text-slate-500">
                Switch between physical branches to customize zone & pricing for each location
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tenantBranches.map((b) => {
              const bId = b._id || b.id;
              const isCurr = bId === selectedBranchId;
              return (
                <button
                  key={bId}
                  type="button"
                  onClick={() => setSelectedBranchId(bId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCurr
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  📍 {b.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Map on Left (concentric circles) | Table on Right (Distance & Delivery Fee) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Leaflet Map with Concentric Rings */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                Interactive Delivery Map (Leaflet)
              </span>
            </div>

            {/* Map Layers */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => handleLayerChange('street')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mapViewMode === 'street'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Street
              </button>
              <button
                type="button"
                onClick={() => handleLayerChange('satellite')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mapViewMode === 'satellite'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => handleLayerChange('hybrid')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mapViewMode === 'hybrid'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Hybrid
              </button>
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div className="rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 relative isolate">
            <div ref={mapContainerRef} className="w-full h-80 sm:h-96 z-0" />

            {/* Floating Coordinate Pill */}
            <div className="absolute bottom-2 left-2 z-[1000] bg-slate-900/90 text-white text-[10px] font-mono px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                {branchName}: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
              </span>
            </div>

            {/* Help tip */}
            <div className="absolute top-2 left-2 z-[1000] bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xs pointer-events-none">
              👆 Click on map or drag pin to position Hub
            </div>
          </div>

          {/* Quick Branch Coordinate & Address Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Branch Name / Dispatch Hub
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Physical Street Address (Faisalabad)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Distance & Delivery Fee Table */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Distance & Delivery Fee Pricing
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {deliveryTiers.length} Active Tiers
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure delivery fees for each distance tier from this physical hub location.
          </p>

          {/* Table: Distance (km) | Delivery Fee (Rs.) | Actions */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-black">
                  <th className="py-3 px-4">Distance (km)</th>
                  <th className="py-3 px-4">Fee (Rs.)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                {deliveryTiers.map((tier, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={tier.distanceKm}
                          onChange={(e) => handleTierChange(idx, 'distanceKm', e.target.value)}
                          className="w-20 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-slate-400 text-[11px]">km</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[11px]">Rs.</span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={tier.fee}
                          onChange={(e) => handleTierChange(idx, 'fee', e.target.value)}
                          className="w-24 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons: [+ Add Radius Tier] [Save Delivery Zones] */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddTier}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Radius Tier</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDeliveryZone}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Delivery Zones'}</span>
            </button>
          </div>

          {/* Info notice about Faisalabad progressive search integration */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Customers located within the maximum delivery radius ({deliveryTiers.length > 0 ? Math.max(...deliveryTiers.map((t) => Number(t.distanceKm) || 5)) : deliveryRadiusKm} km) will see this store as eligible for delivery. When multiple retailer zones overlap, all eligible stores are displayed together for customer choice.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
