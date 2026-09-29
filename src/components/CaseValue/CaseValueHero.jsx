import React from 'react';
import { ArrowRight, ShoppingCart, Sparkles, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CaseValueHero = () => {
  const { navigateTo } = useStore();

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ========================================================================= */}
        {/* 1. LARGE HERO CARD (LEFT 8 COLS MATCHING SCREENSHOT) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 bg-[#fdfaf4] border border-[#ebdcc7] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 group">
          
          {/* Left Text Block */}
          <div className="z-10 max-w-md space-y-4 text-left">
            
            {/* Pill Badge matching screenshot */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#8c532b] text-white text-[11px] font-black uppercase tracking-wider shadow-2xs">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>QUALITY YOU CAN TRUST</span>
            </div>

            {/* Headline matching screenshot */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3d2314] tracking-tight leading-[1.15]">
              Fresh Food <br />
              <span className="text-[#8c532b]">For Your Family</span>
            </h1>

            {/* Subtext matching screenshot */}
            <p className="text-xs sm:text-sm text-[#78604d] font-medium leading-relaxed">
              Local produce, fresh meat, dairy and everyday essentials — always fresh, always near you.
            </p>

            {/* Pill Button matching screenshot */}
            <div className="pt-2">
              <button
                onClick={() => navigateTo('shop')}
                className="px-7 py-3 bg-[#5c3417] hover:bg-[#43230c] text-white font-bold rounded-full text-xs sm:text-sm inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Right Image Block matching screenshot */}
          <div className="w-full md:w-1/2 flex items-center justify-center relative">
            <img
              src="/casevalue_hero_spread.jpg"
              alt="Fresh Food For Your Family - Rustic Food Spread"
              className="w-full h-56 sm:h-72 md:h-80 object-cover rounded-2xl shadow-sm border border-[#ebdcc7]/60 group-hover:scale-[1.02] transition-transform duration-300"
            />
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. TWO STACKED CARDS (RIGHT 4 COLS MATCHING SCREENSHOT) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Top Card: Fresh Meat & Seafood */}
          <div
            onClick={() => navigateTo('shop')}
            className="flex-1 bg-[#fdfaf4] border border-[#ebdcc7] rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4 group"
          >
            <div className="space-y-1.5 flex-1 text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] text-[10px] font-black uppercase tracking-wider">
                FRESH & CLEAN
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#3d2314] leading-tight group-hover:text-[#8c532b] transition-colors">
                Fresh Meat & Seafood
              </h3>
              <p className="text-[11px] text-[#78604d] font-medium">
                Premium quality, fresh every day.
              </p>
              <div className="pt-1">
                <span className="text-xs font-bold text-[#5c3417] inline-flex items-center gap-1 group-hover:underline">
                  <span>Shop Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-[#ebdcc7]">
              <img
                src="/casevalue_meat_seafood.jpg"
                alt="Fresh Meat & Seafood"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Bottom Card: Dairy & Essentials */}
          <div
            onClick={() => navigateTo('shop')}
            className="flex-1 bg-[#fdfaf4] border border-[#ebdcc7] rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4 group"
          >
            <div className="space-y-1.5 flex-1 text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] text-[10px] font-black uppercase tracking-wider">
                DAILY FRESH
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#3d2314] leading-tight group-hover:text-[#8c532b] transition-colors">
                Dairy & Essentials
              </h3>
              <p className="text-[11px] text-[#78604d] font-medium">
                Pure, healthy, for your family.
              </p>
              <div className="pt-1">
                <span className="text-xs font-bold text-[#5c3417] inline-flex items-center gap-1 group-hover:underline">
                  <span>Shop Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-[#ebdcc7]">
              <img
                src="/casevalue_dairy_eggs.jpg"
                alt="Dairy & Essentials"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
