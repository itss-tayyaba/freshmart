// Grocery Shop - Comprehensive Data Store & Product Catalog

export const CATEGORIES_SIDEBAR = [
  {
    id: 'beverage',
    name: 'Beverage',
    icon: 'CupSoda',
    hasDropdown: true,
    subcategories: ['Fresh Juices', 'Tea & Coffee', 'Herbal Drinks', 'Energy Drinks', 'Soda & Fizzy']
  },
  {
    id: 'dessert',
    name: 'Dessert',
    icon: 'Cake',
    hasDropdown: true,
    subcategories: ['Artisan Cakes', 'Pastries & Muffins', 'Ice Creams', 'Puddings & Custards']
  },
  {
    id: 'drinks-juice',
    name: 'Drinks & Juice',
    icon: 'GlassWater',
    hasDropdown: true,
    subcategories: ['100% Cold Pressed', 'Smoothie Blends', 'Citrus Quenchers', 'Sparkling Waters']
  },
  {
    id: 'fish-meats',
    name: 'Fish & Meats',
    icon: 'Beef',
    hasDropdown: false,
    subcategories: ['Organic Chicken', 'Prime Beef Cuts', 'Atlantic Salmon', 'Prawns & Shellfish']
  },
  {
    id: 'fresh-fruits',
    name: 'Fresh Fruits',
    icon: 'Apple',
    hasDropdown: false,
    subcategories: ['Tropical Mangoes', 'Berry Combos', 'Crisp Apples', 'Sweet Citrus']
  },
  {
    id: 'pets-animal',
    name: 'Pets & Animal',
    icon: 'Dog',
    hasDropdown: true,
    subcategories: ['Dog Crunchies', 'Cat Wet Food', 'Bird Seeds', 'Pet Grooming']
  },
  {
    id: 'toys',
    name: 'Toys',
    icon: 'Gamepad2',
    hasDropdown: false,
    subcategories: ['Eco Wooden Toys', 'Soft Plushies', 'Kids Puzzle Sets']
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    icon: 'Leaf',
    hasDropdown: false,
    subcategories: ['Farm Fresh Greens', 'Crisp Roots', 'Exotic Peppers', 'Aromatic Herbs']
  }
];

export const CATEGORIES_CAROUSEL = [
  {
    id: 'vegetables',
    name: 'Vegetables',
    itemsCount: 9,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    color: 'from-emerald-500/10 to-emerald-500/5'
  },
  {
    id: 'fruits',
    name: 'Fruits',
    itemsCount: 8,
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80',
    color: 'from-amber-500/10 to-amber-500/5'
  },
  {
    id: 'fish-meats',
    name: 'Fish & Meat',
    itemsCount: 9,
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
    color: 'from-rose-500/10 to-rose-500/5',
    isActiveDefault: true
  },
  {
    id: 'cooking',
    name: 'Cooking',
    itemsCount: 6,
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80',
    color: 'from-orange-500/10 to-orange-500/5'
  },
  {
    id: 'home-cleaning',
    name: 'Home Cleaning',
    itemsCount: 12,
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80',
    color: 'from-blue-500/10 to-blue-500/5'
  },
  {
    id: 'stationery',
    name: 'Stationery',
    itemsCount: 5,
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80',
    color: 'from-purple-500/10 to-purple-500/5'
  },
  {
    id: 'biscuits-cakes',
    name: 'Biscuits & Cakes',
    itemsCount: 9,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
    color: 'from-yellow-500/10 to-yellow-500/5'
  },
  {
    id: 'health-product',
    name: 'Health Product',
    itemsCount: 4,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    color: 'from-teal-500/10 to-teal-500/5'
  }
];

