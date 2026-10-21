import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Boxes,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  ExternalLink,
  Store,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sparkles,
  CheckCircle2,
  Truck,
  MapPin
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { isSameTenant, resolveTenantId } from '../../data/companyHierarchyData';
import { sanitizeOrder } from '../../utils/orderSanitizer';

// 11 Views
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { CategoriesView } from './views/CategoriesView';
import { OrdersView } from './views/OrdersView';
import { CustomersView } from './views/CustomersView';
import { InventoryView } from './views/InventoryView';
import { PromotionsView } from './views/PromotionsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { FulfillmentView } from './views/FulfillmentView';
import { PickupStaffPortal } from './views/PickupStaffPortal';
import { DeliveryView } from './views/DeliveryView';

import { AdminModals } from './modals/AdminModals';
import { AdminLogin } from './AdminLogin';
import { VendorPortal } from '../VendorPortal/VendorPortal';
import { SuperAdminDashboard } from '../SuperAdmin/SuperAdminDashboard';
import { DeliveryPortal } from '../DeliveryPortal/DeliveryPortal';

export const AdminDashboard = () => {
  const { isAdminLoggedIn, adminRole } = useStore();

  // If not logged in as Admin, show the Admin Login with Username/Password
  if (!isAdminLoggedIn) {
    return <AdminLogin />;
  }

  // If logged in as Super Admin (Platform Owner), render Super Admin Command Center
  if (adminRole === 'superadmin') {
    return <SuperAdminDashboard />;
  }

  // If logged in as Supplier or Vendor, render the dedicated Multi-Vendor Portal
  if (adminRole === 'supplier' || adminRole === 'vendor') {
    return <VendorPortal />;
  }

  if (adminRole === 'pickup_staff') return <PickupStaffPortal />;
  if (adminRole === 'rider') return <DeliveryPortal />;

  return <StoreAdminConsole />;
};

