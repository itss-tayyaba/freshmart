import mongoose from 'mongoose';

const deliveryTierSchema = new mongoose.Schema(
  {
    distanceKm: {
      type: Number,
      required: true
    },
    fee: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { _id: false }
);

const pointSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

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
      trim: true,
      default: 'Faisalabad'
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
      default: 5
    },
    deliveryRadiusKm: {
      type: Number,
      default: 5
    },
    deliveryStatus: {
      type: String,
      enum: ['active', 'inactive', 'Active', 'Inactive'],
      default: 'active'
    },
    deliveryTiers: {
      type: [deliveryTierSchema],
      default: () => [
        { distanceKm: 1, fee: 0 },
        { distanceKm: 2, fee: 40 },
        { distanceKm: 3, fee: 80 },
        { distanceKm: 5, fee: 120 }
      ]
    },
    deliveryPolygon: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    },
    assignedZoneId: {
      type: String,
      default: null,
      index: true
    },
    supportsExtendedDelivery: {
      type: Boolean,
      default: false
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

// Helper method to determine if a point is within this branch's delivery zone
branchSchema.methods.isLocationDeliverable = function (userLat, userLng) {
  if (this.deliveryStatus && this.deliveryStatus.toLowerCase() !== 'active') {
    return false;
  }
  const radius = Number(this.deliveryRadiusKm || this.deliveryRadius || 5);
  // Haversine calculation
  const R = 6371;
  const dLat = ((userLat - this.latitude) * Math.PI) / 180;
  const dLon = ((userLng - this.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((this.latitude * Math.PI) / 180) *
      Math.cos((userLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return dist <= radius;
};

export const Branch = mongoose.model('Branch', branchSchema);
