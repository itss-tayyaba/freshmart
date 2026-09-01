import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PROMO_BANNERS } from '../../data/groceryData';
import { useStore } from '../../context/StoreContext';

export const PromoBanners = () => {
  const { setActiveCategory } = useStore();

  const handleBannerClick = (categoryTarget) => {
    setActiveCategory(categoryTarget);
    const element = document.getElementById('products-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-6 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PROMO_BANNERS.map((banner) => (
          <div
            key={banner.id}
            onClick={() => handleBannerClick(banner.categoryTarget)}
            className={`relative rounded-3xl p-6 sm:p-7 ${banner.bgColor} overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[220px] group border border-slate-100/50`}
          >
            {/* Top Tag */}
            <div className="z-10 relative">
              <span className="text-xs font-semibold text-slate-700">
                {banner.prefix}{' '}
                <strong className="text-slate-900 font-extrabold">{banner.discount}</strong>
              </span>

              {/* Title matching screenshot */}
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 leading-snug tracking-tight max-w-[180px]">
                {banner.title}
              </h3>
            </div>

            {/* Bottom CTA Button matching screenshot */}
            <div className="z-10 relative mt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick(banner.categoryTarget);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0b4d3c] hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors group-hover:scale-105"
              >
                <span>{banner.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right Side Composition Images with hover zoom */}
            <div className="absolute right-0 bottom-0 top-0 w-1/2 flex items-center justify-end pointer-events-none overflow-hidden">
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover object-center rounded-l-2xl opacity-90 group-hover:scale-110 group-hover:rotate-1 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-current opacity-20 pointer-events-none" />
            </div>

            {/* Subtle floating discount badge */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-extrabold text-emerald-800 shadow-xs">
              SAVE 30%
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
