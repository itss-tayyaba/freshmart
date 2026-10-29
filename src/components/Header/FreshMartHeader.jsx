import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MapPin,
  Search,
  Tag,
  Package,
  Heart,
  ShoppingCart,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  User,
  ShieldCheck,
  Bike,
  Truck,
  Sun,
  Moon
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
    currency,
    tenants,
    currentTenant,
    setCurrentTenant,
    setActiveCategory,
    categories,
    getNearbyStores,
    selectStoreAndBranch,
    allBranches,
    isDarkMode,
    toggleDarkMode
  } = useStore();

  const nearbyStoreOptions = useMemo(() => {
    const list = getNearbyStores ? getNearbyStores() : [];
    if (list && list.length > 0) return list;
    return (tenants || []).map((t) => ({
      id: t.id,
      tenant: t,
      displayName: t.displayName || t.name,
      distanceFormatted: ''
    }));
  }, [getNearbyStores, deliveryLocation, tenants, allBranches]);

  const categoriesList = (categories && categories.length > 0) ? categories : FRESHMART_CATEGORIES;

  const isAlFatah = currentTenant?.id === 'tenant-alfatah';
  const isChaseUp = currentTenant?.id === 'tenant-chaseup';
  const isCaseValue = currentTenant?.id === 'tenant-chasevalue';
  const isUnimaart = currentTenant?.id === 'tenant-freshmart';

  const tenantThemeColor = currentTenant?.color || (
    isAlFatah ? '#991b1b' :
    isChaseUp ? '#6b21a8' :
    isCaseValue ? '#78350f' :
    isUnimaart ? '#0284c7' :
    '#0284c7'
  );
  const tenantThemeName = currentTenant?.displayName || currentTenant?.name || 'FreshMart';
  const tenantTagline = currentTenant?.tagline || 'Freshness you can trust';
  const tenantLogo = currentTenant?.logo || (
    isAlFatah ? '👑' :
    isChaseUp ? '🏪' :
    isCaseValue ? '🛒' :
    '🛒'
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const inDesktop = searchContainerRef.current && searchContainerRef.current.contains(e.target);
      const inMobile = mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(e.target);
      if (!inDesktop && !inMobile) {
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

  const quickSearchSuggestions = Array.from(new Set([
    ...(products || []).slice(0, 5).map((p) => p.name).filter(Boolean),
    ...(categoriesList || []).slice(0, 4).map((c) => c.name).filter(Boolean)
  ])).slice(0, 7);

  const renderLiveSearchDropdown = () => {
    if (!isSearchFocused || !searchQuery.trim()) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[420px] flex flex-col z-50">
        {/* Header */}
        <div className="p-3 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {liveSearchResults.length > 0
              ? `Available in ${tenantThemeName} (${liveSearchResults.length} items present)`
              : 'Search Results'}
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
            Active Catalog
          </span>
        </div>

        {/* Items List */}
        <div className="overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 p-1 flex-1">
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
                  className="p-2.5 hover:bg-emerald-50/50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-11 h-11 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium truncate">
                          {item.brand || item.categoryLabel}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm ${
                          inStock ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                        }`}>
                          {inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                      Rs. {item.price}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item, 1);
                      }}
                      className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
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
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  No items found matching "{searchQuery}"
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Only items present in {tenantThemeName} inventory are shown.
                </p>
              </div>

              {/* Present Items Quick Suggestions */}
              {quickSearchSuggestions.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Popular in {tenantThemeName}:
                  </span>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {quickSearchSuggestions.map((suggest) => (
                      <button
                        key={suggest}
                        type="button"
                        onClick={() => {
                          setSearchQuery(suggest);
                          setIsSearchFocused(true);
                        }}
                        className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                      >
                        {suggest}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-xs">
      
      {/* 1. Main Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
        
        {/* Left Section: Mobile Hamburger Button & Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl shrink-0 transition-colors cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Brand Logo dynamically reflecting Al-Fatah, Chase Up, Chase Value or Unimaart */}
          <div
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group min-w-0"
          >
            <div
              style={{ backgroundColor: tenantThemeColor }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform text-base sm:text-lg shrink-0 font-black"
            >
              {tenantLogo}
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black tracking-tight leading-none text-slate-900 dark:text-white truncate">
                {tenantThemeName}
              </h1>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5 tracking-wider truncate max-w-[120px] sm:max-w-[200px]">
                {tenantTagline}
              </span>
            </div>
          </div>
        </div>

        {/* Location Picker displaying active address (Desktop / Tablet) */}
        <div
          onClick={() => setIsLocationModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-slate-800 cursor-pointer transition-colors shrink-0 max-w-[180px] lg:max-w-[230px]"
          title={deliveryLocation?.address ? `${deliveryLocation.address}, ${deliveryLocation.city}` : (deliveryLocation?.city || 'Lahore, Pakistan')}
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">
              Deliver to
            </span>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {deliveryLocation?.address
                  ? (deliveryLocation.label ? `${deliveryLocation.label}: ${deliveryLocation.address}` : deliveryLocation.address)
                  : (deliveryLocation?.city || 'Lahore, Pakistan')}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* 🏬 Multi-Tenant Supermarket Switcher with Nearness & Distance (Desktop / Tablet) */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0">
          <div style={{ backgroundColor: tenantThemeColor }} className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-white flex items-center justify-center text-xs shadow-xs shrink-0 font-bold">
            {tenantLogo}
          </div>
          <div className="text-left leading-tight">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
              Supermarket
            </span>
            <div className="flex items-center">
              <select
                value={currentTenant?.id || 'tenant-freshmart'}
                onChange={(e) => {
                  const targetId = e.target.value;
                  const chosen = nearbyStoreOptions.find((s) => s.id === targetId);
                  if (chosen?.tenant) {
                    if (selectStoreAndBranch) {
                      selectStoreAndBranch(chosen.tenant, chosen.nearestBranch);
                    } else {
                      setCurrentTenant(chosen.tenant);
                    }
                  } else {
                    const fallback = (tenants || []).find((t) => t.id === targetId);
                    if (fallback) setCurrentTenant(fallback);
                  }
                }}
                className="text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[190px] truncate"
              >
                {nearbyStoreOptions.map((s) => (
                  <option key={s.id} value={s.id} className="text-slate-800 dark:text-slate-100 dark:bg-slate-800">
                    {s.displayName || s.tenant?.displayName || s.tenant?.name || s.name}
                    {s.distanceFormatted ? ` (${s.distanceFormatted})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Bar with Live Instant Suggestions Popup (Desktop & Tablet) */}
        <div ref={searchContainerRef} className="flex-1 min-w-0 max-w-xl xl:max-w-2xl hidden sm:block relative z-50 mx-2 lg:mx-4">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center border border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/10 rounded-full bg-slate-50/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-xs h-10 overflow-hidden"
          >
            <div className="pl-3.5 pr-1 text-slate-400 shrink-0 flex items-center">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={`Search products in ${tenantThemeName} (e.g. fresh fruits, milk, snacks)...`}
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsSearchFocused(false);
              }}
              className="flex-1 min-w-0 px-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full mr-1 cursor-pointer shrink-0 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              style={{ backgroundColor: tenantThemeColor }}
              className="h-full px-4 sm:px-6 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-opacity hover:opacity-95 shrink-0 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 hidden md:inline" />
              <span>Search</span>
            </button>
          </form>

          {renderLiveSearchDropdown()}
        </div>

        {/* Right Header Navigation Icons */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          
          {/* 🌙 / ☀️ Dark & Light Mode Toggle (Always Visible on Mobile & Desktop!) */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex items-center justify-center p-2 rounded-xl text-slate-700 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group shrink-0"
            title={isDarkMode ? "Switch to Light Mode ☀️" : "Switch to Dark Mode 🌙"}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:-rotate-12 transition-transform" />
            )}
            <span className="text-[10px] font-semibold hidden md:inline ml-1">
              {isDarkMode ? 'Light' : 'Dark'}
            </span>
          </button>

          {/* Offers (Desktop/Tablet) */}
          <button
            onClick={() => setIsOffersOpen(true)}
            className="hidden md:flex flex-col items-center text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors p-1.5 focus:outline-none cursor-pointer"
            title="Special Offers"
          >
            <Tag className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Offers</span>
          </button>

          {/* Customer Account / Sign In */}
          {customerUser ? (
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-1 pr-1.5 sm:pr-2.5">
              <button
                type="button"
                onClick={() => navigateTo('customer-portal')}
                className="flex items-center gap-1.5 text-left cursor-pointer"
                title="Customer Portal"
              >
                {customerUser.avatar ? (
                  <img
                    src={customerUser.avatar}
                    alt={customerUser.name}
                    className="w-7 h-7 rounded-full object-cover border"
                    style={{ borderColor: tenantThemeColor }}
                  />
                ) : (
                  <div
                    style={{ backgroundColor: tenantThemeColor }}
                    className="w-7 h-7 rounded-full text-white font-black text-xs flex items-center justify-center shadow-xs"
                  >
                    {customerUser.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block">
                  <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 block leading-tight truncate max-w-[90px]">
                    {customerUser.name.split(' ')[0]}
                  </span>
                  <span
                    style={{ color: tenantThemeColor }}
                    className="text-[9px] font-bold block leading-none"
                  >
                    Customer
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={logoutCustomer}
                className="hidden sm:inline text-[10px] text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer transition-colors"
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              style={{ color: tenantThemeColor, borderColor: `${tenantThemeColor}40` }}
              className="p-1.5 sm:px-3 sm:py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border rounded-xl sm:rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Sign In"
            >
              <User className="w-4 h-4" style={{ color: tenantThemeColor }} />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Wishlist (Desktop/Tablet) */}
          <button
            type="button"
            onClick={() => setIsWishlistOpen(true)}
            className="hidden sm:flex flex-col items-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors p-1.5 focus:outline-none relative cursor-pointer"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
            <span className="text-[10px] font-semibold hidden md:inline">Wishlist</span>
          </button>

          {/* Cart with Live Count */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2.5 p-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" style={{ color: tenantThemeColor }} />
              <span
                style={{ backgroundColor: tenantThemeColor }}
                className="absolute -top-2 -right-2 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
              >
                {totalCartCount}
              </span>
            </div>
            <div className="text-left hidden lg:block">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block leading-none">Cart</span>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 leading-none">
                {currency.symbol}{cartTotal}
              </span>
            </div>
          </button>

        </div>

      </div>

      {/* 1.3 Dedicated Mobile Sub-Bar: Quick Supermarket & Location Selection */}
      <div className="md:hidden flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-50/95 dark:bg-slate-800/95 border-t border-b border-slate-200/80 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div style={{ backgroundColor: tenantThemeColor }} className="w-5 h-5 rounded-md text-white flex items-center justify-center text-[10px] shrink-0 shadow-2xs font-bold">
            {tenantLogo}
          </div>
          <select
            value={currentTenant?.id || 'tenant-freshmart'}
            onChange={(e) => {
              const targetId = e.target.value;
              const chosen = nearbyStoreOptions.find((s) => s.id === targetId);
              if (chosen?.tenant) {
                if (selectStoreAndBranch) {
                  selectStoreAndBranch(chosen.tenant, chosen.nearestBranch);
                } else {
                  setCurrentTenant(chosen.tenant);
                }
              } else {
                const fallback = (tenants || []).find((t) => t.id === targetId);
                if (fallback) setCurrentTenant(fallback);
              }
            }}
            style={{ color: tenantThemeColor }}
            className="text-xs font-bold bg-transparent dark:bg-slate-800 focus:outline-none cursor-pointer truncate max-w-full"
          >
            {nearbyStoreOptions.map((s) => (
              <option key={s.id} value={s.id} className="text-slate-800 dark:text-slate-100 dark:bg-slate-800">
                {s.displayName || s.tenant?.displayName || s.tenant?.name || s.name}
                {s.distanceFormatted ? ` (${s.distanceFormatted})` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsLocationModalOpen(true)}
          className="flex items-center gap-1 min-w-0 max-w-[48%] shrink-0 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer text-left pl-2 border-l border-slate-200 dark:border-slate-700"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate font-semibold text-[11px]">
            {deliveryLocation?.address
              ? (deliveryLocation.label ? `${deliveryLocation.label}: ${deliveryLocation.address}` : deliveryLocation.address)
              : (deliveryLocation?.city || 'Faisalabad')}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
        </button>
      </div>

      {/* 1.5 Dedicated Mobile Search Bar Row (Prominent & full-width on mobile screens) */}
      <div className="sm:hidden px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div ref={mobileSearchContainerRef} className="relative z-40">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center border border-slate-200/90 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 rounded-full bg-slate-50 dark:bg-slate-800 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-2xs h-9 overflow-hidden"
          >
            <div className="pl-3 pr-1 text-slate-400 shrink-0 flex items-center">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder={`Search in ${tenantThemeName}...`}
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsSearchFocused(false);
              }}
              className="flex-1 min-w-0 px-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full mr-1 cursor-pointer shrink-0"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="submit"
              style={{ backgroundColor: tenantThemeColor }}
              className="h-full px-3.5 text-white text-xs font-bold transition-opacity hover:opacity-95 shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>

          {renderLiveSearchDropdown()}
        </div>
      </div>

      {/* 2. Secondary Navigation Links Bar (Unified across all landing pages) */}
      <nav className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 w-full">
          
          <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar py-2">
            
            {/* Main Nav Links */}
            <ul className="flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 shrink-0">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  style={{
                    color: currentPage === 'home' ? tenantThemeColor : undefined,
                    borderBottomColor: currentPage === 'home' ? tenantThemeColor : 'transparent'
                  }}
                  className={`transition-colors pb-1 cursor-pointer flex items-center gap-1.5 ${
                    currentPage === 'home'
                      ? 'font-bold border-b-2'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Home</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('all');
                    navigateTo('shop');
                  }}
                  style={{
                    color: currentPage === 'shop' ? tenantThemeColor : undefined,
                    borderBottomColor: currentPage === 'shop' ? tenantThemeColor : 'transparent'
                  }}
                  className={`transition-colors pb-1 cursor-pointer flex items-center gap-1.5 ${
                    currentPage === 'shop'
                      ? 'font-bold border-b-2'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Shop All</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('deals')}
                  style={{
                    color: currentPage === 'deals' ? tenantThemeColor : undefined,
                    borderBottomColor: currentPage === 'deals' ? tenantThemeColor : 'transparent'
                  }}
                  className={`transition-colors pb-1 cursor-pointer flex items-center gap-1 ${
                    currentPage === 'deals'
                      ? 'font-bold border-b-2'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Deals</span>
                  <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Hot
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsOrderTrackerOpen(true)}
                  className="transition-colors pb-1 cursor-pointer flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  title="Live Order Tracking with Real GPS Dispatch"
                >
                  <Bike className="w-4 h-4 text-amber-500" />
                  <span>Track Order</span>
                </button>
              </li>
            </ul>

          </div>

          {/* Quick Shortcuts: Customer Portal */}
          <div className="flex items-center gap-2 py-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (customerUser) {
                  navigateTo('customer-portal');
                } else {
                  setIsAuthOpen(true);
                }
              }}
              style={
                currentPage === 'customer-portal'
                  ? { backgroundColor: tenantThemeColor, color: '#ffffff' }
                  : { color: tenantThemeColor }
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                currentPage === 'customer-portal'
                  ? 'border-transparent shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer Portal</span>
            </button>
          </div>

        </div>
      </nav>

      {/* Modern Slide-Over Mobile Drawer (Overlaid backdrop + Side Sheet) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content Panel */}
          <aside className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col h-full animate-in slide-in-from-left duration-250 border-r border-slate-200 dark:border-slate-800">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  style={{ backgroundColor: tenantThemeColor }}
                  className="w-8 h-8 rounded-xl text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0"
                >
                  {tenantLogo}
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                    {tenantThemeName}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Fresh Grocery Delivery
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
                aria-label="Close Navigation Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {/* Theme Mode Switcher */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{isDarkMode ? '☀️' : '🌙'}</span>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Theme Mode</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Currently {isDarkMode ? 'Dark' : 'Light'} Mode
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  Tap to {isDarkMode ? 'Light' : 'Dark'}
                </span>
              </button>

              {/* Supermarket Switcher */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span>🏬</span> Select Supermarket:
                </span>
                <select
                  value={currentTenant?.id || 'tenant-freshmart'}
                  onChange={(e) => {
                    const targetId = e.target.value;
                    const chosen = nearbyStoreOptions.find((s) => s.id === targetId);
                    if (chosen?.tenant) {
                      if (selectStoreAndBranch) {
                        selectStoreAndBranch(chosen.tenant, chosen.nearestBranch);
                      } else {
                        setCurrentTenant(chosen.tenant);
                      }
                    } else {
                      const fallback = (tenants || []).find((t) => t.id === targetId);
                      if (fallback) setCurrentTenant(fallback);
                    }
                    setMobileMenuOpen(false);
                  }}
                  style={{ color: tenantThemeColor }}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none cursor-pointer"
                >
                  {nearbyStoreOptions.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-800 dark:text-slate-200 dark:bg-slate-900">
                      {s.displayName || s.tenant?.displayName || s.tenant?.name || s.name}
                      {s.distanceFormatted ? ` (${s.distanceFormatted})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Location Selector */}
              <button
                type="button"
                onClick={() => {
                  setIsLocationModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="text-left min-w-0">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Deliver to</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {deliveryLocation?.address
                        ? (deliveryLocation.label ? `${deliveryLocation.label}: ${deliveryLocation.address}` : `${deliveryLocation.address}, ${deliveryLocation.city}`)
                        : (deliveryLocation?.city || 'Faisalabad, Pakistan')}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* Navigation Links Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('home');
                    setMobileMenuOpen(false);
                  }}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <span>🏠</span> Home
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('all');
                    navigateTo('shop');
                    setMobileMenuOpen(false);
                  }}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <span>🛍️</span> Shop All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('deals');
                    setMobileMenuOpen(false);
                  }}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <span>⚡</span> Deals & Offers
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOrderTrackerOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <span>🛵</span> Track Order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('delivery');
                    setMobileMenuOpen(false);
                  }}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <span>🚚</span> Delivery Info
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOffersOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <span>🏷️</span> Store Offers
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (customerUser) {
                      navigateTo('customer-portal');
                    } else {
                      setIsAuthOpen(true);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer col-span-2"
                >
                  <span>👤</span> Customer Portal & Orders
                </button>
              </div>

              {/* Mobile Categories */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                  Browse Categories
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.id);
                        navigateTo('shop');
                        setMobileMenuOpen(false);
                      }}
                      className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}


    </header>
  );
};
