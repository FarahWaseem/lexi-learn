// backend/src/models/utteranceModel.js
// Database operations for utterances (user and AI messages)

const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create a user utterance
 * @param {Object} utteranceData - Utterance data
 * @returns {Promise<Object>} Created utterance
 */
async function createUserUtterance({ attemptId, text, audioUrl = null }) {
  const query = `
    INSERT INTO utterances (attempt_id, role, text, audio_url, created_at)
    VALUES ($1, 'user', $2, $3, NOW())
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [attemptId, text, audioUrl]);
    logger.info(`[UtteranceModel] Created user utterance for attempt ${attemptId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('[UtteranceModel] Error creating user utterance:', error);
    throw error;
  }
}

/**
 * Create an AI utterance
 * @param {Object} utteranceData - Utterance data
 * @returns {Promise<Object>} Created utterance
 */
async function createAiUtterance({ attemptId, text }) {
  const query = `
    INSERT INTO utterances (attempt_id, role, text, created_at)
    VALUES ($1, 'ai', $2, NOW())
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [attemptId, text]);
    logger.info(`[UtteranceModel] Created AI utterance for attempt ${attemptId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('[UtteranceModel] Error creating AI utterance:', error);
    throw error;
  }
}

/**
 * Get utterances for an attempt
 * @param {number} attemptId - Attempt ID
 * @returns {Promise<Array>} Array of utterances
 */
async function getAttemptUtterances(attemptId) {
  const query = `
    SELECT utterance_id, attempt_id, role, text, audio_url, created_at
    FROM utterances
    WHERE attempt_id = $1
    ORDER BY created_at
  `;
  
  try {
    const result = await pool.query(query, [attemptId]);
    return result.rows;
  } catch (error) {
    logger.error('[UtteranceModel] Error getting attempt utterances:', error);
    throw error;
  }
}

/**
 * Get utterances for a session
 * @param {number} sessionId - Session ID
 * @returns {Promise<Array>} Array of utterances
 */
async function getSessionUtterances(sessionId) {
  const query = `
    SELECT u.*, a.question_id, tq.question_idx
    FROM utterances u
    JOIN attempts a ON u.attempt_id = a.attempt_id
    LEFT JOIN topic_questions tq ON a.question_id = tq.question_id
    WHERE a.session_id = $1
    ORDER BY tq.question_idx, u.created_at
  `;
  
  try {
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  } catch (error) {
    logger.error('[UtteranceModel] Error getting session utterances:', error);
    throw error;
  }
}

/**
 * Get utterance by ID
 * @param {number} utteranceId - Utterance ID
 * @returns {Promise<Object|null>} Utterance data or null
 */
async function getUtteranceById(utteranceId) {
  const query = `
    SELECT * FROM utterances
    WHERE utterance_id = $1
  `;
  
  try {
    const result = await pool.query(query, [utteranceId]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('[UtteranceModel] Error getting utterance:', error);
    throw error;
  }
}

/**
 * Update utterance text
 * @param {number} utteranceId - Utterance ID
 * @param {string} text - New text
 * @returns {Promise<Object>} Updated utterance
 */
async function updateUtteranceText(utteranceId, text) {
  const query = `
    UPDATE utterances 
    SET text = $1
    WHERE utterance_id = $2
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [text, utteranceId]);
    return result.rows[0];
  } catch (error) {
    logger.error('[UtteranceModel] Error updating utterance text:', error);
    throw error;
  }
}

/**
 * Delete utterance
 * @param {number} utteranceId - Utterance ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteUtterance(utteranceId) {
  const query = `DELETE FROM utterances WHERE utterance_id = $1`;
  
  try {
    await pool.query(query, [utteranceId]);
    logger.info(`[UtteranceModel] Deleted utterance ${utteranceId}`);
    return true;
  } catch (error) {
    logger.error('[UtteranceModel] Error deleting utterance:', error);
    throw error;
  }
}

/**
 * Get user's final text for an attempt (last user utterance)
 * @param {number} attemptId - Attempt ID
 * @returns {Promise<string|null>} User's final text or null
 */
async function getUserFinalText(attemptId) {
  const query = `
    SELECT text FROM utterances
    WHERE attempt_id = $1 AND role = 'user'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  
  try {
    const result = await pool.query(query, [attemptId]);
    return result.rows[0]?.text || null;
  } catch (error) {
    logger.error('[UtteranceModel] Error getting user final text:', error);
    throw error;
  }
}

module.exports = {
  createUserUtterance,
  createAiUtterance,
  getAttemptUtterances,
  getSessionUtterances,
  getUtteranceById,
  updateUtteranceText,
  deleteUtterance,
  getUserFinalText
};

