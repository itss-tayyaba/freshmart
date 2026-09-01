import React, { useState } from 'react';
import { X, Search, Truck, CheckCircle2, Clock, MapPin, Phone, User, Package, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { MOCK_TRACKING_ORDERS } from '../../data/groceryData';

export const OrderTrackerModal = () => {
  const { isOrderTrackerOpen, setIsOrderTrackerOpen } = useStore();
  const [orderInput, setOrderInput] = useState('GROC-8924');
  const [currentOrder, setCurrentOrder] = useState(MOCK_TRACKING_ORDERS['GROC-8924']);
  const [searchError, setSearchError] = useState('');

  if (!isOrderTrackerOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError('');
    const id = orderInput.trim().toUpperCase();
    if (MOCK_TRACKING_ORDERS[id]) {
      setCurrentOrder(MOCK_TRACKING_ORDERS[id]);
    } else {
      setSearchError(`Order ID "${id}" not found. Try sample order GROC-8924 or GROC-5120.`);
    }
  };

  const selectSample = (id) => {
    setOrderInput(id);
    setCurrentOrder(MOCK_TRACKING_ORDERS[id]);
    setSearchError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOrderTrackerOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-brand-green text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center">
              <Truck className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Live Order Tracking</h2>
              <p className="text-xs text-emerald-200">Real-time GPS dispatch & cold-chain status</p>
            </div>
          </div>
          <button
            onClick={() => setIsOrderTrackerOpen(false)}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-white/90 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Order Search Input */}
          <div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Order ID (e.g. GROC-8924)"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 uppercase font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-brand-green hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Track
              </button>
            </form>

            {/* Quick Sample IDs */}
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span>Try sample orders:</span>
              <button
                type="button"
                onClick={() => selectSample('GROC-8924')}
                className="font-mono text-emerald-700 font-bold hover:underline"
              >
                GROC-8924 (In-Transit)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => selectSample('GROC-5120')}
                className="font-mono text-emerald-700 font-bold hover:underline"
              >
                GROC-5120 (Delivered)
              </button>
            </div>

            {searchError && (
              <p className="text-xs text-rose-600 mt-2 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                {searchError}
              </p>
            )}
          </div>

          {/* Current Order Summary Card */}
          {currentOrder && (
            <div className="space-y-6">
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Order Number
                  </span>
                  <h3 className="text-base font-black text-slate-800 font-mono">
                    {currentOrder.orderId}
                  </h3>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Placed At
                  </span>
                  <p className="text-xs font-semibold text-slate-700">{currentOrder.placedAt}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    ETA Delivery
                  </span>
                  <p className="text-xs font-bold text-emerald-700">{currentOrder.estimatedDelivery}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Items & Total
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {currentOrder.itemsCount} items • {currentOrder.total}
                  </p>
                </div>
              </div>

              {/* Graphical Timeline */}
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {currentOrder.timeline.map((item, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-6 sm:-left-8 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.completed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-xs sm:text-sm font-bold ${
                            item.completed ? 'text-slate-800' : 'text-slate-400'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-400">{item.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Driver Details Card (if in transit) */}
              {currentOrder.currentStage === 3 && (
                <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                        Assigned Courier Driver
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                        {currentOrder.driverName}
                      </h4>
                      <p className="text-[11px] text-slate-500">{currentOrder.driverVehicle}</p>
                    </div>
                  </div>

                  <a
                    href={`tel:${currentOrder.driverPhone}`}
                    className="px-3.5 py-2 rounded-xl bg-brand-green hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Driver</span>
                  </a>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
