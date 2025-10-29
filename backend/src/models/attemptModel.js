// backend/src/models/attemptModel.js
// Database operations for question attempts

const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create a new attempt
 * @param {Object} attemptData - Attempt data
 * @returns {Promise<Object>} Created attempt
 */
async function createAttempt({ sessionId, questionId, startedAt }) {
  const query = `
    INSERT INTO attempts (session_id, question_id, started_at, status)
    VALUES ($1, $2, $3, 'in_progress')
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [sessionId, questionId, startedAt || new Date()]);
    logger.info(`[AttemptModel] Created attempt ${result.rows[0].attempt_id} for question ${questionId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('[AttemptModel] Error creating attempt:', error);
    throw error;
  }
}

/**
 * Get attempt by ID
 * @param {number} attemptId - Attempt ID
 * @returns {Promise<Object|null>} Attempt data or null
 */
async function getAttemptById(attemptId) {
  const query = `
    SELECT a.*, 
           tq.prompt as question_prompt,
           tq.question_idx
    FROM attempts a
    LEFT JOIN topic_questions tq ON a.question_id = tq.question_id
    WHERE a.attempt_id = $1
  `;
  
  try {
    const result = await pool.query(query, [attemptId]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('[AttemptModel] Error getting attempt:', error);
    throw error;
  }
}

/**
 * Get attempts for a session
 * @param {number} sessionId - Session ID
 * @returns {Promise<Array>} Array of attempts
 */
async function getSessionAttempts(sessionId) {
  const query = `
    SELECT a.*, 
           tq.prompt as question_prompt,
           tq.question_idx
    FROM attempts a
    LEFT JOIN topic_questions tq ON a.question_id = tq.question_id
    WHERE a.session_id = $1
    ORDER BY tq.question_idx
  `;
  
  try {
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  } catch (error) {
    logger.error('[AttemptModel] Error getting session attempts:', error);
    throw error;
  }
}

/**
 * Get or create attempt for a question in a session
 * @param {number} sessionId - Session ID
 * @param {number} questionId - Question ID
 * @returns {Promise<Object>} Attempt data
 */
async function ensureAttempt(sessionId, questionId) {
  const checkQuery = `
    SELECT * FROM attempts
    WHERE session_id = $1 AND question_id = $2
    LIMIT 1
  `;
  
  try {
    // Check if attempt exists
    const checkResult = await pool.query(checkQuery, [sessionId, questionId]);
    
    if (checkResult.rows.length > 0) {
      return checkResult.rows[0];
    }

    // Create new attempt
    return await createAttempt({ sessionId, questionId });
    
  } catch (error) {
    logger.error('[AttemptModel] Error in ensureAttempt:', error);
    throw error;
  }
}

/**
 * Complete an attempt
 * @param {number} attemptId - Attempt ID
 * @returns {Promise<Object>} Updated attempt
 */
async function completeAttempt(attemptId) {
  const query = `
    UPDATE attempts 
    SET completed_at = NOW(), 
        status = 'completed'
    WHERE attempt_id = $1
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [attemptId]);
    logger.info(`[AttemptModel] Completed attempt ${attemptId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('[AttemptModel] Error completing attempt:', error);
    throw error;
  }
}

/**
 * Update attempt status
 * @param {number} attemptId - Attempt ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated attempt
 */
async function updateAttemptStatus(attemptId, status) {
  const query = `
    UPDATE attempts 
    SET status = $1
    WHERE attempt_id = $2
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [status, attemptId]);
    return result.rows[0];
  } catch (error) {
    logger.error('[AttemptModel] Error updating attempt status:', error);
    throw error;
  }
}

/**
 * Get attempt with full details (including utterances and corrections)
 * @param {number} attemptId - Attempt ID
 * @returns {Promise<Object|null>} Complete attempt data
 */
async function getAttemptWithDetails(attemptId) {
  const attemptQuery = `
    SELECT a.*, 
           tq.prompt as question_prompt,
           tq.question_idx
    FROM attempts a
    LEFT JOIN topic_questions tq ON a.question_id = tq.question_id
    WHERE a.attempt_id = $1
  `;

  const utterancesQuery = `
    SELECT * FROM utterances
    WHERE attempt_id = $1
    ORDER BY created_at
  `;

  const correctionsQuery = `
    SELECT * FROM corrections
    WHERE attempt_id = $1
    LIMIT 1
  `;
  
  try {
    const [attemptResult, utterancesResult, correctionsResult] = await Promise.all([
      pool.query(attemptQuery, [attemptId]),
      pool.query(utterancesQuery, [attemptId]),
      pool.query(correctionsQuery, [attemptId])
    ]);

    if (attemptResult.rows.length === 0) {
      return null;
    }

    return {
      ...attemptResult.rows[0],
      utterances: utterancesResult.rows,
      correction: correctionsResult.rows[0] || null
    };
    
  } catch (error) {
    logger.error('[AttemptModel] Error getting attempt with details:', error);
    throw error;
  }
}

module.exports = {
  createAttempt,
  getAttemptById,
  getSessionAttempts,
  ensureAttempt,
  completeAttempt,
  updateAttemptStatus,
  getAttemptWithDetails
};

