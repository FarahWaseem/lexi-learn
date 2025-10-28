// server.js — LexiLearn v1.1 (UUID users, attempts/utterances/corrections) — CLEAN FINAL

require("dotenv").config();

// ---------- Clerk: Express (middleware/auth) + Backend (verifyToken/client) ----------
const { clerkMiddleware, requireAuth, getAuth } = require("@clerk/express");
const { createClerkClient, verifyToken } = require("@clerk/backend");

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// 👇 Polyfill fetch globally (so services/correction can use it)
global.fetch = global.fetch || require("node-fetch");

const PDFDocument = require("pdfkit");
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const http = require("http");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const { Pool } = require("pg");
const { generateCorrection } = require("./src/services/correction"); // ✅ Gemini + LT fallback

// ---------- App / Server / Socket ----------
const app = express();
const server = http.createServer(app);
const { Server: IOServer } = require("socket.io");
const io = new IOServer(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
      if (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");
const UPLOADS = path.join(__dirname, "uploads");

// ---------- DB ----------
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ---------- Optional topics seed ----------
let topicsSeed = [];
try {
  topicsSeed = require(path.join(__dirname, "topics.json")); // 60 days × 6 questions
} catch {
  console.warn("⚠️ topics.json not found. Will fallback to defaults.");
}

// ---------- Middleware / CORS / Logs ----------
// مهم: فعّل clerkMiddleware مبكّرًا ليضيف req.auth لكل الطلبات
app.use(clerkMiddleware());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
      if (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC));

// ---------- Utils ----------
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

function buildDetailedFeedback({ feedback, corrected, issues }) {
  const raw = String(feedback || "").trim().replace(/^feedback:\s*/i, "").trim();
  const headerText = raw || "Good effort. See suggested fixes.";
  const correctedPart =
    corrected && String(corrected).trim() ? `\n\nCorrected:\n${String(corrected).trim()}` : "";
  const issuesPart =
    Array.isArray(issues) && issues.length
      ? `\n\nIssues:\n` +
        issues
          .slice(0, 10)
          .map(
            (it, i) =>
              `- ${i + 1}. [${it.type || "grammar"}] "${it.before || ""}" → "${it.after || ""}" — ${it.note || ""}`
          )
          .join("\n")
      : "";
  return (headerText + correctedPart + issuesPart).replace(/\n{3,}/g, "\n\n").slice(0, 4000);
}

async function resolveUsername(userId) {
  try {
    const u = await clerkClient.users.getUser(userId);
    const uname =
      u?.username ||
      [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() ||
      u?.primaryEmailAddress?.emailAddress ||
      "User";
    return uname;
  } catch {
    return "User";
  }
}

async function requireUser(req) {
  const auth = (req && req.auth) || getAuth(req) || {};
  const clerkId = auth.userId || auth.user_id;
  if (!clerkId) throw new Error("Auth required: missing Clerk userId");

  // جِب بيانات المستخدم من Clerk مباشرة (أضمن من الـ claims)
  const u = await clerkClient.users.getUser(clerkId);
  const email = u?.primaryEmailAddress?.emailAddress;
  const firstName = u?.firstName || "Clerk";
  const lastName = u?.lastName || "User";

  if (!email) throw new Error("Auth required: missing primary email");

  // لو في صف قديم بنفس البريد بدون clerk_user_id، اربطه الآن
  await pool.query(
    `UPDATE users
       SET clerk_user_id = $1
     WHERE email = $2
       AND (clerk_user_id IS NULL OR clerk_user_id = '')
    `,
    [clerkId, email]
  );

  // upsert باستخدام clerk_user_id
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

  return up.rows[0].id;
}

// Dev helper (WS فقط عند SKIP_WS_AUTH=1)
async function getOrCreateDevUser() {
  const email = "dev@local";
  const sel = await pool.query(`SELECT id FROM users WHERE email=$1 LIMIT 1`, [email]);
  if (sel.rows && sel.rows[0]) return { id: sel.rows[0].id };
  const ins = await pool.query(
    `INSERT INTO users (first_name,last_name,email,password_hash, is_active, last_active)
     VALUES ('Dev','User',$1,'clerk_managed', TRUE, NOW()) RETURNING id;`,
    [email]
  );
  return { id: ins.rows[0].id };
}

/** احضار topic + أسئلته (من DB أو seed) + vocab من topic_words إن توفّر */
async function getOrCreateTopicWithQuestions(dayNumber) {
  const dn = Number(dayNumber);
  const daySeed = topicsSeed.find((t) => t.day_number === dn);
  const title = daySeed?.title_en || `Daily Conversation Day ${dn}`;
  const level = daySeed?.level || (dn <= 10 ? "A1" : dn <= 20 ? "A2" : dn <= 40 ? "B1" : "B2");
  const est = daySeed?.estimated_minutes ?? 10;

  const topicIns = await pool.query(
    `INSERT INTO daily_topics (day_number, title_en, level, estimated_minutes)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (day_number) DO NOTHING
     RETURNING *`,
    [dn, title, level, est]
  );
  const topic =
    topicIns.rows[0] ||
    (await pool.query(`SELECT * FROM daily_topics WHERE day_number=$1 LIMIT 1`, [dn])).rows[0];

  // Ensure 6 questions
  const existingQ = await pool.query(
    `SELECT id, question_idx, prompt_en
     FROM topic_questions
     WHERE topic_id=$1
     ORDER BY question_idx ASC`,
    [topic.id]
  );
  if (!existingQ.rows.length) {
    const defaults =
      (daySeed?.questions || []).map((q) => q.prompt_en) || [
        "Warm-up: In one sentence, what is today's topic about?",
        "Share a short example from your life related to the topic.",
        "Describe a problem related to the topic and a simple solution.",
        "Give your opinion about the topic with one reason.",
        "Compare two options related to the topic (2–3 sentences).",
        "Closing: Summarize your main point in one sentence.",
      ];
    for (let i = 0; i < Math.min(6, defaults.length); i++) {
      await pool.query(
        `INSERT INTO topic_questions (topic_id, question_idx, prompt_en)
         VALUES ($1,$2,$3)
         ON CONFLICT DO NOTHING`,
        [topic.id, i + 1, defaults[i]]
      );
    }
  }

  const qrows = await pool.query(
    `SELECT id, question_idx, prompt_en
     FROM topic_questions
     WHERE topic_id=$1
     ORDER BY question_idx`,
    [topic.id]
  );

  // vocab (اختياري): من topic_words
  const vrows = await pool.query(
    `SELECT term AS word, meaning, example, audio_url
     FROM topic_words
     WHERE topic_id=$1
     ORDER BY id`,
    [topic.id]
  );

  return { topic, questions: qrows.rows, vocab: vrows.rows };
}

// ينشئ Attempt لسؤال ضمن جلسة
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

// ✅ جديد: خزّن رسائل الـAI (السؤال/التغذية الراجعة)
async function createAiUtterance(attemptId, text) {
  const u = await pool.query(
    `INSERT INTO utterances (attempt_id, role, text)
     VALUES ($1,'ai',$2) RETURNING *`,
    [attemptId, String(text || "")]
  );
  return u.rows[0];
}

/** helper: read summary payload for a session (same as GET /summary) */
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

// ✅ تواريخ آمنة للـ PDFKit
function asDate(v) {
  if (v instanceof Date) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!isNaN(d)) return d;
  }
  return new Date();
}

