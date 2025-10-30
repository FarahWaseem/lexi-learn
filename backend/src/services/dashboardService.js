const { pool } = require('./db');

/**
 * 📊 Dashboard Service
 * Business logic للدشبورد
 */

/**
 * حساب معدل النمو بين فترتين
 */
const calculateGrowthRate = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

/**
 * جلب إحصائيات مقارنة بين فترتين
 */
const getComparisonStats = async (currentPeriod = 7, previousPeriod = 7) => {
  try {
    // الفترة الحالية
    const currentStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT s.id) AS sessions,
        COUNT(DISTINCT s.user_id) AS users,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_sessions,
        ROUND(AVG(c.overall_score), 2) AS avg_score
      FROM sessions s
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      WHERE s.started_at >= CURRENT_DATE - INTERVAL '${currentPeriod} days'
    `);

    // الفترة السابقة
    const previousStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT s.id) AS sessions,
        COUNT(DISTINCT s.user_id) AS users,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_sessions,
        ROUND(AVG(c.overall_score), 2) AS avg_score
      FROM sessions s
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      WHERE s.started_at >= CURRENT_DATE - INTERVAL '${currentPeriod + previousPeriod} days'
        AND s.started_at < CURRENT_DATE - INTERVAL '${currentPeriod} days'
    `);

    const current = currentStats.rows[0];
    const previous = previousStats.rows[0];

    return {
      current,
      previous,
      growth: {
        sessions: calculateGrowthRate(current.sessions, previous.sessions),
        users: calculateGrowthRate(current.users, previous.users),
        completedSessions: calculateGrowthRate(current.completed_sessions, previous.completed_sessions),
        avgScore: calculateGrowthRate(current.avg_score, previous.avg_score)
      }
    };
  } catch (err) {
    console.error('❌ Comparison stats error:', err);
    throw err;
  }
};

/**
 * جلب أكثر الأخطاء الشائعة في التصحيحات
 */
const getCommonErrors = async (limit = 10) => {
  try {
    // يمكنك تحسين هذا بناءً على كيفية تخزين الأخطاء
    const errorsQuery = await pool.query(`
      SELECT 
        c.feedback,
        COUNT(*) AS frequency,
        ROUND(AVG(c.grammar_score), 2) AS avg_grammar_score,
        ROUND(AVG(c.vocab_score), 2) AS avg_vocab_score
      FROM corrections c
      WHERE c.feedback IS NOT NULL AND c.feedback != ''
      GROUP BY c.feedback
      ORDER BY frequency DESC
      LIMIT $1
    `, [limit]);

    return errorsQuery.rows;
  } catch (err) {
    console.error('❌ Common errors error:', err);
    throw err;
  }
};

/**
 * جلب أفضل المستخدمين مع تفاصيل أكثر
 */
