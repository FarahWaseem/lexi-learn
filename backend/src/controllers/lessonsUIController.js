const { query } = require('../config/database');

// @desc    Get lessons for UI (compatible with Lessons.jsx)
// @route   GET /api/v1/lessons/ui
// @access  Private (Clerk)
const getLessonsForUI = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 10, 
      search, 
      lesson, 
      status, 
      sortBy = 'day_number', 
      sortOrder = 'asc' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let queryParams = [];
    let paramCount = 0;

    // Add search filter if provided
    if (search) {
      paramCount++;
      whereClause += `WHERE title_en ILIKE $${paramCount}`;
      queryParams.push(`%${search}%`);
    }

    // Add lesson filter if provided
    if (lesson) {
      paramCount++;
      const lessonCondition = `title_en = $${paramCount}`;
      whereClause += whereClause ? ` AND ${lessonCondition}` : `WHERE ${lessonCondition}`;
      queryParams.push(lesson);
    }

    // Build ORDER BY clause
    const validSortColumns = ['day_number', 'title_en', 'level', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'day_number';
    const orderDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    
    const orderBy = `ORDER BY ${sortColumn} ${orderDirection}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM daily_topics 
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const dataQuery = `
      SELECT 
        id,
        day_number,
        title_en,
        level,
        content,
        audio_url,
        estimated_minutes,
        created_at
      FROM daily_topics 
      ${whereClause}
      ${orderBy}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    queryParams.push(limit, offset);
    
    const result = await query(dataQuery, queryParams);

    // Get user progress for each lesson
    const lessonIds = result.rows.map(lesson => lesson.id);
    let userProgress = {};
    
    if (lessonIds.length > 0) {
      const progressQuery = `
        SELECT 
          s.topic_id,
          s.status,
          COUNT(a.id) as completed_questions,
          ROUND(AVG(c.overall_score), 2) as avg_score
        FROM sessions s
        LEFT JOIN attempts a ON a.session_id = s.id
        LEFT JOIN corrections c ON c.attempt_id = a.id
        WHERE s.user_id = $1 AND s.topic_id = ANY($2)
        GROUP BY s.topic_id, s.status
      `;
      
      const progressResult = await query(progressQuery, [userId, lessonIds]);
      userProgress = progressResult.rows.reduce((acc, row) => {
        acc[row.topic_id] = {
          status: row.status,
          completedQuestions: parseInt(row.completed_questions),
          avgScore: parseFloat(row.avg_score) || 0
        };
        return acc;
      }, {});
    }

    // Format lessons to match frontend expectations
    const formattedLessons = result.rows.map(lesson => {
      const progress = userProgress[lesson.id] || {
        status: 'new',
        completedQuestions: 0,
        avgScore: 0
      };

      // Determine status based on progress
      let lessonStatus = 'new';
      if (progress.status === 'completed') {
        lessonStatus = 'completed';
      } else if (progress.status === 'active' || progress.completedQuestions > 0) {
        lessonStatus = 'in_progress';
      }

      return {
        id: lesson.id,
        title: lesson.title_en,
        description: lesson.content || `Learn about ${lesson.title_en.toLowerCase()}`,
        status: lessonStatus,
        level: lesson.level,
        estimatedMinutes: lesson.estimated_minutes,
        audioUrl: lesson.audio_url,
        dayNumber: lesson.day_number,
        completedQuestions: progress.completedQuestions,
        avgScore: progress.avgScore,
        createdAt: lesson.created_at
      };
    });

    // Get unique lessons for filtering
    const uniqueLessonsQuery = `
      SELECT DISTINCT title_en 
      FROM daily_topics 
      ORDER BY title_en ASC
    `;
    const uniqueLessonsResult = await query(uniqueLessonsQuery);
    const uniqueLessons = uniqueLessonsResult.rows.map(row => row.title_en);

    res.json({
      success: true,
      data: {
        lessons: formattedLessons,
        totalLessons: total,
        uniqueLessons,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get lessons for UI error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lessons'
    });
  }
};

