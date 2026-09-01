import React from 'react';
import { X, Heart, Trash2, ShoppingBag, Plus } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const WishlistDrawer = () => {
  const {
    isWishlistOpen,
    setIsWishlistOpen,
    wishlist,
    toggleWishlist,
    addToCart,
    products,
    navigateTo,
    currency,
    addToast
  } = useStore();

  if (!isWishlistOpen) return null;

  // Filter products currently in wishlist
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id || p._id));

  const handleMoveAllToCart = () => {
    wishlistProducts.forEach((p) => addToCart(p, 1));
    addToast('Moved to Basket', `Added ${wishlistProducts.length} items to your cart.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsWishlistOpen(false)}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 bg-emerald-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <h2 className="text-lg font-bold">Your Wishlist ({wishlistProducts.length})</h2>
          </div>
          <button
            onClick={() => setIsWishlistOpen(false)}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-white/90 focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-slate-100">
          {wishlistProducts.length > 0 ? (
            wishlistProducts.map((p) => (
              <div key={p.id || p._id} className="pt-4 first:pt-0 flex items-center gap-4">
                <img
                  src={p.image}
                  alt={p.name}
                  onClick={() => {
                    setIsWishlistOpen(false);
                    navigateTo('product-detail', p);
                  }}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0 cursor-pointer hover:opacity-90"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {p.categoryLabel || p.category}
                  </span>
                  <h4
                    onClick={() => {
                      setIsWishlistOpen(false);
                      navigateTo('product-detail', p);
                    }}
                    className="text-xs sm:text-sm font-bold text-slate-800 truncate cursor-pointer hover:text-emerald-700"
                  >
                    {p.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-extrabold text-slate-900">
                      {currency.symbol}{p.price}
                    </span>
                    <span className="text-xs text-slate-400">• {p.unit || '1 unit'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      addToCart(p, 1);
                    }}
                    className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl transition-colors cursor-pointer"
                    title="Add to basket"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleWishlist(p.id || p._id)}
                    className="p-2 text-slate-300 hover:text-rose-500 rounded-xl transition-colors cursor-pointer"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-2xl">
                ❤️
              </div>
              <h3 className="text-base font-bold text-slate-800">Your wishlist is empty</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Explore our catalog and click the heart icon on your favorite grocery items to save them here.
              </p>
              <button
                onClick={() => {
                  setIsWishlistOpen(false);
                  navigateTo('shop');
                }}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
              >
                Start Shopping
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {wishlistProducts.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-2">
            <button
              onClick={handleMoveAllToCart}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
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
