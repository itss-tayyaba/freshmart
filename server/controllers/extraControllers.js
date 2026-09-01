import { isDbOnline } from '../config/db.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Supplier, Promotion, Delivery } from '../models/ExtraModels.js';
import {
  ADMIN_STATS,
  ADMIN_TOP_PRODUCTS,
  ADMIN_RECENT_ORDERS
} from '../../src/data/freshMartData.js';
import {
  ADMIN_CUSTOMERS_DATA,
  ADMIN_INVENTORY_ITEMS,
  ADMIN_SUPPLIERS_DATA,
  ADMIN_PROMOTIONS_DATA,
  ADMIN_DELIVERIES_DATA,
  ADMIN_REPORTS_BEHAVIOR
} from '../../src/data/adminSuiteData.js';

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
      const customers = await User.find({ role: 'customer' }).select('-password');
      if (customers && customers.length > 0) {
        return res.json({ success: true, count: customers.length, customers });
      }
    }
    res.json({ success: true, count: ADMIN_CUSTOMERS_DATA.length, customers: ADMIN_CUSTOMERS_DATA });
  } catch (error) {
    res.json({ success: true, count: ADMIN_CUSTOMERS_DATA.length, customers: ADMIN_CUSTOMERS_DATA });
  }
};

export const addCustomer = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (isDbOnline()) {
      const user = await User.create({
        name,
        email,
        phone,
        password: 'password123',
        role: 'customer'
      });
      return res.status(201).json({ success: true, customer: user });
    }

    const newCust = {
      id: `CUST-0${ADMIN_CUSTOMERS_DATA.length + 1}`,
      name,
      email,
      phone: phone || '0300-0000000',
      totalOrders: 1,
      totalSpent: 'Rs. 0',
      status: 'Active'
    };
    ADMIN_CUSTOMERS_DATA.unshift(newCust);
    res.status(201).json({ success: true, customer: newCust });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SUPPLIERS CONTROLLER ---
export const getSuppliers = async (req, res) => {
  try {
    if (isDbOnline()) {
      const suppliers = await Supplier.find({});
      if (suppliers && suppliers.length > 0) {
        return res.json({ success: true, suppliers });
      }
    }
    res.json({ success: true, suppliers: ADMIN_SUPPLIERS_DATA });
  } catch (error) {
    res.json({ success: true, suppliers: ADMIN_SUPPLIERS_DATA });
  }
};

export const addSupplier = async (req, res) => {
  try {
    const { name, contactPerson, phone, email } = req.body;
    if (isDbOnline()) {
      const supplierId = 'SUP-' + Math.floor(10 + Math.random() * 90);
      const supplier = await Supplier.create({
        supplierId,
        name,
        contactPerson: contactPerson || name,
        phone,
        email
      });
      return res.status(201).json({ success: true, supplier });
    }

    const newSup = {
      id: `SUP-0${ADMIN_SUPPLIERS_DATA.length + 1}`,
      name,
      contact: contactPerson || name,
      phone,
      email,
      status: 'Active'
    };
    ADMIN_SUPPLIERS_DATA.unshift(newSup);
    res.status(201).json({ success: true, supplier: newSup });
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
