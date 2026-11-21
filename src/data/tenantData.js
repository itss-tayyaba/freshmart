// FreshMart Super Grocery Platform - Multi-Tenant Registry
// Seeded with top real-world Pakistani supermarket giants & FreshMart Direct

export const INITIAL_TENANTS = [
  {
    id: 'tenant-alfatah',
    tenantId: 'tenant-alfatah',
    name: 'Al-Fatah Supermarket',
    slug: 'al-fatah',
    tagline: "Pakistan's Premier Department Store & Hypermarket Since 1941",
    description: 'Iconic luxury supermarket offering imported delicacies, farm-fresh produce, gourmet meats, organic dairy, and international pantry essentials.',
    logo: '🏬',
    banner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    badge: 'Premier Hypermarket',
    ownerName: 'Sheikh Tariq Al-Fatah',
    ownerEmail: 'admin@alfatah.pk',
    ownerPhone: '+92 300 8441122',
    city: 'Faisalabad',
    status: 'Active',
    color: '#991b1b',
    theme: {
      primaryColor: '#991b1b', // Ruby Crimson
      accentColor: '#f59e0b',
      bgGradient: 'from-rose-900 via-red-950 to-slate-950'
    },
    hubs: ['D-Ground Flagship Hub (Faisalabad)', 'Peoples Colony Main Branch (Faisalabad)'],
    subscription: {
      plan: 'Enterprise',
      billingCycle: 'Annual',
      price: 75000,
      status: 'Active',
      renewsAt: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000).toISOString(),
      features: ['Store Admin Console', 'Unlimited Products', '28 Dedicated Fleet Riders', 'Real-time GPS Telemetry', 'Priority Dark Store SLA', 'Dedicated Account Manager']
    },
    stats: {
      totalOrders: 1480,
      totalRevenue: 3840000,
      activeProducts: 142,
      activeRiders: 28,
      fulfillmentRate: 99.2
    }
  },
  {
    id: 'tenant-chasevalue',
    tenantId: 'tenant-chasevalue',
    name: 'Chase Value',
    displayName: 'Case Value (Local Grocery)',
    brandName: 'Case Value',
    slug: 'chase-value',
    tagline: 'Fresh • Local • Reliable — Maximum Wholesale Value',
    description: 'Local produce, fresh meat, dairy and everyday essentials — always fresh, always near you.',
    logo: '🛒',
    banner: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    badge: 'Local Grocery & Value Wholesale',
    ownerName: 'Farhan Case Value',
    ownerEmail: 'admin@chasevalue.pk',
    ownerPhone: '+92 321 9876543',
    city: 'Faisalabad',
    status: 'Active',
    color: '#78350f',
    theme: {
      primaryColor: '#78350f', // Warm Rustic Amber Mocha
      accentColor: '#d97706',
      bgGradient: 'from-[#451a03] via-[#78350f] to-[#b45309]'
    },
    hubs: ['D-Ground Hub (Faisalabad)', 'Peoples Colony Dark Store (Faisalabad)'],
    subscription: {
      plan: 'Professional',
      billingCycle: 'Monthly',
      price: 35000,
      status: 'Active',
      renewsAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      features: ['Store Admin Console', 'Unlimited Products', '19 Dedicated Fleet Riders', 'GPS Dispatch Queue', 'Analytics Dashboard']
    },
    stats: {
      totalOrders: 980,
      totalRevenue: 2150000,
      activeProducts: 98,
      activeRiders: 19,
      fulfillmentRate: 98.4
    }
  },
  {
    id: 'tenant-chaseup',
    tenantId: 'tenant-chaseup',
    name: 'Chase Up',
    slug: 'chase-up',
    city: 'Faisalabad',
    tagline: 'One-Stop Family Shopping & Fresh Supermarket Chain',
    description: 'Extensive retail department chain serving hundreds of thousands of Pakistani families with high-turnover grocery essentials and household items.',
    logo: '🏪',
    banner: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80',
    badge: 'Value Department Store',
    ownerName: 'Muhammad Salman Chase',
    ownerEmail: 'admin@chaseup.pk',
    ownerPhone: '+92 333 5556677',
    status: 'Active',
    color: '#6b21a8',
    theme: {
      primaryColor: '#6b21a8', // Royal Purple
      accentColor: '#f97316',
      bgGradient: 'from-purple-900 via-purple-950 to-slate-950'
    },
    hubs: ['Mall of Faisalabad Flagship (Faisalabad)', 'Clock Tower Hub (Faisalabad)'],
    subscription: {
      plan: 'Professional',
      billingCycle: 'Monthly',
      price: 35000,
      status: 'Active',
      renewsAt: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
      features: ['Store Admin Console', '15 Dedicated Fleet Riders', 'Real-time GPS Tracking', 'Weekly Performance Reports']
    },
    stats: {
      totalOrders: 820,
      totalRevenue: 1740000,
      activeProducts: 84,
      activeRiders: 15,
      fulfillmentRate: 97.9
    }
  },
  {
    id: 'tenant-freshmart',
    tenantId: 'tenant-freshmart',
    name: 'FreshMart Direct',
    displayName: 'Unimaart (Market Store)',
    brandName: 'Unimaart',
    slug: 'freshmart',
    city: 'Faisalabad',
    tagline: 'Fresh Food, Fair Prices, Fast Delivery',
    description: 'Fresh veggies full of vitamins for your health. Quality produce and daily market essentials delivered right to you in minutes.',
    logo: '🛒',
    banner: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
    badge: 'Unimaart Market Store • Express 10-Min Delivery',
    ownerName: 'Aimen Yasin',
    ownerEmail: 'support@unimaart.com',
    ownerPhone: '+9870-256-679',
    status: 'Active',
    color: '#0284c7',
    theme: {
      primaryColor: '#0284c7', // Royal Sapphire Blue
      accentColor: '#38bdf8',
      bgGradient: 'from-[#033659] via-[#0284c7] to-[#38bdf8]'
    },
    hubs: ['D-Ground Commercial Center (Faisalabad)', 'Peoples Colony Dark Store (Faisalabad)'],
    subscription: {
      plan: 'Enterprise',
      billingCycle: 'Annual',
      price: 75000,
      status: 'Active',
      renewsAt: new Date(Date.now() + 340 * 24 * 60 * 60 * 1000).toISOString(),
      features: ['Store Admin Console', 'Unlimited Dark Store Dispatches', '22 Fleet Riders', 'Live Radar Telemetry', 'AI Inventory Forecasts']
    },
    stats: {
      totalOrders: 2150,
      totalRevenue: 4950000,
      activeProducts: 160,
      activeRiders: 22,
      fulfillmentRate: 99.6
    }
  }
];

