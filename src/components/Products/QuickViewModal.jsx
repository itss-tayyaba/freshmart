import React, { useState, useMemo } from 'react';
import { X, Star, Heart, Plus, Minus, ShoppingCart, ShieldCheck, Truck, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const QuickViewModal = () => {
  const {
    selectedProductForQuickView,
    setSelectedProductForQuickView,
    addToCart,
    isInWishlist,
    toggleWishlist,
    currency,
    getProductSubstitutes,
    isProductOutOfStock,
    addToast
  } = useStore();

  const product = selectedProductForQuickView;
  const isOOS = Boolean(isProductOutOfStock ? isProductOutOfStock(product) : (product?.inStock === false || product?.stockCount === 0 || product?.stock === 0));
  const substitutes = useMemo(() => {
    if (!isOOS || !product) return [];
    return typeof getProductSubstitutes === 'function' ? getProductSubstitutes(product, { limit: 3 }) : [];
  }, [isOOS, product, getProductSubstitutes]);

  const [selectedUnit, setSelectedUnit] = useState(product?.unit || '500g');
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isFavorited = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedUnit);
    setSelectedProductForQuickView(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setSelectedProductForQuickView(null)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={() => setSelectedProductForQuickView(null)}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors focus:outline-none"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Left Column: Product Image */}
          <div className="p-6 sm:p-8 bg-slate-50 flex flex-col justify-center items-center relative border-b md:border-b-0 md:border-r border-slate-100">
            <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-white shadow-card flex items-center justify-center p-2">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover rounded-xl"
              />
              {product.discountPercent > 0 && (
                <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
                  SAVE {product.discountPercent}%
                </span>
              )}
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-3 w-full mt-4 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Guaranteed Fresh</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl shadow-2xs">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Same Day Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Category & Tags */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                  {product.categoryLabel}
                </span>
                {product.isOrganic && (
                  <span className="text-[11px] font-bold text-lime-800 bg-lime-100 px-2 py-0.5 rounded-md">
                    Certified Organic
                  </span>
                )}
                {isOOS ? (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    Out of Stock
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    In Stock ({product.stockCount || 50})
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-800">{product.rating}</span>
                <span className="text-xs text-slate-400">({product.reviewsCount} customer reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-2xl font-black text-brand-green">
                  {currency.symbol}{Math.round(product.price * (currency.rate || 1)).toLocaleString()}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-slate-400 line-through">
                    {currency.symbol}{Math.round(product.originalPrice * (currency.rate || 1)).toLocaleString()}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-medium">/ {selectedUnit}</span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {product.description}
              </p>

              {/* Unit Selection Options (if in stock) */}
              {!isOOS && product.unitOptions && (
                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Package Size:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.unitOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedUnit(opt)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                          selectedUnit === opt
                            ? 'bg-brand-green text-white border-brand-green shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nutrition Key Facts */}
              {!isOOS && product.nutrition && (
                <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Nutritional Highlights
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(product.nutrition).map(([k, v]) => (
                      <div key={k} className="bg-white px-2 py-1 rounded-lg shadow-2xs">
                        <span className="text-[10px] text-slate-400 capitalize block">{k}</span>
                        <span className="font-bold text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- 🔄 SMART PRODUCT SUBSTITUTION (When Out of Stock) --- */}
              {isOOS && (
                <div className="mt-4 p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>🔄 Available Smart Alternatives</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                      In Stock
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    This item is out of stock. Select an available alternative matching size &amp; price:
                  </p>

                  <div className="space-y-2">
                    {substitutes.length > 0 ? (
                      substitutes.map((alt) => (
                        <div
                          key={alt.id}
                          className="bg-white p-2.5 rounded-xl border border-amber-200/80 hover:border-emerald-500 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={alt.image}
                              alt={alt.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100 shrink-0"
                            />
                            <div className="min-w-0">
                              <h5 className="font-bold text-slate-900 text-xs truncate leading-snug">
                                {alt.name}
                              </h5>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="font-mono font-bold text-emerald-800">
                                  {currency.symbol}{alt.price}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 font-medium">
                                  {alt.matchDetails?.sizeMatchLabel || alt.unit}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductForQuickView(alt);
                                addToast('Alternative Selected ✨', `Switched to ${alt.name}.`);
                              }}
                              className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              Select
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                addToCart(alt, 1);
                                setSelectedProductForQuickView(null);
                                addToast('Added Alternative 🛒', `${alt.name} added to cart.`);
                              }}
                              className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                              title="Add directly to cart"
                            >
                              + Basket
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No direct substitutes available right now.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Stepper & Add to Cart Action */}
            {!isOOS ? (
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors shadow-2xs"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-slate-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors shadow-2xs"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-6 bg-brand-green hover:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    Add to Cart • {currency.symbol}
                    {Math.round(product.price * quantity * (currency.rate || 1)).toLocaleString()}
                  </span>
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-3 rounded-xl border transition-colors ${
                    isFavorited
                      ? 'bg-rose-50 text-rose-500 border-rose-200'
                      : 'bg-white text-slate-500 hover:text-rose-500 border-slate-200 hover:bg-rose-50'
                  }`}
                  title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600">
                  Item unavailable — Please choose one of the smart alternatives above.
                </span>
                <button
                  onClick={() => setSelectedProductForQuickView(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
