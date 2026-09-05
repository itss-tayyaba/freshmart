import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorDetails = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: `Validation error: ${errorDetails.map((e) => e.message).join('; ')}`,
        errors: errorDetails
      });
    }
    req.body = result.data;
    next();
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid request body format' });
  }
};

// --- AUTH VALIDATION SCHEMAS ---
export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    phone: z.string().optional().default(''),
    address: z.string().optional().default('')
  })
  .passthrough();

export const loginSchema = z
  .object({
    email: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required')
  })
  .passthrough();

// --- PRODUCT VALIDATION SCHEMAS ---
export const createProductSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(2, 'Product name is required'),
    brand: z.string().optional().default('Farm Fresh'),
    category: z.string().min(1, 'Category identifier is required'),
    categoryLabel: z.string().optional(),
    price: z.coerce.number().positive('Price must be greater than 0'),
    originalPrice: z.coerce.number().optional(),
    stock: z.coerce.number().min(0, 'Stock count cannot be negative').optional().default(50),
    unit: z.string().optional().default('1 Kg'),
    image: z.string().optional(),
    description: z.string().optional()
  })
  .passthrough();

export const updateProductSchema = z
  .object({
    name: z.string().min(1).optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    categoryLabel: z.string().optional(),
    price: z.coerce.number().positive().optional(),
    originalPrice: z.coerce.number().optional(),
    stock: z.coerce.number().min(0).optional(),
    unit: z.string().optional(),
    image: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional()
  })
  .passthrough();

// --- CATEGORY VALIDATION SCHEMAS ---
export const createCategorySchema = z
  .object({
    name: z.string().min(2, 'Category name is required (min 2 characters)'),
    image: z.string().optional(),
    productCount: z.coerce.number().optional(),
    subcategories: z.array(z.any()).optional()
  })
  .passthrough();

export const updateCategorySchema = z
  .object({
    name: z.string().min(1).optional(),
    image: z.string().optional(),
    productCount: z.coerce.number().optional(),
    subcategories: z.array(z.any()).optional()
  })
  .passthrough();

// --- ORDER VALIDATION SCHEMAS ---
export const createOrderSchema = z
  .object({
    orderItems: z.array(z.any()).min(1, 'Order must contain at least one item'),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    shippingAddress: z.any().optional(),
    paymentMethod: z.string().optional(),
    discountPrice: z.coerce.number().optional()
  })
  .passthrough();

export const updateOrderStatusSchema = z
  .object({
    status: z.string().min(1, 'Order status is required')
  })
  .passthrough();

// --- INVENTORY VALIDATION SCHEMAS ---
export const restockSchema = z
  .object({
    amount: z.coerce.number().positive('Restock amount must be a positive number')
  })
  .passthrough();

// --- SUPPLIER VALIDATION SCHEMAS ---
export const createSupplierSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(2, 'Supplier or company name is required'),
    contact: z.string().optional(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    category: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    status: z.string().optional()
  })
  .passthrough();

// --- RIDER VALIDATION SCHEMAS ---
export const createRiderSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(2, 'Rider name is required'),
    phone: z.string().min(5, 'Valid phone number is required'),
    vehicleType: z.string().optional(),
    vehicleNumber: z.string().optional(),
    zone: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    cnic: z.string().optional()
  })
  .passthrough();

// --- COUPON VALIDATION SCHEMAS ---
export const validateCouponSchema = z
  .object({
    code: z.string().min(1, 'Coupon code is required'),
    cartSubtotal: z.coerce.number().optional()
  })
  .passthrough();
