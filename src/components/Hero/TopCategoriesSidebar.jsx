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
  const { activeCategory, setActiveCategory, addToast } = useStore();
  const [openSubcategories, setOpenSubcategories] = useState({
    'beverage': false,
    'dessert': false,
    'drinks-juice': false,
    'pets-animal': false
  });

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
      {/* Sidebar Header matching screenshot */}
      <div className="pb-3.5 mb-2 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <span>Top Categories</span>
        </h3>
        <div className="w-10 h-0.5 bg-brand-green rounded-full mt-1.5" />
      </div>

      {/* Category List */}
      <div className="space-y-1 divide-y divide-slate-50/80 flex-1">
        {CATEGORIES_SIDEBAR.map((category) => {
          const IconComponent = ICON_MAP[category.icon] || Leaf;
          const isSelected = activeCategory === category.id;
          const isSubOpen = openSubcategories[category.id];

          return (
            <div key={category.id} className="pt-1.5 first:pt-0">
              <div
                onClick={() => handleCategorySelect(category.id, category.name)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-emerald-50 text-brand-green font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-brand-green'
                }`}
              >
                {/* Left Icon + Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-brand-green'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <span className="text-xs sm:text-[13px] font-medium tracking-normal truncate">
                    {category.name}
                  </span>
                </div>

                {/* Right Arrow / Dropdown Caret matching screenshot */}
                {category.hasDropdown ? (
                  <button
                    onClick={(e) => toggleSubcategory(category.id, e)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
                    aria-label="Toggle Subcategories"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isSubOpen ? 'rotate-180 text-brand-green' : ''
                      }`}
                    />
                  </button>
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              {/* Collapsible Subcategory List */}
              {category.hasDropdown && isSubOpen && (
                <div className="pl-11 pr-2 py-1 space-y-1 bg-slate-50/60 rounded-lg mt-1 mb-1 border-l-2 border-emerald-500 animate-in slide-in-from-top-1 duration-150">
                  {category.subcategories.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCategorySelect(category.id, sub)}
                      className="block w-full text-left text-[11px] py-1 text-slate-500 hover:text-brand-green hover:font-medium transition-colors"
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
