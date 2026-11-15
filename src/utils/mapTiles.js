/**
 * Multi-layer Map Tile Provider for Leaflet
 * Uses 100% Free, Public Tile Layers with Zero API Key Required:
 * - Street View: OpenStreetMap (Full authentic colors, no API key, no watermark, unblocked)
 * - Street Fallback: Esri World Street Map (High reliability, unblocked, no API key)
 * - Satellite View: High-Resolution Esri World Imagery (No API key, no watermark)
 * - Hybrid View: High-Res Satellite + Reference Boundaries & Streets (No API key, no watermark)
 */
import L from 'leaflet';

export const MAP_LAYERS = {
  street: {
    id: 'street',
    name: 'Street View (OpenStreetMap)',
    label: 'Street',
    icon: '🗺️',
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    fallbackUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    crossOrigin: true
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite View (High-Res Aerial)',
    label: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS',
    maxZoom: 19,
    crossOrigin: true
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid View (Satellite + Streets)',
    label: 'Hybrid',
    icon: '🏙️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    overlayUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; World Imagery & Boundaries',
    maxZoom: 19,
    crossOrigin: true
  }
};

/**
 * Switch tile layer smoothly on an existing Leaflet Map instance
 */
export const switchMapTileLayer = (map, layerKey = 'street', currentTileLayerRef) => {
  if (!map) return null;
  const config = MAP_LAYERS[layerKey] || MAP_LAYERS.street;

  if (currentTileLayerRef && currentTileLayerRef.current) {
    try {
      if (typeof currentTileLayerRef.current.clearLayers === 'function') {
        currentTileLayerRef.current.clearLayers();
      }
      map.removeLayer(currentTileLayerRef.current);
    } catch (e) {
      // layer may already be removed
    }
  }

  let newLayer;
  if (config.overlayUrl) {
    const baseLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      crossOrigin: config.crossOrigin ?? true
    });
    const labelLayer = L.tileLayer(config.overlayUrl, {
      maxZoom: config.maxZoom,
      crossOrigin: true,
      zIndex: 500
    });
    newLayer = L.layerGroup([baseLayer, labelLayer]);
  } else {
    newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      crossOrigin: config.crossOrigin ?? true
    });

    if (config.fallbackUrl) {
      newLayer.on('tileerror', (error) => {
        if (error && error.tile && error.coords) {
          const { x, y, z } = error.coords;
          const fallbackSrc = config.fallbackUrl
            .replace('{z}', z)
            .replace('{x}', x)
            .replace('{y}', y);
          if (error.tile.src !== fallbackSrc) {
            error.tile.src = fallbackSrc;
          }
        }
      });
    }
  }

  newLayer.addTo(map);

  if (currentTileLayerRef) {
    currentTileLayerRef.current = newLayer;
  }

  // Quietly ensure tiles calculate without camera shake
  setTimeout(() => {
    try {
      if (map && typeof map.invalidateSize === 'function') {
        map.invalidateSize({ debounceMoveEvents: true });
      }
    } catch (e) {}
  }, 100);

  return newLayer;
};
