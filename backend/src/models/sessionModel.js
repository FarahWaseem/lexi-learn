// backend/src/models/sessionModel.js
// Database operations for lesson sessions

const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create a new lesson session
 * @param {string} userId - User's UUID
 * @param {number} topicId - Topic ID
 * @returns {Promise<Object>} Created session
 */
async function createSession(userId, topicId) {
  const query = `
    INSERT INTO sessions (user_id, topic_id, started_at, status)
    VALUES ($1, $2, NOW(), 'in_progress')
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [userId, topicId]);
    logger.info(`[SessionModel] Created session ${result.rows[0].session_id} for user ${userId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('[SessionModel] Error creating session:', error);
    throw error;
  }
}

/**
 * Get session by ID
 * @param {number} sessionId - Session ID
 * @returns {Promise<Object|null>} Session data or null
 */
async function getSessionById(sessionId) {
  const query = `
    SELECT s.*, 
           dt.day_number, 
           dt.topic_name,
           dt.description as topic_description
    FROM sessions s
    LEFT JOIN daily_topics dt ON s.topic_id = dt.topic_id
    WHERE s.session_id = $1
  `;
  
  try {
    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('[SessionModel] Error getting session:', error);
    throw error;
  }
}

/**
 * Get user's latest session
 * @param {string} userId - User's UUID
 * @returns {Promise<Object|null>} Latest session or null
 */
async function getLatestSession(userId) {
  const query = `
    SELECT s.*, 
           dt.day_number, 
           dt.topic_name
    FROM sessions s
    LEFT JOIN daily_topics dt ON s.topic_id = dt.topic_id
    WHERE s.user_id = $1
    ORDER BY s.started_at DESC
    LIMIT 1
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('[SessionModel] Error getting latest session:', error);
    throw error;
  }
}

/**
 * Finish a session
 * @param {number} sessionId - Session ID
 * @returns {Promise<Object>} Updated session
 */
async function finishSession(sessionId) {
  const query = `
    UPDATE sessions 
    SET completed_at = NOW(), 
        status = 'completed'
    WHERE session_id = $1
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [sessionId]);
    logger.info(`[SessionModel] Finished session ${sessionId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('[SessionModel] Error finishing session:', error);
    throw error;
  }
}

/**
 * Get all sessions for a user
 * @param {string} userId - User's UUID
 * @param {number} limit - Maximum number of sessions to return
 * @returns {Promise<Array>} Array of sessions
 */
async function getUserSessions(userId, limit = 10) {
  const query = `
    SELECT s.*, 
           dt.day_number, 
           dt.topic_name
    FROM sessions s
    LEFT JOIN daily_topics dt ON s.topic_id = dt.topic_id
    WHERE s.user_id = $1
    ORDER BY s.started_at DESC
    LIMIT $2
  `;
  
  try {
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    logger.error('[SessionModel] Error getting user sessions:', error);
    throw error;
  }
}

/**
 * Get user's completed topics
 * @param {string} userId - User's UUID
 * @returns {Promise<Array>} Array of completed topic IDs
 */
async function getUserCompletedTopics(userId) {
  const query = `
    SELECT DISTINCT topic_id
    FROM sessions
    WHERE user_id = $1 
      AND status = 'completed'
    ORDER BY topic_id
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => row.topic_id);
  } catch (error) {
    logger.error('[SessionModel] Error getting completed topics:', error);
    throw error;
  }
}

/**
 * Update session status
 * @param {number} sessionId - Session ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated session
 */
async function updateSessionStatus(sessionId, status) {
  const query = `
    UPDATE sessions 
    SET status = $1
    WHERE session_id = $2
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [status, sessionId]);
    return result.rows[0];
  } catch (error) {
    logger.error('[SessionModel] Error updating session status:', error);
    throw error;
  }
}

module.exports = {
  createSession,
  getSessionById,
  getLatestSession,
  finishSession,
  getUserSessions,
  getUserCompletedTopics,
  updateSessionStatus
};

