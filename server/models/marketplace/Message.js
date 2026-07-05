/**
 * server/models/marketplace/Message.js
 *
 * An individual message within a Conversation thread.
 * Supports plain text, images, and file attachments via messageType.
 * The compound index { conversation: 1, createdAt: -1 } makes it
 * efficient to fetch a conversation's message history in
 * reverse-chronological order.
 *
 * Phase M1D — marketplace schema extension.
 * Follows the same ES-module / Mongoose conventions as the existing
 * Phase 1-13 models in server/models/.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    // The Conversation this message belongs to.
    conversation: {
      type:     Schema.Types.ObjectId,
      ref:      'Conversation',
      required: [true, 'Associated conversation is required'],
    },

    // The User who sent this message (owner or builder).
    sender: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Sender reference is required'],
    },

    // The text body of the message.
    content: {
      type:     String,
      required: [true, 'Message content is required'],
      trim:     true,
    },

    // Differentiates plain text from image / file attachments.
    messageType: {
      type:    String,
      enum: {
        values:  ['text', 'image', 'file'],
        message: 'messageType must be one of: text, image, file',
      },
      default: 'text',
    },

    // URL to the uploaded file or image; null for text-only messages.
    fileUrl: {
      type:    String,
      default: null,
    },

    // Array of User ObjectIds who have opened / seen this message.
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Fetch all messages in a conversation sorted newest-first.
messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
