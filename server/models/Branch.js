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
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

export const Branch = mongoose.model('Branch', branchSchema);
