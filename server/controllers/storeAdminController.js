import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { isDbOnline } from '../config/db.js';
import { Admin } from '../models/Admin.js';
import { User } from '../models/User.js';
import { STORE_REGISTRY, RETAILERS, LEGACY_STORE_ID_MAP } from '../../src/data/storeRegistry.js';
import { loadDiskStores, loadDeletedStoreIds } from './storeController.js';
import { getAllZonesMerged } from './zoneController.js';
import { suggestZonesForPoint } from '../utils/zoneMatch.js';

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const newPassword = () => crypto.randomBytes(9).toString('base64url');

// Stores = registry + any store the super admin created later (disk / DB), excluding deleted stores.
const getAllStores = () => {
  const deletedIds = new Set(loadDeletedStoreIds());
  const map = new Map();
  STORE_REGISTRY.forEach((s) => {
    const id = LEGACY_STORE_ID_MAP[s.storeId] ?? s.storeId;
    if (!deletedIds.has(s.storeId) && !deletedIds.has(id) && !deletedIds.has(s.branchId)) {
      map.set(id, { ...s, storeId: id, branchId: id });
    }
  });
  loadDiskStores().forEach((s) => {
    const id = LEGACY_STORE_ID_MAP[s.storeId] ?? s.storeId;
    if (id && !deletedIds.has(id) && !deletedIds.has(s.storeId) && !map.has(id)) {
      map.set(id, { ...s, storeId: id, branchId: id });
    }
  });
  return Array.from(map.values());
};
const findStore = (id) => getAllStores().find((s) => s.storeId === id || s.branchId === id) || null;

const adminDomain = (store) => RETAILERS[store.tenantId]?.domain || 'freshmart.pk';
const slugOf = (id) => String(id).replace(/^(branch_|STR-)/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '_');

// ---- Used by loginUser: branch-bound admin login -------------------------------------
// Returns null when the input is not an Admin account (so normal login continues).
export const tryBranchAdminLogin = async (loginInput, password, requestedBranchId) => {
  const clean = String(loginInput || '').toLowerCase().trim();
  let account = null;
  try {
    account = await Admin.findOne({
      $or: [
        { username: clean },
        { email: clean },
        { id: clean.toUpperCase() },
        { adminId: clean.toUpperCase() }
      ]
    });
  } catch (err) {
    console.warn('Admin findOne fallback/offline:', err.message);
  }
  if (!account) return null;

  const fail = { status: 401, body: { success: false, message: 'Invalid branch, username or password' } };
  const okPassword = await bcrypt.compare(String(password), String(account.password || '')).catch(() => false);
  const allowDemo = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_AUTH === 'true';
  const isDemoMatch = allowDemo && (password === 'admin123' || password === 'superadmin123' || (account.plainPassword && password === account.plainPassword));

  if (!okPassword && !isDemoMatch) return fail;
  if (account.status && account.status !== 'Active') {
    return { status: 403, body: { success: false, message: 'This admin account is suspended' } };
  }

  const isSuper = account.role === 'superadmin' || clean === 'superadmin';
  if (!isSuper) {
    // If requestedBranchId is provided, it must match the account's branchId
    if (requestedBranchId && requestedBranchId !== 'all' && String(requestedBranchId || '') !== account.branchId) {
      return fail;
    }
  }

  let user = null;
  try {
    user = await User.findOne({ email: account.email });
  } catch (err) {}
  return {
    status: 200,
    admin: account,
    userId: user?._id || account._id,
    isSuper
  };
};

