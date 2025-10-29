// backend/src/services/sessionService.js
// Business logic for session management

const sessionModel = require('../models/sessionModel');
const attemptModel = require('../models/attemptModel');
const correctionModel = require('../models/correctionModel');
const utteranceModel = require('../models/utteranceModel');
const summaryModel = require('../models/summaryModel');
const topicModel = require('../models/topicModel');
const logger = require('../utils/logger');

/**
 * Start a new lesson session
 * @param {string} userId - User's UUID
 * @param {number} dayNumber - Day number (1-60)
 * @returns {Promise<Object>} Session with topic and questions
 */
async function startSession(userId, dayNumber) {
  try {
    // Get or create topic
    const topic = await topicModel.getTopicByDay(dayNumber);
    
    if (!topic) {
      throw new Error(`Topic for day ${dayNumber} not found`);
    }

    // Get questions for topic
    const questions = await topicModel.getTopicQuestions(topic.topic_id);
    
    if (questions.length === 0) {
      throw new Error(`No questions found for day ${dayNumber}`);
    }

    // Create session
    const session = await sessionModel.createSession(userId, topic.topic_id);

    logger.info(`[SessionService] Started session ${session.session_id} for user ${userId}, day ${dayNumber}`);

    return {
      session,
      topic,
      questions,
      totalQuestions: questions.length
    };
  } catch (error) {
    logger.error('[SessionService] Error starting session:', error);
    throw error;
  }
}

/**
 * Finish a lesson session
 * @param {number} sessionId - Session ID
 * @returns {Promise<Object>} Updated session with summary
 */
async function finishSession(sessionId) {
  try {
    // Finish the session
    const session = await sessionModel.finishSession(sessionId);

    // Generate summary
    const summary = await generateSessionSummary(sessionId);

    logger.info(`[SessionService] Finished session ${sessionId}`);

    return {
      session,
      summary
    };
  } catch (error) {
    logger.error('[SessionService] Error finishing session:', error);
    throw error;
  }
}

/**
 * Get session details
 * @param {number} sessionId - Session ID
 * @returns {Promise<Object>} Session with all details
 */
async function getSessionDetails(sessionId) {
  try {
    const session = await sessionModel.getSessionById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    const [attempts, questions, vocabulary] = await Promise.all([
      attemptModel.getSessionAttempts(sessionId),
      topicModel.getTopicQuestions(session.topic_id),
      topicModel.getTopicVocabulary(session.topic_id)
    ]);

    return {
      session,
      attempts,
      questions,
      vocabulary
    };
  } catch (error) {
    logger.error('[SessionService] Error getting session details:', error);
    throw error;
  }
}

/**
 * Generate session summary
 * @param {number} sessionId - Session ID
 * @returns {Promise<Object>} Session summary
 */
async function generateSessionSummary(sessionId) {
  try {
    const session = await sessionModel.getSessionById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    // Get all corrections for the session
    const corrections = await correctionModel.getSessionCorrections(sessionId);
    const attempts = await attemptModel.getSessionAttempts(sessionId);

    if (corrections.length === 0) {
      logger.warn(`[SessionService] No corrections found for session ${sessionId}`);
      return {
        sessionId,
        overallScore: 0,
        fluencyAvg: 0,
        grammarAvg: 0,
        vocabAvg: 0,
        totalQuestions: attempts.length,
        corrections: []
      };
    }

    // Calculate averages
    const fluencyScores = corrections.map(c => c.fluency_score || 0);
    const grammarScores = corrections.map(c => c.grammar_score || 0);
    const vocabScores = corrections.map(c => c.vocab_score || 0);

    const fluencyAvg = Math.round(fluencyScores.reduce((a, b) => a + b, 0) / fluencyScores.length);
    const grammarAvg = Math.round(grammarScores.reduce((a, b) => a + b, 0) / grammarScores.length);
    const vocabAvg = Math.round(vocabScores.reduce((a, b) => a + b, 0) / vocabScores.length);
    const overallScore = Math.round((fluencyAvg + grammarAvg + vocabAvg) / 3);

    // Generate feedback
    let feedback = '';
    if (overallScore >= 80) {
      feedback = 'Excellent work! Your English skills are very strong.';
    } else if (overallScore >= 65) {
      feedback = 'Good job! Keep practicing to improve further.';
    } else if (overallScore >= 50) {
      feedback = 'Fair effort. Focus on the feedback to improve.';
    } else {
      feedback = 'Keep practicing! Review the corrections carefully.';
    }

    // Save summary to database
    const summaryData = {
      sessionId,
      overallScore,
      fluencyAvg,
      grammarAvg,
      vocabAvg,
      totalQuestions: attempts.length,
      feedback
    };

    await summaryModel.upsertLessonSummary(summaryData);

    // Get attempts with details
    const attemptsWithDetails = await Promise.all(
      attempts.map(async (attempt) => {
        const correction = corrections.find(c => c.attempt_id === attempt.attempt_id);
        const utterances = await utteranceModel.getAttemptUtterances(attempt.attempt_id);
        
        return {
          ...attempt,
          correction,
          utterances
        };
      })
    );

    logger.info(`[SessionService] Generated summary for session ${sessionId}`);

    return {
      sessionId,
      session,
      overallScore,
      fluencyAvg,
      grammarAvg,
      vocabAvg,
      totalQuestions: attempts.length,
      feedback,
      attempts: attemptsWithDetails,
      corrections
    };
  } catch (error) {
    logger.error('[SessionService] Error generating summary:', error);
    throw error;
  }
}

/**
 * Get detailed lesson summary (for PDF export)
 * @param {number} sessionId - Session ID
 * @returns {Promise<Object>} Detailed summary
 */
async function getDetailedSummary(sessionId) {
  try {
    const summary = await generateSessionSummary(sessionId);
    const topic = await topicModel.getTopicById(summary.session.topic_id);
    const vocabulary = await topicModel.getTopicVocabulary(summary.session.topic_id);

    return {
      ...summary,
      topic,
      vocabulary
    };
  } catch (error) {
    logger.error('[SessionService] Error getting detailed summary:', error);
    throw error;
  }
}

/**
 * Get user's latest session
 * @param {string} userId - User's UUID
 * @returns {Promise<Object|null>} Latest session or null
 */
async function getLatestSession(userId) {
  try {
    return await sessionModel.getLatestSession(userId);
  } catch (error) {
    logger.error('[SessionService] Error getting latest session:', error);
    throw error;
  }
}

/**
 * Get user's completed topics
 * @param {string} userId - User's UUID
 * @returns {Promise<Array>} Array of completed topic IDs
 */
async function getUserCompletedTopics(userId) {
  try {
    return await sessionModel.getUserCompletedTopics(userId);
  } catch (error) {
    logger.error('[SessionService] Error getting completed topics:', error);
    throw error;
  }
}

module.exports = {
  startSession,
  finishSession,
  getSessionDetails,
  generateSessionSummary,
  getDetailedSummary,
  getLatestSession,
  getUserCompletedTopics
};

