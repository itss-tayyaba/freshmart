import fs from 'node:fs';
import path from 'node:path';
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
import { DeliveryZone } from '../models/DeliveryZone.js';
import { ZoneStore } from '../models/ZoneStore.js';
import { isDbOnline } from '../config/db.js';
import { loadDiskOrders } from './orderController.js';
import { findAvailableRetailers } from '../utils/deliveryZoneHelper.js';
import { loadDiskZones, saveDiskZones } from './zoneController.js';
import { loadDiskAssignments, saveDiskAssignments } from './assignmentController.js';
import { loadDiskStores, saveDiskStores } from './storeController.js';

const BRANCHES_FILE_PATH = path.resolve(process.cwd(), 'server/data/branches_db.json');

export const loadDiskBranches = () => {
  try {
    if (fs.existsSync(BRANCHES_FILE_PATH)) {
      const data = fs.readFileSync(BRANCHES_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

export const saveDiskBranch = (branch) => {
  try {
    if (!branch) return;
    const plain = branch.toObject ? branch.toObject() : { ...branch };
    const bId = String(plain._id || plain.id || '').toLowerCase().trim();
    if (!bId) return;
    const list = loadDiskBranches();
    const filtered = list.filter((b) => {
      const existingId = String(b._id || b.id || '').toLowerCase().trim();
      return existingId !== bId;
    });
    filtered.unshift(plain);
    fs.writeFileSync(BRANCHES_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
  } catch (e) {}
};

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

    const diskOrders = loadDiskOrders().filter((o) => {
      const bId = String(o.branchId || '').toLowerCase().trim();
      const targetId = String(branch._id || branch.id || '').toLowerCase().trim();
      return bId === targetId;
    });

    return res.json({
      success: true,
      tenantId: branch.tenantId,
      branchId: branch._id,
      branchName: branch.name,
      count: diskOrders.length,
      orders: diskOrders
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
    let branchList = [];
    if (isDbOnline()) {
      try {
        const dbBranches = await Branch.find({}).sort({ createdAt: -1 });
        if (dbBranches && dbBranches.length > 0) {
          branchList = dbBranches.map((b) => (b.toObject ? b.toObject() : b));
        }
      } catch (e) {
        console.warn('Branch DB lookup error:', e.message);
      }
    }

    // Merge with disk-saved branches and base platform BRANCHES
    const diskBranches = loadDiskBranches();
    const combined = [...branchList, ...diskBranches];
    const seenIds = new Set(combined.map((b) => String(b._id || b.id || '').toLowerCase().trim()));

    BRANCHES.forEach((baseB) => {
      const key = String(baseB._id || baseB.id || '').toLowerCase().trim();
      if (!seenIds.has(key)) {
        combined.push(baseB);
        seenIds.add(key);
      }
    });

    return res.json({
      success: true,
      count: combined.length,
      branches: combined
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

    if (latitude == null || longitude == null || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude coordinates are required for the branch location' });
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
      latitude: Number(latitude),
      longitude: Number(longitude),
      status: status || 'active'
    };

    saveDiskBranch(newBranch);

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

// @desc    Find all eligible multi-retailer branches for customer location
// @route   POST /api/retailers/find-available or GET /api/branches/available
export const findAvailableRetailersController = async (req, res) => {
  try {
    const lat = req.body?.latitude ?? req.body?.lat ?? req.query?.lat ?? req.query?.latitude;
    const lng = req.body?.longitude ?? req.body?.lng ?? req.query?.lng ?? req.query?.longitude;
    const maxSearchRadiusKm = Number(req.body?.maxSearchRadiusKm ?? req.query?.maxSearchRadiusKm ?? 25);
    const useRoadDistance = req.body?.useRoadDistance ?? req.query?.useRoadDistance === 'true';

    if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return res.status(400).json({
        success: false,
        message: 'Valid customer latitude and longitude coordinates are required.'
      });
    }

    // Get all branches (DB + disk + memory)
    let branchList = [];
    if (isDbOnline()) {
      try {
        const dbBranches = await Branch.find({ status: 'active' });
        if (dbBranches && dbBranches.length > 0) {
          branchList = dbBranches.map((b) => (b.toObject ? b.toObject() : b));
        }
      } catch (e) {
        console.warn('DB branch lookup:', e.message);
      }
    }

    const diskBranches = loadDiskBranches();
    const combinedBranches = [...branchList, ...diskBranches];
    const seenBranchIds = new Set(
      combinedBranches.map((b) => String(b._id || b.id || '').toLowerCase().trim())
    );

    BRANCHES.forEach((b) => {
      const key = String(b._id || b.id || '').toLowerCase().trim();
      if (!seenBranchIds.has(key)) {
        combinedBranches.push(b);
        seenBranchIds.add(key);
      }
    });

    const result = findAvailableRetailers(
      { lat: Number(lat), lng: Number(lng) },
      combinedBranches,
      { maxSearchRadiusKm, useRoadDistance }
    );

    // Enrich with company info
    const enrichRetailer = (r) => {
      const comp =
        COMPANIES.find(
          (c) =>
            c.tenantId === r.tenantId ||
            c.legacyId === r.tenantId ||
            c._id === r.tenantId ||
            (c.slug && r.tenantId.includes(c.slug))
        ) || {};

      return {
        ...r,
        name: comp.displayName || comp.name || r.name || r.tenantId,
        slug: comp.slug || '',
        logo: comp.logo || '🏪',
        banner: comp.banner || '',
        themeColor: comp.themeColor || '#10b981',
        tagline: comp.tagline || ''
      };
    };

    return res.json({
      success: true,
      customerLocation: { latitude: Number(lat), longitude: Number(lng) },
      searchRadiusKm: result.searchRadiusKm,
      searchStepsTaken: result.searchStepsTaken,
      overlappingCount: result.overlappingRetailersCount,
      hasOverlappingZones: result.hasOverlappingZones,
      eligibleRetailers: result.eligibleRetailers.map(enrichRetailer),
      unavailableRetailers: result.unavailableRetailers.map(enrichRetailer),
      allDiscoveredBranches: result.allDiscoveredBranches
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update delivery zone, radius, coordinates, or fee tiers for a branch
// @route   PUT /api/branches/:id/delivery-zone
export const updateBranchDeliveryZone = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      latitude,
      longitude,
      deliveryRadiusKm,
      deliveryRadius,
      deliveryStatus,
      deliveryTiers,
      deliveryPolygon,
      supportsExtendedDelivery,
      address,
      name
    } = req.body;

    const updates = {};
    if (latitude != null && !isNaN(Number(latitude))) updates.latitude = Number(latitude);
    if (longitude != null && !isNaN(Number(longitude))) updates.longitude = Number(longitude);

    const rad =
      deliveryRadiusKm != null
        ? Number(deliveryRadiusKm)
        : deliveryRadius != null
        ? Number(deliveryRadius)
        : undefined;
    if (rad != null && !isNaN(rad)) {
      updates.deliveryRadiusKm = rad;
      updates.deliveryRadius = rad;
    }

    if (deliveryStatus) updates.deliveryStatus = deliveryStatus;
    if (Array.isArray(deliveryTiers)) updates.deliveryTiers = deliveryTiers;
    if (Array.isArray(deliveryPolygon)) updates.deliveryPolygon = deliveryPolygon;
    if (supportsExtendedDelivery !== undefined) updates.supportsExtendedDelivery = Boolean(supportsExtendedDelivery);
    if (address) updates.address = address;
    if (name) updates.name = name;

    let updatedBranch = null;

    if (isDbOnline()) {
      try {
        updatedBranch = await Branch.findOneAndUpdate(
          { $or: [{ _id: id }, { id }] },
          { $set: updates },
          { new: true }
        );
      } catch (e) {
        console.warn('Branch DB delivery-zone update error:', e.message);
      }
    }

    // Persist to disk branches store
    const diskList = loadDiskBranches();
    const existing = diskList.find(
      (b) => String(b._id || b.id || '').toLowerCase().trim() === String(id).toLowerCase().trim()
    );
    let merged = { ...(existing || {}), _id: id, id, ...updates };

    // Bidirectional sync: Ensure this store's delivery zone is synchronized to DeliveryZone & ZoneStore collections
    let matchingZone = null;
    try {
      const diskZones = loadDiskZones();
      const cleanId = String(id).toLowerCase().trim();
      const existingZoneIdx = diskZones.findIndex(
        (z) =>
          String(z.assignedStoreId || '').toLowerCase().trim() === cleanId ||
          String(z.zoneId || '').toLowerCase().trim() === String(merged.assignedZoneId || '').toLowerCase().trim() ||
          String(z.zoneId || '').toLowerCase().trim() === `zone-${cleanId}`
      );

      let ring = null;
      if (Array.isArray(updates.deliveryPolygon) && updates.deliveryPolygon.length >= 3) {
        ring = updates.deliveryPolygon
          .map((pt) => {
            const lat = Number(Array.isArray(pt) ? pt[0] : pt.lat ?? pt.latitude);
            const lng = Number(Array.isArray(pt) ? pt[1] : pt.lng ?? pt.longitude);
            return [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
          })
          .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

        if (ring.length >= 3) {
          const first = ring[0];
          const last = ring[ring.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            ring.push([first[0], first[1]]);
          }
        }
      }

      const zoneName = merged.name
        ? (merged.name.toLowerCase().includes('zone') ? merged.name : `${merged.name} Delivery Zone`)
        : 'Store Delivery Zone';
      const targetZoneId = existingZoneIdx >= 0
        ? diskZones[existingZoneIdx].zoneId
        : (merged.assignedZoneId || `ZONE-${String(id).toUpperCase()}`);

      const zoneData = {
        zoneId: targetZoneId,
        _id: targetZoneId,
        name: zoneName,
        code: `Z-${String(id).slice(-4).toUpperCase()}`,
        city: merged.city || 'Faisalabad',
        area: merged.address || merged.name || 'Commercial Hub',
        description: `Dedicated delivery zone for ${merged.name || 'Store'}`,
        color: merged.color || '#059669',
        deliveryCharge: Array.isArray(merged.deliveryTiers) && merged.deliveryTiers[0]?.fee != null
          ? Number(merged.deliveryTiers[0].fee)
          : 60,
        minOrderAmount: 400,
        freeDeliveryThreshold: 2000,
        estimatedDeliveryTime: '20-30 mins',
        assignedStoreId: id,
        status: merged.deliveryStatus || 'active',
        isActive: merged.deliveryStatus !== 'inactive'
      };

      if (ring && ring.length >= 4) {
        zoneData.geometry = { type: 'Polygon', coordinates: [ring] };
        zoneData.coordinates = [ring];
      }

      if (existingZoneIdx >= 0) {
        diskZones[existingZoneIdx] = { ...diskZones[existingZoneIdx], ...zoneData };
        matchingZone = diskZones[existingZoneIdx];
      } else {
        diskZones.unshift(zoneData);
        matchingZone = zoneData;
      }
      saveDiskZones(diskZones);

      if (isDbOnline()) {
        try {
          await DeliveryZone.findOneAndUpdate(
            { $or: [{ zoneId: targetZoneId }, { assignedStoreId: id }] },
            zoneData,
            { upsert: true, new: true }
          );
        } catch (dbErr) {
          console.warn('DeliveryZone Mongo sync warning:', dbErr.message);
        }
      }

      // Link store to zone in assignments collection
      const diskAssignments = loadDiskAssignments();
      const assignIdx = diskAssignments.findIndex(
        (a) =>
          String(a.zoneId || '').toLowerCase() === String(targetZoneId).toLowerCase() &&
          String(a.storeId || '').toLowerCase() === cleanId
      );
      const assignRec = {
        zoneId: targetZoneId,
        storeId: id,
        tenantId: merged.tenantId || 'tenant-unimart',
        isActive: true,
        priority: 1,
        assignedAt: new Date().toISOString()
      };
      if (assignIdx >= 0) {
        diskAssignments[assignIdx] = { ...diskAssignments[assignIdx], ...assignRec };
      } else {
        diskAssignments.push(assignRec);
      }
      saveDiskAssignments(diskAssignments);

      if (isDbOnline()) {
        try {
          await ZoneStore.findOneAndUpdate(
            { zoneId: targetZoneId, storeId: id },
            assignRec,
            { upsert: true, new: true }
          );
        } catch (zsErr) {
          console.warn('ZoneStore Mongo sync warning:', zsErr.message);
        }
      }

      merged.assignedZoneId = targetZoneId;

      // Also sync to stores_db.json
      const diskStores = loadDiskStores();
      const sIdx = diskStores.findIndex((s) => String(s.storeId || s._id || '').toLowerCase() === cleanId);
      if (sIdx >= 0) {
        diskStores[sIdx] = {
          ...diskStores[sIdx],
          assignedZoneId: targetZoneId,
          ...(updates.deliveryPolygon ? { deliveryPolygon: updates.deliveryPolygon } : {}),
          ...(updates.latitude != null ? { latitude: updates.latitude } : {}),
          ...(updates.longitude != null ? { longitude: updates.longitude } : {})
        };
        saveDiskStores(diskStores);
      }
    } catch (syncErr) {
      console.warn('Branch-to-Zone bidirectional sync warning:', syncErr.message);
    }

    saveDiskBranch(merged);

    // Update in-memory fallback list
    const memBranch = BRANCHES.find((b) => b._id === id || b.id === id);
    if (memBranch) {
      Object.assign(memBranch, merged);
    }

    return res.json({
      success: true,
      message: 'Branch delivery zone updated successfully',
      branch: updatedBranch || merged,
      zone: matchingZone
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
