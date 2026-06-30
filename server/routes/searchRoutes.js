/**
 * server/routes/searchRoutes.js
 *
 * Natural Language Vendor Search — Phase 9D
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/search/vendors
 *   Accepts { query: string }, uses Groq to parse natural language into
 *   structured filters, then queries MongoDB with Phase 8A scoring logic.
 */

import { Router } from 'express';
import genAI from '../config/gemini.js';
import { requireAuth } from '../middleware/clerkAuth.js';
import { searchLimiter } from '../middleware/rateLimiter.js';
import { sanitizeUserQuestion } from '../utils/promptSanitizer.js';
import Vendor from '../models/Vendor.js';
import { calculateVendorRank } from '../utils/vendorScoring.js';

const router = Router();

const SEARCH_MODEL = 'gemini-3.1-flash-lite';

const VALID_CATEGORIES = new Set([
  'cement', 'steel', 'sand', 'bricks', 'electrical', 'plumbing',
]);

const PARSE_SYSTEM_PROMPT = `You parse natural-language vendor search queries for a construction procurement platform in India.
Extract ONLY the filter criteria explicitly mentioned or clearly implied in the query.

Respond with ONLY valid JSON — no markdown, no code fences, no extra text.
Use this exact schema (omit fields that are not specified in the query):

{
  "category": "string or omitted — one of: cement, steel, sand, bricks, electrical, plumbing",
  "maxPrice": "number or omitted — maximum price per unit in INR (e.g. 60000 for ₹60000/ton)",
  "city": "string or omitted — city name only, no state/country",
  "minScore": "number or omitted — minimum composite vendor score 0-100"
}

Rules:
- category must be lowercase and match the enum exactly when present
- maxPrice and minScore must be numbers, not strings
- Do not invent filters the user did not ask for
- For vague queries with no clear filters, return {}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts and parses a JSON object from Groq model output (OCR-style defense).
 *
 * @param {string} rawContent
 * @returns {object|null}
 */
function parseGroqJson(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return null;

  let cleaned = rawContent.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace  = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) return null;

  const jsonString = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

/**
 * Normalises Groq-parsed filters into safe query criteria.
 *
 * @param {object} raw
 * @returns {{ category?: string, maxPrice?: number, city?: string, minScore?: number }}
 */
function normaliseFilters(raw) {
  const filters = {};

  if (raw?.category && typeof raw.category === 'string') {
    const cat = raw.category.trim().toLowerCase();
    if (VALID_CATEGORIES.has(cat)) filters.category = cat;
  }

  if (raw?.city && typeof raw.city === 'string') {
    const city = raw.city.trim();
    if (city.length >= 2) filters.city = city;
  }

  const maxPrice = Number(raw?.maxPrice);
  if (Number.isFinite(maxPrice) && maxPrice > 0) {
    filters.maxPrice = maxPrice;
  }

  const minScore = Number(raw?.minScore);
  if (Number.isFinite(minScore) && minScore >= 0 && minScore <= 100) {
    filters.minScore = minScore;
  }

  return filters;
}

function withScore(vendorObj) {
  const { compositeScore } = calculateVendorRank(vendorObj);
  return { ...vendorObj, compositeScore };
}

function byScoreDesc(a, b) {
  return b.compositeScore - a.compositeScore;
}

/**
 * Queries active vendors using MongoDB + in-memory score/price filters.
 *
 * @param {{ category?: string, maxPrice?: number, city?: string, minScore?: number }} filters
 * @returns {Promise<Array>}
 */
async function queryVendorsWithFilters(filters) {
  const mongoFilter = { isActive: true };

  if (filters.category) mongoFilter.category = filters.category;

  if (filters.city) {
    mongoFilter.city = { $regex: `^${filters.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, $options: 'i' };
  }

  if (filters.maxPrice != null) {
    mongoFilter.pricePerUnit = { $lte: filters.maxPrice };
  }

  const rawVendors = await Vendor.find(mongoFilter).lean();
  let scored = rawVendors.map(v => withScore(v));

  if (filters.minScore != null) {
    scored = scored.filter(v => v.compositeScore >= filters.minScore);
  }

  return scored.sort(byScoreDesc);
}

// ─── POST /api/search/vendors ─────────────────────────────────────────────────

router.post('/vendors', searchLimiter, requireAuth, async (req, res) => {
  try {
    const { query: rawQuery } = req.body ?? {};

    if (typeof rawQuery !== 'string' || !rawQuery.trim()) {
      return res.status(400).json({
        error:   'Bad Request',
        message: 'A non-empty "query" string is required.',
      });
    }

    const query = sanitizeUserQuestion(rawQuery);

    if (!query) {
      return res.status(400).json({
        error:   'Bad Request',
        message: 'Query is empty or invalid after sanitization.',
      });
    }

    let parsedFilters = {};
    let groqWarning   = null;

    if (!process.env.GEMINI_API_KEY) {
      console.warn('[POST /api/search/vendors] GEMINI_API_KEY missing; using broad search.');
      groqWarning =
        'AI parsing is unavailable (missing API key). Showing all active vendors — use structured filters for precise results.';
    } else {
      try {
        const model = genAI.getGenerativeModel({
          model: SEARCH_MODEL,
          systemInstruction: PARSE_SYSTEM_PROMPT,
          generationConfig: {
            maxOutputTokens: 256,
            temperature: 0.1,
          },
        });

        const result = await model.generateContent(query);
        const rawContent = result.response.text().trim();
        const parsed     = parseGroqJson(rawContent);

        if (parsed && typeof parsed === 'object') {
          parsedFilters = normaliseFilters(parsed);
        } else {
          console.warn('[POST /api/search/vendors] Could not parse Gemini JSON; using broad search.');
          groqWarning =
            'Could not parse your query. Showing all active vendors — try simpler wording or use structured filters.';
        }
      } catch (geminiErr) {
        console.error('[POST /api/search/vendors] Gemini parse error:', geminiErr?.message ?? geminiErr);
        groqWarning =
          'AI parsing is temporarily unavailable. Showing all active vendors — use structured filters for precise results.';
      }
    }

    const vendors = await queryVendorsWithFilters(parsedFilters);

    return res.json({
      query,
      parsedFilters,
      vendors,
      total: vendors.length,
      groqWarning,
    });
  } catch (err) {
    console.error('[POST /api/search/vendors] Unexpected error:', err);
    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'Failed to search vendors.',
    });
  }
});

export default router;
