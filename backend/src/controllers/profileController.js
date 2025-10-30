const { pool } = require('../services/db');

/**
 * 👤 Profile Controller
 * Handles user profile and settings management
 */

/**
 * GET /api/profile
 * Get current user's profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const userQuery = await pool.query(
      `SELECT 
         id,
         first_name,
         last_name,
         email,
         streak_current,
         streak_longest,
         last_active,
         created_at,
         is_active
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const user = userQuery.rows[0];

    // Get user statistics
    const statsQuery = await pool.query(
      `SELECT 
         COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS total_lessons,
         COUNT(DISTINCT tw.id) AS total_words,
         ROUND(SUM(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))/60)) AS total_minutes,
         ROUND(AVG(c.overall_score), 2) AS avg_score
       FROM users u
       LEFT JOIN sessions s ON s.user_id = u.id
       LEFT JOIN topic_words tw ON tw.topic_id = s.topic_id AND s.status = 'completed'
       LEFT JOIN attempts a ON a.session_id = s.id
       LEFT JOIN corrections c ON c.attempt_id = a.id
       WHERE u.id = $1`,
      [userId]
    );

    const stats = statsQuery.rows[0];

    res.json({
      ok: true,
      profile: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        streakCurrent: user.streak_current,
        streakLongest: user.streak_longest,
        lastActive: user.last_active,
        createdAt: user.created_at,
        isActive: user.is_active,
        stats: {
          totalLessons: parseInt(stats.total_lessons) || 0,
          totalWords: parseInt(stats.total_words) || 0,
          totalMinutes: parseInt(stats.total_minutes) || 0,
          avgScore: parseFloat(stats.avg_score) || 0,
        },
      },
    });
  } catch (err) {
    console.error('❌ Get profile error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * PUT /api/profile
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { firstName, lastName } = req.body;

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({
        ok: false,
        error: 'First name and last name are required',
      });
    }

    if (firstName.length < 2 || firstName.length > 50) {
      return res.status(400).json({
        ok: false,
        error: 'First name must be between 2 and 50 characters',
      });
    }

    if (lastName.length < 2 || lastName.length > 50) {
      return res.status(400).json({
        ok: false,
        error: 'Last name must be between 2 and 50 characters',
      });
    }

    // Update user
    const updateQuery = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2
       WHERE id = $3
       RETURNING id, first_name, last_name, email`,
      [firstName.trim(), lastName.trim(), userId]
    );

    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const user = updateQuery.rows[0];

    res.json({
      ok: true,
      message: 'Profile updated successfully',
      profile: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('❌ Update profile error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/profile/settings
 * Get user settings/preferences
 */
