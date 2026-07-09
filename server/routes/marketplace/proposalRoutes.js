/**
 * server/routes/marketplace/proposalRoutes.js
 *
 * Marketplace Proposal REST API — Phase M2A
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Routes
 * ──────
 *   POST   /api/marketplace/proposals                       — submit a proposal (builder)
 *   GET    /api/marketplace/proposals/my                    — builder's own proposals
 *   GET    /api/marketplace/proposals/project/:projectId    — proposals for a project (owner)
 *   PATCH  /api/marketplace/proposals/:id/approve           — approve a proposal (owner)
 *   PATCH  /api/marketplace/proposals/:id/reject            — reject a proposal (owner)
 *
 * Approve flow (steps run inside a MongoDB session/transaction on Atlas):
 *   1. Mark proposal → "approved"
 *   2. Bulk-reject all other proposals for the same project
 *   3. Lock the project & stamp approvedProposal
 *   4. findOneAndUpdate-upsert a Conversation record
 *   5. Create notifications for the approved builder, rejected builders, and
 *      (no-op) the owner (they triggered the action, no notification needed).
 *
 * Transaction notes
 * ─────────────────
 *   Atlas M0 free-tier uses a replica set and supports multi-document
 *   transactions.  The code attempts a session/transaction and falls back
 *   gracefully (logs a warning) if the connection does not support it.
 *
 * Phase M2A — marketplace REST API.
 */

import { Router }                 from 'express';
import mongoose                   from 'mongoose';
import { requireAuth, requireRole }
                                  from '../../middleware/auth.js';
import { resolveMarketplaceUser } from '../../middleware/marketplace/checkOwnership.js';
import MarketplaceProject         from '../../models/marketplace/MarketplaceProject.js';
import Proposal                   from '../../models/marketplace/Proposal.js';
import Conversation               from '../../models/marketplace/Conversation.js';
import MarketplaceNotification    from '../../models/marketplace/MarketplaceNotification.js';

const router = Router();

// ─── helpers ─────────────────────────────────────────────────────────────────

function isCastError(err) {
  return err.name === 'CastError' || err.name === 'BSONError';
}

function isValidObjectId(v) {
  return mongoose.Types.ObjectId.isValid(v);
}

/**
 * Persist a MarketplaceNotification document.
 * Swallows errors so that a notification failure never breaks the main flow.
 */
async function createNotification(data, session = null) {
  try {
    const opts = session ? { session } : {};
    await MarketplaceNotification.create([data], opts);
  } catch (err) {
    console.error('[createNotification] Failed to create notification:', err.message);
  }
}

// ─── POST /api/marketplace/proposals ─────────────────────────────────────────

/**
 * A builder submits a proposal for an open project.
 * Sends a "proposal_received" notification to the project owner.
 */
router.post(
  '/proposals',
  requireAuth,
  requireRole('builder'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const {
        projectId,
        estimatedBudget,
        estimatedDuration,
        notes,
        materialRecommendations,
      } = req.body;

      // ── Validation ────────────────────────────────────────────────────────
      const errors = [];

      if (!projectId)
        errors.push('projectId is required.');
      else if (!isValidObjectId(projectId))
        errors.push('projectId must be a valid ObjectId.');

      if (estimatedBudget === undefined || estimatedBudget === null || estimatedBudget === '' ||
          !isFinite(Number(estimatedBudget)) || Number(estimatedBudget) < 0)
        errors.push('estimatedBudget is required and must be a non-negative number.');

      if (!estimatedDuration || !String(estimatedDuration).trim())
        errors.push('estimatedDuration is required.');

      if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation Error', messages: errors });
      }

      // ── Project checks ────────────────────────────────────────────────────
      const project = await MarketplaceProject.findOne({
        _id:      projectId,
        isActive: true,
      });

      if (!project) {
        return res.status(404).json({
          error:   'Not Found',
          message: 'Project not found.',
        });
      }

      if (project.status !== 'open') {
        return res.status(400).json({
          error:   'Bad Request',
          message: 'This project is no longer accepting proposals.',
        });
      }

      // ── Duplicate proposal check (application-level) ──────────────────────
      const existing = await Proposal.findOne({
        project: project._id,
        builder: req.user._id,
      });

      if (existing) {
        return res.status(400).json({
          error:   'Bad Request',
          message: 'You have already submitted a proposal for this project.',
        });
      }

      // ── Create Proposal ───────────────────────────────────────────────────
      const proposal = await Proposal.create({
        project:                project._id,
        builder:                req.user._id,
        estimatedBudget:        Number(estimatedBudget),
        estimatedDuration:      String(estimatedDuration).trim(),
        notes:                  notes                  ? String(notes).trim()                  : undefined,
        materialRecommendations: materialRecommendations
          ? String(materialRecommendations).trim()
          : undefined,
      });

      // ── Notify owner (non-blocking) ───────────────────────────────────────
      await createNotification({
        recipient:      project.owner,
        type:           'proposal_received',
        message:        `A builder submitted a proposal for "${project.title}".`,
        relatedProject: project._id,
      });

      return res.status(201).json({ proposal });
    } catch (err) {
      // Compound unique index violation — builder already has a proposal.
      if (err.code === 11000) {
        return res.status(400).json({
          error:   'Bad Request',
          message: 'You have already submitted a proposal for this project.',
        });
      }
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error:    'Validation Error',
          messages: Object.values(err.errors).map((e) => e.message),
        });
      }
      console.error('[POST /api/marketplace/proposals] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to submit proposal.',
      });
    }
  }
);

