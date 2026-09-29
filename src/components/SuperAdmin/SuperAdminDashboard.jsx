import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  Plus,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ArrowUpRight,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Store,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Layers,
  Truck,
  MapPin,
  Calendar,
  X,
  Copy,
  Check,
  Sliders,
  DollarSign,
  Activity,
  LogOut,
  FileText,
  SlidersHorizontal,
  Bell,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  Phone,
  LayoutDashboard,
  Percent,
  Navigation,
  Sparkles,
  UserCheck,
  Settings,
  ClipboardList,
  ShoppingCart,
  Edit2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SUBSCRIPTION_PLANS } from '../../data/tenantData';

export const SuperAdminDashboard = ({ onSwitchToStoreAdmin }) => {
  const {
    tenants,
    setTenants,
    currentTenant,
    setCurrentTenant,
    addTenant,
    inviteTenant,
    approveTenant,
    suspendTenant,
    activateTenant,
    deleteTenant,
    updateTenantSubscription,
    getTenantOrders,
    getTenantPerformance,
    getPlatformOverview,
    adminOrders,
    riders,
    adminLogout,
    navigateTo,
    addToast,
    storeAdmins,
    addStoreAdmin,
    updateStoreAdmin,
    deleteStoreAdmin,
    toggleStoreAdminStatus
  } = useStore();

  // Active Navigation in Sidebar
  const [activeNav, setActiveNav] = useState('dashboard'); // 'dashboard' | 'tenants' | 'branches' | 'plans' | 'admins' | 'orders'

  // Modals
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isManageAdminsOpen, setIsManageAdminsOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [revenueTimeframe, setRevenueTimeframe] = useState('today');
  const [topTenantsTimeframe, setTopTenantsTimeframe] = useState('today');
  const [salesTimeframe, setSalesTimeframe] = useState('7days');
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // 6 Tenants Dataset matching screenshot
  // Seeded with Al-Fatah, Chase Value, Chase Up, Fresh Mart, Local Grocery, Super Store
  const defaultStores = [
    {
      id: 'tenant-alfatah',
      name: 'Al-Fatah',
      fullName: 'Al-Fatah Supermarket',
      tagline: 'Premium Supermarket',
      status: 'Active',
      branchesCount: 4,
      ordersToday: 645,
      revenueToday: 312450,
      revenueFormatted: 'PKR 312,450',
      color: '#16a34a',
      logo: '🏬',
      plan: 'Enterprise',
      sharePct: '25%',
      barHeight: 88,
      ownerEmail: 'admin@alfatah.pk',
      ownerName: 'Sheikh Tariq Al-Fatah',
      hubs: ['Gulberg Mall Hub', 'DHA Phase 5', 'Mall of Lahore', 'Centaurus Islamabad']
    },
    {
      id: 'tenant-chasevalue',
      name: 'Chase Value',
      fullName: 'Chase Value (Local Grocery)',
      tagline: 'Quality Products, Great Prices',
      status: 'Active',
      branchesCount: 3,
      ordersToday: 512,
      revenueToday: 241230,
      revenueFormatted: 'PKR 241,230',
      color: '#2563eb',
      logo: '🛒',
      plan: 'Professional',
      sharePct: '19%',
      barHeight: 68,
      ownerEmail: 'admin@chasevalue.pk',
      ownerName: 'Farhan Qureshi',
      hubs: ['Shaheed-e-Millat Karachi', 'North Nazimabad', 'Gulshan-e-Iqbal']
    },
    {
      id: 'tenant-chaseup',
      name: 'Chase Up',
      fullName: 'Chase Up Department Chain',
      tagline: 'Family Shopping Store',
      status: 'Active',
      branchesCount: 3,
      ordersToday: 467,
      revenueToday: 218760,
      revenueFormatted: 'PKR 218,760',
      color: '#7c3aed',
      logo: '🏪',
      plan: 'Professional',
      sharePct: '17%',
      barHeight: 62,
      ownerEmail: 'admin@chaseup.pk',
      ownerName: 'Muhammad Salman',
      hubs: ['Clifton Karachi Hub', 'Hassan Square', 'Faisalabad Clock Tower']
    },
    {
      id: 'tenant-freshmart',
      name: 'Fresh Mart',
      fullName: 'Unimart (Fresh Mart)',
      tagline: 'Fresh • Healthy • Local',
      status: 'Active',
      branchesCount: 2,
      ordersToday: 398,
      revenueToday: 176540,
      revenueFormatted: 'PKR 176,540',
      color: '#ea580c',
      logo: '🛒',
      plan: 'Enterprise',
      sharePct: '14%',
      barHeight: 50,
      ownerEmail: 'admin@unimart.pk',
      ownerName: 'Aimen Yasin',
      hubs: ['Gulberg SuperHub', 'DHA Phase 6', 'Johar Town']
    },
    {
      id: 'tenant-localgrocery',
      name: 'Local Grocery',
      fullName: 'Local Grocery Express',
      tagline: 'Fresh • Local • Reliable',
      status: 'Active',
      branchesCount: 2,
      ordersToday: 283,
      revenueToday: 142690,
      revenueFormatted: 'PKR 142,690',
      color: '#dc2626',
      logo: '🏬',
      plan: 'Starter',
      sharePct: '11%',
      barHeight: 40,
      ownerEmail: 'admin@localgrocery.pk',
      ownerName: 'Hamza Sheikh',
      hubs: ['Multan Cantt Hub', 'Model Town Hub']
    },
    {
      id: 'tenant-superstore',
      name: 'Super Store',
      fullName: 'Super Store Snacks & More',
      tagline: 'Snacks • Drinks • More',
      status: 'Inactive',
      branchesCount: 2,
      ordersToday: 154,
      revenueToday: 94320,
      revenueFormatted: 'PKR 94,320',
      color: '#64748b',
      logo: '🏪',
      plan: 'Starter',
      sharePct: '8%',
      barHeight: 26,
      ownerEmail: 'admin@superstore.pk',
      ownerName: 'Bilal Khan',
      hubs: ['Rawalpindi Saddar Hub']
    }
  ];

  // Merge live context tenants with baseline stores
  const displayStores = useMemo(() => {
    return defaultStores.map((store) => {
      const live = (tenants || []).find((t) => t.id === store.id || t.slug === store.id);
      if (live) {
        return {
          ...store,
          name: live.name?.split(' ')[0] || store.name,
          fullName: live.name || store.fullName,
          status: live.status || store.status,
          plan: live.subscription?.plan || store.plan,
          ownerEmail: live.ownerEmail || store.ownerEmail,
          ownerName: live.ownerName || store.ownerName,
          hubs: live.hubs && live.hubs.length > 0 ? live.hubs : store.hubs
        };
      }
      return store;
    });
  }, [tenants]);

  // Modals form states
  const [newAdminForm, setNewAdminForm] = useState({
    tenantId: 'tenant-alfatah',
    name: '',
    email: '',
    phone: '',
    password: 'password123'
  });

  const [editPlanForm, setEditPlanForm] = useState({
    plan: 'Enterprise',
    billingCycle: 'monthly',
    price: 75000
  });

  const [editStoreForm, setEditStoreForm] = useState({
    name: '',
    tagline: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    city: 'Lahore, Pakistan'
  });

  // Action handlers
  const handleOpenDetails = (store) => {
    setSelectedTenant(store);
    setIsDetailsModalOpen(true);
  };

  const handleOpenPlan = (store) => {
    setSelectedTenant(store);
    setEditPlanForm({
      plan: store.plan || 'Enterprise',
      billingCycle: 'monthly',
      price: store.plan === 'Enterprise' ? 75000 : store.plan === 'Professional' ? 35000 : 15000
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;
    await updateTenantSubscription(selectedTenant.id, {
      plan: editPlanForm.plan,
      price: Number(editPlanForm.price),
      billingCycle: editPlanForm.billingCycle
    });
    addToast('Plan Updated 💳', `${selectedTenant.name} subscription changed to ${editPlanForm.plan}.`);
    setIsPlanModalOpen(false);
  };

  const handleToggleSuspend = async (store) => {
    if (store.status === 'Active') {
      await suspendTenant(store.id, 'Administrative review');
      addToast('Tenant Suspended ⚠️', `${store.name} has been suspended.`);
    } else {
      await activateTenant(store.id);
      addToast('Tenant Activated ✅', `${store.name} is now active.`);
    }
  };

  const handleOpenManage = (store) => {
    setSelectedTenant(store);
    setEditStoreForm({
      name: store.fullName,
      tagline: store.tagline,
      ownerName: store.ownerName,
      ownerEmail: store.ownerEmail,
      ownerPhone: '+92 300 1234567',
      city: 'Lahore, Pakistan'
    });
    setIsManageModalOpen(true);
  };

  const handleSaveManage = (e) => {
    e.preventDefault();
    if (!selectedTenant) return;
    setTenants((prev) =>
      prev.map((t) =>
        t.id === selectedTenant.id
          ? {
              ...t,
              name: editStoreForm.name,
              tagline: editStoreForm.tagline,
              ownerName: editStoreForm.ownerName,
              ownerEmail: editStoreForm.ownerEmail
            }
          : t
      )
    );
    addToast('Store Updated 🏬', `${editStoreForm.name} profile and settings saved.`);
    setIsManageModalOpen(false);
  };

  const handleCreateAdminSubmit = (e) => {
    e.preventDefault();
    if (!newAdminForm.name || !newAdminForm.email || !newAdminForm.password) {
      addToast('Missing Required Fields ⚠️', 'Please fill name, email, and password.', 'error');
      return;
    }

    const assignedStore = displayStores.find((s) => s.id === newAdminForm.tenantId);
    addStoreAdmin({
      ...newAdminForm,
      tenantName: assignedStore ? assignedStore.fullName : 'Supermarket'
    });

    setNewAdminForm({
      tenantId: 'tenant-alfatah',
      name: '',
      email: '',
      phone: '',
      password: 'password123'
    });
    setIsAddAdminOpen(false);
  };

  const togglePasswordVisibility = (adminId) => {
    setShowPasswordMap((prev) => ({ ...prev, [adminId]: !prev[adminId] }));
  };

  const handleImpersonateStore = (store) => {
    const liveTenant = (tenants || []).find((t) => t.id === store.id) || store;
    setCurrentTenant(liveTenant);
    if (onSwitchToStoreAdmin) {
      onSwitchToStoreAdmin(liveTenant);
    } else {
      navigateTo('admin');
    }
    addToast('Switched to Store Admin 🏬', `Managing ${store.name}`);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased">
      
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (Dark Navy #0B132B Matching Exact Screenshot)            */}
      {/* ========================================================================= */}
      <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col shrink-0 select-none border-r border-slate-900 min-h-screen">
        
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/60">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-extrabold text-base leading-tight tracking-tight">Unimart</h1>
            <p className="text-[10px] text-slate-400 font-medium">Multi-Tenant Grocery Platform</p>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto text-xs font-semibold">
          
          {/* Main Dashboard item */}
          <div>
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeNav === 'dashboard'
                  ? 'bg-[#1E293B] text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Dashboard</span>
            </button>
          </div>

          {/* TENANT MANAGEMENT */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Tenant Management
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveNav('tenants');
                  const el = document.getElementById('tenants-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <Store className="w-4 h-4 text-emerald-400" />
                <span>Tenants</span>
                <span className="ml-auto text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">6</span>
              </button>
              <button
                onClick={() => {
                  setActiveNav('branches');
                  const el = document.getElementById('map-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Branches</span>
                <span className="ml-auto text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">18</span>
              </button>
              <button
                onClick={() => setIsPlanModalOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Subscription Plans</span>
              </button>
            </div>
          </div>

          {/* USERS & ACCESS */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Users & Access
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setIsManageAdminsOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-blue-950/40 text-blue-200 border border-blue-800/40 hover:bg-blue-900/50 transition cursor-pointer font-bold"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Admins (Mart Admins)</span>
                <span className="ml-auto text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {(storeAdmins || []).length}
                </span>
              </button>
              <button
                onClick={() => addToast('Customers Registry 👥', '48,732 active platform customers verified across all marts.')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>Customers</span>
              </button>
              <button
                onClick={() => addToast('Rider Fleet 🛵', '84 active delivery riders on platform.')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <Truck className="w-4 h-4 text-rose-400" />
                <span>Riders</span>
              </button>
            </div>
          </div>

          {/* ORDERS & DELIVERIES */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Orders & Deliveries
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  const el = document.getElementById('orders-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>All Orders</span>
              </button>
              <button
                onClick={() => addToast('Live Radar GPS 📡', 'Dark Store dispatch telemetry active.')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-indigo-400" />
                <span>Live Tracking</span>
              </button>
              <button
                onClick={() => addToast('SLA Performance 📊', 'Overall fulfillment SLA: 98.8%')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Delivery Performance</span>
              </button>
            </div>
          </div>

          {/* FINANCE */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Finance
            </div>
            <div className="space-y-1">
              <button
                onClick={() => addToast('Payments Ledger 💳', 'Total settlements today: PKR 1,245,670')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-teal-400" />
                <span>Payments</span>
              </button>
              <button
                onClick={() => addToast('Platform Commission 💰', 'Average commission rate: 3.5% (PKR 62,283 today)')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <Percent className="w-4 h-4 text-orange-400" />
                <span>Commissions</span>
              </button>
              <button
                onClick={() => addToast('Financial Reports 📄', 'Monthly GMV report ready for download.')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Reports</span>
              </button>
            </div>
          </div>

          {/* SYSTEM */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              System
            </div>
            <div className="space-y-1">
              <button
                onClick={() => addToast('System Settings ⚙️', 'Platform multi-tenant configurations active.')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => addToast('Platform Notifications 🔔', '5 pending notifications.')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Notifications</span>
                <span className="ml-auto text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-bold">5</span>
              </button>
              <button
                onClick={() => addToast('Audit Logs 📋', 'System immutable ledger logging all admin activities.')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
              >
                <ClipboardList className="w-4 h-4 text-slate-400" />
                <span>Audit Logs</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Sidebar Card: Super Admin Status */}
        <div className="p-3 m-3 bg-[#111C3A] border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">👑</span>
            <span className="text-white text-xs font-bold">Super Admin</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Full access to all tenants and system settings.
          </p>
          <div className="pt-1 flex gap-1.5">
            <button
              onClick={() => handleImpersonateStore(displayStores[0])}
              className="flex-1 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold transition text-center cursor-pointer"
              title="Inspect Store Admin View"
            >
              Store View
            </button>
            <button
              onClick={adminLogout}
              className="px-2 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN EXECUTIVE CONTENT AREA                                            */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar matching screenshot */}
        <header className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
          
          {/* Centered Search with Ctrl+K */}
          <div className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tenants, branches, orders, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-16 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-200/70 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300">
              Ctrl + K
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            
            {/* Notification Bell with Badge 5 */}
            <button
              onClick={() => addToast('Super Admin Alerts 🔔', '3 new orders awaiting dispatch, 1 tenant plan renewal pending.')}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                5
              </span>
            </button>

            {/* Profile Avatar Badge */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                SY
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-900 block leading-none">Super Admin</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Admin</span>
              </div>
            </div>

            {/* Date Pill: 27 Sep 2025 ▾ */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-200/80 transition">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>27 Sep 2025</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

          </div>

        </header>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Welcome Banner */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>👋</span> Welcome back, Super Admin!
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Here's what's happening across all tenants today.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* 3. FIVE TOP METRIC KPI CARDS (MATCHING SCREENSHOT)                        */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* 1. Total Tenants */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block">Total Tenants</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">6</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                <span>Active 5 <span className="text-slate-300">|</span> Inactive 1</span>
                <span className="text-emerald-600">→</span>
              </div>
            </div>

            {/* 2. Total Branches */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block">Total Branches</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">18</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-blue-700">
                <span>Across all tenants</span>
                <span className="text-blue-600">→</span>
              </div>
            </div>

            {/* 3. Total Orders (Today) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block">Total Orders (Today)</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">2,482</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <span>↑ 12%</span>
                <span className="text-slate-400 font-normal">than yesterday</span>
              </div>
            </div>

            {/* 4. Total Customers */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block">Total Customers</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">48,732</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-orange-700">
                <span className="flex items-center gap-1">
                  <span className="font-bold">↑ 8%</span>
                  <span className="text-slate-400 font-normal">than last week</span>
                </span>
                <span className="text-orange-600">→</span>
              </div>
            </div>

            {/* 5. Total Revenue (Today) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block">Total Revenue (Today)</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">PKR 1,245,670</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                <span className="flex items-center gap-1">
                  <span className="font-bold">↑ 15%</span>
                  <span className="text-slate-400 font-normal">than yesterday</span>
                </span>
                <span className="text-emerald-600">→</span>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 4. ALL TENANTS OVERVIEW (MATCHING SCREENSHOT + MANAGE, PLAN, SUSPEND, DETAILS) */}
          {/* ========================================================================= */}
          <div id="tenants-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: All Tenants Overview */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">All Tenants Overview</h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                    6 Supermarkets
                  </span>
                </div>
                <button
                  onClick={() => setIsManageAdminsOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer flex items-center gap-1"
                >
                  <span>Manage Mart Admins & Passwords</span>
                  <span>→</span>
                </button>
              </div>

              {/* 6 Store Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {displayStores.map((store) => {
                  const isActive = store.status === 'Active';
                  return (
                    <div
                      key={store.id}
                      className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition"
                    >
                      {/* Store Brand & Status */}
                      <div>
                        <div className="flex items-start justify-between">
                          <div
                            style={{ backgroundColor: `${store.color}15`, color: store.color }}
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 border border-slate-200/60 shadow-2xs"
                          >
                            {store.logo}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                            <span>{store.status}</span>
                          </span>
                        </div>

                        <div className="mt-2.5">
                          <h4 className="text-sm font-black text-slate-900 leading-tight">{store.name}</h4>
                          <p className="text-[11px] text-slate-500 truncate">{store.tagline}</p>
                        </div>

                        {/* KPI counts */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Branches</span>
                            <span className="font-bold text-slate-800">{store.branchesCount}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Orders Today</span>
                            <span className="font-bold text-slate-800">{store.ordersToday}</span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200/40">
                          <span className="text-[10px] text-slate-400 block font-semibold">Revenue (Today)</span>
                          <span className="text-xs font-black text-slate-900">{store.revenueFormatted}</span>
                        </div>
                      </div>

                      {/* 4 MANDATORY REQUIRED ACTIONS REQUESTED BY USER: MANAGE, PLAN, SUSPENDED, DETAILS */}
                      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-1">
                        
                        {/* 1. Manage */}
                        <button
                          type="button"
                          onClick={() => handleOpenManage(store)}
                          className="flex-1 py-1 px-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition text-center cursor-pointer"
                          title="Manage Store Settings & Catalog"
                        >
                          Manage
                        </button>

                        {/* 2. Plan */}
                        <button
                          type="button"
                          onClick={() => handleOpenPlan(store)}
                          className="flex-1 py-1 px-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold transition text-center cursor-pointer"
                          title="View / Change Subscription Plan"
                        >
                          Plan
                        </button>

                        {/* 3. Suspend / Activate */}
                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(store)}
                          className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition text-center cursor-pointer border ${
                            isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                          title={isActive ? 'Suspend this store' : 'Activate this store'}
                        >
                          {isActive ? 'Suspend' : 'Activate'}
                        </button>

                        {/* 4. Details */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(store)}
                          className="flex-1 py-1 px-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition text-center cursor-pointer"
                          title="Full Store Details & SLA"
                        >
                          Details
                        </button>

                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right 1 Col: Sales Overview Chart (Matching Screenshot) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-900">Sales Overview</h3>
                  <select
                    value={salesTimeframe}
                    onChange={(e) => setSalesTimeframe(e.target.value)}
                    className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="7days">Last 7 Days ▾</option>
                    <option value="30days">Last 30 Days ▾</option>
                  </select>
                </div>

                {/* Multi-line Sales Chart Visualization */}
                <div className="h-44 w-full relative pt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="0" y1="110" x2="300" y2="110" stroke="#e2e8f0" />

                    {/* Al-Fatah Line (Green) */}
                    <path
                      d="M 10 70 Q 55 60, 100 45 T 150 55 T 200 35 T 250 25 T 290 20"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="2.5"
                    />
                    {/* Chase Value Line (Blue) */}
                    <path
                      d="M 10 85 Q 55 80, 100 65 T 150 70 T 200 55 T 250 48 T 290 45"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                    />
                    {/* Chase Up Line (Purple) */}
                    <path
                      d="M 10 95 Q 55 90, 100 75 T 150 80 T 200 70 T 250 62 T 290 58"
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="2"
                    />
                    {/* Fresh Mart Line (Orange) */}
                    <path
                      d="M 10 100 Q 55 95, 100 85 T 150 90 T 200 82 T 250 72 T 290 68"
                      fill="none"
                      stroke="#ea580c"
                      strokeWidth="2"
                    />
                    {/* Local Grocery Line (Red) */}
                    <path
                      d="M 10 105 Q 55 102, 100 95 T 150 98 T 200 92 T 250 85 T 290 80"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="1.5"
                    />
                  </svg>

                  {/* Day Axis */}
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-2">
                    <span>21 Sep</span>
                    <span>22 Sep</span>
                    <span>23 Sep</span>
                    <span>24 Sep</span>
                    <span>25 Sep</span>
                    <span>26 Sep</span>
                    <span>27 Sep</span>
                  </div>
                </div>
              </div>

              {/* Legend matching screenshot */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> Al-Fatah
                </span>
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> Chase Value
                </span>
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-purple-600" /> Chase Up
                </span>
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-orange-600" /> Fresh Mart
                </span>
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-rose-600" /> Local Grocery
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-slate-400" /> Super Store
                </span>
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* 5. MIDDLE ROW: REVENUE COMPARISON BAR CHART, LIVE ORDERS TABLE, BRANCH MAP */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Tenants Revenue Comparison (Bar Chart) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-900">Tenants Revenue Comparison</h3>
                  <select
                    value={revenueTimeframe}
                    onChange={(e) => setRevenueTimeframe(e.target.value)}
                    className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="today">Today ▾</option>
                    <option value="week">This Week ▾</option>
                  </select>
                </div>

                {/* Vertical Bar Chart matching screenshot */}
                <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-200">
                  {displayStores.map((store) => (
                    <div key={store.id} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-extrabold text-slate-700 opacity-90">
                        {Math.round(store.revenueToday / 1000)}K
                      </span>
                      <div
                        style={{
                          height: `${store.barHeight}%`,
                          backgroundColor: store.color
                        }}
                        className="w-full max-w-[28px] rounded-t-md transition-all group-hover:opacity-90 shadow-2xs"
                      />
                    </div>
                  ))}
                </div>

                {/* Store Names on X Axis */}
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-2 px-1">
                  {displayStores.map((s) => (
                    <span key={s.id} className="truncate max-w-[42px] text-center">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* 2. Live Orders & Deliveries Table */}
            <div id="orders-section" className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-slate-900">Live Orders & Deliveries</h3>
                  <span className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer">
                    View All Orders →
                  </span>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                        <th className="pb-2">Order ID</th>
                        <th className="pb-2">Tenant</th>
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">ETA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                      <tr>
                        <td className="py-2.5 font-bold font-mono text-[11px] text-slate-900">#ORD-70421</td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-slate-800">
                            <span className="text-xs">🏬</span> Al-Fatah
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600 truncate max-w-[80px]">Ayesha Khan</td>
                        <td className="py-2.5">
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            Out for Delivery
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">12 min</td>
                      </tr>

                      <tr>
                        <td className="py-2.5 font-bold font-mono text-[11px] text-slate-900">#ORD-70420</td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-slate-800">
                            <span className="text-xs">🛒</span> Chase Value
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600 truncate max-w-[80px]">Hassan Ali</td>
                        <td className="py-2.5">
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                            Preparing
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">18 min</td>
                      </tr>

                      <tr>
                        <td className="py-2.5 font-bold font-mono text-[11px] text-slate-900">#ORD-70419</td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-slate-800">
                            <span className="text-xs">🏪</span> Chase Up
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600 truncate max-w-[80px]">Sara Malik</td>
                        <td className="py-2.5">
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                            Picked Up
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">25 min</td>
                      </tr>

                      <tr>
                        <td className="py-2.5 font-bold font-mono text-[11px] text-slate-900">#ORD-70418</td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-slate-800">
                            <span className="text-xs">🛒</span> Fresh Mart
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600 truncate max-w-[80px]">Usman Raza</td>
                        <td className="py-2.5">
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            Out for Delivery
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">32 min</td>
                      </tr>

                      <tr>
                        <td className="py-2.5 font-bold font-mono text-[11px] text-slate-900">#ORD-70417</td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-slate-800">
                            <span className="text-xs">🏬</span> Local Grocery
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600 truncate max-w-[80px]">Fatima Noor</td>
                        <td className="py-2.5">
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                            Preparing
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">40 min</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* 3. Map - Branch Locations */}
            <div id="map-section" className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-slate-900">Map – Branch Locations</h3>
                  <span className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer">
                    View All Branches →
                  </span>
                </div>

                {/* Map Graphic with Pins */}
                <div className="h-44 rounded-xl bg-slate-100 border border-slate-200 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" />
                  
                  {/* Central City Label */}
                  <div className="z-10 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-slate-200 shadow-xs font-bold text-xs text-slate-800">
                    📍 Lahore & Faisalabad Hubs
                  </div>

                  {/* Multi-tenant location markers */}
                  <div className="absolute top-4 left-8 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-md animate-bounce">
                    🏬
                  </div>
                  <div className="absolute top-8 right-12 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shadow-md">
                    🛒
                  </div>
                  <div className="absolute bottom-6 left-14 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs shadow-md">
                    🏪
                  </div>
                  <div className="absolute bottom-10 right-8 w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs shadow-md">
                    🛒
                  </div>
                  <div className="absolute top-16 left-28 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-sm">
                    🏬
                  </div>
                </div>

                {/* Branch Legend matching screenshot */}
                <div className="mt-3 grid grid-cols-2 gap-1 text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" /> Al-Fatah (4 branches)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" /> Chase Value (3 branches)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600" /> Chase Up (3 branches)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-600" /> Fresh Mart (2 branches)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600" /> Local Grocery (2 branches)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Super Store (2 branches)
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* 6. BOTTOM ROW: RECENT ACTIVITY, TOP PERFORMING TENANTS, QUICK ACTIONS     */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Recent Activity */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Recent Activity</h3>
                <span className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer">
                  View All
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-700">New order placed by <strong>Ayesha Khan</strong> (Al-Fatah)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">2 min ago</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-slate-700">New branch added for <strong>Chase Up</strong> (Gulberg)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">12 min ago</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-slate-700">Tenant subscription renewed (<strong>Fresh Mart</strong>)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">24 min ago</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span className="text-slate-700">New customer registered (<strong>Fatima Ali</strong>)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">38 min ago</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span className="text-slate-700">Payment received [PKR 45,000] - <strong>Chase Value</strong></span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">1 hour ago</span>
                </div>
              </div>
            </div>

            {/* 2. Top Performing Tenants */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Top Performing Tenants</h3>
                <select
                  value={topTenantsTimeframe}
                  onChange={(e) => setTopTenantsTimeframe(e.target.value)}
                  className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="today">Today ▾</option>
                  <option value="month">This Month ▾</option>
                </select>
              </div>

              <div className="space-y-2.5 text-xs">
                {displayStores.map((store, idx) => (
                  <div key={store.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 w-28 shrink-0">
                      <span className="text-[11px] font-bold text-slate-400 w-3">{idx + 1}</span>
                      <span className="text-sm">{store.logo}</span>
                      <span className="font-bold text-slate-800 truncate">{store.name}</span>
                    </div>

                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{
                          width: store.sharePct,
                          backgroundColor: store.color
                        }}
                        className="h-full rounded-full"
                      />
                    </div>

                    <div className="w-28 text-right shrink-0">
                      <span className="font-mono font-bold text-[11px] text-slate-800">{store.revenueFormatted}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1.5">{store.sharePct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Quick Actions matching screenshot */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">Quick Actions</h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                
                {/* 1. Add New Tenant */}
                <button
                  onClick={() => setIsAddTenantOpen(true)}
                  className="p-3 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-left transition cursor-pointer flex flex-col justify-between h-20"
                >
                  <Store className="w-4 h-4 text-emerald-700" />
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">Add New Tenant</span>
                    <span className="text-[10px] text-slate-500 block">Register a new store</span>
                  </div>
                </button>

                {/* 2. Add Branch */}
                <button
                  onClick={() => addToast('Add Branch 🏬', 'Branch creation wizard opened for dark store hubs.')}
                  className="p-3 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 rounded-xl text-left transition cursor-pointer flex flex-col justify-between h-20"
                >
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">Add Branch</span>
                    <span className="text-[10px] text-slate-500 block">Create branch location</span>
                  </div>
                </button>

                {/* 3. Manage Subscriptions */}
                <button
                  onClick={() => setIsPlanModalOpen(true)}
                  className="p-3 bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200 rounded-xl text-left transition cursor-pointer flex flex-col justify-between h-20"
                >
                  <Layers className="w-4 h-4 text-purple-700" />
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">Manage Subscriptions</span>
                    <span className="text-[10px] text-slate-500 block">Update tenant plans</span>
                  </div>
                </button>

                {/* 4. View All Orders */}
                <button
                  onClick={() => {
                    const el = document.getElementById('orders-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-3 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 rounded-xl text-left transition cursor-pointer flex flex-col justify-between h-20"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-700" />
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">View All Orders</span>
                    <span className="text-[10px] text-slate-500 block">Track & manage orders</span>
                  </div>
                </button>

                {/* 5. Generate Reports */}
                <button
                  onClick={() => addToast('Reports 📄', 'Generated full revenue and commission report.')}
                  className="p-3 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200 rounded-xl text-left transition cursor-pointer flex flex-col justify-between h-20"
                >
                  <FileText className="w-4 h-4 text-teal-700" />
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">Generate Reports</span>
                    <span className="text-[10px] text-slate-500 block">Download reports</span>
                  </div>
                </button>

                {/* 6. System Settings */}
                <button
                  onClick={() => addToast('Settings ⚙️', 'Platform security and tenant isolation settings.')}
                  className="p-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-left transition cursor-pointer flex flex-col justify-between h-20"
                >
                  <Settings className="w-4 h-4 text-slate-700" />
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">System Settings</span>
                    <span className="text-[10px] text-slate-500 block">Platform configuration</span>
                  </div>
                </button>

              </div>
            </div>

          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* 7. MODALS: DETAILS, PLAN, MANAGE, STORE ADMINS (PASSWORDS)                */}
      {/* ========================================================================= */}

      {/* --- A. TENANT DETAILS MODAL --- */}
      {isDetailsModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: `${selectedTenant.color}15`, color: selectedTenant.color }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black"
                >
                  {selectedTenant.logo}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">{selectedTenant.fullName}</h3>
                  <span className="text-xs text-slate-400">{selectedTenant.tagline}</span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Owner / Contact</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedTenant.ownerName}</span>
                <span className="text-slate-500 font-mono text-[11px] block">{selectedTenant.ownerEmail}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Subscription Tier</span>
                <span className="font-black text-blue-600 text-sm mt-0.5 block">{selectedTenant.plan}</span>
                <span className="text-slate-500 text-[11px] block">Billed Monthly</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Today's Revenue</span>
                <span className="font-black text-slate-900 text-sm mt-0.5 block">{selectedTenant.revenueFormatted}</span>
                <span className="text-emerald-600 font-bold text-[11px] block">{selectedTenant.ordersToday} orders fulfilled</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold block uppercase">SLA & Status</span>
                <span className="font-black text-emerald-600 text-sm mt-0.5 block">99.2% Fulfillment</span>
                <span className="text-slate-500 text-[11px] block">{selectedTenant.status} Operational</span>
              </div>
            </div>

            {/* Dark Store Hubs */}
            <div>
              <span className="text-slate-400 text-[10px] font-bold block uppercase mb-1.5">Fulfillment Hubs & Branches</span>
              <div className="flex flex-wrap gap-1.5">
                {(selectedTenant.hubs || []).map((hub) => (
                  <span key={hub} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                    📍 {hub}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => handleImpersonateStore(selectedTenant)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Open {selectedTenant.name} Admin Console
              </button>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- B. SUBSCRIPTION PLAN MODAL --- */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Update Subscription Plan
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedTenant ? selectedTenant.fullName : 'Select Supermarket'}
                </span>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subscription Tier</label>
                <select
                  value={editPlanForm.plan}
                  onChange={(e) => {
                    const p = e.target.value;
                    const price = p === 'Enterprise' ? 75000 : p === 'Professional' ? 35000 : 15000;
                    setEditPlanForm({ ...editPlanForm, plan: p, price });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  <option value="Enterprise">Enterprise (PKR 75,000/mo) - Unlimited Scale</option>
                  <option value="Professional">Professional (PKR 35,000/mo) - Multi-Branch</option>
                  <option value="Starter">Starter (PKR 15,000/mo) - Boutique Store</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Billing Cycle</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditPlanForm({ ...editPlanForm, billingCycle: 'monthly' })}
                    className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                      editPlanForm.billingCycle === 'monthly'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPlanForm({ ...editPlanForm, billingCycle: 'annual' })}
                    className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                      editPlanForm.billingCycle === 'annual'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Annual (10% Off)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Monthly Billing Fee (PKR)</label>
                <input
                  type="number"
                  value={editPlanForm.price}
                  onChange={(e) => setEditPlanForm({ ...editPlanForm, price: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition cursor-pointer"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- C. MANAGE STORE PROFILE MODAL --- */}
      {isManageModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Manage Store: {selectedTenant.name}
                </h3>
                <span className="text-xs text-slate-400">Configure supermarket profile & ownership</span>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManage} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Supermarket Name</label>
                <input
                  type="text"
                  required
                  value={editStoreForm.name}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={editStoreForm.tagline}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, tagline: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={editStoreForm.ownerName}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, ownerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner Email</label>
                  <input
                    type="email"
                    value={editStoreForm.ownerEmail}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, ownerEmail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleImpersonateStore(selectedTenant)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Switch to Store Console</span>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsManageModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- D. MART ADMINS & PASSWORDS MANAGEMENT MODAL --- */}
      {isManageAdminsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <span>Mart Admins Credentials & Password Control</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every supermarket has its dedicated Store Admin account and password assigned by the Super Admin.
                </p>
              </div>
              <button
                onClick={() => setIsManageAdminsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Action Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                {(storeAdmins || []).length} Registered Store Admins
              </span>
              <button
                onClick={() => setIsAddAdminOpen(true)}
                className="px-3.5 py-1.5 bg-[#0e7c66] hover:bg-[#0a5d4c] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Store Admin & Set Password</span>
              </button>
            </div>

            {/* Table of Mart Admins */}
            <div className="flex-1 overflow-y-auto border border-slate-200/90 rounded-2xl divide-y divide-slate-100 text-xs">
              {(storeAdmins || []).map((admin) => {
                const isPasswordShown = !!showPasswordMap[admin.id];
                return (
                  <div key={admin.id} className="p-3.5 hover:bg-slate-50/70 transition flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {admin.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm truncate">{admin.name}</span>
                          <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded-full text-slate-700">
                            {admin.tenantName}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              admin.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {admin.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                          {admin.email}
                        </div>
                      </div>
                    </div>

                    {/* Password Control Box */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono font-bold text-xs text-slate-800">
                          {isPasswordShown ? admin.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(admin.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title={isPasswordShown ? 'Hide Password' : 'Show Password'}
                        >
                          {isPasswordShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Quick Edit Password Prompt */}
                      <button
                        type="button"
                        onClick={() => {
                          const newPass = prompt(`Enter new password for ${admin.name} (${admin.tenantName}):`, admin.password);
                          if (newPass && newPass.trim()) {
                            updateStoreAdmin(admin.id, { password: newPass.trim() });
                            addToast('Password Changed 🔑', `New password set for ${admin.name}.`);
                          }
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                        title="Change Admin Password"
                      >
                        Reset Key
                      </button>

                      {/* Toggle Status */}
                      <button
                        type="button"
                        onClick={() => toggleStoreAdminStatus(admin.id)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer border ${
                          admin.status === 'Active'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {admin.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>

                      {/* Switch to this Mart Console */}
                      <button
                        type="button"
                        onClick={() => {
                          const targetMart = displayStores.find((s) => s.id === admin.tenantId);
                          if (targetMart) handleImpersonateStore(targetMart);
                        }}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer"
                        title="Login As This Store Admin"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setIsManageAdminsOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- E. ADD STORE ADMIN & SET PASSWORD MODAL --- */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Add Mart Admin & Set Password
                </h3>
                <span className="text-xs text-slate-500">Assign a dedicated Store Admin to a Supermarket</span>
              </div>
              <button
                onClick={() => setIsAddAdminOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign to Supermarket (Mart)</label>
                <select
                  value={newAdminForm.tenantId}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, tenantId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                >
                  {displayStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.logo} {store.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Store Admin Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mahmood"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Store Admin Email / Username</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@alfatah.pk"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign Login Password</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter custom access password"
                    value={newAdminForm.password}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-20 font-mono font-bold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const rand = `mart${Math.floor(1000 + Math.random() * 9000)}`;
                      setNewAdminForm({ ...newAdminForm, password: rand });
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 hover:bg-slate-300 font-bold px-2 py-1 rounded-md text-slate-700 cursor-pointer"
                  >
                    Random
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  The Store Admin will use this password to sign into their Mart Console.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddAdminOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e7c66] hover:bg-[#0a5d4c] text-white rounded-xl font-bold shadow-md transition cursor-pointer"
                >
                  Create & Set Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- F. ADD NEW TENANT STORE MODAL --- */}
      {isAddTenantOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Register New Supermarket Store
                </h3>
                <span className="text-xs text-slate-500">Create a new tenant on the Unimart platform</span>
              </div>
              <button
                onClick={() => setIsAddTenantOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const storeName = formData.get('name');
                const ownerEmail = formData.get('email');
                const plan = formData.get('plan') || 'Professional';
                
                await addTenant({
                  name: storeName,
                  slug: storeName.toLowerCase().replace(/\s+/g, '-'),
                  tagline: 'Quality Fresh Groceries & Household Essentials',
                  ownerName: formData.get('ownerName') || 'Store Partner',
                  ownerEmail: ownerEmail,
                  city: formData.get('city') || 'Lahore, Pakistan',
                  plan: plan,
                  color: '#0e7c66'
                });

                // Auto-create initial store admin with default password
                addStoreAdmin({
                  tenantId: `tenant-${Date.now()}`,
                  tenantName: storeName,
                  name: formData.get('ownerName') || `${storeName} Admin`,
                  email: ownerEmail,
                  password: 'admin123',
                  phone: formData.get('phone') || ''
                });

                addToast('Supermarket Registered! 🏬', `${storeName} created with initial admin credentials (admin123).`);
                setIsAddTenantOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Supermarket Brand Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Metro Cash & Carry"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner / Manager Name</label>
                  <input
                    name="ownerName"
                    type="text"
                    required
                    placeholder="e.g. Asim Raza"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Admin Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="admin@metro.pk"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fulfillment City</label>
                  <input
                    name="city"
                    type="text"
                    defaultValue="Lahore, Pakistan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subscription Plan</label>
                  <select
                    name="plan"
                    defaultValue="Professional"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  >
                    <option value="Enterprise">Enterprise (PKR 75,000/mo)</option>
                    <option value="Professional">Professional (PKR 35,000/mo)</option>
                    <option value="Starter">Starter (PKR 15,000/mo)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTenantOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition cursor-pointer"
                >
                  Register Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
