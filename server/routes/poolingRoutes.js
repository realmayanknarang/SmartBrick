/**
 * server/routes/poolingRoutes.js
 *
 * Order Pooling Estimator API — Phase 11E
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes
 * ──────
 *   GET  /api/pooling/orders       List POs for multi-select UI (optional filter)
 *   POST /api/pooling/estimate     Calculate hypothetical bulk savings
 */

import { Router }      from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import PurchaseOrder   from '../models/PurchaseOrder.js';
import { estimatePooling, POOLING_THRESHOLDS } from '../utils/poolingEstimator.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/pooling/orders
// ---------------------------------------------------------------------------

router.get('/orders', requireAuth, async (req, res) => {
  try {
    const { category } = req.query;

    const pipeline = [
      {
        $lookup: {
          from:         'materials',
          localField:   'material',
          foreignField: '_id',
          as:           'materialDoc',
        },
      },
      { $unwind: { path: '$materialDoc', preserveNullAndEmptyArrays: false } },
    ];

    if (category) {
      pipeline.push({ $match: { 'materialDoc.category': category } });
    }

    pipeline.push(
      {
        $lookup: {
          from:         'vendors',
          localField:   'vendor',
          foreignField: '_id',
          as:           'vendorDoc',
        },
      },
      { $unwind: { path: '$vendorDoc', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from:         'projects',
          localField:   'project',
          foreignField: '_id',
          as:           'projectDoc',
        },
      },
      { $unwind: { path: '$projectDoc', preserveNullAndEmptyArrays: false } },
      { $sort: { orderDate: -1 } },
      {
        $project: {
          _id:          1,
          quantity:     1,
          pricePerUnit: 1,
          totalCost:    1,
          orderDate:    1,
          approvalStage: 1,
          materialName: '$materialDoc.name',
          category:     '$materialDoc.category',
          unit:         '$materialDoc.unit',
          vendorName:   '$vendorDoc.name',
          projectName:  '$projectDoc.name',
        },
      },
    );

    const orders = await PurchaseOrder.aggregate(pipeline);

    return res.json({
      orders,
      discountRules: POOLING_THRESHOLDS,
    });
  } catch (err) {
    console.error('[GET /api/pooling/orders] Error:', err);
    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'Failed to fetch orders for pooling.',
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/pooling/estimate
// ---------------------------------------------------------------------------

router.post('/estimate', requireAuth, async (req, res) => {
  try {
    const { orderIds } = req.body ?? {};

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        error:   'Bad Request',
        message: 'orderIds must be a non-empty array of purchase order IDs.',
      });
    }

    if (orderIds.length < 2) {
      return res.status(400).json({
        error:   'Bad Request',
        message: 'Select at least 2 orders to estimate pooling savings.',
      });
    }

    const orders = await PurchaseOrder.find({ _id: { $in: orderIds } })
      .populate('material', 'name category unit')
      .lean();

    if (orders.length !== orderIds.length) {
      return res.status(400).json({
        error:   'Bad Request',
        message: 'One or more order IDs were not found.',
      });
    }

    const result = estimatePooling(orders);

    return res.json({
      ...result,
      orders: orders.map(o => ({
        id:           o._id,
        quantity:     o.quantity,
        totalCost:    o.totalCost,
        materialName: o.material?.name,
        category:     o.material?.category,
      })),
    });
  } catch (err) {
    if (err.message?.includes('Cross-category') || err.message?.includes('At least one')) {
      return res.status(400).json({
        error:   'Bad Request',
        message: err.message,
      });
    }
    console.error('[POST /api/pooling/estimate] Error:', err);
    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'Failed to estimate pooling savings.',
    });
  }
});

export default router;
