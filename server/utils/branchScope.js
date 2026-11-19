// Pure helper (no DB imports) so it can be unit-tested.
// Decides which orders / riders / staff a logged-in user is allowed to see.
//   superadmin   -> everything
//   admin        -> ONLY their own branchId (admin with no branch is refused)
//   pickupstaff  -> ONLY their own branchId
//   rider        -> ONLY their own branchId
export const buildBranchScope = (user) => {
  const role = String(user?.role || '').toLowerCase();
  if (role === 'superadmin') return { ok: true, filter: {} };
  if (['admin', 'pickupstaff', 'rider'].includes(role)) {
    const branchId = String(user?.branchId || '').trim();
    if (!branchId || branchId === 'all') {
      return { ok: false, status: 403, message: 'This account is not assigned to a branch' };
    }
    return { ok: true, filter: { branchId } };
  }
  return { ok: false, status: 403, message: 'Access denied' };
};

export const canAccessOrder = (user, order) => {
  const scope = buildBranchScope(user);
  if (!scope.ok) return false;
  if (!scope.filter.branchId) return true;
  return String(order?.branchId || '') === scope.filter.branchId;
};

export const filterOrdersForUser = (user, orders = []) => {
  const scope = buildBranchScope(user);
  if (!scope.ok) return [];
  if (!scope.filter.branchId) return orders;
  return orders.filter((o) => String(o?.branchId || '') === scope.filter.branchId);
};
