import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Filter, ChevronLeft, ChevronRight, X, Upload } from 'lucide-react';
import { ADMIN_PRODUCTS_DATA } from '../../../data/adminSuiteData';
import { useStore } from '../../../context/StoreContext';
import { apiService } from '../../../services/api';

export const ProductsView = ({ onOpenAddProductModal }) => {
  const { currency, addToast, products } = useStore();
  const [activeFilterTab, setActiveFilterTab] = useState('All');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [productsList, setProductsList] = useState(ADMIN_PRODUCTS_DATA);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Fruits & Vegetables',
    stock: '',
    image: '',
    imageFileName: '',
    inStock: true
  });
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Handle open edit product
  const handleOpenEditProduct = (item) => {
    setEditingProduct(item);
    setEditProductForm({
      name: item.name,
      description: item.description || 'Fresh quality grocery product.',
      price: item.price,
      category: item.category || 'Fruits & Vegetables',
      stock: item.stock || 50,
      image: item.image,
      imageFileName: '',
      inStock: item.status !== 'Out of Stock'
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

    const updated = {
      ...editingProduct,
      name: editProductForm.name,
      description: editProductForm.description,
      price: Number(editProductForm.price),
      category: editProductForm.category,
      stock: Number(editProductForm.stock),
      image: editProductForm.image || editingProduct.image,
      status: !editProductForm.inStock || Number(editProductForm.stock) === 0 ? 'Out of Stock' : Number(editProductForm.stock) < 15 ? 'Low Stock' : 'Active'
    };

    setProductsList((prev) =>
      prev.map((p) => (p.id === editingProduct.id ? updated : p))
    );

    try {
      await apiService.updateProduct(editingProduct.id, updated);
    } catch (err) {}

    addToast('Product Updated 🛒', `"${editProductForm.name}" updated successfully.`);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id, name) => {
    setProductsList((prev) => prev.filter((p) => p.id !== id));
    try {
      await apiService.deleteProduct(id);
    } catch (err) {}
    addToast('Product Deleted', `Removed "${name}" from store database.`, 'info');
  };

  const filtered = productsList.filter((p) => {
    if (activeFilterTab === 'Active' && p.status !== 'Active') return false;
    if (activeFilterTab === 'Out of Stock' && p.status !== 'Out of Stock') return false;
    if (activeFilterTab === 'Low Stock' && p.status !== 'Low Stock') return false;
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    if (search.trim()) {
      return (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header matching screenshot: Products | + Add Product */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Products</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage your store products and pricing</p>
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
        
        {/* Search Bar + Category Dropdown matching screenshot */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search products..."
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
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-none cursor-pointer w-full sm:w-44"
            >
              <option value="All">All Categories</option>
              <option value="Fruits & Vegetables">Fruits & Vegetables</option>
              <option value="Dairy & Eggs">Dairy & Eggs</option>
              <option value="Groceries">Groceries</option>
              <option value="Meat & Poultry">Meat & Poultry</option>
              <option value="Snacks & Munchies">Snacks & Munchies</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs matching screenshot: All (2456), Active (2320), Out of Stock (88), Low Stock (48) */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
          {[
            { label: 'All', count: 2456 },
            { label: 'Active', count: 2320 },
            { label: 'Out of Stock', count: 88 },
            { label: 'Low Stock', count: 48 }
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveFilterTab(tab.label)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                activeFilterTab === tab.label
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Data Table matching screenshot */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 pb-3">
                <th className="pb-3 font-semibold">Product</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Price</th>
                <th className="pb-3 font-semibold">Stock</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <span className="font-bold text-slate-800">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-600 font-medium">{item.category}</td>
                  <td className="py-3 font-bold text-slate-900">Rs. {item.price}</td>
                  <td className="py-3 font-semibold text-slate-700">{item.stock}</td>
                  <td className="py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Low Stock'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-slate-400">
                      <button
                        onClick={() => handleOpenEditProduct(item)}
                        className="p-1.5 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                        title="Edit product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(item.id, item.name)}
                        className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination matching screenshot */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 1 to {filtered.length} of 2,456 entries</span>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold">1</button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 font-semibold">2</button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 font-semibold">3</button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 font-semibold">4</button>
            <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 font-serif">Edit Product</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4 text-sm">
              
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Name</label>
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
                  rows={3}
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 text-xs font-medium resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editProductForm.price}
                    onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Category</label>
                  <select
                    value={editProductForm.category}
                    onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                    className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 text-xs font-medium cursor-pointer"
                  >
                    <option>Fruits & Vegetables</option>
                    <option>Dairy & Eggs</option>
                    <option>Meat & Poultry</option>
                    <option>Bakery</option>
                    <option>Beverages</option>
                    <option>Snacks & Munchies</option>
                    <option>Grocery Staples</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Stock Quantity</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={editProductForm.stock}
                  onChange={(e) => setEditProductForm({ ...editProductForm, stock: e.target.value })}
                  className="w-full bg-[#f6f2ec] border border-[#e8ded1] rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Image</label>
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
                      <span className="font-bold text-emerald-800 block">Current Preview</span>
                      <span className="text-[11px] text-emerald-600">Will be updated in catalog</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="editInStockCheck"
                  checked={editProductForm.inStock}
                  onChange={(e) => setEditProductForm({ ...editProductForm, inStock: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-700 focus:ring-amber-700 border-slate-300 cursor-pointer accent-[#a36829]"
                />
                <label htmlFor="editInStockCheck" className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
                  Available in store & in stock
                </label>
              </div>

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
                  className="px-6 py-2.5 bg-[#a36829] hover:bg-[#8c5720] text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
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
