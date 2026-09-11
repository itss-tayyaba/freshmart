import React, { useState, useRef } from 'react';
import {
  Plus,
  Tag,
  Calendar,
  Sparkles,
  Check,
  Edit2,
  Trash2,
  Image,
  Upload,
  X,
  Eye,
  EyeOff,
  Copy,
  Percent,
  DollarSign,
  Clock,
  ShieldCheck,
  AlertCircle,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  TrendingUp,
  BarChart2,
  CheckCircle2,
  Truck,
  HelpCircle
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const PromotionsView = () => {
  const { promotions, addPromotion, updatePromotion, deletePromotion, togglePromotionStatus, addToast } = useStore();
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'percentage' | 'fixed' | 'free_shipping' | 'Active' | 'Paused'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [editingPromo, setEditingPromo] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // 8-Parameter New Coupon Form State
  const [form, setForm] = useState({
    code: '',
    title: '',
    discountType: 'percentage', // 'percentage' | 'fixed' | 'free_shipping'
    discountAmount: 20,
    minOrder: 1000,
    maxDiscount: 500,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 100,
    category: 'Coupons',
    status: 'Active',
    bannerImg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
  });

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast('Coupon Copied! 📋', `Code "${code}" copied to clipboard.`);
    setTimeout(() => setCopiedCode(''), 2500);
  };

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
    if (!form.code.trim()) {
      addToast('Required Field', 'Please enter a coupon code.', 'error');
      return;
    }

    const cleanCode = form.code.toUpperCase().trim();
    const amount = Number(form.discountAmount || 0);

    addPromotion({
      code: cleanCode,
      title: form.title.trim() || `${amount}${form.discountType === 'percentage' ? '%' : ' Rs.'} OFF Promo`,
      discountType: form.discountType,
      discountAmount: amount,
      minOrder: Number(form.minOrder || 0),
      maxDiscount: form.discountType === 'percentage' ? Number(form.maxDiscount || 0) : 0,
      startDate: form.startDate,
      endDate: form.endDate || null,
      usageLimit: Number(form.usageLimit || 0),
      category: form.category,
      status: form.status,
      bannerImg: form.bannerImg,
      discount: form.discountType === 'percentage' ? `${amount}% OFF` : form.discountType === 'fixed' ? `Rs. ${amount} OFF` : 'Free Shipping'
    });

    setIsCreateModalOpen(false);
    setForm({
      code: '',
      title: '',
      discountType: 'percentage',
      discountAmount: 20,
      minOrder: 1000,
      maxDiscount: 500,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: 100,
      category: 'Coupons',
      status: 'Active',
      bannerImg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingPromo) return;

    const amount = Number(editingPromo.discountAmount || 0);

    updatePromotion(editingPromo.id, {
      code: editingPromo.code.toUpperCase().trim(),
      title: editingPromo.title,
      discountType: editingPromo.discountType || 'percentage',
      discountAmount: amount,
      minOrder: Number(editingPromo.minOrder || 0),
      maxDiscount: editingPromo.discountType === 'percentage' ? Number(editingPromo.maxDiscount || 0) : 0,
      startDate: editingPromo.startDate,
      endDate: editingPromo.endDate,
      usageLimit: Number(editingPromo.usageLimit || 0),
      category: editingPromo.category,
      bannerImg: editingPromo.bannerImg,
      status: editingPromo.status,
      discount: editingPromo.discountType === 'percentage' ? `${amount}% OFF` : editingPromo.discountType === 'fixed' ? `Rs. ${amount} OFF` : 'Free Shipping'
    });

    setEditingPromo(null);
  };

  // KPI Calculations
  const allPromos = promotions || [];
  const activeCount = allPromos.filter((p) => p.status === 'Active').length;
  const totalRedemptions = allPromos.reduce((sum, p) => sum + (Number(p.usedCount) || 0), 0);
  const totalDiscountsGiven = allPromos.reduce((sum, p) => sum + (Number(p.usedCount || 0) * (Number(p.discountAmount || 20) * 15)), 0);

  // Filtered list
  const filteredPromos = allPromos.filter((p) => {
    // Tab Filter
    if (activeTab === 'percentage' && p.discountType !== 'percentage' && !p.discount?.includes('%')) return false;
    if (activeTab === 'fixed' && p.discountType !== 'fixed' && !p.discount?.includes('Rs.')) return false;
    if (activeTab === 'free_shipping' && p.discountType !== 'free_shipping' && !p.freeShipping) return false;
    if (activeTab === 'Active' && p.status !== 'Active') return false;
    if (activeTab === 'Paused' && p.status !== 'Paused') return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const codeMatch = p.code?.toLowerCase().includes(q);
      const titleMatch = p.title?.toLowerCase().includes(q);
      const categoryMatch = p.category?.toLowerCase().includes(q);
      if (!codeMatch && !titleMatch && !categoryMatch) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Coupons & Promotions Management</h2>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
              8-Parameter Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure coupon codes, discount types (% or flat), minimum cart spend, maximum discount caps, validity dates, and usage limits.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Coupon</span>
        </button>
      </div>

      {/* 2. Top KPI Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">Active Campaigns</span>
            <span className="text-lg font-black text-slate-900">{activeCount} Coupons</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">Total Redemptions</span>
            <span className="text-lg font-black text-slate-900">{totalRedemptions} Uses</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">Est. Customer Savings</span>
            <span className="text-lg font-black text-slate-900">Rs. {totalDiscountsGiven.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">Total Created</span>
            <span className="text-lg font-black text-slate-900">{allPromos.length} Coupons</span>
          </div>
        </div>
      </div>

      {/* 3. Filters, Search & View Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Search by code (e.g. FLASH30), title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'All', label: 'All' },
            { id: 'percentage', label: '% Percentage' },
            { id: 'fixed', label: 'Rs. Fixed' },
            { id: 'free_shipping', label: '🚚 Free Ship' },
            { id: 'Active', label: '🟢 Active' },
            { id: 'Paused', label: '⏸️ Paused' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Switcher: Table vs Cards */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end md:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'cards' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Banner Cards
          </button>
        </div>

      </div>

      {/* 4. Table View (Showing All 8 Admin Controls Clearly) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
          {filteredPromos.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Tag className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No coupons found</h3>
              <p className="text-xs text-slate-400">Try adjusting your filters or click "+ Create New Coupon".</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 pb-3 font-semibold">
                    <th className="pb-3">Coupon Code & Title</th>
                    <th className="pb-3">Discount Type & Amount</th>
                    <th className="pb-3">Min Order</th>
                    <th className="pb-3">Max Discount Cap</th>
                    <th className="pb-3">Validity Window</th>
                    <th className="pb-3">Usage Limit</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPromos.map((promo) => {
                    const isPercentage = promo.discountType === 'percentage' || promo.discount?.includes('%');
                    const isFixed = promo.discountType === 'fixed' || promo.discount?.includes('Rs.');
                    const isFreeShip = promo.discountType === 'free_shipping' || promo.freeShipping;
                    const amount = promo.discountAmount || (promo.discount ? parseInt(promo.discount, 10) : 20);
                    const minOrder = Number(promo.minOrder || promo.minSpend || 0);
                    const maxDiscount = Number(promo.maxDiscount || 0);
                    const usageLimit = Number(promo.usageLimit || 0);
                    const usedCount = Number(promo.usedCount || 0);
                    const usagePercent = usageLimit > 0 ? Math.min(100, Math.round((usedCount / usageLimit) * 100)) : 0;

                    return (
                      <tr key={promo.id || promo.code} className="hover:bg-slate-50/60 transition-colors">
                        
                        {/* 1. Coupon Code & Title */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyCode(promo.code)}
                              className="group font-mono font-black text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Click to copy code"
                            >
                              <span>{promo.code}</span>
                              {copiedCode === promo.code ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
                              )}
                            </button>
                            <span className="font-bold text-slate-900 text-xs block">{promo.title}</span>
                          </div>
                        </td>

                        {/* 2. Discount Type & Amount */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            {isPercentage ? (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black rounded-md flex items-center gap-1">
                                <Percent className="w-3 h-3" />
                                <span>{amount}% OFF</span>
                              </span>
                            ) : isFixed ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black rounded-md flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span>Rs. {amount} OFF</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black rounded-md flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                <span>Free Delivery</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Minimum Order */}
                        <td className="py-3.5 font-semibold text-slate-700">
                          {minOrder > 0 ? (
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
                              Rs. {minOrder.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No Minimum</span>
                          )}
                        </td>

                        {/* 4. Maximum Discount Cap */}
                        <td className="py-3.5 font-semibold text-slate-700">
                          {isPercentage ? (
                            maxDiscount > 0 ? (
                              <span className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
                                Cap: Rs. {maxDiscount.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Unlimited Cap</span>
                            )
                          ) : (
                            <span className="text-slate-400 text-[11px]">Fixed Value</span>
                          )}
                        </td>

                        {/* 5. Validity Dates (Start to End) */}
                        <td className="py-3.5">
                          <div className="text-[11px] text-slate-600 font-medium space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-500">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{promo.startDate ? new Date(promo.startDate).toLocaleDateString() : 'Active Now'}</span>
                              <span>→</span>
                              <span className="font-bold text-slate-800">
                                {promo.endDate ? new Date(promo.endDate).toLocaleDateString() : 'No Expiry'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 6. Usage Limit & Progress */}
                        <td className="py-3.5">
                          {usageLimit > 0 ? (
                            <div className="w-28 space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-600">
                                <span>{usedCount} used</span>
                                <span className="text-slate-400">/ {usageLimit}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    usagePercent >= 90 ? 'bg-rose-500' : usagePercent >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">∞ Unlimited</span>
                          )}
                        </td>

                        {/* 7. Status */}
                        <td className="py-3.5">
                          <button
                            type="button"
                            onClick={() => togglePromotionStatus(promo.id || promo.code)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-full cursor-pointer transition-colors ${
                              promo.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Click to toggle status"
                          >
                            {promo.status === 'Active' ? '🟢 Active' : '⏸️ Paused'}
                          </button>
                        </td>

                        {/* 8. Actions */}
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingPromo(promo)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="Edit Coupon Parameters"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePromotion(promo.id || promo.code)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Coupon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Banner Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredPromos.map((promo) => (
            <div
              key={promo.id || promo.code}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group"
            >
              {/* Banner Image Preview */}
              <div className="relative h-36 overflow-hidden bg-slate-100">
                <img
                  src={promo.bannerImg || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                  alt={promo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                  {promo.discountType === 'percentage'
                    ? `${promo.discountAmount}% OFF`
                    : promo.discountType === 'fixed'
                    ? `Rs. ${promo.discountAmount} OFF`
                    : 'Free Delivery'}
                </span>
                <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                  {promo.code}
                </span>
              </div>

              {/* Content & Actions */}
              <div className="p-5 space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      {promo.discountType === 'percentage' ? 'Percentage Discount' : promo.discountType === 'fixed' ? 'Fixed Rupee Voucher' : 'Free Shipping'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Min: Rs. {promo.minOrder || 0}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">{promo.title}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {promo.startDate ? new Date(promo.startDate).toLocaleDateString() : 'Now'} - {promo.endDate ? new Date(promo.endDate).toLocaleDateString() : 'Ongoing'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => togglePromotionStatus(promo.id || promo.code)}
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                      promo.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {promo.status === 'Active' ? '✓ Active' : '⏸ Paused'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingPromo(promo)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => deletePromotion(promo.id || promo.code)}
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
      )}

      {/* ========================================================================= */}
      {/* 🏷️ CREATE NEW COUPON MODAL (ALL 8 ADMIN CONTROLS)                           */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shadow-xs">
                  🏷️
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Create New Coupon</h3>
                  <p className="text-[11px] text-slate-500">Configure all 8 discount & validity rules</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Coupon Badge Preview */}
            <div className="p-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl text-white flex items-center justify-between shadow-md">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Preview Badge</span>
                <h4 className="text-sm font-black">{form.title || 'Special Promotion'}</h4>
                <p className="text-[11px] text-slate-300">
                  {form.discountType === 'percentage'
                    ? `${form.discountAmount || 20}% OFF${form.maxDiscount > 0 ? ` (Up to Rs. ${form.maxDiscount})` : ''}`
                    : form.discountType === 'fixed'
                    ? `Flat Rs. ${form.discountAmount || 100} OFF`
                    : 'Free Delivery on Orders'}
                  {form.minOrder > 0 ? ` • Min Order Rs. ${form.minOrder}` : ''}
                </p>
              </div>
              <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 font-mono font-black text-sm text-lime-400">
                {form.code.toUpperCase() || 'COUPONCODE'}
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              
              {/* Parameter 1 & 2: Coupon Code & Discount Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    1. Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FLASH30, SAVE20"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    2. Discount Type *
                  </label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="percentage">Percentage Discount (% OFF)</option>
                    <option value="fixed">Fixed Amount (Rs. OFF)</option>
                    <option value="free_shipping">Free Shipping (100% Delivery Waiver)</option>
                  </select>
                </div>
              </div>

              {/* Parameter 3 & 4: Discount Amount & Minimum Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    3. Discount Amount * {form.discountType === 'percentage' ? '(%)' : '(Rs.)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    disabled={form.discountType === 'free_shipping'}
                    value={form.discountType === 'free_shipping' ? 0 : form.discountAmount}
                    onChange={(e) => setForm({ ...form, discountAmount: Number(e.target.value) })}
                    placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 150'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    4. Minimum Order Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1000 (0 for no minimum)"
                    value={form.minOrder}
                    onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Parameter 5 & 8: Maximum Discount Cap & Usage Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    5. Maximum Discount Cap (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={form.discountType !== 'percentage'}
                    placeholder={form.discountType === 'percentage' ? 'e.g. 500 (0 for uncapped)' : 'N/A for fixed'}
                    value={form.discountType === 'percentage' ? form.maxDiscount : 0}
                    onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Caps maximum savings (e.g. 20% off up to max Rs. 500).
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    8. Usage Limit (Max Redemptions)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 100 (0 for unlimited)"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Total times coupon can be redeemed by shoppers.
                  </span>
                </div>
              </div>

              {/* Parameter 6 & 7: Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    6. Start Date (Active From)
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    7. End Date (Expiry)
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Title & Placement */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Campaign Title / Marketing Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekend Grocery Mega Flash Sale"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish Coupon</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ EDIT COUPON MODAL                                                      */}
      {/* ========================================================================= */}
      {editingPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shadow-xs">
                  ✏️
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Coupon Parameters</h3>
                  <p className="text-[11px] text-slate-500">Update code, discount rules, caps, dates & limits</p>
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
              
              {/* Code & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={editingPromo.code}
                    onChange={(e) => setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
                  <select
                    value={editingPromo.discountType || 'percentage'}
                    onChange={(e) => setEditingPromo({ ...editingPromo, discountType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="percentage">Percentage Discount (% OFF)</option>
                    <option value="fixed">Fixed Amount (Rs. OFF)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
              </div>

              {/* Amount & Min Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Amount</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingPromo.discountAmount || (editingPromo.discount ? parseInt(editingPromo.discount, 10) : 20)}
                    onChange={(e) => setEditingPromo({ ...editingPromo, discountAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Minimum Order Amount (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPromo.minOrder || editingPromo.minSpend || 0}
                    onChange={(e) => setEditingPromo({ ...editingPromo, minOrder: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  />
                </div>
              </div>

              {/* Max Discount & Usage Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Maximum Discount Cap (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPromo.maxDiscount || 0}
                    onChange={(e) => setEditingPromo({ ...editingPromo, maxDiscount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Usage Limit (Total Redemptions)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPromo.usageLimit || 0}
                    onChange={(e) => setEditingPromo({ ...editingPromo, usageLimit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editingPromo.startDate ? new Date(editingPromo.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={editingPromo.endDate ? new Date(editingPromo.endDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  />
                </div>
              </div>

              {/* Title & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Campaign Title</label>
                  <input
                    type="text"
                    value={editingPromo.title}
                    onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editingPromo.status}
                    onChange={(e) => setEditingPromo({ ...editingPromo, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  >
                    <option value="Active">Active (Live in Store)</option>
                    <option value="Paused">Paused (Disabled)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPromo(null)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

