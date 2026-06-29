/**
 * server/routes/dashboardRoutes.js
 *
 * Dashboard aggregate data — Phase 7A
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides a single summary endpoint consumed by the dashboard Overview panel.
 * All routes are protected by requireAuth; any authenticated role may call them.
 *
 * Routes
 * ──────
 *   GET /api/dashboard/summary
 *     Returns { activeSites, activeVendors, totalSpend } in one round-trip.
 *     activeSites   — count of all Site documents
 *     activeVendors — count of Vendor documents where isActive === true
 *     totalSpend    — sum of Project.spentSoFar across all projects
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import Site    from '../models/Site.js';
import Vendor  from '../models/Vendor.js';
import Project from '../models/Project.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/dashboard/summary
// ---------------------------------------------------------------------------

/**
 * Runs three lightweight MongoDB queries in parallel — no joins needed since
 * the data lives in three separate collections.
 *
 * spentSoFar aggregation:
 *   $group with $sum is the correct pattern for summing a field across a
 *   collection.  The result is null-safe: if no projects exist the pipeline
 *   returns an empty array, and we fall through to the 0 default.
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const [activeSites, activeVendors, spendResult] = await Promise.all([
      // Total sites (all phases count)
      Site.countDocuments(),

      // Only vendors currently active
      Vendor.countDocuments({ isActive: true }),

      // Sum of spentSoFar across all projects
      Project.aggregate([
        { $group: { _id: null, total: { $sum: '$spentSoFar' } } },
      ]),
    ]);

    const totalSpend = spendResult[0]?.total ?? 0;

    return res.json({
      activeSites,
      activeVendors,
      totalSpend,
    });
  } catch (err) {
    console.error('[dashboard/summary] Error fetching summary metrics:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch dashboard summary metrics.',
    });
  }
});

export default router;
