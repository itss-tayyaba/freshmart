import React from 'react';
import {
  Store,
  MapPin,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  Truck,
  Building2,
  Tag,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const NearbyStoresSection = ({ nearbyStores = [], onSelectStore }) => {
  const { currentTenant, currentBranch } = useStore();

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Step 2: Choose Nearby Store
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Live Radius Check • 100% Deliverable
            </span>
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Nearby / Deliverable Stores</span>
            <span className="text-sm font-bold text-slate-500">
              ({nearbyStores.length} Stores Available)
            </span>
          </h3>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Stores ranked by proximity to your delivery coordinates
        </div>
      </div>

      {/* Grid of Nearby Grocery Stores (Matching User Flowchart) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {nearbyStores.map((store) => {
          const isSelected = currentTenant?.id === store.id || (currentTenant?.slug && currentTenant.slug === store.tenant.slug);
          
          return (
            <div
              key={store.id}
              onClick={() => onSelectStore && onSelectStore(store.tenant, store.nearestBranch)}
              className={`group relative rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-white border-2 shadow-xl ring-4 ring-emerald-500/10'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-lg'
              }`}
              style={{
                borderColor: isSelected ? (store.color || '#10b981') : undefined
              }}
            >
              {/* Selected Floating Top-Right Ribbon */}
              {isSelected && (
                <div
                  style={{ backgroundColor: store.color || '#10b981' }}
                  className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Active Store</span>
                </div>
              )}

              {/* Card Header: Store Logo, Name, Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{ backgroundColor: store.color || '#0f172a' }}
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl text-white shadow-sm shrink-0"
                    >
                      {store.logo}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition truncate">
                        {store.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
                        {store.badge}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200/60 rounded-lg text-amber-800 text-[11px] font-black shrink-0">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{store.rating}</span>
                  </div>
                </div>

                {/* Tagline / Description */}
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {store.tagline || 'Fresh groceries delivered right to your doorstep.'}
                </p>

                {/* Key Metrics: Distance & Express ETA */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Distance:</span>
                    </span>
                    <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                      {store.distanceFormatted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Express Time:</span>
                    </span>
                    <span className="font-bold text-slate-800">
                      {store.estimatedTime}
                    </span>
                  </div>

                  {/* Fulfilling Branch */}
                  <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-600 flex items-start gap-1.5">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">
                      Fulfilling from: <strong className="text-slate-800">{store.nearestBranch?.name || 'Central Hub'}</strong>
                    </span>
                  </div>
                </div>

                {/* Delivery Eligibility & Free Delivery Tag */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    🟢 {store.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    🚚 {store.deliveryFeeText}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  style={{
                    backgroundColor: isSelected ? (store.color || '#10b981') : undefined
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-md'
                      : 'bg-slate-900 hover:bg-black text-white hover:shadow-md'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Shopping This Store</span>
                    </>
                  ) : (
                    <>
                      <span>Shop {store.name.split(' ')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
