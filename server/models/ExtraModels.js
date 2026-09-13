import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const supplierSchema = new mongoose.Schema(
  {
    id: { type: String },
    supplierId: { type: String },
    name: { type: String, required: true, trim: true },
    contact: { type: String },
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },
    category: { type: String, default: 'Fresh Milk & Pure Dairy' },
    username: { type: String },
    password: { type: String, default: 'supplier123' },
    status: { type: String, default: 'Active' },
    tenantId: { type: String, index: true, default: 'tenant-freshmart' }
  },
  { timestamps: true, bufferCommands: false }
);

// Encrypt supplier password before saving (Bcrypt Pre-Save Hook)
supplierSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
supplierSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export const Supplier = mongoose.model('Supplier', supplierSchema);

const riderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    vehicleType: { type: String, default: '🏍️ Honda 125' },
    vehicleNumber: { type: String, default: 'LEK-0000' },
    zone: { type: String, default: 'Lahore Hub' },
    status: { type: String, default: 'On-Duty' },
    username: { type: String },
    password: { type: String, default: 'rider123' },
    cnic: { type: String },
    deliveriesCount: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    currentLat: { type: Number },
    currentLng: { type: Number },
    activeOrders: [{ type: String }],
    tenantId: { type: String, index: true, default: 'tenant-freshmart' }
  },
  { timestamps: true, bufferCommands: false }
);

// Encrypt rider password before saving (Bcrypt Pre-Save Hook)
riderSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
riderSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export const Rider = mongoose.model('Rider', riderSchema);

const promotionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, default: '' },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'free_shipping'],
      default: 'percentage'
    },
    discountAmount: { type: Number, required: true, default: 10 },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 }, // 0 = no cap
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 }, // legacy compatibility
    flatAmount: { type: Number, default: 0 }, // legacy compatibility
    minSpend: { type: Number, default: 0 }, // legacy compatibility
    freeShipping: { type: Boolean, default: false },
    validFrom: { type: Date, default: Date.now },
    validTo: { type: Date },
    category: { type: String, default: 'Coupons' },
    bannerImg: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Paused', 'Expired'], default: 'Active' }
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
