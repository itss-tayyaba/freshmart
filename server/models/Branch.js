import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    id: {
      type: String,
      index: true
    },
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    companyId: {
      type: String,
      default: ''
    },
    code: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    latitude: {
      type: Number,
      default: 31.4125
    },
    longitude: {
      type: Number,
      default: 73.0995
    },
    address: {
      type: String,
      default: ''
    },
    manager: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    operatingHours: {
      type: String,
      default: '08:00 AM - 11:00 PM'
    },
    deliveryRadius: {
      type: Number,
      default: 15
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'Active', 'Inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

export const Branch = mongoose.model('Branch', branchSchema);
