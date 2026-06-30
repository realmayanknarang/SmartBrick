/**
 * server/routes/priceTrendRoutes.js
 *
 * Price Trend Charts API — Phase 11C
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns static illustrative price trends from server/data/priceTrends.json.
 * This is NOT live market data — the client must label it as such.
 *
 * Routes
 * ──────
 *   GET /api/price-trends/:category
 *     Returns { category, unit, dataPoints: [{ month, price }] }
 */

import { Router }      from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { requireAuth } from '../middleware/clerkAuth.js';

const router = Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
const trendsPath = join(__dirname, '..', 'data', 'priceTrends.json');

const VALID_CATEGORIES = ['cement', 'steel', 'sand', 'bricks', 'electrical', 'plumbing'];

let trendsCache = null;

function loadTrends() {
  if (!trendsCache) {
    trendsCache = JSON.parse(readFileSync(trendsPath, 'utf8'));
  }
  return trendsCache;
}

router.get('/:category', requireAuth, (req, res) => {
  const { category } = req.params;

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error:   'Bad Request',
      message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}.`,
    });
  }

  const trends = loadTrends();
  const entry  = trends[category];

  if (!entry) {
    return res.status(404).json({
      error:   'Not Found',
      message: `No price trend data for category '${category}'.`,
    });
  }

  return res.json({
    category:   entry.category,
    unit:       entry.unit,
    dataPoints: entry.dataPoints,
  });
});

export default router;
