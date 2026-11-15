/**
 * Multi-layer Map Tile Provider for Leaflet
 * Supports Vibrant Colorful Street View (Carto Voyager / OpenStreetMap),
 * High-Resolution Satellite View (Esri World Imagery),
 * and Hybrid View (High-Res Satellite + Street & Landmark Labels)
 */
import L from 'leaflet';

export const MAP_LAYERS = {
  street: {
    id: 'street',
    name: 'Street View (Vibrant Color)',
    label: 'Street',
    icon: '🗺️',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19,
    crossOrigin: true
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap (Classic Color)',
    label: 'OSM',
    icon: '🌍',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    crossOrigin: true
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite View (High-Res Aerial)',
    label: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS Community',
    subdomains: ['server', 'services'],
    maxZoom: 19,
    crossOrigin: true
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid View (Satellite + Streets)',
    label: 'Hybrid',
    icon: '🏙️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    overlayUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
    overlaySubdomains: ['a', 'b', 'c', 'd'],
    attribution: 'Tiles &copy; Esri, &copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: ['server', 'services'],
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
      subdomains: config.subdomains || ['server', 'services'],
      maxZoom: config.maxZoom,
      crossOrigin: config.crossOrigin ?? true
    });
    const labelLayer = L.tileLayer(config.overlayUrl, {
      subdomains: config.overlaySubdomains || ['a', 'b', 'c', 'd'],
      maxZoom: config.maxZoom,
      crossOrigin: true,
      zIndex: 500
    });
    newLayer = L.layerGroup([baseLayer, labelLayer]);
  } else {
    newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      subdomains: config.subdomains || ['a', 'b', 'c', 'd'],
      maxZoom: config.maxZoom,
      crossOrigin: config.crossOrigin ?? true
    });
  }

  newLayer.addTo(map);

  if (currentTileLayerRef) {
    currentTileLayerRef.current = newLayer;
  }

  // Ensure layer tiles immediately calculate and draw without blank/white areas
  [50, 150, 300].forEach((delay) => {
    setTimeout(() => {
      try {
        if (map && typeof map.invalidateSize === 'function') {
          map.invalidateSize(true);
        }
      } catch (e) {}
    }, delay);
  });

  return newLayer;
};
