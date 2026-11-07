import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      trim: true
    },
    storeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    tenantName: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    branchName: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      default: 'Faisalabad',
      trim: true
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    // GeoJSON Point location for 2dsphere indexing
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    contactNumber: {
      type: String,
      default: '+92 300 0000000',
      trim: true
    },
    openingHours: {
      type: String,
      default: '08:00 AM'
    },
    closingHours: {
      type: String,
      default: '11:00 PM'
    },
    storeImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'Active', 'Inactive'],
      default: 'active'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    operatingStatus: {
      type: String,
      enum: ['Open', 'Closed', 'Busy', 'Maintenance'],
      default: 'Open'
    },
    manager: {
      type: String,
      default: ''
    },
    deliveryRadiusKm: {
      type: Number,
      default: 5
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

// 2dsphere index on location GeoJSON Point
storeSchema.index({ location: '2dsphere' });

// Pre-save hook to ensure location GeoJSON matches latitude and longitude
storeSchema.pre('validate', function (next) {
  if (this.longitude !== undefined && this.latitude !== undefined) {
    this.location = {
      type: 'Point',
      coordinates: [Number(this.longitude), Number(this.latitude)]
    };
  }
  if (this.status) {
    this.isActive = String(this.status).toLowerCase() === 'active';
  }
  if (typeof next === 'function') next();
});

export const Store = mongoose.models.Store || mongoose.model('Store', storeSchema);
