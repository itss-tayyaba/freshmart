import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    shortName: {
      type: String,
      default: function () {
        return this.name;
      }
    },
    image: {
      type: String,
      required: true
    },
    productCount: {
      type: Number,
      default: 0
    },
    subcategories: [
      {
        type: String
      }
    ]
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

export const Category = mongoose.model('Category', categorySchema);