export const SUBSCRIPTION_PLANS = [
  {
    name: 'Starter',
    badge: 'Growth Stores',
    price: 15000,
    priceMonthly: 15000,
    priceAnnual: 150000,
    commissionRate: 5,
    maxHubs: 1,
    maxRiders: 5,
    slaGuarantee: '98.0%',
    description: 'For boutique grocery and single-neighborhood delivery stores.',
    features: [
      'Up to 500 orders / month',
      '5 delivery riders',
      'Store Admin Console',
      'Doorstep OTP Handover verification',
      'Standard support'
    ]
  },
  {
    name: 'Professional',
    badge: 'Popular Retail Chains',
    price: 35000,
    priceMonthly: 35000,
    priceAnnual: 350000,
    commissionRate: 3.5,
    maxHubs: 5,
    maxRiders: 20,
    slaGuarantee: '99.0%',
    customDomain: true,
    description: 'For expanding multi-branch supermarket chains across cities.',
    features: [
      'Up to 2,500 orders / month',
      '20 delivery riders',
      'Store Admin Console & Inventory Sync',
      'Live GPS Radar & ETA Calculation',
      'Multi-hub delivery zones',
      'Weekly automated reports'
    ]
  },
  {
    name: 'Enterprise',
    badge: 'Hypermarket Giants',
    price: 75000,
    priceMonthly: 75000,
    priceAnnual: 750000,
    commissionRate: 2,
    maxHubs: 'Unlimited',
    maxRiders: 'Unlimited',
    slaGuarantee: '99.9%',
    customDomain: true,
    dedicatedSupport: true,
    description: 'For nationwide supermarket chains requiring unlimited scale.',
    features: [
      'Unlimited monthly orders',
      'Unlimited delivery riders & dispatchers',
      'Full Multi-Store isolation',
      'Custom subdomain branding',
      'Dedicated 24/7 SLA manager',
      'Custom enterprise ERP integrations'
    ]
  }
];

