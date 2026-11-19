// Single Source of Truth for Business Hierarchy:
// 4 Parent Retailers • 12 Physical Child Stores • 4 Master Delivery Zones

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
    center: [31.3930, 73.0600],
    polygon: {
      type: 'Polygon',
      coordinates: [
        [31.4080, 73.0450],
        [31.4080, 73.0760],
        [31.3780, 73.0760],
        [31.3780, 73.0450],
        [31.4080, 73.0450]
      ]
    }
  },
  {
    _id: 'zone_002',
    id: 'zone_002',
    zoneId: 'zone_002',
    zoneNumber: 2,
    name: 'Zone 2 — Madina Town',
    shortName: 'Madina Town',
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
    center: [31.4350, 73.1350],
    polygon: {
      type: 'Polygon',
      coordinates: [
        [31.4480, 73.1120],
        [31.4480, 73.1580],
        [31.4180, 73.1580],
        [31.4180, 73.1120],
        [31.4480, 73.1120]
      ]
    }
  },
  {
    _id: 'zone_003',
    id: 'zone_003',
    zoneId: 'zone_003',
    zoneNumber: 3,
    name: 'Zone 3 — D-Ground',
    shortName: 'D-Ground',
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
    center: [31.4140, 73.0870],
    polygon: {
      type: 'Polygon',
      coordinates: [
        [31.4240, 73.0720],
        [31.4240, 73.0980],
        [31.3980, 73.0980],
        [31.3980, 73.0720],
        [31.4240, 73.0720]
      ]
    }
  },
  {
    _id: 'zone_004',
    id: 'zone_004',
    zoneId: 'zone_004',
    zoneNumber: 4,
    name: "Zone 4 — People's Colony",
    shortName: "People's Colony",
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
    center: [31.4160, 73.1100],
    polygon: {
      type: 'Polygon',
      coordinates: [
        [31.4280, 73.0960],
        [31.4280, 73.1250],
        [31.3980, 73.1250],
        [31.3980, 73.0960],
        [31.4280, 73.0960]
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
export const loadRetailerStores = () => {
  let deletedIds = new Set();
  try {
    const dRaw = localStorage.getItem('freshmart_deleted_store_ids');
    if (dRaw) deletedIds = new Set(JSON.parse(dRaw));
  } catch (e) {}

  try {
    const raw = localStorage.getItem('freshmart_retailer_stores');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 1) {
        return parsed
          .filter((s) => !deletedIds.has(s.storeId) && !deletedIds.has(s._id) && !deletedIds.has(s.storeCode))
          .map((s) => {
            const sId = s.storeId || s._id;
            const baseline = TWELVE_PHYSICAL_STORES.find(
              (b) => (b.storeId || b._id) === sId
            ) || TWELVE_PHYSICAL_STORES[0];
            return {
              ...baseline,
              ...s,
              deliveryZoneId: s.deliveryZoneId !== undefined ? s.deliveryZoneId : (baseline.deliveryZoneId || null)
            };
          });
      }
    }
  } catch (e) {}

  return TWELVE_PHYSICAL_STORES.filter(
    (s) => !deletedIds.has(s.storeId) && !deletedIds.has(s._id) && !deletedIds.has(s.storeCode)
  );
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
  try {
    const dRaw = localStorage.getItem('freshmart_deleted_store_ids');
    const dList = dRaw ? JSON.parse(dRaw) : [];
    if (!dList.includes(storeId)) {
      localStorage.setItem('freshmart_deleted_store_ids', JSON.stringify([...dList, storeId]));
    }
  } catch (e) {}

  const current = loadRetailerStores();
  const updated = current.filter((s) => (s.storeId || s._id) !== storeId && s.storeCode !== storeId);
  saveRetailerStores(updated);
  return updated;
};

export const loadMasterZones = () => {
  try {
    const raw = localStorage.getItem('freshmart_master_zones');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 1) {
        return parsed.map((z) => {
          const zId = z.zoneId || z._id;
          const baseline = FOUR_MASTER_DELIVERY_ZONES.find(
            (b) => (b.zoneId || b._id) === zId
          ) || FOUR_MASTER_DELIVERY_ZONES[0];
          return {
            ...baseline,
            ...z,
            polygon: (z.polygon && Array.isArray(z.polygon.coordinates) && z.polygon.coordinates.length >= 3)
              ? z.polygon
              : baseline.polygon
          };
        });
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

