// server.js (schema-aligned + Realtime WS + text correction)
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require("node-fetch");
const PDFDocument = require("pdfkit");

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const http = require("http");                     // ✅ WS server
const { exec } = require("child_process");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");

const { requireAuth, getAuth } = require("@clerk/express");
const { Pool } = require("pg");

// (اختياري) توثيق توكن WS عبر Clerk
let verifyToken = null;
try {
  ({ verifyToken } = require("@clerk/clerk-sdk-node"));
} catch {
  console.warn("ℹ️ @clerk/clerk-sdk-node not installed. You can set SKIP_WS_AUTH=1 for dev.");
}

const app = express();
const server = http.createServer(app);            // ✅ استخدم http + io
const { Server: IOServer } = require("socket.io");
const io = new IOServer(server, {
  cors: { origin: /^http:\/\/(localhost|127\.0\.0\.1):\d+$/, credentials: true },
});

const PORT = process.env.PORT || 4000;
const PUBLIC = path.join(__dirname, "public");
const UPLOADS = path.join(__dirname, "uploads");

// ====== Topics seed (60 days × 6 questions × 10 vocab) ======
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

// users table (اختياري)
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

// احضار topic + أسئلته (من topics.json إن وُجد) أو انشاء افتراضي
async function getOrCreateTopicWithQuestions(dayNumber) {
  const day = topicsSeed.find((t) => t.day_number === Number(dayNumber));
  const title = day?.title_en || `Daily Conversation Day ${dayNumber}`;
  const level = day?.level || (dayNumber <= 10 ? "A1" : dayNumber <= 20 ? "A2" : dayNumber <= 40 ? "B1" : "B2");
  const est = day?.estimated_minutes ?? 10;

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

  const existingQ = await pool.query(
    `SELECT question_idx, prompt_en
     FROM topic_questions
     WHERE topic_id=$1
     ORDER BY question_idx ASC`,
    [topic.id]
  );
  if (existingQ.rows.length) {
    return { topic, questions: existingQ.rows, vocab: day?.vocab || [] };
  }

  const defaults =
    (day?.questions || []).map((q) => q.prompt_en) || [
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
  return { topic, questions: qrows.rows, vocab: day?.vocab || [] };
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

// helpers للتوافق مع اختلاف أسماء الأعمدة (تستخدمها مسارات الصوت)
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

// ---------- Basic REST routes ----------
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
    const { topic, questions, vocab } = await getOrCreateTopicWithQuestions(dayNumber);
    res.json({ topic, questions, vocab });
  } catch (e) {
    res.status(500).json({ error: e.message || "failed" });
  }
});

// ---------- Sessions API ----------
const startHandler = async (req, res) => {
  try {
    const userId = authUser(req);
    const dayNumber = Number(req.body?.dayNumber) || 1;
    const { topic, questions } = await getOrCreateTopicWithQuestions(dayNumber);

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
app.post("/api/sessions", requireAuth(), startHandler); // alias

// Multer for audio
const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const audioUpload = multer({ storage: audioStorage });

// 2) Upload audio (كما هو)
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
      // exec(`python whisper_run.py "${wavPath}"`, (error, stdout, stderr) => {
      //   if (error) {
      //     console.warn("Whisper failed:", error.message, stderr);
      //     return resolve("(audio received)");
      //   }
      //   resolve((stdout || "").toString().trim() || "(no speech)");
      // });
    }
  );

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

// ✅ 2-bis) تصحيح نصّي بدون صوت (للريل تايم)
app.post("/api/utterances/text", requireAuth(), async (req, res) => {
  try {
    const userId = authUser(req);
    const { sessionId, questionIdx, text } = req.body || {};
    if (!sessionId || !questionIdx) return res.status(400).json({ error: "sessionId, questionIdx required" });

    // خزّن كـ utterance على السكيمة الحالية
    const utter = await insertUtteranceFlexible({
      sessionId,
      questionIdx: Number(questionIdx),
      transcript: String(text || ""),
    });

    const { feedback, mistakes, words } = await generateCorrectionAndWords(String(text || ""));

    await pool.query(
      `INSERT INTO corrections (utterance_id, feedback, mistakes_json, created_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT DO NOTHING`,
      [utter.id, feedback, JSON.stringify(mistakes || [])]
    );

    await upsertVocabWords(userId, Array.isArray(words) ? words : []);
    res.json({ transcript: text || "", correction: { feedback, mistakes }, words });
  } catch (e) {
    console.error("POST /api/utterances/text", e);
    res.status(500).json({ error: e.message || "text correction failed" });
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
      // exec(`python whisper_run.py "${wavPath}"`, (error, stdout) => {
      //   if (error) return res.status(500).json({ error: "Whisper transcription failed", details: error.message });
      //   const transcript = (stdout || "").toString().trim();
      //   res.json({ transcript });
      // });
    })
    .save(wavPath);
});

// ---------- Realtime WS ----------

// (اختياري) توثيق WS عبر Clerk token. للتجربة المحلية ضعي SKIP_WS_AUTH=1
io.use(async (socket, next) => {
  if (process.env.SKIP_WS_AUTH === "1") {
    socket.data.userId = "dev-user";
    try {
      await pool.query(
        `INSERT INTO users (id, email, first_name, last_name)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO NOTHING`,
        ["dev-user", "dev@local", "Dev", "User"]
      );
    } catch (_) {}
    return next();
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
    if (!session?.sub) throw new Error("Invalid token");
    socket.data.userId = session.sub;
    next();
  } catch (e) {
    next(e);
  }
});

io.on("connection", (socket) => {
  // يبدأ اليوم بالكامل (تحفيز → موضوع → Q1 … Q6)
  socket.on("start_day", async ({ dayNumber = 1 }) => {
    try {
      const userId = socket.data.userId || "dev-user";
      const { topic, questions, vocab } = await getOrCreateTopicWithQuestions(Number(dayNumber));

      const s = await pool.query(
        `INSERT INTO sessions (user_id, topic_id, started_at, status)
         VALUES ($1,$2,NOW(),'active')
         ON CONFLICT (user_id, topic_id)
         DO UPDATE SET started_at = NOW(), status='active'
         RETURNING *`,
        [userId, topic.id]
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
          // نخزّن كـ utterance + correction على السكيمة الحالية
          const utter = await insertUtteranceFlexible({
            sessionId,
            questionIdx: Number(questionIdx),
            transcript: String(text || ""),
          });

          const { feedback, mistakes, words } = await generateCorrectionAndWords(String(text || ""));

          await pool.query(
            `INSERT INTO corrections (utterance_id, feedback, mistakes_json, created_at)
             VALUES ($1,$2,$3,NOW())
             ON CONFLICT DO NOTHING`,
            [utter.id, feedback, JSON.stringify(mistakes || [])]
          );

          if (Array.isArray(words) && words.length) {
            await upsertVocabWords(userId, words);
          }

          io.to(socket.id).emit("feedback", {
            questionIdx,
            transcript: text || "",
            correction: { feedback, mistakes },
            words: Array.isArray(words) ? words : [],
          });

          if (questionIdx < 6) await askWithTimer(questionIdx + 1);
          else io.to(socket.id).emit("lesson_finished", { sessionId });
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
