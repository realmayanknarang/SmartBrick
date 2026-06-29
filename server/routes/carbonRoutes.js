/**
 * server/routes/carbonRoutes.js
 *
 * Carbon Footprint Calculator — Phase 7F
 * ─────────────────────────────────────────────────────────────────────────────
 * Calculates CO2 emissions for construction material transport using
 * Climatiq's API (POST https://api.climatiq.io/data/v1/estimate).
 *
 * Activity mapping for construction materials
 * ────────────────────────────────────────────
 * We use Climatiq's freight transport emission factors:
 *   • activity_id: "freight_vehicle-vehicle_type_rigid_truck-fuel_source_diesel-engine_size_na-vehicle_age_na-loading_na"
 *     Parameters: weight_unit "t", distance_unit "km"
 *   This activity ID covers road freight by rigid diesel truck — the dominant
 *   mode used for delivering cement, steel, sand, bricks in India.
 *
 * Additional material production factors:
 *   • Cement:  "building_materials-type_cement_production"   (weight: t)
 *   • Steel:   "steel-type_steel_bars-fuel_source_na"         (weight: t)
 *   • Sand:    freight_vehicle factor only (extraction minimal)
 *   • Bricks:  "building_materials-type_fired_clay_brick"     (weight: t)
 *
 * Routes
 * ──────
 *   POST /api/carbon/calculate
 *     Body: { material, weightTonnes, distanceKm }
 *     material: 'cement' | 'steel' | 'sand' | 'bricks' | 'electrical' | 'plumbing'
 *     Returns: { transport: {co2, unit}, production?: {co2, unit}, total, unit }
 *     Protected by requireAuth.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';

const router = Router();

const CLIMATIQ_BASE = 'https://api.climatiq.io/data/v1/estimate';

// ── Fallback emission factors (kg CO2e per tonne) when Climatiq API is unavailable
// These are industry-standard averages for construction materials
const FALLBACK_EMISSION_FACTORS = {
  cement:     810,      // ~810 kg CO2e per tonne of cement
  steel:      1800,     // ~1800 kg CO2e per tonne of steel
  bricks:     240,      // ~240 kg CO2e per tonne of fired clay bricks
  sand:       0,        // Minimal production emissions
  electrical: 0,        // Not calculated
  plumbing:   0,        // Not calculated
};

// ── Freight transport fallback (kg CO2e per tonne-km)
const FREIGHT_FALLBACK_FACTOR = 0.062; // ~62g CO2e per tonne-km for diesel truck

// ── Material production emission factor activity IDs (from Climatiq data explorer)
// These factors require "weight" parameter in tonnes.
const MATERIAL_PRODUCTION_FACTORS = {
  cement:     'cement-production-type_ordinary_portland_cement',
  steel:      'steel-production-type_steel_bars',
  bricks:     'brick-production-type_fired_clay_brick',
  // Sand/gravel, electrical, plumbing — no widely-available production factor on Climatiq free tier
  // Transport emissions are still calculated for all categories
};

// ── Freight transport factor (road freight, diesel rigid truck)
const FREIGHT_ACTIVITY_ID = 'freight-vehicle-type_lorry_3_5_ton-diesel';

// ── Call Climatiq estimate endpoint ──────────────────────────────────────────

async function callClimatiq(activityId, parameters, apiKey) {
  const response = await fetch(CLIMATIQ_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      emission_factor: {
        activity_id:  activityId,
        data_version: '^21',
      },
      parameters,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const errMsg  = errBody?.error_code || errBody?.message || `HTTP ${response.status}`;
    throw new Error(`Climatiq API error: ${errMsg}`);
  }

  return response.json();
}

// ── POST /api/carbon/calculate ─────────────────────────────────────────────────

router.post('/calculate', requireAuth, async (req, res) => {
  const { material, weightTonnes, distanceKm } = req.body;

  // ── Validation ─────────────────────────────────────────────────────────────

  const validMaterials = ['cement', 'steel', 'sand', 'bricks', 'electrical', 'plumbing'];

  if (!material || !validMaterials.includes(material)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `"material" must be one of: ${validMaterials.join(', ')}`,
    });
  }

  if (weightTonnes == null || isNaN(weightTonnes) || parseFloat(weightTonnes) <= 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: '"weightTonnes" must be a positive number.',
    });
  }

  if (distanceKm == null || isNaN(distanceKm) || parseFloat(distanceKm) <= 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: '"distanceKm" must be a positive number.',
    });
  }

  const apiKey = process.env.CLIMATIQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Configuration Error',
      message: 'Carbon calculation service is not configured. Contact your administrator.',
    });
  }

  const wt = parseFloat(weightTonnes);
  const dk = parseFloat(distanceKm);

  console.log(`[carbon/calculate] ${material}, ${wt}t, ${dk}km`);

  try {
    // ── 1. Transport emissions (always calculated) ───────────────────────────

    let transportCO2;
    let usedFallbackTransport = false;

    try {
      const transportResult = await callClimatiq(
        FREIGHT_ACTIVITY_ID,
        {
          weight:        wt,
          weight_unit:   't',
          distance:      dk,
          distance_unit: 'km',
        },
        apiKey
      );
      transportCO2 = transportResult.co2e; // kg CO2e
    } catch (transportErr) {
      // Fallback to industry-standard factor
      console.warn(`[carbon/calculate] Transport API failed, using fallback:`, transportErr.message);
      transportCO2 = wt * dk * FREIGHT_FALLBACK_FACTOR;
      usedFallbackTransport = true;
    }

    // ── 2. Production emissions (for materials with known factors) ───────────

    let productionCO2 = null;
    let usedFallbackProduction = false;

    const productionActivityId = MATERIAL_PRODUCTION_FACTORS[material];

    if (productionActivityId) {
      try {
        const productionResult = await callClimatiq(
          productionActivityId,
          { weight: wt, weight_unit: 't' },
          apiKey
        );
        productionCO2 = productionResult.co2e;
      } catch (prodErr) {
        // Fallback to industry-standard factor
        console.warn(`[carbon/calculate] Production API failed for ${material}, using fallback:`, prodErr.message);
        productionCO2 = wt * FALLBACK_EMISSION_FACTORS[material];
        usedFallbackProduction = true;
      }
    } else {
      // Use fallback for materials without Climatiq factors
      productionCO2 = wt * FALLBACK_EMISSION_FACTORS[material];
      usedFallbackProduction = true;
    }

    // ── 3. Total ─────────────────────────────────────────────────────────────

    const totalCO2 = transportCO2 + (productionCO2 ?? 0);

    // Format values for display
    const fmt = (kg) => kg >= 1000
      ? `${(kg / 1000).toFixed(2)} t`
      : `${kg.toFixed(2)} kg`;

    console.log(`[carbon/calculate] Transport: ${transportCO2.toFixed(2)} kg CO2e` +
      (usedFallbackTransport ? ' (fallback)' : '') +
      (productionCO2 != null ? `, Production: ${productionCO2.toFixed(2)} kg CO2e` +
      (usedFallbackProduction ? ' (fallback)' : '') : '') +
      `, Total: ${totalCO2.toFixed(2)} kg CO2e`);

    return res.json({
      material,
      weightTonnes: wt,
      distanceKm:   dk,
      transport: {
        co2Kg: transportCO2,
        co2Formatted: fmt(transportCO2),
        unit: 'kg',
        usedFallback: usedFallbackTransport,
      },
      production: productionCO2 != null ? {
        co2Kg: productionCO2,
        co2Formatted: fmt(productionCO2),
        unit: 'kg',
        usedFallback: usedFallbackProduction,
      } : null,
      total: {
        co2Kg: totalCO2,
        co2Formatted: fmt(totalCO2),
      },
      // Equivalent comparisons for user understanding
      equivalents: {
        // 1 tree absorbs ~21 kg CO2/year
        treesNeeded: Math.ceil(totalCO2 / 21),
        // Average car emits ~0.21 kg CO2/km
        carKmEquivalent: Math.round(totalCO2 / 0.21),
      },
    });

  } catch (err) {
    const errMsg = err.message ?? 'Unknown error';
    console.error('[carbon/calculate] Error:', errMsg);

    if (errMsg.includes('Climatiq API error')) {
      return res.status(502).json({
        error: 'Carbon Service Error',
        message: `The carbon calculation service returned an error: ${errMsg}. This may be due to an invalid activity_id for this material combination. Try a different material or contact support.`,
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during carbon calculation.',
    });
  }
});

export default router;
