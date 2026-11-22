import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isPointInsideZone, calculateZoneDeliveryFee, calculatePointDistanceKm } from '../utils/gisValidator.js';
import { getZones, loadDiskZones, getAllZonesMerged } from './zoneController.js';
import { getAllAssignmentsMerged } from './assignmentController.js';
import { loadDiskStores } from './storeController.js';
import { resolveRetailerId, getRetailerDetails, PLATFORM_RETAILERS } from '../utils/retailerHelper.js';
import { BRANCHES } from '../../src/data/companyHierarchyData.js';
import { DeliveryZone } from '../models/DeliveryZone.js';
import { Store } from '../models/Store.js';
import { DeliverySearchLog } from '../models/DeliverySearchLog.js';
import { isDbOnline } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEARCH_LOGS_FILE = path.join(__dirname, '../data/delivery_search_logs.json');

// Helper to check if store is currently operating within its hours
export function isStoreCurrentlyOpen(openingHours = '08:00 AM', closingHours = '11:00 PM') {
  try {
    const parseTime = (str) => {
      if (!str) return 0;
      const [time, modifier] = str.trim().split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (minutes || 0);
    };

    const now = new Date();
    // Pakistan time is UTC+5
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const pkDate = new Date(utc + 3600000 * 5);
    const currentMins = pkDate.getHours() * 60 + pkDate.getMinutes();

    const openMins = parseTime(openingHours);
    const closeMins = parseTime(closingHours);

    if (closeMins >= openMins) {
      return currentMins >= openMins && currentMins <= closeMins;
    } else {
      // Overnight hours (e.g. 8 PM to 2 AM)
      return currentMins >= openMins || currentMins <= closeMins;
    }
  } catch (e) {
    return true; // Default to open if parse fails
  }
}

