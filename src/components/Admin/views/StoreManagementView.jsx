import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import {
  Store,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Phone,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Building2,
  SlidersHorizontal,
  X,
  ExternalLink,
  Check,
  Layers,
  ShieldCheck,
  Compass,
  Shield
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';
import { storeAdminApi } from '../../../services/storeAdminApi';
import { switchMapTileLayer } from '../../../utils/mapTiles';
import {
  getAllUnifiedStores,
  saveLocalCustomStore,
  removeLocalCustomStore,
  markStoreDeleted,
  CORE_RETAILERS,
  BASELINE_FIVE_STORES
} from '../../../utils/storeHelper';
import {
  PAKISTAN_CITIES,
  loadRetailerStores,
  saveRetailerStores,
  deleteRetailerStore
} from '../../../data/retailerZoneHierarchyData';
import {
  isPointInPolygon,
  getPolygonCentroidAndInsidePoint,
  normalizeLatLng
} from '../../../utils/distanceCalculator';

export const StoreManagementView = () => {
  const {
    allBranches = [],
    setAllBranches,
    tenants = [],
    storeAdmins = [],
    addToast
  } = useStore();

  const [stores, setStores] = useState(() => getAllUnifiedStores());
  // Anti-flicker: while this screen is adding/deleting, it ignores its own broadcast events,
  // and a slow/stale fetch can never overwrite a newer list.
  const suppressSyncRef = useRef(false);
  const fetchSeqRef = useRef(0);
  // Admins that exist in the database (one admin per store) + one-time credentials after creating one
  const [backendAdmins, setBackendAdmins] = useState([]);
  const [adminCreds, setAdminCreds] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRetailerFilter, setSelectedRetailerFilter] = useState('all');
  const [selectedCityFilter, setSelectedCityFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const formRef = useRef(null);

  const [zones, setZones] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    storeId: '',
    tenantId: 'tenant-alfatah',
    name: '',
    branchName: '',
    address: '',
    city: 'Faisalabad',
    latitude: 31.4125,
    longitude: 73.0995,
    contactNumber: '+92 300 1234567',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    deliveryRadiusKm: 5,
    managerEmail: '',
    managerPassword: '',
    storeImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
    status: 'active',
    operatingStatus: 'Open',
    manager: ''
  });

  // Map Picker reference in Modal
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);

  // 4 Core Retailers definition
  const CORE_RETAILERS = [
    { id: 'tenant-alfatah', name: 'Al-Fatah', color: '#991b1b', logo: '🏬' },
    { id: 'tenant-chasevalue', name: 'Chase Value', color: '#854d0e', logo: '🛒' },
    { id: 'tenant-chaseup', name: 'Chase Up', color: '#6b21a8', logo: '🏪' },
    { id: 'tenant-unimart', name: 'Unimart', color: '#0284c7', logo: '🥬' }
  ];

  // Store assignments state
  const [assignments, setAssignments] = useState([]);

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

  // Fetch stores, zones, and assignments from backend
  const fetchStoresList = async () => {
    const mySeq = ++fetchSeqRef.current;
    setIsLoading(true);
    try {
      const [res, zonesRes, assignRes] = await Promise.all([
        apiService.getStores(),
        apiService.getZones(),
        apiService.getAllAssignments()
      ]);

      if (mySeq !== fetchSeqRef.current) return; // a newer fetch/mutation already won
      const allMerged = getAllUnifiedStores(res?.stores);
      setStores(allMerged);

      if (zonesRes && zonesRes.success && Array.isArray(zonesRes.zones)) {
        setZones(zonesRes.zones);
      }
      if (assignRes && assignRes.success && Array.isArray(assignRes.assignments)) {
        setAssignments(assignRes.assignments);
      }
    } catch (e) {
      console.warn('Stores fetch error:', e.message);
      setStores(getAllUnifiedStores());
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to detect which master polygon a store point lies inside
  const getZoneContainingPoint = (lat, lng) => {
    if (!lat || !lng || !zones || zones.length === 0) return null;
    const pt = [Number(lat), Number(lng)];
    if (isNaN(pt[0]) || isNaN(pt[1])) return null;

    for (const z of zones) {
      let poly = null;
      if (z.polygon?.coordinates && Array.isArray(z.polygon.coordinates)) {
        poly = z.polygon.coordinates;
      } else if (z.geometry?.coordinates?.[0] && Array.isArray(z.geometry.coordinates[0])) {
        poly = z.geometry.coordinates[0];
      } else if (Array.isArray(z.coordinates)) {
        poly = z.coordinates;
      }
      if (poly && poly.length >= 3 && isPointInPolygon(pt, poly)) {
        return z;
      }
    }
    return null;
  };

  useEffect(() => {
    fetchStoresList();

    const handleStoresSync = () => {
      if (suppressSyncRef.current) return; // our own add/delete is in progress
      setStores(getAllUnifiedStores());
    };

    window.addEventListener('freshmart_store_deleted', handleStoresSync);
    window.addEventListener('freshmart_stores_updated', handleStoresSync);
    window.addEventListener('freshmart_branches_updated', handleStoresSync);

    return () => {
      window.removeEventListener('freshmart_store_deleted', handleStoresSync);
      window.removeEventListener('freshmart_stores_updated', handleStoresSync);
      window.removeEventListener('freshmart_branches_updated', handleStoresSync);
    };
  }, []);

  // Filtered stores
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      // Retailer filter
      if (selectedRetailerFilter !== 'all') {
        const canonical = String(store.tenantId || '').toLowerCase();
        const target = selectedRetailerFilter.toLowerCase();
        const matchesRetailer =
          canonical.includes(target.replace('tenant-', '')) ||
          (target.includes('unimart') && (canonical.includes('freshmart') || canonical.includes('unimart') || canonical.includes('company_004')));
        if (!matchesRetailer) return false;
      }

      // City filter
      if (selectedCityFilter !== 'all') {
        if (String(store.city || '').toLowerCase() !== selectedCityFilter.toLowerCase()) {
          return false;
        }
      }

      // Status filter
      if (selectedStatusFilter !== 'all') {
        const isReqActive = selectedStatusFilter === 'active';
        if (store.isActive !== isReqActive) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = String(store.name || '').toLowerCase();
        const bName = String(store.branchName || '').toLowerCase();
        const sId = String(store.storeId || store._id || '').toLowerCase();
        const addr = String(store.address || '').toLowerCase();
        if (!name.includes(q) && !bName.includes(q) && !sId.includes(q) && !addr.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [stores, selectedRetailerFilter, selectedCityFilter, selectedStatusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = stores.length;
    const active = stores.filter((s) => s.isActive).length;
    const open = stores.filter((s) => s.operatingStatus === 'Open').length;
    const inactive = total - active;
    return { total, active, open, inactive };
  }, [stores]);

  // Leaflet map initializer for Coordinate Picker Modal
  useEffect(() => {
    if ((isAddModalOpen || isEditModalOpen) && mapContainerRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id;
      }

      const initialLat = Number(formData.latitude) || 31.4125;
      const initialLng = Number(formData.longitude) || 73.0995;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: true
      });

      switchMapTileLayer(map, 'street', tileLayerRef);

      // Custom draggable pin
      const pinIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px; background: #059669; border-radius: 10px; border: 2.5px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: pinIcon,
        draggable: true
      }).addTo(map);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.lat.toFixed(6)),
          longitude: Number(pos.lng.toFixed(6))
        }));
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setFormData((prev) => ({
          ...prev,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6))
        }));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isAddModalOpen, isEditModalOpen]);

  const applyLocationPreset = (presetName, address, lat, lng) => {
    setFormData((prev) => {
      const retailer = CORE_RETAILERS.find((r) => r.id === prev.tenantId) || CORE_RETAILERS[0];
      return {
        ...prev,
        branchName: `${presetName} Branch`,
        name: `${retailer.name} - ${presetName} Branch`,
        address: address || prev.address,
        latitude: lat,
        longitude: lng
      };
    });
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  const handleCitySelectChange = (newCityName) => {
    const cityObj = PAKISTAN_CITIES.find((c) => c.name.toLowerCase() === newCityName.toLowerCase());
    const lat = cityObj ? cityObj.lat : formData.latitude;
    const lng = cityObj ? cityObj.lng : formData.longitude;
    const zoom = cityObj?.zoom || 13;

    setFormData((prev) => {
      const currentZone = zones.find((z) => (z.zoneId || z._id || z.id) === prev.assignedZoneId);
      const zoneCity = String(currentZone?.city || '').trim().toLowerCase();
      const isZoneInNewCity = currentZone && (
        zoneCity === newCityName.toLowerCase() ||
        String(currentZone.name || '').toLowerCase().includes(newCityName.toLowerCase())
      );

      return {
        ...prev,
        city: newCityName,
        latitude: lat,
        longitude: lng,
        assignedZoneId: isZoneInNewCity ? prev.assignedZoneId : ''
      };
    });

    if (mapInstanceRef.current && cityObj) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
    if (markerRef.current && cityObj) {
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  // Handlers
  const handleOpenAdd = () => {
    setFormError(null);
    const tId = selectedRetailerFilter !== 'all' ? selectedRetailerFilter : 'tenant-unimart';
    const retailer = CORE_RETAILERS.find((r) => r.id === tId) || CORE_RETAILERS[0];
    const timestamp = Date.now().toString().slice(-4);
    const initialBranch = `Commercial Hub ${timestamp}`;
    setFormData({
      storeId: `STR-${tId.replace('tenant-', '').substring(0, 3).toUpperCase()}-${timestamp}`,
      tenantId: tId,
      name: `${retailer.name} - ${initialBranch}`,
      branchName: initialBranch,
      address: 'Main Commercial Avenue, Faisalabad',
      city: 'Faisalabad',
      latitude: 31.4125,
      longitude: 73.0995,
      contactNumber: '+92 300 8441122',
      openingHours: '08:00 AM',
      closingHours: '11:00 PM',
      deliveryRadiusKm: 5,
      managerEmail: '',
      managerPassword: '',
      storeImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      operatingStatus: 'Open',
      manager: '',
      assignedZoneId: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (store) => {
    setSelectedStore(store);
    setFormError(null);
    const sId = store.storeId || store._id;
    let existingZoneId = store.assignedZoneId || '';
    if (!existingZoneId && Array.isArray(assignments)) {
      const match = assignments.find((a) => a.storeId === sId && a.isActive !== false);
      if (match) existingZoneId = match.zoneId;
    }
    setFormData({
      storeId: sId,
      tenantId: store.tenantId || 'tenant-unimart',
      name: store.name || '',
      branchName: store.branchName || store.name || '',
      address: store.address || '',
      city: store.city || 'Faisalabad',
      latitude: Number(store.latitude || 31.4125),
      longitude: Number(store.longitude || 73.0995),
      contactNumber: store.contactNumber || store.phone || '+92 300 1234567',
      openingHours: store.openingHours || '08:00 AM',
      closingHours: store.closingHours || '11:00 PM',
      deliveryRadiusKm: Number(store.deliveryRadiusKm || store.deliveryRadius || 5),
      managerEmail: store.managerEmail || '',
      managerPassword: '',
      storeImage: store.storeImage || store.banner || '',
      status: store.status || (store.isActive ? 'active' : 'inactive'),
      operatingStatus: store.operatingStatus || 'Open',
      manager: store.manager || '',
      assignedZoneId: existingZoneId
    });
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    let cancelled = false;
    storeAdminApi
      .list()
      .then((r) => {
        if (cancelled || !r?.success) return;
        setBackendAdmins(
          r.stores.filter((x) => x.admin).map((x) => ({ branchId: x.storeId, branchName: x.branchName, name: x.admin.name, username: x.admin.username }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [stores.length, adminCreds]);

  const detectedZone = useMemo(() => {
    return getZoneContainingPoint(formData.latitude, formData.longitude);
  }, [formData.latitude, formData.longitude, zones]);

  // Only display delivery polygons that belong to the store's selected city and are available/active
  const availableCityZones = useMemo(() => {
    if (!Array.isArray(zones) || zones.length === 0) return [];
    const targetCity = String(formData.city || 'Faisalabad').trim().toLowerCase();

    return zones.filter((z) => {
      // Check if zone is active/available
      const isAvailable = z.isActive !== false && String(z.status || 'active').toLowerCase() !== 'inactive';
      if (!isAvailable) return false;

      // Check city match
      const zCity = String(z.city || '').trim().toLowerCase();
      const zName = String(z.name || '').toLowerCase();
      const zArea = String(z.area || '').toLowerCase();

      // If zone explicitly belongs to a different city and does not mention targetCity, reject it
      if (zCity && zCity !== targetCity && !zName.includes(targetCity)) {
        return false;
      }

      // Zone must match the selected city
      const matchesCity = (zCity && zCity === targetCity) || zName.includes(targetCity) || zArea.includes(targetCity);
      if (!matchesCity) return false;

      return true;
    });
  }, [zones, formData.city]);

  const handleSaveStore = async (e) => {
    if (e) e.preventDefault();
    setFormError(null);

    const canonicalTenant = formData.tenantId || 'tenant-unimart';
    const retailerObj = CORE_RETAILERS.find((r) => r.id === canonicalTenant) || CORE_RETAILERS[0];
    const timestamp = Date.now().toString().slice(-4);

    const branchVal = String(formData.branchName || '').trim() || `Commercial Hub ${timestamp}`;
    const nameVal = String(formData.name || '').trim() || `${retailerObj.name} - ${branchVal}`;
    const addressVal = String(formData.address || '').trim() || `Main Commercial Avenue, ${formData.city || 'Faisalabad'}, Pakistan`;
    const cityVal = String(formData.city || '').trim() || 'Faisalabad';

    let latVal = (Number.isFinite(Number(formData.latitude)) && !isNaN(Number(formData.latitude))) ? Number(formData.latitude) : 31.4125;
    let lngVal = (Number.isFinite(Number(formData.longitude)) && !isNaN(Number(formData.longitude))) ? Number(formData.longitude) : 73.0995;

    // Ensure store coordinates strictly lie inside the assigned polygon
    if (formData.assignedZoneId) {
      const targetZone = zones.find((z) => (z.zoneId || z._id || z.id) === formData.assignedZoneId);
      if (targetZone) {
        const polyCoords = targetZone.polygon?.coordinates || targetZone.geometry?.coordinates?.[0] || targetZone.coordinates;
        const currentPt = [latVal, lngVal];
        const isInside = polyCoords && isPointInPolygon(currentPt, polyCoords);
        if (!isInside) {
          if (polyCoords && polyCoords.length >= 3) {
            const insidePt = getPolygonCentroidAndInsidePoint(polyCoords);
            if (insidePt) {
              latVal = insidePt[0];
              lngVal = insidePt[1];
            }
          } else if (targetZone.center) {
            const c = normalizeLatLng(targetZone.center);
            if (c) {
              latVal = c.lat;
              lngVal = c.lng;
            }
          }
        }
      }
    }

    suppressSyncRef.current = true;
    fetchSeqRef.current++;
    setIsSubmitting(true);
    try {
      const sId = formData.storeId || `STR-${canonicalTenant.replace('tenant-', '').substring(0, 3).toUpperCase()}-${timestamp}`;

      const storeRecord = {
        _id: sId,
        storeId: sId,
        storeCode: sId,
        storeName: nameVal,
        tenantId: canonicalTenant,
        tenantName: retailerObj.name,
        parentRetailerId: canonicalTenant,
        parentRetailerName: retailerObj.name,
        type: 'child',
        name: nameVal,
        branchName: branchVal,
        address: addressVal,
        city: cityVal,
        latitude: latVal,
        longitude: lngVal,
        location: {
          type: 'Point',
          coordinates: [lngVal, latVal]
        },
        contactNumber: formData.contactNumber || '+92 300 0000000',
        phone: formData.contactNumber || '+92 300 0000000',
        email: formData.managerEmail || '',
        openingHours: formData.openingHours || '08:00 AM',
        closingHours: formData.closingHours || '11:00 PM',
        storeImage: formData.storeImage || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
        status: formData.status || 'active',
        isActive: String(formData.status || 'active').toLowerCase() === 'active',
        operatingStatus: formData.operatingStatus || 'Open',
        manager: formData.manager || `${retailerObj.name} Manager`,
        branchManager: formData.manager || `${retailerObj.name} Manager`,
        deliveryRadiusKm: Number(formData.deliveryRadiusKm || 5),
        assignedZoneId: formData.assignedZoneId || null,
        deliveryZoneId: formData.assignedZoneId || null,
        assignmentStatus: formData.assignedZoneId ? 'active' : 'unassigned'
      };

      if (isEditModalOpen && selectedStore) {
        const id = selectedStore.storeId || selectedStore._id;
        try {
          await apiService.updateStore(id, { ...formData, assignedZoneId: formData.assignedZoneId || null });
          if (formData.assignedZoneId) {
            await apiService.assignStoresToZone(formData.assignedZoneId, [id]);
          }
        } catch (apiErr) {
          console.warn('Backend updateStore offline/fallback:', apiErr.message);
        }

        saveLocalCustomStore({ ...storeRecord, storeId: id, _id: id });
        try {
          const currentRetailerStores = loadRetailerStores();
          const mergedStores = currentRetailerStores.map((s) =>
            (s.storeId || s._id) === id
              ? {
                  ...s,
                  ...storeRecord,
                  deliveryZoneId: storeRecord.deliveryZoneId || storeRecord.assignedZoneId || null,
                  assignmentStatus: (storeRecord.deliveryZoneId || storeRecord.assignedZoneId) ? 'active' : 'unassigned'
                }
              : s
          );
          saveRetailerStores(mergedStores);
        } catch (e) {}
        setStores((prev) =>
          prev.map((s) => ((s.storeId || s._id) === id ? { ...s, ...storeRecord } : s))
        );

        if (addToast) addToast('Store Updated ✨', `Store "${nameVal}" updated successfully.`, 'success');
        setIsEditModalOpen(false);
      } else {
        // Create new store - initial registration is unassigned unless explicitly chosen
        const chosenZone = formData.assignedZoneId ? String(formData.assignedZoneId).trim() : null;
        storeRecord.assignedZoneId = chosenZone;
        storeRecord.deliveryZoneId = chosenZone;
        storeRecord.assignmentStatus = chosenZone ? 'active' : 'unassigned';

        let serverCreated = null;
        try {
          const res = await apiService.createStore({ ...storeRecord, assignedZoneId: chosenZone });
          if (res && res.success && res.store) {
            serverCreated = res.store;
          }
          const finalId = serverCreated?.storeId || storeRecord.storeId;
          if (chosenZone) {
            await apiService.assignStoresToZone(chosenZone, [finalId]);
          }
          await apiService.createBranch({
            _id: finalId,
            id: finalId,
            tenantId: storeRecord.tenantId,
            code: `BR-${Date.now().toString().slice(-4)}`,
            name: storeRecord.name,
            branchName: storeRecord.branchName,
            address: storeRecord.address,
            city: storeRecord.city,
            latitude: Number(storeRecord.latitude),
            longitude: Number(storeRecord.longitude),
            deliveryRadius: Number(storeRecord.deliveryRadiusKm || 5),
            status: 'active'
          });
          // Every store gets its own admin. Credentials are shown ONCE in the dialog below.
          const adminRes = await storeAdminApi.create(finalId);
          if (adminRes?.success) setAdminCreds(adminRes.credentials);
        } catch (apiErr) {
          console.warn('Backend createStore offline/fallback:', apiErr.message);
        }

        const finalStore = {
          ...(serverCreated || storeRecord),
          assignedZoneId: chosenZone,
          deliveryZoneId: chosenZone,
          assignmentStatus: chosenZone ? 'active' : 'unassigned'
        };
        saveLocalCustomStore(finalStore);
        try {
          const currentRetailerStores = loadRetailerStores();
          const sId = finalStore.storeId || finalStore._id;
          const mergedStores = [
            ...currentRetailerStores.filter((s) => (s.storeId || s._id) !== sId),
            {
              ...finalStore,
              deliveryZoneId: chosenZone,
              assignedZoneId: chosenZone,
              assignmentStatus: chosenZone ? 'active' : 'unassigned'
            }
          ];
          saveRetailerStores(mergedStores);
        } catch (e) {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('freshmart_stores_updated'));
        }

        setStores((prev) => {
          const copy = Array.isArray(prev) ? [...prev] : [];
          const exists = copy.some(
            (s) => (s.storeId || s._id) === (finalStore.storeId || finalStore._id)
          );
          if (exists) {
            return copy.map((s) =>
              (s.storeId || s._id) === (finalStore.storeId || finalStore._id) ? finalStore : s
            );
          }
          return [finalStore, ...copy];
        });

        if (addToast) {
          addToast(
            'Store Branch Added 🎉',
            `Store "${nameVal}" created successfully with authentic GPS coordinates!`,
            'success'
          );
        }
        setIsAddModalOpen(false);
      }
    } catch (err) {
      setFormError(err.message || 'Error occurred while saving store.');
      if (addToast) addToast('Save Error', err.message, 'error');
    } finally {
      setTimeout(() => { suppressSyncRef.current = false; }, 0);
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (store) => {
    const currentActive = store.isActive !== false && String(store.status).toLowerCase() === 'active';
    const newStatus = currentActive ? 'inactive' : 'active';
    try {
      const id = store.storeId || store._id;
      const res = await apiService.toggleStoreStatus(id, newStatus);
      if (res && res.success) {
        if (addToast) addToast(`Store status set to ${newStatus}.`, 'success');
        setStores((prev) =>
          prev.map((s) => (s.storeId === id || s._id === id ? { ...s, status: newStatus, isActive: !currentActive } : s))
        );
      }
    } catch (e) {
      if (addToast) addToast(e.message, 'error');
    }
  };

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;
    const ids = [
      storeToDelete.storeId,
      storeToDelete._id,
      storeToDelete.branchId,
      storeToDelete.id,
      storeToDelete.storeCode,
      storeToDelete.code
    ].filter(Boolean);
    const primaryId = storeToDelete.storeId || storeToDelete._id || ids[0];

    suppressSyncRef.current = true;
    fetchSeqRef.current++; // cancel any in-flight fetch that still has the old list
    try {
      // 1. Permanently blacklist across local caches & storage
      markStoreDeleted(primaryId, ids);
      deleteRetailerStore(primaryId);

      // 2. Call backend permanent delete endpoints
      try {
        await apiService.deleteStore(primaryId);
      } catch (apiErr) {
        console.warn('Backend deleteStore fallback:', apiErr.message);
      }
      try {
        await apiService.deleteBranch(primaryId);
      } catch (brErr) {}

      // 3. Match and filter locally
      const idMatch = (s) => {
        const sIds = [s.storeId, s._id, s.branchId, s.id, s.storeCode, s.code]
          .filter(Boolean)
          .map((x) => String(x).toLowerCase().trim());
        return ids.some((delId) => sIds.includes(String(delId).toLowerCase().trim()));
      };

      setStores((prev) => prev.filter((s) => !idMatch(s)));
      if (setAllBranches) {
        setAllBranches((prev) => prev.filter((b) => !idMatch(b)));
      }
      setStoreToDelete(null);
      if (isViewModalOpen) setIsViewModalOpen(false);

      // 4. Dispatch global events
      window.dispatchEvent(new CustomEvent('freshmart_store_deleted', { detail: { storeId: primaryId, allDeletedIds: ids } }));
      window.dispatchEvent(new CustomEvent('freshmart_stores_updated', { detail: { storeId: primaryId, deleted: true } }));
      window.dispatchEvent(new CustomEvent('freshmart_branches_updated'));

      if (addToast) addToast('Store Permanently Deleted 🗑️', `Branch "${storeToDelete.name}" was permanently removed from database and dashboard.`, 'success');
    } catch (e) {
      markStoreDeleted(primaryId, ids);
      deleteRetailerStore(primaryId);
      setStores((prev) => prev.filter((s) => s.storeId !== primaryId && s._id !== primaryId));
      if (setAllBranches) {
        setAllBranches((prev) => prev.filter((b) => (b.id || b._id) !== primaryId && b.storeId !== primaryId));
      }
      setStoreToDelete(null);
      if (isViewModalOpen) setIsViewModalOpen(false);
      if (addToast) addToast('Store Removed 🗑️', `Branch "${storeToDelete.name}" removed.`, 'info');
    } finally {
      // release after the synchronous events above have fired
      setTimeout(() => { suppressSyncRef.current = false; }, 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <span>Store Management</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage physical supermarket branches, dark stores, GPS coordinates, operating hours, and active statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/10 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Store Branch</span>
          </button>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Total Physical Stores</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Across all 4 retail partners</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Active Stores</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.active}</span>
          <span className="text-[10px] text-emerald-600/80 mt-1 block">Ready for fulfillment</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Currently Open</span>
          <span className="text-2xl font-black text-sky-600 mt-1 block">{stats.open}</span>
          <span className="text-[10px] text-sky-600/80 mt-1 block">Within operating hours</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Inactive Stores</span>
          <span className="text-2xl font-black text-rose-500 mt-1 block">{stats.inactive}</span>
          <span className="text-[10px] text-rose-400 mt-1 block">Maintenance or paused</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search store name, ID, or address..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Retailer Filter */}
          <select
            value={selectedRetailerFilter}
            onChange={(e) => setSelectedRetailerFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-medium text-slate-700"
          >
            <option value="all">All Retailers</option>
            {CORE_RETAILERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={selectedCityFilter}
            onChange={(e) => setSelectedCityFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-medium text-slate-700"
          >
            <option value="all">All Cities</option>
            <option value="faisalabad">Faisalabad</option>
            <option value="lahore">Lahore</option>
            <option value="karachi">Karachi</option>
            <option value="islamabad">Islamabad</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Stores Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Store / Branch</th>
                <th className="py-3 px-4">Retailer</th>
                <th className="py-3 px-4">City & Coordinates</th>
                <th className="py-3 px-4">Operating Hours</th>
                <th className="py-3 px-4">Operating Status</th>
                <th className="py-3 px-4">Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                        <Store className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">No Stores Created Yet</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Stores are not created automatically. Create your grocery stores (e.g. <b>Store A – D-Ground</b>, <b>Store B – People's Colony</b>, <b>Store C – Susan Road</b>), and then assign irregular polygon delivery boundaries to them.
                        </p>
                      </div>
                      <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/10 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Create Your First Store</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => {
                  const sId = store.storeId || store._id;
                  const isActive = store.isActive !== false && String(store.status).toLowerCase() === 'active';
                  const retailer = CORE_RETAILERS.find(
                    (r) =>
                      String(store.tenantId || '').toLowerCase().includes(r.id.replace('tenant-', '')) ||
                      (r.id === 'tenant-unimart' && (String(store.tenantId || '').includes('freshmart') || String(store.tenantId || '').includes('unimart')))
                  ) || { name: store.tenantName || 'Retailer', color: '#059669', logo: '🏬' };

                  return (
                    <tr key={sId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={store.storeImage || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=120&q=80'}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">{store.name}</p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono truncate">
                                ID: {sId} • {store.branchName}
                              </span>
                              {(() => {
                                const matchedAdmin = [...(storeAdmins || []), ...backendAdmins].find((a) =>
                                  (a.branchId && (a.branchId === sId || a.branchId === store._id)) ||
                                  (a.branchName && (a.branchName.toLowerCase() === (store.branchName || store.name || '').toLowerCase()))
                                );
                                if (matchedAdmin) {
                                  return (
                                    <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                      🛡️ Admin: {matchedAdmin.name}
                                    </span>
                                  );
                                }
                                return (
                                  <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-full">
                                    ⚠️ No Admin Allocated
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                          style={{
                            backgroundColor: `${retailer.color}10`,
                            borderColor: `${retailer.color}30`,
                            color: retailer.color
                          }}
                        >
                          <span>{retailer.logo}</span>
                          <span>{retailer.name}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] font-medium text-slate-700">
                          <p className="font-semibold text-slate-900">{store.city || 'Faisalabad'}</p>
                          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            {Number(store.latitude).toFixed(4)}, {Number(store.longitude).toFixed(4)}
                          </p>
                          {(() => {
                            const matchedZ = getZoneContainingPoint(store.latitude, store.longitude);
                            return matchedZ ? (
                              <span className="inline-block mt-1 text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                📍 In: {matchedZ.code}
                              </span>
                            ) : (
                              <span className="inline-block mt-1 text-[9px] font-medium text-slate-400">
                                🛵 {store.deliveryRadiusKm || 5} km Radius
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {store.openingHours || '08:00 AM'} - {store.closingHours || '11:00 PM'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            store.operatingStatus === 'Open'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : store.operatingStatus === 'Busy'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              store.operatingStatus === 'Open'
                                ? 'bg-emerald-500 animate-pulse'
                                : store.operatingStatus === 'Busy'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          ></span>
                          <span>{store.operatingStatus || 'Open'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(store)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedStore(store);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                            title="View Store"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(store)}
                            className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-500 hover:text-emerald-700 transition cursor-pointer"
                            title="Edit Store"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setStoreToDelete(store)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Store"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Store Modal with Leaflet GPS Coordinates Picker */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveStore}
            noValidate
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isEditModalOpen ? `Edit Store: ${selectedStore?.name}` : 'Add New Store Branch'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Save authentic geographical coordinates and link to supermarket retailer.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Scrollable Fields Body */}
            <div
              ref={formRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Supermarket Retailer *</label>
                  <select
                    value={formData.tenantId}
                    onChange={(e) => {
                      const newTId = e.target.value;
                      const rObj = CORE_RETAILERS.find((r) => r.id === newTId);
                      setFormData((prev) => ({
                        ...prev,
                        tenantId: newTId,
                        storeId: prev.storeId?.startsWith('STR-') ? `STR-${newTId.replace('tenant-', '').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}` : prev.storeId,
                        name: prev.name?.includes('-') ? `${rObj?.name || 'Store'} - ${prev.branchName || 'Branch'}` : prev.name
                      }));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 font-medium cursor-pointer"
                  >
                    {CORE_RETAILERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.logo} {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Unique Store ID *</label>
                  <input
                    type="text"
                    value={formData.storeId}
                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                    required
                    placeholder="e.g. STR-AF-01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Store Display Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Al-Fatah - D-Ground Flagship Hub"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Branch / Location Name *</label>
                  <input
                    type="text"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    required
                    placeholder="e.g. D-Ground Flagship"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Physical Street Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="e.g. Peoples Colony 1, D-Ground, Faisalabad"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City Location * (Dynamic Map Pan)</label>
                  <select
                    value={formData.city}
                    onChange={(e) => handleCitySelectChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 font-bold cursor-pointer"
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        📍 {c.name} {c.name === 'Faisalabad' ? '(Primary Hub)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interactive Leaflet Map Coordinates Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Exact Store Geographical Coordinates (Interactive Leaflet Map)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Click map or drag pin to position</span>
                </div>

                {/* Quick Faisalabad Location Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Locations:</span>
                  {[
                    { label: '📍 D-Ground', name: 'D-Ground', address: 'D-Ground Commercial Area, Peoples Colony 1, Faisalabad', lat: 31.4125, lng: 73.0830 },
                    { label: '📍 People\'s Colony', name: 'People\'s Colony', address: 'Main Commercial Avenue, People\'s Colony, Faisalabad', lat: 31.4150, lng: 73.0995 },
                    { label: '📍 Susan Road', name: 'Susan Road', address: 'Susan Road, Madina Town, Faisalabad', lat: 31.4280, lng: 73.1200 },
                    { label: '📍 Samanabad', name: 'Samanabad', address: 'Main Samanabad Road, Near Roundabout, Faisalabad', lat: 31.3920, lng: 73.0650 },
                    { label: '📍 Kohinoor City', name: 'Kohinoor City', address: 'Jaranwala Road, Near Kohinoor City, Faisalabad', lat: 31.4055, lng: 73.1190 },
                  ].map((loc) => (
                    <button
                      key={loc.label}
                      type="button"
                      onClick={() => applyLocationPreset(loc.name, loc.address, loc.lat, loc.lng)}
                      className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 rounded-md text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>

                <div
                  ref={mapContainerRef}
                  className="w-full h-48 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner"
                  style={{ minHeight: '190px' }}
                ></div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.latitude}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({ ...formData, latitude: val });
                        if (markerRef.current && !isNaN(val) && Number.isFinite(val)) {
                          markerRef.current.setLatLng([val, formData.longitude]);
                          if (mapInstanceRef.current) mapInstanceRef.current.panTo([val, formData.longitude]);
                        }
                      }}
                      required
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.longitude}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({ ...formData, longitude: val });
                        if (markerRef.current && !isNaN(val) && Number.isFinite(val)) {
                          markerRef.current.setLatLng([formData.latitude, val]);
                          if (mapInstanceRef.current) mapInstanceRef.current.panTo([formData.latitude, val]);
                        }
                      }}
                      required
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Master Polygon Detection */}
                <div className={`mt-2.5 p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                  detectedZone ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Lies In Master Polygon:</span>
                  </div>
                  <div className="font-extrabold flex items-center gap-1.5">
                    {detectedZone ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-emerald-800">✅ {detectedZone.name} ({detectedZone.code})</span>
                      </>
                    ) : (
                      <span className="text-slate-500 font-semibold">📍 Outside defined master polygons</span>
                    )}
                  </div>
                </div>

                {/* Retailer Delivery Zone Configuration */}
                <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <span>🛵 Retailer Delivery Zone (Store Coverage Radius)</span>
                    </label>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {formData.deliveryRadiusKm || 5} km Delivery Radius
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Store Delivery Radius (km)</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.deliveryRadiusKm || 5}
                        onChange={(e) => setFormData({ ...formData, deliveryRadiusKm: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Store Admin Email / Username</label>
                      <input
                        type="text"
                        placeholder="e.g. manager@alfatah.pk"
                        value={formData.managerEmail || ''}
                        onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Area Polygon Assignment */}
                <div className="mt-2.5 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Assign Delivery Area (Polygon)</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      {availableCityZones.length} Available in {formData.city || 'City'}
                    </span>
                  </div>
                  <select
                    value={formData.assignedZoneId || ''}
                    onChange={(e) => {
                      const selectedZId = e.target.value;
                      let updatedCoords = {};
                      if (selectedZId) {
                        const targetZone = zones.find((z) => (z.zoneId || z._id || z.id) === selectedZId);
                        if (targetZone) {
                          const polyCoords = targetZone.polygon?.coordinates || targetZone.geometry?.coordinates?.[0] || targetZone.coordinates;
                          const currentPt = [Number(formData.latitude), Number(formData.longitude)];
                          const isInside = !isNaN(currentPt[0]) && !isNaN(currentPt[1]) && polyCoords && isPointInPolygon(currentPt, polyCoords);
                          if (!isInside) {
                            if (polyCoords && polyCoords.length >= 3) {
                              const insidePt = getPolygonCentroidAndInsidePoint(polyCoords);
                              if (insidePt) {
                                updatedCoords = { latitude: insidePt[0], longitude: insidePt[1] };
                              }
                            } else if (targetZone.center) {
                              const c = normalizeLatLng(targetZone.center);
                              if (c) {
                                updatedCoords = { latitude: c.lat, longitude: c.lng };
                              }
                            }
                          }
                        }
                      }
                      setFormData({ ...formData, assignedZoneId: selectedZId, ...updatedCoords });
                    }}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                  >
                    <option value="">-- No Polygon Zone Assigned (Assign Later or in Zone Management) --</option>
                    {availableCityZones.map((z) => (
                      <option key={z.zoneId || z._id || z.id} value={z.zoneId || z._id || z.id}>
                        {z.name} {z.code ? `(${z.code})` : ''} - {z.city || formData.city} [{z.isActive !== false && z.status !== 'inactive' ? 'Active' : 'Inactive'}]
                      </option>
                    ))}
                  </select>
                  {availableCityZones.length === 0 ? (
                    <p className="text-[10px] text-amber-700 font-medium leading-tight">
                      📍 No delivery polygon zones available for <strong>{formData.city}</strong>. You can save this store as unassigned and draw its boundary anytime in Retailer Delivery Zones.
                    </p>
                  ) : (
                    <p className="text-[10px] text-emerald-700/90 leading-tight">
                      A polygon is not a circle. Each store has its own delivery area drawn on the map by the admin.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Opening Time</label>
                  <input
                    type="text"
                    value={formData.openingHours}
                    onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                    placeholder="08:00 AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Closing Time</label>
                  <input
                    type="text"
                    value={formData.closingHours}
                    onChange={(e) => setFormData({ ...formData, closingHours: e.target.value })}
                    placeholder="11:00 PM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Store Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Operating Status</label>
                  <select
                    value={formData.operatingStatus}
                    onChange={(e) => setFormData({ ...formData, operatingStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Busy">Busy</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Store Image URL</label>
                  <input
                    type="text"
                    value={formData.storeImage}
                    onChange={(e) => setFormData({ ...formData, storeImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden text-slate-600"
                  />
                </div>
              </div>

            </div>

            {/* In-Modal Inline Error Alert Banner */}
            {formError && (
              <div className="mx-5 my-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Sticky Modal Action Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
                {detectedZone ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>In Master Polygon: {detectedZone.name}</span>
                  </span>
                ) : (
                  <span className="text-slate-400">📍 Position store pin on map</span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStore}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition shadow-md shadow-emerald-950/10 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Store...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isEditModalOpen ? 'Save Changes' : 'Create Store'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Store Branch?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">{storeToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                onClick={() => setStoreToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStore}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Delete Store
              </button>
            </div>
          </div>
        </div>
      )}

      {adminCreds && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-black text-slate-900">Store admin created</h3>
            <p className="text-xs text-slate-600">
              Give these details to the admin of <b>{adminCreds.branchName}</b>. The password is shown only once.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono space-y-1 select-all">
              <div>Branch: {adminCreds.branchName}</div>
              <div>Username: {adminCreds.username}</div>
              <div>Password: {adminCreds.password}</div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200"
                onClick={() => navigator.clipboard?.writeText(`Branch: ${adminCreds.branchName}\nUsername: ${adminCreds.username}\nPassword: ${adminCreds.password}`)}
              >
                Copy
              </button>
              <button
                type="button"
                className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => setAdminCreds(null)}
              >
                I saved it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store / Branch Specification & Details View Modal (Eye Icon) */}
      {isViewModalOpen && selectedStore && (() => {
        const sId = selectedStore.storeCode || selectedStore.code || selectedStore.storeId || selectedStore._id;
        const retailer = CORE_RETAILERS.find(
          (r) =>
            String(selectedStore.tenantId || '').toLowerCase().includes(r.id.replace('tenant-', '')) ||
            String(selectedStore.tenantName || '').toLowerCase().includes(r.name.toLowerCase()) ||
            String(selectedStore.name || '').toLowerCase().includes(r.name.toLowerCase())
        ) || CORE_RETAILERS[0];

        const matchedAdmin = [...(storeAdmins || []), ...backendAdmins].find((a) =>
          (a.branchId && (a.branchId === sId || a.branchId === selectedStore._id || a.branchId === selectedStore.storeId)) ||
          (a.branchName && (a.branchName.toLowerCase() === (selectedStore.branchName || selectedStore.name || '').toLowerCase()))
        );

        const matchedZone = getZoneContainingPoint(selectedStore.latitude, selectedStore.longitude) ||
          zones.find((z) => z.id === selectedStore.assignedZoneId || z.zoneId === selectedStore.assignedZoneId || z._id === selectedStore.assignedZoneId);

        const isActive = selectedStore.isActive !== false && String(selectedStore.status).toLowerCase() === 'active';
        const latVal = Number(selectedStore.latitude || 31.4125);
        const lngVal = Number(selectedStore.longitude || 73.0995);
        const domain = retailer.domain || 'supermarket.pk';
        const cleanSlug = String(sId).replace(/^(branch_|STR-)/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const hasAdmin = Boolean(matchedAdmin || selectedStore.managerEmail || selectedStore.manager);
        const adminEmail = matchedAdmin?.email || matchedAdmin?.username || selectedStore.managerEmail || '';
        const adminName = matchedAdmin?.name || selectedStore.manager || '';
        const adminPhone = matchedAdmin?.phone || selectedStore.contactNumber || selectedStore.phone || '';

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                          Child Store • Branch Level 2
                        </span>
                        <span className="text-slate-400 text-xs font-mono">
                          ID: {sId}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white mt-1">
                        {selectedStore.name || selectedStore.storeName}
                      </h3>
                      <p className="text-xs text-slate-300">
                        Physical supermarket branch operational profile, GPS pin, zone mapping & dedicated admin.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* 1. ARCHITECTURE & HIERARCHY BANNER */}
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Two-Level Platform Hierarchy Classification
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                      Verified Child Branch
                    </span>
                  </div>
                  
                  {/* Visual tree: Parent Retailer -> Child Branch */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Level 1: Master Retailer Chain
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xl">{retailer.logo}</span>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{retailer.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Retailer Code: {selectedStore.tenantId || retailer.id}
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                        Parent entity holding company contracts, catalog pricing, and brand credentials.
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-100/60 rounded-xl border border-emerald-300 shadow-2xs">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Level 2: Child Store / Physical Branch
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xl">🏢</span>
                        <div>
                          <div className="font-bold text-emerald-950 text-xs">
                            {selectedStore.branchName || selectedStore.name}
                          </div>
                          <div className="text-[10px] font-mono text-emerald-800">
                            Store Code: {sId}
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-800 mt-2 leading-relaxed">
                        Physical store unit with independent map coordinates, delivery dispatch, and order fulfillment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. OPERATIONAL STATUS & ATTRIBUTES */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Operating Status
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 font-bold text-xs text-slate-800">
                      <span className={`w-2 h-2 rounded-full ${
                        selectedStore.operatingStatus === 'Open' ? 'bg-emerald-500 animate-pulse' :
                        selectedStore.operatingStatus === 'Busy' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />
                      <span>{selectedStore.operatingStatus || 'Open'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Storefront Active
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 font-bold text-xs text-slate-800">
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-rose-600">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Operating Hours
                    </span>
                    <div className="flex items-center gap-1 mt-1 font-bold text-xs text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedStore.openingHours || '08:00 AM'} - {selectedStore.closingHours || '11:00 PM'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Express SLA
                    </span>
                    <div className="flex items-center gap-1 mt-1 font-bold text-xs text-slate-800">
                      <span>🛵 30 – 45 Min SLA</span>
                    </div>
                  </div>
                </div>

                {/* 3. PHYSICAL ADDRESS & GEOGRAPHICAL GPS COORDINATES */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      Physical Address & Precise GPS Map Location
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${latVal},${lngVal}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in Google Maps
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Street Address & Hub
                      </div>
                      <p className="text-xs font-semibold text-slate-900 mt-1">
                        {selectedStore.address || 'Main Commercial Avenue, Faisalabad, Pakistan'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md font-bold text-slate-700">
                          {selectedStore.city || 'Faisalabad'}
                        </span>
                        <span>• Registered Commercial Outpost</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        GPS Coordinates
                      </div>
                      <div className="mt-1 font-mono text-xs font-bold text-slate-800 space-y-0.5">
                        <div>Lat: {latVal.toFixed(6)}</div>
                        <div>Lng: {lngVal.toFixed(6)}</div>
                      </div>
                      <div className="mt-2 text-[10px] font-semibold text-emerald-700">
                        📍 Pin Verified on Master Grid
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. RETAILER DELIVERY ZONE ASSOCIATION */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-teal-600" />
                      Delivery Polygon & Territory Association
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Module 1 GIS Association
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                    {matchedZone ? (
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-bold">
                              Assigned Polygon: {matchedZone.code || matchedZone.id}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {matchedZone.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                            Customer orders placed by shoppers located within this irregular polygon boundary will be routed to this store branch.
                          </p>
                        </div>
                        <span className="shrink-0 text-xl">📍</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-md text-[10px] font-bold">
                            Standalone Branch (5 km Default Radius)
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1">
                            This branch operates with a standard {selectedStore.deliveryRadiusKm || 5} km radius. You can associate it with a master polygon on the Retailer Delivery Zones page anytime.
                          </p>
                        </div>
                        <span className="shrink-0 text-amber-500 font-bold text-xs">
                          {selectedStore.deliveryRadiusKm || 5} km Radius
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. DEDICATED STORE ADMIN CREDENTIALS */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-600" />
                      Dedicated Branch Admin Account
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      hasAdmin
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                      {hasAdmin ? '✓ Admin Active' : '⚠️ No Admin Assigned'}
                    </span>
                  </div>

                  {hasAdmin ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Admin Officer
                        </span>
                        <div className="font-bold text-xs text-slate-900 mt-1">
                          {adminName || 'Assigned Manager'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Role: Dedicated Mart Admin
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Login Username / Email
                        </span>
                        <div className="font-bold text-xs text-slate-900 mt-1 font-mono truncate" title={adminEmail}>
                          {adminEmail || 'Not configured'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Domain: {domain}
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Direct Phone Contact
                        </span>
                        <div className="font-bold text-xs text-slate-900 mt-1 font-mono">
                          {adminPhone || selectedStore.phone || 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Branch Operations Line
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-xs text-amber-900">
                          No Dedicated Branch Admin Assigned
                        </div>
                        <div className="text-[11px] text-amber-700 mt-0.5">
                          No login credentials have been created for this physical branch yet. You can add an admin in Super Admin dashboard.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsStoreDetailsOpen(false);
                          if (navigateTo) navigateTo('superadmin', { tab: 'admins' });
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition cursor-pointer"
                      >
                        + Add Branch Admin
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setStoreToDelete(selectedStore);
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Branch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenEdit(selectedStore);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/10"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Branch</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
