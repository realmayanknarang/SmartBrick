/**
 * server/routes/marketplace/progressRoutes.js
 *
 * Marketplace Progress + Milestone REST API — Phase M2B
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Progress routes
 * ───────────────
 *   POST  /api/marketplace/progress/:projectId   — post a progress update (approved builder)
 *   GET   /api/marketplace/progress/:projectId   — get all updates (owner or approved builder)
 *
 * Milestone routes
 * ────────────────
 *   POST  /api/marketplace/milestones/:projectId          — create a milestone (approved builder)
 *   PATCH /api/marketplace/milestones/:milestoneId/complete — mark complete (approved builder)
 *   GET   /api/marketplace/milestones/:projectId          — list milestones (owner or approved builder)
 *
 * Access model
 * ────────────
 *   Write routes (POST/PATCH) — builder only, must be the APPROVED builder for that project
 *   Read routes  (GET)        — project owner OR the approved builder
 *
 * Milestone sort order (GET /milestones/:projectId)
 *   Incomplete milestones first, sorted by dueDate ascending (nulls last).
 *   Completed milestones last, sorted by completedAt ascending.
 *   This is handled in-memory after the DB fetch to avoid complex aggregation.
 *
 * Phase M2B — marketplace REST API.
 */

import { Router }                  from 'express';
import mongoose                    from 'mongoose';
import { requireAuth, requireRole }
                                   from '../../middleware/clerkAuth.js';
import {
  resolveMarketplaceUser,
  isApprovedBuilder,
}                                  from '../../middleware/marketplace/checkOwnership.js';
import MarketplaceProject          from '../../models/marketplace/MarketplaceProject.js';
import ProgressUpdate              from '../../models/marketplace/ProgressUpdate.js';
import Milestone                   from '../../models/marketplace/Milestone.js';
import MarketplaceNotification     from '../../models/marketplace/MarketplaceNotification.js';
import { emitNotificationUpdate }  from '../../config/socket.js';

const router = Router();

// ─── helpers ─────────────────────────────────────────────────────────────────

function isCastError(err) {
  return err.name === 'CastError' || err.name === 'BSONError';
}

function isValidObjectId(v) {
  return mongoose.Types.ObjectId.isValid(v);
}

/**
 * Persist a MarketplaceNotification silently.
 * Notification failures never block the main response.
 */
async function createNotification(data) {
  try {
    await MarketplaceNotification.create(data);
  } catch (err) {
    console.error('[createNotification] Failed:', err.message);
  }
}

/**
 * Shared access check for GET routes: passes if the caller is the project
 * owner OR the approved builder.  Returns 403 otherwise.
 *
 * @param {object} project  Lean project document (must include owner field).
 * @param {object} user     req.user — { _id, role }
 * @returns {Promise<boolean>}  true = access granted
 */
async function canReadProject(project, user) {
  // Project owner always has read access.
  if (project.owner.toString() === user._id.toString()) return true;

  // Approved builder also has read access.
  return isApprovedBuilder(project._id, user._id);
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS UPDATE ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// ─── POST /api/marketplace/progress/:projectId ────────────────────────────────

/**
 * Approved builder posts a progress snapshot for a project.
 */
router.post(
  '/progress/:projectId',
  requireAuth,
  requireRole('builder'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { projectId } = req.params;

      if (!isValidObjectId(projectId)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid project ID.' });
      }

      // ── Approved builder guard ────────────────────────────────────────────
      const approved = await isApprovedBuilder(projectId, req.user._id);
      if (!approved) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'Only the approved builder for this project can post progress updates.',
        });
      }

      // ── Validation ────────────────────────────────────────────────────────
      const { stage, progressPercentage, notes, sitePhotos } = req.body;
      const errors = [];

      if (!stage || !String(stage).trim())
        errors.push('stage is required.');

      const pct = Number(progressPercentage);
      if (progressPercentage === undefined || progressPercentage === null ||
          progressPercentage === '' || !isFinite(pct) || pct < 0 || pct > 100)
        errors.push('progressPercentage is required and must be a number between 0 and 100.');

      if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation Error', messages: errors });
      }

      // ── Fetch project for title (notification) ────────────────────────────
      const project = await MarketplaceProject.findById(projectId)
        .select('owner title')
        .lean();

      // ── Create ProgressUpdate ─────────────────────────────────────────────
      const update = await ProgressUpdate.create({
        project:            projectId,
        builder:            req.user._id,
        stage:              String(stage).trim(),
        progressPercentage: pct,
        notes:              notes      ? String(notes).trim()      : undefined,
        sitePhotos:         Array.isArray(sitePhotos) ? sitePhotos : [],
      });

      // ── Notify owner ──────────────────────────────────────────────────────
      await createNotification({
        recipient:      project.owner,
        type:           'progress_update',
        message:        `Builder updated progress to ${pct}% on "${project.title}".`,
        relatedProject: project._id,
      });
      emitNotificationUpdate(project.owner);

      return res.status(201).json({ update });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error:    'Validation Error',
          messages: Object.values(err.errors).map((e) => e.message),
        });
      }
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid project ID.' });
      }
      console.error('[POST /api/marketplace/progress/:projectId] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to create progress update.',
      });
    }
  }
);

