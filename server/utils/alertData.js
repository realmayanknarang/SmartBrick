/**
 * server/utils/alertData.js
 *
 * Shared stock + budget alert queries — Phase 8D / reused by Phase 9A Copilot.
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralises the MongoDB aggregation / find logic so alertRoutes and
 * copilotContext both use the same definitions (severity tiers, thresholds).
 */

import Material from '../models/Material.js';
import Project  from '../models/Project.js';

/**
 * Stock alerts: Material.currentStockBySite entries where quantity < reorderThreshold.
 *
 * @returns {Promise<Array>}
 */
export async function fetchStockAlerts() {
  return Material.aggregate([
    { $unwind: { path: '$currentStockBySite', preserveNullAndEmptyArrays: false } },
    {
      $match: {
        'currentStockBySite.reorderThreshold': { $gt: 0 },
        $expr: {
          $lt: ['$currentStockBySite.quantity', '$currentStockBySite.reorderThreshold'],
        },
      },
    },
    {
      $lookup: {
        from:         'sites',
        localField:   'currentStockBySite.site',
        foreignField: '_id',
        as:           'siteDoc',
      },
    },
    { $unwind: { path: '$siteDoc', preserveNullAndEmptyArrays: false } },
    {
      $project: {
        _id:              0,
        materialId:       '$_id',
        materialName:     '$name',
        category:         1,
        unit:             1,
        siteId:           '$currentStockBySite.site',
        siteName:         '$siteDoc.name',
        siteCity:         '$siteDoc.city',
        quantity:         '$currentStockBySite.quantity',
        reorderThreshold: '$currentStockBySite.reorderThreshold',
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
    { $sort: { severity: 1, quantity: 1 } },
  ]);
}

/**
 * Budget alerts: Projects where spentSoFar > budget × 0.9.
 *
 * @returns {Promise<Array>}
 */
export async function fetchBudgetAlerts() {
  const projects = await Project.find(
    {},
    { name: 1, budget: 1, spentSoFar: 1, status: 1 }
  ).lean();

  return projects
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
        severity:    percentUsed >= 100 ? 'critical' : 'warning',
      };
    })
    .sort((a, b) => b.percentUsed - a.percentUsed);
}
