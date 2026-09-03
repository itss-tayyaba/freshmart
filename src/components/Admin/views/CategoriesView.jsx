import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Upload, Check, FolderPlus, Layers } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const CategoriesView = ({ onOpenAddCategoryModal }) => {
  const { categories, products, updateCategoryInStore, deleteCategoryFromStore, addToast } = useStore();
  const [search, setSearch] = useState('');

  // Edit Category Modal State
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    discountBadge: '',
    image: '',
    imageFileName: ''
  });
  const [editImagePreview, setEditImagePreview] = useState(null);

  const filtered = (categories || []).filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    (cat.discountBadge && cat.discountBadge.toLowerCase().includes(search.toLowerCase()))
  );

  // Open Edit Modal and pre-fill form
  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setEditForm({
      name: cat.name,
      discountBadge: cat.discountBadge || 'Fresh Selection',
      image: cat.image,
      imageFileName: ''
    });
    setEditImagePreview(cat.image);
  };

  // Handle Image File Selection (Choose File)
  const handleEditImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
        setEditForm((prev) => ({
          ...prev,
          image: reader.result,
          imageFileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Category Edits
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingCategory) return;

    const updatedCategory = {
      ...editingCategory,
      name: editForm.name,
      shortName: editForm.name,
      discountBadge: editForm.discountBadge,
      image: editForm.image || editingCategory.image
    };

    updateCategoryInStore(updatedCategory);
    setEditingCategory(null);
  };

  // Delete Category
  const handleDeleteCategory = (id, name) => {
    deleteCategoryFromStore(id, name);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Categories</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage product categories and catalog hierarchy</p>
        </div>

        <button
          onClick={onOpenAddCategoryModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Category</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 shadow-card focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* Visual Category Cards Grid (4x3) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {filtered.map((cat) => {
          const catId = cat.id || cat._id;
          const count = (products || []).filter(
            (p) => p.category === catId || p.category === cat.name || p.categoryLabel === cat.name
          ).length;

          return (
            <div
              key={catId}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group relative"
            >
              {/* Image Thumbnail */}
              <div className="relative h-32 rounded-2xl overflow-hidden mb-3 bg-slate-50 flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {cat.discountBadge && (
                  <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                    {cat.discountBadge}
                  </span>
                )}
              </div>

              {/* Info & Edit Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                    {count > 0 ? `${count} items in catalog` : `${cat.itemCount || 0} items`}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-xl transition-colors cursor-pointer shadow-2xs border border-slate-100 hover:border-emerald-200"
                    title="Edit Category & Picture"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Edit Category</h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Discount Tag (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Up to 25% OFF"
                  value={editForm.discountBadge}
                  onChange={(e) => setEditForm({ ...editForm, discountBadge: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Image with Choose File Button */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Image</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-3">
                  <label className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg shadow-2xs cursor-pointer inline-flex items-center gap-1.5 shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-600 truncate font-mono">
                    {editForm.imageFileName || 'Change image from device'}
                  </span>
                </div>

                {/* Live Preview */}
                {editImagePreview && (
                  <div className="mt-2.5 flex items-center gap-3 p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <img
                      src={editImagePreview}
                      alt="Category Preview"
                      className="w-12 h-12 rounded-lg object-cover bg-white shadow-2xs border border-emerald-200"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-800 block">Current Preview</span>
                      <span className="text-[11px] text-emerald-600">Saved permanently to your store catalog</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(editingCategory.id, editingCategory.name)}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
