import React from 'react';
import { AlertCircle, RefreshCw, Home, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FreshMart Application ErrorBoundary caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    try {
      // Clear corrupt cache keys while preserving user's essential state
      localStorage.removeItem('freshmart_cart');
      localStorage.removeItem('freshmart_delivery_location');
      localStorage.removeItem('freshmart_customer_orders');
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
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
                <span>Reload & Restore FreshMart</span>
              </button>

              <button
                onClick={() => {
                  try {
                    localStorage.clear();
                  } catch (e) {}
                  window.location.href = '/';
                }}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Local Storage Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