export const HERO_SLIDES = [
  {
    id: 1,
    title: 'Fresh Groceries Delivered to Your Doorstep',
    highlightDiscount: '30% off',
    subtitle: 'Enjoy up to',
    suffixText: 'on your first order.',
    ctaText: 'Shop Now',
    tag: '100% Organic & Farm Fresh',
    bgGradient: 'from-emerald-50/70 via-stone-50 to-amber-50/50',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80',
    featuredBadge: 'Daily Harvest'
  },
  {
    id: 2,
    title: 'Organic Citrus & Exotic Berries Collection',
    highlightDiscount: '25% off',
    subtitle: 'Get special',
    suffixText: 'on fresh vitamin-rich fruits.',
    ctaText: 'Explore Fruits',
    tag: 'Handpicked Every Morning',
    bgGradient: 'from-amber-50/80 via-orange-50/40 to-stone-50',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1000&q=80',
    featuredBadge: 'Vitamin Boost'
  },
  {
    id: 3,
    title: 'Premium Quality Meat & Wild Seafood',
    highlightDiscount: '20% off',
    subtitle: 'Save up to',
    suffixText: 'on chef-grade cuts & salmon.',
    ctaText: 'Order Meat & Fish',
    tag: 'Sustainably Sourced',
    bgGradient: 'from-rose-50/70 via-stone-50 to-orange-50/40',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
    featuredBadge: 'Chef Selection'
  }
];

export const PROMO_BANNERS = [
  {
    id: 'promo-1',
    discount: '30% off',
    prefix: 'Enjoy up to',
    title: 'Fresh Groceries\nDelivered to',
    subtitle: 'Cold-pressed detox juices & crisp veggies',
    buttonText: 'View More',
    bgColor: 'bg-[#fce7f3]', // Light Pink/Lavender pastel
    textColor: 'text-slate-800',
    badgeBg: 'bg-rose-500',
    categoryTarget: 'drinks-juice',
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
    secondaryImg: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'promo-2',
    discount: '30% off',
    prefix: 'Enjoy up to',
    title: 'Fresh Groceries\nDelivered to',
    subtitle: 'Crisp bell peppers, broccoli & herbs',
    buttonText: 'View More',
    bgColor: 'bg-[#e8f5e9]', // Light Mint Green pastel
    textColor: 'text-slate-800',
    badgeBg: 'bg-emerald-600',
    categoryTarget: 'vegetables',
    image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=600&q=80',
    secondaryImg: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'promo-3',
    discount: '30% off',
    prefix: 'Enjoy up to',
    title: 'Fresh Groceries\nDelivered to',
    subtitle: 'Citrus juice, organic garlic & onions',
    buttonText: 'View More',
    bgColor: 'bg-[#ffedd5]', // Warm Peach/Sand pastel
    textColor: 'text-slate-800',
    badgeBg: 'bg-amber-600',
    categoryTarget: 'fresh-fruits',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    secondaryImg: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80'
  }
];

