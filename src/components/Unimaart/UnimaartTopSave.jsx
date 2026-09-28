import React, { useState, useEffect } from 'react';
import {
  Carrot,
  Beef,
  Coffee,
  Snowflake,
  Clock,
  ShoppingCart,
  Check,
  Eye,
  Heart
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const UnimaartTopSave = () => {
  const {
    addToCart,
    cart,
    currency,
    addToast,
    setQuickViewProduct,
    toggleWishlist,
    isInWishlist
  } = useStore();

  const [activeSideCat, setActiveSideCat] = useState('all');

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

  // 5 Top Save Featured Products (Matching screenshot items)
  const topSaveItems = [
    {
      id: 'unimaart-eggs-carton',
      name: 'Fresh Farm Golden Desi Eggs (12 Pcs Box)',
      category: 'dairy-eggs',
      price: 420,
      originalPrice: 490,
      discountPercent: 14,
      tag: '-14%',
      tagColor: 'bg-[#ff4757]',
      unit: '12 Pcs Pack',
      image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=400&q=80',
      description: 'Golden-yolk farm eggs collected at dawn and packed in biodegradable protective carton.'
    },
    {
      id: 'unimaart-orange-juice',
      name: 'Valencia Cold-Pressed Orange Juice (500ml)',
      category: 'beverages',
      price: 350,
      originalPrice: 400,
      discountPercent: 12,
      tag: '-12%',
      tagColor: 'bg-[#ff4757]',
      unit: '500ml Bottle',
      image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
      description: 'Cold-pressed Sargodha Valencia oranges, zero artificial sugar or preservatives.'
    },
    {
      id: 'unimaart-crispy-chips',
      name: 'Crispy Spiced Potato Munchies Pouch (120g)',
      category: 'snacks',
      price: 150,
      originalPrice: 180,
      discountPercent: 16,
      tag: '-16%',
      tagColor: 'bg-[#ff4757]',
      unit: '120g Foil Pouch',
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
      description: 'Thin-cut golden potato crisps with traditional Pakistani masala blend.'
    },
    {
      id: 'unimaart-fresh-milk-twin',
      name: 'Chilled Pure Raw Cow Milk Bottles (1L x 2)',
      category: 'dairy-eggs',
      price: 260,
      originalPrice: 300,
      discountPercent: 13,
      tag: 'NEW',
      tagColor: 'bg-[#f59e0b]',
      unit: 'Twin 1L Bottles',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
      description: 'Non-homogenized pure cow milk delivered chilled straight from organic dairy farm.'
    },
    {
      id: 'unimaart-fresh-chicken-cuts',
      name: 'Farm Fresh Boneless Skinless Chicken (500g)',
      category: 'meat-poultry',
      price: 590,
      originalPrice: 650,
      discountPercent: 9,
      tag: '-9%',
      tagColor: 'bg-[#ff4757]',
      unit: '500g Tray',
      image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
      description: 'Tender vacuum-sealed halal fresh chicken breast cuts kept strictly under 3°C.'
    }
  ];

  const filteredItems = activeSideCat === 'all'
    ? topSaveItems
    : topSaveItems.filter((i) => i.category === activeSideCat);

  const sideCategories = [
    { id: 'fruits-veg', name: 'Vegetables & Fruit', icon: Carrot },
    { id: 'meat-poultry', name: 'Meats & Seafood', icon: Beef },
    { id: 'beverages', name: 'Beverages', icon: Coffee },
    { id: 'frozen-foods', name: 'Frozen Foods', icon: Snowflake }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* 1. LEFT CATEGORY SIDEBAR */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-56 shrink-0 bg-[#f8f9fa] border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="pb-2.5 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Category</h3>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveSideCat('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-left ${
                activeSideCat === 'all'
                  ? 'bg-[#00a676] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <span>All Deals</span>
            </button>

            {sideCategories.map((sc) => {
              const Icon = sc.icon;
              const isSelected = activeSideCat === sc.id;

              return (
                <button
                  key={sc.id}
                  onClick={() => setActiveSideCat(isSelected ? 'all' : sc.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#00a676] text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{sc.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. RIGHT "TOP SAVE TODAY" WITH COUNTDOWN & 5 PRODUCT CARDS */}
        {/* ========================================================================= */}
        <div className="flex-1 w-full space-y-4">
          
          {/* Header Bar matching screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Top Save Today
                </h2>
              </div>
              
              {/* Cute Green Leaf Doodle Flourish */}
              <div className="flex items-center gap-1 my-1">
                <div className="h-0.5 w-6 bg-[#00a676] rounded-full" />
                <svg className="w-3.5 h-3.5 text-[#00a676]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                </svg>
                <div className="h-0.5 w-6 bg-[#00a676] rounded-full" />
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Limited-Time Offer You Can't Miss
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

          {/* 5 Product Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 pt-1">
            {filteredItems.map((prod) => {
              const inCart = (cart || []).some((item) => item.id === prod.id);

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
                    onClick={() => toggleWishlist(prod)}
                    className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 shadow-2xs transition-colors"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isInWishlist(prod.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  {/* Product Artwork */}
                  <div className="relative pt-4 pb-2 flex items-center justify-center h-36 overflow-hidden">
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
                        className="text-xs font-bold text-slate-800 line-clamp-2 hover:text-[#00a676] cursor-pointer transition-colors leading-snug"
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
                        onClick={() => {
                          addToCart(prod, 1);
                          addToast('Added to Cart 🛒', `${prod.name} added to cart.`);
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center ${
                          inCart
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-[#00a676] hover:bg-[#008f65] text-white hover:shadow-md'
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
