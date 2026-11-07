import fs from 'node:fs';
import path from 'node:path';
import { ZoneStore } from '../models/ZoneStore.js';
import { Store } from '../models/Store.js';
import { DeliveryZone } from '../models/DeliveryZone.js';
import { isDbOnline } from '../config/db.js';
import { loadDiskStores } from './storeController.js';
import { loadDiskZones } from './zoneController.js';
import { calculateDistanceToZoneKm } from '../utils/gisValidator.js';
import { resolveRetailerId, getRetailerDetails } from '../utils/retailerHelper.js';
import { BRANCHES } from '../../src/data/companyHierarchyData.js';

const ASSIGNMENTS_FILE_PATH = path.resolve(process.cwd(), 'server/data/assignments_db.json');

export const loadDiskAssignments = () => {
  try {
    if (fs.existsSync(ASSIGNMENTS_FILE_PATH)) {
      const data = fs.readFileSync(ASSIGNMENTS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

export const saveDiskAssignments = (assignments) => {
  try {
    fs.writeFileSync(ASSIGNMENTS_FILE_PATH, JSON.stringify(assignments, null, 2), 'utf-8');
  } catch (e) {}
};

// Seed default assignments so that core stores are pre-linked to their relevant zones
const DEFAULT_ASSIGNMENTS = [
  // D-Ground Zone Assignments (All 4 retailers serve this central zone)
  { zoneId: 'ZONE-FSD-DGROUND', storeId: 'branch_af_fsd', tenantId: 'tenant-alfatah', isActive: true },
  { zoneId: 'ZONE-FSD-DGROUND', storeId: 'branch_cv_fsd', tenantId: 'tenant-chasevalue', isActive: true },
  { zoneId: 'ZONE-FSD-DGROUND', storeId: 'branch_006', tenantId: 'tenant-chaseup', isActive: true },
  { zoneId: 'ZONE-FSD-DGROUND', storeId: 'branch_um_fsd', tenantId: 'tenant-unimart', isActive: true },

  // Canal Road Zone Assignments
  { zoneId: 'ZONE-FSD-CANAL', storeId: 'branch_002', tenantId: 'tenant-alfatah', isActive: true },
  { zoneId: 'ZONE-FSD-CANAL', storeId: 'branch_cv_fsd', tenantId: 'tenant-chasevalue', isActive: true },
  { zoneId: 'ZONE-FSD-CANAL', storeId: 'branch_um_fsd', tenantId: 'tenant-unimart', isActive: true },

  // Clock Tower Zone Assignments
  { zoneId: 'ZONE-FSD-CLOCKTOWER', storeId: 'branch_006', tenantId: 'tenant-chaseup', isActive: true },
  { zoneId: 'ZONE-FSD-CLOCKTOWER', storeId: 'branch_af_fsd', tenantId: 'tenant-alfatah', isActive: true },

  // Madina Town Zone Assignments
  { zoneId: 'ZONE-FSD-MADINA', storeId: 'branch_002', tenantId: 'tenant-alfatah', isActive: true },
  { zoneId: 'ZONE-FSD-MADINA', storeId: 'branch_um_fsd', tenantId: 'tenant-unimart', isActive: true }
];

export const getAllAssignmentsMerged = async () => {
  let dbAssignments = [];
  if (isDbOnline()) {
    try {
      dbAssignments = await ZoneStore.find({}).lean();
    } catch (e) {}
  }

  const disk = loadDiskAssignments();
  const map = new Map();

  DEFAULT_ASSIGNMENTS.forEach((a) => {
    map.set(`${a.zoneId}__${a.storeId}`, a);
  });
  disk.forEach((a) => {
    map.set(`${a.zoneId}__${a.storeId}`, a);
  });
  dbAssignments.forEach((a) => {
    map.set(`${a.zoneId}__${a.storeId}`, a);
  });

  return Array.from(map.values());
};

// @desc    Get all zone-store assignments across platform
// @route   GET /api/admin/assignments
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await getAllAssignmentsMerged();
    return res.json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get stores assigned to a specific delivery zone
// @route   GET /api/admin/zones/:id/stores
export const getZoneStores = async (req, res) => {
  try {
    const { id } = req.params;
    const allAssignments = await getAllAssignmentsMerged();
    const zoneAssignments = allAssignments.filter((a) => a.zoneId === id && a.isActive !== false);

    // Retrieve full store details
    const diskStores = loadDiskStores();
    const allStores = [...BRANCHES, ...diskStores];

    const assignedStores = zoneAssignments.map((a) => {
      const store = allStores.find((s) => (s.storeId || s._id || s.id) === a.storeId);
      const tenantId = resolveRetailerId(a.tenantId || store?.tenantId);
      const retailer = getRetailerDetails(tenantId);

      return {
        ...store,
        storeId: a.storeId,
        tenantId,
        tenantName: retailer.name,
        name: store?.name || `${retailer.name} Store`,
        branchName: store?.branchName || store?.name || a.storeId,
        assignedAt: a.assignedAt || new Date().toISOString(),
        priority: a.priority || 1,
        isActive: a.isActive !== false
      };
    });

    return res.json({
      success: true,
      zoneId: id,
      count: assignedStores.length,
      stores: assignedStores
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign stores to a delivery zone
// @route   POST /api/admin/zones/:id/stores
export const assignStoresToZone = async (req, res) => {
  try {
    const { id: zoneId } = req.params;
    const { storeIds, storeId, priority } = req.body;

    const idsToAssign = Array.isArray(storeIds) ? storeIds : storeId ? [storeId] : [];
    if (idsToAssign.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one storeId is required.' });
    }

    // Find zone to calculate distance and verify existence
    const diskZones = loadDiskZones();
    let dbZone = null;
    if (isDbOnline()) {
      try {
        dbZone = await DeliveryZone.findOne({ zoneId }).lean();
      } catch (e) {}
    }
    const zone = dbZone || diskZones.find((z) => z.zoneId === zoneId);

    const allStores = [...BRANCHES, ...loadDiskStores()];
    const currentAssignments = await getAllAssignmentsMerged();

    const results = [];
    const warnings = [];

    for (const sId of idsToAssign) {
      const store = allStores.find((s) => (s.storeId || s._id || s.id) === sId);
      const tenantId = resolveRetailerId(store?.tenantId || 'tenant-unimart');

      // Proximity check: warn if store is > 12 km from zone polygon
      if (zone && zone.geometry && store && store.latitude && store.longitude) {
        const distKm = calculateDistanceToZoneKm(store.latitude, store.longitude, zone.geometry);
        if (distKm > 12) {
          warnings.push({
            storeId: sId,
            storeName: store.name,
            distanceKm: distKm,
            warning: `Store is ${distKm} km away from this delivery zone boundary. Long delivery times may result.`
          });
        }
      }

      // Check if assignment already exists
      const key = `${zoneId}__${sId}`;
      const existing = currentAssignments.find((a) => a.zoneId === zoneId && a.storeId === sId);

      const assignmentRecord = {
        zoneId,
        storeId: sId,
        tenantId,
        isActive: true,
        priority: Number(priority || 1),
        assignedAt: new Date().toISOString()
      };

      if (isDbOnline()) {
        try {
          await ZoneStore.findOneAndUpdate(
            { zoneId, storeId: sId },
            assignmentRecord,
            { upsert: true, new: true }
          );
        } catch (dbErr) {
          console.warn('MongoDB ZoneStore save warning:', dbErr.message);
        }
      }

      results.push(assignmentRecord);
    }

    // Save to disk assignments
    const disk = loadDiskAssignments();
    for (const r of results) {
      const idx = disk.findIndex((a) => a.zoneId === r.zoneId && a.storeId === r.storeId);
      if (idx >= 0) {
        disk[idx] = r;
      } else {
        disk.push(r);
      }
    }
    saveDiskAssignments(disk);

    return res.status(201).json({
      success: true,
      message: `Assigned ${results.length} store(s) to zone ${zoneId}.`,
      zoneId,
      assignments: results,
      warnings: warnings.length > 0 ? warnings : undefined
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove store from delivery zone
// @route   DELETE /api/admin/zones/:id/stores/:storeId
export const removeStoreFromZone = async (req, res) => {
  try {
    const { id: zoneId, storeId } = req.params;

    if (isDbOnline()) {
      try {
        await ZoneStore.findOneAndDelete({ zoneId, storeId });
      } catch (e) {}
    }

    const disk = loadDiskAssignments();
    const filtered = disk.filter((a) => !(a.zoneId === zoneId && a.storeId === storeId));
    saveDiskAssignments(filtered);

    return res.json({
      success: true,
      message: `Store ${storeId} successfully removed from zone ${zoneId}.`,
      zoneId,
      storeId
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
