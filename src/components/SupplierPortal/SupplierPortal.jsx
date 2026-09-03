import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Truck,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  Bell,
  User,
  LogOut,
  Store,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Download,
  Building,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  Check
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const SupplierPortal = () => {
  const {
    user,
    adminLogout,
    navigateTo,
    currency,
    addToast
  } = useStore();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'products' | 'orders' | 'deliveries' | 'payments' | 'invoices' | 'performance' | 'settings'
  const [orderFilter, setOrderFilter] = useState('All');
  const [selectedPO, setSelectedPO] = useState(null);

  // Supplier Company Details
  const supplierName = user?.name && user.name !== 'Store Admin' ? user.name : 'ABC Dairy Farms';

  // 1. Mock Purchase Orders from FreshMart (Matching User's ASCII Diagram)
  const [purchaseOrders, setPurchaseOrders] = useState([
    {
      id: 'PO-1024',
      item: 'Fresh Whole Milk (100 Liters)',
      qty: '100 Liters',
      amount: 23000,
      status: 'Pending Orders',
      statusCode: 'pending',
      color: 'amber',
      branch: 'Faisalabad Branch',
      dueDate: 'Today, 4:00 PM',
      poDate: '03 Sept 2026',
      notes: 'Chill at 4°C during transport'
    },
    {
      id: 'PO-1023',
      item: 'Greek Yogurt 500g (50 packs)',
      qty: '50 Packs',
      amount: 12500,
      status: 'To Ship',
      statusCode: 'to-ship',
      color: 'blue',
      branch: 'Lahore Main Hub',
      dueDate: 'Tomorrow, 10:00 AM',
      poDate: '02 Sept 2026',
      notes: 'Sealed cold crate packaging'
    },
    {
      id: 'PO-1022',
      item: 'Dairy Fresh Cream 200ml (30 packs)',
      qty: '30 Packs',
      amount: 8000,
      status: 'Deliver Today',
      statusCode: 'deliver-today',
      color: 'emerald',
      branch: 'Gulberg Warehouse Hub',
      dueDate: 'Today, 6:00 PM',
      poDate: '02 Sept 2026',
      notes: 'Delivery Van: LEK-8841'
    },
    {
      id: 'PO-1021',
      item: 'Desi Farm Butter 500g (20 packs)',
      qty: '20 Packs',
      amount: 17000,
      status: 'Complete Orders',
      statusCode: 'completed',
      color: 'purple',
      branch: 'DHA Phase 5 Warehouse',
      dueDate: '01 Sept 2026',
      poDate: '01 Sept 2026',
      notes: 'Received & Quality Verified'
    },
    {
      id: 'PO-1020',
      item: 'Mozzarella Cheese Blocks (15 kg)',
      qty: '15 Kg',
      amount: 24000,
      status: 'Complete Orders',
      statusCode: 'completed',
      color: 'purple',
      branch: 'Lahore Main Hub',
      dueDate: '29 Aug 2026',
      poDate: '28 Aug 2026',
      notes: 'Paid via Meezan Bank'
    }
  ]);

  // 2. Supplier Product Catalog
  const [suppliedProducts, setSuppliedProducts] = useState([
    {
      id: 'SUP-P1',
      name: 'Fresh Whole Cow Milk (Pasteurized)',
      category: 'Dairy & Eggs',
      unitPrice: 230,
      unit: 'Liter',
      minOrder: 50,
      leadTime: '4 Hours',
      status: 'Active Supply'
    },
    {
      id: 'SUP-P2',
      name: 'Probiotic Greek Yogurt 500g',
      category: 'Dairy & Eggs',
      unitPrice: 250,
      unit: 'Pack',
      minOrder: 20,
      leadTime: '12 Hours',
      status: 'Active Supply'
    },
    {
      id: 'SUP-P3',
      name: 'Pure Desi Farm Butter 500g',
      category: 'Dairy & Eggs',
      unitPrice: 850,
      unit: 'Pack',
      minOrder: 10,
      leadTime: '24 Hours',
      status: 'Active Supply'
    },
    {
      id: 'SUP-P4',
      name: 'Heavy Whipping Dairy Cream 200ml',
      category: 'Dairy & Eggs',
      unitPrice: 266,
      unit: 'Pack',
      minOrder: 15,
      leadTime: '8 Hours',
      status: 'Active Supply'
    },
    {
      id: 'SUP-P5',
      name: 'Artisan Mozzarella Cheese Block',
      category: 'Dairy & Eggs',
      unitPrice: 1600,
      unit: 'Kg',
      minOrder: 5,
      leadTime: '24 Hours',
      status: 'Active Supply'
    }
  ]);

  // 3. Deliveries & Dispatches
  const [deliveries, setDeliveries] = useState([
    {
      id: 'DISP-801',
      poId: 'PO-1022',
      destination: 'Gulberg Warehouse Hub',
      driver: 'Kashif Mehmood',
      phone: '0321-9988771',
      vehicle: 'Refrigerated Van (LEK-8841)',
      status: 'Out for Delivery',
      eta: 'Today, 5:30 PM',
      challanNo: 'CH-9921'
    },
    {
      id: 'DISP-800',
      poId: 'PO-1021',
      destination: 'DHA Phase 5 Warehouse',
      driver: 'Nadeem Akhtar',
      phone: '0300-4455667',
      vehicle: 'Pickup Truck (LEA-2231)',
      status: 'Delivered & Inspected',
      eta: '01 Sept, 2:00 PM',
      challanNo: 'CH-9920'
    }
  ]);

  // 4. Invoices
  const [invoices, setInvoices] = useState([
    {
      id: 'INV-2026-904',
      poRef: 'PO-1021',
      date: '01 Sept 2026',
      dueDate: '15 Sept 2026',
      subtotal: 17000,
      tax: 0,
      total: 17000,
      status: 'Paid',
      paymentMethod: 'Direct Bank Transfer'
    },
    {
      id: 'INV-2026-903',
      poRef: 'PO-1020',
      date: '28 Aug 2026',
      dueDate: '10 Sept 2026',
      subtotal: 24000,
      tax: 0,
      total: 24000,
      status: 'Paid',
      paymentMethod: 'Direct Bank Transfer'
    },
    {
      id: 'INV-2026-905',
      poRef: 'PO-1022',
      date: '02 Sept 2026',
      dueDate: '16 Sept 2026',
      subtotal: 8000,
      tax: 0,
      total: 8000,
      status: 'Pending Settlement',
      paymentMethod: 'Net 15 Days'
    }
  ]);

  // Status Handlers
  const handleUpdatePOStatus = (poId, newStatus) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          return {
            ...po,
            status: newStatus,
            statusCode: newStatus.toLowerCase().replace(/\s+/g, '-')
          };
        }
        return po;
      })
    );
    addToast('PO Updated 🧾', `Purchase order ${poId} marked as "${newStatus}".`);
    setSelectedPO(null);
  };

  // Nav Items Matching User's ASCII Layout
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package, count: suppliedProducts.length },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: 8 },
    { id: 'deliveries', label: 'Deliveries', icon: Truck, count: 2 },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'invoices', label: 'Invoices', icon: FileText, count: invoices.length },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-sans text-slate-800 antialiased">
      
      {/* 1. Left Dark Sidebar matching FreshMart & User ASCII */}
      <aside className="w-full lg:w-64 bg-[#0f172a] text-slate-300 p-5 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Header Brand */}
          <div className="flex items-center gap-2.5 pb-5 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              📦
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-none">FreshMart</h2>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mt-1">
                Supplier Portal
              </span>
            </div>
          </div>

          {/* Navigation Items Matching ASCII Diagram */}
          <nav className="mt-5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-indigo-900' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Store Link & Sign Out */}
        <div className="pt-6 border-t border-slate-800 space-y-2 mt-6">
          <button
            onClick={() => navigateTo('home')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/40 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              <span>Back to Storefront</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={adminLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out ({supplierName})</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar matching ASCII Diagram */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Vendor Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-black text-indigo-700 capitalize">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full" />
            </button>

            {/* Vendor Profile Matching ASCII */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                {supplierName.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-900 block leading-tight">{supplierName}</span>
                <span className="text-[10px] text-indigo-600 block font-bold">Verified Vendor Partner</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <main className="p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* ================================================================= */}
          {/* 1. DASHBOARD VIEW (MATCHING USER'S ASCII DIAGRAM EXACTLY)        */}
          {/* ================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Greeting Header */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <span>Good Morning, {supplierName}</span>
                    <span>👋</span>
                  </h1>
                  <p className="text-xs text-indigo-200 mt-1">
                    Here is your vendor summary for today's FreshMart supply orders & logistics dispatches.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-xs font-bold">
                  <Building className="w-4 h-4 text-indigo-300" />
                  <span>Verified Dairy & Farm Partner</span>
                </div>
              </div>

              {/* 4 Key Status Cards Matching ASCII: [ 8 Pending ] [ 3 To Ship ] [ 2 Deliver Today ] [ 15 Complete ] */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Pending Orders */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2 hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm">
                      🟡
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      New PO
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-mono">8</div>
                  <div className="text-xs font-bold text-slate-600">Pending Orders</div>
                  <p className="text-[10px] text-slate-400">Awaiting vendor confirmation</p>
                </div>

                {/* 2. To Ship */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2 hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                      📦
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Packing
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-mono">3</div>
                  <div className="text-xs font-bold text-slate-600">To Ship</div>
                  <p className="text-[10px] text-slate-400">Ready for dispatch loading</p>
                </div>

                {/* 3. Deliver Today */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2 hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                      🚚
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      En Route
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-mono">2</div>
                  <div className="text-xs font-bold text-slate-600">Deliver Today</div>
                  <p className="text-[10px] text-slate-400">Trucks arriving at hub</p>
                </div>

                {/* 4. Complete Orders */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2 hover:shadow-card transition-all">
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm">
                      🟢
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      Fulfilled
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-mono">15</div>
                  <div className="text-xs font-bold text-slate-600">Complete Orders</div>
                  <p className="text-[10px] text-slate-400">Received & Settled</p>
                </div>

              </div>

              {/* 2-Column Grid: Recent Purchase Orders + Upcoming Deliveries */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Purchase Orders (2 Cols) Matching User Diagram */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Recent Purchase Orders</h2>
                      <p className="text-xs text-slate-400">Incoming stock demand from FreshMart stores</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100 pb-2">
                          <th className="pb-3 font-semibold">PO Number</th>
                          <th className="pb-3 font-semibold">Supplied Item</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium">
                        {purchaseOrders.slice(0, 4).map((po) => (
                          <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 font-bold font-mono text-indigo-700">{po.id}</td>
                            <td className="py-3.5 text-slate-800">
                              <span className="font-bold block text-slate-900">{po.item}</span>
                              <span className="text-[10px] text-slate-400">{po.branch}</span>
                            </td>
                            <td className="py-3.5 font-mono font-bold text-slate-900">
                              {currency.symbol}{po.amount.toLocaleString()}
                            </td>
                            <td className="py-3.5">
                              <span
                                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                                  po.status === 'Pending Orders'
                                    ? 'bg-amber-100 text-amber-800'
                                    : po.status === 'To Ship'
                                    ? 'bg-blue-100 text-blue-800'
                                    : po.status === 'Deliver Today'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {po.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={() => setSelectedPO(po)}
                                className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Upcoming Deliveries Matching User Diagram */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-base font-black text-slate-900">Upcoming Deliveries</h2>
                        <p className="text-xs text-slate-400">Scheduled hub arrivals</p>
                      </div>
                      <span className="text-xl">📅</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-indigo-900">Faisalabad Branch Hub</span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full shadow-2xs">
                            Today • 4 PM
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-700">100L Whole Milk Batch • Refrigerated Van LEK-8841</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Lahore Central Main Hub</span>
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full">
                            Tomorrow • 10 AM
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">50 Greek Yogurt Packs • Cold Crate Box</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('deliveries')}
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Delivery Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ================================================================= */}
          {/* 2. SUPPLIED PRODUCTS VIEW                                         */}
          {/* ================================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">My Supplied Products</h2>
                  <p className="text-xs text-slate-400">Products and batches currently supplied by {supplierName} to FreshMart stores</p>
                </div>
                <button
                  onClick={() => addToast('Product Quotation', 'New item quotation form submitted to FreshMart Procurement.')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Submit New Product Quotation</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 pb-3">
                      <th className="pb-3 font-semibold">SKU / Code</th>
                      <th className="pb-3 font-semibold">Product Name</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Supply Unit Price</th>
                      <th className="pb-3 font-semibold">Min Supply Qty</th>
                      <th className="pb-3 font-semibold">Lead Time</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {suppliedProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 font-mono text-slate-400 font-bold">{p.id}</td>
                        <td className="py-3.5 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3.5 text-slate-500">{p.category}</td>
                        <td className="py-3.5 font-mono font-bold text-indigo-700">
                          {currency.symbol}{p.unitPrice} / {p.unit}
                        </td>
                        <td className="py-3.5 text-slate-600">{p.minOrder} {p.unit}s</td>
                        <td className="py-3.5 text-slate-600">{p.leadTime}</td>
                        <td className="py-3.5">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. PURCHASE ORDERS VIEW                                           */}
          {/* ================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Purchase Orders (POs)</h2>
                  <p className="text-xs text-slate-400">Review, confirm and fulfill replenishment purchase orders</p>
                </div>

                <div className="flex items-center gap-2">
                  {['All', 'Pending Orders', 'To Ship', 'Deliver Today', 'Complete Orders'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setOrderFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        orderFilter === filter
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 pb-3">
                      <th className="pb-3 font-semibold">PO #</th>
                      <th className="pb-3 font-semibold">Item & Quantity</th>
                      <th className="pb-3 font-semibold">Destination Hub</th>
                      <th className="pb-3 font-semibold">Due Schedule</th>
                      <th className="pb-3 font-semibold">Order Total</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {purchaseOrders
                      .filter((po) => orderFilter === 'All' || po.status === orderFilter)
                      .map((po) => (
                        <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 font-bold font-mono text-indigo-700">{po.id}</td>
                          <td className="py-4">
                            <span className="font-bold text-slate-900 block">{po.item}</span>
                            <span className="text-[11px] text-slate-400">Qty: {po.qty}</span>
                          </td>
                          <td className="py-4 text-slate-700">{po.branch}</td>
                          <td className="py-4 text-slate-600 font-mono text-[11px]">{po.dueDate}</td>
                          <td className="py-4 font-mono font-bold text-slate-900">
                            {currency.symbol}{po.amount.toLocaleString()}
                          </td>
                          <td className="py-4">
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                                po.status === 'Pending Orders'
                                  ? 'bg-amber-100 text-amber-800'
                                  : po.status === 'To Ship'
                                  ? 'bg-blue-100 text-blue-800'
                                  : po.status === 'Deliver Today'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {po.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => setSelectedPO(po)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Update Status
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 4. DELIVERIES VIEW                                                */}
          {/* ================================================================= */}
          {activeTab === 'deliveries' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Warehouse Deliveries & Challans</h2>
                  <p className="text-xs text-slate-400">Track transport vehicles, drivers, and delivery delivery challans</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliveries.map((del) => (
                  <div key={del.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                          🚚
                        </span>
                        <div>
                          <h3 className="font-black text-sm text-slate-900">{del.id}</h3>
                          <span className="text-[11px] text-indigo-700 font-mono font-bold">Challan: {del.challanNo}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        {del.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Destination:</span>
                        <span className="font-bold text-slate-800">{del.destination}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vehicle:</span>
                        <span className="font-mono text-slate-800">{del.vehicle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Driver & Phone:</span>
                        <span className="font-bold text-slate-800">{del.driver} ({del.phone})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expected Time:</span>
                        <span className="font-bold text-indigo-600">{del.eta}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => addToast('Challan Downloaded 📄', `Delivery challan for ${del.id} generated.`)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Delivery Challan PDF</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 5. PAYMENTS VIEW                                                  */}
          {/* ================================================================= */}
          {activeTab === 'payments' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-400 block">Total Gross Settlements</span>
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    {currency.symbol}385,000
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold block">100% Cleared to Bank</span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-400 block">Pending Clearance</span>
                  <div className="text-3xl font-black text-amber-600 font-mono">
                    {currency.symbol}43,500
                  </div>
                  <span className="text-[10px] text-slate-400 block">Due next cycle (15 Sept 2026)</span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-400 block">Primary Linked Bank</span>
                  <div className="text-sm font-black text-slate-900">Meezan Bank Ltd.</div>
                  <div className="text-[11px] font-mono text-slate-500">PK88MEZN000192837482910</div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 6. INVOICES VIEW                                                  */}
          {/* ================================================================= */}
          {activeTab === 'invoices' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Vendor Invoices & Tax Bills</h2>
                  <p className="text-xs text-slate-400">Generated tax invoices for completed supply purchase orders</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 pb-3">
                      <th className="pb-3 font-semibold">Invoice #</th>
                      <th className="pb-3 font-semibold">PO Reference</th>
                      <th className="pb-3 font-semibold">Invoice Date</th>
                      <th className="pb-3 font-semibold">Payment Terms</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 font-mono font-bold text-slate-900">{inv.id}</td>
                        <td className="py-3.5 font-mono text-indigo-700 font-bold">{inv.poRef}</td>
                        <td className="py-3.5 text-slate-500">{inv.date}</td>
                        <td className="py-3.5 text-slate-600">{inv.paymentMethod}</td>
                        <td className="py-3.5 font-mono font-bold text-slate-900">
                          {currency.symbol}{inv.total.toLocaleString()}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => addToast('Invoice Downloaded 📄', `Tax invoice ${inv.id} saved.`)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 7. PERFORMANCE VIEW                                               */}
          {/* ================================================================= */}
          {activeTab === 'performance' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                <h2 className="text-xl font-black text-slate-900">Vendor Quality & SLA Scorecard</h2>
                <p className="text-xs text-slate-400">Quarterly fulfillment score rated by FreshMart Quality Control</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-2 text-center">
                  <span className="text-4xl font-black text-emerald-600 font-mono">98.4%</span>
                  <div className="text-xs font-bold text-slate-900">Order Fulfillment Rate</div>
                  <p className="text-[10px] text-slate-400">Top Tier Supplier rating</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-2 text-center">
                  <span className="text-4xl font-black text-indigo-600 font-mono">97.8%</span>
                  <div className="text-xs font-bold text-slate-900">On-Time Arrival</div>
                  <p className="text-[10px] text-slate-400">Delivered within scheduled slot</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-2 text-center">
                  <span className="text-4xl font-black text-amber-500 font-mono">4.9 ⭐</span>
                  <div className="text-xs font-bold text-slate-900">Freshness & Quality Score</div>
                  <p className="text-[10px] text-slate-400">0.2% return / rejection rate</p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 8. SETTINGS VIEW                                                  */}
          {/* ================================================================= */}
          {activeTab === 'settings' && (
            <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-xs space-y-5 animate-in fade-in duration-200 max-w-2xl">
              <h2 className="text-xl font-black text-slate-900">Vendor Profile & Business Details</h2>
              
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company / Farm Name</label>
                  <input
                    type="text"
                    defaultValue={supplierName}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Business Contact Phone</label>
                    <input
                      type="text"
                      defaultValue="0321-5551234"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">NTN / Tax Registration Number</label>
                    <input
                      type="text"
                      defaultValue="7829104-2"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Warehouse Dispatch Address</label>
                  <input
                    type="text"
                    defaultValue="Plot 44, Industrial Estate, Multan Road, Lahore"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => addToast('Settings Saved 💾', 'Supplier profile updated successfully.')}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Save Business Details
                </button>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* PO Status Update Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Manage PO: {selectedPO.id}</h3>
                <p className="text-xs text-slate-400">{selectedPO.item}</p>
              </div>
              <button
                onClick={() => setSelectedPO(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl">
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="font-bold text-slate-800">{selectedPO.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Value:</span>
                <span className="font-mono font-bold text-indigo-700">{currency.symbol}{selectedPO.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-slate-800">{selectedPO.status}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 block">Change PO Status:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdatePOStatus(selectedPO.id, 'Pending Orders')}
                  className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-bold text-xs border border-amber-200 cursor-pointer"
                >
                  🟡 Pending
                </button>
                <button
                  onClick={() => handleUpdatePOStatus(selectedPO.id, 'To Ship')}
                  className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl font-bold text-xs border border-blue-200 cursor-pointer"
                >
                  📦 To Ship
                </button>
                <button
                  onClick={() => handleUpdatePOStatus(selectedPO.id, 'Deliver Today')}
                  className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl font-bold text-xs border border-emerald-200 cursor-pointer"
                >
                  🚚 Deliver Today
                </button>
                <button
                  onClick={() => handleUpdatePOStatus(selectedPO.id, 'Complete Orders')}
                  className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl font-bold text-xs border border-purple-200 cursor-pointer"
                >
                  🟢 Completed
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
