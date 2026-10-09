// Super Grocery Multi-Company & Branch Architecture Data Registry
// Enforces the core hierarchy: User → Tenant → Branch → Data
//
//                    ┌───────────────────┐
//                    │    SUPER ADMIN    │
//                    └─────────┬─────────┘
//                              │
//                     ┌────────▼────────┐
//                     │    COMPANIES     │
//                     └────────┬────────┘
//                              │
//          ┌───────────────────┼───────────────────┐
//          │                   │                   │
//      Al-Fatah             Chase Up           CaseValue
//          │                   │                   │
//      ┌───┴───┐           ┌───┴───┐          ┌───┴───┐
//      │       │           │       │          │       │
//    Branch  Branch       Branch  Branch    Branch  Branch
//      │       │           │       │          │       │
//   Products Products   Products Products  Products Products
//      │       │           │       │          │       │
//   Inventory Inventory Inventory Inventory Inventory Inventory
//      │       │           │       │          │       │
//    Orders  Orders      Orders  Orders     Orders  Orders

// =========================================================================
// 1. COMPANIES (TENANTS)
// =========================================================================
export const COMPANIES = [
  {
    _id: 'company_001',
    id: 'company_001',
    tenantId: 'company_001',
    legacyId: 'tenant-alfatah',
    name: 'Al-Fatah',
    slug: 'al-fatah',
    logo: '🏬',
    banner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    tagline: "Pakistan's Premier Department Store & Hypermarket Since 1941",
    themeColor: '#991b1b',
    ownerName: 'Sheikh Tariq Al-Fatah',
    ownerEmail: 'admin@alfatah.pk'
  },
  {
    _id: 'company_002',
    id: 'company_002',
    tenantId: 'company_002',
    legacyId: 'tenant-chaseup',
    name: 'Chase Up',
    slug: 'chase-up',
    logo: '🏪',
    banner: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    tagline: 'One-Stop Family Shopping & Fresh Supermarket Chain',
    themeColor: '#6b21a8',
    ownerName: 'Muhammad Salman Chase',
    ownerEmail: 'admin@chaseup.pk'
  },
  {
    _id: 'company_003',
    id: 'company_003',
    tenantId: 'company_003',
    legacyId: 'tenant-chasevalue',
    name: 'CaseValue',
    displayName: 'Chase Value',
    slug: 'chase-value',
    logo: '🛒',
    banner: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    tagline: 'Maximum Wholesale Value & Direct Factory Groceries',
    themeColor: '#1e40af',
    ownerName: 'Farhan Chase',
    ownerEmail: 'admin@chasevalue.pk'
  },
  {
    _id: 'company_004',
    id: 'company_004',
    tenantId: 'company_004',
    legacyId: 'tenant-freshmart',
    name: 'Unimaart',
    displayName: 'Unimaart (Market Store)',
    slug: 'freshmart',
    logo: '🛒',
    banner: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    tagline: 'Fresh Food, Fair Prices, Fast Delivery',
    themeColor: '#0284c7',
    ownerName: 'Aimen Yasin',
    ownerEmail: 'support@unimaart.com'
  }
];