const getLeaderboard = async (metric = 'score', limit = 10) => {
  try {
    let orderBy = '';
    switch (metric) {
      case 'score':
        orderBy = 'avg_score DESC, completed_sessions DESC';
        break;
      case 'sessions':
        orderBy = 'completed_sessions DESC, avg_score DESC';
        break;
      case 'streak':
        orderBy = 'streak_current DESC, avg_score DESC';
        break;
      default:
        orderBy = 'avg_score DESC';
    }

    const leaderboardQuery = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.streak_current,
        u.streak_longest,
        COUNT(DISTINCT s.id) AS total_sessions,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_sessions,
        ROUND(AVG(c.overall_score), 2) AS avg_score,
        ROUND(AVG(c.fluency_score), 2) AS avg_fluency,
        ROUND(AVG(c.grammar_score), 2) AS avg_grammar,
        ROUND(AVG(c.vocab_score), 2) AS avg_vocab,
        MAX(s.started_at) AS last_session_at
      FROM users u
      JOIN sessions s ON s.user_id = u.id
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      WHERE s.status = 'completed'
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.streak_current, u.streak_longest
      HAVING COUNT(DISTINCT s.id) > 0
      ORDER BY ${orderBy}
      LIMIT $1
    `, [limit]);

    return leaderboardQuery.rows;
  } catch (err) {
    console.error('❌ Leaderboard error:', err);
    throw err;
  }
};

/**
 * جلب توزيع المستخدمين حسب المستوى
 */
const getUserDistributionByLevel = async () => {
  try {
    const distributionQuery = await pool.query(`
      SELECT 
        dt.level,
        COUNT(DISTINCT s.user_id) AS user_count,
        COUNT(DISTINCT s.id) AS session_count,
        ROUND(AVG(c.overall_score), 2) AS avg_score
      FROM sessions s
      JOIN daily_topics dt ON dt.id = s.topic_id
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      WHERE s.status = 'completed'
      GROUP BY dt.level
      ORDER BY dt.level
    `);

    return distributionQuery.rows;
  } catch (err) {
    console.error('❌ User distribution error:', err);
    throw err;
  }
};

/**
 * جلب متوسط الوقت لإكمال الدرس
 */
const getAverageCompletionTime = async () => {
  try {
    const avgTimeQuery = await pool.query(`
      SELECT 
        dt.day_number,
        dt.title_en,
        dt.level,
        COUNT(*) AS completed_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))/60), 2) AS avg_minutes
      FROM sessions s
      JOIN daily_topics dt ON dt.id = s.topic_id
      WHERE s.status = 'completed' 
        AND s.completed_at IS NOT NULL
        AND s.completed_at > s.started_at
      GROUP BY dt.day_number, dt.title_en, dt.level
      HAVING COUNT(*) >= 3
      ORDER BY dt.day_number
    `);

    return avgTimeQuery.rows;
  } catch (err) {
    console.error('❌ Average completion time error:', err);
    throw err;
  }
};

/**
 * جلب معدل الاحتفاظ بالمستخدمين (Retention Rate)
 */
const getRetentionRate = async () => {
  try {
    // المستخدمين النشطين في الأسبوع الأول
    const firstWeekQuery = await pool.query(`
      SELECT COUNT(DISTINCT user_id) AS users
      FROM sessions
      WHERE started_at >= CURRENT_DATE - INTERVAL '7 days'
    `);

    // المستخدمين الذين عادوا في الأسبوع الثاني
    const secondWeekQuery = await pool.query(`
      SELECT COUNT(DISTINCT s2.user_id) AS users
      FROM sessions s1
      JOIN sessions s2 ON s1.user_id = s2.user_id
      WHERE s1.started_at >= CURRENT_DATE - INTERVAL '14 days'
        AND s1.started_at < CURRENT_DATE - INTERVAL '7 days'
        AND s2.started_at >= CURRENT_DATE - INTERVAL '7 days'
    `);

    const firstWeekUsers = parseInt(firstWeekQuery.rows[0].users) || 0;
    const secondWeekUsers = parseInt(secondWeekQuery.rows[0].users) || 0;
    const retentionRate = firstWeekUsers > 0 
      ? Math.round((secondWeekUsers / firstWeekUsers) * 100)
      : 0;

    return {
      firstWeekUsers,
      secondWeekUsers,
      retentionRate
    };
  } catch (err) {
    console.error('❌ Retention rate error:', err);
    throw err;
  }
};

/**
 * جلب الدروس التي تحتاج تحسين
 */
const getTopicsNeedingImprovement = async (limit = 10) => {
  try {
    const topicsQuery = await pool.query(`
      SELECT 
        dt.id,
        dt.day_number,
        dt.title_en,
        dt.level,
        COUNT(DISTINCT s.id) AS total_attempts,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_count,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'abandoned') AS abandoned_count,
        ROUND(AVG(c.overall_score), 2) AS avg_score,
        ROUND(
          COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'abandoned')::NUMERIC / 
          NULLIF(COUNT(DISTINCT s.id)::NUMERIC, 0) * 100, 2
        ) AS abandon_rate
      FROM daily_topics dt
      LEFT JOIN sessions s ON s.topic_id = dt.id
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      WHERE s.id IS NOT NULL
      GROUP BY dt.id, dt.day_number, dt.title_en, dt.level
      HAVING COUNT(DISTINCT s.id) >= 3
      ORDER BY abandon_rate DESC, avg_score ASC
      LIMIT $1
    `, [limit]);

    return topicsQuery.rows;
  } catch (err) {
    console.error('❌ Topics needing improvement error:', err);
    throw err;
  }
};

/**
 * تصدير بيانات المستخدم (GDPR Compliance)
 */
const exportUserData = async (userId) => {
  try {
    // معلومات المستخدم
    const userQuery = await pool.query(`
      SELECT * FROM users WHERE id = $1
    `, [userId]);

    // جلسات المستخدم
    const sessionsQuery = await pool.query(`
      SELECT s.*, dt.title_en, dt.day_number, dt.level
      FROM sessions s
      JOIN daily_topics dt ON dt.id = s.topic_id
      WHERE s.user_id = $1
      ORDER BY s.started_at DESC
    `, [userId]);

    // محاولات المستخدم
    const attemptsQuery = await pool.query(`
      SELECT a.*, tq.prompt_en
      FROM attempts a
      JOIN sessions s ON s.id = a.session_id
      JOIN topic_questions tq ON tq.id = a.question_id
      WHERE s.user_id = $1
      ORDER BY a.started_at DESC
    `, [userId]);

    // التصحيحات
    const correctionsQuery = await pool.query(`
      SELECT c.*
      FROM corrections c
      JOIN attempts a ON a.id = c.attempt_id
      JOIN sessions s ON s.id = a.session_id
      WHERE s.user_id = $1
    `, [userId]);

    return {
      user: userQuery.rows[0],
      sessions: sessionsQuery.rows,
      attempts: attemptsQuery.rows,
      corrections: correctionsQuery.rows,
      exportedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('❌ Export user data error:', err);
    throw err;
  }
};

module.exports = {
  getComparisonStats,
  getCommonErrors,
  getLeaderboard,
  getUserDistributionByLevel,
  getAverageCompletionTime,
  getRetentionRate,
  getTopicsNeedingImprovement,
  exportUserData
};