// ✅ عرض التاريخ بشكل لطيف في النص
function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (isNaN(d)) return "-";
  return d.toLocaleString(); // ثابت ممكن: toLocaleString("en-GB",{hour12:false})
}

// ---------- Basic REST routes ----------
app.get("/", (_req, res) => res.json({ ok: true, service: "lexi backend v1.1" }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Topics list for Lessons grid
app.get("/api/topics", async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || "6", 10)));
    const offset = (page - 1) * pageSize;

    const params = [];
    let where = "";
    if (q) {
      params.push(`%${q}%`);
      where = `WHERE title_en ILIKE $${params.length}`;
    }

    const countSql = `SELECT COUNT(*)::int AS total FROM daily_topics ${where}`;
    const { rows: countRows } = await pool.query(countSql, params);
    const total = countRows[0]?.total ?? 0;

    params.push(pageSize);
    params.push(offset);
    const itemsSql = `
      SELECT id,
             day_number AS day,
             title_en   AS topic,
             level      AS cefr,
             estimated_minutes
      FROM daily_topics
      ${where}
      ORDER BY day_number
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;
    const { rows: items } = await pool.query(itemsSql, params);

    res.json({ items, total, page, pageSize });
  } catch (err) {
    console.error("GET /api/topics error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DB info
app.get("/api/db/info", async (_req, res) => {
  try {
    const r = await pool.query(
      "SELECT current_database() AS db, inet_server_addr() AS host, inet_server_port() AS port;"
    );
    res.json({ ok: true, ...r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Clerk-aware upsert -> يرجّع بيانات المستخدم (+ username من Clerk)
app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = await requireUser(req);
    const [
      {
        rows: [dbUser],
      },
      uname,
    ] = await Promise.all([
      pool.query(`SELECT id, first_name, last_name, email FROM users WHERE id=$1`, [userId]),
      resolveUsername(auth.userId),
    ]);
    res.json({ ok: true, user: { ...dbUser, username: uname }, service: "lexi backend v1.1" });
  } catch (err) {
    console.error("❌ /api/me error:", err);
    res.status(401).json({ ok: false, error: err.message });
  }
});

// Day helper (topic+questions+vocab)
app.get("/api/day/:day", async (req, res) => {
  try {
    const dayNumber = Number(req.params.day) || 1;
    const { topic, questions, vocab } = await getOrCreateTopicWithQuestions(dayNumber);
    res.json({ topic, questions, vocab });
  } catch (e) {
    res.status(500).json({ error: e.message || "failed" });
  }
});

// ---------- Sessions API ----------
const startHandler = async (req, res) => {
  try {
    const uuidUserId = await requireUser(req);
    const dayNumber = Number(req.body?.dayNumber) || 1;
    const { topic, questions, vocab } = await getOrCreateTopicWithQuestions(dayNumber);

    const s = await pool.query(
      `INSERT INTO sessions (user_id, topic_id, started_at, status)
       VALUES ($1,$2,NOW(),'active')
       ON CONFLICT (user_id, topic_id)
       DO UPDATE SET started_at = NOW(), status = 'active'
       RETURNING *`,
      [uuidUserId, topic.id]
    );
    const sessionRow = s.rows[0];

    const openingMessage = `Awesome! Let’s study today. Topic: ${topic.title_en} (Level ${topic.level}).`;
    const firstQuestion = questions[0] || null;

    console.log("✅ session started id=", sessionRow.id);
    return res.status(201).json({
      session: sessionRow,
      topic,
      questions,
      vocab,
      openingMessage,
      firstQuestion,
    });
  } catch (e) {
    console.error("POST /api/sessions/start", e);
    return res.status(500).json({ error: e.message || "start failed" });
  }
};
app.post("/api/sessions/start", requireAuth, startHandler);
app.post("/api/sessions", requireAuth(), startHandler);

// ---------- Utterances: audio upload (optional) ----------
const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const audioUpload = multer({ storage: audioStorage });

app.post("/api/utterances/audio", requireAuth, audioUpload.single("audio"), async (req, res) => {
  try {
    await requireUser(req);
    const { sessionId, questionIdx } = req.body || {};
    if (!sessionId || !questionIdx) return res.status(400).json({ error: "sessionId, questionIdx required" });
    if (!req.file) return res.status(400).json({ error: "audio file required" });

    const inputPath = req.file.path;
    const wavPath = inputPath.replace(path.extname(inputPath), ".wav");

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath).audioChannels(1).audioFrequency(16000).toFormat("wav").on("end", resolve).on("error", reject).save(wavPath);
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

    // 🟢 خزّن الفيدباك AI
    await createAiUtterance(attempt.id, `Feedback:\n${detailedFeedback}`);

    res.json({ transcript, correction: { ...corr, feedback: detailedFeedback } });
  } catch (e) {
    console.error("POST /api/utterances/audio", e);
    res.status(500).json({ error: e.message || "upload failed" });
  }
});

// ---------- Utterances: text correction ----------
app.post("/api/utterances/text", requireAuth, async (req, res) => {
  try {
    await requireUser(req);
    const { sessionId, questionIdx, text } = req.body || {};
    if (!sessionId || !questionIdx) return res.status(400).json({ error: "sessionId, questionIdx required" });

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

    // 🟢 خزّن الفيدباك AI
    await createAiUtterance(attempt.id, `Feedback:\n${detailedFeedback}`);

    res.json({
      transcript: text || "",
      correction: { ...corr, feedback: detailedFeedback },
    });
  } catch (e) {
    console.error("POST /api/utterances/text", e);
    res.status(500).json({ error: e.message || "text correction failed" });
  }
});

// ---------- Finish session ----------
app.post("/api/sessions/:id/finish", requireAuth, async (req, res) => {
  try {
    const uuidUserId = await requireUser(req);
    const { id } = req.params;
    await pool.query(`UPDATE sessions SET status='completed', completed_at=NOW() WHERE id=$1 AND user_id=$2`, [
      id,
      uuidUserId,
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error("POST /api/sessions/:id/finish", e);
    res.status(500).json({ error: e.message || "finish failed" });
  }
});

// ---------- Summary ----------
app.get("/api/sessions/:id/summary", requireAuth(), async (req, res) => {
  try {
    const uuidUserId = await requireUser(req);
    const { id } = req.params;
    const payload = await loadSessionSummary(id, uuidUserId);
    if (!payload) return res.status(404).json({ error: "Not found" });
    res.json(payload);
  } catch (e) {
    console.error("GET /api/sessions/:id/summary", e);
    res.status(500).json({ error: e.message || "summary failed" });
  }
});

app.get("/api/my/topics", requireAuth(), async (req, res) => {
  try {
    const uuidUserId = await requireUser(req); // ← هذا نص UUID
    const { rows } = await pool.query(
      `
      SELECT
        dt.day_number            AS day,
        dt.title_en              AS topic,
        dt.level                 AS cefr,
        (
          SELECT s.id
          FROM sessions s
          WHERE s.user_id = $1 AND s.topic_id = dt.id
          ORDER BY s.completed_at DESC NULLS LAST, s.started_at DESC
          LIMIT 1
        )                        AS session_id,
        EXISTS (
          SELECT 1 FROM sessions s
          WHERE s.user_id = $1 AND s.topic_id = dt.id AND s.status = 'completed'
        )                        AS is_completed
      FROM daily_topics dt
      ORDER BY dt.day_number ASC
    `,
      [uuidUserId]
    ); //  ← استخدمي uuidUserId
    res.json({ ok: true, items: rows, total: rows.length });
  } catch (e) {
    console.error("GET /api/my/topics failed:", e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

app.get("/api/sessions/last", requireAuth(), async (req, res) => {
  try {
    const uuidUserId = await requireUser(req);
    const day = Number(req.query.day || 0);
    if (!day) return res.status(400).json({ ok: false, error: "Missing day" });

    const q = `
      SELECT s.id AS session_id
      FROM sessions s
      JOIN daily_topics dt ON dt.id = s.topic_id
      WHERE s.user_id = $1 AND dt.day_number = $2
      ORDER BY s.completed_at DESC NULLS LAST, s.started_at DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [uuidUserId, day]);
    if (!rows.length) return res.status(404).json({ ok: false, error: "No session for this day" });
    res.json({ ok: true, sessionId: rows[0].session_id });
  } catch (e) {
    console.error("GET /api/sessions/last failed:", e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// ---------- Export PDF (Pretty) ----------
app.get("/api/sessions/:id/export.pdf", requireAuth(), async (req, res) => {
  // جهّز الهيدر بس قبل ما نبدأ الستريم فعليًا
  res.setHeader("Content-Type", "application/pdf");

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  let pdfErrored = false;
  doc.on("error", (err) => {
    pdfErrored = true;
    console.error("PDF error:", err?.message || err);
    try {
      res.end();
    } catch {}
  });

  try {
    const auth = getAuth(req);
    const uname = await resolveUsername(auth.userId);
    const uuidUserId = await requireUser(req);
    const { id } = req.params;

    // الميتا
    const s = await pool.query(
      `SELECT s.id, s.started_at, s.completed_at, s.status,
              t.title_en, t.day_number, t.level
       FROM sessions s
       JOIN daily_topics t ON t.id = s.topic_id
       WHERE s.id=$1 AND s.user_id=$2`,
      [id, uuidUserId]
    );
    const session = s.rows[0];
    if (!session) return res.status(404).json({ error: "Not found" });

    // الأسئلة + آخر جواب للمستخدم + التصحيح (feedback) + السكورات
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
      [id]
    );

    // 🟢 كل المحادثة لكل سؤال (AI + User) بترتيب زمني
    const convo = await pool.query(
      `SELECT
         tq.question_idx,
         u.role,
         u.text,
         u.created_at
       FROM attempts a
       JOIN topic_questions tq ON tq.id = a.question_id
       JOIN utterances u       ON u.attempt_id = a.id
       WHERE a.session_id = $1
       ORDER BY tq.question_idx ASC, u.created_at ASC`,
      [id]
    );
    const byQuestion = new Map();
    for (const row of convo.rows) {
      if (!byQuestion.has(row.question_idx)) byQuestion.set(row.question_idx, []);
      byQuestion.get(row.question_idx).push({
        role: row.role,
        text: row.text || "",
        at: row.created_at,
      });
    }

    // مفردات إضافية (اختياري)
    const extra = await pool.query(
      `SELECT tw.term AS word, COALESCE(tw.meaning, '') AS meaning
       FROM sessions s
       JOIN topic_words tw ON tw.topic_id = s.topic_id
       WHERE s.id = $1
       ORDER BY tw.id ASC
       LIMIT 8`,
      [id]
    );
    const vocab = extra.rows || [];

    // أداء إجمالي
    const scoreAgg = await pool.query(
      `SELECT ROUND(AVG((COALESCE(c.fluency_score,0)+COALESCE(c.grammar_score,0)+COALESCE(c.vocab_score,0))/3.0))::int AS overall
       FROM attempts a LEFT JOIN corrections c ON c.attempt_id=a.id
       WHERE a.session_id=$1`,
      [id]
    );
    const performance = Number(scoreAgg.rows[0]?.overall || 0);

    // نبدأ الستريم الآن بعد ما تأكّدنا من كل البيانات
    res.setHeader("Content-Disposition", `attachment; filename="lesson-${session.day_number}.pdf"`);
    doc.pipe(res);

    // معلومات المستند مع تواريخ سليمة
    doc.info = {
      Title: `Lesson Day ${session.day_number}`,
      Author: "LexiLearn",
      Subject: "Lesson Summary",
      CreationDate: asDate(session.started_at || Date.now()),
      ModDate: asDate(session.completed_at || Date.now()),
    };

    // خطوط
    // const arabicFont = path.join(PUBLIC, "fonts", "NotoNaskhArabic-Regular.ttf");
    // doc.font(fs.existsSync(arabicFont) ? arabicFont : "Helvetica");
    doc.font("Helvetica");

    // ألوان
    const ACCENT = "#2F855A";
    const MUTED = "#6B7280";
    const LINE = "#E5E7EB";

    // Helpers
    const drawLine = () => {
      doc.moveDown(0.5);
      doc.strokeColor(LINE).lineWidth(1).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
      doc.moveDown(0.8);
    };
    const sectionTitle = (title) => {
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor(ACCENT).text(title.toUpperCase());
      doc.moveDown(0.4);
    };
    const kv = (label, value) => {
      doc.fontSize(9).fillColor(MUTED).text(label);
      doc.fontSize(11).fillColor("#111827").text(value);
      doc.moveDown(0.2);
    };
    const scoreBar = (label, val) => {
      const maxW = doc.page.width - 160;
      const x = 52,
        y = doc.y + 2;
      const w = Math.max(0, Math.min(maxW, Math.round((val / 100) * maxW)));
      doc.fontSize(11).fillColor("#111827").text(`${label}: ${val}%`, 52, doc.y);
      doc.roundedRect(x, y + 16, maxW, 10, 5).fillAndStroke(LINE, LINE);
      doc.roundedRect(x, y + 16, w, 10, 5).fill(ACCENT);
      doc.moveDown(1.2);
    };
    const pill = (txt) => {
      const px = doc.x,
        py = doc.y;
      const padX = 8,
        padY = 3;
      const w = doc.widthOfString(txt) + padX * 2;
      const h = doc.currentLineHeight() + padY * 2;
      doc
        .save()
        .roundedRect(px, py, w, h, 8)
        .fillColor("#DCFCE7")
        .strokeColor("#BBF7D0")
        .lineWidth(1)
        .fillAndStroke()
        .fillColor("#166534")
        .text(txt, px + padX, py + padY)
        .restore();
      doc.moveDown(1.1);
    };
    const boxed = (title, body) => {
      const x = 52,
        y = doc.y,
        w = doc.page.width - 104;
      doc.save().roundedRect(x, y, w, 0, 12).clip();
      doc.fillColor("#111827").fontSize(12).text(title, x + 12, y + 10, { width: w - 24 });
      doc.moveDown(0.4);
      doc.fontSize(11).fillColor("#374151").text(body, x + 12, doc.y, { width: w - 24 });
      const hEnd = doc.y + 10;
      doc.restore();
      doc.roundedRect(x, y, w, hEnd - y, 12).lineWidth(1).strokeColor(LINE).stroke();
      doc.moveDown(0.6);
    };
    const vocabGrid = (items) => {
      if (!items?.length) return;
      sectionTitle("New Vocabulary");
      const cols = 2,
        gutter = 16;
      const usableW = doc.page.width - 104;
      const colW = (usableW - gutter) / cols;
      let cx = 52,
        cy = doc.y;
      items.forEach((it, i) => {
        if (i % cols === 0 && i > 0) {
          cx = 52;
          cy = doc.y + 6;
        }
        doc
          .save()
          .roundedRect(cx, cy, colW, 60, 10)
          .fillColor("#F9FAFB")
          .strokeColor(LINE)
          .lineWidth(1)
          .fillAndStroke()
          .fillColor("#111827")
          .fontSize(12)
          .text(it.word || "-", cx + 10, cy + 8, { width: colW - 20 })
          .fontSize(10)
          .fillColor(MUTED)
          .text((it.meaning || "").trim(), cx + 10, doc.y + 2, { width: colW - 20 })
          .restore();
        cx += colW + gutter;
        if (i % cols === cols - 1) doc.y = cy + 60;
      });
      doc.moveDown(0.6);
      drawLine();
    };
    const questionBlock = (q) => {
      // ✅ العنوان + السؤال + الجواب + التصحيح (feedback)
      doc.fontSize(13).fillColor("#111827").text(`Q${q.question_idx}: ${q.prompt_en}`, { underline: true });
      doc.moveDown(0.2);
      doc.fontSize(11).fillColor("#374151").text(`Your answer: ${q.user_text || "-"}`);
      if (q.feedback) {
        doc.moveDown(0.2);
        doc.fontSize(11).fillColor("#111827").text("Feedback:");
        doc.fontSize(11).fillColor("#374151").text(q.feedback);
      }
      const parts = [];
      if (q.fluency_score != null) parts.push(`Fluency ${q.fluency_score}`);
      if (q.grammar_score != null) parts.push(`Grammar ${q.grammar_score}`);
      if (q.vocab_score != null) parts.push(`Vocab ${q.vocab_score}`);
      if (parts.length) {
        doc.moveDown(0.2);
        parts.forEach((p) => pill(p));
      }
      drawLine();
      if (doc.y > doc.page.height - 120) doc.addPage();
    };

    // ====== بناء المستند ======
    // Header
    doc.save();
    doc.rect(40, 40, doc.page.width - 80, 70).fill(ACCENT);
    doc.fill("#fff")
      .fontSize(16)
      .text(`LexiLearn — Lesson Summary`, 52, 52, { width: doc.page.width - 104, align: "left" });
    doc.fontSize(12).text(`Student: ${uname}`, 52, 78, { width: doc.page.width - 104, align: "left" });
    doc.restore();

    doc.moveDown(2);
    doc.fontSize(18).fillColor("#111827").text(`Day ${session.day_number}: ${session.title_en || ""}  •  Level ${session.level}`);
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(MUTED).text(`Started: ${fmtDate(session.started_at)}     Completed: ${fmtDate(session.completed_at)}`);
    drawLine();

    // Overview
    sectionTitle("Overview");
    kv("Student", uname);
    kv("Lesson Title", session.title_en || "-");
    kv("Day / Level", `Day ${session.day_number} • Level ${session.level}`);
    kv("Status", String(session.status || "-"));
    kv("Started", fmtDate(session.started_at));
    kv("Completed", fmtDate(session.completed_at));
    doc.moveDown(0.4);
    scoreBar("Overall Performance", performance);
    drawLine();

    // Highlights
    const positive = [];
    if (performance >= 40) positive.push("Clear pronunciation");
    if (performance >= 50) positive.push("Quick response time");
    if (performance >= 60) positive.push("Built correct sentences");
    if (!positive.length) positive.push("You showed persistence — keep going!");
    sectionTitle("Highlights");
    positive.forEach((p) => pill(p));
    drawLine();

    // Vocabulary
    vocabGrid(vocab);

    // Recap + Grammar Feedback (لو موجود)
    const recapText = rows.rows.length ? `Today, you practiced: ${rows.rows.slice(0, 2).map((r) => r.prompt_en).join("; ")}.` : "Good practice today.";
    boxed("Lesson Recap", recapText);
    const firstFb = rows.rows.find((r) => r.feedback);
    if (firstFb?.feedback) boxed("Grammar Feedback", firstFb.feedback);
    drawLine();

    // 🟢 Conversation Timeline (المحادثة كاملة لكل سؤال)
    sectionTitle("Conversation Timeline");
    for (const [idx, msgs] of byQuestion.entries()) {
      doc.fontSize(13).fillColor("#111827").text(`Q${idx}`, { underline: true });
      doc.moveDown(0.2);

      for (const m of msgs) {
        const who = m.role === "ai" ? "AI" : "You";
        const color = m.role === "ai" ? "#111827" : "#1F2937";
        doc.fontSize(10).fillColor("#6B7280").text(`${who} • ${new Date(m.at).toLocaleString("en-GB", { hour12: false })}`);
        doc.moveDown(0.1);
        doc.fontSize(11).fillColor(color).text(m.text, { width: 480 });
        doc.moveDown(0.5);

        // تجنّب قص النص في نهاية الصفحة
        if (doc.y > doc.page.height - 120) doc.addPage();
      }

      doc.moveDown(0.8);
      drawLine();
    }

    // Per-Question (العنوان + السؤال + التصحيح ضمنيًا)
    sectionTitle("Per-Question Details");
    rows.rows.forEach(questionBlock);

    // Footer صفحات
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const label = `Page ${i + 1} of ${range.count}`;
      doc.fontSize(9).fillColor(MUTED).text(label, 40, doc.page.height - 30, { width: doc.page.width - 80, align: "center" });
    }

    doc.end();
  } catch (e) {
    console.error("GET /api/sessions/:id/export.pdf", e);
    if (!pdfErrored) {
      try {
        res.status(500).json({ error: "Failed to build PDF" });
      } catch {}
    }
  }
});

