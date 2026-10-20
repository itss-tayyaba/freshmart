import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      index: true
    },
    departmentId: {
      type: String,
      index: true
    },
    departmentCode: {
      type: String,
      default: ''
    },
    tenantId: {
      type: String,
      index: true,
      default: 'tenant-freshmart'
    },
    companyId: {
      type: String,
      default: ''
    },
    tenantName: {
      type: String,
      default: 'FreshMart Direct'
    },
    slug: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    shortName: {
      type: String,
      default: function () {
        return this.name;
      }
    },
    icon: {
      type: String,
      default: '🛒'
    },
    description: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      required: true
    },
    productCount: {
      type: Number,
      default: 0
    },
    discountBadge: {
      type: String,
      default: ''
    },
    subcategories: [
      {
        type: String
      }
    ],
    featured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

// Compound indexes for strict multi-tenant isolation and fast department resolution
categorySchema.index({ tenantId: 1, slug: 1 });
categorySchema.index({ tenantId: 1, departmentId: 1 });
categorySchema.index({ tenantId: 1, id: 1 });

export const Category = mongoose.model('Category', categorySchema);
