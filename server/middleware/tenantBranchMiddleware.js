import { validateTenantBranchAccess, resolveTenantId } from '../../src/data/companyHierarchyData.js';

/**
 * Enforces the strict multi-company security policy:
 * User → Tenant → Branch → Data
 *
 * Ensures:
 * 1. Super Admin has overarching platform governance
 * 2. Store / Company Admin is strictly restricted to their company's data
 * 3. Branch Staff / Manager is strictly restricted to their branch's data
 * 4. Cross-company or cross-branch data access attempts are denied with 403 Forbidden
 */
export const enforceTenantBranchScope = (req, res, next) => {
  // If unauthenticated public request (e.g. shopper browsing store)
  if (!req.user) {
    req.tenantId = resolveTenantId(req.headers['x-tenant-id'] || req.query.tenantId || req.body?.tenantId || 'company_001');
    return next();
  }

  // Super Admin: platform-level access
  if (req.user.role === 'superadmin') {
    req.tenantId = resolveTenantId(req.query.tenantId || req.headers['x-tenant-id'] || req.user.tenantId);
    req.branchId = req.query.branchId || req.headers['x-branch-id'] || req.user.branchId;
    return next();
  }

  // Resolve target tenant & branch from request context
  const targetTenantId = resolveTenantId(
    req.params.tenantId || req.query.tenantId || req.body?.tenantId || req.headers['x-tenant-id'] || req.user.tenantId
  );
  const targetBranchId = req.params.branchId || req.query.branchId || req.body?.branchId || req.headers['x-branch-id'] || req.user.branchId;

  // Strict validation
  const validation = validateTenantBranchAccess(req.user, targetTenantId, targetBranchId);
  if (!validation.allowed) {
    return res.status(validation.statusCode || 403).json({
      success: false,
      message: validation.error || 'Access denied: Multi-company tenant/branch isolation policy violation'
    });
  }

  req.tenantId = targetTenantId;
  req.branchId = targetBranchId;
  next();
};