// ---------- WebSocket Auth ----------
io.use(async (socket, next) => {
  if (process.env.SKIP_WS_AUTH === "1") {
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
      (socket.handshake.headers?.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("Missing token");

    const keyEnv = process.env.CLERK_JWT_KEY || "";
    const jwtKey = keyEnv.startsWith("-----BEGIN") ? keyEnv : undefined;
    const aud = process.env.CLERK_AUD || process.env.FRONTEND_URL || undefined;

    const session = await verifyToken(token, {
      jwtKey,
      authorizedParties: [aud].filter(Boolean),
    });

    const clerkId = session?.sub || session?.claims?.sub;
    if (!clerkId) throw new Error("WS auth: missing sub");

    // جلب من Clerk لضمان الاسم والبريد الصحيحين
    const u = await clerkClient.users.getUser(clerkId);
    const email = u?.primaryEmailAddress?.emailAddress;
    const firstName = u?.firstName || "Clerk";
    const lastName = u?.lastName || "User";
    if (!email) throw new Error("WS auth: missing primary email");

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
    console.error("WS verify error:", e?.message || e);
    next(e);
  }
});

// ---------- Realtime WS Handlers ----------
io.on("connection", (socket) => {
  socket.on("start_day", async ({ dayNumber = 1 }) => {
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

      io.to(socket.id).emit("system_say", { text: "Awesome! Great decision to study today." });
      io.to(socket.id).emit("system_say", {
        text: `Day ${topic.day_number} — Topic: ${topic.title_en} (Level ${topic.level}).`,
      });
      io.to(socket.id).emit("session_ready", { sessionId: session.id, dayNumber: topic.day_number });
      io.to(socket.id).emit("topic_vocab", {
        dayNumber: topic.day_number,
        vocab: Array.isArray(vocab) ? vocab : [],
      });

      // 🔔 لا مؤقّت بالسيرفر — فقط إرسال السؤال والمهلة، والفرونتند يعدّ محليًا
      const askWithTimer = async (qIndex) => {
        const q = questions.find((x) => x.question_idx === qIndex);
        if (!q) {
          const payload = await loadSessionSummary(session.id, uuidUserId);
          io.to(socket.id).emit("lesson_finished", { sessionId: session.id });
          if (payload) io.to(socket.id).emit("summary_ready", payload);
          return;
        }

        // أنشئ attempt وخزّن السؤال كرسالة AI
        const attempt = await ensureAttempt(session.id, qIndex);
        await createAiUtterance(attempt.id, `Q${qIndex}: ${q.prompt_en}`);

        io.to(socket.id).emit("ask_question", {
          sessionId: session.id,
          questionIdx: qIndex,
          prompt: q.prompt_en,
          seconds: 10, // المرجع للفرونتند فقط
        });
      };

      await askWithTimer(1);

      // 🔁 Echo: الفرونتند يرسل time_up بعد انتهاء عدّه المحلي
      socket.on("time_up", ({ questionIdx }) => {
        io.to(socket.id).emit("time_up", { questionIdx });
      });

      socket.on("user_final_text", async ({ sessionId, questionIdx, text, mode, durationSec }) => {
        try {
          const attempt = await ensureAttempt(String(sessionId), Number(questionIdx));
          await createUserUtterance(attempt.id, String(text || ""));

          const corr = await generateCorrection(String(text || ""));

          const isSpoken = String(mode || "").toLowerCase() === "spoken";
          let speakingBlock = "";
          let filteredIssues = corr.issues || [];

          if (isSpoken) {
            const noise = /(capitalize|capitalization|upper case|question mark|punctuation|comma|period)/i;
            filteredIssues = filteredIssues.filter((it) => !noise.test(`${it.type || ""} ${it.note || ""}`));

            const raw = String(text || "").trim();
            const words = raw.split(/\s+/).filter(Boolean);
            const secs = Math.max(1, Number(durationSec || 0));
            const wpm = Math.round((words.length / secs) * 60);

            const fillers = (raw.match(/\b(um+|uh+|erm+|like|you know)\b/gi) || []).length;
            const repeats = (raw.match(/\b(\w+)\s+\1\b/gi) || []).length;
            const longSentences = raw.split(/[.!?]+/).filter((s) => s.trim().split(/\s+/).length > 20).length;

            const tips = [];
            tips.push(`Speaking speed ≈ ${wpm} wpm (target 110–160 for clarity).`);
            if (fillers > 0) tips.push(`Try fewer fillers (found ~${fillers}). Pause instead of “um/uh/like”.`);
            if (repeats > 0) tips.push(`A bit of repetition detected (~${repeats}). Finish ideas then move on.`);
            if (longSentences > 0) tips.push(`Some sentences are long. Break ideas into shorter chunks.`);

            speakingBlock = "Speaking tips:\n- " + tips.join("\n- ");
          }

          const prettyFeedback = String(corr.feedback || "").replace(/^feedback:\s*/i, "").trim();
          const correctedPart = corr.corrected ? `\n\nCorrected (for reference):\n${corr.corrected}` : "";
          const issuesPart = filteredIssues.length
            ? "\n\nKey issues:\n" +
              filteredIssues
                .slice(0, 10)
                .map((it, i) => `- ${i + 1}. [${it.type || "grammar"}] "${it.before}" → "${it.after}" — ${it.note || ""}`)
                .join("\n")
            : "";

          const finalFeedback = (isSpoken
            ? `Speaking feedback: ${prettyFeedback || "Good speaking effort."}\n\n${speakingBlock}${correctedPart}${issuesPart}`
            : `Feedback: ${prettyFeedback || "Good effort. See suggested fixes."}${correctedPart}${issuesPart}`
          )
            .replace(/\n{3,}/g, "\n\n")
            .slice(0, 3000);

          await pool.query(
            `INSERT INTO corrections (attempt_id, feedback, fluency_score, grammar_score, vocab_score)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (attempt_id) DO UPDATE
             SET feedback=$2, fluency_score=$3, grammar_score=$4, vocab_score=$5`,
            [attempt.id, finalFeedback, corr.fluency, corr.grammar, corr.vocab]
          );

          // 🟢 خزّن الفيدباك كرسالة AI ضمن المحادثة
          await createAiUtterance(attempt.id, `Feedback:\n${finalFeedback}`);

          io.to(socket.id).emit("feedback", {
            questionIdx,
            transcript: text || "",
            correction: { ...corr, issues: filteredIssues, feedback: finalFeedback },
          });

          const nextIdx = Number(questionIdx) + 1;
          if (nextIdx <= 6) {
            io.to(socket.id).emit("awaiting_next", { nextIdx });
            const onReady = async (payload = {}) => {
              if (Number(payload.afterQuestion) === Number(questionIdx)) {
                socket.off("ready_for_next", onReady);
                await askWithTimer(nextIdx);
              }
            };
            socket.on("ready_for_next", onReady);
          } else {
            await pool.query(`UPDATE sessions SET status='completed', completed_at=NOW() WHERE id=$1`, [sessionId]);
            io.to(socket.id).emit("lesson_finished", { sessionId });
          }
        } catch (e) {
          io.to(socket.id).emit("error", { message: e.message || "text correction failed" });
        }
      });
    } catch (e) {
      io.to(socket.id).emit("error", { message: e.message || "start_day_failed" });
    }
  });
});

