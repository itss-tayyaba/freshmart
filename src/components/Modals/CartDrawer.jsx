import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Sparkles, Check, Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CartDrawer = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    deliveryCharges,
    discountAmount,
    cartTotal,
    appliedCoupon,
    applyCouponCode,
    navigateTo,
    currency
  } = useStore();

  const [couponInput, setCouponInput] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = await applyCouponCode(couponInput.trim());
    if (success) setCouponInput('');
  };

  const freeShippingThreshold = 1000;
  const isFreeShipping = cartSubtotal >= freeShippingThreshold;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeShippingProgress = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 bg-emerald-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-amber-300" />
            <h2 className="text-lg font-bold">Your Basket ({cart.length})</h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-white/90 focus:outline-none transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Milestone Progress Meter */}
        <div className="p-4 bg-emerald-50/80 border-b border-emerald-100 text-xs">
          <div className="flex items-center justify-between font-semibold text-emerald-950 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600" />
              {isFreeShipping ? (
                <strong className="text-emerald-800">You unlocked Free Express Shipping! 🎉</strong>
              ) : (
                <span>
                  Add <strong className="text-emerald-700 font-bold">{currency.symbol}{amountNeededForFreeShipping}</strong> more for Free Delivery
                </span>
              )}
            </span>
            <span className="font-bold text-emerald-800">{freeShippingProgress}%</span>
          </div>
          <div className="w-full h-2 bg-emerald-200/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-slate-100">
          {cart.length > 0 ? (
            cart.map((item, index) => {
              const p = item.product;
              return (
                <div key={`${p.id}-${index}`} className="pt-4 first:pt-0 flex items-center gap-4">
                  {/* Thumbnail */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {p.categoryLabel || p.category}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-extrabold text-slate-900">
                        {currency.symbol}{p.price}
                      </span>
                      <span className="text-xs text-slate-400">• {item.unit || p.unit}</span>
                    </div>
                  </div>

                  {/* Quantity Adder */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
                    <button
                      onClick={() => updateCartQuantity(p.id || p._id || p, -1)}
                      className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:text-emerald-700 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(p.id || p._id || p, 1)}
                      className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(p.id || p._id || p)}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              );
            })
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                🛒
              </div>
              <h3 className="text-base font-bold text-slate-800">Your basket is empty</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Looks like you haven't added anything to your cart yet. Explore fresh deals and groceries!
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigateTo('shop');
                }}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
              >
                Browse Superstore
              </button>
            </div>
          )}
        </div>

        {/* Footer & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-4">
            
            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Promo Code (e.g. WELCOME20)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="w-full text-xs uppercase font-mono bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Apply
              </button>
            </form>

            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs bg-emerald-100/70 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl font-medium">
                <span className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Coupon {appliedCoupon.code} Applied</span>
                </span>
                <span className="font-bold">-{currency.symbol}{discountAmount}</span>
              </div>
            )}

            {/* Bill Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">
                  {currency.symbol}{cartSubtotal}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-{currency.symbol}{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-slate-800">
                  {deliveryCharges === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    `${currency.symbol}${deliveryCharges}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-emerald-700 text-base">
                  {currency.symbol}{cartTotal}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigateTo('checkout');
                }}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={clearCart}
                className="w-full py-1 text-xs text-slate-400 hover:text-rose-600 transition-colors text-center block cursor-pointer"
              >
                Clear entire basket
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