// ─── GET /api/marketplace/proposals/my ───────────────────────────────────────

/**
 * Returns all proposals submitted by the authenticated builder.
 */
router.get(
  '/proposals/my',
  requireAuth,
  requireRole('builder'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const proposals = await Proposal.find({ builder: req.user._id })
        .populate('project', 'title location constructionType status')
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ proposals });
    } catch (err) {
      console.error('[GET /api/marketplace/proposals/my] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to fetch your proposals.',
      });
    }
  }
);

// ─── GET /api/marketplace/proposals/project/:projectId ───────────────────────

/**
 * Returns all proposals for a given project.
 * Only the project's owner may call this.
 */
router.get(
  '/proposals/project/:projectId',
  requireAuth,
  requireRole('owner'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { projectId } = req.params;

      if (!isValidObjectId(projectId)) {
        return res.status(400).json({
          error:   'Bad Request',
          message: 'Invalid project ID.',
        });
      }

      const project = await MarketplaceProject.findOne({
        _id:      projectId,
        isActive: true,
      }).select('owner title');

      if (!project) {
        return res.status(404).json({
          error:   'Not Found',
          message: 'Project not found.',
        });
      }

      // Ownership check.
      if (project.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'You do not own this project.',
        });
      }

      const proposals = await Proposal.find({ project: project._id })
        .populate('builder', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ proposals });
    } catch (err) {
      if (isCastError(err)) {
        return res.status(400).json({
          error:   'Bad Request',
          message: 'Invalid project ID.',
        });
      }
      console.error('[GET /api/marketplace/proposals/project/:projectId] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to fetch proposals.',
      });
    }
  }
);

// ─── PATCH /api/marketplace/proposals/:id/approve ────────────────────────────

/**
 * Approve a proposal.
 *
 * Executed inside a MongoDB session/transaction (Atlas supports this).
 * Falls back to sequential non-transactional steps if sessions are
 * unavailable, logging a warning.
 *
 * Steps:
 *   1. Mark the proposal "approved"
 *   2. Bulk-reject all other proposals for the same project
 *   3. Lock the project & stamp approvedProposal
 *   4. Upsert a Conversation (project/owner/builder)
 *   5. Notify the approved builder
 *   6. Notify all rejected builders
 */
