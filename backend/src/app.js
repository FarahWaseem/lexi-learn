const express = require('express');
const cors = require('cors');
const path = require('path');
const { clerkMiddleware } = require('./services/clerk');

function createApp() {
  const app = express();

  // CORS
  const allowOrigin = (origin, cb) => {
    if (!origin) return cb(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
    if (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  };
  app.use(cors({ origin: allowOrigin, credentials: true }));

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Clerk middleware (early in chain)
  app.use(clerkMiddleware());

  // Static files
  const PUBLIC = path.join(__dirname, '..', 'public');
  app.use(express.static(PUBLIC));

  // Routes
  const topicsRouter = require('./routes/topics');
  const usersRouter = require('./routes/users');
  const sessionsRouter = require('./routes/sessions');
  const utterancesRouter = require('./routes/utterances');

  app.use('/api/topics', topicsRouter);
  app.use('/api', usersRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api', utterancesRouter);

  // Health check
  app.get('/', (_req, res) => {
    res.json({ ok: true, service: 'lexi backend v1.1' });
  });

  // Global error handler
  app.use((err, _req, res, _next) => {
    console.error('Global error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };

