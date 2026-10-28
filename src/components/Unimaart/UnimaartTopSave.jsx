import React, { useState, useEffect, useMemo } from 'react';
import {
  Carrot,
  Beef,
  Coffee,
  Snowflake,
  Croissant,
  PawPrint,
  Milk,
  Cookie,
  Wheat,
  Clock,
  ShoppingCart,
  Check,
  Eye,
  Heart,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { get5ItemsForCategory } from '../../data/unimaartItemsData';

export const UnimaartTopSave = ({ activeCategory: propActiveCategory, onSelectCategory }) => {
  const {
    addToCart,
    cart,
    currency,
    addToast,
    setQuickViewProduct,
    toggleWishlist,
    isInWishlist,
    activeCategory: storeActiveCategory,
    setActiveCategory,
    products,
    navigateTo
  } = useStore();

  const [localSideCat, setLocalSideCat] = useState('fruits-veg');

  const selectedCategory = propActiveCategory || storeActiveCategory || localSideCat;

  // Live countdown timer matching screenshot "Expires in : 14 : 23 : 59 : 55"
  const [timeLeft, setTimeLeft] = useState({
    days: 14,
    hours: 23,
    minutes: 59,
    seconds: 55
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return { days: 14, hours: 23, minutes: 59, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format2 = (val) => String(val).padStart(2, '0');

  // Live items strictly matching active store catalog (curated items + any newly added admin items)
  const filteredItems = useMemo(() => {
    if (!products || products.length === 0) return get5ItemsForCategory(selectedCategory);
    if (!selectedCategory || selectedCategory === 'all') return products;
    const matched = products.filter(
      (p) =>
        p.category === selectedCategory ||
        p.departmentId === selectedCategory ||
        (p.category && selectedCategory.includes(p.category)) ||
        (p.categoryLabel && p.categoryLabel.toLowerCase().includes(selectedCategory.toLowerCase()))
    );
    if (matched.length > 0) return matched;
    return products;
  }, [products, selectedCategory]);

  const sideCategories = [
    { id: 'all', name: '⭐ All Top Deals', icon: Sparkles },
    { id: 'fruits-veg', name: 'Vegetables & Fruit', icon: Carrot },
    { id: 'beverages', name: 'Beverages', icon: Coffee },
    { id: 'meat-poultry', name: 'Meats & Seafood', icon: Beef },
    { id: 'frozen-foods', name: 'Frozen Foods', icon: Snowflake },
    { id: 'bakery', name: 'Breakfast & Bakery', icon: Croissant },
    { id: 'pet-food', name: 'Pet Food', icon: PawPrint },
    { id: 'dairy-eggs', name: 'Milk & Dairies', icon: Milk },
    { id: 'snacks', name: 'Snacks & Munchies', icon: Cookie },
    { id: 'grocery-staples', name: 'Grocery Staples', icon: Wheat }
  ];

  const handleSelect = (catId) => {
    setLocalSideCat(catId);
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    if (setActiveCategory) {
      setActiveCategory(catId);
    }
  };

  const activeCategoryMeta = sideCategories.find((c) => c.id === selectedCategory) || sideCategories[1];

  return (
    <section id="unimaart-top-save" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 scroll-mt-20">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* 1. LEFT CATEGORY SIDEBAR */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-60 shrink-0 bg-[#f8f9fa] border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="pb-2.5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Category Filter</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              5 items each
            </span>
          </div>

          <div className="space-y-1">
            {sideCategories.map((sc) => {
              const Icon = sc.icon;
              const isSelected = selectedCategory === sc.id;

              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelect(sc.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#0284c7] text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{sc.name}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'text-slate-400'
                  }`}>
                    5
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. RIGHT "TOP SAVE TODAY" WITH COUNTDOWN & EXACTLY 5 PRODUCT CARDS */}
        {/* ========================================================================= */}
        <div className="flex-1 w-full space-y-4">
          
          {/* Header Bar matching screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {activeCategoryMeta.name} <span className="text-[#0284c7] text-base font-bold">(5 Items)</span>
                </h2>
              </div>
              
              {/* Cute Sapphire Leaf Doodle Flourish */}
              <div className="flex items-center gap-1 my-1">
                <div className="h-0.5 w-6 bg-[#0284c7] rounded-full" />
                <svg className="w-3.5 h-3.5 text-[#0284c7]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                </svg>
                <div className="h-0.5 w-6 bg-[#0284c7] rounded-full" />
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Fresh & handpicked daily • 10-15 min express delivery
              </p>
            </div>

            {/* Countdown Timer Badge matching screenshot */}
            <div className="bg-[#ff4757] text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm self-start sm:self-center shrink-0">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>
                Expires in : {format2(timeLeft.days)} : {format2(timeLeft.hours)} : {format2(timeLeft.minutes)} : {format2(timeLeft.seconds)}
              </span>
            </div>
          </div>

          {/* Exactly 5 Product Cards Grid (Matching reference) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 pt-1">
            {filteredItems.map((prod) => {
              const inCart = (cart || []).some((item) => (item.product?.id || item.id) === prod.id);

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200/70 p-3 sm:p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Discount / New Tag */}
                  {prod.tag && (
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className={`text-[10px] font-black uppercase text-white px-2 py-0.5 rounded-md shadow-xs ${prod.tagColor || 'bg-[#ff4757]'}`}>
                        {prod.tag}
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(prod.id || prod)}
                    className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 shadow-2xs transition-colors cursor-pointer"
                    title="Wishlist"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isInWishlist(prod.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  {/* Product Artwork */}
                  <div
                    onClick={() => setQuickViewProduct && setQuickViewProduct(prod)}
                    className="relative pt-4 pb-2 flex items-center justify-center h-36 overflow-hidden cursor-pointer bg-slate-50/50 rounded-xl mb-1"
                  >
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="max-h-32 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content Details */}
                  <div className="pt-2 border-t border-slate-100 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        {prod.unit}
                      </span>
                      <h4
                        onClick={() => setQuickViewProduct && setQuickViewProduct(prod)}
                        className="text-xs font-bold text-slate-800 line-clamp-2 hover:text-[#0284c7] cursor-pointer transition-colors leading-snug"
                        title={prod.name}
                      >
                        {prod.name}
                      </h4>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-900 block leading-none">
                          {currency?.symbol || 'Rs. '}{prod.price.toLocaleString()}
                        </span>
                        {prod.originalPrice && (
                          <span className="text-[10px] text-slate-400 line-through block mt-0.5">
                            {currency?.symbol || 'Rs. '}{prod.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(prod, 1);
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center ${
                          inCart
                            ? 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                            : 'bg-[#0284c7] hover:bg-[#0369a1] text-white hover:shadow-md'
                        }`}
                        title="Add to Cart"
                      >
                        {inCart ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
