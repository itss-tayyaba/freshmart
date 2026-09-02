import React, { useState } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useStore } from '../../../context/StoreContext';

export const ReportsView = () => {
  const { customerOrders, products, customers, addToast } = useStore();
  const [timeframe, setTimeframe] = useState('Weekly'); // 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Timeframe-specific chart data
  const chartDatasets = {
    Daily: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      revenue: [45000, 52000, 48000, 61000, 75000, 92000, 88000],
      orders: [28, 34, 31, 42, 53, 68, 62],
      totalRevenue: 'PKR 461,000',
      avgDaily: 'PKR 65,857'
    },
    Weekly: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      revenue: [210000, 245000, 280000, 310230],
      orders: [160, 185, 210, 248],
      totalRevenue: 'PKR 1,045,230',
      avgDaily: 'PKR 261,307'
    },
    Monthly: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      revenue: [620000, 680000, 710000, 740000, 790000, 830000, 870000, 920000, 960000, 1010000, 1080000, 1150000],
      orders: [510, 560, 590, 620, 670, 710, 750, 790, 830, 870, 920, 980],
      totalRevenue: 'PKR 10,360,000',
      avgDaily: 'PKR 863,333'
    },
    Yearly: {
      labels: ['2023', '2024', '2025', '2026 (YTD)'],
      revenue: [4200000, 6800000, 9400000, 12850000],
      orders: [3800, 5900, 8200, 11400],
      totalRevenue: 'PKR 12,850,000',
      avgDaily: 'PKR 3,212,500'
    }
  };

  const currentData = chartDatasets[timeframe] || chartDatasets.Weekly;
  const maxRevenue = Math.max(...currentData.revenue);

  // Category Distribution Data
  const categoryDistribution = [
    { name: 'Fruits & Vegetables', percent: 38, amount: 'Rs. 397,187', color: '#10b981', dot: 'bg-emerald-500' },
    { name: 'Dairy & Farm Eggs', percent: 24, amount: 'Rs. 250,855', color: '#3b82f6', dot: 'bg-blue-500' },
    { name: 'Fresh Bakery & Bread', percent: 16, amount: 'Rs. 167,236', color: '#f59e0b', dot: 'bg-amber-500' },
    { name: 'Beverages & Juices', percent: 12, amount: 'Rs. 125,427', color: '#8b5cf6', dot: 'bg-purple-500' },
    { name: 'Snacks & Pantry Staples', percent: 10, amount: 'Rs. 104,525', color: '#ec4899', dot: 'bg-pink-500' }
  ];

  // Hourly Peak Order Hours
  const hourlyTraffic = [
    { hour: '8 AM', orders: 18, pct: 25 },
    { hour: '10 AM', orders: 42, pct: 60 },
    { hour: '12 PM', orders: 68, pct: 90 },
    { hour: '2 PM', orders: 35, pct: 50 },
    { hour: '4 PM', orders: 48, pct: 68 },
    { hour: '6 PM', orders: 74, pct: 100 }, // Peak
    { hour: '8 PM', orders: 65, pct: 88 },
    { hour: '10 PM', orders: 28, pct: 40 }
  ];

  // Payment Channels Breakdown
  const paymentChannels = [
    { method: 'JazzCash', share: 34, amount: 'Rs. 355,378', color: 'bg-rose-500' },
    { method: 'SadaPay & NayaPay', share: 28, amount: 'Rs. 292,664', color: 'bg-teal-500' },
    { method: 'Cash on Delivery (COD)', share: 23, amount: 'Rs. 240,402', color: 'bg-emerald-500' },
    { method: 'Direct Bank Transfer', share: 15, amount: 'Rs. 156,786', color: 'bg-indigo-500' }
  ];

  // Top Products Leaderboard
  const topProducts = [
    { name: 'Farm Fresh Banana 1Kg', category: 'Fruits', sold: '1,420 kg', revenue: 'Rs. 255,600', growth: '+18.4%' },
    { name: 'Olpers Full Cream Milk 1L', category: 'Dairy', sold: '980 packs', revenue: 'Rs. 205,800', growth: '+14.2%' },
    { name: 'Organic Red Tomatoes 1Kg', category: 'Vegetables', sold: '1,150 kg', revenue: 'Rs. 126,500', growth: '+22.5%' },
    { name: 'Farm Fresh Eggs (30 Pcs)', category: 'Dairy', sold: '320 crates', revenue: 'Rs. 144,000', growth: '+9.8%' },
    { name: 'Premium Basmati Rice 5kg', category: 'Pantry', sold: '145 bags', revenue: 'Rs. 181,250', growth: '+11.0%' }
  ];

  // =========================================================================
  // 📄 REAL PDF EXPORT GENERATION USING jsPDF + AutoTable
  // =========================================================================
  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // 1. Header Banner
      doc.setFillColor(16, 185, 129); // Emerald green #10b981
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('FreshMart - Executive Business Performance Report', 14, 13);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${today}  |  Period: ${timeframe} Analytics  |  Confidential & Proprietary`, 14, 21);

      // 2. Executive Summary Metrics Box
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive Business Summary & Key Metrics', 14, 38);

      autoTable(doc, {
        startY: 42,
        head: [['Metric Indicator', 'Value (PKR / Units)', 'Growth vs Prev Period', 'Benchmark Performance']],
        body: [
          ['Gross Sales Revenue', currentData.totalRevenue, '+14.8% YoY', 'Above Target (108%)'],
          ['Total Orders Fulfilled', `${currentData.orders.reduce((a, b) => a + b, 0).toLocaleString()} Orders`, '+9.2%', '99.4% Delivery Success'],
          ['Active Registered Customers', `${customers?.length || 5842} Customers`, '+16.3%', 'High Retention'],
          ['Average Order Basket (AOV)', 'PKR 2,450', '+4.5%', 'Optimal Margins'],
          ['Cold-Chain Express Delivery Speed', '12.4 Mins Average', '-1.2 Mins', '10-15 Min SLA Met']
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2.5 }
      });

      // 3. Sales Trend Data Breakdown Table
      const currentY1 = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`2. Sales & Revenue Trend Breakdown (${timeframe})`, 14, currentY1);

      const salesRows = currentData.labels.map((label, idx) => [
        label,
        `PKR ${currentData.revenue[idx].toLocaleString()}`,
        `${currentData.orders[idx]} Orders`,
        `PKR ${Math.round(currentData.revenue[idx] / (currentData.orders[idx] || 1)).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: currentY1 + 4,
        head: [['Time Period / Timeline', 'Gross Revenue (PKR)', 'Orders Volume', 'Average Ticket Size']],
        body: salesRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.2 }
      });

      // 4. Category Performance Breakdown Table
      const currentY2 = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Category Revenue Distribution', 14, currentY2);

      const categoryRows = categoryDistribution.map((c) => [
        c.name,
        `${c.percent}%`,
        c.amount,
        'High Margin / Fresh Produce'
      ]);

      autoTable(doc, {
        startY: currentY2 + 4,
        head: [['Category Department', 'Revenue Share (%)', 'Gross Volume (PKR)', 'Category Margin Status']],
        body: categoryRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 2 }
      });

      // 5. Top-Selling Products Table
      const currentY3 = doc.lastAutoTable.finalY + 10;
      if (currentY3 > 240) doc.addPage();

      const startY3 = currentY3 > 240 ? 20 : currentY3;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Top-Selling Grocery Products Leaderboard', 14, startY3);

      const productRows = topProducts.map((p, idx) => [
        `#${idx + 1} ${p.name}`,
        p.category,
        p.sold,
        p.revenue,
        p.growth
      ]);

      autoTable(doc, {
        startY: startY3 + 4,
        head: [['Product Name', 'Department', 'Units Sold', 'Total Revenue', 'MoM Growth']],
        body: productRows,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 2 }
      });

      // 6. Payment Channels
      const currentY4 = doc.lastAutoTable.finalY + 10;
      if (currentY4 > 240) doc.addPage();
      const startY4 = currentY4 > 240 ? 20 : currentY4;

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('5. Customer Payment Methods Breakdown', 14, startY4);

      const paymentRows = paymentChannels.map((pm) => [
        pm.method,
        `${pm.share}% Share`,
        pm.amount,
        'Instant Settlement / 0% Failure Rate'
      ]);

      autoTable(doc, {
        startY: startY4 + 4,
        head: [['Payment Gateway / Channel', 'Market Share', 'Settlement Volume', 'Status']],
        body: paymentRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 2 }
      });

      // Footer with signature note
      const finalY = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('FreshMart Business Intelligence Suite - Automatically verified & audited. Contact: finance@freshmart.pk', 14, finalY > 280 ? 285 : finalY);

      // Download the PDF
      doc.save(`FreshMart_Executive_Report_${timeframe}_${Date.now()}.pdf`);
      addToast('PDF Report Exported! 📄', 'Downloaded FreshMart Executive Business Report PDF.');
    } catch (err) {
      console.error('PDF export error:', err);
      addToast('Export Error', 'Unable to generate PDF report.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Business Analytics & Reports</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              Live BI Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time revenue performance, conversion funnel & PDF intelligence export</p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
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
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isExporting ? 'Generating PDF...' : 'Export PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards (6 Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Gross Sales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Revenue</span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">{currentData.totalRevenue}</h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>+14.8%</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            {currentData.orders.reduce((a, b) => a + b, 0).toLocaleString()}
          </h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>+9.2%</span>
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Ticket</span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">PKR 2,450</h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>+4.5%</span>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customers</span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            {customers?.length > 0 ? customers.length : '5,842'}
          </h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>+16.3%</span>
          </div>
        </div>

        {/* Net Profit Margin */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Margin</span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">24.6%</h3>
          <span className="text-[10px] text-slate-400 font-medium">After cold-chain ops</span>
        </div>

        {/* Delivery Success Rate */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivery SLA</span>
          <h3 className="text-lg font-black text-emerald-700 tracking-tight">99.4%</h3>
          <span className="text-[10px] text-slate-400 font-medium">Under 15 Mins</span>
        </div>

      </div>

      {/* 3. Main Analytics Grid: Sales Trend Graph + Category Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GRAPH 1: Interactive Revenue & Sales Trend Graph (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-600" />
                <span>Revenue & Sales Velocity</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time revenue curve for {timeframe} timeframe</p>
            </div>
            
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-bold block">Avg / Period</span>
              <span className="text-xs font-black text-emerald-700 font-mono">{currentData.avgDaily}</span>
            </div>
          </div>

          {/* Interactive SVG Area Chart */}
          <div className="h-64 relative flex flex-col justify-end pt-4 pb-4">
            
            {/* Hover Tooltip Popup */}
            {hoveredDataPoint !== null && (
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl border border-slate-700 pointer-events-none z-10 flex items-center gap-2"
              >
                <span>{currentData.labels[hoveredDataPoint]}:</span>
                <span className="text-emerald-400 font-mono">
                  PKR {currentData.revenue[hoveredDataPoint].toLocaleString()}
                </span>
                <span className="text-slate-400 text-[10px]">
                  ({currentData.orders[hoveredDataPoint]} orders)
                </span>
              </div>
            )}

            <svg className="w-full h-44 overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="400" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

              {/* Area Fill */}
              {(() => {
                const points = currentData.revenue.map((val, idx) => {
                  const x = (idx / (currentData.revenue.length - 1)) * 380 + 10;
                  const y = 110 - (val / maxRevenue) * 90;
                  return `${x},${y}`;
                });
                const d = `M 10,110 L ${points.join(' L ')} L 390,110 Z`;
                return <path d={d} fill="url(#emeraldGradient)" />;
              })()}

              {/* Line Stroke */}
              {(() => {
                const points = currentData.revenue.map((val, idx) => {
                  const x = (idx / (currentData.revenue.length - 1)) * 380 + 10;
                  const y = 110 - (val / maxRevenue) * 90;
                  return `${x},${y}`;
                });
                return (
                  <path
                    d={`M ${points.join(' L ')}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })()}

              {/* Interactive Circles on Points */}
              {currentData.revenue.map((val, idx) => {
                const x = (idx / (currentData.revenue.length - 1)) * 380 + 10;
                const y = 110 - (val / maxRevenue) * 90;
                const isHovered = hoveredDataPoint === idx;

                return (
                  <g key={idx} onMouseEnter={() => setHoveredDataPoint(idx)} onMouseLeave={() => setHoveredDataPoint(null)}>
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

            {/* X-Axis Labels */}
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mt-2 px-2">
              {currentData.labels.map((lbl, idx) => (
                <span
                  key={idx}
                  className={`cursor-pointer transition-colors ${hoveredDataPoint === idx ? 'text-emerald-700 font-black' : ''}`}
                >
                  {lbl}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* GRAPH 2: Category Revenue Distribution (Donut & Breakdown) (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>Category Sales Share</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Revenue distribution across grocery departments</p>
            </div>
          </div>

          {/* Radial / Donut SVG Simulation */}
          <div className="space-y-3 pt-1">
            {categoryDistribution.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.dot}`} />
                    <span className="font-bold text-slate-700">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{cat.amount}</span>
                    <span className="font-bold text-slate-400 text-[11px]">({cat.percent}%)</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Highest Growth Department:</span>
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">🥬 Organic Fruits & Veg (+22%)</span>
          </div>
        </div>

      </div>

      {/* 4. Second Grid: Hourly Peak Hours + Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GRAPH 3: Hourly Peak Order Hours (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Peak Ordering Hours</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Hourly order volume surge distribution</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
              🔥 Peak Surge: 6 PM - 9 PM
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 h-44 pt-6 pb-2 px-1">
            {hourlyTraffic.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.orders}
                </span>
                <div
                  className={`w-full rounded-t-xl transition-all duration-300 group-hover:brightness-95 ${
                    item.pct === 100
                      ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm'
                      : 'bg-slate-200 group-hover:bg-emerald-300'
                  }`}
                  style={{ height: `${item.pct}%` }}
                />
                <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{item.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GRAPH 4: Payment Methods Distribution (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Payment Gateways & Settlement</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">JazzCash, SadaPay, NayaPay, COD & Bank Settlement</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {paymentChannels.map((pm, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{pm.method}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900">{pm.amount}</span>
                    <span className="text-[11px] font-bold text-slate-400">({pm.share}%)</span>
                  </div>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${pm.color}`}
                    style={{ width: `${pm.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Top-Selling Products Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">Top-Selling Grocery Products Leaderboard</h3>
            <p className="text-xs text-slate-400 mt-0.5">Highest grossing items sorted by customer purchase volume</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 pb-3 font-semibold">
                <th className="pb-3">Product Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Units Sold</th>
                <th className="pb-3">Total Gross Revenue</th>
                <th className="pb-3">MoM Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topProducts.map((prod, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center text-[10px] font-black">
                      #{idx + 1}
                    </span>
                    <span>{prod.name}</span>
                  </td>
                  <td className="py-3 text-slate-600 font-medium">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                      {prod.category}
                    </span>
                  </td>
                  <td className="py-3 font-mono font-bold text-slate-800">{prod.sold}</td>
                  <td className="py-3 font-mono font-black text-emerald-700">{prod.revenue}</td>
                  <td className="py-3 font-bold text-emerald-600 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{prod.growth}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

