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
  Package,
  Zap,
  Star,
  Search,
  Check,
  X,
  Smartphone,
  Sparkles,
  RefreshCw,
  Building,
  Navigation,
  ExternalLink,
  ArrowRight,
  Copy,
  Flame,
  CheckCircle,
  Layers
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { PAKISTAN_CITIES } from '../../../data/pakistanLocations';

export const DeliveryView = () => {
  const {
    riders = [],
    addRider,
    updateRider,
    deleteRider,
    clearAllRiders,
    toggleRiderStatus,
    customerOrders = [],
    assignRiderToOrder,
    updateDeliveryOrderStatus,
    currency = 'PKR',
    addToast,
    adminRole
  } = useStore();

  const isAdmin = adminRole === 'admin' || adminRole === 'superadmin';

  const [activeSubTab, setActiveSubTab] = useState('queue'); // 'queue' | 'fleet' | 'rider-app' | 'coverage'
  const [searchRider, setSearchRider] = useState('');
  const [filterZone, setFilterZone] = useState('All');
  const [copiedId, setCopiedId] = useState(null);

  // Modal State for Adding New Rider by Admin
  const [isAddRiderModalOpen, setIsAddRiderModalOpen] = useState(false);
  const [newRiderForm, setNewRiderForm] = useState({
    name: '',
    phone: '',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: '',
    zone: 'Gulberg / Main Hub',
    status: 'On-Duty',
    cnic: '',
    username: '',
    password: ''
  });

  // Selected rider for mobile app simulator
  const [simulatedRiderId, setSimulatedRiderId] = useState(riders[0]?.id || 'RDR-101');

  // Filter riders based on search and zone
  const filteredRiders = (riders || []).filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchRider.toLowerCase()) ||
      r.phone.includes(searchRider) ||
      (r.username && r.username.toLowerCase().includes(searchRider.toLowerCase())) ||
      (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(searchRider.toLowerCase()));
    const matchesZone = filterZone === 'All' || r.zone.includes(filterZone);
    return matchesSearch && matchesZone;
  });

  // KPI Metrics
  const activeRidersCount = (riders || []).filter((r) => r.status === 'On-Duty' || r.status === 'Busy').length;
  const totalDeliveries = (riders || []).reduce((sum, r) => sum + (r.deliveriesCount || 0), 0);
  const pendingDispatches = (customerOrders || []).filter((o) => o.status !== 'Delivered');

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    addToast('Copied to Clipboard', `${label} copied: ${text}`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddRiderSubmit = (e) => {
    e.preventDefault();
    if (!newRiderForm.name.trim() || !newRiderForm.phone.trim()) {
      addToast('Missing Details', 'Please provide rider name and contact number.', 'error');
      return;
    }

    const generatedUsername = newRiderForm.username.trim() || newRiderForm.name.toLowerCase().replace(/\s+/g, '_');
    const generatedPassword = newRiderForm.password.trim() || 'rider123';

    addRider({
      name: newRiderForm.name,
      phone: newRiderForm.phone,
      vehicleType: newRiderForm.vehicleType,
      vehicleNumber: newRiderForm.vehicleNumber || `LEK-${Math.floor(1000 + Math.random() * 9000)}`,
      zone: newRiderForm.zone,
      status: newRiderForm.status,
      cnic: newRiderForm.cnic,
      username: generatedUsername,
      password: generatedPassword,
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
      username: '',
      password: ''
    });
  };

  const simulatedRider =
    (riders && riders.find((r) => r.id === simulatedRiderId)) ||
    riders?.[0] || {
      id: 'RDR-000',
      name: 'Rider Demo',
      phone: '0300-0000000',
      vehicleType: '🏍️ Motorbike',
      vehicleNumber: 'LEK-0000',
      zone: 'Gulberg',
      deliveriesCount: 0
    };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* ===================================================================== */}
      {/* 1. TOP HERO BANNER: Deep Forest Emerald Gradient with Ambient Glow     */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-[#07382c] via-[#0b4d3c] to-[#0f6853] text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-emerald-950/20 border border-emerald-500/30 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Background ambient lighting */}
        <div className="absolute -right-12 -top-12 w-52 h-52 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-amber-400/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Live Logistics & Courier Dispatch Control</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
              🛵
            </span>
            <span>{isAdmin ? 'Fleet Operations & Dispatch Manager' : 'Rider Courier Portal'}</span>
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
            {isAdmin
              ? 'Verify customer addresses, assign active on-duty couriers, and track realtime doorstep fulfillment across Pakistan.'
              : 'Access your assigned grocery dispatches, update delivery milestones, and view customer route maps.'}
          </p>
        </div>

        {/* Admin Action CTA Buttons */}
        {isAdmin && (
          <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
            {riders && riders.length > 0 && (
              <button
                onClick={clearAllRiders}
                className="px-4 py-2.5 bg-white/10 hover:bg-rose-500/20 text-rose-200 hover:text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-rose-400/30 hover:border-rose-400 transition-all cursor-pointer backdrop-blur-xs"
                title="Clear all registered riders"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                <span>Reset Fleet</span>
              </button>
            )}

            <button
              onClick={() => setIsAddRiderModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-950/30 hover:scale-105 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>+ Register New Rider</span>
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. KEY FLEET KPI STATS (4 Vibrant Gradient Cards)                      */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Pending Orders */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-white rounded-3xl p-5 border border-amber-200/90 shadow-xs hover:shadow-md transition-all space-y-3 group hover:border-amber-400">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
              Pending Queue
            </span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
              ⏳
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-600 font-mono">
              {pendingDispatches.length}
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Orders Awaiting / Dispatched</p>
          </div>
          <div className="pt-2 border-t border-amber-200/60 flex items-center gap-1 text-[10px] font-bold text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Needs Courier Assignment</span>
          </div>
        </div>

        {/* Card 2: Active On-Duty Riders */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50/40 to-white rounded-3xl p-5 border border-emerald-200/90 shadow-xs hover:shadow-md transition-all space-y-3 group hover:border-emerald-400">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
              Active Couriers
            </span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              🛵
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {activeRidersCount} <span className="text-sm font-bold text-slate-400">/ {riders.length}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Fleet On-Duty & Available</p>
          </div>
          <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Instant Dispatch Ready</span>
          </div>
        </div>

        {/* Card 3: Completed Deliveries */}
        <div className="bg-gradient-to-br from-sky-500/10 via-sky-50/40 to-white rounded-3xl p-5 border border-sky-200/90 shadow-xs hover:shadow-md transition-all space-y-3 group hover:border-sky-400">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-800">
              Fulfilled Orders
            </span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
              📦
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {totalDeliveries}
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Parcels Doorstep Verified</p>
          </div>
          <div className="pt-2 border-t border-sky-200/60 flex items-center gap-1 text-[10px] font-bold text-sky-700">
            <ShieldCheck className="w-3 h-3 text-sky-600" />
            <span>100% Verified Delivery</span>
          </div>
        </div>

        {/* Card 4: Avg Speed SLA */}
        <div className="bg-gradient-to-br from-purple-500/10 via-purple-50/40 to-white rounded-3xl p-5 border border-purple-200/90 shadow-xs hover:shadow-md transition-all space-y-3 group hover:border-purple-400">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-800">
              Avg Delivery Speed
            </span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform">
              ⚡
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              18.5 <span className="text-sm font-bold text-slate-400">Mins</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Dark Store Express Dispatch</p>
          </div>
          <div className="pt-2 border-t border-purple-200/60 flex items-center gap-1 text-[10px] font-bold text-purple-700">
            <Zap className="w-3 h-3 text-purple-600" />
            <span>Guaranteed Express SLA</span>
          </div>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* 3. SUB-NAVIGATION TABS (Modern Sleek Pill Navigation Bar)              */}
      {/* ===================================================================== */}
      <div className="bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-md inline-flex flex-wrap items-center gap-1.5 text-xs font-bold">
        {[
          { id: 'queue', label: 'Order Dispatch Queue', icon: Package, count: pendingDispatches.length },
          { id: 'fleet', label: 'Riders Fleet Manager', icon: Bike, count: riders.length },
          { id: 'rider-app', label: 'Rider App Simulator', icon: Smartphone },
          { id: 'coverage', label: 'Hubs & Service Cities', icon: Building }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-md shadow-emerald-500/25 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive
                      ? 'bg-slate-950 text-emerald-300'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* SUB-VIEW 1: ORDER DISPATCH QUEUE                                      */}
      {/* ===================================================================== */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          
          {/* Header Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-base text-slate-900 tracking-tight flex items-center gap-2">
                <span>Active Customer Orders Dispatch Queue</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  Live Feed
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review verified customer delivery addresses and assign an available on-duty courier from your fleet.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-xl">
                Total: <strong className="text-emerald-700 font-mono">{customerOrders.length}</strong> Orders
              </span>
            </div>
          </div>

          {customerOrders.length === 0 ? (
            <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
                📦
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-base text-slate-900">No Orders in Dispatch Queue</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When customers place orders at checkout, they will immediately appear here for address verification and rider assignment.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {customerOrders.map((order) => {
                const isUnassigned = !order.assignedRider;

                return (
                  <div
                    key={order.id}
                    className={`rounded-3xl p-5 sm:p-6 shadow-md transition-all space-y-4 ${
                      isUnassigned
                        ? 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/20 border-2 border-amber-300/80 ring-2 ring-amber-400/10 hover:border-amber-400'
                        : 'bg-gradient-to-br from-emerald-50/30 via-white to-slate-50/50 border border-emerald-200/90 hover:border-emerald-300'
                    }`}
                  >
                    {/* Top Row: Order ID, Status, Customer Initials & Total Amount */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                      
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 shadow-md ${
                            isUnassigned
                              ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/20'
                              : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-900/20'
                          }`}
                        >
                          {isUnassigned ? '⏳' : '📦'}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-slate-900 text-emerald-400 font-mono font-black text-xs px-3 py-1 rounded-xl shadow-xs">
                              {order.id}
                            </span>

                            <span
                              className={`text-[11px] font-black px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5 ${
                                order.status === 'Delivered'
                                  ? 'bg-emerald-600 text-white'
                                  : order.status === 'Out for Delivery'
                                  ? 'bg-purple-600 text-white'
                                  : order.status === 'Packed (Chilled Box)'
                                  ? 'bg-teal-600 text-white'
                                  : isUnassigned
                                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              <span>{order.status || (isUnassigned ? 'Awaiting Rider Assignment' : 'In Fulfillment')}</span>
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                            <span>Customer: <strong className="text-slate-800 font-bold">{order.customer || 'Aimen Yasin'}</strong></span>
                            <span>•</span>
                            <span>{order.dateFormatted || 'Sep 12, 2026'}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-500" />
                              <span>{order.deliverySlot || 'Express 10-15 Mins'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price & Payment Method */}
                      <div className="text-left sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-slate-100">
                        <span className="font-black text-lg text-slate-900 font-mono block">
                          PKR {order.totalAmount}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-block mt-0.5">
                          {order.payment === 'Cash on Delivery' || !order.payment ? '💵 Cash on Delivery (COD)' : `💳 ${order.payment}`}
                        </span>
                      </div>
                    </div>

                    {/* Middle Grid: 2 High-Contrast Action Cards (Address & Rider Assignment) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      
                      {/* Left Card: Customer Delivery Address */}
                      <div className="bg-gradient-to-br from-[#07382c] via-[#0b4d3c] to-[#0f4d3c] text-white p-4 sm:p-5 rounded-2xl border border-emerald-500/30 shadow-md space-y-2.5 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-300 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-300" />
                            <span>Customer Delivery Destination</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-full font-mono uppercase shadow-xs">
                            {order.city || 'Lahore'}
                          </span>
                        </div>

                        <p className="font-bold text-white text-xs sm:text-sm leading-snug">
                          {order.address || 'House 12, Street 4, Sector B, Johar Town, Lahore, Pakistan'}
                        </p>

                        <div className="pt-2 border-t border-emerald-600/40 flex items-center justify-between text-[11px]">
                          <a
                            href={`tel:${order.customerPhone || order.phone || '03001234567'}`}
                            className="text-emerald-200 hover:text-white font-mono font-bold flex items-center gap-1.5 hover:underline"
                          >
                            <Phone className="w-3 h-3 text-emerald-300" />
                            <span>{order.customerPhone || order.phone || '+92 300 1234567'}</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleCopyText(order.address || 'Standard Address', 'Address')}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-emerald-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            <span>Copy Address</span>
                          </button>
                        </div>
                      </div>

                      {/* Right Card: Assign Fleet Courier Dropdown */}
                      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-700 shadow-md space-y-3 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                            <Bike className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Assign Fleet Courier</span>
                          </span>

                          {order.assignedRider ? (
                            <span className="text-slate-950 font-bold text-[10px] bg-emerald-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{order.assignedRider.name}</span>
                            </span>
                          ) : (
                            <span className="text-amber-300 font-bold text-[10px] bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full">
                              ● Unassigned
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-300 font-semibold block">Select Available Courier:</label>
                          <select
                            value={order.assignedRider?.id || ''}
                            onChange={(e) => assignRiderToOrder(order.id, e.target.value)}
                            className="w-full bg-slate-800 hover:bg-slate-750 text-white border-2 border-emerald-500/60 rounded-xl px-3.5 py-2.5 font-bold text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none cursor-pointer transition-all shadow-inner"
                          >
                            <option value="">-- Choose Rider to Dispatch --</option>
                            {riders.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({r.vehicleType || 'Bike'} • {r.zone || 'Central'} • {r.status})
                              </option>
                            ))}
                          </select>
                        </div>

                        {order.assignedRider && (
                          <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-[11px] text-emerald-300">
                            <span>Phone: <strong className="font-mono text-white">{order.assignedRider.phone}</strong></span>
                            <a
                              href={`tel:${order.assignedRider.phone}`}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-[10px] font-black transition-colors"
                            >
                              Call Courier
                            </a>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Bottom Status Progression Workflow Bar */}
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{order.rawItems ? `${order.rawItems.length} Products in Package` : 'Standard Grocery Package'}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => updateDeliveryOrderStatus(order.id, 'Packed (Chilled Box)')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                            order.status === 'Packed (Chilled Box)'
                              ? 'bg-teal-600 text-white shadow-md'
                              : 'bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700'
                          }`}
                        >
                          <span>🏬 Packed</span>
                        </button>

                        <button
                          onClick={() => updateDeliveryOrderStatus(order.id, 'Out for Delivery')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                            order.status === 'Out for Delivery'
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-purple-50 hover:bg-purple-100 text-purple-900'
                          }`}
                        >
                          <span>🛵 Out for Delivery</span>
                        </button>

                        <button
                          onClick={() => updateDeliveryOrderStatus(order.id, 'Arrived at Customer')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                            order.status === 'Arrived at Customer'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-900'
                          }`}
                        >
                          <span>📍 At Doorstep</span>
                        </button>

                        <button
                          onClick={() => updateDeliveryOrderStatus(order.id, 'Delivered')}
                          className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                            order.status === 'Delivered'
                              ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:scale-105'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>✅ Delivered</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 2: RIDER FLEET MANAGEMENT                                    */}
      {/* ===================================================================== */}
      {activeSubTab === 'fleet' && (
        <div className="space-y-5">
          
          {/* Search & Zone Filter Bar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by rider name, phone, plate number, username..."
                value={searchRider}
                onChange={(e) => setSearchRider(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-3.5 py-2.5 font-medium text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-slate-400 font-bold shrink-0">Hub Zone:</span>
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="All">All Hub Zones (5 Cities)</option>
                <option value="Gulberg">Gulberg Hub (Lahore)</option>
                <option value="DHA">DHA Zone (Lahore / Karachi)</option>
                <option value="Johar">Johar Town Area</option>
                <option value="F-7">F-7 Hub (Islamabad)</option>
                <option value="Model Town">Model Town Zone</option>
              </select>
            </div>
          </div>

          {/* Empty State vs Riders Grid */}
          {(!riders || riders.length === 0) ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
                🛵
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">No Delivery Riders Registered</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click '+ Register New Rider' above to add your couriers, create their login credentials, and assign their delivery zones.
                </p>
              </div>
              <button
                onClick={() => setIsAddRiderModalOpen(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-md hover:scale-105 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Register First Delivery Rider</span>
              </button>
            </div>
          ) : filteredRiders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs">
              No riders matching your search query "{searchRider}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRiders.map((rider) => (
                <div
                  key={rider.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-card hover:border-emerald-200 transition-all space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                          {rider.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-black text-sm text-slate-900">{rider.name}</h3>
                            <span className="text-[10px] font-mono text-slate-400 font-bold">({rider.id})</span>
                          </div>
                          <span className="text-xs text-slate-500 font-mono">{rider.phone}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleRiderStatus(rider.id)}
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full cursor-pointer transition-all flex items-center gap-1 ${
                          rider.status === 'On-Duty'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : rider.status === 'Busy'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                        title="Click to toggle on-duty / off-duty status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${rider.status === 'On-Duty' ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                        <span>{rider.status}</span>
                      </button>
                    </div>

                    {/* Rider details card */}
                    <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Vehicle:</span>
                        <span className="text-slate-800 font-bold">{rider.vehicleType} ({rider.vehicleNumber})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Assigned Hub:</span>
                        <span className="text-emerald-700 font-bold">{rider.zone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Completed Parcels:</span>
                        <span className="font-mono font-bold text-slate-900">{rider.deliveriesCount || 0} Delivered</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Customer Rating:</span>
                        <span className="font-black text-amber-600">★ {rider.rating || 5.0} / 5.0</span>
                      </div>

                      {isAdmin && (
                        <div className="pt-2 border-t border-slate-200 flex flex-col gap-1 text-[11px]">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Rider App Credentials:</span>
                          <div className="font-mono text-emerald-800 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                            <span>ID: {rider.username || rider.name.toLowerCase().replace(/\s+/g, '_')}</span>
                            <span className="text-slate-400">•</span>
                            <span>Pass: {rider.password || 'rider123'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${rider.phone}`}
                      className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Courier</span>
                    </a>

                    <button
                      onClick={() => {
                        setSimulatedRiderId(rider.id);
                        setActiveSubTab('rider-app');
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                      title="View rider app simulator for this courier"
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => deleteRider(rider.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Rider from Fleet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 3: RIDER MOBILE APP SIMULATOR                                */}
      {/* ===================================================================== */}
      {activeSubTab === 'rider-app' && (
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-slate-900 rounded-[44px] p-5 border-4 border-slate-800 shadow-2xl text-white space-y-4">
            
            {/* Simulator Header */}
            <div className="flex items-center justify-between px-2 pt-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                  FM
                </div>
                <div>
                  <span className="font-black text-xs block">Rider App Preview</span>
                  <span className="text-[10px] text-emerald-400 font-bold">● Live Simulator</span>
                </div>
              </div>

              <select
                value={simulatedRider.id}
                onChange={(e) => setSimulatedRiderId(e.target.value)}
                className="bg-slate-800 text-emerald-300 text-[11px] font-bold rounded-xl px-3 py-1.5 border border-slate-700 focus:outline-none cursor-pointer"
              >
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Courier Profile Tile */}
            <div className="bg-slate-800/90 rounded-2xl p-4 space-y-2 border border-slate-700 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-white">{simulatedRider.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{simulatedRider.vehicleType} • {simulatedRider.vehicleNumber}</span>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {simulatedRider.status}
                </span>
              </div>
            </div>

            {/* Simulated Active Dispatch Order */}
            <div className="bg-gradient-to-br from-[#07382c] to-[#0f4d3c] border border-emerald-500/40 rounded-3xl p-5 space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-950 uppercase tracking-wider bg-amber-400 px-2.5 py-0.5 rounded-full shadow-xs">
                  Active Dispatch Order
                </span>
                <span className="text-xs font-mono font-bold text-emerald-300">#FM-55509</span>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-emerald-200/80 text-[11px] font-semibold">Drop-off Destination:</span>
                <p className="font-bold text-white text-xs leading-snug">
                  House 12, Street 4, Sector B, Johar Town, Lahore
                </p>
                <p className="text-emerald-300 text-[11px]">Customer: Aimen Yasin (0320-6551699)</p>
              </div>

              <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-2xl text-xs font-mono border border-white/10">
                <span className="text-slate-400">Cash to Collect:</span>
                <span className="font-black text-emerald-400 text-sm">PKR 130 (COD)</span>
              </div>

              <button
                onClick={() => addToast('Delivery Completed! 🎉', 'Parcel marked delivered and cash collected.')}
                className="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all hover:scale-105"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Parcel Delivered</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-VIEW 4: LOGISTICS HUBS & SERVICE CITIES                           */}
      {/* ===================================================================== */}
      {activeSubTab === 'coverage' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-black text-lg text-slate-900">Logistics Hubs & Pakistan City Coverage</h3>
              <p className="text-xs text-slate-500">Centrally managed Dark Store fulfillment centers across 5 major Pakistani metropolises</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3.5 py-1.5 rounded-full self-start sm:self-auto">
              ● All 5 Logistics Hubs Operational
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAKISTAN_CITIES.map((c) => (
              <div key={c.id} className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/90 space-y-2.5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900">{c.city}</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Active Hub
                  </span>
                </div>
                <p className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{c.hubName}</span>
                </p>
                <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-200/60">
                  <span className="block font-bold text-slate-700">Covered Neighborhoods:</span>
                  <div className="flex flex-wrap gap-1">
                    {c.neighborhoods.map((n, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-700">
                        {n.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADMIN ADD NEW RIDER                                            */}
      {/* ===================================================================== */}
      {isAddRiderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-900/20">
                  🛵
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Register New Delivery Rider</h3>
                  <p className="text-[11px] text-slate-500">Add courier personnel into the FreshMart delivery fleet</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddRiderModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRiderSubmit} className="space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rider Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Usman Farooq"
                    value={newRiderForm.name}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Type</label>
                  <select
                    value={newRiderForm.vehicleType}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, vehicleType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Hub Zone</label>
                  <select
                    value={newRiderForm.zone}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, zone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Gulberg / Main Hub">Gulberg / Main Hub (Lahore)</option>
                    <option value="DHA Phase 5 & 6">DHA Phase 5 & 6 (Lahore)</option>
                    <option value="Johar Town / Model Town">Johar Town / Model Town</option>
                    <option value="Clifton & DHA (Karachi)">Clifton & DHA (Karachi)</option>
                    <option value="F-6 / F-7 / Blue Area (Islamabad)">F-6 / F-7 / Blue Area (Islamabad)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">CNIC / National ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 35201-1234567-1"
                    value={newRiderForm.cnic}
                    onChange={(e) => setNewRiderForm({ ...newRiderForm, cnic: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Rider Portal Login Credentials (Set by Admin) */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2.5">
                <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider block flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rider Portal Login Credentials (Set by Admin)</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">Rider Username / Login ID</label>
                    <input
                      type="text"
                      placeholder="e.g. usman_rider or 03001234567"
                      value={newRiderForm.username}
                      onChange={(e) => setNewRiderForm({ ...newRiderForm, username: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono font-semibold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">Rider Password</label>
                    <input
                      type="text"
                      placeholder="e.g. rider123"
                      value={newRiderForm.password}
                      onChange={(e) => setNewRiderForm({ ...newRiderForm, password: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono font-semibold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddRiderModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-900/20 transition-all cursor-pointer hover:scale-105"
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
