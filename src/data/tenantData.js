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
    hubs: ['Gulberg Mall Hub', 'DHA Phase 5', 'Mall of Lahore', 'Centaurus Islamabad'],
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
    slug: 'chase-value',
    tagline: 'Maximum Wholesale Value & Direct Factory Groceries',
    description: 'Pioneering wholesale pricing model on everyday household staples, bulk rice, cooking oils, snacks, beverages, and personal care items.',
    logo: '🛒',
    banner: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    badge: 'Wholesale & Department',
    ownerName: 'Farhan Chase',
    ownerEmail: 'admin@chasevalue.pk',
    ownerPhone: '+92 321 9876543',
    status: 'Active',
    color: '#1e40af',
    theme: {
      primaryColor: '#1e40af', // Royal Blue
      accentColor: '#eab308',
      bgGradient: 'from-blue-900 via-indigo-950 to-slate-950'
    },
    hubs: ['Shaheed-e-Millat Karachi', 'North Nazimabad', 'Gulshan-e-Iqbal', 'Multan Cantt'],
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
    hubs: ['Clifton Karachi Hub', 'Hassan Square', 'Faisalabad Clock Tower', 'Gujranwala City'],
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
    slug: 'freshmart',
    tagline: '10-15 Min Express Dark Store & Farm-Fresh Produce',
    description: 'Direct-from-farm daily organic harvests, temperature-controlled chilled fleet, and rapid 10-minute micro-fulfillment hubs across urban clusters.',
    logo: '🥦',
    banner: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
    badge: 'Express 10-Min Delivery',
    ownerName: 'Aimen Yasin',
    ownerEmail: 'aimen@freshmart.pk',
    ownerPhone: '+92 320 6551699',
    status: 'Active',
    color: '#047857',
    theme: {
      primaryColor: '#047857', // Forest Emerald
      accentColor: '#10b981',
      bgGradient: 'from-[#07382c] via-[#0b4d3c] to-[#0f6853]'
    },
    hubs: ['Gulberg SuperHub', 'DHA Phase 6', 'Johar Town Hub', 'Bahria Town Hub'],
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
