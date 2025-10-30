const { Server } = require('socket.io');
const { verifyToken } = require('@clerk/backend');
const { pool } = require('../services/db');
const { clerkClient, getOrCreateDevUser } = require('../services/clerk');
const { getOrCreateTopicWithQuestions } = require('../utils/topics');

// Polyfill fetch globally (for correction service)
global.fetch = global.fetch || require('node-fetch');

let generateCorrection = async (text) => ({
  feedback: 'OK', corrected: text, fluency:60, grammar:60, vocab:60, issues:[]
});
try {
  const svc = require('../services/correction');
  if (typeof svc.generateCorrection === 'function') generateCorrection = svc.generateCorrection;
} catch {}

function allowOrigin(origin, cb) {
  if (!origin) return cb(null, true);
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
  if (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL)) return cb(null, true);
  cb(new Error('Not allowed by CORS'));
}

// Helper functions
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

async function loadSessionSummary(sessionId, userId) {
  const basics = await pool.query(
    `SELECT s.id, s.started_at, s.completed_at, s.status,
            t.title_en, t.level, t.day_number
     FROM sessions s
     JOIN daily_topics t ON t.id = s.topic_id
     WHERE s.id=$1 AND s.user_id=$2`,
    [sessionId, userId]
  );
  if (!basics.rows.length) return null;

  const rows = await pool.query(
    `SELECT tq.question_idx, tq.prompt_en,
            (SELECT text FROM utterances u
             WHERE u.attempt_id=a.id AND u.role='user'
             ORDER BY created_at DESC LIMIT 1) AS user_text,
            (SELECT feedback FROM corrections c
             WHERE c.attempt_id=a.id) AS feedback,
            (SELECT fluency_score FROM corrections c WHERE c.attempt_id=a.id) AS fluency_score,
            (SELECT grammar_score FROM corrections c WHERE c.attempt_id=a.id) AS grammar_score,
            (SELECT vocab_score   FROM corrections c WHERE c.attempt_id=a.id) AS vocab_score
     FROM attempts a
     JOIN topic_questions tq ON tq.id = a.question_id
     WHERE a.session_id=$1
     ORDER BY tq.question_idx ASC`,
    [sessionId]
  );

  return { session: basics.rows[0], attempts: rows.rows };
}

