/**
 * server/models/marketplace/ProgressUpdate.js
 *
 * A construction progress snapshot posted by the builder assigned
 * to a MarketplaceProject.  Multiple updates accumulate over time;
 * the compound index { project, createdAt: -1 } makes it efficient
 * to fetch the latest update for any given project.
 *
 * Phase M1D — marketplace schema extension.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const progressUpdateSchema = new Schema(
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

    // Human-readable phase label, e.g. "Foundation", "Plastering".
    stage: {
      type:     String,
      required: [true, 'Stage is required'],
      trim:     true,
    },

    progressPercentage: {
      type:     Number,
      required: [true, 'Progress percentage is required'],
      min:      [0,   'Progress cannot be less than 0%'],
      max:      [100, 'Progress cannot exceed 100%'],
    },

    notes: {
      type: String,
      trim: true,
    },

    // Photos taken at the site during this update.
    sitePhotos: [
      {
        filename: { type: String },
        url:      { type: String },
      },
    ],
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Efficiently fetch all updates for a project sorted newest-first.
progressUpdateSchema.index({ project: 1, createdAt: -1 });

const ProgressUpdate = mongoose.model('ProgressUpdate', progressUpdateSchema);

export default ProgressUpdate;
