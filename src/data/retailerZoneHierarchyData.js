// Single Source of Truth for Business Hierarchy:
// 4 Parent Retailers • 12 Physical Child Stores • 4 Master Delivery Zones
import { LEGACY_STORE_ID_MAP } from './storeRegistry.js';
import { getAllUnifiedStores } from '../utils/storeHelper.js';

export const ZONE_CODE_TO_MASTER_ZONE_MAP = {
  'ZONE-FSD-SAMANABAD': 'zone_001',
  'ZONE-FSD-CLOCKTOWER': 'zone_003',
  'ZONE-FSD-MADINA': 'zone_002',
  'ZONE-FSD-DGROUND': 'zone_003',
  'ZONE-FSD-CANAL': 'zone_002',
  'ZONE-FSD-PEOPLES': 'zone_004',
  'zone_001': 'zone_001',
  'zone_002': 'zone_002',
  'zone_003': 'zone_003',
  'zone_004': 'zone_004'
};

export const MASTER_ZONE_TO_ZONE_CODE_MAP = {
  'zone_001': 'ZONE-FSD-SAMANABAD',
  'zone_002': 'ZONE-FSD-MADINA',
  'zone_003': 'ZONE-FSD-CLOCKTOWER',
  'zone_004': 'ZONE-FSD-PEOPLES',
  'ZONE-LHR-GULBERG': 'ZONE-LHR-GULBERG',
  'ZONE-LHR-DHA': 'ZONE-LHR-DHA',
  'ZONE-LHR-MODELTOWN': 'ZONE-LHR-MODELTOWN',
  'zone_005': 'ZONE-LHR-GULBERG',
  'zone_006': 'ZONE-LHR-DHA',
  'zone_007': 'ZONE-LHR-MODELTOWN'
};

export const PAKISTAN_CITIES = [
  { name: 'Faisalabad', lat: 31.4187, lng: 73.0791, zoom: 13, label: 'Faisalabad (Primary Hub)' },
  { name: 'Lahore', lat: 31.5204, lng: 74.3587, zoom: 12, label: 'Lahore (Punjab Hub)' },
  { name: 'Karachi', lat: 24.8607, lng: 67.0011, zoom: 12, label: 'Karachi (Sindh Hub)' },
  { name: 'Islamabad', lat: 33.6844, lng: 73.0479, zoom: 12, label: 'Islamabad (Federal Capital)' },
  { name: 'Rawalpindi', lat: 33.5651, lng: 73.0169, zoom: 12, label: 'Rawalpindi (Twin City)' },
  { name: 'Multan', lat: 30.1575, lng: 71.5249, zoom: 12, label: 'Multan (South Punjab)' },
  { name: 'Peshawar', lat: 34.0151, lng: 71.5249, zoom: 12, label: 'Peshawar (KPK Hub)' },
  { name: 'Gujranwala', lat: 32.1877, lng: 74.1945, zoom: 12, label: 'Gujranwala' },
  { name: 'Sialkot', lat: 32.4945, lng: 74.5229, zoom: 12, label: 'Sialkot' },
  { name: 'Quetta', lat: 30.1798, lng: 66.9750, zoom: 12, label: 'Quetta (Balochistan Hub)' }
];


