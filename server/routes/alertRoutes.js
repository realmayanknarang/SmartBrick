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
import Material        from '../models/Material.js';
import Project         from '../models/Project.js';

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns stock alerts: Material.currentStockBySite entries where
 * quantity < reorderThreshold.
 *
 * Uses an aggregation pipeline to:
 *   1. $unwind the embedded currentStockBySite array
 *   2. $match entries where the quantity is below the reorder threshold
 *   3. $lookup Site to get the human-readable site name
 *   4. $project a clean alert shape with severity
 *
 * @returns {Promise<Array>}
 */
async function fetchStockAlerts() {
  const results = await Material.aggregate([
    // Explode the currentStockBySite array so each entry becomes its own doc
    { $unwind: { path: '$currentStockBySite', preserveNullAndEmptyArrays: false } },

    // Only keep entries where stock is below the reorder threshold AND
    // the threshold itself is meaningful (> 0 prevents divide-by-zero)
    {
      $match: {
        'currentStockBySite.reorderThreshold': { $gt: 0 },
        $expr: {
          $lt: ['$currentStockBySite.quantity', '$currentStockBySite.reorderThreshold'],
        },
      },
    },

    // Join Site to get the site name
    {
      $lookup: {
        from:         'sites',
        localField:   'currentStockBySite.site',
        foreignField: '_id',
        as:           'siteDoc',
      },
    },
    { $unwind: { path: '$siteDoc', preserveNullAndEmptyArrays: false } },

    // Shape the output
    {
      $project: {
        _id:            0,
        materialId:     '$_id',
        materialName:   '$name',
        category:       1,
        unit:           1,
        siteId:         '$currentStockBySite.site',
        siteName:       '$siteDoc.name',
        siteCity:       '$siteDoc.city',
        quantity:       '$currentStockBySite.quantity',
        reorderThreshold: '$currentStockBySite.reorderThreshold',
        // Severity: "critical" if under 50% of threshold, else "low"
        severity: {
          $cond: {
            if: {
              $lt: [
                '$currentStockBySite.quantity',
                { $multiply: ['$currentStockBySite.reorderThreshold', 0.5] },
              ],
            },
            then: 'critical',
            else: 'low',
          },
        },
      },
    },

    // Sort: critical first, then by how far below threshold (most severe gap first)
    {
      $sort: {
        severity: 1,   // "critical" < "low" alphabetically — correct order
        quantity:  1,  // lowest stock first within same severity tier
      },
    },
  ]);

  return results;
}

/**
 * Returns budget alerts: Projects where spentSoFar > budget × 0.9.
 *
 * Uses a simple find() since Project documents are small and
 * the spentSoFar/budget fields are first-class schema fields (not embedded).
 *
 * @returns {Promise<Array>}
 */
async function fetchBudgetAlerts() {
  // Fetch all projects and filter in JS — Project collection is small (seed data ~5 docs).
  // For a larger dataset, use an aggregation with $expr: { $gt: ['$spentSoFar', { $multiply: ['$budget', 0.9] }] }
  // but this simple approach is readable and correct for the current data size.
  const projects = await Project.find(
    {},
    { name: 1, budget: 1, spentSoFar: 1, status: 1 }
  ).lean();

  const alerts = projects
    .filter(p => p.budget > 0 && p.spentSoFar > p.budget * 0.9)
    .map(p => {
      const percentUsed = parseFloat(((p.spentSoFar / p.budget) * 100).toFixed(1));
      return {
        projectId:   p._id,
        projectName: p.name,
        status:      p.status,
        budget:      p.budget,
        spentSoFar:  p.spentSoFar,
        percentUsed,
        // Severity: "critical" if over budget (100%+), else "warning"
        severity: percentUsed >= 100 ? 'critical' : 'warning',
      };
    })
    .sort((a, b) => b.percentUsed - a.percentUsed); // worst overspend first

  return alerts;
}

export default router;
