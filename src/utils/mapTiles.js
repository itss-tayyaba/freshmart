/**
 * Multi-layer Map Tile Provider for Leaflet
 * Supports Street View, High-Resolution Satellite View (Esri World Imagery),
 * and Hybrid View (Google Satellite + Street Labels)
 */
import L from 'leaflet';

export const MAP_LAYERS = {
  street: {
    id: 'street',
    name: 'Street View',
    label: 'Street',
    icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite View',
    label: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS Community',
    maxZoom: 19
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid View',
    label: 'Hybrid',
    icon: '🏙️',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
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
      map.removeLayer(currentTileLayerRef.current);
    } catch (e) {
      // layer may already be removed
    }
  }

  const newTileLayer = L.tileLayer(config.url, {
    attribution: config.attribution,
    maxZoom: config.maxZoom
  });

  newTileLayer.addTo(map);

  if (currentTileLayerRef) {
    currentTileLayerRef.current = newTileLayer;
  }

  // Ensure layer tiles immediately calculate and draw
  setTimeout(() => {
    if (map && typeof map.invalidateSize === 'function') {
      map.invalidateSize();
    }
  }, 50);

  return newTileLayer;
};

