import { Admin } from '../models/Admin.js';
import { PickupStaff } from '../models/PickupStaff.js';
import { Rider } from '../models/ExtraModels.js';
import { User } from '../models/User.js';
import { isDbOnline } from './db.js';

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
  }
];

export const seedCoreEntities = async () => {
  if (!isDbOnline()) {
    console.log('ℹ️ DB offline; skipping MongoDB core entities sync.');
    return { success: false, reason: 'offline' };
  }

  try {
    console.log('🔄 Syncing Admins, Pickup Staff, and Riders into MongoDB...');

    // 1. Sync Admins into 'admins' collection
    for (const adm of SEED_ADMINS) {
      await Admin.findOneAndUpdate(
        { username: adm.username },
        { $set: adm },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      // Also ensure Admin exists in User collection for universal auth compatibility
      await User.findOneAndUpdate(
        { email: adm.email },
        {
          $set: {
            name: adm.name,
            email: adm.email,
            password: adm.password,
            phone: adm.phone,
            role: adm.role,
            tenantId: adm.tenantId,
            branchId: adm.branchId,
            branchName: adm.branchName
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`✅ ${SEED_ADMINS.length} Store Admins synced in 'admins' collection.`);

    // 2. Sync Pickup Staff into 'pickup_staff' collection
    for (const stf of SEED_PICKUP_STAFF) {
      await PickupStaff.findOneAndUpdate(
        { username: stf.username },
        { $set: stf },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      // Also ensure staff exists in User collection
      await User.findOneAndUpdate(
        { $or: [{ email: stf.email }, { staffId: stf.staffId }] },
        {
          $set: {
            name: stf.name,
            email: stf.email,
            password: stf.password,
            phone: stf.phone,
            role: 'pickup_staff',
            staffId: stf.staffId,
            tenantId: stf.tenantId,
            branchId: stf.branchId,
            branchName: stf.branchName
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`✅ ${SEED_PICKUP_STAFF.length} Pickup Staff synced in 'pickup_staff' collection.`);

    // 3. Sync Riders into 'riders' collection with clean branch, location, and matching region
    for (const rdr of SEED_RIDERS) {
      await Rider.findOneAndUpdate(
        { $or: [{ id: rdr.id }, { username: rdr.username }] },
        { $set: rdr },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`✅ ${SEED_RIDERS.length} Dedicated Fleet Riders synced in 'riders' collection.`);

    return { success: true };
  } catch (err) {
    console.error('Core entities seed error:', err.message);
    return { success: false, error: err.message };
  }
};
