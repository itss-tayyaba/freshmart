import React from 'react';
import { AlertCircle, RefreshCw, Home, RotateCcw } from 'lucide-react';

// Inline fallback so it's always available even before orderScope module loads
const _fallbackNormalize = (order) => {
  if (!order) return null;
  const raw = order.tenantId || order.companyId || order.tenant || order.storeId;
  if (raw) {
    const l = String(raw).toLowerCase();
    if (l.includes('alfatah') || l.includes('company_001')) return 'company_001';
    if (l.includes('chaseup') || l.includes('company_002')) return 'company_002';
    if (l.includes('chasevalue') || l.includes('company_003')) return 'company_003';
    if (l.includes('freshmart') || l.includes('unimaart') || l.includes('company_004')) return 'company_004';
    return raw;
  }
  return null;
};

// Register immediately — before any component mounts
if (typeof window !== 'undefined' && !window.normalizeOrderTenantId) {
  try { window.normalizeOrderTenantId = _fallbackNormalize; } catch (e) {}
}
if (typeof globalThis !== 'undefined' && !globalThis.normalizeOrderTenantId) {
  try { globalThis.normalizeOrderTenantId = _fallbackNormalize; } catch (e) {}
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    if (error?.message && error.message.includes('normalizeOrderTenantId')) {
      // Patch the global immediately
      const patch = (order) => {
        if (!order) return null;
        return order.tenantId || order.companyId || 'company_004';
      };
      if (typeof window !== 'undefined') window.normalizeOrderTenantId = patch;
      if (typeof globalThis !== 'undefined') globalThis.normalizeOrderTenantId = patch;
      // Return no-error state → React will re-render children automatically
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FreshMart Application ErrorBoundary caught:', error, errorInfo);
    if (error?.message && error.message.includes('normalizeOrderTenantId')) {
      const patch = (order) => order?.tenantId || order?.companyId || 'company_004';
      if (typeof window !== 'undefined') window.normalizeOrderTenantId = patch;
      if (typeof globalThis !== 'undefined') globalThis.normalizeOrderTenantId = patch;
      // Auto-recover: schedule retry without user clicking anything
      const retryCount = (this.state.retryCount || 0) + 1;
      if (retryCount <= 3) {
        setTimeout(() => this.setState({ hasError: false, error: null, retryCount }), 100);
      } else {
        // After 3 auto-retries, show the error UI with the reload button
        this.setState({ error, errorInfo, retryCount });
      }
      return;
    }
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    try {
      localStorage.removeItem('freshmart_cart');
      localStorage.removeItem('freshmart_cart_v2');
      localStorage.removeItem('freshmart_customer_orders');
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      try {
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
      } catch (e) {}
      window.location.href = window.location.origin + window.location.pathname + '?_fresh=' + Date.now();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans antialiased">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-500/10">
              🛒
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">FreshMart Super Platform</h2>
              <p className="text-xs text-slate-400">
                A temporary rendering error occurred. You can restore the app immediately with the button below:
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-left text-slate-400 font-mono text-[11px] overflow-x-auto max-h-24">
                <code>{this.state.error.message}</code>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload &amp; Restore FreshMart</span>
              </button>

              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('freshmart_cart');
                    localStorage.removeItem('freshmart_cart_v2');
                    localStorage.removeItem('freshmart_customer_orders');
                    sessionStorage.removeItem('freshmart_session_location_confirmed');
                  } catch (e) {}
                  this.setState({ hasError: false, error: null });
                  if (typeof window !== 'undefined') {
                    try {
                      if ('caches' in window) {
                        caches.keys().then((names) => {
                          names.forEach((name) => caches.delete(name));
                        });
                      }
                    } catch (e) {}
                    window.location.href = window.location.origin + window.location.pathname + '?_fresh=' + Date.now();
                  }
                }}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Cache &amp; Refresh</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
