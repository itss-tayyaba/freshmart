import React, { useState, useMemo } from 'react';
import { ProductCard } from './ProductCard';
import { PRODUCTS } from '../../data/groceryData';
import { useStore } from '../../context/StoreContext';
import { SlidersHorizontal, Sparkles, Filter, Check } from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Items' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fresh Fruits' },
  { id: 'fish-meats', label: 'Fish & Meat' },
  { id: 'drinks-juice', label: 'Drinks & Juice' },
  { id: 'cooking', label: 'Cooking & Oils' },
  { id: 'biscuits-cakes', label: 'Biscuits & Cakes' },
  { id: 'home-cleaning', label: 'Home Cleaning' }
];

export const ProductGrid = () => {
  const { activeCategory, setActiveCategory } = useStore();
  const [sortBy, setSortBy] = useState('recommended');
  const [onlyOrganic, setOnlyOrganic] = useState(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...PRODUCTS];

    if (activeCategory && activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }

    if (onlyOrganic) {
      result = result.filter((p) => p.isOrganic);
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        result.sort((a, b) => b.discountPercent - a.discountPercent);
        break;
      default:
        // 'recommended'
        break;
    }

    return result;
  }, [activeCategory, sortBy, onlyOrganic]);

  return (
    <section id="products-section" className="py-8 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-emerald-100/80 px-2.5 py-1 rounded-full">
              Explore Our Store
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mt-2">
            Featured Products & Farm Specials
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Showing {filteredProducts.length} freshest products curated for today.
          </p>
        </div>

        {/* Filter controls & Sort by dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Organic Filter Toggle */}
          <button
            onClick={() => setOnlyOrganic(!onlyOrganic)}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-colors flex items-center gap-1.5 ${
              onlyOrganic
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Organic Only</span>
            {onlyOrganic && <Check className="w-3.5 h-3.5" />}
          </button>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="recommended">Featured / Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-brand-green text-white shadow-sm ring-2 ring-emerald-600/30'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-card">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No products found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            There are no products matching your selected category and filter combinations.
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setOnlyOrganic(false);
            }}
            className="px-4 py-2 bg-brand-green text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
};
