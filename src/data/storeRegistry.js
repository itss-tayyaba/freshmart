// =============================================================================
// SINGLE SOURCE OF TRUTH for every physical store / branch on the platform.
// Imported by BOTH the Express server and the React app, so every screen
// (Super Admin dashboard, Zone Assignment, checkout, admin login, riders,
// pickup staff, orders) counts and routes from the SAME list.
//
// To add a store: add ONE entry below, then run `npm run seed:stores`.
// Rule: storeId === branchId. Every order, rider, pickup-staff and admin
// record carries this id, and the API filters on it.
//
// NOTE: coordinates are approximate. Verify each pin on the Zone map.
// =============================================================================

export const RETAILERS = {
  'tenant-alfatah': { name: 'Al-Fatah', fullName: 'Al-Fatah Supermarket', domain: 'alfatah.pk', code: 'AF' },
  'tenant-chaseup': { name: 'Chase Up', fullName: 'Chase Up', domain: 'chaseup.pk', code: 'CU' },
  'tenant-chasevalue': { name: 'Chase Value', fullName: 'Chase Value', domain: 'chasevalue.pk', code: 'CV' },
  'tenant-unimart': { name: 'Unimart', fullName: 'Unimart (Market Store)', domain: 'unimart.pk', code: 'UM' }
};

const store = (id, tenantId, branchName, address, lat, lng, zoneId, phone, isNew = false) => ({
  storeId: id,
  branchId: id,
  tenantId,
  tenantName: RETAILERS[tenantId].fullName,
  retailerName: RETAILERS[tenantId].name,
  branchName,
  name: `${RETAILERS[tenantId].name} - ${branchName}`,
  address,
  city: 'Faisalabad',
  coords: { lat, lng },
  assignedZoneId: zoneId,
  contactNumber: phone,
  deliveryRadiusKm: 5,
  isNew
});

export const STORE_REGISTRY = [
  // ---- Al-Fatah: 3 stores (1 existing + 2 new) ----
  store('branch_af_fsd', 'tenant-alfatah', 'D-Ground Flagship Hub', 'D-Ground Commercial Area, Faisalabad', 31.4125, 73.0995, 'ZONE-FSD-DGROUND', '+92 41 8541122'),
  store('branch_af_kohinoor', 'tenant-alfatah', 'Kohinoor City Hub', 'Kohinoor City, Jaranwala Road, Faisalabad', 31.4170, 73.1330, 'ZONE-FSD-MADINA', '+92 41 8541133', true),
  store('branch_af_canal', 'tenant-alfatah', 'Canal Road Hub', 'East Canal Road, Faisalabad', 31.4380, 73.1290, 'ZONE-FSD-CANAL', '+92 41 8541144', true),

  // ---- Chase Up: 3 stores (1 existing + 2 new) ----
  store('branch_006', 'tenant-chaseup', 'Clock Tower Hub', 'Clock Tower Commercial Chowk, Faisalabad', 31.4181, 73.0790, 'ZONE-FSD-CLOCKTOWER', '+92 41 2623344'),
  store('branch_cu_satiana', 'tenant-chaseup', 'Satiana Road Hub', 'Satiana Road, Faisalabad', 31.3960, 73.0340, 'ZONE-FSD-SAMANABAD', '+92 41 2623355', true),
  store('branch_cu_samanabad', 'tenant-chaseup', 'Samanabad Hub', 'Samanabad Main Market, Faisalabad', 31.4290, 73.0620, 'ZONE-FSD-SAMANABAD', '+92 41 2623366', true),

  // ---- Chase Value: 2 stores (1 existing + 1 new) ----
  store('branch_cv_fsd', 'tenant-chasevalue', 'Wholesale Express Hub', 'Jaranwala Road Wholesale Terminal, Faisalabad', 31.4360, 73.1795, 'ZONE-FSD-MADINA', '+92 41 8729900'),
  store('branch_cv_gmabad', 'tenant-chasevalue', 'Ghulam Muhammad Abad Hub', 'Ghulam Muhammad Abad, Faisalabad', 31.4290, 73.1120, 'ZONE-FSD-CANAL', '+92 41 8729911', true),

  // ---- Unimart: 2 stores (1 existing + 1 new) ----
  store('branch_um_fsd', 'tenant-unimart', 'Peoples Colony Dark Store', 'D-Ground Commercial Center, Peoples Colony 1, Faisalabad', 31.4015, 73.0830, 'ZONE-FSD-DGROUND', '+92 300 8441122'),
  store('branch_um_madina', 'tenant-unimart', 'Madina Town Hub', 'Madina Town Main Boulevard, Faisalabad', 31.4530, 73.0840, 'ZONE-FSD-MADINA', '+92 300 8441133', true)
];

