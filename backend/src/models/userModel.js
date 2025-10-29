// backend/src/models/userModel.js
// Database operations for users

const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create a new user
 * @param {Object} userData - User data from Clerk
 * @returns {Promise<Object>} Created user
 */
async function createUser({ clerkUserId, email, firstName, lastName }) {
  const query = `
    INSERT INTO users (clerk_user_id, email, first_name, last_name, created_at, last_active)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [clerkUserId, email, firstName, lastName]);
    logger.info(`[UserModel] Created user: ${clerkUserId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('[UserModel] Error creating user:', error);
    throw error;
  }
}

/**
 * Get user by Clerk user ID
 * @param {string} clerkUserId - Clerk user ID
 * @returns {Promise<Object|null>} User data or null
 */
async function getUserByClerkId(clerkUserId) {
  const query = `SELECT * FROM users WHERE clerk_user_id = $1`;
  
  try {
    const result = await pool.query(query, [clerkUserId]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('[UserModel] Error getting user by Clerk ID:', error);
    throw error;
  }
}

/**
 * Get user by internal user ID (UUID)
 * @param {string} userId - Internal user UUID
 * @returns {Promise<Object|null>} User data or null
 */
async function getUserById(userId) {
  const query = `SELECT * FROM users WHERE user_id = $1`;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('[UserModel] Error getting user by ID:', error);
    throw error;
  }
}

/**
 * Get or create user (for Clerk integration)
 * @param {Object} clerkUserData - User data from Clerk
 * @returns {Promise<Object>} User data
 */
async function getOrCreateUser(clerkUserData) {
  try {
    // Check if user exists
    let user = await getUserByClerkId(clerkUserData.clerkUserId);
    
    if (user) {
      // Update last active
      await updateLastActive(user.user_id);
      return user;
    }

    // Create new user
    user = await createUser(clerkUserData);
    return user;
    
  } catch (error) {
    logger.error('[UserModel] Error in getOrCreateUser:', error);
    throw error;
  }
}

/**
 * Update user's last active timestamp
 * @param {string} userId - User's UUID
 * @returns {Promise<Object>} Updated user
 */
async function updateLastActive(userId) {
  const query = `
    UPDATE users 
    SET last_active = NOW()
    WHERE user_id = $1
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  } catch (error) {
    logger.error('[UserModel] Error updating last active:', error);
    throw error;
  }
}

/**
 * Update user's streak
 * @param {string} userId - User's UUID
 * @param {number} streak - New streak value
 * @returns {Promise<Object>} Updated user
 */
async function updateStreak(userId, streak) {
  const query = `
    UPDATE users 
    SET streak = $1
    WHERE user_id = $2
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [streak, userId]);
    logger.info(`[UserModel] Updated streak for user ${userId}: ${streak}`);
    return result.rows[0];
  } catch (error) {
    logger.error('[UserModel] Error updating streak:', error);
    throw error;
  }
}

/**
 * Update user profile
 * @param {string} userId - User's UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user
 */
async function updateUser(userId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }
  if (updates.firstName !== undefined) {
    fields.push(`first_name = $${paramIndex++}`);
    values.push(updates.firstName);
  }
  if (updates.lastName !== undefined) {
    fields.push(`last_name = $${paramIndex++}`);
    values.push(updates.lastName);
  }
  if (updates.streak !== undefined) {
    fields.push(`streak = $${paramIndex++}`);
    values.push(updates.streak);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(userId);
  const query = `
    UPDATE users 
    SET ${fields.join(', ')}, last_active = NOW()
    WHERE user_id = $${paramIndex}
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('[UserModel] Error updating user:', error);
    throw error;
  }
}

/**
 * Get user statistics
 * @param {string} userId - User's UUID
 * @returns {Promise<Object>} User statistics
 */
async function getUserStats(userId) {
  const query = `
    SELECT 
      u.streak,
      u.created_at,
      u.last_active,
      COUNT(DISTINCT s.session_id) as total_sessions,
      COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.session_id END) as completed_sessions,
      COUNT(DISTINCT s.topic_id) as unique_topics_studied
    FROM users u
    LEFT JOIN sessions s ON u.user_id = s.user_id
    WHERE u.user_id = $1
    GROUP BY u.user_id, u.streak, u.created_at, u.last_active
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('[UserModel] Error getting user stats:', error);
    throw error;
  }
}

/**
 * Delete user
 * @param {string} userId - User's UUID
 * @returns {Promise<boolean>} Success status
 */
async function deleteUser(userId) {
  const query = `DELETE FROM users WHERE user_id = $1`;
  
  try {
    await pool.query(query, [userId]);
    logger.info(`[UserModel] Deleted user ${userId}`);
    return true;
  } catch (error) {
    logger.error('[UserModel] Error deleting user:', error);
    throw error;
  }
}

module.exports = {
  createUser,
  getUserByClerkId,
  getUserById,
  getOrCreateUser,
  updateLastActive,
  updateStreak,
  updateUser,
  getUserStats,
  deleteUser
};

