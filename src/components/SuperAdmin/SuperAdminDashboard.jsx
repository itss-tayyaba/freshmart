import React, { useState, useMemo, useRef } from 'react';
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
  ChevronUp,
  ShieldCheck,
  Layers,
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
  Edit2,
  Download,
  Send,
  Zap,
  Radio,
  SlidersVertical,
  CheckSquare
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SUBSCRIPTION_PLANS } from '../../data/tenantData';
import { BRANCHES } from '../../data/companyHierarchyData';

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
    customers,
    setCustomers,
    addCustomer,
    deleteCustomer,
    updateCustomer,
    adminLogout,
    navigateTo,
    addToast,
    storeAdmins,
    setStoreAdmins,
    addStoreAdmin,
    updateStoreAdmin,
    deleteStoreAdmin,
    toggleStoreAdminStatus,
    allBranches,
    addBranch,
    updateBranch,
    deleteBranch,
    toggleBranchStatus
  } = useStore();

  // Active Navigation in Sidebar
  const [activeNav, setActiveNav] = useState('dashboard');

  // Modals visibility
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isManageAdminsOpen, setIsManageAdminsOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const mainWorkspaceRef = useRef(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchCityFilter, setBranchCityFilter] = useState('all');
  const [branchSearch, setBranchSearch] = useState('');
  const [branchTenantFilter, setBranchTenantFilter] = useState('all');
  const [branchStatusFilter, setBranchStatusFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // Timeframes for dashboard charts
  const [revenueTimeframe, setRevenueTimeframe] = useState('today');
  const [salesTimeframe, setSalesTimeframe] = useState('7days');
  const [topTenantsTimeframe, setTopTenantsTimeframe] = useState('today');

  // 6 Tenants Dataset matching platform specification
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
      fullName: 'Fresh Mart Direct',
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
      ownerEmail: 'admin@freshmart.pk',
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

  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Lahore'
  });

  const [newBranchForm, setNewBranchForm] = useState({
    tenantId: 'tenant-alfatah',
    name: '',
    code: '',
    city: 'Faisalabad',
    address: '',
    manager: '',
    phone: '+92 41 8712345',
    operatingHours: '08:00 AM - 11:00 PM',
    deliveryRadius: 15,
    status: 'active'
  });

  const [broadcastForm, setBroadcastForm] = useState({
    audience: 'all_admins',
    title: '',
    message: '',
    priority: 'Normal'
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

  const handleDeleteTenantClick = (store) => {
    if (window.confirm(`Are you sure you want to delete ${store.fullName}?`)) {
      deleteTenant(store.id);
      addToast('Tenant Removed 🗑️', `${store.fullName} deleted from platform.`);
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

  const handleCreateCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.email) {
      addToast('Missing Details ⚠️', 'Please provide at least a customer name and email.', 'error');
      return;
    }

    addCustomer({
      name: newCustomerForm.name,
      email: newCustomerForm.email,
      phone: newCustomerForm.phone || '+92 300 1234567',
      address: `${newCustomerForm.address || 'Main Road'}, ${newCustomerForm.city}`
    });

    setNewCustomerForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: 'Lahore'
    });
    setIsAddCustomerOpen(false);
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

  // Filtered lists for dedicated sub-dashboards
  const filteredStores = useMemo(() => {
    return displayStores.filter((store) => {
      const matchSearch =
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === 'all' || store.status.toLowerCase() === statusFilter.toLowerCase();
      const matchTier =
        tenantFilter === 'all' || store.plan.toLowerCase() === tenantFilter.toLowerCase();
      return matchSearch && matchStatus && matchTier;
    });
  }, [displayStores, searchQuery, statusFilter, tenantFilter]);

  const filteredAdmins = useMemo(() => {
    return (storeAdmins || []).filter((admin) => {
      const matchSearch =
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (admin.tenantName && admin.tenantName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [storeAdmins, searchQuery]);

  const filteredCustomers = useMemo(() => {
    return (customers || []).filter((cust) => {
      return (
        cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cust.phone && cust.phone.includes(searchQuery))
      );
    });
  }, [customers, searchQuery]);

  // Sidebar helper button class
  const getNavClass = (key) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer text-xs font-semibold ${
      activeNav === key
        ? 'bg-[#1E293B] text-white font-bold shadow-xs border-l-2 border-blue-500'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`;

  return (
    <div className="flex h-full w-full bg-[#f8fafc] text-slate-800 font-sans antialiased overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (Super Admin Platform Command Center)                     */}
      {/* ========================================================================= */}
      <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col shrink-0 select-none border-r border-slate-900 h-full overflow-hidden">
        {/* Brand Header: Super Admin */}
        <div className="p-4 sm:p-5 flex items-center gap-3 border-b border-slate-800/60 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white font-black shadow-lg shadow-amber-950/40 shrink-0">
            <span className="text-xl">👑</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-extrabold text-base leading-tight tracking-tight truncate">Super Admin</h1>
            <p className="text-[10px] text-slate-400 font-medium truncate">Platform Command Center</p>
          </div>
        </div>

        {/* Sidebar Nav Items (Independently scrollable) */}
        <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto sidebar-scrollbar text-xs font-semibold min-h-0">
          {/* Main Dashboard item */}
          <div>
            <button onClick={() => setActiveNav('dashboard')} className={getNavClass('dashboard')}>
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Dashboard Overview</span>
            </button>
          </div>

          {/* TENANT MANAGEMENT */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Tenant Management
            </div>
            <div className="space-y-1">
              <button onClick={() => setActiveNav('tenants')} className={getNavClass('tenants')}>
                <Store className="w-4 h-4 text-emerald-400" />
                <span>Tenants (Marts)</span>
                <span className="ml-auto text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                  {displayStores.length}
                </span>
              </button>
              <button onClick={() => setActiveNav('branches')} className={getNavClass('branches')}>
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Store Branches</span>
                <span className="ml-auto text-[10px] bg-sky-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {(allBranches || []).length}
                </span>
              </button>
              <button onClick={() => setActiveNav('plans')} className={getNavClass('plans')}>
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
              <button onClick={() => setActiveNav('admins')} className={getNavClass('admins')}>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Mart Admins</span>
                <span className="ml-auto text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {(storeAdmins || []).length}
                </span>
              </button>
              <button onClick={() => setActiveNav('customers')} className={getNavClass('customers')}>
                <Users className="w-4 h-4 text-amber-400" />
                <span>Customers</span>
                <span className="ml-auto text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                  {(customers || []).length}
                </span>
              </button>
            </div>
          </div>

          {/* ORDERS & DELIVERIES */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Orders & Deliveries
            </div>
            <div className="space-y-1">
              <button onClick={() => setActiveNav('orders')} className={getNavClass('orders')}>
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Cross-Store Orders</span>
              </button>
              <button onClick={() => setActiveNav('tracking')} className={getNavClass('tracking')}>
                <Navigation className="w-4 h-4 text-indigo-400" />
                <span>Live GPS Tracking</span>
              </button>
              <button onClick={() => setActiveNav('performance')} className={getNavClass('performance')}>
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Delivery SLA</span>
              </button>
            </div>
          </div>

          {/* FINANCE */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Finance
            </div>
            <div className="space-y-1">
              <button onClick={() => setActiveNav('payments')} className={getNavClass('payments')}>
                <CreditCard className="w-4 h-4 text-teal-400" />
                <span>Payments & Settlements</span>
              </button>
              <button onClick={() => setActiveNav('commissions')} className={getNavClass('commissions')}>
                <Percent className="w-4 h-4 text-orange-400" />
                <span>Commissions</span>
              </button>
              <button onClick={() => setActiveNav('reports')} className={getNavClass('reports')}>
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Reports Center</span>
              </button>
            </div>
          </div>

          {/* SYSTEM */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              System
            </div>
            <div className="space-y-1">
              <button onClick={() => setActiveNav('settings')} className={getNavClass('settings')}>
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Platform Settings</span>
              </button>
              <button onClick={() => setActiveNav('notifications')} className={getNavClass('notifications')}>
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Broadcast Alerts</span>
              </button>
              <button onClick={() => setActiveNav('audit')} className={getNavClass('audit')}>
                <ClipboardList className="w-4 h-4 text-slate-400" />
                <span>Audit Logs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Sidebar Card (Pinned Bottom) */}
        <div className="p-3 m-3 mt-auto shrink-0 bg-[#111C3A] border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">👑</span>
            <span className="text-white text-xs font-bold">Super Admin HQ</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Full root control over all marts, branches, users & subscriptions.
          </p>
          <div className="pt-1 flex flex-col gap-1.5">
            <button
              onClick={() => handleImpersonateStore(displayStores[0])}
              className="w-full py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold transition text-center cursor-pointer flex items-center justify-center gap-1.5"
              title="Inspect Store Admin View"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Inspect Store View</span>
            </button>
            <button
              onClick={adminLogout}
              className="w-full py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE AREA (Independently scrollable workspace)                */}
      {/* ========================================================================= */}
      <main ref={mainWorkspaceRef} className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs shrink-0">
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Super Admin</span>
              <span>/</span>
              <span className="capitalize text-blue-600 font-bold">{activeNav}</span>
            </div>
          </div>

          {/* Centered Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeNav}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveNav('notifications')}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Broadcast Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                👑
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-900 block leading-none">Super Admin</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Platform Root</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Today</span>
            </div>

            {/* Quick Impersonate Store View Button */}
            <button
              onClick={() => handleImpersonateStore(displayStores[0])}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Inspect Store Admin View"
            >
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>Store View</span>
            </button>

            {/* Prominent Super Admin Logout Button */}
            <button
              onClick={adminLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Sign Out of Super Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Content Body Based on activeNav */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 1. DASHBOARD OVERVIEW                                  */}
          {/* ===================================================================== */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>👋</span> Welcome back, Super Admin!
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Here's what's happening across all registered marts and dark store fulfillment hubs today.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveNav('admins')}
                    className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Manage Mart Admins</span>
                  </button>
                  <button
                    onClick={() => setIsAddTenantOpen(true)}
                    className="px-3.5 py-2 bg-[#0e7c66] hover:bg-[#0a5d4c] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Supermarket</span>
                  </button>
                </div>
              </div>

              {/* 5 KPI Metric Cards Matching Screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. Total Tenants */}
                <div
                  onClick={() => setActiveNav('tenants')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">Total Tenants</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">{displayStores.length}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Store className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                    <span>
                      Active {displayStores.filter((s) => s.status === 'Active').length} | Inactive{' '}
                      {displayStores.filter((s) => s.status !== 'Active').length}
                    </span>
                    <span className="text-emerald-600">→</span>
                  </div>
                </div>

                {/* 2. Centralized Branch (Faisalabad) */}
                <div
                  onClick={() => setActiveNav('branches')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">Centralized Branch</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">1 (Faisalabad)</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-blue-700">
                    <span>Central Flagship Hub</span>
                    <span className="text-blue-600">Active ✓</span>
                  </div>
                </div>

                {/* 3. Total Orders (Today) */}
                <div
                  onClick={() => setActiveNav('orders')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
                >
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
                <div
                  onClick={() => setActiveNav('customers')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">Total Customers</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">{(customers || []).length}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-orange-700">
                    <span>
                      {(customers || []).length === 0 ? 'Add manually' : `${(customers || []).length} registered`}
                    </span>
                    <span className="text-orange-600">→</span>
                  </div>
                </div>

                {/* 5. Total Revenue (Today) */}
                <div
                  onClick={() => setActiveNav('payments')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
                >
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

              {/* Charts Row: Sales Overview & Tenants Revenue Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Overview Line Chart */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Sales Overview</h3>
                      <p className="text-[11px] text-slate-500">Gross Platform Volume across all registered marts</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                      {['daily', '7days', 'monthly'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setSalesTimeframe(tf)}
                          className={`px-2.5 py-1 rounded-md transition ${
                            salesTimeframe === tf ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {tf === 'daily' ? 'Day' : tf === '7days' ? 'Week' : 'Month'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-48 w-full relative flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-100 overflow-hidden">
                    {/* SVG Spline Background */}
                    <svg
                      viewBox="0 0 700 150"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      <defs>
                        <linearGradient id="salesOverviewGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 50 100 C 90 98, 110 89, 150 89 C 190 89, 210 95, 250 95 C 290 95, 310 75, 350 75 C 390 75, 410 60, 450 60 C 490 60, 510 45, 550 45 C 590 45, 610 67, 650 67 L 650 150 L 50 150 Z"
                        fill="url(#salesOverviewGrad)"
                      />
                      <path
                        d="M 50 100 C 90 98, 110 89, 150 89 C 190 89, 210 95, 250 95 C 290 95, 310 75, 350 75 C 390 75, 410 60, 450 60 C 490 60, 510 45, 550 45 C 590 45, 610 67, 650 67"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Chart Bars/Data points */}
                    {[
                      { day: 'Mon', pkr: '180k', h: '45%' },
                      { day: 'Tue', pkr: '210k', h: '55%' },
                      { day: 'Wed', pkr: '195k', h: '50%' },
                      { day: 'Thu', pkr: '260k', h: '68%' },
                      { day: 'Fri', pkr: '310k', h: '82%' },
                      { day: 'Sat', pkr: '385k', h: '95%' },
                      { day: 'Sun', pkr: '290k', h: '75%' }
                    ].map((pt, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 z-10 group">
                        <span className="text-[9px] font-bold text-slate-400 group-hover:text-blue-600 transition">
                          {pt.pkr}
                        </span>
                        <div
                          style={{ height: pt.h }}
                          className="w-full max-w-[28px] bg-blue-100 group-hover:bg-blue-600 transition rounded-t-lg"
                        />
                        <span className="text-[10px] font-bold text-slate-500 mt-1">{pt.day}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 text-slate-600">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      Weekly Platform Volume: PKR 1,830,000
                    </span>
                    <span className="text-emerald-600 font-bold">↑ +18.4% WoW</span>
                  </div>
                </div>

                {/* Tenants Revenue Comparison Bar Chart */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Tenants Revenue Comparison</h3>
                      <p className="text-[11px] text-slate-500">Live order earnings generated per supermarket today</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                      Real-time
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {displayStores.map((store) => (
                      <div key={store.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{store.logo}</span>
                            <span>{store.name}</span>
                          </span>
                          <span className="font-mono font-bold text-slate-700">{store.revenueFormatted}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${store.barHeight}%`, backgroundColor: store.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* All Tenants Overview Table */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-600" />
                      <span>All Tenants Overview</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Super Admin full control over stores, credentials, plans, and active suspensions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveNav('admins')}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Mart Admins Credentials</span>
                    </button>
                    <button
                      onClick={() => setIsAddTenantOpen(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Store</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="pb-3 pl-2">Tenant Store</th>
                        <th className="pb-3">Branches</th>
                        <th className="pb-3">Orders Today</th>
                        <th className="pb-3">Revenue (Today)</th>
                        <th className="pb-3">Plan</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 pr-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayStores.map((store) => (
                        <tr key={store.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 pl-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{store.logo}</span>
                              <div>
                                <span className="font-bold text-slate-900 block">{store.fullName}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">{store.ownerEmail}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 font-semibold text-slate-700">{store.branchesCount} Hubs</td>
                          <td className="py-3 font-semibold text-slate-700">{store.ordersToday}</td>
                          <td className="py-3 font-mono font-bold text-slate-900">{store.revenueFormatted}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                store.plan === 'Enterprise'
                                  ? 'bg-purple-100 text-purple-700'
                                  : store.plan === 'Professional'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {store.plan}
                            </span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                store.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {store.status}
                            </span>
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenManage(store)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition"
                                title="Manage Store Settings"
                              >
                                Manage
                              </button>
                              <button
                                onClick={() => handleOpenPlan(store)}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold transition"
                                title="Change Plan Tier"
                              >
                                Plan
                              </button>
                              <button
                                onClick={() => handleToggleSuspend(store)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                                  store.status === 'Active'
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                }`}
                                title={store.status === 'Active' ? 'Suspend Tenant' : 'Activate Tenant'}
                              >
                                {store.status === 'Active' ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleOpenDetails(store)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition"
                                title="View Tenant Details"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => handleDeleteTenantClick(store)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                                title="Delete Tenant"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 2. TENANTS MANAGEMENT                                  */}
          {/* ===================================================================== */}
          {activeNav === 'tenants' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Store className="w-5 h-5 text-emerald-600" />
                    <span>Supermarket Tenants Directory</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Register, configure, inspect, and manage supermarket partner stores across Pakistan.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddTenantOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Supermarket</span>
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Status:</span>
                  {['all', 'active', 'inactive'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg font-bold capitalize transition ${
                        statusFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Plan Tier:</span>
                  {['all', 'enterprise', 'professional', 'starter'].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setTenantFilter(tier)}
                      className={`px-3 py-1 rounded-lg font-bold capitalize transition ${
                        tenantFilter === tier ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenants Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStores.map((store) => (
                  <div
                    key={store.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:shadow-md transition space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shadow-xs">
                            {store.logo}
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-base leading-tight">{store.fullName}</h3>
                            <span className="text-[10px] text-slate-400 font-mono">{store.ownerEmail}</span>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            store.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {store.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-3 line-clamp-2">{store.tagline}</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Owner</span>
                          <span className="font-bold text-slate-700">{store.ownerName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Plan Tier</span>
                          <span className="font-bold text-purple-700">{store.plan}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Dark Store Hubs</span>
                          <span className="font-bold text-slate-700">{store.hubs.length} Hubs</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Revenue (Today)</span>
                          <span className="font-mono font-bold text-emerald-700">{store.revenueFormatted}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenManage(store)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition text-center"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => handleOpenPlan(store)}
                        className="py-1.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition"
                      >
                        Plan
                      </button>
                      <button
                        onClick={() => handleToggleSuspend(store)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                          store.status === 'Active'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {store.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleOpenDetails(store)}
                        className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 3. STORE BRANCHES & DARK STORES NETWORK               */}
          {/* ===================================================================== */}
          {activeNav === 'branches' && (() => {
            const branchList = Array.isArray(allBranches) ? allBranches : [];
            const activeBranchesCount = branchList.filter((b) => b.status === 'active' || b.status === 'Active').length;
            const uniqueCities = Array.from(new Set(branchList.map((b) => b.city).filter(Boolean)));
            const uniqueTenants = Array.from(new Set(branchList.map((b) => b.tenantId).filter(Boolean)));

            const filteredBranches = branchList.filter((b) => {
              if (branchTenantFilter !== 'all') {
                const canonicalTarget = branchTenantFilter.toLowerCase();
                const bTenant = (b.tenantId || '').toLowerCase();
                const bComp = (b.companyId || '').toLowerCase();
                if (!bTenant.includes(canonicalTarget) && !bComp.includes(canonicalTarget)) return false;
              }
              if (branchCityFilter !== 'all' && (b.city || '').toLowerCase() !== branchCityFilter.toLowerCase()) {
                return false;
              }
              if (branchStatusFilter !== 'all') {
                const isActive = b.status === 'active' || b.status === 'Active';
                if (branchStatusFilter === 'active' && !isActive) return false;
                if (branchStatusFilter === 'inactive' && isActive) return false;
              }
              if (branchSearch.trim()) {
                const q = branchSearch.toLowerCase();
                const matchesName = (b.name || '').toLowerCase().includes(q);
                const matchesCode = (b.code || '').toLowerCase().includes(q);
                const matchesCity = (b.city || '').toLowerCase().includes(q);
                const matchesAddress = (b.address || '').toLowerCase().includes(q);
                const matchesManager = (b.manager || '').toLowerCase().includes(q);
                return matchesName || matchesCode || matchesCity || matchesAddress || matchesManager;
              }
              return true;
            });

            return (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                        Multi-Tenant Infrastructure
                      </span>
                      <span className="text-xs text-slate-400 font-bold">• Store Branches Directory</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
                      <Building2 className="w-5 h-5 text-sky-600" />
                      <span>Store Branches & Dark Stores Network</span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Configure retail supermarket branches, dark stores, and fulfillment hubs across all marts and chains.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsAddBranchOpen(true)}
                      className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black shadow-md flex items-center gap-2 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Store Branch</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Branches</span>
                    <span className="text-xl font-black font-mono text-slate-900 mt-1 block">{branchList.length}</span>
                    <span className="text-[10px] text-slate-500">Across all retail chains</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Active Operational</span>
                    <span className="text-xl font-black font-mono text-emerald-950 mt-1 block">{activeBranchesCount}</span>
                    <span className="text-[10px] text-emerald-700">Online for express orders</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Connected Marts</span>
                    <span className="text-xl font-black font-mono text-sky-700 mt-1 block">{uniqueTenants.length}</span>
                    <span className="text-[10px] text-slate-500">Supermarket partners</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cities Covered</span>
                    <span className="text-xl font-black font-mono text-purple-700 mt-1 block">{uniqueCities.length}</span>
                    <span className="text-[10px] text-slate-500">Major metropolitan zones</span>
                  </div>
                </div>

                {/* Toolbar: Search & Filters */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={branchSearch}
                        onChange={(e) => setBranchSearch(e.target.value)}
                        placeholder="Search branch by name, hub code, city, address, manager..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Filter by Mart / Store */}
                      <select
                        value={branchTenantFilter}
                        onChange={(e) => setBranchTenantFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="all">🏪 All Supermarkets</option>
                        {displayStores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.logo} {store.name}
                          </option>
                        ))}
                      </select>

                      {/* Filter by City */}
                      <select
                        value={branchCityFilter}
                        onChange={(e) => setBranchCityFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="all">📍 All Cities</option>
                        <option value="Faisalabad">Faisalabad</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Multan">Multan</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                      </select>

                      {/* Filter by Status */}
                      <select
                        value={branchStatusFilter}
                        onChange={(e) => setBranchStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Branches Grid */}
                  {filteredBranches.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mx-auto text-2xl shadow-xs">
                        🏬
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No Store Branches Added Yet</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Your branch network is currently empty. Add your stores and dark stores using the button below — each will be persisted directly to the database.
                      </p>
                      <button
                        onClick={() => setIsAddBranchOpen(true)}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Store Branch</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {filteredBranches.map((branch) => {
                        const targetStore = displayStores.find(
                          (s) =>
                            s.id === branch.tenantId ||
                            s.legacyId === branch.tenantId ||
                            (branch.tenantId && branch.tenantId.toLowerCase().includes(s.name.toLowerCase().replace(/\s+/g, '')))
                        ) || {
                          name: 'Fresh Mart',
                          logo: '🛒',
                          color: '#ea580c'
                        };

                        const isActive = branch.status === 'active' || branch.status === 'Active';

                        return (
                          <div
                            key={branch._id || branch.id}
                            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                              isActive
                                ? 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                                : 'bg-slate-50/60 border-slate-200 text-slate-500'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Top Mart Badge & Status Toggle */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{targetStore.logo}</span>
                                  <span className="text-xs font-black text-slate-800">
                                    {targetStore.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() => toggleBranchStatus(branch._id || branch.id)}
                                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                                    isActive
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                  }`}
                                  title="Click to toggle branch operational status"
                                >
                                  {isActive ? '● Active' : '○ Inactive'}
                                </button>
                              </div>

                              {/* Branch Name & Code */}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-black text-slate-900 text-base leading-snug">
                                    {branch.name}
                                  </h3>
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                    {branch.code || 'HUB'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">{branch.address || 'Commercial Center'} • <b>{branch.city}</b></span>
                                </p>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Manager</span>
                                  <span className="font-bold text-slate-800 text-[11px] truncate block">
                                    {branch.manager || 'Store Manager'}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {branch.phone || '+92 41 8712345'}
                                  </span>
                                </div>

                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Delivery Radius</span>
                                  <span className="font-black text-slate-800 text-[11px] block">
                                    {branch.deliveryRadius || 15} km
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {branch.operatingHours || '08:00 AM - 11:00 PM'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Branch Footer: Actions */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="text-[10px] font-bold text-slate-400">
                                GPS: {branch.latitude || '31.41'}°N, {branch.longitude || '73.09'}°E
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${branch.name}"?`)) {
                                      deleteBranch(branch._id || branch.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                                  title="Delete Branch"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Informational Footer Note */}
                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs text-sky-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏢</span>
                      <span>Customer store automatically assigns customer checkout to the nearest operational branch via GPS distance algorithms.</span>
                    </div>
                    <span className="font-mono font-bold text-sky-700 shrink-0">Dynamic Dark Store Routing</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 4. SUBSCRIPTION PLANS                                  */}
          {/* ===================================================================== */}
          {activeNav === 'plans' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <span>Monetization & Subscription Plans</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Tiered pricing, commission rates, rider limits, and dark store dispatches for supermarket partners.
                  </p>
                </div>
              </div>

              {/* 3 Tier Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div
                    key={plan.name}
                    className={`bg-white rounded-3xl p-6 border shadow-2xs space-y-5 flex flex-col justify-between ${
                      plan.name === 'Enterprise'
                        ? 'border-purple-300 ring-2 ring-purple-500/20'
                        : 'border-slate-200/90'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                          {plan.badge}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {plan.commissionRate}% Commission
                        </span>
                      </div>

                      <h3 className="text-2xl font-black text-slate-900 mt-3">{plan.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">PKR {plan.price.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 font-bold">/ month</span>
                      </div>

                      <p className="text-xs text-slate-500 mt-2">{plan.description}</p>

                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 mb-2">
                        Subscribed Marts:{' '}
                        <span className="text-purple-700">
                          {displayStores.filter((s) => s.plan === plan.name).length} stores
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTenant(displayStores[0]);
                          setIsPlanModalOpen(true);
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-800 rounded-xl text-xs font-bold transition text-center cursor-pointer"
                      >
                        Assign Mart to {plan.name}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 5. MART ADMINS (STORE ADMINS) MANAGEMENT               */}
          {/* ===================================================================== */}
          {activeNav === 'admins' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    <span>Mart Admins Credentials & Password Control</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Every grocery shop has its dedicated Store Admin account and custom credentials assigned by Super Admin.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddAdminOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Store Admin & Set Password</span>
                </button>
              </div>

              {/* Empty state if no admins added yet */}
              {(storeAdmins || []).length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
                    🛡️
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">No Mart Admins Added Yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      All pre-seeded admin mocks have been removed. Super Admin can now add dedicated Store Admins and set custom login passwords for each grocery shop manually.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddAdminOpen(true)}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-900/20 transition cursor-pointer"
                  >
                    + Add First Mart Admin & Set Password
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {(storeAdmins || []).length} Registered Mart Admins
                    </span>
                    <button
                      onClick={() => setIsAddAdminOpen(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Admin</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {filteredAdmins.map((admin) => {
                      const isPasswordShown = !!showPasswordMap[admin.id];
                      return (
                        <div
                          key={admin.id}
                          className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
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
                                    admin.status === 'Active'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {admin.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                                {admin.email} {admin.phone && `• ${admin.phone}`}
                              </div>
                            </div>
                          </div>

                          {/* Password Control Box */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
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
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(admin.password);
                                  addToast('Copied!', 'Password copied to clipboard.');
                                }}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                                title="Copy Password"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const newPass = prompt(`Set new password for ${admin.name} (${admin.tenantName}):`, admin.password);
                                if (newPass && newPass.trim()) {
                                  updateStoreAdmin(admin.id, { password: newPass.trim() });
                                  addToast('Password Changed 🔑', `New password set for ${admin.name}.`);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition"
                            >
                              Reset Key
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleStoreAdminStatus(admin.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                admin.status === 'Active'
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {admin.status === 'Active' ? 'Suspend' : 'Activate'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete Mart Admin ${admin.name}?`)) {
                                  deleteStoreAdmin(admin.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition"
                              title="Delete Admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 6. CUSTOMERS REGISTRY                                  */}
          {/* ===================================================================== */}
          {activeNav === 'customers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    <span>Platform Customers Registry</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Registered grocery customers, orders history, delivery addresses, and account status.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Customer Manually</span>
                </button>
              </div>

              {(customers || []).length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
                    👥
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">No Customers Added Yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      All default mock customer seeds have been cleared. You can manually register customers here or let them register automatically upon placing their first grocery order.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddCustomerOpen(true)}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-900/20 transition cursor-pointer"
                  >
                    + Add First Customer
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50">
                          <th className="py-3 pl-4">Customer</th>
                          <th className="py-3">Contact</th>
                          <th className="py-3">Address</th>
                          <th className="py-3">Orders</th>
                          <th className="py-3">Spent</th>
                          <th className="py-3">Status</th>
                          <th className="py-3 pr-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCustomers.map((cust) => (
                          <tr key={cust.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 pl-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 font-bold flex items-center justify-center text-xs">
                                  {cust.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">{cust.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono block">{cust.id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="block font-medium text-slate-700">{cust.email}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">{cust.phone}</span>
                            </td>
                            <td className="py-3 text-slate-600 max-w-xs truncate">{cust.address || 'Lahore, Pakistan'}</td>
                            <td className="py-3 font-semibold text-slate-700">{cust.totalOrders || 0}</td>
                            <td className="py-3 font-mono font-bold text-slate-900">{cust.totalSpent || 'PKR 0'}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {cust.status || 'Active'}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <button
                                onClick={() => deleteCustomer(cust.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                                title="Delete Customer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 7. ALL ORDERS STREAM                                   */}
          {/* ===================================================================== */}
          {activeNav === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-600" />
                    <span>Cross-Store Orders Dispatch Stream</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Real-time consolidated grocery orders across Al-Fatah, Case Value, Chase Up, and Fresh Mart.
                  </p>
                </div>
              </div>

              {/* Sample Live Cross-Mart Orders */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50">
                        <th className="py-3 pl-4">Order ID</th>
                        <th className="py-3">Supermarket</th>
                        <th className="py-3">Customer</th>
                        <th className="py-3">Hub & City</th>
                        <th className="py-3">Amount</th>
                        <th className="py-3">Status</th>
                        <th className="py-3 pr-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { id: '#ORD-9821', store: 'Al-Fatah', logo: '🏬', cust: 'Hafsa Tariq', hub: 'Gulberg Hub, Lahore', amt: 'PKR 4,850', st: 'In Transit', color: 'bg-blue-100 text-blue-800' },
                        { id: '#ORD-9820', store: 'Chase Value', logo: '🛒', cust: 'Farhan Ali', hub: 'Shaheed-e-Millat, Karachi', amt: 'PKR 2,490', st: 'Delivered', color: 'bg-emerald-100 text-emerald-800' },
                        { id: '#ORD-9819', store: 'Chase Up', logo: '🏪', cust: 'Zubair Khan', hub: 'Clifton Hub, Karachi', amt: 'PKR 3,120', st: 'Packing', color: 'bg-amber-100 text-amber-800' },
                        { id: '#ORD-9818', store: 'Fresh Mart', logo: '🛒', cust: 'Aimen Yasin', hub: 'DHA Hub, Lahore', amt: 'PKR 1,850', st: 'Delivered', color: 'bg-emerald-100 text-emerald-800' },
                        { id: '#ORD-9817', store: 'Local Grocery', logo: '🏬', cust: 'Hamza Sheikh', hub: 'Multan Cantt', amt: 'PKR 1,240', st: 'Pending', color: 'bg-slate-100 text-slate-800' }
                      ].map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 pl-4 font-mono font-bold text-slate-900">{ord.id}</td>
                          <td className="py-3 font-semibold text-slate-800">
                            <span className="mr-1">{ord.logo}</span> {ord.store}
                          </td>
                          <td className="py-3 text-slate-700 font-medium">{ord.cust}</td>
                          <td className="py-3 text-slate-500">{ord.hub}</td>
                          <td className="py-3 font-mono font-bold text-slate-900">{ord.amt}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ord.color}`}>{ord.st}</span>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <button
                              onClick={() => addToast('Order Details 📦', `Viewing invoice for ${ord.id} from ${ord.store}`)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                            >
                              Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 9. LIVE GPS TRACKING                                   */}
          {/* ===================================================================== */}
          {activeNav === 'tracking' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-indigo-600" />
                  <span>Live GPS Dark Store Radar & Telemetry</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Real-time rider coordinates and active 15-minute dispatch radius monitoring.
                </p>
              </div>

              <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl min-h-[360px] flex flex-col justify-between">
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Live Telemetry Active
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">18 Dark Store Hubs Online</span>
                </div>

                <div className="relative z-10 my-auto text-center space-y-2">
                  <div className="text-5xl">🛰️</div>
                  <h3 className="text-xl font-black">Super Grocery Dark Store GPS Radar</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Live telemetry tracking riders across Lahore (Gulberg, DHA), Karachi (Clifton, Shaheed-e-Millat), and Islamabad.
                  </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center pt-4 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Active In-Transit</span>
                    <span className="text-lg font-black text-emerald-400">14 Dispatches</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Avg Speed</span>
                    <span className="text-lg font-black text-sky-400">32 km/h</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Avg Delivery Time</span>
                    <span className="text-lg font-black text-amber-400">18.2 Mins</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">SLA On-Time</span>
                    <span className="text-lg font-black text-purple-400">99.2%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 10. DELIVERY SLA PERFORMANCE                           */}
          {/* ===================================================================== */}
          {activeNav === 'performance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-600" />
                  <span>Fulfillment SLA & Compliance Metrics</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  15-minute express grocery delivery benchmarks and tenant compliance records.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { title: 'Platform SLA Fulfillment', val: '99.2%', sub: 'Guaranteed 98.5% benchmark', color: 'text-emerald-600' },
                  { title: 'Average Doorstep ETA', val: '18.4 min', sub: 'Across 18 dark store hubs', color: 'text-blue-600' },
                  { title: 'Customer Handover Rating', val: '4.92 / 5.0', sub: 'Based on 4,820 order reviews', color: 'text-amber-500' }
                ].map((m, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                    <span className="text-xs font-bold text-slate-500">{m.title}</span>
                    <span className={`text-3xl font-black block ${m.color}`}>{m.val}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{m.sub}</span>
                  </div>
                ))}
              </div>

              {/* Per-Store Performance Breakdown */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="text-sm font-black text-slate-900">Supermarket Store SLA Compliance</h3>
                <div className="divide-y divide-slate-100">
                  {displayStores.map((store) => (
                    <div key={store.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{store.logo}</span>
                        <span className="font-bold text-slate-800">{store.fullName}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-mono text-slate-600">{store.branchesCount} Hubs</span>
                        <span className="font-bold text-emerald-600">99.1% SLA</span>
                        <span className="text-slate-400 font-mono">17.8 min avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 11. PAYMENTS & SETTLEMENTS                             */}
          {/* ===================================================================== */}
          {activeNav === 'payments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-teal-600" />
                    <span>Tenant Settlements & Payouts Ledger</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Daily reconciliation of gross store earnings, platform commission deductions, and bank payouts.
                  </p>
                </div>
                <button
                  onClick={() => addToast('Settlements Triggered 💳', 'Initiating ACH / 1Link bank settlement run for all active marts.')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Initiate Bank Settlement Run
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50">
                      <th className="py-3 pl-4">Supermarket Mart</th>
                      <th className="py-3">Gross Sales (Today)</th>
                      <th className="py-3">Platform Cut</th>
                      <th className="py-3">Net Payout</th>
                      <th className="py-3">Settlement Status</th>
                      <th className="py-3 pr-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayStores.map((store) => (
                      <tr key={store.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 pl-4 font-bold text-slate-900">
                          <span className="mr-1.5">{store.logo}</span>
                          {store.fullName}
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-700">{store.revenueFormatted}</td>
                        <td className="py-3 font-mono text-purple-700 font-bold">
                          PKR {Math.round(store.revenueToday * 0.035).toLocaleString()}
                        </td>
                        <td className="py-3 font-mono text-emerald-700 font-bold">
                          PKR {Math.round(store.revenueToday * 0.965).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Reconciled
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <button
                            onClick={() => addToast('Payout Executed 💸', `PKR ${Math.round(store.revenueToday * 0.965).toLocaleString()} transferred to ${store.fullName}.`)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                          >
                            Release
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 12. COMMISSIONS                                        */}
          {/* ===================================================================== */}
          {activeNav === 'commissions' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Percent className="w-5 h-5 text-orange-500" />
                  <span>Platform Commission & Take-Rate</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Super Admin commission revenue generated from grocery orders across subscription tiers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">Starter Tier Take-Rate</span>
                  <span className="text-3xl font-black text-slate-900 block">5.0%</span>
                  <span className="text-[11px] text-slate-400">Growth single-hub boutique marts</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">Professional Tier Take-Rate</span>
                  <span className="text-3xl font-black text-slate-900 block">3.5%</span>
                  <span className="text-[11px] text-slate-400">Multi-branch expanding supermarket chains</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">Enterprise Tier Take-Rate</span>
                  <span className="text-3xl font-black text-slate-900 block">2.0%</span>
                  <span className="text-[11px] text-slate-400">Nationwide retail hypermarkets</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
                <h3 className="text-sm font-black text-slate-900">Total Commissions Earned (Today)</h3>
                <div className="text-3xl font-black text-emerald-600 font-mono">PKR 43,598</div>
                <p className="text-xs text-slate-500">
                  Calculated automatically on completed deliveries across all 6 registered supermarkets.
                </p>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 13. REPORTS CENTER                                     */}
          {/* ===================================================================== */}
          {activeNav === 'reports' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <span>Platform Reports & Analytics Center</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Generate and download certified audit reports for tenant performance, tax compliance, and fleet operations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { title: 'Monthly GMV & Revenue Audit Report', desc: 'Consolidated gross transaction volume, delivery fee collections, and tenant subscriptions.', format: 'CSV / PDF' },
                  { title: 'Mart Admin Compliance & SLA Audit Report', desc: 'Order fulfillment rates, cancellation frequencies, and average preparation durations.', format: 'PDF Summary' },
                  { title: 'Rider Fleet Utilization & Dispatch Telemetry', desc: 'Distance traveled, fuel consumption benchmarks, and delivery completion times.', format: 'CSV' },
                  { title: 'Customer Acquisition & Retention Metrics', desc: 'Cohort retention, average basket size, and high-frequency neighborhood heatmaps.', format: 'JSON / CSV' }
                ].map((rep, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-slate-900 text-sm">{rep.title}</h3>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {rep.format}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{rep.desc}</p>
                    </div>
                    <button
                      onClick={() => addToast('Report Download 📄', `Exporting ${rep.title}...`)}
                      className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Report</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 14. PLATFORM SETTINGS                                  */}
          {/* ===================================================================== */}
          {activeNav === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-600" />
                  <span>Platform System Settings & Security</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Multi-tenant isolation policies, currency configurations, and platform maintenance toggles.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6 max-w-2xl">
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Platform Brand Title</label>
                    <input
                      type="text"
                      defaultValue="Super Grocery Multi-Tenant Platform"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Primary Currency</label>
                    <input
                      type="text"
                      defaultValue="PKR (Pakistani Rupee - Rs.)"
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Free Delivery Threshold</label>
                    <input
                      type="number"
                      defaultValue={1000}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Orders above this PKR amount qualify for Rs. 0 delivery fee</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Dark Store Delivery Radius (KM)</label>
                    <input
                      type="number"
                      defaultValue={12}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => addToast('Settings Saved ✅', 'Platform configurations updated successfully.')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Save Platform Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 15. BROADCAST NOTIFICATIONS                            */}
          {/* ===================================================================== */}
          {activeNav === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  <span>Platform Broadcast Alerts & Announcements</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Send high-priority system announcements to Mart Admins, Delivery Riders, or Customers.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4 max-w-2xl">
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Target Audience</label>
                    <select
                      value={broadcastForm.audience}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, audience: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                    >
                      <option value="all_admins">All Mart Admins (Store Admins)</option>
                      <option value="all_riders">All Delivery Fleet Riders</option>
                      <option value="all_customers">All Registered Customers</option>
                      <option value="all">Entire Platform Ecosystem</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Alert Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Scheduled Dark Store Maintenance"
                      value={broadcastForm.title}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Message Content</label>
                    <textarea
                      rows={4}
                      placeholder="Type broadcast message to all users in this group..."
                      value={broadcastForm.message}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:bg-white focus:outline-none"
                    ></textarea>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      if (!broadcastForm.title || !broadcastForm.message) {
                        addToast('Missing Info', 'Please enter a title and message for the broadcast.', 'error');
                        return;
                      }
                      addToast('Broadcast Sent 📢', `Announcement broadcasted to ${broadcastForm.audience}.`);
                      setBroadcastForm({ audience: 'all_admins', title: '', message: '', priority: 'Normal' });
                    }}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Platform Broadcast</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUB-DASHBOARD: 16. AUDIT LOGS                                         */}
          {/* ===================================================================== */}
          {activeNav === 'audit' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-slate-600" />
                  <span>Immutable Security & Administrative Audit Logs</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Cryptographically timestamped log of Super Admin and Mart Admin operations.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50">
                      <th className="py-3 pl-4">Timestamp</th>
                      <th className="py-3">Event</th>
                      <th className="py-3">Actor</th>
                      <th className="py-3">Target</th>
                      <th className="py-3 pr-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {[
                      { time: 'Just now', event: 'SUPER_ADMIN_AUTH', actor: 'superadmin', target: 'Command Center', st: 'SUCCESS' },
                      { time: '12 mins ago', event: 'STORE_ADMIN_PASSWORD_RESET', actor: 'superadmin', target: 'Al-Fatah Store Admin', st: 'SUCCESS' },
                      { time: '45 mins ago', event: 'TENANT_SUBSCRIPTION_UPDATE', actor: 'superadmin', target: 'Chase Value (Pro)', st: 'SUCCESS' },
                      { time: '2 hours ago', event: 'DARK_STORE_DISPATCH', actor: 'dispatch_engine', target: 'Gulberg Hub DHA', st: 'SUCCESS' },
                      { time: 'Yesterday', event: 'PLATFORM_BOOTSTRAP', actor: 'system_root', target: 'Multi-Tenant Registry', st: 'SUCCESS' }
                    ].map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 pl-4 text-slate-500">{log.time}</td>
                        <td className="py-3 font-bold text-slate-900">{log.event}</td>
                        <td className="py-3 text-blue-600">{log.actor}</td>
                        <td className="py-3 text-slate-700">{log.target}</td>
                        <td className="py-3 pr-4 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {log.st}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Floating Scroll to Top Button */}
        <button
          onClick={() => mainWorkspaceRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 px-3.5 py-2.5 bg-slate-900/90 hover:bg-black text-white rounded-full shadow-2xl transition-all cursor-pointer border border-slate-700/80 backdrop-blur-xs flex items-center gap-1.5 text-xs font-bold hover:scale-105 active:scale-95"
          title="Scroll to Top of Dashboard"
        >
          <ChevronUp className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Top</span>
        </button>
      </main>

      {/* ========================================================================= */}
      {/* 3. MODALS (Add Store Admin, Add Tenant, Add Customer, Add Branch, etc.)   */}
      {/* ========================================================================= */}

      {/* --- A. ADD STORE ADMIN & SET PASSWORD MODAL --- */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Add Mart Admin & Set Password
                </h3>
                <span className="text-xs text-slate-500">Every mart has its own dedicated admin account</span>
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
                <label className="font-bold text-slate-700 block mb-1">Select Supermarket Mart</label>
                <select
                  value={newAdminForm.tenantId}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, tenantId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                >
                  {displayStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.logo} {store.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sheikh Tariq Al-Fatah"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Login Email / Username</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@alfatah.pk"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Set Password</label>
                <input
                  type="text"
                  required
                  placeholder="Enter login password for this Store Admin"
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+92 300 8441122"
                  value={newAdminForm.phone}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdminOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Create & Assign Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- B. ADD CUSTOMER MODAL --- */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Add Customer Manually</h3>
                <span className="text-xs text-slate-500">Super Admin direct customer registration</span>
              </div>
              <button onClick={() => setIsAddCustomerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hafsa Tariq"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. hafsa@example.com"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 0300-1234567"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="House #12, Street 4, Gulberg III"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">City</label>
                <select
                  value={newCustomerForm.city}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Multan">Multan</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- C. ADD BRANCH MODAL --- */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Add New Branch Hub</h3>
                <span className="text-xs text-slate-500">Add physical store or dark store fulfillment node</span>
              </div>
              <button onClick={() => setIsAddBranchOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addBranch({
                  tenantId: newBranchForm.tenantId,
                  name: newBranchForm.name,
                  code: newBranchForm.code || `BR-${Math.floor(100 + Math.random() * 900)}`,
                  city: newBranchForm.city,
                  address: newBranchForm.address,
                  manager: newBranchForm.manager || 'Store Manager',
                  phone: newBranchForm.phone || '+92 41 8712345',
                  operatingHours: newBranchForm.operatingHours || '08:00 AM - 11:00 PM',
                  deliveryRadius: Number(newBranchForm.deliveryRadius || 15),
                  status: 'active'
                });
                setIsAddBranchOpen(false);
                setNewBranchForm({
                  tenantId: 'tenant-alfatah',
                  name: '',
                  code: '',
                  city: 'Faisalabad',
                  address: '',
                  manager: '',
                  phone: '+92 41 8712345',
                  operatingHours: '08:00 AM - 11:00 PM',
                  deliveryRadius: 15,
                  status: 'active'
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Parent Supermarket Store</label>
                <select
                  value={newBranchForm.tenantId}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, tenantId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                >
                  {displayStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.logo} {store.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DHA Phase 6 Express"
                    value={newBranchForm.name}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Branch Code</label>
                  <input
                    type="text"
                    placeholder="e.g. LHR-02 / FSD-03"
                    value={newBranchForm.code}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">City</label>
                <select
                  value={newBranchForm.city}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Multan">Multan</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Physical Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Boulevard, Sector C, DHA"
                  value={newBranchForm.address}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Branch Manager</label>
                  <input
                    type="text"
                    placeholder="e.g. Tariq Mehmood"
                    value={newBranchForm.manager}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, manager: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +92 42 35741122"
                    value={newBranchForm.phone}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Radius (km)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newBranchForm.deliveryRadius}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, deliveryRadius: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    placeholder="08:00 AM - 11:00 PM"
                    value={newBranchForm.operatingHours}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, operatingHours: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Register Store Branch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- E. ADD TENANT MODAL --- */}
      {isAddTenantOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Register New Supermarket Store</h3>
                <span className="text-xs text-slate-500">Create a new tenant on the Super Grocery Platform</span>
              </div>
              <button onClick={() => setIsAddTenantOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
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
                  color: '#0e7c66',
                  logo: '🏬',
                  subscription: {
                    plan: plan,
                    billingCycle: 'Monthly',
                    price: plan === 'Enterprise' ? 75000 : plan === 'Professional' ? 35000 : 15000,
                    status: 'Active',
                    features: ['Store Admin Console', 'Unlimited Products', 'Fleet Dispatch']
                  },
                  hubs: ['Main City Hub', 'DHA Hub']
                });

                addToast('Supermarket Registered 🎉', `${storeName} added with ${plan} subscription.`);
                setIsAddTenantOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Supermarket Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Imtiaz Super Market"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Owner / Manager Full Name</label>
                <input
                  type="text"
                  name="ownerName"
                  required
                  placeholder="e.g. Imtiaz Abbasi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Owner Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. partnerships@imtiaz.pk"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subscription Plan Tier</label>
                <select
                  name="plan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="Enterprise">Enterprise (PKR 75,000/mo - 2% Commission)</option>
                  <option value="Professional">Professional (PKR 35,000/mo - 3.5% Commission)</option>
                  <option value="Starter">Starter (PKR 15,000/mo - 5% Commission)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTenantOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Register Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- F. UPDATE SUBSCRIPTION PLAN MODAL --- */}
      {isPlanModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Update Subscription Plan
                </h3>
                <span className="text-xs text-slate-500">{selectedTenant.fullName}</span>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Tier</label>
                <select
                  value={editPlanForm.plan}
                  onChange={(e) => {
                    const nextPlan = e.target.value;
                    const nextPrice = nextPlan === 'Enterprise' ? 75000 : nextPlan === 'Professional' ? 35000 : 15000;
                    setEditPlanForm({ ...editPlanForm, plan: nextPlan, price: nextPrice });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="Enterprise">Enterprise (PKR 75,000/mo - 2% Commission)</option>
                  <option value="Professional">Professional (PKR 35,000/mo - 3.5% Commission)</option>
                  <option value="Starter">Starter (PKR 15,000/mo - 5% Commission)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Billing Cycle</label>
                <select
                  value={editPlanForm.billingCycle}
                  onChange={(e) => setEditPlanForm({ ...editPlanForm, billingCycle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual (Save 15%)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Monthly Fee (PKR)</label>
                <input
                  type="number"
                  value={editPlanForm.price}
                  onChange={(e) => setEditPlanForm({ ...editPlanForm, price: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- G. MANAGE STORE SETTINGS MODAL --- */}
      {isManageModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Manage Supermarket Profile</h3>
                <span className="text-xs text-slate-500">{selectedTenant.fullName}</span>
              </div>
              <button onClick={() => setIsManageModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tagline</label>
                <input
                  type="text"
                  value={editStoreForm.tagline}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, tagline: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Owner Name</label>
                <input
                  type="text"
                  value={editStoreForm.ownerName}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, ownerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={editStoreForm.ownerEmail}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, ownerEmail: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManageModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- H. DETAILS MODAL --- */}
      {isDetailsModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedTenant.logo}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">{selectedTenant.fullName}</h3>
                  <span className="text-xs text-slate-500">{selectedTenant.tagline}</span>
                </div>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Owner</span>
                  <span className="font-bold text-slate-800">{selectedTenant.ownerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Email</span>
                  <span className="font-mono text-slate-700">{selectedTenant.ownerEmail}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Subscription Tier</span>
                  <span className="font-bold text-purple-700">{selectedTenant.plan}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
                  <span className="font-bold text-emerald-700">{selectedTenant.status}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1.5">Dark Store Fulfillment Hubs:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTenant.hubs.map((hub, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 font-medium rounded-lg text-[11px]"
                    >
                      📍 {hub}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleImpersonateStore(selectedTenant);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Enter Store Admin Console →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
