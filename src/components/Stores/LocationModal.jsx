import React, { useState } from 'react';
import { X, MapPin, Search, Check, Zap, Building, Compass, Navigation, ChevronRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PAKISTAN_CITIES, findNearestCity, calculateDistanceKm } from '../../data/pakistanLocations';
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
  const [selectedCityId, setSelectedCityId] = useState(
    PAKISTAN_CITIES.find((c) => c.city === deliveryLocation?.city)?.id || 'lahore'
  );
  const [isLocating, setIsLocating] = useState(false);

  if (!isLocationModalOpen) return null;

  const currentCityObj = PAKISTAN_CITIES.find((c) => c.id === selectedCityId) || PAKISTAN_CITIES[0];

  const handleSelectCity = (cityObj) => {
    setSelectedCityId(cityObj.id);
    const defaultN = cityObj.neighborhoods[0];
    setDeliveryLocation({
      city: cityObj.city,
      address: defaultN.defaultAddress,
      neighborhood: defaultN.name,
      coords: defaultN.coords,
      hubName: cityObj.hubName,
      label: 'Home'
    });
    addToast('City Selected 📍', `Switched delivery hub to ${cityObj.city}`);
  };

  const handleSelectNeighborhood = (cityObj, neighborhood) => {
    setDeliveryLocation({
      city: cityObj.city,
      address: neighborhood.defaultAddress,
      neighborhood: neighborhood.name,
      coords: neighborhood.coords,
      hubName: cityObj.hubName,
      label: 'Home'
    });
    setIsLocationModalOpen(false);
    addToast('Delivery Pin Set 📍', `Delivering to ${neighborhood.name}, ${cityObj.city}`);
  };

  const handleAutoDetectGPS = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      addToast('GPS Not Supported', 'Geolocation is not supported by your browser.', 'error');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const { city, distanceKm } = findNearestCity(latitude, longitude);

        // Find closest neighborhood in that city
        let closestNeighborhood = city.neighborhoods[0];
        let minNeighborhoodDist = Infinity;
        city.neighborhoods.forEach((n) => {
          const d = calculateDistanceKm(latitude, longitude, n.coords.lat, n.coords.lng);
          if (d < minNeighborhoodDist) {
            minNeighborhoodDist = d;
            closestNeighborhood = n;
          }
        });

        setSelectedCityId(city.id);
        setDeliveryLocation({
          city: city.city,
          address: `${closestNeighborhood.defaultAddress} (Exact GPS ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          neighborhood: closestNeighborhood.name,
          coords: { lat: latitude, lng: longitude },
          hubName: city.hubName,
          label: 'Current GPS Location'
        });
        setIsLocating(false);
        setIsLocationModalOpen(false);
        addToast('Exact GPS Location Locked 🎯', `Connected to ${city.hubName} (${distanceKm} km away)`);
      },
      (err) => {
        setIsLocating(false);
        addToast('GPS Permission Needed', 'Please allow location permission in your browser or select your city below.', 'info');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filteredCities = PAKISTAN_CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.neighborhoods.some((n) =>
        n.name.toLowerCase().includes(citySearch.toLowerCase()) ||
        n.area.toLowerCase().includes(citySearch.toLowerCase())
      )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsLocationModalOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
              <Navigation className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Select Delivery Location & GPS Hub</h2>
              <p className="text-xs text-emerald-200">10-15 Min Express Grocery Dispatch across Pakistan</p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/90 focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* GPS Auto Detect Banner */}
          <button
            onClick={handleAutoDetectGPS}
            disabled={isLocating}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl text-xs flex items-center justify-between shadow-md transition-all cursor-pointer hover:scale-[1.01]"
          >
            <div className="flex items-center gap-2.5">
              <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locking High-Accuracy GPS Satellites...' : 'Auto-Detect Exact Current GPS Location'}</span>
            </div>
            <span className="text-[10px] bg-white/20 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              1-Click
            </span>
          </button>

          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search your city or neighborhood (e.g. Gulberg, Clifton, F-7, Saddar)..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Available Delivery Cities */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Available Delivery Cities & Fulfillment Hubs
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {filteredCities.map((item) => {
                const isSelected = deliveryLocation?.city === item.city;
                const isExpanded = selectedCityId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-500'
                        : isExpanded
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      onClick={() => handleSelectCity(item)}
                      className="p-3.5 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-slate-900">{item.city}</h4>
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.2 rounded-full">
                              {item.hubName.split('(')[0].trim()}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {item.neighborhoods.map((n) => n.name).join(' • ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-700" />
                            Active City
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Neighborhood Dropdown when City is Selected */}
                    {isExpanded && (
                      <div className="p-3 pt-0 border-t border-emerald-100/80 mt-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {item.neighborhoods.map((n) => (
                          <button
                            type="button"
                            key={n.id}
                            onClick={() => handleSelectNeighborhood(item, n)}
                            className="p-2 bg-white hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-200 text-left text-[11px] transition-all cursor-pointer group shadow-2xs"
                          >
                            <span className="font-bold text-slate-900 group-hover:text-white block">{n.name}</span>
                            <span className="text-[9px] text-slate-400 group-hover:text-emerald-100 truncate block">{n.area}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Selected Destination Summary */}
          {deliveryLocation && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Selected Drop-off Pin:</span>
                <span className="font-bold text-slate-900 line-clamp-1">{deliveryLocation.address}</span>
                <span className="text-[11px] text-emerald-700 font-semibold">{deliveryLocation.city}</span>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all shrink-0"
              >
                Confirm Pin
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

