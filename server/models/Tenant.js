import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ['Starter', 'Professional', 'Enterprise'],
      default: 'Professional'
    },
    billingCycle: {
      type: String,
      enum: ['Monthly', 'Annual'],
      default: 'Monthly'
    },
    price: {
      type: Number,
      default: 55000
    },
    status: {
      type: String,
      enum: ['Active', 'Trialing', 'Past Due', 'Cancelled'],
      default: 'Active'
    },
    renewsAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    features: [
      {
        type: String
      }
    ]
  },
  { _id: false }
);

const tenantSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    tenantId: {
      type: String,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    tagline: {
      type: String,
      default: 'Premier Grocery & Essentials Partner'
    },
    description: {
      type: String,
      default: ''
    },
    logo: {
      type: String,
      default: ''
    },
    banner: {
      type: String,
      default: ''
    },
    badge: {
      type: String,
      default: 'Official Partner Store'
    },
    ownerName: {
      type: String,
      required: true
    },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    ownerPhone: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Suspended', 'Archived'],
      default: 'Active'
    },
    theme: {
      primaryColor: {
        type: String,
        default: '#047857'
      },
      accentColor: {
        type: String,
        default: '#10b981'
      }
    },
    hubs: [
      {
        type: String
      }
    ],
    subscription: {
      type: subscriptionSchema,
      default: () => ({
        plan: 'Professional',
        billingCycle: 'Monthly',
        price: 55000,
        status: 'Active',
        renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        features: ['Store Admin Console', 'Unlimited Products', 'Fleet Dispatch', 'Real-time GPS', 'Analytics']
      })
    },
    stats: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      activeProducts: { type: Number, default: 0 },
      activeRiders: { type: Number, default: 0 },
      fulfillmentRate: { type: Number, default: 98.5 }
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

export const Tenant = mongoose.model('Tenant', tenantSchema);
