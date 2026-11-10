import { isPointInsideZone, calculateZoneDeliveryFee } from '../utils/gisValidator.js';
import { getZones, loadDiskZones, getAllZonesMerged } from './zoneController.js';
import { getAllAssignmentsMerged } from './assignmentController.js';
import { loadDiskStores } from './storeController.js';
import { resolveRetailerId, getRetailerDetails, PLATFORM_RETAILERS } from '../utils/retailerHelper.js';
import { BRANCHES } from '../../src/data/companyHierarchyData.js';
import { DeliveryZone } from '../models/DeliveryZone.js';
import { Store } from '../models/Store.js';
import { isDbOnline } from '../config/db.js';

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

// @desc    Check delivery availability for customer coordinates
// @route   POST /api/delivery/check-availability
export const checkDeliveryAvailability = async (req, res) => {
  try {
    const { latitude, longitude, lat, lng, address } = req.body;
    const userLat = Number(latitude ?? lat);
    const userLng = Number(longitude ?? lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        message: 'Valid customer coordinates (latitude and longitude) are required.'
      });
    }

    // Retrieve active delivery zones
    const allMerged = await getAllZonesMerged();
    const allActiveZones = allMerged.filter((z) => z.isActive !== false && String(z.status).toLowerCase() !== 'inactive');

    // Deduplicate zones
    const zoneMap = new Map();
    allActiveZones.forEach((z) => {
      if (!zoneMap.has(z.zoneId)) zoneMap.set(z.zoneId, z);
    });

    // Check which zones contain the point using boundary-inclusive Turf point-in-polygon
    const matchingZones = Array.from(zoneMap.values()).filter((z) => {
      if (!z.geometry) return false;
      return isPointInsideZone(userLat, userLng, z.geometry);
    });

    if (matchingZones.length === 0) {
      return res.json({
        success: true,
        isAvailable: false,
        message: 'Sorry, delivery is currently unavailable at your location.',
        matchingZones: [],
        customerCoordinates: { latitude: userLat, longitude: userLng }
      });
    }

    return res.json({
      success: true,
      isAvailable: true,
      message: `Delivery available in ${matchingZones.length} zone(s).`,
      matchingZones: matchingZones.map((z) => ({
        zoneId: z.zoneId,
        name: z.name,
        code: z.code,
        city: z.city,
        color: z.color,
        deliveryCharge: z.deliveryCharge,
        minOrderAmount: z.minOrderAmount,
        freeDeliveryThreshold: z.freeDeliveryThreshold,
        estimatedDeliveryTime: z.estimatedDeliveryTime
      })),
      customerCoordinates: { latitude: userLat, longitude: userLng }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all eligible stores for customer location (Point-in-Polygon + Zone-Store Assignments + Tenant/Store Status + Hours)
// @route   POST /api/delivery/eligible-stores
export const getEligibleStores = async (req, res) => {
  try {
    const { latitude, longitude, lat, lng, cartTotal = 0 } = req.body;
    const userLat = Number(latitude ?? lat);
    const userLng = Number(longitude ?? lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        message: 'Valid customer coordinates (latitude and longitude) are required.'
      });
    }

    // 1. Retrieve all active zones
    const allMerged = await getAllZonesMerged();
    const activeZones = allMerged.filter((z) => z.isActive !== false && String(z.status).toLowerCase() !== 'inactive');

    const uniqueZones = new Map();
    activeZones.forEach((z) => {
      if (!uniqueZones.has(z.zoneId)) uniqueZones.set(z.zoneId, z);
    });

    // 2. Point-in-polygon verification for each zone
    const matchingZones = Array.from(uniqueZones.values()).filter((zone) => {
      if (!zone.geometry) return false;
      return isPointInsideZone(userLat, userLng, zone.geometry);
    });

    // If no matching delivery zones:
    if (matchingZones.length === 0) {
      return res.json({
        success: true,
        isDeliverable: false,
        message: 'Sorry, delivery is currently unavailable at your location.',
        matchingZones: [],
        eligibleStores: [],
        retailers: []
      });
    }

    // 3. Retrieve zone-store assignments
    const allAssignments = await getAllAssignmentsMerged();
    const matchingZoneIds = new Set(matchingZones.map((z) => z.zoneId));
    const activeAssignments = allAssignments.filter(
      (a) => matchingZoneIds.has(a.zoneId) && a.isActive !== false
    );

    // 4. Retrieve all stores
    const diskStores = loadDiskStores();
    const allStores = [...BRANCHES, ...diskStores];

    // Collect all candidate assigned stores for matching zones
    const candidateStoreEntries = [];

    // From explicit assignments table
    for (const a of activeAssignments) {
      const store = allStores.find((s) => (s.storeId || s._id || s.id) === a.storeId);
      if (store) {
        candidateStoreEntries.push({ store, zoneId: a.zoneId, tenantId: a.tenantId || store.tenantId });
      }
    }

    // From zone.assignedStoreId property
    for (const z of matchingZones) {
      if (z.assignedStoreId) {
        const store = allStores.find((s) => (s.storeId || s._id || s.id) === z.assignedStoreId);
        if (store && !candidateStoreEntries.some((c) => (c.store.storeId || c.store._id) === (store.storeId || store._id))) {
          candidateStoreEntries.push({ store, zoneId: z.zoneId, tenantId: store.tenantId });
        }
      }
    }

    // From store.assignedZoneId property
    for (const s of allStores) {
      if (s.assignedZoneId && matchingZoneIds.has(s.assignedZoneId)) {
        if (!candidateStoreEntries.some((c) => (c.store.storeId || c.store._id) === (s.storeId || s._id))) {
          candidateStoreEntries.push({ store: s, zoneId: s.assignedZoneId, tenantId: s.tenantId });
        }
      }
    }

    // Fallback: If a zone has no assigned store yet, check stores whose physical coordinates lie inside that zone polygon
    if (candidateStoreEntries.length === 0) {
      for (const z of matchingZones) {
        for (const s of allStores) {
          const sLat = Number(s.latitude);
          const sLng = Number(s.longitude);
          if (!isNaN(sLat) && !isNaN(sLng) && isPointInsideZone(sLat, sLng, z.geometry)) {
            if (!candidateStoreEntries.some((c) => (c.store.storeId || c.store._id) === (s.storeId || s._id))) {
              candidateStoreEntries.push({ store: s, zoneId: z.zoneId, tenantId: s.tenantId });
            }
          }
        }
      }
    }

    // 5. Build eligible stores list
    const eligibleStoreMap = new Map();

    for (const entry of candidateStoreEntries) {
      const { store, zoneId } = entry;
      if (!store) continue;

      // Check store active status
      const isStoreActive = store.isActive !== false && String(store.status).toLowerCase() !== 'inactive';
      if (!isStoreActive) continue;

      // Check tenant active status
      const tenantId = resolveRetailerId(entry.tenantId || store.tenantId);
      const retailer = getRetailerDetails(tenantId);
      if (retailer.status && String(retailer.status).toLowerCase() === 'suspended') {
        continue;
      }

      // Find the matched zone for delivery charges
      const matchedZone = matchingZones.find((z) => z.zoneId === zoneId) || matchingZones[0];
      const feeDetails = calculateZoneDeliveryFee(matchedZone, cartTotal);

      // Check operating hours
      const isOpen = isStoreCurrentlyOpen(store.openingHours || '08:00 AM', store.closingHours || '11:00 PM');

      const sId = store.storeId || store._id || store.id;

      if (!eligibleStoreMap.has(sId)) {
        eligibleStoreMap.set(sId, {
          storeId: sId,
          _id: sId,
          name: store.name || `${retailer.name} - ${store.branchName}`,
          branchName: store.branchName || store.name,
          tenantId,
          tenantName: retailer.name,
          logo: retailer.logo,
          themeColor: retailer.themeColor,
          address: store.address || `${store.city}, Pakistan`,
          city: store.city || 'Faisalabad',
          latitude: Number(store.latitude),
          longitude: Number(store.longitude),
          contactNumber: store.contactNumber || store.phone || '+92 300 0000000',
          openingHours: store.openingHours || '08:00 AM',
          closingHours: store.closingHours || '11:00 PM',
          storeImage: store.storeImage || store.banner || retailer.banner,
          operatingStatus: isOpen ? (store.operatingStatus || 'Open') : 'Closed',
          isOpen,
          zoneId: matchedZone.zoneId,
          zoneName: matchedZone.name,
          deliveryFee: feeDetails.fee,
          baseDeliveryFee: feeDetails.baseFee,
          isFreeDelivery: feeDetails.isFree,
          minOrderAmount: feeDetails.minOrderAmount,
          freeDeliveryThreshold: feeDetails.freeDeliveryThreshold,
          estimatedDeliveryTime: feeDetails.estimatedDeliveryTime
        });
      }
    }

    const eligibleStores = Array.from(eligibleStoreMap.values());

    // Group eligible stores by retailer
    const retailerGroups = new Map();
    for (const s of eligibleStores) {
      if (!retailerGroups.has(s.tenantId)) {
        const rDetails = getRetailerDetails(s.tenantId);
        retailerGroups.set(s.tenantId, {
          tenantId: s.tenantId,
          retailerName: rDetails.name,
          displayName: rDetails.displayName,
          logo: rDetails.logo,
          themeColor: rDetails.themeColor,
          stores: []
        });
      }
      retailerGroups.get(s.tenantId).stores.push(s);
    }

    return res.json({
      success: true,
      isDeliverable: eligibleStores.length > 0,
      message: eligibleStores.length > 0
        ? `Found ${eligibleStores.length} eligible store(s) across ${retailerGroups.size} retailer(s).`
        : 'Sorry, no active stores are currently assigned to deliver to your zone.',
      matchingZones: matchingZones.map((z) => ({
        zoneId: z.zoneId,
        name: z.name,
        code: z.code,
        deliveryCharge: z.deliveryCharge,
        estimatedDeliveryTime: z.estimatedDeliveryTime
      })),
      eligibleStores,
      retailers: Array.from(retailerGroups.values())
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

    // Fallback if coordinates provided instead of zoneId
    if (!targetZone && latitude !== undefined && longitude !== undefined) {
      targetZone = allMerged.find((z) => z.geometry && isPointInsideZone(Number(latitude), Number(longitude), z.geometry));
    }

    if (!targetZone) {
      // Default standard fee
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
