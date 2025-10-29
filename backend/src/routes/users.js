const express = require('express');
const router = express.Router();
const { requireAuth, getAuth, requireUser, resolveUsername } = require('../services/clerk');
const { pool } = require('../services/db');

// GET /api/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = await requireUser(req);
    const [{ rows: [dbUser] }, uname] = await Promise.all([
      pool.query(`SELECT id, first_name, last_name, email FROM users WHERE id=$1`, [userId]),
      resolveUsername(auth.userId),
    ]);
    res.json({ ok: true, user: { ...dbUser, username: uname }, service: 'lexi backend v1.1' });
  } catch (err) {
    console.error('❌ /api/me error:', err);
    res.status(401).json({ ok: false, error: err.message });
  }
});

module.exports = router;

