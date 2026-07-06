/**
 * server/models/marketplace/MarketplaceNotification.js
 *
 * In-app notification delivered to a marketplace user when a relevant
 * event occurs (e.g. a new proposal, an approved bid, a progress update,
 * or a new message).
 *
 * The compound index { recipient, isRead, createdAt: -1 } is optimised
 * for the most common query: "fetch all unread notifications for a user,
 * newest first".
 *
 * Phase M1D — marketplace schema extension.
 * Follows the same ES-module / Mongoose conventions as the existing
 * Phase 1-13 models in server/models/.
 */

import mongoose from 'mongoose';
import { getIO } from '../../config/socket.js';

const { Schema } = mongoose;

const marketplaceNotificationSchema = new Schema(
  {
    // The User who should receive this notification.
    recipient: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Recipient reference is required'],
    },

    // Categorises the event that triggered the notification.
    type: {
      type:     String,
      required: [true, 'Notification type is required'],
      enum: {
        values: [
          'proposal_received',
          'proposal_approved',
          'proposal_rejected',
          'progress_update',
          'new_message',
          'milestone_completed',
        ],
        message:
          'type must be one of: proposal_received, proposal_approved, ' +
          'proposal_rejected, progress_update, new_message, milestone_completed',
      },
    },

    // Human-readable notification text shown in the UI.
    message: {
      type:     String,
      required: [true, 'Notification message is required'],
      trim:     true,
    },

    // Optional link back to the project this notification concerns.
    relatedProject: {
      type: Schema.Types.ObjectId,
      ref:  'MarketplaceProject',
    },

    // False until the recipient opens / dismisses the notification.
    isRead: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

/**
 * Compound index optimised for the primary query pattern:
 * "fetch all unread notifications for a recipient, newest first".
 * Also covers queries filtered only by recipient (leading key).
 */
marketplaceNotificationSchema.index(
  { recipient: 1, isRead: 1, createdAt: -1 }
);

marketplaceNotificationSchema.post('save', function (doc) {
  try {
    const io = getIO();
    io.emit('notification_update', { recipientId: doc.recipient.toString() });
  } catch (err) {
    console.warn('[socket] Failed to emit notification_update:', err.message);
  }
});

const MarketplaceNotification = mongoose.model(
  'MarketplaceNotification',
  marketplaceNotificationSchema
);

export default MarketplaceNotification;
