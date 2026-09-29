import React, { useState } from 'react';
import {
  ChevronRight,
  Star,
  Plus,
  Minus,
  Heart,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  Check,
  Share2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { FRESHMART_PRODUCTS } from '../../data/freshMartData';

export const ProductDetailPage = () => {
  const {
    selectedProduct,
    navigateTo,
    addToCart,
    isInWishlist,
    toggleWishlist,
    currency,
    addToast,
    currentTenant
  } = useStore();

  const isCaseValue = currentTenant?.id === 'tenant-chasevalue';
  const isAlFatah = currentTenant?.id === 'tenant-alfatah';
  const isChaseUp = currentTenant?.id === 'tenant-chaseup';
  const isUnimaart = currentTenant?.id === 'tenant-freshmart';

  const theme = {
    primaryBg: isUnimaart
      ? 'bg-[#0284c7] hover:bg-[#0369a1]'
      : isCaseValue
      ? 'bg-[#5c3417] hover:bg-[#43230c]'
      : isAlFatah
      ? 'bg-[#991b1b] hover:bg-[#7f1d1d]'
      : isChaseUp
      ? 'bg-[#6b21a8] hover:bg-[#581c87]'
      : 'bg-emerald-600 hover:bg-emerald-700',
    primaryText: isUnimaart
      ? 'text-[#0284c7]'
      : isCaseValue
      ? 'text-[#5c3417]'
      : isAlFatah
      ? 'text-[#991b1b]'
      : isChaseUp
      ? 'text-[#6b21a8]'
      : 'text-emerald-700',
    hoverText: isUnimaart
      ? 'hover:text-[#0284c7]'
      : isCaseValue
      ? 'hover:text-[#8c532b]'
      : isAlFatah
      ? 'hover:text-[#991b1b]'
      : isChaseUp
      ? 'hover:text-[#6b21a8]'
      : 'hover:text-emerald-700',
    softBg: isUnimaart
      ? 'bg-sky-50 text-sky-800'
      : isCaseValue
      ? 'bg-[#f4ebe0] text-[#5c3417]'
      : isAlFatah
      ? 'bg-rose-50 text-rose-800'
      : isChaseUp
      ? 'bg-purple-50 text-purple-800'
      : 'bg-emerald-50 text-emerald-800',
    outlineBtn: isUnimaart
      ? 'border-[#0284c7] text-[#0284c7] hover:bg-sky-50'
      : isCaseValue
      ? 'border-[#5c3417] text-[#5c3417] hover:bg-[#f4ebe0]'
      : isAlFatah
      ? 'border-[#991b1b] text-[#991b1b] hover:bg-rose-50'
      : isChaseUp
      ? 'border-[#6b21a8] text-[#6b21a8] hover:bg-purple-50'
      : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50',
    activeTab: isUnimaart
      ? 'border-[#0284c7] text-[#0284c7]'
      : isCaseValue
      ? 'border-[#5c3417] text-[#5c3417]'
      : isAlFatah
      ? 'border-[#991b1b] text-[#991b1b]'
      : isChaseUp
      ? 'border-[#6b21a8] text-[#6b21a8]'
      : 'border-emerald-600 text-emerald-700',
    selectedGallery: isUnimaart
      ? 'border-[#0284c7] ring-2 ring-sky-100'
      : isCaseValue
      ? 'border-[#5c3417] ring-2 ring-amber-100'
      : isAlFatah
      ? 'border-[#991b1b] ring-2 ring-rose-100'
      : isChaseUp
      ? 'border-[#6b21a8] ring-2 ring-purple-100'
      : 'border-emerald-600 ring-2 ring-emerald-100'
  };

  const product = selectedProduct || FRESHMART_PRODUCTS[0];
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'nutrition' | 'reviews'
  const [selectedGalleryImg, setSelectedGalleryImg] = useState(product.image);

  const isFav = isInWishlist(product.id);

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigateTo('checkout');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast('Link Copied', 'Product link copied to clipboard.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Breadcrumbs matching screenshot: Home > Dairy & Eggs > Olper's Milk 1L */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
        <button
          onClick={() => navigateTo('home')}
          className={`${theme.hoverText} transition-colors cursor-pointer`}
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <button
          onClick={() => navigateTo('shop')}
          className={`${theme.hoverText} transition-colors cursor-pointer`}
        >
          {product.categoryLabel}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-900 font-bold">{product.name}</span>
      </nav>

      {/* Main Product Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-card grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Image & Gallery (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-4">
            <img
              src={selectedGalleryImg || product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
            />
            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-xs">
                SAVE {product.discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {product.gallery && product.gallery.length > 1 && (
            <div className="flex items-center gap-3">
              {product.gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedGalleryImg(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                    selectedGalleryImg === img
                      ? theme.selectedGallery
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Actions (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          <div>
            {/* Title & Brand */}
            <div className="flex items-center justify-between gap-4">
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.softBg} px-2.5 py-1 rounded-md`}>
                {product.brand}
              </span>
              <button
                onClick={handleShare}
                className="text-slate-400 hover:text-slate-700 text-xs flex items-center gap-1.5 p-1 rounded-lg"
                title="Share product"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              {product.name}
            </h1>

            {/* Ratings & In-Stock Badge */}
            <div className="flex flex-wrap items-center gap-4 mt-2.5">
              <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg">
                <div className="flex items-center text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </div>
                <span className="text-xs font-bold text-amber-900">{product.rating}</span>
                <span className="text-[11px] text-amber-700">({product.reviewsCount} reviews)</span>
              </div>

              <span className={`flex items-center gap-1 text-xs font-bold ${theme.softBg} px-2.5 py-1 rounded-lg`}>
                <Check className="w-3.5 h-3.5" />
                <span>In Stock ({product.stockCount} Available)</span>
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-4 pt-4 border-t border-slate-100">
              <span className="text-3xl font-black text-slate-900">
                {currency.symbol}{product.price}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-base text-slate-400 line-through">
                  {currency.symbol}{product.originalPrice}
                </span>
              )}
              {product.discountPercent > 0 && (
                <span className="bg-rose-50 text-rose-600 text-xs font-black px-2 py-0.5 rounded-md border border-rose-100">
                  -{product.discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              {product.description}
            </p>

            {/* Quantity Stepper */}
            <div className="mt-5 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs text-slate-400 font-medium">({product.unit})</span>
              </div>
            </div>

            {/* Action Buttons: Add to Cart | Buy Now | Add to Wishlist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => addToCart(product, quantity)}
                className={`py-3 px-6 ${theme.primaryBg} text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart • {currency.symbol}{product.price * quantity}</span>
              </button>

              <button
                onClick={handleBuyNow}
                className={`py-3 px-6 bg-white ${theme.outlineBtn} border-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer`}
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>
            </div>

            <button
              onClick={() => toggleWishlist(product.id)}
              className="mt-3 text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{isFav ? 'In Your Wishlist' : 'Add to Wishlist'}</span>
            </button>
          </div>

          {/* 4 Guarantee Badges */}
          <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <ShieldCheck className={`w-5 h-5 ${theme.primaryText} mx-auto mb-1`} />
              <span className="text-[11px] font-bold text-slate-800 block leading-tight">100% Original</span>
              <span className="text-[9px] text-slate-400">Products</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Truck className={`w-5 h-5 ${theme.primaryText} mx-auto mb-1`} />
              <span className="text-[11px] font-bold text-slate-800 block leading-tight">Free Delivery</span>
              <span className="text-[9px] text-slate-400">Above Rs. 1000</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <RotateCcw className={`w-5 h-5 ${theme.primaryText} mx-auto mb-1`} />
              <span className="text-[11px] font-bold text-slate-800 block leading-tight">7 Days Return</span>
              <span className="text-[9px] text-slate-400">Policy</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <CreditCard className={`w-5 h-5 ${theme.primaryText} mx-auto mb-1`} />
              <span className="text-[11px] font-bold text-slate-800 block leading-tight">Secure Payment</span>
              <span className="text-[9px] text-slate-400">100% Secure</span>
            </div>
          </div>

        </div>

      </div>

      {/* Tabs Section: Description | Nutrition Info | Reviews */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-card mt-8">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'description'
                ? theme.activeTab
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'nutrition'
                ? theme.activeTab
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Nutrition Info
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'reviews'
                ? theme.activeTab
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Reviews ({product.reviewsCount})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="pt-6">
          {activeTab === 'description' && (
            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              <p>{product.description}</p>
              <p>
                FreshMart ensures all dairy, fresh fruits, vegetables, and meat products are transported in temperature-controlled delivery vans, maintaining unbroken cold chain from farm to doorstep.
              </p>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="max-w-md">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 divide-y divide-slate-200/60 text-xs">
                {product.nutrition ? (
                  Object.entries(product.nutrition).map(([key, val]) => (
                    <div key={key} className="py-2.5 flex justify-between">
                      <span className="font-semibold text-slate-600">{key}</span>
                      <span className="font-bold text-slate-900">{val}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">Nutritional values are verified per 100g serving.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                <div className="text-center">
                  <span className="text-3xl font-black text-emerald-900 block leading-none">{product.rating}</span>
                  <div className="flex text-amber-400 mt-1 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Based on {product.reviewsCount} reviews</span>
                </div>
                <div className="border-l border-emerald-200 pl-4 text-xs text-slate-600">
                  <p className="font-bold text-emerald-900">98% of customers recommend this product</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Verified farm fresh quality check passed.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
