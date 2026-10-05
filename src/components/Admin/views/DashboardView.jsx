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
import { BRANCH_METRICS } from '../../../data/branchCatalogData';

export const DashboardView = ({ onNavigateModule }) => {
  const {
    currency,
    navigateTo,
    products,
    customerOrders,
    customers,
    updateProductStock,
    addToast,
    currentTenant,
    setCurrentTenant,
    allTenants,
    branchMetrics,
    getBranchMetrics,
    branches,
    currentBranch,
    setCurrentBranch,
    branchInventory,
    branchOrders,
    updateBranchStockPrice
  } = useStore();

  // Active Tenant Metrics & Branding
  const tenantKey = currentTenant?.id || 'tenant-alfatah';
  const tenantMetrics = branchMetrics || (getBranchMetrics && getBranchMetrics(tenantKey)) || BRANCH_METRICS[tenantKey] || BRANCH_METRICS['tenant-alfatah'];
  const tenantThemeColor = tenantMetrics.themeColor || '#10b981';

  // Selected period: '7days' | 'today' | '30days' | 'year'
  const [period, setPeriod] = useState('7days');
  // Selected metric: 'revenue' | 'orders' | 'aov'
  const [activeMetric, setActiveMetric] = useState('revenue');
  // Chart visual style: 'line' | 'bar'
  const [chartStyle, setChartStyle] = useState('line');
  // Interactive hover point
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Real-time dynamic store metrics computed from state and tenant
  const liveOrderSales = (customerOrders || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalSales = liveOrderSales > 0 ? liveOrderSales : (tenantMetrics?.kpis?.todaySales || 784500);
  const totalOrders = (customerOrders || []).length > 0 ? (customerOrders || []).length : (tenantMetrics?.kpis?.totalOrders || 162);
  const totalCustomers = (customers || []).length;
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

  // Dynamic Customer Segment Metric based on Supermarket brand
  const customerKpi = useMemo(() => {
    switch (tenantKey) {
      case 'tenant-alfatah':
        return { label: 'VIP Privilege Members', count: 2410, sub: '88.5% Luxury Repeat Rate', badge: '+14.2%' };
      case 'tenant-chasevalue':
        return { label: 'Wholesale Accounts', count: 1840, sub: '92.1% Bulk Sacks Repeat', badge: '+19.6%' };
      case 'tenant-chaseup':
        return { label: 'Family Loyalty Cards', count: 3120, sub: '78.6% Monthly Basket Repeat', badge: '+11.4%' };
      case 'tenant-freshmart':
      default:
        return { label: 'App Daily Shoppers', count: 4250, sub: '83.2% 10-Min Retention', badge: '+15.8%' };
    }
  }, [tenantKey]);

  // Executive Header Theme Gradient
  const bannerGradient = useMemo(() => {
    switch (tenantKey) {
      case 'tenant-alfatah':
        return 'from-stone-950 via-red-950 to-amber-950';
      case 'tenant-chasevalue':
        return 'from-slate-950 via-blue-950 to-indigo-950';
      case 'tenant-chaseup':
        return 'from-slate-950 via-purple-950 to-violet-950';
      case 'tenant-freshmart':
      default:
        return 'from-slate-950 via-slate-900 to-sky-950';
    }
  }, [tenantKey]);

  // 2. Multi-Timeframe Chart Datasets (tailored per branch sales profile)
  const chartDatasets = useMemo(() => {
    const mult = tenantKey === 'tenant-alfatah' ? 1.62 : tenantKey === 'tenant-chasevalue' ? 1.12 : tenantKey === 'tenant-chaseup' ? 0.91 : 1.0;

    return {
      'today': [
        { label: '08:00', fullLabel: '8:00 AM', revenue: Math.round(24500 * mult), orders: Math.round(18 * (mult > 1.2 ? 0.9 : 1.2)), aov: Math.round(1361 * mult), growth: '+12%' },
        { label: '10:00', fullLabel: '10:00 AM', revenue: Math.round(58200 * mult), orders: Math.round(42 * (mult > 1.2 ? 0.9 : 1.2)), aov: Math.round(1385 * mult), growth: '+15%' },
        { label: '12:00', fullLabel: '12:00 PM', revenue: Math.round(96400 * mult), orders: Math.round(68 * (mult > 1.2 ? 0.9 : 1.2)), aov: Math.round(1417 * mult), growth: '+22%' },
        { label: '14:00', fullLabel: '2:00 PM', revenue: Math.round(74100 * mult), orders: Math.round(52 * (mult > 1.2 ? 0.9 : 1.2)), aov: Math.round(1425 * mult), growth: '+8%' },
        { label: '16:00', fullLabel: '4:00 PM', revenue: Math.round(88500 * mult), orders: Math.round(61 * (mult > 1.2 ? 0.9 : 1.2)), aov: Math.round(1450 * mult), growth: '+19%' },
        { label: '18:00', fullLabel: '6:00 PM', revenue: Math.round(112400 * mult), orders: Math.round(79 * (mult > 1.2 ? 0.9 : 1.2)), aov: Math.round(1422 * mult), growth: '+25%' },
        { label: '20:00', fullLabel: '8:00 PM', revenue: Math.round(145000 * mult), orders: Math.round(98 * (mult > 1.2 ? 0.9 : 1.2)), aov: Math.round(1479 * mult), growth: '+28%' },
        { label: '22:00', fullLabel: '10:00 PM (Now)', revenue: Math.round(62300 * mult), orders: Math.round(44 * (mult > 1.2 ? 0.9 : 1.2)), aov: Math.round(1415 * mult), growth: '+14%' }
      ],
      '7days': [
        { label: 'Mon', fullLabel: 'Monday, 01 Sep', revenue: Math.round(412000 * mult), orders: Math.round(284 * (mult > 1.2 ? 0.8 : 1.1)), aov: Math.round(1450 * mult), growth: '+10.4%' },
        { label: 'Tue', fullLabel: 'Tuesday, 02 Sep', revenue: Math.round(438500 * mult), orders: Math.round(298 * (mult > 1.2 ? 0.8 : 1.1)), aov: Math.round(1471 * mult), growth: '+14.2%' },
        { label: 'Wed', fullLabel: 'Wednesday, 03 Sep', revenue: Math.round(395000 * mult), orders: Math.round(275 * (mult > 1.2 ? 0.8 : 1.1)), aov: Math.round(1436 * mult), growth: '+6.8%' },
        { label: 'Thu', fullLabel: 'Thursday, 04 Sep', revenue: Math.round(456200 * mult), orders: Math.round(312 * (mult > 1.2 ? 0.8 : 1.1)), aov: Math.round(1462 * mult), growth: '+16.5%' },
        { label: 'Fri', fullLabel: 'Friday, 05 Sep', revenue: Math.round(512000 * mult), orders: Math.round(348 * (mult > 1.2 ? 0.8 : 1.1)), aov: Math.round(1471 * mult), growth: '+22.1%' },
        { label: 'Sat', fullLabel: 'Saturday, 06 Sep', revenue: Math.round(548900 * mult), orders: Math.round(372 * (mult > 1.2 ? 0.8 : 1.1)), aov: Math.round(1475 * mult), growth: '+26.8%' },
        { label: 'Sun', fullLabel: 'Sunday (Today)', revenue: Math.round(tenantMetrics?.kpis?.todaySales || 482500), orders: tenantMetrics?.kpis?.totalOrders || 327, aov: tenantMetrics?.kpis?.averageOrderValue || 1475, growth: tenantMetrics?.kpis?.growthRate || '+18.4%' }
      ],
      '30days': [
        { label: 'Week 1', fullLabel: '01 - 07 Aug', revenue: Math.round(2840000 * mult), orders: Math.round(1940 * (mult > 1.2 ? 0.8 : 1.1)), aov: Math.round(1463 * mult), growth: '+11.2%' },
        { label: 'Week 2', fullLabel: '08 - 14 Aug', revenue: Math.round(3120000 * mult), orders: Math.round(2150 * (mult > 1.2 ? 0.8 : 1.1)), aov: Math.round(1451 * mult), growth: '+14.8%' },
        { label: 'Week 3', fullLabel: '15 - 21 Aug', revenue: Math.round(3450000 * mult), orders: Math.round(2380 * (mult > 1.2 ? 0.8 : 1.1)), aov: Math.round(1449 * mult), growth: '+18.5%' },
        { label: 'Week 4', fullLabel: '22 - 28 Aug', revenue: Math.round(3890000 * mult), orders: Math.round(2680 * (mult > 1.2 ? 0.8 : 1.1)), aov: Math.round(1451 * mult), growth: '+22.4%' }
      ],
      'year': ADMIN_MONTHLY_SALES_CHART.map((m) => ({
        label: m.month.split(' ')[0],
        fullLabel: `${m.month} 2026`,
        revenue: Math.round(m.revenue * mult),
        orders: Math.round(m.orders * (mult > 1.2 ? 0.8 : 1.1)),
        aov: Math.round((m.revenue * mult) / (m.orders || 1)),
        growth: '+15.8%'
      }))
    };
  }, [tenantKey, tenantMetrics]);

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
      const brandName = tenantMetrics?.name || 'SUPERMARKET';

      // Header Banner
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${brandName.toUpperCase()} — EXECUTIVE STORE REPORT`, 14, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${todayStr} | Confidential Regional Store Summary`, 14, 22);

      // Store KPIs
      autoTable(doc, {
        startY: 34,
        head: [['Executive Metric', 'Value', 'Performance Benchmark', 'Status']],
        body: [
          ['Gross Revenue (PKR)', `Rs. ${totalSales.toLocaleString()}`, `${tenantMetrics?.kpis?.growthRate || '+18.4%'} vs Previous Cycle`, 'Optimal (Growth)'],
          ['Total Orders Handled', `${totalOrders.toLocaleString()}`, `${tenantMetrics?.kpis?.fulfillmentSla || '99.4%'} On-Time SLA`, 'Active'],
          [customerKpi?.label || 'Registered Shoppers', `${(customerKpi?.count || totalCustomers).toLocaleString()}`, customerKpi?.sub || '83.2% Retention Rate', 'Healthy'],
          ['Active Catalog SKUs', `${totalProducts.toLocaleString()}`, `${lowStockCount} Low Stock Alert`, lowStockCount > 0 ? 'Restock Needed' : 'Normal'],
          [tenantMetrics?.specialWidget?.metricLabel || 'Branch Compliance', tenantMetrics?.specialWidget?.metricValue || '100%', tenantMetrics?.specialWidget?.status || 'Active', 'Passed Standard']
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5 }
      });

      // Top Selling Products
      const topSellingList = (tenantMetrics?.topSellingProducts && tenantMetrics.topSellingProducts.length > 0)
        ? tenantMetrics.topSellingProducts
        : (ADMIN_BEST_SELLING_PRODUCTS || []);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['Rank', 'Top Selling Product', 'Category', 'Volume Sold', 'Revenue Generated']],
        body: topSellingList.map((p, idx) => [
          `#${p.rank || idx + 1}`,
          p.name,
          p.category,
          `${p.units || p.unitsSold || 50} units`,
          `Rs. ${(p.revenue || 50000).toLocaleString()}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8 }
      });

      const sanitizedBrand = (tenantMetrics?.name || 'Store').replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`${sanitizedBrand}_Executive_Summary_${Date.now()}.pdf`);
      addToast('Executive Report Exported 📄', `${brandName} PDF summary generated and downloaded.`);
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
      <div className={`bg-gradient-to-r ${bannerGradient} rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden transition-all duration-300`}>
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-2xl sm:text-3xl p-1 bg-white/10 rounded-2xl border border-white/20 shadow-xs">
                {currentTenant?.logo || '🏬'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{currentTenant?.name || tenantMetrics.name}</span>
              </h1>
              <span className="bg-white/15 text-white border border-white/25 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{tenantMetrics.badge || 'Regional SuperHub'}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200/90 font-medium max-w-2xl">
              {tenantMetrics.tagline} • Live metrics for {todayDateStr}.
            </p>
          </div>

          {/* Quick Operations Actions & Company/Branch Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Direct Company Switcher */}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-1.5 shadow-xs">
              <Store className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="text-[11px] font-bold text-slate-200 hidden sm:inline">Company:</span>
              <select
                value={tenantKey}
                onChange={(e) => {
                  const found = (allTenants || []).find((t) => t.id === e.target.value);
                  if (found) {
                    setCurrentTenant(found);
                    addToast('Company Switched 🏬', `Switched dashboard to ${found.name}`);
                  }
                }}
                className="text-xs font-black text-white bg-transparent border-none focus:outline-none cursor-pointer pr-1"
              >
                {(allTenants || []).map((t) => (
                  <option key={t.id} value={t.id} className="text-slate-900 bg-white font-bold">
                    {t.logo || '🏬'} {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Branch Selector under Company (Enforcing User → Tenant → Branch) */}
            {branches && branches.length > 0 && (
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-emerald-400/30 rounded-2xl px-3 py-1.5 shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="text-[11px] font-bold text-slate-200 hidden sm:inline">Branch:</span>
                <select
                  value={currentBranch?._id || currentBranch?.id}
                  onChange={(e) => {
                    const found = branches.find((b) => b._id === e.target.value || b.id === e.target.value);
                    if (found) {
                      setCurrentBranch(found);
                      addToast('Branch Active 📍', `Switched to ${found.name} (${found.city})`);
                    }
                  }}
                  className="text-xs font-black text-emerald-300 bg-transparent border-none focus:outline-none cursor-pointer pr-1"
                >
                  {branches.map((b) => (
                    <option key={b._id || b.id} value={b._id || b.id} className="text-slate-900 bg-white font-bold">
                      📍 {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => onNavigateModule('Products')}
              className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add SKU</span>
            </button>

            <button
              onClick={() => onNavigateModule('Promotions')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Deals</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isExporting ? 'Exporting...' : 'PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1B. MULTI-COMPANY ARCHITECTURE ENFORCEMENT TREE (User → Tenant → Branch → Data) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-black tracking-wide uppercase text-slate-200">
              Multi-Company Architecture: User → Tenant → Branch → Data
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60 self-start sm:self-auto">
            Strict Isolation Active
          </span>
        </div>

        {/* Visual Breadcrumb Flow */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">SUPER ADMIN</span>
          </div>
          <span className="text-slate-500 font-black">➔</span>
          
          <div className="bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800/60 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">COMPANY:</span>
            <span className="font-black text-white">{currentTenant?.name || 'Al-Fatah'}</span>
          </div>
          <span className="text-slate-500 font-black">➔</span>

          <div className="bg-blue-950/80 px-3 py-1.5 rounded-xl border border-blue-800/60 flex items-center gap-1.5">
            <span className="text-blue-400 font-bold">BRANCH:</span>
            <span className="font-black text-white">{currentBranch?.name || 'DHA Lahore'}</span>
            <span className="text-[10px] text-slate-400">({currentBranch?.city || 'Lahore'})</span>
          </div>
          <span className="text-slate-500 font-black">➔</span>

          <div className="bg-purple-950/80 px-3 py-1.5 rounded-xl border border-purple-800/60 flex items-center gap-1.5">
            <span className="text-purple-400 font-bold">INVENTORY:</span>
            <span className="font-black text-white">{(branchInventory || []).length} SKUs</span>
          </div>
          <span className="text-slate-500 font-black">➔</span>

          <div className="bg-rose-950/80 px-3 py-1.5 rounded-xl border border-rose-800/60 flex items-center gap-1.5">
            <span className="text-rose-400 font-bold">ORDERS:</span>
            <span className="font-black text-white">{(branchOrders || []).length} routed</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <span>
            📍 GPS Coordinates: <strong className="text-slate-300">{currentBranch?.latitude || 31.4697}, {currentBranch?.longitude || 74.4082}</strong>
          </span>
          <span className="text-emerald-400 font-semibold">
            ✓ Tenant isolation prevents cross-company data leakage
          </span>
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
              {tenantMetrics?.kpis?.todaySalesFormatted || `${currency.symbol || 'Rs. '}${totalSales.toLocaleString()}`}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{tenantMetrics?.kpis?.growthRate || '+18.4%'}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">vs last cycle</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Avg. Order Value (AOV)</span>
              <span className="font-bold text-slate-800">
                Rs. {(tenantMetrics?.kpis?.averageOrderValue || 1475).toLocaleString()}
              </span>
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
              {(tenantMetrics?.kpis?.totalOrders || totalOrders).toLocaleString()}
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
              <span className="font-bold text-emerald-600">{tenantMetrics?.kpis?.fulfillmentSla || '99.4% On-Time'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Brand Scoped Customer Segment */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card hover:shadow-lg transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{customerKpi.label}</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {customerKpi.count.toLocaleString()}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{customerKpi.badge}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">{customerKpi.sub}</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Account Classification</span>
              <span className="font-bold text-indigo-700">{tenantMetrics?.name?.split(' ')[0]} Verified</span>
            </div>
          </div>
        </div>

        {/* Card 4: Catalog & Low Stock Scoped */}
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
                {tenantMetrics?.name} Regional Hubs & Live Telematics
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                Active Fleet
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live automated telemetry across {tenantMetrics?.hubs?.length || 4} verified regional supermarket terminals and dispatch fleet
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

        {/* Dynamic Branch Hubs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {(tenantMetrics?.hubs || []).map((hub) => (
            <div
              key={hub.name}
              className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 truncate max-w-[130px]" title={hub.name}>
                  {hub.name}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-700 block">
                  📍 {hub.city}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {hub.ordersToday} dispatches today • {hub.activeRiders} couriers
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold">
                <span className="text-emerald-700">★ High SLA</span>
                <span className="text-slate-600">{hub.sla} On-Time</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4B. DEDICATED SUPERMARKET OPERATIONAL TELEMATICS & SPECIAL CAPABILITY */}
      {/* ========================================================================= */}
      {tenantMetrics?.specialWidget && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 border border-slate-700/80 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {tenantKey === 'tenant-alfatah' ? '❄️' : tenantKey === 'tenant-chasevalue' ? '🚛' : tenantKey === 'tenant-chaseup' ? '💳' : '⏱️'}
                </span>
                <h3 className="text-base font-black text-white tracking-tight">
                  {tenantMetrics.specialWidget.title}
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live Telematics
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {tenantMetrics.specialWidget.description}
              </p>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-4 shrink-0 text-left md:text-right min-w-[220px]">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                {tenantMetrics.specialWidget.metricLabel}
              </span>
              <span className="text-base font-black text-emerald-400 block mt-0.5">
                {tenantMetrics.specialWidget.metricValue}
              </span>
              <span className="text-[11px] text-slate-300 block mt-1 font-semibold">
                {tenantMetrics.specialWidget.status}
              </span>
            </div>
          </div>
        </div>
      )}

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
                {customerOrders && customerOrders.length > 0 ? (
                  customerOrders.slice(0, 5).map((ord) => {
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
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
                      No customer orders yet. Incoming checkout orders will automatically appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Velocity Products & Low Stock Quick Restock (5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {tenantMetrics?.name?.split(' ')[0]} Top Sellers & Restock
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Instant one-click restock for low inventory</p>
            </div>
            <button
              onClick={() => onNavigateModule('Inventory')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              Inventory Suite →
            </button>
          </div>

          {/* Top Selling Highlights for this branch */}
          {tenantMetrics?.topSellingProducts && tenantMetrics.topSellingProducts.length > 0 && (
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                ⭐ Top Revenue Driver This Week
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 truncate max-w-[210px]">
                  {tenantMetrics.topSellingProducts[0].name}
                </span>
                <span className="font-black text-emerald-600 whitespace-nowrap ml-2">
                  Rs. {tenantMetrics.topSellingProducts[0].revenue.toLocaleString()}
                </span>
              </div>
            </div>
          )}

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
              <span className="text-[10px] text-blue-800 font-bold block">SLA Compliance</span>
              <span className="font-black text-blue-900 text-sm">{tenantMetrics?.kpis?.fulfillmentSla || '99.4%'}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

