import fs from 'node:fs';
import path from 'node:path';
import { Store } from '../models/Store.js';
import { Branch } from '../models/Branch.js';
import { isDbOnline } from '../config/db.js';
import { BRANCHES } from '../../src/data/companyHierarchyData.js';
import { resolveRetailerId, getRetailerDetails } from '../utils/retailerHelper.js';

const STORES_FILE_PATH = path.resolve(process.cwd(), 'server/data/stores_db.json');
const BRANCHES_FILE_PATH = path.resolve(process.cwd(), 'server/data/branches_db.json');

export const loadDiskStores = () => {
  try {
    if (fs.existsSync(STORES_FILE_PATH)) {
      const data = fs.readFileSync(STORES_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

export const saveDiskStores = (stores) => {
  try {
    fs.writeFileSync(STORES_FILE_PATH, JSON.stringify(stores, null, 2), 'utf-8');
  } catch (e) {}
};

// Map base platform BRANCHES to Store format
const getBaseStores = () => {
  return BRANCHES.map((b) => {
    const canonicalTenant = resolveRetailerId(b.tenantId);
    const retailer = getRetailerDetails(canonicalTenant);
    return {
      _id: b._id,
      storeId: b._id,
      tenantId: canonicalTenant,
      tenantName: retailer.name,
      name: `${retailer.name} - ${b.name}`,
      branchName: b.name,
      address: b.address || `${b.name}, ${b.city}, Pakistan`,
      city: b.city || 'Faisalabad',
      latitude: Number(b.latitude),
      longitude: Number(b.longitude),
      location: {
        type: 'Point',
        coordinates: [Number(b.longitude), Number(b.latitude)]
      },
      contactNumber: b.phone || '+92 300 0000000',
      openingHours: b.operatingHours ? b.operatingHours.split('-')[0].trim() : '08:00 AM',
      closingHours: b.operatingHours ? b.operatingHours.split('-')[1]?.trim() || '11:00 PM' : '11:00 PM',
      storeImage: b.banner || retailer.banner || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      status: b.status || 'active',
      isActive: String(b.status || 'active').toLowerCase() === 'active',
      operatingStatus: 'Open',
      manager: b.manager || `${retailer.name} Branch Manager`,
      deliveryRadiusKm: Number(b.deliveryRadiusKm || b.deliveryRadius || 5)
    };
  });
};

// @desc    Get all stores with filters (tenantId, city, search, active)
// @route   GET /api/admin/stores
export const getStores = async (req, res) => {
  try {
    const { tenantId, city, search, status } = req.query;

    let dbStores = [];
    if (isDbOnline()) {
      try {
        dbStores = await Store.find({}).lean();
      } catch (err) {
        console.warn('Store DB fetch error:', err.message);
      }
    }

    const diskStores = loadDiskStores();
    const baseStores = getBaseStores();

    // Deduplicate stores by storeId / _id
    const storeMap = new Map();

    baseStores.forEach((s) => storeMap.set(s.storeId, s));
    diskStores.forEach((s) => storeMap.set(s.storeId || s._id, s));
    dbStores.forEach((s) => {
      const sId = s.storeId || String(s._id);
      storeMap.set(sId, {
        ...s,
        storeId: sId,
        isActive: String(s.status).toLowerCase() === 'active'
      });
    });

    let stores = Array.from(storeMap.values());

    // Apply filtering
    if (tenantId && tenantId !== 'all') {
      const canonical = resolveRetailerId(tenantId);
      stores = stores.filter(
        (s) => resolveRetailerId(s.tenantId) === canonical || s.tenantId === tenantId
      );
    }

    if (city && city !== 'all') {
      stores = stores.filter(
        (s) => String(s.city || '').toLowerCase() === city.toLowerCase()
      );
    }

    if (status && status !== 'all') {
      const isReqActive = status.toLowerCase() === 'active';
      stores = stores.filter((s) => s.isActive === isReqActive);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      stores = stores.filter(
        (s) =>
          String(s.name || '').toLowerCase().includes(q) ||
          String(s.branchName || '').toLowerCase().includes(q) ||
          String(s.address || '').toLowerCase().includes(q) ||
          String(s.storeId || '').toLowerCase().includes(q) ||
          String(s.tenantName || '').toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      count: stores.length,
      stores
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get store by ID
// @route   GET /api/admin/stores/:id
export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbOnline()) {
      try {
        const store = await Store.findOne({ $or: [{ storeId: id }, { _id: id }] }).lean();
        if (store) {
          return res.json({ success: true, store });
        }
      } catch (err) {}
    }

    const all = [...getBaseStores(), ...loadDiskStores()];
    const store = all.find((s) => s.storeId === id || s._id === id);

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found.' });
    }

    return res.json({ success: true, store });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new store
// @route   POST /api/admin/stores
export const createStore = async (req, res) => {
  try {
    const {
      storeId,
      tenantId,
      name,
      branchName,
      address,
      city,
      latitude,
      longitude,
      contactNumber,
      openingHours,
      closingHours,
      storeImage,
      status,
      operatingStatus,
      manager,
      deliveryRadiusKm
    } = req.body;

    if (!name || !branchName) {
      return res.status(400).json({ success: false, message: 'Store name and branch name are required.' });
    }

    if (latitude === undefined || longitude === undefined || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      return res.status(400).json({ success: false, message: 'Valid geographical coordinates (latitude and longitude) are required.' });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Coordinates out of valid geographical bounds.' });
    }

    const canonicalTenant = resolveRetailerId(tenantId || 'tenant-unimart');
    const retailer = getRetailerDetails(canonicalTenant);

    const generatedId = storeId || `STR-${canonicalTenant.substring(0, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newStoreData = {
      _id: generatedId,
      storeId: generatedId,
      tenantId: canonicalTenant,
      tenantName: retailer.name,
      name,
      branchName,
      address: address || `${branchName}, ${city || 'Faisalabad'}, Pakistan`,
      city: city || 'Faisalabad',
      latitude: lat,
      longitude: lng,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      contactNumber: contactNumber || '+92 300 0000000',
      openingHours: openingHours || '08:00 AM',
      closingHours: closingHours || '11:00 PM',
      storeImage: storeImage || retailer.banner || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      status: status || 'active',
      isActive: String(status || 'active').toLowerCase() === 'active',
      operatingStatus: operatingStatus || 'Open',
      manager: manager || `${retailer.name} Manager`,
      deliveryRadiusKm: Number(deliveryRadiusKm || 5)
    };

    // Save to MongoDB
    if (isDbOnline()) {
      try {
        await Store.findOneAndUpdate({ storeId: generatedId }, newStoreData, { upsert: true, new: true });
        // Also sync with Branch collection for legacy compatibility
        await Branch.findOneAndUpdate(
          { _id: generatedId },
          {
            _id: generatedId,
            id: generatedId,
            tenantId: canonicalTenant,
            name: branchName,
            city: newStoreData.city,
            latitude: lat,
            longitude: lng,
            address: newStoreData.address,
            phone: newStoreData.contactNumber,
            operatingHours: `${newStoreData.openingHours} - ${newStoreData.closingHours}`,
            status: newStoreData.status,
            deliveryStatus: newStoreData.status,
            deliveryRadiusKm: newStoreData.deliveryRadiusKm
          },
          { upsert: true }
        );
      } catch (err) {
        console.warn('MongoDB Store save warning:', err.message);
      }
    }

    // Save to disk stores
    const disk = loadDiskStores();
    const updatedDisk = disk.filter((s) => s.storeId !== generatedId && s._id !== generatedId);
    updatedDisk.unshift(newStoreData);
    saveDiskStores(updatedDisk);

    return res.status(201).json({
      success: true,
      message: 'Store created successfully with authentic coordinates.',
      store: newStoreData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update store
// @route   PUT /api/admin/stores/:id
export const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.latitude !== undefined && updates.longitude !== undefined) {
      const lat = Number(updates.latitude);
      const lng = Number(updates.longitude);
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ success: false, message: 'Invalid coordinates provided.' });
      }
      updates.latitude = lat;
      updates.longitude = lng;
      updates.location = {
        type: 'Point',
        coordinates: [lng, lat]
      };
    }

    if (updates.status) {
      updates.isActive = String(updates.status).toLowerCase() === 'active';
    }

    if (isDbOnline()) {
      try {
        await Store.findOneAndUpdate({ $or: [{ storeId: id }, { _id: id }] }, updates, { new: true });
        await Branch.findOneAndUpdate({ $or: [{ id }, { _id: id }] }, updates, { new: true });
      } catch (err) {}
    }

    // Update disk stores
    const disk = loadDiskStores();
    const existingIndex = disk.findIndex((s) => s.storeId === id || s._id === id);
    if (existingIndex >= 0) {
      disk[existingIndex] = { ...disk[existingIndex], ...updates };
      saveDiskStores(disk);
    } else {
      disk.unshift({ storeId: id, _id: id, ...updates });
      saveDiskStores(disk);
    }

    return res.json({
      success: true,
      message: 'Store updated successfully.',
      storeId: id,
      updates
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete store
// @route   DELETE /api/admin/stores/:id
export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbOnline()) {
      try {
        await Store.findOneAndDelete({ $or: [{ storeId: id }, { _id: id }] });
        await Branch.findOneAndDelete({ $or: [{ id }, { _id: id }] });
      } catch (err) {}
    }

    const disk = loadDiskStores();
    const filtered = disk.filter((s) => s.storeId !== id && s._id !== id);
    saveDiskStores(filtered);

    return res.json({
      success: true,
      message: 'Store deleted successfully.',
      storeId: id
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle store active/inactive status
// @route   PATCH /api/admin/stores/:id/status
export const toggleStoreStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, operatingStatus } = req.body;

    const newStatus = status || 'active';
    const isActive = String(newStatus).toLowerCase() === 'active';

    const updates = {
      status: newStatus,
      isActive
    };
    if (operatingStatus) updates.operatingStatus = operatingStatus;

    if (isDbOnline()) {
      try {
        await Store.findOneAndUpdate({ $or: [{ storeId: id }, { _id: id }] }, updates, { new: true });
        await Branch.findOneAndUpdate({ $or: [{ id }, { _id: id }] }, { status: newStatus, deliveryStatus: newStatus }, { new: true });
      } catch (err) {}
    }

    const disk = loadDiskStores();
    const target = disk.find((s) => s.storeId === id || s._id === id);
    if (target) {
      Object.assign(target, updates);
      saveDiskStores(disk);
    }

    return res.json({
      success: true,
      message: `Store status changed to ${newStatus}.`,
      storeId: id,
      status: newStatus,
      isActive
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get stores for current logged in retailer (Tenant scoped)
// @route   GET /api/retailer/stores
export const getRetailerStores = async (req, res) => {
  try {
    const rawTenantId = req.user?.tenantId || req.tenantId;
    if (!rawTenantId) {
      return res.status(401).json({ success: false, message: 'Retailer authentication required.' });
    }

    const canonicalTenant = resolveRetailerId(rawTenantId);

    // Call getStores logic scoped to this tenant
    const diskStores = loadDiskStores();
    const baseStores = getBaseStores();
    let dbStores = [];

    if (isDbOnline()) {
      try {
        dbStores = await Store.find({ tenantId: canonicalTenant }).lean();
      } catch (e) {}
    }

    const storeMap = new Map();
    baseStores.forEach((s) => {
      if (resolveRetailerId(s.tenantId) === canonicalTenant) storeMap.set(s.storeId, s);
    });
    diskStores.forEach((s) => {
      if (resolveRetailerId(s.tenantId) === canonicalTenant) storeMap.set(s.storeId || s._id, s);
    });
    dbStores.forEach((s) => storeMap.set(s.storeId || String(s._id), s));

    const stores = Array.from(storeMap.values());

    return res.json({
      success: true,
      tenantId: canonicalTenant,
      count: stores.length,
      stores
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