// =========================================================================
// 2. BRANCHES (Scoped per Company)
// =========================================================================
export const BRANCHES = [
  // --- Al-Fatah Branches (company_001) ---
  {
    _id: 'branch_001',
    id: 'branch_001',
    tenantId: 'company_001',
    name: 'DHA Lahore',
    city: 'Lahore',
    latitude: 31.4697,
    longitude: 74.4082,
    address: 'Sector Y, Phase 3, DHA Lahore',
    phone: '+92 42 35741122',
    status: 'active'
  },
  {
    _id: 'branch_002',
    id: 'branch_002',
    tenantId: 'company_001',
    name: 'Gulberg Mall',
    city: 'Lahore',
    latitude: 31.5204,
    longitude: 74.3587,
    address: 'Main Boulevard, Gulberg III, Lahore',
    phone: '+92 42 35752233',
    status: 'active'
  },
  {
    _id: 'branch_003',
    id: 'branch_003',
    tenantId: 'company_001',
    name: 'Centaurus Islamabad',
    city: 'Islamabad',
    latitude: 33.7077,
    longitude: 73.0501,
    address: 'F-8/4, Jinnah Avenue, Centaurus Mall, Islamabad',
    phone: '+92 51 2604455',
    status: 'active'
  },
  {
    _id: 'branch_af_fsd',
    id: 'branch_af_fsd',
    tenantId: 'company_001',
    name: 'D-Ground Flagship Hub',
    city: 'Faisalabad',
    latitude: 31.4147,
    longitude: 73.0872,
    address: 'D-Ground Commercial Center, Peoples Colony 1, Faisalabad',
    phone: '+92 41 8541122',
    status: 'active'
  },

  // --- Chase Up Branches (company_002) ---
  {
    _id: 'branch_004',
    id: 'branch_004',
    tenantId: 'company_002',
    name: 'Clifton Karachi',
    city: 'Karachi',
    latitude: 24.8138,
    longitude: 67.0299,
    address: 'Block 4, Marine Promenade, Clifton, Karachi',
    phone: '+92 21 35831122',
    status: 'active'
  },
  {
    _id: 'branch_005',
    id: 'branch_005',
    tenantId: 'company_002',
    name: 'Hassan Square',
    city: 'Karachi',
    latitude: 24.8967,
    longitude: 67.0735,
    address: 'University Road, Gulshan-e-Iqbal, Karachi',
    phone: '+92 21 34975566',
    status: 'active'
  },
  {
    _id: 'branch_006',
    id: 'branch_006',
    tenantId: 'company_002',
    name: 'Faisalabad Clock Tower Hub',
    city: 'Faisalabad',
    latitude: 31.4187,
    longitude: 73.0855,
    address: 'Kotwali Road, Katchery Bazar, Faisalabad',
    phone: '+92 41 2623344',
    status: 'active'
  },

  // --- CaseValue / Chase Value Branches (company_003) ---
  {
    _id: 'branch_007',
    id: 'branch_007',
    tenantId: 'company_003',
    name: 'Shaheed-e-Millat Karachi',
    city: 'Karachi',
    latitude: 24.8722,
    longitude: 67.0654,
    address: 'Main Shaheed-e-Millat Road, Karachi',
    phone: '+92 21 34327788',
    status: 'active'
  },
  {
    _id: 'branch_008',
    id: 'branch_008',
    tenantId: 'company_003',
    name: 'North Nazimabad',
    city: 'Karachi',
    latitude: 24.9333,
    longitude: 67.0333,
    address: 'Block H, Near Five Star Chowrangi, North Nazimabad, Karachi',
    phone: '+92 21 36648899',
    status: 'active'
  },
  {
    _id: 'branch_009',
    id: 'branch_009',
    tenantId: 'company_003',
    name: 'Multan Cantt',
    city: 'Multan',
    latitude: 30.1984,
    longitude: 71.4687,
    address: 'Mall Road, Cantt Commercial Area, Multan',
    phone: '+92 61 4512233',
    status: 'active'
  },
  {
    _id: 'branch_cv_fsd',
    id: 'branch_cv_fsd',
    tenantId: 'company_003',
    name: 'Wholesale Express Hub',
    city: 'Faisalabad',
    latitude: 31.4215,
    longitude: 73.0815,
    address: 'Jaranwala Road, Near Peoples Colony, Faisalabad',
    phone: '+92 41 8729900',
    status: 'active'
  },

  // --- Unimaart / Market Store Branches (company_004) ---
  {
    _id: 'branch_010',
    id: 'branch_010',
    tenantId: 'company_004',
    name: 'Gulberg SuperHub',
    city: 'Lahore',
    latitude: 31.5126,
    longitude: 74.3436,
    address: 'Zafar Ali Road, Gulberg V, Lahore',
    phone: '+9870-256-679',
    status: 'active'
  },
  {
    _id: 'branch_011',
    id: 'branch_011',
    tenantId: 'company_004',
    name: 'DHA Phase 6 Express',
    city: 'Lahore',
    latitude: 31.4722,
    longitude: 74.4444,
    address: 'Main Boulevard, Phase 6, DHA Lahore',
    phone: '+9870-256-680',
    status: 'active'
  },
  {
    _id: 'branch_012',
    id: 'branch_012',
    tenantId: 'company_004',
    name: 'Johar Town Dark Store',
    city: 'Lahore',
    latitude: 31.4697,
    longitude: 74.2728,
    address: 'G-1 Market, M.A. Johar Town, Lahore',
    phone: '+9870-256-681',
    status: 'active'
  },
  {
    _id: 'branch_um_fsd',
    id: 'branch_um_fsd',
    tenantId: 'company_004',
    name: 'Peoples Colony Dark Store',
    city: 'Faisalabad',
    latitude: 31.4125,
    longitude: 73.0915,
    address: 'D-Ground Commercial Center, Peoples Colony 1, Faisalabad',
    phone: '+9870-256-679',
    status: 'active'
  }
];

