import mongoose from 'mongoose';

const usageHistorySchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site reference is required'],
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: [true, 'Material reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    quantityUsed: {
      type: Number,
      required: [true, 'Quantity used is required'],
      min: [0, 'Quantity used cannot be negative'],
    },
    phaseAtTime: {
      type: String,
      required: [true, 'Phase at time of usage is required'],
      enum: {
        values: ['foundation', 'structure', 'finishing'],
        message: 'Phase must be one of: foundation, structure, finishing',
      },
    },
  },
  { timestamps: true }
);

// Compound index: site + material + date desc — powers per-site consumption analytics
usageHistorySchema.index({ site: 1, material: 1, date: -1 });

const UsageHistory = mongoose.model('UsageHistory', usageHistorySchema);

export default UsageHistory;
