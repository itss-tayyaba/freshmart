import React, { useState } from 'react';
import { X, MapPin, Search, Check, Zap, Building } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { STORE_LOCATIONS } from '../../data/freshMartData';

export const LocationModal = () => {
  const {
    isLocationModalOpen,
    setIsLocationModalOpen,
    deliveryLocation,
    setDeliveryLocation,
    addToast
  } = useStore();

  const [citySearch, setCitySearch] = useState('');

  if (!isLocationModalOpen) return null;

  const popularCities = [
    { city: 'Lahore, Pakistan', area: 'Johar Town / Gulberg / DHA' },
    { city: 'Karachi, Pakistan', area: 'Clifton / Defense / Gulshan' },
    { city: 'Islamabad, Pakistan', area: 'F-7 / Blue Area / G-11' },
    { city: 'Rawalpindi, Pakistan', area: 'Saddar / Bahria Town' },
    { city: 'Faisalabad, Pakistan', area: 'D Ground / People Colony' }
  ];

  const handleSelectCity = (cityObj) => {
    setDeliveryLocation({
      city: cityObj.city,
      address: `123 Main Street, ${cityObj.area.split('/')[0].trim()}`,
      label: 'Home'
    });
    setIsLocationModalOpen(false);
    addToast('Location Updated 📍', `Delivering to ${cityObj.city} (10-Min Dark Store Connected)`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsLocationModalOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Select Delivery Location</h2>
              <p className="text-xs text-emerald-200">Find 10-minute instant delivery coverage in your area</p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-white/90 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search your city or neighborhood..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Popular Cities */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Available Delivery Cities
            </span>
            <div className="space-y-2">
              {popularCities.map((item) => (
                <div
                  key={item.city}
                  onClick={() => handleSelectCity(item)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    deliveryLocation.city === item.city
                      ? 'border-emerald-600 bg-emerald-50/60 font-bold text-emerald-950 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-bold">{item.city}</h4>
                      <span className="text-[10px] text-slate-400">{item.area}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      10 Min
                    </span>
                    {deliveryLocation.city === item.city && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Local Dark Stores */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Active Express Dark Stores
            </span>
            <div className="space-y-1.5 text-xs text-slate-600">
              {STORE_LOCATIONS.map((store) => (
                <div key={store.id} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{store.name}</span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold">{store.deliveryTime}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
