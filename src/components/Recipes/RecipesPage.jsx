import React from 'react';
import { Clock, Users, ChefHat, Plus, ShoppingBag, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { RECIPES_DATA, FRESHMART_PRODUCTS } from '../../data/freshMartData';

export const RecipesPage = () => {
  const { addRecipeIngredientsToCart, navigateTo, currency } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <ChefHat className="w-4 h-4" />
          <span>FreshMart Kitchen & Recipes</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Cook Fresh Meals with 1-Click Bundles
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Select any quick, healthy recipe below and add all fresh ingredients directly to your basket with a single tap.
        </p>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {RECIPES_DATA.map((recipe) => {
          const matchedProducts = FRESHMART_PRODUCTS.filter((p) =>
            recipe.ingredientProductIds.includes(p.id)
          );
          const bundlePrice = matchedProducts.reduce((sum, p) => sum + p.price, 0);

          return (
            <div
              key={recipe.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{recipe.cookTime}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                    {recipe.description}
                  </p>

                  {/* Ingredients List */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Ingredients Included ({matchedProducts.length}):
                    </span>
                    <div className="space-y-1.5">
                      {matchedProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-2 rounded-xl"
                        >
                          <span className="font-semibold">{prod.name}</span>
                          <span className="font-mono font-bold text-emerald-700">{currency.symbol}{prod.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1-Click Add Bundle Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Bundle Price</span>
                    <span className="text-sm font-black text-slate-900">{currency.symbol}{bundlePrice}</span>
                  </div>

                  <button
                    onClick={() => addRecipeIngredientsToCart(recipe.ingredientProductIds)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add All to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
