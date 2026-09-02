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

export const ADMIN_CUSTOMERS_DATA = [];

export const ADMIN_INVENTORY_ITEMS = [];

export const ADMIN_SUPPLIERS_DATA = [];

export const ADMIN_PROMOTIONS_DATA = [
  {
    id: 'PROMO-1',
    title: 'Weekend Flash Sale',
    discount: '30% OFF',
    validity: 'Valid: 28 - 30 Aug 2026',
    category: 'Flash Sales',
    status: 'Active',
    bannerImg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    code: 'FLASH30'
  },
  {
    id: 'PROMO-2',
    title: 'Farm Fresh Vegetables',
    discount: '20% OFF',
    validity: 'Valid: 25 - 31 Aug 2026',
    category: 'Coupons',
    status: 'Active',
    bannerImg: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
    code: 'VEG20'
  },
  {
    id: 'PROMO-3',
    title: 'Buy 2 Get 1 Free',
    discount: 'Snacks & Beverages',
    validity: 'Valid: 20 - 28 Aug 2026',
    category: 'Bundles',
    status: 'Active',
    bannerImg: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
    code: 'BUNDLE1'
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
