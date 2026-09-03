import React from 'react';
import { X, Sparkles, Truck, Heart, ShoppingBag, User, PhoneCall, Mail } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { CATEGORIES_SIDEBAR } from '../../data/groceryData';

export const MobileNav = () => {
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    setIsOffersOpen,
    setIsOrderTrackerOpen,
    setIsWishlistOpen,
    setIsCartOpen,
    setIsAuthOpen,
    setActiveCategory,
    categories
  } = useStore();

  if (!isMobileMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Slide-out Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl z-50 flex flex-col overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-4 bg-brand-green text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black">
              Grocery <span className="text-lime-400">Shop</span>
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-white/90 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Badges */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsOffersOpen(true);
            }}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100 hover:bg-rose-100"
          >
            <Sparkles className="w-4 h-4 fill-rose-600" />
            <span>Offers & Deals</span>
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsOrderTrackerOpen(true);
            }}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100 hover:bg-emerald-100"
          >
            <Truck className="w-4 h-4 text-emerald-700" />
            <span>Track Order</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="p-4 border-b border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-brand-green bg-emerald-50/70 rounded-lg"
            >
              Home
            </a>
            <a
              href="#products-section"
              onClick={() => {
                setActiveCategory('all');
                setIsMobileMenuOpen(false);
              }}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:text-brand-green rounded-lg"
            >
              Shop All Products
            </a>
            <a
              href="#flash-deals-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:text-brand-green rounded-lg"
            >
              Daily Flash Deals
            </a>
            <a
              href="#footer-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:text-brand-green rounded-lg"
            >
              Contact Us
            </a>
          </nav>
        </div>

        {/* Categories List */}
        <div className="p-4 border-b border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Top Categories
          </p>
          <div className="space-y-1">
            {(categories || []).map((cat) => {
              const catId = cat.id || cat._id;
              return (
                <button
                  key={catId}
                  onClick={() => {
                    setActiveCategory(catId);
                    setIsMobileMenuOpen(false);
                    const el = document.getElementById('products-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg text-left cursor-pointer"
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-slate-400">View</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact info footer */}
        <div className="p-4 mt-auto bg-slate-50 text-xs text-slate-500 space-y-2">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
            <span>88 01434 65768</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-emerald-700" />
            <span>info.grocery@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  );
};
