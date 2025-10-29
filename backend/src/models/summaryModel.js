// backend/src/models/summaryModel.js
// Database operations for lesson summaries

const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create or update lesson summary
 * @param {Object} summaryData - Summary data
 * @returns {Promise<Object>} Created/updated summary
 */
async function upsertLessonSummary({
  sessionId,
  overallScore,
  fluencyAvg,
  grammarAvg,
  vocabAvg,
  totalQuestions,
  feedback
}) {
  const query = `
    INSERT INTO lesson_summary (
      session_id, 
      overall_score, 
      fluency_avg, 
      grammar_avg, 
      vocab_avg, 
      total_questions, 
      feedback,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    ON CONFLICT (session_id) 
    DO UPDATE SET
      overall_score = EXCLUDED.overall_score,
      fluency_avg = EXCLUDED.fluency_avg,
      grammar_avg = EXCLUDED.grammar_avg,
      vocab_avg = EXCLUDED.vocab_avg,
      total_questions = EXCLUDED.total_questions,
      feedback = EXCLUDED.feedback
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [
      sessionId,
      overallScore,
      fluencyAvg,
      grammarAvg,
      vocabAvg,
      totalQuestions,
      feedback
    ]);
    
    logger.info(`[SummaryModel] Upserted summary for session ${sessionId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('[SummaryModel] Error upserting summary:', error);
    throw error;
  }
}

/**
 * Get lesson summary by session ID
 * @param {number} sessionId - Session ID
 * @returns {Promise<Object|null>} Summary data or null
 */
async function getSummaryBySessionId(sessionId) {
  const query = `
    SELECT ls.*, 
           s.started_at, 
           s.completed_at,
           dt.day_number,
           dt.topic_name
    FROM lesson_summary ls
    JOIN sessions s ON ls.session_id = s.session_id
    LEFT JOIN daily_topics dt ON s.topic_id = dt.topic_id
    WHERE ls.session_id = $1
  `;
  
  try {
    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('[SummaryModel] Error getting summary:', error);
    throw error;
  }
}

/**
 * Get user's recent summaries
 * @param {string} userId - User's UUID
 * @param {number} limit - Number of summaries to return
 * @returns {Promise<Array>} Array of summaries
 */
async function getUserSummaries(userId, limit = 10) {
  const query = `
    SELECT ls.*, 
           s.started_at, 
           s.completed_at,
           dt.day_number,
           dt.topic_name
    FROM lesson_summary ls
    JOIN sessions s ON ls.session_id = s.session_id
    LEFT JOIN daily_topics dt ON s.topic_id = dt.topic_id
    WHERE s.user_id = $1 AND s.status = 'completed'
    ORDER BY s.completed_at DESC
    LIMIT $2
  `;
  
  try {
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    logger.error('[SummaryModel] Error getting user summaries:', error);
    throw error;
  }
}

/**
 * Delete summary
 * @param {number} sessionId - Session ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteSummary(sessionId) {
  const query = `DELETE FROM lesson_summary WHERE session_id = $1`;
  
  try {
    await pool.query(query, [sessionId]);
    logger.info(`[SummaryModel] Deleted summary for session ${sessionId}`);
    return true;
  } catch (error) {
    logger.error('[SummaryModel] Error deleting summary:', error);
    throw error;
  }
}

module.exports = {
  upsertLessonSummary,
  getSummaryBySessionId,
  getUserSummaries,
  deleteSummary
};

