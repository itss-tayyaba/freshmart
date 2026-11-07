import mongoose from 'mongoose';

const zoneStoreSchema = new mongoose.Schema(
  {
    zoneId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    storeId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    tenantId: {
      type: String,
      index: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    priority: {
      type: Number,
      default: 1
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: String,
      default: 'Super Admin'
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

// Compound unique index to strictly prevent duplicate assignments
zoneStoreSchema.index({ zoneId: 1, storeId: 1 }, { unique: true });

export const ZoneStore = mongoose.models.ZoneStore || mongoose.model('ZoneStore', zoneStoreSchema);
