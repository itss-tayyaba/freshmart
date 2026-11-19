import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { Store } from '../models/Store.js';
import { Branch } from '../models/Branch.js';
import { ZoneStore } from '../models/ZoneStore.js';
import { isDbOnline } from '../config/db.js';
import { BRANCHES } from '../../src/data/companyHierarchyData.js';
import { resolveRetailerId, getRetailerDetails } from '../utils/retailerHelper.js';
import { STORE_REGISTRY, toStoreRecord, LEGACY_STORE_ID_MAP } from '../../src/data/storeRegistry.js';
import { suggestZonesForPoint, zoneContainsPoint } from '../utils/zoneMatch.js';
import { loadDiskAssignments, saveDiskAssignments } from './assignmentController.js';

const STORES_FILE_PATH = path.resolve(process.cwd(), 'server/data/stores_db.json');
const BRANCHES_FILE_PATH = path.resolve(process.cwd(), 'server/data/branches_db.json');
const DELETED_STORES_FILE_PATH = path.resolve(process.cwd(), 'server/data/deleted_stores_db.json');

export const loadDeletedStoreIds = () => {
  try {
    if (fs.existsSync(DELETED_STORES_FILE_PATH)) {
      const data = fs.readFileSync(DELETED_STORES_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

export const recordDeletedStoreId = (id) => {
  try {
    const list = loadDeletedStoreIds();
    const strId = String(id || '').trim();
    if (strId) {
      const toAdd = new Set([strId]);
      if (LEGACY_STORE_ID_MAP && LEGACY_STORE_ID_MAP[strId]) {
        toAdd.add(LEGACY_STORE_ID_MAP[strId]);
      }
      if (LEGACY_STORE_ID_MAP) {
        for (const [legacyId, canonId] of Object.entries(LEGACY_STORE_ID_MAP)) {
          if (canonId === strId) toAdd.add(legacyId);
        }
      }
      let modified = false;
      toAdd.forEach((item) => {
        if (!list.includes(item)) {
          list.push(item);
          modified = true;
        }
      });
      if (modified) {
        fs.writeFileSync(DELETED_STORES_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
      }
    }
  } catch (e) {}
};

// The 4 Core Supermarket Stores located at D-Ground, Peoples Colony, Susan Road, and Samanabad
// All platform stores come from the shared registry (src/data/storeRegistry.js).
export const CORE_STORES = STORE_REGISTRY.map(toStoreRecord);
export const FOUR_CORE_STORES = CORE_STORES; // legacy alias

// Deduplicate stores by storeId and tenant+branchName to avoid ghost duplicates
export const deduplicateStores = (storesList = []) => {
  const seenIds = new Set();
  const seenTenantBranches = new Set();
  const result = [];

  for (const s of storesList) {
    if (!s) continue;
    const sId = String(s.storeId || s._id || '').trim();
    // Exclude test artifacts in normal platform runtime
    if (process.env.NODE_ENV !== 'test' && sId.endsWith('-TEST')) continue;

    const tId = String(s.tenantId || '').toLowerCase();
    const bName = String(s.branchName || s.name || '').toLowerCase().trim();
    const key = `${tId}__${bName}`;

    if (sId && seenIds.has(sId)) continue;
    if (process.env.NODE_ENV !== 'test' && key && seenTenantBranches.has(key)) continue;

    if (sId) seenIds.add(sId);
    if (key) seenTenantBranches.add(key);
    result.push(s);
  }

  return result;
};

export const loadDiskStores = () => {
  const deletedIds = new Set(loadDeletedStoreIds());
  try {
    if (fs.existsSync(STORES_FILE_PATH)) {
      const data = fs.readFileSync(STORES_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const withoutDeleted = parsed.filter(
          (s) => !deletedIds.has(s.storeId) && !deletedIds.has(s._id) && !deletedIds.has(s.storeCode)
        );
        if (process.env.NODE_ENV !== 'test') {
          return deduplicateStores(withoutDeleted);
        }
        return withoutDeleted;
      }
    }
  } catch (e) {}
  return FOUR_CORE_STORES.filter(
    (s) => !deletedIds.has(s.storeId) && !deletedIds.has(s._id) && !deletedIds.has(s.storeCode)
  );
};

export const saveDiskStores = (stores) => {
  try {
    fs.writeFileSync(STORES_FILE_PATH, JSON.stringify(stores, null, 2), 'utf-8');
  } catch (e) {}
};

// Base platform stores - returns empty so stores are not created automatically
const getBaseStores = () => {
  return [];
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

    // Deduplicate stores by storeId / _id
    const storeMap = new Map();

    diskStores.forEach((s) => storeMap.set(s.storeId || s._id, s));
    dbStores.forEach((s) => {
      const sId = s.storeId || String(s._id);
      storeMap.set(sId, {
        ...s,
        storeId: sId,
        isActive: String(s.status).toLowerCase() === 'active'
      });
    });

    if (storeMap.size === 0 && process.env.NODE_ENV !== 'test') {
      FOUR_CORE_STORES.forEach((s) => storeMap.set(s.storeId || s._id, s));
    }

    // Old duplicate records of the same physical stores (pre-registry ids) are dropped so counts match everywhere.
    ['STR-UM-001', 'STR-AF-001', 'STR-CV-001', 'STR-CU-001', 'STR-CHA-3330'].forEach((id) => storeMap.delete(id));

    let stores = deduplicateStores(Array.from(storeMap.values()));

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

    const rawParentId = req.body.parentRetailerId || req.body.retailerId || tenantId;
    if (!rawParentId) {
      return res.status(400).json({ success: false, message: 'A store cannot be registered without a parent retailer.' });
    }

    if (!name || !branchName) {
      return res.status(400).json({ success: false, message: 'Store name and branch name are required.' });
    }

    // Enforce unique store code if provided
    const requestedCode = String(req.body.storeCode || storeId || '').trim();
    if (requestedCode) {
      const diskStores = loadDiskStores();
      const duplicate = diskStores.find(
        (s) => (s.storeCode && s.storeCode.toLowerCase() === requestedCode.toLowerCase()) ||
               (String(s.storeId || s._id).toLowerCase() === requestedCode.toLowerCase())
      );
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Store code must be unique. A store with code "${requestedCode}" already exists.`
        });
      }
    }

    if (latitude === undefined || longitude === undefined || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      return res.status(400).json({ success: false, message: 'Valid geographical coordinates (latitude and longitude) are required.' });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Coordinates out of valid geographical bounds.' });
    }

    // Super admin registers branch location freely (does not have to lie on any polygon)
    const requestedZoneId = req.body.assignedZoneId || req.body.zoneId || null;
    let chosenZone = null;
    let insidePolygon = true;

    if (requestedZoneId) {
      try {
        const { getAllZonesMerged } = await import('./zoneController.js');
        const allZones = await getAllZonesMerged();
        chosenZone = allZones.find((z) => z.zoneId === requestedZoneId);
        if (chosenZone) {
          insidePolygon = zoneContainsPoint(chosenZone, lat, lng);
        }
      } catch (e) {}
    }

    const canonicalTenant = resolveRetailerId(tenantId || 'tenant-unimart');
    const retailer = getRetailerDetails(canonicalTenant);

    const generatedId = storeId || `STR-${canonicalTenant.substring(0, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const targetZoneId = req.body.assignedZoneId || req.body.zoneId || null;

    const newStoreData = {
      _id: generatedId,
      storeId: generatedId,
      storeCode: requestedCode || generatedId,
      parentRetailerId: canonicalTenant,
      tenantId: canonicalTenant,
      tenantName: retailer.name,
      name,
      storeName: name,
      branchName,
      branchManager: req.body.branchManager || manager || `${retailer.name} Manager`,
      manager: req.body.branchManager || manager || `${retailer.name} Manager`,
      phone: req.body.phone || contactNumber || '+92 300 0000000',
      contactNumber: req.body.phone || contactNumber || '+92 300 0000000',
      email: req.body.email || '',
      type: 'child',
      notes: req.body.notes || '',
      address: address || `${branchName}, ${city || 'Faisalabad'}, Pakistan`,
      city: city || 'Faisalabad',
      latitude: lat,
      longitude: lng,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      openingHours: openingHours || '08:00 AM',
      closingHours: closingHours || '11:00 PM',
      storeImage: storeImage || retailer.banner || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      status: status || 'active',
      isActive: String(status || 'active').toLowerCase() === 'active',
      operatingStatus: operatingStatus || 'Open',
      deliveryRadiusKm: Number(deliveryRadiusKm || 5),
      assignedZoneId: targetZoneId
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

    // Optional: link store to zone if assignedZoneId or zoneId provided
    if (targetZoneId) {
      try {
        const diskAssignments = loadDiskAssignments();
        const existingIdx = diskAssignments.findIndex((a) => a.zoneId === targetZoneId && a.storeId === generatedId);
        const assignRecord = {
          zoneId: targetZoneId,
          deliveryZoneId: targetZoneId,
          storeId: generatedId,
          tenantId: canonicalTenant,
          parentRetailerId: canonicalTenant,
          isActive: true,
          status: 'active',
          priority: 1,
          assignedAt: new Date().toISOString(),
          assignedBy: 'Super Admin'
        };
        if (existingIdx >= 0) {
          diskAssignments[existingIdx] = assignRecord;
        } else {
          diskAssignments.push(assignRecord);
        }
        saveDiskAssignments(diskAssignments);
        if (isDbOnline()) {
          try {
            await ZoneStore.findOneAndUpdate({ zoneId: targetZoneId, storeId: generatedId }, assignRecord, { upsert: true });
          } catch (e) {}
        }
        newStoreData.assignedZoneId = targetZoneId;
      } catch (e) {}
    }

    return res.status(201).json({
      success: true,
      message: 'Store created successfully with authentic coordinates.',
      insidePolygon,
      ...(insidePolygon ? {} : { warning: `The store pin is outside "${chosenZone?.name || 'the delivery zone'}". Orders are matched by polygon, so check the location.` }),
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
        await Store.findOneAndUpdate(
          { $or: [{ storeId: id }, { _id: id }] },
          { $set: { ...updates, storeId: id } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        await Branch.findOneAndUpdate(
          { $or: [{ id }, { _id: id }] },
          { $set: { ...updates, id } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        console.warn('MongoDB store update warning:', err.message);
      }
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

    const targetZoneId = req.body.assignedZoneId || req.body.zoneId;
    if (targetZoneId !== undefined) {
      try {
        const diskAssignments = loadDiskAssignments();
        const sId = id;
        if (!targetZoneId) {
          saveDiskAssignments(diskAssignments.filter((a) => a.storeId !== sId));
          if (isDbOnline()) {
            await ZoneStore.deleteMany({ storeId: sId });
          }
        } else {
          const existingIdx = diskAssignments.findIndex((a) => a.zoneId === targetZoneId && a.storeId === sId);
          const assignRecord = {
            zoneId: targetZoneId,
            storeId: sId,
            tenantId: updates.tenantId || 'tenant-unimart',
            isActive: true,
            priority: 1,
            assignedAt: new Date().toISOString()
          };
          if (existingIdx >= 0) {
            diskAssignments[existingIdx] = assignRecord;
          } else {
            diskAssignments.push(assignRecord);
          }
          saveDiskAssignments(diskAssignments);
          if (isDbOnline()) {
            await ZoneStore.findOneAndUpdate({ zoneId: targetZoneId, storeId: sId }, assignRecord, { upsert: true });
          }
        }
      } catch (e) {}
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

// @desc    Permanently delete store
// @route   DELETE /api/admin/stores/:storeId (also /api/admin/stores/:id)
export const deleteStore = async (req, res) => {
  const storeId = req.params.storeId || req.params.id;

  try {
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID',
      });
    }

    let deletedStoreData = null;
    const aliasIds = [storeId];
    if (LEGACY_STORE_ID_MAP && LEGACY_STORE_ID_MAP[storeId]) {
      aliasIds.push(LEGACY_STORE_ID_MAP[storeId]);
    }
    if (LEGACY_STORE_ID_MAP) {
      for (const [legacyId, canonId] of Object.entries(LEGACY_STORE_ID_MAP)) {
        if (canonId === storeId) aliasIds.push(legacyId);
      }
    }

    if (isDbOnline()) {
      try {
        const isMongoId = mongoose.Types.ObjectId.isValid(storeId);
        const query = isMongoId
          ? { $or: [{ _id: storeId }, { storeId: { $in: aliasIds } }] }
          : { $or: [{ storeId: { $in: aliasIds } }, { _id: { $in: aliasIds } }, { code: { $in: aliasIds } }] };

        const store = await Store.findOne(query);
        if (store) {
          deletedStoreData = {
            id: store._id,
            name: store.storeName || store.name,
            parentRetailerId: store.parentRetailerId || store.retailerId || store.tenantId,
            deliveryZoneId: store.deliveryZoneId || null,
          };
          await Store.findByIdAndDelete(store._id);
        }
        await Store.deleteMany(query);

        await Branch.deleteMany({ $or: [{ id: { $in: aliasIds } }, { _id: { $in: aliasIds } }] });
        await ZoneStore.deleteMany({ storeId: { $in: aliasIds } });

        // Unlink store from delivery polygon (DeliveryZone), clearing assignedStoreId
        const { DeliveryZone } = await import('../models/DeliveryZone.js');
        await DeliveryZone.updateMany(
          { assignedStoreId: { $in: aliasIds } },
          { $set: { assignedStoreId: null } }
        );
      } catch (err) {
        console.error('DB Store Delete Error:', err);
      }
    }

    // Find in disk stores before marking deleted
    let diskRaw = [];
    try {
      if (fs.existsSync(STORES_FILE_PATH)) {
        diskRaw = JSON.parse(fs.readFileSync(STORES_FILE_PATH, 'utf-8'));
      }
    } catch (e) {}

    const existing = Array.isArray(diskRaw)
      ? diskRaw.find((s) => aliasIds.includes(s.storeId) || aliasIds.includes(s._id) || aliasIds.includes(s.storeCode))
      : null;

    if (existing && !deletedStoreData) {
      deletedStoreData = {
        id: existing.storeId || existing._id,
        name: existing.storeName || existing.name,
        parentRetailerId: existing.parentRetailerId || existing.retailerId || existing.tenantId,
        deliveryZoneId: existing.deliveryZoneId || null,
      };
    }

    aliasIds.forEach((aid) => recordDeletedStoreId(aid));

    const disk = loadDiskStores();
    const filtered = disk.filter((s) => !aliasIds.includes(s.storeId) && !aliasIds.includes(s._id));
    saveDiskStores(filtered);

    // Also remove from branches
    try {
      const branchesPath = path.resolve(process.cwd(), 'server/data/branches_db.json');
      if (fs.existsSync(branchesPath)) {
        const raw = fs.readFileSync(branchesPath, 'utf-8');
        const bList = JSON.parse(raw);
        if (Array.isArray(bList)) {
          const filteredBranches = bList.filter(
            (b) => !aliasIds.some((aid) => String(b._id || b.id || '').toLowerCase() === aid.toLowerCase())
          );
          fs.writeFileSync(branchesPath, JSON.stringify(filteredBranches, null, 2), 'utf-8');
        }
      }
    } catch (e) {}

    // Also remove from assignments (unlink from polygons)
    try {
      const diskAssignments = loadDiskAssignments();
      const filteredAssignments = diskAssignments.filter((a) => !aliasIds.includes(a.storeId));
      saveDiskAssignments(filteredAssignments);
    } catch (e) {}

    // Also unlink from disk delivery zones
    try {
      const zonesPath = path.resolve(process.cwd(), 'server/data/zones_db.json');
      if (fs.existsSync(zonesPath)) {
        const raw = fs.readFileSync(zonesPath, 'utf-8');
        const zList = JSON.parse(raw);
        if (Array.isArray(zList)) {
          let modified = false;
          const updatedZones = zList.map((z) => {
            if (aliasIds.includes(z.assignedStoreId)) {
              modified = true;
              return { ...z, assignedStoreId: null };
            }
            return z;
          });
          if (modified) {
            fs.writeFileSync(zonesPath, JSON.stringify(updatedZones, null, 2), 'utf-8');
          }
        }
      }
    } catch (e) {}

    // Return exact response matching user specification
    return res.status(200).json({
      success: true,
      message: 'Store permanently deleted',
      deletedStore: deletedStoreData || {
        id: storeId,
        name: storeId,
        parentRetailerId: null,
        deliveryZoneId: null,
      },
    });
  } catch (error) {
    console.error('Delete Store Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete store',
    });
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
    // User requested to remove all dummy/seed branches and add their own from scratch
    const isTest = process.env.NODE_ENV === 'test';
    const isExplicitSeed = req.query.includeSeed === 'true';
    const baseStores = (isTest || isExplicitSeed) ? getBaseStores() : [];
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
