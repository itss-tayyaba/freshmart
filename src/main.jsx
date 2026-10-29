import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './components/Common/ErrorBoundary.jsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Global failsafe helper for currency formatting
if (typeof window !== 'undefined' && !window.formatPrice) {
  window.formatPrice = (amount) => {
    const num = Number(amount || 0);
    return `Rs. ${num.toLocaleString()}`;
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
