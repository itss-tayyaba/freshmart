export const parseRouteFromUrl = (productsList = []) => {
  if (typeof window === 'undefined') return { page: 'home', product: null, category: null };
  const path = (window.location.pathname || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase();
  const search = window.location.search || '';
  const searchParams = new URLSearchParams(search);

  // 0. Dedicated Login Route (Staff, Rider, Admin, Super Admin Login Console)
  if (
    path === '/login' ||
    path.startsWith('/login') ||
    path.startsWith('/signin') ||
    path.startsWith('/staff-login') ||
    path.startsWith('/portal-login') ||
    hash === '#login' ||
    hash === '#signin' ||
    searchParams.get('page') === 'login' ||
    searchParams.get('portal') === 'login'
  ) {
    const roleParam = searchParams.get('role') || searchParams.get('portal') || null;
    return { page: 'login', role: roleParam, product: null, category: null };
  }

  // 0. Dedicated Pickup Staff Portal Route (Can open directly in another tab)
  if (
    path.startsWith('/pickup-staff') ||
    path.startsWith('/staff') ||
    path.startsWith('/packing') ||
    hash === '#pickup-staff' ||
    hash === '#staff' ||
    hash === '#packing' ||
    searchParams.get('portal') === 'pickup-staff' ||
    searchParams.get('portal') === 'pickup_staff' ||
    searchParams.get('portal') === 'staff' ||
    searchParams.get('role') === 'pickup_staff' ||
    searchParams.get('page') === 'pickup-staff'
  ) {
    return { page: 'pickup-staff', role: 'pickup_staff', product: null, category: null };
  }

  // 1. Delivery / Rider Portal Route (Can open directly in another tab)
  if (
    path.startsWith('/delivery-portal') ||
    path.startsWith('/rider-portal') ||
    path.startsWith('/rider') ||
    path.startsWith('/courier') ||
    hash === '#delivery-portal' ||
    hash === '#rider-portal' ||
    hash === '#rider' ||
    searchParams.get('portal') === 'rider' ||
    searchParams.get('portal') === 'delivery' ||
    searchParams.get('role') === 'rider' ||
    searchParams.get('page') === 'rider-portal' ||
    searchParams.get('page') === 'delivery-portal'
  ) {
    return { page: 'delivery-portal', role: 'rider', product: null, category: null };
  }

  // 2. Admin & Vendor Dashboards
  if (path.startsWith('/admin') || hash === '#admin' || searchParams.get('portal') === 'admin' || searchParams.get('role') === 'admin' || search.includes('admin')) {
    return { page: 'admin', role: 'admin', product: null, category: null };
  }
  if (path.startsWith('/vendor') || hash === '#vendor' || searchParams.get('portal') === 'vendor' || search.includes('vendor')) {
    return { page: 'vendor', role: 'supplier', product: null, category: null };
  }
  if (path.startsWith('/customer-portal') || path.startsWith('/portal') || path.startsWith('/account') || hash === '#customer-portal' || hash === '#portal') {
    return { page: 'customer-portal', product: null, category: null };
  }

  // 2. Product Detail Route: /product/:id or /product?id=... or /products/:id
  const productMatch = path.match(/^\/(?:product|products|item)\/([^\/\?#]+)/);
  const productIdQuery = searchParams.get('id') || searchParams.get('productId');
  const targetProdIdentifier = productMatch ? decodeURIComponent(productMatch[1]) : productIdQuery;

  if (targetProdIdentifier) {
    const list = Array.isArray(productsList) && productsList.length > 0 ? productsList : [];
    const target = targetProdIdentifier.toLowerCase();
    const found = list.find((p) => {
      const pId = String(p.id || p._id || '').toLowerCase();
      const pCustom = String(p.customId || '').toLowerCase();
      const pSlug = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return pId === target || pCustom === target || pSlug === target || pSlug.includes(target) || target.includes(pSlug);
    });
    return { page: 'product-detail', product: found || list[0] || null, category: null };
  }

  // 3. Shop & Filtered Catalog
  if (path.startsWith('/shop') || path.startsWith('/products') || hash === '#shop') {
    const cat = searchParams.get('category') || searchParams.get('cat');
    return { page: 'shop', product: null, category: cat };
  }

  // 4. Other Standard Routes
  if (path.startsWith('/deals') || path.startsWith('/offers') || hash === '#deals') return { page: 'deals', product: null, category: null };
  if (path.startsWith('/recipes') || hash === '#recipes') return { page: 'recipes', product: null, category: null };
  if (path.startsWith('/delivery') || path.startsWith('/track') || hash === '#delivery') return { page: 'delivery', product: null, category: null };
  if (path.startsWith('/checkout') || hash === '#checkout') return { page: 'checkout', product: null, category: null };

  return { page: 'home', product: null, category: null };
};

export const getSeoMetadata = (page, product = null, category = null) => {
  let title = 'FreshMart - 100% Organic & Farm Fresh Groceries Delivered in Minutes';
  let description = 'Order farm-fresh vegetables, organic fruits, pure dairy, bakery, and daily grocery essentials with FreshMart. 10-15 min express delivery.';

  switch (page) {
    case 'shop':
      title = category && category !== 'All'
        ? `${category} - FreshMart Online Grocery`
        : 'Shop All Fresh Groceries & Daily Essentials | FreshMart';
      description = 'Explore our complete catalog of farm-fresh fruits, organic vegetables, dairy, bakery, meat, and pantry essentials.';
      break;
    case 'product-detail':
      if (product) {
        title = `${product.name} (Rs. ${product.price}) | FreshMart`;
        description = `Buy ${product.name} for Rs. ${product.price} online. Fresh stock, 10-15 min express delivery, and 100% satisfaction guarantee.`;
      }
      break;
    case 'deals':
      title = 'Hot Deals, Bundles & Mega Discounts | FreshMart';
      description = 'Save big on weekly grocery combos, flash deals, and exclusive promo codes at FreshMart.';
      break;
    case 'delivery':
      title = 'Express 15-Min Delivery Tracking | FreshMart';
      description = 'Real-time live map tracking and delivery status for your FreshMart orders.';
      break;
    case 'recipes':
      title = 'Chef Recipes & Instant Grocery Meal Kits | FreshMart';
      description = 'Cook fresh homemade meals with 1-click recipe ingredient carts from FreshMart.';
      break;
    case 'checkout':
      title = 'Secure Checkout & Payment | FreshMart';
      description = 'Fast, secure checkout with multiple payment options and express delivery scheduling.';
      break;
    case 'login':
      title = 'Staff & Admin Portal Login | FreshMart';
      description = 'Secure login console for FreshMart Super Admin, Store Admins, Delivery Couriers, and Pickup Staff.';
      break;
    case 'pickup-staff':
      title = 'Pickup Staff Packing Station | FreshMart';
      break;
    case 'delivery-portal':
      title = 'Rider Delivery Portal | FreshMart';
      break;
    case 'admin':
      title = 'FreshMart Operations & Store Admin Suite';
      break;
    case 'vendor':
    case 'vendor-portal':
      title = 'Vendor Partner Portal & Marketplace Dashboard | FreshMart';
      break;
    case 'customer-portal':
      title = 'My Account, Saved Addresses & Orders | FreshMart';
      break;
    default:
      break;
  }

  return { title, description };
};
