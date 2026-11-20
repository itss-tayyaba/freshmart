import mongoose from 'mongoose';

const deletedStoreSchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true, unique: true, index: true },
    aliasIds: [{ type: String }],
    deletedAt: { type: Date, default: Date.now },
    reason: { type: String, default: 'superadmin_delete' }
  },
  { timestamps: true }
);

export const DeletedStore =
  mongoose.models.DeletedStore || mongoose.model('DeletedStore', deletedStoreSchema);
