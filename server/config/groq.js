/**
 * server/config/groq.js
 *
 * Shared Groq client — Phase 7B
 * ─────────────────────────────────────────────────────────────────────────────
 * Exports a configured Groq SDK instance used by every feature that calls
 * Groq's API: Invoice OCR (vision model), Weather Risk Alerts, Copilot, etc.
 *
 * The API key is read from process.env.GROQ_API_KEY, which must be set in:
 *   • server/.env            (local development)
 *   • Render environment     (production)
 *
 * A clear startup error is thrown if the key is missing — matching the same
 * fail-fast pattern used in db.js for MONGODB_URI.
 *
 * Usage (in any route / controller)
 * ──────────────────────────────────
 *   import groq from '../config/groq.js';
 *
 *   const completion = await groq.chat.completions.create({
 *     model: 'llama3-8b-8192',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   });
 */

import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error(
    '❌ GROQ_API_KEY is not set.\n' +
    '   Add it to server/.env (local) and to Render environment variables (production).\n' +
    '   The server cannot start without this key when Groq features are in use.'
  );
  // Do NOT exit here — the key may be absent in non-production preview deploys.
  // Features that import `groq` will fail gracefully at call-time rather than
  // crashing the entire server process during startup.
}

const groq = new Groq({ apiKey: apiKey || '' });

export default groq;
