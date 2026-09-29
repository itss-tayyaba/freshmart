import React from 'react';
import {
  Carrot,
  Coffee,
  Beef,
  Snowflake,
  Croissant,
  PawPrint,
  Milk
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const UnimaartCategoryStrip = ({ activeCategory, onSelectCategory }) => {
  const { navigateTo, setActiveCategory } = useStore();

  const categories = [
    {
      id: 'fruits-veg',
      name: 'Vegetables & Fruit',
      icon: Carrot,
      activeColor: 'bg-[#0284c7] text-white',
      badge: 'Fresh'
    },
    {
      id: 'beverages',
      name: 'Beverages',
      icon: Coffee,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'meat-poultry',
      name: 'Meats & Seafood',
      icon: Beef,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'frozen-foods',
      name: 'Frozen Foods',
      icon: Snowflake,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'bakery',
      name: 'Breakfast',
      icon: Croissant,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'pet-food',
      name: 'Pet Food',
      icon: PawPrint,
      activeColor: 'bg-[#0284c7] text-white'
    },
    {
      id: 'dairy-eggs',
      name: 'Milk & Dairies',
      icon: Milk,
      activeColor: 'bg-[#0284c7] text-white'
    }
  ];

  const handleCategoryClick = (catId) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    if (setActiveCategory) {
      setActiveCategory(catId);
    }
  };

  const selectedCat = activeCategory || 'fruits-veg';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCat === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 text-center min-h-[110px] select-none ${
                isActive
                  ? 'bg-[#0284c7] text-white shadow-lg shadow-[#0284c7]/25 ring-2 ring-[#0284c7]'
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

              <span className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-700'}`}>
                {cat.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
