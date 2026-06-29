/**
 * server/routes/weatherRoutes.js
 *
 * Weather Risk Alerts — Phase 7D
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches forecast data from OpenWeatherMap for a construction site and
 * evaluates risk conditions relevant to active building work.
 *
 * Endpoint choice: /data/2.5/forecast (free tier, no card required)
 * ──────────────────────────────────────────────────────────────────
 * We deliberately use the classic forecast API, NOT One Call 3.0, because:
 *  • One Call 3.0 requires a credit card on file even for free-tier usage
 *  • /data/2.5/forecast is fully free, returns 5-day/3-hour interval forecasts
 *  • 3h intervals are sufficient granularity for "next 24-48 hours" risk alerts
 *
 * Risk criteria (construction-domain thresholds)
 * ──────────────────────────────────────────────
 *  • Heavy rain: rain.3h > 3.0 mm in any 3h window (significant concrete risk)
 *  • Extreme heat: temp > 40°C (313.15 K) — dangerous for outdoor workers
 *  • Strong wind: wind.speed > 15 m/s (~54 km/h) — crane / scaffolding hazard
 *  • Thunderstorm: weather ID 2xx (WMO category)
 *
 * In-memory cache
 * ───────────────
 * A simple Map keyed by siteId stores results for 30 minutes.
 * This avoids hammering OpenWeatherMap on every dashboard load.
 * Cache is process-local (fine for single-instance Render deploy).
 *
 * Routes
 * ──────
 *   GET /api/weather/site/:siteId
 *     Returns { hasRisk, alerts: [{ type, message, severity }], site, forecast }
 *     Protected by requireAuth.
 *
 *   GET /api/weather/sites
 *     Returns weather alerts for ALL sites in one call (dashboard widget).
 *     Protected by requireAuth.
 */

import { Router } from 'express';
import Site        from '../models/Site.js';
import { requireAuth } from '../middleware/clerkAuth.js';

const router = Router();

// ── Constants ─────────────────────────────────────────────────────────────────

const OWM_BASE        = 'https://api.openweathermap.org/data/2.5/forecast';
const CACHE_TTL_MS    = 30 * 60 * 1000; // 30 minutes

// Risk thresholds
const RAIN_MM_3H_THRESHOLD  = 3.0;   // mm per 3h window → significant rain
const HEAT_KELVIN_THRESHOLD = 313.15; // 40 °C in Kelvin (OWM returns Kelvin by default)
const WIND_MPS_THRESHOLD    = 15;     // m/s (~54 km/h)
const THUNDERSTORM_ID_MIN   = 200;    // WMO weather IDs 2xx = thunderstorm
const THUNDERSTORM_ID_MAX   = 299;

// ── In-memory cache ────────────────────────────────────────────────────────────

/** @type {Map<string, { data: object, expiresAt: number }>} */
const forecastCache = new Map();

