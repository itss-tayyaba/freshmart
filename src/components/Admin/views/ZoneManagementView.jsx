import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Undo2,
  RefreshCw,
  Search,
  Store,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Sliders,
  Building2,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';
import { getAllUnifiedStores, CORE_RETAILERS } from '../../../utils/storeHelper';
import { isPointInPolygon, normalizeLatLng } from '../../../utils/distanceCalculator';

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

// Color presets for polygons (matching image 2 blue, green, orange pentagons)
const POLYGON_COLORS = [
  { color: '#2563eb', label: 'Blue', border: 'border-blue-600', bg: 'bg-blue-500' },
  { color: '#16a34a', label: 'Green', border: 'border-emerald-600', bg: 'bg-emerald-500' },
  { color: '#ea580c', label: 'Orange', border: 'border-amber-600', bg: 'bg-amber-500' },
  { color: '#8b5cf6', label: 'Purple', border: 'border-purple-600', bg: 'bg-purple-500' },
  { color: '#06b6d4', label: 'Cyan', border: 'border-cyan-600', bg: 'bg-cyan-500' },
  { color: '#e11d48', label: 'Rose', border: 'border-rose-600', bg: 'bg-rose-500' }
];

export const ZoneManagementView = () => {
  const { allBranches = [], addToast } = useStore();

  // State
  const [zones, setZones] = useState([]);
  const [stores, setStores] = useState(() => getAllUnifiedStores([], allBranches));
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [polygonViewFilter, setPolygonViewFilter] = useState('all'); // 'all' | 'selected'

  // Drawing & Editing State
  // Mode: 'view' | 'draw' | 'edit'
  const [mapMode, setMapMode] = useState('view');
  const mapModeRef = useRef(mapMode);
  useEffect(() => {
    mapModeRef.current = mapMode;
  }, [mapMode]);

  const [drawnVertices, setDrawnVertices] = useState([]); // Array of [lat, lng]
  const [activePolygonColor, setActivePolygonColor] = useState('#2563eb');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState(null);

  // Save Modal Form State
  const [modalForm, setModalForm] = useState({
    zoneId: '',
    name: '',
    city: 'Faisalabad',
    area: '',
    color: '#2563eb'
  });

  // Map Tile & Geocoding State
  const [tileLayerType, setTileLayerType] = useState('osm'); // 'osm' | 'satellite' | 'carto'
  const [geocodingQuery, setGeocodingQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showStoreMarkers, setShowStoreMarkers] = useState(true);

  // Map DOM & Layer Group Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const polygonsLayerGroupRef = useRef(null);
  const storeMarkersGroupRef = useRef(null);
  const drawingLayerGroupRef = useRef(null);

  // Retailer helper
  const getRetailerInfo = (tenantId) => {
    const t = String(tenantId || '').toLowerCase();
    return (
      CORE_RETAILERS.find(
        (r) =>
          t.includes(r.id.replace('tenant-', '')) ||
          (r.id === 'tenant-unimart' && (t.includes('freshmart') || t.includes('unimart')))
      ) || { name: 'Retailer', color: '#059669', logo: '🏬' }
    );
  };

  // Helper to extract polygon LatLng array from any zone object
  const getZonePolygonLatLngs = (zone) => {
    if (!zone) return [];
    const rawRing = zone.geometry?.coordinates?.[0] || zone.coordinates?.[0] || zone.coordinates;
    if (!Array.isArray(rawRing) || rawRing.length < 3) return [];
    return rawRing
      .map((pt) => {
        const norm = normalizeLatLng(pt);
        return norm ? [norm.lat, norm.lng] : null;
      })
      .filter(Boolean);
  };

  // Helper to find all stores physically lying inside a polygon
  const getStoresInPolygon = (polyLatLngs, storeList = stores) => {
    if (!Array.isArray(polyLatLngs) || polyLatLngs.length < 3 || !Array.isArray(storeList)) return [];
    return storeList.filter((s) => {
      const sLat = Number(s.latitude ?? s.coordinates?.lat);
      const sLng = Number(s.longitude ?? s.coordinates?.lng);
      return Number.isFinite(sLat) && Number.isFinite(sLng) && isPointInPolygon({ lat: sLat, lng: sLng }, polyLatLngs);
    });
  };

  // Fetch all Zones & Stores
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [zonesRes, storesRes] = await Promise.all([
        apiService.getZones(),
        apiService.getStores()
      ]);

      if (zonesRes && zonesRes.success && Array.isArray(zonesRes.zones)) {
        setZones(zonesRes.zones);
        if (zonesRes.zones.length > 0 && !selectedZoneId) {
          setSelectedZoneId(zonesRes.zones[0].zoneId || zonesRes.zones[0]._id);
        }
      }

      const cleanStores = getAllUnifiedStores(storesRes?.stores, allBranches);
      setStores(cleanStores);
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

  // Real-time synchronization
  useEffect(() => {
    const handleStoresUpdated = () => {
      setStores(getAllUnifiedStores([], allBranches));
    };
    const handleZonesUpdated = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setZones(e.detail);
      } else {
        fetchData();
      }
    };
    window.addEventListener('freshmart_stores_updated', handleStoresUpdated);
    window.addEventListener('freshmart_zones_updated', handleZonesUpdated);
    return () => {
      window.removeEventListener('freshmart_stores_updated', handleStoresUpdated);
      window.removeEventListener('freshmart_zones_updated', handleZonesUpdated);
    };
  }, [allBranches]);

  // Real-time stores detected inside currently drawn vertices
  const cleanDrawnVertices = useMemo(() => {
    if (drawnVertices.length < 3) return drawnVertices;
    return hasCrossingSegments(drawnVertices) ? untanglePolygonPoints(drawnVertices) : drawnVertices;
  }, [drawnVertices]);

  const storesInsideDrawing = useMemo(() => {
    if (cleanDrawnVertices.length < 3) return [];
    return getStoresInPolygon(cleanDrawnVertices, stores);
  }, [cleanDrawnVertices, stores]);

  // Check which stores are ungrouped (not lying inside ANY configured polygon)
  const ungroupedStores = useMemo(() => {
    if (zones.length === 0) return stores;
    return stores.filter((store) => {
      const sLat = Number(store.latitude ?? store.coordinates?.lat);
      const sLng = Number(store.longitude ?? store.coordinates?.lng);
      if (!Number.isFinite(sLat) || !Number.isFinite(sLng)) return false;

      // Check against all zones
      for (const z of zones) {
        const polyPts = getZonePolygonLatLngs(z);
        if (polyPts.length >= 3 && isPointInPolygon({ lat: sLat, lng: sLng }, polyPts)) {
          return false;
        }
      }
      return true;
    });
  }, [zones, stores]);

  // Statistics
  const statistics = useMemo(() => {
    const totalPolygons = zones.length;
    const totalStores = stores.length;
    const groupedStoresCount = totalStores - ungroupedStores.length;
    return {
      totalPolygons,
      totalStores,
      groupedStoresCount,
      ungroupedCount: ungroupedStores.length
    };
  }, [zones, stores, ungroupedStores]);

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
      center: [31.4145, 73.1095], // Faisalabad center
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

    mapInstanceRef.current = map;

    // Handle map click during Drawing mode
    map.on('click', (e) => {
      if (mapModeRef.current !== 'draw') return;
      const roundedLat = Number(e.latlng.lat.toFixed(6));
      const roundedLng = Number(e.latlng.lng.toFixed(6));

      setDrawnVertices((prev) => {
        const next = [...prev, [roundedLat, roundedLng]];
        if (next.length >= 3 && hasCrossingSegments(next)) {
          return untanglePolygonPoints(next);
        }
        return next;
      });
    });

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

  // Render Saved Colored Store Area Polygons on Map (Clean, non-cluttering)
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonsLayerGroupRef.current) return;
    polygonsLayerGroupRef.current.clearLayers();

    zones.forEach((z) => {
      const latLngs = getZonePolygonLatLngs(z);
      if (latLngs.length < 3) return;

      const zKey = z.zoneId || z._id;
      const isSelected = selectedZoneId === zKey;

      // Filter: if user chose to view only the active polygon, hide other polygons for maximum clarity
      if (polygonViewFilter === 'selected' && selectedZoneId && !isSelected) return;

      const color = z.color || '#2563eb';
      const insideStores = getStoresInPolygon(latLngs, stores);

      const polygon = L.polygon(latLngs, {
        color: color,
        weight: isSelected ? 3.5 : 2.2,
        fillColor: color,
        fillOpacity: isSelected ? 0.32 : 0.16,
        dashArray: isSelected ? null : null
      });

      const storesListHtml =
        insideStores.length > 0
          ? insideStores
              .map((s) => {
                const ret = getRetailerInfo(s.tenantId);
                return `<li style="margin-top: 3px; display: flex; align-items: center; gap: 4px;">
                  <span>${ret.logo}</span>
                  <strong>${s.branchName || s.name}</strong>
                </li>`;
              })
              .join('')
          : '<li style="color: #94a3b8; font-style: italic;">No stores currently inside</li>';

      // Clean tooltip that follows mouse on hover (NO permanent dark bars on map)
      polygon.bindTooltip(
        `<div style="font-family: inherit; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 5px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
          <span>${z.name}</span>
          <span style="background: ${color}25; color: ${color}; padding: 1px 6px; border-radius: 9999px; font-size: 10px; font-weight: 900;">${insideStores.length} Stores</span>
        </div>`,
        { sticky: true, opacity: 0.95 }
      );

      polygon.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 190px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #0f172a; font-size: 13px;">${z.name}</strong>
            <span style="font-size: 10px; background: ${color}25; color: ${color}; padding: 2px 7px; border-radius: 9999px; font-weight: 800;">
              ${insideStores.length} Stores Inside
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
            ${z.city || 'Faisalabad'}${z.area ? ` • ${z.area}` : ''}
          </div>
          <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">
            Stores In This Polygon:
          </div>
          <ul style="margin: 0; padding-left: 14px; font-size: 11px; color: #1e293b; max-height: 120px; overflow-y: auto;">
            ${storesListHtml}
          </ul>
        </div>
      `);

      polygon.on('click', () => {
        if (mapModeRef.current === 'draw') return;
        setSelectedZoneId(zKey);
      });

      polygonsLayerGroupRef.current.addLayer(polygon);
    });
  }, [zones, selectedZoneId, stores, polygonViewFilter]);

  // Render Store Pins on Map (Compact, non-overlapping design)
  useEffect(() => {
    if (!mapInstanceRef.current || !storeMarkersGroupRef.current) return;
    storeMarkersGroupRef.current.clearLayers();

    if (!showStoreMarkers) return;

    stores.forEach((store) => {
      const lat = Number(store.latitude ?? store.coordinates?.lat);
      const lng = Number(store.longitude ?? store.coordinates?.lng);
      if (isNaN(lat) || isNaN(lng) || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const retailer = getRetailerInfo(store.tenantId);

      const pinIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="width: 30px; height: 30px; border-radius: 50%; background: ${retailer.color}; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
              ${retailer.logo}
            </div>
            <div style="margin-top: 2px; padding: 1px 6px; border-radius: 9999px; background: rgba(15, 23, 42, 0.92); color: white; font-size: 9px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.25); max-width: 95px; overflow: hidden; text-overflow: ellipsis;">
              ${store.branchName || store.name}
            </div>
          </div>
        `,
        iconSize: [30, 46],
        iconAnchor: [15, 38]
      });

      const marker = L.marker([lat, lng], { icon: pinIcon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 180px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="font-size: 16px;">${retailer.logo}</span>
            <strong style="color: ${retailer.color}; font-size: 13px;">${store.name}</strong>
          </div>
          <p style="color: #64748b; font-size: 11px; margin: 2px 0 6px 0;">${store.address}</p>
          <div style="font-size: 10px; color: #475569; font-family: monospace;">
            GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
        </div>
      `);

      marker.on('click', (e) => {
        if (mapModeRef.current === 'draw') {
          const { lat: mLat, lng: mLng } = e.latlng;
          setDrawnVertices((prev) => [...prev, [Number(mLat.toFixed(6)), Number(mLng.toFixed(6))]]);
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

    const cleanVertices = cleanDrawnVertices;

    // Draw lines connecting points
    if (cleanVertices.length >= 2) {
      const loop = cleanVertices.length >= 3 ? [...cleanVertices, cleanVertices[0]] : cleanVertices;
      const line = L.polyline(loop, {
        color: activePolygonColor,
        weight: 3.5,
        dashArray: mapMode === 'draw' ? '6, 6' : null
      });
      drawingLayerGroupRef.current.addLayer(line);

      // Filled polygon preview if 3+ vertices
      if (cleanVertices.length >= 3) {
        const previewPoly = L.polygon(cleanVertices, {
          color: activePolygonColor,
          weight: 2,
          fillColor: activePolygonColor,
          fillOpacity: 0.3
        });
        drawingLayerGroupRef.current.addLayer(previewPoly);
      }
    }

    // Draw vertex handles
    cleanVertices.forEach(([vLat, vLng], idx) => {
      const isFirst = idx === 0;
      const handleIcon = L.divIcon({
        className: 'vertex-handle',
        html: `
          <div style="width: 22px; height: 22px; border-radius: 9999px; background: ${isFirst ? '#059669' : activePolygonColor}; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; color: #ffffff; cursor: ${mapMode === 'edit' ? 'grab' : 'pointer'};">
            ${idx + 1}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([vLat, vLng], {
        icon: handleIcon,
        draggable: mapMode === 'edit'
      });

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
  }, [drawnVertices, cleanDrawnVertices, mapMode, activePolygonColor]);

  // Geocoding Search: Center map on Pakistani landmark or address
  const handleGeocodingSearch = async (e) => {
    e.preventDefault();
    if (!geocodingQuery.trim()) return;

    setIsGeocoding(true);
    try {
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
        if (addToast) addToast(`Could not find "${geocodingQuery}". Try another location.`, 'error');
      }
    } catch (err) {
      if (addToast) addToast('Geocoding service unavailable.', 'error');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Start Drawing Mode
  const handleStartDraw = () => {
    setMapMode('draw');
    setDrawnVertices([]);
    setActivePolygonColor('#2563eb');
    if (drawingLayerGroupRef.current) drawingLayerGroupRef.current.clearLayers();
    if (addToast) {
      addToast(
        'Draw Mode Active ✏️',
        'Click on the map around the stores to place polygon boundary points (at least 3 points).',
        'info'
      );
    }
  };

  // Undo Last Point
  const handleUndoVertex = () => {
    if (drawnVertices.length > 0) {
      setDrawnVertices((prev) => prev.slice(0, -1));
    }
  };

  // Clear Drawn Points
  const handleClearDrawing = () => {
    setDrawnVertices([]);
    if (drawingLayerGroupRef.current) drawingLayerGroupRef.current.clearLayers();
    if (addToast) addToast('Drawing cleared.', 'info');
  };

  // Cancel Drawing
  const handleCancelDrawing = () => {
    setMapMode('view');
    setDrawnVertices([]);
    if (drawingLayerGroupRef.current) drawingLayerGroupRef.current.clearLayers();
  };

  // Open Save Modal
  const handleOpenSaveModal = () => {
    if (cleanDrawnVertices.length < 3) {
      if (addToast) addToast('Missing Vertices', 'Place at least 3 points on the map to form a valid polygon.', 'warning');
      return;
    }

    const defaultName = `Store Area Polygon ${zones.length + 1}`;
    setModalForm({
      zoneId: `ZONE-FSD-${Date.now().toString().slice(-4)}`,
      name: defaultName,
      city: 'Faisalabad',
      area: '',
      color: activePolygonColor || '#2563eb'
    });
    setIsSaveModalOpen(true);
  };

  // Save Store Area Polygon & Automatically Link Stores Lying Inside
  const handleConfirmSavePolygon = async (e) => {
    if (e) e.preventDefault();

    if (!modalForm.name.trim()) {
      if (addToast) addToast('Name Required', 'Please provide a name for this store area polygon.', 'error');
      return;
    }

    if (cleanDrawnVertices.length < 3) {
      if (addToast) addToast('Invalid Polygon', 'At least 3 vertices are required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const cleanVertices = untanglePolygonPoints(cleanDrawnVertices);

      // GeoJSON ring: [[lng, lat], ...]
      const ring = cleanVertices.map(([lat, lng]) => [
        Number(Number(lng).toFixed(6)),
        Number(Number(lat).toFixed(6))
      ]);
      // Ensure closed linear ring
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }

      const generatedCode = `Z-${Date.now().toString().slice(-3)}`;
      const payload = {
        zoneId: modalForm.zoneId || `ZONE-FSD-${Date.now().toString().slice(-4)}`,
        name: modalForm.name.trim(),
        code: generatedCode,
        city: modalForm.city.trim() || 'Faisalabad',
        area: modalForm.area.trim() || modalForm.name.trim(),
        color: modalForm.color,
        description: `Store area polygon grouping ${storesInsideDrawing.length} store(s).`,
        isActive: true,
        status: 'active',
        coordinates: [ring],
        geometry: {
          type: 'Polygon',
          coordinates: [ring]
        }
      };

      // 1. Save polygon via API / LocalStorage
      const res = await apiService.createZone(payload);

      // 2. Automatically link all stores that physically lie inside this polygon
      const insideStoreIds = storesInsideDrawing.map((s) => s.storeId || s._id).filter(Boolean);
      if (insideStoreIds.length > 0) {
        try {
          await apiService.assignStoresToZone(payload.zoneId, insideStoreIds);
        } catch (e) {
          console.warn('Store assignment link warning:', e.message);
        }

        // Update freshmart_branches in localStorage
        try {
          const savedBranches = localStorage.getItem('freshmart_branches');
          const branchList = savedBranches ? JSON.parse(savedBranches) : (allBranches || []);
          const updated = branchList.map((b) => {
            const bId = String(b._id || b.id || '').toLowerCase().trim();
            const bStoreId = String(b.storeId || '').toLowerCase().trim();
            const isInside = insideStoreIds.some((id) => {
              const cleanId = String(id).toLowerCase().trim();
              return cleanId === bId || cleanId === bStoreId;
            });
            if (isInside) {
              return {
                ...b,
                assignedZoneId: payload.zoneId,
                deliveryPolygon: cleanVertices
              };
            }
            return b;
          });
          localStorage.setItem('freshmart_branches', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('freshmart_branches_updated', { detail: updated }));
          window.dispatchEvent(new CustomEvent('freshmart_stores_updated'));
        } catch (err) {}
      }

      if (addToast) {
        addToast(
          'Store Area Polygon Saved! ⬡',
          `"${payload.name}" successfully created with ${storesInsideDrawing.length} stores inside!`,
          'success'
        );
      }

      setIsSaveModalOpen(false);
      setMapMode('view');
      setDrawnVertices([]);
      setSelectedZoneId(payload.zoneId);
      fetchData();
    } catch (err) {
      if (addToast) addToast('Save Failed', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Edit / Redraw existing zone on map
  const handleEditZoneOnMap = (zone) => {
    const latLngs = getZonePolygonLatLngs(zone);
    if (latLngs.length < 3) return;

    setSelectedZoneId(zone.zoneId || zone._id);
    setActivePolygonColor(zone.color || '#2563eb');
    setDrawnVertices(latLngs);
    setMapMode('edit');

    // Pan map to polygon bounds
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds(latLngs);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    if (addToast) {
      addToast(
        `Editing "${zone.name}" ✏️`,
        'Drag the vertex handles on the map to adjust boundaries, then click "Save Changes".',
        'info'
      );
    }
  };

  // Save changes to edited zone
  const handleSaveEditedZone = async () => {
    if (!selectedZoneId || cleanDrawnVertices.length < 3) return;

    const currentZone = zones.find((z) => (z.zoneId || z._id) === selectedZoneId);
    if (!currentZone) return;

    setIsSaving(true);
    try {
      const cleanVertices = untanglePolygonPoints(cleanDrawnVertices);
      const ring = cleanVertices.map(([lat, lng]) => [
        Number(Number(lng).toFixed(6)),
        Number(Number(lat).toFixed(6))
      ]);
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }

      const updatedPayload = {
        ...currentZone,
        coordinates: [ring],
        geometry: {
          type: 'Polygon',
          coordinates: [ring]
        }
      };

      await apiService.updateZone(selectedZoneId, updatedPayload);

      // Re-link stores inside newly adjusted boundary
      const newlyInsideStores = getStoresInPolygon(cleanVertices, stores);
      const newlyInsideIds = newlyInsideStores.map((s) => s.storeId || s._id).filter(Boolean);
      if (newlyInsideIds.length > 0) {
        try {
          await apiService.assignStoresToZone(selectedZoneId, newlyInsideIds);
        } catch (e) {}
      }

      if (addToast) {
        addToast(
          'Polygon Updated! ✨',
          `"${currentZone.name}" boundary updated with ${newlyInsideStores.length} stores inside.`,
          'success'
        );
      }

      setMapMode('view');
      setDrawnVertices([]);
      fetchData();
    } catch (err) {
      if (addToast) addToast('Update Failed', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Clean slate & Reset to 3 Non-Overlapping Master Regional Polygons (Blue, Green, Orange)
  const handleResetToThreeCleanSectors = async () => {
    setIsSaving(true);
    try {
      // 1. Wipe out previous cluttered/overlapping test zones
      localStorage.setItem('freshmart_zones', JSON.stringify([]));
      localStorage.setItem('freshmart_assignments', JSON.stringify([]));

      for (const z of zones) {
        try {
          await apiService.deleteZone(z.zoneId || z._id);
        } catch (e) {}
      }

      // 2. Define 3 clean non-overlapping regional sectors matching reference image
      const cleanPresets = [
        {
          zoneId: 'ZONE-FSD-CENTRAL-BLUE',
          name: 'Central Region (D-Ground & Peoples Colony)',
          code: 'FSD-BLUE',
          city: 'Faisalabad',
          area: 'Peoples Colony & D-Ground',
          color: '#2563eb', // Vivid Blue
          description: 'Central Commercial Area grouping flagship supermarket branches.',
          isActive: true,
          status: 'active',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [73.075, 31.425],
              [73.110, 31.425],
              [73.110, 31.402],
              [73.075, 31.402],
              [73.075, 31.425]
            ]]
          }
        },
        {
          zoneId: 'ZONE-FSD-NORTH-GREEN',
          name: 'North-East Region (Susan Road & Canal Road)',
          code: 'FSD-GREEN',
          city: 'Faisalabad',
          area: 'Susan Road & Madina Town',
          color: '#16a34a', // Vivid Green
          description: 'North-East Commercial Region covering Canal Road and Susan Road marts.',
          isActive: true,
          status: 'active',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [73.110, 31.445],
              [73.145, 31.445],
              [73.145, 31.415],
              [73.110, 31.415],
              [73.110, 31.445]
            ]]
          }
        },
        {
          zoneId: 'ZONE-FSD-WEST-ORANGE',
          name: 'West-South Region (Samanabad & Clock Tower)',
          code: 'FSD-ORANGE',
          city: 'Faisalabad',
          area: 'Samanabad & Clock Tower',
          color: '#ea580c', // Vivid Orange
          description: 'West-South Commercial Region covering Clock Tower and Samanabad marts.',
          isActive: true,
          status: 'active',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [73.045, 31.402],
              [73.075, 31.402],
              [73.075, 31.375],
              [73.045, 31.375],
              [73.045, 31.402]
            ]]
          }
        }
      ];

      for (const p of cleanPresets) {
        await apiService.createZone(p);
        const polyLatLngs = getZonePolygonLatLngs(p);
        const inStores = getStoresInPolygon(polyLatLngs, stores);
        const inIds = inStores.map((s) => s.storeId || s._id).filter(Boolean);
        if (inIds.length > 0) {
          try {
            await apiService.assignStoresToZone(p.zoneId, inIds);
          } catch (e) {}
        }
      }

      localStorage.setItem('freshmart_zones', JSON.stringify(cleanPresets));
      window.dispatchEvent(new CustomEvent('freshmart_zones_updated', { detail: cleanPresets }));

      setZones(cleanPresets);
      setSelectedZoneId(cleanPresets[0].zoneId);
      setDrawnVertices([]);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([31.4145, 73.095], 13);
      }

      if (addToast) {
        addToast(
          'Clean Slate Applied! ✨',
          'Cleared overlapping test zones. Established 3 master non-overlapping regional sectors (Blue, Green, Orange).',
          'success'
        );
      }
    } catch (err) {
      if (addToast) addToast('Clean Reset Failed', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Clear all polygons for a blank slate
  const handleClearAllPolygons = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('freshmart_zones', JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('freshmart_zones_updated', { detail: [] }));
      for (const z of zones) {
        try {
          await apiService.deleteZone(z.zoneId || z._id);
        } catch (e) {}
      }
      setZones([]);
      setSelectedZoneId(null);
      setDrawnVertices([]);
      if (addToast) addToast('All polygons cleared. Map is completely clean.', 'info');
    } catch (err) {
      if (addToast) addToast('Error clearing polygons', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Zone
  const handleDeleteZone = async () => {
    if (!zoneToDelete) return;
    try {
      const zId = zoneToDelete.zoneId || zoneToDelete._id;
      const res = await apiService.deleteZone(zId);
      if (res && res.success) {
        if (addToast) addToast(`Polygon "${zoneToDelete.name}" deleted.`, 'success');
        setZoneToDelete(null);
        if (selectedZoneId === zId) setSelectedZoneId(null);
        setDrawnVertices([]);
        fetchData();
      } else {
        if (addToast) addToast(res?.message || 'Failed to delete polygon.', 'error');
      }
    } catch (e) {
      if (addToast) addToast(e.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* TOP HEADER: Clear Title & Concept Explanation                          */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            <span>Store Area Polygons (Where Stores Lie)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Draw large geographic polygons on the map to group and distribute physical supermarket stores. Stores physically inside each polygon are automatically linked.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {mapMode !== 'draw' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleResetToThreeCleanSectors}
                disabled={isSaving}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-950/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Wipe duplicate/overlapping polygons and reset to 3 master non-overlapping regional sectors (Blue, Green, Orange)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>🧹 Reset 3 Master Sectors</span>
              </button>

              {zones.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllPolygons}
                  disabled={isSaving}
                  className="px-3 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  title="Clear all polygons to start fresh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleStartDraw}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/10 flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>✏️ Draw Polygon for Stores</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenSaveModal}
              disabled={cleanDrawnVertices.length < 3}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/10 flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>Save Polygon ({storesInsideDrawing.length} Stores Inside)</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* STATS STRIP: Polygons, Enclosed Stores, Ungrouped Stores              */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Configured Polygons</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{statistics.totalPolygons}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Store cluster regions</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Enclosed Stores</span>
          <span className="text-2xl font-black text-teal-600 mt-1 block">{statistics.groupedStoresCount}</span>
          <span className="text-[10px] text-teal-600/80 mt-0.5 block">Lying inside polygons</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Ungrouped Stores</span>
          <span className={`text-2xl font-black mt-1 block ${statistics.ungroupedCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {statistics.ungroupedCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {statistics.ungroupedCount > 0 ? 'Needs polygon enclosure' : 'All stores enclosed'}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Stores</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{statistics.totalStores}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Across 4 retail brands</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* UNGROUPED STORES NOTIFICATION BANNER                                  */}
      {/* ===================================================================== */}
      {ungroupedStores.length > 0 && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0">
              ⚠️
            </span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                {ungroupedStores.length} Store(s) not yet enclosed in a polygon:
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {ungroupedStores.map((s) => {
                  const r = getRetailerInfo(s.tenantId);
                  return (
                    <span
                      key={s.storeId || s._id}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-2xs flex items-center gap-1"
                      style={{ backgroundColor: r.color }}
                    >
                      <span>{r.logo}</span>
                      <span>{s.branchName || s.name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (ungroupedStores[0]) {
                const sLat = Number(ungroupedStores[0].latitude);
                const sLng = Number(ungroupedStores[0].longitude);
                if (mapInstanceRef.current && !isNaN(sLat) && !isNaN(sLng)) {
                  mapInstanceRef.current.flyTo([sLat, sLng], 14, { duration: 1.2 });
                }
              }
              handleStartDraw();
            }}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Draw Polygon Around Them</span>
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MAP WORKSPACE: Map with Full Polygon Drawing & Visual Representation   */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
        {/* Map Toolbar */}
        <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs bg-slate-50/50">
          {/* Location search */}
          <form onSubmit={handleGeocodingSearch} className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={geocodingQuery}
              onChange={(e) => setGeocodingQuery(e.target.value)}
              placeholder="Search area (e.g. D-Ground, Peoples Colony, Canal Road)..."
              className="w-full pl-8 pr-16 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 transition"
            />
            <button
              type="submit"
              disabled={isGeocoding}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-emerald-700 transition"
            >
              {isGeocoding ? '...' : 'Go'}
            </button>
          </form>

          {/* Map Mode Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => {
                setMapMode('view');
                setDrawnVertices([]);
                if (drawingLayerGroupRef.current) drawingLayerGroupRef.current.clearLayers();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                mapMode === 'view' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>View Map</span>
            </button>

            <button
              onClick={handleStartDraw}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                mapMode === 'draw' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>✏️ Draw Polygon</span>
            </button>
          </div>

          {/* Polygon View Filter: All vs Selected */}
          {zones.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setPolygonViewFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  polygonViewFilter === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Display all store area polygons on map"
              >
                All Regions ({zones.length})
              </button>
              <button
                type="button"
                onClick={() => setPolygonViewFilter('selected')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  polygonViewFilter === 'selected'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Only show the currently selected polygon to eliminate all clutter"
              >
                Active Only
              </button>
            </div>
          )}

          {/* Tile Layer & Store Markers Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-[11px] font-medium">
              <button
                onClick={() => setTileLayer('osm')}
                className={`px-2 py-0.5 rounded-md transition ${tileLayerType === 'osm' ? 'bg-white font-bold shadow-2xs' : 'text-slate-600'}`}
              >
                Street
              </button>
              <button
                onClick={() => setTileLayer('satellite')}
                className={`px-2 py-0.5 rounded-md transition ${tileLayerType === 'satellite' ? 'bg-white font-bold shadow-2xs' : 'text-slate-600'}`}
              >
                Satellite
              </button>
              <button
                onClick={() => setTileLayer('carto')}
                className={`px-2 py-0.5 rounded-md transition ${tileLayerType === 'carto' ? 'bg-white font-bold shadow-2xs' : 'text-slate-600'}`}
              >
                Light
              </button>
            </div>

            <button
              onClick={() => setShowStoreMarkers(!showStoreMarkers)}
              className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                showStoreMarkers
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
              title="Toggle Store Pins"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Store Pins</span>
            </button>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="relative">
          <div
            ref={mapContainerRef}
            className="w-full h-[520px] z-10"
            style={{ minHeight: '520px' }}
          ></div>

          {/* IN-MAP DRAWING OVERLAY BANNER */}
          {mapMode === 'draw' && (
            <div className="absolute top-4 left-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border border-slate-700/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <strong className="text-sm font-bold text-white">Drawing Polygon for Stores:</strong>
                  <span className="text-slate-400">Click points on the map around stores.</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-300">
                  <span>
                    Vertices: <strong className="text-emerald-400 font-mono text-xs">{cleanDrawnVertices.length}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Stores Inside:{' '}
                    <strong className="text-emerald-400 font-bold">{storesInsideDrawing.length} Stores</strong>
                  </span>
                  {storesInsideDrawing.length > 0 && (
                    <span className="text-slate-400 truncate max-w-sm">
                      ({storesInsideDrawing.map((s) => s.branchName || s.name).join(', ')})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (drawnVertices.length >= 3) {
                      setDrawnVertices(untanglePolygonPoints(drawnVertices));
                      if (addToast) addToast('Polygon vertices untangled smoothly ✨', 'info');
                    }
                  }}
                  disabled={drawnVertices.length < 3}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold transition disabled:opacity-40 cursor-pointer"
                >
                  ✨ Untangle
                </button>

                <button
                  type="button"
                  onClick={handleUndoVertex}
                  disabled={drawnVertices.length === 0}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Undo</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearDrawing}
                  className="px-2.5 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={handleCancelDrawing}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleOpenSaveModal}
                  disabled={cleanDrawnVertices.length < 3}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Polygon</span>
                </button>
              </div>
            </div>
          )}

          {/* IN-MAP EDIT OVERLAY BANNER */}
          {mapMode === 'edit' && (
            <div className="absolute top-4 left-4 right-4 z-20 bg-amber-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border border-amber-600/40">
              <div className="flex items-center gap-2 text-amber-200">
                <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <strong className="block text-sm text-white">Editing Polygon Vertices:</strong>
                  <span className="text-[11px] text-amber-300">
                    Drag the number handles on the map to adjust boundaries around stores. Stores currently inside:{' '}
                    <strong className="text-white font-bold">{storesInsideDrawing.length}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleCancelDrawing}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveEditedZone}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CONFIGURED STORE AREA POLYGONS: Cards showing store count & store list */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Configured Store Area Polygons</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                {zones.length} Regions
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Geographic polygons grouping physical stores. Each store lying inside is listed below.
            </p>
          </div>

          <button
            onClick={handleStartDraw}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Draw Another Polygon</span>
          </button>
        </div>

        {zones.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-black">
              📍
            </div>
            <h4 className="font-bold text-slate-900 text-base">No Store Area Polygons Created Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Draw large polygons on the map above to group physical supermarket stores geographically (e.g. 3 large polygons like Blue, Green, and Orange regions).
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetToThreeCleanSectors}
                disabled={isSaving}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>✨ Auto-Initialize 3 Regional Polygons (Blue, Green, Orange)</span>
              </button>
              <button
                type="button"
                onClick={handleStartDraw}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span>✏️ Draw Custom Polygon</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => {
              const zKey = zone.zoneId || zone._id;
              const isSelected = selectedZoneId === zKey;
              const latLngs = getZonePolygonLatLngs(zone);
              const insideStores = getStoresInPolygon(latLngs, stores);
              const color = zone.color || '#2563eb';

              return (
                <div
                  key={zKey}
                  onClick={() => {
                    setSelectedZoneId(zKey);
                    if (mapInstanceRef.current && latLngs.length > 0) {
                      mapInstanceRef.current.fitBounds(L.latLngBounds(latLngs), {
                        padding: [50, 50],
                        maxZoom: 15
                      });
                    }
                  }}
                  className={`bg-white rounded-3xl border p-5 transition flex flex-col justify-between cursor-pointer space-y-4 ${
                    isSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ring-2 ring-white"
                        style={{ backgroundColor: color }}
                      ></span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{zone.name}</h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {zone.city || 'Faisalabad'}{zone.area ? ` • ${zone.area}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Prominent Store Count Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0 flex items-center gap-1 ${
                        insideStores.length > 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <Store className="w-3 h-3" />
                      <span>{insideStores.length} Stores Inside</span>
                    </span>
                  </div>

                  {/* List of Stores Lying Inside Polygon */}
                  <div className="space-y-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-100 flex-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Stores Inside This Polygon</span>
                      <span className="text-slate-500 font-mono">{insideStores.length}</span>
                    </div>

                    {insideStores.length === 0 ? (
                      <p className="text-[11px] text-amber-700 italic py-1">
                        ⚠️ No stores currently lie inside this polygon boundary. Click "Edit on Map" to expand vertices around nearby stores.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {insideStores.map((store) => {
                          const retailer = getRetailerInfo(store.tenantId);
                          const sLat = Number(store.latitude);
                          const sLng = Number(store.longitude);

                          return (
                            <div
                              key={store.storeId || store._id}
                              className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base shrink-0">{retailer.logo}</span>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-slate-900 truncate">
                                    {store.branchName || store.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {store.address}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold shrink-0">
                                Inside
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditZoneOnMap(zone);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit on Map</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoneToDelete(zone);
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Delete Polygon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SAVE STORE AREA POLYGON MODAL                                          */}
      {/* ===================================================================== */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Save Store Area Polygon</h3>
                  <p className="text-xs text-slate-500">
                    Group physical stores inside this geographic polygon.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSavePolygon} className="space-y-4 text-xs">
              {/* Polygon Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Polygon Name *
                </label>
                <input
                  type="text"
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  required
                  placeholder="e.g. D-Ground & Peoples Colony Store Area"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 text-xs font-semibold"
                />
              </div>

              {/* City & Area */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={modalForm.city}
                    onChange={(e) => setModalForm({ ...modalForm, city: e.target.value })}
                    required
                    placeholder="Faisalabad"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Sector / Area</label>
                  <input
                    type="text"
                    value={modalForm.area}
                    onChange={(e) => setModalForm({ ...modalForm, area: e.target.value })}
                    placeholder="e.g. D-Ground Commercial"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              {/* Color Selector (matching Blue, Green, Orange like in Image 2) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Polygon Color (Blue, Green, Orange matching regional sectors)
                </label>
                <div className="flex items-center gap-2">
                  {POLYGON_COLORS.map(({ color, label }) => (
                    <button
                      key={color}
                      type="button"
                      title={label}
                      onClick={() => {
                        setModalForm({ ...modalForm, color });
                        setActivePolygonColor(color);
                      }}
                      className={`w-8 h-8 rounded-xl transition cursor-pointer border-2 relative flex items-center justify-center ${
                        modalForm.color === color
                          ? 'border-slate-900 scale-110 shadow-xs ring-2 ring-emerald-500/30'
                          : 'border-white hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {modalForm.color === color && <Check className="w-4 h-4 text-white drop-shadow-xs" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Stores Enclosed Summary */}
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Stores Located Inside This Polygon:</span>
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    {storesInsideDrawing.length} Stores
                  </span>
                </div>

                {storesInsideDrawing.length === 0 ? (
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    ⚠️ 0 stores are currently inside this polygon boundary. You can still save it, or cancel and expand the boundary to encompass nearby stores.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 pt-1">
                    {storesInsideDrawing.map((s) => {
                      const ret = getRetailerInfo(s.tenantId);
                      return (
                        <div
                          key={s.storeId || s._id}
                          className="bg-white p-2 rounded-xl border border-emerald-100 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span>{ret.logo}</span>
                            <span className="font-bold text-slate-800 truncate">{s.branchName || s.name}</span>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold shrink-0">✓ Linked</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-[10px] text-slate-500 pt-1">
                  ✓ Stores physically inside this boundary will be automatically associated with this polygon.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/10 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Confirm & Save Polygon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DELETE CONFIRMATION MODAL                                             */}
      {/* ===================================================================== */}
      {zoneToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Store Area Polygon?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">{zoneToDelete.name}</span>?
              Physical stores lying inside this boundary will become ungrouped until enclosed by another polygon.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setZoneToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteZone}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Delete Polygon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
