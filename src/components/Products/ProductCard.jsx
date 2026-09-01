import React, { useState } from 'react';
import { Heart, Eye, Star, Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const ProductCard = ({ product }) => {
  const {
    cart,
    addToCart,
    updateCartQuantity,
    isInWishlist,
    toggleWishlist,
    setSelectedProductForQuickView,
    currency
  } = useStore();

  const [selectedUnit, setSelectedUnit] = useState(product.unit);
  const isFavorited = isInWishlist(product.id);

  // Check if this product (with this selected unit) is already in cart
  const cartItem = cart.find(
    (item) => item.product.id === product.id && item.selectedUnit === selectedUnit
  );

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group relative">
      
      {/* Top Card Badges & Quick Action Buttons */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          {product.discountPercent > 0 && (
            <span className="bg-rose-500 text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-lg shadow-xs">
              -{product.discountPercent}%
            </span>
          )}
          {product.isOrganic && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-lg">
              Organic
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedProductForQuickView(product)}
            className="p-1.5 rounded-full bg-slate-100/80 hover:bg-emerald-50 text-slate-500 hover:text-brand-green transition-colors"
            title="Quick View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => toggleWishlist(product.id)}
            className={`p-1.5 rounded-full transition-colors ${
              isFavorited
                ? 'bg-rose-50 text-rose-500'
                : 'bg-slate-100/80 hover:bg-rose-50 text-slate-400 hover:text-rose-500'
            }`}
            title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Image */}
      <div
        onClick={() => setSelectedProductForQuickView(product)}
        className="relative h-40 sm:h-44 rounded-2xl overflow-hidden mb-3 bg-slate-50 cursor-pointer flex items-center justify-center"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {product.badge && (
          <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
            {product.badge}
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400">
            {product.categoryLabel}
          </span>

          <h3
            onClick={() => setSelectedProductForQuickView(product)}
            className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 mt-1 hover:text-brand-green cursor-pointer transition-colors"
          >
            {product.name}
          </h3>

          {/* Star Rating */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center text-amber-400">
              <Star className="w-3 h-3 fill-amber-400" />
            </div>
            <span className="text-xs font-bold text-slate-700">{product.rating}</span>
            <span className="text-[11px] text-slate-400">({product.reviewsCount})</span>
          </div>
        </div>

        {/* Unit Selector Options (if multi-options available) */}
        {product.unitOptions && product.unitOptions.length > 1 && (
          <div className="flex items-center gap-1 mt-3 overflow-x-auto no-scrollbar">
            {product.unitOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelectedUnit(opt)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors whitespace-nowrap ${
                  selectedUnit === opt
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Price and Add/Stepper Controls */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-sm sm:text-base font-extrabold text-brand-green">
              {currency.symbol}{(product.price * currency.rate).toFixed(2)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through ml-1.5">
                {currency.symbol}{(product.originalPrice * currency.rate).toFixed(2)}
              </span>
            )}
          </div>

          {/* If in cart, show quantity stepper, otherwise Add to Cart button */}
          {cartItem ? (
            <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-xl p-0.5">
              <button
                onClick={() => updateCartQuantity(product.id, selectedUnit, -1)}
                className="w-6 h-6 rounded-lg bg-white text-emerald-800 hover:bg-emerald-100 flex items-center justify-center font-bold text-xs shadow-2xs"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-emerald-900">
                {cartItem.quantity}
              </span>
              <button
                onClick={() => updateCartQuantity(product.id, selectedUnit, 1)}
                className="w-6 h-6 rounded-lg bg-brand-green text-white hover:bg-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product, 1, selectedUnit)}
              className="py-1.5 px-3 bg-emerald-50 hover:bg-brand-green text-brand-green hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 border border-emerald-200 hover:border-transparent group-hover:shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
