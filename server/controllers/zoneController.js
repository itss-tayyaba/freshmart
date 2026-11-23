import fs from 'node:fs';
import path from 'node:path';
import { DeliveryZone } from '../models/DeliveryZone.js';
import { ZoneStore } from '../models/ZoneStore.js';
import { Branch } from '../models/Branch.js';
import { isDbOnline } from '../config/db.js';
import { validateAndNormalizePolygon } from '../utils/gisValidator.js';
import { loadDiskAssignments, saveDiskAssignments } from './assignmentController.js';
import { loadDiskBranches, saveDiskBranch } from './companyBranchController.js';
import { loadDiskStores, saveDiskStores } from './storeController.js';

const ZONES_FILE_PATH = path.resolve(process.cwd(), 'server/data/zones_db.json');

export const loadDiskZones = () => {
  try {
    if (fs.existsSync(ZONES_FILE_PATH)) {
      const data = fs.readFileSync(ZONES_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...DEFAULT_PLATFORM_ZONES];
};

export const saveDiskZones = (zones) => {
  try {
    fs.writeFileSync(ZONES_FILE_PATH, JSON.stringify(zones, null, 2), 'utf-8');
  } catch (e) {}
};

// Default platform delivery zones: 4 Core Master Delivery Zones
export const DEFAULT_PLATFORM_ZONES = [
  // --- 4 Master Delivery Zones (Faisalabad Commercial Footprint) ---
  {
    _id: 'zone_001',
    zoneId: 'zone_001',
    name: 'Zone 1 — Samanabad',
    code: 'ZONE-FSD-SAMANABAD',
    city: 'Faisalabad',
    area: 'Samanabad & West Faisalabad',
    color: '#ea580c',
    deliveryCharge: 60,
    minOrderAmount: 400,
    freeDeliveryThreshold: 2000,
    estimatedDeliveryTime: '20-30 mins',
    isActive: true,
    status: 'active',
    isDeliveryZone: true,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [73.0100, 31.4350],
        [73.0760, 31.4350],
        [73.0760, 31.3650],
        [73.0100, 31.3650],
        [73.0100, 31.4350]
      ]]
    }
  },
  {
    _id: 'zone_002',
    zoneId: 'zone_002',
    name: 'Zone 2 — Madina Town & East Canal',
    code: 'ZONE-FSD-MADINA',
    city: 'Faisalabad',
    area: 'Madina Town & East Canal Corridor',
    color: '#16a34a',
    deliveryCharge: 70,
    minOrderAmount: 450,
    freeDeliveryThreshold: 2200,
    estimatedDeliveryTime: '20-35 mins',
    isActive: true,
    status: 'active',
    isDeliveryZone: true,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [73.0750, 31.4700],
        [73.2000, 31.4700],
        [73.2000, 31.4150],
        [73.0750, 31.4150],
        [73.0750, 31.4700]
      ]]
    }
  },
  {
    _id: 'zone_003',
    zoneId: 'zone_003',
    name: 'Zone 3 — Clock Tower & D-Ground',
    code: 'ZONE-FSD-CLOCKTOWER',
    city: 'Faisalabad',
    area: 'Clock Tower & D-Ground Commercial Hub',
    color: '#0284c7',
    deliveryCharge: 60,
    minOrderAmount: 400,
    freeDeliveryThreshold: 2000,
    estimatedDeliveryTime: '15-25 mins',
    isActive: true,
    status: 'active',
    isDeliveryZone: true,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [73.0450, 31.4350],
        [73.1050, 31.4350],
        [73.1050, 31.3950],
        [73.0450, 31.3950],
        [73.0450, 31.4350]
      ]]
    }
  },
  {
    _id: 'zone_004',
    zoneId: 'zone_004',
    name: "Zone 4 — People's Colony & Kohinoor",
    code: 'ZONE-FSD-PEOPLES',
    city: 'Faisalabad',
    area: "People's Colony 1 & 2 / Kohinoor City",
    color: '#7c3aed',
    deliveryCharge: 65,
    minOrderAmount: 400,
    freeDeliveryThreshold: 2000,
    estimatedDeliveryTime: '15-30 mins',
    isActive: true,
    status: 'active',
    isDeliveryZone: true,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [73.0850, 31.4450],
        [73.1550, 31.4450],
        [73.1550, 31.3850],
        [73.0850, 31.3850],
        [73.0850, 31.4450]
      ]]
    }
  },
  // Legacy alias for test backwards compatibility
  {
    _id: 'ZONE-FSD-CANAL',
    zoneId: 'ZONE-FSD-CANAL',
    name: 'Canal Road & Kohinoor Express Zone',
    code: 'FSD-CNR',
    city: 'Faisalabad',
    area: 'East Canal Road / Kohinoor',
    color: '#2563eb',
    deliveryCharge: 80,
    minOrderAmount: 500,
    freeDeliveryThreshold: 2500,
    estimatedDeliveryTime: '20-30 mins',
    isStoreAreaPolygon: true,
    type: 'store_area_polygon',
    isActive: true,
    status: 'active',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [73.0980, 31.4380],
        [73.1240, 31.4420],
        [73.1310, 31.4220],
        [73.1190, 31.4060],
        [73.0940, 31.4140],
        [73.0980, 31.4380]
      ]]
    }
  },
  // --- Concept 1: 3 Master Store Area Polygons (Geographic Clusters Enclosing Physical Stores) ---
  {
    _id: 'ZONE-FSD-CENTRAL-BLUE',
    zoneId: 'ZONE-FSD-CENTRAL-BLUE',
    name: 'Central Region (D-Ground & Peoples Colony)',
    code: 'FSD-BLUE',
    city: 'Faisalabad',
    area: 'Peoples Colony & D-Ground',
    color: '#2563eb', // Vivid Blue
    description: 'Central Commercial Area grouping flagship supermarket branches.',
    isStoreAreaPolygon: true,
    type: 'store_area_polygon',
    isActive: true,
    status: 'active',
    deliveryCharge: 70,
    minOrderAmount: 300,
    freeDeliveryThreshold: 1500,
    estimatedDeliveryTime: '15-25 mins',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [73.072, 31.432],
        [73.1195, 31.432],
        [73.1195, 31.385],
        [73.072, 31.385],
        [73.072, 31.432]
      ]]
    }
  },
  {
    _id: 'ZONE-FSD-NORTH-GREEN',
    zoneId: 'ZONE-FSD-NORTH-GREEN',
    name: 'North-East Region (Susan Road & Canal Road)',
    code: 'FSD-GREEN',
    city: 'Faisalabad',
    area: 'Susan Road & Madina Town',
    color: '#16a34a', // Vivid Green
    description: 'North-East Commercial Region covering Canal Road and Susan Road marts.',
    isStoreAreaPolygon: true,
    type: 'store_area_polygon',
    isActive: true,
    status: 'active',
    deliveryCharge: 80,
    minOrderAmount: 400,
    freeDeliveryThreshold: 2000,
    estimatedDeliveryTime: '20-30 mins',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [73.095, 31.465],
        [73.148, 31.465],
        [73.148, 31.415],
        [73.095, 31.415],
        [73.095, 31.465]
      ]]
    }
  },
  {
    _id: 'ZONE-FSD-WEST-ORANGE',
    zoneId: 'ZONE-FSD-WEST-ORANGE',
    name: 'West-South Region (Samanabad & Jhang Road)',
    code: 'FSD-ORANGE',
    city: 'Faisalabad',
    area: 'Samanabad & Jhang Road Hub',
    color: '#ea580c', // Vivid Orange
    description: 'Western & Southern commercial corridor covering Samanabad and Jhang Road marts.',
    isStoreAreaPolygon: true,
    type: 'store_area_polygon',
    isActive: true,
    status: 'active',
    deliveryCharge: 75,
    minOrderAmount: 350,
    freeDeliveryThreshold: 1800,
    estimatedDeliveryTime: '25-35 mins',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [73.030, 31.425],
        [73.080, 31.425],
        [73.080, 31.370],
        [73.030, 31.370],
        [73.030, 31.425]
      ]]
    }
  },

  // --- Lahore Master Regional Delivery Zones ---
  {
    _id: 'ZONE-LHR-GULBERG',
    zoneId: 'ZONE-LHR-GULBERG',
    name: 'Gulberg & MM Alam Commercial Hub',
    code: 'LHR-GLB',
    city: 'Lahore',
    area: 'Gulberg & Main Boulevard',
    description: 'Premier shopping, culinary and commercial district of Lahore encompassing Main Boulevard, MM Alam, and Gulberg II & III.',
    color: '#2563eb',
    deliveryCharge: 80,
    minOrderAmount: 450,
    freeDeliveryThreshold: 2200,
    estimatedDeliveryTime: '20-30 mins',
    type: 'delivery_zone',
    isDeliveryZone: true,
    isStoreAreaPolygon: true,
    status: 'active',
    isActive: true,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [74.335, 31.535],
        [74.370, 31.535],
        [74.370, 31.500],
        [74.335, 31.500],
        [74.335, 31.535]
      ]]
    }
  },
  {
    _id: 'ZONE-LHR-DHA',
    zoneId: 'ZONE-LHR-DHA',
    name: 'DHA Phase 1-5 Express Zone',
    code: 'LHR-DHA',
    city: 'Lahore',
    area: 'DHA & Cantt',
    description: 'High-density upscale residential and commercial sector spanning DHA Phases 1 to 5 and Lahore Cantt.',
    color: '#16a34a',
    deliveryCharge: 90,
    minOrderAmount: 500,
    freeDeliveryThreshold: 2500,
    estimatedDeliveryTime: '20-35 mins',
    type: 'delivery_zone',
    isDeliveryZone: true,
    isStoreAreaPolygon: true,
    status: 'active',
    isActive: true,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [74.370, 31.495],
        [74.425, 31.495],
        [74.425, 31.460],
        [74.370, 31.460],
        [74.370, 31.495]
      ]]
    }
  },
  {
    _id: 'ZONE-LHR-MODELTOWN',
    zoneId: 'ZONE-LHR-MODELTOWN',
    name: 'Model Town & Garden Town Hub',
    code: 'LHR-MDL',
    city: 'Lahore',
    area: 'Model Town & Garden Town',
    description: 'Central suburban hub covering Model Town, Garden Town, and Faisal Town commercial zones.',
    color: '#ea580c',
    deliveryCharge: 75,
    minOrderAmount: 400,
    freeDeliveryThreshold: 2000,
    estimatedDeliveryTime: '25-35 mins',
    type: 'delivery_zone',
    isDeliveryZone: true,
    isStoreAreaPolygon: true,
    status: 'active',
    isActive: true,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [74.305, 31.505],
        [74.340, 31.505],
        [74.340, 31.470],
        [74.305, 31.470],
        [74.305, 31.505]
      ]]
    }
  },

  // --- Islamabad Master Regional Delivery Zones ---
  {
    _id: 'ZONE-ISB-F6F7',
    zoneId: 'ZONE-ISB-F6F7',
    name: 'F-6 & F-7 Super Market Corridor',
    code: 'ISB-F67',
    city: 'Islamabad',
    area: 'F-6 & F-7 Super Market',
    description: 'Central shopping, embassy and retail corridor covering F-6, F-7, and Kohsar Market.',
    color: '#7c3aed',
    deliveryCharge: 80,
    minOrderAmount: 450,
    freeDeliveryThreshold: 2200,
    estimatedDeliveryTime: '20-30 mins',
    type: 'delivery_zone',
    isDeliveryZone: true,
    isStoreAreaPolygon: true,
    status: 'active',
    isActive: true,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [73.045, 33.740],
        [73.080, 33.740],
        [73.080, 33.710],
        [73.045, 33.710],
        [73.045, 33.740]
      ]]
    }
  },
  {
    _id: 'ZONE-ISB-BLUEAREA',
    zoneId: 'ZONE-ISB-BLUEAREA',
    name: 'Blue Area & Commercial Corridor',
    code: 'ISB-BLU',
    city: 'Islamabad',
    area: 'Blue Area & G-6/G-7',
    description: 'Central business district spine spanning Jinnah Avenue, Blue Area, and neighboring G-6/G-7 sectors.',
    color: '#0284c7',
    deliveryCharge: 80,
    minOrderAmount: 450,
    freeDeliveryThreshold: 2200,
    estimatedDeliveryTime: '20-30 mins',
    type: 'delivery_zone',
    isDeliveryZone: true,
    isStoreAreaPolygon: true,
    status: 'active',
    isActive: true,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [73.055, 33.725],
        [73.095, 33.725],
        [73.095, 33.695],
        [73.055, 33.695],
        [73.055, 33.725]
      ]]
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

  DEFAULT_PLATFORM_ZONES.forEach((z) => map.set(z.zoneId, z));
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
    const { city, status, search, type, scope } = req.query;
    let zones = await getAllZonesMerged();

    if (type === 'master' || scope === 'master') {
      zones = zones.filter((z) => {
        if (z.isStoreAreaPolygon || z.type === 'store_area_polygon') return false;
        const zCity = String(z.city || '').toLowerCase().trim();
        const zId = z.zoneId || z._id;
        if ((zCity === 'faisalabad' || zCity.includes('fsd')) && !['zone_001', 'zone_002', 'zone_003', 'zone_004'].includes(zId)) {
          return false;
        }
        return true;
      });
    }

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
      isStoreAreaPolygon: req.body.isStoreAreaPolygon === true || req.body.type === 'store_area_polygon',
      type: req.body.type || (req.body.isStoreAreaPolygon ? 'store_area_polygon' : 'delivery_zone'),
      isActive: isActive !== false && String(status).toLowerCase() !== 'inactive',
      status: status || 'active'
    };

    // Save to MongoDB
    if (isDbOnline()) {
      try {
        const insertDoc = { ...newZoneData };
        delete insertDoc._id;
        await DeliveryZone.findOneAndUpdate(
          { zoneId: generatedId },
          { $set: insertDoc, $setOnInsert: { _id: generatedId } },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
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

        // Bidirectional sync: propagate delivery polygon & assignedZoneId to branch
        let polygonLatLngs = null;
        if (normalizedGeometry && Array.isArray(normalizedGeometry.coordinates?.[0])) {
          polygonLatLngs = normalizedGeometry.coordinates[0].map(([lng, lat]) => [Number(lat), Number(lng)]);
        }
        const cleanStoreId = String(targetStoreId).toLowerCase().trim();
        const diskBranches = loadDiskBranches();
        const bIdx = diskBranches.findIndex((b) => String(b._id || b.id || '').toLowerCase().trim() === cleanStoreId);
        if (bIdx >= 0) {
          diskBranches[bIdx].assignedZoneId = generatedId;
          if (polygonLatLngs && polygonLatLngs.length >= 3) {
            diskBranches[bIdx].deliveryPolygon = polygonLatLngs;
          }
          saveDiskBranch(diskBranches[bIdx]);
        }
        if (isDbOnline()) {
          try {
            const bUpdates = { assignedZoneId: generatedId };
            if (polygonLatLngs && polygonLatLngs.length >= 3) bUpdates.deliveryPolygon = polygonLatLngs;
            await Branch.findOneAndUpdate({ $or: [{ _id: targetStoreId }, { id: targetStoreId }] }, { $set: bUpdates });
          } catch (mErr) {}
        }
        const diskStores = loadDiskStores();
        const sIdx = diskStores.findIndex((s) => String(s.storeId || s._id || '').toLowerCase().trim() === cleanStoreId);
        if (sIdx >= 0) {
          diskStores[sIdx].assignedZoneId = generatedId;
          if (polygonLatLngs && polygonLatLngs.length >= 3) diskStores[sIdx].deliveryPolygon = polygonLatLngs;
          saveDiskStores(diskStores);
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
        const updateDoc = { ...updates };
        delete updateDoc._id;
        await DeliveryZone.findOneAndUpdate(
          { $or: [{ zoneId: id }, { _id: id }] },
          {
            $set: { ...updateDoc, zoneId: id },
            $setOnInsert: { _id: id }
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      } catch (dbErr) {
        console.warn('MongoDB DeliveryZone update warning:', dbErr.message);
      }
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

    // Bidirectional sync: propagate delivery polygon & zone id to the assigned branch & store
    let polygonLatLngs = null;
    if (updates.geometry && Array.isArray(updates.geometry.coordinates?.[0])) {
      polygonLatLngs = updates.geometry.coordinates[0].map(([lng, lat]) => [Number(lat), Number(lng)]);
    }
    const storeToSync = targetStoreId || disk[index]?.assignedStoreId || updates.assignedStoreId;
    if (storeToSync) {
      try {
        const cleanStoreId = String(storeToSync).toLowerCase().trim();
        const diskBranches = loadDiskBranches();
        const bIdx = diskBranches.findIndex(
          (b) => String(b._id || b.id || '').toLowerCase().trim() === cleanStoreId
        );
        if (bIdx >= 0) {
          diskBranches[bIdx].assignedZoneId = id;
          if (polygonLatLngs && polygonLatLngs.length >= 3) {
            diskBranches[bIdx].deliveryPolygon = polygonLatLngs;
          }
          if (updates.deliveryCharge != null) {
            diskBranches[bIdx].deliveryTiers = [
              { distanceKm: 2, fee: Number(updates.deliveryCharge) }
            ];
          }
          saveDiskBranch(diskBranches[bIdx]);
        }

        if (isDbOnline()) {
          try {
            const bUpdates = { assignedZoneId: id };
            if (polygonLatLngs && polygonLatLngs.length >= 3) {
              bUpdates.deliveryPolygon = polygonLatLngs;
            }
            await Branch.findOneAndUpdate(
              { $or: [{ _id: storeToSync }, { id: storeToSync }] },
              { $set: bUpdates }
            );
          } catch (mErr) {}
        }

        const diskStores = loadDiskStores();
        const sIdx = diskStores.findIndex((s) => String(s.storeId || s._id || '').toLowerCase().trim() === cleanStoreId);
        if (sIdx >= 0) {
          diskStores[sIdx].assignedZoneId = id;
          if (polygonLatLngs && polygonLatLngs.length >= 3) {
            diskStores[sIdx].deliveryPolygon = polygonLatLngs;
          }
          saveDiskStores(diskStores);
        }
      } catch (syncErr) {
        console.warn('Zone-to-Branch sync error:', syncErr.message);
      }
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
        await Branch.updateMany({ assignedZoneId: id }, { $set: { assignedZoneId: null } });
        const { Store } = await import('../models/Store.js');
        await Store.updateMany({ assignedZoneId: id }, { $set: { assignedZoneId: null } });
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

      const diskBranches = loadDiskBranches();
      diskBranches.forEach((b) => {
        if (b.assignedZoneId === id) {
          b.assignedZoneId = null;
          saveDiskBranch(b);
        }
      });
      const diskStores = loadDiskStores();
      let storesChanged = false;
      diskStores.forEach((s) => {
        if (s.assignedZoneId === id) {
          s.assignedZoneId = null;
          storesChanged = true;
        }
      });
      if (storesChanged) saveDiskStores(diskStores);
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
        const updateDoc = { ...updates };
        delete updateDoc._id;
        await DeliveryZone.findOneAndUpdate(
          { $or: [{ zoneId: id }, { _id: id }] },
          {
            $set: { ...updateDoc, zoneId: id },
            $setOnInsert: { _id: id }
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      } catch (dbErr) {
        console.warn('MongoDB DeliveryZone update warning:', dbErr.message);
      }
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
