import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      index: true
    },
    customId: {
      type: String,
      index: true
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
      default: 'tenant-freshmart'
    },
    tenantName: {
      type: String,
      default: 'FreshMart Direct'
    },
    companyId: {
      type: String,
      default: ''
    },
    branchId: {
      type: String,
      index: true,
      default: 'branch_001'
    },
    departmentId: {
      type: String,
      index: true
    },
    departmentCode: {
      type: String,
      default: ''
    },
    departmentName: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    brand: {
      type: String,
      default: 'Farm Fresh'
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    categoryId: {
      type: String,
      index: true
    },
    categoryLabel: {
      type: String,
      default: 'General'
    },
    price: {
      type: Number,
      required: true
    },
    originalPrice: {
      type: Number,
      default: 0
    },
    wholesalePrice: {
      type: Number,
      default: 0
    },
    tierPricing: [
      {
        minQty: { type: Number, default: 10 },
        discountPercent: { type: Number, default: 10 }
      }
    ],
    discountPercent: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      default: '1 Kg'
    },
    rating: {
      type: Number,
      default: 4.8
    },
    reviewsCount: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      default: 50
    },
    stockCount: {
      type: Number,
      default: 50
    },
    minStock: {
      type: Number,
      default: 15
    },
    status: {
      type: String,
      default: 'Active'
    },
    inStock: {
      type: Boolean,
      default: true
    },
    isFlashDeal: {
      type: Boolean,
      default: false
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    flashEnds: {
      type: String,
      default: '02:45:18'
    },
    image: {
      type: String,
      required: true
    },
    gallery: [
      {
        type: String
      }
    ],
    description: {
      type: String,
      default: 'Fresh quality verified grocery product.'
    },
    nutrition: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    vendorId: {
      type: String,
      index: true,
      default: 'VND-101'
    },
    vendorName: {
      type: String,
      default: 'FreshMart Direct Partner'
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

// High-performance compound indexes for multi-tenant catalog partitioning
productSchema.index({ tenantId: 1, customId: 1 });
productSchema.index({ tenantId: 1, id: 1 });
productSchema.index({ tenantId: 1, departmentId: 1 });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, status: 1 });
productSchema.index({ tenantId: 1, branchId: 1 });

export const Product = mongoose.model('Product', productSchema);
