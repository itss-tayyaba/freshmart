import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    supplierId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    categoriesSupplied: [{ type: String }],
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
  },
  { timestamps: true, bufferCommands: false }
);

export const Supplier = mongoose.model('Supplier', supplierSchema);

const promotionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    title: { type: String, required: true },
    discountPercent: { type: Number, default: 0 },
    flatAmount: { type: Number, default: 0 },
    minSpend: { type: Number, default: 0 },
    freeShipping: { type: Boolean, default: false },
    validFrom: { type: Date, default: Date.now },
    validTo: { type: Date },
    type: { type: String, default: 'Coupon' },
    status: { type: String, default: 'Active' }
  },
  { timestamps: true, bufferCommands: false }
);

export const Promotion = mongoose.model('Promotion', promotionSchema);

const deliverySchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    customerName: { type: String, required: true },
    riderName: { type: String, required: true },
    riderPhone: { type: String, required: true },
    status: {
      type: String,
      default: 'Out for Delivery'
    },
    eta: { type: String, default: '12 mins' },
    routeCoordinates: [
      {
        lat: Number,
        lng: Number,
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true, bufferCommands: false }
);

export const Delivery = mongoose.model('Delivery', deliverySchema);
