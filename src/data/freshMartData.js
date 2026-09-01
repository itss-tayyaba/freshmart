// FreshMart - Complete Multi-View Data Store & Product Catalog

export const FRESHMART_CATEGORIES = [
  {
    id: 'fruits-veg',
    name: 'Fruits & Vegetables',
    shortName: 'Fruits &\nVegetables',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80',
    itemCount: 48,
    discountBadge: 'Up to 25% OFF',
    subcategories: ['Fresh Fruits', 'Fresh Vegetables', 'Organic Herbs', 'Exotic Greens', 'Seasonal Packs']
  },
  {
    id: 'dairy-eggs',
    name: 'Dairy & Eggs',
    shortName: 'Dairy &\nEggs',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80',
    itemCount: 32,
    discountBadge: 'Up to 20% OFF',
    subcategories: ['Milk & Cream', 'Farm Eggs', 'Yogurt & Curd', 'Butter & Cheese', 'Paneer & Tofu']
  },
  {
    id: 'meat-poultry',
    name: 'Meat & Poultry',
    shortName: 'Meat &\nPoultry',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=300&q=80',
    itemCount: 24,
    discountBadge: 'Fresh Cut',
    subcategories: ['Boneless Chicken', 'Beef & Mutton', 'Fresh Seafood', 'Frozen Cuts', 'Marinated Meats']
  },
  {
    id: 'bakery',
    name: 'Bakery',
    shortName: 'Bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
    itemCount: 29,
    discountBadge: 'Daily Fresh',
    subcategories: ['Fresh Bread & Buns', 'Cakes & Pastries', 'Cookies & Rusks', 'Pitas & Wraps']
  },
  {
    id: 'beverages',
    name: 'Beverages',
    shortName: 'Beverages',
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=300&q=80',
    itemCount: 45,
    discountBadge: 'Up to 30% OFF',
    subcategories: ['Cold Juices', 'Tea & Coffee', 'Carbonated Drinks', 'Energy Drinks', 'Mineral Water']
  },
  {
    id: 'snacks',
    name: 'Snacks & Munchies',
    shortName: 'Snacks &\nMunchies',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80',
    itemCount: 56,
    discountBadge: 'Up to 30% OFF',
    subcategories: ['Potato Chips & Crisps', 'Chocolates & Candies', 'Dry Fruits & Nuts', 'Biscuits & Wafers']
  },
  {
    id: 'grocery-staples',
    name: 'Grocery Staples',
    shortName: 'Grocery\nStaples',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80',
    itemCount: 65,
    discountBadge: 'Bulk Savings',
    subcategories: ['Cooking Oils & Ghee', 'Rice & Flour (Atta)', 'Pulses & Lentils (Daal)', 'Spices & Salts', 'Sugar & Honey']
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    shortName: 'Personal\nCare',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80',
    itemCount: 38,
    discountBadge: 'Up to 20% OFF',
    subcategories: ['Soaps & Body Wash', 'Shampoos & Conditioners', 'Oral Care', 'Skin Care Creams']
  },
  {
    id: 'baby-care',
    name: 'Baby Care',
    shortName: 'Baby\nCare',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=300&q=80',
    itemCount: 22,
    discountBadge: 'Up to 25% OFF',
    subcategories: ['Baby Food & Formula', 'Diapers & Wipes', 'Baby Bath & Hygiene']
  },
  {
    id: 'home-kitchen',
    name: 'Cleaning & Household',
    shortName: 'Cleaning\nEssentials',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=300&q=80',
    itemCount: 35,
    discountBadge: 'Up to 25% OFF',
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
  'Shan Foods',
  'Pepsi',
  'Coca Cola',
  'Quaker'
];

export const FRESHMART_PRODUCTS = [
  // 1. Olper's Milk 1L
  {
    id: 'olpers-milk-1l',
    name: "Olper's Full Cream Milk 1L",
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
    isBestSeller: true,
    flashEnds: '02:45:18',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    description: "Olper's Full Cream Milk is a rich source of protein, calcium, and essential vitamins.",
    nutrition: { 'Energy / Calories': '65 kcal per 100ml', 'Calcium': '120 mg', 'Protein': '3.2 g' }
  },

  // 2. Bananas 1 Kg
  {
    id: 'bananas-1kg',
    name: 'Fresh Bananas (1 Dozen / 1kg)',
    brand: 'Farm Fresh',
    category: 'fruits-veg',
    categoryLabel: 'Fruits & Vegetables',
    price: 180,
    originalPrice: 220,
    discountPercent: 18,
    unit: '1 Kg (6-8 pcs)',
    rating: 4.6,
    reviewsCount: 230,
    inStock: true,
    stockCount: 120,
    isFlashDeal: false,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
    description: 'Sweet, energy-packed bananas ripened naturally without chemicals.',
    nutrition: { 'Calories': '89 kcal', 'Potassium': '358 mg', 'Carbs': '23 g' }
  },

  // 3. Nestle Milk 1L
  {
    id: 'nestle-milk-1l',
    name: 'Nestle MilkPak 1L',
    brand: 'Nestle',
    category: 'dairy-eggs',
    categoryLabel: 'Dairy & Eggs',
    price: 220,
    originalPrice: 260,
    discountPercent: 15,
    unit: '1 Litre Pack',
    rating: 4.9,
    reviewsCount: 320,
    inStock: true,
    stockCount: 95,
    isFlashDeal: true,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80',
    description: 'Pure, rich UHT standardized milk from Nestle.',
    nutrition: { 'Calories': '62 kcal', 'Calcium': '115 mg' }
  },

  // 4. Eggs 30 Pcs Tray
  {
    id: 'eggs-30-tray',
    name: 'Farm Fresh Eggs (30 Pieces Tray)',
    brand: 'Farm Fresh',
    category: 'dairy-eggs',
    categoryLabel: 'Dairy & Eggs',
    price: 450,
    originalPrice: 520,
    discountPercent: 14,
    unit: 'Tray (30 pcs)',
    rating: 4.7,
    reviewsCount: 580,
    inStock: true,
    stockCount: 60,
    isFlashDeal: false,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
    description: 'High-protein graded farm brown eggs, fresh from local organic farms.',
    nutrition: { 'Protein': '6g / egg', 'Choline': '147 mg' }
  },

  // 5. Basmati Rice 5kg
  {
    id: 'basmati-rice-5kg',
    name: 'Super Kernel Basmati Rice 5kg',
    brand: 'National Foods',
    category: 'grocery-staples',
    categoryLabel: 'Grocery Staples',
    price: 1250,
    originalPrice: 1450,
    discountPercent: 14,
    unit: '5 Kg Bag',
    rating: 4.8,
    reviewsCount: 360,
    inStock: true,
    stockCount: 50,
    isFlashDeal: false,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    description: 'Aromatic, long-grain aged premium Basmati rice.',
    nutrition: { 'Calories': '130 kcal/100g', 'Carbs': '28 g' }
  },

  // 6. Quaker Oats 500g
  {
    id: 'quaker-oats-500g',
    name: 'Quaker White Whole Oats 500g',
    brand: 'Quaker',
    category: 'grocery-staples',
    categoryLabel: 'Grocery Staples',
    price: 350,
    originalPrice: 420,
    discountPercent: 16,
    unit: '500g Tin Pack',
    rating: 4.7,
    reviewsCount: 125,
    inStock: true,
    stockCount: 40,
    isFlashDeal: false,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80',
    description: '100% whole grain rolled oats for heart health and sustained energy.',
    nutrition: { 'Fiber': '4 g', 'Protein': '5 g' }
  },

  // 7. Coca Cola 1.5L
  {
    id: 'coca-cola-15l',
    name: 'Coca Cola Original Taste 1.5L',
    brand: 'Coca Cola',
    category: 'beverages',
    categoryLabel: 'Beverages',
    price: 190,
    originalPrice: 220,
    discountPercent: 14,
    unit: '1.5 Litre Bottle',
    rating: 4.6,
    reviewsCount: 710,
    inStock: true,
    stockCount: 150,
    isFlashDeal: false,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    description: 'Ice cold, refreshing original taste carbonated soft drink.',
    nutrition: { 'Calories': '140 kcal / can' }
  },

  // 8. Spotlight Deal of the Day: Fresh Apples 1kg
  {
    id: 'fresh-apples-1kg',
    name: 'Fresh Red Crisp Apples (1kg)',
    brand: 'Farm Fresh',
    category: 'fruits-veg',
    categoryLabel: 'Fruits & Vegetables',
    price: 250,
    originalPrice: 350,
    discountPercent: 28,
    unit: '1 Kg (4-5 pcs)',
    rating: 4.9,
    reviewsCount: 410,
    inStock: true,
    stockCount: 80,
    isFlashDeal: true,
    isBestSeller: true,
    flashEnds: '08:45:30',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
    description: 'Crisp, sweet, juicy red apples picked fresh from high altitude orchards.',
    nutrition: { 'Calories': '52 kcal', 'Fiber': '2.4 g', 'Vitamin C': '14%' }
  },

  // 9. Almonds 250g
  {
    id: 'almonds-250g',
    name: 'California Premium Almonds 250g',
    brand: 'Farm Fresh',
    category: 'snacks',
    categoryLabel: 'Snacks & Munchies',
    price: 550,
    originalPrice: 650,
    discountPercent: 15,
    unit: '250g Zip Pouch',
    rating: 4.8,
    reviewsCount: 190,
    inStock: true,
    stockCount: 45,
    isFlashDeal: false,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80',
    description: 'Crunchy, rich raw almonds loaded with Vitamin E and healthy fats.',
    nutrition: { 'Protein': '6 g', 'Healthy Fats': '14 g' }
  },

  // 10. Pepsi 1.5L
  {
    id: 'pepsi-15l',
    name: 'Pepsi Refreshing Cola 1.5L',
    brand: 'Pepsi',
    category: 'beverages',
    categoryLabel: 'Beverages',
    price: 180,
    originalPrice: 210,
    discountPercent: 14,
    unit: '1.5 Litre Bottle',
    rating: 4.6,
    reviewsCount: 315,
    inStock: true,
    stockCount: 90,
    isFlashDeal: false,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=600&q=80',
    description: 'Crisp, bold cola with refreshing fizz.',
    nutrition: { 'Calories': '150 kcal' }
  },

  // 11. Fresh Chicken 1kg
  {
    id: 'chicken-1kg',
    name: 'Fresh Farm Chicken Whole 1kg',
    brand: 'K&Ns',
    category: 'meat-poultry',
    categoryLabel: 'Meat & Poultry',
    price: 650,
    originalPrice: 750,
    discountPercent: 13,
    unit: '1 Kg Dressed Pack',
    rating: 4.7,
    reviewsCount: 230,
    inStock: true,
    stockCount: 40,
    isFlashDeal: false,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    description: 'Antibiotic-free, freshly dressed whole chicken chilled to perfection.',
    nutrition: { 'Protein': '27 g', 'Iron': '1.3 mg' }
  },

  // 12. Detergent 1kg
  {
    id: 'detergent-1kg',
    name: 'Surf Excel Detergent Powder 1kg',
    brand: 'Surf Excel',
    category: 'home-kitchen',
    categoryLabel: 'Cleaning & Household',
    price: 280,
    originalPrice: 330,
    discountPercent: 15,
    unit: '1 Kg Box',
    rating: 4.6,
    reviewsCount: 80,
    inStock: true,
    stockCount: 65,
    isFlashDeal: false,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80',
    description: 'Tough stain removal formula with pleasant long-lasting fragrance.',
    nutrition: {}
  },

  // 13. Cooking Oil 1L
  {
    id: 'cooking-oil-1l',
    name: 'Dalda Supreme Cooking Oil 1L',
    brand: 'Dalda',
    category: 'grocery-staples',
    categoryLabel: 'Grocery Staples',
    price: 320,
    originalPrice: 380,
    discountPercent: 16,
    unit: '1 Litre Bottle',
    rating: 4.7,
    reviewsCount: 192,
    inStock: true,
    stockCount: 75,
    isFlashDeal: false,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    description: 'Pure refined cooking oil fortified with Vitamin A & D.',
    nutrition: { 'Energy': '900 kcal' }
  },

  // 14. Fresh Tomatoes 1kg
  {
    id: 'tomatoes-1kg',
    name: 'Farm Fresh Red Tomatoes 1kg',
    brand: 'Farm Fresh',
    category: 'fruits-veg',
    categoryLabel: 'Fruits & Vegetables',
    price: 120,
    originalPrice: 150,
    discountPercent: 20,
    unit: '1 Kg',
    rating: 4.5,
    reviewsCount: 80,
    inStock: true,
    stockCount: 110,
    isFlashDeal: false,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    description: 'Juicy, farm-ripened red tomatoes ideal for salads and gravies.',
    nutrition: { 'Lycopene': 'Rich', 'Vitamin C': '28%' }
  },

  // 15. Watermelon 1kg
  {
    id: 'watermelon-1kg',
    name: 'Farm Sweet Red Watermelon (1kg)',
    brand: 'Farm Fresh',
    category: 'fruits-veg',
    categoryLabel: 'Fruits & Vegetables',
    price: 80,
    originalPrice: 110,
    discountPercent: 27,
    unit: '1 Kg Slice / Whole',
    rating: 4.8,
    reviewsCount: 115,
    inStock: true,
    stockCount: 55,
    isFlashDeal: true,
    isBestSeller: false,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
    description: 'Hydrating, sweet red watermelon straight from the farm.',
    nutrition: { 'Water': '92%', 'Calories': '30 kcal' }
  }
];

export const COUPONS = [
  {
    code: 'WELCOME20',
    discount: 20,
    type: 'percent',
    minSpend: 500,
    description: 'Get 20% OFF on your first order - Use code: WELCOME20'
  },
  {
    code: 'FIRST20',
    discount: 20,
    type: 'percent',
    minSpend: 500,
    description: 'Flat 20% OFF on your first order!'
  },
  {
    code: 'FRESH50',
    discount: 50,
    type: 'percent',
    minSpend: 1000,
    description: 'Special 50% Flat Coupon on orders above Rs. 1000'
  },
  {
    code: 'FREESHIP',
    discount: 100,
    type: 'shipping',
    minSpend: 0,
    description: 'Unlimited Free Express Delivery'
  }
];

export const ADMIN_STATS = {
  totalSales: { amount: 845230, formatted: 'Rs. 845,230', growth: '+12.5%' },
  totalOrders: { count: 1248, formatted: '1,248', growth: '+8.2%' },
  totalCustomers: { count: 5842, formatted: '5,842', growth: '+16.3%' },
  totalProducts: { count: 2456, formatted: '2,456', growth: '+6.1%' }
};

export const ADMIN_TOP_PRODUCTS = [
  { id: 1, name: "Olper's Milk 1L", sales: 'Rs. 145,200', units: 691, growth: '+18.4%' },
  { id: 2, name: 'Fresh Bananas 1 Kg', sales: 'Rs. 98,400', units: 546, growth: '+12.1%' },
  { id: 3, name: 'Apples Royal Gala 1Kg', sales: 'Rs. 84,200', units: 263, growth: '+9.8%' },
  { id: 4, name: 'Lays Classic 104g', sales: 'Rs. 72,100', units: 343, growth: '+15.2%' }
];

export const ADMIN_RECENT_ORDERS = [
  { id: '#FM9482', customer: 'Alex Morgan', total: 1280, status: 'Out for Delivery', statusColor: 'bg-amber-100 text-amber-800', payment: 'Cash on Delivery', time: '10 mins ago' },
  { id: '#FM9481', customer: 'Sarah Jenkins', total: 640, status: 'Delivered', statusColor: 'bg-emerald-100 text-emerald-800', payment: 'Credit Card', time: '25 mins ago' },
  { id: '#FM9480', customer: 'David Chen', total: 2150, status: 'Processing', statusColor: 'bg-blue-100 text-blue-800', payment: 'JazzCash', time: '42 mins ago' },
  { id: '#FM9479', customer: 'Emily Watson', total: 890, status: 'Delivered', statusColor: 'bg-emerald-100 text-emerald-800', payment: 'EasyPaisa', time: '1 hour ago' },
  { id: '#FM9478', customer: 'Michael Scott', total: 3200, status: 'Delivered', statusColor: 'bg-emerald-100 text-emerald-800', payment: 'Credit Card', time: '2 hours ago' }
];

export const ADMIN_INVENTORY_ALERTS = [
  { id: 1, name: 'Boneless Chicken Breast', stock: 5, threshold: 15, status: 'Low Stock' },
  { id: 2, name: 'Nestle Yogurt Cup', stock: 0, threshold: 20, status: 'Out of Stock' },
  { id: 3, name: 'Dalda Cooking Oil 1L', stock: 8, threshold: 25, status: 'Low Stock' }
];

export const RECIPES_DATA = [
  {
    id: 'chicken-biryani',
    title: 'Aromatic Chicken Dum Biryani',
    cookTime: '45 mins',
    servings: '4-5 People',
    difficulty: 'Medium',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80',
    description: 'Fragrant aged Basmati rice layered with spiced tender chicken, saffron, and caramelized onions.',
    ingredientProductIds: ['chicken-1kg', 'basmati-rice-5kg', 'cooking-oil-1l', 'tomatoes-1kg']
  },
  {
    id: 'banana-milkshake',
    title: 'Creamy High-Energy Banana Shake',
    cookTime: '5 mins',
    servings: '2 Glasses',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
    description: 'Wholesome natural energy drink made with fresh bananas, full cream milk, and Californian almonds.',
    ingredientProductIds: ['bananas-1kg', 'olpers-milk-1l', 'almonds-250g']
  },
  {
    id: 'healthy-breakfast-oats',
    title: 'Fresh Apple & Honey Morning Oats Bowl',
    cookTime: '10 mins',
    servings: '1 Person',
    difficulty: 'Easy',
    ingredientProductIds: ['quaker-oats-500g', 'fresh-apples-1kg', 'nestle-milk-1l']
  }
];

export const STORE_LOCATIONS = [
  { id: 'store-1', name: 'FreshMart Dark Store #1 - Johar Town, Lahore', deliveryTime: '10-15 Mins' },
  { id: 'store-2', name: 'FreshMart Dark Store #2 - Gulberg III, Lahore', deliveryTime: '10-12 Mins' },
  { id: 'store-3', name: 'FreshMart Dark Store #3 - DHA Phase 5, Lahore', deliveryTime: '12-15 Mins' }
];



