import React, { useState } from 'react';
import { X, Search, Truck, CheckCircle2, Clock, MapPin, Phone, MessageSquare, User, Package, ShieldCheck, ChevronRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { MOCK_TRACKING_ORDERS } from '../../data/groceryData';

export const OrderTrackerModal = () => {
  const { isOrderTrackerOpen, setIsOrderTrackerOpen, customerOrders, navigateTo } = useStore();
  const [orderInput, setOrderInput] = useState(
    customerOrders.length > 0 ? customerOrders[0].id : 'GROC-8924'
  );
  const [searchError, setSearchError] = useState('');

  if (!isOrderTrackerOpen) return null;

  // Build a resolved tracking object whether from customerOrders or MOCK_TRACKING_ORDERS
  const resolveOrder = (searchId) => {
    const cleanId = (searchId || '').trim().toUpperCase();
    
    // Check placed customer orders first
    const foundReal = customerOrders.find(
      (o) => o.id.toUpperCase() === cleanId || o.id.toUpperCase().includes(cleanId)
    );
    if (foundReal) {
      const isAssigned = !!foundReal.assignedRider;
      const isDelivered = (foundReal.status || '').toLowerCase() === 'delivered';
      const isOutForDelivery = (foundReal.status || '').toLowerCase().includes('out') || isAssigned;

      return {
        orderId: foundReal.id,
        placedAt: foundReal.time || 'Today, Express Slot',
        estimatedDelivery: foundReal.deliverySlot || '⚡ 15-25 Mins Express Delivery',
        itemsCount: foundReal.rawItems ? foundReal.rawItems.length : 3,
        total: `PKR ${foundReal.totalAmount || foundReal.total || 850}`,
        address: foundReal.address || 'Standard Delivery Address',
        city: foundReal.city || 'Lahore',
        currentStage: isDelivered ? 4 : isOutForDelivery ? 3 : 1,
        driverName: foundReal.assignedRider?.name || 'Awaiting Courier Assignment',
        driverPhone: foundReal.assignedRider?.phone || null,
        driverVehicle: foundReal.assignedRider?.vehicle || 'Fleet Courier',
        isAssigned,
        timeline: [
          {
            title: '1. Order Confirmed',
            time: 'Completed',
            desc: `Invoice generated for ${foundReal.customer || 'Customer'}`,
            completed: true
          },
          {
            title: '2. Dark Store Packing',
            time: isOutForDelivery || isDelivered ? 'Completed' : 'In Progress',
            desc: 'Chilled cold-chain packaging at logistics hub',
            completed: isOutForDelivery || isDelivered
          },
          {
            title: '3. Courier Dispatched',
            time: isDelivered ? 'Completed' : isOutForDelivery ? 'In Transit' : 'Pending',
            desc: isAssigned
              ? `Assigned to ${foundReal.assignedRider.name} (${foundReal.assignedRider.vehicle || 'Bike'})`
              : 'Dispatch team is reviewing address to assign fleet rider',
            completed: isOutForDelivery || isDelivered
          },
          {
            title: '4. Delivered',
            time: isDelivered ? 'Delivered' : 'Pending',
            desc: `Handover at ${foundReal.address || 'drop-off address'}`,
            completed: isDelivered
          }
        ]
      };
    }

    if (MOCK_TRACKING_ORDERS[cleanId]) {
      const mock = MOCK_TRACKING_ORDERS[cleanId];
      return {
        ...mock,
        address: 'House 14, Block C, Gulberg 3',
        city: 'Lahore',
        isAssigned: !!mock.driverPhone
      };
    }

    return null;
  };

  const [currentOrder, setCurrentOrder] = useState(resolveOrder(orderInput) || MOCK_TRACKING_ORDERS['GROC-8924']);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError('');
    const resolved = resolveOrder(orderInput);
    if (resolved) {
      setCurrentOrder(resolved);
    } else {
      setSearchError(`Order ID "${orderInput}" not found. Try sample order GROC-8924 or GROC-5120.`);
    }
  };

  const selectSample = (id) => {
    setOrderInput(id);
    const resolved = resolveOrder(id);
    if (resolved) {
      setCurrentOrder(resolved);
      setSearchError('');
    }
  };

  const handleOpenDeliveryPage = () => {
    setIsOrderTrackerOpen(false);
    navigateTo('delivery');
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
        <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Order Fulfillment & Delivery Status</h2>
              <p className="text-xs text-emerald-200">Real-time order milestone tracking & courier contact</p>
            </div>
          </div>
          <button
            onClick={() => setIsOrderTrackerOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/90 focus:outline-none cursor-pointer"
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
                  placeholder="Enter Order ID (e.g. #ORD1024 or GROC-8924)"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 uppercase font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Track
              </button>
            </form>

            {/* Quick Sample or Recent Orders */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
              <span>Quick track:</span>
              {customerOrders.slice(0, 2).map((o) => (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => selectSample(o.id)}
                  className="font-mono text-emerald-700 font-bold hover:underline"
                >
                  {o.id} (Your Order)
                </button>
              ))}
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
                    Fulfillment Slot
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

              {/* Delivery Destination Address */}
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/70 flex items-start gap-2.5 text-xs">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Drop-off Address: </span>
                  <span className="text-slate-700">{currentOrder.address || 'Standard Delivery Address'}</span>
                  <span className="text-slate-400 block text-[11px] font-mono">{currentOrder.city || 'Lahore'}</span>
                </div>
              </div>

              {/* Graphical Timeline */}
              <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
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

              {/* Driver Details Card (if in transit / assigned) */}
              <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                      Assigned Courier Rider
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      {currentOrder.driverName}
                    </h4>
                    <p className="text-[11px] text-slate-500">{currentOrder.driverVehicle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentOrder.driverPhone && (
                    <a
                      href={`tel:${currentOrder.driverPhone}`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Driver</span>
                    </a>
                  )}
                  <button
                    onClick={handleOpenDeliveryPage}
                    className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Full Delivery Tracker</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
