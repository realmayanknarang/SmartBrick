/**
 * server/routes/marketplace/projectRoutes.js
 *
 * Marketplace Project REST API — Phase M2A
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Routes
 * ──────
 *   POST   /api/marketplace/projects           — create a project (marketplace_owner)
 *   GET    /api/marketplace/projects           — list projects (role-gated)
 *   GET    /api/marketplace/projects/:id       — single project detail
 *   PATCH  /api/marketplace/projects/:id       — update a project (owner only)
 *   DELETE /api/marketplace/projects/:id       — soft-delete a project (owner only)
 *
 * Access rules
 * ────────────
 *   marketplace_owner — can create, read-own, update-own, soft-delete-own
 *   builder           — can read all "open" projects (with filters)
 *   all other roles   — 403 on every project list/detail endpoint
 *
 * Validation
 * ──────────
 *   Manual inline validation (no express-validator dependency) — consistent
 *   with the existing Phase 1-13 routes (vendorRoutes.js, approvalRoutes.js).
 *
 * User identity
 * ─────────────
 *   requireAuth sets req.clerkUserId.
 *   resolveMarketplaceUser (from checkOwnership.js) fetches the full User
 *   document and attaches it to req.user so handlers have _id and role.
 */

import { Router }         from 'express';
import mongoose           from 'mongoose';
import { requireAuth, requireRole }
                                  from '../../middleware/auth.js';
import { resolveMarketplaceUser }
                          from '../../middleware/marketplace/checkOwnership.js';
import MarketplaceProject from '../../models/marketplace/MarketplaceProject.js';

const router = Router();

// ─── constants ───────────────────────────────────────────────────────────────

const VALID_CONSTRUCTION_TYPES = [
  'house', 'villa', 'apartment', 'commercial', 'industrial', 'other',
];

const UPDATABLE_FIELDS = [
  'title', 'description', 'location', 'budgetMin', 'budgetMax',
  'plotSize', 'timeline',
];

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Returns true if v is a finite, non-negative number (or numeric string). */
function isNonNegativeNumber(v) {
  return v !== undefined && v !== null && v !== '' && isFinite(Number(v)) && Number(v) >= 0;
}

/** Cast-error guard — used in every catch block. */
function isCastError(err) {
  return err.name === 'CastError' || err.name === 'BSONError';
}

// ─── POST /api/marketplace/projects ──────────────────────────────────────────

/**
 * Create a new MarketplaceProject.
 * Only marketplace_owner role may call this.
 * The authenticated user's MongoDB _id is stamped as owner.
 */
router.post(
  '/projects',
  requireAuth,
  requireRole('marketplace_owner'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const {
        title,
        description,
        location,
        budgetMin,
        budgetMax,
        plotSize,
        constructionType,
        timeline,
      } = req.body;

      // ── Validation ────────────────────────────────────────────────────────
      const errors = [];

      if (!title || String(title).trim().length < 3)
        errors.push('title is required and must be at least 3 characters.');

      if (!description || !String(description).trim())
        errors.push('description is required.');

      if (!location || !String(location).trim())
        errors.push('location is required.');

      if (!isNonNegativeNumber(budgetMin))
        errors.push('budgetMin is required and must be a non-negative number.');

      if (!isNonNegativeNumber(budgetMax))
        errors.push('budgetMax is required and must be a non-negative number.');

      if (
        isNonNegativeNumber(budgetMin) &&
        isNonNegativeNumber(budgetMax) &&
        Number(budgetMax) <= Number(budgetMin)
      )
        errors.push('budgetMax must be greater than budgetMin.');

      if (!constructionType || !VALID_CONSTRUCTION_TYPES.includes(constructionType))
        errors.push(
          `constructionType is required and must be one of: ${VALID_CONSTRUCTION_TYPES.join(', ')}.`
        );

      if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation Error', messages: errors });
      }

      // ── Create document ───────────────────────────────────────────────────
      const project = await MarketplaceProject.create({
        owner:            req.user._id,
        title:            String(title).trim(),
        description:      String(description).trim(),
        location:         String(location).trim(),
        budgetMin:        Number(budgetMin),
        budgetMax:        Number(budgetMax),
        constructionType,
        plotSize:         plotSize ? String(plotSize).trim() : undefined,
        timeline:         timeline  ? String(timeline).trim()  : undefined,
      });

      return res.status(201).json({ project });
    } catch (err) {
      if (err.name === 'ValidationError') {
        // Mongoose schema-level validation errors (e.g. budgetMax cross-field validator)
        return res.status(400).json({
          error:    'Validation Error',
          messages: Object.values(err.errors).map((e) => e.message),
        });
      }
      console.error('[POST /api/marketplace/projects] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to create project.',
      });
    }
  }
);

