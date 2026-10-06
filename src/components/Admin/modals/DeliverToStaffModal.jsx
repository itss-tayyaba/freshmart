import React, { useState, useMemo } from 'react';
import {
  X,
  Boxes,
  UserCheck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  Check,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export const DeliverToStaffModal = ({ order, isOpen, onClose, onSuccess }) => {
  const {
    pickupStaff = [],
    addPickupStaff,
    currentTenant,
    updateOrderFulfillment,
    addToast
  } = useStore();

  if (!isOpen || !order) return null;

  const activeTenantId = currentTenant?.id || order.tenantId || 'tenant-freshmart';
  const tenantStaff = useMemo(() => {
    return (pickupStaff || []).filter(
      (s) => !s.tenantId || s.tenantId === activeTenantId || activeTenantId === 'tenant-freshmart'
    );
  }, [pickupStaff, activeTenantId]);

  // Selected staff state (preselect currently assigned or first available)
  const [selectedStaffId, setSelectedStaffId] = useState(() => {
    if (order.pickupStaffId) return order.pickupStaffId;
    if (tenantStaff.length > 0) return tenantStaff[0].id;
    return '';
  });

  // Line-wise order items
  const orderItems = useMemo(() => {
    if (Array.isArray(order.rawItems) && order.rawItems.length > 0) return order.rawItems;
    if (Array.isArray(order.items) && order.items.length > 0) return order.items;
    if (Array.isArray(order.orderItems) && order.orderItems.length > 0) return order.orderItems;
    return [
      { name: 'Fresh Farm Produce Item', price: Number(order.total || 500), quantity: 1 }
    ];
  }, [order]);

  // Checked/prepared items line-wise checklist
  const [preparedItemIndexes, setPreparedItemIndexes] = useState(() => {
    if (Array.isArray(order.pickedItems)) return order.pickedItems;
    return [];
  });

  // Packaging and bay configuration
  const [packageType, setPackageType] = useState(order.packageType || 'Eco-Friendly Carton Box');
  const [stagingBay, setStagingBay] = useState(order.stagingBay || 'Dispatch Bay #1 • Rack A');
  const [prepNotes, setPrepNotes] = useState(order.prepNotes || '');

  // Inline Quick Add Staff toggle
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUser, setNewStaffUser] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  const toggleItemCheck = (idx) => {
    setPreparedItemIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAllItems = () => {
    if (preparedItemIndexes.length === orderItems.length) {
      setPreparedItemIndexes([]);
    } else {
      setPreparedItemIndexes(orderItems.map((_, i) => i));
    }
  };

  const handleQuickCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffUser.trim() || !newStaffPass.trim()) {
      addToast('Missing Fields', 'Please fill name, username and password', 'error');
      return;
    }
    setIsSubmittingStaff(true);
    try {
      const created = await addPickupStaff({
        name: newStaffName.trim(),
        username: newStaffUser.trim(),
        password: newStaffPass.trim(),
        phone: '0300-1234567'
      });
      if (created) {
        setSelectedStaffId(created.id);
        setShowAddStaffForm(false);
        setNewStaffName('');
        setNewStaffUser('');
        setNewStaffPass('');
      }
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleConfirmDeliverToStaff = () => {
    const chosenStaff = tenantStaff.find((s) => s.id === selectedStaffId) ||
      (pickupStaff || []).find((s) => s.id === selectedStaffId);

    if (!chosenStaff) {
      addToast('Staff Required ⚠️', 'Please select a pickup staff member or add one first.', 'error');
      return;
    }

    const parcelCode = order.parcelCode || `PRCL-${String(order.id || '101').replace(/\W/g, '').slice(-6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const updates = {
      status: 'Delivered to Staff',
      fulfillmentStage: preparedItemIndexes.length === orderItems.length ? 3 : 2,
      pickupStaffId: chosenStaff.id,
      pickupStaffName: chosenStaff.name,
      pickupStaffUsername: chosenStaff.username,
      pickupAssignedAt: new Date().toISOString(),
      deliveredToStaffAt: new Date().toISOString(),
      pickedItems: preparedItemIndexes,
      packageType,
      stagingBay,
      parcelCode,
      prepNotes,
      isDispatched: false
    };

    updateOrderFulfillment(order.id, updates);

    addToast(
      'Parcel Delivered to Staff! 📦',
      `Order ${order.id} delivered to ${chosenStaff.name} for line-wise picking and packing.`
    );

    if (onSuccess) onSuccess(updates);
    onClose();
  };

  const selectedStaffObj = tenantStaff.find((s) => s.id === selectedStaffId) ||
    (pickupStaff || []).find((s) => s.id === selectedStaffId);

  const customerName = order.customerName || order.customer || 'Customer';
  const customerAddress = order.address || order.shippingAddress?.address || 'Delivery Address';
  const customerCity = order.city || order.shippingAddress?.city || 'Lahore';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  Staff Dispatch Pipeline
                </span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  {order.id}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Deliver Parcel to Staff (Pick & Pack)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* 1. ORDER & DESTINATION SUMMARY */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer Destination</span>
              <span className="font-bold text-slate-900 text-sm">{customerName}</span>
              <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{customerAddress} • <b>{customerCity}</b></span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Items & Bill</span>
              <span className="font-mono font-black text-slate-900 text-sm block">
                {orderItems.length} SKUs ({orderItems.reduce((acc, it) => acc + (it.quantity || it.qty || 1), 0)} Units)
              </span>
              <span className="font-mono font-bold text-emerald-700">
                Rs. {Number(order.total || order.totalAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 2. SELECT PICKUP STAFF SECTION ("select and ok") */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>1. Select Pickup / Packing Staff Member:</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddStaffForm(!showAddStaffForm)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddStaffForm ? 'Cancel New Staff' : '+ Quick Add Staff'}</span>
              </button>
            </div>

            {/* Quick Add Staff Mini-Form */}
            {showAddStaffForm && (
              <form
                onSubmit={handleQuickCreateStaff}
                className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3 animate-in fade-in duration-150 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950">Add Pickup Staff Credentials</span>
                  <span className="text-[10px] text-indigo-700">Can immediately log in</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rizwan Ahmed"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. rizwan_pack"
                      value={newStaffUser}
                      onChange={(e) => setNewStaffUser(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        placeholder="e.g. staff123"
                        value={newStaffPass}
                        onChange={(e) => setNewStaffPass(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingStaff}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    {isSubmittingStaff ? 'Saving...' : 'Save & Select Staff'}
                  </button>
                </div>
              </form>
            )}

            {/* Staff Selector Grid */}
            {tenantStaff.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {tenantStaff.map((staff) => {
                  const isSelected = selectedStaffId === staff.id;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => setSelectedStaffId(staff.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">{staff.name}</div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                          @{staff.username}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No pickup staff added yet. Click <b>+ Quick Add Staff</b> above to create staff credentials.</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. LINE-WISE PREPARING & PACKING CHECKLIST ("all steeing and preapring pack line wise") */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>2. Preparing Pack Checklist (Line-Wise Shelf Items):</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Verify products shelf-by-shelf. Staff can also check these off in their workspace.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSelectAllItems}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {preparedItemIndexes.length === orderItems.length ? 'Uncheck All' : 'Check All Items'}
                </span>
              </button>
            </div>

            {/* Line Items List */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {orderItems.map((item, idx) => {
                const isChecked = preparedItemIndexes.includes(idx);
                const aisleLetters = ['A', 'B', 'C', 'D'];
                const shelfLocation = `Aisle ${aisleLetters[idx % 4]} • Shelf ${((idx * 2) % 6) + 1}`;
                const qty = item.quantity || item.qty || 1;
                const price = Number(item.price || item.unitPrice || 0);

                return (
                  <div
                    key={idx}
                    onClick={() => toggleItemCheck(idx)}
                    className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 transition cursor-pointer hover:bg-slate-50 ${
                      isChecked ? 'bg-emerald-50/50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            #{idx + 1}
                          </span>
                          <span className={`text-xs font-bold truncate ${isChecked ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {item.name || item.productName || item.title || 'Product'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                            📍 {shelfLocation}
                          </span>
                          <span className="text-slate-400">
                            Rs. {price.toLocaleString()} each
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-xs text-slate-900 block">
                        × {qty} Units
                      </span>
                      <span className={`text-[10px] font-bold ${isChecked ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {isChecked ? '✓ Prepared' : 'Pending Shelf Pick'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. PACKAGING TYPE & DISPATCH BAY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Packaging Material Box
              </label>
              <select
                value={packageType}
                onChange={(e) => setPackageType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Eco-Friendly Carton Box">📦 Eco-Friendly Carton Box</option>
                <option value="Thermal Insulated Chilled Pouch">❄️ Thermal Chilled Pouch (Dairy/Meat)</option>
                <option value="Heavy Duty Grocery Tote">🛍️ Heavy Duty Grocery Tote</option>
                <option value="Standard Seal Bag">🏷️ Standard Seal Bag</option>
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Staging Dispatch Bay
              </label>
              <select
                value={stagingBay}
                onChange={(e) => setStagingBay(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Dispatch Bay #1 • Rack A">Dispatch Bay #1 • Rack A (Express)</option>
                <option value="Dispatch Bay #2 • Rack B">Dispatch Bay #2 • Rack B (Standard)</option>
                <option value="Cold Storage Staging Bay">Cold Storage Staging Bay</option>
                <option value="Front Store Counter">Front Store Counter</option>
              </select>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER ("select and ok") */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-white transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmDeliverToStaff}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Select & OK (Deliver to Staff)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