export const FOUR_PARENT_RETAILERS = [
  {
    _id: 'tenant-alfatah',
    id: 'tenant-alfatah',
    retailerId: 'tenant-alfatah',
    name: 'Al-Fateh',
    fullName: 'Al-Fateh Supermarket',
    slug: 'al-fateh',
    type: 'parent',
    status: 'active',
    color: '#991b1b',
    logo: '🏬',
    tagline: "Pakistan's Premier Supermarket Chain"
  },
  {
    _id: 'tenant-chaseup',
    id: 'tenant-chaseup',
    retailerId: 'tenant-chaseup',
    name: 'Chase Up',
    fullName: 'Chase Up Department Store',
    slug: 'chase-up',
    type: 'parent',
    status: 'active',
    color: '#6b21a8',
    logo: '🏪',
    tagline: 'Leading Hypermarket & Fashion Retailer'
  },
  {
    _id: 'tenant-chasevalue',
    id: 'tenant-chasevalue',
    retailerId: 'tenant-chasevalue',
    name: 'Chase Value',
    fullName: 'Chase Value Supermarket',
    slug: 'chase-value',
    type: 'parent',
    status: 'active',
    color: '#854d0e',
    logo: '🛒',
    tagline: 'Wholesale Grocery & Value Mart'
  },
  {
    _id: 'tenant-unimart',
    id: 'tenant-unimart',
    retailerId: 'tenant-unimart',
    name: 'Unimart',
    fullName: 'Unimart Super Platform',
    slug: 'unimart',
    type: 'parent',
    status: 'active',
    color: '#0284c7',
    logo: '🥬',
    tagline: 'Fresh Groceries Delivered in Minutes'
  }
];

export const FOUR_MASTER_DELIVERY_ZONES = [
  {
    _id: 'zone_001',
    id: 'zone_001',
    zoneId: 'zone_001',
    zoneNumber: 1,
    name: 'Zone 1 — Samanabad',
    shortName: 'Samanabad',
    city: 'Faisalabad',
    color: '#ea580c', // Vibrant Orange
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
    status: 'active',
    deliveryFee: 60,
    minOrder: 400,
    freeDeliveryThreshold: 2000,
    center: [31.3980, 73.0450],
    polygon: {
      type: 'Polygon',
      coordinates: [
        [31.4350, 73.0100],
        [31.4350, 73.0760],
        [31.3650, 73.0760],
        [31.3650, 73.0100],
        [31.4350, 73.0100]
      ]
    }
  },
  {
    _id: 'zone_002',
    id: 'zone_002',
    zoneId: 'zone_002',
    zoneNumber: 2,
    name: 'Zone 2 — Madina Town & East Canal',
    shortName: 'Madina Town & Canal',
    city: 'Faisalabad',
    color: '#16a34a', // Emerald Green
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-800',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    status: 'active',
    deliveryFee: 70,
    minOrder: 450,
    freeDeliveryThreshold: 2200,
    center: [31.4420, 73.1380],
    polygon: {
      type: 'Polygon',
      coordinates: [
        [31.4700, 73.0750],
        [31.4700, 73.2000],
        [31.4150, 73.2000],
        [31.4150, 73.0750],
        [31.4700, 73.0750]
      ]
    }
  },
  {
    _id: 'zone_003',
    id: 'zone_003',
    zoneId: 'zone_003',
    zoneNumber: 3,
    name: 'Zone 3 — Clock Tower & D-Ground',
    shortName: 'Clock Tower & D-Ground',
    city: 'Faisalabad',
    color: '#0284c7', // Sky Blue
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-800',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
    status: 'active',
    deliveryFee: 60,
    minOrder: 400,
    freeDeliveryThreshold: 2000,
    center: [31.4150, 73.0750],
    polygon: {
      type: 'Polygon',
      coordinates: [
        [31.4350, 73.0450],
        [31.4350, 73.1050],
        [31.3950, 73.1050],
        [31.3950, 73.0450],
        [31.4350, 73.0450]
      ]
    }
  },
  {
    _id: 'zone_004',
    id: 'zone_004',
    zoneId: 'zone_004',
    zoneNumber: 4,
    name: "Zone 4 — People's Colony & Kohinoor",
    shortName: "People's Colony & Kohinoor",
    city: 'Faisalabad',
    color: '#7c3aed', // Purple
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
    status: 'active',
    deliveryFee: 65,
    minOrder: 400,
    freeDeliveryThreshold: 2000,
    center: [31.4150, 73.1200],
    polygon: {
      type: 'Polygon',
      coordinates: [
        [31.4450, 73.0850],
        [31.4450, 73.1550],
        [31.3850, 73.1550],
        [31.3850, 73.0850],
        [31.4450, 73.0850]
      ]
    }
  },
  {
    _id: 'ZONE-LHR-GULBERG',
    id: 'ZONE-LHR-GULBERG',
    zoneId: 'ZONE-LHR-GULBERG',
    zoneNumber: 5,
    name: 'Zone 5 — Gulberg & MM Alam Commercial Hub',
    shortName: 'Gulberg & MM Alam',
    city: 'Lahore',
    color: '#2563eb', // Blue
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    status: 'active',
    deliveryFee: 80,
    minOrder: 450,
    freeDeliveryThreshold: 2200,
    center: [31.5175, 74.3525],
    polygon: {
      type: 'Polygon',
      coordinates: [
        [31.5350, 74.3350],
        [31.5350, 74.3700],
        [31.5000, 74.3700],
        [31.5000, 74.3350],
        [31.5350, 74.3350]
      ]
    }
  },
  {
    _id: 'ZONE-LHR-DHA',
    id: 'ZONE-LHR-DHA',
    zoneId: 'ZONE-LHR-DHA',
    zoneNumber: 6,
    name: 'Zone 6 — DHA Phase 1-5 Express Zone',
    shortName: 'DHA & Cantt',
    city: 'Lahore',
    color: '#16a34a', // Emerald Green
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-800',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    status: 'active',
    deliveryFee: 90,
    minOrder: 500,
    freeDeliveryThreshold: 2500,
    center: [31.4775, 74.3975],
    polygon: {
      type: 'Polygon',
      coordinates: [
        [31.4950, 74.3700],
        [31.4950, 74.4250],
        [31.4600, 74.4250],
        [31.4600, 74.3700],
        [31.4950, 74.3700]
      ]
    }
  },
  {
    _id: 'ZONE-LHR-MODELTOWN',
    id: 'ZONE-LHR-MODELTOWN',
    zoneId: 'ZONE-LHR-MODELTOWN',
    zoneNumber: 7,
    name: 'Zone 7 — Model Town & Garden Town Hub',
    shortName: 'Model Town & Garden Town',
    city: 'Lahore',
    color: '#ea580c', // Orange
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
    status: 'active',
    deliveryFee: 75,
    minOrder: 400,
    freeDeliveryThreshold: 2000,
    center: [31.4875, 74.3225],
    polygon: {
      type: 'Polygon',
      coordinates: [
        [31.5050, 74.3050],
        [31.5050, 74.3400],
        [31.4700, 74.3400],
        [31.4700, 74.3050],
        [31.5050, 74.3050]
      ]
    }
  }
];

