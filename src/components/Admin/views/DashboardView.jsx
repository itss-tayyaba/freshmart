import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ShoppingBag,
  Users,
  Boxes,
  Sparkles,
  DollarSign,
  Activity,
  Plus,
  RefreshCw,
  Store,
  MapPin,
  CreditCard,
  ArrowUpRight,
  Download,
  BarChart2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useStore } from '../../../context/StoreContext';
import { BRANCH_METRICS } from '../../../data/branchCatalogData';
import { resolveTenantId } from '../../../data/companyHierarchyData';

export const DashboardView = ({ onNavigateModule }) => {
  const {
    currency,
    products,
    customerOrders,
    adminOrders,
    customers,
    updateProductStock,
    addToast,
    currentTenant,
    currentBranch,
    setCurrentTenant,
    allTenants,
    branchMetrics,
    getBranchMetrics
  } = useStore();

  // Active Tenant Metrics & Branding
  const tenantKey = currentTenant?.id || 'tenant-alfatah';
  const tenantMetrics = branchMetrics || (getBranchMetrics && getBranchMetrics(tenantKey)) || BRANCH_METRICS[tenantKey] || BRANCH_METRICS['tenant-alfatah'];

  // Selected period: '7days' | 'today' | '30days' | 'year'
  const [period, setPeriod] = useState('7days');
  // Selected metric: 'revenue' | 'orders' | 'aov'
  const [activeMetric, setActiveMetric] = useState('revenue');
  // Chart visual style: 'line' | 'bar'
  const [chartStyle, setChartStyle] = useState('line');
  // Interactive hover point
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Use only live records for operational figures; absent data stays at zero.
  const tenantOrders = useMemo(() => {
    const combined = [...(customerOrders || []), ...(adminOrders || [])];
    const uniqueMap = new Map();
    combined.forEach((ord) => {
      if (ord && (ord.id || ord.orderId || ord._id)) {
        const bareKey = String(ord.id || ord.orderId || ord._id).replace(/^#/, '').trim().toLowerCase();
        if (!uniqueMap.has(bareKey)) {
          uniqueMap.set(bareKey, ord);
        }
      }
    });
    const all = Array.from(uniqueMap.values());
    return all.filter((order) => {
      if (!order.tenantId) return false;
      return order.tenantId === tenantKey || resolveTenantId(order.tenantId) === resolveTenantId(tenantKey);
    });
  }, [customerOrders, adminOrders, tenantKey]);
  const tenantCustomers = useMemo(
    () => (customers || []).filter((customer) => customer.tenantId === tenantKey || (!customer.tenantId && tenantKey === 'tenant-freshmart')),
    [customers, tenantKey]
  );
  const totalCustomers = tenantCustomers.length;
  const totalProducts = (products || []).length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const todayOrders = tenantOrders.filter((order) => {
    const date = new Date(order.createdAt || order.date || order.timestamp || '');
    return !Number.isNaN(date.getTime()) && date >= todayStart && date < tomorrowStart;
  });
  const salesToday = todayOrders.reduce(
    (sum, order) => sum + (Number(order.total ?? order.totalAmount ?? order.totalPrice) || 0),
    0
  );

  const lowStockProducts = (products || []).filter((p) => {
    const rawStock = p.stock ?? p.stockCount;
    return rawStock !== undefined && rawStock !== null && Number.isFinite(Number(rawStock)) && Number(rawStock) < 15;
  });
  const lowStockCount = lowStockProducts.length;

  const pendingOrdersCount = tenantOrders.filter(
    (order) => !['delivered', 'cancelled', 'complete', 'completed'].includes(String(order.status || '').toLowerCase())
  ).length;

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

  // Aggregate orders into chart buckets for the selected time period.
  const chartDatasets = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    let buckets;

    if (period === 'today') {
      buckets = Array.from({ length: 8 }, (_, index) => ({
        label: `${String(index * 3).padStart(2, '0')}:00`,
        fullLabel: `${String(index * 3).padStart(2, '0')}:00–${String(index * 3 + 3).padStart(2, '0')}:59`,
        start: new Date(today.getTime() + index * 3 * 60 * 60 * 1000),
        end: new Date(today.getTime() + (index + 1) * 3 * 60 * 60 * 1000)
      }));
    } else if (period === '7days') {
      buckets = Array.from({ length: 7 }, (_, index) => {
        const start = new Date(today);
        start.setDate(today.getDate() - 6 + index);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        return { label: start.toLocaleDateString(undefined, { weekday: 'short' }), fullLabel: start.toLocaleDateString(), start, end };
      });
    } else if (period === '30days') {
      buckets = Array.from({ length: 4 }, (_, index) => {
        const start = new Date(today);
        start.setDate(today.getDate() - 29 + index * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + (index === 3 ? 9 : 7));
        return { label: `Week ${index + 1}`, fullLabel: `${start.toLocaleDateString()} – ${new Date(end.getTime() - 1).toLocaleDateString()}`, start, end };
      });
    } else {
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      buckets = Array.from({ length: 12 }, (_, index) => {
        const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 11 + index, 1);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        return { label: start.toLocaleDateString(undefined, { month: 'short' }), fullLabel: start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), start, end };
      });
    }

    return buckets.map((bucket) => {
      const bucketOrders = tenantOrders.filter((order) => {
        const orderDate = new Date(order.createdAt || order.date || order.timestamp || '');
        return !Number.isNaN(orderDate.getTime()) && orderDate >= bucket.start && orderDate < bucket.end;
      });
      const revenue = bucketOrders.reduce((sum, order) => sum + (Number(order.total ?? order.totalAmount ?? order.totalPrice) || 0), 0);
      return {
        ...bucket,
        revenue,
        orders: bucketOrders.length,
        aov: bucketOrders.length ? Math.round(revenue / bucketOrders.length) : 0
      };
    });
  }, [period, tenantOrders]);

  const currentData = Array.isArray(chartDatasets) ? chartDatasets : (chartDatasets?.[period] || chartDatasets?.['7days'] || []);
  const values = (currentData || []).map((d) => Number(d?.[activeMetric]) || 0);
  const maxValue = values.length ? Math.max(...values, 1) : 1;
  const minValue = values.length ? Math.min(...values, 0) : 0;
  const avgValue = values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
  const activePoint = hoveredIndex !== null && currentData[hoveredIndex] ? currentData[hoveredIndex] : (currentData.length > 0 ? currentData[currentData.length - 1] : null);

  // SVG Coordinates calculation for dynamic line chart
  const svgWidth = 540;
  const svgHeight = 160;
  const paddingX = 30;
  const paddingY = 24;

  const points = (currentData || []).map((d, i) => {
    const x = paddingX + (i / (currentData.length - 1 || 1)) * (svgWidth - paddingX * 2);
    const range = maxValue - minValue || 1;
    const y = svgHeight - paddingY - (((Number(d?.[activeMetric]) || 0) - minValue * 0.8) / (maxValue - minValue * 0.8 || 1)) * (svgHeight - paddingY * 2);
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
          ["Today's Sales", `Rs. ${salesToday.toLocaleString()}`, `${todayOrders.length} orders today`, 'From saved orders'],
          ["Today's Orders", `${todayOrders.length}`, `${pendingOrdersCount} active orders`, 'From saved orders'],
          ['Customers', `${totalCustomers}`, 'Registered customer records', 'Current store'],
          ['Products', `${totalProducts}`, `${lowStockCount} low stock`, 'Current catalog']
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5 }
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['Rank', 'Top Selling Product', 'Category', 'Volume Sold', 'Revenue Generated']],
        body: bestSellingProducts.length ? bestSellingProducts.map((p, idx) => [
          `#${idx + 1}`,
          p.name,
          p.category,
          `${p.units} units`,
          `Rs. ${p.revenue.toLocaleString()}`
        ]) : [['—', 'No product sales recorded', '—', '0 units', 'Rs. 0']],
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

  const bestSellingProducts = useMemo(() => {
    const sold = new Map();
    tenantOrders.forEach((order) => {
      const items = Array.isArray(order.rawItems) ? order.rawItems : Array.isArray(order.items) ? order.items : Array.isArray(order.orderItems) ? order.orderItems : [];
      items.forEach((item) => {
        const name = item.name || item.productName || item.title;
        if (!name) return;
        const key = item.productId || item.id || name;
        const quantity = Number(item.quantity ?? item.qty ?? 1) || 1;
        const product = sold.get(key) || { name, category: item.category || item.categoryLabel || '—', units: 0, revenue: 0 };
        product.units += quantity;
        product.revenue += quantity * (Number(item.price ?? item.unitPrice ?? item.salePrice) || 0);
        sold.set(key, product);
      });
    });
    return [...sold.values()].sort((a, b) => b.units - a.units).slice(0, 5);
  }, [tenantOrders]);

  const paymentBreakdown = useMemo(() => {
    const counts = new Map();
    tenantOrders.forEach((order) => {
      const method = order.paymentMethod || order.payment || 'Not specified';
      counts.set(method, (counts.get(method) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([method, count]) => ({ method, count, percent: tenantOrders.length ? Math.round((count / tenantOrders.length) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [tenantOrders]);

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

            {/* Current branch */}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-emerald-400/30 rounded-2xl px-3 py-1.5 shadow-xs text-xs font-black text-emerald-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>{currentBranch?.name || currentBranch?.city || 'No active branch selected'}</span>
            </div>

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

      {/* Live totals from this store's actual records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Today's Sales", value: `${currency.symbol || 'Rs. '}${salesToday.toLocaleString()}`, detail: `${todayOrders.length} orders today`, icon: DollarSign, iconClass: 'bg-emerald-50 text-emerald-600' },
          { label: "Today's Orders", value: todayOrders.length.toLocaleString(), detail: `${pendingOrdersCount} active orders`, icon: ShoppingBag, iconClass: 'bg-blue-50 text-blue-600' },
          { label: 'Customers', value: totalCustomers.toLocaleString(), detail: 'Registered customers', icon: Users, iconClass: 'bg-indigo-50 text-indigo-600' },
          { label: 'Products', value: totalProducts.toLocaleString(), detail: `${lowStockCount} low stock`, icon: Boxes, iconClass: 'bg-purple-50 text-purple-600' }
        ].map(({ label, value, detail, icon: Icon, iconClass }) => (
          <div key={label} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconClass}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-3">{value}</h3>
            <p className="text-[11px] text-slate-500 mt-1.5">{detail}</p>
          </div>
        ))}
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
                <h3 className="text-base font-black text-slate-900 tracking-tight">Order & Sales History</h3>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Saved Orders
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hover over a period to inspect its recorded sales and order totals.
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
                  <option value="year">Last 12 Months</option>
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
                <span className="text-emerald-700 bg-emerald-100/70 font-bold px-2.5 py-1 rounded-lg">
                  {activePoint.orders} saved orders
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
                {(currentData || []).map((d, idx) => {
                  const val = d[activeMetric];
                  const heightPercent = maxValue > 0 ? Math.round((val / maxValue) * 100) : 0;
                  const isSelected = hoveredIndex === idx || (hoveredIndex === null && idx === (currentData || []).length - 1);

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
            {(currentData || []).map((d, idx) => (
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
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Period {activeMetric === 'revenue' ? 'Sales' : activeMetric === 'orders' ? 'Orders' : 'Average Order Value'}</span>
              <span className="font-black text-slate-900 text-sm">
                {activeMetric === 'orders' ? '' : 'Rs. '}{values.reduce((sum, value) => sum + value, 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Average {activeMetric === 'revenue' ? 'Sales' : activeMetric === 'orders' ? 'Orders' : 'Order Value'}</span>
              <span className="font-black text-slate-900 text-sm">{activeMetric === 'orders' ? '' : 'Rs. '}{avgValue.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Peak {activeMetric === 'revenue' ? 'Sales' : activeMetric === 'orders' ? 'Orders' : 'Order Value'}</span>
              <span className="font-black text-emerald-600 text-sm">{activeMetric === 'orders' ? '' : 'Rs. '}{maxValue.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Buckets with orders</span>
              <span className="font-black text-blue-600 text-sm">{currentData.filter((bucket) => bucket.orders > 0).length} / {currentData.length}</span>
            </div>
          </div>

        </div>

        {/* Category distribution from current catalog */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between space-y-5">
          
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Category Breakdown</h3>
              <span className="text-xs font-bold text-emerald-600">{totalProducts} SKUs</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Distribution of products currently listed in this store catalog</p>
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
            {paymentBreakdown.length ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {paymentBreakdown.map(({ method, count, percent }) => (
                  <div key={method} className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-slate-600 font-medium truncate">{method}</span>
                    <span className="font-bold text-slate-900">{percent}% ({count})</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-500">No saved orders yet.</p>}
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
                {tenantOrders.length > 0 ? (
                  tenantOrders.slice(0, 5).map((ord) => {
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
                          {ord.customerName || (typeof ord.customer === 'string' ? ord.customer : ord.customer?.name) || ord.shippingAddress?.fullName || 'Customer'}
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
                {tenantMetrics?.name?.split(' ')[0] || 'Store'} Inventory
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
          {bestSellingProducts.length > 0 && (
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                Top seller in saved orders
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 truncate max-w-[210px]">
                  {bestSellingProducts[0].name} · {bestSellingProducts[0].units} sold
                </span>
                <span className="font-black text-emerald-600 whitespace-nowrap ml-2">
                  Rs. {bestSellingProducts[0].revenue.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {lowStockProducts.length > 0 ? lowStockProducts.slice(0, 3).map((prod) => {
              const curStock = Number(prod.stock ?? prod.stockCount);

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
                      <span className="text-[10px] font-bold text-rose-600">
                        {curStock} units remaining
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
            }) : <p className="text-xs text-slate-500">No low stock products with inventory data.</p>}
          </div>

          {/* Operational SLA Metrics Footer */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
            <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-800 font-bold block">Active Orders</span>
              <span className="font-black text-emerald-900 text-sm">{pendingOrdersCount}</span>
            </div>
            <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
              <span className="text-[10px] text-blue-800 font-bold block">Products Listed</span>
              <span className="font-black text-blue-900 text-sm">{totalProducts}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
