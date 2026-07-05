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
 *  isApprovedBuilder
 *    Async utility (not Express middleware) that returns true when
 *    userId is the builder on the approved Proposal for projectId.
 *    Used by progress and milestone route handlers.
 *
 * Phase M2A/M2B — marketplace REST API.
 */

import User               from '../../models/User.js';
import MarketplaceProject from '../../models/marketplace/MarketplaceProject.js';
import Proposal           from '../../models/marketplace/Proposal.js';

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

// ---------------------------------------------------------------------------
// isApprovedBuilder
// ---------------------------------------------------------------------------

/**
 * Async utility — NOT Express middleware.
 *
 * Returns true when userId is the builder associated with the approved
 * Proposal for the given project.  Returns false in all other cases
 * (project missing, not active, no approved proposal, or wrong builder).
 *
 * Implementation detail:
 *   MarketplaceProject.approvedProposal stores the ObjectId of the winning
 *   Proposal.  We then do a targeted Proposal lookup by { _id, builder }
 *   rather than a full populate — two lean queries, each index-covered.
 *
 * @param {string|import('mongoose').Types.ObjectId} projectId
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<boolean>}
 *
 * @example
 * if (!(await isApprovedBuilder(projectId, req.user._id))) {
 *   return res.status(403).json({
 *     error: 'Forbidden',
 *     message: 'Only the approved builder for this project can perform this action.',
 *   });
 * }
 */
export async function isApprovedBuilder(projectId, userId) {
  // Step 1 — get the approved proposal reference from the project.
  const project = await MarketplaceProject.findById(projectId)
    .select('approvedProposal isActive')
    .lean();

  if (!project || !project.isActive || !project.approvedProposal) return false;

  // Step 2 — confirm the Proposal belongs to this builder.
  const proposal = await Proposal.findOne({
    _id:     project.approvedProposal,
    builder: userId,
  })
    .select('_id')
    .lean();

  return proposal !== null;
}
