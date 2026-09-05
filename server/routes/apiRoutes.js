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
import { authLimiter } from '../middleware/rateLimitMiddleware.js';
import {
  validate,
  registerSchema,
  loginSchema,
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  createOrderSchema,
  updateOrderStatusSchema,
  restockSchema,
  createSupplierSchema,
  createRiderSchema,
  validateCouponSchema
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// --- Auth Routes (Rate Limited & Validated) ---
router.post('/auth/register', authLimiter, validate(registerSchema), registerUser);
router.post('/auth/login', authLimiter, validate(loginSchema), loginUser);
router.get('/auth/profile', protect, getUserProfile);

// --- Products Routes ---
// Public: Shoppers can view catalog
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
// Admin Locked & Validated: Create, Update, Delete
router.post('/products', protect, adminOnly, validate(createProductSchema), createProduct);
router.put('/products/:id', protect, adminOnly, validate(updateProductSchema), updateProduct);
router.delete('/products/:id', protect, adminOnly, deleteProduct);

// --- Categories Routes ---
// Public: Category listing
router.get('/categories', getCategories);
// Admin Locked & Validated: Category creation/edit/deletion
router.post('/categories', protect, adminOnly, validate(createCategorySchema), createCategory);
router.put('/categories/:id', protect, adminOnly, validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', protect, adminOnly, deleteCategory);

// --- Orders Routes ---
// Public: Shoppers place orders (validated) and track delivery status
router.post('/orders', validate(createOrderSchema), createOrder);
router.get('/orders/track/:orderId', trackOrder);
// Admin Locked & Validated: Viewing all store orders and updating status
router.get('/orders', protect, adminOnly, getOrders);
router.put('/orders/:id/status', protect, adminOnly, validate(updateOrderStatusSchema), updateOrderStatus);

// --- Inventory Routes ---
// Admin Locked & Validated: Viewing warehouse stocks and restocking items
router.get('/inventory', protect, adminOnly, getInventory);
router.post('/inventory/:id/restock', protect, adminOnly, validate(restockSchema), restockProduct);

// --- Customers Routes ---
// Admin Locked: Viewing customer registry
router.get('/customers', protect, adminOnly, getCustomers);
// Public: Customer enrollment
router.post('/customers', addCustomer);

// --- Suppliers Routes ---
// Admin Locked & Validated: Supplier database and partner operations
router.get('/suppliers', protect, adminOnly, getSuppliers);
router.post('/suppliers', protect, adminOnly, validate(createSupplierSchema), addSupplier);
router.delete('/suppliers/:id', protect, adminOnly, deleteSupplier);

// --- Riders Routes ---
// Admin Locked & Validated: Delivery fleet management
router.get('/riders', protect, adminOnly, getRiders);
router.post('/riders', protect, adminOnly, validate(createRiderSchema), addRider);
router.delete('/riders/:id', protect, adminOnly, deleteRider);
router.delete('/riders', protect, adminOnly, clearAllRiders);

// --- Promotions Routes ---
// Public: Active coupons and checkout promo validation
router.get('/promotions', getPromotions);
router.post('/promotions/validate', validate(validateCouponSchema), validateCoupon);

// --- Delivery Routes ---
// Admin Locked: Fleet dispatch & delivery logs
router.get('/delivery', protect, adminOnly, getDeliveries);

// --- Analytics Routes ---
// Admin Locked: Financial metrics, revenue, charts
router.get('/analytics/dashboard', protect, adminOnly, getAnalyticsDashboard);

export default router;
