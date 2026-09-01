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
  Tag
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
    customerNotifications,
    navigateTo,
    cart,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    deliveryCharges,
    cartTotal,
    wishlist,
    deliveryLocation,
    setIsLocationModalOpen,
    currency,
    applyCouponCode,
    addToast,
    customerOrders,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      
      {/* 3-Column Customer Portal Grid matching user screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Sidebar Navigation (3 Columns)               */}
        {/* ========================================================= */}
        <aside className="lg:col-span-3 space-y-5">
          
          {/* Profile Card with Photo Avatar / Initials Circle & Upload Button */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                {customerUser.avatar ? (
                  <img
                    src={customerUser.avatar}
                    alt={customerUser.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#185a36] text-emerald-100 font-black text-base flex items-center justify-center shadow-inner">
                    {getInitials(customerUser.name)}
                  </div>
                )}

                {/* 📷 Small Camera Badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110"
                  title="Upload Profile Picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-black text-sm text-slate-900 truncate leading-snug">
                  {customerUser.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium truncate">{customerUser.phone || customerUser.email}</p>
              </div>
            </div>

            {/* Explicit [ Choose File / Photo ] Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-emerald-200/60"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-700" />
                <span>Choose Photo / File</span>
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


          {/* Navigation Menu Links matching screenshot */}
          <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-xs space-y-1 text-xs font-bold">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-800 font-black shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-emerald-50 text-emerald-800 font-black shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-slate-500" />
                <span>My Orders</span>
              </div>
              {customerOrders.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black">
                  {customerOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('cart')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'cart'
                  ? 'bg-emerald-50 text-emerald-800 font-black shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4 text-slate-500" />
                <span>My Cart</span>
              </div>
              {cart.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-emerald-50 text-emerald-800 font-black shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-slate-500" />
                <span>Wishlist</span>
              </div>
              {wishlist.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-emerald-50 text-emerald-800 font-black shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Addresses</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-emerald-50 text-emerald-800 font-black shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-slate-500" />
                <span>Payment Methods</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-50 text-emerald-800 font-black shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500" />
                <span>Profile Settings</span>
              </div>
            </button>

            {/* Notifications with Live Alert Badge */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-emerald-50 text-emerald-800 font-black shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-500" />
                <span>Notifications & Deals</span>
              </div>
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black animate-pulse">
                {customerNotifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-colors cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-emerald-50 text-emerald-800 font-black shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>Support / Help</span>
              </div>
            </button>

            {/* Logout Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={logoutCustomer}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Logout</span>
              </button>
            </div>

          </div>

          {/* Refer & Earn Box */}
          <div className="bg-[#eef8f3] rounded-3xl p-5 border border-emerald-100 space-y-2.5">
            <span className="font-black text-xs text-slate-900 block">Refer & Earn</span>
            <p className="text-[11px] text-slate-600 leading-snug">
              Refer your friends and get <strong>PKR 200 off</strong> on your next order.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <button
                onClick={() => addToast('Referral Code', `Share code FRESH-${customerUser.name.split(' ')[0].toUpperCase()}200 with friends to earn PKR 200!`, 'info')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Refer Now
              </button>
              <div className="text-3xl">🎁</div>
            </div>
          </div>

        </aside>

        {/* ========================================================= */}
        {/* CENTER COLUMN: Main Dashboard Content (6 Columns)        */}
        {/* ========================================================= */}
        <main className="lg:col-span-6 space-y-6">
          
          {activeTab === 'dashboard' && (
            <>
              {/* Greeting Header */}
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Welcome back, {customerUser.name.split(' ')[0]}!</span>
                  <span>👋</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">What would you like to shop today?</p>
              </div>

              {/* 8 Circular Category Pills */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 text-center">
                {[
                  { id: 'fruits-veg', name: 'Fruits', emoji: '🍎' },
                  { id: 'fruits-veg', name: 'Vegetables', emoji: '🥦' },
                  { id: 'dairy-eggs', name: 'Dairy & Eggs', emoji: '🥛' },
                  { id: 'beverages', name: 'Beverages', emoji: '🧃' },
                  { id: 'snacks', name: 'Snacks', emoji: '🍿' },
                  { id: 'bakery', name: 'Bakery', emoji: '🍞' },
                  { id: 'grocery-staples', name: 'Pantry', emoji: '🍯' },
                  { id: 'all', name: 'See All', emoji: '🛒' }
                ].map((cat, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigateTo('shop')}
                    className="bg-white rounded-2xl p-2 border border-slate-100 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                      {cat.emoji}
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 truncate w-full group-hover:text-emerald-700">
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Banner + 4 Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Large Green Fresh Groceries Banner */}
                <div className="sm:col-span-2 bg-gradient-to-r from-[#eef7f2] via-[#f7faf8] to-[#edf6f0] rounded-3xl p-5 sm:p-6 border border-emerald-100 flex items-center justify-between gap-4 relative overflow-hidden shadow-xs">
                  <div className="space-y-2 z-10 max-w-[240px]">
                    <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                      Fresh Groceries <br />
                      <span className="text-emerald-700">At Your Doorstep</span>
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Get up to 20% off on fresh & organic vegetables
                    </p>
                    <button
                      onClick={() => navigateTo('shop')}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Shop Now
                    </button>
                  </div>

                  <div className="relative z-10 flex items-center justify-center shrink-0">
                    <span className="absolute -top-2 right-0 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-xs">
                      Up to 20% OFF
                    </span>
                    <img
                      src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80"
                      alt="Produce Basket"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-md border-2 border-white"
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
                  className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-3.5"
                >
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 text-xl font-bold">
                    🛒
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900">Quick Reorder</h4>
                    <p className="text-[10px] text-slate-400">Buy again from previous orders</p>
                  </div>
                </div>

                <div
                  onClick={() => navigateTo('deals')}
                  className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-3.5"
                >
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 text-xl font-bold">
                    🏷️
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900">Offers Zone</h4>
                    <p className="text-[10px] text-slate-400">Check latest offers & discounts</p>
                  </div>
                </div>

                <div
                  onClick={() => navigateTo('delivery')}
                  className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-3.5"
                >
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 text-xl font-bold">
                    📍
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900">Track Order</h4>
                    <p className="text-[10px] text-slate-400">Track your order in real time</p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('payments')}
                  className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-3.5"
                >
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 text-xl font-bold">
                    👛
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900">Wallet</h4>
                    <p className="text-[10px] text-slate-600 font-bold">
                      Your balance <strong className="text-emerald-700 font-mono">PKR {customerUser.walletBalance || 320}</strong>
                    </p>
                  </div>
                </div>

              </div>

              {/* My Recent Orders: Completely Clean When Customer Has Not Ordered Anything */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-slate-900">My Recent Orders</h3>
                  {customerOrders.length > 0 && (
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      View All Orders
                    </button>
                  )}
                </div>

                {customerOrders.length === 0 ? (
                  /* Clean Empty State */
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xs text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                      🛍️
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-sm text-slate-800">You haven't placed any orders yet</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Explore our fresh grocery catalog, organic produce, and enjoy guaranteed 10-minute dispatch!
                      </p>
                    </div>
                    <button
                      onClick={() => navigateTo('shop')}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer"
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
                        className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-slate-900 font-mono">{order.id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {order.status || 'Confirmed'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{order.dateFormatted || 'Recently'}</span>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="font-black text-xs text-slate-900 font-mono">
                            PKR {order.totalAmount}
                          </span>
                          <button
                            onClick={() => navigateTo('delivery')}
                            className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            Track Order
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4 Bottom Value Propositions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center space-y-1">
                  <div className="text-xl">🚚</div>
                  <h5 className="font-black text-[11px] text-slate-800">Fast Delivery</h5>
                  <p className="text-[10px] text-slate-400">Get your order in 60 mins</p>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center space-y-1">
                  <div className="text-xl">🌿</div>
                  <h5 className="font-black text-[11px] text-slate-800">Fresh Guarantee</h5>
                  <p className="text-[10px] text-slate-400">100% fresh or we replace</p>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center space-y-1">
                  <div className="text-xl">🔒</div>
                  <h5 className="font-black text-[11px] text-slate-800">Secure Payment</h5>
                  <p className="text-[10px] text-slate-400">100% secure payments</p>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center space-y-1">
                  <div className="text-xl">🎧</div>
                  <h5 className="font-black text-[11px] text-slate-800">24/7 Support</h5>
                  <p className="text-[10px] text-slate-400">We're here to help you</p>
                </div>
              </div>
            </>
          )}

          {/* Notifications Tab: Discounts & Expiring Deal Alerts with Countdown Timer */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-emerald-600" />
                    <span>Deals & Discount Alerts</span>
                  </h3>
                  <p className="text-xs text-slate-400">Active vouchers and expiring sales alerts</p>
                </div>
                <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                  🔥 Limited-Time Offers
                </span>
              </div>

              <div className="space-y-3">
                {customerNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      notif.urgent
                        ? 'border-rose-200 bg-rose-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {notif.type === 'discount' ? '🔥' : notif.type === 'wallet' ? '🎁' : '⚡'}
                        </span>
                        <h4 className="font-black text-xs text-slate-900">{notif.title}</h4>
                      </div>

                      {/* Expiration Time Badge */}
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                        notif.urgent
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{notif.expiresAt}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-3">{notif.message}</p>

                    {notif.code && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                        <span className="font-mono font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          CODE: {notif.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(notif.code)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
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
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-black text-base text-slate-900">My Wishlist ({wishlist.length} Items)</h3>
              {wishlist.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <div className="text-3xl">❤️</div>
                  <p>Your wishlist is currently empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {FRESHMART_PRODUCTS.filter((p) => wishlist.includes(p.id)).map((p) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-2xl space-y-2">
                      <img src={p.image} alt={p.name} className="w-full h-24 object-cover rounded-xl" />
                      <h4 className="font-bold text-xs line-clamp-1">{p.name}</h4>
                      <button onClick={() => addToCart(p, 1)} className="w-full py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">
                        + Add to Basket
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: My Cart, Best Offers, Address (3 Columns)   */}
        {/* ========================================================= */}
        <aside className="lg:col-span-3 space-y-5">
          
          {/* 1. My Cart Widget */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-xs text-slate-900">
                My Cart ({cart.length} items)
              </h3>
              <button
                onClick={() => navigateTo('shop')}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                View Cart
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                <p>Your cart is empty</p>
                <button
                  onClick={() => navigateTo('shop')}
                  className="px-4 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl font-bold cursor-pointer"
                >
                  Shop Items
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Cart Items List */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{item.product.name}</h4>
                        <span className="text-[10px] text-slate-400 block">{item.unit || item.product.unit}</span>
                        <span className="font-black text-slate-900 font-mono text-[11px]">
                          PKR {item.product.price}
                        </span>
                      </div>

                      {/* Quantity Modifier */}
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                        <button
                          onClick={() => updateCartQuantity(item.product.id || item.product._id || item.product, -1)}
                          className="w-5 h-5 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-slate-900 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id || item.product._id || item.product, 1)}
                          className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
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
                <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
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
                  <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-100 text-sm">
                    <span>Total</span>
                    <span className="text-emerald-700 font-mono">PKR {cartTotal}</span>
                  </div>
                </div>

                {/* Bright Green Checkout Button */}
                <button
                  onClick={() => navigateTo('checkout')}
                  className="w-full py-3 bg-[#185a36] hover:bg-[#13492b] text-white font-black rounded-2xl text-xs shadow-md transition-colors cursor-pointer"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>

          {/* 2. Best Offers for You */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-black text-xs text-slate-900">Best Offers for You</h3>
              <button
                onClick={() => navigateTo('deals')}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="bg-[#fff5f5] rounded-2xl p-3 border border-rose-100 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-[11px] font-black text-rose-600 block">Flat 15% Off</span>
                <p className="text-[10px] text-slate-500">On all orders above PKR 1500</p>
                <span className="text-[10px] font-mono font-bold text-slate-800 block">Use Code: FRESH15</span>
              </div>
              <button
                onClick={() => handleCopyCode('FRESH15')}
                className="px-2.5 py-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-[10px] font-black transition-colors cursor-pointer"
              >
                {copiedCode === 'FRESH15' ? 'Applied' : 'Apply'}
              </button>
            </div>

            <div className="bg-[#f0f8f3] rounded-2xl p-3 border border-emerald-100 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-[11px] font-black text-emerald-700 block">Flat 10% Off</span>
                <p className="text-[10px] text-slate-500">On fruits & vegetables</p>
                <span className="text-[10px] font-mono font-bold text-slate-800 block">Use Code: VEG10</span>
              </div>
              <button
                onClick={() => handleCopyCode('VEG10')}
                className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-700 hover:text-white rounded-xl text-[10px] font-black transition-colors cursor-pointer"
              >
                {copiedCode === 'VEG10' ? 'Applied' : 'Apply'}
              </button>
            </div>
          </div>

          {/* 3. Delivery Address Widget: Clean without fake address */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xs text-slate-900">Delivery Address</h3>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                {deliveryLocation.address ? 'Change' : '+ Add'}
              </button>
            </div>

            {deliveryLocation.address ? (
              <div className="flex items-start gap-2.5 pt-1">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-slate-900 block">{deliveryLocation.label || 'Home'}</span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {deliveryLocation.address}, {deliveryLocation.city}
                  </p>
                </div>
              </div>
            ) : (
              <div className="pt-2 text-center text-xs text-slate-400 space-y-2">
                <p className="text-[11px]">No delivery address added yet.</p>
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Delivery Address</span>
                </button>
              </div>
            )}
          </div>

        </aside>

      </div>

    </div>
  );
};
