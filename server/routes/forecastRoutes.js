/**
 * server/routes/forecastRoutes.js
 *
 * Demand Forecasting proxy — Phase 10C / 10E
 * ─────────────────────────────────────────────────────────────────────────────
 * Proxies forecast requests to the isolated Python forecasting service.
 * Historical usage for charting is read directly from MongoDB here —
 * only the Prophet fit runs in Python.
 *
 * Routes
 * ──────
 *   GET /api/forecast/options
 *     Returns sites and materials for dashboard dropdowns.
 *
 *   GET /api/forecast/:siteId/:materialId
 *     On success:  { available: true, forecast, history, metadata }
 *     On failure:  { available: false, message: "Forecasting temporarily unavailable" }
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/clerkAuth.js';
import { forecastLimiter } from '../middleware/rateLimiter.js';
import Site from '../models/Site.js';
import Material from '../models/Material.js';
import UsageHistory from '../models/UsageHistory.js';

const router = Router();

const FORECASTING_SERVICE_URL =
  process.env.FORECASTING_SERVICE_URL || 'http://localhost:5001';

const FORECAST_TIMEOUT_MS = 10_000;

async function fetchForecast(siteId, materialId) {
  const url = `${FORECASTING_SERVICE_URL}/forecast/${siteId}/${materialId}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FORECAST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'X-Forecasting-Secret': process.env.FORECASTING_SERVICE_SECRET || '',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Forecasting service returned ${response.status}: ${body}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHistory(siteId, materialId) {
  const records = await UsageHistory.find({
    site: new mongoose.Types.ObjectId(siteId),
    material: new mongoose.Types.ObjectId(materialId),
  })
    .sort({ date: 1 })
    .select('date quantityUsed -_id')
    .lean();

  return records.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    quantityUsed: r.quantityUsed,
  }));
}

function buildMetadata(history, forecast) {
  const historyWeeks = history.length;
  const avgBandWidth =
    forecast.length > 0
      ? forecast.reduce(
          (sum, f) => sum + (f.upperBound - f.lowerBound),
          0
        ) / forecast.length
      : 0;
  const avgPredicted =
    forecast.length > 0
      ? forecast.reduce((sum, f) => sum + f.predictedUsage, 0) / forecast.length
      : 0;
  const relativeUncertainty =
    avgPredicted > 0 ? avgBandWidth / avgPredicted : null;

  let reliability = 'limited';
  if (historyWeeks >= 24 && relativeUncertainty !== null && relativeUncertainty < 0.8) {
    reliability = 'moderate';
  } else if (historyWeeks < 12) {
    reliability = 'insufficient';
  }

  return {
    historyWeeks,
    reliability,
    relativeUncertainty:
      relativeUncertainty !== null
        ? Math.round(relativeUncertainty * 100) / 100
        : null,
  };
}

// ---------------------------------------------------------------------------
// GET /api/forecast/options
// ---------------------------------------------------------------------------

router.get('/options', forecastLimiter, requireAuth, async (_req, res) => {
  try {
    const [sites, materials] = await Promise.all([
      Site.find().select('name city currentPhase').sort({ name: 1 }).lean(),
      Material.find().select('name category unit').sort({ name: 1 }).lean(),
    ]);

    return res.json({
      sites: sites.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        city: s.city,
        currentPhase: s.currentPhase,
      })),
      materials: materials.map((m) => ({
        id: m._id.toString(),
        name: m.name,
        category: m.category,
        unit: m.unit,
      })),
    });
  } catch (err) {
    console.error('[forecast/options] Error:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to load forecast options.',
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/forecast/:siteId/:materialId
// ---------------------------------------------------------------------------

router.get('/:siteId/:materialId', forecastLimiter, requireAuth, async (req, res) => {
  const { siteId, materialId } = req.params;

  // ── Input validation ─────────────────────────────────────────────────────
  if (!siteId || !materialId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both siteId and materialId are required.',
    });
  }

  try {
    // Validate ObjectId format
    new mongoose.Types.ObjectId(siteId);
    new mongoose.Types.ObjectId(materialId);
  } catch (err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid siteId or materialId format.',
    });
  }

  try {
    const [data, history] = await Promise.all([
      fetchForecast(siteId, materialId),
      fetchHistory(siteId, materialId),
    ]);

    const forecast = data.forecast ?? [];

    return res.json({
      available: true,
      forecast,
      history,
      metadata: buildMetadata(history, forecast),
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