export const TWELVE_PHYSICAL_STORES = [
  // --- 1. Al-Fateh (Parent) ---
  {
    _id: 'STR-AF-001',
    storeId: 'STR-AF-001',
    retailerId: 'tenant-alfatah',
    tenantId: 'tenant-alfatah',
    parentRetailerName: 'Al-Fateh',
    retailerNumber: 1,
    name: 'Al-Fateh — Main Branch',
    branchName: 'Main Branch',
    type: 'child',
    address: 'Main Commercial Avenue, Samanabad, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.3960,
    longitude: 73.0600,
    location: { type: 'Point', coordinates: [73.0600, 31.3960] },
    deliveryZoneId: 'zone_001', // Zone 1 — Samanabad
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    phone: '+92 300 8441111'
  },
  {
    _id: 'STR-AF-002',
    storeId: 'STR-AF-002',
    retailerId: 'tenant-alfatah',
    tenantId: 'tenant-alfatah',
    parentRetailerName: 'Al-Fateh',
    retailerNumber: 3,
    name: 'Al-Fateh — Branch 2',
    branchName: 'Branch 2 (Madina Town)',
    type: 'child',
    address: 'Susan Road, Madina Town Sector B, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.4320,
    longitude: 73.1300,
    location: { type: 'Point', coordinates: [73.1300, 31.4320] },
    deliveryZoneId: 'zone_002', // Zone 2 — Madina Town
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    phone: '+92 300 8441112'
  },
  {
    _id: 'STR-AF-003',
    storeId: 'STR-AF-003',
    retailerId: 'tenant-alfatah',
    tenantId: 'tenant-alfatah',
    parentRetailerName: 'Al-Fateh',
    retailerNumber: 5,
    name: 'Al-Fateh — Branch 3',
    branchName: 'Branch 3 (D-Ground)',
    type: 'child',
    address: 'Peoples Colony No 1, Near D-Ground Circle, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.4120,
    longitude: 73.0850,
    location: { type: 'Point', coordinates: [73.0850, 31.4120] },
    deliveryZoneId: 'zone_003', // Zone 3 — D-Ground
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    phone: '+92 300 8441113'
  },

  // --- 2. Chase Up (Parent) ---
  {
    _id: 'STR-CU-001',
    storeId: 'STR-CU-001',
    retailerId: 'tenant-chaseup',
    tenantId: 'tenant-chaseup',
    parentRetailerName: 'Chase Up',
    retailerNumber: 2,
    name: 'Chase Up — Branch 1',
    branchName: 'Branch 1 (Samanabad)',
    type: 'child',
    address: 'Main Samanabad Chowk, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.3910,
    longitude: 73.0580,
    location: { type: 'Point', coordinates: [73.0580, 31.3910] },
    deliveryZoneId: 'zone_001', // Zone 1 — Samanabad
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    phone: '+92 300 8442221'
  },
  {
    _id: 'STR-CU-002',
    storeId: 'STR-CU-002',
    retailerId: 'tenant-chaseup',
    tenantId: 'tenant-chaseup',
    parentRetailerName: 'Chase Up',
    retailerNumber: 4,
    name: 'Chase Up — Branch 2',
    branchName: 'Branch 2 (Madina Town)',
    type: 'child',
    address: 'Main Boulevard, Madina Town, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.4360,
    longitude: 73.1380,
    location: { type: 'Point', coordinates: [73.1380, 31.4360] },
    deliveryZoneId: 'zone_002', // Zone 2 — Madina Town
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    phone: '+92 300 8442222'
  },
  {
    _id: 'STR-CU-003',
    storeId: 'STR-CU-003',
    retailerId: 'tenant-chaseup',
    tenantId: 'tenant-chaseup',
    parentRetailerName: 'Chase Up',
    retailerNumber: 6,
    name: 'Chase Up — Branch 3',
    branchName: 'Branch 3 (D-Ground)',
    type: 'child',
    address: 'Gulberg Road, Near D-Ground Commercial, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.4160,
    longitude: 73.0880,
    location: { type: 'Point', coordinates: [73.0880, 31.4160] },
    deliveryZoneId: 'zone_003', // Zone 3 — D-Ground
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    phone: '+92 300 8442223'
  },

  // --- 3. Chase Value (Parent) ---
  {
    _id: 'STR-CV-001',
    storeId: 'STR-CV-001',
    retailerId: 'tenant-chasevalue',
    tenantId: 'tenant-chasevalue',
    parentRetailerName: 'Chase Value',
    retailerNumber: 7,
    name: 'Chase Value — Susan Road Branch',
    branchName: 'Branch 1 (Susan Road)',
    type: 'child',
    address: 'Susan Road, Near Main Roundabout, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.4180,
    longitude: 73.0920,
    location: { type: 'Point', coordinates: [73.0920, 31.4180] },
    deliveryZoneId: 'zone_003', // Zone 3 — D-Ground
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    phone: '+92 300 8443331'
  },
  {
    _id: 'STR-CV-002',
    storeId: 'STR-CV-002',
    retailerId: 'tenant-chasevalue',
    tenantId: 'tenant-chasevalue',
    parentRetailerName: 'Chase Value',
    retailerNumber: 8,
    name: "Chase Value — People's Colony Branch",
    branchName: "Branch 2 (People's Colony)",
    type: 'child',
    address: "Commercial Market, People's Colony 1, Faisalabad",
    city: 'Faisalabad',
    latitude: 31.4150,
    longitude: 73.1050,
    location: { type: 'Point', coordinates: [73.1050, 31.4150] },
    deliveryZoneId: 'zone_004', // Zone 4 — People's Colony
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    phone: '+92 300 8443332'
  },
  {
    _id: 'STR-CV-003',
    storeId: 'STR-CV-003',
    retailerId: 'tenant-chasevalue',
    tenantId: 'tenant-chasevalue',
    parentRetailerName: 'Chase Value',
    retailerNumber: 9,
    name: 'Chase Value — Main Mall Branch',
    branchName: 'Branch 3 (Main Mall)',
    type: 'child',
    address: "East Canal Expressway & People's Colony Junction, Faisalabad",
    city: 'Faisalabad',
    latitude: 31.4210,
    longitude: 73.1120,
    location: { type: 'Point', coordinates: [73.1120, 31.4210] },
    deliveryZoneId: 'zone_004', // Zone 4 — People's Colony
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    phone: '+92 300 8443333'
  },

  // --- 4. Unimart (Parent) ---
  {
    _id: 'STR-UM-001',
    storeId: 'STR-UM-001',
    retailerId: 'tenant-unimart',
    tenantId: 'tenant-unimart',
    parentRetailerName: 'Unimart',
    retailerNumber: 10,
    name: 'Unimart — D-Ground Branch',
    branchName: 'Branch 1 (D-Ground Hub)',
    type: 'child',
    address: 'Near Samanabad Bypass Road, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.3980,
    longitude: 73.0640,
    location: { type: 'Point', coordinates: [73.0640, 31.3980] },
    deliveryZoneId: 'zone_001', // Zone 1 — Samanabad
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    phone: '+92 300 8444441'
  },
  {
    _id: 'STR-UM-002',
    storeId: 'STR-UM-002',
    retailerId: 'tenant-unimart',
    tenantId: 'tenant-unimart',
    parentRetailerName: 'Unimart',
    retailerNumber: 11,
    name: 'Unimart — Madina Town Branch',
    branchName: 'Branch 2 (Madina Town)',
    type: 'child',
    address: 'Officers Colony, Madina Town, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.4390,
    longitude: 73.1340,
    location: { type: 'Point', coordinates: [73.1340, 31.4390] },
    deliveryZoneId: 'zone_002', // Zone 2 — Madina Town
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    phone: '+92 300 8444442'
  },
  {
    _id: 'STR-UM-003',
    storeId: 'STR-UM-003',
    retailerId: 'tenant-unimart',
    tenantId: 'tenant-unimart',
    parentRetailerName: 'Unimart',
    retailerNumber: 12,
    name: "Unimart — People's Colony Branch",
    branchName: "Branch 3 (People's Colony)",
    type: 'child',
    address: "Chenab Market, People's Colony 2, Faisalabad",
    city: 'Faisalabad',
    latitude: 31.4110,
    longitude: 73.1090,
    location: { type: 'Point', coordinates: [73.1090, 31.4110] },
    deliveryZoneId: 'zone_004', // Zone 4 — People's Colony
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    phone: '+92 300 8444443'
  }
];