SUBSCRIPTION_PLANS.Starter = SUBSCRIPTION_PLANS[0];
SUBSCRIPTION_PLANS.Pro = SUBSCRIPTION_PLANS[1];
SUBSCRIPTION_PLANS.Professional = SUBSCRIPTION_PLANS[1];
SUBSCRIPTION_PLANS.Enterprise = SUBSCRIPTION_PLANS[2];

// Initial Mart Admins & Branch Admins (Empty by default: Super Admin creates admins as needed)
export const INITIAL_STORE_ADMINS = [];

// Initial Pickup Staff for each supermarket chain (Strictly partitioned by physical branch)
export const INITIAL_PICKUP_STAFF = [
  // ==========================================
  // 1. AL-FATAH SUPERMARKET BRANCHES
  // ==========================================
  // Al-Fatah: D-Ground Flagship Hub (branch_af_fsd)
  {
    id: 'PCK-ALFATAH-HAFSA',
    staffId: 'PCK-ALFATAH-HAFSA',
    name: 'Hafsa Farooq',
    username: 'hafsa',
    email: 'hafsa@alfatah.pk',
    password: 'staff123',
    phone: '+92 300 1112233',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    storeId: 'branch_af_fsd',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-AF-FSD-HAMZA',
    staffId: 'PCK-AF-FSD-HAMZA',
    name: 'Hamza Tariq',
    username: 'hamza_dground',
    email: 'hamza.dground@alfatah.pk',
    password: 'staff123',
    phone: '+92 300 1112234',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    storeId: 'branch_af_fsd',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-ALFATAH',
    staffId: 'PCK-ALFATAH',
    name: 'Al-Fatah Packing Desk',
    username: 'alfatah_staff',
    email: 'staff@alfatah.pk',
    password: 'staff123',
    phone: '+92 300 1112235',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    storeId: 'branch_af_fsd',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    status: 'Active',
    role: 'pickup_staff'
  },

  // Al-Fatah: Kohinoor City Hub (branch_af_kohinoor)
  {
    id: 'PCK-AF-KOH-KAMRAN',
    staffId: 'PCK-AF-KOH-KAMRAN',
    name: 'Kamran Akram',
    username: 'kamran_kohinoor',
    email: 'kamran.kohinoor@alfatah.pk',
    password: 'staff123',
    phone: '+92 300 8541135',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    storeId: 'branch_af_kohinoor',
    branchId: 'branch_af_kohinoor',
    branchName: 'Kohinoor City Hub',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-AF-KOH-KIRAN',
    staffId: 'PCK-AF-KOH-KIRAN',
    name: 'Kiran Shahzadi',
    username: 'kiran_kohinoor',
    email: 'kiran.kohinoor@alfatah.pk',
    password: 'staff123',
    phone: '+92 300 8541136',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    storeId: 'branch_af_kohinoor',
    branchId: 'branch_af_kohinoor',
    branchName: 'Kohinoor City Hub',
    status: 'Active',
    role: 'pickup_staff'
  },

  // Al-Fatah: Canal Road Hub (branch_af_canal)
  {
    id: 'PCK-AF-CANAL',
    staffId: 'PCK-AF-CANAL',
    name: 'Zubair Ahmad',
    username: 'zubair_canal',
    email: 'zubair.canal@alfatah.pk',
    password: 'staff123',
    phone: '+92 300 8541145',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    storeId: 'branch_af_canal',
    branchId: 'branch_af_canal',
    branchName: 'Canal Road Hub',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-AF-CAN-ZOYA',
    staffId: 'PCK-AF-CAN-ZOYA',
    name: 'Zoya Malik',
    username: 'zoya_canal',
    email: 'zoya.canal@alfatah.pk',
    password: 'staff123',
    phone: '+92 300 8541146',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    storeId: 'branch_af_canal',
    branchId: 'branch_af_canal',
    branchName: 'Canal Road Hub',
    status: 'Active',
    role: 'pickup_staff'
  },

  // ==========================================
  // 2. CHASE UP BRANCHES
  // ==========================================
  // Chase Up: Clock Tower Hub (branch_006)
  {
    id: 'PCK-CU-CTW-FARHAN',
    staffId: 'PCK-CU-CTW-FARHAN',
    name: 'Farhan Tariq',
    username: 'farhan_clocktower',
    email: 'farhan.clocktower@chaseup.pk',
    password: 'staff123',
    phone: '+92 333 2623345',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    storeId: 'branch_006',
    branchId: 'branch_006',
    branchName: 'Clock Tower Hub',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-CU-CTW-FATIMA',
    staffId: 'PCK-CU-CTW-FATIMA',
    name: 'Fatima Noor',
    username: 'fatima_clocktower',
    email: 'fatima.clocktower@chaseup.pk',
    password: 'staff123',
    phone: '+92 333 2623346',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    storeId: 'branch_006',
    branchId: 'branch_006',
    branchName: 'Clock Tower Hub',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-CHASEUP',
    staffId: 'PCK-CHASEUP',
    name: 'Chase Up Packing Desk',
    username: 'chaseup_staff',
    email: 'staff@chaseup.pk',
    password: 'staff123',
    phone: '+92 333 3334455',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    storeId: 'branch_006',
    branchId: 'branch_006',
    branchName: 'Clock Tower Hub',
    status: 'Active',
    role: 'pickup_staff'
  },

  // Chase Up: Satiana Road Hub (branch_cu_satiana)
  {
    id: 'PCK-CU-SAT-NOMAN',
    staffId: 'PCK-CU-SAT-NOMAN',
    name: 'Noman Ali',
    username: 'noman_satiana',
    email: 'noman.satiana@chaseup.pk',
    password: 'staff123',
    phone: '+92 333 2623356',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    storeId: 'branch_cu_satiana',
    branchId: 'branch_cu_satiana',
    branchName: 'Satiana Road Hub',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-CU-SAT-NAILA',
    staffId: 'PCK-CU-SAT-NAILA',
    name: 'Naila Parveen',
    username: 'naila_satiana',
    email: 'naila.satiana@chaseup.pk',
    password: 'staff123',
    phone: '+92 333 2623357',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    storeId: 'branch_cu_satiana',
    branchId: 'branch_cu_satiana',
    branchName: 'Satiana Road Hub',
    status: 'Active',
    role: 'pickup_staff'
  },

  // Chase Up: Samanabad Hub (branch_cu_samanabad)
  {
    id: 'PCK-CU-SAM-SOHAIL',
    staffId: 'PCK-CU-SAM-SOHAIL',
    name: 'Sohail Raza',
    username: 'sohail_samanabad',
    email: 'sohail.samanabad@chaseup.pk',
    password: 'staff123',
    phone: '+92 333 2623367',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    storeId: 'branch_cu_samanabad',
    branchId: 'branch_cu_samanabad',
    branchName: 'Samanabad Hub',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-CU-SAM-SIDRA',
    staffId: 'PCK-CU-SAM-SIDRA',
    name: 'Sidra Batool',
    username: 'sidra_samanabad',
    email: 'sidra.samanabad@chaseup.pk',
    password: 'staff123',
    phone: '+92 333 2623368',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    storeId: 'branch_cu_samanabad',
    branchId: 'branch_cu_samanabad',
    branchName: 'Samanabad Hub',
    status: 'Active',
    role: 'pickup_staff'
  },

  // ==========================================
  // 3. CHASE VALUE BRANCHES
  // ==========================================
  // Chase Value: Wholesale Express Hub (branch_cv_fsd)
  {
    id: 'PCK-CV-WHS-BILAL',
    staffId: 'PCK-CV-WHS-BILAL',
    name: 'Bilal Sheikh',
    username: 'bilal_wholesale',
    email: 'bilal.wholesale@chasevalue.pk',
    password: 'staff123',
    phone: '+92 321 8729901',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    storeId: 'branch_cv_fsd',
    branchId: 'branch_cv_fsd',
    branchName: 'Wholesale Express Hub',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-CV-WHS-BUSHRA',
    staffId: 'PCK-CV-WHS-BUSHRA',
    name: 'Bushra Jameel',
    username: 'bushra_wholesale',
    email: 'bushra.wholesale@chasevalue.pk',
    password: 'staff123',
    phone: '+92 321 8729902',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    storeId: 'branch_cv_fsd',
    branchId: 'branch_cv_fsd',
    branchName: 'Wholesale Express Hub',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-CHASEVALUE',
    staffId: 'PCK-CHASEVALUE',
    name: 'Chase Value Packing Desk',
    username: 'chasevalue_staff',
    email: 'staff@chasevalue.pk',
    password: 'staff123',
    phone: '+92 321 2223344',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    storeId: 'branch_cv_fsd',
    branchId: 'branch_cv_fsd',
    branchName: 'Wholesale Express Hub',
    status: 'Active',
    role: 'pickup_staff'
  },

  // Chase Value: Ghulam Muhammad Abad Hub (branch_cv_gmabad)
  {
    id: 'PCK-CV-GMA-USMAN',
    staffId: 'PCK-CV-GMA-USMAN',
    name: 'Usman Ghani',
    username: 'usman_gmabad',
    email: 'usman.gmabad@chasevalue.pk',
    password: 'staff123',
    phone: '+92 321 8729912',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    storeId: 'branch_cv_gmabad',
    branchId: 'branch_cv_gmabad',
    branchName: 'Ghulam Muhammad Abad Hub',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-CV-GMA-UROOJ',
    staffId: 'PCK-CV-GMA-UROOJ',
    name: 'Urooj Fatima',
    username: 'urooj_gmabad',
    email: 'urooj.gmabad@chasevalue.pk',
    password: 'staff123',
    phone: '+92 321 8729913',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    storeId: 'branch_cv_gmabad',
    branchId: 'branch_cv_gmabad',
    branchName: 'Ghulam Muhammad Abad Hub',
    status: 'Active',
    role: 'pickup_staff'
  },

  // ==========================================
  // 4. UNIMART BRANCHES
  // ==========================================
  // Unimart: Peoples Colony Dark Store (branch_um_fsd)
  {
    id: 'PCK-AYESHA',
    staffId: 'PCK-AYESHA',
    name: 'Ayesha Khan',
    username: 'ayesha',
    email: 'ayesha@freshmart.pk',
    password: 'staff123',
    phone: '+92 345 9876543',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart (Market Store)',
    storeId: 'branch_um_fsd',
    branchId: 'branch_um_fsd',
    branchName: 'Peoples Colony Dark Store',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-UM-FSD-ASAD',
    staffId: 'PCK-UM-FSD-ASAD',
    name: 'Asadullah Butt',
    username: 'asad_peoples',
    email: 'asad.peoples@unimart.pk',
    password: 'staff123',
    phone: '+92 345 8441123',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart (Market Store)',
    storeId: 'branch_um_fsd',
    branchId: 'branch_um_fsd',
    branchName: 'Peoples Colony Dark Store',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-UNIMAART',
    staffId: 'PCK-UNIMAART',
    name: 'Unimaart Packing Desk',
    username: 'unimart_staff',
    email: 'staff@unimart.pk',
    password: 'staff123',
    phone: '+92 345 4445566',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart',
    storeId: 'branch_um_fsd',
    branchId: 'branch_um_fsd',
    branchName: 'Peoples Colony Dark Store',
    status: 'Active',
    role: 'pickup_staff'
  },

  // Unimart: Madina Town Hub (branch_um_madina)
  {
    id: 'PCK-UM-MDN-SALMAN',
    staffId: 'PCK-UM-MDN-SALMAN',
    name: 'Salman Rasheed',
    username: 'salman_madina',
    email: 'salman.madina@unimart.pk',
    password: 'staff123',
    phone: '+92 345 8441134',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart (Market Store)',
    storeId: 'branch_um_madina',
    branchId: 'branch_um_madina',
    branchName: 'Madina Town Hub',
    status: 'Active',
    role: 'pickup_staff'
  },
  {
    id: 'PCK-UM-MDN-SANA',
    staffId: 'PCK-UM-MDN-SANA',
    name: 'Sana Mehmood',
    username: 'sana_madina',
    email: 'sana.madina@unimart.pk',
    password: 'staff123',
    phone: '+92 345 8441135',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart (Market Store)',
    storeId: 'branch_um_madina',
    branchId: 'branch_um_madina',
    branchName: 'Madina Town Hub',
    status: 'Active',
    role: 'pickup_staff'
  }
];

