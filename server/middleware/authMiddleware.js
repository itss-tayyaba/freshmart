import jwt from 'jsonwebtoken';
import { isDbOnline } from '../config/db.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Supplier } from '../models/ExtraModels.js';
import { resolveTenantId, isSameTenant } from '../../src/data/companyHierarchyData.js';
import { getJwtSecret } from '../utils/jwtHelper.js';

const isDemoAllowed = () => {
  return process.env.ALLOW_DEMO_AUTH === 'true' || process.env.NODE_ENV === 'test';
};

export const protect = async (req, res, next) => {
  let token;
  const tenantHeader = (req?.headers && req.headers['x-tenant-id']) || null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Support development / demo session tokens only when ALLOW_DEMO_AUTH=true or test environment
      if (token && (token.startsWith('mock-') || token === 'mock-token')) {
        if (!isDemoAllowed()) {
          return res.status(401).json({ success: false, message: 'Mock authentication tokens are disabled in production' });
        }
        const isSuper = token.includes('superadmin');
        const isPickup = token.includes('pickup');
        req.user = {
          _id: isSuper ? 'superadmin-root' : 'admin-root',
          id: isSuper ? 'superadmin-root' : 'admin-root',
          name: isSuper ? 'Platform Super Admin' : (isPickup ? 'Pickup Staff' : 'Store Admin'),
          email: isSuper ? 'superadmin@supergrocery.pk' : 'admin@freshmart.pk',
          role: isSuper ? 'superadmin' : (isPickup ? 'pickup_staff' : 'admin'),
          tenantId: tenantHeader || (token.includes('chasevalue') ? 'tenant-chasevalue' : token.includes('chaseup') ? 'tenant-chaseup' : 'tenant-alfatah'),
          branchId: 'branch_001',
          branchName: 'Main Branch'
        };
        return next();
      }

      const decoded = jwt.verify(token, getJwtSecret());

      if (isDbOnline() && decoded.id && typeof decoded.id === 'string' && decoded.id.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          // Check User model (Database role beats token role)
          const dbUser = await User.findById(decoded.id).select('-password');
          if (dbUser) {
            req.user = dbUser.toObject ? dbUser.toObject() : { ...dbUser };
            req.user.id = String(dbUser._id);
            req.user.vendorId = decoded.vendorId || dbUser.vendorId;
            // Database role is authoritative
            req.user.role = dbUser.role || decoded.role || 'customer';
            // Only superadmin can override tenant via header
            if (req.user.role === 'superadmin') {
              req.user.tenantId = tenantHeader || dbUser.tenantId || decoded.tenantId;
            } else {
              req.user.tenantId = dbUser.tenantId || decoded.tenantId;
            }
            req.user.branchId = dbUser.branchId || decoded.branchId || 'branch_001';
            req.user.branchName = dbUser.branchName || decoded.branchName || 'Main Branch';
            return next();
          }

          // Check Vendor model
          const dbVendor = await Vendor.findById(decoded.id).select('-password');
          if (dbVendor) {
            req.user = dbVendor.toObject ? dbVendor.toObject() : { ...dbVendor };
            req.user.id = String(dbVendor._id);
            req.user.vendorId = dbVendor.vendorId || decoded.vendorId;
            req.user.role = 'vendor';
            return next();
          }

          // Check Supplier model
          const dbSupplier = await Supplier.findById(decoded.id).select('-password');
          if (dbSupplier) {
            req.user = dbSupplier.toObject ? dbSupplier.toObject() : { ...dbSupplier };
            req.user.id = String(dbSupplier._id);
            req.user.vendorId = dbSupplier.supplierId || dbSupplier.id || decoded.vendorId || 'VND-101';
            req.user.role = 'supplier';
            return next();
          }

          // User had a MongoDB ObjectId but was not found in DB -> Demoted or deleted user (Fail closed)
          return res.status(401).json({
            success: false,
            message: 'User account no longer exists or has been deactivated'
          });
        } catch (dbErr) {
          console.warn('DB lookup in auth middleware:', dbErr.message);
        }
      }

      // If DB is offline or user was encoded with signed JWT payload
      if (decoded.role || decoded.id) {
        const isSuper = (decoded.role || '').toLowerCase() === 'superadmin';
        req.user = {
          _id: decoded.id || 'admin-root',
          id: decoded.id || 'admin-root',
          name: decoded.name || 'Store User',
          email: decoded.email || 'user@freshmart.com',
          role: decoded.role || (decoded.id === 'admin-root' ? 'admin' : 'customer'),
          staffId: decoded.staffId,
          riderId: decoded.riderId,
          tenantId: isSuper ? (tenantHeader || decoded.tenantId) : decoded.tenantId,
          branchId: decoded.branchId || 'branch_001',
          branchName: decoded.branchName || 'Main Branch',
          vendorId: decoded.vendorId || (decoded.role === 'vendor' || decoded.role === 'supplier' ? (decoded.id || 'VND-101') : undefined)
        };
        return next();
      }

      return res.status(401).json({ success: false, message: 'Not authorized: User not found' });
    } catch (error) {
      console.error('JWT Auth Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  }

  // Fallback direct admin role header support (only permitted when demo/test auth is active)
  const adminRoleHeader = req?.headers ? req.headers['x-admin-role'] : null;
  if (isDemoAllowed() && adminRoleHeader && ['admin', 'superadmin', 'pickup_staff', 'store admin'].includes(adminRoleHeader.toLowerCase())) {
    const isSuper = adminRoleHeader.toLowerCase() === 'superadmin';
    const isPickup = adminRoleHeader.toLowerCase() === 'pickup_staff';
    req.user = {
      _id: isSuper ? 'superadmin-root' : 'admin-root',
      id: isSuper ? 'superadmin-root' : 'admin-root',
      name: isSuper ? 'Platform Super Admin' : (isPickup ? 'Pickup Staff' : 'Store Admin'),
      email: isSuper ? 'superadmin@supergrocery.pk' : 'admin@freshmart.pk',
      role: isSuper ? 'superadmin' : (isPickup ? 'pickup_staff' : 'admin'),
      tenantId: tenantHeader || 'tenant-alfatah',
      branchId: 'branch_001',
      branchName: 'Main Branch'
    };
    return next();
  }

  return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
};

// Admin Only Guard: Admits only Store Admin and Platform Super Admin (Pickup Staff is NOT admitted)
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized: No session' });
  }

  const userRole = (req.user.role || '').toLowerCase();
  if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'store admin') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
};

