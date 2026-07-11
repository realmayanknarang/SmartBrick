import { Router } from 'express';
import genAI from '../config/gemini.js';
import { requireAuth } from '../middleware/auth.js';
import { copilotLimiter } from '../middleware/rateLimiter.js';
import { sanitizeUserQuestion } from '../utils/promptSanitizer.js';
import { gatherRoleContext, getRoleSystemPrompt } from '../utils/roleCopilotContext.js';

const router = Router();

const COPILOT_MODEL = 'gemini-3.1-flash-lite';

const FALLBACK_ANSWER = "Sorry, I'm having trouble right now, try again shortly.";

function degradedResponse(reason) {
  return {
    answer: FALLBACK_ANSWER,
    degraded: true,
    degradedReason: reason,
  };
}

router.post('/role-ask', copilotLimiter, requireAuth, async (req, res) => {
  try {
    const { question: rawQuestion } = req.body ?? {};
    const userRole = req.user?.role;

    if (!userRole || !['owner', 'builder', 'vendor'].includes(userRole)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid user role (owner, builder, vendor) is required.',
      });
    }

    if (typeof rawQuestion !== 'string' || !rawQuestion.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A non-empty "question" string is required.',
      });
    }

    const question = sanitizeUserQuestion(rawQuestion);
    if (!question) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Question is empty or invalid after sanitization.',
      });
    }

    let context;
    try {
      context = await gatherRoleContext(req.user._id, userRole);
    } catch (ctxErr) {
      console.error('[POST /api/copilot/role-ask] Context retrieval failed:', ctxErr);
      return res.json(degradedResponse('Could not load your data.'));
    }

    const rolePrompt = getRoleSystemPrompt(userRole);
    const systemPrompt = `${rolePrompt}\n\n=== YOUR DATA ===\n${context.summary}\n\nAnswer based ONLY on the data above. If the data does not contain enough information to answer, say so clearly — do not guess or invent.`;

    if (!process.env.GEMINI_API_KEY) {
      console.error('[POST /api/copilot/role-ask] GEMINI_API_KEY is not configured.');
      return res.json(degradedResponse('AI service is not configured.'));
    }

    try {
      const model = genAI.getGenerativeModel({
        model: COPILOT_MODEL,
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.3,
        },
      });

      const result = await model.generateContent(question);
      const answer = result.response.text().trim();

      if (!answer) {
        console.error('[POST /api/copilot/role-ask] Gemini returned empty content.');
        return res.json(degradedResponse('AI returned an empty response.'));
      }

      return res.json({ answer, degraded: false });
    } catch (geminiErr) {
      console.error('[POST /api/copilot/role-ask] Gemini API error:', geminiErr?.message ?? geminiErr);
      return res.json(degradedResponse('AI service is temporarily unavailable.'));
    }
  } catch (err) {
    console.error('[POST /api/copilot/role-ask] Unexpected error:', err);
    return res.json(degradedResponse('An unexpected error occurred.'));
  }
});

export default router;