// Helper to auto-generate dedicated pickup staff for any new / custom store branch
export const generateBranchPickupStaff = (store, index = 1) => {
  const storeId = store.branchId || store.storeId || store._id || store.id;
  const storeName = store.branchName || store.name || 'Store Branch';
  const cleanId = String(storeId).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const tenantId = store.tenantId || 'tenant-freshmart';
  const tenantName = store.tenantName || store.retailerName || 'Supermarket';
  const domain = String(tenantId).includes('alfatah') ? 'alfatah.pk'
    : String(tenantId).includes('chaseup') ? 'chaseup.pk'
    : String(tenantId).includes('chasevalue') ? 'chasevalue.pk'
    : 'unimart.pk';

  const staffNames = ['Amir', 'Noreen', 'Shahid', 'Rabia', 'Kashif', 'Hina'];
  const namePrefix = staffNames[(index - 1) % staffNames.length];

  return {
    id: `PCK-${cleanId.toUpperCase()}-${index}`,
    staffId: `PCK-${cleanId.toUpperCase()}-${index}`,
    name: `${namePrefix} (${storeName} Desk ${index})`,
    username: `staff_${cleanId}_${index}`,
    email: `staff.${cleanId}.${index}@${domain}`,
    password: 'staff123',
    phone: store.contactNumber || '+92 300 0000000',
    tenantId,
    tenantName,
    storeId,
    branchId: storeId,
    branchName: storeName,
    status: 'Active',
    role: 'pickup_staff'
  };
};

