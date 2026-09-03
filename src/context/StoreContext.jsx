import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  FRESHMART_PRODUCTS,
  FRESHMART_CATEGORIES,
  ADMIN_STATS,
  ADMIN_RECENT_ORDERS,
  ADMIN_INVENTORY_ALERTS,
  COUPONS
} from '../data/freshMartData';
import { apiService } from '../services/api';

const StoreContext = createContext();

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

const getInitialPageFromUrl = () => {
  if (typeof window === 'undefined') return 'home';
  const path = (window.location.pathname || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase();
  const search = (window.location.search || '').toLowerCase();

  if (path.startsWith('/admin') || hash === '#admin' || search.includes('admin')) {
    return 'admin';
  }
  if (path.startsWith('/customer-portal') || path.startsWith('/portal') || hash === '#customer-portal' || hash === '#portal') {
    return 'customer-portal';
  }
  if (path.startsWith('/delivery') || hash === '#delivery') return 'delivery';
  if (path.startsWith('/shop') || hash === '#shop') return 'shop';
  if (path.startsWith('/deals') || hash === '#deals') return 'deals';
  if (path.startsWith('/recipes') || hash === '#recipes') return 'recipes';
  if (path.startsWith('/checkout') || hash === '#checkout') return 'checkout';
  return 'home';
};

export const StoreProvider = ({ children }) => {
  // Current active page view: 'home' | 'shop' | 'product-detail' | 'checkout' | 'admin' | 'recipes' | 'deals' | 'customer-portal' | 'delivery'
  const [currentPage, setCurrentPage] = useState(getInitialPageFromUrl);

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
      if (saved) return JSON.parse(saved);
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

  // Products state (Single source of truth with localStorage persistence)
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return FRESHMART_PRODUCTS;
  });

  // Categories state (Single source of truth with localStorage persistence)
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return FRESHMART_CATEGORIES;
  });

  // Dynamic Landing Page & Admin Store Settings
  const [storeSettings, setStoreSettings] = useState({
    topAnnouncement: 'Get 20% OFF on your first order - Use code: WELCOME20',
    topPromoCode: 'WELCOME20',
    heroBadgeText: 'FLAT 20% OFF',
    heroDiscountPercent: 20,
    dealOfDayProductId: 'fresh-apples-1kg',
    firstOrderPromoCode: 'FIRST20'
  });

  // Selected product for single product details page
  const [selectedProduct, setSelectedProduct] = useState(FRESHMART_PRODUCTS[0]);

  // Delivery Location (Starts empty until user adds their address)
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_delivery_location');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      city: '',
      address: '',
      label: ''
    };
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Discount & Expiring Deals Notifications with Time Alerts
  const [customerNotifications, setCustomerNotifications] = useState([
    {
      id: 'notif-1',
      type: 'discount',
      title: '🔥 Mega Flash Sale: 20% OFF Everything!',
      message: 'Use coupon code WELCOME20 to get instant 20% discount on fresh fruits, dairy, and grocery items.',
      code: 'WELCOME20',
      discountPercent: 20,
      expiresAt: 'Ends in 02 hrs 45 mins',
      urgent: true,
      time: '10 mins ago',
      read: false
    },
    {
      id: 'notif-2',
      type: 'discount',
      title: '🥦 Farm Fresh Veggies: 10% OFF Special',
      message: 'Farm-fresh organic spinach, tomatoes, and broccoli on sale. Apply coupon code VEG10 at checkout.',
      code: 'VEG10',
      discountPercent: 10,
      expiresAt: 'Ends Tonight at 11:59 PM',
      urgent: true,
      time: '1 hour ago',
      read: false
    },
    {
      id: 'notif-3',
      type: 'promo',
      title: '⚡ 10-Minute Free Express Delivery',
      message: 'Enjoy free instant delivery on all grocery baskets above PKR 1,500. Guaranteed cold-chain freshness.',
      code: 'FREESHIP',
      expiresAt: 'Valid for next 4 hours',
      urgent: false,
      time: '3 hours ago',
      read: true
    },
    {
      id: 'notif-4',
      type: 'wallet',
      title: '🎁 Welcome Bonus PKR 200 Credited',
      message: 'Your signup bonus of PKR 200 is available in your FreshMart Wallet. Use it on your first grocery basket!',
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
      if (saved) return JSON.parse(saved);
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

  // Applied Coupon
  const [appliedCoupon, setAppliedCoupon] = useState({
    code: 'WELCOME20',
    discountPercent: 20,
    amount: 50,
    description: 'Special 20% Welcome Coupon'
  });

  // Admin Data State (Starts empty - populated as customer orders arrive)
  const [adminOrders, setAdminOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_customer_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [adminStats, setAdminStats] = useState(ADMIN_STATS);


  // Admin Profile & Authentication (Starts false so visiting /admin asks for role & credentials)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const [user, setUser] = useState({
    name: 'Super Admin',
    email: 'admin@freshmart.com',
    role: 'admin'
  });

  const adminLogin = (username, password, role = 'admin') => {
    const targetRole = (role || 'admin').toLowerCase();
    const cleanUser = (username || targetRole).trim().toLowerCase();
    const cleanPass = (password || '').trim();

    let matchedUser = null;

    if (targetRole === 'rider') {
      const foundRider = (riders || []).find(
        (r) =>
          (r.username && r.username.toLowerCase() === cleanUser) ||
          (r.phone && r.phone.replace(/[^0-9]/g, '') === cleanUser.replace(/[^0-9]/g, '')) ||
          (r.name && r.name.toLowerCase() === cleanUser)
      );

      if (foundRider) {
        if (cleanPass && foundRider.password && cleanPass !== foundRider.password && cleanPass !== 'rider123' && cleanPass !== 'admin123') {
          addToast('Incorrect Password ❌', `Password for rider ${foundRider.name} is incorrect.`, 'error');
          return { success: false, error: 'Incorrect rider password' };
        }
        matchedUser = {
          name: foundRider.name,
          email: `${foundRider.name.toLowerCase().replace(/\s+/g, '')}@rider.freshmart.pk`,
          role: 'rider',
          riderId: foundRider.id,
          phone: foundRider.phone,
          zone: foundRider.zone
        };
      } else {
        matchedUser = {
          name: cleanUser === 'rider' ? 'Delivery Fleet Rider' : cleanUser,
          email: `${cleanUser}@rider.freshmart.pk`,
          role: 'rider',
          riderId: 'RDR-101'
        };
      }
    } else if (targetRole === 'supplier') {
      const foundSupplier = (suppliers || []).find(
        (s) =>
          (s.username && s.username.toLowerCase() === cleanUser) ||
          (s.email && s.email.toLowerCase() === cleanUser) ||
          (s.name && s.name.toLowerCase() === cleanUser)
      );

      if (foundSupplier) {
        if (cleanPass && foundSupplier.password && cleanPass !== foundSupplier.password && cleanPass !== 'supplier123' && cleanPass !== 'admin123') {
          addToast('Incorrect Password ❌', `Password for supplier ${foundSupplier.name} is incorrect.`, 'error');
          return { success: false, error: 'Incorrect supplier password' };
        }
        matchedUser = {
          name: foundSupplier.name,
          email: foundSupplier.email,
          role: 'supplier',
          supplierId: foundSupplier.id
        };
      } else {
        matchedUser = {
          name: cleanUser === 'supplier' ? 'Supplier Partner' : cleanUser,
          email: `${cleanUser}@supplier.freshmart.pk`,
          role: 'supplier',
          supplierId: 'SUP-101'
        };
      }
    } else {
      matchedUser = {
        name: 'Store Admin',
        email: 'admin@freshmart.pk',
        role: 'admin'
      };
    }

    setAdminRole(targetRole);
    setIsAdminLoggedIn(true);
    setUser(matchedUser);

    const roleTitles = {
      admin: 'Administrator',
      supplier: 'Supplier Partner',
      rider: 'Delivery Rider'
    };

    try {
      localStorage.setItem('freshmart_admin_session', 'true');
      localStorage.setItem('freshmart_admin_role', targetRole);
      localStorage.setItem('freshmart_admin_user', JSON.stringify(matchedUser));
    } catch (e) {}

    addToast(`${roleTitles[targetRole] || 'Staff'} Authenticated 🛡️`, `Welcome ${matchedUser.name} to the dashboard.`);
    return { success: true, role: targetRole, user: matchedUser };
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('freshmart_admin_session');
      localStorage.removeItem('freshmart_admin_role');
      localStorage.removeItem('freshmart_admin_user');
    } catch (e) {}
    addToast('Signed Out', 'You have been logged out of the staff portal.', 'info');
    navigateTo('home');
  };


  // Toasts
  const [toasts, setToasts] = useState([]);

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

  // Riders State (Empty initially - added by Admin)
  const [riders, setRiders] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_riders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_riders', JSON.stringify(riders));
    } catch (e) {}
  }, [riders]);

  // Default Seed Supplier: Tayyab (Coca-Cola Beverages)
  const defaultSuppliersList = [
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

  // Suppliers State (Includes Tayyab - Coca-Cola)
  const [suppliers, setSuppliers] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_suppliers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
        if (res && res.success && Array.isArray(res.suppliers) && res.suppliers.length > 0) {
          setSuppliers(res.suppliers);
          localStorage.setItem('freshmart_suppliers', JSON.stringify(res.suppliers));
        } else {
          setSuppliers(defaultSuppliersList);
          localStorage.setItem('freshmart_suppliers', JSON.stringify(defaultSuppliersList));
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


  // Promotions & Banner Management State
  const [promotions, setPromotions] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_promotions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
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
        title: 'Snacks & Beverage Bundles',
        discount: 'Buy 2 Get 1 Free',
        validity: 'Valid: 20 - 28 Aug 2026',
        category: 'Bundles',
        status: 'Active',
        bannerImg: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
        code: 'BUNDLE1'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_promotions', JSON.stringify(promotions));
    } catch (e) {}
  }, [promotions]);

  const addPromotion = (newPromo) => {
    const promoItem = {
      id: `PROMO-${Date.now()}`,
      title: newPromo.title,
      discount: newPromo.discount || '20% OFF',
      validity: newPromo.validity || 'Valid this month',
      category: newPromo.category || 'Flash Sales',
      status: newPromo.status || 'Active',
      bannerImg: newPromo.bannerImg || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      code: newPromo.code || 'SAVE20'
    };
    setPromotions((prev) => [promoItem, ...prev]);
    addToast('Promotion Banner Created 🎨', `"${promoItem.title}" is now active.`);
    return promoItem;
  };

  const updatePromotion = (id, updatedFields) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
    addToast('Banner Updated ✨', 'Promotion banner changes saved.');
  };

  const deletePromotion = (id) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
    addToast('Promotion Removed 🗑️', 'Banner deleted successfully.', 'info');
  };

  const togglePromotionStatus = (id) => {
    setPromotions((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === 'Active' ? 'Paused' : 'Active' } : p
      )
    );
    addToast('Status Toggled', 'Promotion campaign status updated.');
  };




  useEffect(() => {
    try {
      localStorage.setItem('freshmart_saved_addresses', JSON.stringify(savedDeliveryAddresses));
    } catch (e) {}
  }, [savedDeliveryAddresses]);

  // Toast Helpers
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
      walletBalance: 320,
      loyaltyPoints: 100
    };

    try {
      const res = await apiService.register(userData);
      if (res && res.success) {
        userObj.id = res._id || userObj.id;
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
      walletBalance: 320,
      loyaltyPoints: 150
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
      }
    } catch (e) {}

    setCustomerUser(userObj);
    autoEnrollCustomer(userObj);
    addToast('Welcome Back! 👋', `Logged in as ${userObj.name}`);
    return { success: true };
  };


  const logoutCustomer = () => {
    setCustomerUser(null);
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

  // --- Rider Management Methods ---
  const addRider = (newRider) => {
    const riderObj = {
      id: newRider.id || `RDR-${Math.floor(100 + Math.random() * 900)}`,
      name: newRider.name,
      phone: newRider.phone || '0300-0000000',
      vehicleType: newRider.vehicleType || '🏍️ Honda 125',
      vehicleNumber: newRider.vehicleNumber || 'LEK-0000',
      zone: newRider.zone || 'Lahore Hub',
      status: newRider.status || 'On-Duty',
      username: newRider.username || newRider.name.toLowerCase().replace(/\s+/g, '_'),
      password: newRider.password || 'rider123',
      deliveriesCount: Number(newRider.deliveriesCount) || 0,
      rating: Number(newRider.rating) || 5.0,
      activeOrderId: null,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };
    setRiders((prev) => {
      const updated = [riderObj, ...prev];
      try {
        localStorage.setItem('freshmart_riders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    apiService.createRider(riderObj);
    addToast('Rider Registered 🛵', `"${riderObj.name}" added to delivery fleet.`);
    return riderObj;
  };

  const updateRider = (riderId, updatedData) => {
    setRiders((prev) => {
      const updated = prev.map((r) => (r.id === riderId ? { ...r, ...updatedData } : r));
      try {
        localStorage.setItem('freshmart_riders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addToast('Rider Profile Updated 📝', 'Rider details saved.');
  };

  const deleteRider = (riderId) => {
    setRiders((prev) => {
      const updated = prev.filter((r) => r.id !== riderId);
      try {
        localStorage.setItem('freshmart_riders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    apiService.deleteRider(riderId);
    addToast('Rider Removed', 'Rider removed from active fleet.', 'info');
  };

  const clearAllRiders = () => {
    setRiders([]);
    try {
      localStorage.setItem('freshmart_riders', JSON.stringify([]));
    } catch (e) {}
    apiService.clearAllRiders();
    addToast('Fleet Cleared 🛵', 'All riders removed. You can now add your own riders.', 'info');
  };

  const toggleRiderStatus = (riderId) => {
    setRiders((prev) =>
      prev.map((r) => {
        if (r.id === riderId) {
          const nextStatus = r.status === 'On-Duty' ? 'Offline' : 'On-Duty';
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  const assignRiderToOrder = (orderId, riderId) => {
    const rider = riders.find((r) => r.id === riderId);
    setCustomerOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              assignedRider: rider ? { id: rider.id, name: rider.name, phone: rider.phone, vehicle: rider.vehicleNumber } : null,
              status: 'Dispatched to Rider'
            }
          : o
      )
    );
    if (activeDeliveryOrder && activeDeliveryOrder.id === orderId) {
      setActiveDeliveryOrder((prev) => ({
        ...prev,
        assignedRider: rider ? { id: rider.id, name: rider.name, phone: rider.phone, vehicle: rider.vehicleNumber } : null,
        status: 'Dispatched to Rider'
      }));
    }
    addToast('Order Assigned 📦', `Order ${orderId} assigned to ${rider?.name || 'Rider'}.`);
  };

  const updateDeliveryOrderStatus = (orderId, newStatus) => {
    setCustomerOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (activeDeliveryOrder && activeDeliveryOrder.id === orderId) {
      setActiveDeliveryOrder((prev) => ({ ...prev, status: newStatus }));
    }
    addToast('Delivery Status Updated 🚚', `Order ${orderId}: ${newStatus}`);
  };

  // --- Order Placement ---
  const placeCustomerOrder = async (orderData) => {
    const custName = orderData.customerName || customerUser?.name || 'Customer';
    const custEmail = orderData.customerEmail || customerUser?.email || '';
    const custPhone = orderData.customerPhone || customerUser?.phone || '+92 300 1234567';
    const orderTotal = orderData.totalAmount || cartTotal;
    const orderItems = orderData.items || cart;

    const newOrder = {
      id: orderData.id || `#ORD${Math.floor(1000 + Math.random() * 9000)}`,
      customer: custName,
      customerEmail: custEmail,
      customerPhone: custPhone,
      items: `${orderItems.length} Item${orderItems.length > 1 ? 's' : ''}`,
      rawItems: orderItems,
      totalAmount: orderTotal,
      total: orderTotal,
      subtotal: orderData.subtotal || cartSubtotal,
      deliveryCharges: orderData.deliveryCharges || deliveryCharges,
      status: 'Preparing',
      statusClass: 'bg-blue-100 text-blue-800',
      payment: orderData.paymentMethod || 'Cash on Delivery',
      deliverySlot: orderData.deliverySlot || '⚡ 10-15 Mins Express',
      address: orderData.address || deliveryLocation?.address || '123, Block A, Gulberg 3, Lahore',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      dateFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setCustomerOrders((prev) => [newOrder, ...prev]);
    setAdminOrders((prev) => [newOrder, ...prev]);
    setActiveDeliveryOrder(newOrder);

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

    try {
      await apiService.createOrder(newOrder);
    } catch (e) {}

    clearCart();
    return newOrder;
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
    const fullProduct = {
      id: newProduct.id || `prod-${Date.now()}`,
      name: newProduct.name || 'New Product',
      description: newProduct.description || 'Fresh quality grocery product.',
      price: Number(newProduct.price) || 100,
      originalPrice: Number(newProduct.originalPrice) || Math.round(Number(newProduct.price || 100) * 1.2),
      discountPercent: Number(newProduct.discountPercent) || 0,
      category: newProduct.category || 'fruits-veg',
      categoryLabel: newProduct.categoryLabel || newProduct.category || 'Fruits & Vegetables',
      unit: newProduct.unit || '1 Kg',
      image: newProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      stock: Number(newProduct.stock ?? 50),
      stockCount: Number(newProduct.stock ?? 50),
      inStock: newProduct.inStock !== false,
      status: newProduct.inStock !== false ? 'Active' : 'Out of Stock',
      rating: newProduct.rating || 4.8,
      reviewsCount: newProduct.reviewsCount || 12,
      ...newProduct
    };

    setProducts((prev) => [fullProduct, ...prev]);
    try {
      await apiService.createProduct(fullProduct);
    } catch (e) {}
    addToast('Product Added 🛒', `"${fullProduct.name}" added to catalog.`);
  };

  const updateProductInStore = async (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === updatedProduct.id || p._id === updatedProduct.id) {
          return { ...p, ...updatedProduct };
        }
        return p;
      })
    );
    try {
      await apiService.updateProduct(updatedProduct.id, updatedProduct);
    } catch (e) {}
    addToast('Product Updated ✨', `"${updatedProduct.name}" updated.`);
  };

  const deleteProductFromStore = async (productId, productName) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId && p._id !== productId));
    try {
      await apiService.deleteProduct(productId);
    } catch (e) {}
    addToast('Product Removed', `"${productName || 'Product'}" removed.`, 'info');
  };

  const updateCategoryInStore = async (updatedCat) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id || c._id === updatedCat.id ? { ...c, ...updatedCat } : c))
    );
    try {
      await apiService.updateCategory(updatedCat.id, updatedCat);
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
      discountBadge: newCat.discountBadge || 'Fresh Selection',
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
    setCategories((prev) => prev.filter((c) => c.id !== catId && c._id !== catId));
    try {
      await apiService.deleteCategory(catId);
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
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharges = cartSubtotal >= 1500 || cartSubtotal === 0 ? 0 : 50;

  // Real-time dynamic discount based on applied coupon percentage or flat amount
  const discountAmount = appliedCoupon
    ? (appliedCoupon.discountPercent
        ? Math.round((cartSubtotal * appliedCoupon.discountPercent) / 100)
        : (appliedCoupon.amount || 0))
    : 0;

  const cartTotal = Math.max(0, cartSubtotal + deliveryCharges - discountAmount);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Navigation Helper with full URL routing sync
  const navigateTo = (page, product = null) => {
    if (product) setSelectedProduct(product);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      let targetPath = '/';
      if (page === 'admin') targetPath = '/admin';
      else if (page === 'customer-portal') targetPath = '/customer-portal';
      else if (page === 'delivery') targetPath = '/delivery';
      else if (page === 'shop') targetPath = '/shop';
      else if (page === 'deals') targetPath = '/deals';
      else if (page === 'recipes') targetPath = '/recipes';
      else if (page === 'checkout') targetPath = '/checkout';
      else targetPath = '/';

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ page }, '', targetPath);
      }
    } catch (e) {}
  };

  // Browser back/forward button and URL hashchange listener
  useEffect(() => {
    const handleLocationChange = () => {
      const page = getInitialPageFromUrl();
      setCurrentPage(page);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Validate coupon code via database/backend & active promotions state
  const applyCouponCode = async (rawCode) => {
    if (!rawCode || !rawCode.trim()) {
      addToast('Enter Coupon Code', 'Please enter a valid coupon code.', 'info');
      return false;
    }

    const code = rawCode.trim().toUpperCase();

    // 1. Check dynamic admin promotions state
    const matchedPromo = (promotions || []).find(
      (p) => p.code && p.code.toUpperCase() === code && p.status === 'Active'
    );

    if (matchedPromo) {
      let percent = 20;
      const numMatch = matchedPromo.discount?.match(/(\d+)%/);
      if (numMatch) {
        percent = parseInt(numMatch[1], 10);
      }
      setAppliedCoupon({
        code,
        discountPercent: percent,
        title: matchedPromo.title,
        description: `${percent}% discount from "${matchedPromo.title}" applied!`
      });
      addToast('Coupon Applied! 🎉', `${percent}% discount applied from ${matchedPromo.title}.`);
      return true;
    }

    // 2. Try validating with backend REST API
    try {
      const res = await apiService.validateCoupon(code, cartSubtotal);
      if (res && res.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        addToast('Coupon Applied! 🎉', res.coupon.description || 'Promo discount applied.');
        return true;
      }
    } catch (e) {}

    // 3. Check official verified store coupon codes
    if (code === 'WELCOME20' || code === 'FIRST20') {
      setAppliedCoupon({
        code,
        discountPercent: 20,
        description: 'Flat 20% discount applied to your order!'
      });
      addToast('Coupon Applied! 🎉', 'Flat 20% welcome discount applied.');
      return true;
    }
    if (code === 'FRESH15') {
      setAppliedCoupon({
        code: 'FRESH15',
        discountPercent: 15,
        description: '15% discount applied on all fresh items!'
      });
      addToast('Coupon Applied! 🎉', '15% discount activated.');
      return true;
    }
    if (code === 'FLASH30') {
      setAppliedCoupon({
        code: 'FLASH30',
        discountPercent: 30,
        description: 'Super Weekend Flash Sale 30% OFF applied!'
      });
      addToast('Flash Sale Activated! 🔥', '30% super discount applied.');
      return true;
    }
    if (code === 'SAVE25' || code === 'SUPER25') {
      setAppliedCoupon({
        code,
        discountPercent: 25,
        description: '25% discount on your grocery basket!'
      });
      addToast('Coupon Applied! 🎉', '25% mega savings applied.');
      return true;
    }
    if (code === 'VEG10' || code === 'VEG20') {
      const pct = code === 'VEG20' ? 20 : 10;
      setAppliedCoupon({
        code,
        discountPercent: pct,
        description: `${pct}% OFF on farm fresh produce!`
      });
      addToast('Coupon Applied! 🎉', `${pct}% vegetable discount applied.`);
      return true;
    }
    if (code === 'FRESH50') {
      setAppliedCoupon({
        code: 'FRESH50',
        amount: 50,
        description: 'Flat Rs. 50 instant cash voucher deducted.'
      });
      addToast('Voucher Applied! 🎫', 'Flat Rs. 50 discount deducted.');
      return true;
    }
    if (code === 'FRESHMART') {
      setAppliedCoupon({
        code: 'FRESHMART',
        discountPercent: 10,
        description: 'Official FreshMart Member 10% discount applied.'
      });
      addToast('Member Discount! 🛒', '10% member discount applied.');
      return true;
    }

    addToast('Invalid Coupon ❌', `Coupon code "${code}" is invalid or expired.`, 'error');
    return false;
  };

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
        customerOrders,

        setCustomerOrders,
        activeDeliveryOrder,
        setActiveDeliveryOrder,
        savedDeliveryAddresses,
        setSavedDeliveryAddresses,
        addSavedAddress,
        removeSavedAddress,
        placeCustomerOrder,
        riders,
        setRiders,
        addRider,
        updateRider,
        deleteRider,
        clearAllRiders,
        toggleRiderStatus,
        assignRiderToOrder,
        updateDeliveryOrderStatus,
        suppliers,
        setSuppliers,
        addSupplier,
        deleteSupplier,
        updateSupplier,
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
        removeToast
      }}
    >
      {children}

    </StoreContext.Provider>
  );
};
