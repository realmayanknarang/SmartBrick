import mongoose from 'mongoose';

const stockBySiteSchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    reorderThreshold: {
      type: Number,
      default: 0,
      min: [0, 'Reorder threshold cannot be negative'],
    },
  },
  { _id: false }
);

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Material name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['cement', 'steel', 'sand', 'bricks', 'electrical', 'plumbing'],
        message: 'Category must be one of: cement, steel, sand, bricks, electrical, plumbing',
      },
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
    currentStockBySite: {
      type: [stockBySiteSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Material = mongoose.model('Material', materialSchema);

export default Material;
