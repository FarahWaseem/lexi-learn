// server.js — LexiLearn unified starter (works with app OR createApp)
require('dotenv').config();
const http = require('http');

let app;

// 1) دعم كلا النمطين: app الجاهز أو createApp()
try {
  const appModule = require('./src/app');
  if (typeof appModule === 'function') {
    // بعض المشاريع تصدّر app مباشرة كدالة (نادر)
    app = appModule;
  } else if (appModule?.createApp) {
    app = appModule.createApp();
  } else if (appModule?.app) {
    app = appModule.app;
  } else if (appModule?.default) {
    app = appModule.default;
  } else {
    throw new Error('src/app did not export app nor createApp');
  }
} catch (err) {
  console.error('❌ Failed to load ./src/app:', err.message);
  process.exit(1);
}

// 2) أنشئ HTTP server
const server = http.createServer(app);

// 3) أرفق الـ Realtime (إن وُجد) بدون كسر التشغيل
try {
  const { attachRealtime } = require('./src/ws/socket');
  if (typeof attachRealtime === 'function') {
    attachRealtime(server);
    console.log('🔌 Realtime attached (socket)');
  }
} catch {
  // ما في socket — عادي نتجاهل
}

// 4) شغّل السيرفر
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🩺 Health (if defined): http://localhost:${PORT}/health`);
});

// 5) إغلاق آمن
const shutdown = (sig) => () => {
  console.log(`\n${sig} received. Shutting down...`);
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
};
process.on('SIGINT', shutdown('SIGINT'));
process.on('SIGTERM', shutdown('SIGTERM'));
