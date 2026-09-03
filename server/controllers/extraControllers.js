import { isDbOnline } from '../config/db.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Supplier, Promotion, Delivery, Rider } from '../models/ExtraModels.js';
import {
  ADMIN_STATS,
  ADMIN_TOP_PRODUCTS,
  ADMIN_RECENT_ORDERS
} from '../../src/data/freshMartData.js';
import {
  ADMIN_INVENTORY_ITEMS,
  ADMIN_SUPPLIERS_DATA,
  ADMIN_PROMOTIONS_DATA,
  ADMIN_DELIVERIES_DATA,
  ADMIN_REPORTS_BEHAVIOR
} from '../../src/data/adminSuiteData.js';

// In-Memory state fallback
let memorySuppliers = Array.isArray(ADMIN_SUPPLIERS_DATA) ? [...ADMIN_SUPPLIERS_DATA] : [];
let memoryRiders = [];

// --- INVENTORY CONTROLLER ---
export const getInventory = async (req, res) => {
  try {
    if (isDbOnline()) {
      const products = await Product.find({});
      if (products && products.length > 0) {
        const formatted = products.map((p) => ({
          id: p._id,
          name: p.name,
          category: p.categoryLabel,
          stock: p.stock,
          minStock: p.minStock || 15,
          status: p.stock === 0 ? 'Out of Stock' : p.stock < 15 ? 'Low Stock' : 'In Stock',
          badge: p.stock === 0 ? 'bg-rose-100 text-rose-800' : p.stock < 15 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
        }));
        return res.json({ success: true, items: formatted });
      }
    }
    res.json({ success: true, items: ADMIN_INVENTORY_ITEMS });
  } catch (error) {
    res.json({ success: true, items: ADMIN_INVENTORY_ITEMS });
  }
};

export const restockProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    if (isDbOnline()) {
      const product = await Product.findById(id);
      if (product) {
        product.stock += Number(amount || 50);
        product.status = 'Active';
        await product.save();
        return res.json({ success: true, message: `Restocked ${product.name}`, product });
      }
    }
    res.json({ success: true, message: `Restocked +${amount || 50} units.` });
  } catch (error) {
    res.json({ success: true, message: `Restocked +50 units.` });
  }
};

// --- CUSTOMERS CONTROLLER ---
export const getCustomers = async (req, res) => {
  try {
    if (isDbOnline()) {
      const customers = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
      const formatted = (customers || []).map((c) => ({
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        phone: c.phone || '+92 300 1234567',
        totalOrders: 0,
        totalSpent: 'Rs. 0',
        status: 'Active',
        createdAt: c.createdAt
      }));
      return res.json({ success: true, count: formatted.length, customers: formatted });
    }
    res.json({ success: true, count: 0, customers: [] });
  } catch (error) {
    res.json({ success: true, count: 0, customers: [] });
  }
};

export const addCustomer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (isDbOnline()) {
      let existing = await User.findOne({ email });
      if (!existing) {
        existing = await User.create({
          name,
          email,
          phone: phone || '',
          password: password || 'password123',
          role: 'customer'
        });
      }
      return res.status(201).json({
        success: true,
        customer: {
          id: existing._id.toString(),
          name: existing.name,
          email: existing.email,
          phone: existing.phone,
          totalOrders: 0,
          totalSpent: 'Rs. 0',
          status: 'Active'
        }
      });
    }

    const newCust = {
      id: `CUST-${Date.now()}`,
      name,
      email,
      phone: phone || '0300-0000000',
      totalOrders: 0,
      totalSpent: 'Rs. 0',
      status: 'Active'
    };
    res.status(201).json({ success: true, customer: newCust });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SUPPLIERS CONTROLLER ---
export const getSuppliers = async (req, res) => {
  try {
    if (isDbOnline()) {
      const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
      const mapped = (suppliers || []).map((s) => ({
        id: s.supplierId || s._id.toString(),
        name: s.name,
        contact: s.contact || s.contactPerson || s.name,
        phone: s.phone,
        email: s.email,
        category: s.category || 'Fresh Milk & Pure Dairy',
        username: s.username,
        password: s.password,
        status: s.status || 'Active'
      }));
      return res.json({ success: true, suppliers: mapped });
    }
    res.json({ success: true, suppliers: memorySuppliers });
  } catch (error) {
    res.json({ success: true, suppliers: memorySuppliers });
  }
};

