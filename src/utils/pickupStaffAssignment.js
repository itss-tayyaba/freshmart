const CLOSED_PICKUP_STATUSES = new Set([
  'dispatched',
  'out for delivery',
  'delivered',
  'cancelled',
  'completed'
]);

export const isPickupTaskActive = (order) => {
  const status = String(order?.status || '').toLowerCase();
  return !CLOSED_PICKUP_STATUSES.has(status);
};

export const isPickupOrderAssigned = (order) =>
  Boolean(order?.pickupStaffId || order?.pickupStaffName || order?.pickupStaffUsername);

export const isOrderAssignedToPickupStaff = (order, user) => {
  if (!order || !user) return false;
  const assignedId = String(order.pickupStaffId || '').trim().toLowerCase();
  const assignedUsername = String(order.pickupStaffUsername || '').trim().toLowerCase();
  if (!assignedId && !assignedUsername) return false;
  const identities = [user.id, user.staffId, user._id, user.username]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());
  return (assignedId && identities.includes(assignedId)) || (assignedUsername && identities.includes(assignedUsername));
};

export const countPickupStaffTasks = (staffId, orders = []) =>
  (orders || []).filter((order) => String(order?.pickupStaffId) === String(staffId) && isPickupTaskActive(order)).length;

export const pickLeastBusyPickupStaff = (staffList = [], orders = []) => {
  if (!Array.isArray(staffList) || staffList.length === 0) return null;
  return [...staffList].sort((a, b) => {
    const diff = countPickupStaffTasks(a.id, orders) - countPickupStaffTasks(b.id, orders);
    if (diff !== 0) return diff;
    return String(a.name || a.username || '').localeCompare(String(b.name || b.username || ''));
  })[0];
};

export const buildPickupStaffAssignment = (staff, timestamp = new Date().toISOString()) => ({
  pickupStaffId: staff.id,
  pickupStaffName: staff.name,
  pickupStaffUsername: staff.username,
  status: 'Deliver to Staff',
  fulfillmentStage: 2,
  pickupStep: 'received',
  pickupAssignedAt: timestamp,
  deliveredToStaffAt: timestamp
});
