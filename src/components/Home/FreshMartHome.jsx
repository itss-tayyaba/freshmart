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
  Minus,
  Star,
  Tag,
  PhoneCall,
  Gift,
  Check,
  Copy,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  Percent
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
    currency,
    addToast,
    applyCouponCode
  } = useStore();

  // Active category filter tab for Bestsellers
  const [activeBestsellerTab, setActiveBestsellerTab] = useState('all');

  // Countdown timer for Deal of the Day (08 : 45 : 30) matching screenshot
  const [dealTime, setDealTime] = useState({
    hours: 8,
    minutes: 45,
    seconds: 30
  });

  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setDealTime((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 8, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format2Digits = (num) => String(num).padStart(2, '0');

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    applyCouponCode(code);
    addToast('Coupon Applied! 🎉', `Code ${code} activated on your cart.`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  // Filtered bestsellers
  const bestsellersList = FRESHMART_PRODUCTS.filter((p) => {
    if (activeBestsellerTab === 'all') return true;
    return p.category === activeBestsellerTab;
  });

  const spotlightApple = FRESHMART_PRODUCTS.find((p) => p.id === 'fresh-apples-1kg') || FRESHMART_PRODUCTS[7];

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-300">
      
      {/* 🌟 1. Top Green Announcement Bar matching GreenMart design */}
      <div className="bg-[#0f6b3a] text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-3 shadow-inner">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            Limited Offer
          </span>
          <span>Get 20% OFF on your first order - Use code: <strong className="font-mono font-bold text-amber-300">WELCOME20</strong></span>
        </div>
        <button
          onClick={() => handleCopyCoupon('WELCOME20')}
          className="px-2.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
        >
          {copiedCode === 'WELCOME20' ? 'Copied! ✓' : 'Copy Code'}
        </button>
      </div>

      {/* 🚀 2. Hero Section matching Collective Best-in-Class designs */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#eef9f2] via-[#f7faf8] to-[#f4ede4] overflow-hidden border border-emerald-950/5 shadow-xl p-6 sm:p-10 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-8 min-h-[440px]">
          
          {/* Left Text Block */}
          <div className="max-w-xl z-10 text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold shadow-2xs">
              <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>FRESHNESS GUARANTEED • 10-15 MIN EXPRESS DELIVERY</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Fresh Groceries <br />
              <span className="text-emerald-700">Delivered Fast</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium max-w-lg">
              Shop the best quality farm fresh fruits, crisp vegetables, dairy, pantry staples and daily essentials delivered to your doorstep in minutes.
            </p>

            <div className="pt-2 flex items-center gap-3 sm:gap-4 flex-wrap">
              <button
                onClick={() => navigateTo('shop')}
                className="px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-2xl text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigateTo('deals')}
                className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl text-sm border border-slate-200 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>View Offers</span>
              </button>
            </div>

            {/* Quick Micro Trust Counters */}
            <div className="pt-4 flex items-center gap-6 text-xs text-slate-500 font-semibold border-t border-emerald-900/10">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Organic Sourced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Contact Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image + 20% Off Floating Badge matching screenshots */}
          <div className="relative z-10 flex items-center justify-center max-w-md w-full">
            <div className="relative">
              
              {/* Floating Discount Badge */}
              <div className="absolute -top-4 right-2 sm:-right-4 w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-emerald-600 text-white shadow-2xl flex flex-col items-center justify-center p-2 text-center border-4 border-white animate-bounce-soft z-20">
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none">FLAT</span>
                <span className="text-xl sm:text-3xl font-black leading-none my-0.5">20%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none">OFF</span>
              </div>

              {/* High Res Produce Artwork */}
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
                alt="Fresh Produce Basket"
                className="w-full h-72 sm:h-88 object-cover rounded-3xl shadow-2xl border-4 border-white"
              />

              {/* Express Delivery Floating Card */}
              <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                  ⚡
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block">30-45 Mins</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Express Delivery</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 🛡️ 3. 4-Pillar Value Proposition Bar matching all 4 designs */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          
          <div className="flex items-center gap-3.5 pt-2 sm:pt-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-800">Fast Delivery</h4>
              <p className="text-[11px] text-slate-500">30-60 mins delivery at doorstep</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-800">Best Quality</h4>
              <p className="text-[11px] text-slate-500">100% fresh & trusted products</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-800">Safe Payment</h4>
              <p className="text-[11px] text-slate-500">100% secure checkout & COD</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-800">24/7 Support</h4>
              <p className="text-[11px] text-slate-500">We're always here to help you</p>
            </div>
          </div>

        </div>
      </section>

      {/* 🗂️ 4. Shop by Categories - Circular Carousel matching GreenMart & DailyNeeds */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Shop by Categories</h2>
            <p className="text-xs text-slate-500">Explore our wide selection of fresh organic groceries</p>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-1">
          {FRESHMART_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                navigateTo('shop');
              }}
              className="flex flex-col items-center text-center cursor-pointer group min-w-[76px] sm:min-w-[92px]"
            >
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-white p-1.5 border-2 border-slate-100 group-hover:border-emerald-500 transition-all duration-200 flex items-center justify-center overflow-hidden shadow-xs group-hover:shadow-md transform group-hover:scale-105">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                />
              </div>

              <span className="text-[11px] sm:text-xs font-bold text-slate-700 mt-2 group-hover:text-emerald-700 transition-colors leading-tight whitespace-pre-line">
                {cat.shortName}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 📸 5. Top Photographic Categories Banner Grid matching FreshBasket design */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Top Categories</h2>
          <button
            onClick={() => navigateTo('shop')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {FRESHMART_CATEGORIES.slice(0, 6).map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                navigateTo('shop');
              }}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <span className="text-[11px] font-bold text-emerald-600 block mt-0.5">
                  {cat.discountBadge || 'Up to 25% OFF'}
                </span>
              </div>

              <div className="h-24 sm:h-28 rounded-2xl overflow-hidden mt-3 bg-slate-50">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ⏰ 6. Deal of the Day & Flat 20% OFF Banner matching FreshBasket design */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Deal of the Day Card with Countdown */}
          <div className="lg:col-span-7 bg-[#fff8ed] border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            
            {/* Timer Block */}
            <div className="space-y-2 shrink-0 text-center sm:text-left">
              <span className="text-xs font-black text-amber-800 uppercase tracking-wider block">Deal of the Day</span>
              <div className="flex items-center gap-1.5">
                <div className="bg-amber-500 text-white font-mono font-black text-base px-2.5 py-1 rounded-xl shadow-xs">
                  {format2Digits(dealTime.hours)}
                </div>
                <span className="font-bold text-amber-700">:</span>
                <div className="bg-amber-500 text-white font-mono font-black text-base px-2.5 py-1 rounded-xl shadow-xs">
                  {format2Digits(dealTime.minutes)}
                </div>
                <span className="font-bold text-amber-700">:</span>
                <div className="bg-amber-500 text-white font-mono font-black text-base px-2.5 py-1 rounded-xl shadow-xs">
                  {format2Digits(dealTime.seconds)}
                </div>
              </div>
              <span className="text-[10px] text-amber-700 font-semibold block">Hours • Mins • Secs</span>
            </div>

            {/* Spotlight Product Info */}
            <div className="flex items-center gap-4 flex-1">
              <img
                src={spotlightApple.image}
                alt={spotlightApple.name}
                className="w-24 h-24 rounded-2xl object-cover bg-white shadow-xs border border-amber-200 shrink-0"
              />
              <div className="space-y-1">
                <h4 className="font-black text-sm text-slate-900 leading-snug">{spotlightApple.name}</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-black text-slate-900">{currency.symbol}{spotlightApple.price}</span>
                  <span className="text-xs text-slate-400 line-through">{currency.symbol}{spotlightApple.originalPrice}</span>
                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">28% OFF</span>
                </div>
                <button
                  onClick={() => addToCart(spotlightApple, 1)}
                  className="mt-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  + Add to Cart
                </button>
              </div>
            </div>

          </div>

          {/* Right Flat 20% OFF First Order Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-md flex items-center justify-between gap-4 relative overflow-hidden">
            <div className="space-y-1.5 z-10">
              <span className="text-2xl sm:text-3xl font-black block">Flat 20% OFF</span>
              <p className="text-xs text-emerald-200">On your first grocery order today</p>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-xl font-mono tracking-wider">
                  Use Code: <strong className="text-amber-300">FIRST20</strong>
                </span>
                <button
                  onClick={() => handleCopyCoupon('FIRST20')}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-[11px] font-black transition-colors cursor-pointer"
                >
                  {copiedCode === 'FIRST20' ? 'Applied ✓' : 'Apply'}
                </button>
              </div>
            </div>

            <img
              src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80"
              alt="Fresh Produce"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-lg border-2 border-emerald-600 shrink-0"
            />
          </div>

        </div>
      </section>

      {/* 🏆 7. Bestsellers & Featured Products matching All 4 Reference Screens */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Bestselling Products</h2>
            <p className="text-xs text-slate-500">Most popular choices handpicked fresh for your family</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'fruits-veg', label: 'Fruits & Veg' },
              { id: 'dairy-eggs', label: 'Dairy & Eggs' },
              { id: 'beverages', label: 'Beverages' },
              { id: 'grocery-staples', label: 'Staples' },
              { id: 'snacks', label: 'Snacks' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveBestsellerTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  activeBestsellerTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards 6-Column Grid matching screenshots */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {bestsellersList.map((product) => {
            const isFav = isInWishlist(product.id);
            const cartItem = cart.find((item) => item.product.id === product.id);

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative"
              >
                {/* Top Badge & Wishlist Heart */}
                <div className="flex items-center justify-between mb-1">
                  {product.discountPercent > 0 ? (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
                      -{product.discountPercent}%
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      Fresh
                    </span>
                  )}

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Image */}
                <div
                  onClick={() => navigateTo('product-detail', product)}
                  className="relative h-28 sm:h-32 rounded-2xl overflow-hidden mb-2 bg-slate-50 cursor-pointer flex items-center justify-center"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Title & Unit */}
                <div>
                  <h3
                    onClick={() => navigateTo('product-detail', product)}
                    className="text-xs font-bold text-slate-800 line-clamp-1 hover:text-emerald-700 cursor-pointer transition-colors"
                  >
                    {product.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{product.unit}</span>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-700">{product.rating || 4.7}</span>
                    <span className="text-[10px] text-slate-400">({product.reviewsCount || 120})</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      {currency.symbol}{product.price}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-[10px] text-slate-400 line-through">
                        {currency.symbol}{product.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Quantity Adder or Add to Cart Button */}
                  {cartItem ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-0.5 mt-2.5">
                      <button
                        onClick={() => updateCartQuantity(product.id, -1)}
                        className="w-6 h-6 rounded bg-white text-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-emerald-900">{cartItem.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(product.id, 1)}
                        className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product, 1)}
                      className="w-full mt-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🎁 8. Subscribe & Save + Refer & Earn Duo Banners matching QuickGrocery design */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Subscribe & Save More */}
          <div className="bg-gradient-to-r from-[#f7f2ea] to-[#f4ebe0] rounded-3xl p-6 sm:p-8 border border-amber-200/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-black text-amber-800 uppercase tracking-wider block">Smart Savings</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">Subscribe & Save More</h3>
              <p className="text-xs text-slate-600 max-w-xs">
                Get up to <strong>15% OFF</strong> on weekly milk, bread, egg and fresh fruit recurring deliveries.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    addToast('Subscription Club', 'Weekly automatic fresh deliveries activated.', 'success');
                    navigateTo('shop');
                  }}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-sm"
                >
                  Subscribe Now
                </button>
              </div>
            </div>
            <div className="w-24 h-24 rounded-2xl bg-amber-200/60 flex items-center justify-center text-4xl shadow-inner shrink-0">
              🥛
            </div>
          </div>

          {/* Card 2: Refer & Earn */}
          <div className="bg-gradient-to-r from-[#eef7f3] to-[#e4f2eb] rounded-3xl p-6 sm:p-8 border border-emerald-200/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider block">Rewards Program</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">Refer & Earn Rs. 500</h3>
              <p className="text-xs text-slate-600 max-w-xs">
                Invite friends and family to FreshMart. Both of you receive <strong>Rs. 500 wallet credit</strong>!
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    addToast('Referral Link Copied', 'Share your referral code FRESH-FRIEND500 with friends!', 'info');
                    navigateTo('customer-portal');
                  }}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Refer Friends</span>
                </button>
              </div>
            </div>
            <div className="w-24 h-24 rounded-2xl bg-emerald-200/60 flex items-center justify-center text-4xl shadow-inner shrink-0">
              🎁
            </div>
          </div>

        </div>
      </section>

      {/* 📱 9. Mobile App Download Banner matching GreenMart design */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#0d542d] via-[#116b39] to-[#0b4826] rounded-3xl p-6 sm:p-10 text-white shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          
          <div className="space-y-3 max-w-lg text-center lg:text-left">
            <span className="text-xs font-extrabold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full text-emerald-200">
              Mobile App Experience
            </span>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Download Our App
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium">
              Get exclusive app-only flash discounts, live courier GPS map tracking, and 10-minute grocery delivery right to your door.
            </p>

            <div className="pt-3 flex items-center gap-3 justify-center lg:justify-start flex-wrap">
              <button
                onClick={() => addToast('Google Play', 'Redirecting to Google Play Store...', 'info')}
                className="px-5 py-2.5 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-500/30 transition-colors cursor-pointer shadow-md"
              >
                <span>Google Play</span>
              </button>
              <button
                onClick={() => addToast('Apple App Store', 'Redirecting to Apple App Store...', 'info')}
                className="px-5 py-2.5 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-500/30 transition-colors cursor-pointer shadow-md"
              >
                <span>App Store</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-56 sm:w-64 bg-slate-900 p-3 rounded-3xl border-4 border-slate-700 shadow-2xl space-y-3">
              <div className="bg-emerald-700 text-white text-[10px] font-black p-2 rounded-xl text-center">
                🛒 FreshMart Express App
              </div>
              <div className="space-y-1.5 p-2 bg-slate-800 rounded-xl text-[11px] text-slate-200">
                <div className="flex justify-between font-bold">
                  <span>⚡ 10 Min Delivery</span>
                  <span className="text-emerald-400">Active</span>
                </div>
                <p className="text-[10px] text-slate-400">Real-time GPS road navigation</p>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
