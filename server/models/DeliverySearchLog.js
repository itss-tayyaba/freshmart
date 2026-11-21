import mongoose from 'mongoose';

const deliverySearchLogSchema = new mongoose.Schema(
  {
    customerCoordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    searchStage: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true
    },
    stageKey: {
      type: String,
      enum: ['zone_match', '2km_expansion', '3km_expansion', 'beyond_3km_fallback'],
      required: true
    },
    stageLabel: { type: String, required: true },
    searchRadiusKm: { type: Number, required: true }, // 0, 2, 3, or actual km
    stepsTaken: [{ type: mongoose.Schema.Types.Mixed }],
    isDeliverable: { type: Boolean, required: true },
    matchingZones: [
      {
        zoneId: String,
        name: String,
        city: String
      }
    ],
    eligibleStoresCount: { type: Number, default: 0 },
    eligibleStores: [
      {
        storeId: String,
        name: String,
        branchName: String,
        tenantId: String,
        distanceKm: Number,
        deliveryFee: Number,
        deliveryType: String
      }
    ],
    alternativeStore: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    message: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true, bufferCommands: false, collection: 'delivery_search_logs' }
);

export const DeliverySearchLog = mongoose.model('DeliverySearchLog', deliverySearchLogSchema);
