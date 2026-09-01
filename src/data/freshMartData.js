// FreshMart - Complete Multi-View Data Store & Product Catalog

export const FRESHMART_CATEGORIES = [
  {
    id: 'fruits-veg',
    name: 'Fruits & Vegetables',
    shortName: 'Fruits &\nVegetables',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80',
    itemCount: 48,
    subcategories: ['Fresh Fruits', 'Fresh Vegetables', 'Organic Herbs', 'Exotic Greens', 'Seasonal Packs']
  },
  {
    id: 'dairy-eggs',
    name: 'Dairy & Eggs',
    shortName: 'Dairy &\nEggs',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80',
    itemCount: 32,
    subcategories: ['Milk & Cream', 'Farm Eggs', 'Yogurt & Curd', 'Butter & Cheese', 'Paneer & Tofu']
  },
  {
    id: 'meat-poultry',
    name: 'Meat & Poultry',
    shortName: 'Meat &\nPoultry',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=300&q=80',
    itemCount: 24,
    subcategories: ['Boneless Chicken', 'Beef & Mutton', 'Fresh Seafood', 'Frozen Cuts', 'Marinated Meats']
  },
  {
    id: 'bakery',
    name: 'Bakery',
    shortName: 'Bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
    itemCount: 29,
    subcategories: ['Fresh Bread & Buns', 'Cakes & Pastries', 'Cookies & Rusks', 'Pitas & Wraps']
  },
  {
    id: 'beverages',
    name: 'Beverages',
    shortName: 'Beverages',
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=300&q=80',
    itemCount: 45,
    subcategories: ['Cold Juices', 'Tea & Coffee', 'Carbonated Drinks', 'Energy Drinks', 'Mineral Water']
  },
  {
    id: 'snacks',
    name: 'Snacks & Munchies',
    shortName: 'Snacks &\nMunchies',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80',
    itemCount: 56,
    subcategories: ['Potato Chips & Crisps', 'Chocolates & Candies', 'Dry Fruits & Nuts', 'Biscuits & Wafers']
  },
  {
    id: 'grocery-staples',
    name: 'Grocery Staples',
    shortName: 'Grocery\nStaples',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80',
    itemCount: 65,
    subcategories: ['Cooking Oils & Ghee', 'Rice & Flour (Atta)', 'Pulses & Lentils (Daal)', 'Spices & Salts', 'Sugar & Honey']
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    shortName: 'Personal\nCare',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80',
    itemCount: 38,
    subcategories: ['Soaps & Body Wash', 'Shampoos & Conditioners', 'Oral Care', 'Skin Care Creams']
  },
  {
    id: 'baby-care',
    name: 'Baby Care',
    shortName: 'Baby\nCare',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=300&q=80',
    itemCount: 22,
    subcategories: ['Baby Food & Formula', 'Diapers & Wipes', 'Baby Bath & Hygiene']
  },
  {
    id: 'home-kitchen',
    name: 'Home & Kitchen',
    shortName: 'Home &\nKitchen',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=300&q=80',
    itemCount: 35,
    subcategories: ['Detergents & Powders', 'Dishwashing Gels', 'Surface Cleaners', 'Kitchen Paper & Foils']
  }
];

export const FRESHMART_BRANDS = [
  "Olper's",
  'Nestle',
  'Dalda',
  'Surf Excel',
  'Lays',
  'National Foods',
  'K&Ns',
  'Shan Foods'
];

