import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true },
    adminId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    plainPassword: { type: String, default: '' },
    phone: { type: String, default: '+92 300 1234567' },
    role: { type: String, enum: ['admin', 'superadmin', 'store admin'], default: 'admin' },
    tenantId: { type: String, required: true, index: true },
    tenantName: { type: String, required: true },
    branchId: { type: String, index: true, default: 'all' },
    branchName: { type: String, default: 'All Branches' },
    city: { type: String, default: 'Faisalabad' },
    location: { type: String, default: 'Faisalabad, Pakistan' },
    address: { type: String, default: 'Main Commercial Hub, Faisalabad' },
    coordinates: {
      lat: { type: Number, default: 31.4125 },
      lng: { type: Number, default: 73.0995 }
    },
    status: { type: String, enum: ['Active', 'Suspended', 'Pending'], default: 'Active' },
    permissions: [{ type: String }]
  },
  { timestamps: true, bufferCommands: false, collection: 'admins' }
);

// Encrypt password before saving
adminSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    if (!this.plainPassword) {
      this.plainPassword = this.password;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (typeof next === 'function') next();
});

// Compare password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;
  if (this.plainPassword && this.plainPassword === enteredPassword) return true;
  if (this.password === enteredPassword) return true;
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (e) {
    return this.password === enteredPassword;
  }
};

export const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
