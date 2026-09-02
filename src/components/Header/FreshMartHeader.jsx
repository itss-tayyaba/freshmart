import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Tag,
  Package,
  Heart,
  ShoppingCart,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  Menu,
  X,
  User,
  ShieldCheck,
  Bike
} from 'lucide-react';

import { useStore } from '../../context/StoreContext';
import { FRESHMART_CATEGORIES } from '../../data/freshMartData';

export const FreshMartHeader = () => {
  const {
    currentPage,
    navigateTo,
    deliveryLocation,
    setIsLocationModalOpen,
    searchQuery,
    setSearchQuery,
    selectedSearchCategory,
    setSelectedSearchCategory,
    wishlist,
    wishlistCount,
    setIsWishlistOpen,

    totalCartCount,
    cartTotal,
    setIsCartOpen,
    setIsOrderTrackerOpen,
    setIsOffersOpen,
    setIsAuthOpen,
    customerUser,
    logoutCustomer,
    currency

  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigateTo('shop');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      
      {/* 1. Main Top Bar matching screenshot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo matching screenshot */}
        <div
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" opacity="0.3" />
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-slate-900 flex items-center">
              Fresh<span className="text-emerald-600">Mart</span>
            </h1>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5 tracking-wider">
              Freshness you can trust
            </span>
          </div>
        </div>

        {/* Location Picker matching screenshot */}
        <div
          onClick={() => setIsLocationModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer transition-colors shrink-0"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">
              Deliver to
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                {deliveryLocation.city}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Search Bar with Category Select matching screenshot */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-xl hidden sm:flex items-center border border-slate-200 rounded-full overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white focus-within:border-transparent transition-all shadow-inner"
        >
          <input
            type="text"
            placeholder="Search for products, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Right Header Navigation Icons matching screenshot */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Offers */}
          <button
            onClick={() => setIsOffersOpen(true)}
            className="flex flex-col items-center text-slate-600 hover:text-emerald-700 transition-colors p-1.5 focus:outline-none cursor-pointer"
            title="Special Offers"
          >
            <Tag className="w-5 h-5" />
            <span className="text-[10px] font-semibold hidden md:inline">Offers</span>
          </button>

          {/* Customer Account / Sign In / Create Account Buttons */}
          {customerUser ? (
            <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-1 pr-2.5">
              <button
                onClick={() => navigateTo('customer-portal')}
                className="flex items-center gap-2 text-left cursor-pointer"
                title="Customer Portal"
              >
                {customerUser.avatar ? (
                  <img
                    src={customerUser.avatar}
                    alt={customerUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-emerald-500"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                    {customerUser.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block">
                  <span className="text-[11px] font-black text-slate-900 block leading-tight truncate max-w-[90px]">
                    {customerUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-emerald-700 font-bold block leading-none">Customer</span>
                </div>
              </button>
              <button
                onClick={logoutCustomer}
                className="text-[10px] text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer transition-colors"
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer hidden sm:flex items-center gap-1"
              >
                <User className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          )}


          {/* Wishlist */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="flex flex-col items-center text-slate-600 hover:text-emerald-700 transition-colors p-1.5 focus:outline-none relative cursor-pointer"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute 0 top-0.5 right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
            <span className="text-[10px] font-semibold hidden md:inline">Wishlist</span>
          </button>


          {/* Cart with Live Count matching screenshot */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-emerald-700" />
              <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {totalCartCount}
              </span>
            </div>
            <div className="text-left hidden lg:block">
              <span className="text-[10px] font-semibold text-slate-500 block leading-none">Cart</span>
              <span className="text-xs font-black text-slate-900 leading-none">
                {currency.symbol}{cartTotal}
              </span>
            </div>
          </button>

        </div>

      </div>

      {/* 2. Secondary Navigation Links Bar matching screenshot */}
      <nav className="border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          <ul className="flex items-center gap-7 text-xs sm:text-sm font-semibold text-slate-700 overflow-x-auto no-scrollbar py-2.5">
            <li>
              <button
                onClick={() => navigateTo('home')}
                className={`transition-colors pb-1 cursor-pointer ${
                  currentPage === 'home'
                    ? 'text-emerald-600 font-bold border-b-2 border-emerald-600'
                    : 'hover:text-emerald-600'
                }`}
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('shop')}
                className={`transition-colors pb-1 cursor-pointer ${
                  currentPage === 'shop'
                    ? 'text-emerald-600 font-bold border-b-2 border-emerald-600'
                    : 'hover:text-emerald-600'
                }`}
              >
                Shop
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('deals')}
                className={`transition-colors pb-1 cursor-pointer flex items-center gap-1 ${
                  currentPage === 'deals'
                    ? 'text-emerald-600 font-bold border-b-2 border-emerald-600'
                    : 'hover:text-emerald-600'
                }`}
              >
                <span>Deals</span>
                <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                  Hot
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('recipes')}
                className={`transition-colors pb-1 cursor-pointer ${
                  currentPage === 'recipes'
                    ? 'text-emerald-600 font-bold border-b-2 border-emerald-600'
                    : 'hover:text-emerald-600'
                }`}
              >
                Recipes
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('delivery')}
                className={`transition-colors pb-1 cursor-pointer flex items-center gap-1 ${
                  currentPage === 'delivery'
                    ? 'text-emerald-600 font-bold border-b-2 border-emerald-600'
                    : 'hover:text-emerald-600 text-emerald-800 font-bold'
                }`}
              >
                <span>Live Delivery</span>
                <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                  GPS
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigateTo('customer-portal')}
                className={`transition-colors pb-1 cursor-pointer flex items-center gap-1.5 ${
                  currentPage === 'customer-portal'
                    ? 'text-emerald-600 font-bold border-b-2 border-emerald-600'
                    : 'hover:text-emerald-600'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Customer Portal</span>
              </button>
            </li>
          </ul>


          {/* Switchers: Customer Portal & Admin Dashboard */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('customer-portal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentPage === 'customer-portal'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer Portal</span>
            </button>

            <button
              onClick={() => navigateTo('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentPage === 'admin'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
              <span>Admin Suite</span>
            </button>
          </div>



        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden p-4 bg-slate-50 border-t border-slate-200 space-y-3 animate-in slide-in-from-top-2">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2"
            />
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
              Search
            </button>
          </form>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => {
                navigateTo('home');
                setMobileMenuOpen(false);
              }}
              className="p-2 bg-white rounded-xl text-left hover:bg-emerald-50"
            >
              🏠 Home
            </button>
            <button
              onClick={() => {
                navigateTo('shop');
                setMobileMenuOpen(false);
              }}
              className="p-2 bg-white rounded-xl text-left hover:bg-emerald-50"
            >
              🛍️ Shop All
            </button>
            <button
              onClick={() => {
                navigateTo('deals');
                setMobileMenuOpen(false);
              }}
              className="p-2 bg-white rounded-xl text-left hover:bg-emerald-50"
            >
              ⚡ Flash Deals
            </button>
            <button
              onClick={() => {
                navigateTo('customer-portal');
                setMobileMenuOpen(false);
              }}
              className="p-2 bg-emerald-100 text-emerald-900 font-bold rounded-xl text-left hover:bg-emerald-200"
            >
              👤 Customer Portal
            </button>
            <button
              onClick={() => {
                navigateTo('admin');
                setMobileMenuOpen(false);
              }}
              className="p-2 bg-slate-900 text-white rounded-xl text-left col-span-2 text-center font-bold"
            >
              📊 Admin Suite
            </button>
          </div>
        </div>
      )}


    </header>
  );
};
