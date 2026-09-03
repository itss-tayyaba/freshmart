import React from 'react';
import { X, Sparkles, Tag, Copy, Check, Gift } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { COUPONS } from '../../data/groceryData';

export const OffersModal = () => {
  const { isOffersOpen, setIsOffersOpen, applyCouponCode, addToast } = useStore();

  if (!isOffersOpen) return null;

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    applyCouponCode(code);
    setIsOffersOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOffersOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Exclusive Offers & Coupons</h2>
              <p className="text-xs text-rose-100">Tap any coupon to activate instantly</p>
            </div>
          </div>
          <button
            onClick={() => setIsOffersOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coupons List */}
        <div className="p-6 space-y-4">
          {COUPONS.map((coupon) => (
            <div
              key={coupon.code}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 bg-slate-50/50 hover:bg-emerald-50/30 transition-all flex items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-slate-800 tracking-wider">
                      {coupon.code}
                    </span>
                    {coupon.isPopular && (
                      <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-snug">
                    {coupon.description}
                  </p>
                  <span className="text-[11px] font-semibold text-slate-400 block mt-1">
                    Min. spend: ${coupon.minSpend}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleCopy(coupon.code)}
                className="px-4 py-2 bg-brand-green hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Apply
              </button>
            </div>
          ))}

          {/* Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3 text-xs text-emerald-900">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              First time shopper? Use code <strong className="font-mono font-bold">FRESH30</strong> for an instant 30% discount!
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
