/**
 * server/routes/auth.js
 *
 * POST /api/auth/sync
 * ------------------
 * Called by the client immediately after a successful Clerk sign-in.
 * Looks up the MongoDB User document by email (from the Clerk session)
 * and stamps it with the caller's Clerk user ID so that requireRole()
 * can resolve roles on subsequent requests without touching Clerk's API.
 *
 * This is a one-time link-up per user.  If the document is already
 * stamped with the same clerkUserId the operation is idempotent.
 *
 * Request headers:
 *   Authorization: Bearer <clerk-session-token>
 *
 * Response 200 — { role, name, email }
 * Response 404 — no MongoDB User found for that email
 * Response 401 — missing / invalid session (handled by requireAuth)
 *
 * POST /api/auth/set-role
 * -----------------------
 * Called by SelectRolePage for users who signed in via Google OAuth (or any
 * OAuth provider) and therefore have no role in MongoDB yet.
 *
 * - requireAuth only (caller has no role yet — requireRole would always 403).
 * - Validates role is one of the 4 allowed enum values.
 * - Finds-or-creates the MongoDB User document (creating for genuine first-time
 *   Google sign-ups, updating for pre-seeded / pre-invited accounts).
 * - Returns 403 if the user already has a role (abuse/replay prevention).
 *
 * Response 200 — { success: true, role }
 * Response 400 — invalid role value
 * Response 403 — role already set
 * Response 401 — missing / invalid session
 *
 * Note on URL placement: the spec called for /api/users/set-role but the
 * already-implemented SelectRolePage calls /api/auth/set-role, so this
 * endpoint lives here to avoid a client-side change.  A /api/users router
 * can alias it in a future cleanup if desired.
 */

import { Router } from 'express';
import { getAuth, clerkClient } from '@clerk/express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/clerkAuth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply the stricter auth rate limit (20 req / 15 min per IP) to every
// endpoint on this router — protects against brute-force on auth flows.
router.use(authLimiter);

// ── POST /api/auth/sync ──────────────────────────────────────────────────────

router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);

    // Fetch the Clerk user object to get their primary email address.
    const clerkUser = await clerkClient.users.getUser(userId);
    const primaryEmail = clerkUser.emailAddresses
      .find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress;

    if (!primaryEmail) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No primary email address found on this Clerk account.',
      });
    }

    // Find the matching MongoDB user by email.
    const user = await User.findOne({ email: primaryEmail.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No SmartBrick account found for ${primaryEmail}. Contact your project owner to be invited.`,
      });
    }

    // Stamp the Clerk user ID onto the document (idempotent).
    if (user.clerkUserId !== userId) {
      user.clerkUserId = userId;
      await user.save();
    }

    return res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error('[POST /api/auth/sync] Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while syncing your account.',
    });
  }
});

// ── POST /api/auth/set-role ──────────────────────────────────────────────────
//
// Called by SelectRolePage after a Google OAuth (or any OAuth) sign-up
// where no role was captured during the sign-up flow.
//
// Protected by requireAuth only — the caller has NO role yet, which is
// exactly why they're here.  requireRole() would always 403 them.
//
// Abuse prevention (Part D): if the user ALREADY has a role set, this
// endpoint returns 403.  Changing an existing role requires an admin action
// outside this endpoint, preventing privilege escalation via a replayed request.

const ALLOWED_ROLES = ['owner', 'project_manager', 'site_engineer', 'finance'];

router.post('/set-role', requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { role } = req.body;

    // ── 1. Validate the submitted role ──────────────────────────────────────
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Role must be one of: ${ALLOWED_ROLES.join(', ')}. Received: "${role ?? ''}"`,
      });
    }

    // ── 2. Fetch the Clerk user to get name + email ──────────────────────────
    const clerkUser = await clerkClient.users.getUser(userId);
    const primaryEmail = clerkUser.emailAddresses
      .find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress;

    if (!primaryEmail) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No primary email address found on this Clerk account.',
      });
    }

    const email = primaryEmail.toLowerCase();

    // ── 3. Check by clerkUserId first, then fall back to email ───────────────
    //
    // Priority:
    //   a) clerkUserId match → the /auth/sync link-up already ran for this user
    //   b) email match       → pre-created by seed / invite (no clerkUserId yet)
    //   c) neither           → genuine first-time Google sign-up, create now
    let user =
      (await User.findOne({ clerkUserId: userId })) ||
      (await User.findOne({ email }));

    // ── 4. Abuse guard — role already set ───────────────────────────────────
    if (user?.role) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Role already set. Contact an admin to change it.',
      });
    }

    // ── 5. Persist the role ──────────────────────────────────────────────────
    if (user) {
      // Existing document (seed or previously synced user without a role).
      // Stamp clerkUserId if it isn't set yet, then apply the role.
      user.clerkUserId = userId;
      user.role = role;
      await user.save();
    } else {
      // First-time Google OAuth user — no pre-existing document.
      // Build name from Clerk profile (firstName + lastName) or fall back to email local-part.
      const name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
        email.split('@')[0];

      user = await User.create({
        name,
        email,
        role,
        clerkUserId: userId,
      });
    }

    return res.status(200).json({
      success: true,
      role: user.role,
    });
  } catch (err) {
    console.error('[POST /api/auth/set-role] Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while saving your role.',
    });
  }
});

export default router;
