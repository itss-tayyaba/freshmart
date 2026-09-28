import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const UnimaartHero = () => {
  const { navigateTo, setActiveCategory } = useStore();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* ========================================================================= */}
        {/* 1. MAIN LEFT BANNER (FAST DELIVERY COURIER & FRESH FOOD) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 bg-[#f3f7f5] rounded-3xl p-6 sm:p-10 lg:p-12 relative overflow-hidden border border-emerald-900/5 shadow-xs flex flex-col justify-between min-h-[380px] sm:min-h-[440px]">
          
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Left Text Content */}
          <div className="max-w-md sm:max-w-sm lg:max-w-md z-10 space-y-4 my-auto">
            
            {/* Offer Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffe8ec] text-[#ff4757] text-[11px] font-black uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#ff4757]" />
              <span>Exclusive offer 25% Off</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 leading-[1.12] tracking-tight uppercase">
              Fresh Food, Fair <br />
              Prices, <span className="text-[#00a676]">Fast Delivery</span>
            </h1>

            {/* Subtext */}
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-sm">
              Fresh veggies full of vitamins for your health. Quality produce delivered right to you.
            </p>

            {/* Shop Now Button */}
            <div className="pt-2">
              <button
                onClick={() => navigateTo('shop')}
                className="px-7 py-3.5 bg-[#ff4757] hover:bg-[#e03848] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Courier Artwork (Matching Screenshot) */}
          <div className="absolute right-0 bottom-0 top-0 w-1/2 sm:w-5/12 lg:w-1/2 flex items-end justify-end pointer-events-none z-0">
            <img
              src="/unimaart_courier_hero.jpg"
              alt="Unimaart Fast Grocery Delivery Courier"
              className="max-h-[92%] sm:max-h-[98%] w-auto object-contain object-bottom drop-shadow-xl"
            />
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. RIGHT STACKED CARDS (ORGANIC MARKET & NUT COLLECTION) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-5 justify-between">
          
          {/* Top Card: Healthy Food / Organic Market */}
          <div
            onClick={() => {
              setActiveCategory('fruits-veg');
              navigateTo('shop');
            }}
            className="bg-[#f8f9fa] rounded-3xl p-5 sm:p-6 relative overflow-hidden flex-1 flex items-center justify-between border border-slate-200/60 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            <div className="z-10 max-w-[170px] space-y-1">
              <span className="text-[#00a676] font-bold text-xs uppercase tracking-wider block">
                Healthy Food
              </span>
              <h3 className="text-[#ff4757] font-black text-lg sm:text-xl leading-tight">
                Organic Market
              </h3>
              <p className="text-[11px] text-slate-500 font-medium leading-snug pt-1">
                Start your daily shopping with some Organic food
              </p>
              <span className="text-xs font-black text-slate-900 group-hover:text-[#00a676] inline-flex items-center gap-1.5 pt-2 transition-colors">
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 ml-2">
              <img
                src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=400&q=80"
                alt="Organic Market Fresh Food Flatlay"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Bottom Card: 25% OFF Nut Collection */}
          <div
            onClick={() => {
              setActiveCategory('snacks');
              navigateTo('shop');
            }}
            className="bg-[#f8f9fa] rounded-3xl p-5 sm:p-6 relative overflow-hidden flex-1 flex items-center justify-between border border-slate-200/60 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            <div className="z-10 max-w-[170px] space-y-1">
              <span className="text-[#ff4757] bg-[#ffe8ec] font-black text-[10px] uppercase px-2 py-0.5 rounded-md inline-block">
                25% OFF
              </span>
              <h3 className="text-[#00a676] font-black text-lg sm:text-xl leading-tight">
                Nut Collection
              </h3>
              <p className="text-[11px] text-slate-500 font-medium leading-snug pt-1">
                We deliver organic vegetables & fruits.
              </p>
              <span className="text-xs font-black text-slate-900 group-hover:text-[#00a676] inline-flex items-center gap-1.5 pt-2 transition-colors">
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 ml-2">
              <img
                src="https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=400&q=80"
                alt="Nut Collection Almonds and Walnuts"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
