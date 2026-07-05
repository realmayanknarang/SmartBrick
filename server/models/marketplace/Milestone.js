/**
 * server/models/marketplace/Milestone.js
 *
 * A single deliverable checkpoint on a MarketplaceProject.
 * Milestones are created by the owner (or builder) and marked
 * complete when the builder confirms the work is done.
 *
 * Phase M1D — marketplace schema extension.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const milestoneSchema = new Schema(
  {
    project: {
      type:     Schema.Types.ObjectId,
      ref:      'MarketplaceProject',
      required: [true, 'Associated project is required'],
    },

    title: {
      type:     String,
      required: [true, 'Milestone title is required'],
      trim:     true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Optional target date for the milestone.
    dueDate: {
      type: Date,
    },

    // Stamped when isCompleted is set to true.
    completedAt: {
      type:    Date,
      default: null,
    },

    isCompleted: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Efficiently list all milestones belonging to a project.
milestoneSchema.index({ project: 1 });

const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;
