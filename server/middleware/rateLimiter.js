/**
 * server/middleware/rateLimiter.js
 *
 * Two rate-limit configurations for SmartBrick's API:
 *
 *  apiLimiter   — 100 req / 15 min per IP, applied to all /api routes.
 *  authLimiter  — 20 req / 15 min per IP, applied to auth-related routes
 *                 (e.g. /api/auth/*) to protect against brute-force.
 *
 * Both limiters return a structured JSON error instead of Express's
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

/** Shared JSON handler so both limiters return the same error shape. */
const jsonRateLimitHandler = (_req, res, _next, options) => {
  res.status(options.statusCode).json({
    error: 'Too Many Requests',
    message: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(options.windowMs / 1000 / 60), // minutes
  });
};

/**
 * General API limiter — 100 requests per 15 minutes per IP.
 * Applied globally to all /api routes in index.js.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  standardHeaders: 'draft-7', // Return RateLimit headers per RFC 6585 / draft-7
  legacyHeaders: false,        // Disable X-RateLimit-* legacy headers
  handler: jsonRateLimitHandler,
});

/**
 * Auth-route limiter — 20 requests per 15 minutes per IP.
 * Apply directly on individual auth routers or endpoints:
 *   router.use(authLimiter)  or  router.post('/sync', authLimiter, handler)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * OCR limiter — 10 requests per 15 minutes per IP.
 * Applied to POST /api/ocr/scan-invoice to protect against expensive
 * Groq vision API abuse.  Each call costs real LLM tokens.
 */
export const ocrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Copilot limiter — 15 requests per 15 minutes per IP.
 * Applied to POST /api/copilot/ask to protect against expensive Groq chat abuse.
 */
export const copilotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * NL search limiter — 15 requests per 15 minutes per IP.
 * Applied to POST /api/search/vendors (Groq parse + DB query).
 */
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Carbon calculation limiter — 20 requests per 15 minutes per IP.
 * Applied to POST /api/carbon/calculate (Climatiq API - metered).
 */
export const carbonLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Forecast limiter — 30 requests per 15 minutes per IP.
 * Applied to GET /api/forecast/* (external forecasting service).
 */
export const forecastLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Report generation limiter — 10 requests per 15 minutes per IP.
 * Applied to GET /api/reports/* (expensive PDF/Excel generation).
 */
export const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Route calculation limiter — 20 requests per 15 minutes per IP.
 * Applied to POST /api/routes/calculate (OpenRouteService API - metered).
 */
export const routeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Weather limiter — 30 requests per 15 minutes per IP.
 * Applied to GET /api/weather/* (OpenWeatherMap API - metered).
 */
export const weatherLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});
