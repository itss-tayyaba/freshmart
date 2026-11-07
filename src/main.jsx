import React from 'react';
import ReactDOM from 'react-dom/client';
import L from 'leaflet';
import App from './App.jsx';
import { ErrorBoundary } from './components/Common/ErrorBoundary.jsx';
import { normalizeOrderTenantId } from './utils/orderScope';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Global Leaflet LatLng safety wrapper: Prevents "Invalid LatLng object: (NaN, NaN)" from crashing React
if (L && L.latLng) {
  const origLatLng = L.latLng;
  L.latLng = function (a, b, c) {
    try {
      if (Array.isArray(a)) {
        const safeLat = (Number.isFinite(Number(a[0])) && !isNaN(Number(a[0]))) ? Number(a[0]) : 31.4125;
        const safeLng = (Number.isFinite(Number(a[1])) && !isNaN(Number(a[1]))) ? Number(a[1]) : 73.0995;
        return origLatLng.call(this, safeLat, safeLng, a[2]);
      }
      if (typeof a === 'object' && a !== null) {
        const rawLat = Number(a.lat ?? a.latitude);
        const rawLng = Number(a.lng ?? a.longitude);
        const safeLat = (Number.isFinite(rawLat) && !isNaN(rawLat)) ? rawLat : 31.4125;
        const safeLng = (Number.isFinite(rawLng) && !isNaN(rawLng)) ? rawLng : 73.0995;
        return origLatLng.call(this, safeLat, safeLng, a.alt);
      }
      const safeA = (Number.isFinite(Number(a)) && !isNaN(Number(a))) ? Number(a) : 31.4125;
      const safeB = (Number.isFinite(Number(b)) && !isNaN(Number(b))) ? Number(b) : 73.0995;
      return origLatLng.call(this, safeA, safeB, c);
    } catch {
      return origLatLng.call(this, 31.4125, 73.0995);
    }
  };
}

// Global failsafe helpers
if (typeof window !== 'undefined') {
  window.normalizeOrderTenantId = normalizeOrderTenantId;
  if (!window.formatPrice) {
    window.formatPrice = (amount) => {
      const num = Number(amount || 0);
      return `Rs. ${num.toLocaleString()}`;
    };
  }
}
if (typeof globalThis !== 'undefined') {
  globalThis.normalizeOrderTenantId = normalizeOrderTenantId;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
