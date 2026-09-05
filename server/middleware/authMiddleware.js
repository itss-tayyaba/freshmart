import jwt from 'jsonwebtoken';
import { isDbOnline } from '../config/db.js';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'freshmart_secret_key_2026');

      if (isDbOnline() && decoded.id) {
        try {
          const dbUser = await User.findById(decoded.id).select('-password');
          if (dbUser) {
            req.user = dbUser;
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
          name: decoded.name || 'Store Admin',
          email: decoded.email || 'admin@freshmart.com',
          role: decoded.role || (decoded.id === 'admin-root' ? 'admin' : 'customer')
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
