import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Star,
  Trash2,
  Plus,
  Minus,
  Heart,
  ShoppingCart,
  SlidersHorizontal,
  ArrowRight,
  X,
  Filter
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  FRESHMART_CATEGORIES,
  FRESHMART_PRODUCTS,
  FRESHMART_BRANDS
} from '../../data/freshMartData';

export const ShopPage = () => {
  const {
    navigateTo,
    activeCategory,
    setActiveCategory,
    selectedBrands,
    setSelectedBrands,
    priceRange,
    setPriceRange,
    minRating,
    setMinRating,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    deliveryCharges,
    cartTotal,
    totalCartCount,
    isInWishlist,
    toggleWishlist,
    currency
  } = useStore();

  const [expandedCategories, setExpandedCategories] = useState({
    'fruits-veg': true,
    'dairy-eggs': true
  });

  const toggleCategoryExpand = (catId, e) => {
    e.stopPropagation();
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleBrandToggle = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    let list = [...FRESHMART_PRODUCTS];

    // Category filter
    if (activeCategory && activeCategory !== 'all') {
      list = list.filter((p) => p.category === activeCategory);
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      list = list.filter((p) => selectedBrands.includes(p.brand));
    }

    // Price filter
    list = list.filter((p) => p.price <= priceRange[1]);

    // Rating filter
    if (minRating > 0) {
      list = list.filter((p) => p.rating >= minRating);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q)
      );
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        list.sort((a, b) => b.discountPercent - a.discountPercent);
        break;
      default:
        // 'featured'
        break;
    }

    return list;
  }, [activeCategory, selectedBrands, priceRange, minRating, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Bar Header matching screenshot: Shop | Search | Sort by: Featured */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Shop
          </h1>
          <span className="text-xs font-semibold text-slate-400">
            ({filteredProducts.length} Products Found)
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Top Search Input matching screenshot */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Sort Dropdown matching screenshot */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shrink-0 text-xs font-semibold text-slate-700">
            <span className="text-slate-400 font-normal">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-800"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Filter Sidebar + Right 3-Col Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        
        {/* LEFT SIDEBAR FILTERS (4 Columns) matching screenshot */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* 1. Categories Accordion */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${
                  activeCategory === 'all'
                    ? 'bg-emerald-50 text-emerald-700 font-black'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] text-slate-400">({FRESHMART_PRODUCTS.length})</span>
              </button>

              {FRESHMART_CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.id;
                const isExpanded = expandedCategories[cat.id];

                return (
                  <div key={cat.id}>
                    <div
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <button
                        onClick={(e) => toggleCategoryExpand(cat.id, e)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            isExpanded ? 'rotate-180 text-emerald-600' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Subcategories */}
                    {isExpanded && cat.subcategories && (
                      <div className="pl-6 pr-2 py-1 space-y-1">
                        {cat.subcategories.map((sub, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveCategory(cat.id);
                              setSearchQuery(sub);
                            }}
                            className="block w-full text-left text-[11px] py-0.5 text-slate-500 hover:text-emerald-700 transition-colors"
                          >
                            • {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Filters Card: Price Range, Brands, Rating */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Filters
            </h3>

            {/* Price Range Slider matching screenshot */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Price Range</span>
                <span className="text-emerald-700">{currency.symbol}0 - {currency.symbol}{priceRange[1]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Rs. 0</span>
                <span>Rs. 5000+</span>
              </div>
            </div>

            {/* Brands Checkboxes matching screenshot */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block mb-2">Brands</span>
              <div className="space-y-1.5">
                {FRESHMART_BRANDS.slice(0, 5).map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-slate-900"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating Stars matching screenshot */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block mb-2">Rating</span>
              <div className="space-y-1">
                {[4, 3, 2, 1].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => setMinRating(minRating === stars ? 0 : stars)}
                    className={`flex items-center gap-1.5 w-full text-xs px-2 py-1 rounded-lg transition-colors ${
                      minRating === stars ? 'bg-amber-50 font-bold text-amber-900' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < stars ? 'fill-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                    <span>{stars}★ & above</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. STICKY "MY CART" SIDEBAR WIDGET matching screenshot */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card sticky top-24">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  My Cart ({totalCartCount})
                </h3>
              </div>
              <button
                onClick={() => navigateTo('checkout')}
                className="text-[11px] font-bold text-emerald-600 hover:underline"
              >
                View Cart
              </button>
            </div>

            {/* Items List matching screenshot */}
            <div className="space-y-3 max-h-64 overflow-y-auto divide-y divide-slate-50">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-50 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-800 truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{currency.symbol}{item.product.price}</span>
                        <span>•</span>
                        <div className="flex items-center bg-slate-100 rounded px-1">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, -1)}
                            className="px-1 text-slate-600 hover:font-bold"
                          >
                            -
                          </button>
                          <span className="px-1 font-bold text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, 1)}
                            className="px-1 text-slate-600 hover:font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900">
                        {currency.symbol}{item.product.price * item.quantity}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-300 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Cart is empty
                </div>
              )}
            </div>

            {/* Subtotal & Delivery matching screenshot */}
            {cart.length > 0 && (
              <div className="pt-3 mt-3 border-t border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">{currency.symbol}{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-slate-800">{currency.symbol}{deliveryCharges}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span className="text-emerald-700 text-sm font-black">{currency.symbol}{cartTotal}</span>
                </div>

                <button
                  onClick={() => navigateTo('checkout')}
                  className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>

        </aside>

        {/* RIGHT MAIN PRODUCT GRID (8 Columns / 3-Columns Grid) matching screenshot */}
        <main className="lg:col-span-8">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => {
                const isFav = isInWishlist(product.id);
                const cartItem = cart.find((item) => item.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group"
                  >
                    {/* Top Wishlist Heart */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {product.brand}
                      </span>
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    {/* Image */}
                    <div
                      onClick={() => navigateTo('product-detail', product)}
                      className="relative h-36 rounded-xl overflow-hidden mb-3 bg-slate-50 cursor-pointer flex items-center justify-center"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {product.discountPercent > 0 && (
                        <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                          -{product.discountPercent}%
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <h3
                        onClick={() => navigateTo('product-detail', product)}
                        className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 hover:text-emerald-700 cursor-pointer transition-colors"
                      >
                        {product.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {product.unit}
                      </span>

                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-sm sm:text-base font-black text-slate-900">
                          {currency.symbol}{product.price}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-slate-400 line-through">
                            {currency.symbol}{product.originalPrice}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart / Quantity Stepper */}
                      {cartItem ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-0.5 mt-3">
                          <button
                            onClick={() => updateCartQuantity(product.id, -1)}
                            className="w-6 h-6 rounded bg-white text-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-emerald-900">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(product.id, 1)}
                            className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-card">
              <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No matching products found</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Try clearing your search keyword, category, or price range filters.
              </p>
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setSelectedBrands([]);
                  setPriceRange([0, 5000]);
                  setMinRating(0);
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};
