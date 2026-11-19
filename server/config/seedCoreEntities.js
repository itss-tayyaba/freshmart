import { Admin } from '../models/Admin.js';
import { PickupStaff } from '../models/PickupStaff.js';
import { Rider } from '../models/ExtraModels.js';
import { User } from '../models/User.js';
import { isDbOnline } from './db.js';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { STORE_REGISTRY, RETAILERS } from '../../src/data/storeRegistry.js';

export const SEED_ADMINS = [
  {
    id: 'ADM-SUPER',
    adminId: 'ADM-SUPER',
    name: 'Super Admin HQ',
    username: 'superadmin',
    email: 'superadmin@freshmart.pk',
    password: 'superadmin123',
    plainPassword: 'superadmin123',
    phone: '+92 300 0000001',
    role: 'superadmin',
    tenantId: 'all',
    tenantName: 'Platform Central HQ',
    branchId: 'all',
    branchName: 'All Supermarket Branches',
    city: 'Faisalabad / Lahore',
    location: 'Central Multi-Tenant Operations HQ',
    address: 'Central Multi-Tenant Operations HQ, Pakistan',
    coordinates: { lat: 31.4125, lng: 73.0995 },
    status: 'Active',
    permissions: ['all']
  },
  {
    id: 'ADM-ALFATAH',
    adminId: 'ADM-ALFATAH',
    name: 'Al-Fatah Store Admin',
    username: 'admin@alfatah.pk',
    email: 'admin@alfatah.pk',
    password: 'admin123',
    plainPassword: 'admin123',
    phone: '+92 300 8441122',
    role: 'admin',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    city: 'Faisalabad',
    location: 'D-Ground, Peoples Colony 1, Faisalabad',
    address: 'Main D-Ground Flagship Hub, Peoples Colony 1, Faisalabad',
    coordinates: { lat: 31.4125, lng: 73.0995 },
    status: 'Active',
    permissions: ['manage_products', 'manage_orders', 'manage_staff', 'manage_riders']
  },
  {
    id: 'ADM-CHASEVALUE',
    adminId: 'ADM-CHASEVALUE',
    name: 'Chase Value Store Admin',
    username: 'admin@chasevalue.pk',
    email: 'admin@chasevalue.pk',
    password: 'admin123',
    plainPassword: 'admin123',
    phone: '+92 321 9876543',
    role: 'admin',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    branchId: 'branch_cv_fsd',
    branchName: 'Wholesale Express Hub',
    city: 'Faisalabad',
    location: 'Jaranwala Road, Near Peoples Colony, Faisalabad',
    address: 'Wholesale Express Hub, Jaranwala Road, Faisalabad',
    coordinates: { lat: 31.4360, lng: 73.1795 },
    status: 'Active',
    permissions: ['manage_products', 'manage_orders', 'manage_staff', 'manage_riders']
  },
  {
    id: 'ADM-CHASEUP',
    adminId: 'ADM-CHASEUP',
    name: 'Chase Up Store Admin',
    username: 'admin@chaseup.pk',
    email: 'admin@chaseup.pk',
    password: 'admin123',
    plainPassword: 'admin123',
    phone: '+92 333 5556677',
    role: 'admin',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    branchId: 'branch_006',
    branchName: 'Faisalabad Clock Tower Hub',
    city: 'Faisalabad',
    location: 'Clock Tower Bazar, Faisalabad',
    address: 'Clock Tower Commercial Center, Faisalabad',
    coordinates: { lat: 31.4150, lng: 73.0780 },
    status: 'Active',
    permissions: ['manage_products', 'manage_orders', 'manage_staff', 'manage_riders']
  },
  {
    id: 'ADM-UNIMAART',
    adminId: 'ADM-UNIMAART',
    name: 'Unimaart Store Admin',
    username: 'admin@unimart.pk',
    email: 'admin@unimart.pk',
    password: 'admin123',
    plainPassword: 'admin123',
    phone: '+92 320 6551696',
    role: 'admin',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart (Market Store)',
    branchId: 'branch_um_fsd',
    branchName: 'Peoples Colony Dark Store',
    city: 'Faisalabad',
    location: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
    address: 'Peoples Colony 1 Dark Store, Faisalabad',
    coordinates: { lat: 31.4015, lng: 73.0830 },
    status: 'Active',
    permissions: ['manage_products', 'manage_orders', 'manage_staff', 'manage_riders']
  }
];

