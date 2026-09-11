import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { extractUserFromCookie } from './server/auth.js';
import { db } from './server/db.js';
import { runSeed } from './server/seed.js';
import { startStreamMonitorWorker } from './server/streamMonitor.js';
import { authRouter } from './server/routes/auth.js';
import { publicRouter } from './server/routes/public.js';
import { listenerRouter } from './server/routes/listener.js';
import { ownerRouter } from './server/routes/owner.js';
import { adminRouter } from './server/routes/admin.js';
import { paymentsRouter, handleStripeWebhook } from './server/routes/payments.js';
import { aiRouter } from './server/routes/ai.js';
import { kycRouter } from './server/routes/kyc.js';
import { adminVerificationRouter } from './server/routes/adminVerification.js';
import { listenerPulseRouter } from './server/routes/listenerPulse.js';
import { notificationsRouter } from './server/routes/notifications.js';
import { mobileRouter } from './server/routes/mobile.js';

import { handleLiveEventsStream } from './server/liveSync.js';

import { authRateLimiter, sensitiveActionRateLimiter, apiRateLimiter } from './server/rateLimiter.js';

async function bootstrap() {
  // Must happen before any request is served, otherwise writes land on top of the
  // container's stale copy of data/db.json and overwrite the durable snapshot.
  await db.restoreFromDurableStore();

  const app = express();
  app.disable('x-powered-by');
  // Railway and most PaaS hosts terminate TLS at a single proxy hop. Trusting it
  // makes req.ip the real client address instead of the proxy's.
  app.set('trust proxy', Number(process.env.TRUSTED_PROXY_HOPS ?? 1));
  const PORT = Number(process.env.PORT) || 3000;

  // 2. Production Security Headers & CORS Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Allow third-party church/ministry websites to embed the radio player iframe
    if (req.path.startsWith('/embed')) {
      res.setHeader('Content-Security-Policy', 'frame-ancestors *');
    } else {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    const origin = req.headers.origin;
    const allowedOrigins = [process.env.APP_URL, 'http://localhost:3000', 'http://localhost:5173'].filter(Boolean);

    if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  });

  // 3. Request Parsing & Session Extraction
  // Stripe signs the exact request bytes, so its webhook must bypass the JSON
  // body parser and receive the raw buffer.
  app.post('/api/payments/stripe/webhook', express.raw({ type: '*/*' }), handleStripeWebhook);

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser());
  app.use(extractUserFromCookie);

  // Serve static audio assets
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
  app.use('/audio', express.static(audioDir));

  // 4. Rate Limiting Middlewares
  app.use('/api/', apiRateLimiter);
  // Every credential/OTP endpoint needs the tighter limit, not just login and
  // register — otherwise a 6-digit code can be brute-forced.
  for (const authPath of [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-code',
    '/api/auth/verify-token',
    '/api/auth/resend-code',
    '/api/auth/google',
  ]) {
    app.use(authPath, authRateLimiter);
  }
  for (const paymentPath of [
    '/api/payments/create-checkout',
    '/api/payments/checkout',
    '/api/payments/subscribe-station',
    '/api/payments/stripe/create-intent',
    '/api/payments/stripe/confirm-intent',
    '/api/payments/paypal/create-order',
    '/api/payments/paypal/capture-order',
    '/api/public/donations',
  ]) {
    app.use(paymentPath, sensitiveActionRateLimiter);
  }

  // 5. API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Christian Radios API Engine',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRouter);
  app.get('/api/public/events', handleLiveEventsStream);
  app.use('/api/public', publicRouter);
  app.use('/api/public', listenerPulseRouter);
  app.use('/api/listener', listenerRouter);
  app.use('/api/owner', ownerRouter);
  app.use('/api/kyc', kycRouter);
  app.use('/api/admin/verification', adminVerificationRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/mobile', mobileRouter);

  // Catch-all for unhandled API endpoints to prevent falling through to HTML index
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Endpoint ${req.method} ${req.path} not found` });
  });

  // Global Express Error Sanitization Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Unhandled API Error]:', err);
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'An internal server error occurred.'
        : err.message || 'Internal Server Error',
    });
  });

  // 6. Vite Middleware (Dev) or Static Assets (Prod)
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.RAILWAY_ENVIRONMENT !== undefined ||
    fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('[Vite] Could not load Vite dev server, serving static assets instead:', err);
      serveStatic();
    }
  } else {
    serveStatic();
  }

  function serveStatic() {
    const distPath = path.join(process.cwd(), 'dist');
    const publicAudio = path.join(process.cwd(), 'public', 'audio');
    const distAudio = path.join(distPath, 'audio');
    if (fs.existsSync(distAudio)) {
      app.use('/audio', express.static(distAudio));
    }
    if (fs.existsSync(publicAudio)) {
      app.use('/audio', express.static(publicAudio));
    }
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 7. Start Server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Christian Radios] Server active at http://0.0.0.0:${PORT}`);

    // Deferred initialization of initial database seed and stream monitoring workers
    setTimeout(() => {
      try {
        runSeed();
        startStreamMonitorWorker();
      } catch (err) {
        console.error('[Christian Radios] Error running background initialization:', err);
      }
    }, 200);
  });

  // Railway sends SIGTERM before replacing the container. Writes are debounced, so
  // without an explicit flush the last few seconds of activity are dropped.
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Christian Radios] ${signal} received, flushing database before exit...`);
    server.close();
    try {
      await db.shutdown();
    } catch (err) {
      console.error('[Christian Radios] Error flushing database on shutdown:', err);
    }
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Christian Radios] Fatal bootstrap error:', err);
  process.exit(1);
});