function attachRealtime(server) {
  const io = new Server(server, {
    cors: { origin: allowOrigin, credentials: true },
    path: '/socket.io',
  });

  // WebSocket Auth
  io.use(async (socket, next) => {
    if (process.env.SKIP_WS_AUTH === '1') {
      try {
        const dev = await getOrCreateDevUser();
        socket.data.uuidUserId = dev.id;
        return next();
      } catch (e) {
        return next(e);
      }
    }

    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '');
      if (!token) throw new Error('Missing token');

      const keyEnv = process.env.CLERK_JWT_KEY || '';
      const jwtKey = keyEnv.startsWith('-----BEGIN') ? keyEnv : undefined;
      const aud = process.env.CLERK_AUD || process.env.FRONTEND_URL || undefined;

      const session = await verifyToken(token, {
        jwtKey,
        authorizedParties: [aud].filter(Boolean),
      });

      const clerkId = session?.sub || session?.claims?.sub;
      if (!clerkId) throw new Error('WS auth: missing sub');

      // جلب من Clerk لضمان الاسم والبريد الصحيحين
      const u = await clerkClient.users.getUser(clerkId);
      const email = u?.primaryEmailAddress?.emailAddress;
      const firstName = u?.firstName || 'Clerk';
      const lastName = u?.lastName || 'User';
      if (!email) throw new Error('WS auth: missing primary email');

      // ربط صف قديم بنفس البريد إن وجد
      await pool.query(
        `UPDATE users
           SET clerk_user_id = $1
         WHERE email = $2
           AND (clerk_user_id IS NULL OR clerk_user_id = '')`,
        [clerkId, email]
      );

      // upsert على clerk_user_id
      const up = await pool.query(
        `INSERT INTO users (clerk_user_id, first_name, last_name, email, password_hash, is_active, last_active)
         VALUES ($1,$2,$3,$4,'clerk_managed', TRUE, NOW())
         ON CONFLICT (clerk_user_id) DO UPDATE
           SET first_name = EXCLUDED.first_name,
               last_name  = EXCLUDED.last_name,
               email      = EXCLUDED.email,
               is_active  = TRUE,
               last_active= NOW()
         RETURNING id;`,
        [clerkId, firstName, lastName, email]
      );

      socket.data.uuidUserId = up.rows[0].id;
      next();
    } catch (e) {
      console.error('WS verify error:', e?.message || e);
      next(e);
    }
  });

  // Realtime WS Handlers
  io.on('connection', (socket) => {
    socket.on('start_day', async ({ dayNumber = 1 }) => {
      try {
        const uuidUserId = socket.data.uuidUserId || (await getOrCreateDevUser()).id;
        const { topic, questions, vocab } = await getOrCreateTopicWithQuestions(Number(dayNumber));

        const s = await pool.query(
          `INSERT INTO sessions (user_id, topic_id, started_at, status)
           VALUES ($1,$2,NOW(),'active')
           ON CONFLICT (user_id, topic_id)
           DO UPDATE SET started_at = NOW(), status='active'
           RETURNING *`,
          [uuidUserId, topic.id]
        );
        const session = s.rows[0];

        io.to(socket.id).emit('system_say', { text: 'Awesome! Great decision to study today.' });
        io.to(socket.id).emit('system_say', {
          text: `Day ${topic.day_number} — Topic: ${topic.title_en} (Level ${topic.level}).`,
        });
        io.to(socket.id).emit('session_ready', { sessionId: session.id, dayNumber: topic.day_number });
        io.to(socket.id).emit('topic_vocab', {
          dayNumber: topic.day_number,
          vocab: Array.isArray(vocab) ? vocab : [],
        });

        const askWithTimer = async (qIndex) => {
          const q = questions.find((x) => x.question_idx === qIndex);
          if (!q) {
            const payload = await loadSessionSummary(session.id, uuidUserId);
            io.to(socket.id).emit('lesson_finished', { sessionId: session.id });
            if (payload) io.to(socket.id).emit('summary_ready', payload);
            return;
          }

          const attempt = await ensureAttempt(session.id, qIndex);
          await createAiUtterance(attempt.id, `Q${qIndex}: ${q.prompt_en}`);

          io.to(socket.id).emit('ask_question', {
            sessionId: session.id,
            questionIdx: qIndex,
            prompt: q.prompt_en,
            seconds: 10,
          });
        };

        await askWithTimer(1);

        socket.on('time_up', ({ questionIdx }) => {
          io.to(socket.id).emit('time_up', { questionIdx });
        });

        socket.on('user_final_text', async ({ sessionId, questionIdx, text, mode, durationSec }) => {
          try {
            const attempt = await ensureAttempt(String(sessionId), Number(questionIdx));
            await createUserUtterance(attempt.id, String(text || ''));

            const corr = await generateCorrection(String(text || ''));

            const isSpoken = String(mode || '').toLowerCase() === 'spoken';
            let speakingBlock = '';
            let filteredIssues = corr.issues || [];

            if (isSpoken) {
              const noise = /(capitalize|capitalization|upper case|question mark|punctuation|comma|period)/i;
              filteredIssues = filteredIssues.filter((it) => !noise.test(`${it.type || ''} ${it.note || ''}`));

              const raw = String(text || '').trim();
              const words = raw.split(/\s+/).filter(Boolean);
              const secs = Math.max(1, Number(durationSec || 0));
              const wpm = Math.round((words.length / secs) * 60);

              const fillers = (raw.match(/\b(um+|uh+|erm+|like|you know)\b/gi) || []).length;
              const repeats = (raw.match(/\b(\w+)\s+\1\b/gi) || []).length;
              const longSentences = raw.split(/[.!?]+/).filter((s) => s.trim().split(/\s+/).length > 20).length;

              const tips = [];
              tips.push(`Speaking speed ≈ ${wpm} wpm (target 110–160 for clarity).`);
              if (fillers > 0) tips.push(`Try fewer fillers (found ~${fillers}). Pause instead of "um/uh/like".`);
              if (repeats > 0) tips.push(`A bit of repetition detected (~${repeats}). Finish ideas then move on.`);
              if (longSentences > 0) tips.push(`Some sentences are long. Break ideas into shorter chunks.`);

              speakingBlock = 'Speaking tips:\n- ' + tips.join('\n- ');
            }

            const prettyFeedback = String(corr.feedback || '').replace(/^feedback:\s*/i, '').trim();
            const correctedPart = corr.corrected ? `\n\nCorrected (for reference):\n${corr.corrected}` : '';
            const issuesPart = filteredIssues.length
              ? '\n\nKey issues:\n' +
                filteredIssues
                  .slice(0, 10)
                  .map((it, i) => `- ${i + 1}. [${it.type || 'grammar'}] "${it.before}" → "${it.after}" — ${it.note || ''}`)
                  .join('\n')
              : '';

            const finalFeedback = (isSpoken
              ? `Speaking feedback: ${prettyFeedback || 'Good speaking effort.'}\n\n${speakingBlock}${correctedPart}${issuesPart}`
              : `Feedback: ${prettyFeedback || 'Good effort. See suggested fixes.'}${correctedPart}${issuesPart}`
            )
              .replace(/\n{3,}/g, '\n\n')
              .slice(0, 3000);

            await pool.query(
              `INSERT INTO corrections (attempt_id, feedback, fluency_score, grammar_score, vocab_score)
               VALUES ($1,$2,$3,$4,$5)
               ON CONFLICT (attempt_id) DO UPDATE
               SET feedback=$2, fluency_score=$3, grammar_score=$4, vocab_score=$5`,
              [attempt.id, finalFeedback, corr.fluency, corr.grammar, corr.vocab]
            );

            await createAiUtterance(attempt.id, `Feedback:\n${finalFeedback}`);

            io.to(socket.id).emit('feedback', {
              questionIdx,
              transcript: text || '',
              correction: { ...corr, issues: filteredIssues, feedback: finalFeedback },
            });

            const nextIdx = Number(questionIdx) + 1;
            if (nextIdx <= 6) {
              io.to(socket.id).emit('awaiting_next', { nextIdx });
              const onReady = async (payload = {}) => {
                if (Number(payload.afterQuestion) === Number(questionIdx)) {
                  socket.off('ready_for_next', onReady);
                  await askWithTimer(nextIdx);
                }
              };
              socket.on('ready_for_next', onReady);
            } else {
              await pool.query(`UPDATE sessions SET status='completed', completed_at=NOW() WHERE id=$1`, [sessionId]);
              io.to(socket.id).emit('lesson_finished', { sessionId });
            }
          } catch (e) {
            io.to(socket.id).emit('error', { message: e.message || 'text correction failed' });
          }
        });
      } catch (e) {
        io.to(socket.id).emit('error', { message: e.message || 'start_day_failed' });
      }
    });
  });

  return io;
}

module.exports = { attachRealtime };

