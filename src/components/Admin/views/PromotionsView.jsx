import React, { useState } from 'react';
import { Plus, Tag, Calendar, Sparkles, Check, Edit2 } from 'lucide-react';
import { ADMIN_PROMOTIONS_DATA } from '../../../data/adminSuiteData';
import { useStore } from '../../../context/StoreContext';

export const PromotionsView = ({ onOpenCreatePromotionModal }) => {
  const { addToast } = useStore();
  const [activeTab, setActiveTab] = useState('Flash Sales');
  const [promotions, setPromotions] = useState(ADMIN_PROMOTIONS_DATA);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Promotions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage discounts, coupon codes, and bundle offers</p>
        </div>

        <button
          onClick={onOpenCreatePromotionModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Promotion</span>
        </button>
      </div>

      {/* Filter Tabs matching screenshot: Flash Sales, Coupons, Bundles, Banners */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {['Flash Sales', 'Coupons', 'Bundles', 'Banners'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors ${
              activeTab === tab
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Visual Promotion Cards matching screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
          >
            <div className="relative h-32 overflow-hidden bg-slate-100">
              <img
                src={promo.bannerImg}
                alt={promo.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                {promo.discount}
              </span>
            </div>

            <div className="p-4 space-y-2">
              <h3 className="text-sm font-bold text-slate-800">{promo.title}</h3>
              <p className="text-xs text-slate-400 font-medium">{promo.validity}</p>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {promo.status}
                </span>
                <button
                  onClick={() => addToast('Promotion Settings', `Configuring ${promo.title}`)}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Edit Banner →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Promotions Table matching screenshot */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Recent Campaign Schedules</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 pb-2">
                <th className="pb-2 font-semibold">Title</th>
                <th className="pb-2 font-semibold">Type</th>
                <th className="pb-2 font-semibold">Valid From</th>
                <th className="pb-2 font-semibold">Valid To</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 font-bold text-slate-800">Weekend Flash Sale</td>
                <td className="py-2.5 text-slate-600">Flash Sale</td>
                <td className="py-2.5 text-slate-500">28 Aug 2026</td>
                <td className="py-2.5 text-slate-500">30 Aug 2026</td>
                <td className="py-2.5">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 font-bold text-slate-800">Fresh Fruits Discount</td>
                <td className="py-2.5 text-slate-600">Discount</td>
                <td className="py-2.5 text-slate-500">25 Aug 2026</td>
                <td className="py-2.5 text-slate-500">31 Aug 2026</td>
                <td className="py-2.5">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 font-bold text-slate-800">Buy 2 Get 1 Free</td>
                <td className="py-2.5 text-slate-600">Bundle</td>
                <td className="py-2.5 text-slate-500">20 Aug 2026</td>
                <td className="py-2.5 text-slate-500">28 Aug 2026</td>
                <td className="py-2.5">
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Expired</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
