/**
 * server/middleware/rateLimiter.js
 *
 * Rate-limit configurations for SmartBrick's API.
 *
 * In development the limits are generous to avoid false 429s from
 * hot-reloads and React StrictMode double-fetches.  In production
 * they should be tuned to match expected traffic and external API
 * budgets (Climatiq, Groq, OpenRouteService, OpenWeatherMap).
 *
 * All limiters return a structured JSON error instead of Express's
 * default plain-text "Too Many Requests" response.
 *
 * Usage
 * -----
 *  import { apiLimiter, authLimiter } from '../middleware/rateLimiter.js';
 *
 *  // Global (already applied in index.js):
 *  app.use('/api', apiLimiter);
 *
 *  // Tighter limit on an individual router:
 *  router.use(authLimiter);
 */

import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

/** Shared JSON handler so all limiters return the same error shape. */
const jsonRateLimitHandler = (_req, res, _next, options) => {
  res.status(options.statusCode).json({
    error: 'Too Many Requests',
    message: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(options.windowMs / 1000 / 60), // minutes
  });
};

/**
 * General API limiter.
 * Dev:   600 req / 15 min per IP
 * Prod:  100 req / 15 min per IP
 * Applied globally to all /api routes in index.js.
 */
const API_MAX = isDev ? 6000 : 100;
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: API_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Auth-route limiter.
 * Dev:   200 req / 15 min per IP
 * Prod:   20 req / 15 min per IP
 * Apply on individual auth routers or endpoints.
 */
const AUTH_MAX = isDev ? 200 : 20;
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: AUTH_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * OCR limiter.
 * Dev:   30 req / 15 min per IP
 * Prod:  10 req / 15 min per IP
 * Applied to POST /api/ocr/scan-invoice (Groq vision API).
 */
const OCR_MAX = isDev ? 30 : 10;
export const ocrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: OCR_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Copilot limiter.
 * Dev:   60 req / 15 min per IP
 * Prod:  15 req / 15 min per IP
 * Applied to POST /api/copilot/ask (Groq chat).
 */
const COPILOT_MAX = isDev ? 60 : 15;
export const copilotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: COPILOT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * NL search limiter.
 * Dev:   60 req / 15 min per IP
 * Prod:  15 req / 15 min per IP
 * Applied to POST /api/search/vendors (Groq parse + DB query).
 */
const SEARCH_MAX = isDev ? 60 : 15;
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: SEARCH_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Carbon calculation limiter.
 * Dev:   60 req / 15 min per IP
 * Prod:  20 req / 15 min per IP
 * Applied to POST /api/carbon/calculate (Climatiq API).
 */
const CARBON_MAX = isDev ? 60 : 20;
export const carbonLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: CARBON_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Forecast limiter.
 * Dev:   90 req / 15 min per IP
 * Prod:  30 req / 15 min per IP
 * Applied to GET /api/forecast/* (external forecasting service).
 */
const FORECAST_MAX = isDev ? 90 : 30;
export const forecastLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: FORECAST_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Report generation limiter.
 * Dev:   30 req / 15 min per IP
 * Prod:  10 req / 15 min per IP
 * Applied to GET /api/reports/* (PDF/Excel generation).
 */
const REPORT_MAX = isDev ? 30 : 10;
export const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: REPORT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Route calculation limiter.
 * Dev:   60 req / 15 min per IP
 * Prod:  20 req / 15 min per IP
 * Applied to POST /api/routes/calculate (OpenRouteService API).
 */
const ROUTE_MAX = isDev ? 60 : 20;
export const routeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: ROUTE_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Weather limiter.
 * Dev:   90 req / 15 min per IP
 * Prod:  30 req / 15 min per IP
 * Applied to GET /api/weather/* (OpenWeatherMap API).
 */
const WEATHER_MAX = isDev ? 90 : 30;
export const weatherLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: WEATHER_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});
