import React, { useState, useRef } from 'react';
import { Plus, Tag, Calendar, Sparkles, Check, Edit2, Trash2, Image, Upload, X, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const PromotionsView = () => {
  const { promotions, addPromotion, updatePromotion, deletePromotion, togglePromotionStatus, addToast } = useStore();
  const [activeTab, setActiveTab] = useState('All');
  const [editingPromo, setEditingPromo] = useState(null); // null or promo object
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Promotion Form State
  const [form, setForm] = useState({
    title: '',
    discount: '',
    code: '',
    validity: '',
    category: 'Flash Sales',
    bannerImg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    status: 'Active'
  });

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const handleFileUpload = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Invalid File', 'Please select an image file (PNG, JPG, WEBP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (isEdit) {
        setEditingPromo((prev) => ({ ...prev, bannerImg: reader.result }));
      } else {
        setForm((prev) => ({ ...prev, bannerImg: reader.result }));
      }
      addToast('Image Loaded 📸', 'Banner preview updated.');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      addToast('Required Field', 'Please enter a campaign title.', 'error');
      return;
    }

    addPromotion({
      title: form.title,
      discount: form.discount || '20% OFF',
      code: form.code || 'SAVE20',
      validity: form.validity || 'Valid this month',
      category: form.category,
      bannerImg: form.bannerImg,
      status: form.status
    });

    setIsCreateModalOpen(false);
    setForm({
      title: '',
      discount: '',
      code: '',
      validity: '',
      category: 'Flash Sales',
      bannerImg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      status: 'Active'
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingPromo) return;

    updatePromotion(editingPromo.id, {
      title: editingPromo.title,
      discount: editingPromo.discount,
      code: editingPromo.code,
      validity: editingPromo.validity,
      category: editingPromo.category,
      bannerImg: editingPromo.bannerImg,
      status: editingPromo.status
    });

    setEditingPromo(null);
  };

  const filteredPromos = (promotions || []).filter((p) => {
    if (activeTab === 'All') return true;
    return p.category === activeTab;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Promotions & Banner Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Design, edit banner graphics, discount codes, and flash campaigns</p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Promotion / Banner</span>
        </button>
      </div>

      {/* Filter Tabs: All, Flash Sales, Coupons, Bundles, Banners */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        {['All', 'Flash Sales', 'Coupons', 'Bundles', 'Banners'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab} ({tab === 'All' ? promotions?.length || 0 : (promotions || []).filter((p) => p.category === tab).length})
          </button>
        ))}
      </div>

      {/* Visual Promotion & Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredPromos.map((promo) => (
          <div
            key={promo.id}
            className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group"
          >
            {/* Banner Image Preview */}
            <div className="relative h-36 overflow-hidden bg-slate-100">
              <img
                src={promo.bannerImg}
                alt={promo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                {promo.discount}
              </span>
              <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                {promo.code || 'SPECIAL'}
              </span>
            </div>

            {/* Content & Actions */}
            <div className="p-5 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  {promo.category}
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-0.5">{promo.title}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{promo.validity}</p>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => togglePromotionStatus(promo.id)}
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                    promo.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                  title="Click to toggle status"
                >
                  {promo.status === 'Active' ? '✓ Active' : '⏸ Paused'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingPromo(promo)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Banner</span>
                  </button>
                  <button
                    onClick={() => deletePromotion(promo.id)}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                    title="Delete Promotion"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* ✏️ EDIT BANNER & PROMOTION MODAL                                          */}
      {/* ========================================================================= */}
      {editingPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  ✏️
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Banner & Promotion</h3>
                  <p className="text-[11px] text-slate-500">Update campaign visuals, discounts, and schedules</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPromo(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              
              {/* Live Banner Preview */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Banner Preview</label>
                <div className="relative h-36 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={editingPromo.bannerImg}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg">
                    {editingPromo.discount || '20% OFF'}
                  </span>
                </div>
              </div>

              {/* Upload Image or URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Upload New Banner Image</label>
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200/60 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File / Photo</span>
                  </button>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, true)}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Or Paste Image URL</label>
                  <input
                    type="url"
                    value={editingPromo.bannerImg}
                    onChange={(e) => setEditingPromo({ ...editingPromo, bannerImg: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Campaign Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={editingPromo.title}
                  onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800"
                />
              </div>

              {/* Discount Text & Coupon Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Tag (e.g. 30% OFF)</label>
                  <input
                    type="text"
                    value={editingPromo.discount}
                    onChange={(e) => setEditingPromo({ ...editingPromo, discount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={editingPromo.code || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Category & Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Placement / Category</label>
                  <select
                    value={editingPromo.category}
                    onChange={(e) => setEditingPromo({ ...editingPromo, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  >
                    <option value="Flash Sales">Flash Sales</option>
                    <option value="Coupons">Coupons</option>
                    <option value="Bundles">Bundles</option>
                    <option value="Banners">Banners</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Validity Schedule</label>
                  <input
                    type="text"
                    value={editingPromo.validity}
                    onChange={(e) => setEditingPromo({ ...editingPromo, validity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                    placeholder="Valid: 1 - 15 Sept 2026"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status</label>
                <select
                  value={editingPromo.status}
                  onChange={(e) => setEditingPromo({ ...editingPromo, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                >
                  <option value="Active">Active (Visible in Store)</option>
                  <option value="Paused">Paused (Hidden)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPromo(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Banner Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ➕ CREATE NEW PROMOTION / BANNER MODAL                                     */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  🎨
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Create New Promotion Banner</h3>
                  <p className="text-[11px] text-slate-500">Launch a new marketing campaign or discount banner</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              
              {/* Live Preview */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Banner Preview</label>
                <div className="relative h-36 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={form.bannerImg}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg">
                    {form.discount || '20% OFF'}
                  </span>
                </div>
              </div>

              {/* Upload Image or URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Upload Banner Image</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200/60 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File / Photo</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, false)}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Or Paste Image URL</label>
                  <input
                    type="url"
                    value={form.bannerImg}
                    onChange={(e) => setForm({ ...form, bannerImg: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Campaign Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mega Weekend Harvest Deal"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800"
                />
              </div>

              {/* Discount & Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. 25% OFF"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. HARVEST25"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Category & Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  >
                    <option value="Flash Sales">Flash Sales</option>
                    <option value="Coupons">Coupons</option>
                    <option value="Bundles">Bundles</option>
                    <option value="Banners">Banners</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Validity Schedule</label>
                  <input
                    type="text"
                    placeholder="Valid: 1 - 10 Sept 2026"
                    value={form.validity}
                    onChange={(e) => setForm({ ...form, validity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Publish Promotion
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