// GET /api/sessions/:id/lesson-summary
app.get("/api/sessions/:id/lesson-summary", async (req, res) => {
  try {
    const { id } = req.params; // session_id (UUID)

    // عنوان الدرس + اليوم + المستوى
    const metaQ = `
      SELECT dt.title_en, dt.level, dt.day_number
      FROM sessions s
      JOIN daily_topics dt ON dt.id = s.topic_id
      WHERE s.id = $1
      LIMIT 1;
    `;
    const meta = await pool.query(metaQ, [id]);
    if (!meta.rows[0]) return res.status(404).json({ error: "Session not found" });

    // متوسط الأداء من corrections
    const perfQ = `
      SELECT ROUND(AVG(c.overall_score))::int AS overall
      FROM attempts a
      JOIN corrections c ON c.attempt_id = a.id
      WHERE a.session_id = $1;
    `;
    const perf = await pool.query(perfQ, [id]);
    const performance = Number(perf.rows[0]?.overall || 0);

    // New Vocabulary (حتى 6 كلمات)
    const vocabQ = `
      SELECT tw.term AS word, COALESCE(tw.meaning, '') AS meaning
      FROM sessions s
      JOIN topic_words tw ON tw.topic_id = s.topic_id
      WHERE s.id = $1
      ORDER BY tw.id ASC
      LIMIT 6;
    `;
    const vocab = (await pool.query(vocabQ, [id])).rows;

    // Recap بسيط من أول سؤالين + عنوان الدرس (fallback لو ما في content)
    const recapQ = `
      SELECT q.prompt_en
      FROM attempts a
      JOIN topic_questions q ON q.id = a.question_id
      WHERE a.session_id = $1
      ORDER BY q.question_idx ASC
      LIMIT 2;
    `;
    const recapRows = (await pool.query(recapQ, [id])).rows;
    const recap = `Today, you practiced: ${recapRows.map((r) => r.prompt_en).join("; ")}.`;

    // Grammar Feedback: نأخذ أول feedback واضح من التصحيحات
    const fbQ = `
      SELECT c.feedback
      FROM attempts a
      JOIN corrections c ON c.attempt_id = a.id
      WHERE a.session_id = $1 AND c.feedback IS NOT NULL
      ORDER BY a.started_at ASC
      LIMIT 1;
    `;
    const fb = await pool.query(fbQ, [id]);
    const grammarFeedback = fb.rows[0]?.feedback || "Good effort. Keep your sentences concise.";

    // Positive Points heuristic بسيط حسب الأداء
    const positive = [];
    if (performance >= 40) positive.push("Clear pronunciation");
    if (performance >= 50) positive.push("Quick response time");
    if (performance >= 60) positive.push("Built correct sentences");
    if (positive.length === 0) positive.push("You showed persistence — keep going!");

    res.json({
      lesson: {
        title: meta.rows[0].title_en,
        level: meta.rows[0].level,
        day: meta.rows[0].day_number,
      },
      performance, // نسبة % لعداد الدائرة
      recap, // نص فقرة Lesson Recap
      vocab, // [{word, meaning}]
      positivePoints: positive,
      grammarFeedback, // جملة/سطرين
    });
  } catch (e) {
    console.error("GET /api/sessions/:id/lesson-summary", e);
    res.status(500).json({ error: "Failed to build lesson summary" });
  }
});

// ---------- Error handler & Start ----------
app.use((err, _req, res, _next) => {
  console.error("💥 Unhandled error:", err);
  res.status(500).json({ ok: false, error: err.message || "server_error" });
});

// ✅ Simple text correction (Gemini + LT fallback) — independent route
app.post("/api/correct", async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: "Missing text" });

    const corr = await generateCorrection(String(text));
    const detailedFeedback = buildDetailedFeedback(corr);

    res.json({
      original: text,
      correction: { ...corr, feedback: detailedFeedback },
    });
  } catch (e) {
    console.error("POST /api/correct error:", e);
    res.status(500).json({ error: e.message || "correction failed" });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server + WebSocket running at http://localhost:${PORT}`);
});
