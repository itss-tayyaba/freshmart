import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
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
    logo: {
      type: String,
      default: ''
    },
    banner: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended', 'archived'],
      default: 'active'
    },
    tagline: {
      type: String,
      default: ''
    },
    themeColor: {
      type: String,
      default: '#047857'
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

export const Company = mongoose.model('Company', companySchema);
