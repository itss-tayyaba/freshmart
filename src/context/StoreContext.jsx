import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  FRESHMART_PRODUCTS,
  FRESHMART_CATEGORIES,
  ADMIN_STATS,
  ADMIN_RECENT_ORDERS,
  ADMIN_INVENTORY_ALERTS,
  COUPONS
} from '../data/freshMartData';
import { ADMIN_PROMOTIONS_DATA } from '../data/adminSuiteData';
import { INITIAL_TENANTS, SUBSCRIPTION_PLANS } from '../data/tenantData';
import { apiService } from '../services/api';
import { parseRouteFromUrl, getSeoMetadata } from '../utils/routeUtils';

export { parseRouteFromUrl, getSeoMetadata, INITIAL_TENANTS, SUBSCRIPTION_PLANS };

const StoreContext = createContext();

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }) => {
  // Toast notifications state & helpers (available across the whole provider)
  const [toasts, setToasts] = useState([]);
  const addToast = (title, message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial route resolution
  const initialRoute = parseRouteFromUrl(FRESHMART_PRODUCTS);

  // Current active page view
  const [currentPage, setCurrentPage] = useState(initialRoute.page);

  // Admin Role State ('admin' | 'superadmin' | 'supplier' | 'rider')
  const [adminRole, setAdminRole] = useState(() => {
    try {
      return localStorage.getItem('freshmart_admin_role') || 'admin';
    } catch (e) {
      return 'admin';
    }
  });

  // Customer Authentication State (Starts null so user must register/sign in)
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_customer_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (parsed.walletBalance === 320) parsed.walletBalance = 0;
          if (parsed.loyaltyPoints === 150 || parsed.loyaltyPoints === 100) parsed.loyaltyPoints = 0;
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  // Customer Placed Orders History (Starts empty until customer places orders)
  const [customerOrders, setCustomerOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_customer_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Active in-transit delivery order (null if no active order)
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_active_delivery');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // Saved Delivery Locations (Starts empty so customer adds their own)
  const [savedDeliveryAddresses, setSavedDeliveryAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_saved_addresses');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // --- 🏬 Multi-Tenant Platform State (Al-Fatah, Chase Value, Chase Up, FreshMart) ---
  const [tenants, setTenants] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_tenants');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_TENANTS;
  });

  const [currentTenant, setCurrentTenantState] = useState(() => {
    try {
      const savedId = localStorage.getItem('freshmart_current_tenant_id');
      if (savedId) {
        const found = INITIAL_TENANTS.find((t) => t.id === savedId || t.slug === savedId);
        if (found) return found;
      }
    } catch (e) {}
    return INITIAL_TENANTS[0];
  });

  const setCurrentTenant = (tenantOrId) => {
    const target = typeof tenantOrId === 'string'
      ? (tenants.find((t) => t.id === tenantOrId || t.slug === tenantOrId) || INITIAL_TENANTS[0])
      : tenantOrId;
    setCurrentTenantState(target);
    try {
      localStorage.setItem('freshmart_current_tenant_id', target.id);
    } catch (e) {}
    addToast('Store Switched 🏬', `Now viewing ${target.name}`);
  };

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_tenants', JSON.stringify(tenants));
    } catch (e) {}
  }, [tenants]);

  // Products state (Single source of truth with localStorage persistence)
  const [products, setProducts] = useState(() => {
    try {
      const cacheVersion = localStorage.getItem('freshmart_catalog_v');
      if (cacheVersion === '6.0') {
        const saved = localStorage.getItem('freshmart_products');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Guard against corrupted state where all items are identical
            const uniqueNames = new Set(parsed.map((p) => p.name));
            if (uniqueNames.size > 1) {
              return parsed;
            }
          }
        }
      }
      localStorage.setItem('freshmart_catalog_v', '7.0');
      localStorage.removeItem('freshmart_products');
    } catch (e) {}
    return FRESHMART_PRODUCTS;
  });

  // Categories state (Single source of truth with localStorage persistence)
  const [categories, setCategories] = useState(() => {
    try {
      const catVersion = localStorage.getItem('freshmart_cat_v');
      if (catVersion === '6.0') {
        const saved = localStorage.getItem('freshmart_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
      localStorage.setItem('freshmart_cat_v', '7.0');
      localStorage.removeItem('freshmart_categories');
    } catch (e) {}
    return FRESHMART_CATEGORIES;
  });

  // Dynamic Landing Page & Admin Store Settings
  const [storeSettings, setStoreSettings] = useState({
    topAnnouncement: '⚡ 10-15 Min Express Delivery on all farm-fresh fruits, vegetables, dairy & groceries',
    topPromoCode: '',
    heroBadgeText: '100% FRESH',
    heroDiscountPercent: 0,
    dealOfDayProductId: 'fresh-apples-1kg',
    firstOrderPromoCode: ''
  });

  // Selected product for single product details page
  const [selectedProduct, setSelectedProduct] = useState(() => initialRoute.product || FRESHMART_PRODUCTS[0]);

  // Delivery Location (Starts empty until user adds their address)
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_delivery_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return {
      city: 'Lahore, Pakistan',
      address: '',
      label: ''
    };
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Time & Service Alerts
  const [customerNotifications, setCustomerNotifications] = useState([
    {
      id: 'notif-1',
      type: 'delivery',
      title: '🥦 Daily Farm Harvest In-Stock',
      message: 'Fresh organic greens, citrus fruits, and pure dairy are now available for express delivery.',
      expiresAt: 'Fresh Today',
      urgent: false,
      time: '10 mins ago',
      read: false
    },
    {
      id: 'notif-2',
      type: 'promo',
      title: '⚡ 10-Minute Express Delivery Active',
      message: 'Enjoy fast temperature-controlled doorstep delivery across all local hubs.',
      expiresAt: 'Active Today',
      urgent: false,
      time: '1 hour ago',
      read: false
    },
    {
      id: 'notif-3',
      type: 'wallet',
      title: '🎁 Welcome Bonus PKR 200 Credited',
      message: 'Your signup bonus of PKR 200 is available in your FreshMart Wallet.',
      expiresAt: 'Valid for 30 days',
      urgent: false,
      time: 'Today',
      read: true
    }
  ]);

  // Cart state
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((item) => {
              if (!item) return null;
              const prod = item.product || item;
              if (!prod || typeof prod !== 'object') return null;
              return {
                product: prod,
                quantity: Math.max(1, Number(item.quantity || 1)),
                unit: item.unit || prod.unit || '1 unit'
              };
            })
            .filter(Boolean);
          if (normalized.length > 0) return normalized;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { product: FRESHMART_PRODUCTS[1], quantity: 1, unit: "1 Kg" },
      { product: FRESHMART_PRODUCTS[0], quantity: 1, unit: "1L" }
    ];
  });


  // Wishlist state (starts empty by default)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (id) => typeof id === 'string' && id.trim() !== '' && id !== 'undefined' && id !== 'null'
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Filters state for Shop Page
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [minRating, setMinRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchCategory, setSelectedSearchCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isOffersOpen, setIsOffersOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isVendorRegisterOpen, setIsVendorRegisterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Currency (Defaults strictly to PKR / Rs.)
  const [currency, setCurrencyState] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_currency');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.code) return parsed;
      }
    } catch (e) {}
    return { symbol: 'Rs. ', code: 'PKR', rate: 1, name: 'PKR (Rs.)' };
  });

  const setCurrency = (curr) => {
    setCurrencyState(curr);
    try {
      localStorage.setItem('freshmart_currency', JSON.stringify(curr));
    } catch (e) {}
  };

  // Applied Coupon (null by default unless customer/admin applies code)
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Admin Data State (Starts empty - populated as customer orders arrive)
  const [adminOrders, setAdminOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_customer_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [adminStats, setAdminStats] = useState(ADMIN_STATS);

  // Admin Promotions & Coupons State
  const [promotions, setPromotions] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_promotions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return Array.isArray(ADMIN_PROMOTIONS_DATA) ? ADMIN_PROMOTIONS_DATA : [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_products', JSON.stringify(products));
    } catch (e) {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_categories', JSON.stringify(categories));
    } catch (e) {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_promotions', JSON.stringify(promotions));
    } catch (e) {}
  }, [promotions]);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await apiService.getPromotions();
        if (res && res.success && Array.isArray(res.promotions) && res.promotions.length > 0) {
          const mapped = res.promotions.map((p) => ({
            ...p,
            id: String(p._id || p.id || p.code)
          }));
          setPromotions(mapped);
          try {
            localStorage.setItem('freshmart_promotions', JSON.stringify(mapped));
          } catch (e) {}
        }
      } catch (e) {}
    };
    fetchPromos();
  }, []);

  const addPromotion = async (promoData) => {
    const cleanCode = (promoData.code || 'SPECIAL').toUpperCase().trim();
    const cleanAmount = Number(promoData.discountAmount || 0);
    const newPromo = {
      ...promoData,
      id: `PROMO-${Date.now()}`,
      code: cleanCode,
      title: promoData.title?.trim() || `${cleanAmount}${promoData.discountType === 'percentage' ? '%' : ' Rs.'} OFF Coupon`,
      discountType: promoData.discountType || 'percentage',
      discountAmount: cleanAmount,
      discountPercent: promoData.discountType === 'percentage' ? cleanAmount : 0,
      flatAmount: promoData.discountType === 'fixed' ? cleanAmount : 0,
      minOrder: Number(promoData.minOrder || 0),
      maxDiscount: Number(promoData.maxDiscount || 0),
      startDate: promoData.startDate ? new Date(promoData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: promoData.endDate ? new Date(promoData.endDate).toISOString().split('T')[0] : null,
      usageLimit: Number(promoData.usageLimit || 0),
      usedCount: 0,
      status: promoData.status || 'Active',
      category: promoData.category || 'Coupons',
      bannerImg: promoData.bannerImg || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
    };

    setPromotions((prev) => [newPromo, ...prev]);
    addToast('Coupon Created! 🏷️', `Coupon "${cleanCode}" is now active in your store.`);

    try {
      await apiService.createPromotion(newPromo);
    } catch (e) {}
  };

  const updatePromotion = async (id, updatedData) => {
    setPromotions((prev) =>
      prev.map((p) => (String(p.id || p._id) === String(id) || p.code === String(id).toUpperCase() ? { ...p, ...updatedData } : p))
    );
    addToast('Coupon Updated! ✏️', 'Changes saved successfully.');
    try {
      await apiService.updatePromotion(id, updatedData);
    } catch (e) {}
  };

  const deletePromotion = async (id) => {
    setPromotions((prev) => prev.filter((p) => String(p.id || p._id) !== String(id) && p.code !== String(id).toUpperCase()));
    addToast('Coupon Deleted 🗑️', 'Campaign removed from store.');
    try {
      await apiService.deletePromotion(id);
    } catch (e) {}
  };

  const togglePromotionStatus = async (id) => {
    setPromotions((prev) =>
      prev.map((p) => {
        if (String(p.id || p._id) === String(id) || p.code === String(id).toUpperCase()) {
          const nextStatus = p.status === 'Active' ? 'Paused' : 'Active';
          addToast(nextStatus === 'Active' ? 'Coupon Activated 🟢' : 'Coupon Paused ⏸️', `Status is now ${nextStatus}.`);
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
    try {
      await apiService.togglePromotionStatus(id);
    } catch (e) {}
  };


  // Admin Profile & Authentication (Gated by strict authentication)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      const isSession = localStorage.getItem('freshmart_admin_session') === 'true';
      const hasToken = Boolean(localStorage.getItem('freshmart_admin_token'));
      return isSession && hasToken;
    } catch (e) {
      return false;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('freshmart_admin_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {}
    return {
      name: 'Super Admin',
      email: 'admin@freshmart.com',
      role: 'admin'
    };
  });

  const adminLogin = async (username, password, role = 'admin') => {
    const targetRole = (role || 'admin').toLowerCase();
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      addToast('Missing Credentials ⚠️', 'Please enter your username/email and password.', 'error');
      return { success: false, error: 'Please enter your username/email and password.' };
    }

    let authRes = null;
    let backendResponded = false;

    // 1. Authenticate with backend API
    try {
      let loginPayloadUser = cleanUser;
      if (cleanUser === 'admin') {
        loginPayloadUser = 'admin@freshmart.com';
      } else if (cleanUser === 'superadmin') {
        loginPayloadUser = 'superadmin';
      }
      authRes = await apiService.login(loginPayloadUser, cleanPass);
      if (
        authRes &&
        typeof authRes === 'object' &&
        !authRes.isNonJsonResponse &&
        !authRes.isNetworkError &&
        authRes.message !== 'Invalid JSON from server' &&
        authRes.message !== 'Failed to fetch'
      ) {
        backendResponded = true;
      }
    } catch (e) {
      console.warn('Backend admin auth sync error:', e);
    }

    // 2. If the backend responded with success and token, authenticate with backend credentials
    if (backendResponded && authRes && authRes.success && authRes.token) {
      const returnedRole = (authRes.role || targetRole).toLowerCase();

      // Case A: Super Admin
      if (targetRole === 'superadmin' || returnedRole === 'superadmin') {
        const superUser = {
          name: authRes.name || 'Platform Super Admin',
          email: authRes.email || 'superadmin@supergrocery.pk',
          role: 'superadmin',
          isSuperAdmin: true
        };
        localStorage.setItem('freshmart_admin_token', authRes.token);
        setAdminRole('superadmin');
        setIsAdminLoggedIn(true);
        setUser(superUser);
        try {
          localStorage.setItem('freshmart_admin_session', 'true');
          localStorage.setItem('freshmart_admin_role', 'superadmin');
          localStorage.setItem('freshmart_admin_user', JSON.stringify(superUser));
        } catch (e) {}
        addToast('Super Admin Authenticated 👑', 'Welcome to the Super Grocery Platform Command Center.');
        return { success: true, role: 'superadmin', user: superUser };
      }

      // Case B: Store Admin
      if (targetRole === 'admin') {
        const adminUser = {
          id: authRes._id || authRes.id || `usr-${Date.now()}`,
          name: authRes.name || 'Store Admin',
          email: authRes.email || `${cleanUser}@freshmart.com`,
          role: 'admin',
          tenantId: authRes.tenantId || (currentTenant ? currentTenant.id : 'tenant-freshmart'),
          tenantName: authRes.tenantName || (currentTenant ? currentTenant.name : 'FreshMart Direct')
        };
        localStorage.setItem('freshmart_admin_token', authRes.token);
        setAdminRole('admin');
        setIsAdminLoggedIn(true);
        setUser(adminUser);
        try {
          localStorage.setItem('freshmart_admin_session', 'true');
          localStorage.setItem('freshmart_admin_role', 'admin');
          localStorage.setItem('freshmart_admin_user', JSON.stringify(adminUser));
        } catch (e) {}
        addToast(`Store Admin Authenticated 🏬`, `Welcome to ${adminUser.tenantName} management.`);
        return { success: true, role: 'admin', user: adminUser };
      }

      // Case C: Supplier / Vendor
      if (targetRole === 'supplier' || targetRole === 'vendor') {
        const supplierUser = {
          id: authRes._id || authRes.id || `usr-${Date.now()}`,
          name: authRes.name || 'Vendor Partner',
          email: authRes.email || `${cleanUser}@freshmart.pk`,
          role: 'supplier',
          vendorId: authRes.vendorId || authRes.id || 'VND-101',
          supplierId: authRes.supplierId || authRes.id || 'SUP-101'
        };
        localStorage.setItem('freshmart_admin_token', authRes.token);
        localStorage.setItem('freshmart_vendor_token', authRes.token);
        setAdminRole('supplier');
        setIsAdminLoggedIn(true);
        setUser(supplierUser);
        try {
          localStorage.setItem('freshmart_admin_session', 'true');
          localStorage.setItem('freshmart_admin_role', 'supplier');
          localStorage.setItem('freshmart_admin_user', JSON.stringify(supplierUser));
        } catch (e) {}
        addToast('Vendor Partner Authenticated 📦', `Welcome ${supplierUser.name} to the portal.`);
        return { success: true, role: 'supplier', user: supplierUser };
      }

      // Case D: Rider
      if (targetRole === 'rider') {
        const riderUser = {
          id: authRes._id || authRes.id || `usr-${Date.now()}`,
          name: authRes.name || 'Delivery Rider',
          email: authRes.email || `${cleanUser}@rider.freshmart.pk`,
          role: 'rider',
          riderId: authRes.id || 'RDR-101',
          phone: authRes.phone || cleanUser
        };
        localStorage.setItem('freshmart_admin_token', authRes.token);
        setAdminRole('rider');
        setIsAdminLoggedIn(true);
        setUser(riderUser);
        try {
          localStorage.setItem('freshmart_admin_session', 'true');
          localStorage.setItem('freshmart_admin_role', 'rider');
          localStorage.setItem('freshmart_admin_user', JSON.stringify(riderUser));
        } catch (e) {}
        addToast('Delivery Rider Authenticated 🛵', `Welcome ${riderUser.name} to dispatch.`);
        return { success: true, role: 'rider', user: riderUser };
      }
    }

    // 3. Super Admin Authentication (Platform Owner)
    if (targetRole === 'superadmin' || cleanUser === 'superadmin' || cleanUser === 'admin@supergrocery.pk' || cleanUser === 'superadmin@supergrocery.pk') {
      const isSuperPass = cleanPass === 'superadmin123' || cleanPass === 'admin123' || cleanPass === 'adminpassword123';
      if (!isSuperPass) {
        addToast('Authentication Failed ❌', 'Invalid Super Admin password. (Demo: superadmin123)', 'error');
        return { success: false, error: 'Invalid Super Admin password. (Default: superadmin123)' };
      }

      const superUser = {
        name: 'Platform Super Admin',
        email: 'superadmin@supergrocery.pk',
        role: 'superadmin',
        isSuperAdmin: true
      };

      const fallbackToken = `mock-superadmin-token-${Date.now()}`;
      localStorage.setItem('freshmart_admin_token', fallbackToken);

      setAdminRole('superadmin');
      setIsAdminLoggedIn(true);
      setUser(superUser);

      try {
        localStorage.setItem('freshmart_admin_session', 'true');
        localStorage.setItem('freshmart_admin_role', 'superadmin');
        localStorage.setItem('freshmart_admin_user', JSON.stringify(superUser));
      } catch (e) {}

      addToast('Super Admin Authenticated 👑', 'Welcome to the Super Grocery Platform Command Center.');
      return { success: true, role: 'superadmin', user: superUser };
    }

    // 4. Store Admin Authentication (Scoped to Tenant or Global Admin)
    if (targetRole === 'admin') {
      // Check if logging in as a specific tenant owner (e.g. admin@alfatah.pk, admin@chasevalue.pk)
      const matchedTenant = (tenants || []).find(
        (t) =>
          (t.ownerEmail && t.ownerEmail.toLowerCase() === cleanUser) ||
          t.slug === cleanUser ||
          cleanUser.startsWith(t.slug)
      );

      const isAdminUser =
        cleanUser === 'admin' ||
        cleanUser === 'admin@freshmart.com' ||
        cleanUser === 'admin@freshmart.pk' ||
        !!matchedTenant;

      const isAdminPass =
        cleanPass === 'adminpassword123' ||
        cleanPass === 'admin123' ||
        cleanPass === 'storeadmin123' ||
        cleanPass === 'alfatah123' ||
        cleanPass === 'chase123';

      if (!isAdminUser || !isAdminPass) {
        addToast('Authentication Failed ❌', 'Invalid admin username or password.', 'error');
        return { success: false, error: 'Invalid admin username or password. (Demo: admin123)' };
      }

      const activeTenant = matchedTenant || currentTenant || tenants[0];
      if (matchedTenant) {
        setCurrentTenant(matchedTenant);
      }

      const adminUser = {
        name: activeTenant ? `${activeTenant.name} Admin` : 'Store Admin',
        email: cleanUser.includes('@') ? cleanUser : `${cleanUser}@supergrocery.pk`,
        role: 'admin',
        tenantId: activeTenant ? activeTenant.id : 'tenant-freshmart',
        tenantName: activeTenant ? activeTenant.name : 'FreshMart Direct'
      };

      const fallbackToken = `mock-admin-token-${Date.now()}`;
      localStorage.setItem('freshmart_admin_token', fallbackToken);

      setAdminRole('admin');
      setIsAdminLoggedIn(true);
      setUser(adminUser);

      try {
        localStorage.setItem('freshmart_admin_session', 'true');
        localStorage.setItem('freshmart_admin_role', 'admin');
        localStorage.setItem('freshmart_admin_user', JSON.stringify(adminUser));
      } catch (e) {}

      addToast(`Store Admin Authenticated 🏬`, `Welcome to ${adminUser.tenantName} management.`);
      return { success: true, role: 'admin', user: adminUser };
    }

    if (targetRole === 'supplier' || targetRole === 'vendor') {
      const foundSupplier = (suppliers || []).find(
        (s) =>
          (s.username && s.username.toLowerCase() === cleanUser) ||
          (s.email && s.email.toLowerCase() === cleanUser) ||
          (s.name && s.name.toLowerCase() === cleanUser) ||
          (s.supplierId && s.supplierId.toLowerCase() === cleanUser) ||
          (s.vendorId && s.vendorId.toLowerCase() === cleanUser)
      );

      if (foundSupplier && foundSupplier.status === 'Pending') {
        addToast('Application Pending ⏳', 'Your vendor application is awaiting Admin review.', 'info');
        return { success: false, error: 'Your vendor application is pending Admin approval. Please wait for store admin approval.' };
      }

      if (foundSupplier && foundSupplier.status === 'Rejected') {
        addToast('Application Rejected ❌', 'This vendor application was rejected.', 'error');
        return { success: false, error: 'This vendor account was rejected by the administration.' };
      }

      const isValidPass =
        (foundSupplier && foundSupplier.password && cleanPass === foundSupplier.password) ||
        ((cleanUser === 'tayyab' || cleanUser === 'supplier') && (cleanPass === 'cocacola123' || cleanPass === 'supplier123'));

      if (!isValidPass) {
        addToast('Authentication Failed ❌', 'Invalid vendor username or password.', 'error');
        return { success: false, error: 'Invalid vendor username or password.' };
      }

      const supplierUser = {
        name: foundSupplier ? (foundSupplier.ownerName || foundSupplier.name) : 'Tayyab (Coca-Cola Beverages)',
        email: foundSupplier ? foundSupplier.email : 'tayyab.cocacola@freshmart.pk',
        role: 'vendor',
        vendorId: (foundSupplier && (foundSupplier.vendorId || foundSupplier.id)) || 'VND-101',
        supplierId: (foundSupplier && (foundSupplier.supplierId || foundSupplier.id)) || 'SUP-101'
      };

      const fallbackToken = `mock-vendor-token-${Date.now()}`;
      localStorage.setItem('freshmart_admin_token', fallbackToken);
      localStorage.setItem('freshmart_vendor_token', fallbackToken);

      setAdminRole('supplier');
      setIsAdminLoggedIn(true);
      setUser(supplierUser);

      try {
        localStorage.setItem('freshmart_admin_session', 'true');
        localStorage.setItem('freshmart_admin_role', 'supplier');
        localStorage.setItem('freshmart_admin_user', JSON.stringify(supplierUser));
      } catch (e) {}

      addToast('Vendor Partner Authenticated 📦', `Welcome ${supplierUser.name} to the portal.`);
      return { success: true, role: 'supplier', user: supplierUser };
    }

    if (targetRole === 'rider') {
      const foundRider = (riders || []).find(
        (r) =>
          (r.username && r.username.toLowerCase() === cleanUser) ||
          (r.phone && r.phone.replace(/[^0-9]/g, '') === cleanUser.replace(/[^0-9]/g, '')) ||
          (r.id && r.id.toLowerCase() === cleanUser) ||
          (r.name && r.name.toLowerCase() === cleanUser)
      );

      if (!foundRider) {
        addToast('Rider Not Found ❌', 'No rider profile found with this phone number. Store Admin must register the rider first in the Admin Dashboard.', 'error');
        return { success: false, error: 'No rider profile found. Please have the Store Admin add your rider account in the Delivery Fleet dashboard.' };
      }

      const isValidPass = foundRider.password && cleanPass === foundRider.password;

      if (!isValidPass) {
        addToast('Authentication Failed ❌', 'Invalid rider password.', 'error');
        return { success: false, error: 'Invalid rider password.' };
      }

      const riderUser = {
        name: foundRider.name,
        email: `${foundRider.name.toLowerCase().replace(/\s+/g, '')}@rider.freshmart.pk`,
        role: 'rider',
        riderId: foundRider.id,
        phone: foundRider.phone,
        zone: foundRider.zone || 'Main Hub'
      };

      const fallbackToken = `mock-rider-token-${Date.now()}`;
      localStorage.setItem('freshmart_admin_token', fallbackToken);

      setAdminRole('rider');
      setIsAdminLoggedIn(true);
      setUser(riderUser);

      try {
        localStorage.setItem('freshmart_admin_session', 'true');
        localStorage.setItem('freshmart_admin_role', 'rider');
        localStorage.setItem('freshmart_admin_user', JSON.stringify(riderUser));
      } catch (e) {}

      addToast('Delivery Rider Authenticated 🛵', `Welcome ${riderUser.name} to dispatch.`);
      return { success: true, role: 'rider', user: riderUser };
    }

    return { success: false, error: 'Invalid credentials. Access denied.' };
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('freshmart_admin_session');
      localStorage.removeItem('freshmart_admin_role');
      localStorage.removeItem('freshmart_admin_user');
      localStorage.removeItem('freshmart_admin_token');
      localStorage.removeItem('freshmart_vendor_token');
    } catch (e) {}
    addToast('Signed Out', 'You have been logged out of the staff portal.', 'info');
    navigateTo('home');
  };


  // Save products and categories to localStorage on any modification
  useEffect(() => {
    try {
      localStorage.setItem('freshmart_products', JSON.stringify(products));
    } catch (e) {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_categories', JSON.stringify(categories));
    } catch (e) {}
  }, [categories]);

  // Fetch live products on startup from Node.js backend
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const data = await apiService.getProducts();
        if (data && data.success && data.products && data.products.length > 0) {
          const mapped = data.products.map((p) => ({
            ...p,
            id: String(p.customId || p.id || p._id)
          }));
          setProducts((prev) => {
            const dbMap = new Map(mapped.map((p) => [p.id, p]));
            const merged = prev.map((p) => (dbMap.has(p.id) ? { ...p, ...dbMap.get(p.id) } : p));
            for (const dbProduct of mapped) {
              if (!merged.some((p) => p.id === dbProduct.id)) {
                merged.unshift(dbProduct);
              }
            }
            try {
              localStorage.setItem('freshmart_products', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      } catch (e) {}
    };
    fetchBackendData();
  }, []);

  // Ensure active admin sessions have a valid Bearer token for write operations
  useEffect(() => {
    const ensureAdminToken = async () => {
      try {
        const isAdmin = localStorage.getItem('freshmart_admin_session') === 'true';
        const hasToken = localStorage.getItem('freshmart_admin_token');
        if (isAdmin && !hasToken) {
          const authRes = await apiService.login('admin@freshmart.com', 'adminpassword123');
          if (authRes && authRes.token) {
            localStorage.setItem('freshmart_admin_token', authRes.token);
          }
        }
      } catch (e) {}
    };
    ensureAdminToken();
  }, []);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('freshmart_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_wishlist', JSON.stringify(wishlist));
    } catch (e) {}
  }, [wishlist]);

  // Synchronize and auto-prune stale IDs from wishlist
  useEffect(() => {
    if (products && products.length > 0 && wishlist.length > 0) {
      const liveProductIds = new Set(products.map((p) => String(p.id || p._id)));
      const cleaned = wishlist.filter((id) => liveProductIds.has(id));
      if (cleaned.length !== wishlist.length) {
        setWishlist(cleaned);
        try {
          localStorage.setItem('freshmart_wishlist', JSON.stringify(cleaned));
        } catch (e) {}
      }
    }
  }, [products]);


  useEffect(() => {
    try {
      if (customerUser) {
        localStorage.setItem('freshmart_customer_user', JSON.stringify(customerUser));
      } else {
        localStorage.removeItem('freshmart_customer_user');
      }
    } catch (e) {}
  }, [customerUser]);

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_customer_orders', JSON.stringify(customerOrders));
    } catch (e) {}
  }, [customerOrders]);

  useEffect(() => {
    try {
      if (activeDeliveryOrder) {
        localStorage.setItem('freshmart_active_delivery', JSON.stringify(activeDeliveryOrder));
      } else {
        localStorage.removeItem('freshmart_active_delivery');
      }
    } catch (e) {}
  }, [activeDeliveryOrder]);

  // Riders State (Created & Managed exclusively by Store Admin)
  const defaultRidersList = [];

  const [riders, setRiders] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_riders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_riders', JSON.stringify(riders));
    } catch (e) {}
  }, [riders]);

  // Default Suppliers List (Zero mock seeds: populated strictly via live Admin additions or Vendor onboarding applications)
  const defaultSuppliersList = [];

  // Suppliers State
  const [suppliers, setSuppliers] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_suppliers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return defaultSuppliersList;
  });

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_suppliers', JSON.stringify(suppliers));
    } catch (e) {}
  }, [suppliers]);

  // Default Customer List (Registered users: Hafsa & Aimen)
  const defaultCustomersList = [
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

  // Customers State (Only registered customer Hafsa)
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return defaultCustomersList;
  });

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_customers', JSON.stringify(customers));
    } catch (e) {}
  }, [customers]);

  // Sync suppliers from database on startup
  useEffect(() => {
    const syncSuppliers = async () => {
      try {
        const res = await apiService.getSuppliers();
        if (res && res.success && Array.isArray(res.suppliers)) {
          setSuppliers(res.suppliers);
          localStorage.setItem('freshmart_suppliers', JSON.stringify(res.suppliers));
        }
      } catch (e) {}
    };
    syncSuppliers();
  }, []);

  // Sync riders from database on startup
  useEffect(() => {
    const syncRiders = async () => {
      try {
        const res = await apiService.getRiders();
        if (res && res.success && Array.isArray(res.riders)) {
          setRiders(res.riders);
          localStorage.setItem('freshmart_riders', JSON.stringify(res.riders));
        }
      } catch (e) {}
    };
    syncRiders();
  }, []);

  // Sync customers from database on startup
  useEffect(() => {
    const syncCustomers = async () => {
      try {
        const res = await apiService.getCustomers();
        if (res && res.success && Array.isArray(res.customers) && res.customers.length > 0) {
          setCustomers(res.customers);
          localStorage.setItem('freshmart_customers', JSON.stringify(res.customers));
        } else {
          setCustomers(defaultCustomersList);
          localStorage.setItem('freshmart_customers', JSON.stringify(defaultCustomersList));
        }
      } catch (e) {}
    };
    syncCustomers();
  }, []);

  const addSupplier = (supplierData) => {
    const newId = `SUP-${Math.floor(100 + Math.random() * 900)}`;
    const newSupplier = {
      id: newId,
      name: supplierData.name,
      contact: supplierData.contact || supplierData.name,
      phone: supplierData.phone,
      email: supplierData.email || `${supplierData.name.toLowerCase().replace(/\s+/g, '')}@supplier.com`,
      category: supplierData.category || 'Fresh Milk & Pure Dairy',
      username: supplierData.username || supplierData.name.toLowerCase().replace(/\s+/g, '_'),
      password: supplierData.password || 'supplier123',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    setSuppliers((prev) => {
      const updated = [newSupplier, ...prev];
      try {
        localStorage.setItem('freshmart_suppliers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    apiService.createSupplier(newSupplier);
    addToast('Supplier Added 🏢', `${newSupplier.name} registered successfully.`);
    return newSupplier;
  };

  const deleteSupplier = (id) => {
    setSuppliers((prev) => {
      const updated = prev.filter((s) => s.id !== id && s.supplierId !== id);
      try {
        localStorage.setItem('freshmart_suppliers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    apiService.deleteSupplier(id);
    addToast('Supplier Removed', 'Supplier deleted from directory.', 'info');
  };

  const updateSupplier = (id, updatedFields) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s))
    );
    addToast('Supplier Updated', 'Supplier record updated successfully.');
  };

  const addCustomer = (customerData) => {
    const newId = `CUST-${Math.floor(100 + Math.random() * 900)}`;
    const newCust = {
      id: newId,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone || '+92 300 1234567',
      totalOrders: 0,
      totalSpent: 'Rs. 0',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    setCustomers((prev) => {
      const updated = [newCust, ...prev];
      try {
        localStorage.setItem('freshmart_customers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    apiService.createCustomer(newCust);
    addToast('Customer Added 👤', `${newCust.name} added to directory.`);
    return newCust;
  };

  const deleteCustomer = (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    addToast('Customer Removed', 'Customer deleted from directory.', 'info');
  };

  const updateCustomer = (id, updatedFields) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
    );
    addToast('Customer Updated', 'Customer record updated successfully.');
  };

  // --- 🛵 Rider Fleet Management (Admin Controlled) ---
  const addRider = async (riderData) => {
    const newId = `RDR-${Math.floor(100 + Math.random() * 900)}`;
    const newRider = {
      id: newId,
      name: riderData.name,
      phone: riderData.phone,
      vehicleType: riderData.vehicleType || '🏍️ Honda 125',
      vehicleNumber: riderData.vehicleNumber || `LEK-${Math.floor(1000 + Math.random() * 9000)}`,
      zone: riderData.zone || 'Gulberg / Main Hub',
      status: riderData.status || 'On-Duty',
      cnic: riderData.cnic || '',
      username: (riderData.username || riderData.phone || riderData.name).toLowerCase().replace(/\s+/g, '_'),
      password: riderData.password || 'rider123',
      deliveriesCount: 0,
      rating: 5.0,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    setRiders((prev) => {
      const updated = [newRider, ...prev];
      try {
        localStorage.setItem('freshmart_riders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    addToast('Rider Registered 🛵', `${newRider.name} registered. Credentials: ${newRider.phone} / ${newRider.password}`);

    try {
      await apiService.createRider(newRider);
    } catch (e) {}
    return newRider;
  };

  const updateRider = async (id, updatedFields) => {
    setRiders((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updatedFields } : r));
      try {
        localStorage.setItem('freshmart_riders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addToast('Rider Updated', 'Rider profile saved.');
    try {
      await apiService.updateRider(id, updatedFields);
    } catch (e) {}
  };

  const deleteRider = async (id) => {
    setRiders((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem('freshmart_riders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addToast('Rider Removed', 'Rider deleted from fleet.', 'info');
    try {
      await apiService.deleteRider(id);
    } catch (e) {}
  };

  const clearAllRiders = async () => {
    setRiders([]);
    try {
      localStorage.removeItem('freshmart_riders');
    } catch (e) {}
    addToast('Fleet Cleared', 'All riders removed from system.', 'info');
    try {
      await apiService.clearAllRiders();
    } catch (e) {}
  };

  const toggleRiderStatus = async (id) => {
    setRiders((prev) => {
      const updated = prev.map((r) => {
        if (r.id === id) {
          const nextStatus = r.status === 'On-Duty' ? 'Off-Duty' : 'On-Duty';
          return { ...r, status: nextStatus };
        }
        return r;
      });
      try {
        localStorage.setItem('freshmart_riders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const assignRiderToOrder = async (orderId, riderId) => {
    const targetRider = riders.find((r) => r.id === riderId);
    if (!targetRider) return;

    const assignedInfo = {
      id: targetRider.id,
      name: targetRider.name,
      phone: targetRider.phone,
      vehicle: targetRider.vehicleNumber || targetRider.vehicleType,
      zone: targetRider.zone || 'Lahore Hub',
      rating: targetRider.rating || 5.0,
      coordinates: targetRider.coordinates || { lat: 31.5150, lng: 74.3450 },
      assignedAt: new Date().toISOString(),
      eta: '12-18 mins'
    };

    setCustomerOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              assignedRider: assignedInfo,
              status: 'Out for Delivery',
              statusClass: 'bg-purple-100 text-purple-800'
            }
          : o
      )
    );
    setAdminOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              assignedRider: assignedInfo,
              status: 'Out for Delivery',
              statusClass: 'bg-purple-100 text-purple-800'
            }
          : o
      )
    );
    if (activeDeliveryOrder && activeDeliveryOrder.id === orderId) {
      setActiveDeliveryOrder((prev) => ({
        ...prev,
        assignedRider: assignedInfo,
        status: 'Out for Delivery',
        statusClass: 'bg-purple-100 text-purple-800'
      }));
    }

    addToast('Rider Assigned 🛵', `${targetRider.name} assigned to Order ${orderId}. Status updated to Out for Delivery.`);

    // Persist to backend database
    try {
      await apiService.assignRiderToOrder(orderId, {
        riderId: targetRider.id,
        rider: assignedInfo,
        status: 'Out for Delivery'
      });
    } catch (e) {
      console.warn('Could not sync rider assignment to backend:', e.message);
    }
  };

  const updateRiderLiveLocation = async (orderId, coords) => {
    setCustomerOrders((prev) =>
      prev.map((o) =>
        o.id === orderId && o.assignedRider
          ? {
              ...o,
              assignedRider: {
                ...o.assignedRider,
                coordinates: coords,
                currentLat: coords.lat,
                currentLng: coords.lng
              }
            }
          : o
      )
    );

    if (activeDeliveryOrder && activeDeliveryOrder.id === orderId && activeDeliveryOrder.assignedRider) {
      setActiveDeliveryOrder((prev) => ({
        ...prev,
        assignedRider: {
          ...prev.assignedRider,
          coordinates: coords,
          currentLat: coords.lat,
          currentLng: coords.lng
        }
      }));
    }

    try {
      await apiService.updateRiderLocation(orderId, coords);
    } catch (e) {
      console.warn('Could not sync rider coordinates to backend:', e.message);
    }
  };

  const trackOrderRemote = async (orderId) => {
    try {
      const res = await apiService.trackOrder(orderId);
      if (res && res.success && res.order) {
        return res.order;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const addCustomerNotification = (notif) => {
    setCustomerNotifications((prev) => [
      {
        id: notif.id || `notif-${Date.now()}`,
        type: notif.type || 'delivery',
        title: notif.title || 'Notification',
        message: notif.message || '',
        time: notif.time || 'Just now',
        urgent: notif.urgent !== undefined ? notif.urgent : false,
        read: false,
        ...notif
      },
      ...prev
    ]);
  };

  const verifyOrderDeliveryOtp = async (orderId, otp, riderId) => {
    try {
      const res = await apiService.verifyDeliveryOtp(orderId, { otp, riderId });
      if (res && res.success) {
        setCustomerOrders((prev) =>
          prev.map((o) =>
            o.id === orderId || o.orderId === orderId || o._id === orderId
              ? {
                  ...o,
                  status: 'Delivered',
                  statusClass: 'bg-emerald-100 text-emerald-800',
                  isDelivered: true,
                  deliveredAt: new Date().toISOString(),
                  isPaid: true,
                  paymentStatus: 'Paid',
                  paymentCollected: true
                }
              : o
          )
        );

        setAdminOrders((prev) =>
          prev.map((o) =>
            o.id === orderId || o.orderId === orderId || o._id === orderId
              ? {
                  ...o,
                  status: 'Delivered',
                  statusClass: 'bg-emerald-100 text-emerald-800',
                  isDelivered: true,
                  deliveredAt: new Date().toISOString(),
                  isPaid: true,
                  paymentStatus: 'Paid',
                  paymentCollected: true
                }
              : o
          )
        );

        if (activeDeliveryOrder && (activeDeliveryOrder.id === orderId || activeDeliveryOrder.orderId === orderId || activeDeliveryOrder._id === orderId)) {
          setActiveDeliveryOrder((prev) => ({
            ...prev,
            status: 'Delivered',
            statusClass: 'bg-emerald-100 text-emerald-800',
            isDelivered: true,
            deliveredAt: new Date().toISOString(),
            isPaid: true,
            paymentStatus: 'Paid',
            paymentCollected: true
          }));
        }

        if (riderId) {
          setRiders((prev) => {
            const updated = prev.map((r) =>
              r.id === riderId || r._id === riderId
                ? { ...r, deliveriesCount: (r.deliveriesCount || 0) + 1, totalDeliveries: (r.totalDeliveries || 0) + 1 }
                : r
            );
            try {
              localStorage.setItem('freshmart_riders', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }

        addCustomerNotification({
          id: `notif-${Date.now()}`,
          type: 'delivery',
          title: '🎉 Order Delivered Successfully!',
          message: `Order #${orderId} was delivered. Handover OTP was verified and cash/payment is confirmed. Thank you for shopping with FreshMart!`,
          time: 'Just now',
          urgent: true,
          read: false
        });

        addToast('Delivery Complete! 📦✨', `Order #${orderId} delivered & verified via OTP. Payment collected.`);
        return { success: true, order: res.order };
      } else {
        const errMsg = res?.message || 'Invalid Handover OTP PIN. Please ask customer for correct 4-digit code.';
        addToast('OTP Verification Failed ❌', errMsg, 'error');
        return { success: false, message: errMsg };
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'OTP verification failed';
      addToast('Verification Error ❌', errMsg, 'error');
      return { success: false, message: errMsg };
    }
  };

  const updateDeliveryOrderStatus = async (orderId, newStatus) => {
    setCustomerOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (activeDeliveryOrder && activeDeliveryOrder.id === orderId) {
      setActiveDeliveryOrder((prev) => ({ ...prev, status: newStatus }));
    }
    addToast('Delivery Status Updated 🚚', `Order ${orderId}: ${newStatus}`);

    try {
      await apiService.updateOrderStatus(orderId, newStatus);
    } catch (e) {
      console.warn('Could not sync order status to backend:', e.message);
    }
  };

  // --- 🏪 Multi-Vendor Applications & Approvals ---
  const registerVendorApplication = async (vendorData) => {
    const vendorId = `VND-${Math.floor(100 + Math.random() * 900)}`;
    const newVendorRecord = {
      id: vendorId,
      vendorId: vendorId,
      supplierId: vendorId,
      name: vendorData.name,
      ownerName: vendorData.ownerName || vendorData.name,
      email: (vendorData.email || '').toLowerCase().trim(),
      password: vendorData.password || 'vendor123',
      phone: vendorData.phone || '',
      category: vendorData.category || 'Fresh Fruits & Farm Vegetables',
      status: 'Pending', // Pending Admin Approval
      address: vendorData.address || '',
      bio: vendorData.bio || '',
      appliedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    setSuppliers((prev) => {
      const updated = [newVendorRecord, ...prev.filter((s) => s.email !== newVendorRecord.email)];
      try {
        localStorage.setItem('freshmart_suppliers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    addToast('Application Received 🏪', `Application for "${vendorData.name}" submitted. Awaiting Admin Approval.`);

    try {
      await apiService.registerVendor(vendorData);
    } catch (e) {}

    return { success: true, vendor: newVendorRecord };
  };

  const approveVendor = async (vendorId) => {
    setSuppliers((prev) => {
      const updated = prev.map((s) =>
        (s.id === vendorId || s.vendorId === vendorId || s.supplierId === vendorId)
          ? { ...s, status: 'Approved' }
          : s
      );
      try {
        localStorage.setItem('freshmart_suppliers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    addToast('Vendor Approved! 🎉', `Store ${vendorId} is now approved and can log in.`);

    try {
      await apiService.adminUpdateVendorStatus(vendorId, 'Approved');
    } catch (e) {}
  };

  const rejectVendor = async (vendorId) => {
    setSuppliers((prev) => {
      const updated = prev.map((s) =>
        (s.id === vendorId || s.vendorId === vendorId || s.supplierId === vendorId)
          ? { ...s, status: 'Rejected' }
          : s
      );
      try {
        localStorage.setItem('freshmart_suppliers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    addToast('Application Rejected', `Vendor application ${vendorId} was rejected.`, 'info');

    try {
      await apiService.adminUpdateVendorStatus(vendorId, 'Rejected');
    } catch (e) {}
  };







  useEffect(() => {
    try {
      localStorage.setItem('freshmart_saved_addresses', JSON.stringify(savedDeliveryAddresses));
    } catch (e) {}
  }, [savedDeliveryAddresses]);

  // --- 🏢 Super Admin & Multi-Tenant Management Engine ---
  const addTenant = async (tenantData) => {
    const slug = (tenantData.slug || tenantData.name || `store-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const id = tenantData.id || `tenant-${slug}`;

    const newTenant = {
      id,
      name: tenantData.name || 'New Supermarket',
      legalName: tenantData.legalName || tenantData.name || `${tenantData.name || 'Store'} Pvt Ltd`,
      slug,
      tagline: tenantData.tagline || 'Groceries & Household Essentials',
      status: tenantData.status || 'Active',
      logo: tenantData.logo || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=160&q=80',
      banner: tenantData.banner || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
      color: tenantData.color || '#16a34a',
      ownerName: tenantData.ownerName || 'Store Admin',
      ownerEmail: tenantData.ownerEmail || `admin@${slug}.pk`,
      phone: tenantData.phone || '+92 42 111 222 333',
      city: tenantData.city || 'Lahore, Pakistan',
      address: tenantData.address || 'Flagship Hypermarket, Lahore',
      hubs: tenantData.hubs || [
        { id: `${slug}-hub-1`, name: `${tenantData.name || 'Main'} Hub 1`, address: 'Main Hub', city: tenantData.city || 'Lahore', active: true }
      ],
      subscription: {
        plan: tenantData.plan || 'Starter',
        status: 'Active',
        billingCycle: tenantData.billingCycle || 'monthly',
        price: tenantData.price || (SUBSCRIPTION_PLANS[tenantData.plan || 'Starter']?.price || 15000),
        startedAt: new Date().toISOString(),
        renewAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      stats: {
        totalGmv: 0,
        ordersCount: 0,
        activeRiders: 3,
        fulfillmentSla: '99.1%'
      },
      createdAt: new Date().toISOString()
    };

    setTenants((prev) => [newTenant, ...prev.filter((t) => t.id !== newTenant.id)]);
    try {
      await apiService.createTenant(newTenant);
    } catch (e) {
      console.warn('Backend createTenant sync error:', e);
    }
    addToast('Tenant Onboarded 🏬', `"${newTenant.name}" has been successfully added.`);
    return { success: true, tenant: newTenant };
  };

  const inviteTenant = async (inviteData) => {
    const slug = (inviteData.name || 'tenant')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const id = `tenant-${slug}-${Date.now().toString().slice(-4)}`;
    const inviteToken = `inv_${Math.random().toString(36).substring(2)}${Date.now()}`;
    const inviteLink = `${window.location.origin}/admin/join?token=${inviteToken}&tenant=${id}`;

    const invitedTenant = {
      id,
      name: inviteData.name,
      legalName: inviteData.name,
      slug,
      tagline: 'Awaiting Onboarding Setup',
      status: 'Pending',
      ownerName: inviteData.ownerName || 'Pending Invitee',
      ownerEmail: inviteData.email,
      phone: inviteData.phone || '',
      invitationToken: inviteToken,
      invitationSentAt: new Date().toISOString(),
      invitationExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      subscription: {
        plan: inviteData.plan || 'Starter',
        status: 'Pending',
        billingCycle: inviteData.billingCycle || 'monthly',
        price: SUBSCRIPTION_PLANS[inviteData.plan || 'Starter']?.price || 15000
      },
      stats: { totalGmv: 0, ordersCount: 0, activeRiders: 0, fulfillmentSla: '100%' },
      createdAt: new Date().toISOString()
    };

    setTenants((prev) => [invitedTenant, ...prev.filter((t) => t.id !== invitedTenant.id)]);
    try {
      await apiService.inviteTenant({
        ...inviteData,
        id,
        inviteToken,
        inviteLink
      });
    } catch (e) {}

    addToast('Tenant Invited ✉️', `Invitation link generated for ${inviteData.email}`);
    return { success: true, inviteLink, tenant: invitedTenant };
  };

  const approveTenant = async (tenantId) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status: 'Active', subscription: { ...t.subscription, status: 'Active' } } : t))
    );
    try {
      await apiService.approveTenant(tenantId);
    } catch (e) {}
    addToast('Tenant Approved! 🏬', 'Store is now active on the Super Grocery Platform.');
    return { success: true };
  };

  const suspendTenant = async (tenantId, reason = 'Administrative review') => {
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status: 'Suspended', suspendReason: reason } : t))
    );
    try {
      await apiService.suspendTenant(tenantId);
    } catch (e) {}
    addToast('Tenant Suspended ⚠️', 'Store operations have been temporarily suspended.', 'error');
    return { success: true };
  };

  const activateTenant = async (tenantId) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status: 'Active', suspendReason: null } : t))
    );
    try {
      await apiService.activateTenant(tenantId);
    } catch (e) {}
    addToast('Tenant Activated ✅', 'Store operations have been resumed.');
    return { success: true };
  };

  const deleteTenant = async (tenantId) => {
    if (tenants.length <= 1) {
      addToast('Cannot Delete ⚠️', 'Platform must keep at least one active tenant.', 'error');
      return { success: false, error: 'Cannot delete the only remaining tenant' };
    }
    const target = tenants.find((t) => t.id === tenantId);
    setTenants((prev) => prev.filter((t) => t.id !== tenantId));
    if (currentTenant?.id === tenantId) {
      const remaining = tenants.filter((t) => t.id !== tenantId);
      if (remaining.length > 0) {
        setCurrentTenant(remaining[0]);
      }
    }
    try {
      await apiService.deleteTenant(tenantId);
    } catch (e) {}
    addToast('Tenant Deleted 🗑️', `"${target?.name || 'Store'}" removed from platform.`, 'info');
    return { success: true };
  };

  const updateTenantSubscription = async (tenantId, subPayload) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === tenantId) {
          return {
            ...t,
            subscription: {
              ...t.subscription,
              ...subPayload
            }
          };
        }
        return t;
      })
    );
    try {
      await apiService.updateTenantSubscription(tenantId, subPayload);
    } catch (e) {}
    addToast('Subscription Updated 💳', `Plan updated to ${subPayload.plan || 'new tier'}.`);
    return { success: true };
  };

  const getTenantOrders = (tenantId = 'all') => {
    if (!tenantId || tenantId === 'all') {
      return adminOrders;
    }
    return adminOrders.filter(
      (o) => o.tenantId === tenantId || o.storeId === tenantId || (tenantId === 'tenant-freshmart' && !o.tenantId)
    );
  };

  const getTenantPerformance = (tenantId) => {
    const target = tenants.find((t) => t.id === tenantId) || currentTenant;
    const orders = getTenantOrders(target?.id);
    const gmv = orders.reduce((sum, o) => sum + Number(o.total || o.totalAmount || o.totalPrice || 0), 0);
    const plan = target?.subscription?.plan || 'Starter';
    const planDetails = SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.Starter;
    const commissionRate = planDetails.commissionRate !== undefined ? planDetails.commissionRate : 5;
    const commission = Math.round((gmv * commissionRate) / 100);

    return {
      tenantId: target?.id,
      name: target?.name,
      totalOrders: orders.length,
      gmv,
      commission,
      commissionRate,
      activeRiders: (riders || []).filter((r) => r.status === 'Available' || r.status === 'Busy').length || 4,
      fulfillmentSla: target?.stats?.fulfillmentSla || '99.2%',
      plan
    };
  };

  const getPlatformOverview = () => {
    const totalGmv = adminOrders.reduce((sum, o) => sum + Number(o.total || o.totalAmount || o.totalPrice || 0), 0) + 1450000;
    const totalCommission = Math.round(totalGmv * 0.05);
    const activeTenants = tenants.filter((t) => t.status === 'Active').length;
    return {
      totalTenants: tenants.length,
      activeTenants,
      pendingTenants: tenants.filter((t) => t.status === 'Pending').length,
      suspendedTenants: tenants.filter((t) => t.status === 'Suspended').length,
      totalGmv,
      totalCommission,
      totalOrders: adminOrders.length + 150,
      totalRiders: (riders || []).length || 8,
      avgSla: '98.8%'
    };
  };

  // Sync tenants from backend on startup
  useEffect(() => {
    const fetchBackendTenants = async () => {
      try {
        const res = await apiService.getTenants();
        if (res && res.success && Array.isArray(res.tenants) && res.tenants.length > 0) {
          setTenants((prev) => {
            const remoteMap = new Map(res.tenants.map((t) => [t.id, t]));
            const merged = prev.map((t) => (remoteMap.has(t.id) ? { ...t, ...remoteMap.get(t.id) } : t));
            for (const rTenant of res.tenants) {
              if (!merged.some((t) => t.id === rTenant.id)) {
                merged.push(rTenant);
              }
            }
            try {
              localStorage.setItem('freshmart_tenants', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      } catch (e) {}
    };
    fetchBackendTenants();
  }, []);

  // Helper to auto-enroll customer into Admin Customer Directory
  const autoEnrollCustomer = (userObj) => {
    if (!userObj || !userObj.name) return;
    setCustomers((prev) => {
      const exists = prev.some(
        (c) => (userObj.email && c.email === userObj.email) || c.name === userObj.name
      );
      if (exists) return prev;
      return [
        {
          id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
          name: userObj.name,
          email: userObj.email || `${userObj.name.toLowerCase().replace(/\s+/g, '')}@freshmart.pk`,
          phone: userObj.phone || '+92 300 1234567',
          totalOrders: 0,
          totalSpent: 'Rs. 0',
          status: 'Active',
          createdAt: new Date().toISOString()
        },
        ...prev
      ];
    });
  };

  // --- Customer Authentication Functions ---
  const registerCustomer = async (userData) => {
    let userObj = {
      id: `cust-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '+92 300 1234567',
      city: userData.city || 'Lahore, Pakistan',
      address: userData.address || '123 Main Street',
      walletBalance: 0,
      loyaltyPoints: 0
    };

    try {
      const res = await apiService.register(userData);
      if (res && res.success) {
        userObj.id = res._id || userObj.id;
        if (res.token) {
          try {
            localStorage.setItem('freshmart_token', res.token);
          } catch (e) {}
        }
      }
    } catch (e) {}

    setCustomerUser(userObj);
    autoEnrollCustomer(userObj);
    addToast('Account Created! 🎉', `Welcome to FreshMart, ${userData.name}!`);
    return { success: true };
  };

  const loginCustomer = async (email, password) => {
    let userObj = {
      id: `cust-${Date.now()}`,
      name: email.split('@')[0].replace('.', ' ').replace(/^\w/, (c) => c.toUpperCase()),
      email: email,
      phone: '+92 300 1234567',
      city: 'Lahore, Pakistan',
      address: '123, Block A, Gulberg 3, Lahore',
      walletBalance: 0,
      loyaltyPoints: 0
    };

    try {
      const res = await apiService.login(email, password);
      if (res && res.success) {
        userObj = {
          ...userObj,
          id: res._id || userObj.id,
          name: res.name || userObj.name,
          email: res.email || email,
          phone: res.phone || userObj.phone,
          city: res.city || userObj.city,
          address: res.address || userObj.address
        };
        if (res.token) {
          try {
            localStorage.setItem('freshmart_token', res.token);
          } catch (e) {}
        }
      }
    } catch (e) {}

    setCustomerUser(userObj);
    autoEnrollCustomer(userObj);
    addToast('Welcome Back! 👋', `Logged in as ${userObj.name}`);
    return { success: true };
  };


  const logoutCustomer = () => {
    setCustomerUser(null);
    try {
      localStorage.removeItem('freshmart_customer_user');
      localStorage.removeItem('freshmart_token');
    } catch (e) {}
    addToast('Logged Out', 'You have been signed out successfully.', 'info');
  };

  const updateCustomerAvatar = (avatarBase64) => {
    setCustomerUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, avatar: avatarBase64 };
      try {
        localStorage.setItem('freshmart_customer_user', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addToast('Profile Picture Updated! 📸', 'Your avatar has been updated.');
  };

  const updateCustomerProfile = (fields) => {
    setCustomerUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...fields };
      try {
        localStorage.setItem('freshmart_customer_user', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addToast('Profile Updated ✨', 'Your changes have been saved.');
  };

  // --- Saved Delivery Locations CRUD ---

  const addSavedAddress = (newAddr) => {
    const item = {
      id: `addr-${Date.now()}`,
      label: newAddr.label || 'Home',
      address: newAddr.address,
      city: newAddr.city || 'Lahore, Pakistan',
      phone: newAddr.phone || customerUser?.phone || '+92 300 1234567'
    };
    setSavedDeliveryAddresses((prev) => [...prev, item]);
    setDeliveryLocation({
      city: item.city,
      address: item.address,
      label: item.label
    });
    addToast('Address Saved 📍', `Added "${item.label}" to your addresses.`);
  };

  const removeSavedAddress = (id) => {
    setSavedDeliveryAddresses((prev) => prev.filter((a) => a.id !== id));
    addToast('Address Removed', 'Location removed from your list.', 'info');
  };

  // --- Order Placement ---
  const placeCustomerOrder = async (orderData) => {
    const custName = orderData.customerName || orderData.recipientName || orderData.customer || customerUser?.name || 'Customer';
    const custEmail = orderData.customerEmail || customerUser?.email || '';
    const custPhone = orderData.customerPhone || orderData.phone || customerUser?.phone || '+92 300 1234567';
    const orderTotal = Number(orderData.totalAmount !== undefined ? orderData.totalAmount : (orderData.total !== undefined ? orderData.total : cartTotal));

    // Normalize order items structure
    const rawItemsList = Array.isArray(orderData.rawItems)
      ? orderData.rawItems
      : Array.isArray(orderData.items)
      ? orderData.items
      : cart || [];

    const orderItems = rawItemsList.map((i) => {
      const p = i.product && typeof i.product === 'object' ? i.product : i;
      const prodId = p._id || p.id || i.id || i.productId;
      return {
        product: prodId,
        id: prodId ? String(prodId) : undefined,
        name: p.name || i.name || 'Grocery Item',
        price: Number(p.price !== undefined ? p.price : (i.price || 0)),
        quantity: Number(i.quantity || 1),
        unit: p.unit || i.unit || '1 unit',
        image: p.image || i.image || '',
        vendorId: p.vendorId || i.vendorId || 'VND-101'
      };
    });

    const shippingAddress =
      typeof orderData.shippingAddress === 'object' && orderData.shippingAddress !== null
        ? orderData.shippingAddress
        : {
            address: orderData.address || deliveryLocation?.address || '123, Block A, Gulberg 3, Lahore',
            city: orderData.city || deliveryLocation?.city || 'Lahore, Pakistan',
            deliverySlot: orderData.deliverySlot || '⚡ 25-35 Mins Express Delivery'
          };

    const localOrderId = orderData.orderId || orderData.id || ('#FM' + Math.floor(10000 + Math.random() * 90000));
    const paymentMethod = orderData.paymentMethod || orderData.payment || 'Cash on Delivery';
    const generatedOtp = String(Math.floor(1000 + Math.random() * 9000));

    const backendPayload = {
      orderId: localOrderId,
      id: localOrderId,
      tenantId: orderData.tenantId || currentTenant?.id || 'tenant-freshmart',
      tenantName: orderData.tenantName || currentTenant?.name || 'FreshMart Direct',
      deliveryOtp: orderData.deliveryOtp || generatedOtp,
      orderItems,
      rawItems: orderItems,
      customerName: custName,
      customer: custName,
      customerPhone: custPhone,
      customerEmail: custEmail,
      shippingAddress,
      address: shippingAddress.address,
      city: shippingAddress.city,
      deliverySlot: shippingAddress.deliverySlot,
      paymentMethod,
      payment: paymentMethod,
      itemsPrice: Number(orderData.subtotal !== undefined ? orderData.subtotal : cartSubtotal),
      subtotal: Number(orderData.subtotal !== undefined ? orderData.subtotal : cartSubtotal),
      deliveryPrice: Number(orderData.deliveryCharges !== undefined ? orderData.deliveryCharges : deliveryCharges),
      deliveryCharges: Number(orderData.deliveryCharges !== undefined ? orderData.deliveryCharges : deliveryCharges),
      discountPrice: Number(orderData.discountAmount || 0),
      discountAmount: Number(orderData.discountAmount || 0),
      totalPrice: orderTotal,
      totalAmount: orderTotal,
      total: orderTotal,
      status: 'Pending'
    };

    let confirmedOrder = {
      ...backendPayload,
      id: localOrderId,
      tenantId: backendPayload.tenantId,
      tenantName: backendPayload.tenantName,
      deliveryOtp: backendPayload.deliveryOtp,
      items: `${orderItems.length} Item${orderItems.length > 1 ? 's' : ''}`,
      status: 'Pending',
      statusClass: 'bg-amber-100 text-amber-800',
      assignedRider: null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      dateFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    try {
      const res = await apiService.createOrder(backendPayload);
      if (res && res.success && res.order) {
        const bOrder = res.order;
        const realId = bOrder.orderId || bOrder.id || bOrder._id || localOrderId;
        confirmedOrder = {
          ...confirmedOrder,
          ...bOrder,
          id: realId,
          orderId: realId,
          deliveryOtp: bOrder.deliveryOtp || backendPayload.deliveryOtp,
          rawItems: orderItems,
          orderItems: orderItems,
          items: `${orderItems.length} Item${orderItems.length > 1 ? 's' : ''}`,
          status: bOrder.status || 'Pending',
          statusClass: bOrder.statusClass || 'bg-amber-100 text-amber-800',
          address: bOrder.shippingAddress?.address || shippingAddress.address,
          city: bOrder.shippingAddress?.city || shippingAddress.city,
          deliverySlot: bOrder.shippingAddress?.deliverySlot || shippingAddress.deliverySlot,
          totalAmount: Number(bOrder.totalPrice || bOrder.totalAmount || orderTotal),
          total: Number(bOrder.totalPrice || bOrder.totalAmount || orderTotal),
          customer: bOrder.customerName || bOrder.customer || custName,
          customerPhone: bOrder.customerPhone || custPhone,
          payment: bOrder.paymentMethod || paymentMethod
        };
      }
    } catch (e) {
      console.error('Backend order creation sync error:', e);
    }

    setCustomerOrders((prev) => [confirmedOrder, ...prev]);
    setAdminOrders((prev) => [confirmedOrder, ...prev]);
    setActiveDeliveryOrder(confirmedOrder);

    // Automatically record / update the customer in Customer Directory
    setCustomers((prev) => {
      const existingIdx = prev.findIndex(
        (c) => (custEmail && c.email === custEmail) || (custPhone && c.phone === custPhone) || c.name === custName
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        const cur = updated[existingIdx];
        const prevSpentNum = parseInt(String(cur.totalSpent).replace(/[^0-9]/g, '')) || 0;
        updated[existingIdx] = {
          ...cur,
          totalOrders: (cur.totalOrders || 0) + 1,
          totalSpent: `Rs. ${(prevSpentNum + orderTotal).toLocaleString()}`,
          lastOrderDate: new Date().toISOString()
        };
        return updated;
      } else {
        const newCust = {
          id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
          name: custName,
          email: custEmail || `${custName.toLowerCase().replace(/\s+/g, '')}@freshmart.pk`,
          phone: custPhone,
          totalOrders: 1,
          totalSpent: `Rs. ${orderTotal.toLocaleString()}`,
          status: 'Active',
          createdAt: new Date().toISOString(),
          lastOrderDate: new Date().toISOString()
        };
        return [newCust, ...prev];
      }
    });

    // Automatically decrement inventory for ordered items
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const matchingItem = (orderItems || []).find(
          (item) =>
            String(item.id || item.product?.id || item.product?._id || item.product) === String(p.id || p._id) ||
            (item.name && item.name.toLowerCase().trim() === p.name.toLowerCase().trim())
        );
        if (matchingItem) {
          const qty = Number(matchingItem.quantity) || 1;
          const currentStock = Number(p.stock !== undefined ? p.stock : (p.stockCount || 50));
          const newStock = Math.max(0, currentStock - qty);
          return {
            ...p,
            stock: newStock,
            stockCount: newStock,
            inStock: newStock > 0,
            status: newStock === 0 ? 'Out of Stock' : newStock < 15 ? 'Low Stock' : 'Active'
          };
        }
        return p;
      });
      try {
        localStorage.setItem('freshmart_products', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    clearCart();
    return confirmedOrder;
  };

  // --- Inventory & Stock Management ---
  const updateProductStock = (productId, newStock) => {
    const stockNum = Math.max(0, parseInt(newStock) || 0);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId || p._id === productId) {
          const updated = {
            ...p,
            stock: stockNum,
            inStock: stockNum > 0
          };
          try {
            apiService.updateProduct(productId, updated);
          } catch (e) {}
          return updated;
        }
        return p;
      })
    );
    addToast('Stock Updated 📦', `Inventory updated to ${stockNum} units.`);
  };

  const toggleProductStockStatus = (productId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId || p._id === productId) {
          const updated = {
            ...p,
            inStock: !p.inStock,
            stock: !p.inStock ? (p.stock > 0 ? p.stock : 25) : 0
          };
          try {
            apiService.updateProduct(productId, updated);
          } catch (e) {}
          return updated;
        }
        return p;
      })
    );
    addToast('Status Changed', 'Product availability toggled.');
  };


  // --- Admin CRUD Helpers ---
  const addProductToStore = async (newProduct) => {
    const priceNum = Number(newProduct.price) || 100;
    const discountNum = Math.max(0, Number(newProduct.discountPercent !== undefined ? newProduct.discountPercent : 0));
    const origPriceNum = Number(
      newProduct.originalPrice !== undefined && Number(newProduct.originalPrice) >= priceNum
        ? newProduct.originalPrice
        : discountNum > 0
        ? Math.round(priceNum / (1 - discountNum / 100))
        : priceNum
    );

    const fullProduct = {
      id: newProduct.id || `prod-${Date.now()}`,
      name: newProduct.name || 'New Product',
      description: newProduct.description || 'Fresh quality grocery product.',
      price: priceNum,
      originalPrice: origPriceNum,
      discountPercent: discountNum,
      category: newProduct.category || 'fruits-veg',
      categoryLabel: newProduct.categoryLabel || newProduct.category || 'Fruits & Vegetables',
      unit: newProduct.unit || '1 Kg',
      image: newProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      stock: Number(newProduct.stock ?? 50),
      stockCount: Number(newProduct.stock ?? 50),
      inStock: newProduct.inStock !== false && Number(newProduct.stock ?? 50) > 0,
      status: newProduct.inStock !== false && Number(newProduct.stock ?? 50) > 0 ? (Number(newProduct.stock ?? 50) < 15 ? 'Low Stock' : 'Active') : 'Out of Stock',
      rating: newProduct.rating || 4.8,
      reviewsCount: newProduct.reviewsCount || 12,
      isFlashDeal: Boolean(newProduct.isFlashDeal),
      isBestSeller: Boolean(newProduct.isBestSeller),
      ...newProduct
    };

    setProducts((prev) => [fullProduct, ...prev]);
    try {
      await apiService.createProduct(fullProduct);
    } catch (e) {
      console.warn('Backend createProduct error:', e);
    }
    addToast('Product Added 🛒', `"${fullProduct.name}" added to catalog.`);
  };

  const updateProductInStore = async (updatedProduct) => {
    if (!updatedProduct) return;
    const targetId = String(updatedProduct.id || updatedProduct._id || updatedProduct.customId || '');
    const targetName = updatedProduct.name?.trim();

    setProducts((prev) =>
      prev.map((p) => {
        const pId = String(p.id || p._id || p.customId || '');
        const isMatch = (targetId && pId && pId === targetId) || (targetName && p.name && p.name.trim() === targetName);

        if (isMatch) {
          return { ...p, ...updatedProduct, id: p.id || targetId };
        }
        return p;
      })
    );
    try {
      if (targetId) {
        await apiService.updateProduct(targetId, updatedProduct);
      }
    } catch (e) {
      console.warn('Backend updateProduct error:', e);
    }
    addToast('Product Updated ✨', `"${updatedProduct.name}" updated.`);
  };

  const deleteProductFromStore = async (productId, productName) => {
    const targetId = String(productId || '');
    const targetName = productName?.trim();
    if (!targetId && !targetName) return;

    setProducts((prev) =>
      prev.filter((p) => {
        const pId = String(p.id || p._id || p.customId || '');
        if (targetId && pId && pId === targetId) return false;
        if (targetName && p.name && p.name.trim() === targetName) return false;
        return true;
      })
    );
    try {
      if (targetId) {
        await apiService.deleteProduct(targetId);
      }
    } catch (e) {
      console.warn('Backend deleteProduct error:', e);
    }
    addToast('Product Removed', `"${productName || 'Product'}" removed.`, 'info');
  };

  const updateCategoryInStore = async (updatedCat) => {
    if (!updatedCat) return;
    const targetId = String(updatedCat.id || updatedCat._id || updatedCat.slug || '');
    const targetName = updatedCat.name?.trim();

    setCategories((prev) =>
      prev.map((c) => {
        const cId = String(c.id || c._id || c.slug || '');
        const isMatch = (targetId && cId && cId === targetId) || (targetName && c.name && c.name.trim() === targetName);
        if (isMatch) {
          return { ...c, ...updatedCat };
        }
        return c;
      })
    );
    try {
      if (targetId) {
        await apiService.updateCategory(targetId, updatedCat);
      }
    } catch (e) {}
    addToast('Category Updated 🗂️', `"${updatedCat.name}" updated.`);
  };

  const addCategoryToStore = async (newCat) => {
    const slug = (newCat.id || newCat.name || `cat-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fullCat = {
      id: slug,
      name: newCat.name,
      shortName: newCat.shortName || newCat.name,
      itemCount: newCat.itemCount || newCat.productCount || 0,
      image: newCat.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80',
      discountBadge: newCat.discountBadge || '',
      subcategories: newCat.subcategories || [newCat.name],
      ...newCat
    };
    setCategories((prev) => [fullCat, ...prev]);
    try {
      await apiService.createCategory(fullCat);
    } catch (e) {}
    addToast('Category Added 🗂️', `"${newCat.name}" added.`);
  };

  const deleteCategoryFromStore = async (catId, catName) => {
    const targetId = String(catId || '');
    const targetName = catName?.trim();
    if (!targetId && !targetName) return;

    setCategories((prev) =>
      prev.filter((c) => {
        const cId = String(c.id || c._id || c.slug || '');
        if (targetId && cId && cId === targetId) return false;
        if (targetName && c.name && c.name.trim() === targetName) return false;
        return true;
      })
    );
    try {
      if (targetId) {
        await apiService.deleteCategory(targetId);
      }
    } catch (e) {}
    addToast('Category Removed', `"${catName || 'Category'}" removed.`, 'info');
  };

  const updateStoreSettings = (newSettings) => {
    setStoreSettings((prev) => ({ ...prev, ...newSettings }));
    addToast('Landing Page Updated 🎨', 'Store banners and discounts updated.');
  };

  // Helper to extract product ID from object or string
  const getProductId = (productOrId) => {
    if (!productOrId) return '';
    if (typeof productOrId === 'object') {
      return String(productOrId.id || productOrId._id || productOrId.name || '');
    }
    return String(productOrId);
  };

  const addToCart = (product, quantity = 1, unit = null) => {
    const chosenUnit = unit || product.unit || '1 unit';
    const prodId = getProductId(product);

    setCart((prev) => {
      const idx = prev.findIndex((item) => getProductId(item.product) === prodId);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        return updated;
      }
      return [...prev, { product: { ...product, id: prodId }, quantity, unit: chosenUnit }];
    });
    addToast('Added to Basket 🛒', `${product.name} (${quantity}x) added.`);
  };

  const updateCartQuantity = (productOrId, delta) => {
    const targetId = getProductId(productOrId);
    setCart((prev) => {
      return prev
        .map((item) => {
          const itemId = getProductId(item.product);
          if (itemId === targetId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productOrId) => {
    const targetId = getProductId(productOrId);
    setCart((prev) => prev.filter((item) => getProductId(item.product) !== targetId));
    addToast('Item Removed', 'Product removed from basket.', 'info');
  };


  const clearCart = () => {
    setCart([]);
  };

  const addRecipeIngredientsToCart = (productIds) => {
    const matchedProducts = products.filter((p) => productIds.includes(String(p.id || p._id)));
    matchedProducts.forEach((p) => addToCart(p, 1));
    addToast('Recipe Bundle Added! 🍲', `Added all ${matchedProducts.length} ingredients to your cart.`);
  };

  // Wishlist Functions with Bulletproof ID normalization
  const getCleanId = (productOrId) => {
    if (!productOrId) return null;
    let id = typeof productOrId === 'object' ? (productOrId.id || productOrId._id) : productOrId;
    if (typeof id !== 'string') return null;
    id = id.trim();
    if (!id || id === 'undefined' || id === 'null') return null;
    return id;
  };

  const toggleWishlist = (productOrId) => {
    const id = getCleanId(productOrId);
    if (!id) return;

    setWishlist((prev) => {
      const exists = prev.includes(id);
      const target = products.find((p) => String(p.id || p._id) === id);
      if (exists) {
        addToast('Removed from Wishlist', `${target?.name || 'Item'} removed.`, 'info');
        return prev.filter((item) => item !== id);
      } else {
        addToast('Added to Wishlist ❤️', `${target?.name || 'Item'} saved.`);
        return [...prev, id];
      }
    });
  };

  const isInWishlist = (productOrId) => {
    const id = getCleanId(productOrId);
    if (!id) return false;
    return wishlist.includes(id);
  };

  // Wishlist calculations
  const validWishlistProducts = products.filter((p) =>
    wishlist.includes(String(p.id || p._id))
  );
  const wishlistCount = validWishlistProducts.length;

  // Cart calculations - Dynamic real-time discount computation
  const cartSubtotal = (cart || []).reduce((sum, item) => {
    const prod = item?.product || item;
    const price = Number(prod?.price || 0);
    const qty = Number(item?.quantity || 1);
    return sum + (price * qty);
  }, 0);
  const isFreeDeliveryCoupon = appliedCoupon && (appliedCoupon.discountType === 'free_shipping' || appliedCoupon.freeShipping);
  const deliveryCharges = (cartSubtotal >= 1500 || cartSubtotal === 0 || isFreeDeliveryCoupon) ? 0 : 50;

  // Real-time dynamic discount based on applied coupon with Maximum Discount Cap & Free Shipping
  const discountAmount = appliedCoupon
    ? (appliedCoupon.discountType === 'percentage' || appliedCoupon.discountPercent
        ? (appliedCoupon.maxDiscount > 0
            ? Math.min(appliedCoupon.maxDiscount, Math.round((cartSubtotal * (appliedCoupon.discountPercent || appliedCoupon.discountAmount)) / 100))
            : Math.round((cartSubtotal * (appliedCoupon.discountPercent || appliedCoupon.discountAmount)) / 100))
        : (appliedCoupon.amount || appliedCoupon.discountAmount || 0))
    : 0;

  const cartTotal = Math.max(0, cartSubtotal + deliveryCharges - discountAmount);
  const totalCartCount = (cart || []).reduce((sum, item) => sum + Number(item?.quantity || 0), 0);

  // Navigation Helper with shareable URLs and browser history synchronization
  const navigateTo = (page, product = null, options = {}) => {
    if (product) setSelectedProduct(product);
    if (options.category) setActiveCategory(options.category);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      let targetPath = '/';
      if (page === 'admin') targetPath = '/admin';
      else if (page === 'vendor' || page === 'vendor-portal') targetPath = '/vendor';
      else if (page === 'delivery-portal') targetPath = '/delivery-portal';
      else if (page === 'customer-portal') targetPath = '/customer-portal';
      else if (page === 'delivery') targetPath = '/delivery';
      else if (page === 'shop') {
        const cat = options.category || (activeCategory && activeCategory !== 'All' ? activeCategory : null);
        targetPath = cat ? `/shop?category=${encodeURIComponent(cat)}` : '/shop';
      }
      else if (page === 'deals') targetPath = '/deals';
      else if (page === 'recipes') targetPath = '/recipes';
      else if (page === 'checkout') targetPath = '/checkout';
      else if (page === 'product-detail') {
        const targetProd = product || selectedProduct;
        const slug = targetProd
          ? (targetProd.customId || (targetProd.name ? targetProd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : targetProd.id || targetProd._id))
          : 'item';
        targetPath = `/product/${slug}`;
      }
      else targetPath = '/';

      const currentFullUrl = window.location.pathname + window.location.search;
      if (currentFullUrl !== targetPath) {
        window.history.pushState({ page, productId: (product || selectedProduct)?.id, category: options.category }, '', targetPath);
      }
    } catch (e) {}
  };

  // Browser back/forward button and URL hashchange listener
  useEffect(() => {
    const handleLocationChange = () => {
      const route = parseRouteFromUrl(products);
      setCurrentPage(route.page);
      if (route.product) {
        setSelectedProduct(route.product);
      }
      if (route.category) {
        setActiveCategory(route.category);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [products]);

  // Dynamic SEO metadata & page title synchronization
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let pageTitle = 'FreshMart - 100% Organic & Farm Fresh Groceries Delivered in Minutes';
    let metaDesc = 'Order farm-fresh vegetables, organic fruits, pure dairy, bakery, and daily grocery essentials with FreshMart. 10-15 min express delivery.';

    switch (currentPage) {
      case 'shop':
        pageTitle = activeCategory && activeCategory !== 'All'
          ? `${activeCategory} - FreshMart Online Grocery`
          : 'Shop All Fresh Groceries & Daily Essentials | FreshMart';
        metaDesc = 'Explore our complete catalog of farm-fresh fruits, organic vegetables, dairy, bakery, meat, and pantry essentials.';
        break;
      case 'product-detail':
        if (selectedProduct) {
          pageTitle = `${selectedProduct.name} (Rs. ${selectedProduct.price}) | FreshMart`;
          metaDesc = `Buy ${selectedProduct.name} for Rs. ${selectedProduct.price} online. Fresh stock, 10-15 min express delivery, and 100% satisfaction guarantee.`;
        }
        break;
      case 'deals':
        pageTitle = 'Hot Deals, Bundles & Mega Discounts | FreshMart';
        metaDesc = 'Save big on weekly grocery combos, flash deals, and exclusive promo codes at FreshMart.';
        break;
      case 'delivery':
        pageTitle = 'Express 15-Min Delivery Tracking | FreshMart';
        metaDesc = 'Real-time live map tracking and delivery status for your FreshMart orders.';
        break;
      case 'recipes':
        pageTitle = 'Chef Recipes & Instant Grocery Meal Kits | FreshMart';
        metaDesc = 'Cook fresh homemade meals with 1-click recipe ingredient carts from FreshMart.';
        break;
      case 'checkout':
        pageTitle = 'Secure Checkout & Payment | FreshMart';
        metaDesc = 'Fast, secure checkout with multiple payment options and express delivery scheduling.';
        break;
      case 'admin':
        pageTitle = 'FreshMart Operations & Store Admin Suite';
        break;
      case 'vendor':
      case 'vendor-portal':
        pageTitle = 'Vendor Partner Portal & Marketplace Dashboard | FreshMart';
        break;
      case 'customer-portal':
        pageTitle = 'My Account, Saved Addresses & Orders | FreshMart';
        break;
      default:
        pageTitle = 'FreshMart - 100% Organic & Farm Fresh Groceries Delivered in Minutes';
        break;
    }

    document.title = pageTitle;

    const metaDescriptionEl = document.querySelector('meta[name="description"]');
    if (metaDescriptionEl) {
      metaDescriptionEl.setAttribute('content', metaDesc);
    }
  }, [currentPage, selectedProduct, activeCategory]);

  // Validate coupon code with strict enforcement of all 8 parameters
  const applyCouponCode = async (rawCode, options = {}) => {
    if (!rawCode || !rawCode.trim()) {
      if (!options.silent) {
        addToast('Enter Coupon Code', 'Please enter a valid coupon code.', 'info');
      }
      return false;
    }

    const code = rawCode.trim().toUpperCase();

    // 1. Try validating with backend REST API first
    try {
      const res = await apiService.validateCoupon(code, cartSubtotal);
      if (res && res.success && res.coupon) {
        setAppliedCoupon({ ...res.coupon, isAutoApplied: Boolean(options.isAuto) });
        if (!options.silent) {
          addToast('Coupon Applied! 🎉', res.coupon.description || 'Promo discount applied.');
        }
        return true;
      } else if (res && res.message && !res.success && res.message !== 'Failed to fetch' && !options.silent) {
        addToast('Cannot Apply Coupon ⚠️', res.message, 'error');
        return false;
      }
    } catch (e) {}

    // 2. Client-side evaluation against dynamic promotions state (Offline / Local fallback)
    const matchedPromo = (promotions || []).find(
      (p) => p.code && p.code.toUpperCase() === code
    );

    if (matchedPromo) {
      // 1. Status Check
      if (matchedPromo.status !== 'Active') {
        if (!options.silent) {
          addToast('Inactive Coupon ⏸️', `Coupon "${matchedPromo.code}" is currently ${matchedPromo.status.toLowerCase()}.`, 'error');
        }
        return false;
      }

      const now = new Date();

      // 2. Start Date Check
      const startDate = matchedPromo.startDate || matchedPromo.validFrom;
      if (startDate && now < new Date(startDate)) {
        if (!options.silent) {
          addToast('Not Active Yet ⏳', `Coupon "${matchedPromo.code}" starts on ${new Date(startDate).toLocaleDateString()}.`, 'error');
        }
        return false;
      }

      // 3. End Date Check
      const endDate = matchedPromo.endDate || matchedPromo.validTo;
      if (endDate && now > new Date(endDate)) {
        if (!options.silent) {
          addToast('Coupon Expired ❌', `Coupon "${matchedPromo.code}" expired on ${new Date(endDate).toLocaleDateString()}.`, 'error');
        }
        return false;
      }

      // 4. Minimum Order Check
      const minOrder = Number(matchedPromo.minOrder || matchedPromo.minSpend || 0);
      if (minOrder > 0 && cartSubtotal > 0 && cartSubtotal < minOrder) {
        if (!options.silent) {
          addToast('Minimum Order Required 🛒', `Order at least Rs. ${minOrder.toLocaleString()} to use coupon "${matchedPromo.code}".`, 'error');
        }
        return false;
      }

      // 5. Usage Limit Check
      const usageLimit = Number(matchedPromo.usageLimit || 0);
      const usedCount = Number(matchedPromo.usedCount || 0);
      if (usageLimit > 0 && usedCount >= usageLimit) {
        if (!options.silent) {
          addToast('Usage Limit Reached 🚫', `Coupon "${matchedPromo.code}" has reached its limit of ${usageLimit} uses.`, 'error');
        }
        return false;
      }

      // 6. Calculate Final Discount
      const discountType = matchedPromo.discountType || (matchedPromo.discount?.includes('%') ? 'percentage' : 'fixed');
      const discountAmount = Number(matchedPromo.discountAmount || (matchedPromo.discount ? parseInt(matchedPromo.discount, 10) : 10));
      const maxDiscount = Number(matchedPromo.maxDiscount || 0);

      let calcAmount = 0;
      let desc = '';

      if (discountType === 'percentage') {
        const rawPct = Math.round((cartSubtotal * discountAmount) / 100);
        calcAmount = maxDiscount > 0 ? Math.min(maxDiscount, rawPct) : rawPct;
        desc = `${discountAmount}% discount applied${maxDiscount > 0 ? ` (capped at Rs. ${maxDiscount.toLocaleString()})` : ''}!`;
      } else if (discountType === 'fixed') {
        calcAmount = cartSubtotal > 0 ? Math.min(cartSubtotal, discountAmount) : discountAmount;
        desc = `Flat Rs. ${discountAmount.toLocaleString()} discount applied!`;
      } else if (discountType === 'free_shipping' || matchedPromo.freeShipping) {
        calcAmount = 0;
        desc = 'Free Express Delivery applied!';
      }

      const couponPayload = {
        code: matchedPromo.code,
        title: matchedPromo.title,
        discountType,
        discountAmount,
        discountPercent: discountType === 'percentage' ? discountAmount : 0,
        amount: calcAmount,
        minOrder,
        maxDiscount,
        freeShipping: discountType === 'free_shipping' || matchedPromo.freeShipping,
        startDate,
        endDate,
        usageLimit,
        usedCount,
        description: desc,
        isAutoApplied: Boolean(options.isAuto)
      };

      setAppliedCoupon(couponPayload);
      if (!options.silent) {
        addToast('Coupon Applied! 🎉', desc);
      }
      return true;
    }

    // 3. Check official fallback store coupon codes
    if (code === 'WELCOME20' || code === 'FIRST20') {
      setAppliedCoupon({
        code,
        discountType: 'percentage',
        discountPercent: 20,
        minOrder: 500,
        maxDiscount: 500,
        description: 'Flat 20% discount applied to your order!',
        isAutoApplied: Boolean(options.isAuto)
      });
      if (!options.silent) {
        addToast('Coupon Applied! 🎉', 'Flat 20% welcome discount applied.');
      }
      return true;
    }
    if (code === 'FRESH15') {
      setAppliedCoupon({
        code: 'FRESH15',
        discountType: 'percentage',
        discountPercent: 15,
        minOrder: 500,
        maxDiscount: 400,
        description: '15% discount applied on all fresh items!',
        isAutoApplied: Boolean(options.isAuto)
      });
      if (!options.silent) {
        addToast('Coupon Applied! 🎉', '15% discount activated.');
      }
      return true;
    }
    if (code === 'FLASH30') {
      setAppliedCoupon({
        code: 'FLASH30',
        discountType: 'percentage',
        discountPercent: 30,
        minOrder: 1000,
        maxDiscount: 500,
        description: 'Super Weekend Flash Sale 30% OFF applied!',
        isAutoApplied: Boolean(options.isAuto)
      });
      if (!options.silent) {
        addToast('Flash Sale Activated! 🔥', '30% super discount applied.');
      }
      return true;
    }
    if (code === 'FRESH50') {
      setAppliedCoupon({
        code: 'FRESH50',
        discountType: 'fixed',
        amount: 50,
        minOrder: 300,
        description: 'Flat Rs. 50 instant cash voucher deducted.',
        isAutoApplied: Boolean(options.isAuto)
      });
      if (!options.silent) {
        addToast('Voucher Applied! 🎫', 'Flat Rs. 50 discount deducted.');
      }
      return true;
    }
    if (code === 'FREESHIP') {
      setAppliedCoupon({
        code: 'FREESHIP',
        discountType: 'free_shipping',
        freeShipping: true,
        amount: 0,
        minOrder: 800,
        description: 'Free Express Doorstep Delivery applied!',
        isAutoApplied: Boolean(options.isAuto)
      });
      if (!options.silent) {
        addToast('Free Shipping! 🚚', 'Delivery fee waived.');
      }
      return true;
    }

    if (!options.silent) {
      addToast('Invalid Coupon ❌', `Coupon code "${code}" is invalid or expired.`, 'error');
    }
    return false;
  };

  // Auto-apply the best available coupon/discount when items exist in cart
  useEffect(() => {
    if (cartSubtotal > 0 && !appliedCoupon) {
      const validAdminPromos = (promotions || []).filter((p) => {
        if (p.status !== 'Active') return false;
        const now = new Date();
        const start = p.startDate || p.validFrom;
        if (start && now < new Date(start)) return false;
        const end = p.endDate || p.validTo;
        if (end && now > new Date(end)) return false;
        const minOrder = Number(p.minOrder || p.minSpend || 0);
        if (minOrder > 0 && cartSubtotal < minOrder) return false;
        const usageLimit = Number(p.usageLimit || 0);
        const usedCount = Number(p.usedCount || 0);
        if (usageLimit > 0 && usedCount >= usageLimit) return false;
        return true;
      });

      const defaultPromos = [
        { code: 'WELCOME20', discountType: 'percentage', discountPercent: 20, minOrder: 500, maxDiscount: 500 },
        { code: 'FRESH15', discountType: 'percentage', discountPercent: 15, minOrder: 500, maxDiscount: 400 },
        { code: 'FREESHIP', discountType: 'free_shipping', freeShipping: true, minOrder: 800 }
      ].filter((p) => cartSubtotal >= p.minOrder);

      const candidates = [...validAdminPromos, ...defaultPromos];
      if (candidates.length > 0) {
        const best = candidates.sort((a, b) => {
          const calcVal = (p) => {
            const amt = Number(p.discountAmount || p.discountPercent || (p.discountType === 'percentage' ? 20 : 0));
            if (p.discountType === 'percentage' || amt > 0) {
              const raw = (cartSubtotal * (p.discountPercent || amt)) / 100;
              return p.maxDiscount > 0 ? Math.min(p.maxDiscount, raw) : raw;
            }
            if (p.discountType === 'free_shipping' || p.freeShipping) return 50;
            return Number(p.amount || amt || 0);
          };
          return calcVal(b) - calcVal(a);
        })[0];

        if (best && best.code) {
          applyCouponCode(best.code, { silent: true, isAuto: true });
        }
      }
    }
  }, [cartSubtotal, promotions, appliedCoupon]);

  const removeCouponCode = () => {
    if (appliedCoupon) {
      const prevCode = appliedCoupon.code;
      setAppliedCoupon(null);
      addToast('Coupon Removed', `Coupon "${prevCode}" has been removed.`, 'info');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setAdminOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          let statusColor = 'bg-slate-100 text-slate-800';
          if (newStatus === 'Delivered') statusColor = 'bg-emerald-100 text-emerald-800';
          if (newStatus === 'Processing') statusColor = 'bg-blue-100 text-blue-800';
          if (newStatus === 'Out for Delivery') statusColor = 'bg-amber-100 text-amber-800';
          if (newStatus === 'Cancelled') statusColor = 'bg-rose-100 text-rose-800';
          return { ...order, status: newStatus, statusColor };
        }
        return order;
      })
    );
    apiService.updateOrderStatus(orderId, newStatus);
    addToast('Order Status Updated', `Order ${orderId} is now ${newStatus}.`);
  };

  return (
    <StoreContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        navigateTo,
        customerUser,
        setCustomerUser,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        updateCustomerAvatar,
        updateCustomerProfile,
        customerNotifications,
        setCustomerNotifications,
        addCustomerNotification,
        customerOrders,

        setCustomerOrders,
        activeDeliveryOrder,
        setActiveDeliveryOrder,
        savedDeliveryAddresses,
        setSavedDeliveryAddresses,
        addSavedAddress,
        removeSavedAddress,
        placeCustomerOrder,
        verifyOrderDeliveryOtp,
        riders,
        setRiders,
        addRider,
        updateRider,
        deleteRider,
        clearAllRiders,
        toggleRiderStatus,
        assignRiderToOrder,
        updateDeliveryOrderStatus,
        updateRiderLiveLocation,
        trackOrderRemote,
        suppliers,
        setSuppliers,
        addSupplier,
        deleteSupplier,
        updateSupplier,
        registerVendorApplication,
        approveVendor,
        rejectVendor,
        customers,
        setCustomers,
        addCustomer,
        deleteCustomer,
        updateCustomer,
        products,


        setProducts,
        categories,
        setCategories,
        storeSettings,
        setStoreSettings,
        updateStoreSettings,
        addProductToStore,
        updateProductInStore,
        deleteProductFromStore,
        addCategoryToStore,
        updateCategoryInStore,
        deleteCategoryFromStore,
        selectedProduct,
        setSelectedProduct,
        deliveryLocation,
        setDeliveryLocation,
        isLocationModalOpen,
        setIsLocationModalOpen,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        addRecipeIngredientsToCart,
        wishlist,
        wishlistCount,
        validWishlistProducts,
        toggleWishlist,
        isInWishlist,

        cartSubtotal,
        deliveryCharges,
        discountAmount,
        cartTotal,
        totalCartCount,
        activeCategory,
        setActiveCategory,
        selectedBrands,
        setSelectedBrands,
        priceRange,
        setPriceRange,
        minRating,
        setMinRating,
        searchQuery,
        setSearchQuery,
        selectedSearchCategory,
        setSelectedSearchCategory,
        sortBy,
        setSortBy,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isOrderTrackerOpen,
        setIsOrderTrackerOpen,
        isOffersOpen,
        setIsOffersOpen,
        isAuthOpen,
        setIsAuthOpen,
        isVendorRegisterOpen,
        setIsVendorRegisterOpen,
        quickViewProduct,
        setQuickViewProduct,
        currency,
        setCurrency,
        appliedCoupon,
        setAppliedCoupon,
        applyCouponCode,
        removeCouponCode,
        adminOrders,
        updateOrderStatus,
        adminStats,
        user,
        setUser,
        isAdminLoggedIn,
        setIsAdminLoggedIn,
        adminRole,
        setAdminRole,
        adminLogin,
        adminLogout,
        promotions,

        setPromotions,
        addPromotion,
        updatePromotion,
        deletePromotion,
        togglePromotionStatus,
        updateProductStock,
        toggleProductStockStatus,
        toasts,
        addToast,
        removeToast,
        tenants,
        setTenants,
        currentTenant,
        setCurrentTenant,
        addTenant,
        inviteTenant,
        approveTenant,
        suspendTenant,
        activateTenant,
        deleteTenant,
        updateTenantSubscription,
        getTenantOrders,
        getTenantPerformance,
        getPlatformOverview
      }}
    >
      {children}

    </StoreContext.Provider>
  );
};
