import React, { useState } from 'react';
import { Download, Calendar, TrendingUp, BarChart2, Eye, ShoppingCart, Heart, Share2, Check } from 'lucide-react';
import { ADMIN_STATS, ADMIN_TOP_PRODUCTS } from '../../../data/freshMartData';
import { ADMIN_REPORTS_BEHAVIOR } from '../../../data/adminSuiteData';
import { useStore } from '../../../context/StoreContext';

export const ReportsView = () => {
  const { addToast } = useStore();
  const [timeframe, setTimeframe] = useState('Monthly');

  const handleExport = () => {
    addToast('Report Exported 📄', 'Downloaded FreshMart_August_2026_Analytics.pdf');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">Business insights, funnel conversions, and revenue analytics</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>1 Aug, 2026 - 31 Aug, 2026</span>
          </div>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Sales</span>
          <h3 className="text-xl font-black text-slate-900 mt-1">Rs. 845,230</h3>
          <span className="text-[11px] font-bold text-emerald-600">+12.5%</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Orders</span>
          <h3 className="text-xl font-black text-slate-900 mt-1">1,248</h3>
          <span className="text-[11px] font-bold text-emerald-600">+8.2%</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Customers</span>
          <h3 className="text-xl font-black text-slate-900 mt-1">5,842</h3>
          <span className="text-[11px] font-bold text-emerald-600">+16.3%</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Avg Order Value</span>
          <h3 className="text-xl font-black text-slate-900 mt-1">Rs. 2,450</h3>
          <span className="text-[11px] font-bold text-emerald-600">+4.5%</span>
        </div>
      </div>

      {/* Main Analytics: Chart + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Overview Chart matching screenshot (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Sales Overview</h3>
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-bold">
              {['Daily', 'Weekly', 'Monthly'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    timeframe === t ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-60 relative flex items-end pt-4 pb-6">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 350 140">
              <path
                d="M 0,110 Q 50,130 100,75 T 200,90 T 300,50 T 350,60 L 350,140 L 0,140 Z"
                fill="rgba(16, 185, 129, 0.15)"
              />
              <path
                d="M 0,110 Q 50,130 100,75 T 200,90 T 300,50 T 350,60"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              />
              <circle cx="100" cy="75" r="4" fill="#059669" />
              <circle cx="200" cy="90" r="4" fill="#059669" />
              <circle cx="300" cy="50" r="4" fill="#059669" />
            </svg>
          </div>
        </div>

        {/* Customer Behavior Funnel matching screenshot (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Customer Behavior</h3>

          <div className="space-y-3 pt-2">
            {ADMIN_REPORTS_BEHAVIOR.map((b) => (
              <div key={b.label} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">{b.label}</span>
                <span className="font-mono font-bold text-slate-900">{b.count}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 block mb-1">Conversion Rate</span>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full w-[51.6%]" />
            </div>
            <span className="text-xs font-bold text-emerald-700 mt-1 block">51.6% Conversion</span>
          </div>
        </div>

      </div>

    </div>
  );
};
