const express = require('express');
const PDFDocument = require('pdfkit');
const path = require('path');
const router = express.Router();

const { pool } = require('../services/db');
const { requireAuth, getAuth, requireUser, resolveUsername } = require('../services/clerk');
const { getOrCreateTopicWithQuestions } = require('../utils/topics');
const { buildDetailedFeedback } = require('../utils/feedback');
const { asDate, fmtDate } = require('../utils/pdf');

// start session
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

    const openingMessage = `Awesome! Let's study today. Topic: ${topic.title_en} (Level ${topic.level}).`;
    const firstQuestion = questions[0] || null;

    console.log('✅ session started id=', sessionRow.id);
    return res.status(201).json({
      session: sessionRow,
      topic,
      questions,
      vocab,
      openingMessage,
      firstQuestion,
    });
  } catch (e) {
    console.error('POST /sessions/start', e);
    return res.status(500).json({ error: e.message || 'start failed' });
  }
};

router.post('/start', requireAuth, startHandler);
router.post('/', requireAuth(), startHandler);

router.post('/:id/finish', requireAuth, async (req, res) => {
  try {
    const uuidUserId = await requireUser(req);
    const { id } = req.params;
    await pool.query(`UPDATE sessions SET status='completed', completed_at=NOW() WHERE id=$1 AND user_id=$2`, [
      id, uuidUserId,
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /sessions/:id/finish', e);
    res.status(500).json({ error: e.message || 'finish failed' });
  }
});

router.get('/:id/summary', requireAuth(), async (req, res) => {
  try {
    const uuidUserId = await requireUser(req);
    const { id } = req.params;

    const basics = await pool.query(
      `SELECT s.id, s.started_at, s.completed_at, s.status,
              t.title_en, t.level, t.day_number
       FROM sessions s JOIN daily_topics t ON t.id = s.topic_id
       WHERE s.id=$1 AND s.user_id=$2`, [id, uuidUserId]
    );
    if (!basics.rows.length) return res.status(404).json({ error: 'Not found' });

    const rows = await pool.query(
      `SELECT tq.question_idx, tq.prompt_en,
              (SELECT text FROM utterances u
               WHERE u.attempt_id=a.id AND u.role='user'
               ORDER BY created_at DESC LIMIT 1) AS user_text,
              (SELECT feedback FROM corrections c WHERE c.attempt_id=a.id) AS feedback,
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
    console.error('GET /sessions/:id/summary', e);
    res.status(500).json({ error: e.message || 'summary failed' });
  }
});

// compact lesson summary for UI cards
router.get('/:id/lesson-summary', async (req, res) => {
  try {
    const { id } = req.params;

    const metaQ = `
      SELECT dt.title_en, dt.level, dt.day_number
      FROM sessions s JOIN daily_topics dt ON dt.id = s.topic_id
      WHERE s.id=$1 LIMIT 1;`;
    const meta = await pool.query(metaQ, [id]);
    if (!meta.rows[0]) return res.status(404).json({ error: 'Session not found' });

    const perfQ = `
      SELECT ROUND(AVG(c.overall_score))::int AS overall
      FROM attempts a JOIN corrections c ON c.attempt_id = a.id
      WHERE a.session_id = $1;`;
    const perf = await pool.query(perfQ, [id]);
    const performance = Number(perf.rows[0]?.overall || 0);

    const vocabQ = `
      SELECT tw.term AS word, COALESCE(tw.meaning,'') AS meaning
      FROM sessions s JOIN topic_words tw ON tw.topic_id = s.topic_id
      WHERE s.id=$1 ORDER BY tw.id ASC LIMIT 6;`;
    const vocab = (await pool.query(vocabQ, [id])).rows;

    const recapQ = `
      SELECT q.prompt_en
      FROM attempts a JOIN topic_questions q ON q.id = a.question_id
      WHERE a.session_id=$1 ORDER BY q.question_idx ASC LIMIT 2;`;
    const recapRows = (await pool.query(recapQ, [id])).rows;
    const recap = `Today, you practiced: ${recapRows.map((r) => r.prompt_en).join("; ")}.`;

    const fbQ = `
      SELECT c.feedback
      FROM attempts a JOIN corrections c ON c.attempt_id = a.id
      WHERE a.session_id=$1 AND c.feedback IS NOT NULL
      ORDER BY a.started_at ASC LIMIT 1;`;
    const fb = await pool.query(fbQ, [id]);
    const grammarFeedback = fb.rows[0]?.feedback || "Good effort. Keep your sentences concise.";

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
      performance,
      recap,
      vocab,
      positivePoints: positive,
      grammarFeedback,
    });
  } catch (e) {
    console.error('GET /sessions/:id/lesson-summary', e);
    res.status(500).json({ error: 'Failed to build lesson summary' });
  }
});

// GET /api/sessions/:id/export.pdf - سأضيف المنطق الكامل من السيرفر القديم
router.get('/:id/export.pdf', requireAuth(), async (req, res) => {
  res.setHeader("Content-Type", "application/pdf");

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  let pdfErrored = false;
  doc.on("error", (err) => {
    pdfErrored = true;
    console.error("PDF error:", err?.message || err);
    try { res.end(); } catch {}
  });

  try {
    const auth = getAuth(req);
    const uname = await resolveUsername(auth.userId);
    const uuidUserId = await requireUser(req);
    const { id } = req.params;

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

    // المحادثة الكاملة
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

    const scoreAgg = await pool.query(
      `SELECT ROUND(AVG((COALESCE(c.fluency_score,0)+COALESCE(c.grammar_score,0)+COALESCE(c.vocab_score,0))/3.0))::int AS overall
       FROM attempts a LEFT JOIN corrections c ON c.attempt_id=a.id
       WHERE a.session_id=$1`,
      [id]
    );
    const performance = Number(scoreAgg.rows[0]?.overall || 0);

    res.setHeader("Content-Disposition", `attachment; filename="lesson-${session.day_number}.pdf"`);
    doc.pipe(res);

    doc.info = {
      Title: `Lesson Day ${session.day_number}`,
      Author: "LexiLearn",
      Subject: "Lesson Summary",
      CreationDate: asDate(session.started_at || Date.now()),
      ModDate: asDate(session.completed_at || Date.now()),
    };

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
      const x = 52, y = doc.y + 2;
      const w = Math.max(0, Math.min(maxW, Math.round((val / 100) * maxW)));
      doc.fontSize(11).fillColor("#111827").text(`${label}: ${val}%`, 52, doc.y);
      doc.roundedRect(x, y + 16, maxW, 10, 5).fillAndStroke(LINE, LINE);
      doc.roundedRect(x, y + 16, w, 10, 5).fill(ACCENT);
      doc.moveDown(1.2);
    };
    const pill = (txt) => {
      const px = doc.x, py = doc.y;
      const padX = 8, padY = 3;
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
      const x = 52, y = doc.y, w = doc.page.width - 104;
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
      const cols = 2, gutter = 16;
      const usableW = doc.page.width - 104;
      const colW = (usableW - gutter) / cols;
      let cx = 52, cy = doc.y;
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

    // Recap + Grammar Feedback
    const recapText = rows.rows.length ? `Today, you practiced: ${rows.rows.slice(0, 2).map((r) => r.prompt_en).join("; ")}.` : "Good practice today.";
    boxed("Lesson Recap", recapText);
    const firstFb = rows.rows.find((r) => r.feedback);
    if (firstFb?.feedback) boxed("Grammar Feedback", firstFb.feedback);
    drawLine();

    // Conversation Timeline
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

        if (doc.y > doc.page.height - 120) doc.addPage();
      }

      doc.moveDown(0.8);
      drawLine();
    }

    // Per-Question Details
    sectionTitle("Per-Question Details");
    rows.rows.forEach(questionBlock);

    // Footer
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

module.exports = router;