export const SEED_PICKUP_STAFF = [
  {
    id: 'PCK-ALFATAH-HAFSA',
    staffId: 'PCK-ALFATAH-HAFSA',
    name: 'Hafsa Farooq',
    username: 'hafsa',
    email: 'hafsa@alfatah.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 300 1112233',
    role: 'pickup_staff',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    city: 'Faisalabad',
    location: 'D-Ground Packing Desk, Faisalabad',
    address: 'Main D-Ground Flagship Hub, Faisalabad',
    coordinates: { lat: 31.4125, lng: 73.0995 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 42
  },
  {
    id: 'PCK-ALFATAH',
    staffId: 'PCK-ALFATAH',
    name: 'Al-Fatah Packing Desk',
    username: 'alfatah_staff',
    email: 'staff@alfatah.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 300 1112234',
    role: 'pickup_staff',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    city: 'Faisalabad',
    location: 'D-Ground Flagship Hub, Faisalabad',
    address: 'Main D-Ground Flagship Hub, Faisalabad',
    coordinates: { lat: 31.4125, lng: 73.0995 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 35
  },
  {
    id: 'PCK-CHASEVALUE',
    staffId: 'PCK-CHASEVALUE',
    name: 'Chase Value Packing Desk',
    username: 'chasevalue_staff',
    email: 'staff@chasevalue.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 321 2223344',
    role: 'pickup_staff',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    branchId: 'branch_cv_fsd',
    branchName: 'Wholesale Express Hub',
    city: 'Faisalabad',
    location: 'Jaranwala Road Wholesale Hub, Faisalabad',
    address: 'Jaranwala Road, Near Peoples Colony, Faisalabad',
    coordinates: { lat: 31.4360, lng: 73.1795 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 28
  },
  {
    id: 'PCK-CHASEUP',
    staffId: 'PCK-CHASEUP',
    name: 'Chase Up Packing Desk',
    username: 'chaseup_staff',
    email: 'staff@chaseup.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 333 3334455',
    role: 'pickup_staff',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    branchId: 'branch_006',
    branchName: 'Faisalabad Clock Tower Hub',
    city: 'Faisalabad',
    location: 'Clock Tower Hub, Faisalabad',
    address: 'Clock Tower Bazar, Faisalabad',
    coordinates: { lat: 31.4150, lng: 73.0780 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 22
  },
  {
    id: 'PCK-UNIMAART',
    staffId: 'PCK-UNIMAART',
    name: 'Unimaart Packing Desk',
    username: 'unimart_staff',
    email: 'staff@unimart.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 345 4445566',
    role: 'pickup_staff',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart (Market Store)',
    branchId: 'branch_um_fsd',
    branchName: 'Peoples Colony Dark Store',
    city: 'Faisalabad',
    location: 'Peoples Colony Dark Store, Faisalabad',
    address: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
    coordinates: { lat: 31.4015, lng: 73.0830 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 50
  },
  {
    id: 'PCK-AYESHA',
    staffId: 'PCK-AYESHA',
    name: 'Ayesha Khan',
    username: 'ayesha',
    email: 'ayesha@freshmart.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 345 9876543',
    role: 'pickup_staff',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart (Market Store)',
    branchId: 'branch_um_fsd',
    branchName: 'Peoples Colony Dark Store',
    city: 'Faisalabad',
    location: 'Peoples Colony Dark Store, Faisalabad',
    address: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
    coordinates: { lat: 31.4015, lng: 73.0830 },
    status: 'Active',
    rating: 4.9,
    tasksCompleted: 31
  }
];

export const SEED_RIDERS = [
  {
    id: 'RDR-ALI',
    riderId: 'RDR-ALI',
    name: 'Ali Khan',
    username: 'ali',
    phone: '03001122334',
    password: 'rider123',
    plainPassword: 'rider123',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    city: 'Faisalabad',
    location: 'D-Ground Commercial Area, Faisalabad',
    address: 'Main D-Ground Flagship Hub, Faisalabad',
    region: 'D-Ground Commercial Region',
    zone: 'D-Ground Commercial Hub (Faisalabad)',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'LEK-2301',
    coordinates: { lat: 31.4110, lng: 73.0980 },
    coverageRadiusKm: 25,
    status: 'On-Duty',
    rating: 5.0,
    deliveriesCount: 64,
    isGlobal: false
  },
  {
    id: 'RDR-AHMAD',
    riderId: 'RDR-AHMAD',
    name: 'Ahmad Khan',
    username: 'ahmad',
    phone: '03206551696',
    password: 'rider123',
    plainPassword: 'rider123',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    city: 'Faisalabad',
    location: 'D-Ground, Peoples Colony 1, Faisalabad',
    address: 'Main D-Ground Flagship Hub, Faisalabad',
    region: 'Peoples Colony Region',
    zone: 'Peoples Colony No. 1 Hub (Faisalabad)',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'FSD-4821',
    coordinates: { lat: 31.4147, lng: 73.0872 },
    coverageRadiusKm: 25,
    status: 'On-Duty',
    rating: 5.0,
    deliveriesCount: 48,
    isGlobal: false
  },
  {
    id: 'RDR-ALFATAH',
    riderId: 'RDR-ALFATAH',
    name: 'Al-Fatah Express Courier',
    username: 'alfatah_rider',
    phone: '03206551696',
    password: 'rider123',
    plainPassword: 'rider123',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    city: 'Faisalabad',
    location: 'D-Ground Commercial Area, Faisalabad',
    address: 'Main D-Ground Flagship Hub, Faisalabad',
    region: 'D-Ground Commercial Region',
    zone: 'D-Ground Commercial Hub (Faisalabad)',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'FSD-7711',
    coordinates: { lat: 31.4147, lng: 73.0872 },
    coverageRadiusKm: 25,
    status: 'On-Duty',
    rating: 5.0,
    deliveriesCount: 30,
    isGlobal: false
  },
  {
    id: 'RDR-HAMZA',
    riderId: 'RDR-HAMZA',
    name: 'Hamza',
    username: 'hamza',
    phone: '03001234567',
    password: 'rider123',
    plainPassword: 'rider123',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    branchId: 'branch_cv_fsd',
    branchName: 'Wholesale Express Hub',
    city: 'Faisalabad',
    location: 'Jaranwala Road, Faisalabad',
    address: 'Wholesale Express Hub, Jaranwala Road, Faisalabad',
    region: 'Jaranwala Road Wholesale Region',
    zone: 'Jaranwala Road Wholesale Hub (Faisalabad)',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'LEK-0000',
    coordinates: { lat: 31.4360, lng: 73.1795 },
    coverageRadiusKm: 25,
    status: 'On-Duty',
    rating: 5.0,
    deliveriesCount: 72,
    isGlobal: false
  },
  {
    id: 'RDR-CHASEVALUE',
    riderId: 'RDR-CHASEVALUE',
    name: 'Bilal Ahmed',
    username: 'bilal_cv',
    phone: '03223344556',
    password: 'rider123',
    plainPassword: 'rider123',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    branchId: 'branch_cv_fsd',
    branchName: 'Wholesale Express Hub',
    city: 'Faisalabad',
    location: 'Jaranwala Road, Faisalabad',
    address: 'Wholesale Express Hub, Jaranwala Road, Faisalabad',
    region: 'Jaranwala Road Wholesale Region',
    zone: 'Jaranwala Road Wholesale Hub (Faisalabad)',
    vehicleType: '🏍️ Honda CG 125',
    vehicleNumber: 'FSD-3382',
    coordinates: { lat: 31.4360, lng: 73.1795 },
    coverageRadiusKm: 25,
    status: 'On-Duty',
    rating: 4.8,
    deliveriesCount: 38,
    isGlobal: false
  },
  {
    id: 'RDR-UNIMART',
    riderId: 'RDR-UNIMART',
    name: 'Usman Tariq',
    username: 'usman',
    phone: '03112233445',
    password: 'rider123',
    plainPassword: 'rider123',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart (Market Store)',
    branchId: 'branch_um_fsd',
    branchName: 'Peoples Colony Dark Store',
    city: 'Faisalabad',
    location: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
    address: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
    region: 'Peoples Colony Dark Store Region',
    zone: 'Peoples Colony No. 1 Hub (Faisalabad)',
    vehicleType: '🏍️ Yamaha YBR',
    vehicleNumber: 'FSD-9921',
    coordinates: { lat: 31.4015, lng: 73.0830 },
    coverageRadiusKm: 25,
    status: 'On-Duty',
    rating: 4.9,
    deliveriesCount: 55,
    isGlobal: false
  },
  {
    id: 'RDR-CHASEUP',
    riderId: 'RDR-CHASEUP',
    name: 'Kamran Shah',
    username: 'kamran_cu',
    phone: '03334455667',
    password: 'rider123',
    plainPassword: 'rider123',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    branchId: 'branch_006',
    branchName: 'Faisalabad Clock Tower Hub',
    city: 'Faisalabad',
    location: 'Clock Tower Bazar, Faisalabad',
    address: 'Clock Tower Commercial Center, Faisalabad',
    region: 'Clock Tower Commercial Region',
    zone: 'Clock Tower Hub (Faisalabad)',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'FSD-5590',
    coordinates: { lat: 31.4150, lng: 73.0780 },
    coverageRadiusKm: 25,
    status: 'On-Duty',
    rating: 4.9,
    deliveriesCount: 41,
    isGlobal: false
  },
  {
    id: 'RDR-CHASEUP-HASSAN',
    riderId: 'RDR-CHASEUP-HASSAN',
    name: 'hassan',
    username: 'hassan',
    phone: '032145236738',
    password: 'rider123',
    plainPassword: 'rider123',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    branchId: 'branch_006',
    branchName: 'Faisalabad Clock Tower Hub',
    city: 'Faisalabad',
    location: 'Clock Tower Commercial Center, Faisalabad',
    address: 'Clock Tower Commercial Center, Faisalabad',
    region: 'Clock Tower Commercial Region',
    zone: 'Faisalabad Clock Tower Hub',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'FSD-5219',
    coordinates: { lat: 31.4150, lng: 73.0780 },
    coverageRadiusKm: 25,
    status: 'Active',
    rating: 5.0,
    deliveriesCount: 0,
    isGlobal: false
  }
];

// -----------------------------------------------------------------------------
// Auto-generated accounts: every store flagged `isNew` in the registry gets its OWN
// store admin, pickup-staff login and rider, all locked to that store's branchId.
// Passwords are random (or STORE_INITIAL_PASSWORD from .env) and stored HASHED only.
// They are printed ONCE, the first time an account is created.
// -----------------------------------------------------------------------------
const slugOf = (branchId) => branchId.replace(/^branch_/, '');
const randomPassword = () => process.env.STORE_INITIAL_PASSWORD || crypto.randomBytes(9).toString('base64url');

const makeStoreAccounts = (st) => {
  const slug = slugOf(st.branchId);
  const domain = RETAILERS[st.tenantId].domain;
  const base = {
    tenantId: st.tenantId,
    tenantName: st.tenantName,
    branchId: st.branchId,
    branchName: st.branchName,
    city: st.city,
    address: st.address,
    coordinates: st.coords,
    status: 'Active',
    generated: true
  };
  return {
    admin: {
      ...base,
      id: `ADM-${slug.toUpperCase()}`,
      adminId: `ADM-${slug.toUpperCase()}`,
      name: `${st.branchName} Admin`,
      username: `admin.${slug}@${domain}`,
      email: `admin.${slug}@${domain}`,
      phone: st.contactNumber,
      role: 'admin',
      initialPassword: randomPassword(),
      permissions: ['manage_products', 'manage_orders', 'manage_staff', 'manage_riders']
    },
    staff: {
      ...base,
      id: `PCK-${slug.toUpperCase()}`,
      staffId: `PCK-${slug.toUpperCase()}`,
      name: `${st.branchName} Packing Desk`,
      username: `staff.${slug}`,
      email: `staff.${slug}@${domain}`,
      phone: st.contactNumber,
      role: 'pickup_staff',
      initialPassword: randomPassword()
    },
    rider: {
      ...base,
      id: `RDR-${slug.toUpperCase()}`,
      riderId: `RDR-${slug.toUpperCase()}`,
      name: `${st.branchName} Rider`,
      username: `rider.${slug}`,
      phone: st.contactNumber,
      region: st.branchName,
      zone: `${st.branchName} (${st.city})`,
      vehicleType: '🏍️ Honda 125',
      vehicleNumber: `FSD-${slug.toUpperCase().slice(0, 6)}`,
      coverageRadiusKm: 10,
      status: 'On-Duty',
      rating: 5.0,
      deliveriesCount: 0,
      isGlobal: false,
      initialPassword: randomPassword()
    }
  };
};

STORE_REGISTRY.filter((st) => st.isNew).forEach((st) => {
  const a = makeStoreAccounts(st);
  SEED_ADMINS.push(a.admin);
  SEED_PICKUP_STAFF.push(a.staff);
  SEED_RIDERS.push(a.rider);
});

// Upsert one account. Legacy demo accounts get their password hashed (previously
// findOneAndUpdate bypassed the bcrypt hook and stored plain text). Generated accounts
// only get a password on first creation, so re-running the seed never rotates it.
const upsertAccount = async (Model, filter, rawDoc, created) => {
  const { generated, initialPassword, password, ...doc } = rawDoc;
  if (generated) {
    const exists = await Model.findOne(filter).lean();
    if (!exists) {
      const hashed = await bcrypt.hash(initialPassword, 10);
      created.push({ type: Model.modelName, username: doc.username, branchId: doc.branchId, password: initialPassword });
      return Model.findOneAndUpdate(
        filter,
        { $set: doc, $setOnInsert: { password: hashed } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    return Model.findOneAndUpdate(filter, { $set: doc }, { new: true });
  }
  const set = password ? { ...doc, password: await bcrypt.hash(String(password), 10) } : doc;
  delete set.plainPassword; // never store a plain-text copy
  return Model.findOneAndUpdate(filter, { $set: set }, { upsert: true, new: true, setDefaultsOnInsert: true });
};

const userRecord = async (acc, role) => ({
  name: acc.name,
  email: acc.email,
  phone: acc.phone,
  role,
  tenantId: acc.tenantId,
  branchId: acc.branchId,
  branchName: acc.branchName,
  ...(acc.staffId ? { staffId: acc.staffId } : {})
});

export const seedCoreEntities = async () => {
  if (!isDbOnline()) {
    console.log('ℹ️ DB offline; skipping MongoDB core entities sync.');
    return { success: false, reason: 'offline' };
  }
  const created = [];
  try {
    console.log('🔄 Syncing Admins, Pickup Staff, and Riders into MongoDB...');

    for (const adm of SEED_ADMINS) {
      await upsertAccount(Admin, { username: adm.username }, adm, created);
      const userDoc = await userRecord(adm, adm.role);
      if (adm.generated) {
        const exists = await User.findOne({ email: adm.email }).lean();
        await User.findOneAndUpdate(
          { email: adm.email },
          { $set: userDoc, ...(exists ? {} : { $setOnInsert: { password: await bcrypt.hash(adm.initialPassword, 10) } }) },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else {
        await User.findOneAndUpdate(
          { email: adm.email },
          { $set: { ...userDoc, password: await bcrypt.hash(String(adm.password), 10) } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
    console.log(`✅ ${SEED_ADMINS.length} Store Admins synced.`);

    for (const stf of SEED_PICKUP_STAFF) {
      await upsertAccount(PickupStaff, { username: stf.username }, stf, created);
      // NOTE: the User collection and the auth guards use the role 'pickupstaff' (no underscore).
      const userDoc = await userRecord(stf, 'pickupstaff');
      const filter = { $or: [{ email: stf.email }, { staffId: stf.staffId }] };
      if (stf.generated) {
        const exists = await User.findOne(filter).lean();
        await User.findOneAndUpdate(
          filter,
          { $set: userDoc, ...(exists ? {} : { $setOnInsert: { password: await bcrypt.hash(stf.initialPassword, 10) } }) },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else {
        await User.findOneAndUpdate(
          filter,
          { $set: { ...userDoc, password: await bcrypt.hash(String(stf.password), 10) } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
    console.log(`✅ ${SEED_PICKUP_STAFF.length} Pickup Staff synced.`);

    for (const rdr of SEED_RIDERS) {
      await upsertAccount(Rider, { $or: [{ id: rdr.id }, { username: rdr.username }] }, rdr, created);
    }
    console.log(`✅ ${SEED_RIDERS.length} Riders synced.`);

    if (created.length) {
      console.log('\n🔑 NEW ACCOUNTS CREATED. Save these now, they are shown only once:');
      console.table(created);
    }
    return { success: true, created: created.length };
  } catch (err) {
    console.error('Core entities seed error:', err.message);
    return { success: false, error: err.message };
  }
};