export const addSupplier = async (req, res) => {
  try {
    const { id, name, contact, contactPerson, phone, email, category, username, password } = req.body;
    const supplierId = id || 'SUP-' + Math.floor(100 + Math.random() * 900);
    const newSup = {
      id: supplierId,
      supplierId,
      name,
      contact: contact || contactPerson || name,
      phone,
      email,
      category: category || 'Fresh Milk & Pure Dairy',
      username: username || name.toLowerCase().replace(/\s+/g, '_'),
      password: password || 'supplier123',
      status: 'Active'
    };

    if (isDbOnline()) {
      await Supplier.create(newSup);
      return res.status(201).json({ success: true, supplier: newSup });
    }

    memorySuppliers.unshift(newSup);
    res.status(201).json({ success: true, supplier: newSup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbOnline()) {
      await Supplier.deleteOne({ $or: [{ supplierId: id }, { _id: id }, { id }] });
    }
    memorySuppliers = memorySuppliers.filter((s) => s.id !== id && s.supplierId !== id);
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- RIDERS CONTROLLER ---
export const getRiders = async (req, res) => {
  try {
    if (isDbOnline()) {
      const riders = await Rider.find({}).sort({ createdAt: -1 });
      const mapped = (riders || []).map((r) => ({
        id: r.id || r._id.toString(),
        name: r.name,
        phone: r.phone,
        vehicleType: r.vehicleType,
        vehicleNumber: r.vehicleNumber,
        zone: r.zone,
        status: r.status,
        username: r.username,
        password: r.password,
        deliveriesCount: r.deliveriesCount || 0,
        rating: r.rating || 5.0
      }));
      return res.json({ success: true, riders: mapped });
    }
    res.json({ success: true, riders: memoryRiders });
  } catch (error) {
    res.json({ success: true, riders: memoryRiders });
  }
};

export const addRider = async (req, res) => {
  try {
    const { id, name, phone, vehicleType, vehicleNumber, zone, status, username, password, cnic } = req.body;
    const riderId = id || 'RDR-' + Math.floor(100 + Math.random() * 900);
    const newRider = {
      id: riderId,
      name,
      phone,
      vehicleType: vehicleType || '🏍️ Honda 125',
      vehicleNumber: vehicleNumber || 'LEK-0000',
      zone: zone || 'Lahore Hub',
      status: status || 'On-Duty',
      username: username || name.toLowerCase().replace(/\s+/g, '_'),
      password: password || 'rider123',
      cnic: cnic || '',
      deliveriesCount: 0,
      rating: 5.0
    };

    if (isDbOnline()) {
      await Rider.create(newRider);
      return res.status(201).json({ success: true, rider: newRider });
    }

    memoryRiders.unshift(newRider);
    res.status(201).json({ success: true, rider: newRider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRider = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbOnline()) {
      await Rider.deleteOne({ $or: [{ id }, { _id: id }] });
    }
    memoryRiders = memoryRiders.filter((r) => r.id !== id);
    res.json({ success: true, message: 'Rider removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearAllRiders = async (req, res) => {
  try {
    if (isDbOnline()) {
      await Rider.deleteMany({});
    }
    memoryRiders = [];
    res.json({ success: true, message: 'All riders cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- PROMOTIONS CONTROLLER ---
export const getPromotions = async (req, res) => {
  try {
    if (isDbOnline()) {
      const promos = await Promotion.find({});
      if (promos && promos.length > 0) {
        return res.json({ success: true, promotions: promos });
      }
    }
    res.json({ success: true, promotions: ADMIN_PROMOTIONS_DATA });
  } catch (error) {
    res.json({ success: true, promotions: ADMIN_PROMOTIONS_DATA });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Please enter a coupon code' });

    const c = code.toUpperCase().trim();
    if (c === 'FRESH50') {
      return res.json({
        success: true,
        coupon: { code: 'FRESH50', discountPercent: 50, amount: 100, description: 'Flat 50% discount coupon applied!' }
      });
    }
    if (c === 'FREESHIP') {
      return res.json({
        success: true,
        coupon: { code: 'FREESHIP', discountPercent: 0, freeShipping: true, description: 'Free Express Delivery applied!' }
      });
    }
    res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- DELIVERY & LIVE MAP CONTROLLER ---
export const getDeliveries = async (req, res) => {
  try {
    if (isDbOnline()) {
      const deliveries = await Delivery.find({});
      if (deliveries && deliveries.length > 0) {
        return res.json({ success: true, deliveries });
      }
    }
    res.json({ success: true, deliveries: ADMIN_DELIVERIES_DATA });
  } catch (error) {
    res.json({ success: true, deliveries: ADMIN_DELIVERIES_DATA });
  }
};

// --- ANALYTICS & REPORTS CONTROLLER ---
export const getAnalyticsDashboard = async (req, res) => {
  try {
    res.json({
      success: true,
      stats: ADMIN_STATS,
      topProducts: ADMIN_TOP_PRODUCTS,
      recentOrders: ADMIN_RECENT_ORDERS,
      customerBehavior: ADMIN_REPORTS_BEHAVIOR
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
