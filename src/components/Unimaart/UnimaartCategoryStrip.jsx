import React, { useState } from 'react';
import {
  Carrot,
  Coffee,
  Beef,
  Snowflake,
  Croissant,
  PawPrint,
  Milk,
  Cookie,
  Wheat,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const UnimaartCategoryStrip = ({ activeCategory, onSelectCategory }) => {
  const { navigateTo, setActiveCategory, activeCategory: storeActiveCategory } = useStore();
  const [showMore, setShowMore] = useState(false);

  // Main primary 7 categories matching reference screenshot
  const primaryCategories = [
    {
      id: 'fruits-veg',
      name: 'Vegetables & Fruit',
      icon: Carrot,
      activeColor: 'bg-[#0284c7] text-white',
      badge: '5 Items'
    },
    {
      id: 'beverages',
      name: 'Beverages',
      icon: Coffee,
      activeColor: 'bg-[#0284c7] text-white',
      badge: '5 Items'
    },
    {
      id: 'meat-poultry',
      name: 'Meats & Seafood',
      icon: Beef,
      activeColor: 'bg-[#0284c7] text-white',
      badge: '5 Items'
    },
    {
      id: 'frozen-foods',
      name: 'Frozen Foods',
      icon: Snowflake,
      activeColor: 'bg-[#0284c7] text-white',
      badge: '5 Items'
    },
    {
      id: 'bakery',
      name: 'Breakfast',
      icon: Croissant,
      activeColor: 'bg-[#0284c7] text-white',
      badge: '5 Items'
    },
    {
      id: 'pet-food',
      name: 'Pet Food',
      icon: PawPrint,
      activeColor: 'bg-[#0284c7] text-white',
      badge: '5 Items'
    },
    {
      id: 'dairy-eggs',
      name: 'Milk & Dairies',
      icon: Milk,
      activeColor: 'bg-[#0284c7] text-white',
      badge: '5 Items'
    }
  ];

  // Additional categories accessible via "More Options"
  const extraCategories = [
    {
      id: 'snacks',
      name: 'Snacks & Munchies',
      icon: Cookie,
      activeColor: 'bg-[#0284c7] text-white',
      badge: '5 Items'
    },
    {
      id: 'grocery-staples',
      name: 'Grocery Staples',
      icon: Wheat,
      activeColor: 'bg-[#0284c7] text-white',
      badge: '5 Items'
    }
  ];

  const currentSelected = activeCategory || storeActiveCategory || 'fruits-veg';

  const handleCategoryClick = (catId) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    if (setActiveCategory) {
      setActiveCategory(catId);
    }

    // Smooth scroll down to the product showcase
    const showcase = document.getElementById('unimaart-top-save');
    if (showcase) {
      showcase.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const displayedCategories = showMore
    ? [...primaryCategories, ...extraCategories]
    : primaryCategories;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Browse Categories (5 Items Each)
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-[#0284c7]">
            Active: {displayedCategories.find((c) => c.id === currentSelected)?.name || 'Vegetables & Fruit'}
          </span>
        </div>

        {/* More Options Toggle Button */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="text-xs font-bold text-[#0284c7] hover:text-[#0369a1] bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>{showMore ? 'Show Fewer Options' : '+ More Options (Snacks, Staples)'}</span>
        </button>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-4 ${showMore ? 'lg:grid-cols-9' : 'lg:grid-cols-7'} gap-3 sm:gap-4 transition-all duration-300`}>
        {displayedCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = currentSelected === cat.id;

          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 text-center min-h-[110px] select-none ${
                isActive
                  ? 'bg-[#0284c7] text-white shadow-lg shadow-[#0284c7]/25 ring-2 ring-[#0284c7] scale-[1.02]'
                  : 'bg-[#f4f6f8] hover:bg-sky-50 text-slate-700 hover:text-[#0284c7] border border-slate-200/60'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700 shadow-2xs'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="space-y-0.5">
                <span className={`text-xs font-bold leading-tight block ${isActive ? 'text-white' : 'text-slate-700'}`}>
                  {cat.name}
                </span>
                <span className={`text-[9px] font-semibold block ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                  5 Curated Items
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
