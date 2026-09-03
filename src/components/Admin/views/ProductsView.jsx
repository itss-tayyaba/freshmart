import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Filter, ChevronLeft, ChevronRight, X, Upload, Flame, Star, Tag } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';

export const ProductsView = ({ onOpenAddProductModal }) => {
  const { currency, addToast, products, categories, updateProductInStore, deleteProductFromStore } = useStore();
  const [activeFilterTab, setActiveFilterTab] = useState('All');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    discountPercent: 0,
    category: 'Fruits & Vegetables',
    categoryLabel: 'Fruits & Vegetables',
    stock: 50,
    image: '',
    imageFileName: '',
    inStock: true,
    isFlashDeal: false,
    isBestSeller: false
  });
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Handle open edit product
  const handleOpenEditProduct = (item) => {
    setEditingProduct(item);
    setEditProductForm({
      name: item.name,
      description: item.description || 'Fresh quality grocery product.',
      price: item.price,
      originalPrice: item.originalPrice || Math.round(item.price * 1.2),
      discountPercent: item.discountPercent || (item.originalPrice > item.price ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0),
      category: item.category || 'fruits-veg',
      categoryLabel: item.categoryLabel || item.category || 'Fruits & Vegetables',
      stock: item.stock || item.stockCount || 50,
      image: item.image,
      imageFileName: '',
      inStock: item.inStock !== false && item.status !== 'Out of Stock',
      isFlashDeal: item.isFlashDeal || false,
      isBestSeller: item.isBestSeller || false
    });
    setEditImagePreview(item.image);
  };

  // Handle image selection
  const handleEditProductImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
        setEditProductForm((prev) => ({
          ...prev,
          image: reader.result,
          imageFileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save product edits
  const handleSaveProductEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const priceNum = Number(editProductForm.price);
    const origPriceNum = Number(editProductForm.originalPrice || priceNum);
    const discountNum = Number(editProductForm.discountPercent) || (origPriceNum > priceNum ? Math.round(((origPriceNum - priceNum) / origPriceNum) * 100) : 0);

    const updated = {
      ...editingProduct,
      name: editProductForm.name,
      description: editProductForm.description,
      price: priceNum,
      originalPrice: origPriceNum,
      discountPercent: discountNum,
      category: editProductForm.category,
      categoryLabel: editProductForm.categoryLabel,
      stock: Number(editProductForm.stock),
      stockCount: Number(editProductForm.stock),
      image: editProductForm.image || editingProduct.image,
      inStock: editProductForm.inStock && Number(editProductForm.stock) > 0,
      isFlashDeal: editProductForm.isFlashDeal,
      isBestSeller: editProductForm.isBestSeller,
      status: !editProductForm.inStock || Number(editProductForm.stock) === 0 ? 'Out of Stock' : Number(editProductForm.stock) < 15 ? 'Low Stock' : 'Active'
    };

    updateProductInStore(updated);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id, name) => {
    deleteProductFromStore(id, name);
  };

  const filtered = products.filter((p) => {
    const status = p.status || (p.inStock ? (p.stock < 15 ? 'Low Stock' : 'Active') : 'Out of Stock');
    if (activeFilterTab === 'Active' && status !== 'Active') return false;
    if (activeFilterTab === 'Out of Stock' && status !== 'Out of Stock') return false;
    if (activeFilterTab === 'Low Stock' && status !== 'Low Stock') return false;
    if (categoryFilter !== 'All' && p.category !== categoryFilter && p.categoryLabel !== categoryFilter) return false;
    if (search.trim()) {
      return (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.categoryLabel && p.categoryLabel.toLowerCase().includes(search.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header matching screenshot: Products | + Add Product */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Products & Live Discounts</h2>
          <p className="text-xs text-slate-500 mt-0.5">Control pricing, landing page showcase badges, discounts and stock</p>
        </div>

        <button
          onClick={onOpenAddProductModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Product</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4">
        
        {/* Search Bar + Category Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search products by name, brand, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-none cursor-pointer w-full sm:w-48"
            >
              <option value="All">All Categories</option>
              <option value="fruits-veg">Fruits & Vegetables</option>
              <option value="dairy-eggs">Dairy & Eggs</option>
              <option value="meat-poultry">Meat & Poultry</option>
              <option value="beverages">Beverages</option>
              <option value="snacks">Snacks & Munchies</option>
              <option value="grocery-staples">Grocery Staples</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
          {[
            { label: 'All', count: products.length },
            { label: 'Active', count: products.filter(p => p.status !== 'Out of Stock').length },
            { label: 'Out of Stock', count: products.filter(p => p.status === 'Out of Stock').length },
            { label: 'Low Stock', count: products.filter(p => p.status === 'Low Stock' || p.stock < 15).length }
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveFilterTab(tab.label)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                activeFilterTab === tab.label
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 pb-3">
                <th className="pb-3 font-semibold">Product</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Price & Discount</th>
                <th className="pb-3 font-semibold">Stock</th>
                <th className="pb-3 font-semibold">Landing Page Badges</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item) => {
                const status = item.status || (item.inStock ? (item.stock < 15 ? 'Low Stock' : 'Active') : 'Out of Stock');

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{item.unit || '1 unit'} • {item.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600 font-medium">{item.categoryLabel || item.category}</td>
                    <td className="py-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-slate-900">{currency.symbol}{item.price}</span>
                        {item.originalPrice > item.price && (
                          <span className="text-[10px] text-slate-400 line-through">{currency.symbol}{item.originalPrice}</span>
                        )}
                        {item.discountPercent > 0 && (
                          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                            -{item.discountPercent}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-slate-700">{item.stock || item.stockCount || 50} units</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.isFlashDeal && (
                          <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Flash Deal
                          </span>
                        )}
                        {item.isBestSeller && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                            Bestseller
                          </span>
                        )}
                        {!item.isFlashDeal && !item.isBestSeller && (
                          <span className="text-[10px] text-slate-400 font-semibold">Standard</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-slate-400">
                        <button
                          onClick={() => handleOpenEditProduct(item)}
                          className="p-1.5 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                          title="Edit product, discounts & image"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(item.id, item.name)}
                          className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Edit Product Modal with Full Landing Page & Discount Controls */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 font-serif">Edit Product & Showcase</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4 text-sm">
              
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Product Name</label>
                <input
                  type="text"
                  required
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Description</label>
                <textarea
                  rows={2}
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 text-xs font-medium resize-y"
                />
              </div>

              {/* Price, Original Price & Discount Percentage */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Sale Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editProductForm.price}
                    onChange={(e) => {
                      const newPrice = Number(e.target.value);
                      const orig = Number(editProductForm.originalPrice || newPrice);
                      const disc = orig > newPrice ? Math.round(((orig - newPrice) / orig) * 100) : 0;
                      setEditProductForm({ ...editProductForm, price: e.target.value, discountPercent: disc });
                    }}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2 text-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Original Price (Rs.)</label>
                  <input
                    type="number"
                    min="1"
                    value={editProductForm.originalPrice}
                    onChange={(e) => {
                      const newOrig = Number(e.target.value);
                      const p = Number(editProductForm.price);
                      const disc = newOrig > p ? Math.round(((newOrig - p) / newOrig) * 100) : 0;
                      setEditProductForm({ ...editProductForm, originalPrice: e.target.value, discountPercent: disc });
                    }}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2 text-slate-800 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Discount (% OFF)</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={editProductForm.discountPercent}
                    onChange={(e) => setEditProductForm({ ...editProductForm, discountPercent: Number(e.target.value) })}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2 text-rose-600 text-xs font-black"
                  />
                </div>
              </div>

              {/* Category & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Category</label>
                  <select
                    value={editProductForm.category}
                    onChange={(e) => {
                      const sel = e.target.value;
                      const matched = (categories || []).find((c) => c.id === sel || c.name === sel);
                      setEditProductForm({
                        ...editProductForm,
                        category: sel,
                        categoryLabel: matched ? matched.name : sel
                      });
                    }}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2 text-slate-800 text-xs font-medium cursor-pointer"
                  >
                    {(categories || []).map((cat) => (
                      <option key={cat.id || cat._id || cat.name} value={cat.id || cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Stock Units</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editProductForm.stock}
                    onChange={(e) => setEditProductForm({ ...editProductForm, stock: e.target.value })}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3 py-2 text-slate-800 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Image Picker */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Item Picture</label>
                <div className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                  <label className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-lg shadow-2xs cursor-pointer inline-flex items-center gap-1.5 shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditProductImageChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-600 truncate font-mono">
                    {editProductForm.imageFileName || 'Change image (optional)'}
                  </span>
                </div>

                {editImagePreview && (
                  <div className="mt-2.5 flex items-center gap-3 p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <img
                      src={editImagePreview}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover bg-white shadow-2xs border border-emerald-200"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-800 block">Current Picture</span>
                      <span className="text-[11px] text-emerald-600">Updated across storefront & landing page</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Landing Page Showcase Checkboxes */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <span className="font-black text-slate-800 block">Landing Page & Showcase Controls:</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editProductForm.isFlashDeal}
                      onChange={(e) => setEditProductForm({ ...editProductForm, isFlashDeal: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 cursor-pointer"
                    />
                    <span>🔥 Show in Flash Deals</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editProductForm.isBestSeller}
                      onChange={(e) => setEditProductForm({ ...editProductForm, isBestSeller: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                    />
                    <span>⭐ Show in Bestsellers</span>
                  </label>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Save Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
