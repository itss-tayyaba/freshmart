// FreshMart Admin Suite - Comprehensive Data Models for 11 Modules

export const ADMIN_PRODUCTS_DATA = [
  {
    id: 'PRD-001',
    name: 'Banana 1Kg',
    category: 'Fruits & Vegetables',
    price: 180,
    stock: 120,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'PRD-002',
    name: "Olpers Milk 1L",
    category: 'Dairy & Eggs',
    price: 210,
    stock: 85,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'PRD-003',
    name: 'Basmati Rice 5kg',
    category: 'Groceries',
    price: 1250,
    stock: 60,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'PRD-004',
    name: 'Eggs (30 Pcs)',
    category: 'Dairy & Eggs',
    price: 450,
    stock: 40,
    status: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'PRD-005',
    name: 'Chicken 1kg',
    category: 'Meat & Poultry',
    price: 890,
    stock: 45,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'PRD-006',
    name: 'Tomatoes 1kg',
    category: 'Fruits & Vegetables',
    price: 110,
    stock: 110,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'PRD-007',
    name: 'Dalda Cooking Oil 1L',
    category: 'Grocery Staples',
    price: 450,
    stock: 0,
    status: 'Out of Stock',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'PRD-008',
    name: 'Lays Classic 104g',
    category: 'Snacks & Munchies',
    price: 210,
    stock: 140,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=200&q=80'
  }
];