// Local Storage helpers for persisting zone associations across the browser
export const loadRetailerStores = (apiStores = []) => {
  const unified = getAllUnifiedStores(apiStores);

  // Load explicit retailer store assignments from localStorage
  let savedOverrides = {};
  try {
    const raw = localStorage.getItem('freshmart_retailer_stores');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((s) => {
          const id = s.storeId || s._id;
          if (id && (!Object.prototype.hasOwnProperty.call(LEGACY_STORE_ID_MAP, id) || LEGACY_STORE_ID_MAP[id] !== null)) {
            savedOverrides[id] = s;
          }
        });
      }
    }
  } catch (e) {}

  return unified.map((store, index) => {
    const id = store.storeId || store._id;
    const override = savedOverrides[id] || {};

    const baseline = TWELVE_PHYSICAL_STORES.find(
      (b) => (b.storeId || b._id) === id
    );

    let zoneId = null;
    if (override.deliveryZoneId !== undefined) {
      zoneId = override.deliveryZoneId;
    } else if (store.deliveryZoneId !== undefined) {
      zoneId = store.deliveryZoneId;
    } else if (store.assignedZoneId) {
      zoneId = ZONE_CODE_TO_MASTER_ZONE_MAP[store.assignedZoneId] || store.assignedZoneId;
    } else if (baseline && baseline.deliveryZoneId) {
      zoneId = baseline.deliveryZoneId;
    }

    const parentRetailer = FOUR_PARENT_RETAILERS.find(
      (r) => r.id === store.tenantId || r.retailerId === store.tenantId
    );

    const lat = Number(store.latitude || store.coords?.lat || baseline?.latitude || 31.4140);
    const lng = Number(store.longitude || store.coords?.lng || baseline?.longitude || 73.0950);

    return {
      ...(baseline || {}),
      ...store,
      _id: id,
      storeId: id,
      retailerId: store.tenantId || override.retailerId || baseline?.retailerId || 'tenant-alfatah',
      tenantId: store.tenantId || override.tenantId || baseline?.tenantId || 'tenant-alfatah',
      parentRetailerName: parentRetailer?.name || store.parentRetailerName || store.tenantName || store.retailerName || baseline?.parentRetailerName || 'Retailer',
      retailerNumber: store.retailerNumber || baseline?.retailerNumber || (index + 1),
      name: store.name || store.branchName || baseline?.name,
      branchName: store.branchName || store.name || baseline?.branchName,
      type: 'child',
      address: store.address || baseline?.address || `${store.city || 'Faisalabad'}, Pakistan`,
      city: store.city || baseline?.city || 'Faisalabad',
      latitude: lat,
      longitude: lng,
      location: store.location || {
        type: 'Point',
        coordinates: [lng, lat]
      },
      deliveryZoneId: zoneId || null,
      assignedZoneId: zoneId ? (MASTER_ZONE_TO_ZONE_CODE_MAP[zoneId] || zoneId) : null,
      assignmentStatus: zoneId ? 'active' : 'unassigned',
      status: store.status || baseline?.status || 'active',
      isActive: store.isActive !== false,
      operatingStatus: store.operatingStatus || baseline?.operatingStatus || 'Open',
      openingHours: store.openingHours || baseline?.openingHours || '08:00 AM',
      closingHours: store.closingHours || baseline?.closingHours || '11:00 PM',
      phone: store.contactNumber || store.phone || baseline?.phone || '+92 300 0000000',
      ...override,
      deliveryZoneId: zoneId || null
    };
  });
};

