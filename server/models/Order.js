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
  image: { type: String }
});

const timelineStepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  time: { type: String, required: true },
  completed: { type: Boolean, default: false },
  desc: { type: String }
});

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
      deliverySlot: { type: String, default: 'Today 2 PM - 4 PM' }
    },
    orderItems: [orderItemSchema],
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'Credit / Debit Card', 'Easypaisa', 'Bank Transfer'],
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
      name: { type: String, default: 'Rider Ali' },
      phone: { type: String, default: '+92 301 1234567' },
      eta: { type: String, default: '12 mins' }
    },
    timeline: [timelineStepSchema]
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

export const Order = mongoose.model('Order', orderSchema);
