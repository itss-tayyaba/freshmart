import fs from 'node:fs';
import path from 'node:path';
import { DeliveryZone } from '../models/DeliveryZone.js';
import { ZoneStore } from '../models/ZoneStore.js';
import { isDbOnline } from '../config/db.js';
import { validateAndNormalizePolygon } from '../utils/gisValidator.js';
import { loadDiskAssignments, saveDiskAssignments } from './assignmentController.js';

const ZONES_FILE_PATH = path.resolve(process.cwd(), 'server/data/zones_db.json');

export const loadDiskZones = () => {
  try {
    if (fs.existsSync(ZONES_FILE_PATH)) {
      const data = fs.readFileSync(ZONES_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

export const saveDiskZones = (zones) => {
  try {
    fs.writeFileSync(ZONES_FILE_PATH, JSON.stringify(zones, null, 2), 'utf-8');
  } catch (e) {}
};

// Default delivery zones for Faisalabad so the platform starts with realistic delivery coverage
const DEFAULT_PLATFORM_ZONES = [
  {
    zoneId: 'ZONE-FSD-DGROUND',
    name: 'D-Ground Commercial & Peoples Colony Hub',
    code: 'FSD-DGR',
    description: 'Premier commercial, dining, and central residential zone surrounding D-Ground and Peoples Colony 1 & 2.',
    city: 'Faisalabad',
    area: 'D-Ground / Peoples Colony',
    color: '#10b981', // Emerald Green
    deliveryCharge: 60,
    minOrderAmount: 400,
    freeDeliveryThreshold: 2000,
    estimatedDeliveryTime: '15-25 mins',
    isActive: true,
    status: 'active',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [73.0700, 31.3900],
          [73.1150, 31.3900],
          [73.1250, 31.4250],
          [73.0800, 31.4300],
          [73.0650, 31.4050],
          [73.0700, 31.3900]
        ]
      ]
    }
  },
  {
    zoneId: 'ZONE-FSD-CANAL',
    name: 'Canal Road & Kohinoor Express Zone',
    code: 'FSD-CNR',
    description: 'High-density urban residential corridor along East Canal Road, Jaranwala Road, and Kohinoor City.',
    city: 'Faisalabad',
    area: 'East Canal Road / Kohinoor',
    color: '#6366f1', // Indigo Purple
    deliveryCharge: 80,
    minOrderAmount: 500,
    freeDeliveryThreshold: 2500,
    estimatedDeliveryTime: '20-35 mins',
    isActive: true,
    status: 'active',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [73.0900, 31.4100],
          [73.1600, 31.4200],
          [73.1750, 31.4650],
          [73.1150, 31.4550],
          [73.0900, 31.4100]
        ]
      ]
    }
  },
  {
    zoneId: 'ZONE-FSD-CLOCKTOWER',
    name: 'Clock Tower & Eight Bazars Historic Zone',
    code: 'FSD-CTW',
    description: 'Central historic trading district covering Ghanta Ghar, Katchery Bazar, Rail Bazar, and Kotwali Road.',
    city: 'Faisalabad',
    area: 'Ghanta Ghar / 8 Bazars',
    color: '#f59e0b', // Amber Orange
    deliveryCharge: 90,
    minOrderAmount: 500,
    freeDeliveryThreshold: 2500,
    estimatedDeliveryTime: '25-40 mins',
    isActive: true,
    status: 'active',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [73.0450, 31.3900],
          [73.0950, 31.3900],
          [73.0950, 31.4300],
          [73.0450, 31.4300],
          [73.0450, 31.3900]
        ]
      ]
    }
  },
  {
    zoneId: 'ZONE-FSD-MADINA',
    name: 'Madina Town & Susan Road Hub',
    code: 'FSD-MDN',
    description: 'Bustling retail and residential sectors of Madina Town, Susan Road, and Officer Colony.',
    city: 'Faisalabad',
    area: 'Madina Town / Susan Road',
    color: '#06b6d4', // Cyan
    deliveryCharge: 70,
    minOrderAmount: 450,
    freeDeliveryThreshold: 2200,
    estimatedDeliveryTime: '20-30 mins',
    isActive: true,
    status: 'active',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [73.1000, 31.4200],
          [73.1450, 31.4200],
          [73.1500, 31.4500],
          [73.0950, 31.4450],
          [73.1000, 31.4200]
        ]
      ]
    }
  }
];

