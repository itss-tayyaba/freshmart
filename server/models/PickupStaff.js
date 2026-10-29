import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pickupStaffSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true },
    staffId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    password: { type: String, required: true },
    plainPassword: { type: String, default: '' },
    phone: { type: String, default: '' },
    role: { type: String, default: 'pickup_staff' },
    tenantId: { type: String, required: true, index: true },
    tenantName: { type: String, required: true },
    branchId: { type: String, required: true, index: true },
    branchName: { type: String, required: true },
    city: { type: String, default: 'Faisalabad' },
    location: { type: String, default: 'Faisalabad, Pakistan' },
    address: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: 31.4125 },
      lng: { type: Number, default: 73.0995 }
    },
    status: { type: String, enum: ['Active', 'Inactive', 'Busy'], default: 'Active' },
    rating: { type: Number, default: 5.0 },
    tasksCompleted: { type: Number, default: 0 }
  },
  { timestamps: true, bufferCommands: false, collection: 'pickup_staff' }
);

// Encrypt password before saving
pickupStaffSchema.pre('save', async function (next) {
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
pickupStaffSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;
  if (this.plainPassword && this.plainPassword === enteredPassword) return true;
  if (this.password === enteredPassword) return true;
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (e) {
    return this.password === enteredPassword;
  }
};

export const PickupStaff = mongoose.models.PickupStaff || mongoose.model('PickupStaff', pickupStaffSchema);
