import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Building2,
  MapPin,
  Check,
  Search,
  Filter,
  RefreshCw,
  Store,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  X,
  Compass,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  Globe,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { switchMapTileLayer } from '../../../utils/mapTiles';
import {
  FOUR_PARENT_RETAILERS,
  FOUR_MASTER_DELIVERY_ZONES,
  TWELVE_PHYSICAL_STORES,
  loadRetailerStores,
  saveRetailerStores,
  loadMasterZones
} from '../../../data/retailerZoneHierarchyData';

// HTML escape helper for safe Leaflet popup injection
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

// Backward compatibility exports
export const THREE_MASTER_REGIONS = FOUR_MASTER_DELIVERY_ZONES;
export const isStoreAreaPolygon = () => false;
export const DEFAULT_DELIVERY_ZONES = FOUR_MASTER_DELIVERY_ZONES;
export const detectRegionSector = () => FOUR_MASTER_DELIVERY_ZONES[0];

export const ZoneStoreAssignmentView = ({ onNavigateToStores = null }) => {
  const { addToast } = useStore();

  // Core state: 4 parent retailers, 4 master zones, and 12 child stores
  const [parentRetailers] = useState(FOUR_PARENT_RETAILERS);
  const [masterZones, setMasterZones] = useState(() => loadMasterZones());
  const [stores, setStores] = useState(() => loadRetailerStores());

  // View & Filter states
  const [activeTab, setActiveTab] = useState('retailers'); // 'retailers' | 'zones' | 'database'
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('all');
  const [selectedRetailerFilter, setSelectedRetailerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tileLayerType, setTileLayerType] = useState('street');

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const zonePolygonsGroupRef = useRef(null);
  const storeMarkersGroupRef = useRef(null);

  // Synchronize stores state to localStorage and custom event
  const updateStoreZone = (storeId, newZoneId) => {
    const updated = stores.map((s) => {
      const id = s.storeId || s._id;
      if (id === storeId) {
        return { ...s, deliveryZoneId: newZoneId };
      }
      return s;
    });

    setStores(updated);
    saveRetailerStores(updated);

    const storeObj = stores.find((s) => (s.storeId || s._id) === storeId);
    const zoneObj = masterZones.find((z) => (z.zoneId || z._id) === newZoneId);

    if (addToast) {
      addToast(
        'Delivery Zone Assigned 📍',
        `${storeObj?.name || 'Store'} is now assigned to ${zoneObj?.name || newZoneId}.`,
        'success'
      );
    }
  };

  // Expose global callback for in-map Leaflet popup zone change
  useEffect(() => {
    window.__handlePopupZoneChange = (storeId, newZoneId) => {
      updateStoreZone(storeId, newZoneId);
    };
    return () => {
      delete window.__handlePopupZoneChange;
    };
  }, [stores, masterZones]);

  // Filtered stores calculation
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.branchName.toLowerCase().includes(q) ||
        s.parentRetailerName.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q);

      const matchesZone =
        selectedZoneFilter === 'all' || s.deliveryZoneId === selectedZoneFilter;

      const matchesRetailer =
        selectedRetailerFilter === 'all' || s.retailerId === selectedRetailerFilter;

      return matchesSearch && matchesZone && matchesRetailer;
    });
  }, [stores, searchQuery, selectedZoneFilter, selectedRetailerFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalStores = stores.length;
    const assignedCount = stores.filter((s) => Boolean(s.deliveryZoneId)).length;
    return {
      parentRetailersCount: parentRetailers.length,
      childStoresCount: totalStores,
      masterZonesCount: masterZones.length,
      assignedPercent: totalStores > 0 ? Math.round((assignedCount / totalStores) * 100) : 100
    };
  }, [parentRetailers, stores, masterZones]);

  // ---------------------------------------------------------------------------
  // MAP INITIALIZATION (Leaflet)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Faisalabad Center Coordinates
    const map = L.map(mapContainerRef.current, {
      center: [31.4140, 73.0950],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    switchMapTileLayer(map, tileLayerType, tileLayerRef);

    zonePolygonsGroupRef.current = L.layerGroup().addTo(map);
    storeMarkersGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when user toggles Street / Satellite / Hybrid
  const handleTileChange = (type) => {
    setTileLayerType(type);
    if (mapInstanceRef.current) {
      switchMapTileLayer(mapInstanceRef.current, type, tileLayerRef);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER MASTER ZONE POLYGONS & STORE PINS ON MAP
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapInstanceRef.current || !zonePolygonsGroupRef.current || !storeMarkersGroupRef.current) return;

    zonePolygonsGroupRef.current.clearLayers();
    storeMarkersGroupRef.current.clearLayers();

    // 1. Draw 4 Master Delivery Zone Polygons
    masterZones.forEach((zone) => {
      if (!zone.polygon?.coordinates || zone.polygon.coordinates.length < 3) return;

      const isFiltered = selectedZoneFilter !== 'all' && selectedZoneFilter !== (zone.zoneId || zone._id);
      const strokeOpacity = isFiltered ? 0.3 : 0.9;
      const fillOpacity = isFiltered ? 0.05 : 0.22;

      const polygon = L.polygon(zone.polygon.coordinates, {
        color: zone.color,
        weight: isFiltered ? 1.5 : 3,
        opacity: strokeOpacity,
        fillColor: zone.color,
        fillOpacity: fillOpacity,
        dashArray: isFiltered ? '4, 4' : null
      });

      const storesInZone = stores.filter((s) => s.deliveryZoneId === (zone.zoneId || zone._id));

      polygon.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 190px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: ${zone.color}; font-size: 13px;">${esc(zone.name)}</strong>
            <span style="font-size: 10px; background: ${zone.color}20; color: ${zone.color}; padding: 2px 6px; border-radius: 6px; font-weight: 800;">
              Zone ${zone.zoneNumber}
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            Delivery Fee: <strong style="color: #0f172a;">Rs. ${zone.deliveryFee || 60}</strong>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            Linked Physical Stores: <strong style="color: #0f172a;">${storesInZone.length} Stores</strong>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; font-size: 10px;">
            ${storesInZone.map((s) => `• <strong>${esc(s.name)}</strong> (${esc(s.parentRetailerName)})`).join('<br/>')}
          </div>
        </div>
      `);

      zonePolygonsGroupRef.current.addLayer(polygon);
    });

    // 2. Draw 12 Physical Child Store Markers
    filteredStores.forEach((store) => {
      const lat = Number(store.latitude);
      const lng = Number(store.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const assignedZone = masterZones.find((z) => (z.zoneId || z._id) === store.deliveryZoneId) || masterZones[0];
      const parentRetailer = parentRetailers.find((r) => r.id === store.retailerId) || parentRetailers[0];
      const zoneColor = assignedZone?.color || '#0284c7';

      const customIcon = L.divIcon({
        className: 'custom-store-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            background: #ffffff;
            border-radius: 12px;
            border: 3px solid ${zoneColor};
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            font-size: 14px;
            cursor: pointer;
            position: relative;
            transition: transform 0.15s ease;
          ">
            <span>${parentRetailer?.logo || '🏬'}</span>
            <span style="
              position: absolute;
              bottom: -6px;
              right: -6px;
              background: ${zoneColor};
              color: #ffffff;
              font-size: 9px;
              font-weight: 900;
              border-radius: 9999px;
              padding: 1px 4px;
              border: 1.5px solid #ffffff;
            ">${store.retailerNumber || '•'}</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const zoneOptionsHtml = masterZones
        .map(
          (z) =>
            `<option value="${z.zoneId || z._id}" ${
              store.deliveryZoneId === (z.zoneId || z._id) ? 'selected' : ''
            }>${esc(z.name)}</option>`
        )
        .join('');

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 220px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 18px;">${parentRetailer?.logo || '🏬'}</span>
            <div>
              <strong style="color: #0f172a; font-size: 13px; display: block;">${esc(store.name)}</strong>
              <span style="font-size: 10px; color: #64748b;">${esc(store.parentRetailerName)} • Physical Child Store</span>
            </div>
          </div>
          <p style="font-size: 11px; color: #475569; margin: 4px 0 8px 0; line-height: 1.3;">
            📍 ${esc(store.address)}
          </p>
          <div style="background: #f1f5f9; padding: 8px; border-radius: 8px; margin-bottom: 6px;">
            <label style="font-size: 10px; font-weight: bold; color: #334155; display: block; margin-bottom: 3px;">
              Assigned Master Delivery Zone:
            </label>
            <select
              onchange="window.__handlePopupZoneChange && window.__handlePopupZoneChange('${store.storeId || store._id}', this.value)"
              style="width: 100%; font-size: 11px; padding: 4px 6px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; font-weight: bold; color: ${zoneColor};"
            >
              ${zoneOptionsHtml}
            </select>
          </div>
        </div>
      `);

      storeMarkersGroupRef.current.addLayer(marker);
    });
  }, [masterZones, stores, filteredStores, selectedZoneFilter, parentRetailers]);

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & KPI METRICS BAR                                        */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Compass className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Retailer Delivery Zone Assignment
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            4 Parent Retailers • 12 Physical Child Stores • 4 Master Geographic Delivery Zones
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold self-start md:self-auto">
          <button
            onClick={() => setActiveTab('retailers')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'retailers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Parent Retailers & Child Stores</span>
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'zones'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Master Delivery Zones</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span>MERN Schema</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Parent Retailers</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-slate-900">{stats.parentRetailersCount}</span>
            <span className="text-[11px] text-slate-500 font-semibold">Supermarket Chains</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Physical Stores</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-emerald-600">{stats.childStoresCount}</span>
            <span className="text-[11px] text-slate-500 font-semibold">Child Branches (3 Each)</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Master Delivery Zones</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-indigo-600">{stats.masterZonesCount}</span>
            <span className="text-[11px] text-slate-500 font-semibold">Faisalabad Polygons</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Zone Assignment</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-emerald-600">{stats.assignedPercent}%</span>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              ✓ All Stores Linked
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. INTERACTIVE FAISALABAD MAP WITH 4 MASTER ZONES & 12 STORE PINS     */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Map Controls Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight">
                Faisalabad Master Delivery Zones Map
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Click any zone polygon or store pin to view and adjust live delivery zone associations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tile Layer Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-medium border border-slate-200">
              <button
                type="button"
                onClick={() => handleTileChange('street')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  tileLayerType === 'street'
                    ? 'bg-white font-bold text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🗺️ Street
              </button>
              <button
                type="button"
                onClick={() => handleTileChange('satellite')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  tileLayerType === 'satellite'
                    ? 'bg-white font-bold text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🛰️ Satellite
              </button>
              <button
                type="button"
                onClick={() => handleTileChange('hybrid')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  tileLayerType === 'hybrid'
                    ? 'bg-white font-bold text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏙️ Hybrid
              </button>
            </div>

            {/* Reset View */}
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([31.4140, 73.0950], 13);
                  setSelectedZoneFilter('all');
                  setSelectedRetailerFilter('all');
                }
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Map</span>
            </button>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="relative">
          <div ref={mapContainerRef} className="w-full h-[400px] sm:h-[450px] z-10" />

          {/* Map Overlay Zone Pill Legend */}
          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2 overflow-x-auto p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md">
            <button
              onClick={() => setSelectedZoneFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition cursor-pointer ${
                selectedZoneFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Zones ({stores.length} Stores)
            </button>
            {masterZones.map((z) => {
              const count = stores.filter((s) => s.deliveryZoneId === (z.zoneId || z._id)).length;
              const isSelected = selectedZoneFilter === (z.zoneId || z._id);
              return (
                <button
                  key={z.zoneId || z._id}
                  onClick={() => {
                    const zId = z.zoneId || z._id;
                    setSelectedZoneFilter(isSelected ? 'all' : zId);
                    if (mapInstanceRef.current && z.center) {
                      mapInstanceRef.current.flyTo(z.center, 14, { duration: 0.8 });
                    }
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'text-white shadow-xs'
                      : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200'
                  }`}
                  style={{
                    backgroundColor: isSelected ? z.color : undefined,
                    borderColor: isSelected ? z.color : undefined
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: z.color }}
                  />
                  <span>{z.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stores by branch name, address, or parent retailer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Retailer Filter */}
          <select
            value={selectedRetailerFilter}
            onChange={(e) => setSelectedRetailerFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">🏢 All Parent Retailers (4)</option>
            {parentRetailers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.logo} {r.name}
              </option>
            ))}
          </select>

          {/* Zone Filter */}
          <select
            value={selectedZoneFilter}
            onChange={(e) => setSelectedZoneFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">🗺️ All Master Delivery Zones (4)</option>
            {masterZones.map((z) => (
              <option key={z.zoneId || z._id} value={z.zoneId || z._id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. TAB 1: PARENT RETAILER & CHILD STORES ASSIGNMENT INTERFACE        */}
      {/* ===================================================================== */}
      {activeTab === 'retailers' && (
        <div className="space-y-6">
          {parentRetailers
            .filter((r) => selectedRetailerFilter === 'all' || r.id === selectedRetailerFilter)
            .map((parentRetailer) => {
              const childStores = filteredStores.filter((s) => s.retailerId === parentRetailer.id);
              if (childStores.length === 0 && searchQuery) return null;

              return (
                <div
                  key={parentRetailer.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden"
                >
                  {/* Parent Retailer Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
                        style={{ backgroundColor: `${parentRetailer.color}15`, color: parentRetailer.color }}
                      >
                        {parentRetailer.logo}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-base">
                            {parentRetailer.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white">
                            Parent Retailer
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ {parentRetailer.status || 'Active'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {parentRetailer.fullName} • {childStores.length} Child Stores in Faisalabad
                        </p>
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] font-bold text-slate-500 block">Assigned Zones</span>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {Array.from(new Set(childStores.map((s) => s.deliveryZoneId))).length} / 4 Zones
                      </span>
                    </div>
                  </div>

                  {/* Informational Callout for Branch-Specific Mapping */}
                  <div className="px-5 py-2.5 bg-amber-50/70 border-b border-amber-100 text-amber-900 text-xs font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Notice:</strong> All child branches belong to <strong>{parentRetailer.name}</strong>, but each physical branch is assigned its own independent delivery zone.
                    </span>
                  </div>

                  {/* Child Physical Stores Grid */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {childStores.map((store) => {
                      const assignedZone = masterZones.find((z) => (z.zoneId || z._id) === store.deliveryZoneId) || masterZones[0];

                      return (
                        <div
                          key={store.storeId || store._id}
                          className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-4 space-y-3.5 transition shadow-2xs hover:shadow-xs flex flex-col justify-between"
                        >
                          {/* Store Details Header */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                Retailer #{store.retailerNumber || '•'}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  Physical store
                                </span>
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Child store
                                </span>
                              </div>
                            </div>

                            <h4 className="font-black text-slate-900 text-sm leading-tight">
                              {store.name}
                            </h4>

                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              📍 {store.address}
                            </p>

                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 pt-1">
                              <span>GPS: {Number(store.latitude).toFixed(4)}, {Number(store.longitude).toFixed(4)}</span>
                              <span>•</span>
                              <span>{store.operatingStatus || 'Open'}</span>
                            </div>
                          </div>

                          {/* Zone Assignment Dropdown Selector */}
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Assign Delivery Zone
                              </label>
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${assignedZone?.color}15`,
                                  color: assignedZone?.color
                                }}
                              >
                                ✓ {assignedZone?.shortName || 'Zone'}
                              </span>
                            </div>

                            <select
                              value={store.deliveryZoneId || ''}
                              onChange={(e) => updateStoreZone(store.storeId || store._id, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition"
                              style={{ borderLeftWidth: '4px', borderLeftColor: assignedZone?.color }}
                            >
                              {masterZones.map((z) => (
                                <option key={z.zoneId || z._id} value={z.zoneId || z._id}>
                                  {z.name} (Zone {z.zoneNumber})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. TAB 2: MASTER DELIVERY ZONES & ASSOCIATIONS TABLE                  */}
      {/* ===================================================================== */}
      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {masterZones.map((zone) => {
            const zId = zone.zoneId || zone._id;
            const linkedStores = stores.filter((s) => s.deliveryZoneId === zId);

            return (
              <div
                key={zId}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Zone Header */}
                  <div
                    className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3"
                    style={{ backgroundColor: `${zone.color}08` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xs"
                        style={{ backgroundColor: zone.color }}
                      >
                        {zone.zoneNumber}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-base">{zone.name}</h3>
                        <span className="text-xs text-slate-500 font-medium">
                          Faisalabad Hub • Delivery Fee: Rs. {zone.deliveryFee || 60}
                        </span>
                      </div>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-black shadow-2xs"
                      style={{ backgroundColor: `${zone.color}20`, color: zone.color }}
                    >
                      {linkedStores.length} Stores Linked
                    </span>
                  </div>

                  {/* Associated Retailers List */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Associated Physical Stores:
                    </span>
                    <div className="space-y-2 text-xs">
                      {linkedStores.map((store) => {
                        const parent = parentRetailers.find((r) => r.id === store.retailerId);
                        return (
                          <div
                            key={store.storeId || store._id}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{parent?.logo || '🏬'}</span>
                              <div>
                                <strong className="text-slate-900 block font-bold">
                                  {store.name}
                                </strong>
                                <span className="text-[10px] text-slate-500">
                                  Retailer #{store.retailerNumber} • Parent: {store.parentRetailerName}
                                </span>
                              </div>
                            </div>

                            <select
                              value={store.deliveryZoneId}
                              onChange={(e) => updateStoreZone(store.storeId || store._id, e.target.value)}
                              className="text-[11px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer"
                            >
                              {masterZones.map((z) => (
                                <option key={z.zoneId || z._id} value={z.zoneId || z._id}>
                                  {z.shortName}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                  <span>Min Order: Rs. {zone.minOrder || 400}</span>
                  <button
                    onClick={() => {
                      if (mapInstanceRef.current && zone.center) {
                        mapInstanceRef.current.flyTo(zone.center, 14, { duration: 0.8 });
                      }
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect on Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. TAB 3: MERN DATABASE STRUCTURE & ARCHITECTURE GUIDE                */}
      {/* ===================================================================== */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-2xs">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Correct MERN Architecture for Retailers & Delivery Zones</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Decoupled schema design storing the store-to-zone association directly on the physical store document.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* Collection 1: Retailers (Parent) */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400">1. Retailers (Parent)</span>
                <span className="text-[10px] text-slate-400">Collection</span>
              </div>
              <pre className="text-[11px] leading-relaxed overflow-x-auto text-emerald-300">
{`{
  _id: "tenant-alfatah",
  name: "Al-Fateh",
  type: "parent",
  status: "active"
}`}
              </pre>
            </div>

            {/* Collection 2: Stores (Child Branches) */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-indigo-400">2. Stores (Child)</span>
                <span className="text-[10px] text-slate-400">Collection</span>
              </div>
              <pre className="text-[11px] leading-relaxed overflow-x-auto text-indigo-300">
{`{
  _id: "STR-AF-001",
  retailerId: "tenant-alfatah",
  name: "Al-Fateh — Main Branch",
  type: "child",
  address: "Samanabad, Faisalabad",
  location: {
    type: "Point",
    coordinates: [73.0600, 31.3960]
  },
  deliveryZoneId: "zone_001",
  status: "active"
}`}
              </pre>
            </div>

            {/* Collection 3: DeliveryZones (Master) */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400">3. DeliveryZones</span>
                <span className="text-[10px] text-slate-400">Collection</span>
              </div>
              <pre className="text-[11px] leading-relaxed overflow-x-auto text-amber-300">
{`{
  _id: "zone_001",
  name: "Zone 1 — Samanabad",
  polygon: {
    type: "Polygon",
    coordinates: [ ... ]
  },
  status: "active"
}`}
              </pre>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <strong className="text-slate-900 block font-bold">Why this architecture works:</strong>
            <p>
              • <strong>Clean Decoupling:</strong> Each child physical store references its parent company via <code>retailerId</code> and its assigned delivery area via <code>deliveryZoneId</code>.
            </p>
            <p>
              • <strong>Flexible Branch Scoping:</strong> Multiple branches of the same retailer (e.g. Al-Fateh Main vs Al-Fateh Branch 2) belong to the same parent company, but service completely different geographic zones.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
