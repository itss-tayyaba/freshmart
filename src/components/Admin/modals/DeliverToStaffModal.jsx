import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, MapPin, UserCheck, X } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { isSameTenant } from '../../../data/companyHierarchyData';
import { countPickupStaffTasks, MAX_PICKUP_STAFF_PARCELS } from '../../../utils/pickupStaffAssignment';

export const DeliverToStaffModal = ({ order, isOpen, onClose, onSuccess }) => {
  const { pickupStaff = [], assignPickupStaffToOrder, currentTenant, user, addToast, adminOrders = [], customerOrders = [] } = useStore();
  const allOrders = useMemo(() => [...adminOrders, ...customerOrders], [adminOrders, customerOrders]);

  const tenantId = (user?.role !== 'superadmin' && user?.tenantId)
    ? user.tenantId
    : (order?.tenantId || currentTenant?.id || 'tenant-freshmart');
  const staff = useMemo(() => pickupStaff.filter((member) => {
    if (!isSameTenant(member.tenantId || member.companyId, tenantId)) return false;
    if (member.status && member.status !== 'Active') return false;
    if (order?.branchId && member.branchId && order.branchId !== member.branchId) return false;
    return true;
  }), [pickupStaff, tenantId, order?.branchId]);
  const [selectedStaffId, setSelectedStaffId] = useState(order?.pickupStaffId || '');
  useEffect(() => setSelectedStaffId(order?.pickupStaffId || ''), [order?.id, order?.pickupStaffId]);

  if (!isOpen || !order) return null;

  const confirmAssignment = () => {
    if (order.isDispatchedByStaff || ['Preparing', 'Packed', 'Ready for Dispatch', 'Dispatched', 'Out for Delivery'].includes(order.status)) {
      addToast('Status Protected 🔒', 'This order is already being processed or dispatched by pickup staff and cannot be altered here.', 'error');
      return;
    }
    if (!selectedStaffId) {
      addToast('Select pickup staff', 'Choose an active staff member to receive this parcel.', 'error');
      return;
    }
    if (assignPickupStaffToOrder(order.id, selectedStaffId)) {
      onSuccess?.();
      onClose();
    }
  };

  const items = order.rawItems || order.items || order.orderItems || [];
  const address = order.address || order.shippingAddress?.address || order.city || 'Delivery address unavailable';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="pickup-assignment-title">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
        <header className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white">
          <div className="flex items-center gap-3"><Boxes className="text-emerald-300"/><div><h2 id="pickup-assignment-title" className="font-black">Assign Parcel to Pickup Staff</h2><p className="text-xs text-slate-300">Order {order.id}</p></div></div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-white/10"><X size={18}/></button>
        </header>
        <div className="space-y-5 p-5">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm"><p className="font-bold">{order.customerName || order.customer || 'Customer'}</p><p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500"><MapPin size={14} className="shrink-0"/>{address}</p><p className="mt-3 text-xs text-slate-600">{items.length} product lines · {order.status || 'Order placed'}</p></div>
          <label className="block text-xs font-bold text-slate-700">Pickup staff member (max 10 active parcels each)
            <select value={selectedStaffId} onChange={(event) => setSelectedStaffId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold">
              <option value="">Choose staff</option>
              {staff.map((member) => {
                const count = countPickupStaffTasks(member.id, allOrders);
                const isFull = count >= MAX_PICKUP_STAFF_PARCELS;
                return (
                  <option key={member.id} value={member.id}>
                    📦 {member.name} (@{member.username}) — {count}/{MAX_PICKUP_STAFF_PARCELS} parcels {isFull ? '(FULL)' : ''}
                  </option>
                );
              })}
            </select>
          </label>
          {staff.length === 0 && <p className="text-xs text-amber-700">Add a pickup staff account in the admin dashboard first.</p>}
          <p className="text-xs text-slate-500">Assignment sends this order to the staff queue. Staff will accept it and update picking, preparation, and dispatch status from their own terminal.</p>
          <div className="flex justify-end gap-2"><button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-bold text-slate-600">Cancel</button><button onClick={confirmAssignment} disabled={!staff.length} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><UserCheck size={16}/>Assign to Staff</button></div>
        </div>
      </div>
    </div>
  );
};
