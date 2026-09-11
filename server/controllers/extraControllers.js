import { isDbOnline } from '../config/db.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Supplier, Promotion, Delivery, Rider } from '../models/ExtraModels.js';
import {
  ADMIN_STATS,
  ADMIN_TOP_PRODUCTS,
  ADMIN_RECENT_ORDERS
} from '../../src/data/freshMartData.js';
import {
  ADMIN_INVENTORY_ITEMS,
  ADMIN_CUSTOMERS_DATA,
  ADMIN_SUPPLIERS_DATA,
  ADMIN_PROMOTIONS_DATA,
  ADMIN_DELIVERIES_DATA,
  ADMIN_REPORTS_BEHAVIOR,
  ADMIN_ANALYTICS_KPIS,
  ADMIN_DAILY_SALES_CHART,
  ADMIN_MONTHLY_SALES_CHART,
  ADMIN_BEST_SELLING_PRODUCTS,
  ADMIN_MOST_PROFITABLE_PRODUCTS,
  ADMIN_BRANCH_PERFORMANCE,
  ADMIN_CUSTOMER_GROWTH_CHART,
  ADMIN_CANCELLED_ORDERS_ANALYTICS,
  ADMIN_DELIVERY_PERFORMANCE
} from '../../src/data/adminSuiteData.js';