router.patch(
  '/proposals/:id/approve',
  requireAuth,
  requireRole('owner'),
  resolveMarketplaceUser,
  async (req, res) => {
    let session = null;
    try {
      // ── Fetch & validate ──────────────────────────────────────────────────
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid proposal ID.' });
      }

      const proposal = await Proposal.findById(req.params.id).populate('project');

      if (!proposal) {
        return res.status(404).json({
          error:   'Not Found',
          message: 'Proposal not found.',
        });
      }

      const project = proposal.project;

      if (!project || !project.isActive) {
        return res.status(404).json({
          error:   'Not Found',
          message: 'Associated project not found.',
        });
      }

      // Ownership check — only the project owner can approve.
      if (project.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'You do not own this project.',
        });
      }

      if (proposal.status !== 'pending') {
        return res.status(400).json({
          error:   'Bad Request',
          message: `Proposal is already "${proposal.status}" and cannot be approved again.`,
        });
      }

      if (project.status !== 'open') {
        return res.status(400).json({
          error:   'Bad Request',
          message: 'This project is no longer accepting approvals.',
        });
      }

      // ── Attempt transactional execution ───────────────────────────────────
      let usedTransaction = false;
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        usedTransaction = true;
      } catch (sessionErr) {
        // Replica set not available (e.g. local standalone mongod) — proceed
        // without a transaction and log the known limitation.
        console.warn(
          '[approve proposal] Could not start a MongoDB session — proceeding ' +
          'without a transaction. Partial failures are possible.',
          sessionErr.message
        );
      }

      const sessionOpts = usedTransaction ? { session } : {};

      // Step 1 — approve this proposal.
      proposal.status = 'approved';
      await proposal.save(sessionOpts);

      // Step 2 — bulk-reject all other proposals for this project.
      const rejectedResult = await Proposal.updateMany(
        { project: project._id, _id: { $ne: proposal._id } },
        { status: 'rejected' },
        sessionOpts
      );

      // Step 3 — lock the project and stamp approvedProposal.
      project.status           = 'locked';
      project.approvedProposal = proposal._id;
      await project.save(sessionOpts);

      // Step 4 — upsert a Conversation (idempotent if called twice).
      const conversation = await Conversation.findOneAndUpdate(
        {
          project: project._id,
          owner:   project.owner,
          builder: proposal.builder,
        },
        {
          project: project._id,
          owner:   project.owner,
          builder: proposal.builder,
        },
        { upsert: true, new: true, ...sessionOpts }
      );

      // Commit transaction before firing notifications.
      if (usedTransaction) {
        await session.commitTransaction();
        session.endSession();
        session = null;
      }

      // ── Notifications (outside transaction — non-critical) ────────────────

      // Step 5 — notify approved builder.
      await createNotification({
        recipient:      proposal.builder,
        type:           'proposal_approved',
        message:        `Your proposal for "${project.title}" was approved. You can now message the owner.`,
        relatedProject: project._id,
      });

      // Step 6 — notify rejected builders.
      if (rejectedResult.modifiedCount > 0) {
        const rejectedProposals = await Proposal.find({
          project: project._id,
          status:  'rejected',
          _id:     { $ne: proposal._id },
        }).select('builder').lean();

        await Promise.allSettled(
          rejectedProposals.map((p) =>
            createNotification({
              recipient:      p.builder,
              type:           'proposal_rejected',
              message:        `Your proposal for "${project.title}" was not selected.`,
              relatedProject: project._id,
            })
          )
        );
      }

      return res.json({
        message:      'Proposal approved.',
        project,
        conversation: conversation ?? null,
      });
    } catch (err) {
      // Roll back if transaction was in-flight.
      if (session) {
        try { await session.abortTransaction(); session.endSession(); } catch (_) {}
      }
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid proposal ID.' });
      }
      console.error('[PATCH /api/marketplace/proposals/:id/approve] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to approve proposal.',
      });
    }
  }
);

// ─── PATCH /api/marketplace/proposals/:id/reject ─────────────────────────────

/**
 * Reject a single pending proposal.
 * Sends a "proposal_rejected" notification to the builder.
 */
router.patch(
  '/proposals/:id/reject',
  requireAuth,
  requireRole('owner'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid proposal ID.' });
      }

      const proposal = await Proposal.findById(req.params.id).populate('project');

      if (!proposal) {
        return res.status(404).json({
          error:   'Not Found',
          message: 'Proposal not found.',
        });
      }

      const project = proposal.project;

      if (!project || !project.isActive) {
        return res.status(404).json({
          error:   'Not Found',
          message: 'Associated project not found.',
        });
      }

      // Ownership check.
      if (project.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'You do not own this project.',
        });
      }

      if (proposal.status !== 'pending') {
        return res.status(400).json({
          error:   'Bad Request',
          message: `Proposal is already "${proposal.status}" and cannot be rejected again.`,
        });
      }

      proposal.status = 'rejected';
      await proposal.save();

      // Notify the builder.
      await createNotification({
        recipient:      proposal.builder,
        type:           'proposal_rejected',
        message:        `Your proposal for "${project.title}" was not selected.`,
        relatedProject: project._id,
      });

      return res.json({ message: 'Proposal rejected.', proposal });
    } catch (err) {
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid proposal ID.' });
      }
      console.error('[PATCH /api/marketplace/proposals/:id/reject] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to reject proposal.',
      });
    }
  }
);

export default router;
