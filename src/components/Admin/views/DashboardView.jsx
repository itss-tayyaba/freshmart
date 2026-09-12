import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Package,
  ArrowRight,
  ChevronDown,
  ShoppingBag,
  Users,
  Boxes,
  Sparkles,
  DollarSign,
  Activity,
  CheckCircle2,
  Truck,
  FileText,
  Layers,
  Plus,
  RefreshCw,
  Store,
  MapPin,
  CreditCard,
  ArrowUpRight,
  Download,
  BarChart2,
  PieChart,
  ShieldCheck,
  Percent,
  Award
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useStore } from '../../../context/StoreContext';
import {
  ADMIN_DAILY_SALES_CHART,
  ADMIN_MONTHLY_SALES_CHART,
  ADMIN_BEST_SELLING_PRODUCTS,
  ADMIN_BRANCH_PERFORMANCE
} from '../../../data/adminSuiteData';

export const DashboardView = ({ onNavigateModule }) => {
  const {
    currency,
    navigateTo,
    products,
    customerOrders,
    customers,
    updateProductStock,
    addToast
  } = useStore();

  // Selected period: '7days' | 'today' | '30days' | 'year'
  const [period, setPeriod] = useState('7days');
  // Selected metric: 'revenue' | 'orders' | 'aov'
  const [activeMetric, setActiveMetric] = useState('revenue');
  // Chart visual style: 'line' | 'bar'
  const [chartStyle, setChartStyle] = useState('line');
  // Interactive hover point
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Real-time dynamic store metrics computed from state
  const liveOrderSales = (customerOrders || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalSales = liveOrderSales > 0 ? liveOrderSales : 482500;
  const totalOrders = (customerOrders || []).length > 0 ? (customerOrders || []).length : 327;
  const totalCustomers = (customers || []).length > 0 ? (customers || []).length : 1842;
  const totalProducts = (products || []).length;

  const lowStockProducts = (products || []).filter((p) => {
    const stock = Number(p.stock !== undefined ? p.stock : (p.stockCount || 0));
    return stock < 15;
  });
  const lowStockCount = lowStockProducts.length;

  const expiringCount = (products || []).filter(
    (p) => p.isFlashDeal || (p.discountPercent && Number(p.discountPercent) > 15)
  ).length;

  const pendingOrdersCount = (customerOrders || []).filter(
    (o) => o.status === 'Processing' || o.status === 'Pending' || o.status === 'Packed'
  ).length;

  // 2. Multi-Timeframe Chart Datasets
  const chartDatasets = useMemo(() => {
    return {
      'today': [
        { label: '08:00', fullLabel: '8:00 AM', revenue: 24500, orders: 18, aov: 1361, growth: '+12%' },
        { label: '10:00', fullLabel: '10:00 AM', revenue: 58200, orders: 42, aov: 1385, growth: '+15%' },
        { label: '12:00', fullLabel: '12:00 PM', revenue: 96400, orders: 68, aov: 1417, growth: '+22%' },
        { label: '14:00', fullLabel: '2:00 PM', revenue: 74100, orders: 52, aov: 1425, growth: '+8%' },
        { label: '16:00', fullLabel: '4:00 PM', revenue: 88500, orders: 61, aov: 1450, growth: '+19%' },
        { label: '18:00', fullLabel: '6:00 PM', revenue: 112400, orders: 79, aov: 1422, growth: '+25%' },
        { label: '20:00', fullLabel: '8:00 PM', revenue: 145000, orders: 98, aov: 1479, growth: '+28%' },
        { label: '22:00', fullLabel: '10:00 PM (Now)', revenue: 62300, orders: 44, aov: 1415, growth: '+14%' }
      ],
      '7days': [
        { label: 'Mon', fullLabel: 'Monday, 01 Sep', revenue: 412000, orders: 284, aov: 1450, growth: '+10.4%' },
        { label: 'Tue', fullLabel: 'Tuesday, 02 Sep', revenue: 438500, orders: 298, aov: 1471, growth: '+14.2%' },
        { label: 'Wed', fullLabel: 'Wednesday, 03 Sep', revenue: 395000, orders: 275, aov: 1436, growth: '+6.8%' },
        { label: 'Thu', fullLabel: 'Thursday, 04 Sep', revenue: 456200, orders: 312, aov: 1462, growth: '+16.5%' },
        { label: 'Fri', fullLabel: 'Friday, 05 Sep', revenue: 512000, orders: 348, aov: 1471, growth: '+22.1%' },
        { label: 'Sat', fullLabel: 'Saturday, 06 Sep', revenue: 548900, orders: 372, aov: 1475, growth: '+26.8%' },
        { label: 'Sun', fullLabel: 'Sunday (Today)', revenue: 482500, orders: 327, aov: 1475, growth: '+18.4%' }
      ],
      '30days': [
        { label: 'Week 1', fullLabel: '01 - 07 Aug', revenue: 2840000, orders: 1940, aov: 1463, growth: '+11.2%' },
        { label: 'Week 2', fullLabel: '08 - 14 Aug', revenue: 3120000, orders: 2150, aov: 1451, growth: '+14.8%' },
        { label: 'Week 3', fullLabel: '15 - 21 Aug', revenue: 3450000, orders: 2380, aov: 1449, growth: '+18.5%' },
        { label: 'Week 4', fullLabel: '22 - 28 Aug', revenue: 3890000, orders: 2680, aov: 1451, growth: '+22.4%' }
      ],
      'year': ADMIN_MONTHLY_SALES_CHART.map((m) => ({
        label: m.month.split(' ')[0],
        fullLabel: `${m.month} 2026`,
        revenue: m.revenue,
        orders: m.orders,
        aov: Math.round(m.revenue / (m.orders || 1)),
        growth: '+15.8%'
      }))
    };
  }, []);

  const currentData = chartDatasets[period] || chartDatasets['7days'];
  const values = currentData.map((d) => d[activeMetric]);
  const maxValue = Math.max(...values) || 1;
  const minValue = Math.min(...values) || 0;
  const avgValue = Math.round(values.reduce((s, v) => s + v, 0) / (values.length || 1));
  const activePoint = hoveredIndex !== null ? currentData[hoveredIndex] : currentData[currentData.length - 1];

  // SVG Coordinates calculation for dynamic line chart
  const svgWidth = 540;
  const svgHeight = 160;
  const paddingX = 30;
  const paddingY = 24;

  const points = currentData.map((d, i) => {
    const x = paddingX + (i / (currentData.length - 1 || 1)) * (svgWidth - paddingX * 2);
    const range = maxValue - minValue || 1;
    const y = svgHeight - paddingY - ((d[activeMetric] - minValue * 0.8) / (maxValue - minValue * 0.8 || 1)) * (svgHeight - paddingY * 2);
    return { x, y, data: d };
  });

  // Generate smooth SVG curve path
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      path += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
    }
    return path;
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x},${svgHeight} L ${first.x},${svgHeight} Z`;
  }, [linePath, points, svgHeight]);

  // Quick Restock handler
  const handleQuickRestock = (product) => {
    const curStock = product.stock ?? 0;
    updateProductStock(product.id || product._id, curStock + 30);
    addToast('Stock Replenished! 📦', `Added 30 units to ${product.name}`);
  };

  // Export Executive Summary PDF
  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      // Header Banner
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('FRESHMART — EXECUTIVE STORE REPORT', 14, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${todayStr} | Confidential Store Summary`, 14, 22);

      // Store KPIs
      autoTable(doc, {
        startY: 34,
        head: [['Executive Metric', 'Value', 'Performance Benchmark', 'Status']],
        body: [
          ['Gross Revenue (PKR)', `Rs. ${totalSales.toLocaleString()}`, '+18.4% vs Previous Cycle', 'Optimal (Growth)'],
          ['Total Orders Handled', `${totalOrders.toLocaleString()}`, '99.4% On-Time SLA', 'Active'],
          ['Registered Shoppers', `${totalCustomers.toLocaleString()}`, '83.2% Retention Rate', 'Healthy'],
          ['Active Catalog SKUs', `${totalProducts.toLocaleString()}`, `${lowStockCount} Low Stock Alert`, lowStockCount > 0 ? 'Restock Needed' : 'Normal'],
          ['Cold-Chain Compliance', '100%', '3.2°C Regulated Temperature', 'Passed Standard']
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5 }
      });

      // Top Selling Products
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['Rank', 'Top Selling Product', 'Category', 'Units Sold', 'Revenue Generated']],
        body: (ADMIN_BEST_SELLING_PRODUCTS || []).map((p) => [
          `#${p.rank}`,
          p.name,
          p.category,
          `${p.unitsSold} units`,
          `Rs. ${p.revenue.toLocaleString()}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8 }
      });

      doc.save(`FreshMart_Executive_Summary_${Date.now()}.pdf`);
      addToast('Executive Report Exported 📄', 'PDF summary generated and downloaded.');
    } catch (e) {
      console.warn('PDF export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Category distribution
  const categoryCounts = {};
  (products || []).forEach((p) => {
    const cat = p.categoryLabel || p.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryColors = [
    { bg: 'bg-emerald-500', hex: '#10b981' },
    { bg: 'bg-blue-500', hex: '#3b82f6' },
    { bg: 'bg-amber-500', hex: '#f59e0b' },
    { bg: 'bg-rose-500', hex: '#f43f5e' },
    { bg: 'bg-purple-500', hex: '#8b5cf6' },
    { bg: 'bg-teal-500', hex: '#14b8a6' }
  ];

  const totalProds = totalProducts || 1;
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([catName, count], idx) => ({
      name: catName,
      count,
      percent: Math.round((count / totalProds) * 100),
      color: categoryColors[idx % categoryColors.length].bg,
      hex: categoryColors[idx % categoryColors.length].hex
    }));

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE COMMAND HEADER & QUICK ACTIONS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Executive Command Center</span>
                <span>📊</span>
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>5 Hubs Live (99.8% SLA)</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
              Real-time store performance, multi-hub inventory tracking, live delivery telematics, and revenue analytics for {todayDateStr}.
            </p>
          </div>

          {/* Quick Operations Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateModule('Products')}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Product</span>
            </button>

            <button
              onClick={() => onNavigateModule('Promotions')}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Flash Deals</span>
            </button>

            <button
              onClick={() => onNavigateModule('Delivery')}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>GPS Fleet</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isExporting ? 'Exporting...' : 'PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP 4 DYNAMIC METRIC CARDS WITH SPARKLINES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Gross Sales */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card hover:shadow-lg transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Sales</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {currency.symbol || 'Rs. '}
              {totalSales.toLocaleString()}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+18.4%</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">vs last period</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Avg. Order Value (AOV)</span>
              <span className="font-bold text-slate-800">Rs. 1,475</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card hover:shadow-lg transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {totalOrders.toLocaleString()}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+8.4%</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">{pendingOrdersCount} active in dispatch</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Fulfillment SLA Rate</span>
              <span className="font-bold text-emerald-600">99.4% On-Time</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Customers */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card hover:shadow-lg transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Shoppers</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {totalCustomers.toLocaleString()}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+12.6%</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">new accounts this month</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Repeat Shopper Rate</span>
              <span className="font-bold text-indigo-700">83.2% Retention</span>
            </div>
          </div>
        </div>

        {/* Card 4: Catalog & Low Stock */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card hover:shadow-lg transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalog Health</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {totalProducts.toLocaleString()} <span className="text-sm font-bold text-slate-400">SKUs</span>
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  lowStockCount > 0
                    ? 'text-rose-700 bg-rose-50 border border-rose-200/60'
                    : 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                }`}
              >
                {lowStockCount > 0 ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>{lowStockCount} Low Stock</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Inventory 100% Good</span>
                  </>
                )}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">{expiringCount} live deals</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Active Categories</span>
              <span className="font-bold text-slate-800">{topCategories.length || 6} Sectors</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. CENTERPIECE: INTERACTIVE SALES & REVENUE ANALYTICS ENGINE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Interactive Chart (8 Columns) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between space-y-5">
          
          {/* Chart Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Sales & Revenue Intelligence</h3>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Live Analytics
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hover over data points to inspect detailed revenue, orders, and growth metrics.
              </p>
            </div>

            {/* Metric & Period Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Metric Switcher */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setActiveMetric('revenue')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeMetric === 'revenue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setActiveMetric('orders')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeMetric === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setActiveMetric('aov')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeMetric === 'aov' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  AOV
                </button>
              </div>

              {/* Period Dropdown */}
              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="appearance-none text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-3 pr-8 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="today">Today (Hourly)</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="year">This Year (12 Mo)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Line / Bar Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl">
                <button
                  onClick={() => setChartStyle('line')}
                  title="Wave Area Chart"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    chartStyle === 'line' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartStyle('bar')}
                  title="Bar Columns Chart"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    chartStyle === 'bar' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

          {/* Active Highlight Banner */}
          {activePoint && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 border border-slate-100 rounded-2xl px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  ★
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block leading-tight">{activePoint.fullLabel || activePoint.label}</span>
                  <span className="text-base font-black text-slate-900">
                    {activeMetric === 'revenue'
                      ? `Rs. ${activePoint.revenue.toLocaleString()}`
                      : activeMetric === 'orders'
                      ? `${activePoint.orders.toLocaleString()} Dispatched Orders`
                      : `Rs. ${activePoint.aov.toLocaleString()} Avg Order`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-700 bg-emerald-100/70 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{activePoint.growth || '+15.2%'} Performance</span>
                </span>
                <span className="text-slate-400 font-mono hidden sm:inline text-[11px]">
                  {activePoint.orders} Orders • Rs. {activePoint.aov} AOV
                </span>
              </div>
            </div>
          )}

          {/* SVG Visual Canvas */}
          <div className="relative h-60 w-full flex items-center justify-center">
            
            {chartStyle === 'line' ? (
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                <defs>
                  <linearGradient id="execSalesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#10b981" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10b981" floodOpacity="0.3" />
                  </filter>
                </defs>

                {/* Horizontal Guide Gridlines */}
                {[0.25, 0.5, 0.75].map((pct, idx) => (
                  <line
                    key={idx}
                    x1={paddingX}
                    y1={paddingY + pct * (svgHeight - paddingY * 2)}
                    x2={svgWidth - paddingX}
                    y2={paddingY + pct * (svgHeight - paddingY * 2)}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                  />
                ))}

                {/* Filled Area */}
                <path d={areaPath} fill="url(#execSalesGradient)" />

                {/* Smooth Curve Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#glowEffect)"
                />

                {/* Interactive Points */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredIndex === idx;
                  const isLast = hoveredIndex === null && idx === points.length - 1;
                  const isSelected = isHovered || isLast;

                  return (
                    <g key={idx} className="cursor-pointer">
                      {/* Invisible hover target */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="18"
                        fill="transparent"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />

                      {/* Animated outer ring if selected */}
                      {isSelected && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="9"
                          fill="#10b981"
                          fillOpacity="0.25"
                          className="animate-ping"
                        />
                      )}

                      {/* Point Node */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? "6" : "4"}
                        fill={isSelected ? "#059669" : "#10b981"}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? "2.5" : "1.5"}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    </g>
                  );
                })}
              </svg>
            ) : (
              /* Bar Chart View */
              <div className="w-full h-full flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6">
                {currentData.map((d, idx) => {
                  const val = d[activeMetric];
                  const heightPercent = Math.max(12, Math.round((val / maxValue) * 100));
                  const isSelected = hoveredIndex === idx || (hoveredIndex === null && idx === currentData.length - 1);

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                    >
                      <div className="w-full max-w-[42px] h-full flex items-end justify-center">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-xl transition-all duration-300 ${
                            isSelected
                              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md shadow-emerald-500/30'
                              : 'bg-slate-200 group-hover:bg-emerald-300'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* X-Axis Labels */}
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 px-3 border-t border-slate-100 pt-3">
            {currentData.map((d, idx) => (
              <span
                key={idx}
                className={`transition-colors cursor-pointer ${
                  hoveredIndex === idx ? 'text-emerald-600 font-black scale-110' : 'hover:text-slate-700'
                }`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {d.label}
              </span>
            ))}
          </div>

          {/* Summary Stat Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/60 rounded-2xl p-3 border border-slate-100 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Period Total</span>
              <span className="font-black text-slate-900 text-sm">
                Rs. {values.reduce((s, v) => s + (activeMetric === 'revenue' ? v : 0), 0) > 0
                  ? values.reduce((s, v) => s + v, 0).toLocaleString()
                  : (totalSales * (period === 'year' ? 12 : period === '30days' ? 4 : 1)).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Daily Average</span>
              <span className="font-black text-slate-900 text-sm">Rs. {avgValue.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Peak Volume</span>
              <span className="font-black text-emerald-600 text-sm">Rs. {maxValue.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Projection</span>
              <span className="font-black text-blue-600 text-sm">Target Met (108%)</span>
            </div>
          </div>

        </div>

        {/* Top Categories & Revenue Contribution (4 Columns) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between space-y-5">
          
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Category Breakdown</h3>
              <span className="text-xs font-bold text-emerald-600">{totalProducts} SKUs</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Share of live catalog inventory and sales distribution</p>
          </div>

          {/* Interactive Visual Progress Rings */}
          <div className="space-y-3.5">
            {topCategories.length > 0 ? (
              topCategories.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                      <span>{cat.name}</span>
                    </span>
                    <span className="font-bold text-slate-900">{cat.percent}% ({cat.count} items)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${cat.percent}%` }}
                      className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 py-6 text-xs">Catalog Synchronizing...</div>
            )}
          </div>

          {/* Payment Method Breakdown Card */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2.5">
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
              Payment Gateway Share
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Cash on Delivery</span>
                <span className="font-bold text-slate-900">42%</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-medium">JazzCash Mobile</span>
                <span className="font-bold text-slate-900">28%</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-medium">EasyPaisa Wallet</span>
                <span className="font-bold text-slate-900">18%</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Debit / Credit</span>
                <span className="font-bold text-slate-900">12%</span>
              </div>
            </div>
          </div>

          {/* Quick Navigate to Catalog */}
          <button
            onClick={() => onNavigateModule('Categories')}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Manage All Catalog Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. LIVE DARK STORE HUBS & TELEMATICS MONITOR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Pakistan Dark Store Hubs & Live Telematics
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                Active Fleet
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live automated telemetry across 5 Dark Store SuperHubs and cold-chain dispatches
            </p>
          </div>

          <button
            onClick={() => onNavigateModule('Delivery')}
            className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Open Interactive GPS Radar</span>
          </button>
        </div>

        {/* 5 Hubs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
          {(ADMIN_BRANCH_PERFORMANCE || []).map((hub) => (
            <div
              key={hub.branch}
              className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 truncate max-w-[110px]">{hub.branch}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div>
                <span className="text-lg font-black text-slate-900 block leading-tight">
                  Rs. {hub.sales.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{hub.orders} dispatches today</span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold">
                <span className="text-emerald-700">★ {hub.rating} Score</span>
                <span className="text-slate-500">{hub.onTimeRate}% SLA</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SPLIT ROW: RECENT LIVE ORDERS + TOP PRODUCTS / LOW STOCK ACTION */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Orders Stream (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Recent Orders Stream</h3>
              <p className="text-xs text-slate-400 mt-0.5">High-priority customer orders awaiting dispatch or delivered</p>
            </div>
            <button
              onClick={() => onNavigateModule('Orders')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              View All Orders →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-2">
                  <th className="pb-2 font-semibold">Order ID</th>
                  <th className="pb-2 font-semibold">Customer</th>
                  <th className="pb-2 font-semibold">Amount</th>
                  <th className="pb-2 font-semibold">Payment</th>
                  <th className="pb-2 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(customerOrders && customerOrders.length > 0
                  ? customerOrders.slice(0, 5)
                  : [
                      { id: 'ORD-9421', customer: { name: 'Hafsa' }, total: 2450, paymentMethod: 'JazzCash', status: 'Processing' },
                      { id: 'ORD-9420', customer: { name: 'Aimen' }, total: 1850, paymentMethod: 'EasyPaisa', status: 'Delivered' },
                      { id: 'ORD-9419', customer: { name: 'Usman Ali' }, total: 3200, paymentMethod: 'Cash on Delivery', status: 'Pending' },
                      { id: 'ORD-9418', customer: { name: 'Fatima Noor' }, total: 4100, paymentMethod: 'Credit Card', status: 'Delivered' },
                      { id: 'ORD-9417', customer: { name: 'Zainab' }, total: 1250, paymentMethod: 'Cash on Delivery', status: 'Packed' }
                    ]
                ).map((ord) => {
                  const statusColor =
                    ord.status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : ord.status === 'Processing' || ord.status === 'Packed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-900">{ord.id}</td>
                      <td className="py-3 font-semibold text-slate-800">
                        {ord.customer?.name || ord.shippingAddress?.fullName || 'Customer'}
                      </td>
                      <td className="py-3 font-black text-slate-900">
                        {currency.symbol || 'Rs. '}
                        {Number(ord.total || 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-slate-500 font-medium">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {ord.paymentMethod || 'Cash on Delivery'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                          {ord.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Velocity Products & Low Stock Quick Restock (5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Stock Action & Best Sellers</h3>
              <p className="text-xs text-slate-400 mt-0.5">Instant one-click restock for low inventory</p>
            </div>
            <button
              onClick={() => onNavigateModule('Inventory')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              Inventory Suite →
            </button>
          </div>

          <div className="space-y-3">
            {(lowStockProducts.length > 0 ? lowStockProducts.slice(0, 3) : (products || []).slice(0, 3)).map((prod) => {
              const curStock = prod.stock ?? (prod.stockCount || 10);
              const isLow = curStock < 15;

              return (
                <div
                  key={prod.id || prod._id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={prod.image || prod.img || 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=80&q=80'}
                      alt={prod.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 text-xs truncate block">{prod.name}</span>
                      <span className={`text-[10px] font-bold ${isLow ? 'text-rose-600' : 'text-slate-400'}`}>
                        {curStock} units remaining {isLow && '⚠️'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickRestock(prod)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>+30 Stock</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Operational SLA Metrics Footer */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
            <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-800 font-bold block">Avg Packing Speed</span>
              <span className="font-black text-emerald-900 text-sm">8.4 Mins</span>
            </div>
            <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
              <span className="text-[10px] text-blue-800 font-bold block">Cold-Chain Accuracy</span>
              <span className="font-black text-blue-900 text-sm">100% (3°C)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

