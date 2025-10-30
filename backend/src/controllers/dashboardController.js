const { pool } = require('../services/db');

/**
 * 📊 Dashboard Controller
 * يوفر إحصائيات شاملة لواجهة الإدارة
 */

/**
 * GET /api/dashboard/stats
 * إحصائيات عامة للنظام
 */
const getGeneralStats = async (req, res) => {
  try {
    // 1. إحصائيات المستخدمين
    const usersStats = await pool.query(`
      SELECT 
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE is_active = true) AS active_users,
        COUNT(*) FILTER (WHERE last_active >= CURRENT_DATE - INTERVAL '7 days') AS active_last_7_days,
        COUNT(*) FILTER (WHERE last_active >= CURRENT_DATE - INTERVAL '30 days') AS active_last_30_days,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS new_users_7_days,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS new_users_30_days
      FROM users
    `);

    // 2. إحصائيات الجلسات
    const sessionsStats = await pool.query(`
      SELECT 
        COUNT(*) AS total_sessions,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_sessions,
        COUNT(*) FILTER (WHERE status = 'active') AS active_sessions,
        COUNT(*) FILTER (WHERE status = 'abandoned') AS abandoned_sessions,
        COUNT(*) FILTER (WHERE started_at >= CURRENT_DATE - INTERVAL '7 days') AS sessions_last_7_days,
        COUNT(*) FILTER (WHERE started_at >= CURRENT_DATE - INTERVAL '30 days') AS sessions_last_30_days,
        ROUND(
          COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / 
          NULLIF(COUNT(*)::NUMERIC, 0) * 100, 2
        ) AS completion_rate
      FROM sessions
    `);

    // 3. إحصائيات الأداء
    const performanceStats = await pool.query(`
      SELECT 
        ROUND(AVG(overall_score), 2) AS avg_overall_score,
        ROUND(AVG(fluency_score), 2) AS avg_fluency_score,
        ROUND(AVG(grammar_score), 2) AS avg_grammar_score,
        ROUND(AVG(vocab_score), 2) AS avg_vocab_score,
        MAX(overall_score) AS max_score,
        MIN(overall_score) AS min_score
      FROM corrections
    `);

    // 4. إحصائيات المحاولات
    const attemptsStats = await pool.query(`
      SELECT 
        COUNT(*) AS total_attempts,
        COUNT(DISTINCT session_id) AS unique_sessions,
        COUNT(DISTINCT question_id) AS unique_questions,
        ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT session_id)::NUMERIC, 0), 2) AS avg_attempts_per_session
      FROM attempts
    `);

    // 5. إحصائيات الدروس
    const topicsStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT dt.id) AS total_topics,
        COUNT(DISTINCT s.topic_id) AS topics_started,
        COUNT(DISTINCT s.topic_id) FILTER (WHERE s.status = 'completed') AS topics_completed
      FROM daily_topics dt
      LEFT JOIN sessions s ON s.topic_id = dt.id
    `);

    // 6. النشاط اليومي (آخر 7 أيام)
    const dailyActivity = await pool.query(`
      SELECT 
        DATE(started_at) AS date,
        COUNT(*) AS sessions_count,
        COUNT(DISTINCT user_id) AS unique_users
      FROM sessions
      WHERE started_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(started_at)
      ORDER BY date DESC
    `);

    res.json({
      ok: true,
      stats: {
        users: usersStats.rows[0],
        sessions: sessionsStats.rows[0],
        performance: performanceStats.rows[0],
        attempts: attemptsStats.rows[0],
        topics: topicsStats.rows[0],
        dailyActivity: dailyActivity.rows
      }
    });
  } catch (err) {
    console.error('❌ Dashboard stats error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/dashboard/users
 * قائمة المستخدمين مع إحصائياتهم
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    // بناء شرط البحث
    const searchCondition = search 
      ? `WHERE (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1)`
      : '';
    const searchParam = search ? `%${search}%` : null;

    // التحقق من صحة sortBy
    const validSortColumns = ['created_at', 'last_active', 'streak_current', 'total_sessions', 'avg_score'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // جلب المستخدمين مع إحصائياتهم
    const usersQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.streak_current,
        u.streak_longest,
        u.last_active,
        u.created_at,
        u.is_active,
        COUNT(DISTINCT s.id) AS total_sessions,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_sessions,
        ROUND(AVG(c.overall_score), 2) AS avg_score,
        MAX(s.started_at) AS last_session_at
      FROM users u
      LEFT JOIN sessions s ON s.user_id = u.id
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      ${searchCondition}
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.streak_current, 
               u.streak_longest, u.last_active, u.created_at, u.is_active
      ORDER BY ${sortColumn} ${order}
      LIMIT $${searchParam ? 2 : 1} OFFSET $${searchParam ? 3 : 2}
    `;

    const params = searchParam 
      ? [searchParam, limit, offset]
      : [limit, offset];

    const users = await pool.query(usersQuery, params);

    // عدد المستخدمين الكلي
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) AS total
      FROM users u
      ${searchCondition}
    `;
    const countParams = searchParam ? [searchParam] : [];
    const totalCount = await pool.query(countQuery, countParams);

    res.json({
      ok: true,
      users: users.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalCount.rows[0].total),
        totalPages: Math.ceil(totalCount.rows[0].total / limit)
      }
    });
  } catch (err) {
    console.error('❌ Dashboard users error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/dashboard/users/:id
 * تفاصيل مستخدم محدد مع كامل إحصائياته
 */
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. معلومات المستخدم الأساسية
    const userQuery = await pool.query(`
      SELECT 
        u.*,
        COUNT(DISTINCT s.id) AS total_sessions,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_sessions,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') AS active_sessions,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'abandoned') AS abandoned_sessions
      FROM users u
      LEFT JOIN sessions s ON s.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const user = userQuery.rows[0];

    // 2. إحصائيات الأداء
    const performanceQuery = await pool.query(`
      SELECT 
        ROUND(AVG(c.overall_score), 2) AS avg_overall_score,
        ROUND(AVG(c.fluency_score), 2) AS avg_fluency_score,
        ROUND(AVG(c.grammar_score), 2) AS avg_grammar_score,
        ROUND(AVG(c.vocab_score), 2) AS avg_vocab_score,
        MAX(c.overall_score) AS max_score,
        MIN(c.overall_score) AS min_score,
        COUNT(*) AS total_corrections
      FROM sessions s
      JOIN attempts a ON a.session_id = s.id
      JOIN corrections c ON c.attempt_id = a.id
      WHERE s.user_id = $1
    `, [id]);

    // 3. آخر الجلسات
    const recentSessionsQuery = await pool.query(`
      SELECT 
        s.id,
        s.started_at,
        s.completed_at,
        s.status,
        dt.title_en AS topic_title,
        dt.day_number,
        dt.level,
        ROUND(AVG(c.overall_score), 2) AS avg_score
      FROM sessions s
      JOIN daily_topics dt ON dt.id = s.topic_id
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      WHERE s.user_id = $1
      GROUP BY s.id, s.started_at, s.completed_at, s.status, dt.title_en, dt.day_number, dt.level
      ORDER BY s.started_at DESC
      LIMIT 10
    `, [id]);

    // 4. تقدم المستخدم عبر الوقت (آخر 30 يوم)
    const progressQuery = await pool.query(`
      SELECT 
        DATE(s.started_at) AS date,
        COUNT(*) AS sessions_count,
        ROUND(AVG(c.overall_score), 2) AS avg_score
      FROM sessions s
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      WHERE s.user_id = $1 
        AND s.started_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(s.started_at)
      ORDER BY date ASC
    `, [id]);

    // 5. الدروس المكتملة
    const completedTopicsQuery = await pool.query(`
      SELECT 
        dt.day_number,
        dt.title_en,
        dt.level,
        s.completed_at,
        ROUND(AVG(c.overall_score), 2) AS avg_score
      FROM sessions s
      JOIN daily_topics dt ON dt.id = s.topic_id
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      WHERE s.user_id = $1 AND s.status = 'completed'
      GROUP BY dt.day_number, dt.title_en, dt.level, s.completed_at
      ORDER BY dt.day_number ASC
    `, [id]);

    res.json({
      ok: true,
      user,
      performance: performanceQuery.rows[0],
      recentSessions: recentSessionsQuery.rows,
      progress: progressQuery.rows,
      completedTopics: completedTopicsQuery.rows
    });
  } catch (err) {
    console.error('❌ Dashboard user details error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/dashboard/sessions
 * قائمة الجلسات مع تفاصيلها
 */
const getSessions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = '', 
      userId = '',
      sortBy = 'started_at',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;

    // بناء شروط الفلترة
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`s.status = $${paramIndex++}`);
      params.push(status);
    }

    if (userId) {
      conditions.push(`s.user_id = $${paramIndex++}`);
      params.push(userId);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // التحقق من صحة sortBy
    const validSortColumns = ['started_at', 'completed_at', 'avg_score', 'status'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'started_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // جلب الجلسات
    const sessionsQuery = `
      SELECT 
        s.id,
        s.user_id,
        s.started_at,
        s.completed_at,
        s.status,
        u.first_name,
        u.last_name,
        u.email,
        dt.title_en AS topic_title,
        dt.day_number,
        dt.level,
        COUNT(DISTINCT a.id) AS total_attempts,
        ROUND(AVG(c.overall_score), 2) AS avg_score
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      JOIN daily_topics dt ON dt.id = s.topic_id
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      ${whereClause}
      GROUP BY s.id, s.user_id, s.started_at, s.completed_at, s.status,
               u.first_name, u.last_name, u.email, dt.title_en, dt.day_number, dt.level
      ORDER BY ${sortColumn} ${order}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    params.push(limit, offset);
    const sessions = await pool.query(sessionsQuery, params);

    // عدد الجلسات الكلي
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM sessions s
      ${whereClause}
    `;
    const countParams = params.slice(0, conditions.length);
    const totalCount = await pool.query(countQuery, countParams);

    res.json({
      ok: true,
      sessions: sessions.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalCount.rows[0].total),
        totalPages: Math.ceil(totalCount.rows[0].total / limit)
      }
    });
  } catch (err) {
    console.error('❌ Dashboard sessions error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/dashboard/topics
 * إحصائيات الدروس
 */
const getTopicsStats = async (req, res) => {
  try {
    const topicsQuery = await pool.query(`
      SELECT 
        dt.id,
        dt.day_number,
        dt.title_en,
        dt.level,
        dt.estimated_minutes,
        COUNT(DISTINCT s.id) AS total_sessions,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_sessions,
        COUNT(DISTINCT s.user_id) AS unique_users,
        ROUND(AVG(c.overall_score), 2) AS avg_score,
        ROUND(
          COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed')::NUMERIC / 
          NULLIF(COUNT(DISTINCT s.id)::NUMERIC, 0) * 100, 2
        ) AS completion_rate
      FROM daily_topics dt
      LEFT JOIN sessions s ON s.topic_id = dt.id
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      GROUP BY dt.id, dt.day_number, dt.title_en, dt.level, dt.estimated_minutes
      ORDER BY dt.day_number ASC
    `);

    // إحصائيات حسب المستوى
    const levelStatsQuery = await pool.query(`
      SELECT 
        dt.level,
        COUNT(DISTINCT dt.id) AS total_topics,
        COUNT(DISTINCT s.id) AS total_sessions,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_sessions,
        ROUND(AVG(c.overall_score), 2) AS avg_score
      FROM daily_topics dt
      LEFT JOIN sessions s ON s.topic_id = dt.id
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      GROUP BY dt.level
      ORDER BY dt.level
    `);

    res.json({
      ok: true,
      topics: topicsQuery.rows,
      levelStats: levelStatsQuery.rows
    });
  } catch (err) {
    console.error('❌ Dashboard topics stats error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/dashboard/analytics
 * تحليلات متقدمة
 */
const getAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // عدد الأيام
    const days = parseInt(period) || 30;

    // 1. النشاط اليومي
    const dailyActivityQuery = await pool.query(`
      SELECT 
        DATE(started_at) AS date,
        COUNT(DISTINCT s.id) AS sessions,
        COUNT(DISTINCT s.user_id) AS unique_users,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed,
        ROUND(AVG(c.overall_score), 2) AS avg_score
      FROM sessions s
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      WHERE s.started_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(started_at)
      ORDER BY date ASC
    `);

    // 2. توزيع الدرجات
    const scoreDistributionQuery = await pool.query(`
      SELECT 
        CASE 
          WHEN overall_score >= 90 THEN '90-100'
          WHEN overall_score >= 80 THEN '80-89'
          WHEN overall_score >= 70 THEN '70-79'
          WHEN overall_score >= 60 THEN '60-69'
          WHEN overall_score >= 50 THEN '50-59'
          ELSE '0-49'
        END AS score_range,
        COUNT(*) AS count,
        ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM corrections)::NUMERIC * 100, 2) AS percentage
      FROM corrections
      GROUP BY score_range
      ORDER BY score_range DESC
    `);

    // 3. أفضل المستخدمين
    const topUsersQuery = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(DISTINCT s.id) AS total_sessions,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_sessions,
        ROUND(AVG(c.overall_score), 2) AS avg_score,
        u.streak_current
      FROM users u
      JOIN sessions s ON s.user_id = u.id
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.streak_current
      HAVING COUNT(DISTINCT s.id) > 0
      ORDER BY avg_score DESC, completed_sessions DESC
      LIMIT 10
    `);

    // 4. نسب الإكمال حسب المستوى
    const completionByLevelQuery = await pool.query(`
      SELECT 
        dt.level,
        COUNT(DISTINCT s.id) AS total_sessions,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_sessions,
        ROUND(
          COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed')::NUMERIC / 
          NULLIF(COUNT(DISTINCT s.id)::NUMERIC, 0) * 100, 2
        ) AS completion_rate
      FROM daily_topics dt
      LEFT JOIN sessions s ON s.topic_id = dt.id
      GROUP BY dt.level
      ORDER BY dt.level
    `);

    // 5. معدل النمو الأسبوعي
    const weeklyGrowthQuery = await pool.query(`
      SELECT 
        DATE_TRUNC('week', started_at) AS week,
        COUNT(DISTINCT s.id) AS sessions,
        COUNT(DISTINCT s.user_id) AS unique_users
      FROM sessions s
      WHERE s.started_at >= CURRENT_DATE - INTERVAL '12 weeks'
      GROUP BY week
      ORDER BY week ASC
    `);

    res.json({
      ok: true,
      analytics: {
        dailyActivity: dailyActivityQuery.rows,
        scoreDistribution: scoreDistributionQuery.rows,
        topUsers: topUsersQuery.rows,
        completionByLevel: completionByLevelQuery.rows,
        weeklyGrowth: weeklyGrowthQuery.rows
      }
    });
  } catch (err) {
    console.error('❌ Dashboard analytics error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/dashboard/recent-activity
 * النشاط الأخير في النظام
 */
const getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const activityQuery = await pool.query(`
      SELECT 
        'session' AS type,
        s.id,
        s.started_at AS timestamp,
        u.first_name,
        u.last_name,
        u.email,
        dt.title_en AS topic_title,
        dt.day_number,
        s.status
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      JOIN daily_topics dt ON dt.id = s.topic_id
      ORDER BY s.started_at DESC
      LIMIT $1
    `, [limit]);

    res.json({
      ok: true,
      activity: activityQuery.rows
    });
  } catch (err) {
    console.error('❌ Dashboard recent activity error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = {
  getGeneralStats,
  getUsers,
  getUserDetails,
  getSessions,
  getTopicsStats,
  getAnalytics,
  getRecentActivity
};

