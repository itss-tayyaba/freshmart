import React, { useState, useRef, useEffect } from 'react';
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
    products,
    addToCart,
    setSelectedProduct,
    addToast,
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter only items currently present in products catalog
  const trimmedQuery = (searchQuery || '').trim().toLowerCase();
  const liveSearchResults = trimmedQuery && Array.isArray(products)
    ? products.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(trimmedQuery)) ||
          (p.brand && p.brand.toLowerCase().includes(trimmedQuery)) ||
          (p.category && p.category.toLowerCase().includes(trimmedQuery)) ||
          (p.categoryLabel && p.categoryLabel.toLowerCase().includes(trimmedQuery))
      )
    : [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearchFocused(false);
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

        {/* Search Bar with Live Instant Suggestions Popup */}
        <div ref={searchContainerRef} className="flex-1 max-w-xl hidden sm:block relative z-50">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center border border-slate-200 rounded-full overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white focus-within:border-transparent transition-all shadow-inner"
          >
            <div className="pl-4 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search products in stock (e.g. Coca-Cola, Milk, Apples)..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              className="flex-1 px-3 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full mr-1 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Live Instant Search Dropdown (Only Showing Items That Are Present) */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[420px] flex flex-col">
              
              {/* Header */}
              <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  {liveSearchResults.length > 0
                    ? `Available In-Store (${liveSearchResults.length} items present)`
                    : 'Search Results'}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  Active Catalog
                </span>
              </div>

              {/* Items List */}
              <div className="overflow-y-auto divide-y divide-slate-50 p-1 flex-1">
                {liveSearchResults.length > 0 ? (
                  liveSearchResults.slice(0, 6).map((item) => {
                    const itemId = item.id || item._id;
                    const inStock = item.inStock !== false && item.status !== 'Out of Stock' && (item.stockCount === undefined || item.stockCount > 0);

                    return (
                      <div
                        key={itemId}
                        onClick={() => {
                          setSelectedProduct(item);
                          navigateTo('product-detail', item);
                          setIsSearchFocused(false);
                        }}
                        className="p-2.5 hover:bg-emerald-50/50 rounded-xl transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-medium truncate">
                                {item.brand || item.categoryLabel}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm ${
                                inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {inStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            Rs. {item.price}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item, 1);
                              addToast('Added to Cart 🛒', `${item.name} added.`);
                            }}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Quick Add"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        No items found matching "{searchQuery}"
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Only items present in FreshMart inventory are shown.
                      </p>
                    </div>

                    {/* Present Items Quick Suggestions */}
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Available Store Items:
                      </span>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {['Coca-Cola Original', 'Sprite', 'Fanta Orange', 'Olper\'s Milk', 'Fresh Bananas', 'Farm Eggs', 'Dasani'].map((suggest) => (
                          <button
                            key={suggest}
                            type="button"
                            onClick={() => {
                              setSearchQuery(suggest);
                              setIsSearchFocused(true);
                            }}
                            className="text-[10px] font-semibold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                          >
                            {suggest}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {liveSearchResults.length > 0 && (
                <div
                  onClick={() => {
                    navigateTo('shop');
                    setIsSearchFocused(false);
                  }}
                  className="p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-center text-xs font-bold cursor-pointer transition-colors"
                >
                  View All {liveSearchResults.length} Present Items in Shop ➔
                </div>
              )}
            </div>
          )}
        </div>

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

          {/* Customer Account / Sign In */}
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
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
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
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sign In</span>
            </button>
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

          {/* Cart with Live Count */}
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

      {/* 2. Secondary Navigation Links Bar */}
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
          </ul>

          {/* Switcher: Customer Portal */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (customerUser) {
                  navigateTo('customer-portal');
                } else {
                  setIsAuthOpen(true);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentPage === 'customer-portal'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer Portal</span>
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
          </div>
        </div>
      )}


    </header>
  );
};
