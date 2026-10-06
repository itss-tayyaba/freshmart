import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Scan,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  Calendar,
  Sparkles,
  MapPin,
  RefreshCw,
  UserPlus,
  Users,
  Trash2,
  X,
  RotateCcw,
  Check,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { DeliverToStaffModal } from '../modals/DeliverToStaffModal';

export const FulfillmentView = () => {
  const {
    adminOrders,
    customerOrders,
    currentTenant,
    riders,
    pickupStaff = [],
    addPickupStaff,
    deletePickupStaff,
    assignPickupStaffToOrder,
    addToast
  } = useStore();

  const [search, setSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('All');
  const [dispatchFilter, setDispatchFilter] = useState('All'); // 'All' | 'NotDispatched' | 'Dispatched'
  const [deliverToStaffModalOrder, setDeliverToStaffModalOrder] = useState(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', username: '', password: '', phone: '' });

  const activeTenantId = currentTenant?.id || 'tenant-freshmart';
  const tenantStaff = useMemo(() => {
    return (pickupStaff || []).filter((staff) => staff?.tenantId === activeTenantId);
  }, [pickupStaff, activeTenantId]);

  // Helper to determine if an order has been dispatched
  const isOrderDispatched = (ord) => {
    return Boolean(
      ord.isDispatched ||
      ord.fulfillmentStage >= 5 ||
      ['dispatched', 'out for delivery', 'delivered'].includes((ord.status || '').toLowerCase())
    );
  };

  // Combine and sort live orders strictly for current mart / all
  const allOrders = useMemo(() => {
    const raw = (customerOrders && customerOrders.length > 0) ? customerOrders : (adminOrders || []);
    const tenantFiltered = !currentTenant?.id ? raw : raw.filter((o) => o.tenantId === currentTenant.id || (!o.tenantId && currentTenant.id === 'tenant-freshmart'));

    return tenantFiltered.map((ord) => {
      // Derive stage if not explicitly set
      let stg = ord.fulfillmentStage || 1;
      const statusLower = (ord.status || '').toLowerCase();
      if (!ord.fulfillmentStage) {
        if (statusLower === 'delivered') stg = 7;
        else if (statusLower === 'out for delivery') stg = 6;
        else if (statusLower === 'dispatched' || statusLower === 'ready for dispatch') stg = 5;
        else if (statusLower === 'packed') stg = 4;
        else if (statusLower === 'processing' || statusLower === 'preparing') stg = 2;
        else stg = 1;
      }

      // Calculate items count
      const itemsList = Array.isArray(ord.rawItems) && ord.rawItems.length > 0
        ? ord.rawItems
        : Array.isArray(ord.items) && ord.items.length > 0
        ? ord.items
        : Array.isArray(ord.orderItems) && ord.orderItems.length > 0
        ? ord.orderItems
        : [];

      const totalItemsCount = itemsList.reduce((acc, it) => acc + (it.quantity || it.qty || 1), 0);
      const dispatched = Boolean(
        ord.isDispatched ||
        stg >= 5 ||
        ['dispatched', 'out for delivery', 'delivered'].includes(statusLower)
      );

      return {
        ...ord,
        fulfillmentStage: stg,
        isDispatched: dispatched,
        itemsCount: totalItemsCount,
        customerName: ord.customerName || ord.customer || 'Customer',
        addressText: ord.address || ord.shippingAddress?.address || 'Delivery Address',
        cityText: ord.city || ord.shippingAddress?.city || 'Lahore'
      };
    });
  }, [customerOrders, adminOrders, currentTenant]);

  // Stage KPI Counts
  const kpis = useMemo(() => {
    return {
      total: allOrders.length,
      queue: allOrders.filter((o) => o.fulfillmentStage === 2).length,
      packing: allOrders.filter((o) => o.fulfillmentStage === 3).length,
      ready: allOrders.filter((o) => o.fulfillmentStage === 4).length,
      dispatched: allOrders.filter((o) => o.isDispatched).length,
      notDispatched: allOrders.filter((o) => !o.isDispatched).length,
      inTransit: allOrders.filter((o) => o.fulfillmentStage === 6).length,
      delivered: allOrders.filter((o) => o.fulfillmentStage === 7).length
    };
  }, [allOrders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return allOrders.filter((ord) => {
      // Dispatch status filter
      if (dispatchFilter === 'Dispatched' && !ord.isDispatched) return false;
      if (dispatchFilter === 'NotDispatched' && ord.isDispatched) return false;

      // Stage filter
      if (selectedStageFilter !== 'All') {
        const targetStageNum = parseInt(selectedStageFilter, 10);
        if (ord.fulfillmentStage !== targetStageNum) return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesId = (ord.id || ord.orderId || '').toLowerCase().includes(q);
        const matchesCust = (ord.customerName || '').toLowerCase().includes(q);
        const matchesCity = (ord.cityText || '').toLowerCase().includes(q);
        const matchesBay = (ord.stagingBay || '').toLowerCase().includes(q);
        const matchesStaff = (ord.pickupStaffName || '').toLowerCase().includes(q);
        return matchesId || matchesCust || matchesCity || matchesBay || matchesStaff;
      }

      return true;
    });
  }, [allOrders, dispatchFilter, selectedStageFilter, search]);

  const stageLabels = [
    { id: 'All', label: 'All Stages', count: allOrders.length },
    { id: '1', label: '1. Order Placed', count: allOrders.filter((o) => o.fulfillmentStage === 1).length },
    { id: '2', label: '2. Packing Queue', count: kpis.queue },
    { id: '3', label: '3. Shelf Picking', count: kpis.packing },
    { id: '4', label: '4. Ready Dispatch', count: kpis.ready },
    { id: '5', label: '5. Courier Dispatch', count: allOrders.filter((o) => o.fulfillmentStage === 5).length },
    { id: '6', label: '6. In Transit', count: kpis.inTransit },
    { id: '7', label: '7. Delivered', count: kpis.delivered }
  ];

  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.username.trim() || !staffForm.password.trim()) {
      if (addToast) addToast('Missing Information', 'Please provide a name, username, and password.', 'error');
      return;
    }
    const created = addPickupStaff(staffForm);
    if (created) {
      setStaffForm({ name: '', username: '', password: '', phone: '' });
      setIsAddStaffModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================= */}
      {/* 1. PICKUP STAFF MANAGEMENT SECTION                         */}
      {/* Prominent "+ Add Pickup Staff" button and roster          */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-5 lg:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                <span>Warehouse Personnel</span>
              </span>
              <span className="text-xs font-bold text-slate-500">• {currentTenant?.name || 'Store'} Staff</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Boxes className="w-5 h-5 text-emerald-600" />
              <span>Pickup & Packing Staff Fleet</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-2xl">
              Add pickup staff accounts to assign packing queues. Staff sign in to the Pickup Staff Portal to accept orders, pick items from shelves, and mark parcels ready for dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
              <span className="font-mono text-emerald-600 font-black">{tenantStaff.length}</span> Active Staff
            </div>
            <button
              onClick={() => setIsAddStaffModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Pickup Staff</span>
            </button>
          </div>
        </div>

        {/* Pickup Staff Roster Cards */}
        {tenantStaff.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold shadow-2xs">
              👨‍🏭
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800">No Pickup Staff Added Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click the <b>"+ Add Pickup Staff"</b> button above to create credentials for your warehouse packing team. They can then log in to pick items and stage parcels for dispatch.
              </p>
            </div>
            <button
              onClick={() => setIsAddStaffModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create First Staff Account</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
            {tenantStaff.map((staff) => (
              <div
                key={staff.id}
                className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex items-start justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {(staff.name || 'S').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">{staff.name}</h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>User:</span>
                      <code className="text-emerald-700 bg-emerald-50 px-1 rounded font-bold">{staff.username}</code>
                    </div>
                    {staff.phone && (
                      <span className="block text-[10px] text-slate-400 mt-0.5 truncate">📞 {staff.phone}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                  {deletePickupStaff && (
                    <button
                      onClick={() => deletePickupStaff(staff.id)}
                      title="Remove Staff Account"
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 2. ORDER FULFILLMENT & DISPATCH STATUS HEADER              */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
              Live Fulfillment Pipeline
            </span>
            <span className="text-xs text-slate-400 font-bold">• Dispatch Status Dashboard</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-emerald-600" />
            <span>Order Packing & Parcel Dispatch Console</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track whether each parcel is dispatched or awaiting dispatch, manage staging bays, and oversee rider handoffs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-2xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Dark Store Dispatch Active</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. KPI METRIC CARDS (HIGHLIGHTING DISPATCH STATUS)         */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total In Pipeline</span>
          <span className="text-xl font-black font-mono text-slate-900 mt-1 block">{kpis.total}</span>
          <span className="text-[10px] text-slate-500">All Live Orders</span>
        </div>

        {/* Not Dispatched */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-amber-700 block">⏳ Not Dispatched</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <span className="text-xl font-black font-mono text-amber-950 mt-1 block">{kpis.notDispatched}</span>
          <span className="text-[10px] text-amber-700 font-bold">In Dark Store / Bay</span>
        </div>

        {/* Ready for Dispatch */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200/90 shadow-2xs bg-indigo-50/30">
          <span className="text-[10px] uppercase font-bold text-indigo-700 block">Ready For Dispatch</span>
          <span className="text-xl font-black font-mono text-indigo-950 mt-1 block">{kpis.ready}</span>
          <span className="text-[10px] text-indigo-700">Sealed at Bay</span>
        </div>

        {/* Dispatched to Courier (Highlight Card) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-2xs bg-emerald-50/50 ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-emerald-800 block">✅ Dispatched</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-xl font-black font-mono text-emerald-950 mt-1 block">{kpis.dispatched}</span>
          <span className="text-[10px] text-emerald-700 font-bold">With Courier Fleet</span>
        </div>

        {/* In Transit */}
        <div className="bg-white p-4 rounded-2xl border border-sky-200/90 shadow-2xs bg-sky-50/30">
          <span className="text-[10px] uppercase font-bold text-sky-700 block">Out for Delivery</span>
          <span className="text-xl font-black font-mono text-sky-950 mt-1 block">{kpis.inTransit}</span>
          <span className="text-[10px] text-sky-700">Stage 6</span>
        </div>

        {/* Delivered */}
        <div className="bg-white p-4 rounded-2xl border border-teal-200/90 shadow-2xs bg-teal-50/30">
          <span className="text-[10px] uppercase font-bold text-teal-700 block">Delivered (OTP)</span>
          <span className="text-xl font-black font-mono text-teal-950 mt-1 block">{kpis.delivered}</span>
          <span className="text-[10px] text-teal-700">Completed</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. FILTER CONTROLS & PARCEL TABLE                          */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        
        {/* Top Filter Bar: Dispatch Status Quick Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Dispatch Filter:
            </span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/80">
              <button
                onClick={() => setDispatchFilter('All')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  dispatchFilter === 'All'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Orders ({allOrders.length})
              </button>
              <button
                onClick={() => setDispatchFilter('NotDispatched')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  dispatchFilter === 'NotDispatched'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-700 hover:bg-amber-100/50'
                }`}
              >
                <span>⏳ Not Dispatched</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 font-mono">
                  {kpis.notDispatched}
                </span>
              </button>
              <button
                onClick={() => setDispatchFilter('Dispatched')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  dispatchFilter === 'Dispatched'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-100/50'
                }`}
              >
                <span>✅ Dispatched</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 font-mono">
                  {kpis.dispatched}
                </span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID, customer, staff, staging bay..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* 7-Stage Pipeline Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {stageLabels.map((stg) => (
            <button
              key={stg.id}
              onClick={() => setSelectedStageFilter(stg.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedStageFilter === stg.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <span>{stg.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  selectedStageFilter === stg.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {stg.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table summary count */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Showing <b className="text-slate-900">{filteredOrders.length}</b> orders in fulfillment queue
          </div>
          {dispatchFilter !== 'All' && (
            <button
              onClick={() => setDispatchFilter('All')}
              className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Reset filter</span>
            </button>
          )}
        </div>

        {/* ORDERS TABLE */}
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
              📦
            </div>
            <h3 className="text-sm font-bold text-slate-800">No orders found matching the filter</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {allOrders.length === 0
                ? 'No orders in fulfillment queue. Live orders placed from the customer store will appear here automatically for packing and dispatch.'
                : 'Try switching your stage or dispatch status filter to see other orders in the pipeline.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">Order ID & Time</th>
                  <th className="pb-3">Customer & Address</th>
                  <th className="pb-3">Items & Total</th>
                  <th className="pb-3">Assigned Staff</th>
                  <th className="pb-3">Pipeline Stage</th>
                  <th className="pb-3 text-center">Parcel Dispatch Status</th>
                  <th className="pb-3 text-right pr-2">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filteredOrders.map((ord) => {
                  const stageColors = {
                    1: 'bg-blue-50 text-blue-800 border-blue-200',
                    2: 'bg-amber-50 text-amber-800 border-amber-200',
                    3: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    4: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                    5: 'bg-purple-50 text-purple-800 border-purple-200',
                    6: 'bg-sky-50 text-sky-800 border-sky-200',
                    7: 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  };

                  const stageNames = {
                    1: '1. Order Placed',
                    2: '2. Packing',
                    3: '3. Shelf Picking',
                    4: '4. Ready Dispatch',
                    5: '5. Courier Dispatch',
                    6: '6. Out for Delivery',
                    7: '7. Delivered (OTP)'
                  };

                  const isDispatched = ord.isDispatched;

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Order ID */}
                      <td className="py-4 pl-2 font-mono font-bold text-slate-900">
                        <span className="text-emerald-700 font-black">{ord.id}</span>
                        <span className="block text-[10px] text-slate-400 font-normal font-sans">
                          {ord.time || '10 mins ago'}
                        </span>
                      </td>

                      {/* 2. Customer & Location */}
                      <td className="py-4 max-w-[200px]">
                        <span className="font-bold text-slate-900 block truncate">{ord.customerName}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">{ord.addressText} • <b>{ord.cityText}</b></span>
                        </div>
                      </td>

                      {/* 3. Items & Total */}
                      <td className="py-4">
                        <span className="font-black text-slate-900 block font-mono">
                          {ord.itemsCount} Items
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          Rs. {Number(ord.total || ord.totalAmount || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* 4. Assigned Staff */}
                      <td className="py-4" onClick={(e) => e.stopPropagation()}>
                        {ord.fulfillmentStage < 5 ? (
                          <div className="space-y-1">
                            <select
                              value={ord.pickupStaffId || ''}
                              onChange={(event) => {
                                const staff = tenantStaff.find((item) => item.id === event.target.value);
                                if (staff) {
                                  assignPickupStaffToOrder(ord.id, staff.id);
                                }
                              }}
                              className="w-36 px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            >
                              <option value="">Select pickup staff</option>
                              {tenantStaff.map((staff) => (
                                <option key={staff.id} value={staff.id}>
                                  {staff.name}
                                </option>
                              ))}
                            </select>
                            {ord.pickupStaffName && (
                              <span className="block text-[10px] text-emerald-700 font-medium">
                                ✓ Assigned: {ord.pickupStaffName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-700 block">
                            {ord.pickupStaffName ? `👤 ${ord.pickupStaffName}` : 'Staff Verified'}
                          </span>
                        )}
                      </td>

                      {/* 5. Pipeline Stage */}
                      <td className="py-4">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${
                            stageColors[ord.fulfillmentStage] || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{stageNames[ord.fulfillmentStage] || `Stage ${ord.fulfillmentStage}`}</span>
                        </span>
                      </td>

                      {/* 6. PARCEL DISPATCH STATUS (NEW & PROMINENT) */}
                      <td className="py-4 text-center">
                        {isDispatched ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>✅ Dispatched</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {ord.parcelCode || 'PRCL-DISPATCHED'}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>⏳ Not Dispatched</span>
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {ord.stagingBay || 'In Dark Store Bay'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 7. Action Button & Dispatch Toggle */}
                      <td className="py-4 text-right pr-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-500 px-2">Status updated by pickup staff</span>

                          {/* Deliver to Staff Modal Button */}
                          <button
                            onClick={() => setDeliverToStaffModalOrder(ord)}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[11px] font-bold border border-indigo-200/80 inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                            title="Deliver Parcel to Staff for Line-Wise Pick & Pack"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                            <span>Deliver to Staff</span>
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 5. ADD PICKUP STAFF MODAL                                  */}
      {/* ========================================================= */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add Pickup Staff</h3>
                  <p className="text-xs text-slate-500 font-medium">Create credentials for warehouse staff</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Store Information Badge */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Assigned Store Branch:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <span>{currentTenant?.logo || '🏬'}</span>
                <span>{currentTenant?.name || 'FreshMart'}</span>
              </span>
            </div>

            {/* Staff Creation Form */}
            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Staff Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Rizwan"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Sign-In Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rizwan_pack"
                  value={staffForm.username}
                  onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Used by staff to sign in to the Pickup Staff Portal.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter secure password"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0300-1234567"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Staff Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. ORDER FULFILLMENT MODAL (7-STAGE CONSOLE)               */}

      {/* 7. DELIVER TO STAFF MODAL */}
      {deliverToStaffModalOrder && (
        <DeliverToStaffModal
          order={deliverToStaffModalOrder}
          isOpen={Boolean(deliverToStaffModalOrder)}
          onClose={() => setDeliverToStaffModalOrder(null)}
        />
      )}
    </div>
  );
};
