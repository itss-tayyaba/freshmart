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
    removeCouponCode,
    promotions,
    navigateTo,
    currency,
    getProductSubstitutes,
    isProductOutOfStock,
    substituteCartItem,
    setSelectedProductForQuickView,
    currentTenant
  } = useStore();

  const [couponInput, setCouponInput] = useState('');

  // Multi-tenant theme color: Defaults to Unimaart Blue (#0284c7)
  const isAlFatah = currentTenant?.id === 'tenant-alfatah';
  const isChaseUp = currentTenant?.id === 'tenant-chaseup';
  const isCaseValue = currentTenant?.id === 'tenant-chasevalue';

  const tenantThemeColor = currentTenant?.color || (
    isAlFatah ? '#991b1b' :
    isChaseUp ? '#6b21a8' :
    isCaseValue ? '#78350f' :
    '#0284c7'
  );

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
        
        {/* Header - Dynamically themed to store color (Unimaart Blue #0284c7) */}
        <div
          style={{ backgroundColor: tenantThemeColor }}
          className="p-5 text-white flex items-center justify-between shadow-md transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-amber-300" />
            <h2 className="text-lg font-bold">Your Basket ({cart.length})</h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-full hover:bg-black/15 text-white/90 focus:outline-none transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Milestone Progress Meter - Dynamically themed */}
        <div
          style={{
            backgroundColor: `${tenantThemeColor}0d`,
            borderColor: `${tenantThemeColor}25`
          }}
          className="p-4 border-b text-xs transition-colors"
        >
          <div className="flex items-center justify-between font-semibold mb-1.5" style={{ color: tenantThemeColor }}>
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4" style={{ color: tenantThemeColor }} />
              {isFreeShipping ? (
                <strong>You unlocked Free Express Shipping! 🎉</strong>
              ) : (
                <span>
                  Add <strong className="font-bold">{currency.symbol}{amountNeededForFreeShipping}</strong> more for Free Delivery
                </span>
              )}
            </span>
            <span className="font-bold">{freeShippingProgress}%</span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: `${tenantThemeColor}20` }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${freeShippingProgress}%`,
                backgroundColor: tenantThemeColor
              }}
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
                    {item.isSubstituted && item.originalProduct && (
                      <div className="mt-0.5">
                        <span
                          style={{
                            color: tenantThemeColor,
                            backgroundColor: `${tenantThemeColor}12`,
                            borderColor: `${tenantThemeColor}30`
                          }}
                          className="inline-flex items-center gap-1 text-[9px] font-bold border px-1.5 py-0.2 rounded"
                        >
                          <span>🔄 Substituted</span>
                          <span className="text-slate-500">(Originally: {item.originalProduct.name})</span>
                        </span>
                      </div>
                    )}
                    {isProductOutOfStock && isProductOutOfStock(p) && (
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded uppercase">
                          Out of stock
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const alts = getProductSubstitutes ? getProductSubstitutes(p, { limit: 1 }) : [];
                            if (alts.length > 0) {
                              substituteCartItem(p.id, alts[0]);
                            } else if (setSelectedProductForQuickView) {
                              setSelectedProductForQuickView(p);
                            }
                          }}
                          style={{ color: tenantThemeColor }}
                          className="text-[10px] font-black underline cursor-pointer hover:opacity-80"
                        >
                          Replace with alternative ✨
                        </button>
                      </div>
                    )}
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
                      className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:text-slate-900 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      style={{ backgroundColor: tenantThemeColor }}
                      onClick={() => updateCartQuantity(p.id || p._id || p, 1)}
                      className="w-6 h-6 rounded-lg text-white flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer hover:opacity-90 transition-opacity"
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
              <div
                style={{ backgroundColor: `${tenantThemeColor}15`, color: tenantThemeColor }}
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl"
              >
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
                style={{ backgroundColor: tenantThemeColor }}
                className="px-6 py-2.5 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
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
                  placeholder="Enter Promo Code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="w-full text-xs uppercase font-mono bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                style={{ backgroundColor: tenantThemeColor }}
                className="px-4 py-2.5 text-white rounded-xl text-xs font-bold transition-opacity hover:opacity-90 cursor-pointer shadow-xs"
              >
                Apply
              </button>
            </form>

            {/* Quick Promo Codes Suggestions (Dynamic from Admin) */}
            {!appliedCoupon && promotions && promotions.filter(p => p.status === 'Active').length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className="text-slate-400 font-bold">Suggested:</span>
                {promotions
                  .filter(p => p.status === 'Active')
                  .slice(0, 3)
                  .map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => applyCouponCode(p.code)}
                      style={{
                        backgroundColor: `${tenantThemeColor}12`,
                        borderColor: `${tenantThemeColor}30`,
                        color: tenantThemeColor
                      }}
                      className="px-2 py-0.5 border rounded-lg font-mono font-black transition-opacity hover:opacity-80 cursor-pointer"
                    >
                      {p.code}
                    </button>
                  ))}
              </div>
            )}

            {appliedCoupon && (
              <div
                style={{
                  backgroundColor: `${tenantThemeColor}10`,
                  borderColor: `${tenantThemeColor}30`
                }}
                className="flex items-center justify-between text-xs border px-3 py-2 rounded-xl font-medium"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: tenantThemeColor }} />
                  <div>
                    <span className="font-black font-mono block" style={{ color: tenantThemeColor }}>{appliedCoupon.code}</span>
                    <span className="text-[10px] text-slate-600 block">{appliedCoupon.description || 'Discount active'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm" style={{ color: tenantThemeColor }}>-{currency.symbol}{discountAmount}</span>
                  <button
                    type="button"
                    onClick={removeCouponCode}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove coupon"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
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
                    <span style={{ color: tenantThemeColor }} className="font-bold">FREE</span>
                  ) : (
                    `${currency.symbol}${deliveryCharges}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span style={{ color: tenantThemeColor }} className="text-base font-black">
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
                style={{ backgroundColor: tenantThemeColor }}
                className="w-full py-3.5 px-4 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:opacity-95 transition-all cursor-pointer"
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
