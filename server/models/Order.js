import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, default: '1 Kg' },
  image: { type: String },
  vendorId: { type: String, default: 'VND-101' }
});

const timelineStepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  time: { type: String, required: true },
  completed: { type: Boolean, default: false },
  desc: { type: String }
});

const assignedRiderSchema = new mongoose.Schema(
  {
    id: { type: String },
    riderId: { type: String },
    name: { type: String },
    phone: { type: String },
    vehicle: { type: String },
    vehicleType: { type: String },
    vehicleNumber: { type: String },
    zone: { type: String },
    rating: { type: Number, default: 5.0 },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    currentLat: { type: Number },
    currentLng: { type: Number },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    eta: { type: String },
    etaMinutes: { type: Number },
    assignedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'On-Duty' }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    customerName: {
      type: String,
      required: true
    },
    customerPhone: {
      type: String,
      required: true
    },
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, default: 'Lahore, Pakistan' },
      area: { type: String },
      neighborhood: { type: String },
      deliverySlot: { type: String, default: '⚡ 15-25 Mins Express Delivery' },
      postalCode: { type: String }
    },
    destinationCoords: {
      lat: { type: Number },
      lng: { type: Number }
    },
    hubCoords: {
      lat: { type: Number },
      lng: { type: Number }
    },
    distanceKm: {
      type: Number
    },
    eta: {
      type: String
    },
    etaMinutes: {
      type: Number
    },
    orderItems: [orderItemSchema],
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'Credit / Debit Card', 'Easypaisa', 'JazzCash', 'Bank Transfer'],
      default: 'Cash on Delivery'
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Pending'
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    deliveryPrice: {
      type: Number,
      required: true,
      default: 100.0
    },
    discountPrice: {
      type: Number,
      default: 0.0
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Confirmed'
    },
    assignedRider: {
      type: assignedRiderSchema,
      default: null
    },
    timeline: [timelineStepSchema]
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

export const Order = mongoose.model('Order', orderSchema);

