// Unified Supermarket Stores & Retailers Single Source of Truth
// Synchronizes baseline stores, custom stores, and API stores across all dashboards, sidebars, and GIS views

export const CORE_RETAILERS = [
  { id: 'tenant-alfatah', name: 'Al-Fatah', color: '#991b1b', logo: '🏬' },
  { id: 'tenant-chasevalue', name: 'Chase Value', color: '#854d0e', logo: '🛒' },
  { id: 'tenant-chaseup', name: 'Chase Up', color: '#6b21a8', logo: '🏪' },
  { id: 'tenant-unimart', name: 'Unimart', color: '#0284c7', logo: '🥬' }
];

export const BASELINE_FIVE_STORES = [
  {
    _id: 'STR-AF-001',
    storeId: 'STR-AF-001',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah',
    name: 'Al-Fatah - Peoples Colony Mega Store',
    branchName: 'Peoples Colony Mega Store',
    address: 'Main Commercial Avenue, Peoples Colony 1, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.4125,
    longitude: 73.0995,
    location: {
      type: 'Point',
      coordinates: [73.0995, 31.4125]
    },
    contactNumber: '+92 300 8441122',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    storeImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    manager: 'Al-Fatah Manager',
    deliveryRadiusKm: 6
  },
  {
    _id: 'STR-CV-001',
    storeId: 'STR-CV-001',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    name: 'Chase Value - Jaranwala Road Hub',
    branchName: 'Jaranwala Road Hub',
    address: 'Jaranwala Road, Near Kohinoor City, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.418,
    longitude: 73.118,
    location: {
      type: 'Point',
      coordinates: [73.118, 31.418]
    },
    contactNumber: '+92 300 0000000',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    storeImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    manager: 'Chase Value Manager',
    deliveryRadiusKm: 6
  },
  {
    _id: 'STR-CU-001',
    storeId: 'STR-CU-001',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    name: 'Chase Up - Clock Tower Center',
    branchName: 'Clock Tower Center',
    address: 'Clock Tower Bazar, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.415,
    longitude: 73.078,
    location: {
      type: 'Point',
      coordinates: [73.078, 31.415]
    },
    contactNumber: '+92 300 0000000',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    storeImage: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    manager: 'Chase Up Manager',
    deliveryRadiusKm: 6
  },
  {
    _id: 'STR-UM-001',
    storeId: 'STR-UM-001',
    tenantId: 'tenant-unimart',
    tenantName: 'Unimart',
    name: 'Unimart - D-Ground Express Dark Store',
    branchName: 'D-Ground Express Dark Store',
    address: 'House 88, D-Ground, Peoples Colony 1, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.4015,
    longitude: 73.083,
    location: {
      type: 'Point',
      coordinates: [73.083, 31.4015]
    },
    contactNumber: '+92 300 0000000',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    storeImage: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    manager: 'Unimart Manager',
    deliveryRadiusKm: 5
  },
  {
    _id: 'STR-CHA-3330',
    storeId: 'STR-CHA-3330',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    name: 'Chase Value - main',
    branchName: 'main',
    address: 'main, Faisalabad, Pakistan',
    city: 'Faisalabad',
    latitude: 31.425,
    longitude: 73.09,
    location: {
      type: 'Point',
      coordinates: [73.09, 31.425]
    },
    contactNumber: '+92 300 0000000',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    storeImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    manager: 'Chase Value Manager',
    deliveryRadiusKm: 5
  }
];

export const loadLocalCustomStores = () => {
  try {
    const raw = localStorage.getItem('freshmart_custom_stores');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s) => s && !String(s.storeId || s._id || '').endsWith('-TEST'));
  } catch {
    return [];
  }
};

export const saveLocalCustomStore = (newStore) => {
  if (!newStore) return;
  try {
    const id = newStore.storeId || newStore._id;
    const existing = loadLocalCustomStores().filter(
      (s) => (s.storeId || s._id) !== id
    );
    const updated = [newStore, ...existing];
    localStorage.setItem('freshmart_custom_stores', JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('freshmart_stores_updated', { detail: newStore }));
    }
  } catch {}
};

export const removeLocalCustomStore = (storeId) => {
  if (!storeId) return;
  try {
    const existing = loadLocalCustomStores().filter(
      (s) => (s.storeId || s._id) !== storeId
    );
    localStorage.setItem('freshmart_custom_stores', JSON.stringify(existing));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('freshmart_stores_updated', { detail: { storeId, deleted: true } }));
    }
  } catch {}
};

export const deduplicateStores = (storesList = []) => {
  const seenIds = new Set();
  const seenTenantBranches = new Set();
  const result = [];

  for (const s of storesList) {
    if (!s) continue;
    const sId = String(s.storeId || s._id || '').trim();
    if (sId.endsWith('-TEST')) continue;

    const tId = String(s.tenantId || '').toLowerCase();
    const bName = String(s.branchName || s.name || '').toLowerCase().trim();
    const key = `${tId}__${bName}`;

    if (sId && seenIds.has(sId)) continue;
    if (key && seenTenantBranches.has(key)) continue;

    if (sId) seenIds.add(sId);
    if (key) seenTenantBranches.add(key);
    result.push(s);
  }

  return result;
};

export const getAllUnifiedStores = (apiStores = [], extraBranches = []) => {
  let mappedBranches = [];
  if (Array.isArray(extraBranches) && extraBranches.length > 0) {
    mappedBranches = extraBranches.map((b) => ({
      storeId: b._id || b.id,
      _id: b._id || b.id,
      tenantId: b.tenantId,
      tenantName: b.tenantName || b.name,
      name: b.name,
      branchName: b.name,
      address: b.address || `${b.city || 'Faisalabad'}, Pakistan`,
      city: b.city || 'Faisalabad',
      latitude: Number(b.latitude || 31.4125),
      longitude: Number(b.longitude || 73.0995),
      contactNumber: b.phone || '+92 300 0000000',
      openingHours: '08:00 AM',
      closingHours: '11:00 PM',
      deliveryRadiusKm: Number(b.deliveryRadiusKm || b.deliveryRadius || 5),
      storeImage: b.banner || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      status: b.status || 'active',
      isActive: String(b.status || 'active').toLowerCase() === 'active',
      operatingStatus: 'Open'
    }));
  }

  const localCustom = loadLocalCustomStores();
  const validApi = Array.isArray(apiStores) ? apiStores : [];

  const combined = [
    ...BASELINE_FIVE_STORES,
    ...validApi,
    ...localCustom,
    ...mappedBranches
  ];

  return deduplicateStores(combined);
};

export const getRetailerSummarySubtitle = (stores = []) => {
  const counts = {};
  for (const s of stores) {
    const t = String(s.tenantId || '').toLowerCase();
    if (t.includes('alfatah')) counts['Al-Fatah'] = (counts['Al-Fatah'] || 0) + 1;
    else if (t.includes('chasevalue')) counts['CV'] = (counts['CV'] || 0) + 1;
    else if (t.includes('chaseup')) counts['CU'] = (counts['CU'] || 0) + 1;
    else if (t.includes('unimart') || t.includes('freshmart')) counts['Unimart'] = (counts['Unimart'] || 0) + 1;
    else {
      const name = s.tenantName || 'Other';
      counts[name] = (counts[name] || 0) + 1;
    }
  }

  const parts = Object.entries(counts).map(([name, count]) => {
    return count > 1 ? `${name} (${count})` : name;
  });

  return parts.length > 0 ? parts.join(', ') : 'Al-Fatah, CV (2), CU, Unimart';
};