// Super Admin Only Guard: Admits only Platform Super Admin
export const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized: No session' });
  }

  const userRole = (req.user.role || '').toLowerCase();
  if (userRole === 'superadmin' || req.user.isSuperAdmin) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Access denied: Super Admin privileges required' });
};

// Staff or Admin Guard: Admits Store Admin, Super Admin, Pickup Staff, and Field Staff
export const staffOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized: No session' });
  }

  const userRole = (req.user.role || '').toLowerCase();
  if (['admin', 'superadmin', 'store admin', 'pickup_staff', 'staff'].includes(userRole)) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Access denied: Staff or Admin privileges required' });
};

// Custom Role Guard Factory
export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized: No session' });
  }

  const userRole = (req.user.role || '').toLowerCase();
  const allowed = roles.map((r) => r.toLowerCase());
  if (allowed.includes(userRole)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: `Access denied: Requires one of [${roles.join(', ')}]`
  });
};

// Tenant Access Guard: Ensures non-superadmin users only access their own store resources
export const requireTenantAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  if (req.user.role === 'superadmin' || req.user.isSuperAdmin) {
    return next();
  }

  const requestedTenant = resolveTenantId(
    req.params.tenantId || req.params.id || req.body?.tenantId || req.query?.tenantId || req.headers['x-tenant-id']
  );
  const userTenant = resolveTenantId(req.user.tenantId);

  if (!requestedTenant || isSameTenant(requestedTenant, userTenant)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: `Access denied: Cross-tenant access violation. Store [${userTenant}] cannot access [${requestedTenant}]`
  });
};

// Vendor Access & IDOR Protection Middleware
export const protectVendor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized, no user context' });
  }

  const role = req.user.role;
  const isAllowedRole = role === 'admin' || role === 'superadmin' || role === 'vendor' || role === 'supplier';
  if (!isAllowedRole) {
    return res.status(403).json({ success: false, message: 'Access denied: Vendor or Admin privileges required' });
  }

  if (role === 'admin' || role === 'superadmin') {
    return next();
  }

  const userVendorId = req.user.vendorId || req.user.id || 'VND-101';
  const targetVendorId = req.query.vendorId || req.body?.vendorId || req.params?.vendorId;

  if (targetVendorId && targetVendorId.toUpperCase() !== userVendorId.toUpperCase()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You cannot access or modify another vendor\'s resources'
    });
  }

  req.user.vendorId = userVendorId;
  return next();
};
