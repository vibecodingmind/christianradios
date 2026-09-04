import type { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

export function createRateLimiter(options: { windowMs?: number; maxRequests?: number; message?: string }) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default
  const maxRequests = options.maxRequests || 120;
  const message = options.message || 'Too many requests from this IP. Please try again later.';

  const ipStore = new Map<string, RateLimitRecord>();

  // Periodically clean up old IP records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        ipStore.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let record = ipStore.get(ip);
    if (!record) {
      record = { timestamps: [] };
      ipStore.set(ip, record);
    }

    // Filter timestamps within current window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      res.status(429).json({ error: message, retryAfterSeconds: Math.ceil(windowMs / 1000) });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 15,
  message: 'Too many authentication attempts. Please wait 60 seconds before trying again.',
});

export const sensitiveActionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'Rate limit exceeded for sensitive financial/account operations.',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  message: 'API rate limit exceeded.',
});
