/**
 * server/routes/alertRoutes.js
 *
 * Smart Alerts API — Phase 8D
 * ─────────────────────────────────────────────────────────────────────────────
 * All routes are protected by requireAuth.
 *
 * Role access decision (flagged per Phase 8 brief):
 *   Stock alerts  — visible to ALL authenticated roles.  Every role on a
 *                   construction site benefits from knowing materials are low.
 *   Budget alerts — visible to ALL authenticated roles in this implementation.
 *                   Rationale: site engineers need to know if their project is
 *                   over budget so they can adjust usage; hiding it from them
 *                   creates an information gap that leads to worse outcomes.
 *                   If the product requirement changes to Owner/Finance-only,
 *                   add requireRole(['owner', 'finance']) on the budget section.
 *
 * Routes
 * ──────
 *   GET /api/alerts
 *     Returns a single JSON payload with two alert categories:
 *
 *       stockAlerts  — Material.currentStockBySite entries where
 *                      quantity < reorderThreshold.  Includes site name,
 *                      material name/category, and a severity rating.
 *
 *       budgetAlerts — Project documents where
 *                      spentSoFar > budget × 0.9.  Includes project name,
 *                      amounts, and percentUsed.
 *
 * Severity calculation for stock alerts
 * ──────────────────────────────────────
 *   "critical" — quantity < 50% of reorderThreshold  (urgent, cannot wait)
 *   "low"      — quantity is 50–99% of reorderThreshold  (watch-list)
 *
 *   Rationale: a flat boolean "below threshold" loses signal.  The two-tier
 *   system lets the UI prioritise critical shortages visually (red) vs.
 *   early warnings (amber) — useful for site planning.
 *
 * Query strategy
 * ──────────────
 *   Both checks use MongoDB aggregation pipelines / indexed queries rather
 *   than loading all documents into JS memory.  This honours the Phase 2
 *   index constraint:
 *     - Material uses $unwind + $match on embedded currentStockBySite array
 *     - Project uses a simple find() on indexed spentSoFar/budget fields
 */

import { Router }      from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import { fetchStockAlerts, fetchBudgetAlerts } from '../utils/alertData.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/alerts
// ---------------------------------------------------------------------------

router.get('/', requireAuth, async (req, res) => {
  try {
    const [stockAlerts, budgetAlerts] = await Promise.all([
      fetchStockAlerts(),
      fetchBudgetAlerts(),
    ]);

    return res.json({ stockAlerts, budgetAlerts });
  } catch (err) {
    console.error('[GET /api/alerts] Error:', err);
    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'Failed to fetch alerts.',
    });
  }
});

export default router;
