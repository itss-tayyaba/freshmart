import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile
} from '../controllers/authController.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import {
  createOrder,
  getOrders,
  trackOrder,
  updateOrderStatus
} from '../controllers/orderController.js';
import {
  getInventory,
  restockProduct,
  getCustomers,
  addCustomer,
  getSuppliers,
  addSupplier,
  deleteSupplier,
  getRiders,
  addRider,
  deleteRider,
  clearAllRiders,
  getPromotions,
  validateCoupon,
  getDeliveries,
  getAnalyticsDashboard
} from '../controllers/extraControllers.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Auth Routes ---
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.get('/auth/profile', protect, getUserProfile);

// --- Products Routes ---
// Public: Shoppers can view catalog
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
// Admin Locked: Modifications restricted to authenticated admins
router.post('/products', protect, adminOnly, createProduct);
router.put('/products/:id', protect, adminOnly, updateProduct);
router.delete('/products/:id', protect, adminOnly, deleteProduct);

// --- Categories Routes ---
// Public: Category listing
router.get('/categories', getCategories);
// Admin Locked: Category creation/edit/deletion
router.post('/categories', protect, adminOnly, createCategory);
router.put('/categories/:id', protect, adminOnly, updateCategory);
router.delete('/categories/:id', protect, adminOnly, deleteCategory);

// --- Orders Routes ---
// Public: Shoppers place orders and track delivery status
router.post('/orders', createOrder);
router.get('/orders/track/:orderId', trackOrder);
// Admin Locked: Viewing all store orders and updating status
router.get('/orders', protect, adminOnly, getOrders);
router.put('/orders/:id/status', protect, adminOnly, updateOrderStatus);

// --- Inventory Routes ---
// Admin Locked: Viewing warehouse stocks and restocking items
router.get('/inventory', protect, adminOnly, getInventory);
router.post('/inventory/:id/restock', protect, adminOnly, restockProduct);

// --- Customers Routes ---
// Admin Locked: Viewing customer registry
router.get('/customers', protect, adminOnly, getCustomers);
// Public: Customer enrollment
router.post('/customers', addCustomer);

// --- Suppliers Routes ---
// Admin Locked: Supplier database and partner operations
router.get('/suppliers', protect, adminOnly, getSuppliers);
router.post('/suppliers', protect, adminOnly, addSupplier);
router.delete('/suppliers/:id', protect, adminOnly, deleteSupplier);

// --- Riders Routes ---
// Admin Locked: Delivery fleet management
router.get('/riders', protect, adminOnly, getRiders);
router.post('/riders', protect, adminOnly, addRider);
router.delete('/riders/:id', protect, adminOnly, deleteRider);
router.delete('/riders', protect, adminOnly, clearAllRiders);

// --- Promotions Routes ---
// Public: Active coupons and checkout promo validation
router.get('/promotions', getPromotions);
router.post('/promotions/validate', validateCoupon);

// --- Delivery Routes ---
// Admin Locked: Fleet dispatch & delivery logs
router.get('/delivery', protect, adminOnly, getDeliveries);

// --- Analytics Routes ---
// Admin Locked: Financial metrics, revenue, charts
router.get('/analytics/dashboard', protect, adminOnly, getAnalyticsDashboard);

export default router;