// =========================================================================
// 3. PRODUCTS (Scoped per Company)
// =========================================================================
export const PRODUCTS = [
  // --- Al-Fatah Products (company_001) ---
  {
    _id: 'product_001',
    id: 'product_001',
    tenantId: 'company_001',
    name: 'Nestle Milk 1L',
    categoryId: 'dairy',
    brand: 'Nestle MilkPak',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    description: 'Pure, rich homogenized full cream UHT milk for tea, coffee, and daily nutrition.'
  },
  {
    _id: 'product_002',
    id: 'product_002',
    tenantId: 'company_001',
    name: 'Guard Supreme Super Basmati Rice (5kg)',
    categoryId: 'pantry',
    brand: 'Guard Rice',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    description: 'Aged XXL grain aromatic royal super basmati rice.'
  },
  {
    _id: 'product_003',
    id: 'product_003',
    tenantId: 'company_001',
    name: 'Borges Extra Virgin Olive Oil (1 Litre Glass)',
    categoryId: 'oil-ghee',
    brand: 'Borges Spain',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    description: 'Cold-extracted 100% Spanish premium extra virgin olive oil.'
  },
  {
    _id: 'product_004',
    id: 'product_004',
    tenantId: 'company_001',
    name: 'Lindt Excellence 85% Cocoa Dark Chocolate (100g)',
    categoryId: 'snacks',
    brand: 'Lindt Switzerland',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
    description: 'Master Swiss chocolatier robust 85% cocoa dark chocolate bar.'
  },

  // --- Chase Up Products (company_002) ---
  {
    _id: 'product_005',
    id: 'product_005',
    tenantId: 'company_002',
    name: 'Tapal Danedar Black Tea Economy Pouch (900g)',
    categoryId: 'beverages',
    brand: 'Tapal Tea',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    description: 'Finest blend of Kenya and local garden tea leaves for Pakistani families.'
  },
  {
    _id: 'product_006',
    id: 'product_006',
    tenantId: 'company_002',
    name: 'Shan Special Biryani Masala Double Pack (50g x 2)',
    categoryId: 'pantry',
    brand: 'Shan Foods',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
    description: 'Authentic spiced aroma recipe mix for restaurant-style Karachi Biryani.'
  },
  {
    _id: 'product_007',
    id: 'product_007',
    tenantId: 'company_002',
    name: 'Mitchells Mango Jam Family Economy Tub (900g)',
    categoryId: 'breakfast',
    brand: "Mitchell's Pakistan",
    image: 'https://images.unsplash.com/photo-1589135233689-d56d70c436b7?auto=format&fit=crop&w=400&q=80',
    description: 'Sun-ripened Chaunsa mango pulp spread packed with vitamins.'
  },

  // --- CaseValue / Chase Value Products (company_003) ---
  {
    _id: 'product_008',
    id: 'product_008',
    tenantId: 'company_003',
    name: 'Sunridge Whole Wheat Chakki Atta (10kg Wholesale Sack)',
    categoryId: 'pantry',
    brand: 'Sunridge Wholesale',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    description: '100% whole grain stone-ground chakki atta with natural bran.'
  },
  {
    _id: 'product_009',
    id: 'product_009',
    tenantId: 'company_003',
    name: 'Dalda Fortified Banaspati Ghee (5 Litre Tin)',
    categoryId: 'oil-ghee',
    brand: 'Dalda Wholesale',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80',
    description: 'VTF trans-fat free traditional aromatic cooking ghee.'
  },
  {
    _id: 'product_010',
    id: 'product_010',
    tenantId: 'company_003',
    name: 'Surf Excel Quick Wash Detergent Powder (5kg Jumbo Sack)',
    categoryId: 'household',
    brand: 'Unilever Pakistan',
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80',
    description: 'Heavy stain removal laundry powder sack for wholesale buyers.'
  },

  // --- Unimaart / Market Store Products (company_004) ---
  {
    _id: 'product_011',
    id: 'product_011',
    tenantId: 'company_004',
    name: 'Fresh Farm Golden Desi Eggs (12 Pcs Box)',
    categoryId: 'dairy',
    brand: 'Unimaart Organics',
    image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=400&q=80',
    description: 'Golden-yolk farm eggs collected at dawn and packed in protective carton.'
  },
  {
    _id: 'product_012',
    id: 'product_012',
    tenantId: 'company_004',
    name: 'Valencia Cold-Pressed Orange Juice (500ml)',
    categoryId: 'beverages',
    brand: 'Unimaart Fresh',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
    description: 'Cold-pressed Sargodha Valencia oranges, zero artificial preservatives.'
  },
  {
    _id: 'product_013',
    id: 'product_013',
    tenantId: 'company_004',
    name: 'Farm Fresh Boneless Skinless Chicken (500g)',
    categoryId: 'meat',
    brand: 'Unimaart Halal Meats',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
    description: 'Tender vacuum-sealed halal fresh chicken breast cuts kept strictly under 3°C.'
  }
];

