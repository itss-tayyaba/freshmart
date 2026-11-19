import mongoose from 'mongoose';

const zoneStoreSchema = new mongoose.Schema(
  {
    zoneId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    deliveryZoneId: {
      type: String,
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
    parentRetailerId: {
      type: String,
      index: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'Active', 'Inactive'],
      default: 'active'
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

zoneStoreSchema.pre('validate', function (next) {
  if (this.deliveryZoneId && !this.zoneId) this.zoneId = this.deliveryZoneId;
  if (this.zoneId && !this.deliveryZoneId) this.deliveryZoneId = this.zoneId;
  if (this.parentRetailerId && !this.tenantId) this.tenantId = this.parentRetailerId;
  if (this.tenantId && !this.parentRetailerId) this.parentRetailerId = this.tenantId;
  if (this.status) this.isActive = String(this.status).toLowerCase() === 'active';
  if (typeof next === 'function') next();
});

// Compound unique index to strictly prevent duplicate assignments
zoneStoreSchema.index({ zoneId: 1, storeId: 1 }, { unique: true });

export const ZoneStore = mongoose.models.ZoneStore || mongoose.model('ZoneStore', zoneStoreSchema);
