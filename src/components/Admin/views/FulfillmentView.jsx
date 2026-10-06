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
  Building2,
  Calendar,
  Sparkles,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { OrderFulfillmentModal } from '../modals/OrderFulfillmentModal';

export const FulfillmentView = () => {
  const { adminOrders, customerOrders, currentTenant, riders, pickupStaff = [], addPickupStaff, updateOrderFulfillment } = useStore();

  const [search, setSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('All');
  const [activeModalOrder, setActiveModalOrder] = useState(null);
  const [staffForm, setStaffForm] = useState({ name: '', username: '', password: '', phone: '' });
  const tenantStaff = (pickupStaff || []).filter((staff) => staff?.tenantId === currentTenant?.id);

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
        else if (statusLower === 'ready for dispatch' || statusLower === 'packed') stg = 4;
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

      return {
        ...ord,
        fulfillmentStage: stg,
        itemsCount: totalItemsCount,
        customerName: ord.customerName || ord.customer || 'Customer',
        addressText: ord.address || ord.shippingAddress?.address || 'Peoples Colony 1',
        cityText: ord.city || ord.shippingAddress?.city || 'Faisalabad'
      };
    });
  }, [customerOrders, adminOrders, currentTenant]);

  // Stage KPI Counts
  const kpis = useMemo(() => {
    return {
      total: allOrders.length,
      queue: allOrders.filter((o) => o.fulfillmentStage === 2).length,
      packing: allOrders.filter((o) => o.fulfillmentStage === 3).length,
      ready: allOrders.filter((o) => o.fulfillmentStage === 4 || o.fulfillmentStage === 5).length,
      inTransit: allOrders.filter((o) => o.fulfillmentStage === 6).length,
      delivered: allOrders.filter((o) => o.fulfillmentStage === 7).length
    };
  }, [allOrders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return allOrders.filter((ord) => {
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
        return matchesId || matchesCust || matchesCity || matchesBay;
      }

      return true;
    });
  }, [allOrders, selectedStageFilter, search]);

  const stageLabels = [
    { id: 'All', label: 'All Stages', count: allOrders.length },
    { id: '1', label: '1. Order Placed', count: allOrders.filter((o) => o.fulfillmentStage === 1).length },
    { id: '2', label: '2. Packing Queue', count: kpis.queue },
    { id: '3', label: '3. Shelf Picking', count: kpis.packing },
    { id: '4', label: '4. Ready Dispatch', count: allOrders.filter((o) => o.fulfillmentStage === 4).length },
    { id: '5', label: '5. Courier Dispatch', count: allOrders.filter((o) => o.fulfillmentStage === 5).length },
    { id: '6', label: '6. In Transit', count: kpis.inTransit },
    { id: '7', label: '7. Delivered', count: kpis.delivered }
  ];

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-black text-slate-900">Pickup Staff Accounts</h2><p className="text-xs text-slate-500 mt-1">Create staff sign-ins and assign orders to their packing queue.</p></div><span className="text-xs font-bold text-emerald-700">{tenantStaff.length} active</span></div>
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2" onSubmit={(event) => { event.preventDefault(); if (!staffForm.name.trim() || !staffForm.username.trim() || !staffForm.password.trim()) return; addPickupStaff(staffForm); setStaffForm({ name: '', username: '', password: '', phone: '' }); }}>
          <input required value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} placeholder="Staff name" className="px-3 py-2 border rounded-xl text-sm" />
          <input required value={staffForm.username} onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })} placeholder="Username" className="px-3 py-2 border rounded-xl text-sm" />
          <input required value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} placeholder="Password" className="px-3 py-2 border rounded-xl text-sm" />
          <input value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} placeholder="Phone (optional)" className="px-3 py-2 border rounded-xl text-sm" />
          <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">Add Pickup Staff</button>
        </form>
        {tenantStaff.length > 0 && <div className="flex flex-wrap gap-2">{tenantStaff.map((staff) => <span key={staff.id} className="rounded-xl bg-slate-50 border px-3 py-2 text-xs"><b>{staff.name}</b> · sign in: <code>{staff.username}</code></span>)}</div>}
      </section>
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Warehouse Operations
            </span>
            <span className="text-xs text-slate-400 font-bold">• Packing & Fleet Dispatch</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-emerald-600" />
            <span>Order Fulfillment & Packing Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Live 7-step pipeline from customer checkout to shelf picking, bay staging, QR scan, and OTP delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-2xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Dark Store SLA Running</span>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Active</span>
          <span className="text-xl font-black font-mono text-slate-900 mt-1 block">{kpis.total}</span>
          <span className="text-[10px] text-slate-500">All Pipeline</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-200/90 shadow-2xs bg-amber-50/30">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">Packing Queue</span>
          <span className="text-xl font-black font-mono text-amber-950 mt-1 block">{kpis.queue}</span>
          <span className="text-[10px] text-amber-700">Stage 2</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-200/90 shadow-2xs bg-blue-50/30">
          <span className="text-[10px] uppercase font-bold text-blue-700 block">Shelf Picking</span>
          <span className="text-xl font-black font-mono text-blue-950 mt-1 block">{kpis.packing}</span>
          <span className="text-[10px] text-blue-700">Stage 3</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-indigo-200/90 shadow-2xs bg-indigo-50/30">
          <span className="text-[10px] uppercase font-bold text-indigo-700 block">Ready Dispatch</span>
          <span className="text-xl font-black font-mono text-indigo-950 mt-1 block">{kpis.ready}</span>
          <span className="text-[10px] text-indigo-700">Stage 4 & 5</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-sky-200/90 shadow-2xs bg-sky-50/30">
          <span className="text-[10px] uppercase font-bold text-sky-700 block">In Transit</span>
          <span className="text-xl font-black font-mono text-sky-950 mt-1 block">{kpis.inTransit}</span>
          <span className="text-[10px] text-sky-700">Stage 6</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 shadow-2xs bg-emerald-50/30">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Delivered</span>
          <span className="text-xl font-black font-mono text-emerald-950 mt-1 block">{kpis.delivered}</span>
          <span className="text-[10px] text-emerald-700">Stage 7 (OTP)</span>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        
        {/* Stage Filter Buttons */}
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

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID, customer, city, staging bay..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <b className="text-slate-900">{filteredOrders.length}</b> orders in queue
          </div>
        </div>

        {/* ORDERS TABLE */}
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
              📦
            </div>
            <h3 className="text-sm font-bold text-slate-800">No orders found in this fulfillment stage</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try switching stage filter or place a new order from customer store to populate the fulfillment queue.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">Order ID & Time</th>
                  <th className="pb-3">Customer & Location</th>
                  <th className="pb-3">Packing SLA</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Current Pipeline Stage</th>
                  <th className="pb-3">Staging / Dispatch</th>
                  <th className="pb-3 text-right pr-2">Action</th>
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
                    2: '2. Packing Queue',
                    3: '3. Shelf Picking',
                    4: '4. Ready Dispatch',
                    5: '5. Courier Dispatch',
                    6: '6. Out for Delivery',
                    7: '7. Delivered (OTP)'
                  };

                  return (
                    <tr
                      key={ord.id}
                      onClick={() => setActiveModalOrder(ord)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Order ID */}
                      <td className="py-4 pl-2 font-mono font-bold text-slate-900">
                        <span className="text-emerald-700 font-black">{ord.id}</span>
                        <span className="block text-[10px] text-slate-400 font-normal font-sans">
                          {ord.time || '10 mins ago'}
                        </span>
                      </td>

                      {/* Customer & Location */}
                      <td className="py-4 max-w-[200px]">
                        <span className="font-bold text-slate-900 block truncate">{ord.customerName}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">{ord.addressText} • <b>{ord.cityText}</b></span>
                        </div>
                      </td>

                      {/* Packing SLA */}
                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span className="font-mono font-bold text-slate-800 text-[11px]">
                            25 min SLA
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {ord.fulfillmentStage >= 4 ? '✓ Packed in time' : 'Countdown active'}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-4">
                        <span className="font-black text-slate-900 block font-mono">
                          {ord.itemsCount} Items
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          Rs. {Number(ord.total || ord.totalAmount || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Current Pipeline Stage */}
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

                      {/* Staging / Dispatch */}
                      <td className="py-4">
                        <span className="text-[11px] font-bold text-slate-800 block">
                          {ord.assignedRider?.name ? `🚚 ${ord.assignedRider.name}` : (ord.stagingBay || 'Staging Bay #2')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ord.parcelCode || (ord.fulfillmentStage >= 4 ? 'PRCL-SEALED' : 'Awaiting seal')}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 text-right pr-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                        {ord.fulfillmentStage < 5 && <select value={ord.pickupStaffId || ''} onChange={(event) => { const staff = tenantStaff.find((item) => item.id === event.target.value); if (staff) updateOrderFulfillment(ord.id, { pickupStaffId: staff.id, pickupStaffName: staff.name, fulfillmentStage: Math.max(2, ord.fulfillmentStage), status: ord.fulfillmentStage < 2 ? 'Processing' : ord.status, pickupAssignedAt: new Date().toISOString() }); }} className="max-w-36 block ml-auto px-2 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold bg-white"><option value="">Transfer to staff</option>{tenantStaff.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}</select>}
                        {ord.pickupStaffName && <span className="block text-[10px] text-slate-500">Staff: {ord.pickupStaffName}</span>}
                        <button
                          onClick={() => setActiveModalOrder(ord)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 text-[11px] font-bold transition-all border border-emerald-200/80 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>7-Stage Console</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ORDER FULFILLMENT MODAL */}
      {activeModalOrder && (
        <OrderFulfillmentModal
          order={activeModalOrder}
          isOpen={Boolean(activeModalOrder)}
          onClose={() => setActiveModalOrder(null)}
        />
      )}
    </div>
  );
};
