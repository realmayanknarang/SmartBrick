/**
 * server/routes/testAuth.js
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  PHASE 3 VERIFICATION SCAFFOLD — NOT A REAL FEATURE                 ║
 * ║                                                                      ║
 * ║  These three routes exist solely to prove that the auth stack        ║
 * ║  (Clerk token verification + MongoDB role lookup + rate limiting)     ║
 * ║  is wired up correctly end-to-end.                                   ║
 * ║                                                                      ║
 * ║  DECISION: keep or delete?                                           ║
 * ║  → KEEP as a reference pattern.  Real feature routers in later        ║
 * ║    phases will follow the same requireAuth / requireRole() shape.     ║
 * ║    The routes themselves are harmless (read-only, no DB writes).      ║
 * ║  → If you prefer a clean slate: delete this file and remove the      ║
 * ║    app.use('/api/test-auth', testAuthRouter) line from index.js.      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Routes
 * ──────
 * GET /api/test-auth/public      No auth. Sanity-check the server is up.
 * GET /api/test-auth/protected   requireAuth — proves token verification works.
 * GET /api/test-auth/owner-only  requireAuth + requireRole('owner') — proves
 *                                role lookup against MongoDB works.
 *
 * Manual test sequence (replace TOKEN with a real Clerk session token):
 *
 *   # 1. Should always return 200
 *   curl http://localhost:3001/api/test-auth/public
 *
 *   # 2. Should return 401 without token, 200 with a valid one
 *   curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/test-auth/protected
 *
 *   # 3. Should return 403 for non-owner roles, 200 for owner
 *   curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/test-auth/owner-only
 */

import { Router } from 'express';
import { getAuth } from '@clerk/express';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/clerkAuth.js';

const router = Router();

// ── GET /api/test-auth/public ────────────────────────────────────────────────
// No middleware — verifies the server and rate limiter are reachable.

router.get('/public', (_req, res) => {
  res.json({ message: 'Public route, no auth needed' });
});

// ── GET /api/test-auth/protected ─────────────────────────────────────────────
// requireAuth only — verifies Clerk token verification and MongoDB role lookup.
// Returns the caller's role so you can confirm the MongoDB ↔ Clerk link works.

router.get('/protected', requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);

    // Look up the role so we can echo it back — useful for eyeballing that the
    // Clerk userId was correctly stamped onto the MongoDB document by /auth/sync.
    const user = await User.findOne({ clerkUserId: userId }).select('role').lean();

    return res.json({
      message: 'You are authenticated',
      clerkUserId: userId,
      role: user?.role ?? null,          // null means /auth/sync hasn't run yet
      roleNote: user ? undefined : 'No MongoDB User found — call POST /api/auth/sync first',
    });
  } catch (err) {
    console.error('[GET /api/test-auth/protected] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── GET /api/test-auth/owner-only ────────────────────────────────────────────
// requireAuth + requireRole('owner') — verifies the full RBAC chain.

router.get('/owner-only', requireAuth, requireRole('owner'), (_req, res) => {
  res.json({ message: 'Owner access confirmed' });
});

export default router;
