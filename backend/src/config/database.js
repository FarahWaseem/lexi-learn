// backend/src/config/database.js
// Unified DB config (yours + theirs)
const { Pool } = require('pg');
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

// نسمح بطريقتين للاتصال:
// 1) DATABASE_URL جاهزة
// 2) متغيرات مفصّلة (DB_HOST/PORT/USER/PASSWORD/NAME)
const baseConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lexilearn',
    };

// SSL بالبرودكشن فقط (مفيد لـ Render/Neon/Heroku)
const ssl =
  isProd
    ? { rejectUnauthorized: false }
    : false;

// خيارات الـ Pool (مع قابليّة تعديلها من env)
const pool = new Pool({
  ...baseConfig,
  ssl,
  max: Number(process.env.DB_POOL_MAX || 20),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT || 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT || 2000),
});

// فحص الاتصال (اختياري تستدعيه عند الإقلاع)
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Helper للاستعلامات
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DB_LOG_QUERIES === 'true') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper للـ transactions
const getClient = async () => {
  return await pool.connect();
};

// إغلاق نظيف عند الخروج
const shutdown = async () => {
  try {
    await pool.end();
    console.log('🧹 DB pool closed');
  } catch (e) {
    console.error('Error closing DB pool:', e);
  }
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = {
  pool,
  connectDB,
  query,
  getClient,
};
