import React from 'react';
import { ArrowRight, Crown, Sparkles, Award, ShieldCheck, Star } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AlFatahHero = () => {
  const { navigateTo } = useStore();

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-2 space-y-6">
      
      {/* 👑 Luxury Crimson & Gold Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#450a0a] via-[#7f1d1d] to-[#991b1b] overflow-hidden shadow-2xl p-6 sm:p-10 lg:p-14 text-white flex flex-col lg:flex-row items-center justify-between gap-8 min-h-[440px] border border-amber-500/20">
        
        {/* Decorative Gold Glow Background Elements */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Left Content */}
        <div className="max-w-xl z-10 text-left space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black shadow-inner">
            <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>ESTD 1941 • PAKISTAN'S PREMIER HYPERMARKET</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
            Gourmet Luxury & <br />
            <span className="text-amber-400">Imported Delicacies</span>
          </h1>

          <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed font-medium max-w-lg">
            Experience Pakistan's finest department store. Handpicked Belgian chocolates, French Normandy butter, cold-pressed Spanish olive oils, and Royal Imperial Basmati delivered with white-glove care.
          </p>

          <div className="pt-2 flex items-center gap-3 sm:gap-4 flex-wrap">
            <button
              onClick={() => navigateTo('shop')}
              className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Explore Gourmet Catalog</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={() => navigateTo('deals')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Premier Reserve Offers</span>
            </button>
          </div>

          {/* Micro Trust Indicators */}
          <div className="pt-4 flex items-center gap-6 text-xs text-rose-200/80 font-semibold border-t border-rose-800/60">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>100% Authentic Imports</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Chilled Cold-Chain Delivery</span>
            </div>
          </div>

        </div>

        {/* Right Hero Image + Luxury Badge */}
        <div className="relative z-10 flex items-center justify-center max-w-md w-full">
          <div className="relative">
            
            {/* Gold Floating Badge */}
            <div className="absolute -top-4 -right-2 sm:-right-4 w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-2xl flex flex-col items-center justify-center p-2 text-center border-4 border-white z-20">
              <span className="text-[10px] font-black uppercase tracking-wider leading-none">AL-FATAH</span>
              <span className="text-xl sm:text-2xl font-black leading-none my-0.5">GOLD</span>
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none">RESERVE</span>
            </div>

            {/* High Res Gourmet Image */}
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
              alt="Al-Fatah Gourmet Selection"
              className="w-full h-64 sm:h-80 object-cover rounded-3xl shadow-2xl border-4 border-amber-400/30"
            />

            {/* Micro Delivery Card */}
            <div className="absolute -bottom-4 -left-4 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-amber-500/30 flex items-center gap-3 text-white">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                🏬
              </div>
              <div>
                <span className="text-xs font-black block">Gulberg & DHA Hubs</span>
                <span className="text-[10px] text-amber-300 font-medium">Express White-Glove Dispatch</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
};
