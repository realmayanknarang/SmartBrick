/**
 * server/models/marketplace/MarketplaceProject.js
 *
 * A construction project posted by a marketplace_owner.
 * Builders submit Proposals against this document; once a proposal
 * is approved the status moves to "locked" and approvedProposal
 * is stamped with the winning Proposal's ObjectId.
 *
 * Phase M1D — marketplace schema extension.
 * Follows the same ES-module / Mongoose conventions as the existing
 * Phase 1-13 models in server/models/.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const marketplaceProjectSchema = new Schema(
  {
    // The marketplace_owner who posted the project.
    owner: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Project owner is required'],
    },

    title: {
      type:      String,
      required:  [true, 'Project title is required'],
      trim:      true,
      minlength: [3, 'Title must be at least 3 characters'],
    },

    description: {
      type:     String,
      required: [true, 'Project description is required'],
      trim:     true,
    },

    location: {
      type:     String,
      required: [true, 'Project location is required'],
      trim:     true,
    },

    budgetMin: {
      type:     Number,
      required: [true, 'Minimum budget is required'],
      min:      [0, 'Minimum budget cannot be negative'],
    },

    budgetMax: {
      type:     Number,
      required: [true, 'Maximum budget is required'],
      min:      [0, 'Maximum budget cannot be negative'],
      validate: {
        // Cross-field validator: budgetMax must exceed budgetMin.
        // "this" refers to the document being validated.
        validator(v) {
          return v > this.budgetMin;
        },
        message: 'budgetMax must be greater than budgetMin',
      },
    },

    // Optional — e.g. "2400 sqft"
    plotSize: {
      type: String,
      trim: true,
    },

    constructionType: {
      type:     String,
      required: [true, 'Construction type is required'],
      enum: {
        values:  ['house', 'villa', 'apartment', 'commercial', 'industrial', 'other'],
        message: 'constructionType must be one of: house, villa, apartment, commercial, industrial, other',
      },
    },

    // Optional — e.g. "12 months"
    timeline: {
      type: String,
      trim: true,
    },

    status: {
      type:    String,
      enum: {
        values:  ['open', 'locked', 'completed'],
        message: 'status must be one of: open, locked, completed',
      },
      default: 'open',
    },

    // Supporting documents uploaded by the owner (e.g. floor plans).
    attachments: [
      {
        filename: { type: String },
        url:      { type: String },
      },
    ],

    // Set to the winning Proposal's _id once approved; null otherwise.
    approvedProposal: {
      type:    Schema.Types.ObjectId,
      ref:     'Proposal',
      default: null,
    },
  },
  { timestamps: true }
);

const MarketplaceProject = mongoose.model('MarketplaceProject', marketplaceProjectSchema);

export default MarketplaceProject;
