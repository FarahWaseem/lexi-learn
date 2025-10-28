const express = require('express');
const router = express.Router();
const { pool } = require('../services/db');
const { requireAuth } = require('../services/clerk');
const { requireUser } = require('../services/clerk');
const { getOrCreateTopicWithQuestions } = require('../utils/topics');

// GET /api/topics
router.get('/topics', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '6', 10)));
    const offset = (page - 1) * pageSize;

    const params = [];
    let where = '';
    if (q) { params.push(`%${q}%`); where = `WHERE title_en ILIKE $${params.length}`; }

    const countSql = `SELECT COUNT(*)::int AS total FROM daily_topics ${where}`;
    const { rows: countRows } = await pool.query(countSql, params);
    const total = countRows[0]?.total ?? 0;

    params.push(pageSize, offset);
    const itemsSql = `
      SELECT id, day_number AS day, title_en AS topic, level AS cefr, estimated_minutes
      FROM daily_topics
      ${where}
      ORDER BY day_number
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;
    const { rows: items } = await pool.query(itemsSql, params);
    res.json({ items, total, page, pageSize });
  } catch (err) {
    console.error('GET /api/topics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/day/:day
router.get('/day/:day', async (req, res) => {
  try {
    const dayNumber = Number(req.params.day) || 1;
    const { topic, questions, vocab } = await getOrCreateTopicWithQuestions(dayNumber);
    res.json({ topic, questions, vocab });
  } catch (e) {
    res.status(500).json({ error: e.message || 'failed' });
  }
});

// GET /api/my/topics
router.get('/my/topics', requireAuth(), async (req, res) => {
  try {
    const uuidUserId = await requireUser(req);
    const { rows } = await pool.query(`
      SELECT
        dt.day_number AS day,
        dt.title_en   AS topic,
        dt.level      AS cefr,
        (SELECT s.id FROM sessions s
           WHERE s.user_id=$1 AND s.topic_id=dt.id
           ORDER BY s.completed_at DESC NULLS LAST, s.started_at DESC
           LIMIT 1) AS session_id,
        EXISTS (SELECT 1 FROM sessions s WHERE s.user_id=$1 AND s.topic_id=dt.id AND s.status='completed') AS is_completed
      FROM daily_topics dt
      ORDER BY dt.day_number ASC
    `, [uuidUserId]);
    res.json({ ok: true, items: rows, total: rows.length });
  } catch (e) {
    console.error('GET /api/my/topics failed:', e);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET /api/sessions/last?day=#
router.get('/sessions/last', requireAuth(), async (req, res) => {
  try {
    const uuidUserId = await requireUser(req);
    const day = Number(req.query.day || 0);
    if (!day) return res.status(400).json({ ok: false, error: 'Missing day' });

    const q = `
      SELECT s.id AS session_id
      FROM sessions s
      JOIN daily_topics dt ON dt.id = s.topic_id
      WHERE s.user_id = $1 AND dt.day_number = $2
      ORDER BY s.completed_at DESC NULLS LAST, s.started_at DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [uuidUserId, day]);
    if (!rows.length) return res.status(404).json({ ok: false, error: 'No session for this day' });
    res.json({ ok: true, sessionId: rows[0].session_id });
  } catch (e) {
    console.error('GET /api/sessions/last failed:', e);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET /api/db/info
router.get('/db/info', async (_req, res) => {
  try {
    const r = await pool.query(
      "SELECT current_database() AS db, inet_server_addr() AS host, inet_server_port() AS port;"
    );
    res.json({ ok: true, ...r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;

