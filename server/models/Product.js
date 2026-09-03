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