export const PRODUCTS = [
  // Vegetables
  {
    id: 'veg-1',
    name: 'Farm Fresh Organic Red Bell Peppers',
    category: 'vegetables',
    categoryLabel: 'Vegetables',
    price: 3.49,
    originalPrice: 4.99,
    discountPercent: 30,
    rating: 4.9,
    reviewsCount: 128,
    unit: '500g',
    unitOptions: ['250g', '500g', '1kg'],
    inStock: true,
    stockCount: 42,
    isOrganic: true,
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80',
    description: 'Crisp, sweet, and vibrant red bell peppers harvested daily from local eco-certified organic farms. Packed with Vitamin C and natural antioxidants.',
    nutrition: { calories: '31 kcal', carbs: '6g', vitaminC: '190%', fiber: '2.1g' }
  },
  {
    id: 'veg-2',
    name: 'Fresh Crunchy Green Broccoli Crowns',
    category: 'vegetables',
    categoryLabel: 'Vegetables',
    price: 2.89,
    originalPrice: 3.50,
    discountPercent: 17,
    rating: 4.8,
    reviewsCount: 94,
    unit: '1 bunch (400g)',
    unitOptions: ['1 bunch (400g)', '2 bunches (800g)'],
    inStock: true,
    stockCount: 28,
    isOrganic: true,
    badge: 'Organic',
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80',
    description: 'Dense, emerald broccoli florets rich in dietary fiber, iron, and essential minerals. Ideal for steaming, stir-fries, and healthy salads.',
    nutrition: { calories: '34 kcal', carbs: '7g', protein: '2.8g', fiber: '2.6g' }
  },
  {
    id: 'veg-3',
    name: 'Crisp English Cucumbers & Salad Mix',
    category: 'vegetables',
    categoryLabel: 'Vegetables',
    price: 1.99,
    originalPrice: 2.50,
    discountPercent: 20,
    rating: 4.7,
    reviewsCount: 86,
    unit: '3 pcs',
    unitOptions: ['3 pcs', '6 pcs'],
    inStock: true,
    stockCount: 50,
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=600&q=80',
    description: 'Hydrating, tender-skinned cucumbers with a clean, refreshing crunch. Perfect for Mediterranean salads, sandwiches, and infused waters.',
    nutrition: { calories: '15 kcal', water: '95%', carbs: '3.6g', potassium: '147mg' }
  },
  {
    id: 'veg-4',
    name: 'Organic Vine Ripe Cherry Tomatoes',
    category: 'vegetables',
    categoryLabel: 'Vegetables',
    price: 3.20,
    originalPrice: 4.00,
    discountPercent: 20,
    rating: 4.9,
    reviewsCount: 154,
    unit: '300g pack',
    unitOptions: ['300g pack', '600g pack'],
    inStock: true,
    stockCount: 35,
    isOrganic: true,
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    description: 'Sweet, juicy bite-sized tomatoes bursting with garden-fresh flavor and natural lycopene.',
    nutrition: { calories: '18 kcal', lycopene: 'High', vitaminA: '15%', carbs: '3.9g' }
  },

  // Fruits
  {
    id: 'fruit-1',
    name: 'Fresh Juicy Valencia Sweet Oranges',
    category: 'fruits',
    categoryLabel: 'Fresh Fruits',
    price: 4.25,
    originalPrice: 5.50,
    discountPercent: 22,
    rating: 4.9,
    reviewsCount: 210,
    unit: '1kg bag',
    unitOptions: ['1kg bag', '2kg bag', '5kg crate'],
    inStock: true,
    stockCount: 65,
    isOrganic: true,
    badge: 'Top Pick',
    image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=600&q=80',
    description: 'Sun-ripened Valencia oranges loaded with sweet juice and high doses of immune-boosting Vitamin C.',
    nutrition: { calories: '47 kcal', vitaminC: '88%', carbs: '12g', sugars: '9g' }
  },
  {
    id: 'fruit-2',
    name: 'Organic Wild Mountain Strawberries',
    category: 'fruits',
    categoryLabel: 'Fresh Fruits',
    price: 4.80,
    originalPrice: 6.00,
    discountPercent: 20,
    rating: 5.0,
    reviewsCount: 312,
    unit: '250g box',
    unitOptions: ['250g box', '500g box'],
    inStock: true,
    stockCount: 19,
    isOrganic: true,
    badge: 'Hot Deal',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
    description: 'Aromatic, intensely sweet mountain strawberries. Hand-picked at peak ripeness for desserts and breakfast bowls.',
    nutrition: { calories: '32 kcal', antioxidants: 'Ultra High', vitaminC: '98%', fiber: '2g' }
  },
  {
    id: 'fruit-3',
    name: 'Fresh Ripe Hass Avocados',
    category: 'fruits',
    categoryLabel: 'Fresh Fruits',
    price: 3.99,
    originalPrice: 4.99,
    discountPercent: 20,
    rating: 4.8,
    reviewsCount: 178,
    unit: '2 pcs',
    unitOptions: ['2 pcs', '4 pcs net'],
    inStock: true,
    stockCount: 40,
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80',
    description: 'Creamy Hass avocados packed with heart-healthy monounsaturated fats, potassium, and vitamins.',
    nutrition: { calories: '160 kcal', healthyFats: '15g', fiber: '7g', potassium: '485mg' }
  },
  {
    id: 'fruit-4',
    name: 'Golden Kiwi Fruit & Citrus Pack',
    category: 'fruits',
    categoryLabel: 'Fresh Fruits',
    price: 3.65,
    originalPrice: 4.50,
    discountPercent: 18,
    rating: 4.7,
    reviewsCount: 88,
    unit: '4 pcs',
    unitOptions: ['4 pcs', '8 pcs'],
    inStock: true,
    stockCount: 22,
    isOrganic: false,
    image: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=600&q=80',
    description: 'Golden sweet kiwi with smooth skin and luscious honey-like flavor. Rich in digestive enzymes and vitamins.',
    nutrition: { calories: '61 kcal', vitaminC: '155%', fiber: '3g' }
  },

  // Fish & Meat
  {
    id: 'meat-1',
    name: 'Fresh Norwegian Atlantic Salmon Fillet',
    category: 'fish-meats',
    categoryLabel: 'Fish & Meat',
    price: 12.99,
    originalPrice: 16.50,
    discountPercent: 21,
    rating: 4.9,
    reviewsCount: 245,
    unit: '500g',
    unitOptions: ['250g', '500g', '1kg'],
    inStock: true,
    stockCount: 18,
    isOrganic: false,
    badge: 'Premium',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    description: 'Sustainably farmed, sashimi-grade Norwegian salmon fillets with delicate marbling and rich Omega-3 fatty acids.',
    nutrition: { calories: '208 kcal', protein: '22g', omega3: '2.5g', healthyFats: '13g' }
  },
  {
    id: 'meat-2',
    name: 'Grass-Fed Prime Angus Beef Ribeye Steak',
    category: 'fish-meats',
    categoryLabel: 'Fish & Meat',
    price: 15.50,
    originalPrice: 19.99,
    discountPercent: 22,
    rating: 5.0,
    reviewsCount: 190,
    unit: '400g cut',
    unitOptions: ['400g cut', '800g pack'],
    inStock: true,
    stockCount: 14,
    isOrganic: true,
    badge: 'Chef Cut',
    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80',
    description: 'Tender, deeply flavorful prime grass-fed Angus beef ribeye steak, aged to perfection for optimal searing.',
    nutrition: { calories: '291 kcal', protein: '24g', iron: '2.8mg', zinc: '5.2mg' }
  },
  {
    id: 'meat-3',
    name: 'Free-Range Organic Chicken Breasts',
    category: 'fish-meats',
    categoryLabel: 'Fish & Meat',
    price: 7.99,
    originalPrice: 9.50,
    discountPercent: 16,
    rating: 4.8,
    reviewsCount: 164,
    unit: '700g pack',
    unitOptions: ['700g pack', '1.4kg pack'],
    inStock: true,
    stockCount: 30,
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    description: 'Lean, boneless skinless chicken breasts raised humanely without antibiotics or hormones.',
    nutrition: { calories: '165 kcal', protein: '31g', fats: '3.6g' }
  },

  // Drinks & Juice
  {
    id: 'drink-1',
    name: 'Cold-Pressed Wild Blackberry & Acai Juice',
    category: 'drinks-juice',
    categoryLabel: 'Drinks & Juice',
    price: 3.80,
    originalPrice: 4.80,
    discountPercent: 20,
    rating: 4.9,
    reviewsCount: 142,
    unit: '500ml bottle',
    unitOptions: ['500ml bottle', '1L bottle', 'Pack of 4 (500ml)'],
    inStock: true,
    stockCount: 45,
    isOrganic: true,
    badge: 'New Blend',
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80',
    description: 'Raw, unpasteurized cold-pressed antioxidant powerhouse with wild blackberries, blueberries, and pure Amazonian acai.',
    nutrition: { calories: '110 kcal', vitaminC: '60%', carbs: '26g', sugars: '18g' }
  },
  {
    id: 'drink-2',
    name: 'Sparkling Organic Meyer Lemon Drink',
    category: 'drinks-juice',
    categoryLabel: 'Drinks & Juice',
    price: 2.50,
    originalPrice: 3.20,
    discountPercent: 21,
    rating: 4.7,
    reviewsCount: 98,
    unit: '330ml can',
    unitOptions: ['330ml can', 'Pack of 6'],
    inStock: true,
    stockCount: 60,
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    description: 'Zesty sparkling water infused with freshly squeezed Meyer lemons and a gentle hint of organic agave.',
    nutrition: { calories: '40 kcal', carbs: '9g', sugars: '8g' }
  },

  // Cooking & Pantry
  {
    id: 'cook-1',
    name: 'Extra Virgin Cold Pressed Olive Oil (Italian)',
    category: 'cooking',
    categoryLabel: 'Cooking',
    price: 9.99,
    originalPrice: 13.00,
    discountPercent: 23,
    rating: 4.9,
    reviewsCount: 180,
    unit: '750ml bottle',
    unitOptions: ['500ml', '750ml', '1L'],
    inStock: true,
    stockCount: 38,
    isOrganic: true,
    badge: 'Imported',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    description: 'Single-origin unfiltered extra virgin olive oil from Tuscan groves. Robust, peppery finish ideal for dressings and sautéing.',
    nutrition: { calories: '120 kcal/tbsp', polyphenols: 'High', healthyFats: '14g' }
  },
  {
    id: 'cook-2',
    name: 'Artisan Bronze-Die Italian Spaghetti Pasta',
    category: 'cooking',
    categoryLabel: 'Cooking',
    price: 2.40,
    originalPrice: 3.00,
    discountPercent: 20,
    rating: 4.8,
    reviewsCount: 115,
    unit: '500g pack',
    unitOptions: ['500g pack', '1kg pack'],
    inStock: true,
    stockCount: 55,
    isOrganic: false,
    image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80',
    description: 'Durum wheat semolina pasta slowly dried at low temperatures for maximum sauce adherence and perfect al dente texture.',
    nutrition: { calories: '350 kcal/100g', protein: '13g', carbs: '72g' }
  },

  // Biscuits & Cakes
  {
    id: 'bakery-1',
    name: 'Handcrafted Chocolate Chip Oatmeal Cookies',
    category: 'biscuits-cakes',
    categoryLabel: 'Biscuits & Cakes',
    price: 3.99,
    originalPrice: 5.00,
    discountPercent: 20,
    rating: 4.9,
    reviewsCount: 167,
    unit: '300g box',
    unitOptions: ['300g box', '600g box'],
    inStock: true,
    stockCount: 25,
    isOrganic: true,
    badge: 'Bakery Fresh',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80',
    description: 'Freshly baked artisan cookies with rolled whole oats, dark Belgian chocolate chunks, and creamery butter.',
    nutrition: { calories: '140 kcal/cookie', carbs: '18g', fiber: '2g' }
  },

  // Home Cleaning
  {
    id: 'clean-1',
    name: 'Eco-Friendly Plant-Based Multi-Surface Spray',
    category: 'home-cleaning',
    categoryLabel: 'Home Cleaning',
    price: 4.50,
    originalPrice: 5.80,
    discountPercent: 22,
    rating: 4.8,
    reviewsCount: 89,
    unit: '750ml spray',
    unitOptions: ['750ml spray', 'Refill 1.5L'],
    inStock: true,
    stockCount: 32,
    isOrganic: true,
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80',
    description: 'Non-toxic, antibacterial cleaning spray infused with essential eucalyptus and mint oils. Safe around kids and pets.',
    nutrition: { chemicals: '0% Harsh Toxins', biodegradable: '100%' }
  }
];

