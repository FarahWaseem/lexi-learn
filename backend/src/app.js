// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/database');

// اختياري: هاندلرز أخطاء الفريق (لو موجودين)
let errorHandler = null;
let notFound = null;
try {
  ({ errorHandler, notFound } = require('./middleware/errorMiddleware'));
} catch (_) { /* ignore if not present */ }

// Clerk middleware تبعِك (لو موجود)
let clerkMiddleware = null;
try {
  ({ clerkMiddleware } = require('./services/clerk'));
} catch (_) { /* ignore if not present */ }

// روتراتك
let topicsRouter, usersRouter, sessionsRouter, utterancesRouter;
try { topicsRouter = require('./routes/topics'); } catch (_) {}
try { usersRouter = require('./routes/users'); } catch (_) {}
try { sessionsRouter = require('./routes/sessions'); } catch (_) {}
try { utterancesRouter = require('./routes/utterances'); } catch (_) {}

// روترات الفريق
let vocabRoutes, lessonRoutes;
try { vocabRoutes = require('./routes/vocabRoutes'); } catch (_) {}
try { lessonRoutes = require('./routes/lessonRoutes'); } catch (_) {}

function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '', 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '', 10) || 100,
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use(limiter);

  // CORS (نمزج منطقِك + CORS_ORIGIN)
  const allowOrigin = (origin, cb) => {
    if (!origin) return cb(null, true); // curl/أصل داخلي
    const localhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
    const feUrl = process.env.FRONTEND_URL;
    const corsOrigin = process.env.CORS_ORIGIN;

    if (localhost.test(origin)) return cb(null, true);
    if (feUrl && origin.startsWith(feUrl)) return cb(null, true);
    if (corsOrigin && origin.startsWith(corsOrigin)) return cb(null, true);

    return cb(new Error('Not allowed by CORS'));
  };
  app.use(cors({ origin: allowOrigin, credentials: true }));

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // Clerk (مبكراً في السلسلة)
  if (clerkMiddleware) {
    app.use(clerkMiddleware());
  }

  // Static public
  const PUBLIC = path.join(__dirname, '..', 'public');
  app.use(express.static(PUBLIC));

  // Health checks
  app.get('/', (_req, res) => {
    res.json({ ok: true, service: 'lexi backend (merged app)', ts: new Date().toISOString() });
  });
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
  });

  // Routes — شغلك
  if (topicsRouter) app.use('/api/topics', topicsRouter);
  if (usersRouter) app.use('/api', usersRouter);
  if (sessionsRouter) app.use('/api/sessions', sessionsRouter);
  if (utterancesRouter) app.use('/api', utterancesRouter);

  // Routes — شغل الفريق
  if (vocabRoutes) app.use('/api/v1/vocab', vocabRoutes);
  if (lessonRoutes) app.use('/api/v1/lessons', lessonRoutes);

  // Error handling
  if (notFound) app.use(notFound);
  if (errorHandler) {
    app.use(errorHandler);
  } else {
    // fallback عام
    app.use((err, _req, res, _next) => {
      console.error('Global error:', err);
      res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
    });
  }

  return app;
}

// دالة التشغيل (تشبه الماستر)
async function startServer() {
  const PORT = process.env.PORT || 3001;
  await connectDB()?.catch?.((e) => {
    console.error('DB connection failed:', e);
    process.exit(1);
  });

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
  });
  return app;
}

// شغّل تلقائيًا لو الملف هو الـ main (زي الماستر)
if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