// ─── GET /api/marketplace/projects ───────────────────────────────────────────

/**
 * List projects.  Behaviour is role-gated:
 *   marketplace_owner → own projects only (all statuses)
 *   builder           → all "open" projects, filterable + paginated
 *   other roles       → 403
 */
router.get(
  '/projects',
  requireAuth,
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { role } = req.user;

      // ── Role guard ────────────────────────────────────────────────────────
      if (role !== 'marketplace_owner' && role !== 'builder') {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'Only marketplace_owner and builder roles can access the project list.',
        });
      }

      // ── marketplace_owner view — own projects only ────────────────────────
      if (role === 'marketplace_owner') {
        const projects = await MarketplaceProject.find({
          owner:    req.user._id,
          isActive: true,
        })
          .sort({ createdAt: -1 })
          .lean();

        return res.json({ projects, total: projects.length });
      }

      // ── builder view — open projects with filters + pagination ────────────
      const {
        constructionType,
        location,
        budgetMin: qBudgetMin,
        budgetMax: qBudgetMax,
        page  = '1',
        limit = '12',
      } = req.query;

      const pageNum  = Math.max(1, parseInt(page,  10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

      const filter = { status: 'open', isActive: true };

      if (constructionType && VALID_CONSTRUCTION_TYPES.includes(constructionType))
        filter.constructionType = constructionType;

      if (location)
        filter.location = { $regex: String(location).trim(), $options: 'i' };

      // budgetMin query param: only show projects whose budgetMax >= this value
      if (qBudgetMin !== undefined && isFinite(Number(qBudgetMin)))
        filter.budgetMax = { ...filter.budgetMax, $gte: Number(qBudgetMin) };

      // budgetMax query param: only show projects whose budgetMin <= this value
      if (qBudgetMax !== undefined && isFinite(Number(qBudgetMax)))
        filter.budgetMin = { ...filter.budgetMin, $lte: Number(qBudgetMax) };

      const [total, projects] = await Promise.all([
        MarketplaceProject.countDocuments(filter),
        MarketplaceProject.find(filter)
          .populate('owner', 'name email')
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return res.json({ projects, total, page: pageNum, totalPages });
    } catch (err) {
      console.error('[GET /api/marketplace/projects] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to fetch projects.',
      });
    }
  }
);

// ─── GET /api/marketplace/projects/:id ───────────────────────────────────────

/**
 * Single project detail.
 *   builder           → can view any open project
 *   marketplace_owner → can only view own projects
 *   other roles       → 403
 */
router.get(
  '/projects/:id',
  requireAuth,
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { role } = req.user;

      if (role !== 'marketplace_owner' && role !== 'builder') {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'Only marketplace_owner and builder roles can view project details.',
        });
      }

      const project = await MarketplaceProject.findOne({
        _id:      req.params.id,
        isActive: true,
      })
        .populate('owner', 'name email')
        .populate('approvedProposal')
        .lean();

      if (!project) {
        return res.status(404).json({
          error:   'Not Found',
          message: 'Project not found.',
        });
      }

      // marketplace_owner can only view their own projects.
      if (role === 'marketplace_owner') {
        if (project.owner._id.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            error:   'Forbidden',
            message: 'You do not own this project.',
          });
        }
      }

      // Builders can only see open projects.
      if (role === 'builder' && project.status !== 'open') {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'This project is no longer accepting builder views.',
        });
      }

      return res.json({ project });
    } catch (err) {
      if (isCastError(err)) {
        return res.status(400).json({
          error:   'Bad Request',
          message: 'Invalid project ID.',
        });
      }
      console.error('[GET /api/marketplace/projects/:id] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to fetch project.',
      });
    }
  }
);

