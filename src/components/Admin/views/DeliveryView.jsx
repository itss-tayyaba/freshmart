import React, { useState } from 'react';
import { Truck, MapPin, Phone, User, Check, Clock, Plus, ExternalLink } from 'lucide-react';
import { ADMIN_DELIVERIES_DATA } from '../../../data/adminSuiteData';
import { useStore } from '../../../context/StoreContext';

export const DeliveryView = () => {
  const { addToast } = useStore();
  const [activeTab, setActiveTab] = useState('Ongoing');
  const [deliveries, setDeliveries] = useState(ADMIN_DELIVERIES_DATA);
  const [selectedDelivery, setSelectedDelivery] = useState(ADMIN_DELIVERIES_DATA[0]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Delivery</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage 10-minute riders, routes, and express dispatch</p>
        </div>

        <button
          onClick={() => addToast('Rider Assignment', 'Auto-assigning closest available rider in Johar Town.')}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Assign Rider</span>
        </button>
      </div>

      {/* Filter Tabs matching screenshot */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { label: 'Ongoing', count: 12 },
          { label: 'Pending', count: 5 },
          { label: 'Completed', count: 48 },
          { label: 'Cancelled', count: 2 }
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors ${
              activeTab === tab.label
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Main Grid: Left Dispatch Table (7 Cols) + Right Live GPS Map Card (5 Cols) matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Dispatch Table (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Active Delivery Queue</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-2">
                  <th className="pb-2 font-semibold">Order ID</th>
                  <th className="pb-2 font-semibold">Customer</th>
                  <th className="pb-2 font-semibold">Rider</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">ETA</th>
                  <th className="pb-2 font-semibold text-right">Track</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {deliveries.map((del) => (
                  <tr
                    key={del.id}
                    onClick={() => setSelectedDelivery(del)}
                    className={`hover:bg-slate-50/70 cursor-pointer transition-colors ${
                      selectedDelivery.id === del.id ? 'bg-emerald-50/50' : ''
                    }`}
                  >
                    <td className="py-3 font-mono font-bold text-slate-800">{del.id}</td>
                    <td className="py-3 font-medium text-slate-800">{del.customer}</td>
                    <td className="py-3 font-bold text-slate-700">{del.rider}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${del.statusClass}`}>
                        {del.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-700">{del.eta}</td>
                    <td className="py-3 text-right">
                      <button className="text-xs font-bold text-emerald-600 hover:underline">
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Live GPS Map Card (5 Columns) matching screenshot */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            {/* Card Header matching screenshot */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 font-mono">
                  Order {selectedDelivery.id}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {selectedDelivery.customer}
                </span>
              </div>

              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                {selectedDelivery.status}
              </span>
            </div>

            {/* Rider Info Card */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl my-3 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{selectedDelivery.rider}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">{selectedDelivery.riderPhone}</span>
                </div>
              </div>

              <a
                href={`tel:${selectedDelivery.riderPhone}`}
                className="p-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl transition-colors"
                title="Call Rider"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>

            {/* Animated Interactive Map Graphic matching screenshot */}
            <div className="relative h-48 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
              {/* Simulated Map Streets Background */}
              <svg className="w-full h-full bg-[#e2e8f0]" viewBox="0 0 300 200">
                {/* Road lines */}
                <path d="M 0,50 L 300,50" stroke="#cbd5e1" strokeWidth="8" />
                <path d="M 0,150 L 300,150" stroke="#cbd5e1" strokeWidth="6" />
                <path d="M 80,0 L 80,200" stroke="#cbd5e1" strokeWidth="8" />
                <path d="M 220,0 L 220,200" stroke="#cbd5e1" strokeWidth="6" />

                {/* Delivery GPS Route line */}
                <path
                  d="M 80,150 L 80,50 L 220,50 L 220,120"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />

                {/* Store Start Node */}
                <circle cx="80" cy="150" r="6" fill="#0f172a" />

                {/* Customer End Node */}
                <circle cx="220" cy="120" r="7" fill="#dc2626" />

                {/* Moving Rider Beacon */}
                <circle cx="160" cy="50" r="6" fill="#10b981" />
                <circle cx="160" cy="50" r="12" fill="#10b981" opacity="0.3" className="animate-ping" />
              </svg>

              {/* ETA Overlay Badge matching screenshot: 12 mins */}
              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>ETA: <strong className="text-emerald-400">{selectedDelivery.eta}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={() => addToast('Live GPS Opened', `Tracking ${selectedDelivery.rider} live coordinates`)}
            className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            View Live Location
          </button>
        </div>

      </div>

    </div>
  );
};
