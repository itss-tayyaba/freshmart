import React from 'react';
import { Sparkles, ShoppingBag, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PRODUCTS } from '../../data/groceryData';

export const DealOfTheDay = () => {
  const { addToCart, setSelectedProductForQuickView, currency } = useStore();
  const dealProduct = PRODUCTS[4]; // Valencia Oranges

  return (
    <section className="py-8 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-card overflow-hidden relative group">
        
        {/* Background ambient lighting */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-orange-700/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
              <span>SUPER DEAL OF THE DAY</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Organic Mountain Citrus & Berry Fresh Bundle
            </h2>

            <p className="text-amber-100 text-xs sm:text-sm leading-relaxed max-w-xl">
              Get 2kg of freshly picked Spanish Valencia oranges + 500g wild mountain strawberries in our temperature-controlled eco box.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {currency.symbol}450
                </span>
                <span className="text-base text-amber-200 line-through">
                  {currency.symbol}750
                </span>
              </div>
              <span className="bg-white text-orange-600 text-xs font-black px-2.5 py-1 rounded-lg shadow-xs">
                SAVE 40%
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => addToCart(dealProduct, 1, '2kg bag')}
                className="px-7 py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <ShoppingBag className="w-4 h-4 text-lime-400" />
                <span>Claim Deal Now</span>
              </button>

              <button
                onClick={() => setSelectedProductForQuickView(dealProduct)}
                className="px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white rounded-xl font-bold text-xs sm:text-sm transition-colors"
              >
                View Bundle Details
              </button>
            </div>
          </div>

          {/* Right Product Image */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              <img
                src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80"
                alt="Deal of the Day Fresh Citrus"
                className="w-full h-64 sm:h-72 object-cover rounded-2xl shadow-2xl border-4 border-white/40 transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute -bottom-3 -right-3 bg-white text-slate-800 p-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>4.9 / 5.0 (310+ Reviews)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
