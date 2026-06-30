/**
 * server/utils/spendingAnalytics.js
 *
 * Shared spending aggregation used by Phase 8C analytics and Phase 11A reports.
 * Mirrors the pipelines in analyticsRoutes.js without modifying that route file.
 */

import PurchaseOrder from '../models/PurchaseOrder.js';

/**
 * Fetches the same aggregated spending data as GET /api/analytics/spending-summary.
 *
 * @returns {Promise<{
 *   totalSpend: number,
 *   byCategory: Array<{ category: string, spend: number, count: number }>,
 *   byProject: Array<{ projectId: ObjectId, projectName: string, spend: number, orderCount: number }>,
 * }>}
 */
export async function fetchSpendingSummary() {
  const [
    totalResult,
    byCategoryResult,
    byProjectResult,
  ] = await Promise.all([
    PurchaseOrder.aggregate([
      { $group: { _id: null, total: { $sum: '$totalCost' } } },
    ]),

    PurchaseOrder.aggregate([
      {
        $lookup: {
          from:         'materials',
          localField:   'material',
          foreignField: '_id',
          as:           'materialDoc',
        },
      },
      { $unwind: { path: '$materialDoc', preserveNullAndEmptyArrays: false } },
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

    PurchaseOrder.aggregate([
      {
        $lookup: {
          from:         'projects',
          localField:   'project',
          foreignField: '_id',
          as:           'projectDoc',
        },
      },
      { $unwind: { path: '$projectDoc', preserveNullAndEmptyArrays: false } },
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
  ]);

  return {
    totalSpend: totalResult[0]?.total ?? 0,
    byCategory: byCategoryResult,
    byProject:  byProjectResult,
  };
}