export const ADMIN_CATEGORIES_DATA = [
  { id: 1, name: 'Fruits & Vegetables', productCount: 242, image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80' },
  { id: 2, name: 'Dairy & Eggs', productCount: 190, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80' },
  { id: 3, name: 'Meat & Poultry', productCount: 156, image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=300&q=80' },
  { id: 4, name: 'Bakery', productCount: 184, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80' },
  { id: 5, name: 'Beverages', productCount: 120, image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=300&q=80' },
  { id: 6, name: 'Snacks & Munchies', productCount: 290, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80' },
  { id: 7, name: 'Grocery Staples', productCount: 310, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80' },
  { id: 8, name: 'Home & Kitchen', productCount: 180, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=300&q=80' },
  { id: 9, name: 'Personal Care', productCount: 135, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80' },
  { id: 10, name: 'Baby Care', productCount: 75, image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=300&q=80' },
  { id: 11, name: 'Pet Care', productCount: 54, image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300&q=80' },
  { id: 12, name: 'Frozen Foods', productCount: 96, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80' }
];

export const ADMIN_ORDERS_FULL = [];

export const ADMIN_CUSTOMERS_DATA = [
  {
    id: 'CUST-001',
    name: 'Hafsa',
    email: 'hafsa@gmail.com',
    phone: '0300-1234567',
    address: 'House 12, Street 4, Johar Town, Lahore',
    totalOrders: 0,
    totalSpent: 'Rs. 0',
    status: 'Active',
    joinedDate: '2026-09-01'
  },
  {
    id: 'CUST-002',
    name: 'Aimen',
    email: 'aimen@gmail.com',
    phone: '0321-7654321',
    address: 'Gulberg III, Main Boulevard, Lahore, Pakistan',
    totalOrders: 0,
    totalSpent: 'Rs. 0',
    status: 'Active',
    joinedDate: '2026-09-03'
  }
];

export const ADMIN_INVENTORY_ITEMS = [];

export const ADMIN_SUPPLIERS_DATA = [
  {
    id: 'SUP-101',
    supplierId: 'SUP-101',
    name: 'Tayyab (Coca-Cola Beverages)',
    contact: 'Tayyab',
    phone: '0300-8765432',
    email: 'tayyab.cocacola@freshmart.pk',
    category: 'Beverages, Juices & Soft Drinks',
    company: 'Coca-Cola Beverages Pakistan Ltd',
    username: 'tayyab',
    password: 'cocacola123',
    status: 'Active',
    joinedDate: '2026-08-15',
    productsSupplied: 'Coca-Cola, Sprite, Fanta, Fuze Tea, Dasani'
  }
];

export const ADMIN_PROMOTIONS_DATA = [
  {
    id: 'PROMO-1',
    code: 'FLASH30',
    title: 'Weekend Flash Sale',
    discountType: 'percentage',
    discountAmount: 30,
    minOrder: 1000,
    maxDiscount: 500,
    startDate: '2026-08-01',
    endDate: '2026-12-31',
    usageLimit: 200,
    usedCount: 42,
    discount: '30% OFF',
    validity: 'Valid: 1 Aug - 31 Dec 2026',
    category: 'Flash Sales',
    status: 'Active',
    bannerImg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'PROMO-2',
    code: 'VEG20',
    title: 'Farm Fresh Vegetables Promo',
    discountType: 'percentage',
    discountAmount: 20,
    minOrder: 800,
    maxDiscount: 300,
    startDate: '2026-08-15',
    endDate: '2026-11-30',
    usageLimit: 150,
    usedCount: 28,
    discount: '20% OFF',
    validity: 'Valid: 15 Aug - 30 Nov 2026',
    category: 'Coupons',
    status: 'Active',
    bannerImg: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'PROMO-3',
    code: 'FRESH100',
    title: 'Flat Rs. 100 Grocery Voucher',
    discountType: 'fixed',
    discountAmount: 100,
    minOrder: 1500,
    maxDiscount: 100,
    startDate: '2026-08-01',
    endDate: '2026-12-31',
    usageLimit: 100,
    usedCount: 65,
    discount: 'Rs. 100 OFF',
    validity: 'Valid: 1 Aug - 31 Dec 2026',
    category: 'Coupons',
    status: 'Active',
    bannerImg: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'PROMO-4',
    code: 'FREESHIP',
    title: 'Free Express Doorstep Delivery',
    discountType: 'free_shipping',
    discountAmount: 0,
    minOrder: 1200,
    maxDiscount: 0,
    startDate: '2026-08-01',
    endDate: '2026-12-31',
    usageLimit: 500,
    usedCount: 118,
    discount: 'Free Delivery',
    validity: 'Valid: 1 Aug - 31 Dec 2026',
    category: 'Bundles',
    status: 'Active',
    bannerImg: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80'
  }
];

export const ADMIN_DELIVERIES_DATA = [];

export const ADMIN_REPORTS_BEHAVIOR = [
  { label: 'Most Viewed', count: '12,650' },
  { label: 'Most Added to Cart', count: '8,940' },
  { label: 'Most Purchased', count: '6,532' },
  { label: 'Most Wishlisted', count: '4,210' },
  { label: 'Most Shared', count: '1,230' }
];

// =========================================================================
// 📊 REPORTS & ANALYTICS: 5 KEY KPIS & 8 ADVANCED CHARTS DATA MODELS
// =========================================================================

// 5 Top Executive KPI Metrics
export const ADMIN_ANALYTICS_KPIS = {
  todaySales: {
    amount: 482500,
    formatted: 'Rs. 482,500',
    growth: '+15.2%',
    subtitle: 'vs yesterday (Rs. 418,800)'
  },
  orders: {
    count: 327,
    formatted: '327',
    growth: '+8.4%',
    subtitle: '99.4% Fulfillment SLA'
  },
  customers: {
    count: 1842,
    formatted: '1,842',
    growth: '+12.6%',
    subtitle: 'Active registered shoppers'
  },
  products: {
    count: 8420,
    formatted: '8,420',
    growth: '+140 new',
    subtitle: 'Across 12 catalog categories'
  },
  lowStock: {
    count: 43,
    formatted: '43',
    growth: 'Action Required',
    subtitle: 'Items below restock threshold'
  }
};

// 1. Daily Sales Chart
export const ADMIN_DAILY_SALES_CHART = [
  { day: 'Mon', date: '01 Sep', sales: 412000, orders: 284, aov: 1450 },
  { day: 'Tue', date: '02 Sep', sales: 438500, orders: 298, aov: 1471 },
  { day: 'Wed', date: '03 Sep', sales: 395000, orders: 275, aov: 1436 },
  { day: 'Thu', date: '04 Sep', sales: 456200, orders: 312, aov: 1462 },
  { day: 'Fri', date: '05 Sep', sales: 512000, orders: 348, aov: 1471 },
  { day: 'Sat', date: '06 Sep', sales: 548900, orders: 372, aov: 1475 },
  { day: 'Sun (Today)', date: '07 Sep', sales: 482500, orders: 327, aov: 1475 }
];

// 2. Monthly Sales Chart
export const ADMIN_MONTHLY_SALES_CHART = [
  { month: 'Jan', revenue: 8420000, orders: 5820, target: 8000000 },
  { month: 'Feb', revenue: 9150000, orders: 6240, target: 8500000 },
  { month: 'Mar', revenue: 10400000, orders: 7100, target: 9500000 },
  { month: 'Apr', revenue: 11250000, orders: 7650, target: 10000000 },
  { month: 'May', revenue: 9800000, orders: 6720, target: 9500000 },
  { month: 'Jun', revenue: 10300000, orders: 7050, target: 10000000 },
  { month: 'Jul', revenue: 10900000, orders: 7420, target: 10500000 },
  { month: 'Aug', revenue: 11850000, orders: 8100, target: 11000000 },
  { month: 'Sep (Current)', revenue: 12450000, orders: 8520, target: 11500000 },
  { month: 'Oct (Proj)', revenue: 12900000, orders: 8850, target: 12000000 },
  { month: 'Nov (Proj)', revenue: 13500000, orders: 9200, target: 12500000 },
  { month: 'Dec (Proj)', revenue: 14800000, orders: 10100, target: 13500000 }
];

// 3. Best-Selling Products Chart
export const ADMIN_BEST_SELLING_PRODUCTS = [
  { rank: 1, name: 'Farm Fresh Banana 1Kg', category: 'Fruits & Vegetables', unitsSold: 1420, revenue: 255600, share: 24, image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=120&q=80' },
  { rank: 2, name: 'Olpers Full Cream Milk 1L', category: 'Dairy & Eggs', unitsSold: 1180, revenue: 247800, share: 22, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=120&q=80' },
  { rank: 3, name: 'Organic Red Tomatoes 1Kg', category: 'Fruits & Vegetables', unitsSold: 1150, revenue: 126500, share: 18, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=120&q=80' },
  { rank: 4, name: 'Farm Fresh Eggs (30 Pcs)', category: 'Dairy & Eggs', unitsSold: 890, revenue: 400500, share: 16, image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=120&q=80' },
  { rank: 5, name: 'Premium Basmati Rice 5kg', category: 'Groceries', unitsSold: 540, revenue: 675000, share: 12, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=120&q=80' },
  { rank: 6, name: 'Coca-Cola Can 250ml (Pack of 6)', category: 'Beverages', unitsSold: 460, revenue: 276000, share: 8, image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=120&q=80' }
];

// 4. Most Profitable Products Chart
export const ADMIN_MOST_PROFITABLE_PRODUCTS = [
  { name: 'Organic Saffron Honey 500g', revenue: 385000, cost: 185000, profit: 200000, margin: 51.9, category: 'Organic Essentials' },
  { name: 'Extra Virgin Olive Oil 1L', revenue: 495000, cost: 260000, profit: 235000, margin: 47.5, category: 'Gourmet Pantry' },
  { name: 'Imported Roasted Almonds 500g', revenue: 340000, cost: 185000, profit: 155000, margin: 45.6, category: 'Dry Fruits' },
  { name: 'Fresh Boneless Mutton 1Kg', revenue: 780000, cost: 440000, profit: 340000, margin: 43.6, category: 'Cold-Chain Meat' },
  { name: 'Artisan Sourdough Bakery Loaf', revenue: 210000, cost: 120000, profit: 90000, margin: 42.8, category: 'Fresh Bakery' },
  { name: 'Desi Pure Butter 500g', revenue: 310000, cost: 185000, profit: 125000, margin: 40.3, category: 'Pure Dairy' }
];

// 5. Branch Performance Chart
export const ADMIN_BRANCH_PERFORMANCE = [
  { branch: 'Gulberg Flagship Hub', city: 'Lahore', sales: 168500, orders: 114, share: 34.9, onTimeRate: 99.6, rating: 4.9, color: '#10b981' },
  { branch: 'DHA Phase 5 Express', city: 'Lahore', sales: 132400, orders: 89, share: 27.4, onTimeRate: 99.2, rating: 4.9, color: '#3b82f6' },
  { branch: 'Johar Town Central Hub', city: 'Lahore', sales: 94800, orders: 66, share: 19.6, onTimeRate: 98.8, rating: 4.8, color: '#f59e0b' },
  { branch: 'Bahria Town Sector C', city: 'Lahore', sales: 52600, orders: 36, share: 10.9, onTimeRate: 99.0, rating: 4.8, color: '#8b5cf6' },
  { branch: 'Islamabad F-7 Store', city: 'Islamabad', sales: 34200, orders: 22, share: 7.2, onTimeRate: 99.4, rating: 5.0, color: '#ec4899' }
];

// 6. Customer Growth Chart
export const ADMIN_CUSTOMER_GROWTH_CHART = [
  { month: 'Apr', total: 1120, newCustomers: 180, returning: 940, rate: '+19.1%' },
  { month: 'May', total: 1290, newCustomers: 210, returning: 1080, rate: '+15.2%' },
  { month: 'Jun', total: 1460, newCustomers: 235, returning: 1225, rate: '+13.2%' },
  { month: 'Jul', total: 1620, newCustomers: 260, returning: 1360, rate: '+11.0%' },
  { month: 'Aug', total: 1740, newCustomers: 275, returning: 1465, rate: '+7.4%' },
  { month: 'Sep (Current)', total: 1842, newCustomers: 310, returning: 1532, rate: '+12.6%' }
];

// 7. Cancelled Orders Analytics
export const ADMIN_CANCELLED_ORDERS_ANALYTICS = {
  totalOrders: 327,
  cancelledCount: 7,
  cancellationRate: '2.1%',
  reasons: [
    { reason: 'Customer Changed Mind', count: 3, pct: 42.8, color: '#3b82f6' },
    { reason: 'Item Temporarily Out of Stock', count: 2, pct: 28.6, color: '#f59e0b' },
    { reason: 'Delivery Address Inaccessible / Wrong Pin', count: 1, pct: 14.3, color: '#8b5cf6' },
    { reason: 'Customer Delay in Payment Confirmation', count: 1, pct: 14.3, color: '#ef4444' }
  ]
};

// 8. Delivery Performance Chart
export const ADMIN_DELIVERY_PERFORMANCE = {
  avgDeliveryTime: '13.8 Mins',
  onTimeRate: '99.4%',
  fleetActive: 28,
  totalDeliveriesToday: 327,
  slaBreakdown: [
    { bucket: '< 15 Mins (Express Cold-Chain)', count: 248, pct: 75.8, color: '#10b981' },
    { bucket: '15 - 25 Mins (Standard)', count: 68, pct: 20.8, color: '#3b82f6' },
    { bucket: '25 - 40 Mins (Peak Traffic)', count: 9, pct: 2.8, color: '#f59e0b' },
    { bucket: '> 40 Mins (Delayed / Rescheduled)', count: 2, pct: 0.6, color: '#ef4444' }
  ]
};
