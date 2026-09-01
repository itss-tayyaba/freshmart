import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES_CAROUSEL } from '../../data/groceryData';
import { useStore } from '../../context/StoreContext';

export const CategoriesSlider = () => {
  const { activeCategory, setActiveCategory, addToast } = useStore();
  const scrollContainerRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat.id);
    const element = document.getElementById('products-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    addToast('Category Selected', `Showing ${cat.name} (${cat.itemsCount} items)`);
  };

  return (
    <section className="py-6 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          Categories
        </h2>

        {/* Carousel Arrow Controls matching screenshot */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScroll('left')}
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-brand-green flex items-center justify-center transition-colors shadow-xs focus:outline-none"
            aria-label="Previous categories"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="w-8 h-8 rounded-lg bg-[#0b4d3c] text-white hover:bg-emerald-800 flex items-center justify-center transition-colors shadow-xs focus:outline-none"
            aria-label="Next categories"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth"
      >
        {CATEGORIES_CAROUSEL.map((cat) => {
          const isActive = activeCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className={`min-w-[130px] sm:min-w-[145px] flex-1 rounded-2xl p-4 flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-200 transform hover:-translate-y-1 shadow-card hover:shadow-card-hover select-none ${
                isActive
                  ? 'bg-[#0d483c] text-white ring-2 ring-emerald-500/50 shadow-md'
                  : 'bg-white text-slate-800 hover:border-emerald-200 border border-slate-100/90'
              }`}
            >
              {/* Category Name & Item count matching screenshot */}
              <div className="mb-3">
                <h4
                  className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
                    isActive ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {cat.name}
                </h4>
                <span
                  className={`text-[11px] font-medium block mt-0.5 ${
                    isActive ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  {cat.itemsCount} items
                </span>
              </div>

              {/* Category Circular Thumbnail matching screenshot */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden p-1 bg-white shadow-inner flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full transform group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
