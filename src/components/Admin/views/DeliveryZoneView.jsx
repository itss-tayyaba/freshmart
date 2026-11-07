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
  Info,
  Edit3,
  Check,
  X,
  Undo2,
  MousePointer,
  ShieldCheck,
  RefreshCw,
  Copy,
  Building2,
  ExternalLink,
  Tag
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { switchMapTileLayer } from '../../../utils/mapTiles';
import { isSameTenant, resolveTenantId } from '../../../data/companyHierarchyData';
import { PAKISTAN_CITIES } from '../../../data/pakistanLocations';

// Custom SVG pin for Store Branch on Leaflet Map
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

export const DeliveryZoneView = ({ isSuperAdmin: propIsSuperAdmin = false, initialTenantId = null }) => {
  const {
    currentTenant,
    currentBranch,
    allBranches = [],
    BRANCHES = [],
    addToast,
    updateBranch,
    addBranch,
    deleteBranch,
    tenants = [],
    user,
    adminRole
  } = useStore();

  const isSuperAdmin = propIsSuperAdmin || (user?.role || adminRole || '').toLowerCase() === 'superadmin';

  // Available Retailers / Tenants list
  const allRetailers = useMemo(() => {
    const defaultMarts = [
      { id: 'tenant-freshmart', legacyId: 'company_004', name: 'Unimaart (FreshMart)', logo: '🥬', color: '#0284c7', city: 'Faisalabad' },
      { id: 'tenant-alfatah', legacyId: 'company_001', name: 'Al-Fatah Supermarket', logo: '🏬', color: '#991b1b', city: 'Lahore / Faisalabad' },
      { id: 'tenant-chaseup', legacyId: 'company_002', name: 'Chase Up Store', logo: '🏪', color: '#6b21a8', city: 'Karachi / Faisalabad' },
      { id: 'tenant-chasevalue', legacyId: 'company_003', name: 'Case Value', logo: '🛒', color: '#854d0e', city: 'Karachi / Faisalabad' }
    ];

    const registered = (tenants || []).map((t) => ({
      id: t.id,
      legacyId: t.legacyId || t.tenantId || t.id,
      name: t.displayName || t.name,
      logo: t.logo || '🏬',
      color: t.color || '#059669',
      city: t.city || 'Pakistan'
    }));

    const map = new Map();
    [...defaultMarts, ...registered].forEach((m) => {
      if (!map.has(m.id)) map.set(m.id, m);
    });
    return Array.from(map.values());
  }, [tenants]);

  // Selected Retailer State
  const [selectedTenantId, setSelectedTenantId] = useState(() => {
    if (initialTenantId) return initialTenantId;
    if (isSuperAdmin) return allRetailers[0]?.id || 'tenant-freshmart';
    return currentTenant?.id || 'tenant-freshmart';
  });

  const activeRetailer = useMemo(() => {
    return allRetailers.find((r) => isSameTenant(r.id, selectedTenantId)) || allRetailers[0];
  }, [allRetailers, selectedTenantId]);

  // Get branches belonging to selected retailer
  const tenantBranches = useMemo(() => {
    const list = (allBranches && allBranches.length > 0) ? allBranches : BRANCHES;
    return list.filter((b) => isSameTenant(b.tenantId, selectedTenantId) || isSameTenant(b.companyId, selectedTenantId));
  }, [allBranches, BRANCHES, selectedTenantId]);

  // Selected Branch ID
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    if (currentBranch?._id || currentBranch?.id) return currentBranch._id || currentBranch.id;
    return tenantBranches[0]?._id || tenantBranches[0]?.id || 'branch_default';
  });

  // Keep selected branch valid when retailer changes
  useEffect(() => {
    if (tenantBranches.length > 0) {
      if (currentBranch?._id || currentBranch?.id) {
        const matchesCurrent = tenantBranches.find(
          (b) => (b._id || b.id) === (currentBranch._id || currentBranch.id)
        );
        if (matchesCurrent) {
          setSelectedBranchId(matchesCurrent._id || matchesCurrent.id);
          return;
        }
      }
      const exists = tenantBranches.some((b) => (b._id || b.id) === selectedBranchId);
      if (!exists) {
        setSelectedBranchId(tenantBranches[0]._id || tenantBranches[0].id);
      }
    }
  }, [tenantBranches, selectedBranchId, currentBranch]);

  const activeBranch = useMemo(() => {
    const found = tenantBranches.find((b) => (b._id || b.id) === selectedBranchId);
    if (found) return found;
    if (tenantBranches.length > 0) return tenantBranches[0];

    return {
      _id: `branch_${selectedTenantId}_default`,
      id: `branch_${selectedTenantId}_default`,
      name: `${activeRetailer.name} Central Hub`,
      tenantId: selectedTenantId,
      city: 'Faisalabad',
      latitude: 31.4087,
      longitude: 73.1118,
      deliveryRadiusKm: 5,
      deliveryRadius: 5,
      deliveryStatus: 'active',
      deliveryTiers: [
        { distanceKm: 1, fee: 0 },
        { distanceKm: 2, fee: 50 },
        { distanceKm: 3, fee: 100 },
        { distanceKm: 5, fee: 150 }
      ],
      address: 'D-Ground Commercial Area, Faisalabad'
    };
  }, [tenantBranches, selectedBranchId, selectedTenantId, activeRetailer]);

  // Safe coordinate parser
  const getSafeCoord = (val, fallback) => {
    const num = Number(val);
    return Number.isFinite(num) && !isNaN(num) ? num : fallback;
  };

  // Form states
  const [branchName, setBranchName] = useState(activeBranch.name || '');
  const [branchCity, setBranchCity] = useState(activeBranch.city || 'Faisalabad');
  const [address, setAddress] = useState(activeBranch.address || '');
  const [lat, setLat] = useState(() => getSafeCoord(activeBranch.latitude, 31.4087));
  const [lng, setLng] = useState(() => getSafeCoord(activeBranch.longitude, 73.1118));
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
      { distanceKm: 5, fee: 150 }
    ];
  });

  // Custom Polygon Boundary State (Array of [lat, lng] pairs)
  const [polygonPoints, setPolygonPoints] = useState(() => {
    if (Array.isArray(activeBranch.deliveryPolygon) && activeBranch.deliveryPolygon.length >= 3) {
      const sanitized = [];
      activeBranch.deliveryPolygon.forEach((pt) => {
        let pLat, pLng;
        if (Array.isArray(pt)) {
          pLat = Number(pt[0]);
          pLng = Number(pt[1]);
        } else if (typeof pt === 'object' && pt !== null) {
          pLat = Number(pt.lat ?? pt.latitude);
          pLng = Number(pt.lng ?? pt.longitude);
        }
        if (Number.isFinite(pLat) && Number.isFinite(pLng) && !isNaN(pLat) && !isNaN(pLng)) {
          sanitized.push([pLat, pLng]);
        }
      });
      return sanitized;
    }
    return [];
  });

  // Map drawing mode: 'center' (pin store center) | 'polygon' (draw polygon boundary)
  const [mapDrawMode, setMapDrawMode] = useState('center');
  const [isSaving, setIsSaving] = useState(false);
  const [mapViewMode, setMapViewMode] = useState('street');
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);

  // New Zone Form State (for adding a new branch/zone)
  const [newZoneForm, setNewZoneForm] = useState({
    name: '',
    city: 'Faisalabad',
    address: '',
    latitude: 31.4125,
    longitude: 73.0995,
    deliveryRadiusKm: 5,
    phone: '+92 41 8541122'
  });

  // Leaflet references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const branchMarkerRef = useRef(null);
  const concentricCirclesRef = useRef([]);
  const polygonLayerRef = useRef(null);
  const vertexMarkersRef = useRef([]);

  // Sync internal state when active branch changes
  useEffect(() => {
    setBranchName(activeBranch.name || '');
    setBranchCity(activeBranch.city || 'Faisalabad');
    setAddress(activeBranch.address || '');
    setLat(getSafeCoord(activeBranch.latitude, 31.4087));
    setLng(getSafeCoord(activeBranch.longitude, 73.1118));
    setDeliveryRadiusKm(Number(activeBranch.deliveryRadiusKm || activeBranch.deliveryRadius || 5));
    setDeliveryStatus(activeBranch.deliveryStatus || 'active');
    setDeliveryTiers(
      Array.isArray(activeBranch.deliveryTiers) && activeBranch.deliveryTiers.length > 0
        ? activeBranch.deliveryTiers
        : [
            { distanceKm: 1, fee: 0 },
            { distanceKm: 2, fee: 50 },
            { distanceKm: 3, fee: 100 },
            { distanceKm: 5, fee: 150 }
          ]
    );
    if (Array.isArray(activeBranch.deliveryPolygon) && activeBranch.deliveryPolygon.length >= 3) {
      const sanitized = [];
      activeBranch.deliveryPolygon.forEach((pt) => {
        let pLat, pLng;
        if (Array.isArray(pt)) {
          pLat = Number(pt[0]);
          pLng = Number(pt[1]);
        } else if (typeof pt === 'object' && pt !== null) {
          pLat = Number(pt.lat ?? pt.latitude);
          pLng = Number(pt.lng ?? pt.longitude);
        }
        if (Number.isFinite(pLat) && Number.isFinite(pLng) && !isNaN(pLat) && !isNaN(pLng)) {
          sanitized.push([pLat, pLng]);
        }
      });
      setPolygonPoints(sanitized.length >= 3 ? sanitized : []);
    } else {
      setPolygonPoints([]);
    }
    setMapDrawMode('center');
  }, [activeBranch]);

  // Helper to reorder points around their geometric centroid into a clean non-crossing perimeter
  const untanglePoints = (pts) => {
    if (!pts || pts.length < 3) return pts;
    const cLat = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
    const cLng = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
    return [...pts].sort((a, b) => {
      const angleA = Math.atan2(a[0] - cLat, a[1] - cLng);
      const angleB = Math.atan2(b[0] - cLat, b[1] - cLng);
      return angleA - angleB;
    });
  };

  const handleUntanglePoints = () => {
    if (polygonPoints.length < 3) return;
    const clean = untanglePoints(polygonPoints);
    setPolygonPoints(clean);
    if (addToast) {
      addToast('Perimeter Untangled ✨', 'Boundary vertices aligned smoothly without crossing lines.', 'info');
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const safeMapLat = getSafeCoord(lat, 31.4087);
    const safeMapLng = getSafeCoord(lng, 73.1118);

    const map = L.map(mapContainerRef.current, {
      center: [safeMapLat, safeMapLng],
      zoom: 14,
      zoomControl: true
    });

    switchMapTileLayer(map, mapViewMode, tileLayerRef);

    const themeColor = activeRetailer?.color || '#059669';
    const marker = L.marker([safeMapLat, safeMapLng], {
      icon: createStoreBranchPin(branchName || 'Branch Hub', themeColor),
      draggable: true,
      zIndexOffset: 1000
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: inherit; font-size: 11px;">
        <strong style="color: #0f172a; font-size: 13px;">${branchName}</strong>
        <p style="margin: 3px 0 0; color: #475569;">${address || 'Store Delivery Hub'}</p>
        <div style="margin-top: 4px; font-weight: 700; color: #059669;">
          📍 Center GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}
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
  }, [selectedBranchId, selectedTenantId]);

  // Handle map clicks based on active drawing mode
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMapClick = (e) => {
      const clickedLat = Number(e.latlng.lat.toFixed(5));
      const clickedLng = Number(e.latlng.lng.toFixed(5));

      if (mapDrawMode === 'polygon') {
        // In Polygon mode: Add vertex to polygon
        setPolygonPoints((prev) => [...prev, [clickedLat, clickedLng]]);
      } else {
        // In Center Pin mode: Move Store Pin to clicked location
        setLat(clickedLat);
        setLng(clickedLng);
        if (branchMarkerRef.current) {
          branchMarkerRef.current.setLatLng([clickedLat, clickedLng]);
        }
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapDrawMode]);

  // Update Center Marker position when lat or lng change
  useEffect(() => {
    const sLat = getSafeCoord(lat, 31.4087);
    const sLng = getSafeCoord(lng, 73.1118);
    if (branchMarkerRef.current) {
      branchMarkerRef.current.setLatLng([sLat, sLng]);
    }
  }, [lat, lng]);

  // Render Concentric Radius Circles (when no custom polygon, or alongside polygon)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear previous circles
    concentricCirclesRef.current.forEach((c) => {
      try { map.removeLayer(c); } catch (e) {}
    });
    concentricCirclesRef.current = [];

    const themeColor = activeRetailer?.color || '#059669';
    const sortedTiers = [...deliveryTiers].sort((a, b) => a.distanceKm - b.distanceKm);

    // If custom polygon is drawn, render circles with softer dashed style
    const isPolyActive = polygonPoints.length >= 3;
    const sLat = getSafeCoord(lat, 31.4087);
    const sLng = getSafeCoord(lng, 73.1118);

    sortedTiers.forEach((tier, idx) => {
      const radiusMeters = Number(tier.distanceKm) * 1000;
      if (isNaN(radiusMeters) || radiusMeters <= 0) return;

      const circle = L.circle([sLat, sLng], {
        radius: radiusMeters,
        color: themeColor,
        weight: idx === sortedTiers.length - 1 ? (isPolyActive ? 1.5 : 2.5) : 1,
        dashArray: isPolyActive ? '4, 6' : (idx === sortedTiers.length - 1 ? null : '5, 5'),
        opacity: isPolyActive ? 0.35 : 0.7,
        fillColor: themeColor,
        fillOpacity: isPolyActive ? 0.04 : Math.min(0.22, 0.06 + idx * 0.04)
      }).addTo(map);

      circle.bindTooltip(`Radius ${tier.distanceKm} km • Fee: Rs. ${tier.fee}`, {
        sticky: true,
        className: 'concentric-radius-tooltip'
      });

      concentricCirclesRef.current.push(circle);
    });
  }, [lat, lng, deliveryTiers, activeRetailer, polygonPoints.length]);

  // Render Polygon Boundary & Corner Vertex Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old polygon layer and vertex handles
    if (polygonLayerRef.current) {
      try { map.removeLayer(polygonLayerRef.current); } catch (e) {}
      polygonLayerRef.current = null;
    }
    vertexMarkersRef.current.forEach((v) => {
      try { map.removeLayer(v); } catch (e) {}
    });
    vertexMarkersRef.current = [];

    const cleanPolyPoints = polygonPoints.filter(
      (pt) => Array.isArray(pt) && Number.isFinite(pt[0]) && Number.isFinite(pt[1]) && !isNaN(pt[0]) && !isNaN(pt[1])
    );

    if (cleanPolyPoints.length < 2) return;

    const themeColor = activeRetailer?.color || '#059669';

    if (cleanPolyPoints.length >= 3) {
      // Draw closed polygon
      const poly = L.polygon(cleanPolyPoints, {
        color: themeColor,
        weight: 3,
        fillColor: themeColor,
        fillOpacity: 0.28,
        dashArray: mapDrawMode === 'polygon' ? '6, 4' : null
      }).addTo(map);

      poly.bindTooltip(`${branchName} Custom Boundary Zone (${cleanPolyPoints.length} vertices)`, {
        sticky: true
      });
      polygonLayerRef.current = poly;
    } else if (cleanPolyPoints.length === 2) {
      // Draw temporary polyline while drawing
      const line = L.polyline(cleanPolyPoints, {
        color: themeColor,
        weight: 2.5,
        dashArray: '6, 4'
      }).addTo(map);
      polygonLayerRef.current = line;
    }

    // Add small interactive handles at each vertex
    cleanPolyPoints.forEach((pt, idx) => {
      const handle = L.circleMarker(pt, {
        radius: 6,
        color: '#ffffff',
        fillColor: themeColor,
        fillOpacity: 1,
        weight: 2
      }).addTo(map);

      handle.bindTooltip(`Point #${idx + 1}: ${pt[0].toFixed(4)}, ${pt[1].toFixed(4)}`, {
        direction: 'top'
      });
      vertexMarkersRef.current.push(handle);
    });
  }, [polygonPoints, activeRetailer, mapDrawMode, branchName]);

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
      addToast('Notice', 'At least one delivery pricing tier is required.', 'info');
      return;
    }
    setDeliveryTiers(deliveryTiers.filter((_, idx) => idx !== index));
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

  // Auto-generate a neat 4-point polygon box around the center pin
  const handleGenerateNeighborhoodPolygon = () => {
    const deltaLat = 0.025; // ~2.8 km north/south
    const deltaLng = 0.030; // ~2.9 km east/west
    const autoPoints = [
      [Number((lat + deltaLat).toFixed(5)), Number((lng - deltaLng).toFixed(5))], // NW
      [Number((lat + deltaLat).toFixed(5)), Number((lng + deltaLng).toFixed(5))], // NE
      [Number((lat - deltaLat).toFixed(5)), Number((lng + deltaLng).toFixed(5))], // SE
      [Number((lat - deltaLat).toFixed(5)), Number((lng - deltaLng).toFixed(5))]  // SW
    ];
    setPolygonPoints(autoPoints);
    addToast('Zone Polygon Generated 📐', 'A 4-point neighborhood boundary was generated around the store GPS center.');
  };

  const handleUndoPolygonPoint = () => {
    if (polygonPoints.length > 0) {
      setPolygonPoints(polygonPoints.slice(0, -1));
    }
  };

  const handleClearPolygon = () => {
    setPolygonPoints([]);
    setMapDrawMode('center');
    addToast('Polygon Cleared', 'Custom polygon boundary cleared. Zone will use circular coverage radius.');
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
      city: branchCity,
      address,
      latitude: Number(lat),
      longitude: Number(lng),
      deliveryRadiusKm: Math.max(Number(deliveryRadiusKm), maxTierDist),
      deliveryRadius: Math.max(Number(deliveryRadiusKm), maxTierDist),
      deliveryPolygon: polygonPoints && polygonPoints.length >= 3 ? polygonPoints : null,
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
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      addToast(
        'Delivery Zone Saved! 💾',
        `Successfully saved zone for ${branchName} (GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}${payload.deliveryPolygon ? ` • ${polygonPoints.length}-pt Polygon` : ''}).`
      );
    } catch (err) {
      Object.assign(activeBranch, payload);
      addToast(
        'Delivery Zone Saved! 💾',
        `Settings saved locally for ${branchName} (GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}${payload.deliveryPolygon ? ` • ${polygonPoints.length}-pt Polygon` : ''}).`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle creating a brand new delivery zone for the selected retailer
  const handleCreateNewZone = async (e) => {
    e.preventDefault();
    if (!newZoneForm.name.trim()) {
      addToast('Validation', 'Please provide a name for this delivery zone hub.', 'error');
      return;
    }

    const newId = `branch_${Date.now()}`;
    const newBranchObj = {
      _id: newId,
      id: newId,
      name: newZoneForm.name.trim(),
      tenantId: selectedTenantId,
      companyId: resolveTenantId(selectedTenantId) || selectedTenantId,
      city: newZoneForm.city,
      address: newZoneForm.address || `${newZoneForm.city} Store Hub`,
      latitude: Number(newZoneForm.latitude || lat),
      longitude: Number(newZoneForm.longitude || lng),
      phone: newZoneForm.phone,
      deliveryRadiusKm: Number(newZoneForm.deliveryRadiusKm || 5),
      deliveryRadius: Number(newZoneForm.deliveryRadiusKm || 5),
      deliveryStatus: 'active',
      status: 'active',
      deliveryTiers: [
        { distanceKm: 1, fee: 0 },
        { distanceKm: 2, fee: 50 },
        { distanceKm: 3, fee: 100 },
        { distanceKm: 5, fee: 150 }
      ]
    };

    if (typeof addBranch === 'function') {
      await addBranch(newBranchObj);
    }
    setSelectedBranchId(newId);
    setIsAddZoneModalOpen(false);
    addToast('Zone Created! 🏬', `${newBranchObj.name} in ${newBranchObj.city} is now ready to configure.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Super Admin Retailer Selection & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {isSuperAdmin ? 'Super Admin Zone Control' : 'Store Admin'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-1">
            <MapPin className="w-6 h-6 text-emerald-600" />
            <span>Retailer Delivery Zones & Coverage Map</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Draw custom delivery polygons, pinpoint center GPS coordinates, and configure tiered delivery pricing for every supermarket.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Toggle: Store Active / Paused */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className={`w-2 h-2 rounded-full ${deliveryStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {deliveryStatus === 'active' ? 'Zone Open & Delivering' : 'Zone Paused'}
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

          {/* Add Delivery Zone Button */}
          <button
            type="button"
            onClick={() => {
              setNewZoneForm({
                name: `${activeRetailer.name} Hub #${tenantBranches.length + 1}`,
                city: 'Faisalabad',
                address: '',
                latitude: Number(lat.toFixed(5)),
                longitude: Number(lng.toFixed(5)),
                deliveryRadiusKm: 5,
                phone: '+92 41 8541122'
              });
              setIsAddZoneModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Delivery Zone</span>
          </button>
        </div>
      </div>

      {/* 🏬 SUPER ADMIN RETAILER SELECTOR */}
      {isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Retailer Supermarket:
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Super Admin can create & edit delivery zones for each supermarket chain
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {allRetailers.map((ret) => {
              const isSelected = isSameTenant(ret.id, selectedTenantId);
              const branchCount = (allBranches || BRANCHES).filter((b) => isSameTenant(b.tenantId, ret.id)).length;
              return (
                <button
                  key={ret.id}
                  type="button"
                  onClick={() => setSelectedTenantId(ret.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className="text-xl shrink-0">{ret.logo}</span>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs truncate block">{ret.name}</span>
                    <span className="text-[10px] opacity-75 block truncate">
                      {branchCount} {branchCount === 1 ? 'Zone Hub' : 'Zone Hubs'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 📍 RETAILER BRANCH / ZONE TABS */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {activeRetailer.name} Delivery Hubs:
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {tenantBranches.map((b) => {
            const bId = b._id || b.id;
            const isCurr = bId === selectedBranchId;
            return (
              <button
                key={bId}
                type="button"
                onClick={() => setSelectedBranchId(bId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCurr
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>📍 {b.name}</span>
                <span className="text-[10px] opacity-80">({b.city || 'Hub'})</span>
                {Array.isArray(b.deliveryPolygon) && b.deliveryPolygon.length >= 3 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Custom Polygon Boundary Set" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🗺️ MAIN GRID: Interactive Map on Left | Pricing & Coordinates Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Leaflet Map with Drawing Toolbar */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Map Header & Drawing Mode Toggles */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                Interactive Map & Polygon Drawing
              </span>
            </div>

            {/* Drawing Tool Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMapDrawMode('center')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  mapDrawMode === 'center'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Click or drag pin to position store center GPS"
              >
                <MousePointer className="w-3 h-3" />
                <span>Store Pin</span>
              </button>

              <button
                type="button"
                onClick={() => setMapDrawMode('polygon')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  mapDrawMode === 'polygon'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Click on the map to place boundary vertices for a custom polygon zone"
              >
                <Edit3 className="w-3 h-3" />
                <span>Draw Polygon</span>
              </button>
            </div>
          </div>

          {/* Polygon Drawing Control Bar (Shown when drawing polygon) */}
          {mapDrawMode === 'polygon' ? (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  Drawing Mode: Click on the map to add polygon corners ({polygonPoints.length} vertices)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUndoPolygonPoint}
                  disabled={polygonPoints.length === 0}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 text-amber-900 dark:text-amber-200 font-bold text-[11px] hover:bg-amber-100 transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateNeighborhoodPolygon}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition cursor-pointer"
                >
                  Auto-Box
                </button>
                <button
                  type="button"
                  onClick={() => setMapDrawMode('center')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Done</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearPolygon}
                  className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                  title="Clear polygon"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : polygonPoints.length >= 3 ? (
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Custom Boundary Polygon Active ({polygonPoints.length} vertices)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMapDrawMode('polygon')}
                  className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Edit Points
                </button>
                <button
                  type="button"
                  onClick={handleClearPolygon}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Reset to Radius
                </button>
              </div>
            </div>
          ) : null}

          {/* Leaflet Map Canvas */}
          <div className="rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 relative isolate">
            <div ref={mapContainerRef} className="w-full h-84 sm:h-96 z-0" />

            {/* Floating Coordinate Pill */}
            <div className="absolute bottom-2 left-2 z-[1000] bg-slate-900/90 text-white text-[10px] font-mono px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                {branchName}: {lat.toFixed(5)}°N, {lng.toFixed(5)}°E
              </span>
            </div>

            {/* Map Layer Mode buttons */}
            <div className="absolute top-2 right-2 z-[1000] flex items-center bg-white/90 dark:bg-slate-900/90 rounded-xl p-0.5 shadow-md text-[10px] font-bold">
              <button
                type="button"
                onClick={() => handleLayerChange('street')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  mapViewMode === 'street' ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                Street
              </button>
              <button
                type="button"
                onClick={() => handleLayerChange('satellite')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  mapViewMode === 'satellite' ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                Satellite
              </button>
            </div>
          </div>

          {/* Quick Coordinates & Hub Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Store Latitude (°N)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value) || lat)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Store Longitude (°E)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value) || lng)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Operating City
              </label>
              <select
                value={branchCity}
                onChange={(e) => setBranchCity(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
              >
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c.id} value={c.city}>
                    {c.city} ({c.province})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Branch / Hub Label
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
                Physical Street Address
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

        {/* Right Column: Distance, Concentric Pricing Tiers & Actions */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Distance & Delivery Fee Pricing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pricing applies by distance from store center GPS ({lat.toFixed(4)}, {lng.toFixed(4)})
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              {deliveryTiers.length} Pricing Tiers
            </span>
          </div>

          {/* Table: Distance (km) | Delivery Fee (Rs.) | Actions */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-black">
                  <th className="py-2.5 px-3">Distance (km)</th>
                  <th className="py-2.5 px-3">Delivery Fee</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                {deliveryTiers.map((tier, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={tier.distanceKm}
                          onChange={(e) => handleTierChange(idx, 'distanceKm', e.target.value)}
                          className="w-16 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-slate-400 text-[11px]">km</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-[11px]">Rs.</span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={tier.fee}
                          onChange={(e) => handleTierChange(idx, 'fee', e.target.value)}
                          className="w-20 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons: [+ Add Tier] [Save Delivery Zone] */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddTier}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Radius Tier</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDeliveryZone}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-950/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save & Activate Delivery Zone'}</span>
            </button>
          </div>

          {/* Live Zone Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider text-[10px]">
              Active Zone Summary
            </span>
            <div className="space-y-1 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
              <div className="flex items-center justify-between">
                <span>Retailer:</span>
                <strong className="text-slate-900 dark:text-white">{activeRetailer.name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>GPS Location:</span>
                <strong className="font-mono text-slate-900 dark:text-white">{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Boundary Type:</span>
                <strong className={polygonPoints.length >= 3 ? 'text-amber-600' : 'text-emerald-600'}>
                  {polygonPoints.length >= 3 ? `Custom Polygon (${polygonPoints.length} vertices)` : `Circular Radius (${deliveryRadiusKm} km)`}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Customer Landing Visibility:</span>
                <strong className="text-emerald-600">
                  {deliveryStatus === 'active' ? '✅ Appears on Landing Page for in-zone customers' : '⏸️ Paused (Hidden)'}
                </strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 🚀 MODAL: Create New Retailer Delivery Zone */}
      {isAddZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Create New Delivery Zone / Store Hub
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddZoneModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewZone} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Retailer Supermarket
                </label>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>{activeRetailer.logo}</span>
                  <span>{activeRetailer.name}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Zone / Hub Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Model Town Express Hub"
                  value={newZoneForm.name}
                  onChange={(e) => setNewZoneForm({ ...newZoneForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    City
                  </label>
                  <select
                    value={newZoneForm.city}
                    onChange={(e) => setNewZoneForm({ ...newZoneForm, city: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 font-bold text-slate-900 dark:text-white"
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c.id} value={c.city}>
                        {c.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Default Radius (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newZoneForm.deliveryRadiusKm}
                    onChange={(e) => setNewZoneForm({ ...newZoneForm, deliveryRadiusKm: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Latitude (°N)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newZoneForm.latitude}
                    onChange={(e) => setNewZoneForm({ ...newZoneForm, latitude: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Longitude (°E)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newZoneForm.longitude}
                    onChange={(e) => setNewZoneForm({ ...newZoneForm, longitude: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Physical Street Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Commercial Market, Sector B"
                  value={newZoneForm.address}
                  onChange={(e) => setNewZoneForm({ ...newZoneForm, address: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddZoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer"
                >
                  Create & Launch Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
