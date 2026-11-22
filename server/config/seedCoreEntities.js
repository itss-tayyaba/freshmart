import { Admin } from '../models/Admin.js';
import { PickupStaff } from '../models/PickupStaff.js';
import { Rider } from '../models/ExtraModels.js';
import { User } from '../models/User.js';
import { isDbOnline } from './db.js';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { STORE_REGISTRY, RETAILERS } from '../../src/data/storeRegistry.js';
import { loadDiskDeletedPickupStaff } from '../controllers/authController.js';
import { loadDiskDeletedRiders } from '../controllers/extraControllers.js';

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
  // 1. Al-Fatah Supermarket Branches
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
    id: 'PCK-AF-FSD-HAMZA',
    staffId: 'PCK-AF-FSD-HAMZA',
    name: 'Hamza Tariq',
    username: 'hamza_dground',
    email: 'hamza.dground@alfatah.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 300 1112234',
    role: 'pickup_staff',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    city: 'Faisalabad',
    location: 'D-Ground Packing Desk 2, Faisalabad',
    address: 'Main D-Ground Flagship Hub, Faisalabad',
    coordinates: { lat: 31.4125, lng: 73.0995 },
    status: 'Active',
    rating: 4.9,
    tasksCompleted: 38
  },
  {
    id: 'PCK-ALFATAH',
    staffId: 'PCK-ALFATAH',
    name: 'Al-Fatah Packing Desk',
    username: 'alfatah_staff',
    email: 'staff@alfatah.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 300 1112235',
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
    id: 'PCK-AF-KOH-KAMRAN',
    staffId: 'PCK-AF-KOH-KAMRAN',
    name: 'Kamran Akram',
    username: 'kamran_kohinoor',
    email: 'kamran.kohinoor@alfatah.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 300 8541135',
    role: 'pickup_staff',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_kohinoor',
    branchName: 'Kohinoor City Hub',
    city: 'Faisalabad',
    location: 'Kohinoor City Hub Packing Desk, Faisalabad',
    address: 'Kohinoor City, Jaranwala Road, Faisalabad',
    coordinates: { lat: 31.4170, lng: 73.1330 },
    status: 'Active',
    rating: 4.8,
    tasksCompleted: 29
  },
  {
    id: 'PCK-AF-KOH-KIRAN',
    staffId: 'PCK-AF-KOH-KIRAN',
    name: 'Kiran Shahzadi',
    username: 'kiran_kohinoor',
    email: 'kiran.kohinoor@alfatah.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 300 8541136',
    role: 'pickup_staff',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_kohinoor',
    branchName: 'Kohinoor City Hub',
    city: 'Faisalabad',
    location: 'Kohinoor City Packing Desk 2, Faisalabad',
    address: 'Kohinoor City, Jaranwala Road, Faisalabad',
    coordinates: { lat: 31.4170, lng: 73.1330 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 24
  },
  {
    id: 'PCK-AF-CANAL',
    staffId: 'PCK-AF-CANAL',
    name: 'Zubair Ahmad',
    username: 'zubair_canal',
    email: 'zubair.canal@alfatah.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 300 8541145',
    role: 'pickup_staff',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_canal',
    branchName: 'Canal Road Hub',
    city: 'Faisalabad',
    location: 'Canal Road Packing Desk, Faisalabad',
    address: 'East Canal Road, Faisalabad',
    coordinates: { lat: 31.4380, lng: 73.1290 },
    status: 'Active',
    rating: 4.9,
    tasksCompleted: 31
  },
  {
    id: 'PCK-AF-CAN-ZOYA',
    staffId: 'PCK-AF-CAN-ZOYA',
    name: 'Zoya Malik',
    username: 'zoya_canal',
    email: 'zoya.canal@alfatah.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 300 8541146',
    role: 'pickup_staff',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    branchId: 'branch_af_canal',
    branchName: 'Canal Road Hub',
    city: 'Faisalabad',
    location: 'Canal Road Packing Desk 2, Faisalabad',
    address: 'East Canal Road, Faisalabad',
    coordinates: { lat: 31.4380, lng: 73.1290 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 26
  },

  // 2. Chase Up Branches
  {
    id: 'PCK-CU-CTW-FARHAN',
    staffId: 'PCK-CU-CTW-FARHAN',
    name: 'Farhan Tariq',
    username: 'farhan_clocktower',
    email: 'farhan.clocktower@chaseup.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 333 2623345',
    role: 'pickup_staff',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    branchId: 'branch_006',
    branchName: 'Clock Tower Hub',
    city: 'Faisalabad',
    location: 'Clock Tower Hub Packing Desk, Faisalabad',
    address: 'Clock Tower Commercial Chowk, Faisalabad',
    coordinates: { lat: 31.4181, lng: 73.0790 },
    status: 'Active',
    rating: 4.9,
    tasksCompleted: 34
  },
  {
    id: 'PCK-CU-CTW-FATIMA',
    staffId: 'PCK-CU-CTW-FATIMA',
    name: 'Fatima Noor',
    username: 'fatima_clocktower',
    email: 'fatima.clocktower@chaseup.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 333 2623346',
    role: 'pickup_staff',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    branchId: 'branch_006',
    branchName: 'Clock Tower Hub',
    city: 'Faisalabad',
    location: 'Clock Tower Hub Packing Desk 2, Faisalabad',
    address: 'Clock Tower Commercial Chowk, Faisalabad',
    coordinates: { lat: 31.4181, lng: 73.0790 },
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
    branchName: 'Clock Tower Hub',
    city: 'Faisalabad',
    location: 'Clock Tower Hub, Faisalabad',
    address: 'Clock Tower Bazar, Faisalabad',
    coordinates: { lat: 31.4150, lng: 73.0780 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 22
  },
  {
    id: 'PCK-CU-SAT-NOMAN',
    staffId: 'PCK-CU-SAT-NOMAN',
    name: 'Noman Ali',
    username: 'noman_satiana',
    email: 'noman.satiana@chaseup.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 333 2623356',
    role: 'pickup_staff',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    branchId: 'branch_cu_satiana',
    branchName: 'Satiana Road Hub',
    city: 'Faisalabad',
    location: 'Satiana Road Hub Packing Desk, Faisalabad',
    address: 'Satiana Road, Faisalabad',
    coordinates: { lat: 31.3960, lng: 73.0340 },
    status: 'Active',
    rating: 4.8,
    tasksCompleted: 21
  },
  {
    id: 'PCK-CU-SAT-NAILA',
    staffId: 'PCK-CU-SAT-NAILA',
    name: 'Naila Parveen',
    username: 'naila_satiana',
    email: 'naila.satiana@chaseup.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 333 2623357',
    role: 'pickup_staff',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    branchId: 'branch_cu_satiana',
    branchName: 'Satiana Road Hub',
    city: 'Faisalabad',
    location: 'Satiana Road Hub Packing Desk 2, Faisalabad',
    address: 'Satiana Road, Faisalabad',
    coordinates: { lat: 31.3960, lng: 73.0340 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 19
  },
  {
    id: 'PCK-CU-SAM-SOHAIL',
    staffId: 'PCK-CU-SAM-SOHAIL',
    name: 'Sohail Raza',
    username: 'sohail_samanabad',
    email: 'sohail.samanabad@chaseup.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 333 2623367',
    role: 'pickup_staff',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    branchId: 'branch_cu_samanabad',
    branchName: 'Samanabad Hub',
    city: 'Faisalabad',
    location: 'Samanabad Hub Packing Desk, Faisalabad',
    address: 'Samanabad Main Market, Faisalabad',
    coordinates: { lat: 31.4290, lng: 73.0620 },
    status: 'Active',
    rating: 4.9,
    tasksCompleted: 30
  },
  {
    id: 'PCK-CU-SAM-SIDRA',
    staffId: 'PCK-CU-SAM-SIDRA',
    name: 'Sidra Batool',
    username: 'sidra_samanabad',
    email: 'sidra.samanabad@chaseup.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 333 2623368',
    role: 'pickup_staff',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    branchId: 'branch_cu_samanabad',
    branchName: 'Samanabad Hub',
    city: 'Faisalabad',
    location: 'Samanabad Hub Packing Desk 2, Faisalabad',
    address: 'Samanabad Main Market, Faisalabad',
    coordinates: { lat: 31.4290, lng: 73.0620 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 25
  },

  // 3. Chase Value Branches
  {
    id: 'PCK-CV-WHS-BILAL',
    staffId: 'PCK-CV-WHS-BILAL',
    name: 'Bilal Sheikh',
    username: 'bilal_wholesale',
    email: 'bilal.wholesale@chasevalue.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 321 8729901',
    role: 'pickup_staff',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    branchId: 'branch_cv_fsd',
    branchName: 'Wholesale Express Hub',
    city: 'Faisalabad',
    location: 'Jaranwala Road Wholesale Hub, Faisalabad',
    address: 'Jaranwala Road Wholesale Terminal, Faisalabad',
    coordinates: { lat: 31.4360, lng: 73.1795 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 39
  },
  {
    id: 'PCK-CV-WHS-BUSHRA',
    staffId: 'PCK-CV-WHS-BUSHRA',
    name: 'Bushra Jameel',
    username: 'bushra_wholesale',
    email: 'bushra.wholesale@chasevalue.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 321 8729902',
    role: 'pickup_staff',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    branchId: 'branch_cv_fsd',
    branchName: 'Wholesale Express Hub',
    city: 'Faisalabad',
    location: 'Jaranwala Road Wholesale Hub Desk 2, Faisalabad',
    address: 'Jaranwala Road Wholesale Terminal, Faisalabad',
    coordinates: { lat: 31.4360, lng: 73.1795 },
    status: 'Active',
    rating: 4.8,
    tasksCompleted: 27
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
    id: 'PCK-CV-GMA-USMAN',
    staffId: 'PCK-CV-GMA-USMAN',
    name: 'Usman Ghani',
    username: 'usman_gmabad',
    email: 'usman.gmabad@chasevalue.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 321 8729912',
    role: 'pickup_staff',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    branchId: 'branch_cv_gmabad',
    branchName: 'Ghulam Muhammad Abad Hub',
    city: 'Faisalabad',
    location: 'Ghulam Muhammad Abad Hub Packing Desk, Faisalabad',
    address: 'Ghulam Muhammad Abad, Faisalabad',
    coordinates: { lat: 31.4290, lng: 73.1120 },
    status: 'Active',
    rating: 4.9,
    tasksCompleted: 33
  },
  {
    id: 'PCK-CV-GMA-UROOJ',
    staffId: 'PCK-CV-GMA-UROOJ',
    name: 'Urooj Fatima',
    username: 'urooj_gmabad',
    email: 'urooj.gmabad@chasevalue.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 321 8729913',
    role: 'pickup_staff',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    branchId: 'branch_cv_gmabad',
    branchName: 'Ghulam Muhammad Abad Hub',
    city: 'Faisalabad',
    location: 'Ghulam Muhammad Abad Hub Packing Desk 2, Faisalabad',
    address: 'Ghulam Muhammad Abad, Faisalabad',
    coordinates: { lat: 31.4290, lng: 73.1120 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 22
  },

  // 4. Unimart Branches
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
  },
  {
    id: 'PCK-UM-FSD-ASAD',
    staffId: 'PCK-UM-FSD-ASAD',
    name: 'Asadullah Butt',
    username: 'asad_peoples',
    email: 'asad.peoples@unimart.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 345 8441123',
    role: 'pickup_staff',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart (Market Store)',
    branchId: 'branch_um_fsd',
    branchName: 'Peoples Colony Dark Store',
    city: 'Faisalabad',
    location: 'Peoples Colony Dark Store Desk 2, Faisalabad',
    address: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
    coordinates: { lat: 31.4015, lng: 73.0830 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 44
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
    id: 'PCK-UM-MDN-SALMAN',
    staffId: 'PCK-UM-MDN-SALMAN',
    name: 'Salman Rasheed',
    username: 'salman_madina',
    email: 'salman.madina@unimart.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 345 8441134',
    role: 'pickup_staff',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart (Market Store)',
    branchId: 'branch_um_madina',
    branchName: 'Madina Town Hub',
    city: 'Faisalabad',
    location: 'Madina Town Hub Packing Desk, Faisalabad',
    address: 'Madina Town Main Boulevard, Faisalabad',
    coordinates: { lat: 31.4530, lng: 73.0840 },
    status: 'Active',
    rating: 4.9,
    tasksCompleted: 35
  },
  {
    id: 'PCK-UM-MDN-SANA',
    staffId: 'PCK-UM-MDN-SANA',
    name: 'Sana Mehmood',
    username: 'sana_madina',
    email: 'sana.madina@unimart.pk',
    password: 'staff123',
    plainPassword: 'staff123',
    phone: '+92 345 8441135',
    role: 'pickup_staff',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart (Market Store)',
    branchId: 'branch_um_madina',
    branchName: 'Madina Town Hub',
    city: 'Faisalabad',
    location: 'Madina Town Hub Packing Desk 2, Faisalabad',
    address: 'Madina Town Main Boulevard, Faisalabad',
    coordinates: { lat: 31.4530, lng: 73.0840 },
    status: 'Active',
    rating: 5.0,
    tasksCompleted: 29
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

    // Load deleted tombstones to ensure deleted staff or riders are NEVER resurrected
    const deletedStaffList = loadDiskDeletedPickupStaff();
    const deletedStaffSet = new Set(deletedStaffList.map((x) => String(x).toLowerCase().trim()));
    const isStaffDeleted = (s) => {
      if (!s) return true;
      const keys = [s.id, s.staffId, s.username, s.email, s.phone].filter(Boolean).map((k) => String(k).toLowerCase().trim());
      return keys.some((k) => deletedStaffSet.has(k));
    };

    const deletedRidersList = loadDiskDeletedRiders();
    const deletedRidersSet = new Set(deletedRidersList.map((x) => String(x).toLowerCase().trim()));
    const isRiderDeleted = (r) => {
      if (!r) return true;
      const keys = [r.id, r.riderId, r.username, r.phone].filter(Boolean).map((k) => String(k).toLowerCase().trim());
      return keys.some((k) => deletedRidersSet.has(k));
    };

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
      if (isStaffDeleted(stf)) {
        continue;
      }
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
    console.log(`✅ Pickup Staff synced (excluding deleted accounts).`);

    for (const rdr of SEED_RIDERS) {
      if (isRiderDeleted(rdr)) {
        continue;
      }
      await upsertAccount(Rider, { $or: [{ id: rdr.id }, { username: rdr.username }] }, rdr, created);
    }
    console.log(`✅ Delivery Riders synced (excluding deleted accounts).`);

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
