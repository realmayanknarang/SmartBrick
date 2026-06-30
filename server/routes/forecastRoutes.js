/**
 * server/routes/forecastRoutes.js
 *
 * Demand Forecasting proxy — Phase 10C
 * ─────────────────────────────────────────────────────────────────────────────
 * Proxies forecast requests to the isolated Python forecasting service.
 * The main Express server never runs Prophet — it delegates to the
 * microservice and degrades gracefully when that service is unavailable.
 *
 * Routes
 * ──────
 *   GET /api/forecast/:siteId/:materialId
 *     Protected by requireAuth.
 *     On success:  { available: true, forecast: [...] }
 *     On failure:  { available: false, message: "Forecasting temporarily unavailable" }
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';

const router = Router();

const FORECASTING_SERVICE_URL =
  process.env.FORECASTING_SERVICE_URL || 'http://localhost:5001';

const FORECAST_TIMEOUT_MS = 10_000;

/**
 * Fetch with an AbortController timeout so a dead Python service
 * never blocks the dashboard for more than 10 seconds.
 */
async function fetchForecast(siteId, materialId) {
  const url = `${FORECASTING_SERVICE_URL}/forecast/${siteId}/${materialId}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FORECAST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Forecasting service returned ${response.status}: ${body}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// GET /api/forecast/:siteId/:materialId
// ---------------------------------------------------------------------------

router.get('/:siteId/:materialId', requireAuth, async (req, res) => {
  const { siteId, materialId } = req.params;

  try {
    const data = await fetchForecast(siteId, materialId);

    return res.json({
      available: true,
      forecast: data.forecast ?? [],
    });
  } catch (err) {
    console.error(
      `[forecast] Service unavailable for site=${siteId} material=${materialId}:`,
      err.message
    );

    return res.json({
      available: false,
      message: 'Forecasting temporarily unavailable',
    });
  }
});

export default router;
