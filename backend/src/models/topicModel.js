// backend/src/models/topicModel.js
// Database operations for topics, questions, and vocabulary

const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get all topics
 * @returns {Promise<Array>} Array of all topics
 */
async function getAllTopics() {
  const query = `
    SELECT topic_id, day_number, topic_name, description, created_at
    FROM daily_topics
    ORDER BY day_number
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    logger.error('[TopicModel] Error getting all topics:', error);
    throw error;
  }
}

/**
 * Get topic by day number
 * @param {number} dayNumber - Day number (1-60)
 * @returns {Promise<Object|null>} Topic data or null
 */
async function getTopicByDay(dayNumber) {
  const query = `
    SELECT topic_id, day_number, topic_name, description, created_at
    FROM daily_topics
    WHERE day_number = $1
  `;
  
  try {
    const result = await pool.query(query, [dayNumber]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('[TopicModel] Error getting topic by day:', error);
    throw error;
  }
}

/**
 * Get topic by ID
 * @param {number} topicId - Topic ID
 * @returns {Promise<Object|null>} Topic data or null
 */
async function getTopicById(topicId) {
  const query = `
    SELECT topic_id, day_number, topic_name, description, created_at
    FROM daily_topics
    WHERE topic_id = $1
  `;
  
  try {
    const result = await pool.query(query, [topicId]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('[TopicModel] Error getting topic by ID:', error);
    throw error;
  }
}

/**
 * Create a new topic
 * @param {Object} topicData - Topic data
 * @returns {Promise<Object>} Created topic
 */
async function createTopic({ dayNumber, topicName, description }) {
  const query = `
    INSERT INTO daily_topics (day_number, topic_name, description)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [dayNumber, topicName, description]);
    logger.info(`[TopicModel] Created topic: Day ${dayNumber} - ${topicName}`);
    return result.rows[0];
  } catch (error) {
    logger.error('[TopicModel] Error creating topic:', error);
    throw error;
  }
}

/**
 * Get questions for a topic
 * @param {number} topicId - Topic ID
 * @returns {Promise<Array>} Array of questions
 */
async function getTopicQuestions(topicId) {
  const query = `
    SELECT question_id, topic_id, question_idx, prompt, created_at
    FROM topic_questions
    WHERE topic_id = $1
    ORDER BY question_idx
  `;
  
  try {
    const result = await pool.query(query, [topicId]);
    return result.rows;
  } catch (error) {
    logger.error('[TopicModel] Error getting topic questions:', error);
    throw error;
  }
}

/**
 * Create a question for a topic
 * @param {Object} questionData - Question data
 * @returns {Promise<Object>} Created question
 */
async function createQuestion({ topicId, questionIdx, prompt }) {
  const query = `
    INSERT INTO topic_questions (topic_id, question_idx, prompt)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [topicId, questionIdx, prompt]);
    return result.rows[0];
  } catch (error) {
    logger.error('[TopicModel] Error creating question:', error);
    throw error;
  }
}

/**
 * Get vocabulary words for a topic
 * @param {number} topicId - Topic ID
 * @returns {Promise<Array>} Array of vocabulary words
 */
async function getTopicVocabulary(topicId) {
  const query = `
    SELECT word_id, topic_id, word, meaning, created_at
    FROM topic_words
    WHERE topic_id = $1
    ORDER BY word
  `;
  
  try {
    const result = await pool.query(query, [topicId]);
    return result.rows;
  } catch (error) {
    logger.error('[TopicModel] Error getting topic vocabulary:', error);
    throw error;
  }
}

/**
 * Add vocabulary word to a topic
 * @param {Object} wordData - Word data
 * @returns {Promise<Object>} Created word
 */
async function addTopicWord({ topicId, word, meaning }) {
  const query = `
    INSERT INTO topic_words (topic_id, word, meaning)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [topicId, word, meaning]);
    return result.rows[0];
  } catch (error) {
    logger.error('[TopicModel] Error adding topic word:', error);
    throw error;
  }
}

/**
 * Get or create topic with questions (for seeding)
 * @param {Object} topicData - Complete topic data with questions and vocabulary
 * @returns {Promise<Object>} Topic with questions
 */
async function getOrCreateTopicWithQuestions(topicData) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if topic exists
    let topic = await getTopicByDay(topicData.dayNumber);
    
    if (!topic) {
      // Create topic
      const topicResult = await client.query(
        `INSERT INTO daily_topics (day_number, topic_name, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [topicData.dayNumber, topicData.topicName, topicData.description]
      );
      topic = topicResult.rows[0];

      // Create questions
      if (topicData.questions && topicData.questions.length > 0) {
        for (let i = 0; i < topicData.questions.length; i++) {
          await client.query(
            `INSERT INTO topic_questions (topic_id, question_idx, prompt)
             VALUES ($1, $2, $3)`,
            [topic.topic_id, i, topicData.questions[i]]
          );
        }
      }

      // Create vocabulary
      if (topicData.vocabulary && topicData.vocabulary.length > 0) {
        for (const vocab of topicData.vocabulary) {
          await client.query(
            `INSERT INTO topic_words (topic_id, word, meaning)
             VALUES ($1, $2, $3)`,
            [topic.topic_id, vocab.word, vocab.meaning]
          );
        }
      }

      logger.info(`[TopicModel] Created complete topic: Day ${topicData.dayNumber}`);
    }

    await client.query('COMMIT');
    
    // Get complete topic with questions
    const questions = await getTopicQuestions(topic.topic_id);
    const vocabulary = await getTopicVocabulary(topic.topic_id);
    
    return {
      ...topic,
      questions,
      vocabulary
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[TopicModel] Error in getOrCreateTopicWithQuestions:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getAllTopics,
  getTopicByDay,
  getTopicById,
  createTopic,
  getTopicQuestions,
  createQuestion,
  getTopicVocabulary,
  addTopicWord,
  getOrCreateTopicWithQuestions
};

