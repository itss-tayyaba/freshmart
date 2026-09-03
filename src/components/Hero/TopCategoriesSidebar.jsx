import React, { useState } from 'react';
import {
  CupSoda,
  Cake,
  GlassWater,
  Beef,
  Apple,
  Dog,
  Gamepad2,
  Leaf,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { CATEGORIES_SIDEBAR } from '../../data/groceryData';
import { useStore } from '../../context/StoreContext';

const ICON_MAP = {
  CupSoda,
  Cake,
  GlassWater,
  Beef,
  Apple,
  Dog,
  Gamepad2,
  Leaf
};

export const TopCategoriesSidebar = () => {
  const { categories, activeCategory, setActiveCategory, addToast } = useStore();
  const [openSubcategories, setOpenSubcategories] = useState({});

  const toggleSubcategory = (id, e) => {
    e.stopPropagation();
    setOpenSubcategories((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCategorySelect = (categoryId, categoryName) => {
    setActiveCategory(categoryId);
    const element = document.getElementById('products-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    addToast('Category Filtered', `Showing items in ${categoryName}`, 'info');
  };

  return (
    <aside className="w-full lg:w-64 xl:w-72 bg-white rounded-2xl p-5 shadow-card border border-slate-100/90 h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="pb-3.5 mb-2 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <span>Top Categories</span>
        </h3>
        <div className="w-10 h-0.5 bg-emerald-600 rounded-full mt-1.5" />
      </div>

      {/* Category List */}
      <div className="space-y-1 divide-y divide-slate-50/80 flex-1 max-h-[500px] overflow-y-auto no-scrollbar">
        {(categories || []).map((category) => {
          const catId = category.id || category._id;
          const isSelected = activeCategory === catId || activeCategory === category.name;
          const isSubOpen = openSubcategories[catId];
          const hasSubs = Array.isArray(category.subcategories) && category.subcategories.length > 0;

          return (
            <div key={catId} className="pt-1.5 first:pt-0">
              <div
                onClick={() => handleCategorySelect(catId, category.name)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-700'
                }`}
              >
                {/* Left Icon / Image + Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100'
                    }`}
                  >
                    {category.image ? (
                      <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                    ) : (
                      <Leaf className="w-4 h-4 stroke-[1.8]" />
                    )}
                  </div>
                  <span className="text-xs sm:text-[13px] font-medium tracking-normal truncate">
                    {category.name}
                  </span>
                </div>

                {/* Right Arrow / Dropdown Caret */}
                {hasSubs ? (
                  <button
                    onClick={(e) => toggleSubcategory(catId, e)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
                    aria-label="Toggle Subcategories"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isSubOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              {/* Collapsible Subcategory List */}
              {hasSubs && isSubOpen && (
                <div className="pl-11 pr-2 py-1 space-y-1 bg-slate-50/60 rounded-lg mt-1 mb-1 border-l-2 border-emerald-500 animate-in slide-in-from-top-1 duration-150">
                  {category.subcategories.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCategorySelect(catId, sub)}
                      className="block w-full text-left text-[11px] py-1 text-slate-500 hover:text-emerald-700 hover:font-medium transition-colors cursor-pointer"
                    >
                      • {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
