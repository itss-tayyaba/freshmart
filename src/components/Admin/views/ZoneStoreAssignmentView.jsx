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
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Clock,
  Phone
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { switchMapTileLayer } from '../../../utils/mapTiles';
import {
  FOUR_PARENT_RETAILERS,
  FOUR_MASTER_DELIVERY_ZONES,
  TWELVE_PHYSICAL_STORES,
  loadRetailerStores,
  saveRetailerStores,
  loadMasterZones,
  saveMasterZones
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

// Preset Palette for Delivery Zone Colors
const ZONE_PRESET_COLORS = [
  { name: 'Vibrant Orange', hex: '#ea580c' },
  { name: 'Emerald Green', hex: '#16a34a' },
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Royal Purple', hex: '#7c3aed' },
  { name: 'Teal Cyan', hex: '#0d9488' },
  { name: 'Rose Red', hex: '#e11d48' },
  { name: 'Indigo Blue', hex: '#4f46e5' },
  { name: 'Amber Gold', hex: '#d97706' }
];

export const ZoneStoreAssignmentView = ({ onNavigateToStores = null }) => {
  const { addToast } = useStore();

  // Core state: parent retailers, master zones, and child stores
  const [parentRetailers] = useState(FOUR_PARENT_RETAILERS);
  const [masterZones, setMasterZones] = useState(() => loadMasterZones());
  const [stores, setStores] = useState(() => loadRetailerStores());

  // View & Filter states
  const [activeTab, setActiveTab] = useState('retailers'); // 'retailers' | 'zones' | 'database'
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('all');
  const [selectedRetailerFilter, setSelectedRetailerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tileLayerType, setTileLayerType] = useState('street');

  // Modals state: Add & Edit Zone
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [isEditZoneModalOpen, setIsEditZoneModalOpen] = useState(false);
  const [selectedZoneToEdit, setSelectedZoneToEdit] = useState(null);
  const [zoneToDelete, setZoneToDelete] = useState(null);

  // Modals state: Add & Edit Store
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState(false);
  const [selectedStoreToEdit, setSelectedStoreToEdit] = useState(null);
  const [targetParentRetailer, setTargetParentRetailer] = useState(null);
  const [storeToDelete, setStoreToDelete] = useState(null);

  // Zone Form State
  const [zoneForm, setZoneForm] = useState({
    name: '',
    shortName: '',
    zoneNumber: 5,
    color: '#0d9488',
    deliveryFee: 60,
    minOrder: 400,
    freeDeliveryThreshold: 2000,
    centerLat: 31.4200,
    centerLng: 73.0850,
    status: 'active'
  });

  // Store Form State
  const [storeForm, setStoreForm] = useState({
    name: '',
    branchName: '',
    retailerId: 'tenant-alfatah',
    parentRetailerName: 'Al-Fateh',
    address: '',
    city: 'Faisalabad',
    latitude: 31.4125,
    longitude: 73.0830,
    deliveryZoneId: 'zone_001',
    operatingStatus: 'Open',
    phone: '+92 300 1234567'
  });

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const zonePolygonsGroupRef = useRef(null);
  const storeMarkersGroupRef = useRef(null);

  // ---------------------------------------------------------------------------
  // ZONE CHANGE HANDLER FOR STORES
  // ---------------------------------------------------------------------------
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
    window.__handlePopupEditZone = (zoneId) => {
      const target = masterZones.find((z) => (z.zoneId || z._id) === zoneId);
      if (target) handleOpenEditZone(target);
    };
    return () => {
      delete window.__handlePopupZoneChange;
      delete window.__handlePopupEditZone;
    };
  }, [stores, masterZones]);

  // ---------------------------------------------------------------------------
  // ADD & EDIT MASTER ZONE HANDLERS
  // ---------------------------------------------------------------------------
  const handleOpenAddZone = () => {
    const nextNumber = masterZones.length + 1;
    const defaultColor = ZONE_PRESET_COLORS[(nextNumber - 1) % ZONE_PRESET_COLORS.length].hex;
    setZoneForm({
      name: `Zone ${nextNumber} — Gulberg & Kohinoor Hub`,
      shortName: `Gulberg Hub`,
      zoneNumber: nextNumber,
      color: defaultColor,
      deliveryFee: 65,
      minOrder: 400,
      freeDeliveryThreshold: 2000,
      centerLat: 31.4250,
      centerLng: 73.0850,
      status: 'active'
    });
    setIsAddZoneModalOpen(true);
  };

  const handleSaveAddZone = (e) => {
    e.preventDefault();
    if (!zoneForm.name.trim()) return;

    const lat = Number(zoneForm.centerLat) || 31.4200;
    const lng = Number(zoneForm.centerLng) || 73.0850;
    const deltaLat = 0.015;
    const deltaLng = 0.016;

    // Generate polygonal boundary around center
    const polygonCoordinates = [
      [Number((lat + deltaLat).toFixed(4)), Number((lng - deltaLng).toFixed(4))],
      [Number((lat + deltaLat).toFixed(4)), Number((lng + deltaLng).toFixed(4))],
      [Number((lat - deltaLat).toFixed(4)), Number((lng + deltaLng).toFixed(4))],
      [Number((lat - deltaLat).toFixed(4)), Number((lng - deltaLng).toFixed(4))],
      [Number((lat + deltaLat).toFixed(4)), Number((lng - deltaLng).toFixed(4))]
    ];

    const newZoneId = `zone_${Date.now().toString().slice(-4)}`;
    const newZone = {
      _id: newZoneId,
      id: newZoneId,
      zoneId: newZoneId,
      zoneNumber: Number(zoneForm.zoneNumber) || masterZones.length + 1,
      name: zoneForm.name.trim(),
      shortName: zoneForm.shortName.trim() || zoneForm.name.trim(),
      city: 'Faisalabad',
      color: zoneForm.color || '#0d9488',
      deliveryFee: Number(zoneForm.deliveryFee) || 60,
      minOrder: Number(zoneForm.minOrder) || 400,
      freeDeliveryThreshold: Number(zoneForm.freeDeliveryThreshold) || 2000,
      status: zoneForm.status || 'active',
      center: [lat, lng],
      polygon: {
        type: 'Polygon',
        coordinates: polygonCoordinates
      }
    };

    const updatedZones = [...masterZones, newZone];
    setMasterZones(updatedZones);
    saveMasterZones(updatedZones);
    setIsAddZoneModalOpen(false);

    if (addToast) {
      addToast(
        'Master Zone Created 🗺️',
        `Successfully added ${newZone.name} to the platform.`,
        'success'
      );
    }
  };

  const handleOpenEditZone = (zone) => {
    setSelectedZoneToEdit(zone);
    setZoneForm({
      name: zone.name || '',
      shortName: zone.shortName || '',
      zoneNumber: zone.zoneNumber || 1,
      color: zone.color || '#ea580c',
      deliveryFee: zone.deliveryFee || 60,
      minOrder: zone.minOrder || 400,
      freeDeliveryThreshold: zone.freeDeliveryThreshold || 2000,
      centerLat: zone.center?.[0] || 31.4140,
      centerLng: zone.center?.[1] || 73.0950,
      status: zone.status || 'active'
    });
    setIsEditZoneModalOpen(true);
  };

  const handleSaveEditZone = (e) => {
    e.preventDefault();
    if (!selectedZoneToEdit || !zoneForm.name.trim()) return;

    const zId = selectedZoneToEdit.zoneId || selectedZoneToEdit._id;
    const updatedZones = masterZones.map((z) => {
      const currentId = z.zoneId || z._id;
      if (currentId === zId) {
        return {
          ...z,
          name: zoneForm.name.trim(),
          shortName: zoneForm.shortName.trim() || zoneForm.name.trim(),
          zoneNumber: Number(zoneForm.zoneNumber) || z.zoneNumber,
          color: zoneForm.color || z.color,
          deliveryFee: Number(zoneForm.deliveryFee) || z.deliveryFee,
          minOrder: Number(zoneForm.minOrder) || z.minOrder,
          freeDeliveryThreshold: Number(zoneForm.freeDeliveryThreshold) || z.freeDeliveryThreshold,
          status: zoneForm.status || 'active',
          center: [Number(zoneForm.centerLat) || z.center[0], Number(zoneForm.centerLng) || z.center[1]]
        };
      }
      return z;
    });

    setMasterZones(updatedZones);
    saveMasterZones(updatedZones);
    setIsEditZoneModalOpen(false);

    if (addToast) {
      addToast(
        'Master Zone Updated ✅',
        `Updated settings and pricing for "${zoneForm.name}".`,
        'success'
      );
    }
  };

  const handleDeleteZoneConfirm = (zone) => {
    const zId = zone.zoneId || zone._id;
    if (masterZones.length <= 1) {
      if (addToast) addToast('Cannot Delete', 'At least one Master Delivery Zone is required.', 'error');
      return;
    }

    const remainingZones = masterZones.filter((z) => (z.zoneId || z._id) !== zId);
    const fallbackZoneId = remainingZones[0].zoneId || remainingZones[0]._id;

    // Remap stores assigned to deleted zone to fallback zone
    const remappedStores = stores.map((s) => {
      if (s.deliveryZoneId === zId) {
        return { ...s, deliveryZoneId: fallbackZoneId };
      }
      return s;
    });

    setMasterZones(remainingZones);
    saveMasterZones(remainingZones);
    setStores(remappedStores);
    saveRetailerStores(remappedStores);
    setZoneToDelete(null);

    if (addToast) {
      addToast(
        'Zone Removed 🗑️',
        `${zone.name} was removed. Associated stores were reallocated to ${remainingZones[0].name}.`,
        'info'
      );
    }
  };

  // ---------------------------------------------------------------------------
  // ADD & EDIT CHILD STORE HANDLERS
  // ---------------------------------------------------------------------------
  const handleOpenAddStore = (parentRetailer) => {
    setTargetParentRetailer(parentRetailer);
    const existingCount = stores.filter((s) => s.retailerId === parentRetailer.id).length;
    setStoreForm({
      name: `${parentRetailer.name} — Branch ${existingCount + 1}`,
      branchName: `Branch ${existingCount + 1}`,
      retailerId: parentRetailer.id,
      parentRetailerName: parentRetailer.name,
      address: `Main Avenue, People's Colony Sector ${existingCount + 1}, Faisalabad`,
      city: 'Faisalabad',
      latitude: Number((31.4120 + existingCount * 0.008).toFixed(4)),
      longitude: Number((73.0850 + existingCount * 0.009).toFixed(4)),
      deliveryZoneId: masterZones[0]?.zoneId || masterZones[0]?._id || 'zone_001',
      operatingStatus: 'Open',
      phone: '+92 300 8441199'
    });
    setIsAddStoreModalOpen(true);
  };

  const handleSaveAddStore = (e) => {
    e.preventDefault();
    if (!storeForm.name.trim()) return;

    const newStoreId = `STR-${storeForm.retailerId.replace('tenant-', '').slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const newStore = {
      _id: newStoreId,
      storeId: newStoreId,
      retailerId: storeForm.retailerId,
      tenantId: storeForm.retailerId,
      parentRetailerName: storeForm.parentRetailerName,
      retailerNumber: stores.length + 1,
      name: storeForm.name.trim(),
      branchName: storeForm.branchName.trim() || storeForm.name.trim(),
      type: 'child',
      address: storeForm.address.trim() || 'Faisalabad, Pakistan',
      city: 'Faisalabad',
      latitude: Number(storeForm.latitude) || 31.4125,
      longitude: Number(storeForm.longitude) || 73.0830,
      location: {
        type: 'Point',
        coordinates: [Number(storeForm.longitude) || 73.0830, Number(storeForm.latitude) || 31.4125]
      },
      deliveryZoneId: storeForm.deliveryZoneId,
      status: 'active',
      isActive: true,
      operatingStatus: storeForm.operatingStatus || 'Open',
      openingHours: '08:00 AM',
      closingHours: '11:00 PM',
      phone: storeForm.phone || '+92 300 1234567'
    };

    const updated = [...stores, newStore];
    setStores(updated);
    saveRetailerStores(updated);
    setIsAddStoreModalOpen(false);

    if (addToast) {
      addToast(
        'Store Branch Created 🏢',
        `${newStore.name} added under ${newStore.parentRetailerName}.`,
        'success'
      );
    }
  };

  const handleOpenEditStore = (store) => {
    setSelectedStoreToEdit(store);
    setStoreForm({
      name: store.name || '',
      branchName: store.branchName || '',
      retailerId: store.retailerId,
      parentRetailerName: store.parentRetailerName,
      address: store.address || '',
      city: store.city || 'Faisalabad',
      latitude: store.latitude || 31.4125,
      longitude: store.longitude || 73.0830,
      deliveryZoneId: store.deliveryZoneId || masterZones[0]?.zoneId || 'zone_001',
      operatingStatus: store.operatingStatus || 'Open',
      phone: store.phone || '+92 300 1234567'
    });
    setIsEditStoreModalOpen(true);
  };

  const handleSaveEditStore = (e) => {
    e.preventDefault();
    if (!selectedStoreToEdit || !storeForm.name.trim()) return;

    const sId = selectedStoreToEdit.storeId || selectedStoreToEdit._id;
    const updated = stores.map((s) => {
      const currentId = s.storeId || s._id;
      if (currentId === sId) {
        return {
          ...s,
          name: storeForm.name.trim(),
          branchName: storeForm.branchName.trim() || s.branchName,
          address: storeForm.address.trim(),
          latitude: Number(storeForm.latitude) || s.latitude,
          longitude: Number(storeForm.longitude) || s.longitude,
          location: {
            type: 'Point',
            coordinates: [Number(storeForm.longitude) || s.longitude, Number(storeForm.latitude) || s.latitude]
          },
          deliveryZoneId: storeForm.deliveryZoneId,
          operatingStatus: storeForm.operatingStatus || s.operatingStatus,
          phone: storeForm.phone || s.phone
        };
      }
      return s;
    });

    setStores(updated);
    saveRetailerStores(updated);
    setIsEditStoreModalOpen(false);

    if (addToast) {
      addToast(
        'Store Branch Updated ✅',
        `Saved details and zone assignment for ${storeForm.name}.`,
        'success'
      );
    }
  };

  const handleDeleteStoreConfirm = (store) => {
    const sId = store.storeId || store._id;
    const updated = stores.filter((s) => (s.storeId || s._id) !== sId);
    setStores(updated);
    saveRetailerStores(updated);
    setStoreToDelete(null);

    if (addToast) {
      addToast('Store Removed 🗑️', `${store.name} was removed from the directory.`, 'info');
    }
  };

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

    // 1. Draw Master Delivery Zone Polygons
    masterZones.forEach((zone) => {
      if (!zone.polygon?.coordinates || zone.polygon.coordinates.length < 3) return;

      const zId = zone.zoneId || zone._id;
      const isFiltered = selectedZoneFilter !== 'all' && selectedZoneFilter !== zId;
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

      const storesInZone = stores.filter((s) => s.deliveryZoneId === zId);

      polygon.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: ${zone.color}; font-size: 13px;">${esc(zone.name)}</strong>
            <span style="font-size: 10px; background: ${zone.color}20; color: ${zone.color}; padding: 2px 6px; border-radius: 6px; font-weight: 800;">
              Zone ${zone.zoneNumber}
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
            Delivery Fee: <strong style="color: #0f172a;">Rs. ${zone.deliveryFee || 60}</strong> • Min: <strong>Rs. ${zone.minOrder || 400}</strong>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            Linked Physical Stores: <strong style="color: #0f172a;">${storesInZone.length} Stores</strong>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; font-size: 10px; margin-bottom: 8px;">
            ${storesInZone.length > 0 ? storesInZone.map((s) => `• <strong>${esc(s.name)}</strong> (${esc(s.parentRetailerName)})`).join('<br/>') : '<em>No stores currently linked</em>'}
          </div>
          <button
            onclick="window.__handlePopupEditZone && window.__handlePopupEditZone('${zId}')"
            style="width: 100%; padding: 4px 8px; background: #0f172a; color: #ffffff; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
          >
            ✏️ Edit Zone Details & Fee
          </button>
        </div>
      `);

      zonePolygonsGroupRef.current.addLayer(polygon);
    });

    // 2. Draw Physical Child Store Markers
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
              <span style="font-size: 10px; color: #64748b;">${esc(store.parentRetailerName)} • Child Store #${store.retailerNumber || '•'}</span>
            </div>
          </div>
          <p style="font-size: 11px; color: #475569; margin: 4px 0 8px 0; line-height: 1.3;">
            📍 ${esc(store.address)}
          </p>
          <div style="background: #f1f5f9; padding: 8px; border-radius: 8px; margin-bottom: 6px;">
            <label style="font-size: 10px; font-weight: bold; color: #334155; display: block; margin-bottom: 3px;">
              Change Delivery Zone:
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
            {parentRetailers.length} Parent Retailers • {stores.length} Physical Child Stores • {masterZones.length} Master Geographic Delivery Zones
          </p>
        </div>

        {/* View Toggle Tabs & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleOpenAddZone}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Master Zone</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
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
            <span className="text-[11px] text-slate-500 font-semibold">Child Branches</span>
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
      {/* 2. INTERACTIVE FAISALABAD MAP WITH MASTER ZONES & STORE PINS          */}
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
                Click any zone polygon or store pin to view, reassign, or edit delivery zones live
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
            <option value="all">🏢 All Parent Retailers ({parentRetailers.length})</option>
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
            <option value="all">🗺️ All Master Delivery Zones ({masterZones.length})</option>
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
                          {parentRetailer.fullName} • {childStores.length} Child Branches in Faisalabad
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleOpenAddStore(parentRetailer)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Branch</span>
                      </button>
                    </div>
                  </div>

                  {/* Informational Callout for Branch-Specific Mapping */}
                  <div className="px-5 py-2.5 bg-amber-50/70 border-b border-amber-100 text-amber-900 text-xs font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Notice:</strong> All child branches belong to <strong>{parentRetailer.name}</strong>, but each branch can have a different delivery zone.
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
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditStore(store)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                  title="Edit Store Branch"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
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
                                  {z.name}
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Master Delivery Zones</h3>
              <p className="text-xs text-slate-500">Edit delivery fee, minimum order, color, or reallocate physical stores.</p>
            </div>
            <button
              onClick={handleOpenAddZone}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Delivery Zone</span>
            </button>
          </div>

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
                            Faisalabad Hub • Fee: Rs. {zone.deliveryFee || 60} • Min Order: Rs. {zone.minOrder || 400}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditZone(zone)}
                          className="p-1.5 hover:bg-white rounded-xl text-slate-600 border border-slate-200 shadow-2xs transition cursor-pointer"
                          title="Edit Zone Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoneToDelete(zone)}
                          className="p-1.5 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 border border-slate-200 shadow-2xs transition cursor-pointer"
                          title="Delete Zone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Associated Retailers List */}
                    <div className="p-4 sm:p-5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Associated Physical Stores:
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-black"
                          style={{ backgroundColor: `${zone.color}20`, color: zone.color }}
                        >
                          {linkedStores.length} Stores Linked
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        {linkedStores.length > 0 ? (
                          linkedStores.map((store) => {
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

                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={store.deliveryZoneId}
                                    onChange={(e) => updateStoreZone(store.storeId || store._id, e.target.value)}
                                    className="text-[11px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer"
                                    title="Move store to another zone"
                                  >
                                    {masterZones.map((z) => (
                                      <option key={z.zoneId || z._id} value={z.zoneId || z._id}>
                                        Move to: {z.shortName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No physical stores currently associated with this zone.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Free Delivery Over: Rs. {zone.freeDeliveryThreshold || 2000}</span>
                    <button
                      onClick={() => {
                        if (mapInstanceRef.current && zone.center) {
                          mapInstanceRef.current.flyTo(zone.center, 14, { duration: 0.8 });
                          setSelectedZoneFilter(zId);
                        }
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Focus on Map</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
              <span>MERN Schema: Decoupled Stores & Delivery Zones</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Store document holds <code>retailerId</code> and <code>deliveryZoneId</code>, allowing multiple branches of one retailer to serve distinct delivery zones.
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD MASTER DELIVERY ZONE                                       */}
      {/* ===================================================================== */}
      {isAddZoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto my-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Add Master Delivery Zone
                </h3>
                <span className="text-xs text-slate-500">Create a new geographic zone and polygon for order routing</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddZoneModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddZone} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Zone Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zone 5 — Gulberg & Kohinoor Hub"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Short Name / Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gulberg Hub"
                    value={zoneForm.shortName}
                    onChange={(e) => setZoneForm({ ...zoneForm, shortName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Zone Number *</label>
                  <input
                    type="number"
                    required
                    value={zoneForm.zoneNumber}
                    onChange={(e) => setZoneForm({ ...zoneForm, zoneNumber: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Zone Boundary Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {ZONE_PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setZoneForm({ ...zoneForm, color: c.hex })}
                      className={`w-7 h-7 rounded-xl transition cursor-pointer flex items-center justify-center ${
                        zoneForm.color === c.hex ? 'ring-2 ring-slate-900 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {zoneForm.color === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={zoneForm.color}
                    onChange={(e) => setZoneForm({ ...zoneForm, color: e.target.value })}
                    className="w-7 h-7 rounded-xl border border-slate-200 cursor-pointer"
                    title="Custom Color"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Fee (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={zoneForm.deliveryFee}
                    onChange={(e) => setZoneForm({ ...zoneForm, deliveryFee: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Order (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={zoneForm.minOrder}
                    onChange={(e) => setZoneForm({ ...zoneForm, minOrder: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Free Delivery (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={zoneForm.freeDeliveryThreshold}
                    onChange={(e) => setZoneForm({ ...zoneForm, freeDeliveryThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Center Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={zoneForm.centerLat}
                    onChange={(e) => setZoneForm({ ...zoneForm, centerLat: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Center Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={zoneForm.centerLng}
                    onChange={(e) => setZoneForm({ ...zoneForm, centerLng: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddZoneModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  Create Master Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT MASTER DELIVERY ZONE                                      */}
      {/* ===================================================================== */}
      {isEditZoneModalOpen && selectedZoneToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto my-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Edit Master Delivery Zone
                </h3>
                <span className="text-xs text-slate-500">Update zone name, pricing, color, and parameters</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditZoneModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditZone} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Zone Name *</label>
                <input
                  type="text"
                  required
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Short Name *</label>
                  <input
                    type="text"
                    required
                    value={zoneForm.shortName}
                    onChange={(e) => setZoneForm({ ...zoneForm, shortName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Zone Number</label>
                  <input
                    type="number"
                    value={zoneForm.zoneNumber}
                    onChange={(e) => setZoneForm({ ...zoneForm, zoneNumber: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Polygon Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {ZONE_PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setZoneForm({ ...zoneForm, color: c.hex })}
                      className={`w-7 h-7 rounded-xl transition cursor-pointer flex items-center justify-center ${
                        zoneForm.color === c.hex ? 'ring-2 ring-slate-900 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {zoneForm.color === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={zoneForm.color}
                    onChange={(e) => setZoneForm({ ...zoneForm, color: e.target.value })}
                    className="w-7 h-7 rounded-xl border border-slate-200 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Fee (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={zoneForm.deliveryFee}
                    onChange={(e) => setZoneForm({ ...zoneForm, deliveryFee: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Order (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={zoneForm.minOrder}
                    onChange={(e) => setZoneForm({ ...zoneForm, minOrder: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Free Delivery (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={zoneForm.freeDeliveryThreshold}
                    onChange={(e) => setZoneForm({ ...zoneForm, freeDeliveryThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditZoneModalOpen(false);
                    setZoneToDelete(selectedZoneToEdit);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Zone</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditZoneModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DELETE ZONE CONFIRMATION                                        */}
      {/* ===================================================================== */}
      {zoneToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto my-auto text-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Master Delivery Zone?</h3>
              <p className="text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">{zoneToDelete.name}</strong>? Any linked physical stores will be safely reallocated to the default zone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setZoneToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteZoneConfirm(zoneToDelete)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD CHILD STORE BRANCH                                          */}
      {/* ===================================================================== */}
      {isAddStoreModalOpen && targetParentRetailer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto my-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Add Child Branch under {targetParentRetailer.name}
                </h3>
                <span className="text-xs text-slate-500">Create a physical store branch linked to this retailer</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStoreModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddStore} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Branch Store Name *</label>
                <input
                  type="text"
                  required
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Physical Store Address *</label>
                <input
                  type="text"
                  required
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign Master Delivery Zone *</label>
                <select
                  value={storeForm.deliveryZoneId}
                  onChange={(e) => setStoreForm({ ...storeForm, deliveryZoneId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
                >
                  {masterZones.map((z) => (
                    <option key={z.zoneId || z._id} value={z.zoneId || z._id}>
                      {z.name} (Fee: Rs. {z.deliveryFee || 60})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={storeForm.latitude}
                    onChange={(e) => setStoreForm({ ...storeForm, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={storeForm.longitude}
                    onChange={(e) => setStoreForm({ ...storeForm, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStoreModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  Save Store Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT CHILD STORE BRANCH                                         */}
      {/* ===================================================================== */}
      {isEditStoreModalOpen && selectedStoreToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto my-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Edit Store Branch: {selectedStoreToEdit.name}
                </h3>
                <span className="text-xs text-slate-500">Update address, coordinates, and delivery zone assignment</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditStoreModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStore} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Physical Address *</label>
                <input
                  type="text"
                  required
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Master Delivery Zone *</label>
                <select
                  value={storeForm.deliveryZoneId}
                  onChange={(e) => setStoreForm({ ...storeForm, deliveryZoneId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
                >
                  {masterZones.map((z) => (
                    <option key={z.zoneId || z._id} value={z.zoneId || z._id}>
                      {z.name} (Fee: Rs. {z.deliveryFee || 60})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={storeForm.latitude}
                    onChange={(e) => setStoreForm({ ...storeForm, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={storeForm.longitude}
                    onChange={(e) => setStoreForm({ ...storeForm, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditStoreModalOpen(false);
                    setStoreToDelete(selectedStoreToEdit);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Branch</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditStoreModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DELETE STORE CONFIRMATION                                       */}
      {/* ===================================================================== */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto my-auto text-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Store Branch?</h3>
              <p className="text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">{storeToDelete.name}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStoreToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStoreConfirm(storeToDelete)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
