/**
 * server/config/gemini.js
 *
 * Shared Google Gemini client — replaces Groq (Phase 7B → 2026 refresh)
 * ─────────────────────────────────────────────────────────────────────────────
 * Exports a configured GoogleGenerativeAI instance used by every feature that
 * calls Gemini's API: Invoice OCR (vision model), Copilot, NL search, etc.
 *
 * The API key is read from process.env.GEMINI_API_KEY, which must be set in:
 *   • server/.env            (local development)
 *   • Render environment     (production)
 *
 * Usage (in any route / controller)
 * ──────────────────────────────────
 *   import genAI from '../config/gemini.js';
 *
 *   const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
 *   const result = await model.generateContent('Hello!');
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error(
    'GEMINI_API_KEY is not set.\n' +
    '   Add it to server/.env (local) and to Render environment variables (production).\n' +
    '   The server cannot start without this key when Gemini features are in use.'
  );
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export default genAI;
