import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './components/Common/ErrorBoundary.jsx';
import { normalizeOrderTenantId } from './utils/orderScope';
import './index.css';
import 'leaflet/dist/leaflet.css';

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
