import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  createPickupStaff,
  getPickupStaff,
  updatePickupStaff,
  deletePickupStaff
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
  getRiderOrders,
  getPickupStaffOrders,
  trackOrder,
  updateOrderStatus,
  updatePickupStaffOrderStatus,
  assignPickupStaffToOrder,
  assignRiderToOrder,
  updateRiderLocation,
  verifyDeliveryOtp
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
  updateRiderOwnLocation,
  addRider,
  deleteRider,
  clearAllRiders,
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  validateCoupon,
  getDeliveries,
  getAnalyticsDashboard,
  uploadImage
} from '../controllers/extraControllers.js';
import {
  getTenants,
  getTenantById,
  createTenant,
  inviteTenant,
  approveTenant,
  suspendTenant,
  activateTenant,
  deleteTenant,
  updateSubscription,
  getTenantOrders,
  getTenantPerformance,
  getPlatformOverview
} from '../controllers/tenantController.js';
import { protect, adminOnly, branchAdminOnly, superAdminOnly, riderOnly, pickupStaffOnly } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';
import { listStoreAdmins, createStoreAdmin, resetStoreAdminPassword, suggestZone } from '../controllers/storeAdminController.js';
import {
  getStores,
  createStore,
  updateStore,
  deleteStore,
  toggleStoreStatus,
  syncDeletedStores,
  loadDeletedStoreIdsAsync
} from '../controllers/storeController.js';
import {
  getZones,
  createZone,
  updateZone,
  deleteZone,
  toggleZoneStatus
} from '../controllers/zoneController.js';
import {
  getAllAssignments,
  getZoneStores,
  assignStoresToZone,
  removeStoreFromZone
} from '../controllers/assignmentController.js';
import {
  checkDeliveryAvailability,
  getEligibleStores,
  getSearchLogs,
  calculateFee
} from '../controllers/deliveryEligibilityController.js';
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
  createPickupStaffSchema,
  validateCouponSchema
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// --- Auth Routes (Rate Limited & Validated) ---
router.post('/auth/register', authLimiter, validate(registerSchema), registerUser);
router.post('/auth/login', authLimiter, validate(loginSchema), loginUser);
// Super admin: one admin per store, and polygon suggestion for new stores
router.get('/admin/store-admins', protect, superAdminOnly, listStoreAdmins);
router.post('/admin/stores/:storeId/admin', protect, superAdminOnly, createStoreAdmin);
router.post('/admin/stores/:storeId/admin/reset-password', protect, superAdminOnly, resetStoreAdminPassword);
router.get('/admin/suggest-zone', protect, superAdminOnly, suggestZone);

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
router.get('/orders/assigned-to-me', protect, riderOnly, getRiderOrders);
router.get('/orders/pickup-assigned-to-me', protect, pickupStaffOnly, getPickupStaffOrders);
router.put('/orders/:id/pickup-status', protect, pickupStaffOnly, validate(updateOrderStatusSchema), updatePickupStaffOrderStatus);
// Admin & Fleet: Assign rider, update live GPS location, verify delivery OTP, and update order status
router.put('/orders/:id/assign-pickup-staff', protect, branchAdminOnly, assignPickupStaffToOrder);
router.put('/orders/:id/assign-rider', protect, branchAdminOnly, assignRiderToOrder);
router.put('/orders/:id/rider-location', protect, riderOnly, updateRiderLocation);
router.post('/orders/:id/verify-delivery-otp', protect, riderOnly, verifyDeliveryOtp);
router.get('/orders', protect, branchAdminOnly, getOrders);
router.put('/orders/:id/status', protect, branchAdminOnly, validate(updateOrderStatusSchema), updateOrderStatus);

// --- Branch Pickup Staff Routes ---
router.get('/pickup-staff', protect, branchAdminOnly, getPickupStaff);
router.post('/pickup-staff', protect, branchAdminOnly, validate(createPickupStaffSchema), createPickupStaff);
router.put('/pickup-staff/:id', protect, branchAdminOnly, updatePickupStaff);
router.delete('/pickup-staff/:id', protect, branchAdminOnly, deletePickupStaff);

