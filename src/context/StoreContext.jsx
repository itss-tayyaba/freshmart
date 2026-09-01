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
  // Current active page view: 'home' | 'shop' | 'product-detail' | 'checkout' | 'admin' | 'recipes' | 'deals'
  const [currentPage, setCurrentPage] = useState('home');

  // Products state (synced with backend)
  const [products, setProducts] = useState(FRESHMART_PRODUCTS);

  // Selected product for single product details page
  const [selectedProduct, setSelectedProduct] = useState(FRESHMART_PRODUCTS[0]);

  // Delivery Location
  const [deliveryLocation, setDeliveryLocation] = useState({
    city: 'Lahore, Pakistan',
    address: '123 Main Street, Johar Town',
    label: 'Home'
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Initial cart matching screenshot
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { product: FRESHMART_PRODUCTS[0], quantity: 1, unit: "1 Pack (1 Litre)" },
      { product: FRESHMART_PRODUCTS[1], quantity: 2, unit: "1 Kg (6-8 pcs)" },
      { product: FRESHMART_PRODUCTS[7], quantity: 1, unit: "1 Pack (104g)" }
    ];
  });

  // Wishlist state
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('freshmart_wishlist');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return ['olpers-milk-1l', 'apples-royal-gala-1kg'];
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
  const [currency, setCurrency] = useState({ symbol: 'Rs. ', code: 'PKR', rate: 1 });

  // Applied Coupon
  const [appliedCoupon, setAppliedCoupon] = useState({
    code: 'FRESH50',
    discountPercent: 50,
    amount: 100,
    description: 'Enjoy flat 50% discount on your 10-minute order!'
  });

  // Admin Data State
  const [adminOrders, setAdminOrders] = useState(ADMIN_RECENT_ORDERS);
  const [adminStats, setAdminStats] = useState(ADMIN_STATS);

  // User State
  const [user, setUser] = useState({
    name: 'Super Admin',
    email: 'admin@freshmart.com',
    isLoggedIn: true,
    role: 'admin'
  });

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Fetch live products on startup from Node.js backend
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const data = await apiService.getProducts();
        if (data && data.success && data.products) {
          setProducts(data.products);
        }
      } catch (e) {
        // Fallback to local store
      }
    };
    fetchBackendData();
  }, []);

  // Save cart & wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('freshmart_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('freshmart_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

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

  // Cart operations
  const addToCart = (product, quantity = 1, unit = null) => {
    const chosenUnit = unit || product.unit;
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        return updated;
      }
      return [...prev, { product, quantity, unit: chosenUnit }];
    });
    addToast('Added to Basket 🛒', `${product.name} (${quantity}x) added.`);
  };

  const updateCartQuantity = (productId, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    addToast('Item Removed', 'Product removed from basket.', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  // Add multiple items (Recipe bundle)
  const addRecipeIngredientsToCart = (productIds) => {
    const matchedProducts = products.filter((p) => productIds.includes(p.id));
    matchedProducts.forEach((p) => addToCart(p, 1));
    addToast('Recipe Bundle Added! 🍲', `Added all ${matchedProducts.length} ingredients to your cart.`);
  };

  // Wishlist
  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const target = products.find((p) => p.id === productId);
      if (exists) {
        addToast('Removed from Wishlist', `${target?.name || 'Item'} removed.`, 'info');
        return prev.filter((id) => id !== productId);
      } else {
        addToast('Added to Wishlist ❤️', `${target?.name || 'Item'} saved.`);
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId) => wishlist.includes(productId);

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharges = cartSubtotal >= 1000 || cartSubtotal === 0 ? 0 : 100;
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
      } else {
        addToast('Invalid Coupon', res?.message || 'Code not recognized', 'error');
        return false;
      }
    } catch (e) {
      if (code.toUpperCase() === 'FRESH50') {
        setAppliedCoupon({ code: 'FRESH50', amount: 100, description: 'Flat 50% coupon applied' });
        addToast('Coupon Applied! 🎉', 'Flat 50% discount added.');
        return true;
      }
      addToast('Invalid Coupon', 'Code not recognized', 'error');
      return false;
    }
  };

  // Admin Order Status Modifier with backend sync
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
        products,
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
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