// =========================================================================
// 4. INVENTORY (Scoped per Company + Branch + Product)
// =========================================================================
export const INVENTORY = [
  // --- Al-Fatah DHA Lahore (branch_001) ---
  {
    tenantId: 'company_001',
    branchId: 'branch_001',
    productId: 'product_001',
    price: 350,
    stock: 120,
    minStock: 20,
    status: 'In Stock'
  },
  {
    tenantId: 'company_001',
    branchId: 'branch_001',
    productId: 'product_002',
    price: 2450,
    stock: 65,
    minStock: 15,
    status: 'In Stock'
  },
  {
    tenantId: 'company_001',
    branchId: 'branch_001',
    productId: 'product_003',
    price: 3850,
    stock: 40,
    minStock: 10,
    status: 'In Stock'
  },
  {
    tenantId: 'company_001',
    branchId: 'branch_001',
    productId: 'product_004',
    price: 890,
    stock: 80,
    minStock: 15,
    status: 'In Stock'
  },

  // --- Al-Fatah Gulberg Mall (branch_002) ---
  {
    tenantId: 'company_001',
    branchId: 'branch_002',
    productId: 'product_001',
    price: 350,
    stock: 85,
    minStock: 20,
    status: 'In Stock'
  },
  {
    tenantId: 'company_001',
    branchId: 'branch_002',
    productId: 'product_002',
    price: 2450,
    stock: 45,
    minStock: 15,
    status: 'In Stock'
  },

  // --- Chase Up Clifton Karachi (branch_004) ---
  {
    tenantId: 'company_002',
    branchId: 'branch_004',
    productId: 'product_005',
    price: 1420,
    stock: 180,
    minStock: 25,
    status: 'In Stock'
  },
  {
    tenantId: 'company_002',
    branchId: 'branch_004',
    productId: 'product_006',
    price: 280,
    stock: 240,
    minStock: 30,
    status: 'In Stock'
  },
  {
    tenantId: 'company_002',
    branchId: 'branch_004',
    productId: 'product_007',
    price: 495,
    stock: 90,
    minStock: 15,
    status: 'In Stock'
  },

  // --- CaseValue Shaheed-e-Millat Karachi (branch_007) ---
  {
    tenantId: 'company_003',
    branchId: 'branch_007',
    productId: 'product_008',
    price: 1380,
    stock: 350,
    minStock: 50,
    status: 'In Stock'
  },
  {
    tenantId: 'company_003',
    branchId: 'branch_007',
    productId: 'product_009',
    price: 2750,
    stock: 190,
    minStock: 30,
    status: 'In Stock'
  },
  {
    tenantId: 'company_003',
    branchId: 'branch_007',
    productId: 'product_010',
    price: 2650,
    stock: 220,
    minStock: 35,
    status: 'In Stock'
  },

  // --- Unimaart Gulberg SuperHub (branch_010) ---
  {
    tenantId: 'company_004',
    branchId: 'branch_010',
    productId: 'product_011',
    price: 420,
    stock: 160,
    minStock: 25,
    status: 'In Stock'
  },
  {
    tenantId: 'company_004',
    branchId: 'branch_010',
    productId: 'product_012',
    price: 350,
    stock: 95,
    minStock: 15,
    status: 'In Stock'
  },
  {
    tenantId: 'company_004',
    branchId: 'branch_010',
    productId: 'product_013',
    price: 590,
    stock: 110,
    minStock: 20,
    status: 'In Stock'
  }
];

