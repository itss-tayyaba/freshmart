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
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// --- Categories Routes ---
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// --- Orders Routes ---
router.post('/orders', createOrder);
router.get('/orders', getOrders);
router.get('/orders/track/:orderId', trackOrder);
router.put('/orders/:id/status', updateOrderStatus);

// --- Inventory Routes ---
router.get('/inventory', getInventory);
router.post('/inventory/:id/restock', restockProduct);

// --- Customers Routes ---
router.get('/customers', getCustomers);
router.post('/customers', addCustomer);

// --- Suppliers Routes ---
router.get('/suppliers', getSuppliers);
router.post('/suppliers', addSupplier);

// --- Promotions Routes ---
router.get('/promotions', getPromotions);
router.post('/promotions/validate', validateCoupon);

// --- Delivery Routes ---
router.get('/delivery', getDeliveries);

// --- Analytics Routes ---
router.get('/analytics/dashboard', getAnalyticsDashboard);

export default router;
