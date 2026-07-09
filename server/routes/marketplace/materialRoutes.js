/**
 * server/routes/marketplace/materialRoutes.js
 *
 * Marketplace Materials REST API — Phase M2C
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Routes
 * ──────
 *   POST   /api/marketplace/materials          — create a listing (vendor)
 *   GET    /api/marketplace/materials          — browse active listings (any auth role)
 *   GET    /api/marketplace/materials/my       — vendor's own listings (active + inactive)
 *   GET    /api/marketplace/materials/:id      — single listing detail (any auth role)
 *   PATCH  /api/marketplace/materials/:id      — update own listing (vendor, owner)
 *   DELETE /api/marketplace/materials/:id      — soft-delete (vendor, owner)
 *
 * Access model
 * ────────────
 *   POST / PATCH / DELETE — vendor only, must own the listing
 *   GET (public browse)   — any authenticated user
 *   GET /my               — vendor only (their own listings, all statuses)
 *
 * Validation
 * ──────────
 *   Manual inline validation — consistent with the Phase 1-13 / M2A-M2B routes.
 *   Mongoose schema-level validation provides a second safety net.
 *
 * Pagination
 * ──────────
 *   GET /materials uses cursor-free page/limit pagination (default limit 20,
 *   max 100).  /my omits pagination since a single vendor's catalogue is small.
 *
 * Phase M2C — marketplace REST API.
 */

import { Router }                  from 'express';
import mongoose                    from 'mongoose';
import { requireAuth, requireRole }
                                   from '../../middleware/auth.js';
import {
  resolveMarketplaceUser,
}                                  from '../../middleware/marketplace/checkOwnership.js';
import MarketplaceMaterial         from '../../models/marketplace/MarketplaceMaterial.js';

const router = Router();

// ─── constants ────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  'cement', 'steel', 'sand', 'bricks',
  'electrical', 'plumbing', 'paint', 'flooring', 'other',
];

const UPDATABLE_FIELDS = [
  'name', 'category', 'brand', 'pricePerUnit',
  'unit', 'stock', 'deliveryTime', 'isActive', 'images',
];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 100;

// ─── helpers ──────────────────────────────────────────────────────────────────

function isCastError(err) {
  return err.name === 'CastError' || err.name === 'BSONError';
}

function isValidObjectId(v) {
  return mongoose.Types.ObjectId.isValid(v);
}

/**
 * Validate the core material fields shared by POST and PATCH.
 * Returns an array of error strings (empty = valid).
 *
 * @param {object} body           Subset of req.body to validate.
 * @param {boolean} requireAll    If true every field is required (POST);
 *                                if false only supplied fields are checked (PATCH).
 */