// ─── GET /api/marketplace/progress/:projectId ─────────────────────────────────

/**
 * Returns all ProgressUpdate records for a project, newest first.
 * Accessible by the project owner OR the approved builder.
 */
router.get(
  '/progress/:projectId',
  requireAuth,
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { projectId } = req.params;

      if (!isValidObjectId(projectId)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid project ID.' });
      }

      const project = await MarketplaceProject.findOne({
        _id:      projectId,
        isActive: true,
      })
        .select('owner title')
        .lean();

      if (!project) {
        return res.status(404).json({ error: 'Not Found', message: 'Project not found.' });
      }

      // ── Access guard ──────────────────────────────────────────────────────
      const hasAccess = await canReadProject(project, req.user);
      if (!hasAccess) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'Only the project owner or the approved builder can view progress updates.',
        });
      }

      const updates = await ProgressUpdate.find({ project: projectId })
        .populate('builder', 'name')
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ updates });
    } catch (err) {
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid project ID.' });
      }
      console.error('[GET /api/marketplace/progress/:projectId] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to fetch progress updates.',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// MILESTONE ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// ─── POST /api/marketplace/milestones/:projectId ──────────────────────────────

/**
 * Approved builder creates a milestone for a project.
 */
router.post(
  '/milestones/:projectId',
  requireAuth,
  requireRole('builder'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { projectId } = req.params;

      if (!isValidObjectId(projectId)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid project ID.' });
      }

      // ── Approved builder guard ────────────────────────────────────────────
      const approved = await isApprovedBuilder(projectId, req.user._id);
      if (!approved) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'Only the approved builder for this project can create milestones.',
        });
      }

      // ── Validation ────────────────────────────────────────────────────────
      const { title, description, dueDate } = req.body;

      if (!title || !String(title).trim()) {
        return res.status(400).json({
          error:   'Validation Error',
          messages: ['title is required.'],
        });
      }

      // Parse dueDate — accept any value Date() can handle; reject invalid strings.
      let parsedDueDate;
      if (dueDate !== undefined && dueDate !== null && dueDate !== '') {
        parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          return res.status(400).json({
            error:   'Validation Error',
            messages: ['dueDate must be a valid date string.'],
          });
        }
      }

      // ── Check project exists (needed for the milestone.project ref) ────────
      const projectExists = await MarketplaceProject.exists({
        _id:      projectId,
        isActive: true,
      });

      if (!projectExists) {
        return res.status(404).json({ error: 'Not Found', message: 'Project not found.' });
      }

      // ── Create Milestone ──────────────────────────────────────────────────
      const milestone = await Milestone.create({
        project:     projectId,
        title:       String(title).trim(),
        description: description ? String(description).trim() : undefined,
        dueDate:     parsedDueDate,
      });

      return res.status(201).json({ milestone });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error:    'Validation Error',
          messages: Object.values(err.errors).map((e) => e.message),
        });
      }
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid project ID.' });
      }
      console.error('[POST /api/marketplace/milestones/:projectId] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to create milestone.',
      });
    }
  }
);

