import React from 'react';
import { ArrowRight, ShoppingBag, Sparkles, TrendingDown, Users, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const ChaseUpHero = () => {
  const { navigateTo } = useStore();

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-2 space-y-6">
      
      {/* 🏪 Royal Purple & Tangerine Megastore Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#3b0764] via-[#581c87] to-[#6b21a8] overflow-hidden shadow-2xl p-6 sm:p-10 lg:p-14 text-white flex flex-col lg:flex-row items-center justify-between gap-8 min-h-[440px] border border-purple-500/20">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Left Content */}
        <div className="max-w-xl z-10 text-left space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 text-xs font-black shadow-inner">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            <span>ONE-STOP FAMILY SUPERMARKET & DEPARTMENT STORE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
            Mega Family Savings <br />
            <span className="text-orange-400">& Fresh Grocery</span>
          </h1>

          <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed font-medium max-w-lg">
            Shop Karachi & Punjab’s favorite superstore chain. Bulk family cartons of milk, 5-liter cooking oil packs, pantry staples, confectionery and fresh kitchen essentials at direct value prices.
          </p>

          <div className="pt-2 flex items-center gap-3 sm:gap-4 flex-wrap">
            <button
              onClick={() => navigateTo('shop')}
              className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Shop Family Bundles</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={() => navigateTo('deals')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-orange-300" />
              <span>Mega Saver Deals</span>
            </button>
          </div>

          {/* Micro Trust Indicators */}
          <div className="pt-4 flex items-center gap-6 text-xs text-purple-200/80 font-semibold border-t border-purple-800/60">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-orange-400" />
              <span>Clifton & Hassan Square Dark Stores</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-orange-400" />
              <span>Lowest Supermarket Prices Guaranteed</span>
            </div>
          </div>

        </div>

        {/* Right Hero Image + Super Saver Badge */}
        <div className="relative z-10 flex items-center justify-center max-w-md w-full">
          <div className="relative">
            
            {/* Orange Floating Badge */}
            <div className="absolute -top-4 -right-2 sm:-right-4 w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-2xl flex flex-col items-center justify-center p-2 text-center border-4 border-white z-20">
              <span className="text-[10px] font-black uppercase tracking-wider leading-none">FAMILY</span>
              <span className="text-xl sm:text-2xl font-black leading-none my-0.5">MEGA</span>
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none">SAVINGS</span>
            </div>

            {/* High Res Family Supermarket Artwork */}
            <img
              src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80"
              alt="Chase Up Superstore Family Shopping"
              className="w-full h-64 sm:h-80 object-cover rounded-3xl shadow-2xl border-4 border-orange-400/30"
            />

            {/* Micro Delivery Card */}
            <div className="absolute -bottom-4 -left-4 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-purple-500/30 flex items-center gap-3 text-white">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                🏪
              </div>
              <div>
                <span className="text-xs font-black block">Chase Up Fleet Active</span>
                <span className="text-[10px] text-orange-300 font-medium">Fast Doorstep Delivery</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
};
