import { isDbOnline } from '../config/db.js';
import { User } from '../models/User.js';

const getBranchId = (req) => {
  if (req.user?.role === 'admin') return req.user.branchId || '';
  if (req.user?.role === 'superadmin') return String(req.query.branchId || req.body.branchId || '');
  return '';
};

const serializePickupStaff = (staff) => ({
  id: String(staff._id),
  name: staff.name,
  email: staff.email,
  phone: staff.phone || '',
  branchId: staff.branchId,
  isActive: staff.isActive !== false
});

export const getPickupStaff = async (req, res) => {
  if (!isDbOnline()) {
    return res.status(503).json({ success: false, message: 'Pickup staff accounts require a database connection' });
  }

  try {
    const branchId = getBranchId(req);
    if (!branchId) {
      return res.status(400).json({ success: false, message: 'A branch must be selected to view pickup staff' });
    }
    const staff = await User.find({ role: 'pickupstaff', branchId })
      .select('name email phone branchId isActive')
      .sort({ name: 1 });
    return res.json({ success: true, staff: staff.map(serializePickupStaff) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPickupStaff = async (req, res) => {
  if (!isDbOnline()) {
    return res.status(503).json({ success: false, message: 'Pickup staff accounts require a database connection' });
  }

  try {
    const branchId = getBranchId(req);
    if (!branchId) {
      return res.status(400).json({ success: false, message: 'A branch must be selected to create pickup staff' });
    }

    const staff = await User.create({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      password: req.body.password,
      phone: req.body.phone || '',
      role: 'pickupstaff',
      tenantId: req.user.role === 'admin' ? req.user.tenantId : (req.body.tenantId || 'tenant-freshmart'),
      branchId,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Pickup staff account created',
      staff: serializePickupStaff(staff)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
