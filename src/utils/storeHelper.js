import { STORE_REGISTRY, toStoreRecord, LEGACY_STORE_ID_MAP } from '../data/storeRegistry.js';

// Unified Supermarket Stores & Retailers Single Source of Truth
// Synchronizes baseline stores, custom stores, and API stores across all dashboards, sidebars, and GIS views

export const CORE_RETAILERS = [
  { id: 'tenant-alfatah', name: 'Al-Fatah', color: '#991b1b', logo: '🏬' },
  { id: 'tenant-chasevalue', name: 'Chase Value', color: '#854d0e', logo: '🛒' },
  { id: 'tenant-chaseup', name: 'Chase Up', color: '#6b21a8', logo: '🏪' },
  { id: 'tenant-unimart', name: 'Unimart', color: '#0284c7', logo: '🥬' }
];

export const BASELINE_FOUR_STORES = [
  {
    _id: 'STR-UM-001',
    storeId: 'STR-UM-001',
    tenantId: 'tenant-unimart',
    tenantName: 'Unimart',
    name: 'Store A – D-Ground Branch',
    branchName: 'D-Ground Branch',
    address: 'D-Ground Commercial Area, Peoples Colony 1, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.4125,
    longitude: 73.0830,
    location: {
      type: 'Point',
      coordinates: [73.0830, 31.4125]
    },
    contactNumber: '+92 300 8441122',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    storeImage: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    manager: 'Unimart Store Manager',
    deliveryRadiusKm: 5
  },
  {
    _id: 'STR-AF-001',
    storeId: 'STR-AF-001',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah',
    name: 'Store B – People\'s Colony Branch',
    branchName: 'People\'s Colony Branch',
    address: 'Main Commercial Avenue, People\'s Colony, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.4150,
    longitude: 73.0995,
    location: {
      type: 'Point',
      coordinates: [73.0995, 31.4150]
    },
    contactNumber: '+92 300 8442233',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    storeImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    manager: 'Al-Fatah Store Manager',
    deliveryRadiusKm: 5
  },
  {
    _id: 'STR-CV-001',
    storeId: 'STR-CV-001',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    name: 'Store C – Susan Road Branch',
    branchName: 'Susan Road Branch',
    address: 'Susan Road, Madina Town, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.4280,
    longitude: 73.1200,
    location: {
      type: 'Point',
      coordinates: [73.1200, 31.4280]
    },
    contactNumber: '+92 300 8443344',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    storeImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    manager: 'Chase Value Store Manager',
    deliveryRadiusKm: 5
  },
  {
    _id: 'STR-CU-001',
    storeId: 'STR-CU-001',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    name: 'Store D – Samanabad Branch',
    branchName: 'Samanabad Branch',
    address: 'Main Samanabad Road, Near Roundabout, Faisalabad',
    city: 'Faisalabad',
    latitude: 31.3920,
    longitude: 73.0650,
    location: {
      type: 'Point',
      coordinates: [73.0650, 31.3920]
    },
    contactNumber: '+92 300 8444455',
    openingHours: '08:00 AM',
    closingHours: '11:00 PM',
    storeImage: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    isActive: true,
    operatingStatus: 'Open',
    manager: 'Chase Up Store Manager',
    deliveryRadiusKm: 5
  }
];

export const BASELINE_FIVE_STORES = BASELINE_FOUR_STORES;

export const loadLocalCustomStores = () => {
  try {
    const raw = localStorage.getItem('freshmart_custom_stores');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s) => s && !String(s.storeId || s._id || '').endsWith('-TEST') && !String(s.storeId || s._id || '').includes('CHA-3330'));
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

export const getDeletedStoreIds = () => {
  try {
    const raw = localStorage.getItem('freshmart_deleted_store_ids');
    const base = raw ? JSON.parse(raw) : [];
    const expanded = new Set(Array.isArray(base) ? base : []);
    base.forEach((id) => {
      if (LEGACY_STORE_ID_MAP && LEGACY_STORE_ID_MAP[id]) expanded.add(LEGACY_STORE_ID_MAP[id]);
      if (LEGACY_STORE_ID_MAP) {
        for (const [legacyId, canonId] of Object.entries(LEGACY_STORE_ID_MAP)) {
          if (canonId === id) expanded.add(legacyId);
        }
      }
    });
    return Array.from(expanded);
  } catch (e) {
    return [];
  }
};