export const getStoreById = (id) => STORE_REGISTRY.find((s) => s.storeId === id) || null;
export const getStoresByTenant = (tenantId) => STORE_REGISTRY.filter((s) => s.tenantId === tenantId);
export const getRetailerStoreCounts = () =>
  STORE_REGISTRY.reduce((acc, s) => ({ ...acc, [s.tenantId]: (acc[s.tenantId] || 0) + 1 }), {});

const haversineKm = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

// Nearest store OF THE SAME RETAILER (an Al-Fatah order must never go to a Chase Up store).
export const findNearestStoreForTenant = (coords, tenantId) => {
  if (!coords) return null;
  return getStoresByTenant(tenantId)
    .map((s) => ({ ...s, distanceKm: haversineKm(coords, s.coords) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0] || null;
};

// Shape used by Store model / stores_db.json / GET /api/admin/stores
export const toStoreRecord = (s) => {
  const d = 0.015;
  const { lat, lng } = s.coords;
  return {
    _id: s.storeId,
    storeId: s.storeId,
    branchId: s.branchId,
    tenantId: s.tenantId,
    tenantName: s.tenantName,
    name: s.name,
    branchName: s.branchName,
    address: s.address,
    city: s.city,
    latitude: lat,
    longitude: lng,
    location: { type: 'Point', coordinates: [lng, lat] },
    contactNumber: s.contactNumber,
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    manager: `${s.retailerName} Store Manager`,
    deliveryRadiusKm: s.deliveryRadiusKm,
    assignedZoneId: s.assignedZoneId,
    deliveryPolygon: [[lat + d, lng - d], [lat + d, lng + d], [lat - d, lng + d], [lat - d, lng - d], [lat + d, lng - d]]
  };
};

// Old pre-registry store ids -> the registry id of the same physical store (null = junk, drop it).
export const LEGACY_STORE_ID_MAP = {
  'STR-UM-001': 'branch_um_fsd',
  'STR-UM-002': 'branch_um_madina',
  'STR-UM-003': 'branch_um_fsd',
  'STR-AF-001': 'branch_af_fsd',
  'STR-AF-002': 'branch_af_kohinoor',
  'STR-AF-003': 'branch_af_canal',
  'STR-CV-001': 'branch_cv_fsd',
  'STR-CV-002': 'branch_cv_gmabad',
  'STR-CV-003': 'branch_cv_fsd',
  'STR-CU-001': 'branch_cu_samanabad',
  'STR-CU-002': 'branch_cu_satiana',
  'STR-CU-003': 'branch_006',
  'STR-CHA-3330': null,
  'STR-ALF-0637': null,
  'STR-CHA-7916': null,
  'STR-CHA-6667': null,
  'STR-CHA-6072': null,
  'STR-ALF-1707': null,
  'STR-ALF-7663': null,
  '6af95460cd644955abd889ee': null,
  '6af6e561d12797f0aab8ef40': null,
  '6af6e560d12797f0aab8ef3d': null,
  'branch_001': null,
  'branch_002': null,
  'branch_003': null,
  'branch_004': null,
  'branch_005': null,
  'branch_007': null,
  'branch_008': null,
  'branch_009': null,
  'branch_010': null,
  'branch_011': null,
  'branch_012': null,
  'branch_013': null,
  'branch_014': null,
  'branch_015': null
};
