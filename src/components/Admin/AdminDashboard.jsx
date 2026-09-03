import React, { useState } from 'react';
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
  UserCheck,
  LogOut,
  Bell,
  Search,
  ExternalLink,
  Store
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

// Modals
import { AdminModals } from './modals/AdminModals';
import { AdminLogin } from './AdminLogin';

export const AdminDashboard = () => {
  const { navigateTo, isAdminLoggedIn, adminLogout, adminRole, user } = useStore();
  
  // Set initial activeTab based on logged-in role
  const [activeTab, setActiveTab] = useState(() => {
    if (adminRole === 'rider') return 'Delivery';
    if (adminRole === 'supplier') return 'Suppliers';
    return 'Dashboard';
  });

  const [headerSearch, setHeaderSearch] = useState('');

  // If not logged in as Admin, show the Admin Login with Username/Password
  if (!isAdminLoggedIn) {
    return <AdminLogin />;
  }

  // Modal visibility states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isCreatePromoOpen, setIsCreatePromoOpen] = useState(false);

  const roleMeta = {
    superadmin: { title: 'Super Admin', badge: '★ Super Admin', tag: 'Full Control', iconBg: 'bg-amber-600' },
    admin: { title: 'Store Admin', badge: '◆ Store Manager', tag: 'Store Operations', iconBg: 'bg-emerald-600' },
    supplier: { title: 'Supplier Partner', badge: '📦 Supplier Portal', tag: 'Supply & Invoices', iconBg: 'bg-indigo-600' },
    rider: { title: 'Delivery Fleet', badge: '🛵 Delivery Dispatch', tag: 'Rider App', iconBg: 'bg-rose-600' }
  };

  const currentRoleInfo = roleMeta[adminRole] || roleMeta.admin;

  const adminNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Products', icon: Package },
    { label: 'Categories', icon: Layers },
    { label: 'Orders', icon: ShoppingBag },
    { label: 'Customers', icon: Users },
    { label: 'Inventory', icon: Boxes },
    { label: 'Suppliers', icon: Truck },
    { label: 'Promotions', icon: Tag },
    { label: 'Delivery', icon: Truck },
    { label: 'Reports', icon: BarChart3 },
    { label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-sans text-slate-800 antialiased">
      
      {/* 1. Left Dark Sidebar matching screenshot */}
      <aside className="w-full lg:w-64 bg-[#0f172a] text-slate-300 p-5 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* FreshMart Admin Brand */}
          <div
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 pb-5 border-b border-slate-800 cursor-pointer group"
          >
            <div className={`w-9 h-9 rounded-xl ${currentRoleInfo.iconBg} flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform`}>
              🛒
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-none">FreshMart</h2>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-1">
                {currentRoleInfo.badge}
              </span>
            </div>
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Back to Customer Storefront & Logout */}
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
            <span>Sign Out ({currentRoleInfo.title})</span>
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
            <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
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
          {activeTab === 'Orders' && <OrdersView />}
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
