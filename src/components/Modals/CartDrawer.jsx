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
    freeShippingThreshold,
    isFreeShipping,
    shippingFee,
    discountAmount,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    setIsCheckoutOpen,
    currency
  } = useStore();

  const [couponInput, setCouponInput] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = applyCoupon(couponInput.trim());
    if (success) setCouponInput('');
  };

  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeShippingProgress = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 bg-brand-green text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-lime-400" />
            <h2 className="text-lg font-bold">Your Basket ({cart.length})</h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-white/90 focus:outline-none transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Milestone Progress Meter */}
        <div className="p-4 bg-emerald-50/80 border-b border-emerald-100 text-xs">
          <div className="flex items-center justify-between font-semibold text-emerald-950 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-brand-green" />
              {isFreeShipping ? (
                <strong className="text-emerald-800">You unlocked Free Express Shipping! 🎉</strong>
              ) : (
                <span>
                  Add <strong className="text-brand-green">{currency.symbol}{(amountNeededForFreeShipping * currency.rate).toFixed(2)}</strong> more for Free Shipping
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
                <div key={`${p.id}-${item.selectedUnit}-${index}`} className="pt-4 first:pt-0 flex items-center gap-4">
                  {/* Thumbnail */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {p.name}
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                      Pack: {item.selectedUnit}
                    </span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-extrabold text-brand-green">
                        {currency.symbol}{(p.price * currency.rate).toFixed(2)}
                      </span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                        <button
                          onClick={() => updateCartQuantity(p.id, item.selectedUnit, -1)}
                          className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(p.id, item.selectedUnit, 1)}
                          className="w-6 h-6 rounded bg-brand-green hover:bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(p.id, item.selectedUnit)}
                    className="p-2 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-slate-400">
              <ShoppingBag className="w-16 h-16 mx-auto stroke-1 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700">Your basket is empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Explore our fresh vegetables, fruits, and organic cuts to fill up!
              </p>
            </div>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cart.length > 0 && (
          <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
            
            {/* Coupon Code Input */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-100/70 border border-emerald-300 rounded-xl px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <Tag className="w-4 h-4 text-emerald-700" />
                    <span>Coupon '{appliedCoupon.code}' Applied ({appliedCoupon.discountPercent}% OFF)</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-rose-600 hover:text-rose-700 font-bold text-xs ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. FRESH30)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase placeholder:normal-case font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">
                  {currency.symbol}{(cartSubtotal * currency.rate).toFixed(2)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-{currency.symbol}{(discountAmount * currency.rate).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-slate-800">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    `${currency.symbol}${(shippingFee * currency.rate).toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-brand-green text-base">
                  {currency.symbol}{(cartTotal * currency.rate).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3.5 px-4 bg-brand-accent hover:bg-brand-accentHover text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={clearCart}
                className="w-full py-2 text-xs text-slate-400 hover:text-rose-600 transition-colors text-center block"
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
