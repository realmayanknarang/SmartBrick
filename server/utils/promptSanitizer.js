/**
 * server/utils/promptSanitizer.js
 *
 * Baseline prompt-injection defense for user-supplied Copilot questions — Phase 9B.
 * ─────────────────────────────────────────────────────────────────────────────
 * Strips or neutralises common phrases that attempt to override the system
 * prompt.  This is not a complete security boundary — it is a first-line filter
 * before user text is embedded in a Groq chat completion request.
 *
 * Limitations (Phase 9F — honest security note)
 * ───────────────────────────────────────────────
 * This is regex-based filtering, NOT a complete prompt-injection defense.
 * Novel phrasing, multilingual attacks, or indirect instruction smuggling may
 * bypass these patterns.  The primary grounding defense is the system prompt
 * ("answer ONLY from provided data") plus keeping user text in the user role.
 * Treat this sanitizer as a first-line filter, not a guarantee.
 */

const MAX_QUESTION_LENGTH = 1000;

/** Patterns that suggest prompt-injection attempts (case-insensitive). */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?/gi,
  /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?/gi,
  /forget\s+(everything|all|your\s+instructions?|what\s+you\s+were\s+told)/gi,
  /you\s+are\s+now\s+/gi,
  /act\s+as\s+(a\s+)?(different|new|unrestricted)/gi,
  /override\s+(the\s+)?(system|your)\s+(prompt|instructions?)/gi,
  /new\s+instructions?\s*:/gi,
  /\bsystem\s*:\s*/gi,
  /\[system\]/gi,
  /<\/?system>/gi,
  /do\s+not\s+follow\s+(the\s+)?(above|system|previous)/gi,
  /reveal\s+(your\s+)?(system\s+)?prompt/gi,
  /jailbreak/gi,
];

/**
 * Sanitises a user question before it is sent to Groq.
 *
 * @param {unknown} raw
 * @returns {string} Cleaned question text (may be empty if input was invalid)
 */
export function sanitizeUserQuestion(raw) {
  if (typeof raw !== 'string') return '';

  let text = raw.trim().slice(0, MAX_QUESTION_LENGTH);

  // Strip non-printable control characters (keep newlines/tabs for readability)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  for (const pattern of INJECTION_PATTERNS) {
    text = text.replace(pattern, '[removed]');
  }

  // Collapse excessive whitespace
  return text.replace(/\s+/g, ' ').trim();
}

export { MAX_QUESTION_LENGTH };
