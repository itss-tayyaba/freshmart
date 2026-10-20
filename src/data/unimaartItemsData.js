/**
 * Curated 5 items per category for Unimaart Market Store
 * User rule: "dont add to much of food items just add the 5 items of each category thats it"
 */

export const UNIMAART_5_ITEMS_PER_CATEGORY = {
  'fruits-veg': [
    {
      id: 'unimaart-fresh-apples',
      name: 'Fresh Red Crisp Farm Apples',
      category: 'fruits-veg',
      categoryLabel: 'Vegetables & Fruit',
      price: 280,
      originalPrice: 320,
      discountPercent: 12,
      tag: '-12%',
      unit: '1kg Pack',
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80',
      description: 'Crisp, sweet, handpicked red apples straight from high-altitude orchards.'
    },
    {
      id: 'unimaart-fresh-mangoes',
      name: 'Sindhri Sweet Aromatic Farm Mangoes',
      category: 'fruits-veg',
      categoryLabel: 'Vegetables & Fruit',
      price: 350,
      originalPrice: 400,
      discountPercent: 12,
      tag: 'FRESH',
      unit: '1kg Box',
      image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80',
      description: 'Naturally ripened, fiberless premium sweet Sindhri mangoes.'
    },
    {
      id: 'unimaart-fresh-bananas',
      name: 'Golden Farm Bananas',
      category: 'fruits-veg',
      categoryLabel: 'Vegetables & Fruit',
      price: 180,
      originalPrice: 200,
      discountPercent: 10,
      tag: '-10%',
      unit: '1 Dozen',
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
      description: 'Rich in potassium, naturally sweet golden bananas.'
    },
    {
      id: 'unimaart-fresh-carrots',
      name: 'Crisp Farm Red Carrots',
      category: 'fruits-veg',
      categoryLabel: 'Vegetables & Fruit',
      price: 120,
      originalPrice: 150,
      discountPercent: 20,
      tag: '-20%',
      unit: '1kg Pack',
      image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80',
      description: 'Juicy, sweet farm-fresh red carrots perfect for salads and cooking.'
    },
    {
      id: 'unimaart-fresh-tomatoes',
      name: 'Ripe Red Farm Tomatoes',
      category: 'fruits-veg',
      categoryLabel: 'Vegetables & Fruit',
      price: 160,
      originalPrice: 190,
      discountPercent: 15,
      tag: '-15%',
      unit: '1kg Pack',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
      description: 'Firm, sun-ripened red tomatoes picked daily at dawn.'
    }
  ],
  'beverages': [
    {
      id: 'unimaart-orange-juice',
      name: 'Valencia Cold-Pressed Orange Juice',
      category: 'beverages',
      categoryLabel: 'Beverages',
      price: 350,
      originalPrice: 400,
      discountPercent: 12,
      tag: '-12%',
      unit: '500ml Bottle',
      image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
      description: 'Cold-pressed Sargodha Valencia oranges, zero artificial sugar or preservatives.'
    },
    {
      id: 'unimaart-coca-cola-15l',
      name: 'Coca-Cola Original Chilled Bottle',
      category: 'beverages',
      categoryLabel: 'Beverages',
      price: 190,
      originalPrice: 200,
      discountPercent: 5,
      tag: '-5%',
      unit: '1.5L Bottle',
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
      description: 'The iconic refreshing cola taste, delivered chilled to your doorstep.'
    },
    {
      id: 'unimaart-pepsi-can',
      name: 'Pepsi Cold Crisp Can',
      category: 'beverages',
      categoryLabel: 'Beverages',
      price: 90,
      originalPrice: 100,
      discountPercent: 10,
      tag: '-10%',
      unit: '250ml Can',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
      description: 'Bold, crisp, refreshing cola can served ice cold.'
    },
    {
      id: 'unimaart-mineral-water',
      name: 'Nestle Pure Life Mineral Water',
      category: 'beverages',
      categoryLabel: 'Beverages',
      price: 110,
      originalPrice: 120,
      discountPercent: 8,
      tag: 'PURE',
      unit: '1.5L Bottle',
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80',
      description: 'Clean, balanced mineral water filtered to highest purity standards.'
    },
    {
      id: 'unimaart-tapal-tea',
      name: 'Tapal Danedar Strong Black Tea',
      category: 'beverages',
      categoryLabel: 'Beverages',
      price: 580,
      originalPrice: 620,
      discountPercent: 6,
      tag: '-6%',
      unit: '450g Pack',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
      description: 'Rich, robust aromatic blend of premium black tea leaves.'
    }
  ],
  'meat-poultry': [
    {
      id: 'unimaart-fresh-chicken-cuts',
      name: 'Farm Fresh Boneless Skinless Chicken',
      category: 'meat-poultry',
      categoryLabel: 'Meats & Seafood',
      price: 590,
      originalPrice: 650,
      discountPercent: 9,
      tag: '-9%',
      unit: '500g Tray',
      image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
      description: 'Tender vacuum-sealed halal fresh chicken breast cuts kept strictly under 3°C.'
    },
    {
      id: 'unimaart-chicken-whole',
      name: 'Fresh Farm Chicken Whole (Cleaned)',
      category: 'meat-poultry',
      categoryLabel: 'Meats & Seafood',
      price: 680,
      originalPrice: 740,
      discountPercent: 8,
      tag: 'HALAL',
      unit: '1kg Whole',
      image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=400&q=80',
      description: '100% fresh skinless cleaned whole broiler chicken prepared daily.'
    },
    {
      id: 'unimaart-beef-keema',
      name: 'Prime Halal Beef Mince (Keema)',
      category: 'meat-poultry',
      categoryLabel: 'Meats & Seafood',
      price: 1150,
      originalPrice: 1250,
      discountPercent: 8,
      tag: '-8%',
      unit: '1kg Tray',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80',
      description: 'Lean, hygienically ground prime veal beef mince.'
    },
    {
      id: 'unimaart-mutton-cuts',
      name: 'Fresh Tender Mutton Mixed Cuts',
      category: 'meat-poultry',
      categoryLabel: 'Meats & Seafood',
      price: 1950,
      originalPrice: 2150,
      discountPercent: 9,
      tag: 'PREMIUM',
      unit: '1kg Pack',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
      description: 'Tender goat mutton cuts with optimal meat-to-bone ratio.'
    },
    {
      id: 'unimaart-sea-prawns',
      name: 'Cleaned Fresh Arabian Sea Prawns',
      category: 'meat-poultry',
      categoryLabel: 'Meats & Seafood',
      price: 1450,
      originalPrice: 1600,
      discountPercent: 9,
      tag: '-9%',
      unit: '500g Tray',
      image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=400&q=80',
      description: 'Freshly caught de-veined medium sea prawns, iced for freshness.'
    }
  ],
  'frozen-foods': [
    {
      id: 'unimaart-kn-nuggets',
      name: "K&N's Crispy Chicken Nuggets",
      category: 'frozen-foods',
      categoryLabel: 'Frozen Foods',
      price: 840,
      originalPrice: 900,
      discountPercent: 7,
      tag: '-7%',
      unit: '500g Family Pack',
      image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=400&q=80',
      description: 'Golden crumb-coated all-breast chicken nuggets, ready in 3 mins.'
    },
    {
      id: 'unimaart-dawn-parathas',
      name: 'Dawn Crisp Multi-Layered Plain Parathas',
      category: 'frozen-foods',
      categoryLabel: 'Frozen Foods',
      price: 360,
      originalPrice: 390,
      discountPercent: 8,
      tag: 'CRISP',
      unit: '5 Pcs Pack',
      image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=400&q=80',
      description: 'Traditional flaky, golden layers. Pan fry straight from freezer.'
    },
    {
      id: 'unimaart-kn-kabab',
      name: "K&N's Shami / Seekh Kabab",
      category: 'frozen-foods',
      categoryLabel: 'Frozen Foods',
      price: 920,
      originalPrice: 990,
      discountPercent: 7,
      tag: '-7%',
      unit: '600g Box',
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=400&q=80',
      description: 'Authentically seasoned grilled chicken seekh kababs.'
    },
    {
      id: 'unimaart-frozen-peas',
      name: 'Garden Fresh Sweet Green Peas',
      category: 'frozen-foods',
      categoryLabel: 'Frozen Foods',
      price: 240,
      originalPrice: 280,
      discountPercent: 14,
      tag: '-14%',
      unit: '500g Pack',
      image: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=400&q=80',
      description: 'IQF flash-frozen sweet tender green peas retaining vibrant color and nutrients.'
    },
    {
      id: 'unimaart-french-fries',
      name: 'Crispy Golden Cut French Fries',
      category: 'frozen-foods',
      categoryLabel: 'Frozen Foods',
      price: 520,
      originalPrice: 580,
      discountPercent: 10,
      tag: '-10%',
      unit: '1kg Bag',
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
      description: 'Evenly cut restaurant-style fries for perfect crispy crunch.'
    }
  ],
  'bakery': [
    {
      id: 'unimaart-dawn-bread-lg',
      name: 'Dawn Fresh White Sliced Bread (Large)',
      category: 'bakery',
      categoryLabel: 'Breakfast',
      price: 180,
      originalPrice: 190,
      discountPercent: 5,
      tag: 'DAILY',
      unit: 'Large Family Loaf',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
      description: 'Pillowy soft enriched white bread baked fresh every morning.'
    },
    {
      id: 'unimaart-croissants-butter',
      name: 'Gourmet All-Butter Flaky Croissants',
      category: 'bakery',
      categoryLabel: 'Breakfast',
      price: 290,
      originalPrice: 320,
      discountPercent: 9,
      tag: '-9%',
      unit: '2 Pcs Box',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
      description: 'French style layered butter pastry with golden crispy exterior.'
    },
    {
      id: 'unimaart-burger-buns',
      name: 'Dawn Soft Sesame Seed Burger Buns',
      category: 'bakery',
      categoryLabel: 'Breakfast',
      price: 150,
      originalPrice: 160,
      discountPercent: 6,
      tag: 'FRESH',
      unit: '4 Pcs Pack',
      image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&q=80',
      description: 'Ultra-soft toasted sesame topped buns for juicy homemade burgers.'
    },
    {
      id: 'unimaart-milky-bread',
      name: 'Gourmet Sweet Milky Sandwich Bread',
      category: 'bakery',
      categoryLabel: 'Breakfast',
      price: 195,
      originalPrice: 210,
      discountPercent: 7,
      tag: '-7%',
      unit: 'Regular Loaf',
      image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=400&q=80',
      description: 'Sweet, enriched milky loaf perfect with morning chai.'
    },
    {
      id: 'unimaart-quaker-oats',
      name: 'Quaker Whole Grain Breakfast Oats',
      category: 'bakery',
      categoryLabel: 'Breakfast',
      price: 480,
      originalPrice: 520,
      discountPercent: 8,
      tag: 'HEALTHY',
      unit: '500g Pouch',
      image: 'https://images.unsplash.com/photo-1584365685547-9a5fb6f3a70c?auto=format&fit=crop&w=400&q=80',
      description: '100% whole grain rolled oats for heart-healthy high-fiber breakfast.'
    }
  ],
  'pet-food': [
    {
      id: 'unimaart-whiskas-cat',
      name: 'Whiskas Ocean Fish Adult Cat Food',
      category: 'pet-food',
      categoryLabel: 'Pet Food',
      price: 1350,
      originalPrice: 1450,
      discountPercent: 7,
      tag: '-7%',
      unit: '1.2kg Bag',
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80',
      description: 'Complete nutritional formula with real ocean fish, rich in Omega 3 & 6.'
    },
    {
      id: 'unimaart-pedigree-dog',
      name: 'Pedigree Chicken & Veg Adult Dog Food',
      category: 'pet-food',
      categoryLabel: 'Pet Food',
      price: 1420,
      originalPrice: 1550,
      discountPercent: 8,
      tag: '-8%',
      unit: '1.2kg Bag',
      image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=400&q=80',
      description: 'Wholesome nutrition with 37 essential nutrients for active dogs.'
    },
    {
      id: 'unimaart-me-o-treats',
      name: 'Me-O Creamy Tuna Cat Treats',
      category: 'pet-food',
      categoryLabel: 'Pet Food',
      price: 280,
      originalPrice: 320,
      discountPercent: 12,
      tag: '-12%',
      unit: '4 Pcs Sachet',
      image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=400&q=80',
      description: 'Lickable creamy puree snack made with genuine tuna meat.'
    },
    {
      id: 'unimaart-royal-canin',
      name: 'Royal Canin Digestive Care Formula',
      category: 'pet-food',
      categoryLabel: 'Pet Food',
      price: 2450,
      originalPrice: 2650,
      discountPercent: 8,
      tag: 'PREMIUM',
      unit: '1kg Bag',
      image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
      description: 'Vet-recommended specialized formula for sensitive pet digestion.'
    },
    {
      id: 'unimaart-drools-pet',
      name: 'Drools 100% Complete Nutrition Kibble',
      category: 'pet-food',
      categoryLabel: 'Pet Food',
      price: 1100,
      originalPrice: 1200,
      discountPercent: 8,
      tag: '-8%',
      unit: '1.5kg Bag',
      image: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=400&q=80',
      description: 'Clean chicken protein and essential minerals for healthy coat and teeth.'
    }
  ],
  'dairy-eggs': [
    {
      id: 'unimaart-eggs-carton',
      name: 'Fresh Farm Golden Desi Eggs (12 Pcs Box)',
      category: 'dairy-eggs',
      categoryLabel: 'Milk & Dairies',
      price: 420,
      originalPrice: 490,
      discountPercent: 14,
      tag: '-14%',
      unit: '12 Pcs Box',
      image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=400&q=80',
      description: 'Golden-yolk farm eggs collected at dawn and packed in biodegradable protective carton.'
    },
    {
      id: 'unimaart-fresh-milk-twin',
      name: 'Pure Raw Cow Milk Chilled Bottles (1L x 2)',
      category: 'dairy-eggs',
      categoryLabel: 'Milk & Dairies',
      price: 260,
      originalPrice: 300,
      discountPercent: 13,
      tag: 'FRESH',
      unit: 'Twin 1L Bottles',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
      description: 'Non-homogenized pure cow milk delivered chilled straight from organic dairy farm.'
    },
    {
      id: 'unimaart-olpers-milk',
      name: "Olper's Full Cream UHT Milk",
      category: 'dairy-eggs',
      categoryLabel: 'Milk & Dairies',
      price: 290,
      originalPrice: 300,
      discountPercent: 3,
      tag: 'PURE',
      unit: '1L Tetra Pak',
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80',
      description: 'Rich, wholesome pure dairy milk packed under highest aseptic standards.'
    },
    {
      id: 'unimaart-milkpak-1l',
      name: 'Nestle MilkPak Full Cream Milk',
      category: 'dairy-eggs',
      categoryLabel: 'Milk & Dairies',
      price: 290,
      originalPrice: 300,
      discountPercent: 3,
      tag: 'DAIRY',
      unit: '1L Tetra Pak',
      image: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=400&q=80',
      description: 'The golden standard of Pakistani dairy, rich in calcium and vitamin D.'
    },
    {
      id: 'unimaart-nurpur-butter',
      name: 'Nurpur Pure Creamery Salted Butter',
      category: 'dairy-eggs',
      categoryLabel: 'Milk & Dairies',
      price: 380,
      originalPrice: 420,
      discountPercent: 10,
      tag: '-10%',
      unit: '200g Block',
      image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80',
      description: 'Churned from fresh cow milk cream with a delicate touch of salt.'
    }
  ],
  'snacks': [
    {
      id: 'unimaart-lays-classic',
      name: "Lay's Classic Salted Potato Chips",
      category: 'snacks',
      categoryLabel: 'Snacks & Munchies',
      price: 100,
      originalPrice: 100,
      discountPercent: 0,
      tag: 'POPULAR',
      unit: '65g Pouch',
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
      description: 'Crisp golden thinly sliced potato chips dusted with pure sea salt.'
    },
    {
      id: 'unimaart-lays-wavy',
      name: "Lay's Wavy Flavour Masala Potato Chips",
      category: 'snacks',
      categoryLabel: 'Snacks & Munchies',
      price: 100,
      originalPrice: 100,
      discountPercent: 0,
      tag: 'SPICY',
      unit: '65g Pouch',
      image: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=400&q=80',
      description: 'Deep ridged wavy potato chips packed with bold aromatic Pakistani spices.'
    },
    {
      id: 'unimaart-oreo-original',
      name: 'Oreo Original Cream Sandwich Cookies',
      category: 'snacks',
      categoryLabel: 'Snacks & Munchies',
      price: 120,
      originalPrice: 130,
      discountPercent: 8,
      tag: '-8%',
      unit: '120g Roll',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
      description: 'Rich dark chocolate cookies filled with smooth sweet vanilla cream.'
    },
    {
      id: 'unimaart-kurkure-chilli',
      name: 'Kurkure Red Chilli Chatpata Crunch',
      category: 'snacks',
      categoryLabel: 'Snacks & Munchies',
      price: 90,
      originalPrice: 100,
      discountPercent: 10,
      tag: '-10%',
      unit: '75g Pack',
      image: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=400&q=80',
      description: 'Crunchy corn puff curls bursting with spicy tangy masala.'
    },
    {
      id: 'unimaart-cadbury-silk',
      name: 'Cadbury Dairy Milk Silk Chocolate',
      category: 'snacks',
      categoryLabel: 'Snacks & Munchies',
      price: 250,
      originalPrice: 280,
      discountPercent: 11,
      tag: '-11%',
      unit: '60g Bar',
      image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
      description: 'Ultra-smooth, velvety milk chocolate that melts luxuriously in mouth.'
    }
  ],
  'grocery-staples': [
    {
      id: 'unimaart-basmati-rice',
      name: 'Super Kernel Basmati Rice (5kg Bag)',
      category: 'grocery-staples',
      categoryLabel: 'Grocery Staples',
      price: 1850,
      originalPrice: 2000,
      discountPercent: 8,
      tag: '-8%',
      unit: '5kg Cloth Bag',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
      description: 'Aged long-grain aromatic Pakistani Basmati rice for royal biryani.'
    },
    {
      id: 'unimaart-dalda-oil',
      name: 'Dalda Supreme Pure Cooking Oil',
      category: 'grocery-staples',
      categoryLabel: 'Grocery Staples',
      price: 540,
      originalPrice: 570,
      discountPercent: 5,
      tag: 'PURE',
      unit: '1L Bottle',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
      description: 'Triple refined healthy cooking oil fortified with Vitamins A, D & E.'
    },
    {
      id: 'unimaart-dalda-ghee',
      name: 'Dalda Pure Banaspati Ghee Pouch',
      category: 'grocery-staples',
      categoryLabel: 'Grocery Staples',
      price: 560,
      originalPrice: 590,
      discountPercent: 5,
      tag: 'TRADITIONAL',
      unit: '1kg Pouch',
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
      description: 'Rich grainy texture and unforgettable traditional Pakistani aroma.'
    },
    {
      id: 'unimaart-shangrila-ketchup',
      name: 'Shangrila Pure Tomato Ketchup Pouch',
      category: 'grocery-staples',
      categoryLabel: 'Grocery Staples',
      price: 320,
      originalPrice: 350,
      discountPercent: 9,
      tag: '-9%',
      unit: '800g Stand-up Pouch',
      image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
      description: 'Thick, sweet and tangy tomato ketchup made from red farm tomatoes.'
    },
    {
      id: 'unimaart-national-salt',
      name: 'National Iodized Pure Table Salt',
      category: 'grocery-staples',
      categoryLabel: 'Grocery Staples',
      price: 70,
      originalPrice: 80,
      discountPercent: 12,
      tag: 'DAILY',
      unit: '800g Pack',
      image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=400&q=80',
      description: 'Hygienically refined iodized free-flowing table salt.'
    }
  ]
};

/**
 * Returns strictly 5 items for a category
 */
export const get5ItemsForCategory = (catId = 'fruits-veg') => {
  if (catId === 'all') {
    // 5 top picks across primary categories
    return [
      UNIMAART_5_ITEMS_PER_CATEGORY['fruits-veg'][0],
      UNIMAART_5_ITEMS_PER_CATEGORY['beverages'][0],
      UNIMAART_5_ITEMS_PER_CATEGORY['meat-poultry'][0],
      UNIMAART_5_ITEMS_PER_CATEGORY['frozen-foods'][0],
      UNIMAART_5_ITEMS_PER_CATEGORY['dairy-eggs'][0]
    ];
  }

  const items = UNIMAART_5_ITEMS_PER_CATEGORY[catId];
  if (items && items.length > 0) {
    return items.slice(0, 5);
  }

  // Fallback to fruits-veg
  return UNIMAART_5_ITEMS_PER_CATEGORY['fruits-veg'].slice(0, 5);
};