export const ensureAllBranchesHavePickupStaff = (stores = [], existingStaff = []) => {
  const staffByBranch = new Map();
  (existingStaff || []).forEach((st) => {
    const bId = String(st.branchId || st.storeId || '').toLowerCase().trim();
    if (bId) {
      if (!staffByBranch.has(bId)) staffByBranch.set(bId, []);
      staffByBranch.get(bId).push(st);
    }
  });

  const completeList = [...(existingStaff || [])];
  const existingUsernames = new Set(completeList.map((s) => String(s.username || '').toLowerCase()));
  const existingIds = new Set(completeList.map((s) => String(s.id || s.staffId || '').toLowerCase()));

  (stores || []).forEach((store) => {
    const bId = String(store.branchId || store.storeId || store._id || store.id || '').toLowerCase().trim();
    if (!bId) return;
    const current = staffByBranch.get(bId) || [];
    // Ensure every branch has at least 2 dedicated staff members
    for (let i = current.length + 1; i <= 2; i++) {
      const newStaff = generateBranchPickupStaff(store, i);
      const uKey = String(newStaff.username).toLowerCase();
      const idKey = String(newStaff.id).toLowerCase();
      if (!existingUsernames.has(uKey) && !existingIds.has(idKey)) {
        completeList.push(newStaff);
        existingUsernames.add(uKey);
        existingIds.add(idKey);
      }
    }
  });

  return completeList;
};

