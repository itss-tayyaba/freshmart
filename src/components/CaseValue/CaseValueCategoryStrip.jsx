import React from 'react';
import { useStore } from '../../context/StoreContext';

export const CASE_VALUE_CIRCULAR_CATEGORIES = [
  {
    id: 'fruits-veg',
    name: 'Fruits & Vegetables',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=200&q=80',
    fallbackEmoji: '🍊'
  },
  {
    id: 'dairy-eggs',
    name: 'Dairy & Eggs',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80',
    fallbackEmoji: '🥛'
  },
  {
    id: 'bakery',
    name: 'Bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80',
    fallbackEmoji: '🍞'
  },
  {
    id: 'snacks',
    name: 'Snacks & Biscuits',
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=200&q=80',
    fallbackEmoji: '🍪'
  },
  {
    id: 'beverages',
    name: 'Beverages',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=200&q=80',
    fallbackEmoji: '🍷'
  },
  {
    id: 'cleaning',
    name: 'Household',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80',
    fallbackEmoji: '🏠'
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80',
    fallbackEmoji: '🧴'
  },
  {
    id: 'meat-poultry',
    name: 'Meat & Seafood',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=200&q=80',
    fallbackEmoji: '🥩'
  }
];

export const CaseValueCategoryStrip = () => {
  const { setActiveCategory, navigateTo } = useStore();

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-2">
      <div className="flex items-center justify-between sm:justify-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar py-3 px-1">
        {CASE_VALUE_CIRCULAR_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              navigateTo('shop');
            }}
            className="flex flex-col items-center text-center cursor-pointer group min-w-[76px] sm:min-w-[96px] shrink-0"
          >
            {/* Soft Cream Circular Disc matching screenshot */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#fdfaf4] border-2 border-[#ebdcc7] group-hover:border-[#8c532b] shadow-2xs group-hover:shadow-md transition-all duration-200 flex items-center justify-center p-2.5 overflow-hidden transform group-hover:scale-105">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-contain rounded-full"
                loading="lazy"
              />
            </div>

            {/* Category Name matching screenshot */}
            <span className="text-[11px] sm:text-xs font-bold text-[#4a2e1b] mt-2 group-hover:text-[#8c532b] transition-colors leading-tight max-w-[84px] sm:max-w-[96px] line-clamp-2">
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
