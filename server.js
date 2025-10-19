// server.js — LexiLearn v1.1 compatible (UUID users, attempts/utterances/corrections)
require("dotenv").config();
const fetch = require("node-fetch");
const PDFDocument = require("pdfkit");

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { exec } = require("child_process");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");

const { requireAuth, getAuth } = require("@clerk/express");
const { Pool } = require("pg");
const { generateCorrection } = require("./services/correction");


// (اختياري) توثيق توكن WS عبر Clerk
let verifyToken = null;
try {
  ({ verifyToken } = require("@clerk/clerk-sdk-node"));
} catch {
  console.warn("ℹ️ @clerk/clerk-sdk-node not installed. You can set SKIP_WS_AUTH=1 for dev.");
}

const app = express();
const server = http.createServer(app);
const { Server: IOServer } = require("socket.io");
const io = new IOServer(server, {
  cors: { origin: /^http:\/\/(localhost|127\.0\.0\.1):\d+$/, credentials: true },
});

const PORT = process.env.PORT || 4000;
const PUBLIC = path.join(__dirname, "public");
const UPLOADS = path.join(__dirname, "uploads");

// ====== Optional topics seed (topics.json: 60 days × 6 questions × vocab) ======
let topicsSeed = [];
try {
  topicsSeed = require(path.join(__dirname, "topics.json"));
} catch {
  console.warn("⚠️ topics.json not found. Will fallback to defaults.");
}

// ---------- Middleware / CORS / Logs ----------
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
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

// ---------- DB ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ---------- Utils ----------
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

/**
 * يضمن وجود مستخدم ويرجّع UUID الخاص به (متوافق مع سكيمة v1.1)
 * - مع Clerk: نستخدم البريد لتثبيت / إنشاء user ثم نرجّع id (UUID).
 * - بدونه: يُنشئ Dev user عند الحاجة.
 */
async function requireUser(req) {
  const auth = getAuth(req) || {};
  const claims = auth.claims || {};
  const email =
    claims?.email ||
    claims?.email_address ||
    claims?.primary_email ||
    null;

  let firstName = claims?.first_name || claims?.given_name || "User";
  let lastName = claims?.last_name || claims?.family_name || "";

  if (!email) {
    // في حال عدم وجود Clerk (أو لا يوجد بريد)، نستخدم dev user
    const dev = await getOrCreateDevUser();
    return dev.id;
  }

  // upsert by email
  const upsert = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash)
     VALUES ($1,$2,$3,'')
     ON CONFLICT (email) DO UPDATE
     SET first_name = EXCLUDED.first_name,
         last_name  = EXCLUDED.last_name
     RETURNING id;`,
    [firstName || "User", lastName || "", String(email)]
  );
  return upsert.rows[0].id;
}

// Dev user helper for both REST & WS when SKIP_WS_AUTH=1
async function getOrCreateDevUser() {
  const email = "dev@local";
  const sel = await pool.query(`SELECT id FROM users WHERE email=$1 LIMIT 1`, [email]);
  if (sel.rows[0]) return { id: sel.rows[0].id };
  const ins = await pool.query(
    `INSERT INTO users (first_name,last_name,email,password_hash)
     VALUES ('Dev','User',$1,'') RETURNING id;`,
    [email]
  );
  return { id: ins.rows[0].id };
}

/** احضار topic + أسئلته (من DB أو seed) + vocab من topic_words إن توفّر */
async function getOrCreateTopicWithQuestions(dayNumber) {
  const daySeed = topicsSeed.find((t) => t.day_number === Number(dayNumber));
  const title = daySeed?.title_en || `Daily Conversation Day ${dayNumber}`;
  const level = daySeed?.level || (dayNumber <= 10 ? "A1" : dayNumber <= 20 ? "A2" : dayNumber <= 40 ? "B1" : "B2");
  const est = daySeed?.estimated_minutes ?? 10;

  const topicIns = await pool.query(
    `INSERT INTO daily_topics (day_number, title_en, level, estimated_minutes)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (day_number) DO NOTHING
     RETURNING *`,
    [dayNumber, title, level, est]
  );
  const topic =
    topicIns.rows[0] ||
    (await pool.query(`SELECT * FROM daily_topics WHERE day_number=$1 LIMIT 1`, [dayNumber])).rows[0];

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
    `SELECT id, question_idx, prompt_en FROM topic_questions WHERE topic_id=$1 ORDER BY question_idx`,
    [topic.id]
  );

  // vocab (اختياري): من topic_words بالـ DB
  const vrows = await pool.query(
    `SELECT term AS word, meaning, example, audio_url FROM topic_words WHERE topic_id=$1 ORDER BY id`,
    [topic.id]
  );

  return { topic, questions: qrows.rows, vocab: vrows.rows };
}

// ينشئ Attempt (إن لم يكن موجودًا) لسؤال بعينه ضمن جلسة
async function ensureAttempt(sessionId, questionIdx) {
  // نحتاج question_id عبر topic/session
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
  const at = await pool.query(
    `INSERT INTO attempts (session_id, question_id, started_at)
     VALUES ($1,$2, NOW())
     ON CONFLICT (session_id, question_id)
     DO UPDATE SET started_at = COALESCE(attempts.started_at, NOW())
     RETURNING *`,
    [sessionId, questionId]
  );
  return at.rows[0];
}

async function createUserUtterance(attemptId, text) {
  const u = await pool.query(
    `INSERT INTO utterances (attempt_id, role, text)
     VALUES ($1,'user',$2) RETURNING *`,
    [attemptId, String(text || "")]
  );
  return u.rows[0];
}

// توليد تغذية راجعة بسيطة (Gemini إن وجد API key)
async function generateCorrection(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // fallback بسيط
    return {
      feedback: "Good job! Try to speak with clearer sentences.",
      fluency: 70,
      grammar: 70,
      vocab: 70,
    };
  }
  const prompt = `
