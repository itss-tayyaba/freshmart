import React, { useState, useEffect } from 'react';
import { TopCategoriesSidebar } from './TopCategoriesSidebar';
import { HERO_SLIDES } from '../../data/groceryData';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const HeroSection = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { setActiveCategory } = useStore();

  const slide = HERO_SLIDES[currentSlideIndex];

  // Auto-advance hero slides
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleShopNow = () => {
    setActiveCategory('all');
    const el = document.getElementById('products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="pt-6 pb-6 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Left Vertical Categories Sidebar */}
        <div className="shrink-0 hidden lg:block">
          <TopCategoriesSidebar />
        </div>

        {/* Right Hero Banner Slider matching screenshot */}
        <div
          className="flex-1 relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#f0f9f6] via-[#f7fbf9] to-[#edf7f3] border border-emerald-900/5 shadow-card min-h-[380px] lg:min-h-[420px] flex items-center group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Background Decorative subtle organic blobs */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-10 left-1/3 w-64 h-64 bg-amber-100/40 rounded-full blur-2xl pointer-events-none" />

          {/* Slide Content Container */}
          <div className="relative z-10 w-full p-6 sm:p-10 lg:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
            
            {/* Left Text Block matching screenshot */}
            <div className="max-w-md flex-1 text-left">
              
              {/* Optional Top Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-brand-green text-xs font-semibold mb-3.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                <span>{slide.tag}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.18] mb-3">
                {slide.title}
              </h1>

              {/* Subtitle with bold discount */}
              <p className="text-slate-600 text-sm sm:text-base font-normal mb-6 leading-relaxed">
                {slide.subtitle}{' '}
                <strong className="text-slate-900 font-bold">{slide.highlightDiscount}</strong>{' '}
                {slide.suffixText}
              </p>

              {/* Shop Now CTA Button matching screenshot (Vibrant Coral/Orange) */}
              <button
                onClick={handleShopNow}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-brand-accent hover:bg-brand-accentHover text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>{slide.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Slide Pagination Dots matching screenshot (bottom left) */}
              <div className="flex items-center gap-2 mt-8">
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
                      idx === currentSlideIndex
                        ? 'w-7 bg-brand-green'
                        : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right Product Composition Image matching screenshot */}
            <div className="flex-1 flex items-center justify-center relative w-full max-w-sm lg:max-w-md">
              <div className="relative">
                <img
                  key={slide.id}
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-64 sm:h-72 lg:h-80 object-cover rounded-2xl shadow-md border-4 border-white transform transition-transform duration-700 ease-out hover:scale-105"
                />

                {/* Floating badge for freshness */}
                <div className="absolute -bottom-3 -left-3 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-xl shadow-lg border border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-800 animate-bounce-soft">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Quality Checked</span>
                </div>
              </div>
            </div>

          </div>

          {/* Slider Prev / Next Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

        </div>

      </div>
    </section>
  );
};
