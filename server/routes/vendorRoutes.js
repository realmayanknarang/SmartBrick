/**
 * server/routes/vendorRoutes.js
 *
 * Vendor REST API — Phase 8A
 * ─────────────────────────────────────────────────────────────────────────────
 * All routes are protected by requireAuth.  Role restriction is intentionally
 * omitted here: any authenticated SmartBrick user (owner, project_manager,
 * site_engineer, finance) may browse vendors.  Role-specific write routes
 * (create, update) will be added in a later sub-phase if required.
 *
 * Routes
 * ──────
 *   GET /api/vendors
 *     Returns a paginated, filtered, sorted list of active vendors.
 *
 *     Query params (all optional):
 *       category  — filter by vendor category (cement | steel | sand | …)
 *       city      — filter by city (case-insensitive prefix match)
 *       sortBy    — "score" (default) | "name" | "pricePerUnit"
 *       page      — 1-indexed page number (default: 1)
 *       limit     — results per page (default: 20, max: 100)
 *
 *     Response shape:
 *       {
 *         vendors: [ { ...vendorFields, compositeScore: number }, … ],
 *         pagination: { total, page, limit, totalPages }
 *       }
 *
 *   GET /api/vendors/:id
 *     Returns a single active vendor's full details, including the composite
 *     score AND the score breakdown (so the UI can explain "why" this score).
 *
 *     Response shape:
 *       { vendor: { ...vendorFields, compositeScore: number, scoreBreakdown: {…} } }
 *
 * isActive filter
 * ───────────────
 * BOTH routes explicitly filter { isActive: true }.  This is the soft-delete
 * convention established in Phase 2 (Vendor.softDelete()).  Omitting this
 * filter is listed in the Phase 2 notes as a common mistake — confirmed applied
 * on every query path below.
 */

import { Router }              from 'express';
import { requireAuth }         from '../middleware/clerkAuth.js';
import Vendor                  from '../models/Vendor.js';
import { calculateVendorRank } from '../utils/vendorScoring.js';

const router = Router();

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Attaches compositeScore to a plain vendor object.
 * Does NOT mutate the original document — returns a new object.
 */
function withScore(vendorObj) {
  const { compositeScore } = calculateVendorRank(vendorObj);
  return { ...vendorObj, compositeScore };
}

/**
 * Compares two scored vendor objects for descending score sort.
 * Used in-memory after scoring so we can sort by the calculated field.
 */
function byScoreDesc(a, b) {
  return b.compositeScore - a.compositeScore;
}

// ─── GET /api/vendors ────────────────────────────────────────────────────────

/**
 * List active vendors with optional filtering, pagination, and sorting.
 *
 * Pagination note:
 *   When sortBy=score we must score ALL matching vendors before slicing for the
 *   page, because the score is computed in Node — not in MongoDB.  For very
 *   large datasets this would need a pre-computed "compositeScore" field in the
 *   DB; for the SmartBrick seed data (~30 vendors) the in-memory sort is fast
 *   and correct.
 *
 *   When sortBy=name or sortBy=pricePerUnit we push the sort into MongoDB and
 *   apply pagination there, which is more efficient.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    // ── Parse & validate query params ────────────────────────────────────────
    const {
      category,
      city,
      sortBy = 'score',
      page  = '1',
      limit = '20',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    // ── Build MongoDB filter — isActive: true is mandatory ───────────────────
    const filter = { isActive: true };

    if (category) {
      // Exact match (enum-constrained field in schema)
      filter.category = category;
    }

    if (city) {
      // Case-insensitive prefix match — useful for city search-as-you-type
      filter.city = { $regex: `^${city}`, $options: 'i' };
    }

    // ── Query & scoring branch ───────────────────────────────────────────────

    if (sortBy === 'score') {
      // Score is computed in Node — fetch all matching vendors, score them,
      // sort by score DESC, then slice the requested page window.
      const allVendors = await Vendor.find(filter).lean();
      const scored     = allVendors.map(v => withScore(v)).sort(byScoreDesc);

      const total      = scored.length;
      const totalPages = Math.ceil(total / limitNum);
      const start      = (pageNum - 1) * limitNum;
      const vendors    = scored.slice(start, start + limitNum);

      return res.json({
        vendors,
        pagination: { total, page: pageNum, limit: limitNum, totalPages },
      });
    }

    // For DB-sortable fields we push sort + pagination into MongoDB.
    const allowedDbSorts = { name: 1, pricePerUnit: 1 };
    const sortField = allowedDbSorts[sortBy] !== undefined ? sortBy : 'name';

    const [total, rawVendors] = await Promise.all([
      Vendor.countDocuments(filter),
      Vendor.find(filter)
        .sort({ [sortField]: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    const vendors    = rawVendors.map(v => withScore(v));
    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      vendors,
      pagination: { total, page: pageNum, limit: limitNum, totalPages },
    });
  } catch (err) {
    console.error('[GET /api/vendors] Error:', err);
    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'Failed to fetch vendor list.',
    });
  }
});

// ─── GET /api/vendors/:id ────────────────────────────────────────────────────

/**
 * Single vendor detail with full score breakdown.
 *
 * The breakdown object lets the UI display a human-readable explanation of the
 * score: e.g. "Reliability contributed 34/40 pts, Delivery 28/35 pts, …"
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // isActive: true is explicitly required — a soft-deleted vendor must NOT
    // be visible even if the caller knows its _id.
    const vendor = await Vendor.findOne({ _id: id, isActive: true }).lean();

    if (!vendor) {
      return res.status(404).json({
        error:   'Not Found',
        message: 'Vendor not found or is no longer active.',
      });
    }

    const { compositeScore, breakdown } = calculateVendorRank(vendor);

    return res.json({
      vendor: {
        ...vendor,
        compositeScore,
        scoreBreakdown: {
          ...breakdown,
          // Human-readable explanation strings for UI rendering
          explanation: {
            reliability: `Reliability score ${vendor.reliabilityScore} × weight ${breakdown.weights.reliability} = ${breakdown.reliabilityContribution} pts`,
            delivery:    `Delivery score ${vendor.deliveryScore} × weight ${breakdown.weights.delivery} = ${breakdown.deliveryContribution} pts`,
            quality:     `Quality score ${vendor.qualityScore} × weight ${breakdown.weights.quality} = ${breakdown.qualityContribution} pts`,
            base:        `Base score (sum of contributions) = ${breakdown.baseScore} pts`,
            penalty:     `Past delays (${vendor.pastDelays}) × 1.5 = ${breakdown.rawScore < breakdown.baseScore ? breakdown.delayPenalty : 0} pts deducted (capped at 20)`,
            final:       `Final composite score = ${compositeScore} / 100`,
          },
        },
      },
    });
  } catch (err) {
    // Handle malformed ObjectId — Mongoose throws a CastError for invalid ids
    if (err.name === 'CastError' && err.path === '_id') {
      return res.status(400).json({
        error:   'Bad Request',
        message: `'${req.params.id}' is not a valid vendor ID.`,
      });
    }

    console.error('[GET /api/vendors/:id] Error:', err);
    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'Failed to fetch vendor details.',
    });
  }
});

export default router;
