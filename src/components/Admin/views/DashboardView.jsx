import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Package,
  ArrowRight,
  ChevronDown,
  ShoppingBag,
  Users,
  Boxes,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { ADMIN_STATS } from '../../../data/freshMartData';

export const DashboardView = ({ onNavigateModule }) => {
  const { currency, navigateTo } = useStore();
  const [period, setPeriod] = useState('Last 7 Days');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Top Greeting Banner matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Good Morning, Admin!</span>
            <span>👋</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Here's what's happening with your store today.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs self-start sm:self-auto">
          <span>Today, 28 Aug 2026</span>
        </div>
      </div>

      {/* 2. 4 Stat Cards with soft colorful badges matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">Rs. 845,230</h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12.5% from last week</span>
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">1,248</h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+8.2% from last week</span>
            </span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Customers</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">5,842</h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+16.3% from last week</span>
            </span>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">2,456</h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+6.1% from last week</span>
            </span>
          </div>
        </div>

      </div>

      {/* 3. Middle Row: Sales Overview (Line Chart) + Top Categories (Donut) + Promo Banner matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Overview Chart (6 Columns) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-100 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Sales Overview</h3>
            <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-600">
              <span>{period}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          <div className="h-60 relative flex items-end pt-4 pb-6">
            {/* SVG Line Chart matching screenshot */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 350 140">
              <defs>
                <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,105 Q 35,120 70,80 T 140,95 T 210,45 T 280,65 T 350,55 L 350,140 L 0,140 Z"
                fill="url(#dashGrad)"
              />
              <path
                d="M 0,105 Q 35,120 70,80 T 140,95 T 210,45 T 280,65 T 350,55"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Active data point with tooltip */}
              <circle cx="210" cy="45" r="5" fill="#059669" stroke="#fff" strokeWidth="2" />
            </svg>

            {/* Hover Tooltip matching screenshot: Rs. 745,200 */}
            <div className="absolute top-8 left-[50%] -translate-x-1/2 bg-slate-900 text-white text-[11px] font-mono font-bold px-2 py-1 rounded-md shadow-md">
              Rs. 745,200
            </div>

            {/* Dates */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-semibold text-slate-400 px-1">
              <span>23 Aug</span>
              <span>24 Aug</span>
              <span>25 Aug</span>
              <span>26 Aug</span>
              <span>27 Aug</span>
              <span>28 Aug</span>
            </div>
          </div>
        </div>

        {/* Top Categories Donut Chart (3 Columns) matching screenshot */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-100 shadow-card flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Top Categories</h3>

          {/* Donut graphic */}
          <div className="relative flex items-center justify-center my-3">
            <div className="w-32 h-32 rounded-full border-8 border-emerald-500 border-t-amber-400 border-r-blue-400 border-b-rose-400 flex items-center justify-center text-center">
              <div>
                <span className="text-base font-black text-slate-900 block leading-tight">1,248</span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Total Orders</span>
              </div>
            </div>
          </div>

          {/* Breakdown List matching screenshot */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Fruits & Vegetables
              </span>
              <span className="font-bold text-slate-900">38%</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Dairy & Eggs
              </span>
              <span className="font-bold text-slate-900">24%</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Bakery
              </span>
              <span className="font-bold text-slate-900">18%</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Meat & Poultry
              </span>
              <span className="font-bold text-slate-900">12%</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Beverages
              </span>
              <span className="font-bold text-slate-900">8%</span>
            </div>
          </div>
        </div>

        {/* Vertical Promo Card (3 Columns) matching screenshot */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-card relative flex flex-col justify-between p-6 bg-gradient-to-b from-[#14532d] to-[#052e16] text-white">
          <div className="space-y-2 z-10">
            <span className="text-[10px] uppercase font-bold text-lime-400 tracking-wider">
              Weekly Spotlight
            </span>
            <h3 className="text-xl font-black leading-tight">
              Fresh Groceries <br />
              <span className="text-lime-300">Better Life</span>
            </h3>
            <button
              onClick={() => navigateTo('shop')}
              className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative h-28 rounded-xl overflow-hidden mt-4">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80"
              alt="Fresh Groceries"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>

      </div>

      {/* 4. Bottom 3 Alert Cards matching screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Low Stock Alert */}
        <div
          onClick={() => onNavigateModule('Inventory')}
          className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-rose-100/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">Low Stock Alert</h4>
              <p className="text-[11px] text-rose-700">12 products are low in stock</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-500" />
        </div>

        {/* Expiring Soon */}
        <div
          onClick={() => onNavigateModule('Inventory')}
          className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">Expiring Soon</h4>
              <p className="text-[11px] text-amber-700">8 products will expire soon</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-500" />
        </div>

        {/* Pending Orders */}
        <div
          onClick={() => onNavigateModule('Orders')}
          className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-blue-100/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-900">Pending Orders</h4>
              <p className="text-[11px] text-blue-700">23 orders need attention</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-700 hover:underline">View All →</span>
        </div>

      </div>

    </div>
  );
};
