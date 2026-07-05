/**
 * server/models/marketplace/Proposal.js
 *
 * A builder's bid on a MarketplaceProject.
 * Each builder may submit at most one Proposal per project —
 * enforced at the database level via the compound unique index
 * { project: 1, builder: 1 }.
 *
 * Phase M1D — marketplace schema extension.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const proposalSchema = new Schema(
  {
    project: {
      type:     Schema.Types.ObjectId,
      ref:      'MarketplaceProject',
      required: [true, 'Associated project is required'],
    },

    builder: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Builder reference is required'],
    },

    estimatedBudget: {
      type:     Number,
      required: [true, 'Estimated budget is required'],
      min:      [0, 'Estimated budget cannot be negative'],
    },

    estimatedDuration: {
      type:     String,
      required: [true, 'Estimated duration is required'],
      trim:     true,
    },

    notes: {
      type: String,
      trim: true,
    },

    materialRecommendations: {
      type: String,
      trim: true,
    },

    status: {
      type:    String,
      enum: {
        values:  ['pending', 'approved', 'rejected'],
        message: 'status must be one of: pending, approved, rejected',
      },
      default: 'pending',
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

/**
 * Unique compound index — one proposal per builder per project.
 * Prevents a builder from submitting duplicate bids at the DB level,
 * independent of any application-level checks.
 */
proposalSchema.index({ project: 1, builder: 1 }, { unique: true });

const Proposal = mongoose.model('Proposal', proposalSchema);

export default Proposal;
