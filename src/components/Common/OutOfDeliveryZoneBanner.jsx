import React from 'react';
import { AlertTriangle, MapPin, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

/**
 * Banner shown across the storefront when a customer's location
 * is outside all retailer delivery zones.
 * Prompts the customer to change their location to fall into a retailer delivery zone.
 */
export const OutOfDeliveryZoneBanner = () => {
  const { isOutsideDeliveryZone, setIsLocationModalOpen, deliveryLocation } = useStore();

  if (!isOutsideDeliveryZone) {
    return null;
  }

  const currentArea = deliveryLocation?.address
    ? deliveryLocation.address.split(',')[0]
    : deliveryLocation?.city || 'your current area';

  return (
    <div
      role="alert"
      className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white shadow-md relative z-30 transition-all duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Warning Icon + Message */}
          <div className="flex items-center gap-2.5 min-w-0 text-center sm:text-left">
            <span className="p-1.5 rounded-xl bg-white/20 text-white shrink-0 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </span>
            <div className="min-w-0">
              <p className="font-black text-xs sm:text-sm tracking-tight flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
                <span>Choose different location (no store found)</span>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                  Outside Delivery Zone
                </span>
              </p>
              <p className="text-[11px] sm:text-xs text-amber-100 font-medium leading-tight line-clamp-1 sm:line-clamp-none mt-0.5">
                Sorry, delivery is currently unavailable at your location. We couldn't find any retailer delivering to <strong className="text-white font-bold">{currentArea}</strong>. Please change your location so that you fall in an active retailer delivery zone.
              </p>
            </div>
          </div>

          {/* Action Button to Change Location */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="w-full sm:w-auto px-4 py-1.5 sm:py-2 bg-white text-rose-700 hover:bg-amber-50 active:scale-95 font-black text-xs sm:text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Change Location</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5 text-rose-500" />
          </button>

        </div>
      </div>
    </div>
  );
};
