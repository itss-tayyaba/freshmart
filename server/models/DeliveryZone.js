import mongoose from 'mongoose';

const deliveryZoneSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      trim: true
    },
    zoneId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      required: true,
      trim: true,
      default: 'Faisalabad'
    },
    area: {
      type: String,
      default: ''
    },
    // GeoJSON Polygon geometry: coordinates format is [[[lng, lat], [lng, lat], ...]]
    geometry: {
      type: {
        type: String,
        enum: ['Polygon'],
        default: 'Polygon',
        required: true
      },
      coordinates: {
        type: [[[Number]]],
        required: true
      }
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed
    },
    assignedStoreId: {
      type: String,
      default: null,
      trim: true,
      index: true
    },
    color: {
      type: String,
      default: '#10b981'
    },
    deliveryCharge: {
      type: Number,
      required: true,
      default: 100,
      min: 0
    },
    minOrderAmount: {
      type: Number,
      required: true,
      default: 500,
      min: 0
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 2500,
      min: 0
    },
    estimatedDeliveryTime: {
      type: String,
      default: '25-40 mins'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
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

// 2dsphere index for MongoDB native geospatial point-in-polygon queries
deliveryZoneSchema.index({ geometry: '2dsphere' });

export const DeliveryZone = mongoose.models.DeliveryZone || mongoose.model('DeliveryZone', deliveryZoneSchema);