// ─── PATCH /api/marketplace/projects/:id ─────────────────────────────────────

/**
 * Update an owned project.
 * Blocked if project.status is "locked" or "completed".
 * Allowed fields: title, description, location, budgetMin, budgetMax,
 *                 plotSize, timeline.
 * NOT allowed: status, owner, approvedProposal, constructionType.
 */
router.patch(
  '/projects/:id',
  requireAuth,
  requireRole('marketplace_owner'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const project = await MarketplaceProject.findOne({
        _id:      req.params.id,
        isActive: true,
      });

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

      // Status check — locked/completed projects are immutable.
      if (project.status === 'locked' || project.status === 'completed') {
        return res.status(400).json({
          error:   'Bad Request',
          message: `Cannot update a project with status "${project.status}". Only open projects can be edited.`,
        });
      }

      // ── Build the update — only allowed fields ─────────────────────────────
      const updates = {};
      const errors  = [];

      for (const field of UPDATABLE_FIELDS) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      }

      // Re-validate budget relationship if either was supplied.
      const newMin = updates.budgetMin !== undefined ? Number(updates.budgetMin) : project.budgetMin;
      const newMax = updates.budgetMax !== undefined ? Number(updates.budgetMax) : project.budgetMax;

      if (updates.budgetMin !== undefined && !isNonNegativeNumber(updates.budgetMin))
        errors.push('budgetMin must be a non-negative number.');
      if (updates.budgetMax !== undefined && !isNonNegativeNumber(updates.budgetMax))
        errors.push('budgetMax must be a non-negative number.');
      if (isNonNegativeNumber(newMin) && isNonNegativeNumber(newMax) && newMax <= newMin)
        errors.push('budgetMax must be greater than budgetMin.');

      if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation Error', messages: errors });
      }

      if (updates.budgetMin !== undefined) updates.budgetMin = newMin;
      if (updates.budgetMax !== undefined) updates.budgetMax = newMax;

      Object.assign(project, updates);
      await project.save();

      return res.json({ project });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error:    'Validation Error',
          messages: Object.values(err.errors).map((e) => e.message),
        });
      }
      if (isCastError(err)) {
        return res.status(400).json({
          error:   'Bad Request',
          message: 'Invalid project ID.',
        });
      }
      console.error('[PATCH /api/marketplace/projects/:id] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to update project.',
      });
    }
  }
);

// ─── DELETE /api/marketplace/projects/:id ────────────────────────────────────

/**
 * Soft-delete a project.
 * Blocked if the project already has an approvedProposal (i.e. in progress).
 * Sets isActive = false rather than using deleteOne().
 */
router.delete(
  '/projects/:id',
  requireAuth,
  requireRole('marketplace_owner'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const project = await MarketplaceProject.findOne({
        _id:      req.params.id,
        isActive: true,
      });

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

      // Block deletion if a proposal has already been approved.
      if (project.approvedProposal) {
        return res.status(400).json({
          error:   'Bad Request',
          message:
            'Cannot delete a project that has an approved proposal. ' +
            'The project is in progress.',
        });
      }

      project.isActive = false;
      await project.save();

      return res.json({ message: 'Project removed.' });
    } catch (err) {
      if (isCastError(err)) {
        return res.status(400).json({
          error:   'Bad Request',
          message: 'Invalid project ID.',
        });
      }
      console.error('[DELETE /api/marketplace/projects/:id] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to delete project.',
      });
    }
  }
);

export default router;
