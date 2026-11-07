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
  RefreshCw,
  Building2,
  SlidersHorizontal,
  X,
  ExternalLink,
  Check
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';
import { switchMapTileLayer } from '../../../utils/mapTiles';

export const StoreManagementView = () => {
  const {
    allBranches = [],
    setAllBranches,
    tenants = [],
    addToast
  } = useStore();

  const [stores, setStores] = useState([]);
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

  // Fetch stores and master polygons from backend
  const fetchStoresList = async () => {
    setIsLoading(true);
    try {
      const [res, zonesRes] = await Promise.all([
        apiService.getStores(),
        apiService.getZones()
      ]);
      if (res && res.success && Array.isArray(res.stores)) {
        setStores(res.stores);
      } else {
        // Fallback to allBranches formatted
        const fallback = (allBranches || []).map((b) => ({
          storeId: b._id || b.id,
          _id: b._id || b.id,
          tenantId: b.tenantId,
          tenantName: b.tenantName || b.name,
          name: b.name,
          branchName: b.name,
          address: b.address || `${b.city}, Pakistan`,
          city: b.city || 'Faisalabad',
          latitude: Number(b.latitude || 31.4125),
          longitude: Number(b.longitude || 73.0995),
          contactNumber: b.phone || '+92 300 0000000',
          openingHours: '08:00 AM',
          closingHours: '11:00 PM',
          deliveryRadiusKm: Number(b.deliveryRadiusKm || b.deliveryRadius || 5),
          storeImage: b.banner || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
          status: b.status || 'active',
          isActive: String(b.status || 'active').toLowerCase() === 'active',
          operatingStatus: 'Open'
        }));
        setStores(fallback);
      }

      if (zonesRes && zonesRes.success && Array.isArray(zonesRes.zones)) {
        setZones(zonesRes.zones);
      }
    } catch (e) {
      console.warn('Stores fetch error:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to detect which master polygon a store point lies inside
  const getZoneContainingPoint = (lat, lng) => {
    if (!lat || !lng || !zones || zones.length === 0) return null;
    const x = Number(lng);
    const y = Number(lat);
    for (const z of zones) {
      if (!z.geometry || !z.geometry.coordinates || !z.geometry.coordinates[0]) continue;
      const poly = z.geometry.coordinates[0];
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1];
        const xj = poly[j][0], yj = poly[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      if (inside) return z;
    }
    return null;
  };

  useEffect(() => {
    fetchStoresList();
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

      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

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

  // Handlers
  const handleOpenAdd = () => {
    const tId = selectedRetailerFilter !== 'all' ? selectedRetailerFilter : 'tenant-chasevalue';
    const retailer = CORE_RETAILERS.find((r) => r.id === tId) || CORE_RETAILERS[0];
    setFormData({
      storeId: `STR-${tId.replace('tenant-', '').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      tenantId: tId,
      name: `${retailer.name} - Branch`,
      branchName: 'Main Store',
      address: 'Main Boulevard, Faisalabad',
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
      manager: `${retailer.name} Manager`
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (store) => {
    setSelectedStore(store);
    setFormData({
      storeId: store.storeId || store._id,
      tenantId: store.tenantId || 'tenant-alfatah',
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
      manager: store.manager || ''
    });
    setIsEditModalOpen(true);
  };

  const detectedZone = useMemo(() => {
    return getZoneContainingPoint(formData.latitude, formData.longitude);
  }, [formData.latitude, formData.longitude, zones]);

  const handleSaveStore = async (e) => {
    if (e) e.preventDefault();

    const nameVal = String(formData.name || '').trim();
    const branchVal = String(formData.branchName || '').trim();
    const addressVal = String(formData.address || '').trim();
    const cityVal = String(formData.city || '').trim();

    if (!nameVal) {
      if (addToast) addToast('Please enter the Full Store Display Name.', 'error');
      if (formRef.current) formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!branchVal) {
      if (addToast) addToast('Please enter the Branch / Location Name.', 'error');
      if (formRef.current) formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!addressVal) {
      if (addToast) addToast('Please enter the Physical Street Address.', 'error');
      if (formRef.current) formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!cityVal) {
      if (addToast) addToast('Please enter the City.', 'error');
      if (formRef.current) formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (isNaN(Number(formData.latitude)) || isNaN(Number(formData.longitude))) {
      if (addToast) addToast('Valid numerical coordinates are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditModalOpen && selectedStore) {
        const id = selectedStore.storeId || selectedStore._id;
        const res = await apiService.updateStore(id, formData);
        if (res && res.success) {
          if (addToast) addToast(`Store ${formData.name} updated successfully.`, 'success');
          setIsEditModalOpen(false);
          fetchStoresList();
        } else {
          if (addToast) addToast(res?.message || 'Failed to update store.', 'error');
        }
      } else {
        const res = await apiService.createStore(formData);
        if (res && res.success) {
          if (addToast) addToast(`Store ${formData.name} created successfully with genuine GPS coordinates.`, 'success');
          setIsAddModalOpen(false);
          fetchStoresList();

          // If the store lies in a master polygon, auto-link it immediately
          if (detectedZone && res.store) {
            try {
              const newStoreId = res.store.storeId || res.store._id;
              await apiService.assignStoresToZone(detectedZone.zoneId, [newStoreId]);
            } catch (assignErr) {
              console.warn('Auto zone link:', assignErr.message);
            }
          }

          if (setAllBranches && res.store) {
            setAllBranches((prev) => [
              {
                _id: res.store.storeId || res.store._id,
                id: res.store.storeId || res.store._id,
                tenantId: res.store.tenantId,
                name: res.store.branchName || res.store.name,
                address: res.store.address,
                city: res.store.city,
                latitude: res.store.latitude,
                longitude: res.store.longitude,
                phone: res.store.contactNumber,
                status: res.store.status
              },
              ...(prev || [])
            ]);
          }
        } else {
          if (addToast) addToast(res?.message || res?.error || 'Failed to create store.', 'error');
        }
      }
    } catch (err) {
      if (addToast) addToast(err.message, 'error');
    } finally {
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
    try {
      const id = storeToDelete.storeId || storeToDelete._id;
      const res = await apiService.deleteStore(id);
      if (res && res.success) {
        if (addToast) addToast(`Store ${storeToDelete.name} deleted successfully.`, 'success');
        setStores((prev) => prev.filter((s) => s.storeId !== id && s._id !== id));
        setStoreToDelete(null);
      }
    } catch (e) {
      if (addToast) addToast(e.message, 'error');
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
            onClick={fetchStoresList}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
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
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Store className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No stores found</p>
                    <p className="text-[11px] mt-0.5">Try adjusting your search query or filters.</p>
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
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                              ID: {sId} • {store.branchName}
                            </p>
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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              ref={formRef}
              id="store-modal-form"
              onSubmit={handleSaveStore}
              noValidate
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    placeholder="e.g. Faisalabad"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Interactive Leaflet Map Coordinates Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Exact Store Geographical Coordinates (Interactive Leaflet Map)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Click map or drag the pin to position</span>
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
                      onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
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
                      onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
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

            </form>

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
                  type="submit"
                  form="store-modal-form"
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
          </div>
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
    </div>
  );
};
