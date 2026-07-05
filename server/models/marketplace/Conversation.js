/**
 * server/models/marketplace/Conversation.js
 *
 * A messaging thread between a marketplace_owner and a builder,
 * scoped to a specific MarketplaceProject.
 * The unique compound index { project, owner, builder } guarantees
 * exactly one conversation per project/owner/builder trio — preventing
 * duplicate threads at the database level.
 *
 * Phase M1D — marketplace schema extension.
 * Follows the same ES-module / Mongoose conventions as the existing
 * Phase 1-13 models in server/models/.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    // The MarketplaceProject this conversation belongs to.
    project: {
      type:     Schema.Types.ObjectId,
      ref:      'MarketplaceProject',
      required: [true, 'Associated project is required'],
    },

    // The marketplace_owner side of the conversation.
    owner: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Owner reference is required'],
    },

    // The builder side of the conversation.
    builder: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Builder reference is required'],
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

/**
 * Unique compound index — exactly one conversation per project/owner/builder
 * combination.  Enforced at the DB level so duplicate threads cannot be
 * created even under concurrent requests.
 */
conversationSchema.index(
  { project: 1, owner: 1, builder: 1 },
  { unique: true }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
