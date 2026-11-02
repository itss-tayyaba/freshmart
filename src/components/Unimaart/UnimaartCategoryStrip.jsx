import React, { useState, useMemo } from 'react';
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
  Droplets,
  LayoutGrid
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { matchesProductCategory } from '../../utils/categoryHelper';

export const UnimaartCategoryStrip = ({ activeCategory, onSelectCategory }) => {
  const { setActiveCategory, activeCategory: storeActiveCategory, products } = useStore();

  const allPossibleCategories = [
    {
      id: 'fruits-veg',
      name: 'Vegetables & Fruit',
      icon: Carrot,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'beverages',
      name: 'Beverages',
      icon: Coffee,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'dry-foods',
      name: 'Dry Foods & Staples',
      icon: Wheat,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'oil-ghee',
      name: 'Cooking Oil & Ghee',
      icon: Droplets,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'dairy-eggs',
      name: 'Milk & Dairies',
      icon: Milk,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'meat-poultry',
      name: 'Meats & Seafood',
      icon: Beef,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'snacks',
      name: 'Snacks & Munchies',
      icon: Cookie,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'bakery',
      name: 'Breakfast & Bakery',
      icon: Croissant,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'frozen-foods',
      name: 'Frozen Foods',
      icon: Snowflake,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'pet-food',
      name: 'Pet Food',
      icon: PawPrint,
      activeColor: 'bg-[#0284c7] text-white'
    }
  ];

  // Strictly only show categories that are AVAILABLE in the active store
  const availableCategories = useMemo(() => {
    return allPossibleCategories
      .map((cat) => {
        const count = (products || []).filter((p) => matchesProductCategory(p, cat.id)).length;
        return { ...cat, count, badge: `${count} Items` };
      })
      .filter((cat) => cat.count > 0);
  }, [products]);

  const currentSelected = activeCategory || storeActiveCategory || (availableCategories[0]?.id || 'all');

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

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Available Categories ({availableCategories.length})
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-[#0284c7]">
            Active: {availableCategories.find((c) => c.id === currentSelected)?.name || 'All Items'}
          </span>
        </div>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-${Math.min(availableCategories.length, 6)} gap-3 sm:gap-4 transition-all duration-300`}>
        {availableCategories.map((cat) => {
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
                  {cat.count} Available {cat.count === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
