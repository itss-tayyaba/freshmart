import {
  COMPANIES,
  BRANCHES,
  PRODUCTS,
  INVENTORY,
  ORDERS,
  resolveTenantId,
  getBranchesByTenant,
  getProductsByTenant,
  getInventoryByBranch,
  getOrdersByBranch,
  updateBranchInventory as updateMemInventory
} from '../../src/data/companyHierarchyData.js';
import { Branch } from '../models/Branch.js';
import { Inventory } from '../models/Inventory.js';
import { Company } from '../models/Company.js';
import { Order } from '../models/Order.js';
import { isDbOnline } from '../config/db.js';

// @desc    Get all companies (Super Admin & Platform)
// @route   GET /api/companies
export const getCompanies = async (req, res) => {
  try {
    if (isDbOnline()) {
      try {
        const dbCompanies = await Company.find({ status: 'active' });
        if (dbCompanies && dbCompanies.length > 0) {
          return res.json({ success: true, count: dbCompanies.length, companies: dbCompanies });
        }
      } catch (e) {
        console.warn('Company DB lookup fallback:', e.message);
      }
    }
    return res.json({
      success: true,
      count: COMPANIES.length,
      companies: COMPANIES
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get branches for a specific company
// @route   GET /api/companies/:tenantId/branches
export const getCompanyBranches = async (req, res) => {
  try {
    const rawTenantId = req.params.tenantId || req.tenantId;
    const canonicalTenantId = resolveTenantId(rawTenantId);

    if (isDbOnline()) {
      try {
        const dbBranches = await Branch.find({ tenantId: canonicalTenantId, status: 'active' });
        if (dbBranches && dbBranches.length > 0) {
          return res.json({ success: true, count: dbBranches.length, branches: dbBranches });
        }
      } catch (e) {
        console.warn('Branch DB lookup fallback:', e.message);
      }
    }

    const branches = getBranchesByTenant(canonicalTenantId);
    return res.json({
      success: true,
      tenantId: canonicalTenantId,
      count: branches.length,
      branches
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get inventory for a specific branch
// @route   GET /api/branches/:branchId/inventory
export const getBranchInventory = async (req, res) => {
  try {
    const { branchId } = req.params;
    const branch = BRANCHES.find((b) => b._id === branchId || b.id === branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: `Branch ${branchId} not found` });
    }

    if (isDbOnline()) {
      try {
        const dbInventory = await Inventory.find({ branchId });
        if (dbInventory && dbInventory.length > 0) {
          return res.json({ success: true, branchId, count: dbInventory.length, inventory: dbInventory });
        }
      } catch (e) {
        console.warn('Inventory DB lookup fallback:', e.message);
      }
    }

    const inventory = getInventoryByBranch(branch.tenantId, branch._id);
    return res.json({
      success: true,
      tenantId: branch.tenantId,
      branchId: branch._id,
      branchName: branch.name,
      count: inventory.length,
      inventory
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update stock or price for a branch inventory item
// @route   PUT /api/branches/:branchId/inventory/:productId
export const updateBranchInventory = async (req, res) => {
  try {
    const { branchId, productId } = req.params;
    const { stock, price } = req.body;

    const branch = BRANCHES.find((b) => b._id === branchId || b.id === branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: `Branch ${branchId} not found` });
    }

    const updated = updateMemInventory(branch.tenantId, branch._id, productId, { stock, price });
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Inventory record for product ${productId} at branch ${branchId} not found`
      });
    }

    if (isDbOnline()) {
      try {
        await Inventory.findOneAndUpdate(
          { tenantId: branch.tenantId, branchId: branch._id, productId },
          { $set: { stock: updated.stock, price: updated.price, status: updated.status } },
          { upsert: true }
        );
      } catch (e) {
        console.warn('Inventory DB update error:', e.message);
      }
    }

    return res.json({
      success: true,
      message: 'Branch inventory updated successfully',
      inventory: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get orders for a specific branch
// @route   GET /api/branches/:branchId/orders
export const getBranchOrders = async (req, res) => {
  try {
    const { branchId } = req.params;
    const branch = BRANCHES.find((b) => b._id === branchId || b.id === branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: `Branch ${branchId} not found` });
    }

    if (isDbOnline()) {
      try {
        const dbOrders = await Order.find({ branchId }).sort({ createdAt: -1 });
        if (dbOrders && dbOrders.length > 0) {
          return res.json({ success: true, branchId, count: dbOrders.length, orders: dbOrders });
        }
      } catch (e) {
        console.warn('Order DB lookup fallback:', e.message);
      }
    }

    const orders = getOrdersByBranch(branch.tenantId, branch._id);
    return res.json({
      success: true,
      tenantId: branch.tenantId,
      branchId: branch._id,
      branchName: branch.name,
      count: orders.length,
      orders
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create an order routed to a specific branch
// @route   POST /api/branches/:branchId/orders
export const createBranchOrder = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { customerId, customerName, customerPhone, items, total, status } = req.body;

    const branch = BRANCHES.find((b) => b._id === branchId || b.id === branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: `Branch ${branchId} not found` });
    }

    const newOrder = {
      _id: `order_${Date.now()}`,
      orderId: `ORD-${branch.tenantId.slice(-3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      tenantId: branch.tenantId,
      branchId: branch._id,
      customerId: customerId || 'customer_anon',
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone || '+92 300 0000000',
      items: Array.isArray(items) ? items : [],
      total: Number(total) || 0,
      status: status || 'preparing',
      createdAt: new Date().toISOString()
    };

    ORDERS.unshift(newOrder);

    // Automatically deduct branch inventory stock for ordered items
    for (const item of newOrder.items) {
      const prodId = item.productId || item._id || item.id;
      const qty = Number(item.quantity || 1);
      const inv = INVENTORY.find(
        (i) => i.tenantId === branch.tenantId && i.branchId === branch._id && i.productId === prodId
      );
      if (inv) {
        inv.stock = Math.max(0, inv.stock - qty);
        inv.status = inv.stock === 0 ? 'Out of Stock' : inv.stock < (inv.minStock || 15) ? 'Low Stock' : 'In Stock';
      }
    }

    if (isDbOnline()) {
      try {
        await Order.create({
          orderId: newOrder.orderId,
          tenantId: newOrder.tenantId,
          branchId: newOrder.branchId,
          customerId: newOrder.customerId,
          customerName: newOrder.customerName,
          customerPhone: newOrder.customerPhone,
          totalPrice: newOrder.total,
          status: newOrder.status,
          shippingAddress: { address: 'Branch Pickup / Delivery', city: branch.city }
        });
      } catch (e) {
        console.warn('Order DB create error:', e.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Branch order created and inventory updated successfully',
      order: newOrder
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all branches across the entire platform
// @route   GET /api/branches
export const getAllBranches = async (req, res) => {
  try {
    if (isDbOnline()) {
      try {
        const dbBranches = await Branch.find({}).sort({ createdAt: -1 });
        return res.json({
          success: true,
          count: dbBranches.length,
          branches: dbBranches
        });
      } catch (e) {
        console.warn('Branch DB lookup error:', e.message);
      }
    }

    return res.json({
      success: true,
      count: 0,
      branches: []
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a new branch and store in database
// @route   POST /api/branches
export const createBranch = async (req, res) => {
  try {
    const {
      _id,
      id,
      tenantId,
      companyId,
      code,
      name,
      city,
      address,
      manager,
      phone,
      operatingHours,
      deliveryRadius,
      latitude,
      longitude,
      status
    } = req.body;

    if (!name || !tenantId) {
      return res.status(400).json({ success: false, message: 'Branch name and parent store are required' });
    }

    const branchId = _id || id || `branch_${Date.now()}`;
    const newBranch = {
      _id: branchId,
      id: branchId,
      tenantId,
      companyId: companyId || '',
      code: code || `BR-${Math.floor(100 + Math.random() * 900)}`,
      name,
      city: city || 'Faisalabad',
      address: address || '',
      manager: manager || '',
      phone: phone || '',
      operatingHours: operatingHours || '08:00 AM - 11:00 PM',
      deliveryRadius: Number(deliveryRadius || 15),
      latitude: Number(latitude || 31.4125),
      longitude: Number(longitude || 73.0995),
      status: status || 'active'
    };

    if (isDbOnline()) {
      try {
        const created = await Branch.findOneAndUpdate(
          { _id: branchId },
          newBranch,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return res.status(201).json({
          success: true,
          message: 'Branch stored in database successfully',
          branch: created
        });
      } catch (e) {
        console.error('Branch DB save error:', e.message);
        return res.status(500).json({ success: false, message: `DB error: ${e.message}` });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Branch saved in memory',
      branch: newBranch
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update branch in database
// @route   PUT /api/branches/:id
export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isDbOnline()) {
      try {
        const updated = await Branch.findOneAndUpdate(
          { $or: [{ _id: id }, { id }] },
          { $set: updates },
          { new: true }
        );
        if (updated) {
          return res.json({
            success: true,
            message: 'Branch updated in database',
            branch: updated
          });
        }
      } catch (e) {
        console.error('Branch DB update error:', e.message);
      }
    }

    return res.json({
      success: true,
      message: 'Branch updated',
      branch: { _id: id, id, ...updates }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete branch from database
// @route   DELETE /api/branches/:id
export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbOnline()) {
      try {
        await Branch.findOneAndDelete({ $or: [{ _id: id }, { id }] });
        return res.json({
          success: true,
          message: 'Branch deleted from database'
        });
      } catch (e) {
        console.error('Branch DB delete error:', e.message);
      }
    }

    return res.json({
      success: true,
      message: 'Branch removed'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