const StoreAdminConsole = () => {
  const {
    navigateTo,
    adminLogout,
    adminRole,
    user,
    products,
    customerOrders,
    adminOrders = [],
    customers,
    currentTenant,
    setCurrentTenant,
    tenants = [],
    allBranches = [],
    currentBranchFilter = 'all',
    setCurrentBranchFilter
  } = useStore();

  const allTenants = tenants;

  const tenantBranches = useMemo(() => {
    const activeTenant = user?.tenantId || currentTenant?.id;
    return (allBranches || []).filter((b) => isSameTenant(b.tenantId, activeTenant));
  }, [allBranches, currentTenant?.id, user?.tenantId]);
  
  // Set initial activeTab
  const [activeTab, setActiveTab] = useState('Dashboard');

  const [headerSearch, setHeaderSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modal visibility states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isCreatePromoOpen, setIsCreatePromoOpen] = useState(false);

  useEffect(() => {
    setActiveTab(adminRole === 'rider' ? 'Rider' : 'Dashboard');
  }, [adminRole]);

  const roleMeta = {
    admin: { title: 'Store Admin', badge: '🛡️ Store Admin', tag: 'Full Control', iconBg: 'bg-emerald-600' },
    supplier: { title: 'Supplier Partner', badge: '📦 Supplier Portal', tag: 'Supply & Invoices', iconBg: 'bg-indigo-600' }
  };

  const currentRoleInfo = adminRole === 'rider'
    ? { title: 'Rider', badge: 'Rider', tag: 'Delivery Operations', iconBg: 'bg-rose-600' }
    : roleMeta[adminRole] || roleMeta.admin;

  const activeTenantId = user?.tenantId || currentTenant?.id || 'tenant-alfatah';

  // Track locally completed delivered orders to ensure synced badge counts
  const deliveredOrderIds = useMemo(() => {
    try {
      const raw = localStorage.getItem('freshmart_rider_delivered_orders');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return new Set(parsed.map((id) => String(id).replace(/^#/, '').trim().toLowerCase()));
        }
      }
    } catch (e) {}
    return new Set();
  }, [customerOrders, adminOrders]);

  // Unified tenant orders deduplicated by bare ID, prioritizing Delivered status
  const unifiedTenantOrders = useMemo(() => {
    const combined = [...(customerOrders || []), ...(adminOrders || [])].map(sanitizeOrder);
    const map = new Map();
    combined.forEach((o) => {
      if (!o) return;
      const bare = String(o.id || o.orderId || o._id || '').replace(/^#/, '').trim().toLowerCase();
      if (!bare) return;
      const orderTenant =
        o.tenantId ||
        o.companyId ||
        o.tenantName ||
        o.items?.[0]?.tenantId ||
        o.rawItems?.[0]?.tenantId;

      const rawItemList = Array.isArray(o.rawItems)
        ? o.rawItems
        : Array.isArray(o.orderItems)
        ? o.orderItems
        : Array.isArray(o.items)
        ? o.items
        : [];

      const hasCaseValue = rawItemList.some((it) => {
        const n = String(it?.name || it?.productName || '').toLowerCase();
        const b = String(it?.brand || '').toLowerCase();
        return n.includes('chase value') || n.includes('case value') || b.includes('chase value') || b.includes('case value') || isSameTenant(it?.tenantId, 'tenant-chasevalue');
      });
      if (hasCaseValue && isSameTenant(activeTenantId, 'tenant-chasevalue')) {
        // belongs to Case Value
      } else if (hasCaseValue && !isSameTenant(activeTenantId, 'tenant-chasevalue')) {
        return;
      }

      const hasChaseUp = rawItemList.some((it) => {
        const n = String(it?.name || it?.productName || '').toLowerCase();
        const b = String(it?.brand || '').toLowerCase();
        return n.includes('chase up') || n.includes('case up') || n.includes('caseup') || b.includes('chase up') || b.includes('case up') || b.includes('caseup') || isSameTenant(it?.tenantId, 'tenant-chaseup');
      });
      if (hasChaseUp && isSameTenant(activeTenantId, 'tenant-chaseup')) {
        // belongs to Chase Up
      } else if (hasChaseUp && !isSameTenant(activeTenantId, 'tenant-chaseup')) {
        return;
      }

      if (bare.startsWith('cu') || bare.startsWith('ord-cu') || bare.includes('-cu-') || bare.includes('caseup')) {
        if (!isSameTenant('tenant-chaseup', activeTenantId)) return;
      }
      if (bare.startsWith('cv') || bare.startsWith('ord-cv') || bare.includes('-cv-')) {
        if (!isSameTenant('tenant-chasevalue', activeTenantId)) return;
      }

      if (activeTenantId) {
        if (!orderTenant) {
          const id = bare;
          if (id.includes('701') || id.includes('af')) {
            if (!isSameTenant('tenant-alfatah', activeTenantId)) return;
          } else if (id.includes('fm') || id.includes('83459')) {
            if (!isSameTenant('tenant-freshmart', activeTenantId)) return;
          } else if (id.includes('cv')) {
            if (!isSameTenant('tenant-chasevalue', activeTenantId)) return;
          } else if (id.includes('cu') || id.includes('caseup')) {
            if (!isSameTenant('tenant-chaseup', activeTenantId)) return;
          } else {
            return;
          }
        } else if (!isSameTenant(orderTenant, activeTenantId)) {
          return;
        }
      }

      const isDelivered =
        o.status === 'Delivered' ||
        o.status === 'Completed' ||
        o.isDelivered === true ||
        Number(o.fulfillmentStage) >= 4 ||
        deliveredOrderIds.has(bare);

      const existing = map.get(bare);
      if (!existing || isDelivered) {
        map.set(bare, { ...o, isDelivered, status: isDelivered ? 'Delivered' : o.status });
      }
    });
    return Array.from(map.values());
  }, [customerOrders, adminOrders, activeTenantId, deliveredOrderIds]);

  // Pending active orders count for Orders badge (only non-delivered, active orders)
  const pendingOrdersCount = useMemo(() => {
    return unifiedTenantOrders.filter((o) => {
      if (o.isDelivered || o.status === 'Delivered' || o.status === 'Completed' || o.status === 'Cancelled') return false;
      const s = String(o.status || '').toLowerCase();
      return [
        'pending',
        'processing',
        'confirmed',
        'deliver to staff',
        'preparing',
        'picking',
        'packed',
        'ready',
        'ready for dispatch',
        'dispatched',
        'out for delivery'
      ].includes(s);
    }).length;
  }, [unifiedTenantOrders]);

  // Pending pickup staff orders count (only orders awaiting staff packing)
  const pendingPickupStaffCount = useMemo(() => {
    return unifiedTenantOrders.filter((o) => {
      if (o.isDelivered || o.status === 'Delivered' || o.status === 'Completed' || o.status === 'Cancelled') return false;
      const s = String(o.status || '').toLowerCase();
      return (
        ['pending', 'deliver to staff', 'preparing', 'picking'].includes(s) ||
        o.pickupStep === 'assigned' ||
        o.pickupStep === 'picking'
      );
    }).length;
  }, [unifiedTenantOrders]);

  const lowStockCount = (products || []).filter(
    (p) => Number(p.stock !== undefined ? p.stock : (p.stockCount || 0)) < 15
  ).length;

  const totalProductsCount = (products || []).length;

  const getNavItems = () => {
    if (adminRole === 'rider') {
      return [
        { label: 'Rider', icon: Truck, customName: 'Rider Dispatch & Deliveries', badge: pendingOrdersCount || null, badgeColor: 'bg-amber-500/20 text-amber-300' },
        { label: 'Settings', icon: Settings, customName: 'Account Settings' }
      ];
    }
    if (adminRole === 'supplier') {
      return [
        { label: 'Inventory', icon: Boxes, customName: 'Stock & Restock', badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: 'bg-rose-500/20 text-rose-300' },
        { label: 'Products', icon: Package, customName: 'Supplied Products', badge: totalProductsCount > 0 ? totalProductsCount : null, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
        { label: 'Orders', icon: ShoppingBag, customName: 'Wholesale Orders', badge: pendingOrdersCount > 0 ? pendingOrdersCount : null, badgeColor: 'bg-amber-500/20 text-amber-300' },
        { label: 'Settings', icon: Settings, customName: 'Account Settings' }
      ];
    }
    return [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Products', icon: Package, badge: totalProductsCount > 0 ? totalProductsCount : null, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
      { label: 'Categories', icon: Layers },
      { label: 'Orders', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null, badgeColor: 'bg-amber-500/20 text-amber-300' },
      { label: 'Pickup Staff', icon: Boxes, badge: pendingPickupStaffCount > 0 ? pendingPickupStaffCount : null, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
      { label: 'Riders', icon: Truck, customName: 'Rider Fleet & Assignments' },
      { label: 'Customers', icon: Users },
      { label: 'Inventory', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: 'bg-rose-500/20 text-rose-300' },
      { label: 'Promotions', icon: Tag },
      { label: 'Reports', icon: BarChart3 },
      { label: 'Settings', icon: Settings }
    ];
  };

  const adminNavItems = getNavItems();

  const handleSelectNav = (label) => {
    setActiveTab(label);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen w-full bg-[#f8fafc] flex flex-col font-sans text-slate-800 antialiased overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden w-full">
      {/* 📱 Mobile Top Header Bar (< lg screens) */}
      <div className="lg:hidden bg-[#0f172a] text-slate-200 px-4 py-3.5 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div onClick={() => navigateTo('home')} className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-black text-base shadow-xs">
            {currentTenant?.logo || '🏬'}
          </div>
          <div>
            <h2 className="text-sm font-black text-white leading-none">{currentTenant?.name || 'Store Admin'}</h2>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-0.5">
              {currentRoleInfo.badge}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
            {activeTab}
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 📱 Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] bg-[#0b132b] text-slate-300 flex flex-col h-full shadow-2xl border-r border-slate-800 overflow-hidden animate-in slide-in-from-left duration-200">
            {/* Brand in Mobile Drawer (Pinned Top) */}
            <div className="p-4 border-b border-slate-800 shrink-0 bg-[#0f172a] flex items-center justify-between">
              <div onClick={() => { navigateTo('home'); setIsMobileMenuOpen(false); }} className="flex items-center gap-2.5 cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg shadow-md">
                  {currentTenant?.logo || '🏬'}
                </div>
                <div>
                  <h2 className="text-base font-black text-white leading-none">{currentTenant?.displayName || currentTenant?.name || 'Store Admin'}</h2>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-1">
                    {currentRoleInfo.badge}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links (Independent Scroll) */}
            <nav className="flex-1 overflow-y-auto min-h-0 py-3 px-3 space-y-1 sidebar-scrollbar">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.label;

                return (
                  <button
                    key={item.label}
                    onClick={() => handleSelectNav(item.label)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.customName || item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Footer Links (Pinned Bottom) */}
            <div className="p-4 border-t border-slate-800 shrink-0 bg-[#0f172a] space-y-2 mt-auto">
              <button
                onClick={() => { navigateTo('home'); setIsMobileMenuOpen(false); }}
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
                <span>Sign Out ({currentRoleInfo.title})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💻 1. Desktop Left Dark Sidebar (Fixed 100% full height, never scrolls with content) */}
      <aside
        className={`hidden lg:flex flex-col ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } bg-[#0b132b] text-slate-300 h-full shrink-0 border-r border-slate-800/80 transition-all duration-300 z-40 overflow-hidden shadow-xl select-none`}
      >
        {/* Brand & Collapse Toggle (Pinned Top) */}
        <div className="p-4 border-b border-slate-800/80 shrink-0 bg-[#0f172a]/80">
          <div className="flex items-center justify-between gap-2">
            <div
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2.5 cursor-pointer group min-w-0"
              title="Return to Customer Storefront"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg shadow-sm group-hover:scale-105 transition-transform shrink-0">
                {currentTenant?.logo || '🏬'}
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1 truncate">
                  <h2 className="text-sm font-black text-white leading-tight truncate">
                    {currentTenant?.displayName || currentTenant?.name || 'Store Admin'}
                  </h2>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block truncate mt-0.5">
                    {currentRoleInfo.title}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse / Expand Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nav Items Area (Independent smooth scrolling container) */}
        <nav className="flex-1 overflow-y-auto min-h-0 py-3 px-2.5 space-y-1 sidebar-scrollbar">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.label;

            return (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                title={isSidebarCollapsed ? item.customName || item.label : undefined}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                } rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group relative ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                  {!isSidebarCollapsed && (
                    <span className="truncate">{item.customName || item.label}</span>
                  )}
                </div>

                {!isSidebarCollapsed && item.badge && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}

                {isSidebarCollapsed && item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0b132b]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Footer Actions: Storefront & Sign Out (Pinned Bottom) */}
        <div className="p-3 border-t border-slate-800/80 shrink-0 bg-[#0f172a]/90 space-y-1.5 mt-auto">
          <button
            onClick={() => navigateTo('home')}
            title="Back to Customer Storefront"
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
            } rounded-xl text-xs font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800/40 transition-colors cursor-pointer`}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Store className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Customer Store</span>}
            </span>
            {!isSidebarCollapsed && <ExternalLink className="w-3.5 h-3.5 shrink-0 text-emerald-400/80" />}
          </button>
          
          <button
            onClick={adminLogout}
            title={`Sign Out (${currentRoleInfo.title})`}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
            } rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. Main Workspace (Dedicated scrollable container) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs shrink-0">
          
          {/* Header Search Bar */}
          <div className="relative max-w-md w-full hidden sm:block">
            <input
              type="text"
              placeholder="Search anything in admin suite..."
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Supermarket Branch Switcher Dropdown */}
            {allTenants && allTenants.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl px-2.5 py-1.5 transition-colors">
                <Store className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 hidden xl:inline">Store:</span>
                {adminRole === 'superadmin' || !user?.tenantId ? (
                  <select
                    value={activeTenantId || currentTenant?.id || 'tenant-alfatah'}
                    onChange={(e) => {
                      const found = allTenants.find((t) => t.id === e.target.value);
                      if (found) {
                        setCurrentTenant(found);
                        setCurrentBranchFilter('all');
                      }
                    }}
                    className="text-xs font-black text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
                  >
                    {allTenants.map((t) => (
                      <option key={t.id} value={t.id} className="text-slate-900 bg-white font-bold">
                        {t.logo || '🏬'} {t.displayName || t.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                    <span>
                      {(allTenants.find((t) => isSameTenant(t.id, activeTenantId)) || currentTenant)?.logo || '🏬'}
                    </span>
                    <span>
                      {(allTenants.find((t) => isSameTenant(t.id, activeTenantId)) || currentTenant)?.displayName ||
                       (allTenants.find((t) => isSameTenant(t.id, activeTenantId)) || currentTenant)?.name ||
                       user?.tenantName ||
                       'Store'}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                      Active
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Branch Scope / Branch Switcher */}
            {user?.branchId ? (
              <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl px-2.5 py-1.5 text-xs font-bold shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-none">{user.branchName || 'Branch Scoped'}</span>
              </div>
            ) : tenantBranches.length > 0 ? (
              <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl px-2.5 py-1.5 transition-colors">
                <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 hidden xl:inline">Branch:</span>
                <select
                  value={currentBranchFilter}
                  onChange={(e) => setCurrentBranchFilter(e.target.value)}
                  className="text-xs font-black text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
                >
                  <option value="all" className="text-slate-900 bg-white font-bold">All Branches</option>
                  {tenantBranches.map((b) => (
                    <option key={b._id || b.id} value={b._id || b.id} className="text-slate-900 bg-white font-bold">
                      📍 {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Direct Multi-Tab Portal Launchers */}
            <button
              type="button"
              onClick={() => window.open('/?portal=pickup-staff', '_blank')}
              className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1.5 rounded-xl transition-colors hidden lg:flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Open Pickup Staff (Packing Station) in a new independent tab"
            >
              <Boxes className="w-3.5 h-3.5 text-amber-600" />
              <span>Pickup Staff</span>
              <ExternalLink className="w-3 h-3 text-amber-500" />
            </button>

            <button
              type="button"
              onClick={() => window.open('/?portal=rider', '_blank')}
              className="text-xs font-bold text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 px-2.5 py-1.5 rounded-xl transition-colors hidden lg:flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Open Rider (Courier Delivery) in a new independent tab"
            >
              <Truck className="w-3.5 h-3.5 text-orange-600" />
              <span>Rider Portal</span>
              <ExternalLink className="w-3 h-3 text-orange-500" />
            </button>

            {/* Quick Switch to Storefront */}
            <button
              onClick={() => navigateTo('home')}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors hidden md:flex items-center gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Customer Store</span>
            </button>

            {/* Role Badge in Header */}
            <span className="text-[11px] font-black px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg">
              {currentRoleInfo.badge}
            </span>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('Orders')}
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title={`${pendingOrdersCount} pending orders`}
            >
              <Bell className="w-5 h-5" />
              {pendingOrdersCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </button>

            {/* Admin Avatar */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className={`w-9 h-9 rounded-full ${currentRoleInfo.iconBg} text-white font-black flex items-center justify-center text-xs shadow-xs`}>
                {adminRole.slice(0, 1).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-900 block leading-tight">{currentRoleInfo.title}</span>
                <span className="text-[10px] text-emerald-600 block font-bold">{currentRoleInfo.tag}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View Content according to Active Tab */}
        <main className="p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'Dashboard' && (
            <DashboardView onNavigateModule={(mod) => setActiveTab(mod)} />
          )}
          {activeTab === 'Products' && (
            <ProductsView onOpenAddProductModal={() => setIsAddProductOpen(true)} />
          )}
          {activeTab === 'Categories' && (
            <CategoriesView onOpenAddCategoryModal={() => setIsAddCategoryOpen(true)} />
          )}
          {activeTab === 'Orders' && (
            <OrdersView onNavigateToCustomers={() => setActiveTab('Customers')} />
          )}
          {activeTab === 'Pickup Staff' && <FulfillmentView />}
          {activeTab === 'Rider' && <DeliveryView />}
          {activeTab === 'Riders' && <DeliveryView />}
          {activeTab === 'Customers' && (
            <CustomersView onOpenAddCustomerModal={() => setIsAddCustomerOpen(true)} />
          )}
          {activeTab === 'Inventory' && <InventoryView />}
          {activeTab === 'Promotions' && (
            <PromotionsView onOpenCreatePromotionModal={() => setIsCreatePromoOpen(true)} />
          )}
          {activeTab === 'Reports' && <ReportsView />}
          {activeTab === 'Settings' && <SettingsView />}
        </main>

      </div>
      </div>

      {/* Global Admin Modals */}
      <AdminModals
        isAddProductOpen={isAddProductOpen}
        setIsAddProductOpen={setIsAddProductOpen}
        isAddCategoryOpen={isAddCategoryOpen}
        setIsAddCategoryOpen={setIsAddCategoryOpen}
        isAddCustomerOpen={isAddCustomerOpen}
        setIsAddCustomerOpen={setIsAddCustomerOpen}
        isAddSupplierOpen={isAddSupplierOpen}
        setIsAddSupplierOpen={setIsAddSupplierOpen}
        isCreatePromoOpen={isCreatePromoOpen}
        setIsCreatePromoOpen={setIsCreatePromoOpen}
      />
    </div>
  );
};
