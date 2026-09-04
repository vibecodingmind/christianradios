import { Router } from 'express';
import { AIService } from '../services/aiService.js';
import { getRecommendedStations } from '../services/aiTools.js';
import { db } from '../db.js';

export const aiRouter = Router();

// Rate limiting in-memory store
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function applyAIRateLimit(req: any, res: any, next: any) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'anonymous_client';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  const settings = db.settings?.get() as any;
  const maxLimit = req.user ? (settings?.aiRateLimitAuth || 60) : (settings?.aiRateLimitAnon || 30);

  const clientRecord = rateLimitMap.get(ip);
  if (!clientRecord || now > clientRecord.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (clientRecord.count >= maxLimit) {
    return res.status(429).json({
      error: 'AI Discovery Guide rate limit exceeded. Please wait a moment before trying again.',
      resetAt: new Date(clientRecord.resetAt).toISOString(),
    });
  }

  clientRecord.count += 1;
  next();
}

/**
 * GET /api/ai/status
 * Returns current status of AI discovery features
 */
aiRouter.get('/status', (req, res) => {
  const settings = db.settings?.get() as any;
  const isEnabled = typeof settings?.aiEnabled === 'boolean' ? settings.aiEnabled : true;
  const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY);

  res.json({
    enabled: isEnabled,
    provider: 'Google Gemini',
    model: settings?.aiModel || process.env.AI_MODEL || 'gemini-2.5-flash',
    hasApiKeyConfigured: hasKey,
  });
});

/**
 * POST /api/ai/guide
 * Natural language AI query grounded in real database
 */
aiRouter.post('/guide', applyAIRateLimit, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'Valid prompt string is required' });
    }

    const aiService = AIService.getInstance();
    const result = await aiService.queryGuide(prompt.trim());

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[AIRouter] Error processing AI guide query:', err);
    return res.status(500).json({
      error: 'Failed to process AI discovery query. Please try again.',
      message: err.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/ai/prayer-assistant
 * Generates structured prayer text based on user intent
 */
aiRouter.post('/prayer-assistant', applyAIRateLimit, async (req, res) => {
  try {
    const { intent } = req.body;
    if (!intent || typeof intent !== 'string' || intent.trim() === '') {
      return res.status(400).json({ error: 'Valid prayer intent string is required' });
    }

    const aiService = AIService.getInstance();
    const result = await aiService.generatePrayer(intent.trim());

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[AIRouter] Error generating prayer:', err);
    return res.status(500).json({
      error: 'Failed to generate prayer text.',
      message: err.message,
    });
  }
});

/**
 * GET /api/ai/recommendations
 * Contextual station recommendations
 */
aiRouter.get('/recommendations', (req, res) => {
  try {
    const { context, countryCode, language, limit } = req.query as Record<string, string>;

    const limitNum = limit ? parseInt(limit, 10) : 8;
    const stations = getRecommendedStations({
      context: context || '',
      countryCode: countryCode || '',
      language: language || '',
      limit: limitNum,
    });

    return res.json({
      success: true,
      data: stations,
    });
  } catch (err: any) {
    console.error('[AIRouter] Error fetching recommendations:', err);
    return res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});
