const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');

const router = express.Router();
const { pool } = require('../services/db');
const { requireAuth, requireUser } = require('../services/clerk');
const { buildDetailedFeedback } = require('../utils/feedback');

let generateCorrection = async (text) => ({
  feedback: 'OK', corrected: text, fluency:60, grammar:60, vocab:60, issues:[]
});
try {
  const svc = require('../services/correction');
  if (typeof svc.generateCorrection === 'function') generateCorrection = svc.generateCorrection;
} catch {}

const UPLOADS = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

const audioStorage = multer.diskStorage({
  destination: (_req,_file,cb)=>cb(null, UPLOADS),
  filename: (_req,file,cb)=>cb(null, Date.now() + '-' + file.originalname),
});
const audioUpload = multer({ storage: audioStorage });

// Helper functions from original server
async function ensureAttempt(sessionId, questionIdx) {
  const q = await pool.query(
    `SELECT tq.id AS question_id
     FROM sessions s
     JOIN daily_topics dt ON dt.id = s.topic_id
     JOIN topic_questions tq ON tq.topic_id = dt.id AND tq.question_idx = $2
     WHERE s.id = $1
     LIMIT 1`,
    [sessionId, Number(questionIdx)]
  );
  if (!q.rows[0]) throw new Error("Question not found for this session");
  const questionId = q.rows[0].question_id;

  const ins = await pool.query(
    `INSERT INTO attempts (session_id, question_id, started_at)
     VALUES ($1,$2, NOW())
     ON CONFLICT (session_id, question_id) DO NOTHING
     RETURNING *`,
    [sessionId, questionId]
  );
  if (ins.rows && ins.rows[0]) return ins.rows[0];

  const sel = await pool.query(
    `SELECT * FROM attempts WHERE session_id=$1 AND question_id=$2 LIMIT 1`,
    [sessionId, questionId]
  );
  return sel.rows[0];
}

async function createUserUtterance(attemptId, text) {
  const u = await pool.query(
    `INSERT INTO utterances (attempt_id, role, text)
     VALUES ($1,'user',$2) RETURNING *`,
    [attemptId, String(text || "")]
  );
  return u.rows[0];
}

async function createAiUtterance(attemptId, text) {
  const u = await pool.query(
    `INSERT INTO utterances (attempt_id, role, text)
     VALUES ($1,'ai',$2) RETURNING *`,
    [attemptId, String(text || "")]
  );
  return u.rows[0];
}

// POST /api/utterances/text
router.post('/utterances/text', requireAuth, async (req, res) => {
  try {
    await requireUser(req);
    const { sessionId, questionIdx, text } = req.body || {};
    if (!sessionId || !questionIdx) return res.status(400).json({ error: 'sessionId, questionIdx required' });

    const attempt = await ensureAttempt(String(sessionId), Number(questionIdx));
    await createUserUtterance(attempt.id, String(text || ""));

    const corr = await generateCorrection(String(text || ""));
    const detailedFeedback = buildDetailedFeedback(corr);

    await pool.query(
      `INSERT INTO corrections (attempt_id, feedback, fluency_score, grammar_score, vocab_score)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (attempt_id) DO UPDATE
       SET feedback=$2, fluency_score=$3, grammar_score=$4, vocab_score=$5`,
      [attempt.id, detailedFeedback, corr.fluency, corr.grammar, corr.vocab]
    );

    // خزّن الفيدباك AI
    await createAiUtterance(attempt.id, `Feedback:\n${detailedFeedback}`);

    res.json({
      transcript: text || "",
      correction: { ...corr, feedback: detailedFeedback },
    });
  } catch (e) {
    console.error('POST /api/utterances/text', e);
    res.status(500).json({ error: e.message || 'text correction failed' });
  }
});

// POST /api/utterances/audio
router.post('/utterances/audio', requireAuth, audioUpload.single('audio'), async (req, res) => {
  try {
    await requireUser(req);
    const { sessionId, questionIdx } = req.body || {};
    if (!sessionId || !questionIdx) return res.status(400).json({ error: 'sessionId, questionIdx required' });
    if (!req.file) return res.status(400).json({ error: 'audio file required' });

    const inputPath = req.file.path;
    const wavPath = inputPath.replace(path.extname(inputPath), '.wav');

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath).audioChannels(1).audioFrequency(16000).toFormat('wav')
        .on('end', resolve).on('error', reject).save(wavPath);
    });

    const transcript = "(audio received)";

    const attempt = await ensureAttempt(String(sessionId), Number(questionIdx));
    await createUserUtterance(attempt.id, transcript);

    const corr = await generateCorrection(String(transcript || ""));
    const detailedFeedback = buildDetailedFeedback(corr);

    await pool.query(
      `INSERT INTO corrections (attempt_id, feedback, fluency_score, grammar_score, vocab_score)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (attempt_id) DO UPDATE
       SET feedback=$2, fluency_score=$3, grammar_score=$4, vocab_score=$5`,
      [attempt.id, detailedFeedback, corr.fluency, corr.grammar, corr.vocab]
    );

    // خزّن الفيدباك AI
    await createAiUtterance(attempt.id, `Feedback:\n${detailedFeedback}`);

    res.json({ transcript, correction: { ...corr, feedback: detailedFeedback } });
  } catch (e) {
    console.error('POST /api/utterances/audio', e);
    res.status(500).json({ error: e.message || 'upload failed' });
  }
});

// POST /api/correct (simple standalone correction)
router.post('/correct', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error:'Missing text' });
    const corr = await generateCorrection(String(text));
    const feedback = buildDetailedFeedback(corr);
    res.json({ original: text, correction: { ...corr, feedback } });
  } catch (e) {
    console.error('POST /api/correct', e);
    res.status(500).json({ error: e.message || 'correction failed' });
  }
});

module.exports = router;

