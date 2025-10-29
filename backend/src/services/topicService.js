// backend/src/services/topicService.js
// Business logic for topics and questions

const topicModel = require('../models/topicModel');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Get all topics
 * @returns {Promise<Array>} Array of all topics
 */
async function getAllTopics() {
  try {
    return await topicModel.getAllTopics();
  } catch (error) {
    logger.error('[TopicService] Error getting all topics:', error);
    throw error;
  }
}

/**
 * Get topic by day number with questions and vocabulary
 * @param {number} dayNumber - Day number (1-60)
 * @returns {Promise<Object>} Topic with questions and vocabulary
 */
async function getTopicByDay(dayNumber) {
  try {
    const topic = await topicModel.getTopicByDay(dayNumber);
    
    if (!topic) {
      return null;
    }

    const [questions, vocabulary] = await Promise.all([
      topicModel.getTopicQuestions(topic.topic_id),
      topicModel.getTopicVocabulary(topic.topic_id)
    ]);

    return {
      ...topic,
      questions,
      vocabulary
    };
  } catch (error) {
    logger.error('[TopicService] Error getting topic by day:', error);
    throw error;
  }
}

/**
 * Get topic by ID with questions and vocabulary
 * @param {number} topicId - Topic ID
 * @returns {Promise<Object>} Topic with questions and vocabulary
 */
async function getTopicById(topicId) {
  try {
    const topic = await topicModel.getTopicById(topicId);
    
    if (!topic) {
      return null;
    }

    const [questions, vocabulary] = await Promise.all([
      topicModel.getTopicQuestions(topic.topic_id),
      topicModel.getTopicVocabulary(topic.topic_id)
    ]);

    return {
      ...topic,
      questions,
      vocabulary
    };
  } catch (error) {
    logger.error('[TopicService] Error getting topic by ID:', error);
    throw error;
  }
}

/**
 * Create a new topic with questions and vocabulary
 * @param {Object} topicData - Complete topic data
 * @returns {Promise<Object>} Created topic
 */
async function createTopic(topicData) {
  try {
    const { dayNumber, topicName, description, questions, vocabulary } = topicData;

    // Create topic
    const topic = await topicModel.createTopic({
      dayNumber,
      topicName,
      description
    });

    // Create questions
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        await topicModel.createQuestion({
          topicId: topic.topic_id,
          questionIdx: i,
          prompt: questions[i]
        });
      }
    }

    // Create vocabulary
    if (vocabulary && vocabulary.length > 0) {
      for (const word of vocabulary) {
        await topicModel.addTopicWord({
          topicId: topic.topic_id,
          word: word.word,
          meaning: word.meaning
        });
      }
    }

    logger.info(`[TopicService] Created topic: Day ${dayNumber} - ${topicName}`);

    // Return complete topic
    return await getTopicById(topic.topic_id);
  } catch (error) {
    logger.error('[TopicService] Error creating topic:', error);
    throw error;
  }
}

/**
 * Load topics from JSON seed file
 * @param {string} filePath - Path to topics.json file
 * @returns {Promise<Object>} Load results
 */
async function loadTopicsFromFile(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Topics file not found: ${filePath}`);
    }

    // Read and parse file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const topicsData = JSON.parse(fileContent);

    if (!Array.isArray(topicsData)) {
      throw new Error('Topics file must contain an array');
    }

    logger.info(`[TopicService] Loading ${topicsData.length} topics from file`);

    let created = 0;
    let skipped = 0;

    // Load each topic
    for (const topicData of topicsData) {
      try {
        // Check if topic already exists
        const existing = await topicModel.getTopicByDay(topicData.dayNumber);
        
        if (existing) {
          logger.debug(`[TopicService] Topic day ${topicData.dayNumber} already exists, skipping`);
          skipped++;
          continue;
        }

        // Create topic with questions and vocabulary
        await topicModel.getOrCreateTopicWithQuestions(topicData);
        created++;
        
      } catch (error) {
        logger.error(`[TopicService] Error loading topic day ${topicData.dayNumber}:`, error);
        // Continue with next topic
      }
    }

    logger.info(`[TopicService] Loaded topics: ${created} created, ${skipped} skipped`);

    return {
      success: true,
      created,
      skipped,
      total: topicsData.length
    };
  } catch (error) {
    logger.error('[TopicService] Error loading topics from file:', error);
    throw error;
  }
}

/**
 * Initialize topics (load default topics if none exist)
 * @returns {Promise<Object>} Initialization results
 */
async function initializeTopics() {
  try {
    // Check if topics already exist
    const existingTopics = await topicModel.getAllTopics();
    
    if (existingTopics.length > 0) {
      logger.info(`[TopicService] Topics already initialized (${existingTopics.length} topics)`);
      return {
        success: true,
        message: 'Topics already initialized',
        count: existingTopics.length
      };
    }

    // Try to load from topics.json in project root
    const possiblePaths = [
      path.join(__dirname, '../../topics.json'),
      path.join(__dirname, '../../../topics.json'),
      path.join(process.cwd(), 'topics.json'),
      path.join(process.cwd(), 'backend/topics.json')
    ];

    for (const topicsPath of possiblePaths) {
      if (fs.existsSync(topicsPath)) {
        logger.info(`[TopicService] Found topics file at: ${topicsPath}`);
        const result = await loadTopicsFromFile(topicsPath);
        return result;
      }
    }

    logger.warn('[TopicService] No topics.json file found, no topics loaded');
    return {
      success: false,
      message: 'No topics file found',
      count: 0
    };
  } catch (error) {
    logger.error('[TopicService] Error initializing topics:', error);
    throw error;
  }
}

/**
 * Get topic vocabulary
 * @param {number} topicId - Topic ID
 * @returns {Promise<Array>} Array of vocabulary words
 */
async function getTopicVocabulary(topicId) {
  try {
    return await topicModel.getTopicVocabulary(topicId);
  } catch (error) {
    logger.error('[TopicService] Error getting topic vocabulary:', error);
    throw error;
  }
}

module.exports = {
  getAllTopics,
  getTopicByDay,
  getTopicById,
  createTopic,
  loadTopicsFromFile,
  initializeTopics,
  getTopicVocabulary
};

