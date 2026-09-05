import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const vendorStaffSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ['Store Manager', 'Order Packer', 'Inventory Clerk', 'Customer Rep'],
    default: 'Store Manager'
  },
  status: { type: String, default: 'Active' },
  addedAt: { type: Date, default: Date.now }
});

const vendorDiscountSchema = new mongoose.Schema({
  id: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  discountPercent: { type: Number, required: true, min: 1, max: 90 },
  minSpend: { type: Number, default: 0 },
  validUntil: { type: String },
  status: { type: String, default: 'Active' },
  usageCount: { type: Number, default: 0 }
});

const vendorPayoutSchema = new mongoose.Schema({
  id: { type: String, required: true },
  amount: { type: Number, required: true },
  bankDetails: {
    bankName: { type: String },
    accountTitle: { type: String },
    accountNumber: { type: String },
    iban: { type: String },
    paymentMethod: { type: String, default: 'Bank Transfer' }
  },
  status: {
    type: String,
    enum: ['Pending', 'Processed', 'Rejected'],
    default: 'Pending'
  },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  notes: { type: String }
});

const vendorReviewSchema = new mongoose.Schema({
  id: { type: String, required: true },
  customerName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  productName: { type: String },
  reply: { type: String }
});

const vendorSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    category: { type: String, default: 'Fresh Fruits & Farm Vegetables' },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Suspended'],
      default: 'Approved'
    },
    commissionRate: { type: Number, default: 10 }, // 10% marketplace fee
    balance: { type: Number, default: 45000 }, // Available for payout
    pendingBalance: { type: Number, default: 12500 }, // Escrow from in-transit orders
    totalEarnings: { type: Number, default: 284000 },
    performanceScore: {
      fulfillmentRate: { type: Number, default: 98.4 },
      onTimeDispatch: { type: Number, default: 97.2 },
      rating: { type: Number, default: 4.9 },
      reviewCount: { type: Number, default: 86 },
      tier: { type: String, default: 'Platinum Seller' }
    },
    storeProfile: {
      logo: {
        type: String,
        default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'
      },
      banner: {
        type: String,
        default: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80'
      },
      bio: {
        type: String,
        default: 'Certified organic farm & direct grocery producer offering farm-fresh produce and artisanal goods.'
      },
      address: { type: String, default: 'Plot 12-B, Industrial Estate, Lahore' },
      city: { type: String, default: 'Lahore, Pakistan' },
      operatingHours: { type: String, default: 'Mon - Sat: 8:00 AM - 10:00 PM' },
      licenseNumber: { type: String, default: 'PK-FBR-992140' },
      deliveryRadius: { type: String, default: 'City-wide (15 KM)' },
      bankDetails: {
        bankName: { type: String, default: 'Meezan Bank Ltd' },
        accountTitle: { type: String, default: 'FreshMart Vendor Partner' },
        accountNumber: { type: String, default: '01020304050607' },
        iban: { type: String, default: 'PK92MEZN0001020304050607' }
      }
    },
    staff: [vendorStaffSchema],
    discounts: [vendorDiscountSchema],
    payouts: [vendorPayoutSchema],
    reviews: [vendorReviewSchema]
  },
  { timestamps: true, bufferCommands: false }
);

// Encrypt vendor password before saving
vendorSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
vendorSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export const Vendor = mongoose.model('Vendor', vendorSchema);
