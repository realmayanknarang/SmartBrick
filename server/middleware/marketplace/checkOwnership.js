/**
 * server/middleware/marketplace/checkOwnership.js
 *
 * Reusable middleware helpers for the marketplace API layer.
 *
 * Exports
 * ───────
 *  resolveMarketplaceUser
 *    Does nothing now because requireAuth already attaches req.user!
 *
 *  checkProjectOwnership
 *    A factory that returns an async middleware verifying that the
 *    authenticated user (req.user._id) owns the MarketplaceProject
 *    identified by req.params.id (or req.params.projectId).
 *    Returns 403 if the check fails.
 *    Must run AFTER requireAuth.
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
 * No-op now because requireAuth already attaches req.user!
 */
export async function resolveMarketplaceUser(req, res, next) {
  return next();
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
 *   requireRole('owner'),
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
