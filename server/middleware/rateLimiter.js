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
 * Dev:   disabled (skip)
 * Prod:  100 req / 15 min per IP
 * Applied globally to all /api routes in index.js.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 100,
  skip: () => isDev,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Auth-route limiter.
 * Dev:   disabled (skip)
 * Prod:  20 req / 15 min per IP
 * Apply on individual auth routers or endpoints.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 20,
  skip: () => isDev,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * OCR limiter.
 * Dev:   disabled (skip)
 * Prod:  10 req / 15 min per IP
 * Applied to POST /api/ocr/scan-invoice (Groq vision API).
 */
export const ocrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 10,
  skip: () => isDev,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Copilot limiter.
 * Dev:   disabled (skip)
 * Prod:  15 req / 15 min per IP
 * Applied to POST /api/copilot/ask (Groq chat).
 */
export const copilotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 15,
  skip: () => isDev,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * NL search limiter.
 * Dev:   disabled (skip)
 * Prod:  15 req / 15 min per IP
 * Applied to POST /api/search/vendors (Groq parse + DB query).
 */
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 15,
  skip: () => isDev,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Carbon calculation limiter.
 * Dev:   disabled (skip)
 * Prod:  20 req / 15 min per IP
 * Applied to POST /api/carbon/calculate (Climatiq API).
 */
export const carbonLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 20,
  skip: () => isDev,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Forecast limiter.
 * Dev:   disabled (skip)
 * Prod:  30 req / 15 min per IP
 * Applied to GET /api/forecast/* (external forecasting service).
 */
export const forecastLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 30,
  skip: () => isDev,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Report generation limiter.
 * Dev:   disabled (skip)
 * Prod:  10 req / 15 min per IP
 * Applied to GET /api/reports/* (PDF/Excel generation).
 */
export const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 10,
  skip: () => isDev,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Route calculation limiter.
 * Dev:   disabled (skip)
 * Prod:  20 req / 15 min per IP
 * Applied to POST /api/routes/calculate (OpenRouteService API).
 */
export const routeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 20,
  skip: () => isDev,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Weather limiter.
 * Dev:   disabled (skip)
 * Prod:  30 req / 15 min per IP
 * Applied to GET /api/weather/* (OpenWeatherMap API).
 */
export const weatherLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 30,
  skip: () => isDev,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});
