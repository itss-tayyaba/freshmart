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

export const StoreProvider = ({ children }) => {
  // Current active page view: 'home' | 'shop' | 'product-detail' | 'checkout' | 'admin' | 'recipes' | 'deals' | 'customer-portal' | 'delivery'
  const [currentPage, setCurrentPage] = useState('home');

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

  // Products state (Single source of truth)
  const [products, setProducts] = useState(FRESHMART_PRODUCTS);

  // Categories state
  const [categories, setCategories] = useState(FRESHMART_CATEGORIES);

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

  // Currency
  const [currency, setCurrency] = useState({ symbol: 'PKR ', code: 'PKR', rate: 1 });

  // Applied Coupon
  const [appliedCoupon, setAppliedCoupon] = useState({
    code: 'WELCOME20',
    discountPercent: 20,
    amount: 50,
    description: 'Special 20% Welcome Coupon'
  });

  // Admin Data State
  const [adminOrders, setAdminOrders] = useState(ADMIN_RECENT_ORDERS);
  const [adminStats, setAdminStats] = useState(ADMIN_STATS);

  // Admin Profile & Authentication
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('freshmart_admin_session') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [user, setUser] = useState({
    name: 'Super Admin',
    email: 'admin@freshmart.com',
    role: 'admin'
  });

  const adminLogin = (username, password) => {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (
      (cleanUser === 'admin' || cleanUser === 'admin@freshmart.pk' || cleanUser === 'admin@freshmart.com' || cleanUser === 'tayyaba') &&
      (cleanPass === 'admin123' || cleanPass === 'freshmart2026' || cleanPass === 'password' || cleanPass === 'admin')
    ) {
      setIsAdminLoggedIn(true);
      try {
        localStorage.setItem('freshmart_admin_session', 'true');
      } catch (e) {}
      addToast('Admin Authenticated 🛡️', 'Welcome to FreshMart Admin Suite.');
      return { success: true };
    }

    addToast('Invalid Credentials ❌', 'Incorrect admin username or password.', 'error');
    return { success: false, error: 'Invalid username or password' };
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('freshmart_admin_session');
    } catch (e) {}
    addToast('Admin Signed Out', 'You have been logged out of the Admin Suite.', 'info');
    navigateTo('home');
  };


  // Toasts
  const [toasts, setToasts] = useState([]);

  // Fetch live products & categories on startup from Node.js backend
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const data = await apiService.getProducts();
        if (data && data.success && data.products && data.products.length > 0) {
          const mapped = data.products.map((p) => ({
            ...p,
            id: String(p.id || p._id)
          }));
          setProducts(mapped);
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

  // Riders State
  const [riders, setRiders] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_riders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'RDR-101',
        name: 'Hamza Tariq',
        phone: '0302-8877665',
        vehicleType: '🏍️ Honda 125',
        vehicleNumber: 'LEK-8420',
        zone: 'Gulberg / Main Hub',
        status: 'On-Duty',
        deliveriesCount: 54,
        rating: 4.9,
        activeOrderId: null,
        joinedDate: 'Aug 2026'
      },
      {
        id: 'RDR-102',
        name: 'Ali Raza',
        phone: '0321-9988771',
        vehicleType: '🛵 Electric Scooter',
        vehicleNumber: 'LEA-1903',
        zone: 'DHA Phase 5 & 6',
        status: 'On-Duty',
        deliveriesCount: 32,
        rating: 4.8,
        activeOrderId: null,
        joinedDate: 'Aug 2026'
      },
      {
        id: 'RDR-103',
        name: 'Bilal Ahmed',
        phone: '0315-4433221',
        vehicleType: '🏍️ Yamaha YBR',
        vehicleNumber: 'LEC-5542',
        zone: 'Johar Town / Model Town',
        status: 'Busy',
        deliveriesCount: 89,
        rating: 5.0,
        activeOrderId: null,
        joinedDate: 'Jul 2026'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_riders', JSON.stringify(riders));
    } catch (e) {}
  }, [riders]);


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

  // --- Customer Authentication Functions ---
  const registerCustomer = async (userData) => {
    try {
      const res = await apiService.register(userData);
      if (res && res.success) {
        const userObj = {
          id: res._id || `cust-${Date.now()}`,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '+92 300 1234567',
          city: userData.city || 'Lahore, Pakistan',
          address: userData.address || '123 Main Street',
          walletBalance: 320,
          loyaltyPoints: 100
        };
        setCustomerUser(userObj);
        addToast('Account Created! 🎉', `Welcome to FreshMart, ${userData.name}!`);
        return { success: true };
      }
    } catch (e) {}

    // Graceful offline registration fallback
    const userObj = {
      id: `cust-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '+92 300 1234567',
      city: userData.city || 'Lahore, Pakistan',
      address: userData.address || '123 Main Street',
      walletBalance: 320,
      loyaltyPoints: 100
    };
    setCustomerUser(userObj);
    addToast('Account Created! 🎉', `Welcome to FreshMart, ${userData.name}!`);
    return { success: true };
  };

  const loginCustomer = async (email, password) => {
    try {
      const res = await apiService.login(email, password);
      if (res && res.success) {
        const userObj = {
          id: res._id || `cust-${Date.now()}`,
          name: res.name || email.split('@')[0],
          email: res.email || email,
          phone: res.phone || '+92 300 1234567',
          city: res.city || 'Lahore, Pakistan',
          address: res.address || 'Gulberg 3, Lahore',
          walletBalance: 320,
          loyaltyPoints: 150
        };
        setCustomerUser(userObj);
        addToast('Welcome Back! 👋', `Logged in as ${userObj.name}`);
        return { success: true };
      }
    } catch (e) {}

    // Fallback login
    const userObj = {
      id: `cust-${Date.now()}`,
      name: email.split('@')[0].replace('.', ' ').replace(/^\w/, (c) => c.toUpperCase()),
      email: email,
      phone: '+92 300 1234567',
      city: 'Lahore, Pakistan',
      address: '123, Block A, Gulberg 3, Lahore',
      walletBalance: 320,
      loyaltyPoints: 150
    };
    setCustomerUser(userObj);
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
      deliveriesCount: Number(newRider.deliveriesCount) || 0,
      rating: Number(newRider.rating) || 5.0,
      activeOrderId: null,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };
    setRiders((prev) => [riderObj, ...prev]);
    addToast('Rider Registered 🛵', `"${riderObj.name}" added to delivery fleet.`);
    return riderObj;
  };

  const updateRider = (riderId, updatedData) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, ...updatedData } : r))
    );
    addToast('Rider Profile Updated 📝', 'Rider details saved.');
  };

  const deleteRider = (riderId) => {
    setRiders((prev) => prev.filter((r) => r.id !== riderId));
    addToast('Rider Removed', 'Rider removed from active fleet.', 'info');
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

    const newOrder = {
      id: orderData.id || `#FM${Math.floor(10000 + Math.random() * 90000)}`,
      items: orderData.items || cart,
      totalAmount: orderData.totalAmount || cartTotal,
      subtotal: orderData.subtotal || cartSubtotal,
      deliveryCharges: orderData.deliveryCharges || deliveryCharges,
      status: 'Out for Delivery',
      deliverySlot: orderData.deliverySlot || '⚡ 10-15 Mins Express',
      address: orderData.address || deliveryLocation.address,
      createdAt: new Date().toISOString(),
      dateFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setCustomerOrders((prev) => [newOrder, ...prev]);
    setActiveDeliveryOrder(newOrder);

    try {
      await apiService.createOrder(newOrder);
    } catch (e) {}

    clearCart();
    return newOrder;
  };

  // --- Admin CRUD Helpers ---
  const addProductToStore = async (newProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
    try {
      await apiService.createProduct(newProduct);
    } catch (e) {}
    addToast('Product Added 🛒', `"${newProduct.name}" added to catalog.`);
  };

  const updateProductInStore = async (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p))
    );
    try {
      await apiService.updateProduct(updatedProduct.id, updatedProduct);
    } catch (e) {}
    addToast('Product Updated ✨', `"${updatedProduct.name}" updated.`);
  };

  const deleteProductFromStore = async (productId, productName) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      await apiService.deleteProduct(productId);
    } catch (e) {}
    addToast('Product Removed', `"${productName}" removed.`, 'info');
  };

  const updateCategoryInStore = async (updatedCat) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? { ...c, ...updatedCat } : c))
    );
    try {
      await apiService.updateCategory(updatedCat.id, updatedCat);
    } catch (e) {}
    addToast('Category Updated 🗂️', `"${updatedCat.name}" updated.`);
  };

  const addCategoryToStore = async (newCat) => {
    setCategories((prev) => [newCat, ...prev]);
    try {
      await apiService.createCategory(newCat);
    } catch (e) {}
    addToast('Category Added 🗂️', `"${newCat.name}" added.`);
  };

  const deleteCategoryFromStore = async (catId, catName) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    try {
      await apiService.deleteCategory(catId);
    } catch (e) {}
    addToast('Category Removed', `"${catName}" removed.`, 'info');
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

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const deliveryCharges = cartSubtotal >= 1500 || cartSubtotal === 0 ? 0 : 50;
  const discountAmount = appliedCoupon?.amount || 0;
  const cartTotal = Math.max(0, cartSubtotal + deliveryCharges - discountAmount);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Navigation Helper
  const navigateTo = (page, product = null) => {
    if (product) setSelectedProduct(product);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Validate coupon code via backend
  const applyCouponCode = async (code) => {
    try {
      const res = await apiService.validateCoupon(code, cartSubtotal);
      if (res && res.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        addToast('Coupon Applied! 🎉', res.coupon.description);
        return true;
      }
    } catch (e) {}

    const uc = code.toUpperCase();
    if (uc === 'WELCOME20' || uc === 'FIRST20') {
      setAppliedCoupon({ code: uc, discountPercent: 20, amount: Math.round(cartSubtotal * 0.2), description: 'Flat 20% discount applied!' });
      addToast('Coupon Applied! 🎉', 'Flat 20% discount applied.');
      return true;
    }
    if (uc === 'FRESH15') {
      setAppliedCoupon({ code: 'FRESH15', discountPercent: 15, amount: Math.round(cartSubtotal * 0.15), description: 'Flat 15% discount on your order!' });
      addToast('Coupon Applied! 🎉', '15% discount activated.');
      return true;
    }
    if (uc === 'VEG10') {
      setAppliedCoupon({ code: 'VEG10', discountPercent: 10, amount: Math.round(cartSubtotal * 0.1), description: '10% OFF on fresh vegetables!' });
      addToast('Coupon Applied! 🎉', '10% vegetable discount applied.');
      return true;
    }
    if (uc === 'FRESH50') {
      setAppliedCoupon({ code: 'FRESH50', amount: 100, description: 'Flat 50% discount added.' });
      addToast('Coupon Applied! 🎉', 'Flat 50% discount added.');
      return true;
    }
    addToast('Invalid Coupon', 'Code not recognized', 'error');
    return false;
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
        toggleRiderStatus,
        assignRiderToOrder,
        updateDeliveryOrderStatus,
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
        adminOrders,
        updateOrderStatus,
        adminStats,
        user,
        setUser,
        isAdminLoggedIn,
        setIsAdminLoggedIn,
        adminLogin,
        adminLogout,
        toasts,

        addToast,
        removeToast
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
