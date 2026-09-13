import React, { useState } from 'react';
import {
  ShieldAlert,
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
  Sparkles,
  Store,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Award,
  Layers,
  Truck,
  MapPin,
  Calendar,
  X,
  Copy,
  Check,
  Sliders,
  DollarSign
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SUBSCRIPTION_PLANS } from '../../data/tenantData';

export const SuperAdminDashboard = ({ onSwitchToStoreAdmin }) => {
  const {
    tenants,
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
    addToast
  } = useStore();

  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'subscriptions' | 'orders' | 'performance'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Active' | 'Pending' | 'Suspended'
  const [selectedOrderTenant, setSelectedOrderTenant] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Invite Modal state
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    ownerName: '',
    plan: 'Pro',
    billingCycle: 'monthly',
    message: ''
  });
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Add Tenant Modal state
  const [addForm, setAddForm] = useState({
    name: '',
    legalName: '',
    slug: '',
    tagline: 'Fresh Groceries & Household Goods',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    city: 'Lahore, Pakistan',
    address: '',
    plan: 'Pro',
    billingCycle: 'monthly',
    color: '#16a34a',
    logo: '',
    banner: ''
  });

  // Subscription Edit state
  const [subForm, setSubForm] = useState({
    plan: 'Starter',
    billingCycle: 'monthly',
    price: 15000,
    renewAt: ''
  });

  const overview = getPlatformOverview ? getPlatformOverview() : {
    totalTenants: tenants.length,
    activeTenants: tenants.filter((t) => t.status === 'Active').length,
    totalGmv: 1850000,
    totalCommission: 92500,
    totalOrders: adminOrders.length + 150,
    totalRiders: riders.length || 8,
    avgSla: '99.1%'
  };

  // Filtered tenants
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.ownerEmail && tenant.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tenant.city && tenant.city.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Cross-tenant orders
  const crossTenantOrders = selectedOrderTenant === 'all'
    ? adminOrders
    : adminOrders.filter((o) => o.tenantId === selectedOrderTenant || (!o.tenantId && selectedOrderTenant === 'tenant-freshmart'));

  const handleOpenSubscription = (tenant) => {
    setSelectedTenant(tenant);
    setSubForm({
      plan: tenant.subscription?.plan || 'Starter',
      billingCycle: tenant.subscription?.billingCycle || 'monthly',
      price: tenant.subscription?.price || (SUBSCRIPTION_PLANS[tenant.subscription?.plan || 'Starter']?.price || 15000),
      renewAt: tenant.subscription?.renewAt ? new Date(tenant.subscription.renewAt).toISOString().split('T')[0] : ''
    });
    setIsSubModalOpen(true);
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;
    await updateTenantSubscription(selectedTenant.id, {
      plan: subForm.plan,
      billingCycle: subForm.billingCycle,
      price: Number(subForm.price),
      renewAt: subForm.renewAt ? new Date(subForm.renewAt).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    setIsSubModalOpen(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.ownerEmail) {
      addToast('Missing Info', 'Please enter store name and owner email.', 'error');
      return;
    }
    await addTenant(addForm);
    setIsAddModalOpen(false);
    setAddForm({
      name: '',
      legalName: '',
      slug: '',
      tagline: 'Fresh Groceries & Household Goods',
      ownerName: '',
      ownerEmail: '',
      phone: '',
      city: 'Lahore, Pakistan',
      address: '',
      plan: 'Pro',
      billingCycle: 'monthly',
      color: '#16a34a',
      logo: '',
      banner: ''
    });
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) {
      addToast('Missing Info', 'Please provide tenant name and recipient email.', 'error');
      return;
    }
    const res = await inviteTenant(inviteForm);
    if (res && res.inviteLink) {
      setGeneratedInviteLink(res.inviteLink);
    }
  };

  const copyToClipboard = (text) => {
    try {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      addToast('Link Copied 📋', 'Tenant onboarding invite copied to clipboard.');
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {}
  };

  const handleImpersonateTenant = (tenant) => {
    setCurrentTenant(tenant);
    if (onSwitchToStoreAdmin) {
      onSwitchToStoreAdmin(tenant);
    } else {
      navigateTo('admin');
    }
    addToast('Store Admin View 🏬', `Switched into ${tenant.name} dashboard`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Top Super Admin Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">Super Grocery Platform</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-Tenant Enterprise Operating System • Al-Fatah, Chase Value, Chase Up & FreshMart
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Store Admin Quick Jump Dropdown */}
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Inspect Store:</span>
              <select
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                value={currentTenant?.id || ''}
                onChange={(e) => {
                  const t = tenants.find((item) => item.id === e.target.value);
                  if (t) handleImpersonateTenant(t);
                }}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    🏬 {t.name} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setGeneratedInviteLink('');
                setIsInviteModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Mail className="w-4 h-4 text-amber-400" />
              Invite Tenant
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Tenant
            </button>

            <button
              onClick={adminLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              title="Sign Out"
            >
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-8 border-t border-slate-800/80 overflow-x-auto">
          {[
            { id: 'tenants', label: '🏬 Tenants Hub', count: tenants.length },
            { id: 'subscriptions', label: '💳 Subscription Center', count: tenants.length },
            { id: 'orders', label: '📦 Cross-Tenant Orders', count: adminOrders.length },
            { id: 'performance', label: '📈 Platform Performance', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Platform Overview Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Platform GMV</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Rs. {(overview.totalGmv || 0).toLocaleString()}
            </div>
            <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
              <span>+18.4%</span>
              <span className="text-slate-500 font-normal">vs last month</span>
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Tenants</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
              <span>{overview.activeTenants}</span>
              <span className="text-sm font-semibold text-slate-500">/ {overview.totalTenants} total</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {tenants.filter((t) => t.status === 'Pending').length} pending approval
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Commission Revenue</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
              Rs. {(overview.totalCommission || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-2">Avg 5% platform take rate</p>
          </div>

          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Fulfillment SLA</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
              {overview.avgSla || '99.2%'}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {overview.totalRiders || 8} Active delivery riders
            </p>
          </div>
        </section>

        {/* TAB 1: TENANTS HUB */}
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search stores by name, slug, email, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                {['all', 'Active', 'Pending', 'Suspended'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      statusFilter === status
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {status === 'all' ? 'All Stores' : status}
                  </button>
                ))}
              </div>
            </div>

            {/* Tenants Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredTenants.map((tenant) => {
                const isTenantActive = tenant.status === 'Active';
                const isPending = tenant.status === 'Pending';
                const isSuspended = tenant.status === 'Suspended';
                const planDetails = SUBSCRIPTION_PLANS[tenant.subscription?.plan || 'Starter'] || SUBSCRIPTION_PLANS.Starter;
                const perf = getTenantPerformance(tenant.id);

                return (
                  <div
                    key={tenant.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700 transition flex flex-col justify-between shadow-xl"
                  >
                    {/* Top Accent Strip with tenant brand color */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: tenant.color || '#16a34a' }}
                    />

                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={tenant.logo}
                            alt={tenant.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-slate-800 bg-slate-800 p-1 shadow-md"
                            onError={(e) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=160&q=80';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-white tracking-tight">{tenant.name}</h3>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  isTenantActive
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : isPending
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                }`}
                              >
                                {tenant.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{tenant.legalName}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                {tenant.city || 'Pakistan'}
                              </span>
                              <span className="font-mono text-slate-500">ID: {tenant.slug}</span>
                            </div>
                          </div>
                        </div>

                        {/* Subscription Tier Badge */}
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-amber-400 border border-slate-700">
                            ⭐ {tenant.subscription?.plan || 'Starter'}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Rs. {(tenant.subscription?.price || 15000).toLocaleString()}/{tenant.subscription?.billingCycle || 'mo'}
                          </p>
                        </div>
                      </div>

                      {/* Store Details Strip */}
                      <div className="grid grid-cols-3 gap-3 my-5 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
                        <div>
                          <span className="text-[11px] text-slate-500 font-semibold block uppercase">Hubs</span>
                          <span className="text-base font-bold text-white">{(tenant.hubs || []).length || 1} Branches</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-semibold block uppercase">Store GMV</span>
                          <span className="text-base font-bold text-emerald-400">
                            Rs. {(perf.gmv || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-semibold block uppercase">Orders</span>
                          <span className="text-base font-bold text-white">{perf.totalOrders || 0}</span>
                        </div>
                      </div>

                      {/* Owner contact */}
                      <div className="text-xs text-slate-400 space-y-1 mb-5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Store Manager:</span>
                          <span className="font-medium text-slate-300">{tenant.ownerName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Email:</span>
                          <span className="font-mono text-slate-300">{tenant.ownerEmail}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar for this Tenant */}
                    <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setIsDetailsModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="View Tenant Details"
                        >
                          Details
                        </button>

                        <button
                          onClick={() => handleOpenSubscription(tenant)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 transition"
                          title="Manage Plan & Billing"
                        >
                          Subscription
                        </button>

                        {/* Status Toggles: Approve / Suspend / Activate */}
                        {isPending && (
                          <button
                            onClick={() => approveTenant(tenant.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                          >
                            Approve
                          </button>
                        )}

                        {isTenantActive && (
                          <button
                            onClick={() => suspendTenant(tenant.id, 'Super Admin Manual Suspension')}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                          >
                            Suspend
                          </button>
                        )}

                        {isSuspended && (
                          <button
                            onClick={() => activateTenant(tenant.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                          >
                            Activate
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to completely delete ${tenant.name}?`)) {
                              deleteTenant(tenant.id);
                            }
                          }}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete Tenant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Impersonate into Store Admin */}
                      <button
                        onClick={() => handleImpersonateTenant(tenant)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition"
                      >
                        <Store className="w-3.5 h-3.5" />
                        Manage Store Admin
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SUBSCRIPTION CENTER */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-8">
            {/* Tier Overview Cards */}
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Available Multi-Tenant Subscription Tiers</h2>
              <p className="text-xs text-slate-400 mb-6">
                Platform subscription tiers determine the tenant's hub count, fleet limit, and platform commission.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => (
                  <div
                    key={planKey}
                    className={`rounded-3xl p-6 border transition flex flex-col justify-between ${
                      planKey === 'Enterprise'
                        ? 'bg-gradient-to-b from-amber-500/10 to-slate-900 border-amber-500/40 shadow-xl shadow-amber-500/5'
                        : planKey === 'Pro'
                        ? 'bg-gradient-to-b from-emerald-500/10 to-slate-900 border-emerald-500/40 shadow-xl shadow-emerald-500/5'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {plan.commissionRate}% Commission
                        </span>
                      </div>
                      <div className="text-3xl font-black text-white mb-1">
                        Rs. {plan.price.toLocaleString()}
                        <span className="text-xs font-normal text-slate-400"> / month</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-6">{plan.description}</p>

                      <div className="space-y-2.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Max Hubs: <strong>{plan.maxHubs}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Fleet Riders: <strong>{plan.maxRiders}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Priority SLA: <strong>{plan.slaGuarantee}</strong></span>
                        </div>
                        {plan.customDomain && (
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Custom Domain Routing</span>
                          </div>
                        )}
                        {plan.dedicatedSupport && (
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>24/7 Dedicated Account Manager</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                      Assigned to {tenants.filter((t) => t.subscription?.plan === planKey).length} stores
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tenant Subscriptions Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Active Tenant Subscription Register</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Store / Tenant</th>
                      <th className="py-3 px-4 font-semibold">Plan Tier</th>
                      <th className="py-3 px-4 font-semibold">Billing Cycle</th>
                      <th className="py-3 px-4 font-semibold">Monthly Price</th>
                      <th className="py-3 px-4 font-semibold">Commission</th>
                      <th className="py-3 px-4 font-semibold">Renewal Date</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {tenants.map((t) => {
                      const planKey = t.subscription?.plan || 'Starter';
                      const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.Starter;
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img src={t.logo} alt={t.name} className="w-8 h-8 rounded-lg object-cover bg-slate-800" />
                              <div>
                                <span className="font-bold text-white block">{t.name}</span>
                                <span className="text-[11px] text-slate-500 font-mono">{t.slug}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800 text-amber-300 border border-slate-700">
                              {plan.name}
                            </span>
                          </td>
                          <td className="py-3 px-4 capitalize">{t.subscription?.billingCycle || 'monthly'}</td>
                          <td className="py-3 px-4 font-bold text-white">
                            Rs. {(t.subscription?.price || plan.price).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-emerald-400 font-semibold">{plan.commissionRate}%</td>
                          <td className="py-3 px-4 text-slate-400">
                            {t.subscription?.renewAt
                              ? new Date(t.subscription.renewAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '30 days from signup'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {t.subscription?.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenSubscription(t)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 transition"
                            >
                              Modify Plan
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CROSS-TENANT ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-300">Filter By Supermarket:</span>
                <select
                  value={selectedOrderTenant}
                  onChange={(e) => setSelectedOrderTenant(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">🏬 All Supermarkets (Global Platform Stream)</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      🏬 {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-400">
                Showing <strong className="text-white">{crossTenantOrders.length}</strong> orders across tenant stores
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Order ID</th>
                      <th className="py-3 px-4 font-semibold">Supermarket Store</th>
                      <th className="py-3 px-4 font-semibold">Customer</th>
                      <th className="py-3 px-4 font-semibold">Items & Total</th>
                      <th className="py-3 px-4 font-semibold">Payment</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Assigned Rider</th>
                      <th className="py-3 px-4 font-semibold text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {crossTenantOrders.map((order) => {
                      const matchedTenant =
                        tenants.find((t) => t.id === order.tenantId) ||
                        tenants.find((t) => t.name === order.tenantName) ||
                        tenants[0];

                      return (
                        <tr key={order.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-white">{order.id}</td>
                          <td className="py-3 px-4">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border"
                              style={{
                                borderColor: matchedTenant?.color ? `${matchedTenant.color}50` : '#16a34a50',
                                backgroundColor: matchedTenant?.color ? `${matchedTenant.color}15` : '#16a34a15',
                                color: matchedTenant?.color || '#22c55e'
                              }}
                            >
                              🏬 {matchedTenant?.name || order.tenantName || 'FreshMart'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{order.customer || order.customerName || 'Customer'}</div>
                            <div className="text-[11px] text-slate-500">{order.customerPhone || order.city || 'Lahore'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-emerald-400">
                              Rs. {(order.total || order.totalAmount || order.totalPrice || 0).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {order.items || `${(order.orderItems || []).length || 2} Items`}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-medium">
                            {order.payment || order.paymentMethod || 'Cash on Delivery'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                order.status === 'Delivered'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : order.status === 'Out for Delivery'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {order.assignedRider?.name || order.assignedRider || '🛵 Auto-Dispatching'}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                            {order.time || 'Today'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PLATFORM PERFORMANCE & ANALYTICS */}
        {activeTab === 'performance' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 w-fit mb-4">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Top Performing Tenant</span>
                  <h3 className="text-2xl font-black text-white mt-1">Al-Fatah Supermarket</h3>
                  <p className="text-xs text-slate-400 mt-1">Leading platform GMV with Rs. 845,000+ volume</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Active SLA</span>
                  <span className="font-bold text-emerald-400">99.4% On-time</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 w-fit mb-4">
                    <Truck className="w-6 h-6" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Fastest Express Dispatch</span>
                  <h3 className="text-2xl font-black text-white mt-1">FreshMart Direct</h3>
                  <p className="text-xs text-slate-400 mt-1">Avg delivery time: 14 mins across Lahore hubs</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Active Riders</span>
                  <span className="font-bold text-cyan-400">4 Fleet Units</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit mb-4">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Total Platform Commission</span>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">
                    Rs. {(overview.totalCommission || 0).toLocaleString()}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Earned via multi-tenant 2-5% tiered rake</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Projected MRR</span>
                  <span className="font-bold text-white">Rs. 110,000 / mo</span>
                </div>
              </div>
            </div>

            {/* Tenant Comparative Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Store Performance Comparison Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Store / Brand</th>
                      <th className="py-3 px-4 font-semibold">Subscription Plan</th>
                      <th className="py-3 px-4 font-semibold">Orders Fulfilled</th>
                      <th className="py-3 px-4 font-semibold">Gross Merchandise Value (GMV)</th>
                      <th className="py-3 px-4 font-semibold">Commission Rate</th>
                      <th className="py-3 px-4 font-semibold">Platform Commission</th>
                      <th className="py-3 px-4 font-semibold">SLA %</th>
                      <th className="py-3 px-4 font-semibold text-right">Rider Fleet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {tenants.map((t) => {
                      const perf = getTenantPerformance(t.id);
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                            <img src={t.logo} alt={t.name} className="w-7 h-7 rounded-lg object-cover" />
                            {t.name}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-800 text-amber-300">
                              {perf.plan}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-200">{perf.totalOrders} orders</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400">
                            Rs. {(perf.gmv || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono">{perf.commissionRate}%</td>
                          <td className="py-3.5 px-4 font-bold text-amber-400">
                            Rs. {(perf.commission || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-cyan-400 font-bold">{perf.fulfillmentSla}</td>
                          <td className="py-3.5 px-4 text-right text-slate-300 font-medium">
                            {perf.activeRiders} Active Riders
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL 1: ADD NEW TENANT --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-white">Add New Supermarket Tenant</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Onboard a new grocery brand (e.g. Al-Fatah, Chase Value, Chase Up) onto the platform.
              </p>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Store Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Imtiaz Super Market"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Legal Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Imtiaz Super Market Pvt Ltd"
                    value={addForm.legalName}
                    onChange={(e) => setAddForm({ ...addForm, legalName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Owner / Store Manager Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tariq Imtiaz"
                    value={addForm.ownerName}
                    onChange={(e) => setAddForm({ ...addForm, ownerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Owner Admin Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@store.pk"
                    value={addForm.ownerEmail}
                    onChange={(e) => setAddForm({ ...addForm, ownerEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">City & Base</label>
                  <input
                    type="text"
                    placeholder="e.g. Karachi, Pakistan"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Phone Contact</label>
                  <input
                    type="text"
                    placeholder="+92 21 111 222 333"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Subscription Plan Tier</label>
                  <select
                    value={addForm.plan}
                    onChange={(e) => setAddForm({ ...addForm, plan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Starter">Starter (Rs. 15,000 / mo)</option>
                    <option value="Pro">Pro (Rs. 35,000 / mo)</option>
                    <option value="Enterprise">Enterprise (Rs. 75,000 / mo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Brand Color Hex</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={addForm.color}
                      onChange={(e) => setAddForm({ ...addForm, color: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={addForm.color}
                      onChange={(e) => setAddForm({ ...addForm, color: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Main Flagship Branch Address</label>
                <input
                  type="text"
                  placeholder="e.g. Main Boulevard, Gulberg, Lahore"
                  value={addForm.address}
                  onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/30"
                >
                  Create & Activate Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: INVITE TENANT --- */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 relative">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-white">Invite Supermarket Partner</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate an invitation token and link for a supermarket to register their branch network.
              </p>
            </div>

            {!generatedInviteLink ? (
              <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Supermarket Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metro Cash & Carry"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Partner Decision Maker Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="partnerships@metro.pk"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Offered Plan</label>
                    <select
                      value={inviteForm.plan}
                      onChange={(e) => setInviteForm({ ...inviteForm, plan: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Starter">Starter Tier</option>
                      <option value="Pro">Professional Tier</option>
                      <option value="Enterprise">Enterprise Tier</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Billing Cycle</label>
                    <select
                      value={inviteForm.billingCycle}
                      onChange={(e) => setInviteForm({ ...inviteForm, billingCycle: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual (-15% discount)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Custom Welcome Note</label>
                  <textarea
                    rows={2}
                    placeholder="We'd love to bring your retail inventory onto the Super Grocery network."
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20"
                  >
                    Generate Invitation
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <span className="font-bold block text-sm mb-1">🎉 Invitation Dispatched!</span>
                  <p>
                    A new pending tenant record has been recorded for <strong>{inviteForm.name}</strong>. Share the
                    onboarding registration link below:
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 font-semibold">One-Time Onboarding Link:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteLink}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[11px]"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedInviteLink)}
                      className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1 shrink-0"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 3: MANAGE SUBSCRIPTION --- */}
      {isSubModalOpen && selectedTenant && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 relative">
            <button
              onClick={() => setIsSubModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-white">Manage Tenant Subscription</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update billing tier and pricing for <strong>{selectedTenant.name}</strong>.
              </p>
            </div>

            <form onSubmit={handleSaveSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Subscription Plan</label>
                <select
                  value={subForm.plan}
                  onChange={(e) => {
                    const newPlan = e.target.value;
                    setSubForm({
                      ...subForm,
                      plan: newPlan,
                      price: SUBSCRIPTION_PLANS[newPlan]?.price || 15000
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="Starter">Starter (Rs. 15,000 / mo - 5% Take Rate)</option>
                  <option value="Pro">Pro (Rs. 35,000 / mo - 3.5% Take Rate)</option>
                  <option value="Enterprise">Enterprise (Rs. 75,000 / mo - 2% Take Rate)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Billing Cycle</label>
                  <select
                    value={subForm.billingCycle}
                    onChange={(e) => setSubForm({ ...subForm, billingCycle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Monthly Price (PKR)</label>
                  <input
                    type="number"
                    value={subForm.price}
                    onChange={(e) => setSubForm({ ...subForm, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Next Renewal Date</label>
                <input
                  type="date"
                  value={subForm.renewAt}
                  onChange={(e) => setSubForm({ ...subForm, renewAt: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: TENANT DETAILS --- */}
      {isDetailsModalOpen && selectedTenant && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto text-xs">
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <img
                src={selectedTenant.logo}
                alt={selectedTenant.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-800 bg-slate-800 p-1"
              />
              <div>
                <h3 className="text-xl font-extrabold text-white">{selectedTenant.name}</h3>
                <p className="text-slate-400">{selectedTenant.legalName}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {selectedTenant.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Tenant Slug:</span>
                <span className="font-mono text-slate-300">{selectedTenant.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Owner / Manager:</span>
                <span className="text-slate-300 font-medium">{selectedTenant.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Email:</span>
                <span className="font-mono text-slate-300">{selectedTenant.ownerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="text-slate-300">{selectedTenant.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Main Address:</span>
                <span className="text-slate-300 text-right">{selectedTenant.address || 'Flagship Store'}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">Delivery & Fulfillment Hubs</h4>
              <div className="space-y-2">
                {(selectedTenant.hubs || []).map((hub, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                    <div>
                      <span className="font-semibold text-white block">{hub.name}</span>
                      <span className="text-[11px] text-slate-500">{hub.address}</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400">Active Hub</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleImpersonateTenant(selectedTenant);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
              >
                <Store className="w-4 h-4" />
                Open Store Admin View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
