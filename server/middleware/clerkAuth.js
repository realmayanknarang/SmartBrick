/**
 * server/middleware/clerkAuth.js
 *
 * Two middleware factories for SmartBrick's protected routes:
 *
 *  requireAuth          — verifies the Clerk session token and rejects with
 *                         401 if the request is unauthenticated.
 *
 *  requireRole(...roles) — runs AFTER requireAuth; looks up the caller's role
 *                          in MongoDB (by clerkUserId) and rejects with 403
 *                          if the role is not in the allowed list.
 *
 * Role-source decision
 * --------------------
 * We read the role from MongoDB (User.clerkUserId) rather than from Clerk's
 * public metadata.  Reasons:
 *  1. MongoDB is the canonical source of truth for roles in this project.
 *  2. No extra Clerk API round-trip needed — Clerk's clerkMiddleware already
 *     gives us the userId synchronously via getAuth(req).
 *  3. Survives email changes in Clerk without any sync logic.
 *
 * Usage
 * -----
 *  import { requireAuth, requireRole } from '../middleware/clerkAuth.js';
 *
 *  router.get(
 *    '/finance-only-route',
 *    requireAuth,
 *    requireRole('owner', 'finance'),
 *    handler,
 *  );
 */

import { getAuth } from '@clerk/express';
import User from '../models/User.js';

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------

/**
 * Verifies that the incoming request carries a valid Clerk session token.
 *
 * @clerk/express's clerkMiddleware() (applied globally in index.js) already
 * validates the JWT and attaches the auth state to req.auth.  This middleware
 * simply checks that the session is authenticated and returns a clean 401
 * if not, instead of leaking SDK internals.
 */
export function requireAuth(req, res, next) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'A valid session token is required to access this resource.',
    });
  }

  // Attach the userId to req for downstream middleware (e.g. requireRole).
  req.clerkUserId = userId;
  return next();
}

// ---------------------------------------------------------------------------
// requireRole
// ---------------------------------------------------------------------------

/**
 * Factory that returns an async middleware enforcing role-based access.
 * Must run AFTER requireAuth (depends on req.clerkUserId being set).
 *
 * @param  {...string} allowedRoles  One or more role strings from the User
 *                                   model enum: 'owner' | 'project_manager' |
 *                                   'site_engineer' | 'finance'
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.get('/admin', requireAuth, requireRole('owner'), handler);
 * router.get('/finance', requireAuth, requireRole('owner', 'finance'), handler);
 */
export function requireRole(...allowedRoles) {
  return async function roleGuard(req, res, next) {
    try {
      const clerkUserId = req.clerkUserId;

      if (!clerkUserId) {
        // Defensive guard — requireAuth should always run first.
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication is required before role authorization.',
        });
      }

      // Look up the user's role in MongoDB using their Clerk user ID.
      const user = await User.findOne({ clerkUserId }).select('role').lean();

      if (!user) {
        // The Clerk session is valid but this Clerk user has no matching
        // MongoDB record yet (e.g. they haven't completed onboarding).
        return res.status(403).json({
          error: 'Forbidden',
          message: 'No SmartBrick account found for this user. Please complete registration.',
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `This action requires one of the following roles: ${allowedRoles.join(', ')}. Your role is '${user.role}'.`,
        });
      }

      // Attach the resolved role to req so handlers can use it without another DB hit.
      req.userRole = user.role;
      return next();
    } catch (err) {
      console.error('[requireRole] Unexpected error during role check:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while verifying your permissions.',
      });
    }
  };
}
