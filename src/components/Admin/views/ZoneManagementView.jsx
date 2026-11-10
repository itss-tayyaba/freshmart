import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Layers,
  Store,
  Navigation,
  Info,
  Edit3,
  Check,
  X,
  Undo2,
  MousePointer,
  RefreshCw,
  Search,
  Building2,
  Sliders,
  DollarSign,
  Clock,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff,
  Square,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';
import { getAllUnifiedStores, CORE_RETAILERS, getRetailerSummarySubtitle } from '../../../utils/storeHelper';
import { isPointInPolygon } from '../../../utils/distanceCalculator';

// Helper to detect if line segments cross each other
const hasCrossingSegments = (pts) => {
  if (!Array.isArray(pts) || pts.length < 4) return false;
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

// Helper to untangle self-intersecting polygon vertices clockwise around their centroid
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

export const ZoneManagementView = () => {
  const {
    allBranches = [],
    tenants = [],
    adminOrders = [],
    customerOrders = [],
    addToast
  } = useStore();

  // Zones State
  const [zones, setZones] = useState([]);
  const [stores, setStores] = useState(() => getAllUnifiedStores([], allBranches));
  const [assignments, setAssignments] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [retailerFilter, setRetailerFilter] = useState('all');
  const [showStoreMarkers, setShowStoreMarkers] = useState(true);

  // Map Tile & Geocoding State
  const [tileLayerType, setTileLayerType] = useState('osm'); // 'osm' | 'satellite' | 'carto'
  const [geocodingQuery, setGeocodingQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Drawing & Editing State
  // Mode: 'view' | 'box' | 'draw' | 'edit'
  const [mapMode, setMapMode] = useState('view');
  const mapModeRef = useRef(mapMode);
  useEffect(() => {
    mapModeRef.current = mapMode;
  }, [mapMode]);
  const [boxCorner1, setBoxCorner1] = useState(null);
  const boxCorner1Ref = useRef(null);
  useEffect(() => {
    boxCorner1Ref.current = boxCorner1;
  }, [boxCorner1]);
  const [drawnVertices, setDrawnVertices] = useState([]); // Array of [lat, lng]
  const [isSaving, setIsSaving] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState(null);
  const boxPreviewGroupRef = useRef(null);

  // Right Panel Form State
  const [zoneForm, setZoneForm] = useState({
    zoneId: '',
    name: '',
    code: '',
    description: '',
    city: 'Faisalabad',
    area: '',
    color: '#2563eb',
    deliveryCharge: 70,
    minOrderAmount: 400,
    freeDeliveryThreshold: 2000,
    estimatedDeliveryTime: '20-35 mins',
    isActive: true,
    status: 'active',
    assignedStoreId: ''
  });

  // Map DOM and Instance Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const polygonsLayerGroupRef = useRef(null);
  const storeMarkersGroupRef = useRef(null);
  const drawingLayerGroupRef = useRef(null);

  // 4 Core Retailers
  const CORE_RETAILERS = [
    { id: 'tenant-alfatah', name: 'Al-Fatah', color: '#991b1b', logo: '🏬' },
    { id: 'tenant-chasevalue', name: 'Chase Value', color: '#854d0e', logo: '🛒' },
    { id: 'tenant-chaseup', name: 'Chase Up', color: '#6b21a8', logo: '🏪' },
    { id: 'tenant-unimart', name: 'Unimart', color: '#0284c7', logo: '🥬' }
  ];

  // Fetch all Zones, Stores, Assignments
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [zonesRes, storesRes, assignRes] = await Promise.all([
        apiService.getZones(),
        apiService.getStores(),
        apiService.getAllAssignments()
      ]);

      if (zonesRes && zonesRes.success && Array.isArray(zonesRes.zones)) {
        setZones(zonesRes.zones);
        if (zonesRes.zones.length > 0 && !selectedZone) {
          selectZone(zonesRes.zones[0]);
        }
      }

      const cleanStores = getAllUnifiedStores(storesRes?.stores, allBranches);
      setStores(cleanStores);

      if (assignRes && assignRes.success && Array.isArray(assignRes.assignments)) {
        setAssignments(assignRes.assignments);
      }
    } catch (err) {
      console.warn('Zone management fetch error:', err.message);
      setStores(getAllUnifiedStores([], allBranches));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [allBranches]);

  // Real-time synchronization when a new store is created or deleted anywhere on the platform
  useEffect(() => {
    const handleStoresUpdated = () => {
      setStores(getAllUnifiedStores([], allBranches));
    };
    window.addEventListener('freshmart_stores_updated', handleStoresUpdated);
    return () => window.removeEventListener('freshmart_stores_updated', handleStoresUpdated);
  }, [allBranches]);

  // Compute Statistics
  const statistics = useMemo(() => {
    const totalStores = stores.length;
    const totalRetailers = CORE_RETAILERS.length;
    const totalZones = zones.length;
    const activeZones = zones.filter((z) => z.isActive !== false && String(z.status).toLowerCase() !== 'inactive').length;

    // Assigned store IDs set
    const assignedStoreIds = new Set(assignments.filter((a) => a.isActive !== false).map((a) => a.storeId));
    const unassignedStores = Math.max(0, totalStores - assignedStoreIds.size);

    // Orders Today
    const todayStr = new Date().toISOString().split('T')[0];
    const allOrders = [...(adminOrders || []), ...(customerOrders || [])];
    const ordersToday = allOrders.filter((o) => (o.createdAt || '').startsWith(todayStr)).length;

    return {
      totalRetailers,
      totalStores,
      totalZones,
      activeZones,
      unassignedStores,
      ordersToday
    };
  }, [zones, stores, assignments, adminOrders, customerOrders]);

  // Select Zone
  const selectZone = (zone) => {
    setSelectedZone(zone);
    const currentAssigned = assignments.find((a) => a.zoneId === zone.zoneId && a.isActive !== false);
    setZoneForm({
      zoneId: zone.zoneId || '',
      name: zone.name || '',
      code: zone.code || '',
      description: zone.description || '',
      city: zone.city || 'Faisalabad',
      area: zone.area || zone.name || '',
      color: zone.color || '#2563eb',
      deliveryCharge: zone.deliveryCharge ?? 70,
      minOrderAmount: zone.minOrderAmount ?? 400,
      freeDeliveryThreshold: zone.freeDeliveryThreshold ?? 2000,
      estimatedDeliveryTime: zone.estimatedDeliveryTime || '20-35 mins',
      isActive: zone.isActive !== false && String(zone.status).toLowerCase() !== 'inactive',
      status: zone.status || 'active',
      assignedStoreId: currentAssigned?.storeId || ''
    });

    if (zone.geometry?.coordinates?.[0]) {
      const pts = zone.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
      setDrawnVertices(pts);

      // Pan map to zone centroid if map exists
      if (mapInstanceRef.current && pts.length > 0) {
        const bounds = L.latLngBounds(pts);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  };

  // Switch Tile Layer
  const setTileLayer = (type) => {
    setTileLayerType(type);
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; OpenStreetMap contributors';

    if (type === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS';
    } else if (type === 'carto') {
      url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      attribution = '&copy; OpenStreetMap contributors &copy; CARTO';
    }

    tileLayerRef.current = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(mapInstanceRef.current);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [31.4125, 73.0995], // Faisalabad center
      zoom: 13,
      zoomControl: true
    });

    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    polygonsLayerGroupRef.current = L.layerGroup().addTo(map);
    storeMarkersGroupRef.current = L.layerGroup().addTo(map);
    drawingLayerGroupRef.current = L.layerGroup().addTo(map);
    boxPreviewGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Handle map click during Drawing & Box mode
    map.on('click', (e) => {
      const roundedLat = Number(e.latlng.lat.toFixed(6));
      const roundedLng = Number(e.latlng.lng.toFixed(6));

      if (mapModeRef.current === 'box') {
        if (!boxCorner1Ref.current) {
          boxCorner1Ref.current = [roundedLat, roundedLng];
          setBoxCorner1([roundedLat, roundedLng]);
          if (boxPreviewGroupRef.current) boxPreviewGroupRef.current.clearLayers();
          if (drawingLayerGroupRef.current) {
            drawingLayerGroupRef.current.clearLayers();
            const startIcon = L.divIcon({
              className: 'box-corner-start',
              html: `
                <div style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; background: #059669; color: #ffffff; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); font-size: 11px; font-weight: 900;">
                  1
                </div>
              `,
              iconSize: [26, 26],
              iconAnchor: [13, 13]
            });
            drawingLayerGroupRef.current.addLayer(L.marker([roundedLat, roundedLng], { icon: startIcon }));
          }
        } else {
          const p1 = boxCorner1Ref.current;
          const p2 = [roundedLat, roundedLng];
          const minLat = Math.min(p1[0], p2[0]);
          const maxLat = Math.max(p1[0], p2[0]);
          const minLng = Math.min(p1[1], p2[1]);
          const maxLng = Math.max(p1[1], p2[1]);

          const box = [
            [Number(maxLat.toFixed(6)), Number(minLng.toFixed(6))], // NW
            [Number(maxLat.toFixed(6)), Number(maxLng.toFixed(6))], // NE
            [Number(minLat.toFixed(6)), Number(maxLng.toFixed(6))], // SE
            [Number(minLat.toFixed(6)), Number(minLng.toFixed(6))]  // SW
          ];

          boxCorner1Ref.current = null;
          setBoxCorner1(null);
          if (boxPreviewGroupRef.current) boxPreviewGroupRef.current.clearLayers();
          setDrawnVertices(box);
          setMapMode('edit');
        }
      } else if (mapModeRef.current === 'draw') {
        setDrawnVertices((prev) => {
          const next = [...prev, [roundedLat, roundedLng]];
          if (next.length >= 3 && hasCrossingSegments(next)) {
            return untanglePolygonPoints(next);
          }
          return next;
        });
      }
    });

    // Real-time rectangle hover preview in Box Mode
    map.on('mousemove', (e) => {
      if (mapModeRef.current !== 'box' || !boxCorner1Ref.current) {
        if (boxPreviewGroupRef.current) boxPreviewGroupRef.current.clearLayers();
        return;
      }
      if (!boxPreviewGroupRef.current) return;
      boxPreviewGroupRef.current.clearLayers();

      const p1 = boxCorner1Ref.current;
      const p2 = [e.latlng.lat, e.latlng.lng];
      const bounds = L.latLngBounds(p1, p2);
      const color = '#10b981';

      const rect = L.rectangle(bounds, {
        color: color,
        weight: 2.5,
        fillColor: color,
        fillOpacity: 0.25,
        dashArray: '6, 6',
        interactive: false
      });
      boxPreviewGroupRef.current.addLayer(rect);
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (boxPreviewGroupRef.current) {
        boxPreviewGroupRef.current.clearLayers();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render Saved Colored Zones on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonsLayerGroupRef.current) return;
    polygonsLayerGroupRef.current.clearLayers();

    // Render each zone polygon
    zones.forEach((z) => {
      if (!z.geometry?.coordinates?.[0]) return;
      const isSelected = selectedZone?.zoneId === z.zoneId;
      const color = z.color || '#10b981';
      const isActive = z.isActive !== false && String(z.status).toLowerCase() !== 'inactive';

      const latLngs = (z.geometry.coordinates[0] || [])
        .map(([lng, lat]) => [Number(lat), Number(lng)])
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng) && !isNaN(lat) && !isNaN(lng));
      if (latLngs.length < 3) return;

      const polygon = L.polygon(latLngs, {
        color: color,
        weight: isSelected ? 3.5 : 2,
        fillColor: color,
        fillOpacity: isSelected ? 0.45 : isActive ? 0.25 : 0.08,
        dashArray: isActive ? null : '6, 6'
      });

      polygon.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 170px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 13px;">${z.name}</strong>
            <span style="font-size: 10px; background: ${color}20; color: ${color}; padding: 2px 6px; border-radius: 6px; font-weight: 800;">
              ${z.code}
            </span>
          </div>
          <p style="color: #64748b; font-size: 11px; margin: 0 0 6px 0;">${z.description || z.city}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11px;">
            <span style="color: #475569;">Delivery Fee:</span>
            <strong style="color: #059669;">Rs. ${z.deliveryCharge}</strong>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 3px; font-size: 11px;">
            <span style="color: #475569;">Free Over:</span>
            <strong>Rs. ${z.freeDeliveryThreshold}</strong>
          </div>
        </div>
      `);

      polygon.on('click', (e) => {
        if (mapModeRef.current === 'draw') {
          const { lat, lng } = e.latlng;
          const roundedLat = Number(lat.toFixed(6));
          const roundedLng = Number(lng.toFixed(6));
          setDrawnVertices((prev) => [...prev, [roundedLat, roundedLng]]);
          return;
        }
        selectZone(z);
      });

      polygonsLayerGroupRef.current.addLayer(polygon);
    });
  }, [zones, selectedZone]);

  // Render Stores on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !storeMarkersGroupRef.current) return;
    storeMarkersGroupRef.current.clearLayers();

    if (!showStoreMarkers) return;

    stores.forEach((store) => {
      const lat = Number(store.latitude);
      const lng = Number(store.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const retailer = CORE_RETAILERS.find((r) =>
        String(store.tenantId || '').toLowerCase().includes(r.id.replace('tenant-', ''))
      ) || { name: 'Retailer', color: '#059669', logo: '🏬' };

      const pinIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="width: 32px; height: 32px; border-radius: 10px; background: ${retailer.color}; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
              ${retailer.logo}
            </div>
            <div style="margin-top: 2px; padding: 1px 6px; border-radius: 9999px; background: #0f172a; color: white; font-size: 9px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
              ${store.branchName || store.name}
            </div>
          </div>
        `,
        iconSize: [32, 48],
        iconAnchor: [16, 40]
      });

      const marker = L.marker([lat, lng], { icon: pinIcon });
      const storeIdForClick = store.storeId || store._id;
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 170px;">
          <strong style="color: ${retailer.color}; font-size: 13px;">${store.name}</strong>
          <p style="color: #64748b; font-size: 10px; margin: 2px 0 6px 0;">${store.address}</p>
          <div style="font-size: 10px; color: #334155;">
            <strong>Hours:</strong> ${store.openingHours || '8 AM'} - ${store.closingHours || '11 PM'}
          </div>
          <div style="font-size: 10px; color: #334155; margin-top: 2px;">
            <strong>Status:</strong> <span style="color: ${store.isActive ? '#059669' : '#e11d48'}; font-weight: bold;">${store.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <button
            onclick="window.__createZoneAroundStore && window.__createZoneAroundStore('${storeIdForClick}')"
            style="margin-top: 8px; width: 100%; padding: 5px 8px; background: #059669; color: white; border: none; border-radius: 8px; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
          >
            <span>+ Create Zone Around Store</span>
          </button>
        </div>
      `);

      marker.on('click', (e) => {
        if (mapModeRef.current === 'draw') {
          const { lat: mLat, lng: mLng } = e.latlng;
          const roundedLat = Number(mLat.toFixed(6));
          const roundedLng = Number(mLng.toFixed(6));
          setDrawnVertices((prev) => [...prev, [roundedLat, roundedLng]]);
        }
      });

      storeMarkersGroupRef.current.addLayer(marker);
    });
  }, [stores, showStoreMarkers]);

  // Render Active Drawing / Editing Polyline & Vertex Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !drawingLayerGroupRef.current) return;
    drawingLayerGroupRef.current.clearLayers();

    if (drawnVertices.length === 0) return;

    const cleanVertices = hasCrossingSegments(drawnVertices) ? untanglePolygonPoints(drawnVertices) : drawnVertices;

    // Draw lines connecting points
    if (cleanVertices.length >= 2) {
      const loop = cleanVertices.length >= 3 ? [...cleanVertices, cleanVertices[0]] : cleanVertices;
      const line = L.polyline(loop, {
        color: zoneForm.color || '#10b981',
        weight: 3,
        dashArray: mapMode === 'draw' || mapMode === 'box' ? '5, 5' : null
      });
      drawingLayerGroupRef.current.addLayer(line);

      // If closed (or 3+ points in edit/view), show filled polygon preview
      if (cleanVertices.length >= 3) {
        const previewPoly = L.polygon(cleanVertices, {
          color: zoneForm.color || '#10b981',
          weight: 2,
          fillColor: zoneForm.color || '#10b981',
          fillOpacity: 0.35
        });
        drawingLayerGroupRef.current.addLayer(previewPoly);
      }
    }

    // Draw vertex handles
    cleanVertices.forEach(([vLat, vLng], idx) => {
      const handleIcon = L.divIcon({
        className: 'vertex-handle',
        html: `
          <div style="width: 16px; height: 16px; border-radius: 9999px; background: #ffffff; border: 3px solid ${zoneForm.color || '#10b981'}; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; color: #0f172a; cursor: grab;">
            ${idx + 1}
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([vLat, vLng], {
        icon: handleIcon,
        draggable: mapMode === 'edit'
      });

      // Draggable vertices in Edit Mode
      if (mapMode === 'edit') {
        marker.on('drag', (e) => {
          const newPos = e.target.getLatLng();
          setDrawnVertices((prev) => {
            const copy = [...prev];
            copy[idx] = [Number(newPos.lat.toFixed(6)), Number(newPos.lng.toFixed(6))];
            return copy;
          });
        });
      }

      drawingLayerGroupRef.current.addLayer(marker);
    });
  }, [drawnVertices, mapMode, zoneForm.color]);

  // Geocoding Search: Center map on Pakistani landmark or address
  const handleGeocodingSearch = async (e) => {
    e.preventDefault();
    if (!geocodingQuery.trim()) return;

    setIsGeocoding(true);
    try {
      // Nominatim OpenStreetMap Geocoding API
      const q = encodeURIComponent(`${geocodingQuery}, Pakistan`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const targetLat = parseFloat(data[0].lat);
        const targetLng = parseFloat(data[0].lon);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([targetLat, targetLng], 14, { duration: 1.5 });
          if (addToast) addToast(`Located: ${data[0].display_name.split(',')[0]}`, 'success');
        }
      } else {
        if (addToast) addToast(`Could not find "${geocodingQuery}". Try another city/location.`, 'error');
      }
    } catch (err) {
      if (addToast) addToast('Geocoding service unavailable.', 'error');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Preset polygon around a store (e.g. Chase Up Clock Tower)
  const handlePresetZoneAroundStore = (store) => {
    const sLat = Number(store.latitude);
    const sLng = Number(store.longitude);
    if (isNaN(sLat) || isNaN(sLng)) return;

    const deltaLat = 0.018;
    const deltaLng = 0.022;
    const preset = [
      [Number((sLat - deltaLat).toFixed(6)), Number((sLng - deltaLng).toFixed(6))],
      [Number((sLat - deltaLat).toFixed(6)), Number((sLng + deltaLng).toFixed(6))],
      [Number((sLat + deltaLat).toFixed(6)), Number((sLng + deltaLng).toFixed(6))],
      [Number((sLat + deltaLat).toFixed(6)), Number((sLng - deltaLng).toFixed(6))],
      [Number((sLat - deltaLat).toFixed(6)), Number((sLng - deltaLng).toFixed(6))]
    ];

    setDrawnVertices(preset);
    const generatedId = `ZONE-FSD-${Date.now().toString().slice(-4)}`;
    setZoneForm({
      zoneId: generatedId,
      name: `${store.branchName || store.name} Delivery Zone`,
      code: `Z-${Date.now().toString().slice(-3)}`,
      description: `Delivery polygon covering ${store.name} and neighboring areas.`,
      city: store.city || 'Faisalabad',
      area: store.branchName || store.name,
      color: '#8b5cf6',
      deliveryCharge: 70,
      minOrderAmount: 400,
      freeDeliveryThreshold: 2000,
      estimatedDeliveryTime: '20-30 mins',
      isActive: true,
      status: 'active'
    });
    setSelectedZone(null);
    setMapMode('edit');
    if (addToast) addToast(`Polygon created around ${store.name}! Adjust points if desired, then click Save.`, 'success');
  };

  useEffect(() => {
    window.__createZoneAroundStore = (sId) => {
      const found = stores.find((s) => (s.storeId || s._id) === sId);
      if (found) handlePresetZoneAroundStore(found);
    };
    return () => {
      delete window.__createZoneAroundStore;
    };
  }, [stores]);

  // Start Box Drawing Mode
  const handleStartBox = () => {
    setMapMode('box');
    boxCorner1Ref.current = null;
    setBoxCorner1(null);
    setDrawnVertices([]);
    if (boxPreviewGroupRef.current) boxPreviewGroupRef.current.clearLayers();
    if (drawingLayerGroupRef.current) drawingLayerGroupRef.current.clearLayers();
    if (!selectedZone) {
      setZoneForm({
        zoneId: `ZONE-FSD-${Date.now().toString().slice(-4)}`,
        name: 'New Delivery Zone',
        code: `Z-${Date.now().toString().slice(-3)}`,
        description: 'Custom rectangular box delivery boundary',
        city: 'Faisalabad',
        area: 'Central Commercial Area',
        color: '#059669',
        deliveryCharge: 80,
        minOrderAmount: 450,
        freeDeliveryThreshold: 2200,
        estimatedDeliveryTime: '20-35 mins',
        isActive: true,
        status: 'active',
        assignedStoreId: ''
      });
    }
    if (addToast) addToast(`📦 Box Mode: Click Corner 1 on map, then click opposite corner to create box for ${selectedZone ? selectedZone.name : 'delivery zone'}.`, 'info');
  };

  const handleSnapToBox = () => {
    if (drawnVertices.length < 2) return;
    const lats = drawnVertices.map((p) => p[0]);
    const lngs = drawnVertices.map((p) => p[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const box = [
      [Number(maxLat.toFixed(6)), Number(minLng.toFixed(6))], // NW
      [Number(maxLat.toFixed(6)), Number(maxLng.toFixed(6))], // NE
      [Number(minLat.toFixed(6)), Number(maxLng.toFixed(6))], // SE
      [Number(minLat.toFixed(6)), Number(minLng.toFixed(6))]  // SW
    ];
    setDrawnVertices(box);
    setMapMode('edit');
    if (addToast) addToast('Converted to Box 📦', 'Boundary vertices aligned into a clean rectangular box.', 'info');
  };

  // Start Drawing Mode
  const handleStartDraw = () => {
    setMapMode('draw');
    boxCorner1Ref.current = null;
    setBoxCorner1(null);
    setDrawnVertices([]);
    if (boxPreviewGroupRef.current) boxPreviewGroupRef.current.clearLayers();
    if (drawingLayerGroupRef.current) drawingLayerGroupRef.current.clearLayers();
    if (!selectedZone) {
      setZoneForm({
        zoneId: `ZONE-FSD-${Date.now().toString().slice(-4)}`,
        name: 'New Delivery Zone',
        code: `Z-${Date.now().toString().slice(-3)}`,
        description: 'Custom polygon delivery boundary',
        city: 'Faisalabad',
        area: 'Central Commercial Area',
        color: '#2563eb',
        deliveryCharge: 80,
        minOrderAmount: 450,
        freeDeliveryThreshold: 2200,
        estimatedDeliveryTime: '20-35 mins',
        isActive: true,
        status: 'active',
        assignedStoreId: ''
      });
    }
    if (addToast) addToast(`Drawing mode active. Click on map to add polygon boundary points for ${selectedZone ? selectedZone.name : 'delivery zone'}.`, 'info');
  };

  // Automatically Close Polygon Ring
  const handleAutoCloseRing = () => {
    if (drawnVertices.length < 3) {
      if (addToast) addToast('At least 3 vertices are required to close a polygon ring.', 'error');
      return;
    }
    // Auto closing ring
    const first = drawnVertices[0];
    const last = drawnVertices[drawnVertices.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      setDrawnVertices((prev) => [...prev, [first[0], first[1]]]);
      if (addToast) addToast('Polygon ring closed successfully.', 'success');
    }
    setMapMode('edit');
  };

  // Undo Last Vertex
  const handleUndoVertex = () => {
    setDrawnVertices((prev) => prev.slice(0, -1));
  };

  // Clear Drawn Points
  const handleClearDrawing = () => {
    boxCorner1Ref.current = null;
    setBoxCorner1(null);
    setDrawnVertices([]);
    if (drawingLayerGroupRef.current) drawingLayerGroupRef.current.clearLayers();
    if (boxPreviewGroupRef.current) boxPreviewGroupRef.current.clearLayers();
    if (addToast) addToast('Drawing cleared.', 'info');
  };

  // Save / Update Zone
  const handleSaveZone = async (e) => {
    e.preventDefault();

    if (!zoneForm.name || !zoneForm.code) {
      if (addToast) addToast('Zone name and code are required.', 'error');
      return;
    }

    if (drawnVertices.length < 3) {
      if (addToast) addToast('A valid polygon requires at least 3 distinct vertices.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Auto-untangle vertices if they cross over to ensure clean valid polygon geometry
      const cleanVertices = untanglePolygonPoints(drawnVertices);

      // GeoJSON format: coordinates is [[[lng, lat], ...]]
      let ring = cleanVertices.map(([lat, lng]) => [
        Number(Number(lng).toFixed(6)),
        Number(Number(lat).toFixed(6))
      ]);
      // Ensure closed ring
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }

      const payload = {
        ...zoneForm,
        coordinates: [ring],
        geometry: {
          type: 'Polygon',
          coordinates: [ring]
        }
      };

      // Optimistic update
      setZones((prev) => {
        const idx = prev.findIndex((z) => z.zoneId === payload.zoneId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = payload;
          return copy;
        }
        return [payload, ...prev];
      });
      setSelectedZone(payload);

      if (selectedZone && selectedZone.zoneId === zoneForm.zoneId) {
        // Update existing zone
        const res = await apiService.updateZone(selectedZone.zoneId, { ...payload, assignedStoreId: zoneForm.assignedStoreId });
        if (res && res.success) {
          if (zoneForm.assignedStoreId) {
            try {
              await apiService.assignStoresToZone(payload.zoneId, [zoneForm.assignedStoreId]);
            } catch (e) {}
          }
          if (addToast) addToast(`Zone ${zoneForm.name} updated successfully!`, 'success');
          setMapMode('view');
          fetchData();
        } else {
          if (addToast) addToast(res?.message || 'Error updating zone.', 'error');
        }
      } else {
        // Create new zone
        const res = await apiService.createZone({ ...payload, assignedStoreId: zoneForm.assignedStoreId });
        if (res && res.success) {
          if (zoneForm.assignedStoreId) {
            try {
              await apiService.assignStoresToZone(payload.zoneId, [zoneForm.assignedStoreId]);
            } catch (e) {}
          }
          if (addToast) addToast(`Zone ${zoneForm.name} created with verified polygon geometry!`, 'success');
          setMapMode('view');
          fetchData();
        } else {
          if (addToast) addToast(res?.message || 'Error creating zone.', 'error');
        }
      }

      // Propagate polygon boundary to assigned branch and branches inside this zone
      try {
        const savedBranches = localStorage.getItem('freshmart_branches');
        const branchList = savedBranches ? JSON.parse(savedBranches) : (allBranches || []);
        if (Array.isArray(branchList) && branchList.length > 0) {
          let updatedAny = false;
          const assignedId = String(zoneForm.assignedStoreId || '').toLowerCase().trim();
          const updated = branchList.map((b) => {
            const bId = String(b._id || b.id || '').toLowerCase().trim();
            const bStoreId = String(b.storeId || '').toLowerCase().trim();
            const bLat = Number(b.latitude ?? b.coordinates?.lat);
            const bLng = Number(b.longitude ?? b.coordinates?.lng);
            const isInside = isPointInPolygon({ lat: bLat, lng: bLng }, cleanVertices);
            const isExplicitlyAssigned = assignedId && (bId === assignedId || bStoreId === assignedId);

            if (isExplicitlyAssigned || isInside) {
              updatedAny = true;
              return {
                ...b,
                deliveryPolygon: cleanVertices,
                assignedZoneId: payload.zoneId
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
    } catch (err) {
      if (addToast) addToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Zone
  const handleDeleteZone = async () => {
    if (!zoneToDelete) return;
    try {
      const res = await apiService.deleteZone(zoneToDelete.zoneId);
      if (res && res.success) {
        if (addToast) addToast(`Zone ${zoneToDelete.name} deleted successfully.`, 'success');
        setZoneToDelete(null);
        setSelectedZone(null);
        setDrawnVertices([]);
        fetchData();
      } else {
        if (addToast) addToast(res?.message || 'Failed to delete zone.', 'error');
      }
    } catch (e) {
      if (addToast) addToast(e.message, 'error');
    }
  };

  // Toggle Active/Inactive
  const handleToggleZoneActive = async (zone) => {
    const newActive = zone.isActive === false ? true : false;
    try {
      const res = await apiService.toggleZoneStatus(zone.zoneId, newActive);
      if (res && res.success) {
        if (addToast) addToast(`Zone ${zone.name} is now ${newActive ? 'Active' : 'Inactive'}.`, 'success');
        setZones((prev) =>
          prev.map((z) => (z.zoneId === zone.zoneId ? { ...z, isActive: newActive, status: newActive ? 'active' : 'inactive' } : z))
        );
        if (selectedZone?.zoneId === zone.zoneId) {
          setSelectedZone((prev) => ({ ...prev, isActive: newActive, status: newActive ? 'active' : 'inactive' }));
          setZoneForm((prev) => ({ ...prev, isActive: newActive, status: newActive ? 'active' : 'inactive' }));
        }
      }
    } catch (e) {
      if (addToast) addToast(e.message, 'error');
    }
  };

  // Assigned Stores for selected zone
  const assignedStoresForSelectedZone = useMemo(() => {
    if (!selectedZone) return [];
    const zoneAssigns = assignments.filter((a) => a.zoneId === selectedZone.zoneId && a.isActive !== false);
    return zoneAssigns.map((a) => {
      const store = stores.find((s) => (s.storeId || s._id) === a.storeId);
      return store || { storeId: a.storeId, name: a.storeId, tenantId: a.tenantId };
    });
  }, [selectedZone, assignments, stores]);

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* TOP: HEADER & ACTION BUTTONS                                          */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            <span>Store Area Polygon Management</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create & manage master geographic polygons that cover the area where partner supermarket stores physically lie.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleStartDraw}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/10 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Delivery Zone</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* STATISTICS (6 STATS AS SPECIFIED IN MODULE 1)                        */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Retailers</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{statistics.totalRetailers}</span>
          <span className="text-[9px] text-slate-400 mt-0.5 block">{getRetailerSummarySubtitle(stores)}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Stores</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{statistics.totalStores}</span>
          <span className="text-[9px] text-slate-400 mt-0.5 block">Physical branches & hubs</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Zones</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{statistics.totalZones}</span>
          <span className="text-[9px] text-emerald-600/80 mt-0.5 block">Geofenced polygons</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Active Zones</span>
          <span className="text-xl font-black text-teal-600 mt-1 block">{statistics.activeZones}</span>
          <span className="text-[9px] text-teal-600/80 mt-0.5 block">Accepting orders</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Unassigned Stores</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{statistics.unassignedStores}</span>
          <span className="text-[9px] text-amber-600/80 mt-0.5 block">Need zone mapping</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Orders Today</span>
          <span className="text-xl font-black text-sky-600 mt-1 block">{statistics.ordersToday}</span>
          <span className="text-[9px] text-sky-600/80 mt-0.5 block">Dispatched & live</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN WORKSPACE: MAP (LEFT) & ZONE DETAILS PANEL (RIGHT)               */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Map & Drawing Tools (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          {/* Map Controls Toolbar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Geocoding Location Search */}
            <form onSubmit={handleGeocodingSearch} className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={geocodingQuery}
                onChange={(e) => setGeocodingQuery(e.target.value)}
                placeholder="Search city, neighborhood, or road in Pakistan..."
                className="w-full pl-8 pr-16 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={isGeocoding}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-emerald-700 transition"
              >
                {isGeocoding ? '...' : 'Go'}
              </button>
            </form>

            {/* Drawing Modes */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMapMode('view')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  mapMode === 'view' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>View</span>
              </button>
              <button
                onClick={handleStartBox}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  mapMode === 'box' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>Draw Box</span>
              </button>
              <button
                onClick={handleStartDraw}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  mapMode === 'draw' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Draw Polygon</span>
              </button>
              <button
                onClick={() => setMapMode('edit')}
                disabled={drawnVertices.length === 0}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  mapMode === 'edit' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Edit Vertices</span>
              </button>
            </div>

            {/* Map Layer Switcher & Store Markers Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-medium">
                <button
                  onClick={() => setTileLayer('osm')}
                  className={`px-2 py-0.5 rounded-md transition ${tileLayerType === 'osm' ? 'bg-white font-bold shadow-2xs' : 'text-slate-500'}`}
                >
                  Street
                </button>
                <button
                  onClick={() => setTileLayer('satellite')}
                  className={`px-2 py-0.5 rounded-md transition ${tileLayerType === 'satellite' ? 'bg-white font-bold shadow-2xs' : 'text-slate-500'}`}
                >
                  Satellite
                </button>
                <button
                  onClick={() => setTileLayer('carto')}
                  className={`px-2 py-0.5 rounded-md transition ${tileLayerType === 'carto' ? 'bg-white font-bold shadow-2xs' : 'text-slate-500'}`}
                >
                  Light
                </button>
              </div>

              <button
                onClick={() => setShowStoreMarkers(!showStoreMarkers)}
                className={`p-1.5 rounded-xl border transition cursor-pointer ${
                  showStoreMarkers ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
                title="Toggle Store Markers"
              >
                <Store className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Leaflet Map Container */}
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div
              ref={mapContainerRef}
              className="w-full h-[520px] z-10"
              style={{ minHeight: '520px' }}
            ></div>

            {/* Box Mode Banner */}
            {mapMode === 'box' && (
              <div className="absolute top-4 left-4 right-4 z-20 bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs border border-emerald-500/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span>
                    {boxCorner1 ? (
                      <span className="text-amber-300 font-bold">
                        📍 Corner 1 set! Move cursor and click opposite corner to create box.
                      </span>
                    ) : (
                      '📦 Click anywhere on map to set Corner 1 of your delivery box.'
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={handleClearDrawing}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setMapMode('view')}
                    className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* In-Map Drawing Notification / Vertex Actions Banner */}
            {mapMode === 'draw' && (
              <div className="absolute top-4 left-4 right-4 z-20 bg-slate-900/90 backdrop-blur-xs text-white p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span>
                    Click on the map to add polygon boundary points. (Vertices: <strong className="text-emerald-400">{drawnVertices.length}</strong>)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {drawnVertices.length >= 2 && (
                    <button
                      onClick={handleSnapToBox}
                      title="Convert vertices to a clean rectangular box"
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Square className="w-3 h-3" />
                      <span>Snap to Box</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (drawnVertices.length >= 3) {
                        setDrawnVertices(untanglePolygonPoints(drawnVertices));
                        if (addToast) addToast('Vertices untangled into clean convex boundary ✨', 'success');
                      }
                    }}
                    disabled={drawnVertices.length < 3}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition disabled:opacity-40"
                  >
                    ✨ Untangle
                  </button>
                  <button
                    onClick={handleUndoVertex}
                    disabled={drawnVertices.length === 0}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition disabled:opacity-40"
                  >
                    Undo
                  </button>
                  <button
                    onClick={handleAutoCloseRing}
                    disabled={drawnVertices.length < 3}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition shadow-xs disabled:opacity-40"
                  >
                    Close Ring & Finish
                  </button>
                  <button
                    onClick={handleClearDrawing}
                    className="px-2.5 py-1 bg-rose-900/50 hover:bg-rose-900 text-rose-200 rounded-lg text-[11px] font-bold transition"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Edit Mode Notification Banner */}
            {mapMode === 'edit' && (
              <div className="absolute top-4 left-4 right-4 z-20 bg-amber-950/90 backdrop-blur-xs text-white p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-200">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Drag vertex handles on the map to reshape the delivery polygon boundary.</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {drawnVertices.length >= 2 && (
                    <button
                      onClick={handleSnapToBox}
                      title="Snap to clean box"
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Square className="w-3 h-3" />
                      <span>Snap to Box</span>
                    </button>
                  )}
                  <button
                    onClick={() => setMapMode('view')}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold transition"
                  >
                    Done Editing
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Zones Quick Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Zones:</span>
            {zones.length === 0 ? (
              <span className="text-slate-500 italic text-xs">
                No delivery zones drawn yet. Click "+ Create Delivery Zone" above to draw your first polygon on the map.
              </span>
            ) : (
              zones.map((z) => {
                const isSelected = selectedZone?.zoneId === z.zoneId;
                const color = z.color || '#10b981';
                return (
                  <button
                    key={z.zoneId}
                    onClick={() => selectZone(z)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                    <span>{z.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({z.code})</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Zone Details Form Panel (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Zone Configuration</h3>
              <p className="text-[11px] text-slate-400">
                {selectedZone ? `Editing: ${selectedZone.name}` : 'Creating new delivery zone'}
              </p>
            </div>
            {selectedZone && (
              <button
                onClick={() => setZoneToDelete(selectedZone)}
                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                title="Delete Zone"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleSaveZone} className="space-y-3.5 text-xs">
            {/* Zone Name & Code */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Zone Name *</label>
                <input
                  type="text"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  required
                  placeholder="e.g. D-Ground Express Zone"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Zone Code *</label>
                <input
                  type="text"
                  value={zoneForm.code}
                  onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="DGR-01"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 font-mono uppercase"
                />
              </div>
            </div>

            {/* City & Area */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  value={zoneForm.city}
                  onChange={(e) => setZoneForm({ ...zoneForm, city: e.target.value })}
                  required
                  placeholder="Faisalabad"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Area / Sector</label>
                <input
                  type="text"
                  value={zoneForm.area}
                  onChange={(e) => setZoneForm({ ...zoneForm, area: e.target.value })}
                  placeholder="Peoples Colony"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows="2"
                value={zoneForm.description}
                onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
                placeholder="High-density urban coverage area..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden resize-none"
              ></textarea>
            </div>

            {/* Color Accent Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Polygon Fill & Boundary Color</span>
                <span className="text-[10px] text-slate-400 font-normal">Blue, Green, Orange matching map sectors</span>
              </label>
              <div className="flex items-center gap-2">
                {[
                  { color: '#2563eb', label: 'Blue' },
                  { color: '#16a34a', label: 'Green' },
                  { color: '#ea580c', label: 'Orange' },
                  { color: '#8b5cf6', label: 'Purple' },
                  { color: '#06b6d4', label: 'Cyan' },
                  { color: '#e11d48', label: 'Rose' }
                ].map(({ color, label }) => (
                  <button
                    key={color}
                    type="button"
                    title={label}
                    onClick={() => setZoneForm({ ...zoneForm, color })}
                    className={`w-7 h-7 rounded-xl transition cursor-pointer border-2 relative flex items-center justify-center ${
                      zoneForm.color === color ? 'border-slate-900 scale-110 shadow-xs ring-2 ring-emerald-500/30' : 'border-white'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {zoneForm.color === color && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing & Thresholds */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Delivery Charge (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  value={zoneForm.deliveryCharge}
                  onChange={(e) => setZoneForm({ ...zoneForm, deliveryCharge: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Min Order Amount (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  value={zoneForm.minOrderAmount}
                  onChange={(e) => setZoneForm({ ...zoneForm, minOrderAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Free Delivery Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={zoneForm.freeDeliveryThreshold}
                  onChange={(e) => setZoneForm({ ...zoneForm, freeDeliveryThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Estimated Delivery Time</label>
                <input
                  type="text"
                  value={zoneForm.estimatedDeliveryTime}
                  onChange={(e) => setZoneForm({ ...zoneForm, estimatedDeliveryTime: e.target.value })}
                  placeholder="20-35 mins"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 text-xs block">Zone Operating Status</span>
                <span className="text-[10px] text-slate-400">Controls order eligibility at checkout</span>
              </div>
              <button
                type="button"
                onClick={() => setZoneForm({ ...zoneForm, isActive: !zoneForm.isActive, status: !zoneForm.isActive ? 'active' : 'inactive' })}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  zoneForm.isActive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {zoneForm.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                <span>{zoneForm.isActive ? 'Active' : 'Inactive'}</span>
              </button>
            </div>

            {/* Assign Store to this Polygon Zone */}
            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Assign Store to this Delivery Zone</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-bold">{stores.length} store(s)</span>
              </div>
              {stores.length === 0 ? (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-snug">
                  No stores created yet. Create a store first in the <b>Stores</b> tab (e.g. <b>Store A – D-Ground</b>), then assign this polygon to it.
                </div>
              ) : (
                <select
                  value={zoneForm.assignedStoreId || ''}
                  onChange={(e) => setZoneForm({ ...zoneForm, assignedStoreId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                >
                  <option value="">-- Select Store (e.g. Store A – D-Ground) --</option>
                  {stores.map((s) => {
                    const sId = s.storeId || s._id;
                    const isAssigned = assignedStoresForSelectedZone.some((a) => (a.storeId || a._id) === sId);
                    return (
                      <option key={sId} value={sId}>
                        {s.name || s.branchName} ({s.city}) {isAssigned ? '✓ Currently Assigned' : ''}
                      </option>
                    );
                  })}
                </select>
              )}
              {assignedStoresForSelectedZone.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Currently serving:</span>
                  {assignedStoresForSelectedZone.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded-md text-[10px] font-bold"
                    >
                      {s.branchName || s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Save / Update Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-md shadow-emerald-950/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Validating & Saving...' : selectedZone ? 'Update Delivery Zone' : 'Save New Zone'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {zoneToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Delivery Zone?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-slate-800">{zoneToDelete.name}</span>? Customers inside this polygon will no longer be served unless covered by an overlapping zone.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                onClick={() => setZoneToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteZone}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Delete Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
