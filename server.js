// server.js (schema-aligned)
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require("node-fetch");
const PDFDocument = require("pdfkit");

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const multer = require("multer");            // ✅ fixed
const ffmpeg = require("fluent-ffmpeg");

const { requireAuth, getAuth } = require("@clerk/express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");
const UPLOADS = path.join(__dirname, "uploads");

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
  connectionString: process.env.DATABASE_URL, // تأكدي من المنفذ 5433 لو محلي
});

// users table (لو ما عندك schema كامل)
pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);`)
  .then(() => console.log("✅ users table ready"))
  .catch((e) => console.error("❌ table error", e));

// ---------- Utils ----------
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

function authUser(req) {
  const { userId } = getAuth(req) || {};
  if (!userId) throw new Error("Unauthenticated");
  return userId;
}

// احضار topic + أسئلته أو انشاء افتراضي
async function getOrCreateTopicWithQuestions(dayNumber) {
  // 1) احضار أو إنشاء topic
  const topicIns = await pool.query(
    `INSERT INTO daily_topics (day_number, title_en, level, estimated_minutes)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (day_number) DO NOTHING
     RETURNING *`,
    [
      dayNumber,
      `Daily Conversation Day ${dayNumber}`,
      dayNumber <= 10 ? "A1" : dayNumber <= 20 ? "A2" : dayNumber <= 40 ? "B1" : "B2",
      10,
    ]
  );
  const topic =
    topicIns.rows[0] ||
    (await pool.query(`SELECT * FROM daily_topics WHERE day_number=$1 LIMIT 1`, [dayNumber])).rows[0];

  // 2) أسئلة
  const existingQ = await pool.query(
    `SELECT question_idx, prompt_en
     FROM topic_questions
     WHERE topic_id=$1
     ORDER BY question_idx ASC`,
    [topic.id]
  );
  if (existingQ.rows.length) return { topic, questions: existingQ.rows };

  const defaults = [
    "Warm-up: In one sentence, what is today's topic about?",
    "Share a short example from your life related to the topic.",
    "Describe a problem related to the topic and a simple solution.",
    "Give your opinion about the topic with one reason.",
    "Compare two options related to the topic (2–3 sentences).",
    "Closing: Summarize your main point in one sentence.",
  ];
  for (let i = 0; i < defaults.length; i++) {
    await pool.query(
      `INSERT INTO topic_questions (topic_id, question_idx, prompt_en)
       VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING`,
      [topic.id, i + 1, defaults[i]]
    );
  }
  const qrows = await pool.query(
    `SELECT question_idx, prompt_en FROM topic_questions WHERE topic_id=$1 ORDER BY question_idx`,
    [topic.id]
  );
  return { topic, questions: qrows.rows };
}

async function generateCorrectionAndWords(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const words = Array.from(
      new Set((text || "").toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean))
    ).slice(0, 6);
    return {
      feedback: "Good job! Try to speak with clearer sentences.",
      mistakes: [],
      words: words.map((w) => ({ word: w, ipa: "", meaning: "", example: "" })),
    };
  }
  const prompt = `
You are an English tutor. Return STRICT JSON ONLY:
{
  "feedback": "<short feedback>",
  "mistakes": [{"original":"...", "suggestion":"..."}],
  "words": [{"word":"...", "ipa":"", "meaning":"", "example":""}]
}
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
          generationConfig: { temperature: 0.4 },
        }),
      }
    );
    const data = await resp.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(raw);
    return {
      feedback: parsed.feedback || "Well done.",
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      words: Array.isArray(parsed.words) ? parsed.words.slice(0, 6) : [],
    };
  } catch (e) {
    console.error("Gemini error:", e);
    return { feedback: "Good effort!", mistakes: [], words: [] };
  }
}

