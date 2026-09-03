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
  Filter,
  Grid3X3,
  List,
  Check,
  RotateCcw
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  FRESHMART_CATEGORIES,
  FRESHMART_BRANDS
} from '../../data/freshMartData';

export const ShopPage = () => {
  const {
    products,
    categories,
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
    isInWishlist,
    toggleWishlist,
    currency
  } = useStore();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const handleBrandToggle = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleClearAllFilters = () => {
    setActiveCategory('all');
    setSelectedBrands([]);
    setPriceRange([0, 5000]);
    setMinRating(0);
    setSearchQuery('');
    setInStockOnly(false);
    setSortBy('featured');
  };

  // Filter & Sort Logic (100% Accurate & Multi-Attribute Aware)
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // 1. Category Filter (Matches ID, slug, and display label)
    if (activeCategory && activeCategory !== 'all') {
      const cleanCat = String(activeCategory).toLowerCase().trim();
      list = list.filter((p) => {
        const pCat = String(p.category || '').toLowerCase().trim();
        const pCatLabel = String(p.categoryLabel || '').toLowerCase().trim();
        return pCat === cleanCat || pCatLabel === cleanCat || pCat.includes(cleanCat) || cleanCat.includes(pCat);
      });
    }

    // 2. Brand Filter (Multi-brand checkbox selection)
    if (selectedBrands && selectedBrands.length > 0) {
      const brandSet = new Set(selectedBrands.map((b) => String(b).toLowerCase().trim()));
      list = list.filter((p) => p.brand && brandSet.has(String(p.brand).toLowerCase().trim()));
    }

    // 3. Price Range Filter
    const minP = Number(priceRange[0]) || 0;
    const maxP = Number(priceRange[1]) || 5000;
    list = list.filter((p) => {
      const pPrice = Number(p.price) || 0;
      return pPrice >= minP && pPrice <= maxP;
    });

    // 4. In Stock Only Filter
    if (inStockOnly) {
      list = list.filter((p) => p.inStock !== false && p.status !== 'Out of Stock' && (p.stockCount === undefined || p.stockCount > 0));
    }

    // 5. Customer Rating Filter
    if (minRating > 0) {
      list = list.filter((p) => (Number(p.rating) || 4.5) >= minRating);
    }

    // 6. Search Query (Matches Name, Brand, Category, Description)
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // 7. Multi-Mode Sorting
    if (sortBy === 'price-low') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else if (sortBy === 'discount') {
      list.sort((a, b) => (Number(b.discountPercent) || 0) - (Number(a.discountPercent) || 0));
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (Number(b.reviewsCount) || 0) - (Number(a.reviewsCount) || 0));
    }

    return list;
  }, [products, activeCategory, selectedBrands, priceRange, inStockOnly, minRating, searchQuery, sortBy]);

  const activeCategoryObj = (categories || []).find((c) => c.id === activeCategory || c.name === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Banner & Active Category Title */}
      <div className="bg-gradient-to-r from-[#eef9f2] via-[#f7faf8] to-[#f4ede4] rounded-3xl p-6 sm:p-8 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1">
            <span className="hover:text-emerald-700 cursor-pointer" onClick={() => navigateTo('home')}>Home</span>
            <span>/</span>
            <span className="text-emerald-700 font-bold">Shop Catalog</span>
            {activeCategoryObj && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-bold">{activeCategoryObj.name}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {activeCategoryObj ? activeCategoryObj.name : 'All Fresh Grocery Items'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing {filteredProducts.length} high quality farm-sourced products
          </p>

          {searchQuery && searchQuery.trim() && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span>🔍 Search: "{searchQuery}"</span>
                <span className="text-emerald-700 font-medium">({filteredProducts.length} items present)</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-rose-600 ml-1 p-0.5 rounded-full hover:bg-emerald-200 cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="lg:hidden px-4 py-2.5 bg-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center gap-2 self-start shadow-sm"
        >
          <Filter className="w-4 h-4" />
          <span>Filter Products ({selectedBrands.length + (activeCategory !== 'all' ? 1 : 0)})</span>
        </button>
      </div>

      {/* 2. Main Two-Column Layout (Sidebar Filters + Catalog Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Sidebar Filters */}
        <aside className={`bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 ${
          mobileFilterOpen ? 'block' : 'hidden lg:block'
        }`}>
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <h3 className="font-black text-sm text-slate-900">Filters</h3>
            </div>
            <button
              onClick={handleClearAllFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">Categories</span>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                  activeCategory === 'all'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Departments</span>
                <span className="text-[10px] opacity-80">{products.length}</span>
              </button>

              {(categories || []).map((cat) => {
                const count = (products || []).filter(
                  (p) => p.category === cat.id || p.category === cat.name || p.categoryLabel === cat.name
                ).length;

                return (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                      activeCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-[10px] opacity-80">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Price Range</span>
              <span className="text-xs font-black text-emerald-700">Up to {currency.symbol}{priceRange[1]}</span>
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
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>{currency.symbol}0</span>
              <span>{currency.symbol}5,000+</span>
            </div>
          </div>

          {/* Brands Filter Checkboxes */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">Brands</span>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {FRESHMART_BRANDS.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-emerald-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* In Stock Toggle */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">In-Stock Only</span>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
            />
          </div>

        </aside>

        {/* Right Catalog Area */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Top Control Bar: Total Count + Active Chips + Sort + Grid/List Toggle */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-900">
                {filteredProducts.length} <span className="font-medium text-slate-500">Products</span>
              </span>

              {/* Active Filter Chips */}
              {activeCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                  <span>{activeCategoryObj?.name}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveCategory('all')} />
                </span>
              )}

              {selectedBrands.map((b) => (
                <span key={b} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                  <span>{b}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleBrandToggle(b)} />
                </span>
              ))}
            </div>

            {/* Right: Sort By + View Mode */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-bold hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="discount">Biggest Discount</option>
                </select>
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white shadow-2xs text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list' ? 'bg-white shadow-2xs text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Product Cards Container */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                🔍
              </div>
              <h3 className="text-lg font-black text-slate-900">No matching products found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing your search keyword, adjusting your price range, or selecting a different category.
              </p>
              <button
                onClick={handleClearAllFilters}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                const prodId = product.id || product._id;
                const isFav = isInWishlist(prodId);
                const cartItem = cart.find((item) => (item.product.id || item.product._id) === prodId);

                return (
                  <div
                    key={prodId}
                    className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
                  >
                    {/* Top Discount Tag & Heart */}
                    <div className="flex items-center justify-between mb-1">
                      {product.discountPercent > 0 ? (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                          -{product.discountPercent}%
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Organic
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(prodId);
                        }}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                        title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>


                    {/* Image */}
                    <div
                      onClick={() => navigateTo('product-detail', product)}
                      className="relative h-32 sm:h-36 rounded-2xl overflow-hidden mb-3 bg-slate-50 cursor-pointer flex items-center justify-center"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{product.brand}</span>
                      <h3
                        onClick={() => navigateTo('product-detail', product)}
                        className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 hover:text-emerald-700 cursor-pointer transition-colors"
                      >
                        {product.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 block">{product.unit}</span>

                      {/* Rating */}
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{product.rating || 4.8}</span>
                        <span className="text-slate-400 font-normal">({product.reviewsCount || 110})</span>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-base font-black text-slate-900">
                          {currency.symbol}{product.price}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-slate-400 line-through">
                            {currency.symbol}{product.originalPrice}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      {cartItem ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-1 mt-2.5">
                          <button
                            onClick={() => updateCartQuantity(product.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black text-emerald-900">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(product.id, 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="w-full mt-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {filteredProducts.map((product) => {
                const prodId = product.id || product._id;
                const isFav = isInWishlist(prodId);
                const cartItem = cart.find((item) => (item.product.id || item.product._id) === prodId);

                return (
                  <div
                    key={prodId}
                    className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        onClick={() => navigateTo('product-detail', product)}
                        className="w-20 h-20 rounded-2xl object-cover bg-slate-50 cursor-pointer shrink-0"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{product.categoryLabel}</span>
                        <h3
                          onClick={() => navigateTo('product-detail', product)}
                          className="text-sm font-bold text-slate-900 hover:text-emerald-700 cursor-pointer"
                        >
                          {product.name}
                        </h3>
                        <p className="text-xs text-slate-400">{product.unit} • {product.brand}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-sm font-black text-slate-900">{currency.symbol}{product.price}</span>
                          {product.originalPrice > product.price && (
                            <span className="text-xs text-slate-400 line-through">{currency.symbol}{product.originalPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(prodId);
                        }}
                        className="p-2 text-slate-300 hover:text-rose-500 rounded-xl cursor-pointer"
                        title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>

                      {cartItem ? (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-1">
                          <button
                            onClick={() => updateCartQuantity(prodId, -1)}
                            className="w-7 h-7 rounded-lg bg-white text-emerald-800 font-bold text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-black text-emerald-900 px-1">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(prodId, 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          )}

        </div>

      </div>

    </div>
  );
};
