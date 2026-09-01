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

export const ADMIN_ORDERS_FULL = [
  {
    id: '#ORD1248',
    customer: 'Ayesha Khan',
    items: '4 Items',
    total: 2450,
    status: 'Delivered',
    statusClass: 'bg-emerald-100 text-emerald-800',
    payment: 'Cash',
    time: '10:24 AM'
  },
  {
    id: '#ORD1247',
    customer: 'Ali Raza',
    items: '2 Items',
    total: 1230,
    status: 'Out for Delivery',
    statusClass: 'bg-amber-100 text-amber-800',
    payment: 'Card',
    time: '09:42 AM'
  },
  {
    id: '#ORD1246',
    customer: 'Sara Khan',
    items: '6 Items',
    total: 3780,
    status: 'Preparing',
    statusClass: 'bg-blue-100 text-blue-800',
    payment: 'Cash',
    time: '09:15 AM'
  },
  {
    id: '#ORD1245',
    customer: 'Umar Ahmed',
    items: '1 Item',
    total: 890,
    status: 'Confirmed',
    statusClass: 'bg-indigo-100 text-indigo-800',
    payment: 'Wallet',
    time: '08:50 AM'
  },
  {
    id: '#ORD1244',
    customer: 'Hina Ali',
    items: '3 Items',
    total: 2120,
    status: 'Delivered',
    statusClass: 'bg-emerald-100 text-emerald-800',
    payment: 'Card',
    time: '08:20 AM'
  },
  {
    id: '#ORD1243',
    customer: 'Fahad Saeed',
    items: '2 Items',
    total: 950,
    status: 'Cancelled',
    statusClass: 'bg-rose-100 text-rose-800',
    payment: 'Cash',
    time: '07:45 AM'
  },
  {
    id: '#ORD1242',
    customer: 'Iqra Ahmed',
    items: '5 Items',
    total: 1580,
    status: 'Preparing',
    statusClass: 'bg-blue-100 text-blue-800',
    payment: 'Card',
    time: '07:12 AM'
  }
];

export const ADMIN_CUSTOMERS_DATA = [
  {
    id: 'CUST-01',
    name: 'Ayesha Khan',
    email: 'ayesha@gmail.com',
    phone: '0300-1234567',
    totalOrders: 12,
    totalSpent: 'Rs. 24,500',
    status: 'Active'
  },
  {
    id: 'CUST-02',
    name: 'Ali Raza',
    email: 'ali@gmail.com',
    phone: '0321-9876543',
    totalOrders: 8,
    totalSpent: 'Rs. 14,200',
    status: 'Active'
  },
  {
    id: 'CUST-03',
    name: 'Sara Khan',
    email: 'sara@gmail.com',
    phone: '0333-4567890',
    totalOrders: 15,
    totalSpent: 'Rs. 38,900',
    status: 'Active'
  },
  {
    id: 'CUST-04',
    name: 'Umar Ahmed',
    email: 'umar@gmail.com',
    phone: '0345-7890123',
    totalOrders: 4,
    totalSpent: 'Rs. 6,800',
    status: 'Active'
  },
  {
    id: 'CUST-05',
    name: 'Hina Ali',
    email: 'hina@gmail.com',
    phone: '0315-6789012',
    totalOrders: 6,
    totalSpent: 'Rs. 11,400',
    status: 'Active'
  },
  {
    id: 'CUST-06',
    name: 'Fahad Saeed',
    email: 'fahad@gmail.com',
    phone: '0301-2345678',
    totalOrders: 9,
    totalSpent: 'Rs. 18,300',
    status: 'Active'
  },
  {
    id: 'CUST-07',
    name: 'Iqra Ahmed',
    email: 'iqra@gmail.com',
    phone: '0312-3456789',
    totalOrders: 3,
    totalSpent: 'Rs. 4,950',
    status: 'Active'
  }
];