export const FRESHMART_PRODUCTS = [
  // 1. Olper's Milk 1L (Featured in screenshot top right & details)
  {
    id: 'olpers-milk-1l',
    name: "Olper's Milk 1L",
    brand: "Olper's",
    category: 'dairy-eggs',
    categoryLabel: 'Dairy & Eggs',
    price: 210,
    originalPrice: 250,
    discountPercent: 16,
    unit: '1 Pack (1 Litre)',
    rating: 4.8,
    reviewsCount: 330,
    inStock: true,
    stockCount: 85,
    isFlashDeal: true,
    flashEnds: '02:45:18',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80'
    ],
    description: "Olper's Full Cream Milk is a rich source of protein, calcium, and essential vitamins. Sourced from high quality dairy farms, it helps in strong bones and healthy teeth for the whole family.",
    nutrition: {
      'Energy / Calories': '65 kcal per 100ml',
      'Calcium': '120 mg (15% DV)',
      'Protein': '3.2 g',
      'Fat': '3.5 g',
      'Vitamin A & D3': 'Fortified'
    }
  },

  // 2. Bananas 1 Kg
  {
    id: 'bananas-1kg',
    name: 'Fresh Bananas 1 Kg',
    brand: 'Farm Fresh',
    category: 'fruits-veg',
    categoryLabel: 'Fruits & Vegetables',
    price: 180,
    originalPrice: 220,
    discountPercent: 18,
    unit: '1 Kg (6-8 pcs)',
    rating: 4.7,
    reviewsCount: 195,
    inStock: true,
    stockCount: 120,
    isFlashDeal: false,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Sweet, natural energy-packed bananas ripened naturally without chemicals. High in potassium and dietary fiber.',
    nutrition: { 'Calories': '89 kcal', 'Potassium': '358 mg', 'Carbs': '23 g', 'Vitamin B6': '20% DV' }
  },

  // 3. Apples Royal Gala 1Kg
  {
    id: 'apples-royal-gala-1kg',
    name: 'Apples Royal Gala 1Kg',
    brand: 'Farm Fresh',
    category: 'fruits-veg',
    categoryLabel: 'Fruits & Vegetables',
    price: 320,
    originalPrice: 380,
    discountPercent: 15,
    unit: '1 Kg (4-5 apples)',
    rating: 4.9,
    reviewsCount: 140,
    inStock: true,
    stockCount: 60,
    isFlashDeal: false,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Crisp, sweet and fragrant Royal Gala apples imported fresh. Great for snacking, lunchboxes, or fresh apple pies.',
    nutrition: { 'Calories': '52 kcal', 'Fiber': '2.4 g', 'Vitamin C': '14% DV' }
  },

  // 4. Potatoes 1Kg
  {
    id: 'potatoes-1kg',
    name: 'Fresh Farm Potatoes 1Kg',
    brand: 'Farm Fresh',
    category: 'fruits-veg',
    categoryLabel: 'Fruits & Vegetables',
    price: 60,
    originalPrice: 80,
    discountPercent: 25,
    unit: '1 Kg',
    rating: 4.6,
    reviewsCount: 220,
    inStock: true,
    stockCount: 250,
    isFlashDeal: false,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Freshly dug earthy potatoes, firm and smooth-skinned. Perfect for curries, fries, mashing, or roasting.',
    nutrition: { 'Calories': '77 kcal', 'Carbohydrates': '17 g', 'Potassium': '421 mg' }
  },

  // 5. Nestle Yogurt 1 Cup
  {
    id: 'nestle-yogurt-cup',
    name: 'Nestle Sweet & Plain Yogurt 1 Cup',
    brand: 'Nestle',
    category: 'dairy-eggs',
    categoryLabel: 'Dairy & Eggs',
    price: 60,
    originalPrice: 75,
    discountPercent: 20,
    unit: '400g Cup',
    rating: 4.8,
    reviewsCount: 160,
    inStock: true,
    stockCount: 90,
    isFlashDeal: false,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Smooth, creamy, and probiotic-rich plain yogurt made from 100% pure pasteurized cow milk.',
    nutrition: { 'Calories': '61 kcal', 'Protein': '3.5 g', 'Live Cultures': 'Active Probiotics' }
  },

  // 6. Boneless Chicken 1 Kg
  {
    id: 'boneless-chicken-1kg',
    name: 'Fresh Boneless Chicken Breast 1 Kg',
    brand: 'K&Ns',
    category: 'meat-poultry',
    categoryLabel: 'Meat & Poultry',
    price: 890,
    originalPrice: 1100,
    discountPercent: 20,
    unit: '1 Kg Sealed Pack',
    rating: 4.9,
    reviewsCount: 310,
    inStock: true,
    stockCount: 45,
    isFlashDeal: true,
    flashEnds: '02:45:18',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Hygienically processed, antibiotic-free skinless and boneless chicken breast fillets. Chilled to 0-4°C.',
    nutrition: { 'Calories': '165 kcal', 'Protein': '31 g', 'Fat': '3.6 g', 'Iron': '1 mg' }
  },

  // 7. Dalda Cooking Oil 1L
  {
    id: 'dalda-cooking-oil-1l',
    name: 'Dalda Cooking Oil 1L Pouch',
    brand: 'Dalda',
    category: 'grocery-staples',
    categoryLabel: 'Grocery Staples',
    price: 450,
    originalPrice: 500,
    discountPercent: 10,
    unit: '1 Bottle / Pouch',
    rating: 4.8,
    reviewsCount: 280,
    inStock: true,
    stockCount: 110,
    isFlashDeal: true,
    flashEnds: '02:45:18',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Dalda VTF Cooking Oil enriched with Vitamin A, D & E. Low cholesterol formulation with heart-healthy omega 3 & 6.',
    nutrition: { 'Energy': '900 kcal/100g', 'Vitamin A': 'Enriched', 'Vitamin D': 'Enriched', 'Trans Fat': '0 g' }
  },

  // 8. Lays Classic 104g
  {
    id: 'lays-classic-104g',
    name: 'Lays Classic Salted Potato Chips 104g',
    brand: 'Lays',
    category: 'snacks',
    categoryLabel: 'Snacks & Munchies',
    price: 210,
    originalPrice: 250,
    discountPercent: 15,
    unit: '1 Pack (104g)',
    rating: 4.7,
    reviewsCount: 340,
    inStock: true,
    stockCount: 140,
    isFlashDeal: true,
    flashEnds: '02:45:18',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Crispy, golden potato chips lightly seasoned with natural sea salt. The perfect anytime crunchy snack.',
    nutrition: { 'Calories': '150 kcal/28g', 'Carbs': '15 g', 'Fat': '10 g' }
  },

  // 9. Surf Excel Powder 1Kg
  {
    id: 'surf-excel-powder-1kg',
    name: 'Surf Excel Washing Powder 1Kg',
    brand: 'Surf Excel',
    category: 'home-kitchen',
    categoryLabel: 'Home & Kitchen',
    price: 450,
    originalPrice: 560,
    discountPercent: 20,
    unit: '1 Kg Pack',
    rating: 4.9,
    reviewsCount: 290,
    inStock: true,
    stockCount: 75,
    isFlashDeal: true,
    flashEnds: '02:45:18',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Surf Excel Quick Wash detergent with power of stain lifters. Removes tough stains in 1 wash without scrubbing.',
    nutrition: { 'Action': 'Stain Lifter Technology', 'Fragrance': 'Fresh Breeze', 'Suitable For': 'Top & Front Load' }
  },

  // 10. Fresh Strawberries
  {
    id: 'fresh-strawberries-box',
    name: 'Fresh Farm Strawberries (Imported Box)',
    brand: 'Farm Fresh',
    category: 'fruits-veg',
    categoryLabel: 'Fruits & Vegetables',
    price: 450,
    originalPrice: 550,
    discountPercent: 20,
    unit: '250g Box',
    rating: 4.9,
    reviewsCount: 185,
    inStock: true,
    stockCount: 30,
    isFlashDeal: true,
    flashEnds: '02:45:18',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Sweet, juicy and fragrant ruby red strawberries packed with antioxidants and vitamin C.',
    nutrition: { 'Calories': '32 kcal', 'Vitamin C': '98% DV', 'Fiber': '2 g' }
  },

  // 11. Farm Eggs (30 Pcs)
  {
    id: 'farm-eggs-30pcs',
    name: 'Farm Fresh White Eggs (Crate of 30)',
    brand: 'Farm Fresh',
    category: 'dairy-eggs',
    categoryLabel: 'Dairy & Eggs',
    price: 580,
    originalPrice: 650,
    discountPercent: 11,
    unit: 'Crate of 30 Pcs',
    rating: 4.8,
    reviewsCount: 320,
    inStock: true,
    stockCount: 115,
    isFlashDeal: false,
    image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Clean, sanitized Grade-A farm fresh eggs packed with natural protein and choline for breakfast.',
    nutrition: { 'Protein': '6 g per egg', 'Choline': '147 mg', 'Calories': '72 kcal' }
  }
];