export const saveRetailerStores = (stores) => {
  try {
    localStorage.setItem('freshmart_retailer_stores', JSON.stringify(stores));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('freshmart_retailer_stores_updated', { detail: stores }));
    }
  } catch (e) {}
};

export const deleteRetailerStore = (storeId) => {
  const sId = String(storeId || '').trim();
  if (!sId) return loadRetailerStores();

  const allIdsToDelete = new Set([sId]);
  if (LEGACY_STORE_ID_MAP && LEGACY_STORE_ID_MAP[sId]) {
    allIdsToDelete.add(LEGACY_STORE_ID_MAP[sId]);
  }
  if (LEGACY_STORE_ID_MAP) {
    for (const [legacyId, canonId] of Object.entries(LEGACY_STORE_ID_MAP)) {
      if (canonId === sId || legacyId === sId) {
        if (canonId) allIdsToDelete.add(canonId);
        if (legacyId) allIdsToDelete.add(legacyId);
      }
    }
  }

  try {
    const dRaw = localStorage.getItem('freshmart_deleted_store_ids');
    const dList = dRaw ? JSON.parse(dRaw) : [];
    const updated = Array.from(new Set([...dList, ...allIdsToDelete]));
    localStorage.setItem('freshmart_deleted_store_ids', JSON.stringify(updated));

    // Also remove from freshmart_store_admins
    const saRaw = localStorage.getItem('freshmart_store_admins');
    if (saRaw) {
      const saList = JSON.parse(saRaw);
      if (Array.isArray(saList)) {
        const filteredSA = saList.filter(
          (sa) => !allIdsToDelete.has(sa.branchId) && !allIdsToDelete.has(sa.storeId)
        );
        localStorage.setItem('freshmart_store_admins', JSON.stringify(filteredSA));
      }
    }
  } catch (e) {}

  const current = loadRetailerStores();
  const updatedStores = current.filter((s) => {
    const id = s.storeId || s._id;
    return !allIdsToDelete.has(id) && !allIdsToDelete.has(s.storeCode);
  });
  saveRetailerStores(updatedStores);

  // Also remove from any master delivery zones' assigned stores list if present
  try {
    const zones = loadMasterZones();
    let zonesModified = false;
    const cleanZones = zones.map((z) => {
      let modified = false;
      const updatedZ = { ...z };
      if (allIdsToDelete.has(updatedZ.assignedStoreId)) {
        updatedZ.assignedStoreId = null;
        modified = true;
      }
      if (Array.isArray(updatedZ.stores)) {
        const filtered = updatedZ.stores.filter((s) => !allIdsToDelete.has(s.storeId || s._id || s.id));
        if (filtered.length !== updatedZ.stores.length) {
          updatedZ.stores = filtered;
          modified = true;
        }
      }
      if (Array.isArray(updatedZ.assignedStoreIds)) {
        const filtered = updatedZ.assignedStoreIds.filter((id) => !allIdsToDelete.has(id));
        if (filtered.length !== updatedZ.assignedStoreIds.length) {
          updatedZ.assignedStoreIds = filtered;
          modified = true;
        }
      }
      if (modified) zonesModified = true;
      return updatedZ;
    });
    if (zonesModified) {
      saveMasterZones(cleanZones);
    }
  } catch (e) {}

  return updatedStores;
};

