/**
 * server/routes/routeRoutes.js
 *
 * Route & Delivery Map — Phase 7E
 * ─────────────────────────────────────────────────────────────────────────────
 * Calculates driving routes between two coordinate pairs using OpenRouteService.
 *
 * API choice: OpenRouteService (free tier, no billing account required)
 * Endpoint: POST https://api.openrouteservice.org/v2/directions/driving-car
 *   - Accepts [lng, lat] pairs
 *   - Returns distance (metres), duration (seconds), and encoded route geometry
 *
 * Routes
 * ──────
 *   POST /api/routes/calculate
 *     Body: { origin: { lat, lng, label? }, destination: { lat, lng, label? } }
 *     Returns: { distance, duration, geometry, summary }
 *     Protected by requireAuth.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import { routeLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-car';

// ── POST /api/routes/calculate ─────────────────────────────────────────────────

router.post('/calculate', routeLimiter, requireAuth, async (req, res) => {
  const { origin, destination } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────

  if (!origin || !destination) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Request body must include "origin" and "destination" objects.',
    });
  }

  const { lat: oLat, lng: oLng } = origin;
  const { lat: dLat, lng: dLng } = destination;

  if (
    oLat == null || oLng == null ||
    dLat == null || dLng == null ||
    isNaN(oLat) || isNaN(oLng) ||
    isNaN(dLat) || isNaN(dLng)
  ) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both origin and destination must include valid numeric "lat" and "lng" values.',
    });
  }

  // ── API key check ─────────────────────────────────────────────────────────

  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Configuration Error',
      message: 'Route service is not configured. Contact your administrator.',
    });
  }

  // ── ORS request ───────────────────────────────────────────────────────────

  try {
    console.log(`[routes/calculate] ${origin.label || oLat + ',' + oLng} → ${destination.label || dLat + ',' + dLng}`);

    const orsResponse = await fetch(ORS_BASE, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type':  'application/json',
        'Accept':        'application/json, application/geo+json',
      },
      body: JSON.stringify({
        // ORS expects [longitude, latitude] — note the order!
        coordinates: [
          [parseFloat(oLng), parseFloat(oLat)],
          [parseFloat(dLng), parseFloat(dLat)],
        ],
        // Return decoded geometry so the client can draw it on the map
        // without needing the polyline decoding library
        geometry: true,
      }),
    });

    if (!orsResponse.ok) {
      const errText = await orsResponse.text();
      console.error(`[routes/calculate] ORS error ${orsResponse.status}:`, errText.slice(0, 400));
      return res.status(502).json({
        error: 'Route Service Error',
        message: `Failed to fetch route from OpenRouteService (HTTP ${orsResponse.status}).`,
      });
    }

    const orsData = await orsResponse.json();
    const route   = orsData.routes?.[0];

    if (!route) {
      return res.status(404).json({
        error: 'No Route Found',
        message: 'OpenRouteService could not find a driving route between the given coordinates.',
      });
    }

    // ── Extract summary ───────────────────────────────────────────────────

    const distanceM = route.summary?.distance ?? 0;    // metres
    const durationS = route.summary?.duration ?? 0;    // seconds

    const distanceKm = (distanceM / 1000).toFixed(1);
    const durationMin = Math.round(durationS / 60);
    const durationText = durationMin >= 60
      ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
      : `${durationMin} min`;

    // ── Geometry ──────────────────────────────────────────────────────────
    // ORS returns geometry as a GeoJSON LineString when geometry:true
    // The coordinates array is [[lng,lat], [lng,lat], ...]
    // We convert to [{lat, lng}] for easier Leaflet consumption on the client
    const rawGeometry = route.geometry;   // GeoJSON LineString object
    let coordinates = [];

    if (rawGeometry?.coordinates) {
      coordinates = rawGeometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    }

    console.log(`[routes/calculate] Route found: ${distanceKm} km, ${durationText} (${coordinates.length} points)`);

    return res.json({
      distance:     distanceKm,          // string, km
      duration:     durationText,        // human-readable string
      distanceM,                          // raw metres
      durationS,                          // raw seconds
      coordinates,                        // [{lat, lng}] for Leaflet Polyline
      origin:       { lat: oLat, lng: oLng, label: origin.label },
      destination:  { lat: dLat, lng: dLng, label: destination.label },
    });

  } catch (err) {
    console.error('[routes/calculate] Unexpected error:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while calculating the route.',
    });
  }
});

export default router;
