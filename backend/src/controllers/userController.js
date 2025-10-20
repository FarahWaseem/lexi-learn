const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// @desc    Register new user
// @route   POST /api/v1/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userId = uuidv4();
    const result = await query(
      `INSERT INTO users (id, first_name, last_name, email, password_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, first_name, last_name, email, created_at`,
      [userId, firstName, lastName, email, hashedPassword]
    );

    // Create progress record
    await query(
      'INSERT INTO progress (user_id, completed_lessons, avg_score, total_active_days, last_updated) VALUES ($1, 0, 0, 0, NOW())',
      [userId]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          createdAt: user.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user'
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const result = await query(
      'SELECT id, first_name, last_name, email, password_hash, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last active
    await query(
      'UPDATE users SET last_active = CURRENT_DATE WHERE id = $1',
      [user.id]
    );

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    console.error('Login user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/v1/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.streak_current, 
              u.streak_longest, u.last_active, u.created_at,
              p.completed_lessons, p.avg_score, p.total_active_days
       FROM users u
       LEFT JOIN progress p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        streakCurrent: user.streak_current,
        streakLongest: user.streak_longest,
        lastActive: user.last_active,
        createdAt: user.created_at,
        progress: {
          completedLessons: user.completed_lessons || 0,
          avgScore: parseFloat(user.avg_score) || 0,
          totalActiveDays: user.total_active_days || 0
        }
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/v1/users/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get vocabulary stats
    const vocabStats = await query(
      `SELECT 
        COUNT(*) as total_words,
        COUNT(DISTINCT lesson) as unique_lessons
       FROM user_vocab_words 
       WHERE user_id = $1`,
      [userId]
    );

    // Get progress stats
    const progressStats = await query(
      'SELECT completed_lessons, avg_score, total_active_days FROM progress WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        vocabulary: {
          totalWords: parseInt(vocabStats.rows[0].total_words),
          uniqueLessons: parseInt(vocabStats.rows[0].unique_lessons)
        },
        progress: {
          completedLessons: progressStats.rows[0]?.completed_lessons || 0,
          avgScore: parseFloat(progressStats.rows[0]?.avg_score) || 0,
          totalActiveDays: progressStats.rows[0]?.total_active_days || 0
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName } = req.body;

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (firstName !== undefined) {
      paramCount++;
      updateFields.push(`first_name = $${paramCount}`);
      updateValues.push(firstName);
    }

    if (lastName !== undefined) {
      paramCount++;
      updateFields.push(`last_name = $${paramCount}`);
      updateValues.push(lastName);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING id, first_name, last_name, email
    `;

    const result = await query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: result.rows[0].id,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
        email: result.rows[0].email
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/v1/users/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete user (cascade will handle related records)
    await query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  deleteAccount,
  getUserStats
};
