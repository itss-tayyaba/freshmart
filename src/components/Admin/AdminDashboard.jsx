import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Boxes,
  Truck,
  Tag,
  BarChart3,
  Settings,
  Building2,
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
  CheckCircle2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

// 11 Views
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { CategoriesView } from './views/CategoriesView';
import { OrdersView } from './views/OrdersView';
import { CustomersView } from './views/CustomersView';
import { InventoryView } from './views/InventoryView';
import { SuppliersView } from './views/SuppliersView';
import { PromotionsView } from './views/PromotionsView';
import { DeliveryView } from './views/DeliveryView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

import { AdminModals } from './modals/AdminModals';
import { AdminLogin } from './AdminLogin';
import { VendorPortal } from '../VendorPortal/VendorPortal';

export const AdminDashboard = () => {
  const { navigateTo, isAdminLoggedIn, adminLogout, adminRole, user, products, customerOrders, customers } = useStore();
  
  // Set initial activeTab based on logged-in role
  const [activeTab, setActiveTab] = useState(() => {
    if (adminRole === 'rider') return 'Delivery';
    return 'Dashboard';
  });

  const [headerSearch, setHeaderSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modal visibility states (Must be declared before any conditional return!)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isCreatePromoOpen, setIsCreatePromoOpen] = useState(false);

  useEffect(() => {
    if (adminRole === 'rider') {
      setActiveTab('Delivery');
    } else {
      setActiveTab('Dashboard');
    }
  }, [adminRole]);

  // If not logged in as Admin, show the Admin Login with Username/Password
  if (!isAdminLoggedIn) {
    return <AdminLogin />;
  }

  // If logged in as Supplier or Vendor, render the dedicated Multi-Vendor Portal
  if (adminRole === 'supplier' || adminRole === 'vendor') {
    return <VendorPortal />;
  }

  const roleMeta = {
    admin: { title: 'Store Admin', badge: '🛡️ Store Admin', tag: 'Full Control', iconBg: 'bg-emerald-600' },
    supplier: { title: 'Supplier Partner', badge: '📦 Supplier Portal', tag: 'Supply & Invoices', iconBg: 'bg-indigo-600' },
    rider: { title: 'Delivery Fleet', badge: '🛵 Delivery Dispatch', tag: 'Rider Operations', iconBg: 'bg-rose-600' }
  };

  const currentRoleInfo = roleMeta[adminRole] || roleMeta.admin;

  const pendingOrdersCount = (customerOrders || []).filter(
    (o) => o.status === 'Processing' || o.status === 'Pending' || o.status === 'Packed'
  ).length;

  const lowStockCount = (products || []).filter(
    (p) => Number(p.stock !== undefined ? p.stock : (p.stockCount || 0)) < 15
  ).length;

  const totalProductsCount = (products || []).length;

  const getNavItems = () => {
    if (adminRole === 'supplier') {
      return [
        { label: 'Suppliers', icon: Building2, customName: 'Supplier Hub & Invoices' },
        { label: 'Inventory', icon: Boxes, customName: 'Stock & Restock', badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: 'bg-rose-500/20 text-rose-300' },
        { label: 'Products', icon: Package, customName: 'Supplied Products', badge: totalProductsCount > 0 ? totalProductsCount : null, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
        { label: 'Orders', icon: ShoppingBag, customName: 'Wholesale Orders', badge: pendingOrdersCount > 0 ? pendingOrdersCount : null, badgeColor: 'bg-amber-500/20 text-amber-300' },
        { label: 'Settings', icon: Settings, customName: 'Account Settings' }
      ];
    }
    if (adminRole === 'rider') {
      return [
        { label: 'Delivery', icon: Truck, customName: 'Delivery Dispatch & GPS' },
        { label: 'Orders', icon: ShoppingBag, customName: 'Assigned Parcels', badge: pendingOrdersCount > 0 ? pendingOrdersCount : null, badgeColor: 'bg-amber-500/20 text-amber-300' },
        { label: 'Settings', icon: Settings, customName: 'Rider Settings' }
      ];
    }
    return [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Products', icon: Package, badge: totalProductsCount > 0 ? totalProductsCount : null, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
      { label: 'Categories', icon: Layers },
      { label: 'Orders', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null, badgeColor: 'bg-amber-500/20 text-amber-300' },
      { label: 'Customers', icon: Users },
      { label: 'Inventory', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: 'bg-rose-500/20 text-rose-300' },
      { label: 'Suppliers', icon: Building2 },
      { label: 'Promotions', icon: Tag },
      { label: 'Delivery', icon: Truck },
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-sans text-slate-800 antialiased">
      
      {/* 📱 Mobile Top Header Bar (< lg screens) */}
      <div className="lg:hidden bg-[#0f172a] text-slate-200 px-4 py-3.5 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div onClick={() => navigateTo('home')} className="flex items-center gap-2.5 cursor-pointer">
          <div className={`w-8 h-8 rounded-xl ${currentRoleInfo.iconBg} flex items-center justify-center text-white font-black text-base shadow-xs`}>
            🛒
          </div>
          <div>
            <h2 className="text-sm font-black text-white leading-none">FreshMart</h2>
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
          <div className="relative z-10 w-72 max-w-[85vw] bg-[#0f172a] text-slate-300 p-5 flex flex-col justify-between h-full shadow-2xl border-r border-slate-800 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div>
              {/* Brand in Mobile Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div onClick={() => { navigateTo('home'); setIsMobileMenuOpen(false); }} className="flex items-center gap-2.5 cursor-pointer">
                  <div className={`w-9 h-9 rounded-xl ${currentRoleInfo.iconBg} flex items-center justify-center text-white font-black text-lg shadow-md`}>
                    🛒
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white leading-none">FreshMart</h2>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-1">
                      {currentRoleInfo.badge}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav Links */}
              <nav className="mt-4 space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.label;

                  return (
                    <button
                      key={item.label}
                      onClick={() => handleSelectNav(item.label)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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
            </div>

            {/* Mobile Footer Links */}
            <div className="pt-5 border-t border-slate-800 space-y-2 mt-4">
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

      {/* 💻 1. Desktop Left Dark Sticky Sidebar */}
      <aside
        className={`hidden lg:flex flex-col justify-between ${
          isSidebarCollapsed ? 'w-20 p-3.5' : 'w-64 p-5'
        } bg-[#0f172a] text-slate-300 h-screen sticky top-0 border-r border-slate-800 transition-all duration-300 shrink-0 z-40 overflow-y-auto`}
      >
        <div>
          {/* Brand & Collapse Toggle */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2.5 cursor-pointer group min-w-0"
            >
              <div className={`w-9 h-9 rounded-xl ${currentRoleInfo.iconBg} flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform shrink-0`}>
                🛒
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate animate-in fade-in duration-200">
                  <h2 className="text-base font-black text-white leading-none truncate">FreshMart</h2>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-1 truncate">
                    {currentRoleInfo.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse / Expand Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer ml-auto"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Items */}
          <nav className="mt-5 space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;

              return (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.label)}
                  title={isSidebarCollapsed ? item.customName || item.label : undefined}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'
                  } rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group relative ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400 transition-colors'}`} />
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
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0f172a]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Footer Actions: Storefront & Sign Out */}
        <div className="pt-5 border-t border-slate-800 space-y-2 mt-6">
          <button
            onClick={() => navigateTo('home')}
            title="Back to Customer Storefront"
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'
            } rounded-xl text-xs font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/40 transition-colors cursor-pointer`}
          >
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Customer Store</span>}
            </span>
            {!isSidebarCollapsed && <ExternalLink className="w-3.5 h-3.5 shrink-0" />}
          </button>
          
          <button
            onClick={adminLogout}
            title={`Sign Out (${currentRoleInfo.title})`}
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2'
            } rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          
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

          <div className="flex items-center gap-4 ml-auto">
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
          {activeTab === 'Customers' && (
            <CustomersView onOpenAddCustomerModal={() => setIsAddCustomerOpen(true)} />
          )}
          {activeTab === 'Inventory' && <InventoryView />}
          {activeTab === 'Suppliers' && (
            <SuppliersView onOpenAddSupplierModal={() => setIsAddSupplierOpen(true)} />
          )}
          {activeTab === 'Promotions' && (
            <PromotionsView onOpenCreatePromotionModal={() => setIsCreatePromoOpen(true)} />
          )}
          {activeTab === 'Delivery' && <DeliveryView />}
          {activeTab === 'Reports' && <ReportsView />}
          {activeTab === 'Settings' && <SettingsView />}
        </main>

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
