import React, { useState } from 'react';
import {
  User,
  Package,
  MapPin,
  Wallet,
  Settings,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  Heart,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { OrdersView } from './views/OrdersView';
import { AddressesView } from './views/AddressesView';
import { WalletRewardsView } from './views/WalletRewardsView';
import { ProfileSettingsView } from './views/ProfileSettingsView';

export const CustomerPortal = () => {
  const { navigateTo, setIsOrderTrackerOpen, setIsWishlistOpen, currency, user, addToast } = useStore();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'addresses' | 'wallet' | 'settings'

  const navItems = [
    { id: 'orders', label: 'My Orders & Tracking', icon: Package, badge: '1 Active' },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin, count: '3' },
    { id: 'wallet', label: 'Wallet & Rewards', icon: Wallet, highlight: 'Rs. 2,500' },
    { id: 'settings', label: 'Profile & Security', icon: Settings }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Customer VIP Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Customer Info */}
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
              alt="Alex Morgan"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-emerald-400 shadow-xl"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              VIP
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Alex Morgan</h2>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs sm:text-sm text-slate-300">customer@freshmart.com • 0300-1234567</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                👑 VIP Gold Member
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Joined July 2026
              </span>
            </div>
          </div>
        </div>

        {/* Quick KPI Stat Chips */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 relative z-10 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <div className="text-center sm:text-left">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block uppercase">Orders</span>
            <span className="text-lg sm:text-xl font-black text-white">14</span>
          </div>
          <div className="text-center sm:text-left border-x border-white/10 px-3 sm:px-4">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block uppercase">Saved</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400">Rs. 4.8k</span>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block uppercase">Points</span>
            <span className="text-lg sm:text-xl font-black text-amber-300">1,240</span>
          </div>
        </div>

      </div>

      {/* 2. Main Portal Layout: Sidebar + Active View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Sidebar Menu */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-2 lg:sticky lg:top-24">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider px-3 block mb-2">
            Customer Dashboard
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 translate-x-1'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isActive ? 'bg-white text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {item.highlight && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-white text-slate-900' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.highlight}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Actions in Sidebar */}
          <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
            <button
              onClick={() => navigateTo('shop')}
              className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-slate-400" />
                <span>Browse Store</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>

            <button
              onClick={() => setIsWishlistOpen(true)}
              className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-slate-400" />
                <span>My Wishlist</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>

            <button
              onClick={() => {
                addToast('Logged Out', 'Signed out of customer portal.', 'info');
                navigateTo('home');
              }}
              className="w-full flex items-center gap-3 p-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
          {activeTab === 'orders' && (
            <OrdersView onTrackOrder={(orderId) => setIsOrderTrackerOpen(true)} />
          )}

          {activeTab === 'addresses' && <AddressesView />}

          {activeTab === 'wallet' && <WalletRewardsView />}

          {activeTab === 'settings' && <ProfileSettingsView />}
        </div>

      </div>

    </div>
  );
};
