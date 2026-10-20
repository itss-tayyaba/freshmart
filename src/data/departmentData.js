// Super Grocery Platform - Multi-Tenant Department Architecture Registry
// Enforces unique department IDs, tenant-scoped departmental metadata, and catalog mapping

import { resolveTenantId, isSameTenant } from './companyHierarchyData.js';

export const STORE_DEPARTMENTS = [
  // =========================================================================
  // 1. AL-FATAH DEPARTMENTS (company_001 / tenant-alfatah)
  // Premier Hypermarket & Department Store: Luxury imported, gourmet, international
  // =========================================================================
  {
    departmentId: 'dept-af-staples',
    id: 'alfatah-grocery-staples',
    slug: 'grocery-staples',
    departmentCode: 'DEPT-AF-01',
    tenantId: 'tenant-alfatah',
    companyId: 'company_001',
    tenantName: 'Al-Fatah Supermarket',
    name: 'Gourmet Staples & Royal Grains',
    shortName: 'Gourmet\nStaples',
    icon: '🌾',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    description: 'Aged XXL Royal Basmati grains, cold-pressed Spanish olive oils, organic Himalayan salts, and gourmet international condiments.',
    productCount: 42,
    discountBadge: 'Gourmet Selection',
    subcategories: ['Royal Basmati XXL Grain', 'Imported Extra Virgin Olive Oil', 'Organic Pink Himalayan Salt', 'Gourmet Pastas & Sauces', 'Artisanal Pulses'],
    featured: true
  },
  {
    departmentId: 'dept-af-dairy',
    id: 'alfatah-dairy-eggs',
    slug: 'dairy-eggs',
    departmentCode: 'DEPT-AF-02',
    tenantId: 'tenant-alfatah',
    companyId: 'company_001',
    tenantName: 'Al-Fatah Supermarket',
    name: 'Artisanal Dairy & Gourmet Cheese',
    shortName: 'Artisanal\nDairy',
    icon: '🧀',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    description: 'Authentic French Normandy salted butter, Swiss artisanal cheeses, organic free-range eggs, and farm-fresh whole creams.',
    productCount: 28,
    discountBadge: 'Imported Reserve',
    subcategories: ['French Normandy Churned Butter', 'Imported Swiss Gruyere & Gouda', 'Free-Range Organic Eggs', 'Heavy Whipping Creams', 'Greek Yogurts'],
    featured: true
  },
  {
    departmentId: 'dept-af-meat',
    id: 'alfatah-meat-poultry',
    slug: 'meat-poultry',
    departmentCode: 'DEPT-AF-03',
    tenantId: 'tenant-alfatah',
    companyId: 'company_001',
    tenantName: 'Al-Fatah Supermarket',
    name: 'Premium Halal Meats & Cold Cuts',
    shortName: 'Premium\nMeats',
    icon: '🥩',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
    description: 'Vacuum-sealed air-chilled halal poultry cuts, premium aged beef ribeye, fresh deep-sea prawns, and gourmet mutton chops.',
    productCount: 22,
    discountBadge: 'Prime Cut',
    subcategories: ['Air-Chilled Chicken Breasts', 'Prime Beef Ribeye & Mince', 'Fresh Gulf Jumbo Prawns', 'Baby Mutton Chops', 'Gourmet Deli Cuts'],
    featured: false
  },
  {
    departmentId: 'dept-af-snacks',
    id: 'alfatah-snacks',
    slug: 'snacks',
    departmentCode: 'DEPT-AF-04',
    tenantId: 'tenant-alfatah',
    companyId: 'company_001',
    tenantName: 'Al-Fatah Supermarket',
    name: 'Imported Confectionery & Luxury Chocolates',
    shortName: 'Luxury\nChocolates',
    icon: '🍫',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
    description: 'Swiss Lindt Excellence dark bars, Italian Ferrero Rocher collections, Belgian butter waffles, and California roasted nuts.',
    productCount: 38,
    discountBadge: 'Swiss Excellence',
    subcategories: ['Swiss Master Dark Chocolates', 'Ferrero Pralines & Truffles', 'Italian Loacker Wafers', 'Premium California Almonds', 'Belgian Biscuit Tins'],
    featured: true
  },
  {
    departmentId: 'dept-af-beverages',
    id: 'alfatah-beverages',
    slug: 'beverages',
    departmentCode: 'DEPT-AF-05',
    tenantId: 'tenant-alfatah',
    companyId: 'company_001',
    tenantName: 'Al-Fatah Supermarket',
    name: 'Artisan Coffee, Teas & Sparkling Drinks',
    shortName: 'Artisan\nDrinks',
    icon: '☕',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    description: 'Twinings British heritage teas, roasted Italian espresso beans, Italian San Pellegrino mineral water, and premium fruit juices.',
    productCount: 35,
    discountBadge: 'European Heritage',
    subcategories: ['Twinings London Earl Grey', 'Lavazza Italian Espresso Beans', 'San Pellegrino Sparkling Water', 'NFC Cold Pressed Fruit Juices'],
    featured: true
  },
  {
    departmentId: 'dept-af-personal',
    id: 'alfatah-personal-care',
    slug: 'personal-care',
    departmentCode: 'DEPT-AF-06',
    tenantId: 'tenant-alfatah',
    companyId: 'company_001',
    tenantName: 'Al-Fatah Supermarket',
    name: 'Luxury Skincare & Imported Personal Care',
    shortName: 'Luxury\nSkincare',
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    description: 'Imported French moisturizing body washes, British haircare treatments, luxury skincare creams, and Swiss oral hygiene.',
    productCount: 30,
    discountBadge: 'Dermatology Approved',
    subcategories: ['French Body Cleansers', 'Salon Protein Shampoos', 'European Anti-Aging Serums', 'Sensodyne Professional Oral Care'],
    featured: false
  },
  {
    departmentId: 'dept-af-produce',
    id: 'alfatah-fruits-veg',
    slug: 'fruits-veg',
    departmentCode: 'DEPT-AF-07',
    tenantId: 'tenant-alfatah',
    companyId: 'company_001',
    tenantName: 'Al-Fatah Supermarket',
    name: 'Hydroponic & Exotic Farm Produce',
    shortName: 'Hydroponic\nProduce',
    icon: '🥗',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
    description: 'Hydroponic romaine & iceberg greens, imported New Zealand kiwis, crisp Fuji apples, and organic seedless avocados.',
    productCount: 34,
    discountBadge: 'Pesticide Free',
    subcategories: ['Hydroponic Salad Greens', 'Imported Strawberries & Kiwis', 'Crisp Fuji Apples', 'Seedless Avocados', 'Exotic Herb Bunches'],
    featured: false
  },
  {
    departmentId: 'dept-af-bakery',
    id: 'alfatah-bakery',
    slug: 'bakery',
    departmentCode: 'DEPT-AF-08',
    tenantId: 'tenant-alfatah',
    companyId: 'company_001',
    tenantName: 'Al-Fatah Supermarket',
    name: 'Artisan European Bakery & Patisserie',
    shortName: 'Artisan\nBakery',
    icon: '🥐',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    description: 'Stone-baked sourdough loaves, authentic French butter croissants, artisan baguettes, and fine Belgian chocolate pastries.',
    productCount: 25,
    discountBadge: 'Baked Hourly',
    subcategories: ['Artisan Sourdough Boules', 'French Butter Croissants', 'Fresh Baguettes', 'Belgian Chocolate Tarts', 'Brioche Buns'],
    featured: false
  },

  // =========================================================================
  // 2. CHASE UP DEPARTMENTS (company_002 / tenant-chaseup)
  // Family Supermarket Chain: High-turnover FMCG, family economy packs, national brands
  // =========================================================================
  {
    departmentId: 'dept-cu-beverages',
    id: 'chaseup-beverages',
    slug: 'beverages',
    departmentCode: 'DEPT-CU-01',
    tenantId: 'tenant-chaseup',
    companyId: 'company_002',
    tenantName: 'Chase Up',
    name: 'Family Pack Beverages & National Teas',
    shortName: 'Family Pack\nBeverages',
    icon: '🧃',
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80',
    description: 'Tapal Danedar economy pouches, Olpers milk crates, national mango juices, and family cola party packs.',
    productCount: 45,
    discountBadge: 'Family Savings',
    subcategories: ['Tapal Danedar Economy Packs', 'Olpers Milk Crates', 'Fruit Juice Family Tubs', 'Soft Drinks Multi-Packs'],
    featured: true
  },
  {
    departmentId: 'dept-cu-pantry',
    id: 'chaseup-grocery-staples',
    slug: 'grocery-staples',
    departmentCode: 'DEPT-CU-02',
    tenantId: 'tenant-chaseup',
    companyId: 'company_002',
    tenantName: 'Chase Up',
    name: 'Essential Pantry, Spices & Recipe Mixes',
    shortName: 'Pantry &\nSpices',
    icon: '🧂',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
    description: 'Shan recipe masala twin-packs, National seasonings, Habib cooking oils, and everyday Pakistani lentils.',
    productCount: 52,
    discountBadge: 'Twin Pack Deal',
    subcategories: ['Shan Special Biryani Twin-Packs', 'National Spice Blends', 'Habib Cooking Oil Pouches', 'Daal Chana & Moong Cleaned'],
    featured: true
  },
  {
    departmentId: 'dept-cu-breakfast',
    id: 'chaseup-breakfast',
    slug: 'breakfast',
    departmentCode: 'DEPT-CU-03',
    tenantId: 'tenant-chaseup',
    companyId: 'company_002',
    tenantName: 'Chase Up',
    name: 'Family Breakfast, Jams & Cereals',
    shortName: 'Family\nBreakfast',
    icon: '🥞',
    image: 'https://images.unsplash.com/photo-1589135233689-d56d70c436b7?auto=format&fit=crop&w=400&q=80',
    description: 'Mitchells Mango Jam family 900g tubs, Fauji corn flakes jumbo boxes, Youngs mayonnaise jars, and Pakistani honey.',
    productCount: 30,
    discountBadge: 'Breakfast Value',
    subcategories: ['Mitchells 900g Jam Tubs', 'Fauji Jumbo Corn Flakes', 'Youngs Mayonnaise Economy Jars', 'Pure Sidr Honey Jars'],
    featured: true
  },
  {
    departmentId: 'dept-cu-dairy',
    id: 'chaseup-dairy-eggs',
    slug: 'dairy-eggs',
    departmentCode: 'DEPT-CU-04',
    tenantId: 'tenant-chaseup',
    companyId: 'company_002',
    tenantName: 'Chase Up',
    name: 'Daily Dairy, Farm Eggs & Fresh Yogurt',
    shortName: 'Daily Dairy\n& Eggs',
    icon: '🥛',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    description: 'Olpers UHT 1L milk cartons, Nestle everyday yogurt tubs, fresh 30-egg farm trays, and processed cheese singles.',
    productCount: 36,
    discountBadge: 'Fresh Daily',
    subcategories: ['Olpers 1L Full Cream Cartons', 'Nestle Everyday Yogurt 1kg', 'Farm Fresh Eggs 30-Egg Tray', 'Cheddar Cheese Singles'],
    featured: false
  },
  {
    departmentId: 'dept-cu-snacks',
    id: 'chaseup-snacks',
    slug: 'snacks',
    departmentCode: 'DEPT-CU-05',
    tenantId: 'tenant-chaseup',
    companyId: 'company_002',
    tenantName: 'Chase Up',
    name: 'Family Munchies, Biscuits & Snacks',
    shortName: 'Family\nSnacks',
    icon: '🍪',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    description: 'Peek Freans Sooper party boxes, Prince half-roll cartons, Lays masala packs, and local Pakistani nimko delights.',
    productCount: 48,
    discountBadge: 'Party Pack',
    subcategories: ['Peek Freans Sooper Half-Rolls', 'Prince Chocolate Biscuits', 'Lays Family Pack Crisps', 'Kurkure Spicy Munchies'],
    featured: false
  },
  {
    departmentId: 'dept-cu-personal',
    id: 'chaseup-personal-care',
    slug: 'personal-care',
    departmentCode: 'DEPT-CU-06',
    tenantId: 'tenant-chaseup',
    companyId: 'company_002',
    tenantName: 'Chase Up',
    name: 'Family Hygiene & Personal Care',
    shortName: 'Family\nHygiene',
    icon: '🧼',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    description: 'Dettol antiseptic 4-bar soap packs, Lifebuoy hygiene wash, Sunsilk family shampoos, and Colgate double tubes.',
    productCount: 40,
    discountBadge: 'Multi-Pack Value',
    subcategories: ['Dettol Antiseptic 4-in-1 Soap', 'Lifebuoy Family Handwash', 'Sunsilk 350ml Family Shampoos', 'Colgate Double Action Packs'],
    featured: false
  },
  {
    departmentId: 'dept-cu-produce',
    id: 'chaseup-fruits-veg',
    slug: 'fruits-veg',
    departmentCode: 'DEPT-CU-07',
    tenantId: 'tenant-chaseup',
    companyId: 'company_002',
    tenantName: 'Chase Up',
    name: 'Market Fresh Green Produce',
    shortName: 'Market Fresh\nGreens',
    icon: '🥬',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
    description: 'Sun-ripened red tomatoes, Punjab fresh potatoes & onions, juicy citrus oranges, and everyday fresh cilantro.',
    productCount: 32,
    discountBadge: 'Farm Direct',
    subcategories: ['Punjab Red Potatoes & Onions', 'Market Fresh Tomatoes', 'Kinnow Citrus Oranges', 'Green Farm Chillies & Garlic'],
    featured: false
  },
  {
    departmentId: 'dept-cu-meat',
    id: 'chaseup-meat-poultry',
    slug: 'meat-poultry',
    departmentCode: 'DEPT-CU-08',
    tenantId: 'tenant-chaseup',
    companyId: 'company_002',
    tenantName: 'Chase Up',
    name: 'Fresh Cut Halal Poultry & Cuts',
    shortName: 'Fresh Cut\nHalal Poultry',
    icon: '🍗',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
    description: 'Daily slaughtered tender halal chicken, hand-ground beef mince, bone-in stew cuts, and fresh seasonal river fish.',
    productCount: 26,
    discountBadge: '100% Halal Slaughter',
    subcategories: ['Fresh Cut Halal Broiler Chicken', 'Ground Beef Mince (Qeema)', 'Bone-in Mutton Curry Cuts', 'Cleaned River Fish'],
    featured: false
  },

  // =========================================================================
  // 3. CASEVALUE / CHASE VALUE DEPARTMENTS (company_003 / tenant-chasevalue)
  // Wholesale & Local Value Supermarket: Bulk sacks, volume tier discounts, wholesale edible oils
  // =========================================================================
  {
    departmentId: 'dept-cv-staples',
    id: 'chasevalue-grocery-staples',
    slug: 'grocery-staples',
    departmentCode: 'DEPT-CV-01',
    tenantId: 'tenant-chasevalue',
    companyId: 'company_003',
    tenantName: 'Chase Value',
    name: 'Wholesale Sacks (Atta, Rice & Pulses)',
    shortName: 'Wholesale\nSacks',
    icon: '📦',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    description: '10kg Chakki Atta sacks, 25kg Guard Basmati rice bags, 5kg bulk lentil sacks, and wholesale refined sugar bags.',
    productCount: 46,
    discountBadge: 'Wholesale Rate',
    subcategories: ['Sunridge Chakki Atta 10kg Sacks', 'Guard Super Basmati 10kg Bags', 'Wholesale Pulses 5kg Packs', 'Refined White Sugar 5kg Sacks'],
    featured: true
  },
  {
    departmentId: 'dept-cv-oil',
    id: 'chasevalue-oil-ghee',
    slug: 'oil-ghee',
    departmentCode: 'DEPT-CV-02',
    tenantId: 'tenant-chasevalue',
    companyId: 'company_003',
    tenantName: 'Chase Value',
    name: 'Wholesale Edible Oils & Banaspati Tins',
    shortName: 'Wholesale Oils\n& Ghee',
    icon: '🛢️',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80',
    description: 'Dalda Fortified Banaspati 5L and 16L tins, Meezan 5L cooking oil pouches, and commercial cooking fats.',
    productCount: 34,
    discountBadge: 'Factory Bulk Direct',
    subcategories: ['Dalda Banaspati 5L Tin', 'Meezan Cooking Oil 5L Pouch Box', 'Habib Canola 5L Tin', 'Commercial 16L Banaspati Drums'],
    featured: true
  },
  {
    departmentId: 'dept-cv-household',
    id: 'chasevalue-household',
    slug: 'household',
    departmentCode: 'DEPT-CV-03',
    tenantId: 'tenant-chasevalue',
    companyId: 'company_003',
    tenantName: 'Chase Value',
    name: 'Bulk Cleaners, Jumbo Detergents & Home',
    shortName: 'Bulk Detergents\n& Cleaners',
    icon: '🧹',
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80',
    description: 'Surf Excel 5kg sacks, Ariel jumbo detergent boxes, Finis phenyl 5-litre cans, and wholesale dishwash bars.',
    productCount: 38,
    discountBadge: 'Bulk Saver',
    subcategories: ['Surf Excel 5kg Jumbo Sack', 'Ariel Complete 6kg Box', 'Phenyl & Surface Cleaners 5L Gallons', 'Dishwashing Bar Full Cartons'],
    featured: true
  },
  {
    departmentId: 'dept-cv-dairy',
    id: 'chasevalue-dairy-eggs',
    slug: 'dairy-eggs',
    departmentCode: 'DEPT-CV-04',
    tenantId: 'tenant-chasevalue',
    companyId: 'company_003',
    tenantName: 'Chase Value',
    name: 'Commercial Dairy & Crate Eggs',
    shortName: 'Commercial\nDairy',
    icon: '🥚',
    image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=400&q=80',
    description: 'Tarang tea whitener cartons (24-packs), commercial whole milk crates, and farm eggs 60-piece wholesale crates.',
    productCount: 28,
    discountBadge: 'Crate Discount',
    subcategories: ['Tarang Tea Whitener Carton (24x)', 'Commercial UHT Milk Crates (12x1L)', 'Farm Eggs 60-Piece Heavy Crate', 'Wholesale Unsalted Butter 5kg'],
    featured: false
  },
  {
    departmentId: 'dept-cv-beverages',
    id: 'chasevalue-beverages',
    slug: 'beverages',
    departmentCode: 'DEPT-CV-05',
    tenantId: 'tenant-chasevalue',
    companyId: 'company_003',
    tenantName: 'Chase Value',
    name: 'Wholesale Tea Cartons & Beverages',
    shortName: 'Wholesale\nTeas & Drinks',
    icon: '🍵',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    description: 'Tapal Danedar 1kg wholesale pouches, Lipton 200 tea-bag cartons, and 24-can soda wholesale trays.',
    productCount: 32,
    discountBadge: 'Carton Deal',
    subcategories: ['Tapal Danedar 1kg Wholesale Pouch', 'Lipton Yellow Label 200s Carton', 'Soda Cans 24-Pack Wholesale Trays', 'Mineral Water 12-Bottle Crates'],
    featured: false
  },
  {
    departmentId: 'dept-cv-snacks',
    id: 'chasevalue-snacks',
    slug: 'snacks',
    departmentCode: 'DEPT-CV-06',
    tenantId: 'tenant-chasevalue',
    companyId: 'company_003',
    tenantName: 'Chase Value',
    name: 'Bulk Confectionery & Wholesale Biscuits',
    shortName: 'Bulk Biscuits\n& Confectionery',
    icon: '🥨',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
    description: 'Sooper biscuit full cartons (36-rolls), toffee candy 50-piece boxes, and wholesale 2kg spiced nimko packs.',
    productCount: 35,
    discountBadge: 'Carton Rate',
    subcategories: ['Sooper Biscuits Full Master Carton (36x)', 'Toffee & Candy 50-Pcs Counter Boxes', 'Wholesale Nimko 2kg Heavy Sacks', 'Potato Chips Wholesale Trays'],
    featured: false
  },
  {
    departmentId: 'dept-cv-personal',
    id: 'chasevalue-personal-care',
    slug: 'personal-care',
    departmentCode: 'DEPT-CV-07',
    tenantId: 'tenant-chasevalue',
    companyId: 'company_003',
    tenantName: 'Chase Value',
    name: 'Economy Bundles & Personal Care',
    shortName: 'Economy Bundles\nPersonal Care',
    icon: '🧴',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    description: 'Lifebuoy 12-bar master soap cartons, Sunsilk 650ml pump family bottles, and toothpaste wholesale twin bundles.',
    productCount: 30,
    discountBadge: 'Master Carton Savings',
    subcategories: ['Lifebuoy 12-Bar Master Soap Carton', 'Sunsilk 650ml Mega Pump Bottles', 'Colgate 150g Twin Value Bundles', 'Antiseptic Liquid 1 Litre Packs'],
    featured: false
  },

  // =========================================================================
  // 4. UNIMAART / FRESHMART DEPARTMENTS (company_004 / tenant-freshmart)
  // Direct Farm Fresh & Rapid Grocery: Farm-to-door, 15-min delivery, cold chain
  // =========================================================================
  {
    departmentId: 'dept-um-produce',
    id: 'unimaart-fruits-veg',
    slug: 'fruits-veg',
    departmentCode: 'DEPT-UM-01',
    tenantId: 'tenant-freshmart',
    companyId: 'company_004',
    tenantName: 'Unimaart',
    name: 'Fresh Farm Fruits & Organic Vegetables',
    shortName: 'Fresh Produce\n& Greens',
    icon: '🥦',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
    description: 'Dawn-harvested Golden apples, ripe Cavendish bananas, crunchy broccoli, hydroponic coriander, and seasonal greens.',
    productCount: 48,
    discountBadge: 'Farm Fresh Dawn Harvest',
    subcategories: ['Organic Golden Apples', 'Ripe Cavendish Bananas', 'Fresh Green Broccoli', 'Hydroponic Herbs & Mint', 'Seasonal Crisp Greens'],
    featured: true
  },
  {
    departmentId: 'dept-um-dairy',
    id: 'unimaart-dairy-eggs',
    slug: 'dairy-eggs',
    departmentCode: 'DEPT-UM-02',
    tenantId: 'tenant-freshmart',
    companyId: 'company_004',
    tenantName: 'Unimaart',
    name: 'Fresh Dairy, Pasture Eggs & Farm Milk',
    shortName: 'Farm Dairy\n& Desi Eggs',
    icon: '🍳',
    image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=400&q=80',
    description: 'Golden-yolk Desi farm eggs (12-box), cold-chain pasteurized milk, cultured curd, and grass-fed butter.',
    productCount: 32,
    discountBadge: 'Cold Chain Guaranteed',
    subcategories: ['Golden Desi Eggs 12-Box', 'Farm Fresh Pasteurized Milk', 'Cultured Greek Yogurt', 'Grass-Fed Table Butter'],
    featured: true
  },
  {
    departmentId: 'dept-um-meat',
    id: 'unimaart-meat-poultry',
    slug: 'meat-poultry',
    departmentCode: 'DEPT-UM-03',
    tenantId: 'tenant-freshmart',
    companyId: 'company_004',
    tenantName: 'Unimaart',
    name: 'Hygienic Halal Chicken & Mutton Cuts',
    shortName: 'Hygienic Halal\nFresh Meats',
    icon: '🥩',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
    description: 'Vacuum-sealed tender boneless chicken breasts (500g), fresh mutton cuts, and deveined prawns kept strictly under 3°C.',
    productCount: 24,
    discountBadge: 'Chilled <3°C',
    subcategories: ['Boneless Chicken Breast (500g)', 'Halal Mutton Stew Cuts', 'Fresh Deveined Prawns', 'Marinated Chicken Tikka Cuts'],
    featured: true
  },
  {
    departmentId: 'dept-um-bakery',
    id: 'unimaart-bakery',
    slug: 'bakery',
    departmentCode: 'DEPT-UM-04',
    tenantId: 'tenant-freshmart',
    companyId: 'company_004',
    tenantName: 'Unimaart',
    name: 'Oven Fresh Breads & Daily Bakes',
    shortName: 'Oven Fresh\nBakery',
    icon: '🍞',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    description: 'Dawn fresh milky bread large, stone-ground whole wheat loaves, freshly baked burger buns, and butter rusks.',
    productCount: 29,
    discountBadge: 'Baked Today',
    subcategories: ['Dawn Milky Bread Large', 'Whole Wheat Bran Loaf', 'Soft Burger Buns 4-Pack', 'Fresh Bakery Butter Rusks'],
    featured: false
  },
  {
    departmentId: 'dept-um-beverages',
    id: 'unimaart-beverages',
    slug: 'beverages',
    departmentCode: 'DEPT-UM-05',
    tenantId: 'tenant-freshmart',
    companyId: 'company_004',
    tenantName: 'Unimaart',
    name: 'Cold Pressed Juices & Daily Drinks',
    shortName: 'Cold Pressed\nJuices & Drinks',
    icon: '🧃',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
    description: 'Valencia cold-pressed orange juice (500ml), chilled Coca-Cola 1.5L bottles, Nestle Pure Life, and green tea blends.',
    productCount: 45,
    discountBadge: 'Zero Preservatives',
    subcategories: ['Valencia Orange Juice (500ml)', 'Coca-Cola 1.5L Chilled Bottle', 'Nestle Pure Life 1.5L Water', 'Natural Green Tea Leaves'],
    featured: true
  },
  {
    departmentId: 'dept-um-snacks',
    id: 'unimaart-snacks',
    slug: 'snacks',
    departmentCode: 'DEPT-UM-06',
    tenantId: 'tenant-freshmart',
    companyId: 'company_004',
    tenantName: 'Unimaart',
    name: 'Healthy Munchies & Snack Treats',
    shortName: 'Snacks &\nMunchies',
    icon: '🍿',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    description: 'Lays Wavy Masala crisps, Oreo cookies, California roasted almonds, and healthy dried berry snack mixes.',
    productCount: 56,
    discountBadge: 'Express Munchies',
    subcategories: ['Lays Wavy Masala Crisps', 'Oreo Chocolate Sandwich Cookies', 'California Roasted Salted Almonds', 'Dry Fruit Mix Pouches'],
    featured: false
  },
  {
    departmentId: 'dept-um-staples',
    id: 'unimaart-grocery-staples',
    slug: 'grocery-staples',
    departmentCode: 'DEPT-UM-07',
    tenantId: 'tenant-freshmart',
    companyId: 'company_004',
    tenantName: 'Unimaart',
    name: 'Everyday Cooking Essentials & Spices',
    shortName: 'Everyday\nEssentials',
    icon: '🧂',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    description: 'Super Basmati rice 1kg, Meezan canola oil 1L pouch, washed Daal Masoor, and pure grounded spices.',
    productCount: 65,
    discountBadge: 'Kitchen Daily',
    subcategories: ['Super Basmati Rice 1kg Pack', 'Meezan Canola Oil 1L Pouch', 'Daal Masoor Cleaned 500g', 'Ground Red Chilli & Turmeric'],
    featured: false
  },
  {
    departmentId: 'dept-um-personal',
    id: 'unimaart-personal-care',
    slug: 'personal-care',
    departmentCode: 'DEPT-UM-08',
    tenantId: 'tenant-freshmart',
    companyId: 'company_004',
    tenantName: 'Unimaart',
    name: 'Personal Care, Soaps & Hair Care',
    shortName: 'Personal Care\n& Hygiene',
    icon: '🧼',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    description: 'Dove Deep Moisture bars, Head & Shoulders shampoo 200ml, Sensodyne herbal toothpaste, and Nivea soft cream.',
    productCount: 38,
    discountBadge: 'Daily Freshness',
    subcategories: ['Dove Deep Moisture Beauty Bar', 'Head & Shoulders Smooth 200ml', 'Sensodyne Herbal Multi-Care', 'Nivea Soft Moisturizing Cream'],
    featured: false
  }
];