function getCached(key) {
  const entry = forecastCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    forecastCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  forecastCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── Fetch forecast from OpenWeatherMap ────────────────────────────────────────

/**
 * Fetches the 5-day/3h forecast for a lat/lon pair.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>} Raw OWM forecast response
 */
async function fetchForecast(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY is not configured.');
  }

  const url = `${OWM_BASE}?lat=${lat}&lon=${lon}&appid=${apiKey}&cnt=16`;
  // cnt=16 → 16 × 3h = 48 hours of forecast data

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenWeatherMap error ${response.status}: ${text}`);
  }

  return response.json();
}

// ── Risk evaluation ───────────────────────────────────────────────────────────

/**
 * Evaluates OWM forecast data for construction-site risk conditions.
 *
 * @param {object} forecastData  Raw OWM /forecast response
 * @returns {{ hasRisk: boolean, alerts: Array, checkedPeriods: number }}
 */
function evaluateRisk(forecastData) {
  const periods = forecastData.list ?? [];
  const alerts  = [];

  for (const period of periods) {
    const tempK     = period.main?.temp ?? 0;
    const windMps   = period.wind?.speed ?? 0;
    const rainMm    = period.rain?.['3h'] ?? 0;
    const weatherId = period.weather?.[0]?.id ?? 0;
    const dtText    = new Date(period.dt * 1000).toLocaleString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

    // Thunderstorm check
    if (weatherId >= THUNDERSTORM_ID_MIN && weatherId <= THUNDERSTORM_ID_MAX) {
      alerts.push({
        type: 'thunderstorm',
        severity: 'high',
        time: dtText,
        message: `⚡ Thunderstorm expected around ${dtText}. Halt all outdoor work and crane operations immediately.`,
        raw: { weatherId, tempK, windMps, rainMm },
      });
      continue; // thunderstorm already covers rain
    }

    // Heavy rain check
    if (rainMm > RAIN_MM_3H_THRESHOLD) {
      alerts.push({
        type: 'heavy_rain',
        severity: rainMm > 8 ? 'high' : 'medium',
        time: dtText,
        message: `🌧 Heavy rain expected around ${dtText} (${rainMm.toFixed(1)} mm/3h). Protect fresh concrete and pause masonry work.`,
        raw: { rainMm, tempK },
      });
    }

    // Extreme heat check
    if (tempK > HEAT_KELVIN_THRESHOLD) {
      const tempC = (tempK - 273.15).toFixed(1);
      alerts.push({
        type: 'extreme_heat',
        severity: 'medium',
        time: dtText,
        message: `🌡 Extreme heat around ${dtText} (${tempC}°C). Enforce mandatory rest breaks and ensure hydration stations.`,
        raw: { tempC: parseFloat(tempC), windMps },
      });
    }

    // Strong wind check (separate from thunderstorm)
    if (windMps > WIND_MPS_THRESHOLD && weatherId < THUNDERSTORM_ID_MIN) {
      alerts.push({
        type: 'strong_wind',
        severity: 'medium',
        time: dtText,
        message: `💨 Strong winds around ${dtText} (${windMps.toFixed(1)} m/s). Secure scaffolding and suspend crane lifts.`,
        raw: { windMps, tempK },
      });
    }
  }

  // Deduplicate: keep only highest severity alert per type per 6h window
  // (simple dedup: only report the first occurrence of each type to avoid noise)
  const seen = new Set();
  const deduped = alerts.filter(a => {
    const key = `${a.type}:${a.time.split(',')[0]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    hasRisk:        deduped.length > 0,
    alerts:         deduped,
    checkedPeriods: periods.length,
  };
}

// ── Helper: fetch + evaluate for one site ─────────────────────────────────────

async function getWeatherForSite(site) {
  const cacheKey = site._id.toString();
  const cached   = getCached(cacheKey);

  if (cached) {
    return { ...cached, fromCache: true };
  }

  const forecastData = await fetchForecast(site.latitude, site.longitude);
  const riskResult   = evaluateRisk(forecastData);

  const result = {
    siteId:   site._id,
    siteName: site.name,
    city:     site.city,
    lat:      site.latitude,
    lon:      site.longitude,
    ...riskResult,
    cityWeather: forecastData.city,   // city metadata from OWM
    fromCache:   false,
    fetchedAt:   new Date().toISOString(),
  };

  setCache(cacheKey, result);
  return result;
}

// ── GET /api/weather/site/:siteId ─────────────────────────────────────────────

router.get('/site/:siteId', requireAuth, async (req, res) => {
  const { siteId } = req.params;

  try {
    const site = await Site.findById(siteId).lean();

    if (!site) {
      return res.status(404).json({ error: 'Not Found', message: `No site found with ID ${siteId}` });
    }

    const result = await getWeatherForSite(site);
    return res.json(result);

  } catch (err) {
    console.error(`[weather/site/${siteId}] Error:`, err.message);

    if (err.message.includes('OPENWEATHER_API_KEY')) {
      return res.status(503).json({
        error: 'Configuration Error',
        message: 'Weather service is not configured. Contact your administrator.',
      });
    }

    return res.status(502).json({
      error: 'Weather Service Error',
      message: 'Failed to fetch weather forecast. Please try again shortly.',
    });
  }
});

// ── GET /api/weather/sites — all sites summary ────────────────────────────────

router.get('/sites', requireAuth, async (req, res) => {
  try {
    const sites = await Site.find().select('name city latitude longitude').lean();

    if (!sites.length) {
      return res.json({ sites: [], message: 'No sites found in the database.' });
    }

    // Fetch weather for all sites concurrently (cache will absorb repeated calls)
    const results = await Promise.allSettled(
      sites.map(site => getWeatherForSite(site))
    );

    const siteWeather = results.map((result, i) => {
      if (result.status === 'fulfilled') return result.value;
      // A single site failure shouldn't break the whole response
      return {
        siteId:   sites[i]._id,
        siteName: sites[i].name,
        city:     sites[i].city,
        hasRisk:  false,
        alerts:   [],
        error:    result.reason?.message ?? 'Failed to fetch weather',
      };
    });

    return res.json({ sites: siteWeather });

  } catch (err) {
    console.error('[weather/sites] Error:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch weather alerts for sites.',
    });
  }
});

export default router;
