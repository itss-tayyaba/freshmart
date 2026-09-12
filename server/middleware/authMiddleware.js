import jwt from 'jsonwebtoken';
import { isDbOnline } from '../config/db.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Supplier } from '../models/ExtraModels.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'freshmart_secret_key_2026');

      if (isDbOnline() && decoded.id && typeof decoded.id === 'string' && decoded.id.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          // Check User model
          const dbUser = await User.findById(decoded.id).select('-password');
          if (dbUser) {
            req.user = dbUser.toObject ? dbUser.toObject() : { ...dbUser };
            req.user.id = String(dbUser._id);
            req.user.vendorId = decoded.vendorId || dbUser.vendorId;
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
        } catch (dbErr) {
          console.warn('DB lookup in auth middleware:', dbErr.message);
        }
      }

      // If DB is offline or user was encoded with role
      if (decoded.role || decoded.id) {
        req.user = {
          _id: decoded.id || 'admin-root',
          id: decoded.id || 'admin-root',
          name: decoded.name || 'Store User',
          email: decoded.email || 'user@freshmart.com',
          role: decoded.role || (decoded.id === 'admin-root' ? 'admin' : 'customer'),
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

  return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
};

export const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
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

  // If Admin / Superadmin, full marketplace access is permitted
  if (role === 'admin' || role === 'superadmin') {
    return next();
  }

  // For Vendors / Suppliers: Enforce IDOR protection
  const userVendorId = req.user.vendorId || req.user.id || 'VND-101';
  const targetVendorId = req.query.vendorId || req.body?.vendorId || req.params?.vendorId;

  if (targetVendorId && targetVendorId.toUpperCase() !== userVendorId.toUpperCase()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You cannot access or modify another vendor\'s resources'
    });
  }

  // Attach verified vendorId to req.user for downstream controllers
  req.user.vendorId = userVendorId;
  return next();
};