function validateMaterialFields(body, requireAll = true) {
  const errors = [];
  const { name, category, pricePerUnit, unit, stock } = body;

  if (requireAll || name !== undefined) {
    if (!name || String(name).trim().length < 2)
      errors.push('name is required and must be at least 2 characters.');
  }

  if (requireAll || category !== undefined) {
    if (!category || !VALID_CATEGORIES.includes(category))
      errors.push(`category is required and must be one of: ${VALID_CATEGORIES.join(', ')}.`);
  }

  if (requireAll || pricePerUnit !== undefined) {
    const price = Number(pricePerUnit);
    if (
      pricePerUnit === undefined ||
      pricePerUnit === null ||
      pricePerUnit === '' ||
      !isFinite(price) ||
      price < 0
    )
      errors.push('pricePerUnit is required and must be a non-negative number.');
  }

  if (requireAll || unit !== undefined) {
    if (!unit || !String(unit).trim())
      errors.push('unit is required.');
  }

  if (stock !== undefined) {
    const s = Number(stock);
    if (!isFinite(s) || s < 0)
      errors.push('stock must be a non-negative number.');
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/marketplace/materials
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A vendor creates a new material listing.
 */
router.post(
  '/materials',
  requireAuth,
  requireRole('vendor'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const {
        name, category, brand,
        pricePerUnit, unit, stock, deliveryTime, images,
      } = req.body;

      // ── Validation ────────────────────────────────────────────────────────
      const errors = validateMaterialFields(req.body, true);
      if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation Error', messages: errors });
      }

      // ── Create listing ────────────────────────────────────────────────────
      const material = await MarketplaceMaterial.create({
        vendor:       req.user._id,
        name:         String(name).trim(),
        category,
        brand:        brand        ? String(brand).trim()        : undefined,
        pricePerUnit: Number(pricePerUnit),
        unit:         String(unit).trim(),
        stock:        stock !== undefined ? Number(stock) : 0,
        deliveryTime: deliveryTime ? String(deliveryTime).trim() : undefined,
        images:       Array.isArray(images) ? images : undefined,
      });

      return res.status(201).json({ material });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error:    'Validation Error',
          messages: Object.values(err.errors).map((e) => e.message),
        });
      }
      console.error('[POST /api/marketplace/materials] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to create material listing.',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/marketplace/materials/my
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns ALL material listings owned by the authenticated vendor,
 * including inactive (soft-deleted) ones.  No pagination.
 *
 * NOTE: This route is registered BEFORE /materials/:id so that Express matches
 * "my" as a literal path segment rather than an :id parameter.
 */
router.get(
  '/materials/my',
  requireAuth,
  requireRole('vendor'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const materials = await MarketplaceMaterial
        .find({ vendor: req.user._id })
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ materials });
    } catch (err) {
      console.error('[GET /api/marketplace/materials/my] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to fetch your material listings.',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/marketplace/materials
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Browse active material listings.
 * Restricted to the three marketplace roles (owner, builder,
 * vendor). Non-marketplace roles receive 403 (Phase M8A route audit,
 * Rule 3: role isolation).
 *
 * Query params
 * ────────────
 *   category  — exact enum match
 *   maxPrice  — pricePerUnit <= maxPrice
 *   minStock  — stock >= minStock (filter out-of-stock items)
 *   search    — case-insensitive regex on name and brand
 *   page      — 1-based page number (default 1)
 *   limit     — results per page (default 20, max 100)
 */
router.get(
  '/materials',
  requireAuth,
  requireRole('owner', 'builder', 'vendor'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const {
        category,
        maxPrice,
        minStock,
        search,
        page  = '1',
        limit = String(DEFAULT_LIMIT),
      } = req.query;

      const pageNum  = Math.max(1, parseInt(page,  10) || 1);
      const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));

      // ── Build filter ───────────────────────────────────────────────────────
      const filter = { isActive: true };

      if (category && VALID_CATEGORIES.includes(category)) {
        filter.category = category;
      }

      if (maxPrice !== undefined && isFinite(Number(maxPrice))) {
        filter.pricePerUnit = { $lte: Number(maxPrice) };
      }

      if (minStock !== undefined && isFinite(Number(minStock))) {
        filter.stock = { $gte: Number(minStock) };
      }

      if (search && String(search).trim()) {
        // Case-insensitive partial match on name OR brand.
        const regex = new RegExp(String(search).trim(), 'i');
        filter.$or = [{ name: regex }, { brand: regex }];
      }

      // ── Query ─────────────────────────────────────────────────────────────
      const [total, materials] = await Promise.all([
        MarketplaceMaterial.countDocuments(filter),
        MarketplaceMaterial.find(filter)
          .populate('vendor', 'name')          // expose vendor name only
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return res.json({ materials, total, page: pageNum, totalPages });
    } catch (err) {
      console.error('[GET /api/marketplace/materials] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to fetch material listings.',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/marketplace/materials/:id
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Single material detail.
 * Restricted to the three marketplace roles — internal platform roles receive
 * 403 (Phase M8A route audit, Rule 3: role isolation).
 */
router.get(
  '/materials/:id',
  requireAuth,
  requireRole('owner', 'builder', 'vendor'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid material ID.' });
      }

      const material = await MarketplaceMaterial.findById(id)
        .populate('vendor', 'name')
        .lean();

      if (!material) {
        return res.status(404).json({ error: 'Not Found', message: 'Material not found.' });
      }

      return res.json({ material });
    } catch (err) {
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid material ID.' });
      }
      console.error('[GET /api/marketplace/materials/:id] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to fetch material.',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/marketplace/materials/:id
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update an owned material listing.
 * All fields are optional on PATCH — only supplied fields are updated.
 * Re-validates any field that is present in the request body.
 */
router.patch(
  '/materials/:id',
  requireAuth,
  requireRole('vendor'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid material ID.' });
      }

      const material = await MarketplaceMaterial.findById(id);

      if (!material) {
        return res.status(404).json({ error: 'Not Found', message: 'Material not found.' });
      }

      // ── Ownership check ───────────────────────────────────────────────────
      if (material.vendor.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'You do not own this material listing.',
        });
      }

      // ── Validate only the supplied fields ─────────────────────────────────
      const errors = validateMaterialFields(req.body, false);
      if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation Error', messages: errors });
      }

      // ── Apply allowed updates ─────────────────────────────────────────────
      for (const field of UPDATABLE_FIELDS) {
        if (req.body[field] !== undefined) {
          if (field === 'pricePerUnit' || field === 'stock') {
            material[field] = Number(req.body[field]);
          } else if (typeof req.body[field] === 'string') {
            material[field] = String(req.body[field]).trim();
          } else {
            material[field] = req.body[field];
          }
        }
      }

      await material.save();

      return res.json({ material });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error:    'Validation Error',
          messages: Object.values(err.errors).map((e) => e.message),
        });
      }
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid material ID.' });
      }
      console.error('[PATCH /api/marketplace/materials/:id] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to update material listing.',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/marketplace/materials/:id
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Soft-delete a material listing.
 * Sets isActive = false — the record remains in the database for audit purposes
 * and disappears from the public GET /materials browse endpoint.
 */
router.delete(
  '/materials/:id',
  requireAuth,
  requireRole('vendor'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid material ID.' });
      }

      const material = await MarketplaceMaterial.findById(id);

      if (!material) {
        return res.status(404).json({ error: 'Not Found', message: 'Material not found.' });
      }

      // ── Ownership check ───────────────────────────────────────────────────
      if (material.vendor.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error:   'Forbidden',
          message: 'You do not own this material listing.',
        });
      }

      // ── Soft delete ───────────────────────────────────────────────────────
      material.isActive = false;
      await material.save();

      return res.json({ message: 'Material removed from listings.' });
    } catch (err) {
      if (isCastError(err)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid material ID.' });
      }
      console.error('[DELETE /api/marketplace/materials/:id] Error:', err);
      return res.status(500).json({
        error:   'Internal Server Error',
        message: 'Failed to remove material listing.',
      });
    }
  }
);

export default router;
