const { pool } = require('../services/db');

/**
 * 📚 Student Dashboard Controller
 * Provides data for the student's personal dashboard
 */

/**
 * GET /api/student/dashboard
 * Get all dashboard data for the current student
 */
const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.userId; // From Clerk middleware

    // 1. User Info
    const userQuery = await pool.query(
      `SELECT id, first_name, last_name, email, streak_current, streak_longest, last_active
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const user = userQuery.rows[0];

    // 2. Stats: New Words (from last 30 days)
    const newWordsQuery = await pool.query(
      `SELECT COUNT(DISTINCT tw.id) AS new_words
       FROM sessions s
       JOIN topic_words tw ON tw.topic_id = s.topic_id
       WHERE s.user_id = $1 
         AND s.started_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [userId]
    );

    // 3. Stats: Completed Lessons
    const completedLessonsQuery = await pool.query(
      `SELECT COUNT(DISTINCT s.id) AS completed_lessons
       FROM sessions s
       WHERE s.user_id = $1 AND s.status = 'completed'`,
      [userId]
    );

    // 4. Stats: Total Practice Time (in minutes)
    const totalTimeQuery = await pool.query(
      `SELECT ROUND(SUM(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))/60)) AS total_time
       FROM sessions s
       WHERE s.user_id = $1 
         AND s.status = 'completed'
         AND s.completed_at IS NOT NULL`,
      [userId]
    );

    // 5. Stats: Goal Progress (based on 60 lessons)
    const completedLessons = parseInt(completedLessonsQuery.rows[0].completed_lessons) || 0;
    const goalProgress = Math.round((completedLessons / 60) * 100);

    // 6. Recent Lessons (last 3 completed)
    const recentLessonsQuery = await pool.query(
      `SELECT 
         s.id,
         dt.day_number,
         dt.title_en AS title,
         dt.content AS desc,
         dt.level,
         s.completed_at,
         ROUND(AVG(c.overall_score), 2) AS avg_score
       FROM sessions s
       JOIN daily_topics dt ON dt.id = s.topic_id
       LEFT JOIN attempts a ON a.session_id = s.id
       LEFT JOIN corrections c ON c.attempt_id = a.id
       WHERE s.user_id = $1 AND s.status = 'completed'
       GROUP BY s.id, dt.day_number, dt.title_en, dt.content, dt.level, s.completed_at
       ORDER BY s.completed_at DESC
       LIMIT 3`,
      [userId]
    );

    // 7. Last Vocabs (from last 2 lessons, up to 8 words)
    const lastVocabsQuery = await pool.query(
      `SELECT DISTINCT ON (tw.id)
         tw.term AS en,
         tw.meaning AS ar,
         tw.audio_url
       FROM sessions s
       JOIN topic_words tw ON tw.topic_id = s.topic_id
       WHERE s.user_id = $1 AND s.status = 'completed'
       ORDER BY tw.id DESC, s.completed_at DESC
       LIMIT 8`,
      [userId]
    );

    // 8. Practice History (last 7 days)
    const practiceHistoryQuery = await pool.query(
      `SELECT 
         TO_CHAR(DATE(s.started_at), 'Dy') AS day,
         ROUND(SUM(EXTRACT(EPOCH FROM (COALESCE(s.completed_at, NOW()) - s.started_at))/60)) AS minutes
       FROM sessions s
       WHERE s.user_id = $1 
         AND s.started_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(s.started_at)
       ORDER BY DATE(s.started_at) ASC`,
      [userId]
    );

    // 9. Next Lesson (first incomplete day)
    const nextLessonQuery = await pool.query(
      `SELECT 
         dt.id,
         dt.day_number,
         dt.title_en AS title,
         dt.content AS desc,
         dt.level
       FROM daily_topics dt
       WHERE dt.id NOT IN (
         SELECT DISTINCT topic_id 
         FROM sessions 
         WHERE user_id = $1 AND status = 'completed'
       )
       ORDER BY dt.day_number ASC
       LIMIT 1`,
      [userId]
    );

    // Build response
    const response = {
      ok: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        streakDays: user.streak_current,
        streakLongest: user.streak_longest,
        lastActive: user.last_active,
      },
      stats: {
        newWords: parseInt(newWordsQuery.rows[0]?.new_words) || 0,
        completedLessons,
        totalTime: parseInt(totalTimeQuery.rows[0]?.total_time) || 0,
        goalProgress,
      },
      lessons: recentLessonsQuery.rows.map(lesson => ({
        id: lesson.id,
        dayNumber: lesson.day_number,
        title: lesson.title,
        desc: lesson.desc || `Day ${lesson.day_number} - ${lesson.level}`,
        level: lesson.level,
        completedAt: lesson.completed_at,
        avgScore: lesson.avg_score,
        vocabs: [], // Will be populated separately if needed
      })),
      vocabs: lastVocabsQuery.rows,
      practiceHistory: practiceHistoryQuery.rows.map(row => ({
        day: row.day,
        minutes: parseInt(row.minutes) || 0,
      })),
      nextLesson: nextLessonQuery.rows[0] || null,
    };

    res.json(response);
  } catch (err) {
    console.error('❌ Student dashboard error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/student/stats
 * Get only stats for header
 */
const getStudentStats = async (req, res) => {
  try {
    const userId = req.userId;

    const userQuery = await pool.query(
      `SELECT first_name, last_name, streak_current FROM users WHERE id = $1`,
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const user = userQuery.rows[0];

    const statsQuery = await pool.query(
      `SELECT 
         (SELECT COUNT(DISTINCT tw.id) 
          FROM sessions s 
          JOIN topic_words tw ON tw.topic_id = s.topic_id
          WHERE s.user_id = $1 AND s.started_at >= CURRENT_DATE - INTERVAL '30 days') AS new_words,
         
         (SELECT COUNT(DISTINCT s.id) 
          FROM sessions s 
          WHERE s.user_id = $1 AND s.status = 'completed') AS completed_lessons,
         
         (SELECT ROUND(SUM(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))/60))
          FROM sessions s 
          WHERE s.user_id = $1 AND s.status = 'completed' AND s.completed_at IS NOT NULL) AS total_time
      `,
      [userId]
    );

    const stats = statsQuery.rows[0];
    const completedLessons = parseInt(stats.completed_lessons) || 0;
    const goalProgress = Math.round((completedLessons / 60) * 100);

    res.json({
      ok: true,
      user: {
        name: `${user.first_name} ${user.last_name}`,
        streakDays: user.streak_current,
      },
      stats: {
        newWords: parseInt(stats.new_words) || 0,
        completedLessons,
        totalTime: parseInt(stats.total_time) || 0,
        goalProgress,
      },
    });
  } catch (err) {
    console.error('❌ Student stats error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/student/recent-lessons
 * Get recent completed lessons
 */
const getRecentLessons = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 3 } = req.query;

    const lessonsQuery = await pool.query(
      `SELECT 
         s.id,
         dt.day_number,
         dt.title_en AS title,
         dt.content AS desc,
         dt.level,
         s.completed_at
       FROM sessions s
       JOIN daily_topics dt ON dt.id = s.topic_id
       WHERE s.user_id = $1 AND s.status = 'completed'
       ORDER BY s.completed_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    // Get vocabs for each lesson
    const lessons = await Promise.all(
      lessonsQuery.rows.map(async (lesson) => {
        const vocabsQuery = await pool.query(
          `SELECT 
             tw.term AS en,
             tw.meaning AS ar
           FROM sessions s
           JOIN topic_words tw ON tw.topic_id = s.topic_id
           WHERE s.id = $1
           LIMIT 3`,
          [lesson.id]
        );

        return {
          id: lesson.id,
          dayNumber: lesson.day_number,
          title: lesson.title,
          desc: lesson.desc || `Day ${lesson.day_number} - ${lesson.level}`,
          vocabs: vocabsQuery.rows,
        };
      })
    );

    res.json({ ok: true, lessons });
  } catch (err) {
    console.error('❌ Recent lessons error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/student/practice-history
 * Get practice history for the last 7 days
 */
const getPracticeHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 7 } = req.query;

    const historyQuery = await pool.query(
      `SELECT 
         TO_CHAR(DATE(s.started_at), 'Dy') AS day,
         DATE(s.started_at) AS date,
         ROUND(SUM(EXTRACT(EPOCH FROM (COALESCE(s.completed_at, NOW()) - s.started_at))/60)) AS minutes
       FROM sessions s
       WHERE s.user_id = $1 
         AND s.started_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
       GROUP BY DATE(s.started_at)
       ORDER BY DATE(s.started_at) ASC`,
      [userId]
    );

    res.json({
      ok: true,
      practiceHistory: historyQuery.rows.map(row => ({
        day: row.day,
        date: row.date,
        minutes: parseInt(row.minutes) || 0,
      })),
    });
  } catch (err) {
    console.error('❌ Practice history error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/student/next-lesson
 * Get the next lesson to study
 */
const getNextLesson = async (req, res) => {
  try {
    const userId = req.userId;

    const nextLessonQuery = await pool.query(
      `SELECT 
         dt.id,
         dt.day_number,
         dt.title_en AS title,
         dt.content AS desc,
         dt.level,
         dt.estimated_minutes
       FROM daily_topics dt
       WHERE dt.id NOT IN (
         SELECT DISTINCT topic_id 
         FROM sessions 
         WHERE user_id = $1 AND status = 'completed'
       )
       ORDER BY dt.day_number ASC
       LIMIT 1`,
      [userId]
    );

    if (nextLessonQuery.rows.length === 0) {
      return res.json({
        ok: true,
        nextLesson: null,
        message: 'Congratulations! You have completed all lessons!',
      });
    }

    res.json({
      ok: true,
      nextLesson: {
        id: nextLessonQuery.rows[0].id,
        dayNumber: nextLessonQuery.rows[0].day_number,
        title: nextLessonQuery.rows[0].title,
        desc: nextLessonQuery.rows[0].desc || '',
        level: nextLessonQuery.rows[0].level,
        estimatedMinutes: nextLessonQuery.rows[0].estimated_minutes,
      },
    });
  } catch (err) {
    console.error('❌ Next lesson error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = {
  getStudentDashboard,
  getStudentStats,
  getRecentLessons,
  getPracticeHistory,
  getNextLesson,
};

