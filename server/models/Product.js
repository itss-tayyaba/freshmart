import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
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
      required: true
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
      default: function () {
        return this.price;
      }
    },
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
      required: true,
      default: 50
    },
    minStock: {
      type: Number,
      default: 15
    },
    status: {
      type: String,
      enum: ['Active', 'Low Stock', 'Critical', 'Out of Stock'],
      default: 'Active'
    },
    isFlashDeal: {
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
      type: Map,
      of: String,
      default: {}
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

export const Product = mongoose.model('Product', productSchema);