// ---- Super admin endpoints --------------------------------------------------------------
// GET /api/admin/store-admins  -> every store with its admin (or null = "No Admin Allocated")
export const listStoreAdmins = async (req, res) => {
  try {
    let admins = isDbOnline() ? await Admin.find({ role: { $ne: 'superadmin' } }).lean() : [];
    if (!admins || admins.length === 0) {
      const { SEED_ADMINS } = await import('../config/seedCoreEntities.js');
      admins = SEED_ADMINS.filter((a) => a.role !== 'superadmin');
    }
    const allStoresList = getAllStores();
    const activeStoreIds = new Set(allStoresList.map((s) => s.storeId));
    const stores = allStoresList.map((s) => {
      const a = admins.find((x) => x.branchId === s.storeId || x.branchId === s.branchId);
      return {
        storeId: s.storeId,
        branchName: s.branchName,
        tenantId: s.tenantId,
        city: s.city || 'Faisalabad',
        admin: a ? {
          name: a.name,
          username: a.username,
          email: a.email,
          status: a.status || 'Active',
          branchId: a.branchId,
          branchName: a.branchName,
          tenantId: a.tenantId,
          tenantName: a.tenantName,
          city: a.city || s.city || 'Faisalabad'
        } : null
      };
    });

    const formattedAdmins = admins
      .filter((a) => activeStoreIds.has(a.branchId))
      .map((a) => ({
        id: a.id || a.adminId || a._id,
        name: a.name,
        username: a.username,
        email: a.email,
        phone: a.phone || '',
        city: a.city || 'Faisalabad',
        tenantId: a.tenantId,
        tenantName: a.tenantName,
        branchId: a.branchId,
        branchName: a.branchName,
        status: a.status || 'Active',
        role: a.role || 'admin',
        password: a.plainPassword || (process.env.ALLOW_DEMO_AUTH === 'true' ? 'admin123' : '••••••••')
      }));

    res.json({
      success: true,
      count: stores.length,
      withoutAdmin: stores.filter((s) => !s.admin).length,
      stores,
      admins: formattedAdmins
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/admin/stores/:storeId/admin  -> create the ONE admin of that store
export const createStoreAdmin = async (req, res) => {
  try {
    if (!isDbOnline()) return res.status(503).json({ success: false, message: 'Database required' });
    const store = findStore(req.params.storeId);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const existing = await Admin.findOne({ branchId: store.storeId, role: { $ne: 'superadmin' } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `This store already has an admin (${existing.username}). Use reset-password instead.`
      });
    }

    const username = String(req.body?.username || `admin.${slugOf(store.storeId)}@${adminDomain(store)}`).toLowerCase().trim();
    if (await Admin.findOne({ username })) {
      return res.status(409).json({ success: false, message: 'That username is already used' });
    }
    const password = req.body?.password ? String(req.body.password) : newPassword();
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    const hashed = await bcrypt.hash(password, 10);
    const name = String(req.body?.name || `${store.branchName} Admin`).trim();
    const phone = req.body?.phone || store.contactNumber || '';

    await Admin.create({
      id: `ADM-${slugOf(store.storeId).toUpperCase()}`,
      adminId: `ADM-${slugOf(store.storeId).toUpperCase()}`,
      name, username, email: username, password: hashed, plainPassword: '',
      phone, role: 'admin',
      tenantId: store.tenantId, tenantName: store.tenantName,
      branchId: store.storeId, branchName: store.branchName,
      city: store.city || 'Faisalabad', status: 'Active',
      permissions: ['manage_products', 'manage_orders', 'manage_staff', 'manage_riders']
    });
    await User.findOneAndUpdate(
      { email: username },
      { $set: { name, email: username, phone, role: 'admin', tenantId: store.tenantId, branchId: store.storeId, branchName: store.branchName, password: hashed } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Store admin created. Save the password now, it is shown only once.',
      credentials: { branchId: store.storeId, branchName: store.branchName, username, password }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/admin/stores/:storeId/admin/reset-password
export const resetStoreAdminPassword = async (req, res) => {
  try {
    if (!isDbOnline()) return res.status(503).json({ success: false, message: 'Database required' });
    const store = findStore(req.params.storeId);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    const admin = await Admin.findOne({ branchId: store.storeId, role: { $ne: 'superadmin' } });
    if (!admin) return res.status(404).json({ success: false, message: 'This store has no admin yet' });

    const password = newPassword();
    const hashed = await bcrypt.hash(password, 10);
    await Admin.updateOne({ _id: admin._id }, { $set: { password: hashed, plainPassword: '' } });
    await User.updateOne({ email: admin.email }, { $set: { password: hashed } });
    res.json({ success: true, credentials: { branchId: store.storeId, branchName: store.branchName, username: admin.username, password } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/admin/suggest-zone?lat=..&lng=..  -> which polygons contain this store location
export const suggestZone = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, message: 'lat and lng are required numbers' });
    }
    const zones = await getAllZonesMerged();
    res.json({ success: true, suggestions: suggestZonesForPoint(zones, lat, lng) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