export const FLASH_DEALS = [
  {
    id: 'flash-1',
    product: PRODUCTS[0], // Red Bell Peppers
    discountRate: 35,
    sold: 38,
    total: 50,
    endsInHours: 8
  },
  {
    id: 'flash-2',
    product: PRODUCTS[4], // Valencia Oranges
    discountRate: 40,
    sold: 45,
    total: 60,
    endsInHours: 12
  },
  {
    id: 'flash-3',
    product: PRODUCTS[8], // Salmon Fillet
    discountRate: 30,
    sold: 22,
    total: 30,
    endsInHours: 6
  },
  {
    id: 'flash-4',
    product: PRODUCTS[11], // Cold-pressed juice
    discountRate: 25,
    sold: 30,
    total: 40,
    endsInHours: 14
  }
];

export const COUPONS = [
  {
    code: 'FRESH30',
    discountPercent: 30,
    minSpend: 25,
    description: 'Enjoy 30% OFF your grocery haul! (First order or orders over $25)',
    isPopular: true
  },
  {
    code: 'ORGANIC15',
    discountPercent: 15,
    minSpend: 20,
    description: '15% OFF all certified Organic vegetables and fruits.',
    isPopular: false
  },
  {
    code: 'FREESHIP',
    discountPercent: 0,
    freeShipping: true,
    minSpend: 30,
    description: 'Free Express Priority Delivery on all orders above $30.',
    isPopular: true
  }
];

