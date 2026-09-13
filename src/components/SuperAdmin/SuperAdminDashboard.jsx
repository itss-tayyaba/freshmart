import React, { useState } from 'react';
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
  SlidersHorizontal
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
    tagline: 'Fresh Groceries & Household Essentials',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    city: 'Lahore, Pakistan',
    address: '',
    plan: 'Pro',
    billingCycle: 'monthly',
    color: '#0e7c66',
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
      tagline: 'Fresh Groceries & Household Essentials',
      ownerName: '',
      ownerEmail: '',
      phone: '',
      city: 'Lahore, Pakistan',
      address: '',
      plan: 'Pro',
      billingCycle: 'monthly',
      color: '#0e7c66',
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
    addToast('Store Admin View 🏬', `Now inspecting ${tenant.name} dashboard`);
  };

  return (
    <div className="flex min-h-screen bg-[#f5f6f9] text-[#171b2e] font-sans antialiased">
      {/* 1. LEFT SIDEBAR (Sticky Ledgerly Navy) */}
      <aside className="ledger-sidebar">
        {/* Brand Block */}
        <div className="p-5 border-b border-[#1e2542] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0e7c66] flex items-center justify-center text-white text-base shadow-sm">
              🛒
            </div>
            <div>
              <div className="font-semibold text-white text-[14px] leading-tight tracking-tight">
                Super Grocery
              </div>
              <div className="text-[11px] text-[#9297a8] font-medium flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0e7c66]"></span>
                Super Admin Panel
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1e2542] text-[#aeb4c9]">
            v2.4
          </span>
        </div>

        {/* Grouped Navigation */}
        <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
          {/* Main Platform Section */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#9297a8] mb-2">
              Platform Overview
            </div>

            <button
              onClick={() => setActiveTab('tenants')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition ${
                activeTab === 'tenants'
                  ? 'bg-[#0e7c66] text-white shadow-sm'
                  : 'text-[#aeb4c9] hover:bg-[#1e2542] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                <span>Supermarkets</span>
              </div>
              <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                activeTab === 'tenants' ? 'bg-white/20 text-white' : 'bg-[#1e2542] text-[#aeb4c9]'
              }`}>
                {tenants.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition ${
                activeTab === 'subscriptions'
                  ? 'bg-[#0e7c66] text-white shadow-sm'
                  : 'text-[#aeb4c9] hover:bg-[#1e2542] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" />
                <span>Subscriptions</span>
              </div>
              <span className={`text-[11px] font-medium px-1.5 rounded ${
                activeTab === 'subscriptions' ? 'bg-white/20 text-white' : 'text-[#9297a8]'
              }`}>
                Tiers
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition ${
                activeTab === 'orders'
                  ? 'bg-[#0e7c66] text-white shadow-sm'
                  : 'text-[#aeb4c9] hover:bg-[#1e2542] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Cross-Store Orders</span>
              </div>
              <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-[#1e2542] text-[#aeb4c9]'
              }`}>
                {adminOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('performance')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition ${
                activeTab === 'performance'
                  ? 'bg-[#0e7c66] text-white shadow-sm'
                  : 'text-[#aeb4c9] hover:bg-[#1e2542] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4" />
                <span>Performance & GMV</span>
              </div>
              <span className={`text-[11px] font-medium px-1.5 rounded ${
                activeTab === 'performance' ? 'bg-white/20 text-white' : 'text-[#9297a8]'
              }`}>
                SLA
              </span>
            </button>
          </div>

          {/* Quick Impersonate Supermarket Section */}
          <div className="space-y-1.5 pt-2 border-t border-[#1e2542]">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#9297a8] mb-1 flex items-center justify-between">
              <span>Inspect Stores</span>
              <span className="text-[10px] text-[#0e7c66] font-semibold">Live</span>
            </div>
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => handleImpersonateTenant(t)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[12px] text-[#aeb4c9] hover:bg-[#1e2542] hover:text-white transition group text-left"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.themeColor || '#0e7c66' }} />
                  <span className="truncate">{t.name}</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#0e7c66] transition" />
              </button>
            ))}
          </div>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-[#1e2542] bg-[#0b1021]">
          <div className="p-2 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-[#1e2542] border border-[#2d375a] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                👑
              </div>
              <div className="truncate">
                <div className="text-[12.5px] font-semibold text-white leading-tight truncate">
                  Super Admin
                </div>
                <div className="text-[10.5px] text-[#9297a8] truncate">
                  superadmin@supergrocery.pk
                </div>
              </div>
            </div>
            <button
              onClick={adminLogout}
              className="p-1.5 rounded-md text-[#9297a8] hover:text-[#dc4c3f] hover:bg-[#1e2542] transition flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#e6e8ef] px-6 sm:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[12px] text-[#5a6072] font-medium">
                <span>Platform</span>
                <span>/</span>
                <span className="text-[#171b2e] font-semibold">Super Admin Panel</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#171b2e] tracking-tight mt-0.5">
                {activeTab === 'tenants' && 'Supermarkets & Multi-Tenant Registry'}
                {activeTab === 'subscriptions' && 'Tenant Subscriptions & SaaS Billing'}
                {activeTab === 'orders' && 'Cross-Supermarket Real-Time Orders'}
                {activeTab === 'performance' && 'Platform Performance & Commission Analytics'}
              </h1>
              <p className="text-[12px] text-[#5a6072] mt-0.5">
                Independent retail governance across Al-Fatah, Chase Value, Chase Up, and FreshMart Direct
              </p>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={() => {
                  setGeneratedInviteLink('');
                  setIsInviteModalOpen(true);
                }}
                className="btn-ledger-ghost"
              >
                <Mail className="w-3.5 h-3.5 text-[#5a6072]" />
                <span>Invite Tenant</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-ledger-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Onboard Supermarket</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          {/* Impersonation Alert Banner */}
          {currentTenant && (
            <div className="bg-[#dff3ee] border border-[#0e7c66]/30 text-[#0a5d4c] px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-base">👑</span>
                <span>
                  Currently inspecting Store Admin for <strong>{currentTenant.name}</strong> ({currentTenant.city}).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleImpersonateTenant(currentTenant)}
                  className="px-3 py-1 rounded bg-[#0e7c66] text-white text-xs font-semibold hover:bg-[#0a5d4c] transition"
                >
                  Open Store Console →
                </button>
                <button
                  onClick={() => {
                    setCurrentTenant(tenants[0]);
                    addToast('Global View', 'Returned to Global Super Admin view');
                  }}
                  className="px-2.5 py-1 rounded text-xs font-semibold text-[#0a5d4c] hover:bg-[#0e7c66]/10 transition"
                >
                  Reset Focus
                </button>
              </div>
            </div>
          )}

          {/* 5-Metric Stat Grid (Ledgerly stat-card style) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="ledger-stat-card">
              <div className="label">Companies (Tenants)</div>
              <div className="value">{overview.totalTenants}</div>
              <div className="text-[11px] text-[#5a6072] mt-1 font-medium">Pakistani Hypermarkets</div>
            </div>

            <div className="ledger-stat-card">
              <div className="label">Active Stores</div>
              <div className="value text-[#0e7c66]">{overview.activeTenants}</div>
              <div className="text-[11px] text-[#0e7c66] mt-1 font-medium">100% Operational</div>
            </div>

            <div className="ledger-stat-card">
              <div className="label">Suspended</div>
              <div className="value text-[#5a6072]">
                {tenants.filter((t) => t.status === 'Suspended').length}
              </div>
              <div className="text-[11px] text-[#5a6072] mt-1 font-medium">0 under restriction</div>
            </div>

            <div className="ledger-stat-card">
              <div className="label">Platform Orders</div>
              <div className="value">{overview.totalOrders}</div>
              <div className="text-[11px] text-[#5a6072] mt-1 font-medium">Live synced orders</div>
            </div>

            <div className="ledger-stat-card">
              <div className="label">Gross Platform GMV</div>
              <div className="value text-[#0e7c66]">
                Rs. {(overview.totalGmv || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-[#0e7c66] mt-1 font-medium">+18.4% this month</div>
            </div>
          </div>

          {/* TAB 1: TENANTS REGISTRY (The Main Ledgerly Table View) */}
          {activeTab === 'tenants' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9297a8]" />
                  <input
                    type="text"
                    placeholder="Search by store name, slug, email, or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#e6e8ef] rounded-lg text-[13px] text-[#171b2e] placeholder-[#9297a8] focus:outline-none focus:border-[#0e7c66] focus:ring-1 focus:ring-[#0e7c66] transition shadow-xs"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-[#5a6072] font-medium hidden sm:inline">Status:</span>
                  <div className="flex items-center bg-white border border-[#e6e8ef] p-0.5 rounded-lg shadow-xs">
                    {['all', 'Active', 'Pending', 'Suspended'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1 rounded text-xs font-medium transition ${
                          statusFilter === st
                            ? 'bg-[#0e7c66] text-white shadow-xs'
                            : 'text-[#5a6072] hover:text-[#171b2e]'
                        }`}
                      >
                        {st === 'all' ? 'All Stores' : st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* The Ledgerly Supermarket Table */}
              <div className="card-ledger">
                <div className="overflow-x-auto">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Supermarket Chain</th>
                        <th>Branches & Hubs</th>
                        <th>Plan & Tier</th>
                        <th>Status</th>
                        <th>SLA & Fleet</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-12 text-[#9297a8]">
                            No supermarkets match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredTenants.map((tenant) => {
                          const isSuspended = tenant.status === 'Suspended';
                          const isPending = tenant.status === 'Pending';

                          return (
                            <tr key={tenant.id} className="transition">
                              {/* Store Identity */}
                              <td>
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-xs flex-shrink-0"
                                    style={{ backgroundColor: tenant.themeColor || '#0e7c66' }}
                                  >
                                    {tenant.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-[#171b2e] flex items-center gap-1.5">
                                      <span>{tenant.name}</span>
                                      <span className="text-[11px] text-[#9297a8] font-normal font-mono">
                                        ({tenant.slug})
                                      </span>
                                    </div>
                                    <div className="text-[12px] text-[#5a6072]">
                                      {tenant.legalName || tenant.name} • {tenant.ownerEmail || 'admin@store.pk'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Hubs & City */}
                              <td>
                                <div className="text-xs font-medium text-[#171b2e] flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-[#0e7c66]" />
                                  <span>{tenant.city || 'Pakistan'}</span>
                                </div>
                                <div className="text-[11.5px] text-[#5a6072] mt-0.5">
                                  {(tenant.deliveryHubs && tenant.deliveryHubs.length) || 4} fulfillment branches
                                </div>
                              </td>

                              {/* Subscription & Commission */}
                              <td>
                                <div className="text-xs font-semibold text-[#171b2e]">
                                  {tenant.subscription?.plan || 'Pro'} Tier
                                </div>
                                <div className="text-[11.5px] text-[#5a6072] mt-0.5">
                                  Rs. {(tenant.subscription?.price || 25000).toLocaleString()}/mo • {tenant.subscription?.commissionRate || 5}% take
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td>
                                <span
                                  className={`badge-ledger ${
                                    tenant.status === 'Active'
                                      ? 'active'
                                      : isSuspended
                                      ? 'suspended'
                                      : 'pending'
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {tenant.status}
                                </span>
                              </td>

                              {/* SLA & Fleet */}
                              <td>
                                <div className="text-xs font-semibold text-[#171b2e]">
                                  {tenant.performance?.fulfillmentSla || '99.2%'} SLA
                                </div>
                                <div className="text-[11.5px] text-[#5a6072] mt-0.5 flex items-center gap-1">
                                  <Truck className="w-3 h-3 text-[#5a6072]" />
                                  <span>{tenant.performance?.activeRiders || 4} dedicated riders</span>
                                </div>
                              </td>

                              {/* Actions Dropdown / Links */}
                              <td className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleImpersonateTenant(tenant)}
                                    className="action-link-ledger text-[12px] font-semibold"
                                    title="Impersonate & manage store admin"
                                  >
                                    Manage Store →
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedTenant(tenant);
                                      setIsDetailsModalOpen(true);
                                    }}
                                    className="action-link-ledger text-[#5a6072] hover:text-[#171b2e]"
                                    title="View tenant profile details"
                                  >
                                    Details
                                  </button>

                                  <button
                                    onClick={() => handleOpenSubscription(tenant)}
                                    className="action-link-ledger text-[#5a6072] hover:text-[#171b2e]"
                                    title="Edit SaaS Subscription"
                                  >
                                    Plan
                                  </button>

                                  {/* Quick Suspend / Activate Toggle */}
                                  {isSuspended ? (
                                    <button
                                      onClick={() => activateTenant(tenant.id)}
                                      className="action-link-ledger text-[#0e7c66]"
                                      title="Resume operations"
                                    >
                                      Activate
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => suspendTenant(tenant.id)}
                                      className="action-link-ledger danger"
                                      title="Suspend store access"
                                    >
                                      Suspend
                                    </button>
                                  )}

                                  {/* Safe Delete */}
                                  <button
                                    onClick={() => {
                                      if (confirm(`Remove tenant "${tenant.name}" from platform?`)) {
                                        deleteTenant(tenant.id);
                                      }
                                    }}
                                    className="p-1 rounded text-[#9297a8] hover:text-[#dc4c3f] transition"
                                    title="Delete tenant"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Stats */}
                <div className="p-3 bg-[#fafbfc] border-t border-[#e6e8ef] text-xs text-[#5a6072] flex items-center justify-between px-4">
                  <span>Showing {filteredTenants.length} of {tenants.length} supermarkets</span>
                  <span>Ledgerly Multi-Tenant Operating Protocol</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTIONS CENTER */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              {/* Plan Tiers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => {
                  const assignedCount = tenants.filter((t) => (t.subscription?.plan || 'Starter') === planKey).length;
                  return (
                    <div key={planKey} className="card-ledger p-6 relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0e7c66]">
                          {planKey}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#f5f6f9] text-[#5a6072]">
                          {assignedCount} stores
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-[#171b2e]">
                        Rs. {plan.price.toLocaleString()}
                        <span className="text-xs font-normal text-[#5a6072]"> /month</span>
                      </div>
                      <div className="text-xs text-[#5a6072] mt-1">
                        Commission: <strong className="text-[#171b2e]">{plan.commissionRate}% per order</strong>
                      </div>

                      <ul className="mt-4 pt-4 border-t border-[#e6e8ef] space-y-2 text-xs text-[#5a6072]">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0e7c66] flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Subscriptions Ledger */}
              <div className="card-ledger">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Supermarket</th>
                      <th>Current Plan</th>
                      <th>Billing Cycle</th>
                      <th>Monthly Fee</th>
                      <th>Take Rate</th>
                      <th className="text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => (
                      <tr key={t.id}>
                        <td className="font-semibold text-[#171b2e]">{t.name}</td>
                        <td>
                          <span className="badge-ledger superadmin">
                            {t.subscription?.plan || 'Starter'}
                          </span>
                        </td>
                        <td className="text-xs text-[#5a6072] capitalize">{t.subscription?.billingCycle || 'monthly'}</td>
                        <td className="text-xs font-semibold text-[#171b2e]">
                          Rs. {(t.subscription?.price || 15000).toLocaleString()}
                        </td>
                        <td className="text-xs text-[#0e7c66] font-semibold">{t.subscription?.commissionRate || 5}%</td>
                        <td className="text-right">
                          <button
                            onClick={() => handleOpenSubscription(t)}
                            className="btn-ledger-ghost text-xs py-1 px-2.5"
                          >
                            Update Plan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CROSS-TENANT ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#5a6072] font-medium">Filter by Store:</span>
                  <select
                    value={selectedOrderTenant}
                    onChange={(e) => setSelectedOrderTenant(e.target.value)}
                    className="bg-white border border-[#e6e8ef] text-xs font-semibold text-[#171b2e] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#0e7c66]"
                  >
                    <option value="all">All Supermarkets (Global Stream)</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-[#5a6072]">
                  Total orders: <strong>{crossTenantOrders.length}</strong>
                </div>
              </div>

              <div className="card-ledger">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Supermarket</th>
                      <th>Customer & Address</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Handover OTP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossTenantOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-[#9297a8]">
                          No orders recorded for this supermarket yet.
                        </td>
                      </tr>
                    ) : (
                      crossTenantOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="font-mono text-xs font-semibold text-[#171b2e]">{o.id}</td>
                          <td className="text-xs font-medium text-[#171b2e]">{o.tenantName || 'FreshMart Direct'}</td>
                          <td className="text-xs text-[#5a6072]">
                            {o.customerName || 'Customer'} • {o.shippingAddress?.city || o.city || 'Lahore'}
                          </td>
                          <td className="text-xs font-bold text-[#171b2e]">
                            Rs. {(o.totalAmount || 0).toLocaleString()}
                          </td>
                          <td>
                            <span className={`badge-ledger ${
                              o.status === 'Delivered' ? 'active' : 'pending'
                            }`}>
                              {o.status || 'Processing'}
                            </span>
                          </td>
                          <td className="font-mono text-xs text-[#0e7c66] font-bold">
                            {o.deliveryOtp || '9999'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PLATFORM PERFORMANCE & GMV */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {tenants.map((t) => {
                  const perf = t.performance || {};
                  return (
                    <div key={t.id} className="card-ledger p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#e6e8ef] pb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: t.themeColor || '#0e7c66' }}
                          />
                          <span className="font-bold text-[#171b2e] text-sm">{t.name}</span>
                        </div>
                        <span className="badge-ledger active">{t.status}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-2.5 bg-[#fafbfc] rounded-lg border border-[#e6e8ef]">
                          <div className="text-[10px] text-[#9297a8] uppercase font-bold">Store GMV</div>
                          <div className="text-sm font-bold text-[#171b2e] mt-1">
                            Rs. {(perf.gmv || 450000).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-2.5 bg-[#fafbfc] rounded-lg border border-[#e6e8ef]">
                          <div className="text-[10px] text-[#9297a8] uppercase font-bold">Orders</div>
                          <div className="text-sm font-bold text-[#171b2e] mt-1">
                            {perf.totalOrders || 42}
                          </div>
                        </div>
                        <div className="p-2.5 bg-[#fafbfc] rounded-lg border border-[#e6e8ef]">
                          <div className="text-[10px] text-[#9297a8] uppercase font-bold">SLA Rating</div>
                          <div className="text-sm font-bold text-[#0e7c66] mt-1">
                            {perf.fulfillmentSla || '99.2%'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs text-[#5a6072]">
                        <span>Commission take: <strong>{t.subscription?.commissionRate || 5}%</strong></span>
                        <button
                          onClick={() => handleImpersonateTenant(t)}
                          className="action-link-ledger"
                        >
                          View Full Store Telematics →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL: ONBOARD SUPERMARKET TENANT --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#e6e8ef] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#e6e8ef]">
              <div>
                <h2 className="text-base font-bold text-[#171b2e]">Onboard Supermarket Chain</h2>
                <p className="text-xs text-[#5a6072]">Register a new supermarket tenant into the platform registry</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-[#9297a8] hover:text-[#171b2e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5a6072] uppercase mb-1">
                    Store Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Imtiaz Super Market"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-[#e6e8ef] rounded-lg focus:outline-none focus:border-[#0e7c66]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#5a6072] uppercase mb-1">
                    Slug ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. imtiaz"
                    value={addForm.slug}
                    onChange={(e) => setAddForm({ ...addForm, slug: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-[#e6e8ef] rounded-lg focus:outline-none focus:border-[#0e7c66]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5a6072] uppercase mb-1">
                    Owner / Executive Name
                  </label>
                  <input
                    type="text"
                    placeholder="Store Manager Name"
                    value={addForm.ownerName}
                    onChange={(e) => setAddForm({ ...addForm, ownerName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-[#e6e8ef] rounded-lg focus:outline-none focus:border-[#0e7c66]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#5a6072] uppercase mb-1">
                    Owner Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@imtiaz.pk"
                    value={addForm.ownerEmail}
                    onChange={(e) => setAddForm({ ...addForm, ownerEmail: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-[#e6e8ef] rounded-lg focus:outline-none focus:border-[#0e7c66]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5a6072] uppercase mb-1">
                    Primary City
                  </label>
                  <input
                    type="text"
                    placeholder="Lahore, Pakistan"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-[#e6e8ef] rounded-lg focus:outline-none focus:border-[#0e7c66]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#5a6072] uppercase mb-1">
                    SaaS Tier
                  </label>
                  <select
                    value={addForm.plan}
                    onChange={(e) => setAddForm({ ...addForm, plan: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-[#e6e8ef] rounded-lg focus:outline-none focus:border-[#0e7c66]"
                  >
                    <option value="Starter">Starter (Rs. 15,000/mo)</option>
                    <option value="Pro">Pro (Rs. 25,000/mo)</option>
                    <option value="Enterprise">Enterprise (Rs. 50,000/mo)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e6e8ef]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-ledger-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-ledger-primary text-xs"
                >
                  Onboard Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: INVITE TENANT --- */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#e6e8ef] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#e6e8ef]">
              <div>
                <h2 className="text-base font-bold text-[#171b2e]">Invite Supermarket</h2>
                <p className="text-xs text-[#5a6072]">Generate a secure registration invitation</p>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-md text-[#9297a8] hover:text-[#171b2e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#5a6072] uppercase mb-1">
                  Supermarket Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Cash & Carry"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-[#e6e8ef] rounded-lg focus:outline-none focus:border-[#0e7c66]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5a6072] uppercase mb-1">
                  Executive / Owner Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="executive@store.pk"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-[#e6e8ef] rounded-lg focus:outline-none focus:border-[#0e7c66]"
                />
              </div>

              {generatedInviteLink && (
                <div className="p-3 bg-[#dff3ee] border border-[#0e7c66]/30 rounded-lg">
                  <div className="text-[11px] font-bold text-[#0a5d4c] uppercase">Invitation Link Generated:</div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <input
                      readOnly
                      value={generatedInviteLink}
                      className="bg-white border border-[#0e7c66]/30 px-2 py-1 text-xs rounded text-[#171b2e] w-full font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedInviteLink)}
                      className="p-1.5 rounded bg-[#0e7c66] text-white flex-shrink-0"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e6e8ef]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="btn-ledger-ghost text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn-ledger-primary text-xs"
                >
                  Generate Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT SUBSCRIPTION --- */}
      {isSubModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#e6e8ef] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#e6e8ef]">
              <div>
                <h2 className="text-base font-bold text-[#171b2e]">
                  Manage Subscription: {selectedTenant.name}
                </h2>
                <p className="text-xs text-[#5a6072]">Configure plan tier and SaaS renewal</p>
              </div>
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="p-1 rounded-md text-[#9297a8] hover:text-[#171b2e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubscription} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#5a6072] uppercase mb-1">
                  Plan Tier
                </label>
                <select
                  value={subForm.plan}
                  onChange={(e) => {
                    const p = e.target.value;
                    setSubForm({
                      ...subForm,
                      plan: p,
                      price: SUBSCRIPTION_PLANS[p]?.price || 15000
                    });
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-[#e6e8ef] rounded-lg focus:outline-none focus:border-[#0e7c66]"
                >
                  <option value="Starter">Starter (Rs. 15,000/mo)</option>
                  <option value="Pro">Pro (Rs. 25,000/mo)</option>
                  <option value="Enterprise">Enterprise (Rs. 50,000/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5a6072] uppercase mb-1">
                  Custom Monthly Price (PKR)
                </label>
                <input
                  type="number"
                  value={subForm.price}
                  onChange={(e) => setSubForm({ ...subForm, price: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-[#e6e8ef] rounded-lg focus:outline-none focus:border-[#0e7c66]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e6e8ef]">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="btn-ledger-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-ledger-primary text-xs"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: TENANT DETAILS --- */}
      {isDetailsModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#e6e8ef] animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6e8ef]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: selectedTenant.themeColor || '#0e7c66' }}
                >
                  {selectedTenant.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#171b2e]">{selectedTenant.name}</h3>
                  <p className="text-[11px] text-[#5a6072]">{selectedTenant.legalName || selectedTenant.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1 rounded-md text-[#9297a8] hover:text-[#171b2e]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#fafbfc] rounded-lg border border-[#e6e8ef]">
                <div className="text-[#9297a8] text-[10px] uppercase font-bold">Owner Email</div>
                <div className="font-semibold text-[#171b2e] mt-0.5">{selectedTenant.ownerEmail || 'N/A'}</div>
              </div>
              <div className="p-3 bg-[#fafbfc] rounded-lg border border-[#e6e8ef]">
                <div className="text-[#9297a8] text-[10px] uppercase font-bold">Primary City</div>
                <div className="font-semibold text-[#171b2e] mt-0.5">{selectedTenant.city || 'Pakistan'}</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-[#171b2e] mb-1.5">Fulfillment Branches:</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {(selectedTenant.deliveryHubs || []).map((h, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-[#fafbfc] border border-[#e6e8ef] flex items-center justify-between">
                    <span>{h.name}</span>
                    <span className="text-[11px] text-[#5a6072]">{h.city}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#e6e8ef]">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="btn-ledger-ghost text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
