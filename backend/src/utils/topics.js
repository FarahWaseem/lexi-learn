const path = require('path');
const { pool } = require('../services/db');

let topicsSeed = [];
try {
  topicsSeed = require(path.join(__dirname, '..', '..', 'topics.json'));
} catch {
  console.warn('⚠️ topics.json not found. Will fallback to defaults.');
}

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

  const existingQ = await pool.query(
    `SELECT id, question_idx, prompt_en
     FROM topic_questions
     WHERE topic_id=$1 ORDER BY question_idx ASC`,
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
         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [topic.id, i + 1, defaults[i]]
      );
    }
  }

  const qrows = await pool.query(
    `SELECT id, question_idx, prompt_en
     FROM topic_questions WHERE topic_id=$1 ORDER BY question_idx`,
    [topic.id]
  );

  const vrows = await pool.query(
    `SELECT term AS word, meaning, example, audio_url
     FROM topic_words WHERE topic_id=$1 ORDER BY id`,
    [topic.id]
  );

  return { topic, questions: qrows.rows, vocab: vrows.rows };
}

module.exports = { getOrCreateTopicWithQuestions };