export const BLOG_POSTS = [
  {
    id: 1,
    title: '10 Tips for Keeping Your Green Vegetables Crisp for Weeks',
    excerpt: 'Simple kitchen hacks and proper refrigeration techniques that prevent wilting and preserve peak nutrients.',
    date: 'Aug 28, 2026',
    author: 'Chef Olivia Green',
    category: 'Kitchen Tips',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    title: 'The Ultimate Refreshing Morning Citrus Smoothie Recipe',
    excerpt: 'Boost your energy with this 5-minute antioxidant powerhouse made from fresh oranges, ginger, and turmeric.',
    date: 'Aug 24, 2026',
    author: 'Dr. Marcus Vance',
    category: 'Healthy Recipes',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    title: 'Why Farm-to-Doorstep Sourcing Changes Everything',
    excerpt: 'How eliminating lengthy warehouse storage brings you maximum flavor and lowers environmental impact.',
    date: 'Aug 19, 2026',
    author: 'Elena Rossi',
    category: 'Sustainability',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=600&q=80'
  }
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    role: 'Verified Buyer',
    location: 'Seattle, WA',
    rating: 5,
    text: 'The produce arrives fresher than what I can pick myself at high-end supermarkets! The salmon was outstanding and delivery was under 45 minutes.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 2,
    name: 'David Reynolds',
    role: 'Home Chef',
    location: 'Austin, TX',
    rating: 5,
    text: 'Grocery Shop has completely simplified my meal prep. The discounts on organic items are unbeatable, and their customer support is phenomenal.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 3,
    name: 'Amara Patel',
    role: 'Mother of 3',
    location: 'Chicago, IL',
    rating: 5,
    text: 'The tracking system gave me real-time updates down to the driver’s ETA. Everything was packed with ice packs and in pristine condition.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  }
];

