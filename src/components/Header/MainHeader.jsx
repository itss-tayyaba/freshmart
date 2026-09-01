import React, { useState, useRef, useEffect } from 'react';
import { Search, PhoneCall, User, Heart, ShoppingBag, Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PRODUCTS } from '../../data/groceryData';

export const MainHeader = () => {
  const {
    cart,
    wishlist,
    cartTotal,
    totalCartCount,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsAuthOpen,
    setIsMobileMenuOpen,
    setSelectedProductForQuickView,
    searchQuery,
    setSearchQuery,
    currency
  } = useStore();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  // Filter products based on live search query
  const searchResults = searchQuery.trim()
    ? PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#0b4d3c] text-white py-4 px-4 sm:px-8 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
        
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 text-white/90 hover:text-white rounded-lg hover:bg-emerald-800/60 focus:outline-none"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand Logo matching screenshot */}
        <a href="#" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md transform group-hover:scale-105 transition-transform duration-200">
            {/* Custom Shopping Cart + Leaf SVG */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-white fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              <path d="M12 2a4 4 0 0 1 4 4" stroke="#a3e635" strokeWidth="2.5"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white flex items-center gap-1">
              Grocery <span className="text-lime-400 font-extrabold">Shop</span>
            </span>
            <span className="text-[10px] text-emerald-200/80 font-medium tracking-wider uppercase mt-0.5">
              Organic & Fresh
            </span>
          </div>
        </a>

        {/* Center Live Search Bar Pill */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-xl mx-auto hidden md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Product..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full bg-white text-slate-800 placeholder-slate-400 text-sm rounded-full pl-5 pr-12 py-2.5 shadow-inner border border-transparent focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all"
            />
            <button
              onClick={() => {
                const element = document.getElementById('products-section');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Live Search Autocomplete Dropdown */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-dropdown border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Matching Products ({searchResults.length})</span>
                {searchResults.length > 0 && (
                  <span className="text-emerald-700 font-semibold">Press Enter to view all</span>
                )}
              </div>

              {searchResults.length > 0 ? (
                <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedProductForQuickView(item);
                        setIsSearchFocused(false);
                      }}
                      className="p-3 hover:bg-emerald-50/50 flex items-center gap-3 cursor-pointer transition-colors group"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                            {item.categoryLabel}
                          </span>
                          {item.isOrganic && (
                            <span className="text-[10px] font-semibold text-lime-700 bg-lime-100 px-1.5 py-0.5 rounded">
                              Organic
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors mt-0.5">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-emerald-800">
                            {currency.symbol}{(item.price * currency.rate).toFixed(2)}
                          </span>
                          <span className="text-slate-400 line-through text-[11px]">
                            {currency.symbol}{(item.originalPrice * currency.rate).toFixed(2)}
                          </span>
                          <span className="text-slate-400">• {item.unit}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForQuickView(item);
                          setIsSearchFocused(false);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No fresh products found for "{searchQuery}". Try searching "Orange", "Pepper", or "Salmon".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          
          {/* Phone Hotline widget matching screenshot */}
          <a
            href="tel:880143465768"
            className="hidden xl:flex items-center gap-3 text-left group hover:opacity-90 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full border border-emerald-400/40 flex items-center justify-center bg-emerald-800/40 text-emerald-300 group-hover:bg-emerald-400 group-hover:text-emerald-950 transition-all duration-200">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-emerald-200/90 font-normal leading-tight">
                Call for any Information
              </div>
              <div className="text-sm font-bold text-white tracking-wide">
                88 01434 65768
              </div>
            </div>
          </a>

          {/* User Account Button */}
          <button
            onClick={() => setIsAuthOpen(true)}
            className="p-2 rounded-full hover:bg-emerald-800/70 text-slate-200 hover:text-white transition-colors focus:outline-none relative group"
            aria-label="User Account"
            title="My Account"
          >
            <User className="w-5 h-5" />
            <span className="sr-only">Account</span>
          </button>

          {/* Wishlist Button with Counter Badge */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="p-2 rounded-full hover:bg-emerald-800/70 text-slate-200 hover:text-white transition-colors focus:outline-none relative group"
            aria-label="Wishlist"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[11px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-pulse-slow">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Shopping Cart Button with Badge & Total matching screenshot */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-emerald-800/70 transition-colors focus:outline-none group"
            aria-label="Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-slate-200 group-hover:text-white transition-colors" />
              <span className="absolute -top-2 -right-2 bg-brand-accent text-white text-[11px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {totalCartCount}
              </span>
            </div>
            <span className="hidden sm:inline font-bold text-sm text-lime-400">
              {currency.symbol}{(cartTotal * currency.rate).toFixed(2)}
            </span>
          </button>
        </div>

      </div>

      {/* Mobile Search input */}
      <div className="mt-3 md:hidden">
        <div className="relative">
          <input
            type="text"
            placeholder="Search fresh groceries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs rounded-full pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>
    </header>
  );
};