export const COUPONS = [
  {
    code: 'FRESH50',
    discountPercent: 50,
    amount: 100,
    minSpend: 500,
    description: 'Enjoy flat 50% discount on your first 10-minute order!',
    isPopular: true
  },
  {
    code: 'FREESHIP',
    discountPercent: 0,
    freeShipping: true,
    minSpend: 500,
    description: 'Free Express Priority Delivery on all orders.',
    isPopular: true
  }
];

export const ADMIN_STATS = {
  totalSales: { amount: 845230, formatted: 'Rs. 845,230', growth: '+12.5%' },
  totalOrders: { count: 1248, formatted: '1,248', growth: '+8.2%' },
  totalCustomers: { count: 5842, formatted: '5,842', growth: '+16.3%' },
  totalProducts: { count: 2456, formatted: '2,456', growth: '+6.1%' }
};

export const ADMIN_TOP_PRODUCTS = [
  { id: 1, name: "Olper's Milk 1L", salesCount: 1246, revenue: 'Rs. 261,660' },
  { id: 2, name: 'Bananas 1 Kg', salesCount: 980, revenue: 'Rs. 176,400' },
  { id: 3, name: 'Boneless Chicken 1 Kg', salesCount: 780, revenue: 'Rs. 694,200' },
  { id: 4, name: 'Lays Classic 104g', salesCount: 650, revenue: 'Rs. 136,500' },
  { id: 5, name: 'Surf Excel Powder 1 Kg', salesCount: 520, revenue: 'Rs. 234,000' }
];

