/**
 * Multi-layer Map Tile Provider for Leaflet (with automatic failover)
 *
 * Uses 100% Free, Public Tile Layers with Zero API Key Required:
 * - Street View:
 *   1. Google Maps Roadmap (Primary: ultra-fast global & Pakistan CDN, full Urdu & English labels, unblocked, no watermark)
 *   2. OpenStreetMap Standard (Failover 1: official OSM worldwide CDN)
 *   3. OpenStreetMap France (Failover 2: high-speed OSM France CDN)
 *   4. Esri World Street Map (Failover 3: reliable fallback)
 *   5. OpenStreetMap Deutschland (Failover 4: OSM Germany)
 * - Satellite View: High-Resolution Google Satellite + Esri World Imagery fallback
 * - Hybrid View: High-Resolution Google Hybrid (Satellite + Roads/Labels) + Esri Hybrid fallback
 *
 * No API key required. No watermark. No crossOrigin rejection.
 */
import L from 'leaflet';

const GOOGLE_ATTR = '&copy; Google Maps';
const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ESRI_ATTR = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS';

// Street providers, tried in order until one loads tiles
const STREET_PROVIDERS = [
  {
    id: 'google-streets',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: GOOGLE_ATTR,
    maxZoom: 20
  },
  {
    id: 'osm-standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: OSM_ATTR,
    maxZoom: 19
  },
  {
    id: 'osm-france',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: OSM_ATTR,
    maxZoom: 19
  },
  {
    id: 'esri-street',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; World Street Map',
    maxZoom: 19
  },
  {
    id: 'osm-de',
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: OSM_ATTR,
    maxZoom: 19
  }
];

const SATELLITE_PROVIDERS = [
  {
    id: 'google-satellite',
    url: 'https://mt{s}.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: GOOGLE_ATTR,
    maxZoom: 20
  },
  {
    id: 'esri-satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: ESRI_ATTR,
    maxZoom: 19
  }
];

const HYBRID_PROVIDERS = [
  {
    id: 'google-hybrid',
    url: 'https://mt{s}.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: GOOGLE_ATTR,
    maxZoom: 20
  },
  {
    id: 'esri-hybrid',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    overlayUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; World Imagery & Boundaries',
    maxZoom: 19
  }
];

export const MAP_LAYERS = {
  street: {
    id: 'street',
    name: 'Street View (Google / OSM)',
    label: 'Street',
    icon: '🗺️',
    providers: STREET_PROVIDERS,
    url: STREET_PROVIDERS[0].url,
    subdomains: STREET_PROVIDERS[0].subdomains,
    attribution: STREET_PROVIDERS[0].attribution,
    maxZoom: 20
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite View (High-Res Aerial)',
    label: 'Satellite',
    icon: '🛰️',
    providers: SATELLITE_PROVIDERS,
    url: SATELLITE_PROVIDERS[0].url,
    subdomains: SATELLITE_PROVIDERS[0].subdomains,
    attribution: SATELLITE_PROVIDERS[0].attribution,
    maxZoom: 20
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid View (Satellite + Streets)',
    label: 'Hybrid',
    icon: '🏙️',
    providers: HYBRID_PROVIDERS,
    url: HYBRID_PROVIDERS[0].url,
    subdomains: HYBRID_PROVIDERS[0].subdomains,
    attribution: HYBRID_PROVIDERS[0].attribution,
    maxZoom: 20
  }
};

const ERRORS_BEFORE_FAILOVER = 3;
const FIRST_TILE_TIMEOUT_MS = 3500;

/**
 * Build a tile layer for providers[index]. If it fails to load tiles, it removes
 * itself and installs providers[index + 1] on the same map, updating the ref.
 */
const buildFailoverLayer = (map, providers, index, ref) => {
  const p = providers[index];
  const layer = L.tileLayer(p.url, {
    attribution: p.attribution,
    maxZoom: p.maxZoom ?? 19,
    subdomains: p.subdomains || 'abc',
    detectRetina: false,
    keepBuffer: 8
  });

  let loadedAny = false;
  let errors = 0;
  let switched = false;

  const failover = () => {
    if (switched || loadedAny) return;
    if (index + 1 >= providers.length) {
      console.warn('[mapTiles] All tile providers failed. Check network / ad-blocker.');
      return;
    }
    switched = true;
    clearTimeout(timer);
    try {
      map.removeLayer(layer);
    } catch (e) {
      /* already removed */
    }
    if (!map._container || !map._loaded) return;
    const next = buildFailoverLayer(map, providers, index + 1, ref);
    next.addTo(map);
    if (ref) ref.current = next;
  };

  layer.on('tileload', (e) => {
    if (e && e.tile) {
      e.tile.style.mixBlendMode = 'normal';
      e.tile.style.opacity = '1';
      e.tile.style.filter = 'none';
      e.tile.style.visibility = 'visible';
    }
    loadedAny = true;
    clearTimeout(timer);
  });

  layer.on('tileerror', () => {
    errors += 1;
    if (errors >= ERRORS_BEFORE_FAILOVER) failover();
  });

  const timer = setTimeout(failover, FIRST_TILE_TIMEOUT_MS);
  layer.on('remove', () => clearTimeout(timer));

  return layer;
};

/**
 * Switch tile layer smoothly on an existing Leaflet Map instance.
 * Pass the same ref every time so the previous layer is removed correctly.
 */
export const switchMapTileLayer = (map, layerKey = 'street', currentTileLayerRef) => {
  if (!map) return null;
  const config = MAP_LAYERS[layerKey] || MAP_LAYERS.street;

  if (currentTileLayerRef && currentTileLayerRef.current) {
    try {
      const old = currentTileLayerRef.current;
      if (typeof old.clearLayers === 'function') old.clearLayers();
      map.removeLayer(old);
    } catch (e) {
      /* layer may already be removed */
    }
  }

  let newLayer;
  if (config.overlayUrl) {
    const baseLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: config.subdomains || ['0', '1', '2', '3']
    });
    const labelLayer = L.tileLayer(config.overlayUrl, {
      maxZoom: config.maxZoom,
      zIndex: 500
    });
    newLayer = L.layerGroup([baseLayer, labelLayer]);
    newLayer.addTo(map);
  } else {
    newLayer = buildFailoverLayer(map, config.providers, 0, currentTileLayerRef);
    newLayer.addTo(map);
  }

  if (currentTileLayerRef) currentTileLayerRef.current = newLayer;

  // Recalculate size quietly after layout without camera jitter
  [50, 150, 400, 1000].forEach((ms) =>
    setTimeout(() => {
      try {
        if (map && map._container && typeof map.invalidateSize === 'function') {
          map.invalidateSize({ debounceMoveEvents: true });
        }
      } catch (e) {
        /* map was destroyed */
      }
    }, ms)
  );

  return newLayer;
};
