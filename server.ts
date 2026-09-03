import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { extractUserFromCookie } from './server/auth.js';
import { runSeed } from './server/seed.js';
import { startStreamMonitorWorker } from './server/streamMonitor.js';
import { authRouter } from './server/routes/auth.js';
import { publicRouter } from './server/routes/public.js';
import { listenerRouter } from './server/routes/listener.js';
import { ownerRouter } from './server/routes/owner.js';
import { adminRouter } from './server/routes/admin.js';
import { paymentsRouter } from './server/routes/payments.js';

async function bootstrap() {
  const app = express();
  const PORT = 3000;

  // 1. Initial Database Seed & Worker initialization
  runSeed();
  startStreamMonitorWorker();

  // 2. Middlewares
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(cookieParser());
  app.use(extractUserFromCookie);

  // 3. API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Christian Radios API Engine',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/listener', listenerRouter);
  app.use('/api/owner', ownerRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/payments', paymentsRouter);

  // Catch-all for unhandled API endpoints to prevent falling through to HTML index
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Endpoint ${req.method} ${req.path} not found` });
  });

  // 4. Vite Middleware (Dev) or Static Assets (Prod)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 5. Start Server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Christian Radios] Server active at http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[Christian Radios] Fatal bootstrap error:', err);
  process.exit(1);
});
