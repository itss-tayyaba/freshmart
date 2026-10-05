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
import { UnimaartHero } from '../Unimaart/UnimaartHero';
import { UnimaartCategoryStrip } from '../Unimaart/UnimaartCategoryStrip';
import { UnimaartTopSave } from '../Unimaart/UnimaartTopSave';
import { CaseValueHero } from '../CaseValue/CaseValueHero';
import { CaseValueCategoryStrip } from '../CaseValue/CaseValueCategoryStrip';
import { CaseValueTopDeals } from '../CaseValue/CaseValueTopDeals';
import { AlFatahHero } from '../AlFatah/AlFatahHero';
import { ChaseUpHero } from '../ChaseUp/ChaseUpHero';
import { CustomerLocationBanner } from './CustomerLocationBanner';
import { NearbyStoresSection } from './NearbyStoresSection';

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
    currentBranch,
    deliveryLocation,
    isLocationConfirmed,
    setIsLocationModalOpen,
    getNearbyStores,
    selectStoreAndBranch
  } = useStore();

  // Dynamic nearby stores calculated from current customer coordinates
  const nearbyStoresList = useMemo(() => {
    if (typeof getNearbyStores === 'function') {
      return getNearbyStores(deliveryLocation?.coords || deliveryLocation);
    }
    return [];
  }, [getNearbyStores, deliveryLocation]);

  const activeStoreData = useMemo(() => {
    return nearbyStoresList.find((s) => s.id === currentTenant?.id) || nearbyStoresList[0];
  }, [nearbyStoresList, currentTenant]);

  const handleSelectStore = (storeTenant, branch) => {
    if (selectStoreAndBranch) {
      selectStoreAndBranch(storeTenant, branch);
    }
    const sfEl = document.getElementById('store-active-storefront');
    if (sfEl) {
      sfEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

  // Dynamic Bestsellers derived from real-time products
  const bestsellersList = products.filter((p) => {
    if (activeBestsellerTab === 'all') return p.isBestSeller !== false;
    return p.category === activeBestsellerTab;
  });

  const spotlightApple = products.find((p) => p.id === (storeSettings?.dealOfDayProductId || 'fresh-apples-1kg')) || products.find(p => p.isFlashDeal) || (products.length > 0 ? products[0] : null);

  const isUnimaart = currentTenant?.id === 'tenant-freshmart';
  const isCaseValue = currentTenant?.id === 'tenant-chasevalue';
  const isAlFatah = currentTenant?.id === 'tenant-alfatah';
  const isChaseUp = currentTenant?.id === 'tenant-chaseup';

  const tenantTopBarBg = isCaseValue
    ? 'bg-[#5c3417]'
    : isAlFatah
    ? 'bg-[#7f1d1d]'
    : isChaseUp
    ? 'bg-[#581c87]'
    : 'bg-[#0f6b3a]';

  const tenantTheme = {
    primaryBtn: isUnimaart
      ? 'bg-[#0284c7] hover:bg-[#0369a1]'
      : isCaseValue
      ? 'bg-[#5c3417] hover:bg-[#43230c]'
      : isAlFatah
      ? 'bg-[#991b1b] hover:bg-[#7f1d1d]'
      : isChaseUp
      ? 'bg-[#6b21a8] hover:bg-[#581c87]'
      : 'bg-emerald-600 hover:bg-emerald-700',
    bannerGradient: isUnimaart
      ? 'bg-gradient-to-br from-[#033659] via-[#0284c7] to-slate-950 border border-sky-400/20'
      : isCaseValue
      ? 'bg-gradient-to-br from-[#3d2314] via-[#5c3417] to-[#8c532b] border border-amber-400/20'
      : isAlFatah
      ? 'bg-gradient-to-br from-[#450a0a] via-[#7f1d1d] to-[#991b1b] border border-amber-400/20'
      : isChaseUp
      ? 'bg-gradient-to-br from-[#3b0764] via-[#581c87] to-[#6b21a8] border border-orange-400/20'
      : 'bg-gradient-to-br from-emerald-800 to-emerald-950',
    accentText: isUnimaart
      ? 'text-sky-200'
      : isCaseValue
      ? 'text-amber-200'
      : isAlFatah
      ? 'text-rose-200'
      : isChaseUp
      ? 'text-purple-200'
      : 'text-emerald-200',
    accentBorder: isUnimaart
      ? 'border-sky-400'
      : isCaseValue
      ? 'border-[#8c532b]'
      : isAlFatah
      ? 'border-amber-400'
      : isChaseUp
      ? 'border-orange-400'
      : 'border-emerald-600',
    filterPillActive: isUnimaart
      ? 'bg-[#0284c7] text-white shadow-md'
      : isCaseValue
      ? 'bg-[#5c3417] text-white shadow-md'
      : isAlFatah
      ? 'bg-[#991b1b] text-white shadow-md'
      : isChaseUp
      ? 'bg-[#6b21a8] text-white shadow-md'
      : 'bg-emerald-600 text-white shadow-md',
    badgeBg: isUnimaart
      ? 'bg-sky-50 text-sky-700'
      : isCaseValue
      ? 'bg-[#f4ebe0] text-[#5c3417]'
      : isAlFatah
      ? 'bg-rose-50 text-rose-800'
      : isChaseUp
      ? 'bg-purple-50 text-purple-800'
      : 'bg-emerald-50 text-emerald-700',
    hoverText: isUnimaart
      ? 'hover:text-[#0284c7]'
      : isCaseValue
      ? 'hover:text-[#8c532b]'
      : isAlFatah
      ? 'hover:text-[#991b1b]'
      : isChaseUp
      ? 'hover:text-[#6b21a8]'
      : 'hover:text-emerald-700'
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

      {/* 📍 CUSTOMER LOCATION ENTRY & NEARBY STORES WORKFLOW (MATCHING ARCHITECTURE FLOWCHART) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pt-1">
        {/* Upfront notice banner if location not yet confirmed */}
        {!isLocationConfirmed && (
          <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xl shrink-0">
                📍
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black">
                  Select Your City & Delivery Location on Leaflet Map
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Calculates real-time distance to Al-Fatah, Chase Up, Chase Value, and Unimaart using your latitude & longitude.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs transition shadow-md cursor-pointer shrink-0"
            >
              🗺️ Open Leaflet Map & Set City
            </button>
          </div>
        )}

        {/* Step 1: Customer Enters Location (City + Address OR Use Current Location GPS) */}
        <CustomerLocationBanner />

        {/* Step 2: Nearby / Deliverable Stores (Al-Fatah, Chase Up, Chase Value, Unimaart) */}
        <NearbyStoresSection
          nearbyStores={nearbyStoresList}
          onSelectStore={handleSelectStore}
        />
      </section>

      {/* 🏬 ACTIVE STOREFRONT STATUS BANNER */}
      <div id="store-active-storefront" className="scroll-mt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div
          style={{ borderColor: currentTenant?.color || '#0284c7' }}
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div
              style={{ backgroundColor: currentTenant?.color || '#0284c7' }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-xl shadow-sm shrink-0"
            >
              {currentTenant?.logo || '🏬'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-slate-900">
                  Currently Shopping at {currentTenant?.displayName || currentTenant?.name}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  📍 {activeStoreData?.distanceFormatted || '1.2 km'} away
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  ⚡ {activeStoreData?.estimatedTime || '15-25 mins'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Fulfilling from: <strong className="text-slate-800">{currentBranch?.name || activeStoreData?.nearestBranch?.name || 'Central Hub'}</strong> • Delivering to: <span className="text-slate-700 font-semibold">{deliveryLocation?.address}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              window.scrollTo({ top: 120, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 transition cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <span>↑ Choose Another Store</span>
          </button>
        </div>
      </div>

      {/* 🚀 STORE-SPECIFIC HERO & CATEGORY EXPERIENCES */}
      {isUnimaart && (
        <>
          {/* ========================================================================= */}
          {/* UNIMAART MARKET STORE HERO, CATEGORIES & TOP SAVE TODAY (MATCHING SCREENSHOT) */}
          {/* ========================================================================= */}
          <UnimaartHero />
          <UnimaartCategoryStrip />
          <UnimaartTopSave />

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
                  {product.discountPercent > 0 ? (
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
                    {product.originalPrice > product.price && (
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

      {/* 🎁 8. Subscribe & Save + Refer & Earn Duo Banners matching QuickGrocery design */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Subscribe & Save More */}
          <div className="bg-gradient-to-r from-[#f7f2ea] to-[#f4ebe0] rounded-3xl p-6 sm:p-8 border border-amber-200/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-black text-amber-800 uppercase tracking-wider block">Smart Savings</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">Subscribe & Save More</h3>
              <p className="text-xs text-slate-600 max-w-xs">
                Schedule automatic recurring deliveries for your weekly milk, bread, farm eggs, and fruits.
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
          <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 ${
            isUnimaart
              ? 'bg-gradient-to-r from-[#f0f7ff] to-[#e0f2fe] border-sky-200/60'
              : isCaseValue
              ? 'bg-gradient-to-r from-[#fbf6ee] to-[#f4ebe0] border-[#ebdcc7]'
              : isAlFatah
              ? 'bg-gradient-to-r from-[#fff1f2] to-[#ffe4e6] border-rose-200/60'
              : isChaseUp
              ? 'bg-gradient-to-r from-[#faf5ff] to-[#f3e8ff] border-purple-200/60'
              : 'bg-gradient-to-r from-[#eef7f3] to-[#e4f2eb] border-emerald-200/60'
          }`}>
            <div className="space-y-2 text-center sm:text-left">
              <span className={`text-xs font-black uppercase tracking-wider block ${
                isUnimaart ? 'text-sky-800' : isCaseValue ? 'text-[#5c3417]' : isAlFatah ? 'text-[#991b1b]' : isChaseUp ? 'text-[#6b21a8]' : 'text-emerald-800'
              }`}>
                Rewards Program
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">Refer & Earn Rs. 500</h3>
              <p className="text-xs text-slate-600 max-w-xs">
                Invite friends and family to {currentTenant?.displayName || currentTenant?.name || 'FreshMart'}. Both of you receive <strong>Rs. 500 wallet credit</strong>!
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    addToast('Referral Link Copied', `Share your referral code FRIEND500 with friends!`, 'info');
                    navigateTo('customer-portal');
                  }}
                  className={`px-6 py-2.5 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-sm flex items-center gap-1.5 ${tenantTheme.primaryBtn}`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Refer Friends</span>
                </button>
              </div>
            </div>
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl shadow-inner shrink-0 ${
              isUnimaart ? 'bg-sky-200/60' : isCaseValue ? 'bg-[#eedec8]' : isAlFatah ? 'bg-rose-200/60' : isChaseUp ? 'bg-purple-200/60' : 'bg-emerald-200/60'
            }`}>
              🎁
            </div>
          </div>

        </div>
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