// Compatibility aliases for /auth/pickup-staff (as called by frontend apiService)
router.get('/auth/pickup-staff', protect, branchAdminOnly, getPickupStaff);
router.post('/auth/pickup-staff', protect, branchAdminOnly, validate(createPickupStaffSchema), createPickupStaff);
router.put('/auth/pickup-staff/:id', protect, branchAdminOnly, updatePickupStaff);
router.delete('/auth/pickup-staff/:id', protect, branchAdminOnly, deletePickupStaff);

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
router.get('/riders', protect, branchAdminOnly, getRiders);
router.put('/riders/me/location', protect, riderOnly, updateRiderOwnLocation);
router.post('/riders', protect, branchAdminOnly, validate(createRiderSchema), addRider);
router.delete('/riders/:id', protect, branchAdminOnly, deleteRider);
router.delete('/riders', protect, branchAdminOnly, clearAllRiders);
// Compatibility aliases for /auth/riders
router.get('/auth/riders', protect, branchAdminOnly, getRiders);
router.delete('/auth/riders/:id', protect, branchAdminOnly, deleteRider);

// --- Promotions & Coupons Routes ---
// Public: Active coupons and checkout promo validation
router.get('/promotions', getPromotions);
router.post('/promotions', protect, adminOnly, createPromotion);
router.put('/promotions/:id', protect, adminOnly, updatePromotion);
router.delete('/promotions/:id', protect, adminOnly, deletePromotion);
router.put('/promotions/:id/status', protect, adminOnly, togglePromotionStatus);
router.post('/promotions/validate', validate(validateCouponSchema), validateCoupon);

// --- Delivery Routes ---
// Admin Locked: Fleet dispatch & delivery logs
router.get('/delivery', protect, adminOnly, getDeliveries);

// --- Analytics Routes ---
// Admin Locked: Financial metrics, revenue, charts
router.get('/analytics/dashboard', protect, adminOnly, getAnalyticsDashboard);

// --- Media & Object Storage Upload Routes ---
router.post('/upload', protect, adminOnly, uploadImage);

// --- Super Grocery Platform: Multi-Tenant Architecture Routes ---
router.get('/tenants', getTenants);
router.post('/tenants', createTenant);
router.post('/tenants/invite', inviteTenant);
router.get('/tenants/platform/overview', getPlatformOverview);
router.get('/tenants/:id', getTenantById);
router.post('/tenants/:id/approve', approveTenant);
router.post('/tenants/:id/suspend', suspendTenant);
router.post('/tenants/:id/activate', activateTenant);
router.delete('/tenants/:id', deleteTenant);
router.put('/tenants/:id/subscription', updateSubscription);
router.get('/tenants/:id/orders', getTenantOrders);
router.get('/tenants/:id/performance', getTenantPerformance);

// --- GIS & Multi-Store Management Routes ---
router.get('/admin/stores', protect, getStores);
router.post('/admin/stores', protect, superAdminOnly, createStore);
router.post('/admin/stores/sync-deleted', protect, syncDeletedStores);
router.get('/admin/deleted-stores', protect, async (req, res) => {
  try {
    const deleted = await loadDeletedStoreIdsAsync();
    res.json({ success: true, deletedStoreIds: deleted });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});
router.put('/admin/stores/:id', protect, superAdminOnly, updateStore);
router.delete('/admin/stores/:storeId', protect, superAdminOnly, deleteStore);
router.delete('/admin/stores/:id', protect, superAdminOnly, deleteStore);
router.put('/admin/stores/:id/toggle', protect, superAdminOnly, toggleStoreStatus);

router.get('/admin/zones', protect, getZones);
router.post('/admin/zones', protect, superAdminOnly, createZone);
router.put('/admin/zones/:id', protect, superAdminOnly, updateZone);
router.delete('/admin/zones/:id', protect, superAdminOnly, deleteZone);
router.put('/admin/zones/:id/toggle', protect, superAdminOnly, toggleZoneStatus);

router.get('/admin/assignments', protect, getAllAssignments);
router.get('/admin/zones/:id/stores', protect, getZoneStores);
router.post('/admin/zones/:id/stores', protect, superAdminOnly, assignStoresToZone);
router.delete('/admin/zones/:id/stores/:storeId', protect, superAdminOnly, removeStoreFromZone);

router.post('/delivery/check-eligibility', checkDeliveryAvailability);
router.post('/delivery/eligible-stores', getEligibleStores);
router.post('/delivery/progressive-search', getEligibleStores);
router.get('/delivery/search-logs', getSearchLogs);
router.post('/delivery/calculate-fee', calculateFee);

export default router;