export const MOCK_TRACKING_ORDERS = {
  'GROC-8924': {
    orderId: 'GROC-8924',
    customer: 'Alex Morgan',
    itemsCount: 4,
    total: '$34.80',
    placedAt: 'Today, 2:15 PM',
    estimatedDelivery: 'Today, 3:45 PM',
    currentStage: 3, // 1: Placed, 2: Packed, 3: On the Way, 4: Delivered
    driverName: 'Carlos Rivera',
    driverPhone: '+1 (555) 234-8901',
    driverVehicle: 'Electric Delivery Van #14',
    timeline: [
      { title: 'Order Confirmed', time: '2:15 PM', completed: true, desc: 'Payment verified & sent to warehouse' },
      { title: 'Picked & Packed Fresh', time: '2:35 PM', completed: true, desc: 'Inspected for quality and cold-sealed' },
      { title: 'Out for Express Delivery', time: '3:05 PM', completed: true, desc: 'Driver is 12 mins away from your location' },
      { title: 'Delivered to Doorstep', time: 'Est. 3:45 PM', completed: false, desc: 'Contactless delivery requested' }
    ]
  },
  'GROC-5120': {
    orderId: 'GROC-5120',
    customer: 'Sarah Jenkins',
    itemsCount: 6,
    total: '$52.10',
    placedAt: 'Yesterday, 10:00 AM',
    estimatedDelivery: 'Delivered',
    currentStage: 4,
    driverName: 'Marcus Bell',
    driverPhone: '+1 (555) 890-1234',
    driverVehicle: 'Eco Hybrid Van #07',
    timeline: [
      { title: 'Order Confirmed', time: '10:00 AM', completed: true, desc: 'Payment verified' },
      { title: 'Picked & Packed Fresh', time: '10:20 AM', completed: true, desc: 'Packed in eco cooling bag' },
      { title: 'Out for Express Delivery', time: '10:45 AM', completed: true, desc: 'Driver dispatched' },
      { title: 'Delivered to Doorstep', time: '11:15 AM', completed: true, desc: 'Delivered & signed by customer' }
    ]
  }
};