// =========================================================================
// 5. ORDERS (Scoped per Company + Branch)
// =========================================================================
export const ORDERS = [
  // --- Al-Fatah DHA Lahore (branch_001) Orders ---
  {
    _id: 'order_001',
    orderId: 'ORD-AF-001',
    tenantId: 'company_001',
    branchId: 'branch_001',
    customerId: 'customer_123',
    customerName: 'Hafsa Farooq',
    customerPhone: '+92 300 1234567',
    items: [
      { productId: 'product_001', name: 'Nestle Milk 1L', price: 350, quantity: 4 }
    ],
    total: 1400,
    status: 'preparing',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'order_002',
    orderId: 'ORD-AF-002',
    tenantId: 'company_001',
    branchId: 'branch_001',
    customerId: 'customer_124',
    customerName: 'Bilal Chaudhry',
    customerPhone: '+92 321 9876543',
    items: [
      { productId: 'product_002', name: 'Guard Supreme Super Basmati Rice (5kg)', price: 2450, quantity: 1 },
      { productId: 'product_003', name: 'Borges Extra Virgin Olive Oil (1 Litre)', price: 3850, quantity: 1 }
    ],
    total: 6300,
    status: 'dispatched',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },

  // --- Chase Up Clifton Karachi (branch_004) Orders ---
  {
    _id: 'order_003',
    orderId: 'ORD-CU-001',
    tenantId: 'company_002',
    branchId: 'branch_004',
    customerId: 'customer_125',
    customerName: 'Zainab Merchant',
    customerPhone: '+92 333 4455667',
    items: [
      { productId: 'product_005', name: 'Tapal Danedar Black Tea (900g)', price: 1420, quantity: 2 },
      { productId: 'product_006', name: 'Shan Special Biryani Masala Double Pack', price: 280, quantity: 2 }
    ],
    total: 3400,
    status: 'preparing',
    createdAt: new Date().toISOString()
  },

  // --- CaseValue Shaheed-e-Millat (branch_007) Orders ---
  {
    _id: 'order_004',
    orderId: 'ORD-CV-001',
    tenantId: 'company_003',
    branchId: 'branch_007',
    customerId: 'customer_126',
    customerName: 'Tariq Wholesale Traders',
    customerPhone: '+92 345 8899001',
    items: [
      { productId: 'product_008', name: 'Sunridge Whole Wheat Chakki Atta (10kg)', price: 1380, quantity: 5 },
      { productId: 'product_009', name: 'Dalda Fortified Banaspati Ghee (5L)', price: 2750, quantity: 2 }
    ],
    total: 12400,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString()
  },

  // --- Unimaart Gulberg SuperHub (branch_010) Orders ---
  {
    _id: 'order_005',
    orderId: 'ORD-UM-001',
    tenantId: 'company_004',
    branchId: 'branch_010',
    customerId: 'customer_127',
    customerName: 'Aimen Yasin',
    customerPhone: '+9870-256-679',
    items: [
      { productId: 'product_011', name: 'Fresh Farm Golden Desi Eggs (12 Pcs Box)', price: 420, quantity: 2 },
      { productId: 'product_012', name: 'Valencia Cold-Pressed Orange Juice (500ml)', price: 350, quantity: 2 },
      { productId: 'product_013', name: 'Farm Fresh Boneless Skinless Chicken (500g)', price: 590, quantity: 1 }
    ],
    total: 2130,
    status: 'preparing',
    createdAt: new Date().toISOString()
  }
];

