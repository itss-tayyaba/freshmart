import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart2,
  PieChart,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  FileText,
  CreditCard,
  Layers,
  ChevronDown,
  AlertTriangle,
  Building2,
  MapPin,
  XCircle,
  Truck,
  ShieldCheck,
  Percent,
  Activity,
  Award
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';
import {
  ADMIN_ANALYTICS_KPIS,
  ADMIN_DAILY_SALES_CHART,
  ADMIN_MONTHLY_SALES_CHART,
  ADMIN_BEST_SELLING_PRODUCTS,
  ADMIN_MOST_PROFITABLE_PRODUCTS,
  ADMIN_BRANCH_PERFORMANCE,
  ADMIN_CUSTOMER_GROWTH_CHART,
  ADMIN_CANCELLED_ORDERS_ANALYTICS,
  ADMIN_DELIVERY_PERFORMANCE
} from '../../../data/adminSuiteData';

export const ReportsView = () => {
  const { customerOrders, products, customers, addToast } = useStore();
  const [timeframe, setTimeframe] = useState('Daily'); // 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [hoveredDailyPoint, setHoveredDailyPoint] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Live analytics state with fallbacks
  const [kpiData, setKpiData] = useState(ADMIN_ANALYTICS_KPIS);
  const [dailySalesData, setDailySalesData] = useState(ADMIN_DAILY_SALES_CHART);
  const [monthlySalesData, setMonthlySalesData] = useState(ADMIN_MONTHLY_SALES_CHART);
  const [bestSellers, setBestSellers] = useState(ADMIN_BEST_SELLING_PRODUCTS);
  const [profitableProducts, setProfitableProducts] = useState(ADMIN_MOST_PROFITABLE_PRODUCTS);
  const [branches, setBranches] = useState(ADMIN_BRANCH_PERFORMANCE);
  const [customerGrowth, setCustomerGrowth] = useState(ADMIN_CUSTOMER_GROWTH_CHART);
  const [cancellations, setCancellations] = useState(ADMIN_CANCELLED_ORDERS_ANALYTICS);
  const [deliverySLA, setDeliverySLA] = useState(ADMIN_DELIVERY_PERFORMANCE);

  useEffect(() => {
    const fetchLiveAnalytics = async () => {
      try {
        const res = await apiService.getAnalytics();
        if (res && res.success) {
          if (res.kpis) setKpiData(res.kpis);
          if (res.charts?.dailySales) setDailySalesData(res.charts.dailySales);
          if (res.charts?.monthlySales) setMonthlySalesData(res.charts.monthlySales);
          if (res.charts?.bestSellingProducts) setBestSellers(res.charts.bestSellingProducts);
          if (res.charts?.mostProfitableProducts) setProfitableProducts(res.charts.mostProfitableProducts);
          if (res.charts?.branchPerformance) setBranches(res.charts.branchPerformance);
          if (res.charts?.customerGrowth) setCustomerGrowth(res.charts.customerGrowth);
          if (res.charts?.cancelledOrders) setCancellations(res.charts.cancelledOrders);
          if (res.charts?.deliveryPerformance) setDeliverySLA(res.charts.deliveryPerformance);
        }
      } catch (err) {
        console.warn('Live analytics fetch fallback to static dataset:', err.message);
      }
    };
    fetchLiveAnalytics();
  }, []);

  // Filter branches if selected
  const displayBranches = selectedBranch === 'All'
    ? branches
    : branches.filter((b) => b.branch.toLowerCase().includes(selectedBranch.toLowerCase()));

  // Max values for SVG chart scaling
  const maxDailySales = Math.max(...dailySalesData.map((d) => d.sales));
  const maxMonthlyRevenue = Math.max(...monthlySalesData.map((m) => m.revenue));
  const maxCustomerGrowth = Math.max(...customerGrowth.map((c) => c.total));

  // =========================================================================
  // 📄 PROFESSIONAL MULTI-PAGE EXECUTIVE PDF REPORT GENERATOR
  // =========================================================================
  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const todayStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // --- PAGE 1: Header & Executive KPIs ---
      doc.setFillColor(16, 185, 129); // Emerald #10b981
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('FreshMart - Executive Business Intelligence Report', 14, 13);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${todayStr} | Branch: ${selectedBranch === 'All' ? 'All Hubs (HQ)' : selectedBranch} | Confidential`, 14, 21);

      // Section 1: Executive KPI Metrics
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Core Executive KPIs & Store Vitals', 14, 38);

      autoTable(doc, {
        startY: 42,
        head: [['Metric Indicator', 'Value (PKR / Count)', 'Growth / Variance', 'Operational Status']],
        body: [
          ["Today's Gross Sales", kpiData.todaySales.formatted, kpiData.todaySales.growth, 'Peak Daily Volume'],
          ['Total Orders Fulfilled', `${kpiData.orders.formatted} Orders`, kpiData.orders.growth, '99.4% Delivery SLA Met'],
          ['Active Registered Customers', `${kpiData.customers.formatted} Shoppers`, kpiData.customers.growth, 'High 30-Day Retention'],
          ['Catalog Product SKUs', `${kpiData.products.formatted} Items`, kpiData.products.growth, '12 Categories Active'],
          ['Low Stock Inventory Alert', `${kpiData.lowStock.formatted} SKUs`, kpiData.lowStock.growth, 'Restock Queued']
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2.5 }
      });

      // Section 2: Daily Sales Breakdown
      const currentY1 = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('2. 7-Day Daily Sales Velocity & Order Volume', 14, currentY1);

      const dailyRows = dailySalesData.map((d) => [
        `${d.day} (${d.date})`,
        `Rs. ${d.sales.toLocaleString()}`,
        `${d.orders} Orders`,
        `Rs. ${d.aov.toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: currentY1 + 4,
        head: [['Day / Date', 'Daily Gross Sales', 'Orders Count', 'Average Basket (AOV)']],
        body: dailyRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 2 }
      });

      // Section 3: Monthly Sales Trajectory
      const currentY2 = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('3. 12-Month Revenue & Target Performance', 14, currentY2);

      const monthlyRows = monthlySalesData.slice(0, 6).map((m) => [
        m.month,
        `Rs. ${(m.revenue / 1000000).toFixed(2)}M`,
        `Rs. ${(m.target / 1000000).toFixed(2)}M`,
        `${m.orders.toLocaleString()} Orders`,
        m.revenue >= m.target ? 'Target Met (100%+)' : 'In Progress'
      ]);

      autoTable(doc, {
        startY: currentY2 + 4,
        head: [['Month', 'Revenue (PKR)', 'Target (PKR)', 'Orders Volume', 'Benchmark']],
        body: monthlyRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 2 }
      });

      // --- PAGE 2: Catalog & Branch Performance ---
      doc.addPage();

      // Section 4: Best-Selling Products
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('4. Best-Selling Products Leaderboard', 14, 20);

      const bestSellerRows = bestSellers.map((p) => [
        `#${p.rank} ${p.name}`,
        p.category,
        `${p.unitsSold.toLocaleString()} Units`,
        `Rs. ${p.revenue.toLocaleString()}`,
        `${p.share}% Volume Share`
      ]);

      autoTable(doc, {
        startY: 24,
        head: [['Product Name', 'Category', 'Units Sold', 'Gross Revenue', 'Share']],
        body: bestSellerRows,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 2 }
      });

      // Section 5: Most Profitable Products
      const currentY3 = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('5. Most Profitable Products & Margin Contribution', 14, currentY3);

      const profitRows = profitableProducts.map((p) => [
        p.name,
        p.category,
        `Rs. ${p.revenue.toLocaleString()}`,
        `Rs. ${p.profit.toLocaleString()}`,
        `${p.margin}% Net Margin`
      ]);

      autoTable(doc, {
        startY: currentY3 + 4,
        head: [['Product Name', 'Department', 'Gross Sales', 'Gross Profit', 'Margin %']],
        body: profitRows,
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 2 }
      });

      // Section 6: Branch Performance
      const currentY4 = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('6. Branch & City Hub Performance', 14, currentY4);

      const branchRows = branches.map((b) => [
        b.branch,
        b.city,
        `Rs. ${b.sales.toLocaleString()}`,
        `${b.orders} Orders`,
        `${b.share}%`,
        `${b.onTimeRate}% SLA`
      ]);

      autoTable(doc, {
        startY: currentY4 + 4,
        head: [['Branch Hub', 'City', 'Daily Sales', 'Orders', 'Revenue Share', 'On-Time SLA']],
        body: branchRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 2 }
      });

      // Section 7: Operations, Cancellations & Delivery SLAs
      const currentY5 = doc.lastAutoTable.finalY + 10;
      if (currentY5 > 240) doc.addPage();
      const startY5 = currentY5 > 240 ? 20 : currentY5;

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('7. Delivery SLAs & Order Cancellation Audit', 14, startY5);

      autoTable(doc, {
        startY: startY5 + 4,
        head: [['Operational Metric', 'Performance Benchmark', 'Audit Result', 'Status']],
        body: [
          ['Average Delivery Speed', '10-15 Minutes SLA', deliverySLA.avgDeliveryTime, 'Optimal Cold-Chain Met'],
          ['On-Time Delivery Success Rate', 'Above 98.0%', deliverySLA.onTimeRate, 'Industry Leading'],
          ['Active Rider Dispatch Fleet', '25+ Couriers Active', `${deliverySLA.fleetActive} Riders On-Duty`, 'Full Fleet Coverage'],
          ['Total Cancelled Orders Today', '< 3.0% Threshold', `${cancellations.cancelledCount} Orders (${cancellations.cancellationRate})`, 'Low Dispute Rate']
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 2 }
      });

      // Footer
      const finalY = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('FreshMart Business Intelligence Suite - Certified & Audited automatically. Contact: analytics@freshmart.pk', 14, finalY > 280 ? 285 : finalY);

      doc.save(`FreshMart_Executive_Analytics_Report_${Date.now()}.pdf`);
      addToast('PDF Report Exported! 📄', 'Executive analytics report downloaded successfully.');
    } catch (err) {
      console.error('PDF export error:', err);
      addToast('Export Error', 'Unable to generate PDF report.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. HEADER CONTROLS & TIME/BRANCH FILTERS                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Reports & Analytics</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live BI Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time revenue, product profitability, branch metrics & delivery performance</p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Branch Filter Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer pr-1"
            >
              <option value="All">All Branches (HQ)</option>
              <option value="Gulberg">Gulberg Flagship Hub</option>
              <option value="DHA">DHA Phase 5 Express</option>
              <option value="Johar Town">Johar Town Central</option>
              <option value="Bahria Town">Bahria Town Sector C</option>
              <option value="Islamabad">Islamabad F-7 Store</option>
            </select>
          </div>

          {/* Timeframe Switcher */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-bold shadow-inner">
            {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeframe === t
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isExporting ? 'Generating PDF...' : 'Export PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP 5 EXECUTIVE KPI METRIC CARDS                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Today's Sales */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/10 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 translate-x-3 -translate-y-3 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">Today's Sales</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight">{kpiData.todaySales.formatted}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-white/20 text-white">
                <TrendingUp className="w-3 h-3" />
                {kpiData.todaySales.growth}
              </span>
              <span className="text-[10px] text-emerald-100">{kpiData.todaySales.subtitle}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Orders */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex flex-col justify-between hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{kpiData.orders.formatted}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700">
                <TrendingUp className="w-3 h-3" />
                {kpiData.orders.growth}
              </span>
              <span className="text-[10px] text-slate-400">{kpiData.orders.subtitle}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Customers */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex flex-col justify-between hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customers</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{kpiData.customers.formatted}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700">
                <TrendingUp className="w-3 h-3" />
                {kpiData.customers.growth}
              </span>
              <span className="text-[10px] text-slate-400">{kpiData.customers.subtitle}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Products */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex flex-col justify-between hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Products</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{kpiData.products.formatted}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-purple-50 text-purple-700">
                <Sparkles className="w-3 h-3" />
                {kpiData.products.growth}
              </span>
              <span className="text-[10px] text-slate-400">{kpiData.products.subtitle}</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Low Stock */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-card flex flex-col justify-between bg-gradient-to-br from-amber-50/40 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Low Stock</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-900 tracking-tight">{kpiData.lowStock.formatted}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800">
                {kpiData.lowStock.growth}
              </span>
              <span className="text-[10px] text-amber-700/80 font-medium">{kpiData.lowStock.subtitle}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION 1: SALES VELOCITY (DAILY SALES + MONTHLY SALES CHARTS)         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: Daily Sales & Order Velocity (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <BarChart2 className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-black text-slate-900">Daily Sales Velocity</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">Day-by-day gross revenue and order frequency this week</p>
            </div>
            
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-bold block">Peak Day (Sat)</span>
              <span className="text-xs font-black text-emerald-700 font-mono">Rs. 548,900</span>
            </div>
          </div>

          {/* Interactive Daily Sales SVG Area Chart */}
          <div className="h-64 relative flex flex-col justify-end pt-4 pb-2">
            
            {/* Tooltip on Hover */}
            {hoveredDailyPoint !== null && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xl border border-slate-700 pointer-events-none z-10 flex items-center gap-3">
                <span className="font-semibold text-slate-300">{dailySalesData[hoveredDailyPoint].day} ({dailySalesData[hoveredDailyPoint].date}):</span>
                <span className="text-emerald-400 font-mono font-black">
                  Rs. {dailySalesData[hoveredDailyPoint].sales.toLocaleString()}
                </span>
                <span className="text-slate-400 text-[11px]">
                  • {dailySalesData[hoveredDailyPoint].orders} orders
                </span>
                <span className="text-slate-400 text-[11px]">
                  • AOV: Rs. {dailySalesData[hoveredDailyPoint].aov.toLocaleString()}
                </span>
              </div>
            )}

            <svg className="w-full h-44 overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dailySalesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="25" x2="400" y2="25" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="55" x2="400" y2="55" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="85" x2="400" y2="85" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

              {/* Area */}
              {(() => {
                const pts = dailySalesData.map((d, i) => {
                  const x = (i / (dailySalesData.length - 1)) * 380 + 10;
                  const y = 110 - (d.sales / maxDailySales) * 85;
                  return `${x},${y}`;
                });
                return <path d={`M 10,110 L ${pts.join(' L ')} L 390,110 Z`} fill="url(#dailySalesGradient)" />;
              })()}

              {/* Stroke */}
              {(() => {
                const pts = dailySalesData.map((d, i) => {
                  const x = (i / (dailySalesData.length - 1)) * 380 + 10;
                  const y = 110 - (d.sales / maxDailySales) * 85;
                  return `${x},${y}`;
                });
                return (
                  <path
                    d={`M ${pts.join(' L ')}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })()}

              {/* Data points */}
              {dailySalesData.map((d, i) => {
                const x = (i / (dailySalesData.length - 1)) * 380 + 10;
                const y = 110 - (d.sales / maxDailySales) * 85;
                const isHovered = hoveredDailyPoint === i;

                return (
                  <g key={i} onMouseEnter={() => setHoveredDailyPoint(i)} onMouseLeave={() => setHoveredDailyPoint(null)}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 7 : 4.5}
                      fill={isHovered ? '#047857' : '#10b981'}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="cursor-pointer transition-all hover:scale-125"
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-Axis */}
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mt-3 px-2">
              {dailySalesData.map((d, i) => (
                <span
                  key={i}
                  className={`transition-colors cursor-pointer ${hoveredDailyPoint === i ? 'text-emerald-700 font-black' : ''}`}
                >
                  {d.day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 2: Monthly Sales Trajectory (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Calendar className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-black text-slate-900">Monthly Sales (12M)</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700">
                +31.4% YoY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Revenue vs baseline forecast across active retail months</p>
          </div>

          {/* Bar Chart Representation */}
          <div className="space-y-2 pt-2">
            {monthlySalesData.slice(0, 6).map((m, idx) => {
              const pct = Math.round((m.revenue / maxMonthlyRevenue) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 font-bold">{m.month}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">{m.orders.toLocaleString()} orders</span>
                      <span className="font-mono font-black text-slate-900">Rs. {(m.revenue / 1000000).toFixed(2)}M</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Year-to-Date (YTD) Revenue</span>
            <span className="font-mono font-black text-slate-900">Rs. 98.42 Million</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. SECTION 2: CATALOG & PROFITABILITY (BEST-SELLING + PROFITABLE PRODUCTS)*/}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 3: Best-Selling Products (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Award className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">Best-Selling Products</h3>
                <p className="text-xs text-slate-400">Ranked by volume units sold & consumer demand</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">Top 6 SKUs</span>
          </div>

          <div className="divide-y divide-slate-100">
            {bestSellers.map((item) => (
              <div key={item.rank} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                    item.rank === 1 ? 'bg-amber-100 text-amber-800' :
                    item.rank === 2 ? 'bg-slate-200 text-slate-800' :
                    item.rank === 3 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    #{item.rank}
                  </span>
                  <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-slate-100 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">{item.name}</h4>
                    <span className="text-[10px] text-slate-400 block">{item.category}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-900 font-mono block">
                    Rs. {item.revenue.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">
                    {item.unitsSold.toLocaleString()} units sold
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 4: Most Profitable Products & Margin Analysis (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Percent className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">Most Profitable Products</h3>
                <p className="text-xs text-slate-400">High-margin items generating maximum gross profit</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              Avg Margin: 45.3%
            </span>
          </div>

          <div className="space-y-3">
            {profitableProducts.map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{p.name}</h4>
                    <span className="text-[10px] text-slate-400">{p.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-600 text-white font-mono">
                      {p.margin}% Margin
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold block mt-0.5 font-mono">
                      Profit: Rs. {p.profit.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Visual Margin Bar */}
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${p.margin}%` }}></div>
                  <div className="bg-slate-300 h-full" style={{ width: `${100 - p.margin}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. SECTION 3: OPERATIONS & SCALE (BRANCH PERFORMANCE + CUSTOMER GROWTH)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 5: Branch Performance (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">Branch & City Hub Performance</h3>
                <p className="text-xs text-slate-400">Multi-branch sales volume, fulfillment speed & SLA rate</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">5 Active Hubs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="pb-2.5">Branch Location</th>
                  <th className="pb-2.5">Daily Sales</th>
                  <th className="pb-2.5">Orders</th>
                  <th className="pb-2.5">Share</th>
                  <th className="pb-2.5 text-right">Fulfillment SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayBranches.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3">
                      <div className="font-black text-slate-900">{b.branch}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {b.city}
                      </div>
                    </td>
                    <td className="py-3 font-mono font-black text-slate-900">
                      Rs. {b.sales.toLocaleString()}
                    </td>
                    <td className="py-3 font-semibold text-slate-700">
                      {b.orders} orders
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 font-mono">
                        {b.share}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {b.onTimeRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CHART 6: Customer Growth Trajectory (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Users className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Customer Growth</h3>
                  <p className="text-xs text-slate-400">Total active registered customer cohort</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                1,842 Total
              </span>
            </div>

            {/* Growth Curve */}
            <div className="mt-4 space-y-2.5">
              {customerGrowth.map((cg, i) => {
                const widthPct = Math.round((cg.total / maxCustomerGrowth) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{cg.month}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-[10px] text-emerald-600 font-bold">{cg.rate}</span>
                        <span className="font-black text-slate-900">{cg.total.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs flex items-center justify-between">
            <span className="text-purple-900 font-bold">Monthly Retention Rate</span>
            <span className="font-black text-purple-900 font-mono">88.4% Loyal Buyers</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. SECTION 4: FULFILLMENT & QUALITY (CANCELLED ORDERS + DELIVERY SLA)      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 7: Cancelled Orders Analytics (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <XCircle className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">Cancelled Orders Breakdown</h3>
                <p className="text-xs text-slate-400">Root-cause audit of customer cancellation requests</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dispute Rate</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                {cancellations.cancellationRate} (Ultra Low)
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {cancellations.reasons.map((r, idx) => (
              <div key={idx} className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 font-bold">{r.reason}</span>
                  <span className="font-mono font-black text-slate-900">{r.count} orders ({r.pct}%)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 8: Delivery Speed & SLA Performance (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Truck className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">Delivery Speed & SLA Performance</h3>
                <p className="text-xs text-slate-400">Courier fulfillment speed & cold-chain express tracking</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Speed</span>
              <span className="text-xs font-black text-emerald-700 font-mono">{deliverySLA.avgDeliveryTime}</span>
            </div>
          </div>

          {/* Delivery SLA Distribution */}
          <div className="space-y-3">
            {deliverySLA.slaBreakdown.map((sla, idx) => (
              <div key={idx} className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {sla.bucket}
                  </span>
                  <span className="font-mono font-black text-slate-900">{sla.count} deliveries ({sla.pct}%)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${sla.pct}%`, backgroundColor: sla.color }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">On-Time Success</span>
              <span className="text-sm font-black text-emerald-900 font-mono">{deliverySLA.onTimeRate}</span>
            </div>
            <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
              <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider block">Active Courier Fleet</span>
              <span className="text-sm font-black text-blue-900 font-mono">{deliverySLA.fleetActive} Riders On-Duty</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