export const ADMIN_RECENT_ORDERS = [
  {
    id: '#FM1256',
    customer: 'Ali Raza',
    amount: 1250,
    formattedAmount: 'Rs. 1,250',
    status: 'Delivered',
    statusColor: 'bg-emerald-100 text-emerald-800',
    date: '29 Aug 2026'
  },
  {
    id: '#FM1255',
    customer: 'Sara Khan',
    amount: 980,
    formattedAmount: 'Rs. 980',
    status: 'Processing',
    statusColor: 'bg-blue-100 text-blue-800',
    date: '29 Aug 2026'
  },
  {
    id: '#FM1254',
    customer: 'Usman Ahmed',
    amount: 1780,
    formattedAmount: 'Rs. 1,780',
    status: 'Out for Delivery',
    statusColor: 'bg-amber-100 text-amber-800',
    date: '29 Aug 2026'
  },
  {
    id: '#FM1253',
    customer: 'Ayesha Malik',
    amount: 650,
    formattedAmount: 'Rs. 650',
    status: 'Delivered',
    statusColor: 'bg-emerald-100 text-emerald-800',
    date: '28 Aug 2026'
  },
  {
    id: '#FM1252',
    customer: 'Bilal Tariq',
    amount: 2450,
    formattedAmount: 'Rs. 2,450',
    status: 'Delivered',
    statusColor: 'bg-emerald-100 text-emerald-800',
    date: '28 Aug 2026'
  }
];

export const ADMIN_INVENTORY_ALERTS = [
  { id: 1, name: "Olper's Milk 1L", stock: 5, status: 'Low Stock', statusColor: 'text-amber-600 bg-amber-50' },
  { id: 2, name: 'Dalda Cooking Oil 1L', stock: 3, status: 'Low Stock', statusColor: 'text-amber-600 bg-amber-50' },
  { id: 3, name: 'Boneless Chicken 1 Kg', stock: 0, status: 'Out of Stock', statusColor: 'text-rose-600 bg-rose-50' },
  { id: 4, name: 'Eggs (30 Pcs)', stock: 2, status: 'Low Stock', statusColor: 'text-amber-600 bg-amber-50' }
];

export const RECIPES_DATA = [
  {
    id: 'recipe-1',
    title: 'Protein-Packed Banana & Berry Power Smoothie',
    cookTime: '5 mins',
    servings: '2 Persons',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
    description: 'A creamy, high-protein breakfast smoothie loaded with fresh bananas, strawberries, and rich whole milk.',
    ingredientProductIds: ['bananas-1kg', 'olpers-milk-1l', 'fresh-strawberries-box'],
    steps: [
      'Slice 2 fresh bananas and rinse 1 cup of fresh strawberries.',
      'Pour 250ml chilled Olpers Milk into blender.',
      'Blend for 60 seconds until frothy and smooth. Serve cold!'
    ]
  },
  {
    id: 'recipe-2',
    title: 'Golden Crispy Roast Potatoes & Garlic Herb Dip',
    cookTime: '25 mins',
    servings: '4 Persons',
    difficulty: 'Medium',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    description: 'Crispy on the outside, fluffy on the inside roasted potatoes paired with creamy yogurt dip.',
    ingredientProductIds: ['potatoes-1kg', 'dalda-cooking-oil-1l', 'nestle-yogurt-cup'],
    steps: [
      'Cube 1kg potatoes and parboil for 7 minutes in salted water.',
      'Toss in 3 tbsp Dalda Cooking oil with salt and paprika.',
      'Roast at 200°C for 20 minutes until golden crunchy.'
    ]
  },
  {
    id: 'recipe-3',
    title: 'Healthy Lemon Herb Pan-Seared Chicken Breast',
    cookTime: '15 mins',
    servings: '2 Persons',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    description: 'Juicy, tender boneless chicken breasts cooked in a light drizzle of oil and fresh cracked pepper.',
    ingredientProductIds: ['boneless-chicken-1kg', 'dalda-cooking-oil-1l'],
    steps: [
      'Season boneless chicken breast with sea salt and black pepper.',
      'Heat 1 tbsp Dalda cooking oil on a cast iron skillet.',
      'Sear chicken for 6-7 mins each side until juices run clear.'
    ]
  }
];

export const STORE_LOCATIONS = [
  {
    id: 'loc-1',
    name: 'Johar Town Express Dark Store #01',
    city: 'Lahore, Pakistan',
    address: '123 Main Boulevard, Johar Town, Phase 2',
    deliveryTime: '8-12 Minutes',
    status: 'Open 24/7',
    coverage: '5 km radius'
  },
  {
    id: 'loc-2',
    name: 'Gulberg Super Center #04',
    city: 'Lahore, Pakistan',
    address: '45-B MM Alam Road, Gulberg III',
    deliveryTime: '10-15 Minutes',
    status: 'Open 24/7',
    coverage: '7 km radius'
  },
  {
    id: 'loc-3',
    name: 'DHA Phase 5 Hub #09',
    city: 'Lahore, Pakistan',
    address: 'Commercial Sector C, DHA Phase 5',
    deliveryTime: '7-10 Minutes',
    status: 'Open 24/7',
    coverage: '6 km radius'
  }
];
