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
  Phone,
  MousePointer,
  Undo2,
  Star,
  Target,
  Hand,
  Move
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { switchMapTileLayer } from '../../../utils/mapTiles';
import { apiService } from '../../../services/api';
import {
  FOUR_PARENT_RETAILERS,
  FOUR_MASTER_DELIVERY_ZONES,
  TWELVE_PHYSICAL_STORES,
  PAKISTAN_CITIES,
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

// Helper to untangle polygon vertices clockwise around centroid
const untanglePolygonPoints = (pts) => {
  if (!Array.isArray(pts) || pts.length < 3) return pts;
  let cLat = 0, cLng = 0;
  pts.forEach(([lat, lng]) => {
    cLat += Number(lat);
    cLng += Number(lng);
  });
  cLat /= pts.length;
  cLng /= pts.length;

  return [...pts].sort((a, b) => {
    let angleA = Math.atan2(a[1] - cLng, a[0] - cLat);
    let angleB = Math.atan2(b[1] - cLng, b[0] - cLat);
    if (angleA < 0) angleA += 2 * Math.PI;
    if (angleB < 0) angleB += 2 * Math.PI;
    return angleA - angleB;
  });
};

// Backward compatibility re-exports
export {
  THREE_MASTER_REGIONS,
  isStoreAreaPolygon,
  DEFAULT_DELIVERY_ZONES,
  detectRegionSector
} from '../../../data/retailerZoneHierarchyData';

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
  const [assignedStatusFilter, setAssignedStatusFilter] = useState('all'); // 'all' | 'assigned' | 'unassigned'
  const [searchQuery, setSearchQuery] = useState('');
  const [tileLayerType, setTileLayerType] = useState('street');
  const [selectedCity, setSelectedCity] = useState('Faisalabad');

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

  // Modals state: Retailer Delivery Zone Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStoreForAssign, setSelectedStoreForAssign] = useState(null);
  const [assignmentZoneId, setAssignmentZoneId] = useState('zone_001');

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

  // Store Form State (Child Branch)
  const [storeForm, setStoreForm] = useState({
    storeCode: '',
    name: '',
    branchName: '',
    retailerId: 'tenant-alfatah',
    parentRetailerName: 'Al-Fateh',
    branchManager: '',
    phone: '+92 300 1234567',
    email: '',
    address: '',
    city: 'Faisalabad',
    latitude: 31.4125,
    longitude: 73.0830,
    deliveryZoneId: '',
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    status: 'active',
    notes: ''
  });

  // Interactive On-Map Polygon Editor State
  const [editingPolygonZone, setEditingPolygonZone] = useState(null);
  const [editingPolygonPoints, setEditingPolygonPoints] = useState([]);
  const [polygonEditMode, setPolygonEditMode] = useState('drag'); // 'drag' | 'add' | 'redraw'
  const [pointsHistory, setPointsHistory] = useState([]);
  const [focusedStoreId, setFocusedStoreId] = useState(null);
  const [associateStoreModalZone, setAssociateStoreModalZone] = useState(null);

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const zonePolygonsGroupRef = useRef(null);
  const storeMarkersGroupRef = useRef(null);
  const activeEditLayerGroupRef = useRef(null);
  const connectionLineGroupRef = useRef(null);

  // ---------------------------------------------------------------------------
  // INTERACTIVE CITY SELECTOR ON MAP (Real-time Pan & Zoom)
  // ---------------------------------------------------------------------------
  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName);
    const city = PAKISTAN_CITIES.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
    if (city && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([city.lat, city.lng], city.zoom || 13, {
        duration: 1.2
      });
      if (addToast) {
        addToast('Map Centered 📍', `Navigated map to ${city.name} (${city.label || city.name}).`, 'info');
      }
    }
  };

  // ---------------------------------------------------------------------------
  // ZONE CHANGE HANDLER FOR STORES & UNASSIGN LOGIC
  // ---------------------------------------------------------------------------
  const updateStoreZone = (storeId, newZoneId) => {
    const updated = stores.map((s) => {
      const id = s.storeId || s._id;
      if (id === storeId) {
        return {
          ...s,
          deliveryZoneId: newZoneId,
          assignedAt: new Date().toISOString(),
          assignedBy: 'Super Admin',
          assignmentStatus: newZoneId ? 'active' : 'unassigned'
        };
      }
      return s;
    });

    setStores(updated);
    saveRetailerStores(updated);

    const storeObj = stores.find((s) => (s.storeId || s._id) === storeId);
    const zoneObj = masterZones.find((z) => (z.zoneId || z._id) === newZoneId);

    if (addToast) {
      if (newZoneId) {
        addToast(
          'Delivery Zone Assigned 📍',
          `${storeObj?.name || 'Store'} is now assigned to ${zoneObj?.name || newZoneId}.`,
          'success'
        );
      } else {
        addToast(
          'Store Unassigned ⚠️',
          `${storeObj?.name || 'Store'} has been detached from its delivery zone.`,
          'info'
        );
      }
    }
  };

  const handleOpenAssignModal = (store = null) => {
    const target = store || stores[0];
    setSelectedStoreForAssign(target);
    setAssignmentZoneId(target?.deliveryZoneId || masterZones[0]?.zoneId || masterZones[0]?._id || 'zone_001');
    setIsAssignModalOpen(true);
  };

  const handleSaveStoreAssignment = (e) => {
    e.preventDefault();
    if (!selectedStoreForAssign) return;
    const sId = selectedStoreForAssign.storeId || selectedStoreForAssign._id;
    updateStoreZone(sId, assignmentZoneId);
    setIsAssignModalOpen(false);
  };

  const handleUnassignStore = (store) => {
    const sId = store.storeId || store._id;
    updateStoreZone(sId, null);
  };

  // Expose global callbacks for in-map Leaflet popups
  useEffect(() => {
    window.__handlePopupZoneChange = (storeId, newZoneId) => {
      updateStoreZone(storeId, newZoneId);
    };
    window.__handlePopupAssociateStoreWithZone = (storeId) => {
      const target = stores.find((s) => (s.storeId || s._id) === storeId);
      if (target) handleOpenAssignModal(target);
    };
    window.__handlePopupEditZone = (zoneId) => {
      const target = masterZones.find((z) => (z.zoneId || z._id) === zoneId);
      if (target) handleOpenEditZone(target);
    };
    window.__handlePopupEditPolygon = (zoneId) => {
      const target = masterZones.find((z) => (z.zoneId || z._id) === zoneId);
      if (target) handleStartEditPolygon(target);
    };
    window.__handlePopupAssociateStore = (zoneId) => {
      const target = masterZones.find((z) => (z.zoneId || z._id) === zoneId);
      if (target) setAssociateStoreModalZone(target);
    };
    window.__handleHighlightStorePolygon = (storeId) => {
      const target = stores.find((s) => (s.storeId || s._id) === storeId);
      if (target) handleHighlightStorePolygon(target);
    };
    return () => {
      delete window.__handlePopupZoneChange;
      delete window.__handlePopupAssociateStoreWithZone;
      delete window.__handlePopupEditZone;
      delete window.__handlePopupEditPolygon;
      delete window.__handlePopupAssociateStore;
      delete window.__handleHighlightStorePolygon;
    };
  }, [stores, masterZones]);

  // ---------------------------------------------------------------------------
  // INTERACTIVE POLYGON EDITING HANDLERS
  // ---------------------------------------------------------------------------
  const handleStartEditPolygon = (zone) => {
    let coords = [];
    if (zone?.polygon?.coordinates && Array.isArray(zone.polygon.coordinates) && zone.polygon.coordinates.length >= 3) {
      coords = zone.polygon.coordinates.map((pt) => [Number(pt[0]), Number(pt[1])]);
    } else {
      const cLat = zone.center?.[0] || 31.4140;
      const cLng = zone.center?.[1] || 73.0950;
      coords = [
        [Number((cLat + 0.015).toFixed(4)), Number((cLng - 0.015).toFixed(4))],
        [Number((cLat + 0.015).toFixed(4)), Number((cLng + 0.015).toFixed(4))],
        [Number((cLat - 0.015).toFixed(4)), Number((cLng + 0.015).toFixed(4))],
        [Number((cLat - 0.015).toFixed(4)), Number((cLng - 0.015).toFixed(4))]
      ];
    }

    setEditingPolygonZone(zone);
    setEditingPolygonPoints(coords);
    setPointsHistory([coords]);
    setPolygonEditMode('drag');
    setIsEditZoneModalOpen(false);

    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (mapInstanceRef.current && zone.center) {
      mapInstanceRef.current.flyTo(zone.center, 14, { duration: 0.8 });
    }

    if (addToast) {
      addToast(
        'Interactive Polygon Editing Active ✏️',
        `Reshaping ${zone.name}. Drag the corners on the map or click "+ Add Points" to add boundaries.`,
        'info'
      );
    }
  };

  const handleCancelEditPolygon = () => {
    setEditingPolygonZone(null);
    setEditingPolygonPoints([]);
    setPointsHistory([]);
    if (addToast) {
      addToast('Polygon Editing Cancelled', 'No boundary changes were saved.', 'info');
    }
  };

  const handleSavePolygonChanges = () => {
    if (!editingPolygonZone) return;
    if (editingPolygonPoints.length < 3) {
      if (addToast) addToast('Invalid Polygon', 'At least 3 corners are required for a delivery polygon boundary.', 'error');
      return;
    }

    const cleanPoints = untanglePolygonPoints(editingPolygonPoints);
    const zId = editingPolygonZone.zoneId || editingPolygonZone._id;

    let sumLat = 0;
    let sumLng = 0;
    cleanPoints.forEach(([lat, lng]) => {
      sumLat += lat;
      sumLng += lng;
    });
    const newCenter = [
      Number((sumLat / cleanPoints.length).toFixed(4)),
      Number((sumLng / cleanPoints.length).toFixed(4))
    ];

    const updatedZones = masterZones.map((z) => {
      const currentId = z.zoneId || z._id;
      if (currentId === zId) {
        return {
          ...z,
          center: newCenter,
          polygon: {
            type: 'Polygon',
            coordinates: cleanPoints
          }
        };
      }
      return z;
    });

    setMasterZones(updatedZones);
    saveMasterZones(updatedZones);

    try {
      apiService.updateZone(zId, {
        center: newCenter,
        polygon: { type: 'Polygon', coordinates: cleanPoints }
      }).catch(() => {});
    } catch (e) {}

    const zoneName = editingPolygonZone.name;
    setEditingPolygonZone(null);
    setEditingPolygonPoints([]);
    setPointsHistory([]);

    if (addToast) {
      addToast(
        'Delivery Polygon Saved 🗺️',
        `Custom geofence for "${zoneName}" (${cleanPoints.length} vertices) updated and saved successfully.`,
        'success'
      );
    }
  };

  const handleUndoPoint = () => {
    if (pointsHistory.length <= 1) return;
    const newHistory = pointsHistory.slice(0, -1);
    const prevPoints = newHistory[newHistory.length - 1];
    setPointsHistory(newHistory);
    setEditingPolygonPoints(prevPoints);
  };

  const handleUntanglePoints = () => {
    if (editingPolygonPoints.length < 3) return;
    const clean = untanglePolygonPoints(editingPolygonPoints);
    setEditingPolygonPoints(clean);
    setPointsHistory((prev) => [...prev, clean]);
    if (addToast) {
      addToast('Polygon Untangled ✨', 'Boundary lines aligned clockwise around centroid.', 'success');
    }
  };

  const handleClearForRedraw = () => {
    setEditingPolygonPoints([]);
    setPolygonEditMode('redraw');
    if (addToast) {
      addToast('Redraw Mode Activated 📍', 'Click anywhere on the map to define new polygon boundary corners.', 'info');
    }
  };

  const handleHighlightStorePolygon = (store) => {
    const assignedZone = masterZones.find((z) => (z.zoneId || z._id) === store.deliveryZoneId);
    if (!assignedZone) return;

    setFocusedStoreId(store.storeId || store._id);
    setSelectedZoneFilter(assignedZone.zoneId || assignedZone._id);

    if (mapInstanceRef.current) {
      if (mapContainerRef.current) {
        mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      mapInstanceRef.current.flyTo([Number(store.latitude), Number(store.longitude)], 14, { duration: 0.8 });
    }

    if (addToast) {
      addToast(
        'Store & Delivery Polygon 📍',
        `${store.name} delivers within ${assignedZone.name}. Showing its geographic polygon.`,
        'info'
      );
    }
  };

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
    const retPrefix = parentRetailer.retailerCode || parentRetailer.name.substring(0, 3).toUpperCase();
    const branchCode = `${retPrefix}-BR-${String(existingCount + 1).padStart(3, '0')}`;

    setStoreForm({
      storeCode: branchCode,
      name: `${parentRetailer.name} — Branch ${existingCount + 1}`,
      branchName: `Branch ${existingCount + 1}`,
      retailerId: parentRetailer.id,
      parentRetailerId: parentRetailer.id,
      parentRetailerName: parentRetailer.name,
      branchManager: `${parentRetailer.name} Branch Manager`,
      phone: '+92 300 8441199',
      email: `manager.${parentRetailer.slug || 'store'}@freshmart.pk`,
      address: `Main Commercial Avenue, Sector ${existingCount + 1}, Faisalabad`,
      city: 'Faisalabad',
      latitude: Number((31.4120 + existingCount * 0.008).toFixed(4)),
      longitude: Number((73.0850 + existingCount * 0.009).toFixed(4)),
      deliveryZoneId: '', // initially empty/unassigned as required: newly registered store initially shows Unassigned Zone
      operatingStatus: 'Open',
      openingHours: '08:00 AM',
      closingHours: '11:00 PM',
      status: 'active',
      notes: ''
    });
    setIsAddStoreModalOpen(true);
  };

  const handleSaveAddStore = (e) => {
    e.preventDefault();
    if (!storeForm.name.trim()) return;
    if (!storeForm.retailerId && !targetParentRetailer) {
      if (addToast) addToast('Validation Error ⚠️', 'A store cannot be registered without a parent retailer.', 'error');
      return;
    }

    const assignedParentId = storeForm.retailerId || targetParentRetailer?.id;
    const assignedParentName = storeForm.parentRetailerName || targetParentRetailer?.name || 'Retailer';
    const storeCodeVal = (storeForm.storeCode || '').trim() || `STR-${assignedParentId.replace('tenant-', '').slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    // Unique store code validation
    const isCodeTaken = stores.some((s) => (s.storeCode || s.storeId || '').toLowerCase() === storeCodeVal.toLowerCase());
    if (isCodeTaken) {
      if (addToast) addToast('Duplicate Store Code ⚠️', `Store code ${storeCodeVal} is already in use. Please choose a unique code.`, 'error');
      return;
    }

    const newStoreId = storeCodeVal;
    const newStore = {
      _id: newStoreId,
      storeId: newStoreId,
      storeCode: storeCodeVal,
      retailerId: assignedParentId,
      parentRetailerId: assignedParentId,
      tenantId: assignedParentId,
      parentRetailerName: assignedParentName,
      retailerNumber: stores.length + 1,
      name: storeForm.name.trim(),
      branchName: storeForm.branchName.trim() || storeForm.name.trim(),
      branchManager: storeForm.branchManager || 'Branch Manager',
      type: 'child',
      address: storeForm.address.trim() || `${storeForm.city}, Pakistan`,
      city: storeForm.city || 'Faisalabad',
      latitude: Number(storeForm.latitude) || 31.4125,
      longitude: Number(storeForm.longitude) || 73.0830,
      location: {
        type: 'Point',
        coordinates: [Number(storeForm.longitude) || 73.0830, Number(storeForm.latitude) || 31.4125]
      },
      deliveryZoneId: storeForm.deliveryZoneId || null,
      assignedAt: storeForm.deliveryZoneId ? new Date().toISOString() : null,
      assignedBy: storeForm.deliveryZoneId ? 'Super Admin' : null,
      status: storeForm.status || 'active',
      isActive: String(storeForm.status || 'active').toLowerCase() === 'active',
      operatingStatus: storeForm.operatingStatus || 'Open',
      openingHours: storeForm.openingHours || '08:00 AM',
      closingHours: storeForm.closingHours || '11:00 PM',
      phone: storeForm.phone || '+92 300 1234567',
      email: storeForm.email || '',
      notes: storeForm.notes || ''
    };

    const updated = [...stores, newStore];
    setStores(updated);
    saveRetailerStores(updated);
    setIsAddStoreModalOpen(false);

    if (addToast) {
      addToast(
        'Child Store Branch Created 🏢',
        `${newStore.name} (${newStore.storeCode}) registered under ${newStore.parentRetailerName}. ${newStore.deliveryZoneId ? 'Assigned to zone.' : 'Initial status: Unassigned Zone.'}`,
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

  // Unassigned stores that are left to associate with a delivery polygon
  const unassignedStores = useMemo(() => {
    return stores.filter((s) => !s.deliveryZoneId);
  }, [stores]);

  // Filtered stores calculation
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.branchName.toLowerCase().includes(q) ||
        s.parentRetailerName.toLowerCase().includes(q) ||
        (s.storeCode && s.storeCode.toLowerCase().includes(q)) ||
        s.address.toLowerCase().includes(q);

      const matchesZone =
        selectedZoneFilter === 'all'
          ? true
          : selectedZoneFilter === 'unassigned'
          ? !s.deliveryZoneId
          : s.deliveryZoneId === selectedZoneFilter;

      const matchesRetailer =
        selectedRetailerFilter === 'all' || s.retailerId === selectedRetailerFilter;

      return matchesSearch && matchesZone && matchesRetailer;
    });
  }, [stores, searchQuery, selectedZoneFilter, selectedRetailerFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalStores = stores.length;
    const unassignedCount = stores.filter((s) => !s.deliveryZoneId).length;
    const assignedCount = totalStores - unassignedCount;
    return {
      parentRetailersCount: parentRetailers.length,
      childStoresCount: totalStores,
      masterZonesCount: masterZones.length,
      unassignedCount,
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
    activeEditLayerGroupRef.current = L.layerGroup().addTo(map);
    connectionLineGroupRef.current = L.layerGroup().addTo(map);

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
    if (connectionLineGroupRef.current) connectionLineGroupRef.current.clearLayers();

    // 1. Draw Master Delivery Zone Polygons
    masterZones.forEach((zone) => {
      if (!zone.polygon?.coordinates || zone.polygon.coordinates.length < 3) return;

      const zId = zone.zoneId || zone._id;

      // If this zone is being interactively edited on map, skip static polygon (active editor renders it)
      if (editingPolygonZone && (editingPolygonZone.zoneId || editingPolygonZone._id) === zId) {
        return;
      }

      const isFiltered = selectedZoneFilter !== 'all' && selectedZoneFilter !== zId;
      const storesInZone = stores.filter((s) => s.deliveryZoneId === zId);
      const isFocused = focusedStoreId && storesInZone.some((s) => (s.storeId || s._id) === focusedStoreId);

      const strokeOpacity = isFiltered ? 0.25 : (isFocused ? 1 : 0.9);
      const strokeWeight = isFocused ? 4 : (isFiltered ? 1.5 : 3);
      const fillOpacity = isFiltered ? 0.04 : (isFocused ? 0.32 : 0.22);

      const polygon = L.polygon(zone.polygon.coordinates, {
        color: zone.color,
        weight: strokeWeight,
        opacity: strokeOpacity,
        fillColor: zone.color,
        fillOpacity: fillOpacity,
        dashArray: isFiltered ? '4, 4' : (isFocused ? '6, 6' : null)
      });

      polygon.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 220px;">
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
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; font-size: 10px; margin-bottom: 8px; max-height: 90px; overflow-y: auto;">
            ${storesInZone.length > 0 ? storesInZone.map((s) => `• <strong>${esc(s.name)}</strong> (${esc(s.parentRetailerName)})`).join('<br/>') : '<em>No stores currently linked</em>'}
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <button
              onclick="window.__handlePopupEditPolygon && window.__handlePopupEditPolygon('${zId}')"
              style="width: 100%; padding: 5px 8px; background: #0284c7; color: #ffffff; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
            >
              ✏️ Reshape Polygon Boundary on Map
            </button>
            <div style="display: flex; gap: 4px;">
              <button
                onclick="window.__handlePopupAssociateStore && window.__handlePopupAssociateStore('${zId}')"
                style="flex: 1; padding: 4px 6px; background: #059669; color: #ffffff; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
              >
                ➕ Link Store
              </button>
              <button
                onclick="window.__handlePopupEditZone && window.__handlePopupEditZone('${zId}')"
                style="flex: 1; padding: 4px 6px; background: #0f172a; color: #ffffff; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
              >
                ⚙️ Fee & Details
              </button>
            </div>
          </div>
        </div>
      `);

      zonePolygonsGroupRef.current.addLayer(polygon);

      // If store is focused, draw dashed connection line from store pin to zone center
      if (isFocused && connectionLineGroupRef.current && zone.center) {
        const storeObj = stores.find((s) => (s.storeId || s._id) === focusedStoreId);
        if (storeObj && storeObj.latitude && storeObj.longitude) {
          const line = L.polyline(
            [
              [Number(storeObj.latitude), Number(storeObj.longitude)],
              [Number(zone.center[0]), Number(zone.center[1])]
            ],
            {
              color: zone.color,
              weight: 2.5,
              dashArray: '5, 8',
              opacity: 0.9
            }
          );
          connectionLineGroupRef.current.addLayer(line);
        }
      }
    });

    // 2. Draw Physical Child Store Markers
    filteredStores.forEach((store) => {
      const lat = Number(store.latitude);
      const lng = Number(store.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isUnassigned = !store.deliveryZoneId;
      const assignedZone = isUnassigned
        ? null
        : masterZones.find((z) => (z.zoneId || z._id) === store.deliveryZoneId) || masterZones[0];
      const parentRetailer =
        parentRetailers.find((r) => r.id === store.retailerId) ||
        parentRetailers[0] ||
        FOUR_PARENT_RETAILERS[0];
      const zoneColor = isUnassigned ? '#f59e0b' : (assignedZone?.color || '#0284c7');
      const isFocused = focusedStoreId === (store.storeId || store._id);
      const isMainBranch = store.name.toLowerCase().includes('main') || store.branchName.toLowerCase().includes('main');

      const customIcon = L.divIcon({
        className: 'custom-store-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isFocused ? '40px' : '34px'};
            height: ${isFocused ? '40px' : '34px'};
            background: #ffffff;
            border-radius: 12px;
            border: ${isFocused ? '3.5px solid #0f172a' : isUnassigned ? '3px dashed #f59e0b' : `3px solid ${zoneColor}`};
            box-shadow: ${isFocused ? '0 0 0 4px ' + zoneColor + '88, 0 8px 16px rgba(0,0,0,0.35)' : isUnassigned ? '0 0 0 3px #fef3c7, 0 4px 12px rgba(245,158,11,0.35)' : '0 4px 12px rgba(0,0,0,0.25)'};
            font-size: ${isFocused ? '18px' : '14px'};
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
          ">
            <span>${parentRetailer?.logo || '🏬'}</span>
            <span style="
              position: absolute;
              bottom: -6px;
              right: -6px;
              background: ${isUnassigned ? '#f59e0b' : zoneColor};
              color: #ffffff;
              font-size: 9px;
              font-weight: 900;
              border-radius: 9999px;
              padding: 1px 4px;
              border: 1.5px solid #ffffff;
            ">${isUnassigned ? '⚠️' : (store.retailerNumber || '•')}</span>
          </div>
        `,
        iconSize: [isFocused ? 40 : 34, isFocused ? 40 : 34],
        iconAnchor: [isFocused ? 20 : 17, isFocused ? 20 : 17]
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
        <div style="font-family: inherit; font-size: 12px; min-width: 230px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 20px;">${parentRetailer?.logo || '🏬'}</span>
            <div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <strong style="color: #0f172a; font-size: 13px;">${esc(store.name)}</strong>
              </div>
              <span style="font-size: 10px; color: #64748b;">${esc(store.parentRetailerName)} • ${isMainBranch ? '⭐ Main Branch' : `Child Store #${store.retailerNumber || '•'}`}</span>
            </div>
          </div>
          <p style="font-size: 11px; color: #475569; margin: 4px 0 8px 0; line-height: 1.3;">
            📍 ${esc(store.address)}
          </p>
          ${
            isUnassigned
              ? `
              <div style="background: #fef3c7; border: 1px solid #fde68a; padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 4px; color: #b45309; font-weight: 800; font-size: 11px;">
                  ⚠️ Store Left to Associate
                </div>
                <div style="font-size: 10px; color: #78350f; margin-top: 2px;">
                  This branch is registered and awaits zone assignment.
                </div>
              </div>
              <button
                onclick="window.__handlePopupAssociateStoreWithZone && window.__handlePopupAssociateStoreWithZone('${store.storeId || store._id}')"
                style="width: 100%; padding: 7px 10px; background: #059669; color: #ffffff; border: none; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
              >
                🔗 + Associate with Delivery Polygon
              </button>
              `
              : `
              <div style="background: #f1f5f9; padding: 8px; border-radius: 8px; margin-bottom: 6px;">
                <label style="font-size: 10px; font-weight: bold; color: #334155; display: block; margin-bottom: 3px;">
                  Change Delivery Zone:
                </label>
                <select
                  onchange="window.__handlePopupZoneChange && window.__handlePopupZoneChange('${store.storeId || store._id}', this.value)"
                  style="width: 100%; font-size: 11px; padding: 4px 6px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; font-weight: bold; color: ${zoneColor}; cursor: pointer;"
                >
                  ${zoneOptionsHtml}
                </select>
              </div>
              <button
                onclick="window.__handleHighlightStorePolygon && window.__handleHighlightStorePolygon('${store.storeId || store._id}')"
                style="width: 100%; padding: 5px 8px; background: #0f172a; color: #ffffff; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
              >
                🗺️ Highlight Store Delivery Polygon
              </button>
              `
          }
        </div>
      `);

      storeMarkersGroupRef.current.addLayer(marker);
    });
  }, [masterZones, stores, filteredStores, selectedZoneFilter, parentRetailers, editingPolygonZone, focusedStoreId]);

  // ---------------------------------------------------------------------------
  // INTERACTIVE EDITABLE POLYGON & DRAGGABLE VERTEX HANDLERS ON MAP
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapInstanceRef.current || !activeEditLayerGroupRef.current) return;
    activeEditLayerGroupRef.current.clearLayers();

    if (!editingPolygonZone || !Array.isArray(editingPolygonPoints) || editingPolygonPoints.length === 0) return;

    const zoneColor = editingPolygonZone.color || '#ea580c';

    // 1. Draw live active polygon boundary
    if (editingPolygonPoints.length >= 2) {
      const activePolygon = L.polygon(editingPolygonPoints, {
        color: zoneColor,
        weight: 3.5,
        dashArray: '6, 6',
        fillColor: zoneColor,
        fillOpacity: 0.32
      });
      activeEditLayerGroupRef.current.addLayer(activePolygon);
    }

    // 2. Draw draggable vertex handles for each polygon corner
    editingPolygonPoints.forEach((point, idx) => {
      const vertexIcon = L.divIcon({
        className: 'custom-polygon-vertex',
        html: `
          <div style="
            width: 26px;
            height: 26px;
            border-radius: 9999px;
            background: #ffffff;
            border: 3px solid ${zoneColor};
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 900;
            color: #0f172a;
            cursor: grab;
            user-select: none;
            transition: transform 0.1s ease;
          ">
            ${idx + 1}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker(point, {
        icon: vertexIcon,
        draggable: true,
        zIndexOffset: 1000
      });

      marker.on('drag', (e) => {
        const { lat, lng } = e.target.getLatLng();
        setEditingPolygonPoints((prev) => {
          const next = [...prev];
          next[idx] = [Number(lat.toFixed(5)), Number(lng.toFixed(5))];
          return next;
        });
      });

      marker.on('dragend', () => {
        setPointsHistory((prev) => [...prev, editingPolygonPoints]);
      });

      marker.bindTooltip(`Corner #${idx + 1}<br/><span style="font-size: 9px; color: #64748b;">Drag to move • Click to delete</span>`, {
        direction: 'top',
        offset: [0, -10]
      });

      marker.on('click', () => {
        if (editingPolygonPoints.length > 3) {
          setEditingPolygonPoints((prev) => prev.filter((_, i) => i !== idx));
          if (addToast) addToast('Corner Removed', `Deleted corner #${idx + 1}`, 'info');
        } else {
          if (addToast) addToast('Cannot Remove', 'Polygon requires at least 3 points.', 'error');
        }
      });

      activeEditLayerGroupRef.current.addLayer(marker);
    });
  }, [editingPolygonZone, editingPolygonPoints, addToast]);

  // ---------------------------------------------------------------------------
  // MAP CLICK LISTENER FOR ADDING / REDRAWING POLYGON POINTS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const onMapClick = (e) => {
      if (!editingPolygonZone) return;
      if (polygonEditMode === 'add' || polygonEditMode === 'redraw') {
        const newPoint = [Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))];
        setEditingPolygonPoints((prev) => {
          const next = [...prev, newPoint];
          setPointsHistory((h) => [...h, next]);
          return next;
        });
      }
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [editingPolygonZone, polygonEditMode]);

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
              <span>Retailer Delivery Zone Assignment</span>
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
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Registered Stores</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-emerald-600">{stats.childStoresCount}</span>
            <span className="text-[11px] text-slate-500 font-semibold">Physical Child Branches</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Delivery Zones</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-indigo-600">{stats.masterZonesCount}</span>
            <span className="text-[11px] text-slate-500 font-semibold">Master Delivery Polygons</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Unassigned Stores</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-xl font-black ${stats.unassignedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {stats.unassignedCount}
            </span>
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
              stats.unassignedCount > 0
                ? 'text-amber-700 bg-amber-50 border-amber-200'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}>
              {stats.unassignedCount > 0 ? 'Requires Zone Link' : '✓ 100% Assigned'}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1.5 PROMINENT UNASSIGNED STORES SECTION / WORKFLOW                    */}
      {/* ===================================================================== */}
      {unassignedStores.length > 0 ? (
        <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    Stores Awaiting Zone Assignment
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950 border border-amber-300">
                    {unassignedStores.length} {unassignedStores.length === 1 ? 'Store' : 'Stores'} Left
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  These child branches are registered with physical locations on the map, but not yet linked to any delivery polygon. Select an existing zone below:
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedZoneFilter(selectedZoneFilter === 'unassigned' ? 'all' : 'unassigned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto ${
                selectedZoneFilter === 'unassigned'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{selectedZoneFilter === 'unassigned' ? 'Show All Stores on Map' : 'Filter Unassigned on Map'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {unassignedStores.map((store) => {
              const parentRetailer =
                parentRetailers.find((r) => r.id === store.retailerId) ||
                parentRetailers[0];

              return (
                <div
                  key={store.storeId || store._id}
                  className="bg-white rounded-2xl border border-amber-200/90 p-4 shadow-2xs space-y-3 flex flex-col justify-between hover:border-amber-400 hover:shadow-xs transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {store.storeCode || store.storeId}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>Unassigned</span>
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm leading-tight">
                      {store.name}
                    </h4>

                    <div className="text-xs text-slate-600 flex items-center gap-2 font-medium">
                      <span><strong>Parent:</strong> {store.parentRetailerName || parentRetailer?.name || 'Retailer'}</span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-500">Child Store</span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      📍 {store.address}
                    </p>

                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                      <span>GPS: {Number(store.latitude).toFixed(4)}, {Number(store.longitude).toFixed(4)}</span>
                      <span>•</span>
                      <span>{store.city || 'Faisalabad'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Assign to Existing Polygon:
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            updateStoreZone(store.storeId || store._id, e.target.value);
                          }
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="" disabled>Select delivery zone...</option>
                        {masterZones.map((z) => (
                          <option key={z.zoneId || z._id} value={z.zoneId || z._id}>
                            {z.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(store)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1 active:scale-95"
                      >
                        <span>Assign</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-emerald-900">
              All {stores.length} Registered Stores are Associated with Delivery Polygons.
            </span>
            <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline">
              When a new physical branch is registered with its map location, it will automatically appear here awaiting zone assignment.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAddStore(parentRetailers[0])}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Branch</span>
          </button>
        </div>
      )}

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
              <h3 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-2">
                <span>{selectedCity} Master Delivery Zones & Store Map</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Live View
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Switch cities, view polygons, or click store pins to link branches to zones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Interactive City Selector with Real-Time Map Pan & Zoom */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-600 pl-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>City:</span>
              </span>
              <select
                value={selectedCity}
                onChange={(e) => handleCitySelect(e.target.value)}
                className="bg-white border-0 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1 cursor-pointer shadow-xs focus:outline-none hover:bg-slate-50 transition"
                title="Select city to navigate map"
              >
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    📍 {c.name} {c.name === 'Faisalabad' ? '(Hub)' : ''}
                  </option>
                ))}
              </select>
            </div>

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

            {/* Quick Edit Polygon Dropdown */}
            {!editingPolygonZone && (
              <div className="flex items-center gap-1">
                <select
                  onChange={(e) => {
                    const z = masterZones.find((zone) => (zone.zoneId || zone._id) === e.target.value);
                    if (z) handleStartEditPolygon(z);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="bg-sky-50 border border-sky-200 text-sky-800 font-bold text-xs rounded-xl px-2.5 py-1.5 cursor-pointer hover:bg-sky-100 transition shadow-2xs"
                >
                  <option value="" disabled>✏️ Reshape a Zone Polygon...</option>
                  {masterZones.map((z) => (
                    <option key={z.zoneId || z._id} value={z.zoneId || z._id}>
                      Reshape: {z.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset View */}
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([31.4140, 73.0950], 13);
                  setSelectedZoneFilter('all');
                  setSelectedRetailerFilter('all');
                  setFocusedStoreId(null);
                }
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Map</span>
            </button>
          </div>
        </div>

        {/* Floating Active Polygon Editor Toolbar */}
        {editingPolygonZone && (
          <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shrink-0 shadow-md"
                style={{ backgroundColor: editingPolygonZone.color || '#ea580c' }}
              >
                {editingPolygonZone.zoneNumber}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm text-white">
                    Editing Polygon: {editingPolygonZone.name}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>{editingPolygonPoints.length} Corners</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {polygonEditMode === 'drag'
                    ? '🖐️ Drag numbered circles to reshape polygon boundary corners.'
                    : '➕ Click anywhere on the map to add new boundary corners.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPolygonEditMode(polygonEditMode === 'drag' ? 'add' : 'drag')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  polygonEditMode === 'add'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md ring-2 ring-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{polygonEditMode === 'add' ? '✓ Click Map to Add' : '+ Add Points'}</span>
              </button>

              <button
                type="button"
                onClick={handleUndoPoint}
                disabled={pointsHistory.length <= 1}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Undo last point modification"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                onClick={handleUntanglePoints}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Untangle overlapping polygon lines clockwise"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Untangle</span>
              </button>

              <button
                type="button"
                onClick={handleClearForRedraw}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950 text-rose-300 border border-slate-700 hover:border-rose-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Clear boundary and redraw by clicking on map"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Redraw</span>
              </button>

              <button
                type="button"
                onClick={handleSavePolygonChanges}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Polygon</span>
              </button>

              <button
                type="button"
                onClick={handleCancelEditPolygon}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
                title="Cancel without saving"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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

            {unassignedStores.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedZoneFilter(selectedZoneFilter === 'unassigned' ? 'all' : 'unassigned')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                  selectedZoneFilter === 'unassigned'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                <span>⚠️ Left to Associate ({unassignedStores.length})</span>
              </button>
            )}
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
                      const assignedZone =
                        masterZones.find((z) => (z.zoneId || z._id) === store.deliveryZoneId) ||
                        masterZones[0] ||
                        FOUR_MASTER_DELIVERY_ZONES[0];
                      const isMainBranch =
                        store.name.toLowerCase().includes('main') ||
                        store.branchName.toLowerCase().includes('main') ||
                        store.retailerNumber === 1 ||
                        store.retailerNumber === 2 ||
                        store.retailerNumber === 7 ||
                        store.retailerNumber === 10;
                      const isFocused = focusedStoreId === (store.storeId || store._id);

                      return (
                        <div
                          key={store.storeId || store._id}
                          className={`bg-white rounded-2xl border p-4 space-y-3.5 transition shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                            isFocused
                              ? 'border-slate-900 ring-2 ring-emerald-500/30'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Store Details Header */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                Retailer #{store.retailerNumber || '•'}
                              </span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {isMainBranch ? (
                                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                    <span>Main Branch</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                    Physical store
                                  </span>
                                )}
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

                          {/* Zone Assignment Dropdown Selector & Polygon Preview */}
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Assigned Delivery Zone
                              </label>
                              {store.deliveryZoneId ? (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `${assignedZone?.color}15`,
                                    color: assignedZone?.color
                                  }}
                                >
                                  ✓ {assignedZone?.shortName || 'Zone'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                  ⚠️ Unassigned
                                </span>
                              )}
                            </div>

                            <select
                              value={store.deliveryZoneId || ''}
                              onChange={(e) => updateStoreZone(store.storeId || store._id, e.target.value)}
                              className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition ${
                                !store.deliveryZoneId
                                  ? 'bg-amber-50 border-2 border-amber-300 text-amber-900'
                                  : 'bg-slate-50 border border-slate-200 text-slate-800'
                              }`}
                              style={{ borderLeftWidth: '4px', borderLeftColor: store.deliveryZoneId ? assignedZone?.color : '#f59e0b' }}
                            >
                              <option value="" disabled>-- Select Existing Delivery Polygon --</option>
                              {masterZones.map((z) => (
                                <option key={z.zoneId || z._id} value={z.zoneId || z._id}>
                                  {z.name}
                                </option>
                              ))}
                            </select>

                            {/* Live Delivery Zone Coverage Info */}
                            {store.deliveryZoneId ? (
                              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2 text-[10px]">
                                <span className="text-slate-500 font-medium truncate">
                                  Fulfills orders in: <strong style={{ color: assignedZone?.color }}>{assignedZone?.shortName} Polygon</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleHighlightStorePolygon(store)}
                                  className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <span>View on Map</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-2 text-[10px]">
                                <span className="text-amber-800 font-bold truncate">
                                  ⚠️ Awaiting Zone Association
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignModal(store)}
                                  className="font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded cursor-pointer"
                                >
                                  + Link Zone
                                </button>
                              </div>
                            )}
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
                          onClick={() => handleStartEditPolygon(zone)}
                          className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 rounded-xl text-sky-700 border border-sky-200 shadow-2xs transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                          title="Reshape Polygon on Map"
                        >
                          <Compass className="w-3.5 h-3.5 text-sky-600" />
                          <span>Reshape Polygon</span>
                        </button>
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
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAssociateStoreModalZone(zone)}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Associate Store</span>
                          </button>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-black"
                            style={{ backgroundColor: `${zone.color}20`, color: zone.color }}
                          >
                            {linkedStores.length} Linked
                          </span>
                        </div>
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
      {/* 5. TAB 3: RETAILER DELIVERY ZONE ASSIGNMENT DASHBOARD & MERN ARCH      */}
      {/* ===================================================================== */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  Retailer Delivery Zone Assignment
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Notice: All branches belong to a parent retailer, but each branch can have a different delivery zone.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAssignModal(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Assign Store to Zone</span>
              </button>
            </div>
          </div>

          {/* Filters Bar: Parent Retailer, Child Store, Delivery Zone, Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by branch name, store code, parent retailer, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none font-medium"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Parent Retailer Filter */}
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

              {/* Master Delivery Zone Filter */}
              <select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="all">🗺️ All Delivery Zones ({masterZones.length})</option>
                {masterZones.map((z) => (
                  <option key={z.zoneId || z._id} value={z.zoneId || z._id}>
                    {z.name}
                  </option>
                ))}
              </select>

              {/* Assigned / Unassigned Status Filter */}
              <select
                value={assignedStatusFilter}
                onChange={(e) => setAssignedStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="all">⚡ All Statuses</option>
                <option value="assigned">✓ Assigned ({stores.filter((s) => Boolean(s.deliveryZoneId)).length})</option>
                <option value="unassigned">⚠️ Unassigned ({stores.filter((s) => !s.deliveryZoneId).length})</option>
              </select>
            </div>
          </div>

          {/* Retailer Delivery Zone Association Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Parent Retailer</th>
                    <th className="py-3 px-4">Child Store (Physical Branch)</th>
                    <th className="py-3 px-4">Zone Status</th>
                    <th className="py-3 px-4">Assigned Delivery Zone</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stores
                    .filter((store) => {
                      // Filter by search
                      if (searchQuery.trim()) {
                        const q = searchQuery.toLowerCase().trim();
                        const n = String(store.name || '').toLowerCase();
                        const b = String(store.branchName || '').toLowerCase();
                        const p = String(store.parentRetailerName || '').toLowerCase();
                        const c = String(store.storeCode || store.storeId || '').toLowerCase();
                        const a = String(store.address || '').toLowerCase();
                        if (!n.includes(q) && !b.includes(q) && !p.includes(q) && !c.includes(q) && !a.includes(q)) {
                          return false;
                        }
                      }
                      // Filter by retailer
                      if (selectedRetailerFilter !== 'all' && store.retailerId !== selectedRetailerFilter) {
                        return false;
                      }
                      // Filter by zone
                      if (selectedZoneFilter !== 'all' && store.deliveryZoneId !== selectedZoneFilter) {
                        return false;
                      }
                      // Filter by assigned status
                      if (assignedStatusFilter === 'assigned' && !store.deliveryZoneId) {
                        return false;
                      }
                      if (assignedStatusFilter === 'unassigned' && Boolean(store.deliveryZoneId)) {
                        return false;
                      }
                      return true;
                    })
                    .map((store) => {
                      const parentRetailer = parentRetailers.find((r) => r.id === store.retailerId) || {
                        name: store.parentRetailerName || 'Retailer',
                        logo: '🏬',
                        color: '#0e7c66'
                      };
                      const isAssigned = Boolean(store.deliveryZoneId);
                      const assignedZone = masterZones.find((z) => (z.zoneId || z._id) === store.deliveryZoneId);

                      return (
                        <tr key={store.storeId || store._id} className="hover:bg-slate-50/70 transition">
                          {/* Parent Retailer Column */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
                                style={{
                                  backgroundColor: `${parentRetailer.color || '#0e7c66'}10`,
                                  borderColor: `${parentRetailer.color || '#0e7c66'}30`,
                                  color: parentRetailer.color || '#0e7c66'
                                }}
                              >
                                <span>{parentRetailer.logo || '🏬'}</span>
                                <span>{parentRetailer.name}</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded-full">
                                  Parent Retailer
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                  ✓ Active
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Child Store Column */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 text-xs">
                                {store.name}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                  {store.storeCode || store.storeId} · Child Store
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {store.branchManager ? `Manager: ${store.branchManager}` : ''}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{store.address}</span>
                              </p>
                            </div>
                          </td>

                          {/* Zone Assignment Status Badge */}
                          <td className="py-3.5 px-4 align-top">
                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Assigned</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Unassigned Zone</span>
                              </span>
                            )}
                          </td>

                          {/* Assigned Delivery Zone Info */}
                          <td className="py-3.5 px-4 align-top">
                            {isAssigned && assignedZone ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: assignedZone.color || '#ea580c' }}
                                  />
                                  <span className="font-black text-slate-900 text-xs">
                                    {assignedZone.name}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  Inherited from the existing master zone
                                </p>
                                <span className="inline-block text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                                  Polygon configured • Store associated with zone
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="text-slate-400 text-xs font-medium">
                                  No delivery zone assigned yet.
                                </span>
                                <p className="text-[10px] text-amber-600 font-bold">
                                  Click Assign to link with an existing zone
                                </p>
                              </div>
                            )}
                          </td>

                          {/* Actions Column */}
                          <td className="py-3.5 px-4 align-top text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(store)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                  isAssigned
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                }`}
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>{isAssigned ? 'Edit Assignment' : 'Assign Store to Zone'}</span>
                              </button>

                              {isAssigned && (
                                <button
                                  type="button"
                                  onClick={() => handleUnassignStore(store)}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Detach store from current delivery zone"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Unassign</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MERN Database Structure & Architecture Guide */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-2xs">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <span>MERN Schema: Decoupled Stores & Delivery Zones</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Notice: The <code>RetailerDeliveryZone</code> association collection contains no polygon. It connects a registered child branch with an existing delivery zone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              {/* Collection 1: Retailers (Parent) */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-emerald-400">1. Retailers (Parent)</span>
                  <span className="text-[10px] text-slate-400">Company</span>
                </div>
                <pre className="text-[11px] leading-relaxed overflow-x-auto text-emerald-300">
{`{
  _id: ObjectId,
  name: "Al-Fateh",
  retailerCode: "RET-001",
  logo: "🏬",
  contactPerson: "Owner / Manager",
  phone: "+92 300 8441111",
  email: "info@alfatah.pk",
  headOfficeAddress: "Main Hub, FSD",
  city: "Faisalabad",
  type: "parent",
  status: "active"
}`}
                </pre>
              </div>

              {/* Collection 2: Stores (Child Branches) */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-indigo-400">2. Stores (Child)</span>
                  <span className="text-[10px] text-slate-400">Branch</span>
                </div>
                <pre className="text-[11px] leading-relaxed overflow-x-auto text-indigo-300">
{`{
  _id: ObjectId,
  parentRetailerId: ObjectId,
  storeName: "Al-Fateh Samanabad",
  storeCode: "ALF-BR-001",
  branchManager: "Manager Name",
  phone: "+92 300 8441111",
  email: "samanabad@alfatah.pk",
  address: "Samanabad, Faisalabad",
  city: "Faisalabad",
  type: "child",
  location: {
    type: "Point",
    coordinates: [73.0600, 31.3960]
  },
  openingHours: "08:00 AM - 11:00 PM",
  status: "active"
}`}
                </pre>
              </div>

              {/* Collection 3: DeliveryZones (Master) */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-400">3. DeliveryZones</span>
                  <span className="text-[10px] text-slate-400">Master Zone</span>
                </div>
                <pre className="text-[11px] leading-relaxed overflow-x-auto text-amber-300">
{`{
  _id: "zone_001",
  name: "Zone 1 — Samanabad",
  city: "Faisalabad",
  polygon: {
    type: "Polygon",
    coordinates: [
      [31.4080, 73.0450],
      [31.4080, 73.0760],
      [31.3780, 73.0760],
      [31.3780, 73.0450],
      [31.4080, 73.0450]
    ]
  },
  status: "active"
}`}
                </pre>
              </div>

              {/* Collection 4: Retailer Delivery Zone Association */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-sky-400">4. Zone Association</span>
                  <span className="text-[10px] text-slate-400">Association</span>
                </div>
                <pre className="text-[11px] leading-relaxed overflow-x-auto text-sky-300">
{`{
  _id: ObjectId,
  storeId: ObjectId("STR-AF-001"),
  parentRetailerId: ObjectId("tenant-alfatah"),
  deliveryZoneId: ObjectId("zone_001"),
  assignedAt: ISODate(),
  assignedBy: "Super Admin",
  status: "active"
}`}
                </pre>
              </div>
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

              {/* Interactive On-Map Polygon Editor Launch Button */}
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                    <Compass className="w-4 h-4" />
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-bold">Polygon Boundary Geofence</strong>
                    <span className="text-[10px] text-slate-500">
                      {(selectedZoneToEdit?.polygon?.coordinates || []).length} Boundary Vertices defined on map
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleStartEditPolygon(selectedZoneToEdit);
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Reshape on Map</span>
                </button>
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
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto my-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight flex items-center gap-2">
                  <span>Register Physical Store Branch</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Child Store
                  </span>
                </h3>
                <span className="text-xs text-slate-500">
                  Adding physical branch under <strong>{targetParentRetailer.name}</strong> (Parent Retailer)
                </span>
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
              {/* Parent Retailer Readonly Info Card */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{targetParentRetailer.logo || '🏬'}</span>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      {targetParentRetailer.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Parent Retailer • {targetParentRetailer.retailerCode || targetParentRetailer.id}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                  Auto-Linked Parent
                </span>
              </div>

              {/* Branch Name & Unique Store Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Store / Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al-Fateh — Samanabad Branch"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Store Code (Unique) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ALF-BR-001"
                    value={storeForm.storeCode}
                    onChange={(e) => setStoreForm({ ...storeForm, storeCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Branch Manager & Contact Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Branch Manager Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Mehmood"
                    value={storeForm.branchManager}
                    onChange={(e) => setStoreForm({ ...storeForm, branchManager: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +92 300 8441199"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Physical Address */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Physical Store Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Commercial Avenue, Samanabad, Faisalabad"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              {/* City Selector with Dynamic Map Pan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City *</label>
                  <select
                    value={storeForm.city}
                    onChange={(e) => {
                      const cityName = e.target.value;
                      const cityObj = PAKISTAN_CITIES.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
                      setStoreForm({
                        ...storeForm,
                        city: cityName,
                        latitude: cityObj ? cityObj.lat : storeForm.latitude,
                        longitude: cityObj ? cityObj.lng : storeForm.longitude
                      });
                      if (mapInstanceRef.current && cityObj) {
                        mapInstanceRef.current.flyTo([cityObj.lat, cityObj.lng], cityObj.zoom || 13, { duration: 1.2 });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        📍 {c.name} {c.name === 'Faisalabad' ? '(Hub City)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Delivery Zone Assignment</label>
                  <select
                    value={storeForm.deliveryZoneId || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, deliveryZoneId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="">⚠️ Leave Unassigned (Initially Unassigned Zone)</option>
                    {masterZones.map((z) => (
                      <option key={z.zoneId || z._id} value={z.zoneId || z._id}>
                        {z.name} (Fee: Rs. {z.deliveryFee || 60})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coordinates (Captured from Map / City Center) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Latitude 📍 (Captured from pin)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={storeForm.latitude}
                    onChange={(e) => setStoreForm({ ...storeForm, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Longitude 📍 (Captured from pin)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={storeForm.longitude}
                    onChange={(e) => setStoreForm({ ...storeForm, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Operating Hours & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operating Status</label>
                  <select
                    value={storeForm.operatingStatus}
                    onChange={(e) => setStoreForm({ ...storeForm, operatingStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="Open">🟢 Open (08:00 AM - 11:00 PM)</option>
                    <option value="Busy">🟡 Busy</option>
                    <option value="Closed">🔴 Closed</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Branch Status</label>
                  <select
                    value={storeForm.status}
                    onChange={(e) => setStoreForm({ ...storeForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="active">✓ Active Branch</option>
                    <option value="inactive">✕ Inactive Branch</option>
                  </select>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Register Physical Branch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ASSIGN STORE TO DELIVERY ZONE WORKFLOW                         */}
      {/* ===================================================================== */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto my-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Assign Store to Delivery Zone
                </h3>
                <span className="text-xs text-slate-500">
                  Connect physical child branch with an existing master delivery zone
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStoreAssignment} className="space-y-4">
              {/* Step 1: Select Store / Branch */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  1. Select Store / Branch *
                </label>
                <select
                  value={selectedStoreForAssign?.storeId || selectedStoreForAssign?._id || ''}
                  onChange={(e) => {
                    const matched = stores.find((s) => (s.storeId || s._id) === e.target.value);
                    setSelectedStoreForAssign(matched);
                    if (matched?.deliveryZoneId) {
                      setAssignmentZoneId(matched.deliveryZoneId);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
                >
                  {stores.map((s) => (
                    <option key={s.storeId || s._id} value={s.storeId || s._id}>
                      {s.name} ({s.storeCode || s.storeId}) — {s.parentRetailerName}
                    </option>
                  ))}
                </select>

                {/* Selected Store Card */}
                {selectedStoreForAssign && (
                  <div className="mt-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">
                        {selectedStoreForAssign.name}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        {selectedStoreForAssign.storeCode || selectedStoreForAssign.storeId} · Child Store
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-2">
                      <span><strong>Parent:</strong> {selectedStoreForAssign.parentRetailerName || 'Parent Retailer'}</span>
                      <span>•</span>
                      <span><strong>City:</strong> {selectedStoreForAssign.city || 'Faisalabad'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{selectedStoreForAssign.address}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Step 2: Select Existing Delivery Zone */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  2. Select Existing Delivery Zone *
                </label>
                <select
                  value={assignmentZoneId}
                  onChange={(e) => setAssignmentZoneId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:bg-white focus:outline-none cursor-pointer"
                >
                  {masterZones.map((z) => (
                    <option key={z.zoneId || z._id} value={z.zoneId || z._id}>
                      {z.name} ({z.zoneId || z._id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Zone Information Card */}
              {(() => {
                const zoneObj = masterZones.find((z) => (z.zoneId || z._id) === assignmentZoneId) || masterZones[0];
                return (
                  <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">
                      Zone Information
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Zone Name:</span>
                        <span className="font-bold text-slate-800">{zoneObj?.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Zone ID:</span>
                        <span className="font-mono font-bold text-indigo-700">{zoneObj?.zoneId || zoneObj?._id}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Polygon: Already created
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        No new polygon will be drawn
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Assign Store to Zone</span>
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

      {/* ===================================================================== */}
      {/* MODAL: ASSOCIATE PHYSICAL STORES WITH ZONE                             */}
      {/* ===================================================================== */}
      {associateStoreModalZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xs"
                  style={{ backgroundColor: associateStoreModalZone.color }}
                >
                  {associateStoreModalZone.zoneNumber}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Associate Physical Stores
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Link stores to {associateStoreModalZone.name} for delivery fulfillment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssociateStoreModalZone(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 max-h-[60vh]">
              {stores.map((store) => {
                const zId = associateStoreModalZone.zoneId || associateStoreModalZone._id;
                const isLinked = store.deliveryZoneId === zId;
                const currentZone = masterZones.find((z) => (z.zoneId || z._id) === store.deliveryZoneId);
                const parent = parentRetailers.find((r) => r.id === store.retailerId);
                const isMainBranch =
                  store.name.toLowerCase().includes('main') ||
                  store.branchName.toLowerCase().includes('main') ||
                  store.retailerNumber === 1 ||
                  store.retailerNumber === 2 ||
                  store.retailerNumber === 7 ||
                  store.retailerNumber === 10;

                return (
                  <div
                    key={store.storeId || store._id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isLinked
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{parent?.logo || '🏬'}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs font-black text-slate-900">{store.name}</strong>
                          {isMainBranch && (
                            <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                              ⭐ Main Branch
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {store.parentRetailerName} • Current Zone: <strong style={{ color: currentZone?.color }}>{currentZone?.shortName || 'None'}</strong>
                        </span>
                      </div>
                    </div>

                    <div>
                      {isLinked ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Linked</span>
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            updateStoreZone(store.storeId || store._id, zId);
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-emerald-600 hover:text-white text-slate-700 border border-slate-300 hover:border-emerald-600 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
                        >
                          + Link to this Zone
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {stores.filter((s) => s.deliveryZoneId === (associateStoreModalZone.zoneId || associateStoreModalZone._id)).length} stores currently associated
              </span>
              <button
                type="button"
                onClick={() => setAssociateStoreModalZone(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
