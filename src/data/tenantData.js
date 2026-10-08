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
    status: 'Active',
    color: '#991b1b',
    theme: {
      primaryColor: '#991b1b', // Ruby Crimson
      accentColor: '#f59e0b',
      bgGradient: 'from-rose-900 via-red-950 to-slate-950'
    },
    hubs: ['Gulberg Main Branch (Lahore)'],
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
    status: 'Active',
    color: '#78350f',
    theme: {
      primaryColor: '#78350f', // Warm Rustic Amber Mocha
      accentColor: '#d97706',
      bgGradient: 'from-[#451a03] via-[#78350f] to-[#b45309]'
    },
    hubs: ['Shaheed-e-Millat Main Branch (Karachi)'],
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
    hubs: ['Clifton Main Branch (Karachi)'],
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
    hubs: ['Main Hub (Lahore)'],
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

// Initial Mart Admins (Store Admins) for each supermarket chain
export const INITIAL_STORE_ADMINS = [
  {
    id: 'sa-alfatah',
    name: 'Al-Fatah Admin',
    username: 'alfatah_admin',
    email: 'admin@alfatah.pk',
    password: 'admin123',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    role: 'admin',
    status: 'Active',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sa-chasevalue',
    name: 'Chase Value Admin',
    username: 'chasevalue_admin',
    email: 'admin@chasevalue.pk',
    password: 'admin123',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    role: 'admin',
    status: 'Active',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sa-chaseup',
    name: 'Chase Up Admin',
    username: 'chaseup_admin',
    email: 'admin@chaseup.pk',
    password: 'admin123',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    role: 'admin',
    status: 'Active',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sa-freshmart',
    name: 'Unimaart Admin',
    username: 'unimaart_admin',
    email: 'admin@unimart.pk',
    password: 'admin123',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart',
    role: 'admin',
    status: 'Active',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

// Initial Pickup Staff for each supermarket chain
export const INITIAL_PICKUP_STAFF = [
  {
    id: 'PCK-ALFATAH',
    name: 'Al-Fatah Packing Desk',
    username: 'alfatah_staff',
    email: 'staff@alfatah.pk',
    password: 'staff123',
    phone: '+92 300 1112233',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    status: 'Active'
  },
  {
    id: 'PCK-CHASEVALUE',
    name: 'Chase Value Packing Desk',
    username: 'chasevalue_staff',
    email: 'staff@chasevalue.pk',
    password: 'staff123',
    phone: '+92 321 2223344',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    status: 'Active'
  },
  {
    id: 'PCK-CHASEUP',
    name: 'Chase Up Packing Desk',
    username: 'chaseup_staff',
    email: 'staff@chaseup.pk',
    password: 'staff123',
    phone: '+92 333 3334455',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    status: 'Active'
  },
  {
    id: 'PCK-UNIMAART',
    name: 'Unimaart Packing Desk',
    username: 'unimart_staff',
    email: 'staff@unimart.pk',
    password: 'staff123',
    phone: '+92 345 4445566',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart',
    status: 'Active'
  }
];

// Initial Riders for each supermarket chain
export const INITIAL_RIDERS = [
  {
    id: 'RDR-ALFATAH',
    name: 'Ahmad Khan (Al-Fatah)',
    username: 'alfatah_rider',
    phone: '03001234567',
    password: 'rider123',
    tenantId: 'tenant-alfatah',
    tenantName: 'Al-Fatah Supermarket',
    vehicleType: '🏍️ Honda 125',
    vehicleNumber: 'LEK-4821',
    zone: 'Gulberg Main Hub (Lahore)',
    branchName: 'Gulberg Main Branch (Lahore)',
    status: 'On-Duty',
    coordinates: { lat: 31.5204, lng: 74.3587 },
    coverageRadiusKm: 15,
    rating: 4.9
  },
  {
    id: 'RDR-CHASEVALUE',
    name: 'Bilal Ahmed (Chase Value)',
    username: 'chasevalue_rider',
    phone: '03219876543',
    password: 'rider123',
    tenantId: 'tenant-chasevalue',
    tenantName: 'Chase Value',
    vehicleType: '🏍️ Super Power 70',
    vehicleNumber: 'KHI-9921',
    zone: 'Shaheed-e-Millat (Karachi)',
    branchName: 'Shaheed-e-Millat Main Branch (Karachi)',
    status: 'On-Duty',
    coordinates: { lat: 24.8716, lng: 67.0694 },
    coverageRadiusKm: 15,
    rating: 4.9
  },
  {
    id: 'RDR-CHASEUP',
    name: 'Usman Tariq (Chase Up)',
    username: 'chaseup_rider',
    phone: '03335556677',
    password: 'rider123',
    tenantId: 'tenant-chaseup',
    tenantName: 'Chase Up',
    vehicleType: '🏍️ Yamaha YBR 125',
    vehicleNumber: 'KHI-4102',
    zone: 'North Nazimabad (Karachi)',
    branchName: 'North Nazimabad Branch (Karachi)',
    status: 'On-Duty',
    coordinates: { lat: 24.9333, lng: 67.0333 },
    coverageRadiusKm: 15,
    rating: 4.8
  },
  {
    id: 'RDR-UNIMAART',
    name: 'Hamza Farooq (Unimaart)',
    username: 'unimart_rider',
    phone: '03451122334',
    password: 'rider123',
    tenantId: 'tenant-freshmart',
    tenantName: 'Unimaart',
    vehicleType: '🏍️ Honda CD 70',
    vehicleNumber: 'FSD-7712',
    zone: 'Peoples Colony (Faisalabad)',
    branchName: 'D-Ground Main Branch (Faisalabad)',
    status: 'On-Duty',
    coordinates: { lat: 31.4125, lng: 73.0995 },
    coverageRadiusKm: 15,
    rating: 5.0
  }
];
