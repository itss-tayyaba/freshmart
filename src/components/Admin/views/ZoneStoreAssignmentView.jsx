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
  Plus,
  Edit3,
  Sliders,
  Trash2
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';
import { calculateDistanceKm } from '../../../data/pakistanLocations';
import { getAllUnifiedStores } from '../../../utils/storeHelper';
import { isPointInPolygon } from '../../../utils/distanceCalculator';

export const ZoneStoreAssignmentView = ({ onNavigateToStores = null, onNavigateToZones = null }) => {
  const { allBranches = [], addToast } = useStore();

  const [zones, setZones] = useState([]);
  const [stores, setStores] = useState(() => getAllUnifiedStores([], allBranches));
  const [assignments, setAssignments] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Edit Assignment Modal State
  const [editingStore, setEditingStore] = useState(null);
  const [editPriority, setEditPriority] = useState(1);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // In-Place Polygon Drawing Mode in Zone Assignments
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const isDrawingPolygonRef = useRef(false);
  useEffect(() => {
    isDrawingPolygonRef.current = isDrawingPolygon;
  }, [isDrawingPolygon]);
  const [drawingTool, setDrawingTool] = useState('polygon');
  const drawingToolRef = useRef('polygon');
  useEffect(() => {
    drawingToolRef.current = drawingTool;
  }, [drawingTool]);
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [isSavingPolygon, setIsSavingPolygon] = useState(false);
  const drawingLayerRef = useRef(null);
  const [drawingStoreTarget, setDrawingStoreTarget] = useState(null); // Specific store being drawn for

  // Quick Store Branch Modal
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickBranchForm, setQuickBranchForm] = useState({
    tenantId: 'tenant-alfatah',
    branchName: '',
    address: '',
    city: 'Faisalabad',
    latitude: 31.4125,
    longitude: 73.0995,
    deliveryRadiusKm: 5
  });

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

  // Deduplicate stores by storeId and tenant+branchName to avoid ghost duplicates
  const deduplicateStores = (storesList = []) => {
    const seenIds = new Set();
    const seenTenantBranches = new Set();
    const result = [];

    for (const s of storesList) {
      if (!s) continue;
      const sId = String(s.storeId || s._id || '').trim();
      // Exclude test artifacts in normal platform runtime
      if (sId.endsWith('-TEST')) continue;

      const tId = String(s.tenantId || '').toLowerCase();
      const bName = String(s.branchName || s.name || '').toLowerCase().trim();
      const key = `${tId}__${bName}`;

      if (sId && seenIds.has(sId)) continue;
      if (key && seenTenantBranches.has(key)) continue;

      if (sId) seenIds.add(sId);
      if (key) seenTenantBranches.add(key);
      result.push(s);
    }

    return result;
  };

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

      const unifiedStores = getAllUnifiedStores(storesRes?.stores, allBranches);
      setStores(deduplicateStores(unifiedStores));

      if (assignRes?.success && Array.isArray(assignRes.assignments)) {
        setAssignments(assignRes.assignments);
      }
    } catch (err) {
      console.warn('Assignments load error:', err.message);
      setStores(getAllUnifiedStores([], allBranches));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [allBranches]);

  useEffect(() => {
    const handleStoresUpdated = () => {
      setStores(getAllUnifiedStores([], allBranches));
    };
    const handleAssignmentsUpdated = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setAssignments(e.detail);
      } else {
        loadData();
      }
    };
    window.addEventListener('freshmart_stores_updated', handleStoresUpdated);
    window.addEventListener('freshmart_assignments_updated', handleAssignmentsUpdated);
    return () => {
      window.removeEventListener('freshmart_stores_updated', handleStoresUpdated);
      window.removeEventListener('freshmart_assignments_updated', handleAssignmentsUpdated);
    };
  }, [allBranches]);

  // Helper to extract polygon LatLng ring from any zone object
  const getZonePolygonLatLngs = (zone) => {
    if (!zone) return [];
    const rawRing = zone.geometry?.coordinates?.[0] || zone.coordinates?.[0] || zone.coordinates;
    if (!Array.isArray(rawRing) || rawRing.length < 3) return [];
    return rawRing
      .map(([lng, lat]) => [Number(lat), Number(lng)])
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
  };

  // Helper to find all stores physically lying inside a zone's polygon boundary
  const getStoresInZonePoly = (zone, storeList = stores) => {
    if (!zone || !Array.isArray(storeList)) return [];
    const polyLatLngs = getZonePolygonLatLngs(zone);
    if (polyLatLngs.length < 3) return [];

    return storeList.filter((s) => {
      const sLat = Number(s.latitude ?? s.coordinates?.lat);
      const sLng = Number(s.longitude ?? s.coordinates?.lng);
      return Number.isFinite(sLat) && Number.isFinite(sLng) && isPointInPolygon({ lat: sLat, lng: sLng }, polyLatLngs);
    });
  };

  // Currently selected Zone Object
  const activeZone = useMemo(() => {
    if (!selectedZoneId) return zones[0] || null;
    const target = String(selectedZoneId).toLowerCase();
    return zones.find((z) =>
      String(z.zoneId || z._id || z.id || '').toLowerCase() === target ||
      String(z.code || '').toLowerCase() === target
    ) || zones[0] || null;
  }, [zones, selectedZoneId]);

  // Stores currently assigned to the active zone (including stores physically inside its polygon)
  const assignedStoreIdsSet = useMemo(() => {
    if (!activeZone) return new Set();
    const targetZoneId = String(activeZone.zoneId || activeZone._id || activeZone.id || '').toLowerCase();
    const targetCode = String(activeZone.code || '').toLowerCase();

    const set = new Set();
    assignments.forEach((a) => {
      const aZoneId = String(a.zoneId || a._id || '').toLowerCase();
      if ((aZoneId === targetZoneId || aZoneId === targetCode) && a.isActive !== false) {
        if (a.storeId) set.add(String(a.storeId).toLowerCase());
        if (a._id) set.add(String(a._id).toLowerCase());
      }
    });

    if (activeZone.assignedStoreId) {
      set.add(String(activeZone.assignedStoreId).toLowerCase());
    }

    stores.forEach((s) => {
      if (s.assignedZoneId) {
        const sZone = String(s.assignedZoneId).toLowerCase();
        if (sZone === targetZoneId || sZone === targetCode) {
          if (s.storeId) set.add(String(s.storeId).toLowerCase());
          if (s._id) set.add(String(s._id).toLowerCase());
        }
      }
    });

    // Also include stores that physically lie inside this active zone's polygon!
    const insideStores = getStoresInZonePoly(activeZone, stores);
    insideStores.forEach((s) => {
      if (s.storeId) set.add(String(s.storeId).toLowerCase());
      if (s._id) set.add(String(s._id).toLowerCase());
    });

    return set;
  }, [assignments, activeZone, stores]);

  const isStoreAssigned = (store) => {
    if (!store || !activeZone) return false;
    const sId = String(store.storeId || store._id || store.id || '').toLowerCase();
    const directId = store._id ? String(store._id).toLowerCase() : null;
    const directStoreId = store.storeId ? String(store.storeId).toLowerCase() : null;

    if (
      assignedStoreIdsSet.has(sId) ||
      (directId && assignedStoreIdsSet.has(directId)) ||
      (directStoreId && assignedStoreIdsSet.has(directStoreId))
    ) {
      return true;
    }
    if (store.assignedZoneId) {
      const targetZoneId = String(activeZone.zoneId || activeZone._id || activeZone.id || '').toLowerCase();
      const targetCode = String(activeZone.code || '').toLowerCase();
      const sZone = String(store.assignedZoneId).toLowerCase();
      if (sZone === targetZoneId || sZone === targetCode) return true;
    }

    // Check if store physically lies inside active zone's polygon
    const polyLatLngs = getZonePolygonLatLngs(activeZone);
    if (polyLatLngs.length >= 3) {
      const sLat = Number(store.latitude ?? store.coordinates?.lat);
      const sLng = Number(store.longitude ?? store.coordinates?.lng);
      if (Number.isFinite(sLat) && Number.isFinite(sLng) && isPointInPolygon({ lat: sLat, lng: sLng }, polyLatLngs)) {
        return true;
      }
    }

    return false;
  };

  const assignedStores = useMemo(() => {
    return stores.filter(isStoreAssigned);
  }, [stores, assignedStoreIdsSet, activeZone]);

  const unassignedStores = useMemo(() => {
    return stores.filter((s) => !isStoreAssigned(s));
  }, [stores, assignedStoreIdsSet, activeZone]);

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

  // Coordinates of active zone polygon for in-polygon checks
  const activeZonePolygonLatLngs = useMemo(() => {
    const rawRing = activeZone?.geometry?.coordinates?.[0] || activeZone?.coordinates?.[0] || activeZone?.coordinates;
    if (!Array.isArray(rawRing) || rawRing.length < 3) return [];
    return rawRing
      .map(([lng, lat]) => [Number(lat), Number(lng)])
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
  }, [activeZone]);

  const handleAutoLinkInside = async () => {
    if (!activeZone || activeZonePolygonLatLngs.length < 3) {
      if (addToast) addToast('No Polygon', 'Active zone does not have a polygon boundary yet.', 'info');
      return;
    }
    const insideStores = getStoresInZonePoly(activeZone, stores);
    const insideStoreIds = insideStores.map((s) => s.storeId || s._id);

    if (insideStoreIds.length === 0) {
      if (addToast) addToast('No Stores Inside', 'No stores were found physically inside this polygon.', 'info');
      return;
    }

    const zId = activeZone.zoneId || activeZone._id || activeZone.id || activeZone.code;
    applyAssignmentOptimistically(insideStoreIds);

    // Update store state with assignedZoneId
    setStores((prev) =>
      prev.map((s) =>
        insideStoreIds.includes(s.storeId) || insideStoreIds.includes(s._id)
          ? { ...s, assignedZoneId: zId }
          : s
      )
    );

    // Update active zone in state with assignedStoreId
    if (insideStoreIds.length > 0) {
      setZones((prev) =>
        prev.map((z) =>
          (z.zoneId === zId || z._id === zId || z.code === zId) ? { ...z, assignedStoreId: insideStoreIds[0] } : z
        )
      );
    }

    if (addToast) addToast('Auto-Linked ✨', `Linked ${insideStoreIds.length} store(s) inside polygon to ${activeZone.name}!`, 'success');
    try {
      await apiService.assignStoresToZone(zId, insideStoreIds);
      loadData();
    } catch (err) {
      console.warn('Auto-link sync:', err.message);
    }
  };

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

  // Helper to apply optimistic assignment
  const applyAssignmentOptimistically = (idsToAssign) => {
    const ids = Array.isArray(idsToAssign) ? idsToAssign : [idsToAssign];
    const zId = activeZone?.zoneId || activeZone?._id || activeZone?.id || activeZone?.code;
    const newRecords = ids.map((id) => {
      const st = stores.find((s) => (s.storeId || s._id) === id);
      return {
        zoneId: zId,
        storeId: id,
        tenantId: st?.tenantId || 'tenant-unimart',
        isActive: true,
        assignedAt: new Date().toISOString()
      };
    });

    setAssignments((prev) => {
      const remaining = prev.filter(
        (a) => !((a.zoneId === zId || String(a.zoneId).toLowerCase() === String(zId).toLowerCase()) && ids.includes(a.storeId))
      );
      return [...remaining, ...newRecords];
    });

    setSelectedStoreIdsToAssign((prev) => {
      const copy = new Set(prev);
      ids.forEach((id) => copy.delete(id));
      return copy;
    });
  };

  // Helper to apply optimistic removal
  const applyRemovalOptimistically = (storeId) => {
    const zId = activeZone?.zoneId || activeZone?._id || activeZone?.id || activeZone?.code;
    setAssignments((prev) =>
      prev.filter(
        (a) => !((a.zoneId === zId || String(a.zoneId).toLowerCase() === String(zId).toLowerCase()) && (a.storeId === storeId || String(a.storeId).toLowerCase() === String(storeId).toLowerCase()))
      )
    );
  };

  // Assign single store directly with 1 click (enforcing delivery reach)
  const handleAssignSingle = async (storeId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!activeZone || !storeId) return;

    // Check if store's delivery region reaches this zone
    const targetStore = stores.find((s) => (s.storeId || s._id || s.id) === storeId);
    if (targetStore) {
      const sLat = Number(targetStore.latitude ?? targetStore.coordinates?.lat);
      const sLng = Number(targetStore.longitude ?? targetStore.coordinates?.lng);
      const storeRadius = Number(targetStore.deliveryRadiusKm || targetStore.deliveryRadius || 5);
      const distToZone = calculateDistanceKm(zoneCentroid.lat, zoneCentroid.lng, sLat, sLng);
      const isInside = activeZonePolygonLatLngs.length >= 3 &&
        Number.isFinite(sLat) && Number.isFinite(sLng) &&
        isPointInPolygon({ lat: sLat, lng: sLng }, activeZonePolygonLatLngs);

      if (!isInside && distToZone > storeRadius) {
        if (addToast) {
          addToast(
            'Cannot Assign Store ⛔',
            `"${targetStore.name}" delivery radius is only ${storeRadius} km, but this delivery zone is ${distToZone.toFixed(1)} km away. The store admin must increase their delivery radius first in Delivery Zone settings!`,
            'error'
          );
        }
        return;
      }
    }

    const zId = activeZone.zoneId || activeZone._id || activeZone.id || activeZone.code;
    applyAssignmentOptimistically([storeId]);

    // Update store state with assignedZoneId
    setStores((prev) =>
      prev.map((s) =>
        (s.storeId === storeId || s._id === storeId) ? { ...s, assignedZoneId: zId } : s
      )
    );

    // Update active zone in state with assignedStoreId
    setZones((prev) =>
      prev.map((z) =>
        (z.zoneId === zId || z._id === zId || z.code === zId) ? { ...z, assignedStoreId: storeId } : z
      )
    );

    // Propagate zone polygon boundary to assigned branch in localStorage so Store Admin has it
    try {
      const savedBranches = localStorage.getItem('freshmart_branches');
      const branchList = savedBranches ? JSON.parse(savedBranches) : (allBranches || []);
      const cleanStoreId = String(storeId).toLowerCase().trim();
      let updatedBranches = false;
      const updated = branchList.map((b) => {
        const bId = String(b._id || b.id || '').toLowerCase().trim();
        const bStoreId = String(b.storeId || '').toLowerCase().trim();
        if (bId === cleanStoreId || bStoreId === cleanStoreId) {
          updatedBranches = true;
          return {
            ...b,
            assignedZoneId: zId,
            ...(activeZonePolygonLatLngs.length >= 3 ? { deliveryPolygon: activeZonePolygonLatLngs } : {})
          };
        }
        return b;
      });
      if (updatedBranches) {
        localStorage.setItem('freshmart_branches', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('freshmart_branches_updated', { detail: updated }));
        window.dispatchEvent(new CustomEvent('freshmart_stores_updated'));
      }
    } catch (err) {}

    // Update freshmart_zones in localStorage
    try {
      const savedZones = localStorage.getItem('freshmart_zones');
      const localZones = savedZones ? JSON.parse(savedZones) : [];
      const updatedZ = localZones.map((z) =>
        (z.zoneId === zId || z._id === zId || z.code === zId) ? { ...z, assignedStoreId: storeId } : z
      );
      localStorage.setItem('freshmart_zones', JSON.stringify(updatedZ));
      window.dispatchEvent(new CustomEvent('freshmart_zones_updated', { detail: updatedZ }));
    } catch (err) {}

    if (addToast) {
      addToast(`Assigned store to ${activeZone.name}!`, 'success');
    }

    try {
      await apiService.assignStoresToZone(zId, [storeId]);
      loadData();
    } catch (err) {
      console.warn('Background assignment sync:', err.message);
    }
  };

  // Assign Selected Stores
  const handleAssignSelected = async () => {
    if (!activeZone || selectedStoreIdsToAssign.size === 0) return;

    const zId = activeZone.zoneId || activeZone._id || activeZone.id || activeZone.code;
    const ids = Array.from(selectedStoreIdsToAssign);
    applyAssignmentOptimistically(ids);

    setStores((prev) =>
      prev.map((s) =>
        ids.includes(s.storeId) || ids.includes(s._id) ? { ...s, assignedZoneId: zId } : s
      )
    );

    if (addToast) {
      addToast(`Successfully assigned ${ids.length} store(s) to ${activeZone.name}!`, 'success');
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.assignStoresToZone(zId, ids);
      if (res && res.warnings && res.warnings.length > 0 && addToast) {
        addToast(`Note: ${res.warnings.length} store(s) are geographically far from zone boundary.`, 'info');
      }
      loadData();
    } catch (err) {
      console.warn('Background bulk assignment sync:', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove Store from Zone
  const handleRemoveStore = async (storeId) => {
    if (!activeZone || !storeId) return;

    const zId = activeZone.zoneId || activeZone._id || activeZone.id || activeZone.code;
    applyRemovalOptimistically(storeId);

    setStores((prev) =>
      prev.map((s) =>
        (s.storeId === storeId || s._id === storeId) ? { ...s, assignedZoneId: null } : s
      )
    );

    setZones((prev) =>
      prev.map((z) =>
        (z.zoneId === zId || z._id === zId || z.code === zId) && z.assignedStoreId === storeId
          ? { ...z, assignedStoreId: null }
          : z
      )
    );

    if (addToast) {
      addToast(`Store unassigned from ${activeZone.name}.`, 'info');
    }

    try {
      await apiService.removeStoreFromZone(zId, storeId);
      loadData();
    } catch (err) {
      console.warn('Background removal sync:', err.message);
    }
  };

  // Save Edited Assignment Priority
  const handleSaveAssignmentEdit = async () => {
    if (!editingStore || !activeZone) return;
    const sId = editingStore.storeId || editingStore._id;
    setIsSavingEdit(true);
    try {
      const res = await apiService.assignStoresToZone(activeZone.zoneId, [sId], editPriority);
      if (res && res.success) {
        if (addToast) addToast(`Updated fulfillment priority for ${editingStore.name} to Priority ${editPriority}!`, 'success');
        setEditingStore(null);
        loadData();
      } else {
        if (addToast) addToast(res?.message || 'Update failed', 'error');
      }
    } catch (e) {
      if (addToast) addToast(e.message, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Global window helpers for interactive Leaflet map popups
  useEffect(() => {
    window.__assignStoreFromMap = (sId) => {
      handleAssignSingle(sId);
    };
    window.__removeStoreFromMap = (sId) => {
      handleRemoveStore(sId);
    };
    window.__editStoreFromMap = (sId) => {
      const found = stores.find((s) => (s.storeId || s._id) === sId);
      if (found) {
        setEditingStore(found);
        const curr = assignments.find((a) => a.zoneId === activeZone?.zoneId && a.storeId === sId);
        setEditPriority(curr?.priority || 1);
      }
    };
    window.__editZoneFromMap = () => {
      if (onNavigateToZones) onNavigateToZones();
    };
    window.__startDrawingFromMap = () => {
      setIsDrawingPolygon(true);
      setDrawingTool('polygon');
      setDrawnPoints([]);
    };
    window.__createBoxAroundStore = (sId) => {
      const s = stores.find((st) => (st.storeId || st._id) === sId);
      if (s) handleCreatePolygonAroundStore(s);
    };
    window.__createPolygonAroundStore = (sId) => {
      const s = stores.find((st) => (st.storeId || st._id) === sId);
      if (s) handleCreatePolygonAroundStore(s);
    };
    window.__selectZoneFromMap = (targetId) => {
      if (targetId) setSelectedZoneId(targetId);
    };
    return () => {
      delete window.__assignStoreFromMap;
      delete window.__removeStoreFromMap;
      delete window.__editStoreFromMap;
      delete window.__editZoneFromMap;
      delete window.__startDrawingFromMap;
      delete window.__createBoxAroundStore;
      delete window.__createPolygonAroundStore;
      delete window.__selectZoneFromMap;
    };
  }, [stores, assignments, activeZone, onNavigateToZones]);

  // Start drawing custom delivery zone polygon for a specific store
  const handleStartDrawingDeliveryZoneForStore = (store) => {
    if (!store) return;
    setDrawingStoreTarget(store);
    setIsDrawingPolygon(true);
    setDrawingTool('polygon');

    const sLat = Number(store.latitude ?? store.coordinates?.lat);
    const sLng = Number(store.longitude ?? store.coordinates?.lng);

    const rawPoly = store.deliveryPolygon;
    if (Array.isArray(rawPoly) && rawPoly.length >= 3) {
      setDrawnPoints(rawPoly);
    } else if (Number.isFinite(sLat) && Number.isFinite(sLng)) {
      const radiusKm = Number(store.deliveryRadiusKm || store.deliveryRadius || 2.5);
      const latDelta = radiusKm / 111.0;
      const lngDelta = radiusKm / (111.0 * Math.cos((sLat * Math.PI) / 180));
      const numPoints = 6;
      const initialPoly = [];
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints;
        const rFactor = i % 2 === 0 ? 1.05 : 0.95;
        initialPoly.push([
          Number((sLat + latDelta * Math.sin(angle) * rFactor).toFixed(6)),
          Number((sLng + lngDelta * Math.cos(angle) * rFactor).toFixed(6))
        ]);
      }
      setDrawnPoints(initialPoly);
    } else {
      setDrawnPoints([]);
    }

    if (mapInstanceRef.current && Number.isFinite(sLat) && Number.isFinite(sLng)) {
      mapInstanceRef.current.flyTo([sLat, sLng], 14, { duration: 1.2 });
    }

    if (addToast) {
      addToast(
        `Draw Delivery Zone: ${store.branchName || store.name}`,
        'Drag the vertex handles on the map to outline the delivery boundary for this store, then click "Save Store Delivery Zone".',
        'info'
      );
    }
  };

  const handleCreateQuickBranch = async (e) => {
    if (e) e.preventDefault();
    const retailer = CORE_RETAILERS.find((r) => r.id === quickBranchForm.tenantId) || CORE_RETAILERS[0];
    const bName = (quickBranchForm.branchName || '').trim() || `Commercial Branch ${Date.now().toString().slice(-4)}`;
    const sName = `${retailer.name} - ${bName}`;
    const sId = `STR-${quickBranchForm.tenantId.replace('tenant-', '').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newStore = {
      _id: sId,
      storeId: sId,
      tenantId: quickBranchForm.tenantId,
      tenantName: retailer.name,
      name: sName,
      branchName: bName,
      address: (quickBranchForm.address || '').trim() || `Main Commercial Road, ${quickBranchForm.city || 'Faisalabad'}, Pakistan`,
      city: quickBranchForm.city || 'Faisalabad',
      latitude: Number(quickBranchForm.latitude) || 31.4125,
      longitude: Number(quickBranchForm.longitude) || 73.0995,
      deliveryRadiusKm: Number(quickBranchForm.deliveryRadiusKm) || 5,
      status: 'active',
      isActive: true,
      operatingStatus: 'Open'
    };

    try {
      await apiService.createStore(newStore);
    } catch (err) {}

    // Save to local storage
    try {
      const raw = localStorage.getItem('freshmart_custom_stores');
      const existing = raw ? JSON.parse(raw) : [];
      localStorage.setItem('freshmart_custom_stores', JSON.stringify([newStore, ...existing]));
    } catch {}

    setStores((prev) => deduplicateStores([newStore, ...prev]));
    setIsQuickAddModalOpen(false);
    setQuickBranchForm({
      tenantId: 'tenant-alfatah',
      branchName: '',
      address: '',
      city: 'Faisalabad',
      latitude: 31.4125,
      longitude: 73.0995,
      deliveryRadiusKm: 5
    });

    // IMMEDIATELY activate drawing mode on the map for this new store!
    handleStartDrawingDeliveryZoneForStore(newStore);

    if (addToast) {
      addToast(
        'Store Branch Added 🎉',
        `"${sName}" added! Now click on the map around it to outline its delivery zone.`,
        'success'
      );
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
    drawingLayerRef.current = L.layerGroup().addTo(map);

    // Map click adds polygon vertices around stores
    map.on('click', (e) => {
      if (!isDrawingPolygonRef.current) return;
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));

      // Freehand / Polygon mode: auto-order to prevent self-crossing
      setDrawnPoints((prev) => {
        const next = [...prev, [lat, lng]];
        if (next.length >= 3 && hasCrossingSegments(next)) {
          return untanglePoints(next);
        }
        return next;
      });
    });

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

  // Update Drawing Layer Preview whenever drawnPoints change
  useEffect(() => {
    if (!mapInstanceRef.current || !drawingLayerRef.current) return;
    drawingLayerRef.current.clearLayers();

    if (!isDrawingPolygon || drawnPoints.length === 0) return;

    const color = activeZone?.color || '#10b981';

    // Auto-untangle if crossing lines exist so preview NEVER looks like a twisted hourglass
    const cleanPoints = hasCrossingSegments(drawnPoints) ? untanglePoints(drawnPoints) : drawnPoints;

    // 1. Draw each vertex point with corner / number badge
    cleanPoints.forEach(([lat, lng], idx) => {
      const isFirst = idx === 0;
      const cornerLabel = `${idx + 1}`;

      const vertexIcon = L.divIcon({
        className: 'custom-drawing-vertex',
        html: `
          <div style="display: flex; align-items: center; justify-content: center; min-width: 26px; height: 26px; padding: 0 4px; border-radius: 9999px; background: ${isFirst ? '#059669' : color}; color: #ffffff; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); font-size: 10px; font-weight: 900; font-family: monospace;">
            ${cornerLabel}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([lat, lng], {
        icon: vertexIcon,
        draggable: true
      });

      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        setDrawnPoints((prev) => {
          const updated = [...prev];
          updated[idx] = [Number(newPos.lat.toFixed(6)), Number(newPos.lng.toFixed(6))];
          return updated;
        });
      });

      drawingLayerRef.current.addLayer(marker);
    });

    // 2. Draw connecting polyline loop around perimeter
    if (cleanPoints.length >= 2) {
      const loop = cleanPoints.length >= 3 ? [...cleanPoints, cleanPoints[0]] : cleanPoints;
      const line = L.polyline(loop, {
        color: color,
        weight: 3.5,
        dashArray: '6, 6'
      });
      drawingLayerRef.current.addLayer(line);
    }

    // 3. Draw closing preview if 3 or more points
    if (cleanPoints.length >= 3) {
      const previewPolygon = L.polygon(cleanPoints, {
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.25,
        dashArray: '4, 4',
        interactive: false
      });
      drawingLayerRef.current.addLayer(previewPolygon);
    }
  }, [drawnPoints, isDrawingPolygon, activeZone]);

  // Helper to reorder points clockwise around their geometric centroid into a clean non-crossing perimeter
  const untanglePoints = (pts) => {
    if (!pts || pts.length < 3) return pts;
    const cLat = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
    const cLng = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
    return [...pts].sort((a, b) => {
      let angleA = Math.atan2(a[1] - cLng, a[0] - cLat);
      let angleB = Math.atan2(b[1] - cLng, b[0] - cLat);
      if (angleA < 0) angleA += 2 * Math.PI;
      if (angleB < 0) angleB += 2 * Math.PI;
      return angleA - angleB;
    });
  };

  // Helper to detect if line segments cross each other
  const hasCrossingSegments = (pts) => {
    if (!pts || pts.length < 4) return false;
    const n = pts.length;
    const ccw = (a, b, c) => (c[0] - a[0]) * (b[1] - a[1]) > (b[0] - a[0]) * (c[1] - a[1]);
    const intersect = (p1, p2, p3, p4) =>
      ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    for (let i = 0; i < n; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const p3 = pts[j];
        const p4 = pts[(j + 1) % n];
        if (intersect(p1, p2, p3, p4)) return true;
      }
    }
    return false;
  };

  const isTangled = useMemo(() => {
    return hasCrossingSegments(drawnPoints);
  }, [drawnPoints]);

  const handleUntanglePoints = () => {
    if (drawnPoints.length < 3) return;
    const untangled = untanglePoints(drawnPoints);
    setDrawnPoints(untangled);
    if (addToast) {
      addToast(
        'Perimeter Untangled ✨',
        'Boundary vertices reordered smoothly around the perimeter.',
        'info'
      );
    }
  };

  // Helper to create an organic delivery polygon centered around any store
  const handleCreatePolygonAroundStore = (store, radiusKm = 2.5) => {
    if (!store) return;
    const sLat = Number(store.latitude);
    const sLng = Number(store.longitude);
    if (isNaN(sLat) || isNaN(sLng) || !Number.isFinite(sLat) || !Number.isFinite(sLng)) return;

    const latDelta = radiusKm / 111.0;
    const lngDelta = radiusKm / (111.0 * Math.cos((sLat * Math.PI) / 180));
    const numPoints = 6;
    const polyPoints = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      const rFactor = i % 2 === 0 ? 1.05 : 0.95;
      polyPoints.push([
        Number((sLat + latDelta * Math.sin(angle) * rFactor).toFixed(6)),
        Number((sLng + lngDelta * Math.cos(angle) * rFactor).toFixed(6))
      ]);
    }

    setIsDrawingPolygon(true);
    setDrawingTool('polygon');
    setDrawnPoints(polyPoints);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(polyPoints), { padding: [40, 40] });
    }
    if (addToast) {
      addToast(
        'Delivery Polygon Created ⬡',
        `A 6-vertex polygon placed around ${store.name || store.branchName}. Click "Save Polygon" to apply or drag vertices to adjust.`,
        'success'
      );
    }
  };

  // Polygon Drawing Handlers
  const handleUndoPoint = () => {
    setDrawnPoints((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClearDrawing = () => {
    setDrawnPoints([]);
    if (drawingLayerRef.current) drawingLayerRef.current.clearLayers();
  };

  const handleCancelDrawing = () => {
    setIsDrawingPolygon(false);
    setDrawingStoreTarget(null);
    setDrawnPoints([]);
    if (drawingLayerRef.current) drawingLayerRef.current.clearLayers();
  };

  const handleSaveDrawnPolygon = async () => {
    if (drawnPoints.length < 3) {
      if (addToast) addToast('Missing Vertices', 'Please place at least 3 points on the map to form a valid polygon.', 'warning');
      return;
    }

    setIsSavingPolygon(true);
    try {
      // Auto-untangle if vertices cross each other so geometry is guaranteed valid
      const cleanPoints = hasCrossingSegments(drawnPoints) ? untanglePoints(drawnPoints) : drawnPoints;

      // 1. If drawing specifically for a store's delivery zone:
      if (drawingStoreTarget) {
        const storeId = drawingStoreTarget.storeId || drawingStoreTarget._id || drawingStoreTarget.id;
        const sName = drawingStoreTarget.branchName || drawingStoreTarget.name || 'Store';

        // Update state stores
        setStores((prev) =>
          prev.map((s) => {
            const sid = s.storeId || s._id || s.id;
            return (sid === storeId || String(sid).toLowerCase() === String(storeId).toLowerCase())
              ? { ...s, deliveryPolygon: cleanPoints }
              : s;
          })
        );

        // Persist to freshmart_branches in localStorage
        try {
          const savedBranches = localStorage.getItem('freshmart_branches');
          const branchList = savedBranches ? JSON.parse(savedBranches) : [];
          const cleanStoreId = String(storeId).toLowerCase().trim();
          let matched = false;
          const updatedBranches = branchList.map((b) => {
            const bid = String(b._id || b.id || b.storeId || '').toLowerCase().trim();
            if (bid === cleanStoreId) {
              matched = true;
              return { ...b, deliveryPolygon: cleanPoints };
            }
            return b;
          });
          if (!matched && drawingStoreTarget) {
            updatedBranches.push({ ...drawingStoreTarget, deliveryPolygon: cleanPoints });
          }
          localStorage.setItem('freshmart_branches', JSON.stringify(updatedBranches));
          window.dispatchEvent(new CustomEvent('freshmart_branches_updated', { detail: updatedBranches }));
        } catch (e) {
          console.warn('Branch update error:', e);
        }

        // Persist to freshmart_custom_stores in localStorage
        try {
          const savedCustom = localStorage.getItem('freshmart_custom_stores');
          if (savedCustom) {
            const customList = JSON.parse(savedCustom) || [];
            const cleanStoreId = String(storeId).toLowerCase().trim();
            const updatedCustom = customList.map((c) => {
              const cid = String(c.storeId || c._id || c.id || '').toLowerCase().trim();
              if (cid === cleanStoreId) {
                return { ...c, deliveryPolygon: cleanPoints };
              }
              return c;
            });
            localStorage.setItem('freshmart_custom_stores', JSON.stringify(updatedCustom));
          }
        } catch (e) {
          console.warn('Custom stores update error:', e);
        }

        window.dispatchEvent(new CustomEvent('freshmart_stores_updated'));

        if (addToast) {
          addToast(
            'Store Delivery Zone Saved! ⬡',
            `Custom delivery polygon successfully saved for "${sName}" (${cleanPoints.length} vertices).`,
            'success'
          );
        }

        setIsDrawingPolygon(false);
        setDrawingStoreTarget(null);
        setDrawnPoints([]);
        if (drawingLayerRef.current) drawingLayerRef.current.clearLayers();
        return;
      }

      const ring = cleanPoints.map(([lat, lng]) => [
        Number(Number(lng).toFixed(6)),
        Number(Number(lat).toFixed(6))
      ]);
      // Ensure linear ring is closed (first coord matches last coord)
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }

      if (!activeZone) {
        // Create brand new master delivery polygon on demand
        const newZonePayload = {
          zoneId: `ZONE-FSD-MASTER-${Date.now().toString().slice(-4)}`,
          name: 'Faisalabad Master Delivery Region',
          code: 'FSD-MASTER',
          city: 'Faisalabad',
          area: 'Faisalabad Core Region',
          description: 'Master Supermarket Delivery Region covering flagship partner hubs.',
          deliveryCharge: 80,
          minOrderAmount: 400,
          freeDeliveryThreshold: 2000,
          color: '#10b981',
          isActive: true,
          status: 'active',
          geometry: {
            type: 'Polygon',
            coordinates: [ring]
          }
        };

        const createRes = await apiService.createZone(newZonePayload);
        if (createRes && createRes.success) {
          const created = createRes.zone || newZonePayload;
          if (addToast) addToast('Master Polygon Created ✨', `Delivery zone "${created.name}" created and applied!`, 'success');
          setZones((prev) => [created, ...(prev || [])]);
          setSelectedZoneId(created.zoneId);
          setIsDrawingPolygon(false);
          setDrawnPoints([]);
          if (drawingLayerRef.current) drawingLayerRef.current.clearLayers();
          loadData();
          return;
        } else {
          if (addToast) addToast('Creation Failed', createRes?.message || 'Failed to create new zone', 'error');
          return;
        }
      }

      const payload = {
        ...activeZone,
        geometry: {
          type: 'Polygon',
          coordinates: [ring]
        }
      };

      const zId = activeZone.zoneId || activeZone._id || activeZone.id || activeZone.code;
      const res = await apiService.updateZone(zId, payload);
      if (res && res.success) {
        // Automatically find and assign all stores physically lying inside the newly drawn polygon
        const insideStores = stores.filter((s) => {
          const sLat = Number(s.latitude ?? s.coordinates?.lat);
          const sLng = Number(s.longitude ?? s.coordinates?.lng);
          return Number.isFinite(sLat) && Number.isFinite(sLng) && isPointInPolygon({ lat: sLat, lng: sLng }, cleanPoints);
        });
        const insideStoreIds = insideStores.map((s) => s.storeId || s._id).filter(Boolean);

        if (insideStoreIds.length > 0) {
          applyAssignmentOptimistically(insideStoreIds);
          setStores((prev) =>
            prev.map((s) =>
              insideStoreIds.includes(s.storeId) || insideStoreIds.includes(s._id)
                ? { ...s, assignedZoneId: zId }
                : s
            )
          );
          try {
            await apiService.assignStoresToZone(zId, insideStoreIds);
          } catch (assignErr) {
            console.warn('Auto-link inside stores warning:', assignErr.message);
          }
        }

        if (addToast) {
          addToast(
            'Polygon Saved ✅',
            insideStoreIds.length > 0
              ? `Polygon saved! Automatically linked ${insideStoreIds.length} store(s) inside this boundary to "${activeZone.name}".`
              : `Polygon boundary for "${activeZone.name}" saved successfully!`,
            'success'
          );
        }

        // Optimistically update local state
        setZones((prev) =>
          prev.map((z) =>
            (z.zoneId === zId || z._id === zId || z.code === zId)
              ? { ...z, geometry: payload.geometry, assignedStoreId: insideStoreIds[0] || z.assignedStoreId }
              : z
          )
        );

        setIsDrawingPolygon(false);
        setDrawnPoints([]);
        if (drawingLayerRef.current) drawingLayerRef.current.clearLayers();

        // Refresh zone data in background
        loadData();

        // Propagate polygon boundary to assigned branches or branches inside this zone that lack custom polygons
        try {
          const savedBranches = localStorage.getItem('freshmart_branches');
          const branchList = savedBranches ? JSON.parse(savedBranches) : (allBranches || []);
          if (Array.isArray(branchList) && branchList.length > 0) {
            let updatedAny = false;
            const assignedIds = new Set(Array.from(assignedStoreIdsSet));
            const updated = branchList.map((b) => {
              const bId = String(b._id || b.id || '').toLowerCase();
              const isAssigned = assignedIds.has(b._id) || assignedIds.has(b.id) || assignedIds.has(b.storeId);
              const bLat = Number(b.latitude ?? b.coordinates?.lat);
              const bLng = Number(b.longitude ?? b.coordinates?.lng);
              const isInside = isPointInPolygon({ lat: bLat, lng: bLng }, cleanPoints);

              if (isAssigned || isInside) {
                updatedAny = true;
                return {
                  ...b,
                  deliveryPolygon: cleanPoints,
                  assignedZoneId: zId
                };
              }
              return b;
            });
            if (updatedAny) {
              localStorage.setItem('freshmart_branches', JSON.stringify(updated));
              window.dispatchEvent(new CustomEvent('freshmart_branches_updated', { detail: updated }));
              window.dispatchEvent(new CustomEvent('freshmart_stores_updated'));
            }
          }
        } catch (e) {
          console.warn('Failed to sync branches with master zone polygon:', e);
        }
      } else {
        if (addToast) addToast('Save Failed', res?.message || 'Failed to save zone polygon', 'error');
      }
    } catch (err) {
      if (addToast) addToast('Save Error', `Save polygon error: ${err.message}`, 'error');
    } finally {
      setIsSavingPolygon(false);
    }
  };

  // Sync Map when activeZone or assigned stores change
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonLayerRef.current || !storeMarkersGroupRef.current) return;
    polygonLayerRef.current.clearLayers();
    storeMarkersGroupRef.current.clearLayers();

    if (!activeZone) {
      // Draw all stores with their authentic delivery radius regions so users see the store locations/areas even before polygons exist
      stores.forEach((store) => {
        const sLat = Number(store.latitude);
        const sLng = Number(store.longitude);
        if (isNaN(sLat) || isNaN(sLng) || !Number.isFinite(sLat) || !Number.isFinite(sLng)) return;

        const retailer = CORE_RETAILERS.find((r) =>
          String(store.tenantId || '').toLowerCase().includes(r.id.replace('tenant-', ''))
        ) || { name: 'Retailer', color: '#059669', logo: '🏬' };

        const radiusKm = Number(store.deliveryRadiusKm || store.deliveryRadius || 5);

        const pinIcon = L.divIcon({
          className: 'custom-unassigned-store-pin',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
              <div style="width: 32px; height: 32px; border-radius: 10px; background: ${retailer.color}; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                ${retailer.logo}
              </div>
              <div style="margin-top: 2px; padding: 1px 6px; border-radius: 9999px; background: #0f172a; color: white; font-size: 9px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                ${store.branchName || store.name}
              </div>
            </div>
          `,
          iconSize: [32, 48],
          iconAnchor: [16, 40]
        });

        const marker = L.marker([sLat, sLng], { icon: pinIcon, interactive: !isDrawingPolygon });
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; min-width: 170px;">
            <strong style="color: ${retailer.color}; font-size: 13px;">${store.name}</strong>
            <p style="color: #64748b; font-size: 10px; margin: 2px 0 4px 0;">${store.address}</p>
            <div style="font-size: 10px; color: #475569; margin-bottom: 6px;">
              Retailer Delivery Radius: <strong>${radiusKm} km</strong>
            </div>
            <div style="font-size: 9px; color: #059669; font-weight: bold;">
              Draw polygon above or select/create zone to assign store
            </div>
          </div>
        `);
        storeMarkersGroupRef.current.addLayer(marker);
      });
      return;
    }

    // 1. Draw All Zone Polygons simultaneously (Active zone highlighted, others dashed & clickable)
    const zonesWithPolygons = zones.filter((z) => {
      const ring = z.geometry?.coordinates?.[0] || z.coordinates?.[0] || z.coordinates;
      return Array.isArray(ring) && ring.length >= 3;
    });

    const activeZId = activeZone ? String(activeZone.zoneId || activeZone._id || activeZone.id || activeZone.code || '').toLowerCase() : null;

    zonesWithPolygons.forEach((z) => {
      const zId = String(z.zoneId || z._id || z.id || z.code || '').toLowerCase();
      const isActive = Boolean(activeZId && zId === activeZId);
      const latLngs = getZonePolygonLatLngs(z);
      if (latLngs.length < 3) return;

      const color = z.color || '#10b981';
      const insideStores = getStoresInZonePoly(z, stores);

      const polygon = L.polygon(latLngs, {
        color: color,
        weight: isActive ? (isDrawingPolygon ? 1.5 : 3.5) : 2,
        fillColor: color,
        fillOpacity: isActive ? (isDrawingPolygon ? 0.08 : 0.35) : 0.16,
        dashArray: isActive ? (isDrawingPolygon ? '4, 4' : null) : '4, 4',
        interactive: !isDrawingPolygon
      });

      polygon.on('click', () => {
        if (!isDrawingPolygonRef.current) {
          setSelectedZoneId(z.zoneId || z._id || z.id);
        }
      });

      polygon.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 180px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 13px;">${z.name}</strong>
            <span style="font-size: 10px; background: ${color}20; color: ${color}; padding: 2px 6px; border-radius: 6px; font-weight: 800;">
              ${z.code || ''}
            </span>
          </div>
          <div style="font-size: 11px; color: #059669; font-weight: bold; margin: 3px 0;">
            🏬 Contains ${insideStores.length} Supermarket(s)
          </div>
          <div style="font-size: 11px; color: #475569; margin: 2px 0;">
            Delivery Fee: <strong style="color: #059669;">Rs. ${z.deliveryCharge}</strong>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            Free Delivery Over: <strong>Rs. ${z.freeDeliveryThreshold}</strong>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${!isActive ? `
              <button
                onclick="window.__selectZoneFromMap && window.__selectZoneFromMap('${z.zoneId || z._id || z.id}')"
                style="width: 100%; padding: 5px 8px; background: #0f172a; color: white; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
              >
                📍 Select This Delivery Zone
              </button>
            ` : `
              <button
                onclick="window.__startDrawingFromMap && window.__startDrawingFromMap()"
                style="width: 100%; padding: 4px 8px; background: #059669; color: white; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
              >
                ✏️ Redraw Zone Polygon
              </button>
              <button
                onclick="window.__editZoneFromMap && window.__editZoneFromMap()"
                style="width: 100%; padding: 4px 8px; background: #0f172a; color: white; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
              >
                ⚙️ Edit Zone Details & Rates
              </button>
            `}
          </div>
        </div>
      `);

      polygonLayerRef.current.addLayer(polygon);

      if (isActive && latLngs.length > 0 && !isDrawingPolygon) {
        const bounds = L.latLngBounds(latLngs);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    });

    // 2. Draw Assigned Stores Markers (Solid Green Pins)
    assignedStores.forEach((store) => {
      const sLat = Number(store.latitude);
      const sLng = Number(store.longitude);
      if (isNaN(sLat) || isNaN(sLng)) return;

      const retailer = CORE_RETAILERS.find((r) =>
        String(store.tenantId || '').toLowerCase().includes(r.id.replace('tenant-', ''))
      ) || { name: 'Retailer', color: '#059669', logo: '🏬' };

      const sId = store.storeId || store._id;
      const curr = assignments.find((a) => a.zoneId === activeZone.zoneId && a.storeId === sId);
      const priorityLabel = curr?.priority === 1 ? 'Priority 1 (Primary)' : `Priority ${curr?.priority || 1}`;

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

      const marker = L.marker([sLat, sLng], { icon: pinIcon, interactive: !isDrawingPolygon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 170px;">
          <strong style="color: ${retailer.color}; font-size: 13px;">${store.name}</strong>
          <p style="color: #64748b; font-size: 10px; margin: 2px 0 4px 0;">${store.address}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; margin-bottom: 6px;">
            <span style="color: #059669; font-weight: bold;">✓ Serving this zone</span>
            <span style="background: #ecfdf5; color: #047857; padding: 1px 5px; border-radius: 4px; font-weight: 700;">${priorityLabel}</span>
          </div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <button
              onclick="window.__createPolygonAroundStore && window.__createPolygonAroundStore('${sId}')"
              style="flex: 1; padding: 4px 6px; background: #059669; color: white; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
            >
              ⬡ Polygon
            </button>
            <button
              onclick="window.__editStoreFromMap && window.__editStoreFromMap('${sId}')"
              style="flex: 1; padding: 4px 6px; background: #0284c7; color: white; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
            >
              ⚙️ Priority
            </button>
            <button
              onclick="window.__removeStoreFromMap && window.__removeStoreFromMap('${sId}')"
              style="padding: 4px 6px; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
            >
              ✕ Unlink
            </button>
          </div>
        </div>
      `);
      storeMarkersGroupRef.current.addLayer(marker);
    });

    // 3. Draw Nearby Available Stores (Dashed Pins clickable to assign from map)
    storesWithDistance.slice(0, 10).forEach((store) => {
      const sLat = Number(store.latitude);
      const sLng = Number(store.longitude);
      if (isNaN(sLat) || isNaN(sLng)) return;

      const retailer = CORE_RETAILERS.find((r) =>
        String(store.tenantId || '').toLowerCase().includes(r.id.replace('tenant-', ''))
      ) || { name: 'Retailer', color: '#64748b', logo: '🏬' };

      const sId = store.storeId || store._id;
      const pinIcon = L.divIcon({
        className: 'custom-available-store-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; opacity: 0.9;">
            <div style="width: 28px; height: 28px; border-radius: 8px; background: #ffffff; border: 2px dashed ${retailer.color}; box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; color: ${retailer.color}; font-size: 12px;">
              ${retailer.logo}
            </div>
            <div style="margin-top: 1px; padding: 1px 5px; border-radius: 9999px; background: #ffffff; color: #475569; border: 1px solid #cbd5e1; font-size: 8px; font-weight: 700; white-space: nowrap; max-width: 90px; overflow: hidden; text-overflow: ellipsis;">
              + ${store.branchName || store.name}
            </div>
          </div>
        `,
        iconSize: [28, 42],
        iconAnchor: [14, 36]
      });

      const marker = L.marker([sLat, sLng], { icon: pinIcon, interactive: !isDrawingPolygon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 170px;">
          <strong style="color: ${retailer.color}; font-size: 13px;">${store.name}</strong>
          <p style="color: #64748b; font-size: 10px; margin: 2px 0 4px 0;">${store.address}</p>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">
            Distance to zone: <strong>~${store.distanceToZoneCentroidKm} km</strong>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <button
              onclick="window.__createPolygonAroundStore && window.__createPolygonAroundStore('${sId}')"
              style="width: 100%; padding: 4px 8px; background: #0284c7; color: white; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
            >
              ⬡ Polygon Around Store
            </button>
            <button
              onclick="window.__assignStoreFromMap && window.__assignStoreFromMap('${sId}')"
              style="width: 100%; padding: 4px 8px; background: #059669; color: white; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;"
            >
              + Assign Store to ${activeZone.name}
            </button>
          </div>
        </div>
      `);
      storeMarkersGroupRef.current.addLayer(marker);
    });

    // 4. Draw Store-Level Custom Delivery Polygons (if configured)
    stores.forEach((store) => {
      const rawPoly = store.deliveryPolygon;
      if (!Array.isArray(rawPoly) || rawPoly.length < 3) return;
      if (drawingStoreTarget && (drawingStoreTarget.storeId || drawingStoreTarget._id) === (store.storeId || store._id)) return;

      const retailer = CORE_RETAILERS.find((r) =>
        String(store.tenantId || '').toLowerCase().includes(r.id.replace('tenant-', ''))
      ) || { name: 'Retailer', color: '#059669', logo: '🏬' };

      const storePoly = L.polygon(rawPoly, {
        color: retailer.color,
        weight: 2.2,
        dashArray: '5, 5',
        fillColor: retailer.color,
        fillOpacity: 0.15,
        interactive: !isDrawingPolygon
      });

      storePoly.bindTooltip(`
        <div style="font-family: inherit; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 4px;">
          <span>${retailer.logo}</span>
          <span>${store.branchName || store.name} Delivery Zone</span>
        </div>
      `, { sticky: true });

      polygonLayerRef.current.addLayer(storePoly);
    });
  }, [activeZone, assignedStores, isDrawingPolygon, stores, storesWithDistance, assignments, zones, drawingStoreTarget]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-600" />
            <span>Store Delivery Zones & Customer Reach</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Concept 2: Each individual store maintains its own delivery zone and radius. Customer orders are dispatched strictly within the store's authorized delivery region.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsQuickAddModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Store & Draw Delivery Zone</span>
          </button>
          <button
            onClick={loadData}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
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

        {zones.length === 0 ? (
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                📍
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">No Master Delivery Polygons Created Yet</h4>
                <p className="text-slate-600 text-[11px]">
                  All store locations and regions are visible on the map below. Super Admin can click "✏️ Draw Master Polygon" to outline the region.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsDrawingPolygon(true);
                setDrawnPoints([]);
                if (addToast) addToast('Click map around stores to place at least 3 points, then click "Save Polygon".', 'info');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>+ Draw Master Polygon</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {zones.map((zone) => {
              const zoneKey = zone.zoneId || zone._id || zone.id;
              const zId = String(zone.zoneId || zone._id || zone.id || '').toLowerCase();
              const zCode = String(zone.code || '').toLowerCase();
              const isSelected = activeZone && (
                (activeZone.zoneId && String(activeZone.zoneId).toLowerCase() === zId) ||
                (activeZone._id && String(activeZone._id).toLowerCase() === zId) ||
                (activeZone.code && String(activeZone.code).toLowerCase() === zCode)
              );
              const zoneAssignedSet = new Set();
              assignments.forEach((a) => {
                const aZ = String(a.zoneId || a._id || '').toLowerCase();
                if ((aZ === zId || aZ === zCode) && a.isActive !== false && a.storeId) {
                  zoneAssignedSet.add(String(a.storeId).toLowerCase());
                }
              });
              if (zone.assignedStoreId) zoneAssignedSet.add(String(zone.assignedStoreId).toLowerCase());
              stores.forEach((s) => {
                if (s.assignedZoneId) {
                  const sZ = String(s.assignedZoneId).toLowerCase();
                  if (sZ === zId || sZ === zCode) {
                    zoneAssignedSet.add(String(s.storeId || s._id).toLowerCase());
                  }
                }
              });
              // Include all stores physically lying inside this zone's polygon boundary!
              const insideStores = getStoresInZonePoly(zone, stores);
              insideStores.forEach((s) => {
                zoneAssignedSet.add(String(s.storeId || s._id).toLowerCase());
              });

              const assignedCount = zoneAssignedSet.size;
              const color = zone.color || '#10b981';

              return (
                <button
                  key={zoneKey}
                  onClick={() => setSelectedZoneId(zone.zoneId || zone._id || zone.id)}
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
        )}
      </div>

      {/* Main 2-Column Interface: Left Map & Zone Details, Right Supermarket Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Leaflet Map & Zone Summary */}
        <div className="lg:col-span-7 space-y-4">
          {/* Interactive Map */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Delivery Coverage & Supermarkets Map</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (isDrawingPolygon) {
                      handleCancelDrawing();
                    } else {
                      setIsDrawingPolygon(true);
                      setDrawingTool('polygon');
                      setDrawnPoints([]);
                      if (addToast) addToast('✏️ Draw Polygon Mode', 'Click points around the stores on the map to define the delivery boundary.', 'info');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shadow-xs ${
                    isDrawingPolygon
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isDrawingPolygon ? 'Exit Polygon' : '✏️ Draw Polygon'}</span>
                </button>

                {onNavigateToZones && (
                  <button
                    type="button"
                    onClick={onNavigateToZones}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Edit Rates</span>
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <div
                ref={mapContainerRef}
                className={`w-full z-10 transition-all ${isDrawingPolygon ? 'cursor-crosshair ring-2 ring-emerald-500 ring-inset' : ''}`}
                style={{ height: '380px' }}
              />

              {/* Drawing Mode Overlay Banner */}
              {isDrawingPolygon && (
                <div className="absolute top-2 left-2 right-2 z-[1000] bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 border border-emerald-500/60 shadow-2xl flex flex-col gap-2 animate-in fade-in max-w-full">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">
                            {drawingStoreTarget
                              ? `Drawing Delivery Zone for: ${drawingStoreTarget.branchName || drawingStoreTarget.name}`
                              : `Drawing: ${activeZone?.name || 'New Delivery Boundary'}`}
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                            {drawnPoints.length} Vertex{drawnPoints.length === 1 ? '' : 'es'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300">
                          {drawingStoreTarget
                            ? 'Drag vertices or click on the map to shape this store\'s delivery region. Then click "Save Store Delivery Zone".'
                            : (drawnPoints.length < 3
                                ? `Click map around stores to place ${3 - drawnPoints.length} more point(s) to form delivery polygon.`
                                : 'Click map to add more vertices, or click "Save Polygon" to apply.')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1.5 border-t border-slate-800">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={handleUndoPoint}
                        disabled={drawnPoints.length === 0}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Undo
                      </button>
                      <button
                        type="button"
                        onClick={handleClearDrawing}
                        disabled={drawnPoints.length === 0}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Clear
                      </button>
                      {drawnPoints.length >= 3 && (
                        <button
                          type="button"
                          onClick={handleUntanglePoints}
                          title="Untangle points into a smooth perimeter"
                          className="px-2.5 py-1 bg-indigo-900/70 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-300" />
                          <span>Untangle ✨</span>
                        </button>
                      )}
                      {stores.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const targetStore = assignedStores[0] || storesWithDistance[0] || stores[0];
                            if (targetStore) handleCreatePolygonAroundStore(targetStore, 2.5);
                          }}
                          title="Place authentic polygon around target store"
                          className="px-2.5 py-1 bg-amber-900/70 hover:bg-amber-800 text-amber-200 border border-amber-700/60 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Store className="w-3 h-3 text-amber-300" />
                          <span>Polygon Around Store ⬡</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleCancelDrawing}
                        className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 border border-rose-700/60 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveDrawnPolygon}
                      disabled={drawnPoints.length < 3 || isSavingPolygon}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer shrink-0 ml-auto"
                    >
                      {isSavingPolygon ? (
                        <>
                          <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{drawingStoreTarget ? 'Save Store Delivery Zone' : 'Save Polygon'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Zone Summary Card */}
          {activeZone ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-xs shrink-0"
                  style={{ backgroundColor: activeZone.color || '#10b981' }}
                >
                  📍
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{activeZone.name}</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                      {activeZone.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>Delivery Fee: <strong className="text-emerald-700 font-bold">Rs. {activeZone.deliveryCharge}</strong></span>
                    <span>•</span>
                    <span>Min Order: <strong>Rs. {activeZone.minOrderAmount || 400}</strong></span>
                    <span>•</span>
                    <span>Linked Stores: <strong className="text-slate-800 font-bold">{assignedStores.length}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawingPolygon(true);
                    setDrawnPoints([]);
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Redraw Polygon</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl text-xs text-slate-600 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Select a zone above or click <strong>✏️ Draw Polygon</strong> on the map to define delivery boundaries.</span>
              </div>
            </div>
          )}

          {/* Stores Serving This Delivery Zone Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-sm">
                  🏬
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Supermarkets Serving {activeZone?.name || 'Active Zone'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                      {assignedStores.length} Store{assignedStores.length === 1 ? '' : 's'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Stores authorized and geofenced to fulfill grocery delivery orders within this polygon.
                  </p>
                </div>
              </div>

              {assignedStores.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Active Fulfillment Pool</span>
                </div>
              )}
            </div>

            {assignedStores.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                <div className="text-2xl">📍</div>
                <h4 className="font-bold text-slate-700 text-xs">No Supermarkets Linked Yet</h4>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Click <strong>"+ Link to Zone"</strong> on any partner supermarket on the right, or click <strong>"✏️ Draw Polygon"</strong> above to encompass your stores.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assignedStores.map((store) => {
                  const sId = store.storeId || store._id;
                  const retailer = CORE_RETAILERS.find((r) =>
                    String(store.tenantId || '').toLowerCase().includes(r.id.replace('tenant-', ''))
                  ) || { name: 'Supermarket', color: '#059669', logo: '🏬' };

                  const curr = assignments.find(
                    (a) =>
                      (a.zoneId === activeZone?.zoneId || a.zoneId === activeZone?._id) &&
                      (a.storeId === sId || a.storeId === store.storeId || a.storeId === store._id)
                  );
                  const priorityNum = curr?.priority || 1;

                  const sLat = Number(store.latitude ?? store.coordinates?.lat);
                  const sLng = Number(store.longitude ?? store.coordinates?.lng);
                  const polyLatLngs = getZonePolygonLatLngs(activeZone);
                  const isInsidePoly =
                    polyLatLngs.length >= 3 &&
                    Number.isFinite(sLat) &&
                    Number.isFinite(sLng) &&
                    isPointInPolygon({ lat: sLat, lng: sLng }, polyLatLngs);

                  return (
                    <div
                      key={sId}
                      className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-2xs"
                            style={{
                              backgroundColor: `${retailer.color}15`,
                              borderColor: `${retailer.color}35`,
                              color: retailer.color
                            }}
                          >
                            {retailer.logo}
                          </span>
                          <div className="min-w-0">
                            <strong className="text-slate-900 font-bold text-xs truncate block">
                              {store.name}
                            </strong>
                            <span className="text-[11px] text-slate-500 truncate block">
                              {store.branchName || retailer.name}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 shrink-0">
                          Priority {priorityNum}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-1">
                        <p className="truncate">📍 {store.address}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono">
                            GPS: {Number.isFinite(sLat) ? sLat.toFixed(4) : '--'}, {Number.isFinite(sLng) ? sLng.toFixed(4) : '--'}
                          </span>
                          {isInsidePoly ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                              🟢 Inside Polygon
                            </span>
                          ) : (
                            <span className="text-blue-600 font-medium">
                              ✓ Linked Hub
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 flex-wrap">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 flex-wrap">
                          <span className="font-bold text-slate-700">Delivery Radius:</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200">
                            {Number(store.deliveryRadiusKm || store.deliveryRadius || 5)} km
                          </span>
                          {Array.isArray(store.deliveryPolygon) && store.deliveryPolygon.length >= 3 && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px]">
                              ⬡ Custom Zone ({store.deliveryPolygon.length} pts)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleStartDrawingDeliveryZoneForStore(store)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            title="Draw or reshape delivery zone polygon around this store"
                          >
                            <Edit3 className="w-3 h-3 text-emerald-600" />
                            <span>Polygon Around Store</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingStore(store);
                              setEditPriority(priorityNum);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            title="Edit fulfillment priority"
                          >
                            <Sliders className="w-3 h-3 text-slate-500" />
                            <span>Priority</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveStore(sId)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-0.5 cursor-pointer"
                            title="Unlink store from this zone"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Unlink</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Clean Partner Supermarkets Assignment */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Partner Supermarkets ({stores.length})</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {activeZone ? `Link stores authorized to deliver in ${activeZone.name}.` : 'Verified supermarket hubs in Faisalabad.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuickAddModalOpen(true)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Store</span>
              </button>
              {activeZone && activeZonePolygonLatLngs.length >= 3 && (
                <button
                  type="button"
                  onClick={handleAutoLinkInside}
                  title="Automatically link all stores whose GPS points lie inside this polygon boundary"
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Auto-Link In-Zone</span>
                </button>
              )}
            </div>
          </div>

          {/* Clean 4 Supermarket Cards */}
          <div className="space-y-2.5">
            {stores.map((store) => {
              const sId = store.storeId || store._id;
              const retailer = CORE_RETAILERS.find((r) =>
                String(store.tenantId || '').toLowerCase().includes(r.id.replace('tenant-', ''))
              ) || { name: 'Supermarket', color: '#059669', logo: '🏬' };

              const isAssigned = isStoreAssigned(store);
              const currAssignment = assignments.find((a) => a.zoneId === activeZone?.zoneId && a.storeId === sId);

              // Check if store physically lies inside active polygon or within delivery radius
              const sLat = Number(store.latitude);
              const sLng = Number(store.longitude);
              const isInsidePoly = activeZonePolygonLatLngs.length >= 3 && isPointInPolygon({ lat: sLat, lng: sLng }, activeZonePolygonLatLngs);
              const storeRadius = Number(store.deliveryRadiusKm || store.deliveryRadius || 5);
              const distToZone = store.distanceToZoneCentroidKm ?? (Number.isFinite(sLat) && Number.isFinite(sLng) ? calculateDistanceKm(zoneCentroid.lat, zoneCentroid.lng, sLat, sLng) : 999);
              const isWithinDeliveryReach = isInsidePoly || (distToZone <= storeRadius);

              return (
                <div
                  key={sId}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 text-xs ${
                    isAssigned
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                      : isWithinDeliveryReach
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-50/70 border-slate-200/80 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 border shadow-2xs"
                      style={{
                        backgroundColor: `${retailer.color}15`,
                        borderColor: `${retailer.color}35`,
                        color: retailer.color
                      }}
                    >
                      {retailer.logo}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-slate-900 font-bold truncate">{store.name}</strong>
                        {activeZone && (
                          isInsidePoly ? (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-md flex items-center gap-0.5 shrink-0 border border-emerald-300">
                              <MapPin className="w-2.5 h-2.5" /> Inside Zone
                            </span>
                          ) : isWithinDeliveryReach ? (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-md shrink-0 border border-emerald-200">
                              🟢 In Range (~{distToZone.toFixed(1)} km ≤ {storeRadius} km)
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-bold rounded-md shrink-0 border border-rose-200" title={`Zone is ${distToZone.toFixed(1)} km away, exceeding store radius of ${storeRadius} km`}>
                              ⚠️ Out of Range (~{distToZone.toFixed(1)} km &gt; {storeRadius} km)
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {retailer.name} • {store.branchName || store.name} • Radius: <strong>{storeRadius} km</strong>
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {store.address}
                      </p>
                      {Array.isArray(store.deliveryPolygon) && store.deliveryPolygon.length >= 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold inline-block mt-0.5">
                          ⬡ Custom Delivery Zone ({store.deliveryPolygon.length} pts)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartDrawingDeliveryZoneForStore(store)}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                      title="Draw delivery zone polygon for this store"
                    >
                      <Edit3 className="w-3 h-3 text-emerald-600" />
                      <span>Polygon</span>
                    </button>
                    {activeZone ? (
                      isAssigned ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs">
                            <Check className="w-3 h-3" />
                            <span>Linked</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStore(store);
                              setEditPriority(currAssignment?.priority || 1);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit fulfillment priority"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStore(sId)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Unlink from zone"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {isWithinDeliveryReach ? (
                            <button
                              type="button"
                              onClick={(e) => handleAssignSingle(sId, e)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                              title={`Link store to ${activeZone.name}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Link to Zone</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (addToast) {
                                  addToast(
                                    'Cannot Assign Store ⛔',
                                    `"${store.name}" delivery radius is only ${storeRadius} km, but "${activeZone.name}" is ${distToZone.toFixed(1)} km away. Store admin must increase their delivery radius first in Delivery Zone view.`,
                                    'error'
                                  );
                                }
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title={`Zone is ${distToZone.toFixed(1)} km away (Store radius: ${storeRadius} km)`}
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>Out of Range</span>
                            </button>
                          )}
                        </div>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium italic">
                        Select zone to link
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Assignment Modal */}
      {editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Store Assignment</h3>
                  <p className="text-[11px] text-slate-400">Configure fulfillment parameters for this zone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStore(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{editingStore.name}</span>
                  <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-full font-bold text-slate-600">
                    {editingStore.city}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{editingStore.address}</p>
                <p className="text-[10px] text-emerald-700 font-semibold pt-1">
                  Target Zone: {activeZone?.name} ({activeZone?.code})
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Fulfillment Priority Level
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                >
                  <option value={1}>Priority 1 - Primary Store (Default dispatch choice for this zone)</option>
                  <option value={2}>Priority 2 - Secondary Store (Alternate fulfillment when Primary is busy)</option>
                  <option value={3}>Priority 3 - Backup Hub (Overflow dispatch only)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Higher priority stores are selected first when customers order within this zone.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const sId = editingStore.storeId || editingStore._id;
                    handleRemoveStore(sId);
                    setEditingStore(null);
                  }}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer text-xs"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Unlink Store</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStore(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAssignmentEdit}
                    disabled={isSavingEdit}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer text-xs shadow-md shadow-emerald-950/10 flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Store Branch Modal */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateQuickBranch}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Add New Store Branch</h3>
                  <p className="text-[11px] text-slate-500">
                    Add branch location to map, then outline delivery polygon around it.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Supermarket Retailer *</label>
                <select
                  value={quickBranchForm.tenantId}
                  onChange={(e) => setQuickBranchForm({ ...quickBranchForm, tenantId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {CORE_RETAILERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.logo} {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Branch / Location Name *</label>
                <input
                  type="text"
                  value={quickBranchForm.branchName}
                  onChange={(e) => setQuickBranchForm({ ...quickBranchForm, branchName: e.target.value })}
                  placeholder="e.g. Canal Road Express Hub"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={quickBranchForm.address}
                  onChange={(e) => setQuickBranchForm({ ...quickBranchForm, address: e.target.value })}
                  placeholder="e.g. East Canal Road, Faisalabad"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={quickBranchForm.latitude}
                    onChange={(e) => setQuickBranchForm({ ...quickBranchForm, latitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={quickBranchForm.longitude}
                    onChange={(e) => setQuickBranchForm({ ...quickBranchForm, longitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Retailer Delivery Coverage Radius (km)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={quickBranchForm.deliveryRadiusKm}
                  onChange={(e) => setQuickBranchForm({ ...quickBranchForm, deliveryRadiusKm: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Defines the branch delivery circle shown on the customer landing page.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsQuickAddModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Add Branch to Map</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