const getSettings = async (req, res) => {
  try {
    const userId = req.userId;

    // For now, we'll return basic settings
    // You can extend this by creating a user_settings table
    const userQuery = await pool.query(
      `SELECT 
         id,
         first_name,
         last_name,
         email,
         is_active
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const user = userQuery.rows[0];

    res.json({
      ok: true,
      settings: {
        profile: {
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
        },
        preferences: {
          notifications: true,
          emailNotifications: true,
          soundEffects: true,
          darkMode: false,
        },
        account: {
          isActive: user.is_active,
        },
      },
    });
  } catch (err) {
    console.error('❌ Get settings error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * PUT /api/profile/settings
 * Update user settings/preferences
 */
const updateSettings = async (req, res) => {
  try {
    const userId = req.userId;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        ok: false,
        error: 'Preferences data is required',
      });
    }

    // For now, we'll just acknowledge the update
    // In a real app, you'd save this to a user_settings table
    console.log(`User ${userId} updated settings:`, preferences);

    res.json({
      ok: true,
      message: 'Settings updated successfully',
      settings: {
        preferences,
      },
    });
  } catch (err) {
    console.error('❌ Update settings error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/profile/achievements
 * Get user achievements and badges
 */
const getAchievements = async (req, res) => {
  try {
    const userId = req.userId;

    // Get user stats
    const statsQuery = await pool.query(
      `SELECT 
         COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_lessons,
         u.streak_current,
         u.streak_longest,
         COUNT(DISTINCT tw.id) AS unique_words,
         ROUND(AVG(c.overall_score), 2) AS avg_score
       FROM users u
       LEFT JOIN sessions s ON s.user_id = u.id
       LEFT JOIN topic_words tw ON tw.topic_id = s.topic_id AND s.status = 'completed'
       LEFT JOIN attempts a ON a.session_id = s.id
       LEFT JOIN corrections c ON c.attempt_id = a.id
       WHERE u.id = $1
       GROUP BY u.streak_current, u.streak_longest`,
      [userId]
    );

    const stats = statsQuery.rows[0] || {
      completed_lessons: 0,
      streak_current: 0,
      streak_longest: 0,
      unique_words: 0,
      avg_score: 0,
    };

    // Calculate achievements based on stats
    const achievements = [];

    // Lesson milestones
    if (parseInt(stats.completed_lessons) >= 1) {
      achievements.push({
        id: 'first_lesson',
        title: 'First Steps',
        description: 'Complete your first lesson',
        icon: '🎯',
        earned: true,
        earnedAt: null,
      });
    }
    if (parseInt(stats.completed_lessons) >= 10) {
      achievements.push({
        id: 'ten_lessons',
        title: 'Dedicated Learner',
        description: 'Complete 10 lessons',
        icon: '📚',
        earned: true,
        earnedAt: null,
      });
    }
    if (parseInt(stats.completed_lessons) >= 30) {
      achievements.push({
        id: 'thirty_lessons',
        title: 'Halfway Hero',
        description: 'Complete 30 lessons',
        icon: '⭐',
        earned: true,
        earnedAt: null,
      });
    }
    if (parseInt(stats.completed_lessons) >= 60) {
      achievements.push({
        id: 'all_lessons',
        title: 'Course Champion',
        description: 'Complete all 60 lessons',
        icon: '🏆',
        earned: true,
        earnedAt: null,
      });
    }

    // Streak achievements
    if (parseInt(stats.streak_current) >= 3) {
      achievements.push({
        id: 'streak_3',
        title: 'On Fire',
        description: '3-day learning streak',
        icon: '🔥',
        earned: true,
        earnedAt: null,
      });
    }
    if (parseInt(stats.streak_current) >= 7) {
      achievements.push({
        id: 'streak_7',
        title: 'Week Warrior',
        description: '7-day learning streak',
        icon: '💪',
        earned: true,
        earnedAt: null,
      });
    }
    if (parseInt(stats.streak_longest) >= 30) {
      achievements.push({
        id: 'streak_30',
        title: 'Month Master',
        description: '30-day learning streak',
        icon: '🌟',
        earned: true,
        earnedAt: null,
      });
    }

    // Score achievements
    if (parseFloat(stats.avg_score) >= 70) {
      achievements.push({
        id: 'score_70',
        title: 'High Achiever',
        description: 'Maintain 70+ average score',
        icon: '🎓',
        earned: true,
        earnedAt: null,
      });
    }
    if (parseFloat(stats.avg_score) >= 90) {
      achievements.push({
        id: 'score_90',
        title: 'Perfect Student',
        description: 'Maintain 90+ average score',
        icon: '💯',
        earned: true,
        earnedAt: null,
      });
    }

    // Vocabulary achievements
    if (parseInt(stats.unique_words) >= 50) {
      achievements.push({
        id: 'words_50',
        title: 'Word Collector',
        description: 'Learn 50 new words',
        icon: '📖',
        earned: true,
        earnedAt: null,
      });
    }
    if (parseInt(stats.unique_words) >= 200) {
      achievements.push({
        id: 'words_200',
        title: 'Vocabulary Master',
        description: 'Learn 200 new words',
        icon: '🧠',
        earned: true,
        earnedAt: null,
      });
    }

    res.json({
      ok: true,
      achievements,
      stats: {
        completedLessons: parseInt(stats.completed_lessons) || 0,
        currentStreak: parseInt(stats.streak_current) || 0,
        longestStreak: parseInt(stats.streak_longest) || 0,
        uniqueWords: parseInt(stats.unique_words) || 0,
        avgScore: parseFloat(stats.avg_score) || 0,
      },
    });
  } catch (err) {
    console.error('❌ Get achievements error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /api/profile/activity
 * Get user activity history
 */
const getActivity = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20 } = req.query;

    const activityQuery = await pool.query(
      `SELECT 
         s.id,
         s.started_at,
         s.completed_at,
         s.status,
         dt.title_en,
         dt.day_number,
         dt.level,
         ROUND(AVG(c.overall_score), 2) AS score
       FROM sessions s
       JOIN daily_topics dt ON dt.id = s.topic_id
       LEFT JOIN attempts a ON a.session_id = s.id
       LEFT JOIN corrections c ON c.attempt_id = a.id
       WHERE s.user_id = $1
       GROUP BY s.id, s.started_at, s.completed_at, s.status, dt.title_en, dt.day_number, dt.level
       ORDER BY s.started_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      ok: true,
      activity: activityQuery.rows.map(row => ({
        id: row.id,
        type: 'lesson',
        title: row.title_en,
        dayNumber: row.day_number,
        level: row.level,
        status: row.status,
        score: row.score,
        startedAt: row.started_at,
        completedAt: row.completed_at,
      })),
    });
  } catch (err) {
    console.error('❌ Get activity error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * DELETE /api/profile/account
 * Delete user account (soft delete)
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { confirm } = req.body;

    if (!confirm || confirm !== 'DELETE') {
      return res.status(400).json({
        ok: false,
        error: 'Please confirm account deletion by sending { confirm: "DELETE" }',
      });
    }

    // Soft delete - just mark as inactive
    await pool.query(
      `UPDATE users 
       SET is_active = false
       WHERE id = $1`,
      [userId]
    );

    res.json({
      ok: true,
      message: 'Account deactivated successfully',
    });
  } catch (err) {
    console.error('❌ Delete account error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  getAchievements,
  getActivity,
  deleteAccount,
};

