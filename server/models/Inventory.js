import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    branchId: {
      type: String,
      required: true,
      index: true
    },
    productId: {
      type: String,
      required: true,
      index: true
    },
    price: {
      type: Number,
      required: true
    },
    stock: {
      type: Number,
      required: true,
      default: 0
    },
    minStock: {
      type: Number,
      default: 15
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock'
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

// Compound index guaranteeing 1 inventory row per tenant + branch + product
inventorySchema.index({ tenantId: 1, branchId: 1, productId: 1 }, { unique: true });

export const Inventory = mongoose.model('Inventory', inventorySchema);