// =========================================================================
// 6. HELPER FUNCTIONS & STRICT ENFORCEMENT
// =========================================================================

// Resolve canonical tenantId from ID, slug, or legacy tenantId
export const resolveTenantId = (identifier) => {
  if (!identifier) return null;
  const clean = String(identifier).trim().toLowerCase();
  const found = COMPANIES.find(
    (c) =>
      c._id.toLowerCase() === clean ||
      c.id.toLowerCase() === clean ||
      c.tenantId.toLowerCase() === clean ||
      c.slug.toLowerCase() === clean ||
      (c.legacyId && c.legacyId.toLowerCase() === clean) ||
      c.name.toLowerCase() === clean
  );
  return found ? found.tenantId : identifier;
};

// Check if two tenant identifiers refer to the same supermarket company
export const isSameTenant = (t1, t2) => {
  if (!t1 || !t2) return false;
  if (t1 === t2) return true;
  const c1 = resolveTenantId(t1);
  const c2 = resolveTenantId(t2);
  if (c1 && c2 && c1 === c2) return true;
  const clean1 = String(t1).replace(/^tenant-/, '').toLowerCase();
  const clean2 = String(t2).replace(/^tenant-/, '').toLowerCase();
  return clean1 === clean2;
};

// Retrieve branches for a company
export const getBranchesByTenant = (tenantId) => {
  const canonical = resolveTenantId(tenantId);
  return BRANCHES.filter((b) => b.tenantId === canonical);
};

// Retrieve products for a company
export const getProductsByTenant = (tenantId) => {
  const canonical = resolveTenantId(tenantId);
  return PRODUCTS.filter((p) => p.tenantId === canonical);
};

// Retrieve inventory for a specific branch under a company
export const getInventoryByBranch = (tenantId, branchId) => {
  const canonical = resolveTenantId(tenantId);
  return INVENTORY.filter(
    (i) => i.tenantId === canonical && (!branchId || i.branchId === branchId)
  );
};

// Retrieve orders for a specific branch under a company
export const getOrdersByBranch = (tenantId, branchId) => {
  const canonical = resolveTenantId(tenantId);
  return ORDERS.filter(
    (o) => o.tenantId === canonical && (!branchId || o.branchId === branchId)
  );
};

// Update stock/price for a branch product
export const updateBranchInventory = (tenantId, branchId, productId, update = {}) => {
  const canonical = resolveTenantId(tenantId);
  const item = INVENTORY.find(
    (i) => i.tenantId === canonical && i.branchId === branchId && i.productId === productId
  );
  if (!item) return null;

  if (typeof update.stock === 'number') {
    item.stock = Math.max(0, update.stock);
    item.status = item.stock === 0 ? 'Out of Stock' : item.stock < (item.minStock || 15) ? 'Low Stock' : 'In Stock';
  }
  if (typeof update.price === 'number') {
    item.price = update.price;
  }
  return { ...item };
};

// Strict authorization enforcement: User → Tenant → Branch → Data
export const validateTenantBranchAccess = (user, targetTenantId, targetBranchId) => {
  if (!user) {
    return { allowed: false, statusCode: 401, error: 'Unauthorized: No user session found' };
  }

  // Super Admin has global oversight
  if (user.role === 'superadmin') {
    return { allowed: true };
  }

  // Store Admin / Tenant Admin: Locked to their specific company
  const userTenant = resolveTenantId(user.tenantId || user.companyId);
  const targetTenant = resolveTenantId(targetTenantId);

  if (!userTenant || userTenant !== targetTenant) {
    return {
      allowed: false,
      statusCode: 403,
      error: `Access denied: Cross-company access violation. You belong to [${userTenant || 'none'}] and cannot access [${targetTenant}].`
    };
  }

  // Branch Manager / Staff: Locked to their specific branch
  if (user.branchId && targetBranchId && user.branchId !== targetBranchId) {
    return {
      allowed: false,
      statusCode: 403,
      error: `Access denied: Cross-branch access violation. You belong to branch [${user.branchId}] and cannot access [${targetBranchId}].`
    };
  }

  return { allowed: true };
};
