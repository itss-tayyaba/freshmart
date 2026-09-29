import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  Menu,
  X,
  User,
  Heart,
  ShoppingCart,
  MapPin,
  Store,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CASE_VALUE_CATEGORIES = [
  { id: 'fruits-veg', name: 'Fruits & Vegetables', icon: '🍊', desc: 'Fresh farm harvests' },
  { id: 'dairy-eggs', name: 'Dairy & Eggs', icon: '🥛', desc: 'Pure milk, cheese & eggs' },
  { id: 'bakery', name: 'Bakery', icon: '🍞', desc: 'Oven fresh loaves & buns' },
  { id: 'snacks', name: 'Snacks & Biscuits', icon: '🍪', desc: 'Munchies & cookies' },
  { id: 'beverages', name: 'Beverages', icon: '🧃', desc: 'Juices, teas & soft drinks' },
  { id: 'cleaning', name: 'Household', icon: '🏠', desc: 'Cleaning & paper essentials' },
  { id: 'personal-care', name: 'Personal Care', icon: '🧴', desc: 'Soaps, haircare & hygiene' },
  { id: 'meat-poultry', name: 'Meat & Seafood', icon: '🥩', desc: 'Butcher cuts & prime beef' }
];

export const CaseValueHeader = () => {
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
    setIsLocationModalOpen,
    deliveryLocation,
    customerUser,
    tenants,
    currentTenant,
    setCurrentTenant,
    currency,
    products,
    setActiveCategory
  } = useStore();

  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchRef = useRef(null);
  const categoryMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setIsCategoryMenuOpen(false);
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
    <header className="sticky top-0 z-40 bg-[#fbf7f0] border-b border-[#ebdcc7] shadow-xs font-sans transition-all">
      
      {/* 🌟 Top Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Left: Brand Logo matching screenshot (Local Grocery / Case Value) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden p-2 text-[#5c3417] hover:bg-[#f3ead9] rounded-xl transition cursor-pointer"
            aria-label="Open mobile menu"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#eedec8] border border-[#d6c1a5] flex items-center justify-center text-[#5c3417] shadow-xs group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-2xl font-black tracking-tight text-[#3d2314] leading-none">
                  Local Grocery
                </span>
                <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#eedec8] text-[#5c3417] border border-[#d6c1a5]">
                  Case Value
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#78604d] font-semibold block mt-0.5 tracking-wide">
                Fresh • Local • Reliable
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Links matching screenshot */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-[#4a2e1b]">
          <button
            onClick={() => navigateTo('home')}
            className="hover:text-[#8c532b] transition-colors cursor-pointer py-1"
          >
            Home
          </button>

          {/* Categories Dropdown */}
          <div ref={categoryMenuRef} className="relative">
            <button
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              className="hover:text-[#8c532b] flex items-center gap-1 transition-colors cursor-pointer py-1"
            >
              <span>Categories</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-[#fdfaf4] border border-[#ebdcc7] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-150">
                <div className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#8c7462] border-b border-[#f0e6d6]">
                  Browse Departments
                </div>
                {CASE_VALUE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      navigateTo('shop');
                      setIsCategoryMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-[#4a2e1b] hover:bg-[#f4ebe0] hover:text-[#5c3417] transition flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                    <span className="text-[10px] text-[#a08875]">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => navigateTo('shop')}
            className="hover:text-[#8c532b] transition-colors cursor-pointer py-1"
          >
            Shop All
          </button>

          <button
            onClick={() => navigateTo('deals')}
            className="hover:text-[#8c532b] transition-colors cursor-pointer py-1"
          >
            Deals & Offers
          </button>

          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="hover:text-[#8c532b] transition-colors cursor-pointer py-1 flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5 text-[#8c532b]" />
            <span>Stores</span>
          </button>

          <button
            onClick={() => navigateTo('delivery')}
            className="hover:text-[#8c532b] transition-colors cursor-pointer py-1"
          >
            Contact
          </button>
        </nav>

        {/* Right Section: Search Pill, Store Switcher, Account, Wishlist, Cart */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          
          {/* Pill Search Bar matching screenshot */}
          <div ref={searchRef} className="relative hidden md:block w-48 lg:w-64">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 text-[#8c7462] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                className="w-full pl-9 pr-4 py-2 bg-white/90 hover:bg-white text-xs text-[#3d2314] placeholder-[#8c7462] border border-[#ebdcc7] rounded-full focus:outline-none focus:border-[#8c532b] focus:ring-1 focus:ring-[#8c532b] transition shadow-2xs font-medium"
              />
            </form>

            {/* Live Search Suggestions */}
            {isSearchFocused && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#fdfaf4] rounded-2xl shadow-xl border border-[#ebdcc7] overflow-hidden z-50 text-[#3d2314]">
                <div className="p-2 border-b border-[#f0e6d6] text-[10px] font-black uppercase tracking-wider text-[#8c7462]">
                  Case Value Products
                </div>
                {searchSuggestions.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      navigateTo('shop');
                      setIsSearchFocused(false);
                    }}
                    className="p-2.5 hover:bg-[#f4ebe0] flex items-center justify-between gap-3 cursor-pointer border-b border-[#f5ede2] last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <span className="text-xs font-bold text-[#3d2314] block leading-tight">{prod.name}</span>
                        <span className="text-[10px] text-[#8c7462]">{prod.categoryLabel}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#5c3417]">
                      {currency?.symbol || 'Rs. '}{prod.price}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supermarket Branch Switcher Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4ebe0] border border-[#ebdcc7] shadow-2xs text-[#4a2e1b]">
            <Store className="w-3.5 h-3.5 text-[#8c532b]" />
            <span className="text-[10px] font-black uppercase text-[#8c532b]">Store:</span>
            <select
              value={currentTenant?.id || 'tenant-chasevalue'}
              onChange={(e) => {
                const target = (tenants || []).find((t) => t.id === e.target.value);
                if (target) setCurrentTenant(target);
              }}
              className="text-xs font-bold text-[#3d2314] bg-transparent focus:outline-none cursor-pointer"
            >
              {(tenants || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName || t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Profile Button */}
          <button
            onClick={() => {
              if (customerUser) {
                navigateTo('customer-portal');
              } else {
                setIsAuthOpen(true);
              }
            }}
            className="p-2 sm:p-2.5 rounded-full bg-white border border-[#ebdcc7] text-[#5c3417] hover:bg-[#f4ebe0] transition cursor-pointer shadow-2xs"
            title="My Account"
          >
            <User className="w-4 h-4" />
          </button>

          {/* Wishlist Button */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="relative p-2 sm:p-2.5 rounded-full bg-white border border-[#ebdcc7] text-[#5c3417] hover:bg-[#f4ebe0] transition cursor-pointer shadow-2xs"
            title="Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8c532b] text-white text-[9px] font-black flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button matching screenshot (Dark Mocha Circle Badge) */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-[#ebdcc7] hover:bg-[#f4ebe0] text-[#3d2314] transition cursor-pointer shadow-2xs group"
          >
            <ShoppingCart className="w-4 h-4 text-[#5c3417] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-xs font-bold text-[#5c3417]">
              {currency?.symbol || 'Rs. '}{cartTotal}
            </span>
            <span className="w-5 h-5 rounded-full bg-[#5c3417] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
              {totalCartCount}
            </span>
          </button>

        </div>

      </div>

      {/* 📱 Mobile Drawer Menu */}
      {mobileNavOpen && (
        <div className="lg:hidden bg-[#fbf7f0] border-t border-[#ebdcc7] p-4 space-y-4 animate-in slide-in-from-top-2">
          
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-xs bg-white border border-[#ebdcc7] rounded-full px-4 py-2 text-[#3d2314] focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#5c3417] text-white rounded-full text-xs font-bold shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Mobile Store Switcher */}
          <div className="p-3 bg-[#f4ebe0] rounded-2xl border border-[#ebdcc7] flex items-center justify-between">
            <span className="text-xs font-bold text-[#4a2e1b] flex items-center gap-1.5">
              <Store className="w-4 h-4 text-[#8c532b]" /> Switch Store:
            </span>
            <select
              value={currentTenant?.id || 'tenant-chasevalue'}
              onChange={(e) => {
                const target = (tenants || []).find((t) => t.id === e.target.value);
                if (target) setCurrentTenant(target);
                setMobileNavOpen(false);
              }}
              className="text-xs font-bold text-[#5c3417] bg-white border border-[#ebdcc7] rounded-xl px-2.5 py-1 focus:outline-none"
            >
              {(tenants || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              onClick={() => {
                navigateTo('home');
                setMobileNavOpen(false);
              }}
              className="p-2.5 bg-white border border-[#ebdcc7] rounded-xl text-left text-[#4a2e1b] hover:bg-[#f4ebe0]"
            >
              🏠 Home
            </button>
            <button
              onClick={() => {
                navigateTo('shop');
                setMobileNavOpen(false);
              }}
              className="p-2.5 bg-white border border-[#ebdcc7] rounded-xl text-left text-[#4a2e1b] hover:bg-[#f4ebe0]"
            >
              🛍️ Shop All
            </button>
            <button
              onClick={() => {
                navigateTo('deals');
                setMobileNavOpen(false);
              }}
              className="p-2.5 bg-white border border-[#ebdcc7] rounded-xl text-left text-[#4a2e1b] hover:bg-[#f4ebe0]"
            >
              🏷️ Deals & Offers
            </button>
            <button
              onClick={() => {
                setIsLocationModalOpen(true);
                setMobileNavOpen(false);
              }}
              className="p-2.5 bg-white border border-[#ebdcc7] rounded-xl text-left text-[#4a2e1b] hover:bg-[#f4ebe0]"
            >
              📍 Stores & Locations
            </button>
          </div>

          {/* Categories Quick Links */}
          <div className="border-t border-[#ebdcc7] pt-3">
            <div className="text-[11px] font-black uppercase text-[#8c7462] mb-2">Departments</div>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-[#5c3417]">
              {CASE_VALUE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCategory(c.id);
                    navigateTo('shop');
                    setMobileNavOpen(false);
                  }}
                  className="p-2 rounded-lg text-left hover:bg-[#f4ebe0] flex items-center gap-1.5"
                >
                  <span>{c.icon}</span>
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

    </header>
  );
};
