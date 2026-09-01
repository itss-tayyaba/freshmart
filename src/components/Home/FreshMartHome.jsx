import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Clock,
  Heart,
  ShoppingCart,
  Truck,
  RotateCcw,
  ShieldCheck,
  Award,
  Zap,
  Sparkles,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  FRESHMART_CATEGORIES,
  FRESHMART_PRODUCTS
} from '../../data/freshMartData';

export const FreshMartHome = () => {
  const {
    navigateTo,
    addToCart,
    cart,
    updateCartQuantity,
    isInWishlist,
    toggleWishlist,
    setActiveCategory,
    setQuickViewProduct,
    currency
  } = useStore();

  // Flash deals countdown timer (02 : 45 : 18)
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 45,
    seconds: 18
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format2Digits = (num) => String(num).padStart(2, '0');

  // Flash deal products
  const flashProducts = FRESHMART_PRODUCTS.filter((p) => p.isFlashDeal);

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. Hero Section matching screenshot */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#f7f4ed] via-[#f9f7f2] to-[#edf7f1] overflow-hidden border border-emerald-950/5 shadow-card p-6 sm:p-10 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-8 min-h-[380px]">
          
          {/* Left Text Block matching screenshot */}
          <div className="max-w-lg z-10 text-left space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-xs font-extrabold shadow-2xs">
              <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>SUPER FAST 10-MINUTE GROCERY DELIVERY</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Fresh Groceries <br />
              <span className="text-emerald-700">Delivered in 10 Minutes</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium max-w-md">
              Get the best quality products delivered straight to your doorstep with guaranteed freshness.
            </p>

            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => navigateTo('shop')}
                className="px-7 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigateTo('deals')}
                className="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-sm border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                View Daily Deals
              </button>
            </div>
          </div>

          {/* Right Hero Image + 50% Off Badge matching screenshot */}
          <div className="relative z-10 flex items-center justify-center max-w-md w-full">
            <div className="relative">
              {/* 50% OFF Badge matching screenshot */}
              <div className="absolute -top-4 right-2 sm:-right-4 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-600 text-white shadow-xl flex flex-col items-center justify-center p-2 text-center border-4 border-white animate-bounce-soft z-20">
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none">UP TO</span>
                <span className="text-lg sm:text-2xl font-black leading-none my-0.5">50%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none">OFF</span>
              </div>

              {/* Basket of Produce Image */}
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
                alt="Fresh Groceries Basket"
                className="w-full h-64 sm:h-80 object-cover rounded-3xl shadow-xl border-4 border-white"
              />
            </div>
          </div>

        </div>
      </section>

      {/* 2. Circular Category Pills matching screenshot */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-1">
          {FRESHMART_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                navigateTo('shop');
              }}
              className="flex flex-col items-center text-center cursor-pointer group min-w-[76px] sm:min-w-[88px]"
            >
              {/* Circular Thumbnail */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 p-1 border-2 border-transparent group-hover:border-emerald-500 transition-all duration-200 flex items-center justify-center overflow-hidden shadow-2xs group-hover:shadow-md transform group-hover:scale-105">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                />
              </div>

              {/* Label */}
              <span className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-2 group-hover:text-emerald-700 transition-colors leading-tight whitespace-pre-line">
                {cat.shortName}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Flash Deals Section matching screenshot */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Flash Deals Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Flash Deals
            </h2>

            {/* Countdown Badges matching screenshot: Ends in: 02 : 45 : 18 */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-600">Ends in:</span>
              <span className="bg-rose-500 text-white font-mono font-bold px-2 py-0.5 rounded-md">
                {format2Digits(timeLeft.hours)}
              </span>
              <span className="font-bold text-rose-500">:</span>
              <span className="bg-rose-500 text-white font-mono font-bold px-2 py-0.5 rounded-md">
                {format2Digits(timeLeft.minutes)}
              </span>
              <span className="font-bold text-rose-500">:</span>
              <span className="bg-rose-500 text-white font-mono font-bold px-2 py-0.5 rounded-md">
                {format2Digits(timeLeft.seconds)}
              </span>
            </div>
          </div>

          {/* View All Button matching screenshot */}
          <button
            onClick={() => navigateTo('shop')}
            className="px-3.5 py-1.5 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-colors cursor-pointer"
          >
            View All
          </button>
        </div>

        {/* Flash Deals Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {flashProducts.map((product) => {
            const isFav = isInWishlist(product.id);
            const cartItem = cart.find((item) => item.product.id === product.id);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-3 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group relative"
              >
                {/* Top Discount Tag & Heart Icon matching screenshot */}
                <div className="flex items-center justify-between mb-1">
                  <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                    -{product.discountPercent}%
                  </span>
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Product Image */}
                <div
                  onClick={() => navigateTo('product-detail', product)}
                  className="relative h-28 sm:h-32 rounded-xl overflow-hidden mb-2 bg-slate-50 cursor-pointer flex items-center justify-center"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div>
                  <h3
                    onClick={() => navigateTo('product-detail', product)}
                    className="text-xs font-bold text-slate-800 line-clamp-1 hover:text-emerald-700 cursor-pointer transition-colors"
                  >
                    {product.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {product.unit}
                  </span>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      {currency.symbol}{product.price}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">
                      {currency.symbol}{product.originalPrice}
                    </span>
                  </div>

                  {/* Add to Cart Button matching screenshot */}
                  {cartItem ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-0.5 mt-2.5">
                      <button
                        onClick={() => updateCartQuantity(product.id, -1)}
                        className="w-6 h-6 rounded bg-white text-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-emerald-900">{cartItem.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(product.id, 1)}
                        className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product, 1)}
                      className="w-full mt-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. 5-Pillar Value Proposition Bar matching screenshot bottom */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-4">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-card border border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          
          <div className="flex items-center gap-3 pt-2 sm:pt-0">
            <Truck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">Free Delivery</h4>
              <p className="text-[10px] text-slate-500">On orders above Rs. 1000</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pl-4">
            <Zap className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">10 Minute Delivery</h4>
              <p className="text-[10px] text-slate-500">Get your order in 10 mins</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pl-4">
            <RotateCcw className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">Easy Returns</h4>
              <p className="text-[10px] text-slate-500">7 days return policy</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pl-4">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">100% Secure</h4>
              <p className="text-[10px] text-slate-500">Secure payment gateway</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pl-4 col-span-2 md:col-span-1">
            <Award className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">Best Quality</h4>
              <p className="text-[10px] text-slate-500">Always fresh products</p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
