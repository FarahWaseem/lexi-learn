// backend/src/models/correctionModel.js
// Database operations for AI corrections

const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create a correction record
 * @param {Object} correctionData - Correction data from AI service
 * @returns {Promise<Object>} Created correction
 */
async function createCorrection({
  attemptId,
  originalText,
  correctedText,
  feedback,
  issues,
  fluencyScore,
  grammarScore,
  vocabScore
}) {
  const query = `
    INSERT INTO corrections (
      attempt_id, 
      original_text, 
      corrected_text, 
      feedback, 
      issues, 
      fluency_score, 
      grammar_score, 
      vocab_score,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [
      attemptId,
      originalText,
      correctedText,
      feedback,
      JSON.stringify(issues || []),
      fluencyScore,
      grammarScore,
      vocabScore
    ]);
    
    logger.info(`[CorrectionModel] Created correction for attempt ${attemptId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('[CorrectionModel] Error creating correction:', error);
    throw error;
  }
}

/**
 * Get correction by attempt ID
 * @param {number} attemptId - Attempt ID
 * @returns {Promise<Object|null>} Correction data or null
 */
async function getCorrectionByAttemptId(attemptId) {
  const query = `
    SELECT * FROM corrections
    WHERE attempt_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `;
  
  try {
    const result = await pool.query(query, [attemptId]);
    
    if (result.rows[0]) {
      // Parse issues JSON
      const correction = result.rows[0];
      if (typeof correction.issues === 'string') {
        try {
          correction.issues = JSON.parse(correction.issues);
        } catch (e) {
          correction.issues = [];
        }
      }
      return correction;
    }
    
    return null;
  } catch (error) {
    logger.error('[CorrectionModel] Error getting correction:', error);
    throw error;
  }
}

/**
 * Get corrections for a session
 * @param {number} sessionId - Session ID
 * @returns {Promise<Array>} Array of corrections
 */
async function getSessionCorrections(sessionId) {
  const query = `
    SELECT c.*, a.question_id, tq.question_idx
    FROM corrections c
    JOIN attempts a ON c.attempt_id = a.attempt_id
    LEFT JOIN topic_questions tq ON a.question_id = tq.question_id
    WHERE a.session_id = $1
    ORDER BY tq.question_idx
  `;
  
  try {
    const result = await pool.query(query, [sessionId]);
    
    // Parse issues JSON for each correction
    return result.rows.map(correction => {
      if (typeof correction.issues === 'string') {
        try {
          correction.issues = JSON.parse(correction.issues);
        } catch (e) {
          correction.issues = [];
        }
      }
      return correction;
    });
  } catch (error) {
    logger.error('[CorrectionModel] Error getting session corrections:', error);
    throw error;
  }
}

/**
 * Get correction by ID
 * @param {number} correctionId - Correction ID
 * @returns {Promise<Object|null>} Correction data or null
 */
async function getCorrectionById(correctionId) {
  const query = `SELECT * FROM corrections WHERE correction_id = $1`;
  
  try {
    const result = await pool.query(query, [correctionId]);
    
    if (result.rows[0]) {
      const correction = result.rows[0];
      if (typeof correction.issues === 'string') {
        try {
          correction.issues = JSON.parse(correction.issues);
        } catch (e) {
          correction.issues = [];
        }
      }
      return correction;
    }
    
    return null;
  } catch (error) {
    logger.error('[CorrectionModel] Error getting correction by ID:', error);
    throw error;
  }
}

/**
 * Update correction
 * @param {number} correctionId - Correction ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated correction
 */
async function updateCorrection(correctionId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.correctedText !== undefined) {
    fields.push(`corrected_text = $${paramIndex++}`);
    values.push(updates.correctedText);
  }
  if (updates.feedback !== undefined) {
    fields.push(`feedback = $${paramIndex++}`);
    values.push(updates.feedback);
  }
  if (updates.issues !== undefined) {
    fields.push(`issues = $${paramIndex++}`);
    values.push(JSON.stringify(updates.issues));
  }
  if (updates.fluencyScore !== undefined) {
    fields.push(`fluency_score = $${paramIndex++}`);
    values.push(updates.fluencyScore);
  }
  if (updates.grammarScore !== undefined) {
    fields.push(`grammar_score = $${paramIndex++}`);
    values.push(updates.grammarScore);
  }
  if (updates.vocabScore !== undefined) {
    fields.push(`vocab_score = $${paramIndex++}`);
    values.push(updates.vocabScore);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(correctionId);
  const query = `
    UPDATE corrections 
    SET ${fields.join(', ')}
    WHERE correction_id = $${paramIndex}
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('[CorrectionModel] Error updating correction:', error);
    throw error;
  }
}

/**
 * Get user's average scores
 * @param {string} userId - User's UUID
 * @param {number} limit - Number of recent sessions to consider
 * @returns {Promise<Object>} Average scores
 */
async function getUserAverageScores(userId, limit = 10) {
  const query = `
    SELECT 
      AVG(c.fluency_score) as avg_fluency,
      AVG(c.grammar_score) as avg_grammar,
      AVG(c.vocab_score) as avg_vocab,
      COUNT(c.correction_id) as total_corrections
    FROM corrections c
    JOIN attempts a ON c.attempt_id = a.attempt_id
    JOIN sessions s ON a.session_id = s.session_id
    WHERE s.user_id = $1 AND s.status = 'completed'
    AND s.session_id IN (
      SELECT session_id FROM sessions
      WHERE user_id = $1 AND status = 'completed'
      ORDER BY completed_at DESC
      LIMIT $2
    )
  `;
  
  try {
    const result = await pool.query(query, [userId, limit]);
    const row = result.rows[0];
    
    return {
      fluency: Math.round(row.avg_fluency || 0),
      grammar: Math.round(row.avg_grammar || 0),
      vocab: Math.round(row.avg_vocab || 0),
      totalCorrections: parseInt(row.total_corrections || 0)
    };
  } catch (error) {
    logger.error('[CorrectionModel] Error getting user average scores:', error);
    throw error;
  }
}

module.exports = {
  createCorrection,
  getCorrectionByAttemptId,
  getSessionCorrections,
  getCorrectionById,
  updateCorrection,
  getUserAverageScores
};

