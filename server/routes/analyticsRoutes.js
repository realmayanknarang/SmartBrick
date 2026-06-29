/**
 * server/routes/analyticsRoutes.js
 *
 * Spending Analytics API — Phase 8C
 * ─────────────────────────────────────────────────────────────────────────────
 * All routes are protected by requireAuth.
 *
 * Routes
 * ──────
 *   GET /api/analytics/spending-summary
 *     Returns a single JSON payload with four aggregated views of
 *     PurchaseOrder spend data:
 *
 *       totalSpend          — sum of totalCost across ALL purchase orders
 *       byCategory          — spend grouped by material category
 *       byProject           — spend grouped by project (with project name)
 *       monthlyTrend        — monthly spend totals for the last 12 months
 *
 * Aggregation strategy
 * ────────────────────
 * All four groups use MongoDB aggregation pipelines rather than in-memory
 * JS loops.  PurchaseOrder has:
 *   • compound index { project: 1, site: 1 }   — used by byProject group
 *   • single-field index { orderDate: -1 }      — used by monthlyTrend sort
 * The Material lookup (for category) is a $lookup join — acceptable at
 * seed-data scale; a real production system would denormalise category
 * onto PurchaseOrder for speed.
 *
 * Empty-state safety
 * ──────────────────
 * Every pipeline result that may be an empty array is returned as-is (not
 * null).  The frontend handles the [] case with an explicit "no data" state.
 */

import { Router }       from 'express';
import { requireAuth }  from '../middleware/clerkAuth.js';
import PurchaseOrder    from '../models/PurchaseOrder.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/analytics/spending-summary
// ---------------------------------------------------------------------------

/**
 * Runs four MongoDB aggregation pipelines concurrently via Promise.all(),
 * then assembles and returns a single response object.
 */
router.get('/spending-summary', requireAuth, async (req, res) => {
  try {
    // ── 12-month window used by the trend pipeline ─────────────────────────
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [
      totalResult,
      byCategoryResult,
      byProjectResult,
      monthlyTrendResult,
    ] = await Promise.all([

      // ── 1. Total spend ────────────────────────────────────────────────────
      // Simple $group across all documents.  Returns [{_id: null, total: N}]
      // or [] if no orders exist.
      PurchaseOrder.aggregate([
        { $group: { _id: null, total: { $sum: '$totalCost' } } },
      ]),

      // ── 2. Spend by material category ────────────────────────────────────
      // $lookup joins Material to get the category field (not stored on PO
      // directly in Phase 2's schema design).
      PurchaseOrder.aggregate([
        {
          $lookup: {
            from:         'materials',
            localField:   'material',
            foreignField: '_id',
            as:           'materialDoc',
          },
        },
        { $unwind: { path: '$materialDoc', preserveNullAndEmpty: false } },
        {
          $group: {
            _id:   '$materialDoc.category',
            spend: { $sum: '$totalCost' },
            count: { $sum: 1 },
          },
        },
        { $sort: { spend: -1 } },
        {
          $project: {
            _id:      0,
            category: '$_id',
            spend:    1,
            count:    1,
          },
        },
      ]),

      // ── 3. Spend by project ───────────────────────────────────────────────
      // $lookup joins Project to get the project name.
      PurchaseOrder.aggregate([
        {
          $lookup: {
            from:         'projects',
            localField:   'project',
            foreignField: '_id',
            as:           'projectDoc',
          },
        },
        { $unwind: { path: '$projectDoc', preserveNullAndEmpty: false } },
        {
          $group: {
            _id:         '$project',
            projectName: { $first: '$projectDoc.name' },
            spend:       { $sum: '$totalCost' },
            orderCount:  { $sum: 1 },
          },
        },
        { $sort: { spend: -1 } },
        {
          $project: {
            _id:         0,
            projectId:   '$_id',
            projectName: 1,
            spend:       1,
            orderCount:  1,
          },
        },
      ]),

      // ── 4. Monthly spend trend (last 12 months) ───────────────────────────
      // $dateToString groups by "YYYY-MM" string so the front end can label
      // chart ticks without any additional parsing.
      PurchaseOrder.aggregate([
        {
          $match: {
            orderDate: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$orderDate' },
            },
            spend: { $sum: '$totalCost' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },   // ascending chronological — { orderDate: -1 } index supports this
        {
          $project: {
            _id:   0,
            month: '$_id',
            spend: 1,
            count: 1,
          },
        },
      ]),
    ]);

    // ── Assemble response ──────────────────────────────────────────────────
    const totalSpend = totalResult[0]?.total ?? 0;

    return res.json({
      totalSpend,
      byCategory:   byCategoryResult,    // [ { category, spend, count }, … ]
      byProject:    byProjectResult,     // [ { projectId, projectName, spend, orderCount }, … ]
      monthlyTrend: monthlyTrendResult,  // [ { month: "2025-01", spend, count }, … ]
    });
  } catch (err) {
    console.error('[GET /api/analytics/spending-summary] Error:', err);
    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'Failed to fetch spending analytics.',
    });
  }
});

export default router;