You are an English tutor. Return STRICT JSON ONLY like:
{"feedback":"...", "fluency":70, "grammar":72, "vocab":68}
(Limit feedback to 1-2 sentences.)
Learner answer: """${text}"""
`;
  try {
    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
      apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );
    const data = await resp.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(raw);
    return {
      feedback: parsed.feedback || "Well done.",
      fluency: Number(parsed.fluency ?? 70),
      grammar: Number(parsed.grammar ?? 70),
      vocab: Number(parsed.vocab ?? 70),
    };
  } catch (e) {
    console.error("Gemini error:", e);
    return { feedback: "Nice effort!", fluency: 70, grammar: 70, vocab: 70 };
  }
}

// ---------- Basic REST routes ----------
app.get("/", (_req, res) => res.json({ ok: true, service: "lexi backend v1.1" }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
// === Topics list for Lessons grid ===
// GET /api/topics?q=&page=&pageSize=
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

    // total
    const countSql = `SELECT COUNT(*)::int AS total FROM daily_topics ${where}`;
    const { rows: countRows } = await pool.query(countSql, params);
    const total = countRows[0]?.total ?? 0;

    // items
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

// Clerk-aware upsert -> يرجّع UUID
app.get("/api/me", requireAuth(), async (req, res) => {
  try {
    const userId = await requireUser(req); // يرجّع UUID من جدول users
    const u = await pool.query(`SELECT id, first_name, last_name, email FROM users WHERE id=$1`, [userId]);
    res.json({ ok: true, user: u.rows[0], service: "lexi backend v1.1" });
  } catch (err) {
    console.error("❌ /api/me error:", err);
    res.status(500).json({ ok: false, error: err.message });
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
app.post("/api/sessions/start", requireAuth(), startHandler);
app.post("/api/sessions", requireAuth(), startHandler); // alias

// Multer for audio (optional upload; no recordings table in v1.1)
const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const audioUpload = multer({ storage: audioStorage });

/**
 * 2) Upload audio (اختياري)
 * - يحوّل الصوت إلى نص (لو فعّلتي whisper_run.py)
 * - يربط النص بمحاولة السؤال (attempt) ثم يصحّحه
 */
app.post("/api/utterances/audio", requireAuth(), audioUpload.single("audio"), async (req, res) => {
  try {
    const uuidUserId = await requireUser(req);
    const { sessionId, questionIdx } = req.body || {};
    if (!sessionId || !questionIdx) return res.status(400).json({ error: "sessionId, questionIdx required" });
    if (!req.file) return res.status(400).json({ error: "audio file required" });

    const inputPath = req.file.path;
    const wavPath = inputPath.replace(path.extname(inputPath), ".wav");

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath).audioChannels(1).audioFrequency(16000).toFormat("wav")
        .on("end", resolve).on("error", reject).save(wavPath);
    });

    // TODO: فعّلي سكربت whisper لو أردتي تحويل فعلي
    const transcript = await new Promise((resolve) => {
      // exec(`python whisper_run.py "${wavPath}"`, (error, stdout, stderr) => {
      //   if (error) {
      //     console.warn("Whisper failed:", error.message, stderr);
      //     return resolve("(audio received)");
      //   }
      //   resolve((stdout || "").toString().trim() || "(no speech)");
      // });
      resolve("(audio received)"); // افتراضيًا نرجّع placeholder
    });

    const attempt = await ensureAttempt(String(sessionId), Number(questionIdx));
    await createUserUtterance(attempt.id, transcript);

    const { feedback, fluency, grammar, vocab } = await generateCorrection(String(transcript || ""));

    await pool.query(
      `INSERT INTO corrections (attempt_id, feedback, fluency_score, grammar_score, vocab_score)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (attempt_id) DO UPDATE
       SET feedback=$2, fluency_score=$3, grammar_score=$4, vocab_score=$5`,
      [attempt.id, feedback, fluency, grammar, vocab]
    );

    res.json({ transcript, correction: { feedback, fluency, grammar, vocab } });
  } catch (e) {
    console.error("POST /api/utterances/audio", e);
    res.status(500).json({ error: e.message || "upload failed" });
  }
});

// ✅ 2-bis) تصحيح نصّي بدون صوت (للريل تايم)
app.post("/api/utterances/text", requireAuth(), async (req, res) => {
  try {
    await requireUser(req); // يضمن المستخدم
    const { sessionId, questionIdx, text } = req.body || {};
    if (!sessionId || !questionIdx) return res.status(400).json({ error: "sessionId, questionIdx required" });

    const attempt = await ensureAttempt(String(sessionId), Number(questionIdx));
    await createUserUtterance(attempt.id, String(text || ""));

    const { feedback, fluency, grammar, vocab } = await generateCorrection(String(text || ""));

    await pool.query(
      `INSERT INTO corrections (attempt_id, feedback, fluency_score, grammar_score, vocab_score)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (attempt_id) DO UPDATE
       SET feedback=$2, fluency_score=$3, grammar_score=$4, vocab_score=$5`,
      [attempt.id, feedback, fluency, grammar, vocab]
    );

    res.json({ transcript: text || "", correction: { feedback, fluency, grammar, vocab } });
  } catch (e) {
    console.error("POST /api/utterances/text", e);
    res.status(500).json({ error: e.message || "text correction failed" });
  }
});

// 3) Finish session
app.post("/api/sessions/:id/finish", requireAuth(), async (req, res) => {
  try {
    const uuidUserId = await requireUser(req);
    const { id } = req.params;
    await pool.query(
      `UPDATE sessions SET status='completed', completed_at=NOW()
       WHERE id=$1 AND user_id=$2`,
      [id, uuidUserId]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("POST /api/sessions/:id/finish", e);
    res.status(500).json({ error: e.message || "finish failed" });
  }
});

// 4) Summary (محاذيًا للسكيمة الجديدة)
app.get("/api/sessions/:id/summary", requireAuth(), async (req, res) => {
  try {
    const uuidUserId = await requireUser(req);
    const { id } = req.params;

    const basics = await pool.query(
      `SELECT s.id, s.started_at, s.completed_at, s.status,
              t.title_en, t.level, t.day_number
       FROM sessions s
       JOIN daily_topics t ON t.id = s.topic_id
       WHERE s.id=$1 AND s.user_id=$2`,
      [id, uuidUserId]
    );
    if (!basics.rows.length) return res.status(404).json({ error: "Not found" });

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

    res.json({ session: basics.rows[0], attempts: rows.rows });
  } catch (e) {
    console.error("GET /api/sessions/:id/summary", e);
    res.status(500).json({ error: e.message || "summary failed" });
  }
});

// 5) Export PDF (متوافق مع attempts/utterances/corrections)
app.get("/api/sessions/:id/export.pdf", requireAuth(), async (req, res) => {
  try {
    const uuidUserId = await requireUser(req);
    const { id } = req.params;

    const s = await pool.query(
      `SELECT s.id, s.started_at, s.completed_at, s.status,
              t.title_en, t.day_number
       FROM sessions s
       JOIN daily_topics t ON t.id = s.topic_id
       WHERE s.id=$1 AND s.user_id=$2`,
      [id, uuidUserId]
    );
    const session = s.rows[0];
    if (!session) return res.status(404).end();

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

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="lesson-${session.day_number}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text(`Lesson Day ${session.day_number} — ${session.title_en || ""}`);
    doc.moveDown().fontSize(12).text(`Started: ${session.started_at}   Completed: ${session.completed_at || "-"}`);
    doc.moveDown();

    rows.rows.forEach((r) => {
      doc.fontSize(14).text(`Q${r.question_idx}: ${r.prompt_en}`, { underline: true });
      doc.moveDown(0.2).fontSize(12).text(`User: ${r.user_text || "-"}`);
      if (r.feedback) doc.moveDown(0.2).text(`Feedback: ${r.feedback}`);
      const parts = [];
      if (r.fluency_score != null) parts.push(`Fluency ${r.fluency_score}`);
      if (r.grammar_score != null) parts.push(`Grammar ${r.grammar_score}`);
      if (r.vocab_score != null) parts.push(`Vocab ${r.vocab_score}`);
      if (parts.length) doc.moveDown(0.2).text(parts.join(" • "));
      doc.moveDown();
    });

    doc.end();
  } catch (e) {
    console.error("GET /api/sessions/:id/export.pdf", e);
    res.status(500).end();
  }
});

// ---------- Realtime WS ----------
io.use(async (socket, next) => {
  if (process.env.SKIP_WS_AUTH === "1") {
    try {
      const dev = await getOrCreateDevUser();
      socket.data.uuidUserId = dev.id; // UUID
      return next();
    } catch (e) {
      return next(e);
    }
  }
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token || !verifyToken) throw new Error("Missing token or clerk sdk not installed");
    const session = await verifyToken(token, {
      jwtKey: process.env.CLERK_JWT_KEY,
      authorizedParties: [process.env.CLERK_AUD].filter(Boolean),
    });
    // قد لا يتوفر البريد في التوكن على WS، فننشئ ظل user إن لزم
    const email = session?.email || session?.claims?.email || null;
    if (email) {
      const up = await pool.query(
        `INSERT INTO users (first_name,last_name,email,password_hash)
         VALUES ('Clerk','User',$1,'')
         ON CONFLICT (email) DO UPDATE SET first_name='Clerk', last_name='User'
         RETURNING id;`,
        [email]
      );
      socket.data.uuidUserId = up.rows[0].id;
    } else {
      // fallback
      const shadow = await pool.query(
        `INSERT INTO users (first_name,last_name,email,password_hash)
         VALUES ('WS','Shadow', $1,'')
         ON CONFLICT (email) DO UPDATE SET first_name='WS', last_name='Shadow'
         RETURNING id;`,
        [`unknown+${session?.sub || Date.now()}@local`]
      );
      socket.data.uuidUserId = shadow.rows[0].id;
    }
    next();
  } catch (e) {
    next(e);
  }
});

io.on("connection", (socket) => {
  // يبدأ اليوم بالكامل (تحفيز → موضوع → Q1 … Q6)
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
      io.to(socket.id).emit("system_say", { text: `Day ${topic.day_number} — Topic: ${topic.title_en} (Level ${topic.level}).` });
      io.to(socket.id).emit("session_ready", { sessionId: session.id, dayNumber: topic.day_number });
      io.to(socket.id).emit("topic_vocab", { dayNumber: topic.day_number, vocab: Array.isArray(vocab) ? vocab : [] });

      const askWithTimer = async (qIndex) => {
        const q = questions.find((x) => x.question_idx === qIndex);
        if (!q) {
          io.to(socket.id).emit("lesson_finished", { sessionId: session.id });
          return;
        }

        // أنشئ Attempt للسؤال الآن
        const attempt = await ensureAttempt(session.id, qIndex);

        io.to(socket.id).emit("ask_question", {
          sessionId: session.id,
          questionIdx: qIndex,
          prompt: q.prompt_en,
          seconds: 60, // كل سؤال 60 ثانية
        });

        let left = 60;
        const timer = setInterval(() => {
          left -= 1;
          io.to(socket.id).emit("timer", { questionIdx: qIndex, left });
          if (left <= 0) {
            clearInterval(timer);
            io.to(socket.id).emit("time_up", { questionIdx: qIndex });
          }
        }, 1000);
      };

      await askWithTimer(1);

      // يستلم النص النهائي من الواجهة بعد انتهاء الدقيقة ويصحّحه ثم ينتقل للسؤال التالي
      socket.on("user_final_text", async ({ sessionId, questionIdx, text }) => {
        try {
          const attempt = await ensureAttempt(String(sessionId), Number(questionIdx));
          await createUserUtterance(attempt.id, String(text || ""));

          const { feedback, fluency, grammar, vocab } = await generateCorrection(String(text || ""));

          await pool.query(
            `INSERT INTO corrections (attempt_id, feedback, fluency_score, grammar_score, vocab_score)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (attempt_id) DO UPDATE
             SET feedback=$2, fluency_score=$3, grammar_score=$4, vocab_score=$5`,
            [attempt.id, feedback, fluency, grammar, vocab]
          );

          io.to(socket.id).emit("feedback", {
            questionIdx,
            transcript: text || "",
            correction: { feedback, fluency, grammar, vocab },
          });

          if (questionIdx < 6) await askWithTimer(questionIdx + 1);
          else {
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

// ---------- Error handler & Start ----------
app.use((err, _req, res, _next) => {
  console.error("💥 Unhandled error:", err);
  res.status(500).json({ ok: false, error: err.message || "server_error" });
});

server.listen(PORT, () => {
  console.log(`🚀 Server + WebSocket running at http://localhost:${PORT}`);
});
