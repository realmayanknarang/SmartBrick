/**
 * server/routes/ocrRoutes.js
 *
 * Invoice OCR Scanner — Phase 7C
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses Groq's current multimodal vision model (qwen/qwen3.6-27b, which
 * replaced the deprecated meta-llama/llama-4-scout-17b-16e-instruct as of
 * June 2026) to extract structured data from invoice/bill images.
 *
 * Model choice rationale
 * ──────────────────────
 * meta-llama/llama-4-scout-17b-16e-instruct was deprecated by Groq in June
 * 2026.  qwen/qwen3.6-27b is Groq's documented replacement for vision tasks:
 * natively multimodal, 131K context, supports JSON mode, up to 5 images/req.
 *
 * Transport choice: multipart/form-data (multer)
 * ───────────────────────────────────────────────
 * Groq's vision API accepts images as base64 data URLs in the chat messages
 * array.  Multer captures the binary file in-memory (memoryStorage), and we
 * convert it to base64 before sending to Groq.  This avoids disk I/O and is
 * the cleanest path for single-image uploads from the browser.
 *
 * Routes
 * ──────
 *   POST /api/ocr/scan-invoice
 *     Body: multipart/form-data, field name: "invoice" (image file)
 *     Returns: { success: true, data: { vendorName, invoiceNumber, lineItems,
 *               total, gstin, currency, rawText } }
 *     Rate-limited to 10 req/15 min per IP (ocrLimiter).
 */

import { Router }   from 'express';
import multer        from 'multer';
import groq          from '../config/groq.js';
import { requireAuth } from '../middleware/clerkAuth.js';
import { ocrLimiter }  from '../middleware/rateLimiter.js';

const router = Router();

// ── Multer: memory storage — no files written to disk ─────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20 MB — matches Groq's image limit
  fileFilter: (_req, file, cb) => {
    // Accept only image MIME types
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are accepted (JPEG, PNG, WEBP, GIF, etc.)'));
    }
  },
});

// ── The extraction prompt ──────────────────────────────────────────────────────
const OCR_SYSTEM_PROMPT = `You are an expert invoice data extraction assistant for a construction management platform. Analyze the invoice image and extract ALL available information. 

You MUST respond with ONLY valid JSON — no markdown, no code fences, no explanatory text before or after. The JSON must conform exactly to this schema:

{
  "vendorName": "string or null",
  "invoiceNumber": "string or null",
  "invoiceDate": "string or null",
  "dueDate": "string or null",
  "lineItems": [
    {
      "description": "string",
      "quantity": "number or null",
      "unit": "string or null",
      "unitPrice": "number or null",
      "amount": "number or null"
    }
  ],
  "subtotal": "number or null",
  "taxAmount": "number or null",
  "taxRate": "string or null",
  "total": "number or null",
  "gstin": "string or null",
  "currency": "string",
  "paymentTerms": "string or null",
  "notes": "string or null",
  "confidence": "high|medium|low"
}

Rules:
- lineItems must be an array (empty array if none found)
- currency defaults to "INR" for Indian invoices, "USD" otherwise
- confidence reflects how clearly the invoice was readable
- For any field not found or unclear, use null
- Numbers must be actual numbers (not strings) in JSON
- Do not include any text outside the JSON object`;

// ── POST /api/ocr/scan-invoice ─────────────────────────────────────────────────

router.post(
  '/scan-invoice',
  ocrLimiter,
  requireAuth,
  upload.single('invoice'),
  async (req, res) => {
    // Validate upload
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No invoice image uploaded. Include an image file in the "invoice" field.',
      });
    }

    const { mimetype, buffer, originalname, size } = req.file;

    // Convert buffer → base64 data URL (Groq vision accepts data: URLs)
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${mimetype};base64,${base64Image}`;

    console.log(`[OCR] Processing invoice: ${originalname} (${(size / 1024).toFixed(1)} KB, ${mimetype})`);

    try {
      const completion = await groq.chat.completions.create({
        model: 'qwen/qwen3.6-27b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
              {
                type: 'text',
                text: OCR_SYSTEM_PROMPT,
              },
            ],
          },
        ],
        max_tokens: 2048,
        temperature: 0.1, // Low temperature for deterministic extraction
        // Note: response_format JSON mode is not needed when we instruct strictly
      });

      const rawContent = completion.choices[0]?.message?.content?.trim();

      if (!rawContent) {
        return res.status(502).json({
          error: 'Model Error',
          message: 'The vision model returned an empty response. Please try again.',
        });
      }

      // ── Parse JSON from model output ─────────────────────────────────────────
      // The model may wrap JSON in markdown code fences despite instructions.
      // Strip fences defensively before parsing.
      let cleanedContent = rawContent;

      // Strip ```json ... ``` or ``` ... ``` fences
      cleanedContent = cleanedContent
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();

      // Strip <think>...</think> blocks that Qwen's thinking mode may emit
      cleanedContent = cleanedContent
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim();

      // Find the first { and last } to extract just the JSON object
      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace  = cleanedContent.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        console.error('[OCR] No JSON object found in model response:', rawContent.slice(0, 500));
        return res.status(422).json({
          error: 'Parse Error',
          message: 'The model could not extract structured data from this invoice. The image may be too blurry, low-resolution, or not an invoice.',
          hint: 'Try uploading a clearer, higher-resolution image.',
        });
      }

      const jsonString = cleanedContent.slice(firstBrace, lastBrace + 1);

      let parsed;
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseErr) {
        console.error('[OCR] JSON.parse failed:', parseErr.message, '\nRaw:', rawContent.slice(0, 500));
        return res.status(422).json({
          error: 'Parse Error',
          message: 'The model returned malformed data. Please retry or use a clearer image.',
        });
      }

      // Ensure lineItems is always an array
      if (!Array.isArray(parsed.lineItems)) {
        parsed.lineItems = [];
      }

      console.log(`[OCR] Extraction complete — vendor: ${parsed.vendorName}, total: ${parsed.total}, confidence: ${parsed.confidence}`);

      return res.json({
        success: true,
        model: 'qwen/qwen3.6-27b',
        data: parsed,
      });

    } catch (err) {
      // Groq API errors (auth, rate limit, model unavailable, etc.)
      const groqStatus = err?.status ?? err?.statusCode;
      const groqMessage = err?.message ?? 'Unknown error from Groq API';

      console.error('[OCR] Groq API error:', groqStatus, groqMessage);

      if (groqStatus === 401) {
        return res.status(502).json({
          error: 'API Authentication Error',
          message: 'The GROQ_API_KEY is invalid or missing. Contact your administrator.',
        });
      }

      if (groqStatus === 429) {
        return res.status(429).json({
          error: 'Rate Limited',
          message: 'The AI service is currently rate-limited. Please wait a moment and try again.',
        });
      }

      return res.status(502).json({
        error: 'AI Service Error',
        message: 'Failed to process the invoice image. Please try again shortly.',
      });
    }
  }
);

// ── Multer error handler ───────────────────────────────────────────────────────
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File Too Large',
        message: 'Invoice image must be under 20 MB.',
      });
    }
    return res.status(400).json({ error: 'Upload Error', message: err.message });
  }
  if (err?.message?.includes('image files')) {
    return res.status(415).json({ error: 'Unsupported Media Type', message: err.message });
  }
  return res.status(500).json({ error: 'Server Error', message: err.message });
});

export default router;
