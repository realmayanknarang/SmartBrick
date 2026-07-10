/**
 * server/routes/marketplace/chatRoutes.js
 *
 * Marketplace Chat REST API — Phase M2D
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Routes
 * ──────
 *   GET  /api/marketplace/conversations/:projectId     — fetch the conversation
 *                                                        for a project
 *   GET  /api/marketplace/messages/:conversationId     — list messages + mark read
 *   POST /api/marketplace/messages/:conversationId     — send a message
 *
 * Access model
 * ────────────
 *   All routes require authentication.
 *   Only the conversation's owner and builder may read or write messages.
 *   A conversation is ONLY created during the proposal-approve flow (M2A).
 *   These routes never auto-create a conversation.
 *
 * Socket.io (Phase M3)
 * ────────────────────
 *   A TODO comment marks the location where a "new_message" event should be
 *   emitted once Socket.io is integrated in Phase M3.
 *
 * Phase M2D — marketplace REST API.
 */

import { Router }                  from 'express';
import mongoose                    from 'mongoose';
import { requireAuth }             from '../../middleware/auth.js';
import {
  resolveMarketplaceUser,
}                                  from '../../middleware/marketplace/checkOwnership.js';
import Conversation                from '../../models/marketplace/Conversation.js';
import Message                     from '../../models/marketplace/Message.js';
import MarketplaceNotification     from '../../models/marketplace/MarketplaceNotification.js';
import { getIO, emitNotificationUpdate } from '../../config/socket.js';

const router = Router();

// ─── helpers ──────────────────────────────────────────────────────────────────

function isCastError(err) {
  return err.name === 'CastError' || err.name === 'BSONError';
}

function isValidObjectId(v) {
  return mongoose.Types.ObjectId.isValid(v);
}

/**
 * Returns true if userId is one of the two participants (owner or builder).
 *
 * @param {object} conversation  Mongoose Conversation document.
 * @param {string|ObjectId} userId
 */
function isParticipant(conversation, userId) {
  const uid = userId.toString();
  return (
    conversation.owner.toString()   === uid ||
    conversation.builder.toString() === uid
  );
}

/**
 * Persist a MarketplaceNotification silently.
 * Notification failures never block the main response.
 */
async function createNotification(data) {
  try {
    await MarketplaceNotification.create(data);
  } catch (err) {
    console.error('[createNotification] Failed:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/marketplace/conversations/:projectId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the Conversation document for a project.
 *
 * - Returns 404 (with available: false) when no conversation exists.
 * - Returns 403 when the caller is not an owner or builder of the conversation.
 * - Returns the conversation with owner and builder names populated.
 */
router.get(
  '/conversations/:projectId',
  requireAuth,
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { projectId } = req.params;

      if (!isValidObjectId(projectId)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid project ID.' });
      }

      const conversation = await Conversation.findOne({ project: projectId })
        .populate('owner',   'name email')
        .populate('builder', 'name email')
        .lean();

      // No conversation yet — proposal has not been approved.
      if (!conversation) {
        return res.status(404).json({
          available: false,
          message:   'Chat is only available after a proposal is approved.',
        });
      }

      // Access check — only participants may view the conversation.
      if (!isParticipant(conversation, req.user._id)) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'You are not a participant in this conversation.',
        });
      }

      return res.json({ conversation });
    } catch (err) {
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid project ID.' });
      }
      console.error('[GET /api/marketplace/conversations/:projectId] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to fetch conversation.',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/marketplace/messages/:conversationId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all messages in a conversation, oldest first.
 * After fetching, marks unread messages (not already in readBy) as read
 * for the current user.
 *
 * Returns: { messages: [...], conversation }
 */
router.get(
  '/messages/:conversationId',
  requireAuth,
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { conversationId } = req.params;

      if (!isValidObjectId(conversationId)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid conversation ID.' });
      }

      const conversation = await Conversation.findById(conversationId)
        .populate('owner',   'name email')
        .populate('builder', 'name email')
        .lean();

      if (!conversation) {
        return res.status(404).json({ error: 'Not Found', message: 'Conversation not found.' });
      }

      // Participant check.
      if (!isParticipant(conversation, req.user._id)) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'You are not a participant in this conversation.',
        });
      }

      // Fetch messages oldest-first.
      const messages = await Message.find({ conversation: conversationId })
        .populate('sender', 'name')
        .sort({ createdAt: 1 })
        .lean();

      // Mark all messages where current user is NOT yet in readBy.
      // Fire-and-forget — failure should not block the response.
      Message.updateMany(
        {
          conversation: conversationId,
          readBy:       { $ne: req.user._id },
        },
        { $addToSet: { readBy: req.user._id } }
      ).catch((err) =>
        console.error('[GET messages] Failed to mark messages as read:', err.message)
      );

      return res.json({ messages, conversation });
    } catch (err) {
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid conversation ID.' });
      }
      console.error('[GET /api/marketplace/messages/:conversationId] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to fetch messages.',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/marketplace/messages/:conversationId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a message in a conversation.
 *
 * Body: { content, messageType?, fileUrl? }
 *   - content is required when messageType is "text" (or omitted, default "text").
 *   - messageType defaults to "text"; also accepts "image" or "file".
 *   - fileUrl is optional.
 *
 * Fires a new_message notification for the other participant.
 *
 * Socket.io integration is deferred to Phase M3.
 */
router.post(
  '/messages/:conversationId',
  requireAuth,
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { conversationId } = req.params;

      if (!isValidObjectId(conversationId)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid conversation ID.' });
      }

      const conversation = await Conversation.findById(conversationId).lean();

      if (!conversation) {
        return res.status(404).json({ error: 'Not Found', message: 'Conversation not found.' });
      }

      // Participant check.
      if (!isParticipant(conversation, req.user._id)) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'You are not a participant in this conversation.',
        });
      }

      // ── Validation ────────────────────────────────────────────────────────
      const { content, messageType = 'text', fileUrl } = req.body;

      if (messageType === 'text' || !messageType) {
        if (!content || !String(content).trim()) {
          return res.status(400).json({
            error:   'Validation Error',
            messages: ['content is required for text messages.'],
          });
        }
      }

      if (!['text', 'image', 'file'].includes(messageType)) {
        return res.status(400).json({
          error:   'Validation Error',
          messages: ['messageType must be one of: text, image, file.'],
        });
      }

      // ── Create message ────────────────────────────────────────────────────
      const message = await Message.create({
        conversation: conversationId,
        sender:       req.user._id,
        content:      content ? String(content).trim() : '',
        messageType,
        fileUrl:      fileUrl || null,
        readBy:       [req.user._id], // sender has implicitly read their own message
      });

      // ── Populate sender for the response ──────────────────────────────────
      await message.populate('sender', 'name');

      // Emit new_message event to conversation room
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit('new_message', { message });

      // ── Determine the other participant ───────────────────────────────────
      const senderId    = req.user._id.toString();
      const ownerId     = conversation.owner.toString();
      const recipientId =
        senderId === ownerId ? conversation.builder : conversation.owner;

      // ── Notify the other participant ───────────────────────────────────────
      await createNotification({
        recipient:      recipientId,
        type:           'new_message',
        message:        'You have a new message.',
        relatedProject: conversation.project,
      });
      emitNotificationUpdate(recipientId);

      return res.status(201).json({ message });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error:    'Validation Error',
          messages: Object.values(err.errors).map((e) => e.message),
        });
      }
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid conversation ID.' });
      }
      console.error('[POST /api/marketplace/messages/:conversationId] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to send message.',
      });
    }
  }
);

export default router;
