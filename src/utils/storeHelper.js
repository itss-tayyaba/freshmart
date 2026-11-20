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

let _cachedApiStores = [];

export const getCachedApiStores = () => {
  if (Array.isArray(_cachedApiStores) && _cachedApiStores.length > 0) return _cachedApiStores;
  try {
    const raw = localStorage.getItem('freshmart_cached_api_stores');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        _cachedApiStores = parsed;
        return parsed;
      }
    }
  } catch (e) {}
  return [];
};

export const setCachedApiStores = (apiStores = []) => {
  if (!Array.isArray(apiStores) || apiStores.length === 0) return;
  _cachedApiStores = apiStores;
  try {
    localStorage.setItem('freshmart_cached_api_stores', JSON.stringify(apiStores));
  } catch (e) {}
};

export const getDeletedStoreIds = () => {
  try {
    const raw = localStorage.getItem('freshmart_deleted_store_ids');
    const base = raw ? JSON.parse(raw) : [];
    const expanded = new Set();
    (Array.isArray(base) ? base : []).forEach((id) => {
      if (!id) return;
      const strId = String(id).trim();
      expanded.add(strId);
      expanded.add(strId.toLowerCase());
      if (LEGACY_STORE_ID_MAP && LEGACY_STORE_ID_MAP[strId]) {
        expanded.add(LEGACY_STORE_ID_MAP[strId]);
        expanded.add(LEGACY_STORE_ID_MAP[strId].toLowerCase());
      }
      if (LEGACY_STORE_ID_MAP) {
        for (const [legacyId, canonId] of Object.entries(LEGACY_STORE_ID_MAP)) {
          if (canonId === strId) {
            expanded.add(legacyId);
            expanded.add(legacyId.toLowerCase());
          }
        }
      }
    });
    return Array.from(expanded);
  } catch (e) {
    return [];
  }
};

export const markStoreDeleted = (rawId, extraIds = []) => {
  try {
    const rawList = [rawId, ...(Array.isArray(extraIds) ? extraIds : [extraIds])].filter(Boolean);
    if (rawList.length === 0) return;

    const current = getDeletedStoreIds();
    const toAdd = new Set(current);

    rawList.forEach((item) => {
      const id = typeof item === 'object'
        ? (item.storeId || item._id || item.branchId || item.id || item.storeCode || item.code)
        : item;
      if (!id) return;
      const strId = String(id).trim();
      toAdd.add(strId);
      toAdd.add(strId.toLowerCase());
      toAdd.add(strId.toUpperCase());
      if (LEGACY_STORE_ID_MAP && LEGACY_STORE_ID_MAP[strId]) {
        toAdd.add(LEGACY_STORE_ID_MAP[strId]);
        toAdd.add(LEGACY_STORE_ID_MAP[strId].toLowerCase());
      }
      if (LEGACY_STORE_ID_MAP) {
        for (const [legacyId, canonId] of Object.entries(LEGACY_STORE_ID_MAP)) {
          if (canonId === strId) {
            toAdd.add(legacyId);
            toAdd.add(legacyId.toLowerCase());
          }
        }
      }
    });

    const updated = Array.from(toAdd);
    localStorage.setItem('freshmart_deleted_store_ids', JSON.stringify(updated));

    const checkMatch = (s) => {
      if (!s) return false;
      const ids = [s.storeId, s._id, s.branchId, s.id, s.storeCode, s.code]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase().trim());
      return ids.some((cid) => toAdd.has(cid));
    };

    // Clean freshmart_custom_stores
    try {
      const custom = localStorage.getItem('freshmart_custom_stores');
      if (custom) {
        const parsed = JSON.parse(custom);
        if (Array.isArray(parsed)) {
          localStorage.setItem('freshmart_custom_stores', JSON.stringify(parsed.filter((s) => !checkMatch(s))));
        }
      }
    } catch {}

    // Clean freshmart_cached_api_stores
    try {
      if (Array.isArray(_cachedApiStores)) {
        _cachedApiStores = _cachedApiStores.filter((s) => !checkMatch(s));
      }
      const cachedRaw = localStorage.getItem('freshmart_cached_api_stores');
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        if (Array.isArray(parsed)) {
          localStorage.setItem('freshmart_cached_api_stores', JSON.stringify(parsed.filter((s) => !checkMatch(s))));
        }
      }
    } catch {}

    // Clean freshmart_retailer_stores
    try {
      const ret = localStorage.getItem('freshmart_retailer_stores');
      if (ret) {
        const parsed = JSON.parse(ret);
        if (Array.isArray(parsed)) {
          localStorage.setItem('freshmart_retailer_stores', JSON.stringify(parsed.filter((s) => !checkMatch(s))));
        }
      }
    } catch {}

    // Clean freshmart_branches
    try {
      const br = localStorage.getItem('freshmart_branches');
      if (br) {
        const parsed = JSON.parse(br);
        if (Array.isArray(parsed)) {
          localStorage.setItem('freshmart_branches', JSON.stringify(parsed.filter((s) => !checkMatch(s))));
        }
      }
    } catch {}

    // Clean freshmart_stores
    try {
      const st = localStorage.getItem('freshmart_stores');
      if (st) {
        const parsed = JSON.parse(st);
        if (Array.isArray(parsed)) {
          localStorage.setItem('freshmart_stores', JSON.stringify(parsed.filter((s) => !checkMatch(s))));
        }
      }
    } catch {}

    // Clean freshmart_store_admins
    try {
      const savedAdmins = localStorage.getItem('freshmart_store_admins');
      if (savedAdmins) {
        const parsed = JSON.parse(savedAdmins);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (sa) => {
              const ids = [sa.branchId, sa.storeId, sa.id, sa._id]
                .filter(Boolean)
                .map((x) => String(x).toLowerCase().trim());
              return !ids.some((cid) => toAdd.has(cid));
            }
          );
          localStorage.setItem('freshmart_store_admins', JSON.stringify(filtered));
        }
      }
    } catch {}

    // Clean freshmart_assignments
    try {
      const asg = localStorage.getItem('freshmart_assignments');
      if (asg) {
        const parsed = JSON.parse(asg);
        if (Array.isArray(parsed)) {
          localStorage.setItem(
            'freshmart_assignments',
            JSON.stringify(
              parsed.filter((a) => {
                const sid = String(a.storeId || '').toLowerCase().trim();
                return !toAdd.has(sid);
              })
            )
          );
        }
      }
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('freshmart_store_deleted', { detail: { allDeletedIds: updated } }));
      window.dispatchEvent(new CustomEvent('freshmart_stores_updated', { detail: { deleted: true } }));
      window.dispatchEvent(new CustomEvent('freshmart_branches_updated'));
    }
  } catch (e) {}
};

export const removeLocalCustomStore = (storeId) => {
  if (!storeId) return;
  markStoreDeleted(storeId);
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

  if (Array.isArray(apiStores) && apiStores.length > 0) {
    setCachedApiStores(apiStores);
  }
  const effectiveApiStores = (Array.isArray(apiStores) && apiStores.length > 0)
    ? apiStores
    : getCachedApiStores();

  effectiveApiStores.forEach(add);

  const rawDeleted = getDeletedStoreIds();
  const deletedSet = new Set(rawDeleted.map((x) => String(x).toLowerCase().trim()));

  const all = Array.from(byId.values()).filter((s) => {
    if (!s) return false;
    const candidateIds = [s.storeId, s._id, s.storeCode, s.code, s.branchId, s.id]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase().trim());
    return !candidateIds.some((cid) => deletedSet.has(cid));
  });
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