export const markStoreDeleted = (rawId) => {
  try {
    const id = String(rawId || '').trim();
    if (!id) return;
    const current = getDeletedStoreIds();
    const toAdd = new Set([id]);
    if (LEGACY_STORE_ID_MAP && LEGACY_STORE_ID_MAP[id]) toAdd.add(LEGACY_STORE_ID_MAP[id]);
    if (LEGACY_STORE_ID_MAP) {
      for (const [legacyId, canonId] of Object.entries(LEGACY_STORE_ID_MAP)) {
        if (canonId === id) toAdd.add(legacyId);
      }
    }
    const updated = Array.from(new Set([...current, ...toAdd]));
    localStorage.setItem('freshmart_deleted_store_ids', JSON.stringify(updated));

    // Also clean up associated Mart Admin from local storage
    try {
      const savedAdmins = localStorage.getItem('freshmart_store_admins');
      if (savedAdmins) {
        const parsed = JSON.parse(savedAdmins);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (sa) => !toAdd.has(sa.branchId) && !toAdd.has(sa.storeId)
          );
          localStorage.setItem('freshmart_store_admins', JSON.stringify(filtered));
        }
      }
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('freshmart_store_deleted', { detail: { storeId: id, allDeletedIds: updated } }));
      window.dispatchEvent(new CustomEvent('freshmart_stores_updated', { detail: { storeId: id, deleted: true } }));
    }
  } catch (e) {}
};

export const removeLocalCustomStore = (storeId) => {
  if (!storeId) return;
  try {
    markStoreDeleted(storeId);
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
  const seenTenantCity = new Set();
  const result = [];

  const normalizeT = (raw) => {
    const s = String(raw || '').toLowerCase();
    if (s.includes('alfatah') || s.includes('fatah') || s.includes('alfateh') || s.includes('fateh') || s.includes('company_001')) return 'tenant-alfatah';
    if (s.includes('chaseval') || s.includes('company_003')) return 'tenant-chasevalue';
    if (s.includes('chaseup') || s.includes('company_002')) return 'tenant-chaseup';
    if (s.includes('unimart') || s.includes('freshmart') || s.includes('company_004')) return 'tenant-unimart';
    return s;
  };

  for (const s of storesList) {
    if (!s) continue;
    const sId = String(s.storeId || s._id || '').trim();
    if (sId.endsWith('-TEST') || sId.includes('CHA-3330')) continue;

    const tId = normalizeT(s.tenantId);
    const city = String(s.city || 'Faisalabad').toLowerCase().trim();
    const bName = String(s.branchName || s.name || '').toLowerCase().trim();
    const key = `${tId}__${city}__${bName.replace(/[^a-z0-9]/g, '')}`;

    if (sId && seenIds.has(sId)) continue;
    if (key && seenTenantCity.has(key)) continue;

    if (sId) seenIds.add(sId);
    if (key) seenTenantCity.add(key);
    result.push({
      ...s,
      tenantId: tId
    });
  }

  return result;
};

// ONE list for every screen (sidebar badge, dashboard card, Store Management, zones).
// Identity is the storeId only. Order of merging: registry -> browser-saved custom stores -> API (API wins).
// Old duplicate ids (STR-AF-001 etc.) are mapped to the registry id so a store is never counted twice.
export const getAllUnifiedStores = (apiStores = [], _extraBranches = [], targetCity = null) => {
  const byId = new Map();
  const canon = (rawId) => (Object.prototype.hasOwnProperty.call(LEGACY_STORE_ID_MAP, rawId) ? LEGACY_STORE_ID_MAP[rawId] : rawId);
  const add = (store) => {
    if (!store) return;
    const rawId = String(store.storeId || store._id || '').trim();
    if (!rawId || rawId.endsWith('-TEST')) return;
    const id = canon(rawId);
    if (!id) return;
    const tenantId = store.tenantId ? deduplicateStores([{ ...store, storeId: id }])[0]?.tenantId : store.tenantId;
    byId.set(id, { ...(byId.get(id) || {}), ...store, storeId: id, _id: id, tenantId });
  };

  STORE_REGISTRY.map(toStoreRecord).forEach(add);
  loadLocalCustomStores().forEach(add);
  (Array.isArray(apiStores) ? apiStores : []).forEach(add);

  const deletedIds = new Set(getDeletedStoreIds());
  const all = Array.from(byId.values()).filter(
    (s) => !deletedIds.has(s.storeId) && !deletedIds.has(s._id) && !deletedIds.has(s.storeCode)
  );
  return targetCity
    ? all.filter((s) => String(s.city || '').toLowerCase().includes(String(targetCity).toLowerCase()))
    : all;
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
