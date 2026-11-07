import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Link2,
  Unlink,
  Building2,
  MapPin,
  Check,
  AlertTriangle,
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
  Plus
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';
import { calculateDistanceKm } from '../../../data/pakistanLocations';

export const ZoneStoreAssignmentView = ({ onNavigateToStores = null }) => {
  const { addToast } = useStore();

  const [zones, setZones] = useState([]);
  const [stores, setStores] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Store Filters
  const [retailerFilter, setRetailerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreIdsToAssign, setSelectedStoreIdsToAssign] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Leaflet Map Reference
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const storeMarkersGroupRef = useRef(null);

  // 4 Core Retailers
  const CORE_RETAILERS = [
    { id: 'tenant-alfatah', name: 'Al-Fatah', color: '#991b1b', logo: '🏬' },
    { id: 'tenant-chasevalue', name: 'Chase Value', color: '#854d0e', logo: '🛒' },
    { id: 'tenant-chaseup', name: 'Chase Up', color: '#6b21a8', logo: '🏪' },
    { id: 'tenant-unimart', name: 'Unimart', color: '#0284c7', logo: '🥬' }
  ];

  // Fetch Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [zonesRes, storesRes, assignRes] = await Promise.all([
        apiService.getZones(),
        apiService.getStores(),
        apiService.getAllAssignments()
      ]);

      if (zonesRes?.success && Array.isArray(zonesRes.zones)) {
        setZones(zonesRes.zones);
        if (zonesRes.zones.length > 0 && !selectedZoneId) {
          setSelectedZoneId(zonesRes.zones[0].zoneId);
        }
      }

      if (storesRes?.success && Array.isArray(storesRes.stores)) {
        setStores(storesRes.stores);
      }

      if (assignRes?.success && Array.isArray(assignRes.assignments)) {
        setAssignments(assignRes.assignments);
      }
    } catch (err) {
      console.warn('Assignments load error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Currently selected Zone Object
  const activeZone = useMemo(() => {
    return zones.find((z) => z.zoneId === selectedZoneId) || zones[0] || null;
  }, [zones, selectedZoneId]);

  // Stores currently assigned to the active zone
  const assignedStoreIdsSet = useMemo(() => {
    if (!activeZone) return new Set();
    const list = assignments.filter((a) => a.zoneId === activeZone.zoneId && a.isActive !== false);
    return new Set(list.map((a) => a.storeId));
  }, [assignments, activeZone]);

  const assignedStores = useMemo(() => {
    return stores.filter((s) => assignedStoreIdsSet.has(s.storeId || s._id));
  }, [stores, assignedStoreIdsSet]);

  const unassignedStores = useMemo(() => {
    return stores.filter((s) => !assignedStoreIdsSet.has(s.storeId || s._id));
  }, [stores, assignedStoreIdsSet]);

  // Filtered Unassigned Stores available to assign
  const filteredUnassignedStores = useMemo(() => {
    return unassignedStores.filter((store) => {
      // Retailer Filter
      if (retailerFilter !== 'all') {
        const canonical = String(store.tenantId || '').toLowerCase();
        const target = retailerFilter.toLowerCase();
        const matches =
          canonical.includes(target.replace('tenant-', '')) ||
          (target.includes('unimart') && (canonical.includes('freshmart') || canonical.includes('unimart')));
        if (!matches) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = String(store.name || '').toLowerCase();
        const bName = String(store.branchName || '').toLowerCase();
        const sId = String(store.storeId || store._id || '').toLowerCase();
        if (!name.includes(q) && !bName.includes(q) && !sId.includes(q)) return false;
      }

      return true;
    });
  }, [unassignedStores, retailerFilter, searchQuery]);

  // Zone Centroid
  const zoneCentroid = useMemo(() => {
    if (!activeZone?.geometry?.coordinates?.[0]) return { lat: 31.4125, lng: 73.0995 };
    const coords = activeZone.geometry.coordinates[0];
    let sumLat = 0;
    let sumLng = 0;
    coords.forEach(([lng, lat]) => {
      sumLat += lat;
      sumLng += lng;
    });
    return {
      lat: sumLat / coords.length,
      lng: sumLng / coords.length
    };
  }, [activeZone]);

  // Proximity Calculation & Suggested Nearby Stores
  const storesWithDistance = useMemo(() => {
    return filteredUnassignedStores.map((store) => {
      const sLat = Number(store.latitude);
      const sLng = Number(store.longitude);
      const dist = calculateDistanceKm(zoneCentroid.lat, zoneCentroid.lng, sLat, sLng);
      return {
        ...store,
        distanceToZoneCentroidKm: Number(dist.toFixed(1)),
        isNearby: dist <= 7.0,
        isFarWarning: dist > 12.0
      };
    }).sort((a, b) => a.distanceToZoneCentroidKm - b.distanceToZoneCentroidKm);
  }, [filteredUnassignedStores, zoneCentroid]);

  // Multi-Select Toggle
  const toggleStoreSelect = (storeId) => {
    setSelectedStoreIdsToAssign((prev) => {
      const copy = new Set(prev);
      if (copy.has(storeId)) copy.delete(storeId);
      else copy.add(storeId);
      return copy;
    });
  };

  const selectAllFiltered = () => {
    const allIds = storesWithDistance.map((s) => s.storeId || s._id);
    setSelectedStoreIdsToAssign(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedStoreIdsToAssign(new Set());
  };

  // Assign Selected Stores
  const handleAssignSelected = async () => {
    if (!activeZone || selectedStoreIdsToAssign.size === 0) return;

    setIsSubmitting(true);
    try {
      const ids = Array.from(selectedStoreIdsToAssign);
      const res = await apiService.assignStoresToZone(activeZone.zoneId, ids);
      if (res && res.success) {
        if (addToast) {
          addToast(`Successfully assigned ${ids.length} store(s) to ${activeZone.name}!`, 'success');
        }
        if (res.warnings && res.warnings.length > 0) {
          addToast(`Note: ${res.warnings.length} store(s) are geographically far from zone boundary.`, 'info');
        }
        setSelectedStoreIdsToAssign(new Set());
        loadData();
      } else {
        if (addToast) addToast(res?.message || 'Assignment failed.', 'error');
      }
    } catch (e) {
      if (addToast) addToast(e.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove Store from Zone
  const handleRemoveStore = async (storeId) => {
    if (!activeZone) return;
    try {
      const res = await apiService.removeStoreFromZone(activeZone.zoneId, storeId);
      if (res && res.success) {
        if (addToast) addToast(`Store unassigned from ${activeZone.name}.`, 'info');
        loadData();
      } else {
        if (addToast) addToast(res?.message || 'Removal failed.', 'error');
      }
    } catch (e) {
      if (addToast) addToast(e.message, 'error');
    }
  };

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [zoneCentroid.lat, zoneCentroid.lng],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    polygonLayerRef.current = L.layerGroup().addTo(map);
    storeMarkersGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Map when activeZone or assigned stores change
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonLayerRef.current || !storeMarkersGroupRef.current) return;
    polygonLayerRef.current.clearLayers();
    storeMarkersGroupRef.current.clearLayers();

    if (!activeZone) return;

    // 1. Draw Active Zone Polygon
    if (activeZone.geometry?.coordinates?.[0]) {
      const latLngs = activeZone.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
      const color = activeZone.color || '#10b981';

      const polygon = L.polygon(latLngs, {
        color: color,
        weight: 3,
        fillColor: color,
        fillOpacity: 0.35
      });
      polygon.bindPopup(`<strong>${activeZone.name}</strong><br/>Delivery Fee: Rs. ${activeZone.deliveryCharge}`);
      polygonLayerRef.current.addLayer(polygon);

      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }

    // 2. Draw Assigned Stores Markers
    assignedStores.forEach((store) => {
      const sLat = Number(store.latitude);
      const sLng = Number(store.longitude);
      if (isNaN(sLat) || isNaN(sLng)) return;

      const retailer = CORE_RETAILERS.find((r) =>
        String(store.tenantId || '').toLowerCase().includes(r.id.replace('tenant-', ''))
      ) || { name: 'Retailer', color: '#059669', logo: '🏬' };

      const pinIcon = L.divIcon({
        className: 'custom-assigned-store-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="width: 32px; height: 32px; border-radius: 10px; background: ${retailer.color}; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
              ${retailer.logo}
            </div>
            <div style="margin-top: 2px; padding: 1px 6px; border-radius: 9999px; background: #059669; color: white; font-size: 9px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
              ✓ ${store.branchName || store.name}
            </div>
          </div>
        `,
        iconSize: [32, 48],
        iconAnchor: [16, 40]
      });

      const marker = L.marker([sLat, sLng], { icon: pinIcon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 11px;">
          <strong style="color: ${retailer.color}; font-size: 12px;">${store.name}</strong>
          <p style="color: #64748b; margin: 2px 0 4px 0;">${store.address}</p>
          <span style="color: #059669; font-weight: bold;">Assigned to this zone</span>
        </div>
      `);
      storeMarkersGroupRef.current.addLayer(marker);
    });
  }, [activeZone, assignedStores]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Link2 className="w-6 h-6 text-emerald-600" />
            <span>Zone-Store Assignment</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Assign multiple physical stores to delivery polygons. Store location and delivery coverage are independent.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Assignments</span>
        </button>
      </div>

      {/* Zone Selector Strip */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Select Target Delivery Zone:</span>
          </label>
          <span className="text-[11px] text-slate-400 font-medium">
            Active Zone: <strong className="text-slate-800">{activeZone?.name || 'None'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {zones.map((zone) => {
            const isSelected = activeZone?.zoneId === zone.zoneId;
            const assignedCount = assignments.filter((a) => a.zoneId === zone.zoneId && a.isActive !== false).length;
            const color = zone.color || '#10b981';

            return (
              <button
                key={zone.zoneId}
                onClick={() => setSelectedZoneId(zone.zoneId)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                    <span className="font-bold text-xs truncate">{zone.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {zone.code}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium">
                  <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>Assigned Stores:</span>
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {assignedCount} Store(s)
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Interface: Left Map & Assigned Stores, Right Store Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (6 cols): Leaflet Map & Assigned Stores */}
        <div className="lg:col-span-6 space-y-4">
          {/* Interactive Map */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Zone Coverage & Assigned Stores Map</span>
              </span>
              <span className="text-[10px] text-slate-400">Stores do not need to be inside polygon</span>
            </div>
            <div ref={mapContainerRef} className="w-full h-72 z-10" style={{ minHeight: '280px' }}></div>
          </div>

          {/* Currently Assigned Stores List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Stores Serving {activeZone?.name || 'Selected Zone'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {assignedStores.length} store(s) authorized to fulfill orders in this zone.
                </p>
              </div>
            </div>

            {assignedStores.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <AlertTriangle className="w-8 h-8 mx-auto text-amber-500/70 mb-2" />
                <p className="font-semibold text-slate-700 text-xs">No stores currently assigned</p>
                <p className="text-[11px] mt-0.5">Select stores from the panel on the right to assign them.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {assignedStores.map((store) => {
                  const sId = store.storeId || store._id;
                  const retailer = CORE_RETAILERS.find((r) =>
                    String(store.tenantId || '').toLowerCase().includes(r.id.replace('tenant-', ''))
                  ) || { name: 'Retailer', color: '#059669', logo: '🏬' };

                  return (
                    <div key={sId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border"
                          style={{
                            backgroundColor: `${retailer.color}15`,
                            borderColor: `${retailer.color}30`,
                            color: retailer.color
                          }}
                        >
                          {retailer.logo}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{store.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {retailer.name} • {store.branchName} • {store.city}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStore(sId)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (6 cols): Multi-Select Store Assignment Picker */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Assign Available Stores</h3>
              <p className="text-[11px] text-slate-500">
                Filter by retailer and select stores to link to {activeZone?.name}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onNavigateToStores && (
                <button
                  type="button"
                  onClick={onNavigateToStores}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Store</span>
                </button>
              )}
              {selectedStoreIdsToAssign.size > 0 && (
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  {selectedStoreIdsToAssign.size} Selected
                </span>
              )}
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store or branch..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
            <select
              value={retailerFilter}
              onChange={(e) => setRetailerFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="all">All Retailers</option>
              {CORE_RETAILERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Showing {storesWithDistance.length} unassigned store(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="text-emerald-600 hover:text-emerald-700 font-bold transition cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-slate-500 hover:text-slate-700 font-bold transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Stores List with Proximity Warnings */}
          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto space-y-1">
            {storesWithDistance.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Store className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No unassigned stores match your filters</p>
                <p className="text-[11px] mt-0.5">All matching stores may already be assigned to this zone.</p>
              </div>
            ) : (
              storesWithDistance.map((store) => {
                const sId = store.storeId || store._id;
                const isSelected = selectedStoreIdsToAssign.has(sId);
                const retailer = CORE_RETAILERS.find((r) =>
                  String(store.tenantId || '').toLowerCase().includes(r.id.replace('tenant-', ''))
                ) || { name: 'Retailer', color: '#059669', logo: '🏬' };

                return (
                  <div
                    key={sId}
                    onClick={() => toggleStoreSelect(sId)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 text-xs ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : 'bg-white border-slate-100 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                          isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 truncate">{store.name}</p>
                          {store.isNearby && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-md flex items-center gap-0.5 shrink-0">
                              <Sparkles className="w-2.5 h-2.5" /> Nearby
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {retailer.name} • {store.branchName} • {store.address}
                        </p>

                        {/* Distance to zone warning */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 font-mono">
                            ~{store.distanceToZoneCentroidKm} km from zone
                          </span>
                          {store.isFarWarning && (
                            <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> High distance warning
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold border shrink-0"
                      style={{
                        backgroundColor: `${retailer.color}10`,
                        borderColor: `${retailer.color}30`,
                        color: retailer.color
                      }}
                    >
                      {retailer.name}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Assign Action Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleAssignSelected}
              disabled={selectedStoreIdsToAssign.size === 0 || isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Link2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Assigning...'
                  : `Assign ${selectedStoreIdsToAssign.size} Selected Store(s) to ${activeZone?.name || 'Zone'}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
