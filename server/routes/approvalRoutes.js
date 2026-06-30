/**
 * server/routes/approvalRoutes.js
 *
 * Purchase Order Approval Workflow — Phase 11D
 * ─────────────────────────────────────────────────────────────────────────────
 * Visualizes real PurchaseOrder.approvalStage values with role-gated transitions.
 *
 * Routes
 * ──────
 *   GET  /api/approvals/pending
 *   PATCH /api/approvals/:orderId/advance
 */

import { Router }      from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import User            from '../models/User.js';
import PurchaseOrder   from '../models/PurchaseOrder.js';
import {
  canActOnStage,
  resolveTransition,
  STAGE_LABELS,
  PIPELINE_STAGES,
} from '../utils/approvalWorkflow.js';

const router = Router();

const PENDING_FILTER = {
  approvalStage: { $nin: ['approved', 'rejected'] },
};

async function resolveUserRole(req) {
  const user = await User.findOne({ clerkUserId: req.clerkUserId }).select('role').lean();
  return user?.role ?? null;
}

// ---------------------------------------------------------------------------
// GET /api/approvals/pending
// ---------------------------------------------------------------------------

router.get('/pending', requireAuth, async (req, res) => {
  try {
    const userRole = await resolveUserRole(req);

    const orders = await PurchaseOrder.find(PENDING_FILTER)
      .populate('vendor', 'name category city')
      .populate('site', 'name city')
      .populate('project', 'name')
      .populate('material', 'name category unit')
      .sort({ orderDate: -1 })
      .lean();

    const enriched = orders.map(o => ({
      ...o,
      stageLabel: STAGE_LABELS[o.approvalStage] ?? o.approvalStage,
      canAct:     userRole ? canActOnStage(userRole, o.approvalStage) : false,
    }));

    return res.json({
      orders: enriched,
      stages: PIPELINE_STAGES.map(s => ({ id: s, label: STAGE_LABELS[s] })),
      userRole,
    });
  } catch (err) {
    console.error('[GET /api/approvals/pending] Error:', err);
    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'Failed to fetch pending approvals.',
    });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/approvals/:orderId/advance
// ---------------------------------------------------------------------------

router.patch('/:orderId/advance', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action }  = req.body ?? {};

    if (!action || !['advance', 'reject'].includes(action)) {
      return res.status(400).json({
        error:   'Bad Request',
        message: "Request body must include action: 'advance' or 'reject'.",
      });
    }

    const userRole = await resolveUserRole(req);
    if (!userRole) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'No SmartBrick account found for this user.',
      });
    }

    const order = await PurchaseOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        error:   'Not Found',
        message: 'Purchase order not found.',
      });
    }

    if (!canActOnStage(userRole, order.approvalStage)) {
      return res.status(403).json({
        error:   'Forbidden',
        message: `Your role ('${userRole}') cannot act on orders at the '${order.approvalStage}' stage.`,
      });
    }

    const transition = resolveTransition(order.approvalStage, action);
    if (!transition.ok) {
      return res.status(400).json({
        error:   'Bad Request',
        message: transition.message,
      });
    }

    order.approvalStage = transition.nextStage;
    await order.save();

    return res.json({
      orderId:       order._id,
      approvalStage: order.approvalStage,
      stageLabel:    STAGE_LABELS[order.approvalStage],
      message:       action === 'reject'
        ? 'Order rejected.'
        : `Order advanced to ${STAGE_LABELS[order.approvalStage]}.`,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        error:   'Bad Request',
        message: 'Invalid order ID.',
      });
    }
    console.error('[PATCH /api/approvals/:orderId/advance] Error:', err);
    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'Failed to update approval stage.',
    });
  }
});

export default router;
