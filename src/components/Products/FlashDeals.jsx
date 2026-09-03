import React, { useState, useEffect } from 'react';
import { Flame, Clock, Plus, Star, Eye, ShoppingCart, Check } from 'lucide-react';
import { FLASH_DEALS } from '../../data/groceryData';
import { useStore } from '../../context/StoreContext';

export const FlashDeals = () => {
  const { addToCart, setSelectedProductForQuickView, currency } = useStore();

  // Real-time Countdown Timer State (Hours, Minutes, Seconds)
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 42,
    seconds: 15
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num) => String(num).padStart(2, '0');

  return (
    <section id="flash-deals-section" className="py-8 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Deals Header with Countdown Timer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <Flame className="w-5 h-5 fill-rose-600 animate-bounce-soft" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Daily Flash Deals
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Top organic picks at limited-time discounted prices.
          </p>
        </div>

        {/* Live Countdown Timer Badges */}
        <div className="flex items-center gap-2 bg-rose-50/80 border border-rose-100 px-3.5 py-2 rounded-2xl">
          <Clock className="w-4 h-4 text-rose-600" />
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider mr-1">
            Ends In:
          </span>
          <div className="flex items-center gap-1 text-xs font-mono font-extrabold text-white">
            <span className="bg-rose-600 px-2 py-1 rounded-md shadow-xs">{formatNumber(timeLeft.hours)}h</span>
            <span className="text-rose-600 font-bold">:</span>
            <span className="bg-rose-600 px-2 py-1 rounded-md shadow-xs">{formatNumber(timeLeft.minutes)}m</span>
            <span className="text-rose-600 font-bold">:</span>
            <span className="bg-rose-600 px-2 py-1 rounded-md shadow-xs">{formatNumber(timeLeft.seconds)}s</span>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FLASH_DEALS.map((deal) => {
          const product = deal.product;
          const percentageSold = Math.round((deal.sold / deal.total) * 100);

          return (
            <div
              key={deal.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group relative"
            >
              {/* Top Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="bg-rose-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-xs">
                  -{deal.discountRate}% OFF
                </span>
                <button
                  onClick={() => setSelectedProductForQuickView(product)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-brand-green transition-colors"
                  title="Quick View"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Product Image */}
              <div
                onClick={() => setSelectedProductForQuickView(product)}
                className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-slate-50 cursor-pointer flex items-center justify-center"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              {/* Product Meta */}
              <div>
                <span className="text-[11px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {product.categoryLabel}
                </span>

                <h3
                  onClick={() => setSelectedProductForQuickView(product)}
                  className="text-sm font-bold text-slate-800 mt-2 line-clamp-2 hover:text-brand-green cursor-pointer transition-colors"
                >
                  {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{product.rating}</span>
                  <span className="text-[11px] text-slate-400">({product.reviewsCount})</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-base font-extrabold text-brand-green">
                    {currency.symbol}{Math.round(product.price * (currency.rate || 1)).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    {currency.symbol}{Math.round(product.originalPrice * (currency.rate || 1)).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-500">/ {product.unit}</span>
                </div>

                {/* Sold Stock Progress Bar */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                    <span>Sold: <strong className="text-slate-800">{deal.sold}</strong>/{deal.total}</span>
                    <span className="text-rose-600 font-bold">{percentageSold}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentageSold}%` }}
                    />
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => addToCart(product, 1)}
                  className="w-full mt-4 py-2.5 px-4 bg-brand-green hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