// Initial Riders for each supermarket chain (Strictly scoped by store and branch)
export const INITIAL_RIDERS = [
  {
    id: 'RDR-ALI',
    riderId: 'RDR-ALI',
    name: 'Ali Khan',
    username: 'ali',
    phone: '03001122334',
    password: 'rider123',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    isGlobal: false,
    storeId: 'branch_af_fsd',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    region: 'D-Ground Commercial',
    zone: 'D-Ground Commercial (Faisalabad)',
    city: 'Faisalabad',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'LEK-2301',
    status: 'Active',
    coordinates: { lat: 31.4110, lng: 73.0980 },
    coverageRadiusKm: 25,
    rating: 5.0
  },
  {
    id: 'RDR-AHMAD',
    riderId: 'RDR-AHMAD',
    name: 'Ahmad Khan',
    username: 'ahmad',
    phone: '03206551696',
    password: 'rider123',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    isGlobal: false,
    storeId: 'branch_af_fsd',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    region: 'Peoples Colony',
    zone: 'Peoples Colony No. 1 (Faisalabad)',
    city: 'Faisalabad',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'FSD-4821',
    status: 'Active',
    coordinates: { lat: 31.4147, lng: 73.0872 },
    coverageRadiusKm: 25,
    rating: 5.0
  },
  {
    id: 'RDR-ALFATAH',
    riderId: 'RDR-ALFATAH',
    name: 'Al-Fatah Express Courier',
    username: 'alfatah_rider',
    phone: '03206551696',
    password: 'rider123',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    isGlobal: false,
    storeId: 'branch_af_fsd',
    branchId: 'branch_af_fsd',
    branchName: 'D-Ground Flagship Hub',
    region: 'Peoples Colony',
    zone: 'Peoples Colony (Faisalabad)',
    city: 'Faisalabad',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'FSD-7711',
    status: 'Active',
    coordinates: { lat: 31.4147, lng: 73.0872 },
    coverageRadiusKm: 25,
    rating: 5.0
  },
  {
    id: 'RDR-AF-CANAL',
    riderId: 'RDR-AF-CANAL',
    name: 'Tariq Mehmood',
    username: 'tariq_canal',
    phone: '03008541144',
    password: 'rider123',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    isGlobal: false,
    storeId: 'branch_af_canal',
    branchId: 'branch_af_canal',
    branchName: 'Canal Road Hub',
    region: 'East Canal Road',
    zone: 'East Canal Road (Faisalabad)',
    city: 'Faisalabad',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'FSD-3199',
    status: 'Active',
    coordinates: { lat: 31.4380, lng: 73.1290 },
    coverageRadiusKm: 25,
    rating: 5.0
  },
  {
    id: 'RDR-UNIMART',
    riderId: 'RDR-UNIMART',
    name: 'Usman Tariq',
    username: 'usman',
    phone: '03112233445',
    password: 'rider123',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart (Market Store)',
    isGlobal: false,
    storeId: 'branch_um_fsd',
    branchId: 'branch_um_fsd',
    branchName: 'Peoples Colony Dark Store',
    region: 'D-Ground / Peoples Colony',
    zone: 'D-Ground Commercial Hub (Faisalabad)',
    city: 'Faisalabad',
    vehicleType: '🏍️ Yamaha YBR',
    vehicleNumber: 'FSD-9921',
    status: 'Active',
    coordinates: { lat: 31.4015, lng: 73.0830 },
    coverageRadiusKm: 25,
    rating: 4.9
  },
  {
    id: 'RDR-HAMZA',
    riderId: 'RDR-HAMZA',
    name: 'Hamza',
    username: 'hamza',
    phone: '03001234567',
    password: 'rider123',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    isGlobal: false,
    storeId: 'branch_cv_fsd',
    branchId: 'branch_cv_fsd',
    branchName: 'Wholesale Express Hub',
    region: 'Jaranwala Road',
    zone: 'Jaranwala Road Wholesale Hub (Faisalabad)',
    city: 'Faisalabad',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'LEK-0000',
    status: 'Active',
    coordinates: { lat: 31.4360, lng: 73.1795 },
    coverageRadiusKm: 25,
    rating: 5.0
  },
  {
    id: 'RDR-CHASEVALUE',
    riderId: 'RDR-CHASEVALUE',
    name: 'Bilal Ahmed',
    username: 'bilal_cv',
    phone: '03223344556',
    password: 'rider123',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    isGlobal: false,
    storeId: 'branch_cv_fsd',
    branchId: 'branch_cv_fsd',
    branchName: 'Wholesale Express Hub',
    region: 'Jaranwala Road',
    zone: 'Jaranwala Road Wholesale Hub (Faisalabad)',
    city: 'Faisalabad',
    vehicleType: '🏍️ Honda CG 125',
    vehicleNumber: 'FSD-3382',
    status: 'Active',
    coordinates: { lat: 31.4360, lng: 73.1795 },
    coverageRadiusKm: 25,
    rating: 4.8
  },
  {
    id: 'RDR-CHASEUP',
    riderId: 'RDR-CHASEUP',
    name: 'Kamran Shah',
    username: 'kamran_cu',
    phone: '03334455667',
    password: 'rider123',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    isGlobal: false,
    storeId: 'branch_006',
    branchId: 'branch_006',
    branchName: 'Faisalabad Clock Tower Hub',
    region: 'Jhal Khanuana (Jhall)',
    zone: 'Jhal Khanuana Hub (Faisalabad)',
    city: 'Faisalabad',
    vehicleType: '🏍️ Suzuki GD 110',
    vehicleNumber: 'FSD-1194',
    status: 'Active',
    coordinates: { lat: 31.3965, lng: 73.0505 },
    coverageRadiusKm: 25,
    rating: 4.9
  },
  {
    id: 'RDR-CHASEUP-HASSAN',
    riderId: 'RDR-CHASEUP-HASSAN',
    name: 'hassan',
    username: 'hassan',
    phone: '032145236738',
    password: 'rider123',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    isGlobal: false,
    storeId: 'branch_006',
    branchId: 'branch_006',
    branchName: 'Faisalabad Clock Tower Hub',
    region: 'Clock Tower Commercial Region',
    zone: 'Faisalabad Clock Tower Hub',
    city: 'Faisalabad',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'FSD-5219',
    status: 'Active',
    coordinates: { lat: 31.4147, lng: 73.0872 },
    coverageRadiusKm: 25,
    rating: 5.0
  }
];
