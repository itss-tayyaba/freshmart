import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { isDbOnline } from '../config/db.js';

const generateToken = (id, role = 'customer', email = '', name = '') => {
  return jwt.sign(
    { id, role, email, name },
    process.env.JWT_SECRET || 'freshmart_secret_key_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (isDbOnline()) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      const user = await User.create({
        name,
        email,
        password,
        phone: phone || '',
        address: address || '123 Main Street, Lahore, Pakistan',
        role: 'customer'
      });

      if (user) {
        return res.status(201).json({
          success: true,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          address: user.address,
          phone: user.phone,
          token: generateToken(user._id, user.role, user.email, user.name)
        });
      }
    }

    // Fallback registration response
    const mockId = `usr-${Date.now()}`;
    return res.status(201).json({
      success: true,
      _id: mockId,
      name,
      email,
      role: 'customer',
      address: address || '123 Main Street, Lahore, Pakistan',
      phone: phone || '',
      token: generateToken(mockId, 'customer', email, name)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/username and password' });
    }

    const cleanInput = email.toLowerCase().trim();

    if (isDbOnline()) {
      const user = await User.findOne({
        $or: [
          { email: cleanInput },
          { name: new RegExp(`^${cleanInput}$`, 'i') },
          ...(cleanInput === 'admin' ? [{ role: 'admin' }] : [])
        ]
      });

      if (user) {
        const isMatch = await user.matchPassword(password);
        // Allow default admin password variations if role is admin
        const isAdminFallback = user.role === 'admin' && (password === 'admin123' || password === 'adminpassword123');

        if (isMatch || isAdminFallback) {
          return res.json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            address: user.address,
            phone: user.phone,
            token: generateToken(user._id, user.role, user.email, user.name)
          });
        }
      }
    }

    // Default admin login credentials fallback (e.g., admin / admin123)
    if (
      (cleanInput === 'admin' || cleanInput === 'admin@freshmart.com' || cleanInput === 'admin@freshmart.pk') &&
      (password === 'admin123' || password === 'adminpassword123')
    ) {
      return res.json({
        success: true,
        _id: 'admin-root',
        name: 'Super Admin',
        email: 'admin@freshmart.com',
        role: 'admin',
        token: generateToken('admin-root', 'admin', 'admin@freshmart.com', 'Super Admin')
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
export const getUserProfile = async (req, res) => {
  try {
    if (isDbOnline() && req.user && req.user._id) {
      const user = await User.findById(req.user._id);
      if (user) {
        return res.json({
          success: true,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address
        });
      }
    }

    if (req.user) {
      return res.json({
        success: true,
        _id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        address: req.user.address
      });
    }

    return res.status(404).json({ success: false, message: 'User not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
