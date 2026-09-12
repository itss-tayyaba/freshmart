import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Heart,
  MapPin,
  CreditCard,
  User,
  Bell,
  HelpCircle,
  LogOut,
  Gift,
  ArrowRight,
  Truck,
  ShieldCheck,
  Award,
  PhoneCall,
  Clock,
  Trash2,
  Plus,
  Minus,
  Check,
  Copy,
  Sparkles,
  ChevronRight,
  Search,
  Camera,
  Upload,
  AlertTriangle,
  Flame,
  Tag,
  Store,
  Wallet,
  CheckCircle2
} from 'lucide-react';


import { useStore } from '../../context/StoreContext';
import { CustomerAuth } from './CustomerAuth';
import { OrdersView } from './views/OrdersView';
import { AddressesView } from './views/AddressesView';
import { WalletRewardsView } from './views/WalletRewardsView';
import { ProfileSettingsView } from './views/ProfileSettingsView';
import { FRESHMART_PRODUCTS } from '../../data/freshMartData';

export const CustomerPortal = () => {
  const {
    customerUser,
    logoutCustomer,
    updateCustomerAvatar,
    customerNotifications = [],
    navigateTo,
    cart = [],
    updateCartQuantity,
    removeFromCart,
    cartSubtotal = 0,
    deliveryCharges = 0,
    cartTotal = 0,
    wishlist = [],
    wishlistCount = 0,
    deliveryLocation,
    setIsLocationModalOpen,
    currency = 'PKR',
    applyCouponCode,
    promotions = [],
    storeSettings = {},
    addToast,
    customerOrders = [],
    addToCart
  } = useStore();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'orders' | 'cart' | 'wishlist' | 'addresses' | 'payments' | 'settings' | 'notifications' | 'support'
  const [copiedCode, setCopiedCode] = useState(null);
  const fileInputRef = useRef(null);

  // If customer is not logged in, show Sign In / Create Account Screen
  if (!customerUser) {
    return <CustomerAuth />;
  }

  // Get Initials for Avatar Circle (e.g. Aimen Yasin -> AY)
  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Photo Avatar Upload Handler
  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Invalid File', 'Please select an image file (PNG, JPG, WEBP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateCustomerAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    applyCouponCode(code);
    addToast('Coupon Applied! 🎉', `Code ${code} activated on your cart.`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f5] via-[#f8faf8] to-[#fcf8f2] text-slate-800 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* 0. Top Dedicated Customer Portal Header Bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-emerald-100/90 sticky top-0 z-40 px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: FreshMart Customer Brand + Back to Shop Button */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-[#07382c] flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                🛒
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 leading-none flex items-center gap-1.5">
                  <span>FreshMart</span>
                  <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    PRO
                  </span>
                </h1>
                <span className="text-[11px] text-emerald-700 font-bold tracking-wide block mt-0.5">
                  Customer Portal & Loyalty
                </span>
              </div>
            </div>

            <button
              onClick={() => navigateTo('shop')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-900 rounded-xl text-xs font-bold transition-all cursor-pointer ml-2 border border-emerald-200/80 shadow-2xs hover:shadow-xs"
            >
              <Store className="w-3.5 h-3.5 text-emerald-700" />
              <span>Back to Storefront</span>
            </button>
          </div>

          {/* Center Search Input */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search fresh groceries, dairy, organic produce..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigateTo('shop');
                }}
                className="w-full bg-emerald-50/40 border border-emerald-200/70 rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Right Action Icons: Delivery Location, Notifications, Wishlist, Cart & Profile Logout */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            
            {/* Location Pill */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl font-semibold transition-all cursor-pointer border border-emerald-100 shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[120px]">
                {deliveryLocation?.address || deliveryLocation?.city || 'Gulberg, Lahore'}
              </span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`p-2.5 rounded-xl transition-all relative cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                  : 'text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-100 shadow-2xs'
              }`}
              title="Notifications & Deals"
            >
              <Bell className="w-4 h-4" />
              {customerNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse shadow-xs">
                  {customerNotifications.length}
                </span>
              )}
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`p-2.5 rounded-xl transition-all relative cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-900/20'
                  : 'text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-emerald-100 shadow-2xs'
              }`}
              title="Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setActiveTab('cart')}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold transition-all cursor-pointer shadow-md shadow-emerald-900/20 hover:scale-105"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-100" />
              <span>{currency.symbol}{cartTotal}</span>
            </button>

            {/* Customer Pill with Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-emerald-200/80">
              <div
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 cursor-pointer group"
                title="View Profile Settings"
              >
                {customerUser.avatar ? (
                  <img
                    src={customerUser.avatar}
                    alt={customerUser.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500 shadow-xs group-hover:ring-2 group-hover:ring-emerald-400"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-[#07382c] text-white font-black text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    {getInitials(customerUser.name)}
                  </div>
                )}
                <span className="font-bold text-slate-900 hidden sm:inline text-xs group-hover:text-emerald-700">
                  {(customerUser?.name || 'Customer').split(' ')[0]}
                </span>
              </div>

              <button
                onClick={logoutCustomer}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Logout from Customer Portal"
              >
                Logout
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Main Customer Portal Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full animate-in fade-in duration-300">
        
        {/* 3-Column Customer Portal Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ========================================================= */}
        {/* LEFT COLUMN: Sidebar Navigation (3 Columns)               */}
        {/* ========================================================= */}
        <aside className="lg:col-span-3 space-y-5">
          
          {/* Profile Card in Deep Forest Emerald Gradient */}
          <div className="bg-gradient-to-br from-[#07382c] via-[#0b4d3c] to-[#14765d] rounded-3xl p-5 text-white shadow-xl shadow-emerald-950/20 border border-emerald-600/30 space-y-4 relative overflow-hidden">
            {/* Background glowing ambient light */}
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-amber-400/15 rounded-full blur-xl pointer-events-none"></div>

            <div className="flex items-center gap-3.5 relative z-10">
              <div className="relative shrink-0">
                {customerUser.avatar ? (
                  <img
                    src={customerUser.avatar}
                    alt={customerUser.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400 shadow-md ring-2 ring-emerald-300/30"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-lg flex items-center justify-center shadow-md ring-2 ring-white/20">
                    {getInitials(customerUser.name)}
                  </div>
                )}

                {/* 📷 Small Camera Badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110"
                  title="Upload Profile Picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm text-white truncate leading-snug">
                    {customerUser.name}
                  </h3>
                  <span className="text-[9px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300" />
                    Verified
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 font-medium truncate mt-0.5">
                  {customerUser.phone || customerUser.email}
                </p>
                <p className="text-[11px] text-emerald-300 font-semibold mt-1 flex items-center gap-1">
                  <span>FreshMart Registered Member</span>
                </p>
              </div>
            </div>

            {/* Explicit [ Choose File / Photo ] Button */}
            <div className="pt-1 relative z-10">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-white/15 hover:bg-white/25 text-white backdrop-blur-xs rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/20 hover:border-white/40 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-200" />
                <span>Change Profile Photo</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>
          </div>

          {/* Navigation Menu Links */}
          <div className="bg-white rounded-3xl p-3 border border-emerald-100/80 shadow-sm space-y-1 text-xs font-bold">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-900/20 scale-[1.02]'
                  : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeTab === 'dashboard' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                  <LayoutDashboard className="w-3.5 h-3.5" />
                </div>
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-900/20 scale-[1.02]'
                  : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                  <Package className="w-3.5 h-3.5" />
                </div>
                <span>My Orders</span>
              </div>
              {customerOrders.length > 0 && (
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${activeTab === 'orders' ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'}`}>
                  {customerOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('cart')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'cart'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-900/20 scale-[1.02]'
                  : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeTab === 'cart' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-700'}`}>
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <span>My Cart</span>
              </div>
              {cart.length > 0 && (
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${activeTab === 'cart' ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'}`}>
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-900/20 scale-[1.02]'
                  : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeTab === 'wishlist' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'}`}>
                  <Heart className="w-3.5 h-3.5" />
                </div>
                <span>Wishlist</span>
              </div>
              {wishlistCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-900/20 scale-[1.02]'
                  : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeTab === 'addresses' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span>Addresses</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-900/20 scale-[1.02]'
                  : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeTab === 'payments' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'}`}>
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <span>Wallet & Payments</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-900/20 scale-[1.02]'
                  : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeTab === 'settings' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>Profile Settings</span>
              </div>
            </button>

            {/* Notifications with Live Alert Badge */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-900/20 scale-[1.02]'
                  : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeTab === 'notifications' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'}`}>
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <span>Deals & Alerts</span>
              </div>
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black animate-pulse">
                {customerNotifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-900/20 scale-[1.02]'
                  : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeTab === 'support' ? 'bg-white/20 text-white' : 'bg-cyan-100 text-cyan-700'}`}>
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <span>24/7 Support</span>
              </div>
            </button>

            {/* Logout Button */}
            <div className="pt-2 border-t border-emerald-100/80">
              <button
                onClick={logoutCustomer}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-rose-600 hover:bg-rose-50 font-bold transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <span>Logout</span>
              </button>
            </div>

          </div>

          {/* Refer & Earn Box in Vibrant Sunset Amber / Orange Gradient */}
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-5 text-white shadow-lg shadow-orange-950/20 border border-orange-300/40 space-y-3 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-6xl opacity-20 pointer-events-none">🎁</div>
            
            <div className="flex items-center justify-between relative z-10">
              <span className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Refer & Earn</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              </span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                PKR 200 OFF
              </span>
            </div>

            <p className="text-[11px] text-orange-50 leading-relaxed relative z-10">
              Invite friends to shop fresh groceries. You both get <strong className="text-white font-black underline decoration-amber-300">PKR 200 off</strong> on your next delivery!
            </p>

            <div className="pt-1 flex items-center justify-between relative z-10">
              <button
                onClick={() => addToast('Referral Code', `Share code FRESH-${(customerUser?.name || 'USER').split(' ')[0].toUpperCase()}200 with friends to earn PKR 200!`, 'info')}
                className="px-4 py-2 bg-white hover:bg-amber-50 text-orange-950 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md hover:scale-105"
              >
                Get Invite Link
              </button>
              <span className="text-2xl">🎉</span>
            </div>
          </div>

        </aside>

        {/* ========================================================= */}
        {/* CENTER COLUMN: Main Dashboard Content (6 Columns)        */}
        {/* ========================================================= */}
        <main className="lg:col-span-6 space-y-6">
          
          {activeTab === 'dashboard' && (
            <>
              {/* Vibrant Greeting Header Banner */}
              <div className="bg-gradient-to-r from-white via-emerald-50/50 to-teal-50/40 p-5 rounded-3xl border border-emerald-100/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Welcome back, {(customerUser?.name || 'Customer').split(' ')[0]}!</span>
                    <span className="animate-bounce">👋</span>
                  </h2>
                  <p className="text-xs text-emerald-800/80 font-semibold">
                    Fresh organics, dairy & pantry essentials dispatched in 10 minutes.
                  </p>
                </div>

                <button
                  onClick={() => navigateTo('shop')}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-900/20 transition-all cursor-pointer hover:scale-105 shrink-0 self-start sm:self-auto"
                >
                  Shop Groceries →
                </button>
              </div>

              {/* 8 Beautiful Pastel Gradient Category Chips */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 text-center">
                {[
                  { id: 'fruits', name: 'Fruits', emoji: '🍎', color: 'from-rose-50 to-pink-100/70 border-rose-200/80 text-rose-950 hover:border-rose-400' },
                  { id: 'vegetables', name: 'Vegetables', emoji: '🥦', color: 'from-emerald-50 to-teal-100/70 border-emerald-200/80 text-emerald-950 hover:border-emerald-400' },
                  { id: 'dairy', name: 'Dairy & Eggs', emoji: '🥛', color: 'from-amber-50 to-yellow-100/70 border-amber-200/80 text-amber-950 hover:border-amber-400' },
                  { id: 'beverages', name: 'Beverages', emoji: '🧃', color: 'from-sky-50 to-blue-100/70 border-sky-200/80 text-sky-950 hover:border-sky-400' },
                  { id: 'snacks', name: 'Snacks', emoji: '🍿', color: 'from-orange-50 to-amber-100/70 border-orange-200/80 text-orange-950 hover:border-orange-400' },
                  { id: 'bakery', name: 'Bakery', emoji: '🍞', color: 'from-yellow-50 to-amber-100/80 border-yellow-200/80 text-yellow-950 hover:border-yellow-400' },
                  { id: 'pantry', name: 'Pantry', emoji: '🍯', color: 'from-teal-50 to-emerald-100/70 border-teal-200/80 text-teal-950 hover:border-teal-400' },
                  { id: 'all', name: 'See All', emoji: '🛒', color: 'from-purple-50 to-indigo-100/70 border-indigo-200/80 text-indigo-950 hover:border-indigo-400' }
                ].map((cat, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigateTo('shop')}
                    className={`bg-gradient-to-b ${cat.color} rounded-2xl p-2.5 border shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group transform hover:-translate-y-0.5`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-2xs flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      {cat.emoji}
                    </div>
                    <span className="text-[10px] font-black truncate w-full">
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Banner + 4 Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Large Green Fresh Groceries Banner */}
                <div className="sm:col-span-2 bg-gradient-to-r from-[#07382c] via-[#0b4d3c] to-[#14765d] rounded-3xl p-6 text-white border border-emerald-600/30 flex items-center justify-between gap-4 relative overflow-hidden shadow-lg shadow-emerald-950/15">
                  <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="space-y-2 z-10 max-w-[260px]">
                    <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                      ⚡ 10-Minute Dispatch
                    </span>
                    <h3 className="font-black text-lg sm:text-xl text-white leading-tight">
                      Farm-Fresh Produce <br />
                      <span className="text-emerald-300">At Your Doorstep</span>
                    </h3>
                    <p className="text-[11px] text-emerald-100/90 leading-snug">
                      100% organic vegetables, fruits & daily dairy picked straight from partner farms.
                    </p>
                    <button
                      onClick={() => navigateTo('shop')}
                      className="mt-1 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md hover:scale-105"
                    >
                      Shop Now →
                    </button>
                  </div>

                  <div className="relative z-10 flex items-center justify-center shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80"
                      alt="Produce Basket"
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-2xl border-2 border-emerald-300/40 transform -rotate-3 hover:rotate-0 transition-transform"
                    />
                  </div>
                </div>

                {/* 4 Feature Squares */}
                <div
                  onClick={() => {
                    if (customerOrders.length === 0) {
                      addToast('No Previous Orders', 'You have not placed any orders yet. Browse products in the shop!', 'info');
                    } else {
                      setActiveTab('orders');
                    }
                  }}
                  className="bg-white rounded-3xl p-4 border border-emerald-100/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex items-center gap-3.5 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 text-xl font-bold shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                    🛒
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900 group-hover:text-emerald-700">Quick Reorder</h4>
                    <p className="text-[10px] text-slate-500">Buy again from previous orders</p>
                  </div>
                </div>

                <div
                  onClick={() => navigateTo('deals')}
                  className="bg-white rounded-3xl p-4 border border-amber-100/80 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex items-center gap-3.5 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 text-xl font-bold shadow-md shadow-orange-950/20 group-hover:scale-105 transition-transform">
                    🏷️
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900 group-hover:text-amber-700">Offers Zone</h4>
                    <p className="text-[10px] text-slate-500">Exclusive discounts & coupons</p>
                  </div>
                </div>

                <div
                  onClick={() => navigateTo('delivery')}
                  className="bg-white rounded-3xl p-4 border border-sky-100/80 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer flex items-center gap-3.5 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xl font-bold shadow-md shadow-blue-950/20 group-hover:scale-105 transition-transform">
                    📍
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900 group-hover:text-blue-700">Live GPS Tracker</h4>
                    <p className="text-[10px] text-slate-500">Track delivery rider in real time</p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('payments')}
                  className="bg-white rounded-3xl p-4 border border-emerald-100/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex items-center gap-3.5 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shrink-0 text-xl font-bold shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform">
                    👛
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900 group-hover:text-emerald-700">Payment Methods</h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Manage COD, JazzCash, EasyPaisa
                    </p>
                  </div>
                </div>

              </div>

              {/* My Recent Orders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-slate-900">My Recent Orders</h3>
                    {customerOrders.length > 0 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        {customerOrders.length} Total
                      </span>
                    )}
                  </div>
                  {customerOrders.length > 0 && (
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      View All Orders →
                    </button>
                  )}
                </div>

                {customerOrders.length === 0 ? (
                  /* Clean Empty State */
                  <div className="bg-gradient-to-b from-white to-emerald-50/40 rounded-3xl p-6 sm:p-8 border border-emerald-100 text-center space-y-3 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl shadow-2xs">
                      🛍️
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-sm text-slate-800">You haven't placed any orders yet</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Explore our fresh grocery catalog, organic produce, and enjoy guaranteed 10-minute dispatch!
                      </p>
                    </div>
                    <button
                      onClick={() => navigateTo('shop')}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-900/20 transition-all cursor-pointer hover:scale-105"
                    >
                      Browse Fresh Groceries
                    </button>
                  </div>
                ) : (
                  /* Render Real Placed Orders */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {customerOrders.slice(0, 3).map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-3xl p-4 border border-emerald-100 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-slate-900 font-mono">{order.id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {order.status || 'Confirmed'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{order.dateFormatted || 'Recently'}</span>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="font-black text-xs text-emerald-700 font-mono">
                            PKR {order.totalAmount}
                          </span>
                          <button
                            onClick={() => navigateTo('delivery')}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                          >
                            Track Order →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4 Bottom Value Propositions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 bg-gradient-to-b from-sky-50/80 to-blue-50/40 rounded-2xl border border-sky-100 text-center space-y-1 shadow-2xs">
                  <div className="text-2xl">🚚</div>
                  <h5 className="font-black text-[11px] text-sky-950">10-Min Fast Dispatch</h5>
                  <p className="text-[10px] text-sky-700">Swift doorstep delivery</p>
                </div>
                <div className="p-3.5 bg-gradient-to-b from-emerald-50/80 to-teal-50/40 rounded-2xl border border-emerald-100 text-center space-y-1 shadow-2xs">
                  <div className="text-2xl">🌿</div>
                  <h5 className="font-black text-[11px] text-emerald-950">100% Fresh Promise</h5>
                  <p className="text-[10px] text-emerald-700">Direct from local farms</p>
                </div>
                <div className="p-3.5 bg-gradient-to-b from-amber-50/80 to-yellow-50/40 rounded-2xl border border-amber-100 text-center space-y-1 shadow-2xs">
                  <div className="text-2xl">🔒</div>
                  <h5 className="font-black text-[11px] text-amber-950">Secure Payments</h5>
                  <p className="text-[10px] text-amber-700">JazzCash, SadaPay & COD</p>
                </div>
                <div className="p-3.5 bg-gradient-to-b from-purple-50/80 to-indigo-50/40 rounded-2xl border border-purple-100 text-center space-y-1 shadow-2xs">
                  <div className="text-2xl">🎧</div>
                  <h5 className="font-black text-[11px] text-purple-950">24/7 Live Support</h5>
                  <p className="text-[10px] text-purple-700">Help on WhatsApp & Chat</p>
                </div>
              </div>
            </>
          )}

          {/* Notifications Tab: Discounts & Expiring Deal Alerts */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span>Deals & Discount Alerts</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Active vouchers and expiring sales alerts</p>
                </div>
                <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-100 px-3 py-1 rounded-full shadow-2xs">
                  🔥 Limited-Time Offers
                </span>
              </div>

              <div className="space-y-3">
                {customerNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      notif.urgent
                        ? 'border-rose-300 bg-gradient-to-r from-rose-50/90 to-orange-50/60 shadow-xs'
                        : 'border-emerald-100 bg-gradient-to-r from-white to-emerald-50/30 hover:border-emerald-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {notif.type === 'discount' ? '🔥' : notif.type === 'wallet' ? '🎁' : '⚡'}
                        </span>
                        <h4 className="font-black text-xs text-slate-900">{notif.title}</h4>
                      </div>

                      {/* Expiration Time Badge */}
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                        notif.urgent
                          ? 'bg-rose-500 text-white animate-pulse shadow-2xs'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{notif.expiresAt}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-3">{notif.message}</p>

                    {notif.code && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                        <span className="font-mono font-black text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                          CODE: {notif.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(notif.code)}
                          className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-[11px] transition-all cursor-pointer shadow-xs hover:scale-105"
                        >
                          {copiedCode === notif.code ? 'Applied ✓' : 'Apply Discount'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Views for other tabs */}
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'addresses' && <AddressesView />}
          {activeTab === 'payments' && <WalletRewardsView />}
          {activeTab === 'settings' && <ProfileSettingsView />}
          {activeTab === 'wishlist' && (
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                      <Heart className="w-4 h-4" />
                    </div>
                    <span>My Wishlist ({wishlist.length} Items)</span>
                  </h3>
                  <p className="text-xs text-slate-400">Products you've saved for later</p>
                </div>
                <button
                  onClick={() => navigateTo('shop')}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Explore More Items →
                </button>
              </div>

              {wishlist.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <div className="text-4xl">❤️</div>
                  <p className="font-bold text-slate-700">Your wishlist is currently empty.</p>
                  <p className="text-slate-400 text-[11px]">Click the heart icon on any product in the shop to save it here!</p>
                  <button
                    onClick={() => navigateTo('shop')}
                    className="mt-2 px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer hover:bg-emerald-700"
                  >
                    Go Shopping
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {FRESHMART_PRODUCTS.filter((p) => wishlist.includes(p.id)).map((p) => (
                    <div key={p.id} className="p-3.5 bg-gradient-to-b from-white to-emerald-50/40 border border-emerald-100 rounded-2xl space-y-2 shadow-2xs hover:shadow-md transition-all">
                      <img src={p.image} alt={p.name} className="w-full h-24 object-cover rounded-xl border border-emerald-100" />
                      <h4 className="font-bold text-xs line-clamp-1 text-slate-900">{p.name}</h4>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-emerald-700 font-mono">PKR {p.price}</span>
                        <span className="text-[10px] text-slate-400">{p.unit}</span>
                      </div>
                      <button
                        onClick={() => addToCart(p, 1)}
                        className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs"
                      >
                        + Add to Basket
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'support' && (
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-emerald-100">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center text-xl font-bold">
                  🎧
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">24/7 Customer Support & Help Center</h3>
                  <p className="text-xs text-slate-400">Need help with an order, replacement, or delivery question?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp / Direct Helpline</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Call or chat with our live Lahore support desk immediately.</p>
                  <a
                    href="tel:+923001234567"
                    className="inline-block font-mono font-bold text-emerald-700 text-xs bg-white px-3 py-1 rounded-lg border border-emerald-200"
                  >
                    +92 320 6551699
                  </a>
                </div>

                <div className="p-4 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/60 to-white space-y-2">
                  <div className="flex items-center gap-2 text-sky-800 font-black text-xs">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Hassle-Free Replacement</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Damaged or unsatisfactory item? 100% money back or replacement.</p>
                  <button
                    onClick={() => addToast('Support Request', 'Support ticket opened. Our agent will call within 5 mins.', 'success')}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Request Replacement
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: My Cart, Best Offers, Address (3 Columns)   */}
        {/* ========================================================= */}
        <aside className="lg:col-span-3 space-y-5">
          
          {/* 1. My Cart Widget */}
          <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-black text-xs text-slate-900">
                  My Cart ({cart.length} items)
                </h3>
              </div>
              <button
                onClick={() => navigateTo('shop')}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Shop More
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                <div className="text-3xl">🛒</div>
                <p className="font-semibold text-slate-600">Your cart is empty</p>
                <button
                  onClick={() => navigateTo('shop')}
                  className="px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold cursor-pointer transition-colors border border-emerald-200/60"
                >
                  Shop Fresh Items
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Free Delivery Progress Bar */}
                <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/70 text-[11px] space-y-1">
                  <div className="flex justify-between font-bold text-emerald-900">
                    <span>{cartSubtotal >= 500 ? '🎉 Free Delivery Unlocked!' : `Add PKR ${500 - cartSubtotal} for FREE Delivery`}</span>
                    <span className="text-emerald-700 font-mono">{Math.min(100, Math.round((cartSubtotal / 500) * 100))}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((cartSubtotal / 500) * 100))}%` }}
                    ></div>
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2.5 text-xs p-2 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-white hover:border-emerald-200 transition-all">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{item.product.name}</h4>
                        <span className="text-[10px] text-slate-400 block">{item.unit || item.product.unit}</span>
                        <span className="font-black text-emerald-700 font-mono text-[11px]">
                          PKR {item.product.price}
                        </span>
                      </div>

                      {/* Quantity Modifier */}
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                        <button
                          onClick={() => updateCartQuantity(item.product.id || item.product._id || item.product, -1)}
                          className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-slate-900 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id || item.product._id || item.product, 1)}
                          className="w-5 h-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-2xs"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id || item.product._id || item.product)}
                        className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  ))}
                </div>

                {/* Subtotal & Total Bill */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-emerald-100">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-800">PKR {cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-slate-800">
                      {deliveryCharges === 0 ? <strong className="text-emerald-700">FREE</strong> : `PKR ${deliveryCharges}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 pt-1.5 border-t border-emerald-100 text-sm">
                    <span>Total Amount</span>
                    <span className="text-emerald-700 font-mono">PKR {cartTotal}</span>
                  </div>
                </div>

                {/* Bright Green Checkout Button */}
                <button
                  onClick={() => navigateTo('checkout')}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-700 to-[#07382c] hover:from-emerald-700 hover:to-emerald-900 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
                </button>
              </div>
            )}
          </div>

          {/* 2. Best Offers for You in Styled Ticket Vouchers */}
          <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-black text-xs text-slate-900">Active Promo Vouchers</h3>
              </div>
              <button
                onClick={() => navigateTo('deals')}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {promotions && promotions.filter(p => p.status === 'Active').length > 0 ? (
              promotions
                .filter(p => p.status === 'Active')
                .slice(0, 2)
                .map((promo) => {
                  const discountText = promo.discountType === 'percentage'
                    ? `${promo.discountAmount || promo.discountPercent || 0}% OFF`
                    : promo.discountType === 'fixed'
                    ? `Rs. ${promo.discountAmount || promo.flatAmount || 0} OFF`
                    : 'FREE SHIPPING';

                  return (
                    <div
                      key={promo.code || promo.id}
                      className="bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white rounded-2xl p-3 border border-emerald-200/80 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-black text-emerald-800 block">{discountText}</span>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{promo.title || 'Special Store Voucher'}</p>
                        <span className="text-[10px] font-mono font-bold text-slate-800 block">Use Code: {promo.code}</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(promo.code)}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-xs hover:scale-105"
                      >
                        {copiedCode === promo.code ? 'Applied ✓' : 'Apply'}
                      </button>
                    </div>
                  );
                })
            ) : (
              <div className="p-3 bg-emerald-50/40 rounded-2xl border border-emerald-100 text-center">
                <p className="text-[11px] text-slate-600 font-semibold">No promo codes active right now.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Check back later for seasonal vouchers!</p>
              </div>
            )}
          </div>

          {/* 3. Delivery Address Widget */}
          <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-black text-xs text-slate-900">Delivery Address</h3>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                {deliveryLocation.address ? 'Change' : '+ Add'}
              </button>
            </div>

            {deliveryLocation.address ? (
              <div className="flex items-start gap-2.5 pt-1.5 p-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-slate-900 block">{deliveryLocation.label || 'Home'}</span>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {deliveryLocation.address}, {deliveryLocation.city}
                  </p>
                </div>
              </div>
            ) : (
              <div className="pt-2 text-center text-xs text-slate-400 space-y-2">
                <p className="text-[11px]">No delivery address added yet.</p>
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full py-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-200/80 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Add Delivery Address</span>
                </button>
              </div>
            )}
          </div>

        </aside>

      </div>

    </div>
  </div>
  );
};


