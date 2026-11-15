/**
 * Multi-layer Map Tile Provider for Leaflet (with automatic failover)
 *
 * Uses 100% Free, Public Tile Layers with Zero API Key Required:
 * - Street View: Esri World Street Map (Primary: fast global CDN, full colors, unblocked, no watermark)
 *   -> Failover 1: OpenStreetMap Deutschland (OSM colors, Urdu/English labels, unblocked)
 *   -> Failover 2: Esri World Topo Map (Reliable fallback)
 * - Satellite View: High-Resolution Esri World Imagery (No API key, no watermark)
 * - Hybrid View: High-Res Satellite + Reference Boundaries & Streets (No API key, no watermark)
 *
 * Note on Providers:
 * - We do NOT use `tile.openstreetmap.org` as primary because it sends `x-blocked: Access denied`
 *   on production Vercel domains (serving a blank white image with HTTP 200).
 * - We do NOT use `basemaps.cartocdn.com` because without an account API key it returns
 *   images with "API KEY REQUIRED carto.com/basemaps/apikey" watermarked all over them.
 * - `crossOrigin: true` is omitted to prevent CORS header rejection in standard image mode.
 */
import L from 'leaflet';

const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ESRI_ATTR = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS';

// Street providers, tried in order until one actually loads tiles
const STREET_PROVIDERS = [
  {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; World Street Map',
    maxZoom: 19
  },
  {
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: OSM_ATTR,
    maxZoom: 19
  },
  {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Topo Map',
    maxZoom: 19
  }
];

const SATELLITE_PROVIDERS = [
  {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: ESRI_ATTR,
    maxZoom: 19
  }
];

export const MAP_LAYERS = {
  street: {
    id: 'street',
    name: 'Street View (World Street)',
    label: 'Street',
    icon: '🗺️',
    providers: STREET_PROVIDERS,
    url: STREET_PROVIDERS[0].url,
    attribution: STREET_PROVIDERS[0].attribution,
    maxZoom: 19
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite View (High-Res Aerial)',
    label: 'Satellite',
    icon: '🛰️',
    providers: SATELLITE_PROVIDERS,
    url: SATELLITE_PROVIDERS[0].url,
    attribution: ESRI_ATTR,
    maxZoom: 19
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid View (Satellite + Streets)',
    label: 'Hybrid',
    icon: '🏙️',
    providers: SATELLITE_PROVIDERS,
    url: SATELLITE_PROVIDERS[0].url,
    overlayUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; World Imagery & Boundaries',
    maxZoom: 19
  }
};

const ERRORS_BEFORE_FAILOVER = 4;
const FIRST_TILE_TIMEOUT_MS = 6000;

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
    keepBuffer: 4
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
    // Make sure the map is still alive (user may have left the page)
    if (!map._container || !map._loaded) return;
    const next = buildFailoverLayer(map, providers, index + 1, ref);
    next.addTo(map);
    if (ref) ref.current = next;
  };

  layer.on('tileload', () => {
    loadedAny = true;
    clearTimeout(timer);
  });
  layer.on('tileerror', () => {
    errors += 1;
    if (errors >= ERRORS_BEFORE_FAILOVER) failover();
  });

  // Covers the "request hangs / is blocked silently" case
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
      maxZoom: config.maxZoom
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
  [100, 400, 1000].forEach((ms) =>
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
