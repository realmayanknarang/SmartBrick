import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import Site from '../models/Site.js';

const router = Router();

/**
 * GET /api/sites
 * Returns all Site documents with their parent project populated.
 * Protected by requireAuth middleware.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const sites = await Site.find().populate('project', 'name status budget spentSoFar');
    return res.json(sites);
  } catch (err) {
    console.error('[sites] Error fetching sites:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch construction sites.',
    });
  }
});

export default router;
