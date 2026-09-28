import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Search,
  ChevronDown,
  Menu,
  X,
  User,
  Heart,
  ShoppingCart,
  Store,
  Sparkles,
  MapPin,
  ExternalLink,
  Palette,
  Check
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const UNIMAART_PALETTES = [
  { id: 'sapphire', name: 'Royal Sapphire Blue', primary: '#0284c7', dark: '#0369a1', badge: 'Default' },
  { id: 'classic-teal', name: 'Classic Fresh Teal', primary: '#00a676', dark: '#008f65', badge: 'Teal' },
  { id: 'deep-navy', name: 'Deep Royal Navy', primary: '#1e40af', dark: '#1e3a8a', badge: 'Navy' },
  { id: 'emerald', name: 'Farm-Fresh Emerald', primary: '#059669', dark: '#047857', badge: 'Farm' },
  { id: 'amethyst', name: 'Royal Amethyst', primary: '#7c3aed', dark: '#6d28d9', badge: 'Luxury' },
  { id: 'sunset', name: 'Sunset Tangerine', primary: '#ea580c', dark: '#c2410c', badge: 'Warm' },
];

export const UnimaartHeader = () => {
  const {
    navigateTo,
    searchQuery,
    setSearchQuery,
    wishlistCount,
    setIsWishlistOpen,
    totalCartCount,
    cartTotal,
    setIsCartOpen,
    setIsAuthOpen,
    customerUser,
    tenants,
    currentTenant,
    setCurrentTenant,
    currency,
    products,
    setActiveCategory,
    addToast
  } = useStore();

  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [selectedSearchCat, setSelectedSearchCat] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchRef = useRef(null);
  const themeRef = useRef(null);

  // Theme palette state (Default: Royal Sapphire Blue #0284c7)
  const [selectedPalette, setSelectedPalette] = useState(() => {
    try {
      const saved = localStorage.getItem('unimaart_theme_palette');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return UNIMAART_PALETTES[0]; // Royal Sapphire Blue
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const handleSelectPalette = (palette) => {
    setSelectedPalette(palette);
    try {
      localStorage.setItem('unimaart_theme_palette', JSON.stringify(palette));
    } catch (e) {
      // ignore
    }
    setIsThemeMenuOpen(false);
    addToast('Theme Updated 🎨', `Switched Unimaart theme to ${palette.name}`);
  };

  // Close search suggestions and theme menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearchFocused(false);
    navigateTo('shop');
  };

  const trimmed = (searchQuery || '').trim().toLowerCase();
  const searchSuggestions = trimmed && Array.isArray(products)
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          (p.categoryLabel && p.categoryLabel.toLowerCase().includes(trimmed))
      ).slice(0, 5)
    : [];

  return (
    <header style={{ backgroundColor: selectedPalette.primary }} className="sticky top-0 z-40 bg-[#0284c7] text-white shadow-md transition-colors duration-200">
      
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR ROW (LOGO, LINKS, PHONE PILL, SOCIALS) */}
      {/* ========================================================================= */}
      <div style={{ borderColor: selectedPalette.dark }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 border-b border-[#0369a1]">
        
        {/* Left Brand Logo matching screenshot */}
        <div
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 cursor-pointer select-none group shrink-0"
        >
          <div style={{ color: selectedPalette.primary }} className="w-9 h-9 rounded-xl bg-white text-[#0284c7] flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-105 transition-transform">
            🛒
          </div>
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
            Unimaart
          </span>
        </div>

        {/* Center Main Navigation Links matching screenshot */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-white/90">
          <button
            onClick={() => navigateTo('home')}
            className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer py-1"
          >
            <span>Home</span>
            <ChevronDown className="w-3 h-3 text-white/70" />
          </button>

          <button
            onClick={() => navigateTo('shop')}
            className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer py-1"
          >
            <span>Pages</span>
            <ChevronDown className="w-3 h-3 text-white/70" />
          </button>

          <button
            onClick={() => navigateTo('shop')}
            className="hover:text-white transition-colors cursor-pointer py-1"
          >
            <span>Shop All</span>
          </button>

          <button
            onClick={() => navigateTo('shop')}
            className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer py-1"
          >
            <span>Categories</span>
            <ChevronDown className="w-3 h-3 text-white/70" />
          </button>

          <button
            onClick={() => navigateTo('deals')}
            className="hover:text-white transition-colors cursor-pointer py-1"
          >
            <span>Deals & Offers</span>
          </button>

          <button
            onClick={() => navigateTo('delivery')}
            className="hover:text-white transition-colors cursor-pointer py-1"
          >
            <span>Contact</span>
          </button>
        </nav>

        {/* Right Section: Phone Pill & Social Icons matching screenshot */}
        <div className="flex items-center gap-3">
          
          {/* Phone Number Pill */}
          <div style={{ backgroundColor: selectedPalette.dark }} className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0369a1] border border-white/20 text-white text-xs font-bold shadow-2xs">
            <Phone className="w-3.5 h-3.5 text-white" />
            <span>Phone Number +9870-256-679</span>
          </div>

          {/* Social Icons matching screenshot (Facebook, Pinterest, Instagram, TikTok) */}
          <div className="hidden xl:flex items-center gap-1.5">
            {['f', 'p', 'in', 'tk'].map((iconName) => (
              <span
                key={iconName}
                className="w-6 h-6 rounded-full border border-white/30 hover:border-white text-[10px] font-bold text-white flex items-center justify-center cursor-pointer transition-colors hover:bg-white/10"
              >
                {iconName === 'f' && 'f'}
                {iconName === 'p' && 'P'}
                {iconName === 'in' && 'ig'}
                {iconName === 'tk' && '♪'}
              </span>
            ))}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            style={{ backgroundColor: selectedPalette.dark }}
            className="lg:hidden p-1.5 rounded-lg bg-[#0369a1] text-white hover:opacity-90 transition-colors"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. SECONDARY SEARCH & ACTION ROW (ALL CATEGORIES, SEARCH PILL, UTILITIES) */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: "ALL CATEGORIES" Button matching screenshot */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
            className="bg-white hover:bg-slate-50 text-slate-900 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2.5 shadow-sm transition-all cursor-pointer"
          >
            <Menu className="w-4 h-4 text-slate-800" />
            <span className="uppercase tracking-wider">ALL CATEGORIES</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Categories Dropdown Menu */}
          {isCategoryMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-slate-800 animate-in fade-in duration-150">
              {[
                { id: 'fruits-veg', name: 'Vegetables & Fruit' },
                { id: 'dairy-eggs', name: 'Milk & Dairies' },
                { id: 'beverages', name: 'Beverages' },
                { id: 'meat-poultry', name: 'Meats & Seafood' },
                { id: 'frozen-foods', name: 'Frozen Foods' },
                { id: 'bakery', name: 'Breakfast & Bakery' },
                { id: 'snacks', name: 'Snacks & Munchies' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCategory(c.id);
                    navigateTo('shop');
                    setIsCategoryMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:text-[#0284c7] hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <span>{c.name}</span>
                  <span className="text-[10px] text-slate-400">→</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Search Bar with "All Categories" selector + Yellow Search Button */}
        <div ref={searchRef} className="flex-1 max-w-2xl relative z-40 hidden md:block">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center bg-white rounded-xl overflow-hidden shadow-sm p-1"
          >
            {/* Category Dropdown Selector inside Search */}
            <div className="border-r border-slate-200 px-3 py-1 flex items-center gap-1 shrink-0">
              <select
                value={selectedSearchCat}
                onChange={(e) => setSelectedSearchCat(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">All Categories</option>
                <option value="fruits-veg">Vegetables & Fruit</option>
                <option value="dairy-eggs">Milk & Dairies</option>
                <option value="beverages">Beverages</option>
                <option value="meat-poultry">Meats & Seafood</option>
                <option value="frozen-foods">Frozen Foods</option>
              </select>
            </div>

            {/* Input field */}
            <input
              type="text"
              placeholder="Type Your Products ..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              className="flex-1 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none font-medium"
            />

            {/* Yellow/Amber Search Button matching screenshot */}
            <button
              type="submit"
              className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-black px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <span>Search</span>
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </form>

          {/* Live Search Suggestions Dropdown */}
          {isSearchFocused && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 text-slate-800">
              <div className="p-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Matching Market Products
              </div>
              {searchSuggestions.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    navigateTo('shop');
                    setIsSearchFocused(false);
                  }}
                  className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer border-b border-slate-50 last:border-b-0"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">{prod.name}</span>
                      <span className="text-[10px] text-slate-400">{prod.categoryLabel}</span>
                    </div>
                  </div>
                  <span style={{ color: selectedPalette.primary }} className="text-xs font-black text-[#0284c7]">
                    {currency?.symbol || 'Rs. '}{prod.price}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Utility Buttons: Store Switcher, Accounts, Wishlist, Cart */}
        <div className="flex items-center gap-3 ml-auto">
          
          {/* Multi-Tenant Supermarket Switcher (Allows testing/switching branches) */}
          <div
            style={{ backgroundColor: selectedPalette.dark }}
            className="flex items-center gap-1.5 bg-[#0369a1] border border-white/25 rounded-xl px-2.5 py-1.5 shadow-2xs"
          >
            <Store className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="text-[10px] font-bold text-white/80 hidden xl:inline">Branch:</span>
            <select
              value={currentTenant?.id || 'tenant-freshmart'}
              onChange={(e) => {
                const target = (tenants || []).find((t) => t.id === e.target.value);
                if (target) {
                  setCurrentTenant(target);
                  addToast('Store Changed 🏬', `Switched to ${target.name}`);
                }
              }}
              className="text-xs font-black text-white bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              {(tenants || []).map((t) => (
                <option key={t.id} value={t.id} className="text-slate-900 bg-white font-bold">
                  {t.displayName || t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Admin Dashboard Quick Access Button */}
          <button
            onClick={() => navigateTo('admin')}
            className="flex items-center gap-1.5 text-xs font-black text-amber-300 hover:text-amber-200 bg-black/25 hover:bg-black/35 px-3 py-1.5 rounded-xl border border-amber-300/40 shadow-xs transition-all cursor-pointer"
            title="Open Unimaart Store Admin Dashboard"
          >
            <span>⚡ Admin</span>
          </button>

          {/* Unimaart Theme Palette Switcher */}
          <div ref={themeRef} className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-black/20 hover:bg-black/30 px-2.5 py-1.5 rounded-xl border border-white/20 shadow-2xs transition-all cursor-pointer"
              title="Change Unimaart Color Theme"
            >
              <Palette className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xl:inline text-[11px] font-bold">Theme</span>
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/60 shadow-xs shrink-0"
                style={{ backgroundColor: selectedPalette.primary }}
              />
            </button>

            {/* Dropdown Menu for Theme Palettes */}
            {isThemeMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 text-slate-800 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-black text-slate-900 tracking-tight">Unimaart Color Theme</span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                    {selectedPalette.badge || 'Active'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {UNIMAART_PALETTES.map((palette) => {
                    const isSelected = selectedPalette.id === palette.id;
                    return (
                      <button
                        key={palette.id}
                        onClick={() => handleSelectPalette(palette)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-100 ring-1 ring-slate-300 text-slate-900 font-black'
                            : 'hover:bg-slate-50 text-slate-700 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-5 h-5 rounded-full shadow-sm shrink-0 border border-black/10 flex items-center justify-center text-[10px] text-white"
                            style={{ backgroundColor: palette.primary }}
                          >
                            {isSelected && '✓'}
                          </span>
                          <div>
                            <span className="text-xs block leading-tight">{palette.name}</span>
                            <span className="text-[10px] text-slate-400 block">{palette.primary}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Accounts Button matching screenshot */}
          <button
            onClick={() => {
              if (customerUser) {
                navigateTo('customer-portal');
              } else {
                setIsAuthOpen(true);
              }
            }}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-white hover:text-white/80 transition-colors cursor-pointer py-1"
          >
            <User className="w-4 h-4 text-white" />
            <span>Accounts</span>
          </button>

          {/* Wishlist Icon with count badge matching screenshot */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="relative p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
            title="Wishlist"
          >
            <Heart className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {wishlistCount || 0}
            </span>
          </button>

          {/* Cart Icon with count badge matching screenshot */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
            title="Cart"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {totalCartCount || 0}
            </span>
          </button>

        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileNavOpen && (
        <div style={{ backgroundColor: selectedPalette.dark }} className="lg:hidden bg-[#0369a1] border-t border-white/20 p-4 space-y-3 animate-in slide-in-from-top duration-200">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-white rounded-xl p-1 shadow-sm">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none"
            />
            <button type="submit" className="bg-[#f59e0b] text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs">
              Search
            </button>
          </form>

          {/* Mobile Links */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-2">
            <button onClick={() => { navigateTo('home'); setMobileNavOpen(false); }} className="p-2 text-left bg-white/10 rounded-xl">Home</button>
            <button onClick={() => { navigateTo('shop'); setMobileNavOpen(false); }} className="p-2 text-left bg-white/10 rounded-xl">Shop All</button>
            <button onClick={() => { navigateTo('deals'); setMobileNavOpen(false); }} className="p-2 text-left bg-white/10 rounded-xl">Deals & Offers</button>
            <button onClick={() => { navigateTo('delivery'); setMobileNavOpen(false); }} className="p-2 text-left bg-white/10 rounded-xl">Delivery</button>
            <button onClick={() => { navigateTo('admin'); setMobileNavOpen(false); }} className="p-2 text-left bg-amber-400 text-slate-950 font-black rounded-xl col-span-2 flex items-center justify-between">
              <span>Market Store Admin</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </header>
  );
};