// @desc    Get lesson details for UI
// @route   GET /api/v1/lessons/ui/:id
// @access  Private (Clerk)
const getLessonDetailsForUI = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get lesson details
    const lessonResult = await query(
      'SELECT * FROM daily_topics WHERE id = $1',
      [id]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const lesson = lessonResult.rows[0];

    // Get lesson words
    const wordsResult = await query(
      'SELECT * FROM topic_words WHERE topic_id = $1 ORDER BY term ASC',
      [id]
    );

    // Get lesson questions
    const questionsResult = await query(
      'SELECT * FROM topic_questions WHERE topic_id = $1 ORDER BY question_idx ASC',
      [id]
    );

    // Get user progress for this lesson
    const progressResult = await query(
      `SELECT 
        s.status,
        COUNT(a.id) as completed_questions,
        ROUND(AVG(c.overall_score), 2) as avg_score,
        s.started_at,
        s.completed_at
      FROM sessions s
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      WHERE s.user_id = $1 AND s.topic_id = $2
      GROUP BY s.status, s.started_at, s.completed_at`,
      [userId, id]
    );

    const progress = progressResult.rows[0] || {
      status: 'new',
      completedQuestions: 0,
      avgScore: 0,
      startedAt: null,
      completedAt: null
    };

    res.json({
      success: true,
      data: {
        id: lesson.id,
        dayNumber: lesson.day_number,
        title: lesson.title_en,
        description: lesson.content,
        level: lesson.level,
        estimatedMinutes: lesson.estimated_minutes,
        audioUrl: lesson.audio_url,
        words: wordsResult.rows,
        questions: questionsResult.rows,
        progress: {
          status: progress.status,
          completedQuestions: parseInt(progress.completed_questions),
          avgScore: parseFloat(progress.avg_score) || 0,
          startedAt: progress.started_at,
          completedAt: progress.completed_at
        }
      }
    });
  } catch (error) {
    console.error('Get lesson details for UI error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson details'
    });
  }
};

// @desc    Start lesson session
// @route   POST /api/v1/lessons/ui/:id/start
// @access  Private (Clerk)
const startLessonSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if lesson exists
    const lessonResult = await query(
      'SELECT id FROM daily_topics WHERE id = $1',
      [id]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if session already exists
    const existingSession = await query(
      'SELECT id, status FROM sessions WHERE user_id = $1 AND topic_id = $2',
      [userId, id]
    );

    if (existingSession.rows.length > 0) {
      const session = existingSession.rows[0];
      return res.json({
        success: true,
        message: 'Session already exists',
        data: {
          sessionId: session.id,
          status: session.status
        }
      });
    }

    // Create new session
    const sessionResult = await query(
      `INSERT INTO sessions (user_id, topic_id, status, started_at)
       VALUES ($1, $2, 'active', NOW())
       RETURNING id`,
      [userId, id]
    );

    res.status(201).json({
      success: true,
      message: 'Lesson session started',
      data: {
        sessionId: sessionResult.rows[0].id,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Start lesson session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start lesson session'
    });
  }
};

// @desc    Complete lesson session
// @route   POST /api/v1/lessons/ui/:id/complete
// @access  Private (Clerk)
const completeLessonSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get session
    const sessionResult = await query(
      'SELECT id FROM sessions WHERE user_id = $1 AND topic_id = $2',
      [userId, id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const sessionId = sessionResult.rows[0].id;

    // Update session status
    await query(
      'UPDATE sessions SET status = $1, completed_at = NOW() WHERE id = $2',
      ['completed', sessionId]
    );

    // Update user progress
    await query(
      `UPDATE progress 
       SET completed_lessons = completed_lessons + 1,
           total_active_days = total_active_days + 1,
           last_updated = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Lesson completed successfully'
    });
  } catch (error) {
    console.error('Complete lesson session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete lesson'
    });
  }
};

// @desc    Get lesson statistics
// @route   GET /api/v1/lessons/ui/stats
// @access  Private (Clerk)
const getLessonStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT s.topic_id) as total_lessons_started,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_lessons,
        COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_lessons,
        ROUND(AVG(c.overall_score), 2) as avg_score,
        COUNT(DISTINCT DATE(s.started_at)) as active_days
      FROM sessions s
      LEFT JOIN attempts a ON a.session_id = s.id
      LEFT JOIN corrections c ON c.attempt_id = a.id
      WHERE s.user_id = $1
    `;

    const result = await query(statsQuery, [userId]);
    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        totalLessonsStarted: parseInt(stats.total_lessons_started),
        completedLessons: parseInt(stats.completed_lessons),
        activeLessons: parseInt(stats.active_lessons),
        avgScore: parseFloat(stats.avg_score) || 0,
        activeDays: parseInt(stats.active_days)
      }
    });
  } catch (error) {
    console.error('Get lesson statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson statistics'
    });
  }
};

module.exports = {
  getLessonsForUI,
  getLessonDetailsForUI,
  startLessonSession,
  completeLessonSession,
  getLessonStatistics
};
