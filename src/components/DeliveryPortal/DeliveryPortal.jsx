import React, { useState } from 'react';
import {
  Truck,
  Bike,
  UserPlus,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Navigation,
  DollarSign,
  Package,
  Zap,
  Star,
  Search,
  Check,
  X,
  Smartphone,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const DeliveryPortal = () => {
  const {
    riders,
    addRider,
    updateRider,
    deleteRider,
    toggleRiderStatus,
    customerOrders,
    assignRiderToOrder,
    updateDeliveryOrderStatus,
    activeDeliveryOrder,
    currency,
    addToast,
    navigateTo
  } = useStore();

  const [activeTab, setActiveTab] = useState('riders'); // 'riders' | 'dispatches' | 'radar' | 'simulator'
  const [searchRider, setSearchRider] = useState('');
  const [filterZone, setFilterZone] = useState('All');

  // Modal State for Adding New Rider
  const [isAddRiderModalOpen, setIsAddRiderModalOpen] = useState(false);
  const [newRiderForm, setNewRiderForm] = useState({
    name: '',
    phone: '',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: '',
    zone: 'Gulberg / Main Hub',
    status: 'On-Duty',
    cnic: '',
    deliveriesCount: 0,
    rating: 5.0
  });

  // Selected rider for mobile simulator
  const [simulatedRiderId, setSimulatedRiderId] = useState(riders[0]?.id || 'RDR-101');

  // Filter riders based on search and zone
  const filteredRiders = riders.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchRider.toLowerCase()) ||
      r.phone.includes(searchRider) ||
      r.vehicleNumber.toLowerCase().includes(searchRider.toLowerCase());
    const matchesZone = filterZone === 'All' || r.zone.includes(filterZone);
    return matchesSearch && matchesZone;
  });

  // Metrics
  const activeRidersCount = riders.filter((r) => r.status === 'On-Duty' || r.status === 'Busy').length;
  const totalDeliveries = riders.reduce((sum, r) => sum + (r.deliveriesCount || 0), 0);
  const pendingDispatches = customerOrders.filter((o) => o.status !== 'Delivered');

  const handleAddRiderSubmit = (e) => {
    e.preventDefault();
    if (!newRiderForm.name.trim() || !newRiderForm.phone.trim()) {
      addToast('Missing Details', 'Please provide rider name and contact number.', 'error');
      return;
    }

    addRider({
      name: newRiderForm.name,
      phone: newRiderForm.phone,
      vehicleType: newRiderForm.vehicleType,
      vehicleNumber: newRiderForm.vehicleNumber || `LEK-${Math.floor(1000 + Math.random() * 9000)}`,
      zone: newRiderForm.zone,
      status: newRiderForm.status,
      cnic: newRiderForm.cnic,
      deliveriesCount: 0,
      rating: 5.0
    });

    setIsAddRiderModalOpen(false);
    setNewRiderForm({
      name: '',
      phone: '',
      vehicleType: '🏍️ Honda 125',
      vehicleNumber: '',
      zone: 'Gulberg / Main Hub',
      status: 'On-Duty',
      cnic: '',
      deliveriesCount: 0,
      rating: 5.0
    });
  };

  const simulatedRider = riders.find((r) => r.id === simulatedRiderId) || riders[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        
        {/* Background glow & graphics */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 max-w-xl z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>10-Minute Dark Store Dispatch</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Delivery & Rider Portal</span>
            <span className="text-2xl">🛵</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300">
            Manage your courier fleet, register new parcel riders, assign orders, and monitor real-time delivery dispatches.
          </p>
        </div>

        {/* [ + Add New Rider ] Primary CTA Button */}
        <div className="flex flex-col sm:flex-row gap-3 z-10 shrink-0">
          <button
            onClick={() => setIsAddRiderModalOpen(true)}
            className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>+ Add New Rider</span>
          </button>

          <button
            onClick={() => navigateTo('delivery')}
            className="px-4 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Customer GPS Tracker</span>
          </button>
        </div>

      </div>

      {/* 2. Key Fleet KPI Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Active Riders</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-black">
              🛵
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {activeRidersCount} <span className="text-xs font-semibold text-slate-400">/ {riders.length} Fleet</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold block">● On-duty ready to dispatch</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Pending Parcels</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-black">
              📦
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {pendingDispatches.length} <span className="text-xs font-semibold text-slate-400">Orders</span>
          </div>
          <span className="text-[11px] text-amber-600 font-bold block">In dispatch / transit</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Completed</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black">
              ✅
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalDeliveries} <span className="text-xs font-semibold text-slate-400">Parcels</span>
          </div>
          <span className="text-[11px] text-blue-600 font-bold block">100% on-time guarantee</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Avg Delivery Speed</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-black">
              ⚡
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            9.4 <span className="text-xs font-semibold text-slate-400">Mins</span>
          </div>
          <span className="text-[11px] text-purple-600 font-bold block">Super-fast Dark Store Hub</span>
        </div>

      </div>

      {/* 3. Sub-View Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar text-xs font-bold">
        {[
          { id: 'riders', label: 'Rider Fleet Management', icon: Bike, count: riders.length },
          { id: 'dispatches', label: 'Live Parcel Dispatches', icon: Package, count: pendingDispatches.length },
          { id: 'simulator', label: 'Rider Mobile App View', icon: Smartphone, tag: 'Live App' },
          { id: 'radar', label: 'GPS Hub Radar Map', icon: Compass }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              )}
              {t.tag && (
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">
                  {t.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: RIDER FLEET MANAGEMENT                                         */}
      {/* ===================================================================== */}
      {activeTab === 'riders' && (
        <div className="space-y-6">
          
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rider name, phone, number plate..."
                value={searchRider}
                onChange={(e) => setSearchRider(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 font-medium text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-slate-400 font-bold shrink-0">Zone:</span>
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-xs focus:outline-none"
              >
                <option value="All">All Hub Zones</option>
                <option value="Gulberg">Gulberg Hub</option>
                <option value="DHA">DHA Zone</option>
                <option value="Johar">Johar Town Area</option>
                <option value="Model Town">Model Town Zone</option>
              </select>
            </div>
          </div>

          {/* Riders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRiders.map((rider) => (
              <div
                key={rider.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-card transition-all space-y-4 flex flex-col justify-between"
              >
                {/* Top Profile Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shadow-inner">
                        {rider.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-slate-900">{rider.name}</h3>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{rider.id}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{rider.phone}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <button
                      onClick={() => toggleRiderStatus(rider.id)}
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                        rider.status === 'On-Duty'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : rider.status === 'Busy'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                      title="Click to toggle status"
                    >
                      {rider.status}
                    </button>
                  </div>

                  {/* Rider Details Card */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-xs space-y-1.5 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vehicle:</span>
                      <span className="text-slate-800 font-bold">{rider.vehicleType} ({rider.vehicleNumber})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Zone:</span>
                      <span className="text-emerald-700 font-bold">{rider.zone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Delivered:</span>
                      <span className="font-bold text-slate-900">{rider.deliveriesCount} Parcels</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Customer Rating:</span>
                      <span className="font-black text-amber-600 flex items-center gap-1">
                        ⭐ {rider.rating} / 5.0
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={`tel:${rider.phone}`}
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Rider</span>
                  </a>

                  <button
                    onClick={() => {
                      setSimulatedRiderId(rider.id);
                      setActiveTab('simulator');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    title="View mobile app simulator for this rider"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-slate-700" />
                  </button>

                  <button
                    onClick={() => deleteRider(rider.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Rider"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: LIVE PARCEL DISPATCHES                                         */}
      {/* ===================================================================== */}
      {activeTab === 'dispatches' && (
        <div className="space-y-4">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="font-black text-base text-slate-900">Live Parcel Dispatch Queue</h2>
              <p className="text-xs text-slate-400">Assign orders to available riders and update delivery progress</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              {customerOrders.length} Total Store Orders
            </span>
          </div>

          {customerOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                📦
              </div>
              <h3 className="font-black text-sm text-slate-900">No Orders in Queue</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Orders placed by customers through Checkout will automatically appear here for rider assignment and dispatch.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:shadow-xs transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg">
                        📦
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900 font-mono">{order.id}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {order.status || 'Out for Delivery'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{order.dateFormatted || 'Today'} • {order.deliverySlot}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-base text-slate-900 font-mono">
                        PKR {order.totalAmount}
                      </span>
                    </div>
                  </div>

                  {/* Drop-off & Assigned Rider info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1">
                      <span className="text-slate-400 font-bold text-[10px] uppercase block">Customer Drop-off</span>
                      <p className="font-bold text-slate-800 truncate">{order.address || 'Standard Delivery Address'}</p>
                      <p className="text-slate-500 font-mono">{order.phone || '+92 300 1234567'}</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1">
                      <span className="text-slate-400 font-bold text-[10px] uppercase block">Assigned Delivery Rider</span>
                      <div className="flex items-center justify-between pt-0.5">
                        <select
                          value={order.assignedRider?.id || ''}
                          onChange={(e) => assignRiderToOrder(order.id, e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:outline-none"
                        >
                          <option value="">-- Assign a Rider --</option>
                          {riders.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.vehicleNumber} - {r.zone})
                            </option>
                          ))}
                        </select>

                        {order.assignedRider && (
                          <span className="text-emerald-700 font-bold text-[11px]">✓ Assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Progression Workflow Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => updateDeliveryOrderStatus(order.id, 'Picked Up from Dark Store')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      🏬 Mark Picked Up
                    </button>
                    <button
                      onClick={() => updateDeliveryOrderStatus(order.id, 'Out for Delivery')}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      🛵 Out for Delivery
                    </button>
                    <button
                      onClick={() => updateDeliveryOrderStatus(order.id, 'Arrived at Customer')}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      📍 Arrived at Doorstep
                    </button>
                    <button
                      onClick={() => updateDeliveryOrderStatus(order.id, 'Delivered')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      ✅ Mark Delivered
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: RIDER MOBILE APP SIMULATOR                                     */}
      {/* ===================================================================== */}
      {activeTab === 'simulator' && (
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-slate-900 rounded-[40px] p-4 border-4 border-slate-800 shadow-2xl text-white space-y-4">
            
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-2 pt-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  FM
                </div>
                <div>
                  <span className="font-black text-xs block">FreshMart Rider App</span>
                  <span className="text-[10px] text-emerald-400">● Live GPS Connected</span>
                </div>
              </div>

              <select
                value={simulatedRider.id}
                onChange={(e) => setSimulatedRiderId(e.target.value)}
                className="bg-slate-800 text-white text-[11px] font-bold rounded-xl px-2 py-1 border border-slate-700 focus:outline-none"
              >
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Rider Info Card */}
            <div className="bg-slate-800/90 rounded-2xl p-4 space-y-2 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm">{simulatedRider.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{simulatedRider.vehicleType} • {simulatedRider.vehicleNumber}</span>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  {simulatedRider.status}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/60">
                <span>Today's Deliveries: <strong className="text-white">12</strong></span>
                <span>Rating: <strong className="text-amber-400">⭐ {simulatedRider.rating}</strong></span>
              </div>
            </div>

            {/* Active Delivery Parcel Task */}
            <div className="bg-emerald-900/40 border border-emerald-600/40 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-md">
                  Active Dispatch Order
                </span>
                <span className="text-xs font-mono font-bold text-white">#FM-84210</span>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-slate-400 text-[11px]">Drop-off Destination:</span>
                <p className="font-bold text-white text-sm">House 12, Street 4, Sector B, Johar Town, Lahore</p>
                <p className="text-emerald-300 text-xs">Customer: Aimen Yasin (0300-1234567)</p>
              </div>

              <div className="flex justify-between items-center bg-slate-900/80 p-2.5 rounded-xl text-xs font-mono">
                <span className="text-slate-400">Cash to Collect:</span>
                <span className="font-black text-emerald-400 text-sm">PKR 2,450 (COD)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GPS Map</span>
                </a>
                <a
                  href="tel:03001234567"
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Client</span>
                </a>
              </div>

              <button
                onClick={() => addToast('Delivery Completed! 🎉', 'Parcel marked delivered and cash collected.')}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Parcel Delivered & Collect Cash</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: GPS RADAR MAP VIEW                                             */}
      {/* ===================================================================== */}
      {activeTab === 'radar' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-base text-slate-900">Dark Store Dispatch Radar</h3>
              <p className="text-xs text-slate-400">Live GPS tracking of Lahore and Punjab delivery sectors</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              ● All Systems Operational
            </span>
          </div>

          <div className="h-80 bg-slate-900 rounded-3xl relative overflow-hidden border border-slate-800 flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
            
            {/* Dark store central hub */}
            <div className="relative z-10 flex flex-col items-center gap-1 text-center animate-pulse">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                🏬
              </div>
              <span className="font-black text-xs text-white">FreshMart Dark Store #1</span>
              <span className="text-[10px] text-emerald-400 font-mono">Gulberg Hub • 10-Min Radius</span>
            </div>

            {/* Simulated moving riders */}
            <div className="absolute top-1/4 left-1/4 flex items-center gap-1 bg-slate-800/90 text-white px-2 py-1 rounded-xl text-[10px] font-bold border border-slate-700">
              <span>🛵 Hamza (LEK-8420)</span>
            </div>
            <div className="absolute bottom-1/4 right-1/4 flex items-center gap-1 bg-slate-800/90 text-white px-2 py-1 rounded-xl text-[10px] font-bold border border-slate-700">
              <span>🛵 Ali (LEA-1903)</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD NEW RIDER                                                  */}
      {/* ===================================================================== */}
      {isAddRiderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  🛵
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Register New Delivery Rider</h3>
                  <p className="text-[11px] text-slate-400">Add courier personnel to your FreshMart delivery fleet</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddRiderModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRiderSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rider Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Usman Farooq"
                    value={newRiderForm.name}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number (Mobile) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0300-1234567"
                    value={newRiderForm.phone}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Type</label>
                  <select
                    value={newRiderForm.vehicleType}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, vehicleType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  >
                    <option value="🏍️ Honda 125">🏍️ Honda 125 Motorbike</option>
                    <option value="🏍️ Yamaha YBR">🏍️ Yamaha YBR</option>
                    <option value="🛵 Electric Scooter">🛵 Electric Scooter</option>
                    <option value="🚗 Delivery Van">🚗 Delivery Van</option>
                    <option value="🚲 Bicycle">🚲 Bicycle</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Plate Number</label>
                  <input
                    type="text"
                    placeholder="e.g. LEK-9842"
                    value={newRiderForm.vehicleNumber}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, vehicleNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Hub Zone</label>
                  <select
                    value={newRiderForm.zone}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, zone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  >
                    <option value="Gulberg / Main Hub">Gulberg / Main Hub</option>
                    <option value="DHA Phase 5 & 6">DHA Phase 5 & 6</option>
                    <option value="Johar Town / Model Town">Johar Town / Model Town</option>
                    <option value="Bahria Town Sector C">Bahria Town Sector C</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">CNIC / National ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 35201-1234567-1"
                    value={newRiderForm.cnic}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, cnic: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Initial Duty Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['On-Duty', 'Offline'].map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setNewRiderForm({ ...newRiderForm, status: st })}
                      className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                        newRiderForm.status === st
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddRiderModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Register Rider 🛵
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