// Persist search log to MongoDB Atlas and local disk database
export async function persistDeliverySearch(logData) {
  // 1. Save to MongoDB when database is online
  try {
    if (isDbOnline()) {
      await DeliverySearchLog.create(logData);
    }
  } catch (e) {
    console.warn('MongoDB search log persistence fallback:', e.message);
  }

  // 2. Persist to local JSON database file
  try {
    const dir = path.dirname(SEARCH_LOGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let logs = [];
    if (fs.existsSync(SEARCH_LOGS_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(SEARCH_LOGS_FILE, 'utf8')) || [];
      } catch (err) {
        logs = [];
      }
    }
    const newRecord = {
      ...logData,
      _id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    logs.unshift(newRecord);
    if (logs.length > 500) logs = logs.slice(0, 500);
    fs.writeFileSync(SEARCH_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
    return newRecord;
  } catch (e) {
    console.warn('Disk search log write error:', e.message);
    return logData;
  }
}

/**
 * Progressive Store Search Engine:
 * Stage 1 (0 km): Exact location zone polygon match. Stop if eligible store found.
 * Stage 2 (2 km): Nearby branches within 2 km. Enforce delivery eligibility. Stop if found.
 * Stage 3 (3 km): Extended branches within 3 km. Enforce delivery eligibility. Stop if found.
 * Stage 4 (Beyond 3 km): Nearest store alternative, clearly marked as outside coverage.
 */
export async function executeProgressiveSearch({
  latitude,
  longitude,
  address = '',
  city = '',
  cartTotal = 0
}) {
  const userLat = Number(latitude);
  const userLng = Number(longitude);

  if (isNaN(userLat) || isNaN(userLng)) {
    throw new Error('Valid customer coordinates (latitude and longitude) are required.');
  }

  // 1. Retrieve all active delivery zones
  const allMergedZones = await getAllZonesMerged();
  const activeZones = allMergedZones.filter(
    (z) => z.isActive !== false && String(z.status).toLowerCase() !== 'inactive'
  );
  const uniqueZones = new Map();
  activeZones.forEach((z) => {
    if (!uniqueZones.has(z.zoneId)) uniqueZones.set(z.zoneId, z);
  });

  // 2. Retrieve assignments and active stores
  const allAssignments = await getAllAssignmentsMerged();
  const diskStores = loadDiskStores();
  const allStores = [...BRANCHES, ...diskStores];

  const activeStores = allStores.filter((s) => {
    const isStoreActive = s.isActive !== false && String(s.status).toLowerCase() !== 'inactive';
    const tenantId = resolveRetailerId(s.tenantId);
    const retailer = getRetailerDetails(tenantId);
    const isTenantActive = !retailer.status || String(retailer.status).toLowerCase() !== 'suspended';
    return isStoreActive && isTenantActive;
  });

  // Pre-calculate distances and delivery eligibility for all candidate stores
  const evaluatedStores = activeStores.map((s) => {
    const sLat = Number(s.latitude);
    const sLng = Number(s.longitude);
    const distanceKm =
      !isNaN(sLat) && !isNaN(sLng)
        ? calculatePointDistanceKm(userLat, userLng, sLat, sLng)
        : Infinity;

    const configuredRadius = Number(s.deliveryRadiusKm || s.deliveryRadius || 5);
    const hasPolygon = Array.isArray(s.deliveryPolygon) && s.deliveryPolygon.length >= 3;
    const insidePolygon = hasPolygon
      ? isPointInsideZone(userLat, userLng, { type: 'Polygon', coordinates: [s.deliveryPolygon] })
      : false;

    // Delivery eligibility: store must be allowed to deliver to this customer's location
    const allowedToDeliver = hasPolygon ? insidePolygon : distanceKm <= configuredRadius;

    const tenantId = resolveRetailerId(s.tenantId);
    const retailer = getRetailerDetails(tenantId);
    const isOpen = isStoreCurrentlyOpen(s.openingHours || '08:00 AM', s.closingHours || '11:00 PM');

    return {
      store: s,
      storeId: s.storeId || s._id || s.id,
      name: s.name || `${retailer.name} - ${s.branchName}`,
      branchName: s.branchName || s.name,
      tenantId,
      tenantName: retailer.name,
      logo: retailer.logo,
      themeColor: retailer.themeColor,
      address: s.address || `${s.city || 'Faisalabad'}, Pakistan`,
      city: s.city || 'Faisalabad',
      latitude: sLat,
      longitude: sLng,
      distanceKm,
      deliveryRadiusKm: configuredRadius,
      allowedToDeliver,
      isOpen,
      operatingStatus: isOpen ? (s.operatingStatus || 'Open') : 'Closed',
      openingHours: s.openingHours || '08:00 AM',
      closingHours: s.closingHours || '11:00 PM',
      assignedZoneId: s.assignedZoneId || s.deliveryZoneId || null
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  const groupStoresByRetailer = (storeList) => {
    const retailerMap = new Map();
    for (const s of storeList) {
      if (!retailerMap.has(s.tenantId)) {
        retailerMap.set(s.tenantId, {
          tenantId: s.tenantId,
          retailerName: s.tenantName,
          logo: s.logo,
          themeColor: s.themeColor,
          stores: []
        });
      }
      retailerMap.get(s.tenantId).stores.push(s);
    }
    return Array.from(retailerMap.values());
  };

  // =========================================================================
  // STAGE 1 — Customer's exact location (0 km / Zone match)
  // Check delivery zone polygon and its assigned stores. Stop as soon as found.
  // =========================================================================
  const matchingZones = Array.from(uniqueZones.values()).filter((zone) => {
    if (!zone.geometry) return false;
    return isPointInsideZone(userLat, userLng, zone.geometry);
  });

  if (matchingZones.length > 0) {
    const matchingZoneIds = new Set(matchingZones.map((z) => z.zoneId));
    const activeAssignments = allAssignments.filter(
      (a) => matchingZoneIds.has(a.zoneId) && a.isActive !== false
    );
    const assignedStoreIdSet = new Set(activeAssignments.map((a) => a.storeId));

    const stage1EligibleStores = [];

    for (const item of evaluatedStores) {
      const sId = item.storeId;
      const isExplicitlyAssigned = assignedStoreIdSet.has(sId);
      const isStoreAssignedProp = item.assignedZoneId && matchingZoneIds.has(item.assignedZoneId);
      const isZoneAssignedProp = matchingZones.some(
        (z) => z.assignedStoreId === sId || (Array.isArray(z.assignedStoreIds) && z.assignedStoreIds.includes(sId))
      );
      const isPhysicalInZone = matchingZones.some(
        (z) => !isNaN(item.latitude) && !isNaN(item.longitude) && isPointInsideZone(item.latitude, item.longitude, z.geometry)
      );

      if (isExplicitlyAssigned || isStoreAssignedProp || isZoneAssignedProp || isPhysicalInZone) {
        const matchedZone = matchingZones.find((z) => z.zoneId === item.assignedZoneId) || matchingZones[0];
        const feeDetails = calculateZoneDeliveryFee(matchedZone, cartTotal);

        stage1EligibleStores.push({
          ...item,
          zoneId: matchedZone.zoneId,
          zoneName: matchedZone.name,
          searchStage: 1,
          searchRadiusKm: 0,
          deliveryType: 'polygon_zone_match',
          isEligibleForDelivery: true,
          deliveryFee: feeDetails.fee,
          baseDeliveryFee: feeDetails.baseFee,
          isFreeDelivery: feeDetails.isFree,
          minOrderAmount: feeDetails.minOrderAmount,
          freeDeliveryThreshold: feeDetails.freeDeliveryThreshold,
          estimatedDeliveryTime: feeDetails.estimatedDeliveryTime
        });
      }
    }

    if (stage1EligibleStores.length > 0) {
      const result = {
        success: true,
        isDeliverable: true,
        searchStage: 1,
        stageKey: 'zone_match',
        stageLabel: 'Stage 1 — Customer Exact Location (Zone Match)',
        searchRadiusKm: 0,
        stepsTaken: [0],
        message: `Stage 1: Found ${stage1EligibleStores.length} store(s) assigned to delivery zone covering your location.`,
        matchingZones: matchingZones.map((z) => ({
          zoneId: z.zoneId,
          name: z.name,
          city: z.city,
          color: z.color,
          deliveryCharge: z.deliveryCharge
        })),
        eligibleStores: stage1EligibleStores,
        ineligibleNearbyStores: [],
        retailers: groupStoresByRetailer(stage1EligibleStores),
        alternativeStore: null
      };

      await persistDeliverySearch({
        customerCoordinates: { latitude: userLat, longitude: userLng },
        address,
        city,
        searchStage: 1,
        stageKey: 'zone_match',
        stageLabel: result.stageLabel,
        searchRadiusKm: 0,
        stepsTaken: result.stepsTaken,
        isDeliverable: true,
        matchingZones: result.matchingZones,
        eligibleStoresCount: stage1EligibleStores.length,
        eligibleStores: stage1EligibleStores.map((s) => ({
          storeId: s.storeId,
          name: s.name,
          branchName: s.branchName,
          tenantId: s.tenantId,
          distanceKm: s.distanceKm,
          deliveryFee: s.deliveryFee,
          deliveryType: s.deliveryType
        })),
        alternativeStore: null,
        message: result.message
      });

      return result;
    }
  }

  // =========================================================================
  // STAGE 2 — Search nearby branches within 2 km
  // Important: 2 km search must not bypass store delivery eligibility.
  // =========================================================================
  const storesWithin2Km = evaluatedStores.filter((s) => s.distanceKm <= 2.0);
  const stage2EligibleStores = [];
  const stage2IneligibleStores = [];

  for (const item of storesWithin2Km) {
    if (item.allowedToDeliver) {
      stage2EligibleStores.push({
        ...item,
        searchStage: 2,
        searchRadiusKm: 2,
        deliveryType: 'nearby_branch_2km',
        isEligibleForDelivery: true,
        deliveryFee: 50,
        baseDeliveryFee: 50,
        isFreeDelivery: false,
        minOrderAmount: 300,
        freeDeliveryThreshold: 1500,
        estimatedDeliveryTime: '15-25 mins'
      });
    } else {
      stage2IneligibleStores.push({
        ...item,
        searchStage: 2,
        searchRadiusKm: 2,
        isEligibleForDelivery: false,
        deliveryNotice: 'Nearby branch (outside store delivery radius - not delivering)',
        reason: `Store delivery coverage limit is ${item.deliveryRadiusKm} km (${item.distanceKm} km away)`
      });
    }
  }

  if (stage2EligibleStores.length > 0) {
    const result = {
      success: true,
      isDeliverable: true,
      searchStage: 2,
      stageKey: '2km_expansion',
      stageLabel: 'Stage 2 — Nearby Branches (Within 2 km)',
      searchRadiusKm: 2,
      stepsTaken: [0, 2],
      message: `Stage 2: Found ${stage2EligibleStores.length} eligible nearby store(s) within 2 km.`,
      matchingZones: [],
      eligibleStores: stage2EligibleStores,
      ineligibleNearbyStores: stage2IneligibleStores,
      retailers: groupStoresByRetailer(stage2EligibleStores),
      alternativeStore: null
    };

    await persistDeliverySearch({
      customerCoordinates: { latitude: userLat, longitude: userLng },
      address,
      city,
      searchStage: 2,
      stageKey: '2km_expansion',
      stageLabel: result.stageLabel,
      searchRadiusKm: 2,
      stepsTaken: result.stepsTaken,
      isDeliverable: true,
      matchingZones: [],
      eligibleStoresCount: stage2EligibleStores.length,
      eligibleStores: stage2EligibleStores.map((s) => ({
        storeId: s.storeId,
        name: s.name,
        branchName: s.branchName,
        tenantId: s.tenantId,
        distanceKm: s.distanceKm,
        deliveryFee: s.deliveryFee,
        deliveryType: s.deliveryType
      })),
      alternativeStore: null,
      message: result.message
    });

    return result;
  }

  // =========================================================================
  // STAGE 3 — Search further within 3 km
  // Important: 3 km search must not bypass store delivery eligibility.
  // =========================================================================
  const storesWithin3Km = evaluatedStores.filter((s) => s.distanceKm <= 3.0);
  const stage3EligibleStores = [];
  const stage3IneligibleStores = [];

  for (const item of storesWithin3Km) {
    if (item.allowedToDeliver) {
      stage3EligibleStores.push({
        ...item,
        searchStage: 3,
        searchRadiusKm: 3,
        deliveryType: 'extended_branch_3km',
        isEligibleForDelivery: true,
        deliveryFee: 70,
        baseDeliveryFee: 70,
        isFreeDelivery: false,
        minOrderAmount: 400,
        freeDeliveryThreshold: 2000,
        estimatedDeliveryTime: '25-35 mins'
      });
    } else {
      stage3IneligibleStores.push({
        ...item,
        searchStage: 3,
        searchRadiusKm: 3,
        isEligibleForDelivery: false,
        deliveryNotice: 'Nearby branch (outside store delivery radius - not delivering)',
        reason: `Store delivery coverage limit is ${item.deliveryRadiusKm} km (${item.distanceKm} km away)`
      });
    }
  }

  if (stage3EligibleStores.length > 0) {
    const result = {
      success: true,
      isDeliverable: true,
      searchStage: 3,
      stageKey: '3km_expansion',
      stageLabel: 'Stage 3 — Extended Area (Within 3 km)',
      searchRadiusKm: 3,
      stepsTaken: [0, 2, 3],
      message: `Stage 3: Found ${stage3EligibleStores.length} eligible nearby store(s) within 3 km.`,
      matchingZones: [],
      eligibleStores: stage3EligibleStores,
      ineligibleNearbyStores: stage3IneligibleStores,
      retailers: groupStoresByRetailer(stage3EligibleStores),
      alternativeStore: null
    };

    await persistDeliverySearch({
      customerCoordinates: { latitude: userLat, longitude: userLng },
      address,
      city,
      searchStage: 3,
      stageKey: '3km_expansion',
      stageLabel: result.stageLabel,
      searchRadiusKm: 3,
      stepsTaken: result.stepsTaken,
      isDeliverable: true,
      matchingZones: [],
      eligibleStoresCount: stage3EligibleStores.length,
      eligibleStores: stage3EligibleStores.map((s) => ({
        storeId: s.storeId,
        name: s.name,
        branchName: s.branchName,
        tenantId: s.tenantId,
        distanceKm: s.distanceKm,
        deliveryFee: s.deliveryFee,
        deliveryType: s.deliveryType
      })),
      alternativeStore: null,
      message: result.message
    });

    return result;
  }

  // =========================================================================
  // STAGE 4 — Beyond 3 km: Nearest store alternative (No delivery promise)
  // Display nearest store as an alternative, clearly marked as outside coverage.
  // =========================================================================
  const closestStoreItem = evaluatedStores[0] || null;
  const alternativeStore = closestStoreItem
    ? {
        ...closestStoreItem,
        searchStage: 4,
        isEligibleForDelivery: false,
        outsideDeliveryCoverage: true,
        isAlternative: true,
        badge: 'Outside Coverage • Alternative Store',
        deliveryNotice: 'Outside delivery coverage. Available for in-store pickup or browsing only (no delivery promise).',
        estimatedDeliveryTime: 'Delivery unavailable'
      }
    : null;

  const result = {
    success: true,
    isDeliverable: false,
    outsideDeliveryCoverage: true,
    searchStage: 4,
    stageKey: 'beyond_3km_fallback',
    stageLabel: 'Stage 4 — Beyond 3 km (Alternative Nearest Store)',
    searchRadiusKm: closestStoreItem ? Math.round(closestStoreItem.distanceKm) : 5,
    stepsTaken: [0, 2, 3, 'beyond_3km'],
    message: 'Sorry, delivery is currently unavailable at your location.',
    matchingZones: [],
    eligibleStores: [],
    ineligibleNearbyStores: storesWithin3Km.map((s) => ({
      ...s,
      isEligibleForDelivery: false,
      deliveryNotice: 'Outside delivery coverage'
    })),
    retailers: [],
    alternativeStore,
    alternativeStores: alternativeStore ? [alternativeStore] : []
  };

  await persistDeliverySearch({
    customerCoordinates: { latitude: userLat, longitude: userLng },
    address,
    city,
    searchStage: 4,
    stageKey: 'beyond_3km_fallback',
    stageLabel: result.stageLabel,
    searchRadiusKm: result.searchRadiusKm,
    stepsTaken: result.stepsTaken,
    isDeliverable: false,
    matchingZones: [],
    eligibleStoresCount: 0,
    eligibleStores: [],
    alternativeStore: alternativeStore
      ? {
          storeId: alternativeStore.storeId,
          name: alternativeStore.name,
          distanceKm: alternativeStore.distanceKm
        }
      : null,
    message: result.message
  });

  return result;
}

// @desc    Check delivery availability for customer coordinates
// @route   POST /api/delivery/check-availability
export const checkDeliveryAvailability = async (req, res) => {
  try {
    const { latitude, longitude, lat, lng, address = '', city = '' } = req.body;
    const userLat = Number(latitude ?? lat);
    const userLng = Number(longitude ?? lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        message: 'Valid customer coordinates (latitude and longitude) are required.'
      });
    }

    const searchResult = await executeProgressiveSearch({
      latitude: userLat,
      longitude: userLng,
      address,
      city
    });

    return res.json({
      success: true,
      isAvailable: searchResult.isDeliverable,
      searchStage: searchResult.searchStage,
      stageKey: searchResult.stageKey,
      stageLabel: searchResult.stageLabel,
      searchRadiusKm: searchResult.searchRadiusKm,
      stepsTaken: searchResult.stepsTaken,
      message: searchResult.message,
      matchingZones: searchResult.matchingZones,
      eligibleStoresCount: searchResult.eligibleStores.length,
      alternativeStore: searchResult.alternativeStore,
      customerCoordinates: { latitude: userLat, longitude: userLng }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Progressive Store Search Endpoint (0 km → 2 km → 3 km → Fallback)
// @route   POST /api/delivery/progressive-search, POST /api/delivery/eligible-stores
export const getEligibleStores = async (req, res) => {
  try {
    const { latitude, longitude, lat, lng, cartTotal = 0, address = '', city = '' } = req.body;
    const userLat = Number(latitude ?? lat);
    const userLng = Number(longitude ?? lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        message: 'Valid customer coordinates (latitude and longitude) are required.'
      });
    }

    const searchResult = await executeProgressiveSearch({
      latitude: userLat,
      longitude: userLng,
      address,
      city,
      cartTotal: Number(cartTotal) || 0
    });

    return res.json(searchResult);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Retrieve persistent delivery search logs from database / disk
// @route   GET /api/delivery/search-logs
export const getSearchLogs = async (req, res) => {
  try {
    let logs = [];
    if (isDbOnline()) {
      try {
        logs = await DeliverySearchLog.find().sort({ createdAt: -1 }).limit(100).lean();
      } catch (e) {
        logs = [];
      }
    }

    if (!logs || logs.length === 0) {
      if (fs.existsSync(SEARCH_LOGS_FILE)) {
        try {
          logs = JSON.parse(fs.readFileSync(SEARCH_LOGS_FILE, 'utf8')) || [];
        } catch (e) {}
      }
    }

    return res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Calculate authentic server-side delivery fee for given store, zone, and subtotal
// @route   POST /api/delivery/calculate-fee
export const calculateFee = async (req, res) => {
  try {
    const { zoneId, storeId, subtotal = 0, latitude, longitude } = req.body;

    let targetZone = null;
    const allMerged = await getAllZonesMerged();
    if (zoneId) {
      targetZone = allMerged.find((z) => z.zoneId === zoneId);
    }

    if (!targetZone && latitude !== undefined && longitude !== undefined) {
      targetZone = allMerged.find((z) => z.geometry && isPointInsideZone(Number(latitude), Number(longitude), z.geometry));
    }

    if (!targetZone) {
      return res.json({
        success: true,
        deliveryFee: 100,
        baseDeliveryFee: 100,
        isFreeDelivery: false,
        minOrderAmount: 500,
        freeDeliveryThreshold: 2500,
        estimatedDeliveryTime: '25-40 mins'
      });
    }

    const feeDetails = calculateZoneDeliveryFee(targetZone, subtotal);

    return res.json({
      success: true,
      zoneId: targetZone.zoneId,
      zoneName: targetZone.name,
      deliveryFee: feeDetails.fee,
      baseDeliveryFee: feeDetails.baseFee,
      isFreeDelivery: feeDetails.isFree,
      minOrderAmount: feeDetails.minOrderAmount,
      freeDeliveryThreshold: feeDetails.freeDeliveryThreshold,
      estimatedDeliveryTime: feeDetails.estimatedDeliveryTime
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
