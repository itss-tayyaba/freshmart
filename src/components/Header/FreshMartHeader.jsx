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
  Bike,
  Truck
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
    categories
  } = useStore();

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
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setIsCategoryDropdownOpen(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
        
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg shrink-0"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo dynamically reflecting Al-Fatah or Chase Up */}
        <div
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group shrink-0"
        >
          <div
            style={{ backgroundColor: tenantThemeColor }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform text-lg"
          >
            {tenantLogo}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none text-slate-900 flex items-center">
              {tenantThemeName}
            </h1>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5 tracking-wider truncate max-w-[150px] sm:max-w-[200px]">
              {tenantTagline}
            </span>
          </div>
        </div>

        {/* Location Picker displaying active address */}
        <div
          onClick={() => setIsLocationModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer transition-colors shrink-0 max-w-[180px] lg:max-w-[230px]"
          title={deliveryLocation?.address ? `${deliveryLocation.address}, ${deliveryLocation.city}` : (deliveryLocation?.city || 'Lahore, Pakistan')}
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">
              Deliver to
            </span>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate">
                {deliveryLocation?.address
                  ? (deliveryLocation.label ? `${deliveryLocation.label}: ${deliveryLocation.address}` : deliveryLocation.address)
                  : (deliveryLocation?.city || 'Lahore, Pakistan')}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* 🏬 Multi-Tenant Supermarket Switcher */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 transition shrink-0">
          <div style={{ backgroundColor: tenantThemeColor }} className="w-7 h-7 rounded-lg text-white flex items-center justify-center text-xs shadow-xs shrink-0">
            {tenantLogo}
          </div>
          <div className="text-left leading-tight">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">
              Supermarket
            </span>
            <div className="flex items-center">
              <select
                value={currentTenant?.id || 'tenant-freshmart'}
                onChange={(e) => {
                  const target = (tenants || []).find((t) => t.id === e.target.value);
                  if (target) setCurrentTenant(target);
                }}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {(tenants || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.displayName || t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Bar with Live Instant Suggestions Popup */}
        <div ref={searchContainerRef} className="flex-1 min-w-0 max-w-xl hidden sm:block relative z-50 mx-1 sm:mx-2">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center border border-slate-200 rounded-full overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:bg-white focus-within:border-transparent transition-all shadow-inner"
          >
            <div className="pl-3.5 text-slate-400 shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search products in stock..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              className="flex-1 min-w-0 px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full mr-1 cursor-pointer shrink-0"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              style={{ backgroundColor: tenantThemeColor }}
              className="px-4 sm:px-6 py-2 sm:py-2.5 text-white text-xs sm:text-sm font-bold transition-opacity hover:opacity-90 shrink-0 cursor-pointer"
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
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
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
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-2xl p-1 pr-2.5">
              <button
                type="button"
                onClick={() => navigateTo('customer-portal')}
                className="flex items-center gap-2 text-left cursor-pointer"
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
                  <span className="text-[11px] font-black text-slate-900 block leading-tight truncate max-w-[90px]">
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
                className="text-[10px] text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer transition-colors"
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
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" style={{ color: tenantThemeColor }} />
              <span>Sign In</span>
            </button>
          )}

          {/* Wishlist */}
          <button
            type="button"
            onClick={() => setIsWishlistOpen(true)}
            className="flex flex-col items-center text-slate-600 hover:text-slate-900 transition-colors p-1.5 focus:outline-none relative cursor-pointer"
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
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-900 border border-slate-200/80 transition-colors cursor-pointer"
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
              <span className="text-[10px] font-semibold text-slate-500 block leading-none">Cart</span>
              <span className="text-xs font-black text-slate-900 leading-none">
                {currency.symbol}{cartTotal}
              </span>
            </div>
          </button>

        </div>

      </div>

      {/* 2. Secondary Navigation Links Bar (Unified across all landing pages) */}
      <nav className="border-t border-slate-100 bg-white shadow-2xs overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 w-full">
          
          <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar py-2">
            
            {/* Departments Dropdown */}
            <div ref={categoryDropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                style={{ backgroundColor: tenantThemeColor }}
                className="flex items-center gap-2 px-3.5 py-1.5 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:opacity-95 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Departments</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                    <span>Shop by Department</span>
                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{categoriesList.length} Categories</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1 divide-y divide-slate-50">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory('all');
                        navigateTo('shop');
                        setIsCategoryDropdownOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span>🏬</span> All Departments
                      </span>
                      <span className="text-[10px] text-slate-400">Full Catalog</span>
                    </button>
                    {categoriesList.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setActiveCategory(cat.id);
                          navigateTo('shop');
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between transition-colors group"
                      >
                        <span className="group-hover:font-bold truncate">{cat.name}</span>
                        {cat.itemCount && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {cat.itemCount} items
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Nav Links */}
            <ul className="flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-700 shrink-0">
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
                      : 'text-slate-600 hover:text-slate-900'
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
                      : 'text-slate-600 hover:text-slate-900'
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
                      : 'text-slate-600 hover:text-slate-900'
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
                  className="transition-colors pb-1 cursor-pointer flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
                  title="Live Order Tracking with Real GPS Dispatch"
                >
                  <Bike className="w-4 h-4 text-amber-500" />
                  <span>Track Order</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('delivery')}
                  style={{
                    color: currentPage === 'delivery' ? tenantThemeColor : undefined,
                    borderBottomColor: currentPage === 'delivery' ? tenantThemeColor : 'transparent'
                  }}
                  className={`transition-colors pb-1 cursor-pointer flex items-center gap-1.5 ${
                    currentPage === 'delivery'
                      ? 'font-bold border-b-2'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Delivery Info</span>
                </button>
              </li>
            </ul>

          </div>

          {/* Quick Shortcuts: Customer Portal & Admin Portal */}
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
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer Portal</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('admin')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs cursor-pointer"
              title="Admin & Multi-Store Management Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Admin</span>
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
              placeholder="Search products in stock..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
            />
            <button
              type="submit"
              style={{ backgroundColor: tenantThemeColor }}
              className="px-4 py-2 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Mobile Supermarket Switcher */}
          <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>🏬</span> Supermarket:
            </span>
            <select
              value={currentTenant?.id || 'tenant-freshmart'}
              onChange={(e) => {
                const target = (tenants || []).find((t) => t.id === e.target.value);
                if (target) setCurrentTenant(target);
                setMobileMenuOpen(false);
              }}
              style={{ color: tenantThemeColor }}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              {(tenants || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName || t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Location Selector */}
          <button
            type="button"
            onClick={() => {
              setIsLocationModalOpen(true);
              setMobileMenuOpen(false);
            }}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50"
          >
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-500 shrink-0">Deliver to:</span>
              <span className="font-bold text-slate-800 truncate">
                {deliveryLocation?.address
                  ? (deliveryLocation.label ? `${deliveryLocation.label}: ${deliveryLocation.address}` : `${deliveryLocation.address}, ${deliveryLocation.city}`)
                  : (deliveryLocation?.city || 'Lahore, Pakistan')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Navigation Links Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                navigateTo('home');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
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
              className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <span>🛍️</span> Shop All
            </button>
            <button
              type="button"
              onClick={() => {
                navigateTo('deals');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <span>⚡</span> Deals & Offers
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOrderTrackerOpen(true);
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <span>🛵</span> Track Order
            </button>
            <button
              type="button"
              onClick={() => {
                navigateTo('delivery');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <span>🚚</span> Delivery Info
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOffersOpen(true);
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
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
              className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2 font-bold text-slate-800 cursor-pointer"
            >
              <span>👤</span> Customer Portal
            </button>
            <button
              type="button"
              onClick={() => {
                navigateTo('admin');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-slate-900 text-white rounded-xl text-left hover:bg-slate-800 flex items-center gap-2 font-bold shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Admin Portal
            </button>
          </div>

          {/* Mobile Shop by Department */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Browse Departments
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    navigateTo('shop');
                    setMobileMenuOpen(false);
                  }}
                  className="text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}


    </header>
  );
};
