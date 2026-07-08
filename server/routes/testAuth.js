/**
 * server/routes/testAuth.js
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  VERIFICATION SCAFFOLD — NOT A REAL FEATURE                           ║
 * ║                                                                      ║
 * ║  These three routes exist solely to prove that the auth stack        ║
 * ║  (JWT token verification + MongoDB user lookup + rate limiting)      ║
 * ║  is wired up correctly end-to-end.                                   ║
 * ║                                                                      ║
 * ║  DECISION: keep or delete?                                           ║
 * ║  → KEEP as a reference pattern.  Real feature routers in later        ║
 * ║    phases will follow the same requireAuth / requireRole() shape.     ║
 * ║    The routes themselves are harmless (read-only, no DB writes).      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Routes
 * ──────
 * GET /api/test-auth/public      No auth. Sanity-check the server is up.
 * GET /api/test-auth/protected   requireAuth — proves token verification works.
 * GET /api/test-auth/owner-only  requireAuth + requireRole('owner') — proves
 *                                role lookup against MongoDB works.
 *
 * Manual test sequence (replace TOKEN with a real JWT):
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
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// ── GET /api/test-auth/public ────────────────────────────────────────────────
// No middleware — verifies the server and rate limiter are reachable.

router.get('/public', (_req, res) => {
  res.json({ message: 'Public route, no auth needed' });
});

// ── GET /api/test-auth/protected ─────────────────────────────────────────────
// requireAuth only — verifies JWT token verification and MongoDB user lookup.

router.get('/protected', requireAuth, async (req, res) => {
  try {
    return res.json({
      message: 'You are authenticated',
      userId: req.user._id,
      role: req.user.role,
      name: req.user.name,
      email: req.user.email,
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