// Helper to get all combined zones
export const getAllZonesMerged = async () => {
  let dbZones = [];
  if (isDbOnline()) {
    try {
      dbZones = await DeliveryZone.find({}).lean();
    } catch (err) {
      console.warn('DeliveryZone DB fetch error:', err.message);
    }
  }

  const diskZones = loadDiskZones();
  const map = new Map();

  // Default platform zones provide baseline coverage if disk and db are completely empty
  if (diskZones.length === 0 && dbZones.length === 0) {
    DEFAULT_PLATFORM_ZONES.forEach((z) => map.set(z.zoneId, z));
  }

  diskZones.forEach((z) => map.set(z.zoneId, z));
  dbZones.forEach((z) => map.set(z.zoneId, {
    ...z,
    isActive: z.isActive !== false && String(z.status).toLowerCase() !== 'inactive'
  }));

  return Array.from(map.values());
};

// @desc    Get all delivery zones
// @route   GET /api/admin/zones
export const getZones = async (req, res) => {
  try {
    const { city, status, search } = req.query;
    let zones = await getAllZonesMerged();

    if (city && city !== 'all') {
      zones = zones.filter((z) => String(z.city || '').toLowerCase() === city.toLowerCase());
    }

    if (status && status !== 'all') {
      const isReqActive = status.toLowerCase() === 'active';
      zones = zones.filter((z) => z.isActive === isReqActive);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      zones = zones.filter(
        (z) =>
          String(z.name || '').toLowerCase().includes(q) ||
          String(z.code || '').toLowerCase().includes(q) ||
          String(z.area || '').toLowerCase().includes(q) ||
          String(z.description || '').toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      count: zones.length,
      zones
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get zone by ID
// @route   GET /api/admin/zones/:id
export const getZoneById = async (req, res) => {
  try {
    const { id } = req.params;
    const zones = await getAllZonesMerged();
    const zone = zones.find((z) => z.zoneId === id || z._id === id);

    if (!zone) {
      return res.status(404).json({ success: false, message: 'Delivery zone not found.' });
    }

    return res.json({ success: true, zone });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new delivery zone with full backend polygon geometry validation
// @route   POST /api/admin/zones
export const createZone = async (req, res) => {
  try {
    const {
      zoneId,
      name,
      code,
      description,
      city,
      area,
      coordinates, // Accepts GeoJSON [[[lng, lat]]] or points [{lat, lng}]
      geometry,
      color,
      deliveryCharge,
      minOrderAmount,
      freeDeliveryThreshold,
      estimatedDeliveryTime,
      isActive,
      status
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Zone name and code are required.' });
    }

    // Backend geometry validation: Turf.js point validation, minimum 3 distinct points, closed ring, no self-intersections
    let normalizedGeometry;
    try {
      const rawGeom = geometry?.coordinates || coordinates;
      normalizedGeometry = validateAndNormalizePolygon(rawGeom);
    } catch (valErr) {
      return res.status(400).json({
        success: false,
        message: `Polygon geometry validation error: ${valErr.message}`
      });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const generatedId = zoneId || `ZONE-${cleanCode}-${Date.now().toString().slice(-4)}`;

    const newZoneData = {
      _id: generatedId,
      zoneId: generatedId,
      name,
      code: cleanCode,
      description: description || '',
      city: city || 'Faisalabad',
      area: area || name,
      color: color || '#10b981',
      geometry: normalizedGeometry,
      deliveryCharge: Number(deliveryCharge ?? 100),
      minOrderAmount: Number(minOrderAmount ?? 500),
      freeDeliveryThreshold: Number(freeDeliveryThreshold ?? 2500),
      estimatedDeliveryTime: estimatedDeliveryTime || '25-40 mins',
      isActive: isActive !== false && String(status).toLowerCase() !== 'inactive',
      status: status || 'active'
    };

    // Save to MongoDB
    if (isDbOnline()) {
      try {
        await DeliveryZone.findOneAndUpdate({ zoneId: generatedId }, newZoneData, { upsert: true, new: true });
      } catch (dbErr) {
        console.warn('MongoDB DeliveryZone save warning:', dbErr.message);
      }
    }

    // Save to disk
    const disk = loadDiskZones();
    const filteredDisk = disk.filter((z) => z.zoneId !== generatedId);
    filteredDisk.unshift(newZoneData);
    saveDiskZones(filteredDisk);

    // Optional: automatically link assigned store to this delivery zone
    const targetStoreId = req.body.assignedStoreId || req.body.storeId;
    if (targetStoreId) {
      try {
        const diskAssignments = loadDiskAssignments();
        const existingIdx = diskAssignments.findIndex((a) => a.zoneId === generatedId && a.storeId === targetStoreId);
        const assignRecord = {
          zoneId: generatedId,
          storeId: targetStoreId,
          tenantId: req.body.tenantId || 'tenant-unimart',
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
          try {
            await ZoneStore.findOneAndUpdate({ zoneId: generatedId, storeId: targetStoreId }, assignRecord, { upsert: true });
          } catch (e) {}
        }
      } catch (e) {}
    }

    return res.status(201).json({
      success: true,
      message: 'Delivery zone created and verified successfully.',
      zone: newZoneData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update delivery zone
// @route   PUT /api/admin/zones/:id
export const updateZone = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // If coordinates or geometry are provided, validate strictly
    if (updates.coordinates || updates.geometry) {
      try {
        const rawGeom = updates.geometry?.coordinates || updates.coordinates;
        updates.geometry = validateAndNormalizePolygon(rawGeom);
        delete updates.coordinates;
      } catch (valErr) {
        return res.status(400).json({
          success: false,
          message: `Polygon geometry validation error: ${valErr.message}`
        });
      }
    }

    if (updates.isActive !== undefined) {
      updates.status = updates.isActive ? 'active' : 'inactive';
    } else if (updates.status) {
      updates.isActive = String(updates.status).toLowerCase() === 'active';
    }

    if (isDbOnline()) {
      try {
        await DeliveryZone.findOneAndUpdate({ $or: [{ zoneId: id }, { _id: id }] }, updates, { new: true });
      } catch (dbErr) {}
    }

    const disk = loadDiskZones();
    const index = disk.findIndex((z) => z.zoneId === id || z._id === id);
    if (index >= 0) {
      disk[index] = { ...disk[index], ...updates };
      saveDiskZones(disk);
    } else {
      disk.unshift({ zoneId: id, ...updates });
      saveDiskZones(disk);
    }

    // Optional: update store assignment for this zone
    const targetStoreId = req.body.assignedStoreId || req.body.storeId;
    if (targetStoreId !== undefined) {
      try {
        const diskAssignments = loadDiskAssignments();
        if (!targetStoreId) {
          saveDiskAssignments(diskAssignments.filter((a) => a.zoneId !== id));
          if (isDbOnline()) {
            await ZoneStore.deleteMany({ zoneId: id });
          }
        } else {
          const existingIdx = diskAssignments.findIndex((a) => a.zoneId === id && a.storeId === targetStoreId);
          const assignRecord = {
            zoneId: id,
            storeId: targetStoreId,
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
            await ZoneStore.findOneAndUpdate({ zoneId: id, storeId: targetStoreId }, assignRecord, { upsert: true });
          }
        }
      } catch (e) {}
    }

    return res.json({
      success: true,
      message: 'Delivery zone updated successfully.',
      zoneId: id,
      updates
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete delivery zone
// @route   DELETE /api/admin/zones/:id
export const deleteZone = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbOnline()) {
      try {
        await DeliveryZone.findOneAndDelete({ $or: [{ zoneId: id }, { _id: id }] });
        await ZoneStore.deleteMany({ zoneId: id });
      } catch (dbErr) {}
    }

    const disk = loadDiskZones();
    const filtered = disk.filter((z) => z.zoneId !== id && z._id !== id);
    saveDiskZones(filtered);

    // Remove assignments for this zone
    try {
      const diskAssignments = loadDiskAssignments();
      const filteredAssignments = diskAssignments.filter((a) => a.zoneId !== id);
      saveDiskAssignments(filteredAssignments);
    } catch (e) {}

    return res.json({
      success: true,
      message: 'Delivery zone deleted successfully.',
      zoneId: id
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle zone active/inactive status
// @route   PATCH /api/admin/zones/:id/status
export const toggleZoneStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    const newActive = isActive !== undefined ? Boolean(isActive) : String(status).toLowerCase() === 'active';
    const newStatus = newActive ? 'active' : 'inactive';

    const updates = { isActive: newActive, status: newStatus };

    if (isDbOnline()) {
      try {
        await DeliveryZone.findOneAndUpdate({ $or: [{ zoneId: id }, { _id: id }] }, updates, { new: true });
      } catch (dbErr) {}
    }

    const disk = loadDiskZones();
    const target = disk.find((z) => z.zoneId === id || z._id === id);
    if (target) {
      Object.assign(target, updates);
      saveDiskZones(disk);
    }

    return res.json({
      success: true,
      message: `Zone status changed to ${newStatus}.`,
      zoneId: id,
      isActive: newActive,
      status: newStatus
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
