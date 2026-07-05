/**
 * server/middleware/marketplace/checkOwnership.js
 *
 * Reusable middleware helpers for the marketplace API layer.
 *
 * Exports
 * ───────
 *  resolveMarketplaceUser
 *    Runs AFTER requireAuth (depends on req.clerkUserId).
 *    Looks up the full User document (including _id) by clerkUserId
 *    and attaches it to req.user.  All marketplace route handlers that
 *    need the caller's MongoDB _id use this instead of duplicating the
 *    lookup.
 *
 *  checkProjectOwnership
 *    A factory that returns an async middleware verifying that the
 *    authenticated user (req.user._id) owns the MarketplaceProject
 *    identified by req.params.id (or req.params.projectId).
 *    Returns 403 if the check fails.
 *    Must run AFTER resolveMarketplaceUser.
 *
 * Phase M2A — marketplace REST API.
 */

import User               from '../../models/User.js';
import MarketplaceProject from '../../models/marketplace/MarketplaceProject.js';

// ---------------------------------------------------------------------------
// resolveMarketplaceUser
// ---------------------------------------------------------------------------

/**
 * Fetches the full MongoDB User document for the authenticated Clerk user
 * and attaches it to req.user.  Handlers can then use req.user._id,
 * req.user.role, req.user.name, etc. without an extra DB round-trip.
 *
 * Must run AFTER requireAuth (which sets req.clerkUserId).
 */
export async function resolveMarketplaceUser(req, res, next) {
  try {
    const user = await User.findOne({ clerkUserId: req.clerkUserId })
      .select('_id name email role')
      .lean();

    if (!user) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'No SmartBrick account found for this user. Please complete registration.',
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error('[resolveMarketplaceUser] Unexpected error:', err);
    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'An unexpected error occurred while resolving user identity.',
    });
  }
}

// ---------------------------------------------------------------------------
// checkProjectOwnership
// ---------------------------------------------------------------------------

/**
 * Factory that returns an async middleware verifying that the authenticated
 * user owns the MarketplaceProject identified by the route param.
 *
 * @param {string} [paramName='id']  The req.params key holding the project _id.
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.patch(
 *   '/:id',
 *   requireAuth,
 *   requireRole('marketplace_owner'),
 *   resolveMarketplaceUser,
 *   checkProjectOwnership(),
 *   handler,
 * );
 */
export function checkProjectOwnership(paramName = 'id') {
  return async function ownershipGuard(req, res, next) {
    try {
      const projectId = req.params[paramName];

      // Only fetch the fields we need for the ownership check.
      const project = await MarketplaceProject.findById(projectId)
        .select('owner isActive')
        .lean();

      if (!project || !project.isActive) {
        return res.status(404).json({
          error:   'Not Found',
          message: 'Project not found.',
        });
      }

      if (project.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'You do not own this project.',
        });
      }

      return next();
    } catch (err) {
      if (err.name === 'CastError') {
        return res.status(400).json({
          error:   'Bad Request',
          message: 'Invalid project ID.',
        });
      }
      console.error('[checkProjectOwnership] Unexpected error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'An unexpected error occurred while checking project ownership.',
      });
    }
  };
}
