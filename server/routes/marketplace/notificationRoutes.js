/**
 * server/routes/marketplace/notificationRoutes.js
 *
 * Marketplace Notification REST API — Phase M2D
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Routes
 * ──────
 *   GET   /api/marketplace/notifications                  — list notifications
 *   PATCH /api/marketplace/notifications/mark-read        — mark ALL unread as read
 *   PATCH /api/marketplace/notifications/:id/mark-read    — mark one notification
 *                                                           as read
 *
 * Access model
 * ────────────
 *   All routes require authentication.
 *   Every notification is scoped to req.user._id — users can only see / modify
 *   their own notifications.
 *
 * Response shape for GET /notifications
 * ──────────────────────────────────────
 *   { notifications: [...], unreadCount: <number> }
 *   unreadCount = total unread regardless of isRead query param filter.
 *
 * Phase M2D — marketplace REST API.
 */

import { Router }              from 'express';
import mongoose                from 'mongoose';
import { requireAuth }         from '../../middleware/auth.js';
import {
  resolveMarketplaceUser,
}                              from '../../middleware/marketplace/checkOwnership.js';
import MarketplaceNotification from '../../models/marketplace/MarketplaceNotification.js';

const router = Router();

// ─── helpers ──────────────────────────────────────────────────────────────────

function isCastError(err) {
  return err.name === 'CastError' || err.name === 'BSONError';
}

function isValidObjectId(v) {
  return mongoose.Types.ObjectId.isValid(v);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/marketplace/notifications
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all notifications for the authenticated user, newest first.
 *
 * Query params
 * ────────────
 *   isRead — optional boolean string ("true" | "false") to filter by read status.
 *
 * Response
 * ────────
 *   { notifications: [...], unreadCount }
 *   unreadCount is the total count of unread notifications for this user,
 *   independent of any isRead filter.  Used for badge display in the frontend.
 */
router.get(
  '/notifications',
  requireAuth,
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const baseFilter = { recipient: req.user._id };

      // ── Optional isRead filter ─────────────────────────────────────────────
      const filter = { ...baseFilter };
      if (req.query.isRead === 'true')  filter.isRead = true;
      if (req.query.isRead === 'false') filter.isRead = false;

      // ── Parallel fetch: filtered list + total unread count ────────────────
      const [notifications, unreadCount] = await Promise.all([
        MarketplaceNotification.find(filter)
          .sort({ createdAt: -1 })
          .lean(),
        MarketplaceNotification.countDocuments({ ...baseFilter, isRead: false }),
      ]);

      return res.json({ notifications, unreadCount });
    } catch (err) {
      console.error('[GET /api/marketplace/notifications] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to fetch notifications.',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/marketplace/notifications/mark-read  (bulk)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark ALL unread notifications for this user as read.
 *
 * NOTE: This route is registered BEFORE /notifications/:id/mark-read so that
 * Express treats "mark-read" as a literal path segment, not an :id param.
 *
 * Returns: { message, updatedCount }
 */
router.patch(
  '/notifications/mark-read',
  requireAuth,
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const result = await MarketplaceNotification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
      );

      return res.json({
        message:      'All notifications marked as read.',
        updatedCount: result.modifiedCount,
      });
    } catch (err) {
      console.error('[PATCH /api/marketplace/notifications/mark-read] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to mark notifications as read.',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/marketplace/notifications/:id/mark-read  (single)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark a single notification as read.
 * Verifies that the notification belongs to the authenticated user.
 *
 * Returns 200 with the updated notification document.
 */
router.patch(
  '/notifications/:id/mark-read',
  requireAuth,
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid notification ID.' });
      }

      const notification = await MarketplaceNotification.findById(id);

      if (!notification) {
        return res.status(404).json({ error: 'Not Found', message: 'Notification not found.' });
      }

      // Ownership check — users may only mark their own notifications.
      if (notification.recipient.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'This notification does not belong to you.',
        });
      }

      notification.isRead = true;
      await notification.save();

      return res.json({ notification });
    } catch (err) {
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid notification ID.' });
      }
      console.error('[PATCH /api/marketplace/notifications/:id/mark-read] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to mark notification as read.',
      });
    }
  }
);

export default router;