export const ADMIN_INVENTORY_ITEMS = [
  { id: 1, name: 'Banana 1kg', category: 'Fruits & Vegetables', stock: 120, minStock: 20, status: 'In Stock', badge: 'bg-emerald-100 text-emerald-800' },
  { id: 2, name: 'Olpers Milk 1L', category: 'Dairy & Eggs', stock: 8, minStock: 30, status: 'Low Stock', badge: 'bg-amber-100 text-amber-800' },
  { id: 3, name: 'Eggs (30 Pcs)', category: 'Dairy & Eggs', stock: 4, minStock: 15, status: 'Critical', badge: 'bg-rose-100 text-rose-800' },
  { id: 4, name: 'Chicken 1kg', category: 'Meat & Poultry', stock: 45, minStock: 15, status: 'In Stock', badge: 'bg-emerald-100 text-emerald-800' },
  { id: 5, name: 'Bread', category: 'Bakery', stock: 0, minStock: 10, status: 'Out of Stock', badge: 'bg-rose-100 text-rose-800' }
];

export const ADMIN_SUPPLIERS_DATA = [
  { id: 'SUP-01', name: 'Al-Noor Foods', contact: 'Ahmed Raza', phone: '0300-1234567', email: 'info@alnoor.com', status: 'Active' },
  { id: 'SUP-02', name: 'Fresh Farm', contact: 'Sara Khan', phone: '0321-9876543', email: 'sales@freshfarm.com', status: 'Active' },
  { id: 'SUP-03', name: 'Dairy Pure', contact: 'Usman Ali', phone: '0333-4567890', email: 'orders@dairypure.com', status: 'Active' },
  { id: 'SUP-04', name: 'Sunrise Bakery', contact: 'Fahad Ahmed', phone: '0345-7890123', email: 'orders@sunrise.com', status: 'Active' },
  { id: 'SUP-05', name: 'Global Foods', contact: 'Hassan Raza', phone: '0315-6789012', email: 'info@globalfoods.com', status: 'Active' }
];

export const ADMIN_PROMOTIONS_DATA = [
  {
    id: 1,
    title: 'Weekend Flash Sale',
    discount: 'Up to 30% OFF',
    validity: 'Valid: 28 - 30 Aug 2026',
    category: 'Flash Sales',
    status: 'Active',
    bannerImg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 2,
    title: 'Fresh Fruits Discount',
    discount: '20% OFF',
    validity: 'Valid: 25 - 31 Aug 2026',
    category: 'Coupons',
    status: 'Active',
    bannerImg: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 3,
    title: 'Buy 2 Get 1 Free',
    discount: 'Snacks & Beverages',
    validity: 'Valid: 20 - 28 Aug 2026',
    category: 'Bundles',
    status: 'Active',
    bannerImg: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80'
  }
];

export const ADMIN_DELIVERIES_DATA = [
  {
    id: '#ORD1248',
    customer: 'Ayesha Khan',
    rider: 'Rider Ali',
    riderPhone: '+92 301 1234567',
    status: 'Out for Delivery',
    eta: '12 mins',
    statusClass: 'bg-amber-100 text-amber-800'
  },
  {
    id: '#ORD1247',
    customer: 'Ali Raza',
    rider: 'Rider Sami',
    riderPhone: '+92 302 9876543',
    status: 'Picked Up',
    eta: '18 mins',
    statusClass: 'bg-blue-100 text-blue-800'
  },
  {
    id: '#ORD1246',
    customer: 'Sara Khan',
    rider: 'Rider Farhan',
    riderPhone: '+92 303 4567890',
    status: 'On the Way',
    eta: '25 mins',
    statusClass: 'bg-emerald-100 text-emerald-800'
  },
  {
    id: '#ORD1245',
    customer: 'Umar Ahmed',
    rider: 'Rider Usman',
    riderPhone: '+92 304 7890123',
    status: 'Preparing',
    eta: '30 mins',
    statusClass: 'bg-purple-100 text-purple-800'
  },
  {
    id: '#ORD1244',
    customer: 'Hina Ali',
    rider: 'Rider Bilal',
    riderPhone: '+92 305 6789012',
    status: 'Preparing',
    eta: '35 mins',
    statusClass: 'bg-purple-100 text-purple-800'
  },
  {
    id: '#ORD1243',
    customer: 'Fahad Saeed',
    rider: 'Rider Ahmad',
    riderPhone: '+92 306 2345678',
    status: 'Assigned',
    eta: '--',
    statusClass: 'bg-slate-100 text-slate-800'
  }
];

export const ADMIN_REPORTS_BEHAVIOR = [
  { label: 'Most Viewed', count: '12,650' },
  { label: 'Most Added to Cart', count: '8,940' },
  { label: 'Most Purchased', count: '6,532' },
  { label: 'Most Wishlisted', count: '4,210' },
  { label: 'Most Shared', count: '1,230' }
];
