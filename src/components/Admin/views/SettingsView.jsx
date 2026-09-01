import React, { useState } from 'react';
import { Save, Check, Upload, Store, ShieldCheck, Bell, CreditCard, Palette } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const SettingsView = () => {
  const { addToast } = useStore();
  const [activeTab, setActiveTab] = useState('General');
  const [storeStatus, setStoreStatus] = useState(true);

  const [settings, setSettings] = useState({
    storeName: 'FreshMart',
    email: 'info@freshmart.com',
    phone: '0300-1234567',
    address: '123 Main Street, Lahore, Pakistan',
    timezone: '(UTC+05:00) Pakistan Time'
  });

  const handleSave = (e) => {
    e.preventDefault();
    addToast('Settings Saved ✅', 'Store preferences updated successfully.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage your store settings, notifications, and profile</p>
        </div>
      </div>

      {/* Tabs matching screenshot: General, Payment, Shipping, Notifications, Appearance */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {['General', 'Payment', 'Shipping', 'Notifications', 'Appearance'].map((tab) => (
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

      {/* Main Settings Form matching screenshot (2 Columns) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 sm:p-8">
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Form Fields (8 Columns) */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
              Store Information
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Store Name</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Store Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option>(UTC+05:00) Pakistan Time (Karachi/Lahore/Islamabad)</option>
                <option>(UTC+04:00) Dubai Time</option>
                <option>(UTC+00:00) London GMT</option>
                <option>(UTC-05:00) Eastern Time (US & Canada)</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              Save Changes
            </button>
          </div>

          {/* Right Logo & Status (4 Columns) matching screenshot */}
          <div className="lg:col-span-4 space-y-6 lg:border-l lg:border-slate-100 lg:pl-8">
            {/* Store Logo Card */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Store Logo
              </h3>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white mx-auto flex items-center justify-center text-2xl shadow-md">
                  🛒
                </div>
                <h4 className="text-sm font-black text-slate-800">FreshMart</h4>
                <button
                  type="button"
                  onClick={() => addToast('Upload Logo', 'Select image file (PNG/SVG)')}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs"
                >
                  Change Logo
                </button>
              </div>
            </div>

            {/* Store Status Toggle matching screenshot */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Store Status</span>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  {storeStatus ? 'Store is Active' : 'Store is Closed'}
                </span>
                <button
                  type="button"
                  onClick={() => setStoreStatus(!storeStatus)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    storeStatus ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>
          </div>

        </form>
      </div>

    </div>
  );
};