export const loadMasterZones = () => {
  try {
    const raw = localStorage.getItem('freshmart_master_zones');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 1) {
        const byId = new Map();
        // Seed with all baseline master zones (Faisalabad + Lahore)
        FOUR_MASTER_DELIVERY_ZONES.forEach((bz) => byId.set(bz.zoneId || bz._id, bz));
        parsed.forEach((z) => {
          const zId = z.zoneId || z._id;
          const baseline = byId.get(zId) || {};
          const hasValidStoredPolygon = z.polygon && Array.isArray(z.polygon.coordinates) && z.polygon.coordinates.length >= 3;
          const polygonToUse = hasValidStoredPolygon
            ? z.polygon
            : (baseline.polygon || z.polygon);

          byId.set(zId, {
            ...baseline,
            ...z,
            polygon: polygonToUse
          });
        });
        return Array.from(byId.values());
      }
    }
  } catch (e) {}
  return FOUR_MASTER_DELIVERY_ZONES;
};

export const saveMasterZones = (zones) => {
  try {
    localStorage.setItem('freshmart_master_zones', JSON.stringify(zones));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('freshmart_master_zones_updated', { detail: zones }));
    }
  } catch (e) {}
};

// Backward compatibility exports for legacy region & polygon helpers
export const THREE_MASTER_REGIONS = FOUR_MASTER_DELIVERY_ZONES;
export const isStoreAreaPolygon = (z) => Boolean(z?.isStoreAreaPolygon || z?.type === 'store_area_polygon');
export const DEFAULT_DELIVERY_ZONES = FOUR_MASTER_DELIVERY_ZONES;
export const detectRegionSector = () => FOUR_MASTER_DELIVERY_ZONES[0];