async function upsertVocabWords(userId, words) {
  if (!Array.isArray(words) || !words.length) return;
  for (const w of words) {
    await pool.query(
      `INSERT INTO vocab_items (user_id, word, ipa, meaning, example)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [userId, w.word || "", w.ipa || "", w.meaning || "", w.example || ""]
    );
  }
}

// helpers للتوافق مع اختلاف أسماء الأعمدة
async function insertRecordingFlexible({ userId, sessionId, questionIdx, filePath, mimeType }) {
  try {
    await pool.query(
      `INSERT INTO recordings (user_id, session_id, question_idx, file_path, mime_type, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW())`,
      [userId, sessionId, questionIdx, filePath, mimeType]
    );
  } catch (_) {
    await pool.query(
      `INSERT INTO recordings (user_id, session_id, question_idx, file_path_wav, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [userId, sessionId, questionIdx, filePath]
    );
  }
}

async function insertUtteranceFlexible({ sessionId, questionIdx, transcript }) {
  try {
    const u = await pool.query(
      `INSERT INTO utterances (session_id, speaker, question_idx, transcript, created_at)
       VALUES ($1,'user',$2,$3,NOW()) RETURNING *`,
      [sessionId, questionIdx, transcript]
    );
    return u.rows[0];
  } catch (_) {
    const u = await pool.query(
      `INSERT INTO utterances (session_id, question_idx, transcript, created_at)
       VALUES ($1,$2,$3,NOW()) RETURNING *`,
      [sessionId, questionIdx, transcript]
    );
    return u.rows[0];
  }
}

// ---------- Basic routes ----------
app.get("/", (_req, res) => res.json({ ok: true, service: "lexi backend" }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

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

// Clerk upsert
app.get("/api/me", requireAuth(), async (req, res) => {
  try {
    const { userId, claims } = getAuth(req);
    const email = claims?.email || claims?.email_address || null;
    const firstName = claims?.first_name || claims?.given_name || null;
    const lastName = claims?.last_name || claims?.family_name || null;

    const q = `
      INSERT INTO users (id, email, first_name, last_name)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (id) DO UPDATE 
      SET email=EXCLUDED.email, first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name
      RETURNING *;`;
    const ins = await pool.query(q, [userId, email, firstName, lastName]);
    res.json({ ok: true, user: ins.rows[0], service: "lexi backend" });
  } catch (err) {
    console.error("❌ /api/me error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Day helper (topic+questions)
app.get("/api/day/:day", async (req, res) => {
  try {
    const dayNumber = Number(req.params.day) || 1;
    const { topic, questions } = await getOrCreateTopicWithQuestions(dayNumber);
    res.json({ topic, questions });
  } catch (e) {
    res.status(500).json({ error: e.message || "failed" });
  }
});

// ---------- Sessions API ----------

// 1) Start session
const startHandler = async (req, res) => {
  try {
    const userId = authUser(req);
    const dayNumber = Number(req.body?.dayNumber) || 1;

    // Topic + Questions (ensures topic exists)
    const { topic, questions } = await getOrCreateTopicWithQuestions(dayNumber);

    // Create/activate session with topic_id ONLY (no day_number column)
    const s = await pool.query(
      `INSERT INTO sessions (user_id, topic_id, started_at, status)
       VALUES ($1,$2,NOW(),'active')
       ON CONFLICT (user_id, topic_id)
       DO UPDATE SET started_at = NOW(), status = 'active'
       RETURNING *`,
      [userId, topic.id]
    );
    const sessionRow = s.rows[0];

    const openingMessage = `Awesome! Let’s study today. Topic: ${topic.title_en} (Level ${topic.level}).`;
    const firstQuestion = questions[0] || null;

    console.log("✅ session started id=", sessionRow.id);
    return res.status(201).json({
      session: sessionRow,
      topic,
      questions,
      openingMessage,
      firstQuestion,
    });
  } catch (e) {
    console.error("POST /api/sessions/start", e);
    return res.status(500).json({ error: e.message || "start failed" });
  }
};
app.post("/api/sessions/start", requireAuth(), startHandler);
app.post("/api/sessions", requireAuth(), startHandler); // optional alias

// Multer for audio
const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const audioUpload = multer({ storage: audioStorage });

// 2) Upload audio
app.post("/api/utterances/audio", requireAuth(), audioUpload.single("audio"), async (req, res) => {
  try {
    const userId = authUser(req);
    const { sessionId, dayNumber, questionIdx } = req.body || {};
    if (!sessionId || !dayNumber || !questionIdx)
      return res.status(400).json({ error: "sessionId, dayNumber, questionIdx required" });
    if (!req.file) return res.status(400).json({ error: "audio file required" });

    const inputPath = req.file.path;
    const wavPath = inputPath.replace(path.extname(inputPath), ".wav");

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath).audioChannels(1).audioFrequency(16000).toFormat("wav")
        .on("end", resolve).on("error", reject).save(wavPath);
    });

    const transcript = await new Promise((resolve) => {
      exec(`python whisper_run.py "${wavPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.warn("Whisper failed:", error.message, stderr);
          return resolve("(audio received)");
        }
        resolve((stdout || "").toString().trim() || "(no speech)");
      });
    });

    await insertRecordingFlexible({
      userId,
      sessionId,
      questionIdx: Number(questionIdx),
      filePath: wavPath,
      mimeType: "audio/wav",
    });

    const utter = await insertUtteranceFlexible({
      sessionId,
      questionIdx: Number(questionIdx),
      transcript,
    });

    const { feedback, mistakes, words } = await generateCorrectionAndWords(transcript);

    await pool.query(
      `INSERT INTO corrections (utterance_id, feedback, mistakes_json, created_at)
       VALUES ($1,$2,$3,NOW())`,
      [utter.id, feedback, JSON.stringify(mistakes)]
    );

    await upsertVocabWords(userId, words);

    res.json({ transcript, correction: { feedback, mistakes }, words });
  } catch (e) {
    console.error("POST /api/utterances/audio", e);
    res.status(500).json({ error: e.message || "upload failed" });
  }
});

// 3) Finish session
app.post("/api/sessions/:id/finish", requireAuth(), async (req, res) => {
  try {
    const userId = authUser(req);
    const { id } = req.params;
    await pool.query(
      `UPDATE sessions SET status='finished', finished_at=NOW()
       WHERE id=$1 AND user_id=$2`,
      [id, userId]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("POST /api/sessions/:id/finish", e);
    res.status(500).json({ error: e.message || "finish failed" });
  }
});

// 4) Summary
app.get("/api/sessions/:id/summary", requireAuth(), async (req, res) => {
  try {
    const userId = authUser(req);
    const { id } = req.params;

    const basics = await pool.query(
      `SELECT s.*, t.title_en, t.level, t.day_number
       FROM sessions s
       JOIN daily_topics t ON t.id = s.topic_id
       WHERE s.id=$1 AND s.user_id=$2`,
      [id, userId]
    );
    if (!basics.rows.length) return res.status(404).json({ error: "Not found" });

    const ut = await pool.query(
      `SELECT u.question_idx, u.transcript, c.feedback, c.mistakes_json
       FROM utterances u
       LEFT JOIN corrections c ON c.utterance_id = u.id
       WHERE u.session_id=$1
       ORDER BY u.question_idx ASC`,
      [id]
    );

    res.json({ session: basics.rows[0], utterances: ut.rows });
  } catch (e) {
    console.error("GET /api/sessions/:id/summary", e);
    res.status(500).json({ error: e.message || "summary failed" });
  }
});

// 5) Export PDF
app.get("/api/sessions/:id/export.pdf", requireAuth(), async (req, res) => {
  try {
    const userId = authUser(req);
    const { id } = req.params;

    const s = await pool.query(
      `SELECT s.*, t.title_en, t.day_number
       FROM sessions s
       JOIN daily_topics t ON t.id = s.topic_id
       WHERE s.id=$1 AND s.user_id=$2`,
      [id, userId]
    );
    const session = s.rows[0];
    if (!session) return res.status(404).end();

    const ut = await pool.query(
      `SELECT u.*, c.feedback, c.mistakes_json
       FROM utterances u LEFT JOIN corrections c ON c.utterance_id=u.id
       WHERE u.session_id=$1 ORDER BY question_idx`,
      [id]
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="lesson-${session.day_number}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text(`Lesson Day ${session.day_number} — ${session.title_en || ""}`);
    doc.moveDown().fontSize(12).text(`Started: ${session.started_at}   Finished: ${session.finished_at || "-"}`);
    doc.moveDown();

    ut.rows.forEach((u) => {
      doc.fontSize(14).text(`Q${u.question_idx}:`, { underline: true });
      doc.moveDown(0.2).fontSize(12).text(`User: ${u.transcript || "-"}`);
      if (u.feedback) doc.moveDown(0.2).text(`Feedback: ${u.feedback}`);
      const mistakes = (() => {
        try { return JSON.parse(u.mistakes_json || "[]"); } catch { return []; }
      })();
      if (mistakes.length) {
        doc.moveDown(0.2).text(`Mistakes:`);
        mistakes.forEach((m) => doc.text(`- ${m.original} → ${m.suggestion}`));
      }
      doc.moveDown();
    });

    doc.end();
  } catch (e) {
    console.error("GET /api/sessions/:id/export.pdf", e);
    res.status(500).end();
  }
});

// 6) Export merged audio (concat)
app.get("/api/sessions/:id/export-audio", requireAuth(), async (req, res) => {
  try {
    const userId = authUser(req);
    const { id } = req.params;

    const r = await pool.query(
      `SELECT file_path AS p FROM recordings WHERE session_id=$1 AND user_id=$2
       UNION ALL
       SELECT file_path_wav AS p FROM recordings WHERE session_id=$1 AND user_id=$2`,
      [id, userId]
    );
    const paths = r.rows.map((x) => x.p).filter(Boolean);
    if (!paths.length) return res.status(404).json({ error: "No audio" });

    const listPath = path.join(UPLOADS, `concat-${id}.txt`);
    fs.writeFileSync(listPath, paths.map((p) => `file '${p}'`).join("\n"));

    const outPath = path.join(UPLOADS, `session-${id}.mp3`);
    await new Promise((resolve, reject) => {
      exec(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c:a libmp3lame "${outPath}"`, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename="session-${id}.mp3"`);
    fs.createReadStream(outPath).pipe(res);
  } catch (e) {
    console.error("GET /api/sessions/:id/export-audio", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- Legacy demo (optional) ----------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

app.post("/api/day/:day/answer/:idx", upload.single("audio"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio file uploaded" });
  const inputPath = req.file.path;
  const wavPath = inputPath.replace(path.extname(inputPath), ".wav");

  ffmpeg(inputPath)
    .toFormat("wav")
    .on("error", (err) => res.status(500).json({ error: "Audio conversion failed", details: err.message }))
    .on("end", () => {
      exec(`python whisper_run.py "${wavPath}"`, (error, stdout) => {
        if (error) return res.status(500).json({ error: "Whisper transcription failed", details: error.message });
        const transcript = (stdout || "").toString().trim();
        res.json({ transcript });
      });
    })
    .save(wavPath);
});

// ---------- Error handler & Start ----------
app.use((err, _req, res, _next) => {
  console.error("💥 Unhandled error:", err);
  res.status(500).json({ ok: false, error: err.message || "server_error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