// In-Memory state fallback
let memorySuppliers = Array.isArray(ADMIN_SUPPLIERS_DATA) ? [...ADMIN_SUPPLIERS_DATA] : [];
let memoryRiders = [];
let memoryPromotions = Array.isArray(ADMIN_PROMOTIONS_DATA) ? [...ADMIN_PROMOTIONS_DATA] : [];

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
    res.json({ success: true, count: ADMIN_CUSTOMERS_DATA.length, customers: ADMIN_CUSTOMERS_DATA });
  } catch (error) {
    res.json({ success: true, count: ADMIN_CUSTOMERS_DATA.length, customers: ADMIN_CUSTOMERS_DATA });
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
      const createdSupplier = await Supplier.create(newSup);
      return res.status(201).json({
        success: true,
        supplier: {
          id: createdSupplier.supplierId || createdSupplier._id.toString(),
          supplierId: createdSupplier.supplierId,
          name: createdSupplier.name,
          contact: createdSupplier.contact,
          phone: createdSupplier.phone,
          email: createdSupplier.email,
          category: createdSupplier.category,
          username: createdSupplier.username,
          status: createdSupplier.status
        }
      });
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
      const createdRider = await Rider.create(newRider);
      return res.status(201).json({
        success: true,
        rider: {
          id: createdRider.id,
          name: createdRider.name,
          phone: createdRider.phone,
          vehicleType: createdRider.vehicleType,
          vehicleNumber: createdRider.vehicleNumber,
          zone: createdRider.zone,
          status: createdRider.status,
          username: createdRider.username,
          deliveriesCount: createdRider.deliveriesCount,
          rating: createdRider.rating
        }
      });
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

// --- PROMOTIONS & COUPONS CONTROLLER ---
export const getPromotions = async (req, res) => {
  try {
    if (isDbOnline()) {
      const promos = await Promotion.find({}).sort({ createdAt: -1 });
      if (promos && promos.length > 0) {
        return res.json({ success: true, promotions: promos });
      }
    }
    res.json({ success: true, promotions: memoryPromotions });
  } catch (error) {
    res.json({ success: true, promotions: memoryPromotions });
  }
};

export const createPromotion = async (req, res) => {
  try {
    const {
      code,
      title,
      discountType = 'percentage',
      discountAmount,
      minOrder = 0,
      maxDiscount = 0,
      startDate = new Date(),
      endDate,
      usageLimit = 0,
      category = 'Coupons',
      bannerImg = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      status = 'Active'
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanAmount = Number(discountAmount || 0);

    const promoData = {
      code: cleanCode,
      title: title?.trim() || `${cleanAmount}${discountType === 'percentage' ? '%' : ' Rs.'} OFF Coupon`,
      discountType,
      discountAmount: cleanAmount,
      discountPercent: discountType === 'percentage' ? cleanAmount : 0,
      flatAmount: discountType === 'fixed' ? cleanAmount : 0,
      minOrder: Number(minOrder || 0),
      minSpend: Number(minOrder || 0),
      maxDiscount: Number(maxDiscount || 0),
      startDate: startDate ? new Date(startDate) : new Date(),
      validFrom: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      validTo: endDate ? new Date(endDate) : null,
      usageLimit: Number(usageLimit || 0),
      usedCount: 0,
      category,
      bannerImg,
      status: status || 'Active',
      freeShipping: discountType === 'free_shipping'
    };

    if (isDbOnline()) {
      const existing = await Promotion.findOne({ code: cleanCode });
      if (existing) {
        return res.status(400).json({ success: false, message: `Coupon code "${cleanCode}" already exists` });
      }
      const newPromo = await Promotion.create(promoData);
      return res.status(201).json({ success: true, message: 'Coupon created successfully', promotion: newPromo });
    }

    const newId = `promo-${Date.now()}`;
    const memPromo = { id: newId, _id: newId, ...promoData };
    memoryPromotions.unshift(memPromo);
    res.status(201).json({ success: true, message: 'Coupon created successfully', promotion: memPromo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.code) {
      updateData.code = updateData.code.trim().toUpperCase();
    }
    if (updateData.discountAmount !== undefined) {
      updateData.discountAmount = Number(updateData.discountAmount);
      if (updateData.discountType === 'percentage') {
        updateData.discountPercent = updateData.discountAmount;
      } else if (updateData.discountType === 'fixed') {
        updateData.flatAmount = updateData.discountAmount;
      }
    }
    if (updateData.minOrder !== undefined) {
      updateData.minOrder = Number(updateData.minOrder);
      updateData.minSpend = updateData.minOrder;
    }
    if (updateData.maxDiscount !== undefined) {
      updateData.maxDiscount = Number(updateData.maxDiscount);
    }
    if (updateData.usageLimit !== undefined) {
      updateData.usageLimit = Number(updateData.usageLimit);
    }
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
      updateData.validFrom = updateData.startDate;
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
      updateData.validTo = updateData.endDate;
    }

    if (isDbOnline()) {
      const query = { $or: [{ code: String(id).toUpperCase() }, { id: String(id) }] };
      if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: id });
      }
      const updated = await Promotion.findOneAndUpdate(query, updateData, { returnDocument: 'after' });
      if (updated) {
        return res.json({ success: true, message: 'Coupon updated successfully', promotion: updated });
      }
    }

    const idx = memoryPromotions.findIndex((p) => String(p.id || p._id) === String(id) || (p.code && p.code.toUpperCase() === String(id).toUpperCase()));
    if (idx !== -1) {
      memoryPromotions[idx] = { ...memoryPromotions[idx], ...updateData };
      return res.json({ success: true, message: 'Coupon updated successfully', promotion: memoryPromotions[idx] });
    }

    res.status(404).json({ success: false, message: 'Coupon not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbOnline()) {
      const query = { $or: [{ code: String(id).toUpperCase() }, { id: String(id) }] };
      if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: id });
      }
      await Promotion.findOneAndDelete(query);
    }
    memoryPromotions = memoryPromotions.filter((p) => String(p.id || p._id) !== String(id) && (!p.code || p.code.toUpperCase() !== String(id).toUpperCase()));
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const togglePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbOnline()) {
      const query = { $or: [{ code: String(id).toUpperCase() }, { id: String(id) }] };
      if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: id });
      }
      const promo = await Promotion.findOne(query);
      if (promo) {
        promo.status = promo.status === 'Active' ? 'Paused' : 'Active';
        await promo.save();
        return res.json({ success: true, status: promo.status, promotion: promo });
      }
    }
    const idx = memoryPromotions.findIndex((p) => String(p.id || p._id) === String(id) || (p.code && p.code.toUpperCase() === String(id).toUpperCase()));
    if (idx !== -1) {
      memoryPromotions[idx].status = memoryPromotions[idx].status === 'Active' ? 'Paused' : 'Active';
      return res.json({ success: true, status: memoryPromotions[idx].status, promotion: memoryPromotions[idx] });
    }
    res.status(404).json({ success: false, message: 'Coupon not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, cartSubtotal = 0 } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code' });
    }

    const c = code.toUpperCase().trim();
    let foundCoupon = null;

    if (isDbOnline()) {
      foundCoupon = await Promotion.findOne({ code: c });
    }
    if (!foundCoupon) {
      foundCoupon = memoryPromotions.find((p) => p.code && p.code.toUpperCase() === c);
    }

    // Standard built-in fallback coupons
    if (!foundCoupon) {
      if (c === 'WELCOME20' || c === 'FIRST20') {
        foundCoupon = {
          code: c,
          title: 'Welcome 20% Discount',
          discountType: 'percentage',
          discountAmount: 20,
          minOrder: 500,
          maxDiscount: 500,
          status: 'Active'
        };
      } else if (c === 'FRESH50') {
        foundCoupon = {
          code: 'FRESH50',
          title: 'Flat Rs. 50 OFF',
          discountType: 'fixed',
          discountAmount: 50,
          minOrder: 300,
          maxDiscount: 50,
          status: 'Active'
        };
      } else if (c === 'FREESHIP') {
        foundCoupon = {
          code: 'FREESHIP',
          title: 'Free Express Shipping',
          discountType: 'free_shipping',
          discountAmount: 0,
          minOrder: 800,
          maxDiscount: 0,
          freeShipping: true,
          status: 'Active'
        };
      }
    }

    if (!foundCoupon) {
      return res.status(404).json({ success: false, message: `Invalid coupon code "${c}". Please check spelling.` });
    }

    // 1. Status Check
    if (foundCoupon.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Coupon "${foundCoupon.code}" is currently ${foundCoupon.status.toLowerCase()} and cannot be used.`
      });
    }

    const now = new Date();

    // 2. Start Date Check
    const startDate = foundCoupon.startDate || foundCoupon.validFrom;
    if (startDate && now < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${foundCoupon.code}" is not active yet (scheduled to start on ${new Date(startDate).toLocaleDateString()}).`
      });
    }

    // 3. End Date Check
    const endDate = foundCoupon.endDate || foundCoupon.validTo;
    if (endDate && now > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${foundCoupon.code}" expired on ${new Date(endDate).toLocaleDateString()}.`
      });
    }

    // 4. Minimum Order Check
    const minOrder = Number(foundCoupon.minOrder || foundCoupon.minSpend || 0);
    const subtotal = Number(cartSubtotal || 0);
    if (minOrder > 0 && subtotal > 0 && subtotal < minOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of Rs. ${minOrder.toLocaleString()} is required to use coupon "${foundCoupon.code}". (Current subtotal: Rs. ${subtotal.toLocaleString()})`
      });
    }

    // 5. Usage Limit Check
    const usageLimit = Number(foundCoupon.usageLimit || 0);
    const usedCount = Number(foundCoupon.usedCount || 0);
    if (usageLimit > 0 && usedCount >= usageLimit) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${foundCoupon.code}" has reached its maximum usage limit of ${usageLimit} redemptions.`
      });
    }

    // 6. Calculate Final Discount with Maximum Discount Cap
    const discountType = foundCoupon.discountType || (foundCoupon.discountPercent ? 'percentage' : 'fixed');
    const discountAmount = Number(foundCoupon.discountAmount || foundCoupon.discountPercent || foundCoupon.flatAmount || 0);
    const maxDiscount = Number(foundCoupon.maxDiscount || 0);

    let calculatedDiscount = 0;
    let desc = '';

    if (discountType === 'percentage') {
      const rawPct = Math.round((subtotal * discountAmount) / 100);
      calculatedDiscount = maxDiscount > 0 ? Math.min(maxDiscount, rawPct) : rawPct;
      desc = `${discountAmount}% discount applied${maxDiscount > 0 ? ` (capped at Rs. ${maxDiscount.toLocaleString()})` : ''}!`;
    } else if (discountType === 'fixed') {
      calculatedDiscount = subtotal > 0 ? Math.min(subtotal, discountAmount) : discountAmount;
      desc = `Flat Rs. ${discountAmount.toLocaleString()} discount applied!`;
    } else if (discountType === 'free_shipping' || foundCoupon.freeShipping) {
      calculatedDiscount = 0;
      desc = 'Free Express Delivery applied!';
    }

    const couponObj = {
      code: foundCoupon.code,
      title: foundCoupon.title || `${discountAmount}${discountType === 'percentage' ? '%' : ' Rs.'} OFF`,
      discountType,
      discountAmount,
      discountPercent: discountType === 'percentage' ? discountAmount : 0,
      amount: calculatedDiscount,
      minOrder,
      maxDiscount,
      freeShipping: discountType === 'free_shipping' || !!foundCoupon.freeShipping,
      startDate: startDate || null,
      endDate: endDate || null,
      usageLimit,
      usedCount,
      description: desc
    };

    return res.json({
      success: true,
      discount: calculatedDiscount,
      coupon: couponObj,
      promotion: couponObj
    });
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
    let kpis = { ...ADMIN_ANALYTICS_KPIS };
    let recentOrders = ADMIN_RECENT_ORDERS;
    let topProducts = ADMIN_BEST_SELLING_PRODUCTS;

    if (isDbOnline()) {
      try {
        const [productCount, userCount, orderCount, lowStockCount, ordersAgg] = await Promise.all([
          Product.countDocuments(),
          User.countDocuments(),
          Order.countDocuments(),
          Product.countDocuments({ stock: { $lte: 15 } }),
          Order.aggregate([{ $group: { _id: null, totalSales: { $sum: "$total" } } }])
        ]);

        const totalRevenue = ordersAgg?.[0]?.totalSales || 0;

        kpis.products.count = productCount;
        kpis.products.formatted = productCount.toLocaleString();

        kpis.customers.count = userCount;
        kpis.customers.formatted = userCount.toLocaleString();

        kpis.orders.count = orderCount;
        kpis.orders.formatted = orderCount.toLocaleString();

        kpis.lowStock.count = lowStockCount;
        kpis.lowStock.formatted = lowStockCount.toLocaleString();

        if (totalRevenue > 0) {
          kpis.todaySales.amount = totalRevenue;
          kpis.todaySales.formatted = `Rs. ${totalRevenue.toLocaleString()}`;
        }
      } catch (dbErr) {
        console.warn('Analytics DB count error:', dbErr.message);
      }
    }

    res.json({
      success: true,
      kpis,
      stats: {
        todaySales: kpis.todaySales,
        orders: kpis.orders,
        customers: kpis.customers,
        products: kpis.products,
        lowStock: kpis.lowStock
      },
      charts: {
        dailySales: ADMIN_DAILY_SALES_CHART,
        monthlySales: ADMIN_MONTHLY_SALES_CHART,
        bestSellingProducts: ADMIN_BEST_SELLING_PRODUCTS,
        mostProfitableProducts: ADMIN_MOST_PROFITABLE_PRODUCTS,
        branchPerformance: ADMIN_BRANCH_PERFORMANCE,
        customerGrowth: ADMIN_CUSTOMER_GROWTH_CHART,
        cancelledOrders: ADMIN_CANCELLED_ORDERS_ANALYTICS,
        deliveryPerformance: ADMIN_DELIVERY_PERFORMANCE
      },
      topProducts,
      recentOrders,
      customerBehavior: ADMIN_REPORTS_BEHAVIOR
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
