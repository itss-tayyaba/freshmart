import fs from 'node:fs';
import path from 'node:path';
import { ZoneStore } from '../models/ZoneStore.js';
import { Store } from '../models/Store.js';
import { Branch } from '../models/Branch.js';
import { DeliveryZone } from '../models/DeliveryZone.js';
import { isDbOnline } from '../config/db.js';
import { loadDiskStores, saveDiskStores } from './storeController.js';
import { loadDiskZones, saveDiskZones } from './zoneController.js';
import { loadDiskBranches, saveDiskBranch } from './companyBranchController.js';
import { calculateDistanceToZoneKm } from '../utils/gisValidator.js';
import { resolveRetailerId, getRetailerDetails } from '../utils/retailerHelper.js';
import { BRANCHES } from '../../src/data/companyHierarchyData.js';

const ASSIGNMENTS_FILE_PATH = path.resolve(process.cwd(), 'server/data/assignments_db.json');

export const loadDiskAssignments = () => {
  try {
    if (fs.existsSync(ASSIGNMENTS_FILE_PATH)) {
      const data = fs.readFileSync(ASSIGNMENTS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...DEFAULT_ASSIGNMENTS];
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

  // Only fallback to default assignments during automated tests if disk and db are empty
  if (process.env.NODE_ENV === 'test' && disk.length === 0 && dbAssignments.length === 0) {
    DEFAULT_ASSIGNMENTS.forEach((a) => {
      map.set(`${a.zoneId}__${a.storeId}`, a);
    });
  }

  disk.forEach((a) => {
    map.set(`${a.zoneId}__${a.storeId}`, a);
  });
  dbAssignments.forEach((a) => {
    map.set(`${a.zoneId}__${a.storeId}`, a);
  });

  return Array.from(map.values()).filter((a) => a.isActive !== false);
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
        dbZone = await DeliveryZone.findOne({
          $or: [{ zoneId }, { _id: zoneId }, { code: zoneId }]
        }).lean();
      } catch (e) {}
    }
    const zone = dbZone || diskZones.find((z) =>
      z.zoneId === zoneId || z._id === zoneId || z.code === zoneId ||
      String(z.zoneId || '').toLowerCase() === String(zoneId || '').toLowerCase()
    );

    const diskStores = loadDiskStores();
    const allStores = [...BRANCHES, ...diskStores];
    const currentAssignments = await getAllAssignmentsMerged();

    const results = [];
    const warnings = [];

    for (const sId of idsToAssign) {
      const cleanSId = String(sId || '').toLowerCase();
      const store = allStores.find((s) =>
        (s.storeId || s._id || s.id) === sId ||
        String(s.storeId || '').toLowerCase() === cleanSId ||
        String(s._id || '').toLowerCase() === cleanSId
      );
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

      const assignmentRecord = {
        zoneId: zone?.zoneId || zoneId,
        storeId: sId,
        tenantId,
        isActive: true,
        priority: Number(priority || 1),
        assignedAt: new Date().toISOString()
      };

      if (isDbOnline()) {
        try {
          await ZoneStore.findOneAndUpdate(
            { zoneId: assignmentRecord.zoneId, storeId: sId },
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
      const idx = disk.findIndex((a) =>
        (a.zoneId === r.zoneId || String(a.zoneId).toLowerCase() === String(r.zoneId).toLowerCase()) &&
        (a.storeId === r.storeId || String(a.storeId).toLowerCase() === String(r.storeId).toLowerCase())
      );
      if (idx >= 0) {
        disk[idx] = r;
      } else {
        disk.push(r);
      }
    }
    saveDiskAssignments(disk);

    // Also update zone.assignedStoreId in zones_db.json
    if (idsToAssign.length > 0) {
      const targetZoneId = zone?.zoneId || zoneId;
      const zoneIdx = diskZones.findIndex((z) =>
        z.zoneId === targetZoneId || z._id === targetZoneId || z.code === targetZoneId ||
        String(z.zoneId || '').toLowerCase() === String(targetZoneId || '').toLowerCase()
      );
      if (zoneIdx >= 0) {
        diskZones[zoneIdx].assignedStoreId = idsToAssign[0];
        saveDiskZones(diskZones);
      } else {
        const placeholderZone = {
          _id: targetZoneId,
          zoneId: targetZoneId,
          name: zone?.name || req.body.zoneName || `Zone ${targetZoneId}`,
          code: zone?.code || req.body.zoneCode || targetZoneId.slice(-6).toUpperCase(),
          assignedStoreId: idsToAssign[0],
          isActive: true
        };
        diskZones.unshift(placeholderZone);
        saveDiskZones(diskZones);
      }
    }

    // Extract polygon points from zone geometry if available to sync to assigned stores
    let polygonLatLngs = null;
    if (zone?.geometry && Array.isArray(zone.geometry.coordinates?.[0])) {
      polygonLatLngs = zone.geometry.coordinates[0].map(([lng, lat]) => [Number(lat), Number(lng)]);
    }

    // Also update branch in branches_db.json and MongoDB
    try {
      const diskBranches = loadDiskBranches();
      let branchesUpdated = false;
      for (const sId of idsToAssign) {
        const cleanSId = String(sId).toLowerCase();
        const bIdx = diskBranches.findIndex((b) =>
          String(b._id || b.id || '').toLowerCase() === cleanSId
        );
        if (bIdx >= 0) {
          diskBranches[bIdx].assignedZoneId = zone?.zoneId || zoneId;
          if (polygonLatLngs && polygonLatLngs.length >= 3) {
            diskBranches[bIdx].deliveryPolygon = polygonLatLngs;
          }
          saveDiskBranch(diskBranches[bIdx]);
          branchesUpdated = true;
        }

        if (isDbOnline()) {
          try {
            const bUpdates = { assignedZoneId: zone?.zoneId || zoneId };
            if (polygonLatLngs && polygonLatLngs.length >= 3) {
              bUpdates.deliveryPolygon = polygonLatLngs;
            }
            await Branch.findOneAndUpdate(
              { $or: [{ _id: sId }, { id: sId }] },
              { $set: bUpdates }
            );
          } catch (mErr) {}
        }
      }
    } catch (bErr) {
      console.warn('Branch assignment sync warning:', bErr.message);
    }

    // Also update store.assignedZoneId in stores_db.json
    if (diskStores.length > 0) {
      let storeUpdated = false;
      for (const sId of idsToAssign) {
        const cleanSId = String(sId).toLowerCase();
        const sIdx = diskStores.findIndex((s) =>
          String(s.storeId || s._id || '').toLowerCase() === cleanSId
        );
        if (sIdx >= 0) {
          diskStores[sIdx].assignedZoneId = zone?.zoneId || zoneId;
          if (polygonLatLngs && polygonLatLngs.length >= 3) {
            diskStores[sIdx].deliveryPolygon = polygonLatLngs;
          }
          storeUpdated = true;
        }
      }
      if (storeUpdated) saveDiskStores(diskStores);
    }

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
        await ZoneStore.findOneAndUpdate(
          { zoneId, storeId },
          { isActive: false, unassignedAt: new Date() },
          { upsert: true }
        );
      } catch (e) {}
    }

    const disk = loadDiskAssignments();
    const filtered = disk.filter((a) => !(a.zoneId === zoneId && a.storeId === storeId));
    filtered.push({
      zoneId,
      storeId,
      isActive: false,
      unassignedAt: new Date().toISOString()
    });
    saveDiskAssignments(filtered);

    // Clear zone.assignedStoreId in zones_db.json if it was assigned to this store
    const diskZones = loadDiskZones();
    const zIdx = diskZones.findIndex((z) => z.zoneId === zoneId || z._id === zoneId);
    if (zIdx >= 0 && (diskZones[zIdx].assignedStoreId === storeId || String(diskZones[zIdx].assignedStoreId).toLowerCase() === String(storeId).toLowerCase())) {
      diskZones[zIdx].assignedStoreId = null;
      saveDiskZones(diskZones);
    }

    // Clear store.assignedZoneId in stores_db.json
    const diskStores = loadDiskStores();
    const sIdx = diskStores.findIndex((s) => (s.storeId === storeId || s._id === storeId));
    if (sIdx >= 0 && (diskStores[sIdx].assignedZoneId === zoneId || String(diskStores[sIdx].assignedZoneId).toLowerCase() === String(zoneId).toLowerCase())) {
      diskStores[sIdx].assignedZoneId = null;
      saveDiskStores(diskStores);
    }

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
