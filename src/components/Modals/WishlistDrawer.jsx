import React from 'react';
import { X, Heart, Trash2, ShoppingBag, Plus } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PRODUCTS } from '../../data/groceryData';

export const WishlistDrawer = () => {
  const {
    isWishlistOpen,
    setIsWishlistOpen,
    wishlist,
    toggleWishlist,
    addToCart,
    setSelectedProductForQuickView,
    currency,
    addToast
  } = useStore();

  if (!isWishlistOpen) return null;

  const wishlistProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));

  const handleMoveAllToCart = () => {
    wishlistProducts.forEach((p) => addToCart(p, 1));
    addToast('Moved to Basket', `Added ${wishlistProducts.length} items to your cart.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsWishlistOpen(false)}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 bg-brand-green text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <h2 className="text-lg font-bold">Your Wishlist ({wishlistProducts.length})</h2>
          </div>
          <button
            onClick={() => setIsWishlistOpen(false)}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-white/90 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-slate-100">
          {wishlistProducts.length > 0 ? (
            wishlistProducts.map((p) => (
              <div key={p.id} className="pt-4 first:pt-0 flex items-center gap-4">
                <img
                  src={p.image}
                  alt={p.name}
                  onClick={() => {
                    setIsWishlistOpen(false);
                    setSelectedProductForQuickView(p);
                  }}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0 cursor-pointer"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {p.categoryLabel}
                  </span>
                  <h4
                    onClick={() => {
                      setIsWishlistOpen(false);
                      setSelectedProductForQuickView(p);
                    }}
                    className="text-xs sm:text-sm font-bold text-slate-800 truncate cursor-pointer hover:text-brand-green"
                  >
                    {p.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-extrabold text-brand-green">
                      {currency.symbol}{(p.price * currency.rate).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400">• {p.unit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => addToCart(p, 1)}
                    className="p-2 bg-emerald-50 hover:bg-brand-green text-brand-green hover:text-white rounded-xl transition-colors"
                    title="Add to basket"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleWishlist(p.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 rounded-xl transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-slate-400">
              <Heart className="w-16 h-16 mx-auto stroke-1 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700">Wishlist is empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Click the heart icon on any product to save it here for later!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {wishlistProducts.length > 0 && (
          <div className="p-5 bg-slate-50 border-t border-slate-100">
            <button
              onClick={handleMoveAllToCart}
              className="w-full py-3 bg-brand-green hover:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Move All to Basket</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
