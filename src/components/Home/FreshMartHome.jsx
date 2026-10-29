import React, { useState, useEffect, useMemo } from 'react';
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
import { ALL_BRANCH_PRODUCTS } from '../../data/branchCatalogData';
import { isSameTenant } from '../../data/companyHierarchyData';
import { UnimaartHero } from '../Unimaart/UnimaartHero';
import { UnimaartCategoryStrip } from '../Unimaart/UnimaartCategoryStrip';
import { UnimaartTopSave } from '../Unimaart/UnimaartTopSave';
import { CaseValueHero } from '../CaseValue/CaseValueHero';
import { CaseValueCategoryStrip } from '../CaseValue/CaseValueCategoryStrip';
import { CaseValueTopDeals } from '../CaseValue/CaseValueTopDeals';
import { AlFatahHero } from '../AlFatah/AlFatahHero';
import { ChaseUpHero } from '../ChaseUp/ChaseUpHero';

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
    applyCouponCode,
    products,
    categories,
    storeSettings,
    currentTenant,
    deliveryLocation
  } = useStore();

  // Active category filter tab for Bestsellers
  const [activeBestsellerTab, setActiveBestsellerTab] = useState('all');
  const [unimaartCategory, setUnimaartCategory] = useState('fruits-veg');

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

  const isCaseValue = isSameTenant(currentTenant?.id, 'tenant-chasevalue');
  const isAlFatah = isSameTenant(currentTenant?.id, 'tenant-alfatah');
  const isChaseUp = isSameTenant(currentTenant?.id, 'tenant-chaseup');
  const isUnimaart = !isCaseValue && !isAlFatah && !isChaseUp;

  // Resolved store products pool strictly isolated per supermarket
  const storeCatalog = useMemo(() => {
    if (products && products.length > 0) return products;
    const fallback = (ALL_BRANCH_PRODUCTS || []).filter((p) =>
      isSameTenant(p.tenantId, currentTenant?.id) || (!p.tenantId && isSameTenant(currentTenant?.id, 'tenant-freshmart'))
    );
    return fallback.length > 0 ? fallback : (ALL_BRANCH_PRODUCTS || []).slice(0, 5);
  }, [products, currentTenant]);

  // Dynamically derive category pills from the products currently present in the active store
  const bestsellerTabs = useMemo(() => {
    const tabs = [{ id: 'all', label: 'All Products' }];
    const seen = new Set(['all']);

    storeCatalog.forEach((p) => {
      const catId = p.category || p.departmentId;
      const catLabel = p.categoryLabel || p.departmentName || p.category;
      if (catId && !seen.has(catId)) {
        seen.add(catId);
        tabs.push({ id: catId, label: catLabel });
      }
    });

    return tabs;
  }, [storeCatalog]);

  // Dynamic Bestsellers list: shows all store products on 'all', or filters by category
  const bestsellersList = useMemo(() => {
    if (!storeCatalog || storeCatalog.length === 0) return [];
    if (activeBestsellerTab === 'all') return storeCatalog;

    const target = activeBestsellerTab.toLowerCase();
    const matched = storeCatalog.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const deptId = (p.departmentId || '').toLowerCase();
      const catLabel = (p.categoryLabel || '').toLowerCase();
      const deptName = (p.departmentName || '').toLowerCase();
      return (
        cat === target ||
        deptId === target ||
        cat.includes(target) ||
        target.includes(cat) ||
        catLabel.includes(target) ||
        deptName.includes(target)
      );
    });

    return matched.length > 0 ? matched : storeCatalog;
  }, [storeCatalog, activeBestsellerTab]);

  const spotlightApple =
    storeCatalog.find((p) => p.id === (storeSettings?.dealOfDayProductId || 'fresh-apples-1kg')) ||
    storeCatalog.find((p) => p.isFlashDeal) ||
    (storeCatalog.length > 0 ? storeCatalog[0] : null);

  const tenantTopBarBg = isCaseValue
    ? 'bg-[#5c3417]'
    : isAlFatah
    ? 'bg-[#7f1d1d]'
    : isChaseUp
    ? 'bg-[#581c87]'
    : 'bg-[#0052a3]';

  const tenantTheme = {
    primaryBtn: isUnimaart
      ? 'bg-[#0284c7] hover:bg-[#0369a1]'
      : isCaseValue
      ? 'bg-[#5c3417] hover:bg-[#43230c]'
      : isAlFatah
      ? 'bg-[#991b1b] hover:bg-[#7f1d1d]'
      : isChaseUp
      ? 'bg-[#6b21a8] hover:bg-[#581c87]'
      : 'bg-[#0284c7] hover:bg-[#0369a1]',
    bannerGradient: isUnimaart
      ? 'bg-gradient-to-br from-[#033659] via-[#0284c7] to-slate-950 border border-sky-400/20'
      : isCaseValue
      ? 'bg-gradient-to-br from-[#3d2314] via-[#5c3417] to-[#8c532b] border border-amber-400/20'
      : isAlFatah
      ? 'bg-gradient-to-br from-[#450a0a] via-[#7f1d1d] to-[#991b1b] border border-amber-400/20'
      : isChaseUp
      ? 'bg-gradient-to-br from-[#3b0764] via-[#581c87] to-[#6b21a8] border border-orange-400/20'
      : 'bg-gradient-to-br from-[#033659] to-[#0284c7]',
    accentText: isUnimaart
      ? 'text-sky-200'
      : isCaseValue
      ? 'text-amber-200'
      : isAlFatah
      ? 'text-rose-200'
      : isChaseUp
      ? 'text-purple-200'
      : 'text-sky-200',
    accentBorder: isUnimaart
      ? 'border-sky-400'
      : isCaseValue
      ? 'border-[#8c532b]'
      : isAlFatah
      ? 'border-amber-400'
      : isChaseUp
      ? 'border-orange-400'
      : 'border-sky-400',
    filterPillActive: isUnimaart
      ? 'bg-[#0284c7] text-white shadow-md'
      : isCaseValue
      ? 'bg-[#5c3417] text-white shadow-md'
      : isAlFatah
      ? 'bg-[#991b1b] text-white shadow-md'
      : isChaseUp
      ? 'bg-[#6b21a8] text-white shadow-md'
      : 'bg-[#0284c7] text-white shadow-md',
    badgeBg: isUnimaart
      ? 'bg-sky-50 text-sky-700'
      : isCaseValue
      ? 'bg-[#f4ebe0] text-[#5c3417]'
      : isAlFatah
      ? 'bg-rose-50 text-rose-800'
      : isChaseUp
      ? 'bg-purple-50 text-purple-800'
      : 'bg-sky-50 text-sky-700',
    hoverText: isUnimaart
      ? 'hover:text-[#0284c7]'
      : isCaseValue
      ? 'hover:text-[#8c532b]'
      : isAlFatah
      ? 'hover:text-[#991b1b]'
      : isChaseUp
      ? 'hover:text-[#6b21a8]'
      : 'hover:text-[#0284c7]'
  };

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-300">
      
      {/* 🌟 1. Top Announcement Bar (Hidden on Unimaart & Case Value to match reference screenshots) */}
      {!isUnimaart && !isCaseValue && (
        <div className={`${tenantTopBarBg} text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-3 shadow-inner`}>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Fast Delivery
            </span>
            <span>{storeSettings?.topAnnouncement || '⚡ 10-15 Min Express Delivery on all farm-fresh fruits, vegetables, dairy & daily groceries'}</span>
          </div>
          {storeSettings?.topPromoCode && (
            <button
              onClick={() => handleCopyCoupon(storeSettings.topPromoCode)}
              className="px-2.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            >
              {copiedCode === storeSettings.topPromoCode ? 'Copied! ✓' : `Code: ${storeSettings.topPromoCode}`}
            </button>
          )}
        </div>
      )}

      {/* 🚀 STORE-SPECIFIC HERO & CATEGORY EXPERIENCES */}
      {isUnimaart && (
        <>
          {/* ========================================================================= */}
          {/* UNIMAART MARKET STORE HERO, CATEGORIES & TOP SAVE TODAY (MATCHING SCREENSHOT) */}
          {/* ========================================================================= */}
          <UnimaartHero />
          <UnimaartCategoryStrip
            activeCategory={unimaartCategory}
            onSelectCategory={setUnimaartCategory}
          />
          <UnimaartTopSave
            activeCategory={unimaartCategory}
            onSelectCategory={setUnimaartCategory}
          />

          {/* 🛡️ 4-Pillar Value Proposition Bar */}
          <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              <div className="flex items-center gap-3.5 pt-2 sm:pt-0">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">Fast Delivery</h4>
                  <p className="text-[11px] text-slate-500">10-15 mins express at doorstep</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">Best Quality</h4>
                  <p className="text-[11px] text-slate-500">100% farm-fresh produce</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">Safe Payment</h4>
                  <p className="text-[11px] text-slate-500">100% secure checkout & COD</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">24/7 Support</h4>
                  <p className="text-[11px] text-slate-500">+9870-256-679 helpline</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
      {/* 2. CASE VALUE / LOCAL GROCERY (MATCHING EXACT USER SCREENSHOT) */}
      {isCaseValue && (
        <>
          <CaseValueHero />
          <CaseValueCategoryStrip />
          <CaseValueTopDeals />

          {/* 🛡️ Case Value 4-Pillar Value Proposition Bar in Warm Mocha */}
          <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-2">
            <div className="bg-[#fdfaf4] rounded-3xl p-5 sm:p-7 shadow-xs border border-[#ebdcc7] grid grid-cols-2 md:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#ebdcc7]">
              <div className="flex items-center gap-3.5 pt-2 sm:pt-0">
                <div className="w-11 h-11 rounded-2xl bg-[#f4ebe0] text-[#5c3417] flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#3d2314]">Wholesale Delivery</h4>
                  <p className="text-[11px] text-[#78604d]">Same-day bulk van dispatch</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
                <div className="w-11 h-11 rounded-2xl bg-[#f4ebe0] text-[#5c3417] flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#3d2314]">Direct Factory Rates</h4>
                  <p className="text-[11px] text-[#78604d]">100% genuine guaranteed</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
                <div className="w-11 h-11 rounded-2xl bg-[#f4ebe0] text-[#5c3417] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#3d2314]">Safe & Secure</h4>
                  <p className="text-[11px] text-[#78604d]">Cash on Delivery & Cards</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
                <div className="w-11 h-11 rounded-2xl bg-[#f4ebe0] text-[#5c3417] flex items-center justify-center shrink-0">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#3d2314]">Wholesale Helpline</h4>
                  <p className="text-[11px] text-[#78604d]">+92 321 9876543 support</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 3. AL-FATAH PREMIER LUXURY HYPERMARKET */}
      {isAlFatah && (
        <>
          <AlFatahHero />

          {/* 🛡️ Al-Fatah 4-Pillar Bar in Ruby Crimson & Gold */}
          <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-2">
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-rose-100 grid grid-cols-2 md:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-rose-100">
              <div className="flex items-center gap-3.5 pt-2 sm:pt-0">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-[#991b1b] flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">White-Glove Fleet</h4>
                  <p className="text-[11px] text-slate-500">Chilled temperature-controlled</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-[#991b1b] flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">Authentic Imports</h4>
                  <p className="text-[11px] text-slate-500">Certified origin & seal</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-[#991b1b] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">Premier Guarantee</h4>
                  <p className="text-[11px] text-slate-500">100% satisfaction or replace</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-[#991b1b] flex items-center justify-center shrink-0">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">Concierge Desk</h4>
                  <p className="text-[11px] text-slate-500">+92 300 8441122 VIP line</p>
                </div>
              </div>
            </div>
          </section>

          {/* 🌟 Al-Fatah Premier Products Showcase (5 Demo Items) */}
          <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>🏛️ Premier Luxury Selection</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Exclusive imported delicacies, royal gourmet grains, and premium European cuts
                </p>
              </div>
              <button
                onClick={() => navigateTo('shop')}
                className="text-xs sm:text-sm font-bold text-[#991b1b] hover:text-[#7f1d1d] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
              {(products || []).map((item) => {
                const prodId = item.id || item._id;
                const isFav = isInWishlist(prodId);

                return (
                  <div
                    key={prodId}
                    className="bg-white border border-rose-100 rounded-3xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-[#991b1b] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                        Gourmet
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(prodId);
                        }}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                        title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    <div
                      onClick={() => navigateTo('product-detail', item)}
                      className="w-full h-32 sm:h-36 flex items-center justify-center p-2 mb-2 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">
                        {item.brand || item.categoryLabel}
                      </span>
                      <h4
                        onClick={() => navigateTo('product-detail', item)}
                        className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 cursor-pointer hover:text-[#991b1b] transition-colors"
                      >
                        {item.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                        {item.unit}
                      </span>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm sm:text-base font-black text-slate-900">
                          {currency.symbol}{item.price}
                        </span>
                        {Number(item.discountPercent) > 0 && Number(item.originalPrice) > Number(item.price) && (
                          <span className="text-xs text-slate-400 line-through">
                            {currency.symbol}{item.originalPrice}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(item, 1)}
                        className="w-full mt-3 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* 4. CHASE UP MEGA FAMILY SUPERSTORE */}
      {isChaseUp && (
        <>
          <ChaseUpHero />

          {/* 🛡️ Chase Up 4-Pillar Bar in Royal Purple & Tangerine */}
          <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-2">
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-purple-100 grid grid-cols-2 md:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-purple-100">
              <div className="flex items-center gap-3.5 pt-2 sm:pt-0">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#6b21a8] flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">Family Express</h4>
                  <p className="text-[11px] text-slate-500">Fast doorstep supermarket delivery</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#6b21a8] flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">Family Mega Savings</h4>
                  <p className="text-[11px] text-slate-500">Unbeatable bulk discounts</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#6b21a8] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">100% Reliable</h4>
                  <p className="text-[11px] text-slate-500">Direct supermarket seal</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#6b21a8] flex items-center justify-center shrink-0">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">Customer Helpline</h4>
                  <p className="text-[11px] text-slate-500">+92 333 5556677 support</p>
                </div>
              </div>
            </div>
          </section>

          {/* 🌟 Chase Up Family Mega Savers Showcase (5 Demo Items) */}
          <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>🏪 Family Mega Savers</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Family milk cartons, bulk edible oils, mega biscuit boxes & daily FMCG bundles
                </p>
              </div>
              <button
                onClick={() => navigateTo('shop')}
                className="text-xs sm:text-sm font-bold text-[#6b21a8] hover:text-[#581c87] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
              {(products || []).map((item) => {
                const prodId = item.id || item._id;
                const isFav = isInWishlist(prodId);

                return (
                  <div
                    key={prodId}
                    className="bg-white border border-purple-100 rounded-3xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-[#6b21a8] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                        Mega Saver
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(prodId);
                        }}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                        title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    <div
                      onClick={() => navigateTo('product-detail', item)}
                      className="w-full h-32 sm:h-36 flex items-center justify-center p-2 mb-2 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">
                        {item.brand || item.categoryLabel}
                      </span>
                      <h4
                        onClick={() => navigateTo('product-detail', item)}
                        className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 cursor-pointer hover:text-[#6b21a8] transition-colors"
                      >
                        {item.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                        {item.unit}
                      </span>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm sm:text-base font-black text-slate-900">
                          {currency.symbol}{item.price}
                        </span>
                        {Number(item.discountPercent) > 0 && Number(item.originalPrice) > Number(item.price) && (
                          <span className="text-xs text-slate-400 line-through">
                            {currency.symbol}{item.originalPrice}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(item, 1)}
                        className="w-full mt-3 py-2 bg-[#6b21a8] hover:bg-[#581c87] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* 5. Fallback for any other tenant */}
      {!isUnimaart && !isCaseValue && !isAlFatah && !isChaseUp && (
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-3xl p-8 text-white shadow-xl bg-gradient-to-r from-slate-900 to-slate-800">
            <h2 className="text-3xl font-black">{currentTenant?.name}</h2>
            <p className="text-sm text-slate-300 mt-2">{currentTenant?.tagline}</p>
          </div>
        </section>
      )}

      {/* ⏰ 6. Featured Produce & Express Delivery Guarantee Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Spotlight Product Card */}
          {spotlightApple ? (
            <div className="lg:col-span-7 bg-[#fff8ed] border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              
              {/* Timer / Spotlight Block */}
              <div className="space-y-2 shrink-0 text-center sm:text-left">
                <span className="text-xs font-black text-amber-800 uppercase tracking-wider block">
                  {spotlightApple.discountPercent > 0 ? 'Deal of the Day' : '⭐ Farm Fresh Harvest'}
                </span>
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
                    {spotlightApple.discountPercent > 0 && spotlightApple.originalPrice > spotlightApple.price && (
                      <span className="text-xs text-slate-400 line-through">{currency.symbol}{spotlightApple.originalPrice}</span>
                    )}
                    {spotlightApple.discountPercent > 0 && (
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">{spotlightApple.discountPercent}% OFF</span>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(spotlightApple, 1)}
                    className={`mt-2 px-4 py-1.5 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer ${tenantTheme.primaryBtn}`}
                  >
                    + Add to Cart
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="lg:col-span-7 bg-[#fff8ed] border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-black text-amber-800 uppercase tracking-wider block">⭐ Fresh Arrivals</span>
                <h4 className="font-black text-sm text-slate-900 leading-snug">New Stock Arriving Daily</h4>
                <p className="text-xs text-slate-600">Fresh batches of farm-fresh fruits, vegetables, and daily staples arriving every morning.</p>
              </div>
              <button
                onClick={() => navigateTo('shop')}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer ${tenantTheme.primaryBtn}`}
              >
                Browse Shop ➔
              </button>
            </div>
          )}

          {/* Right Banner Card */}
          <div className={`lg:col-span-5 rounded-3xl p-6 text-white shadow-md flex items-center justify-between gap-4 relative overflow-hidden ${tenantTheme.bannerGradient}`}>
            <div className="space-y-1.5 z-10">
              <span className="text-2xl sm:text-3xl font-black block">
                {storeSettings?.firstOrderPromoCode ? 'Special Offer' : 'Express Delivery'}
              </span>
              <p className={`text-xs ${tenantTheme.accentText}`}>
                {storeSettings?.firstOrderPromoCode ? 'Use promo code at checkout' : 'Farm fresh groceries at your door in 10-15 mins'}
              </p>
              <div className="pt-2 flex items-center gap-2">
                {storeSettings?.firstOrderPromoCode ? (
                  <>
                    <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-xl font-mono tracking-wider">
                      Use Code: <strong className="text-amber-300">{storeSettings.firstOrderPromoCode}</strong>
                    </span>
                    <button
                      onClick={() => handleCopyCoupon(storeSettings.firstOrderPromoCode)}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-[11px] font-black transition-colors cursor-pointer"
                    >
                      {copiedCode === storeSettings.firstOrderPromoCode ? 'Applied ✓' : 'Apply'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigateTo('shop')}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-colors cursor-pointer"
                  >
                    Shop Now ➔
                  </button>
                )}
              </div>
            </div>

            <img
              src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80"
              alt="Fresh Produce"
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-lg border-2 shrink-0 ${tenantTheme.accentBorder}`}
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
            {bestsellerTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveBestsellerTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  activeBestsellerTab === tab.id
                    ? tenantTheme.filterPillActive
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards 6-Column Grid matching screenshots */}
        {bestsellersList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {bestsellersList.map((product) => {
            const prodId = product.id || product._id;
            const isFav = isInWishlist(prodId);
            const cartItem = cart.find((item) => (item.product.id || item.product._id) === prodId);

            return (
              <div
                key={prodId}
                className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative"
              >
                {/* Top Badge & Wishlist Heart */}
                <div className="flex items-center justify-between mb-1">
                  {Number(product.discountPercent) > 0 && Number(product.originalPrice) > Number(product.price) ? (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
                      -{product.discountPercent}%
                    </span>
                  ) : (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${tenantTheme.badgeBg}`}>
                      Fresh
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(prodId);
                    }}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                    title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
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
                    className={`text-xs font-bold text-slate-800 line-clamp-1 cursor-pointer transition-colors ${tenantTheme.hoverText}`}
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
                    {Number(product.discountPercent) > 0 && Number(product.originalPrice) > Number(product.price) && (
                      <span className="text-[10px] text-slate-400 line-through">
                        {currency.symbol}{product.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Quantity Adder or Add to Cart Button */}
                  {cartItem ? (
                    <div className="flex items-center justify-between rounded-xl p-0.5 mt-2.5 bg-slate-50 border border-slate-200">
                      <button
                        onClick={() => updateCartQuantity(product.id, -1)}
                        className="w-6 h-6 rounded bg-white flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer text-slate-700 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-800">{cartItem.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(product.id, 1)}
                        className={`w-6 h-6 rounded text-white flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer ${tenantTheme.primaryBtn}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product, 1)}
                      className={`w-full mt-2.5 py-1.5 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs ${tenantTheme.primaryBtn}`}
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
        ) : (
          <div className="bg-slate-50/80 border border-slate-100 rounded-3xl p-10 text-center space-y-2">
            <span className="text-3xl block">🛒</span>
            <h3 className="font-bold text-slate-800 text-sm">Fresh Items Coming Soon</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Our shelves are being stocked with freshly harvested groceries and top deals for this store.
            </p>
          </div>
        )}
      </section>

      {/* 📱 9. Mobile App Download Banner matching GreenMart design */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className={`rounded-3xl p-6 sm:p-10 text-white shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden ${
          isUnimaart
            ? 'bg-gradient-to-r from-[#0b192c] via-[#0369a1] to-[#0284c7]'
            : isCaseValue
            ? 'bg-gradient-to-r from-[#2b170c] via-[#5c3417] to-[#8c532b]'
            : isAlFatah
            ? 'bg-gradient-to-r from-[#280808] via-[#7f1d1d] to-[#991b1b]'
            : isChaseUp
            ? 'bg-gradient-to-r from-[#1e0730] via-[#581c87] to-[#6b21a8]'
            : 'bg-gradient-to-r from-[#0d542d] via-[#116b39] to-[#0b4826]'
        }`}>
          
          <div className="space-y-3 max-w-lg text-center lg:text-left">
            <span className={`text-xs font-extrabold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full ${
              isUnimaart ? 'text-sky-200' : isCaseValue ? 'text-amber-200' : isAlFatah ? 'text-rose-200' : isChaseUp ? 'text-purple-200' : 'text-emerald-200'
            }`}>
              Mobile App Experience
            </span>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Download Our App
            </h3>
            <p className={`text-xs sm:text-sm font-medium ${
              isUnimaart ? 'text-sky-100' : isCaseValue ? 'text-amber-100' : isAlFatah ? 'text-rose-100' : isChaseUp ? 'text-purple-100' : 'text-emerald-100'
            }`}>
              Get exclusive app-only flash discounts, live courier GPS map tracking, and 10-minute grocery delivery right to your door.
            </p>

            <div className="pt-3 flex items-center gap-3 justify-center lg:justify-start flex-wrap">
              <button
                onClick={() => addToast('Google Play', 'Redirecting to Google Play Store...', 'info')}
                className={`px-5 py-2.5 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors cursor-pointer shadow-md ${
                  isUnimaart ? 'border-sky-500/30' : isCaseValue ? 'border-amber-500/30' : isAlFatah ? 'border-rose-500/30' : isChaseUp ? 'border-purple-500/30' : 'border-emerald-500/30'
                }`}
              >
                <span>Google Play</span>
              </button>
              <button
                onClick={() => addToast('Apple App Store', 'Redirecting to Apple App Store...', 'info')}
                className={`px-5 py-2.5 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors cursor-pointer shadow-md ${
                  isUnimaart ? 'border-sky-500/30' : isCaseValue ? 'border-amber-500/30' : isAlFatah ? 'border-rose-500/30' : isChaseUp ? 'border-purple-500/30' : 'border-emerald-500/30'
                }`}
              >
                <span>App Store</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-56 sm:w-64 bg-slate-900 p-3 rounded-3xl border-4 border-slate-700 shadow-2xl space-y-3">
              <div className={`text-white text-[10px] font-black p-2 rounded-xl text-center ${
                isUnimaart ? 'bg-[#0284c7]' : isCaseValue ? 'bg-[#5c3417]' : isAlFatah ? 'bg-[#991b1b]' : isChaseUp ? 'bg-[#6b21a8]' : 'bg-emerald-700'
              }`}>
                🛒 {currentTenant?.displayName || currentTenant?.name || 'Store'} Express App
              </div>
              <div className="space-y-1.5 p-2 bg-slate-800 rounded-xl text-[11px] text-slate-200">
                <div className="flex justify-between font-bold">
                  <span>⚡ 10 Min Delivery</span>
                  <span className={isUnimaart ? 'text-sky-400' : isCaseValue ? 'text-amber-400' : isAlFatah ? 'text-amber-400' : isChaseUp ? 'text-orange-400' : 'text-emerald-400'}>Active</span>
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