// ─── PATCH /api/marketplace/milestones/:milestoneId/complete ─────────────────

/**
 * Approved builder marks a milestone as complete.
 * Sends a "milestone_completed" notification to the project owner.
 */
router.patch(
  '/milestones/:milestoneId/complete',
  requireAuth,
  requireRole('builder'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { milestoneId } = req.params;

      if (!isValidObjectId(milestoneId)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid milestone ID.' });
      }

      // ── Fetch milestone ───────────────────────────────────────────────────
      const milestone = await Milestone.findById(milestoneId);

      if (!milestone) {
        return res.status(404).json({ error: 'Not Found', message: 'Milestone not found.' });
      }

      // ── Approved builder guard (using milestone's project) ────────────────
      const approved = await isApprovedBuilder(milestone.project, req.user._id);
      if (!approved) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'Only the approved builder for this project can complete milestones.',
        });
      }

      // ── Already-complete guard ────────────────────────────────────────────
      if (milestone.isCompleted) {
        return res.status(400).json({
          error:   'Bad Request',
          message: 'This milestone is already completed.',
        });
      }

      // ── Mark complete ─────────────────────────────────────────────────────
      milestone.isCompleted  = true;
      milestone.completedAt  = new Date();
      await milestone.save();

      // ── Fetch project for owner + title (notification) ────────────────────
      const project = await MarketplaceProject.findById(milestone.project)
        .select('owner title')
        .lean();

      // ── Notify owner ──────────────────────────────────────────────────────
      if (project) {
        await createNotification({
          recipient:      project.owner,
          type:           'milestone_completed',
          message:        `Milestone "${milestone.title}" completed on "${project.title}".`,
          relatedProject: milestone.project,
        });
        emitNotificationUpdate(project.owner);
      }

      return res.json({ milestone });
    } catch (err) {
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid milestone ID.' });
      }
      console.error('[PATCH /api/marketplace/milestones/:milestoneId/complete] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to complete milestone.',
      });
    }
  }
);

// ─── GET /api/marketplace/milestones/:projectId ───────────────────────────────

/**
 * Returns all milestones for a project.
 * Accessible by the project owner OR the approved builder.
 *
 * Sort order (applied in-memory after the DB fetch):
 *   1. Incomplete milestones first — sorted by dueDate ascending
 *      (null dueDate treated as Infinity so they appear last within incomplete).
 *   2. Completed milestones last — sorted by completedAt ascending.
 */
router.get(
  '/milestones/:projectId',
  requireAuth,
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { projectId } = req.params;

      if (!isValidObjectId(projectId)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid project ID.' });
      }

      const project = await MarketplaceProject.findOne({
        _id:      projectId,
        isActive: true,
      })
        .select('owner')
        .lean();

      if (!project) {
        return res.status(404).json({ error: 'Not Found', message: 'Project not found.' });
      }

      // ── Access guard ──────────────────────────────────────────────────────
      const hasAccess = await canReadProject(project, req.user);
      if (!hasAccess) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'Only the project owner or the approved builder can view milestones.',
        });
      }

      // Fetch all milestones for this project — sort in-memory for flexibility.
      const raw = await Milestone.find({ project: projectId }).lean();

      // ── In-memory sort ────────────────────────────────────────────────────
      // Partition into incomplete and complete, then sort each group.
      const incomplete = raw.filter((m) => !m.isCompleted);
      const complete   = raw.filter((m) => m.isCompleted);

      // Incomplete: ascending by dueDate (null → Infinity)
      incomplete.sort((a, b) => {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return da - db;
      });

      // Complete: ascending by completedAt
      complete.sort((a, b) => {
        const da = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const db = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return da - db;
      });

      const milestones = [...incomplete, ...complete];

      return res.json({ milestones });
    } catch (err) {
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid project ID.' });
      }
      console.error('[GET /api/marketplace/milestones/:projectId] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to fetch milestones.',
      });
    }
  }
);

export default router;
