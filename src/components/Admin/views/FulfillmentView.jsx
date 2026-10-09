import React, { useMemo, useState } from 'react';
import { Boxes, UserPlus, Trash2, X, Eye, EyeOff, Clock, MapPin, PackageCheck } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { resolveTenantId, isSameTenant } from '../../../data/companyHierarchyData';

const getItems = (order) => [order.rawItems, order.items, order.orderItems].find(Array.isArray) || [];
const getOrderLabel = (order) => String(order.orderId || order.id || order._id || 'Order').replace(/^#/, '#');
const getStaffActivity = (order) => {
  if (order.status === 'Ready for Dispatch') return 'Ready for Dispatch';
  if (order.status === 'Packed' || order.pickupStep === 'packed') return 'Parcel packed';
  if (order.status === 'Picking' || order.pickupStep === 'picking') return 'Picking items';
  if (order.pickupStaffId) return 'Order received by staff';
  return 'Waiting for staff assignment';
};

export const FulfillmentView = () => {
  const {
    adminOrders = [], customerOrders = [], currentTenant, user, pickupStaff = [],
    addPickupStaff, deletePickupStaff, assignPickupStaffToOrder
  } = useStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', username: '', password: '', phone: '' });
  const [search, setSearch] = useState('');

  const activeTenantId = currentTenant?.id || user?.tenantId || 'tenant-alfatah';

  const tenantStaff = useMemo(
    () => pickupStaff.filter((staff) => !staff?.tenantId || isSameTenant(staff?.tenantId, activeTenantId)),
    [pickupStaff, activeTenantId]
  );
  const orders = useMemo(() => {
    const unique = new Map();
    [...customerOrders, ...adminOrders].forEach((order) => {
      const id = String(order?.id || order?.orderId || order?._id || '');
      if (!id) return;
      if (activeTenantId) {
        if (!order.tenantId) return;
        const matchesTenant = isSameTenant(order.tenantId, activeTenantId);
        if (!matchesTenant) return;
      }
      unique.set(id, { ...unique.get(id), ...order });
    });
    return [...unique.values()].sort((a, b) => new Date(b.fulfillmentUpdatedAt || b.updatedAt || b.createdAt || 0) - new Date(a.fulfillmentUpdatedAt || a.updatedAt || a.createdAt || 0));
  }, [customerOrders, adminOrders, activeTenantId]);
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) => `${getOrderLabel(order)} ${order.customerName || order.customer || ''} ${order.pickupStaffName || ''} ${order.status || ''}`.toLowerCase().includes(query));
  }, [orders, search]);

  const submitStaff = async (event) => {
    event.preventDefault();
    const created = await addPickupStaff(staffForm);
    if (!created) return;
    setStaffForm({ name: '', username: '', password: '', phone: '' });
    setIsAddOpen(false);
  };

  const assignStaff = (order, staffId) => {
    if (!staffId) return;
    assignPickupStaffToOrder(order.id || order.orderId || order._id, staffId);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">Pickup Staff</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your staff roster, assign orders, and follow packing activity.</p>
          </div>
          <button onClick={() => setIsAddOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700">
            <UserPlus size={16} /> Add Staff
          </button>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tenantStaff.map((staff) => (
            <div key={staff.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-black text-emerald-800">{(staff.name || 'S').slice(0, 1).toUpperCase()}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{staff.name}</p>
                  <p className="truncate text-xs text-slate-500">{staff.username}</p>
                </div>
              </div>
              <button onClick={() => deletePickupStaff?.(staff.id)} title={`Remove ${staff.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {tenantStaff.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 sm:col-span-2 lg:col-span-3 xl:col-span-4">No pickup staff yet. Add a staff account to start assigning orders.</p>}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900"><PackageCheck className="text-emerald-600" size={19} /> Staff Activity & Order Assignment</h2>
            <p className="mt-1 text-xs text-slate-500">Packing progress comes from the pickup staff account and updates automatically.</p>
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, staff..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 sm:w-72" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">Order & customer</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Assigned staff</th><th className="px-5 py-3">Latest activity</th><th className="px-5 py-3">Updated</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const orderId = order.id || order.orderId || order._id;
                const items = getItems(order);
                const canAssign = !order.isDispatched && !['Dispatched', 'Out for Delivery', 'Arrived at Customer', 'Delivered'].includes(order.status);
                const activityAt = order.fulfillmentUpdatedAt || order.updatedAt || order.createdAt;
                return (
                  <tr key={orderId} className="align-top hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-emerald-700">{getOrderLabel(order)}</span>
                      <span className="mt-1 block font-semibold text-slate-900">{order.customerName || order.customer || 'Customer'}</span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} />{order.city || order.shippingAddress?.city || order.address || 'Delivery area unavailable'}</span>
                    </td>
                    <td className="max-w-[260px] px-5 py-4 text-xs text-slate-700">
                      {items.length ? items.map((item) => {
                        const base = `${item.quantity || item.qty || 1}× ${item.name || item.productName || 'Item'}`;
                        if (item.isSubstituted && item.originalProduct) {
                          return `${base} (🔄 Substituted, was: ${item.originalProduct.name})`;
                        }
                        return base;
                      }).join(', ') : 'Items pending sync'}
                    </td>
                    <td className="px-5 py-4">
                      {canAssign ? <select value={order.pickupStaffId || ''} onChange={(event) => assignStaff(order, event.target.value)} className="w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="">Assign pickup staff</option>{tenantStaff.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
                      </select> : <span className="text-sm font-semibold text-slate-700">{order.pickupStaffName || '?'}</span>}
                    </td>
                    <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${order.status === 'Ready for Dispatch' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{getStaffActivity(order)}</span><span className="mt-1 block text-[11px] text-slate-500">{order.status || 'Order placed'}</span></td>
                    <td className="px-5 py-4 text-xs text-slate-500">{activityAt ? <span className="inline-flex items-center gap-1"><Clock size={12} />{new Date(activityAt).toLocaleString()}</span> : '?'}</td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && <tr><td colSpan="5" className="px-5 py-12 text-center text-sm text-slate-500">No orders to show yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {isAddOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-black text-slate-900">Add pickup staff</h3><p className="text-xs text-slate-500">{currentTenant?.name || 'Current store'}</p></div><button onClick={() => setIsAddOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={17} /></button></div>
          <form onSubmit={submitStaff} className="space-y-3">
            <input required value={staffForm.name} onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })} placeholder="Staff full name" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            <input required value={staffForm.username} onChange={(event) => setStaffForm({ ...staffForm, username: event.target.value })} placeholder="Sign-in username" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            <div className="relative"><input required type={showPassword ? 'text' : 'password'} value={staffForm.password} onChange={(event) => setStaffForm({ ...staffForm, password: event.target.value })} placeholder="Password" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-11 text-sm" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
            <input value={staffForm.phone} onChange={(event) => setStaffForm({ ...staffForm, phone: event.target.value })} placeholder="Phone (optional)" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsAddOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Create staff account</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
};
