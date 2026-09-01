import React, { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  Clock,
  Tag,
  Star,
  Plus,
  Minus,
  Heart,
  Percent,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const DealsPage = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartQuantity,
    isInWishlist,
    toggleWishlist,
    navigateTo,
    currency,
    applyCouponCode,
    addToast
  } = useStore();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mega' | 'flash' | 'budget'
  const [copiedCode, setCopiedCode] = useState(null);

  // Live Flash Sale Countdown Timer (08 : 45 : 30)
  const [dealTime, setDealTime] = useState({
    hours: 8,
    minutes: 45,
    seconds: 30
  });

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
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format2Digits = (num) => String(num).padStart(2, '0');

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    applyCouponCode(code);
    addToast('Coupon Applied! 🎉', `Voucher ${code} applied to your cart.`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  // Filter deals based on active tab
  const dealsList = products.filter((p) => {
    const hasDiscount = p.discountPercent > 0 || p.isFlashDeal || p.originalPrice > p.price;
    if (!hasDiscount) return false;
    if (activeTab === 'mega') return p.discountPercent >= 20;
    if (activeTab === 'flash') return p.isFlashDeal;
    if (activeTab === 'budget') return p.price <= 250;
    return true;
  });

  const spotlightDeal = products.find((p) => p.isFlashDeal && p.discountPercent >= 20) || products[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Fire / Lightning Flash Sale Hero Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-xl z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider">
            <Flame className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
            <span>MEGA FLASH SALE • LIMITED STOCK</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Today's Hot Deals & <br />
            <span className="text-amber-200">Super Saver Discounts</span>
          </h1>

          <p className="text-xs sm:text-sm text-rose-100 max-w-md">
            Save up to <strong>50% OFF</strong> on daily grocery essentials, dairy, fresh farm produce, and kitchen staples. Grab them before stock runs out!
          </p>

          {/* Countdown Clock */}
          <div className="pt-2 flex items-center gap-3 justify-center lg:justify-start">
            <span className="text-xs font-bold text-rose-100">Sale Ends In:</span>
            <div className="flex items-center gap-1.5 font-mono text-sm font-black">
              <span className="bg-slate-950 text-amber-400 px-3 py-1.5 rounded-xl shadow-md border border-white/20">
                {format2Digits(dealTime.hours)}h
              </span>
              <span>:</span>
              <span className="bg-slate-950 text-amber-400 px-3 py-1.5 rounded-xl shadow-md border border-white/20">
                {format2Digits(dealTime.minutes)}m
              </span>
              <span>:</span>
              <span className="bg-slate-950 text-amber-400 px-3 py-1.5 rounded-xl shadow-md border border-white/20">
                {format2Digits(dealTime.seconds)}s
              </span>
            </div>
          </div>
        </div>

        {/* Spotlight Card */}
        {spotlightDeal && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 text-slate-900 shadow-2xl max-w-sm w-full border-4 border-amber-300 z-10 relative">
            <div className="absolute -top-3.5 right-4 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase shadow-md flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Spotlight Deal</span>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={spotlightDeal.image}
                alt={spotlightDeal.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover bg-slate-50 border border-slate-100 shrink-0"
              />
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{spotlightDeal.categoryLabel}</span>
                <h3 className="text-sm font-black text-slate-900 line-clamp-1">{spotlightDeal.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-900">{currency.symbol}{spotlightDeal.price}</span>
                  <span className="text-xs text-slate-400 line-through">{currency.symbol}{spotlightDeal.originalPrice}</span>
                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                    -{spotlightDeal.discountPercent || 25}%
                  </span>
                </div>
              </div>
            </div>

            {/* Claim Bar */}
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Claimed: 84%</span>
                <span className="text-rose-600 font-black">Only 6 Left!</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-rose-600 w-[84%] rounded-full" />
              </div>
            </div>

            <button
              onClick={() => addToCart(spotlightDeal, 1)}
              className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Claim This Deal Now</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Hot Deals Promo Vouchers Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { code: 'WELCOME20', discount: '20% OFF', desc: 'First Order Special Discount', min: 'Min. Rs. 500', color: 'from-amber-500 to-orange-500' },
          { code: 'FRESH50', discount: '50% FLAT', desc: 'Weekend Flash Super Deal', min: 'Min. Rs. 1000', color: 'from-rose-500 to-pink-600' },
          { code: 'FREESHIP', discount: 'FREE DELIVERY', desc: 'Zero Delivery Fee on All Orders', min: 'No Minimum', color: 'from-emerald-600 to-teal-600' }
        ].map((v) => (
          <div
            key={v.code}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden"
          >
            <div className={`w-1.5 h-full absolute left-0 top-0 bg-gradient-to-b ${v.color}`} />
            <div className="space-y-1 pl-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">{v.discount}</span>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">{v.desc}</h4>
              <p className="text-[11px] text-slate-400 font-mono">{v.min} • Code: <strong className="text-slate-800">{v.code}</strong></p>
            </div>
            <button
              onClick={() => handleCopyCode(v.code)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              {copiedCode === v.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === v.code ? 'Applied' : 'Apply'}</span>
            </button>
          </div>
        ))}
      </div>

      {/* 3. Deal Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🔥 All Hot Deals</span>
            <span className="text-xs bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded-full">
              {dealsList.length} Items on Sale
            </span>
          </h2>
          <p className="text-xs text-slate-500">Handpicked discounts updated daily by our fresh procurement team</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: '🔥 All Deals' },
            { id: 'mega', label: '⚡ 20%+ Mega OFF' },
            { id: 'flash', label: '⏰ Flash Deals' },
            { id: 'budget', label: '🏷️ Under Rs. 250' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Deals Product Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {dealsList.map((product) => {
          const isFav = isInWishlist(product.id);
          const cartItem = cart.find((item) => item.product.id === product.id);

          return (
            <div
              key={product.id}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Discount Tag & Heart */}
              <div className="flex items-center justify-between mb-2">
                <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs">
                  -{product.discountPercent || 20}% OFF
                </span>
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
                className="relative h-36 sm:h-40 rounded-2xl overflow-hidden mb-3 bg-slate-50 cursor-pointer flex items-center justify-center"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Info */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{product.categoryLabel}</span>
                <h3
                  onClick={() => navigateTo('product-detail', product)}
                  className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 hover:text-emerald-700 cursor-pointer transition-colors"
                >
                  {product.name}
                </h3>
                <span className="text-[11px] text-slate-400 block">{product.unit}</span>

                {/* Rating */}
                <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{product.rating || 4.8}</span>
                  <span className="text-slate-400 font-normal">({product.reviewsCount || 150})</span>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-base font-black text-slate-900">
                    {currency.symbol}{product.price}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-xs text-slate-400 line-through font-semibold">
                      {currency.symbol}{product.originalPrice}
                    </span>
                  )}
                </div>

                {/* Add to Cart */}
                {cartItem ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-1 mt-3">
                    <button
                      onClick={() => updateCartQuantity(product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-black text-emerald-900">{cartItem.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
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

    </div>
  );
};