/**
 * Get all departments filtered by supermarket tenant
 * @param {string} tenantId 
 * @returns {Array} Array of department objects
 */
export const getDepartmentsByTenant = (tenantId) => {
  if (!tenantId || tenantId === 'all') return STORE_DEPARTMENTS;
  const canonical = resolveTenantId(tenantId);
  return STORE_DEPARTMENTS.filter(
    (dept) => isSameTenant(dept.tenantId, tenantId) || isSameTenant(dept.companyId, canonical)
  );
};

/**
 * Get a specific department by its unique departmentId or store slug
 * @param {string} deptId 
 * @param {string} tenantId (optional)
 * @returns {Object|null}
 */
export const getDepartmentById = (deptId, tenantId = null) => {
  if (!deptId) return null;
  const cleanId = String(deptId).trim().toLowerCase();

  return (
    STORE_DEPARTMENTS.find((d) => {
      const matchesId =
        d.departmentId.toLowerCase() === cleanId ||
        d.id.toLowerCase() === cleanId ||
        d.departmentCode.toLowerCase() === cleanId ||
        d.slug.toLowerCase() === cleanId;
      if (!matchesId) return false;
      if (tenantId) {
        return isSameTenant(d.tenantId, tenantId) || isSameTenant(d.companyId, tenantId);
      }
      return true;
    }) || null
  );
};

/**
 * Get all registered store departments across platform
 * @returns {Array}
 */
export const getAllDepartments = () => STORE_DEPARTMENTS;
