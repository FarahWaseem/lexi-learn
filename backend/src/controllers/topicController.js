// backend/src/controllers/topicController.js
// HTTP request handlers for topics and questions

const topicService = require('../services/topicService');
const sessionService = require('../services/sessionService');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Get all topics
 * GET /api/v1/topics
 */
async function getAllTopics(req, res) {
  try {
    const topics = await topicService.getAllTopics();

    return successResponse(res, {
      message: 'Topics retrieved successfully',
      topics,
      count: topics.length
    });

  } catch (error) {
    logger.error('[TopicController] Error getting all topics:', error);
    return errorResponse(res, error.message || 'Failed to get topics', 500);
  }
}

/**
 * Get topic by day number
 * GET /api/v1/topics/:dayNumber
 */
async function getTopicByDay(req, res) {
  try {
    const { dayNumber } = req.params;
    const day = parseInt(dayNumber);

    if (isNaN(day) || day < 1 || day > 60) {
      return errorResponse(res, 'Invalid day number. Must be between 1 and 60', 400);
    }

    const topic = await topicService.getTopicByDay(day);

    if (!topic) {
      return errorResponse(res, `Topic for day ${day} not found`, 404);
    }

    return successResponse(res, {
      message: 'Topic retrieved successfully',
      topic
    });

  } catch (error) {
    logger.error('[TopicController] Error getting topic by day:', error);
    return errorResponse(res, error.message || 'Failed to get topic', 500);
  }
}

/**
 * Get user's completed topics
 * GET /api/v1/topics/user/completed
 */
async function getUserCompletedTopics(req, res) {
  try {
    const userId = req.userId;

    const completedTopicIds = await sessionService.getUserCompletedTopics(userId);

    // Get full topic details
    const topics = await Promise.all(
      completedTopicIds.map(topicId => topicService.getTopicById(topicId))
    );

    return successResponse(res, {
      message: 'Completed topics retrieved successfully',
      topics: topics.filter(t => t !== null),
      count: topics.length
    });

  } catch (error) {
    logger.error('[TopicController] Error getting completed topics:', error);
    return errorResponse(res, error.message || 'Failed to get completed topics', 500);
  }
}

/**
 * Get topic vocabulary
 * GET /api/v1/topics/:dayNumber/vocabulary
 */
async function getTopicVocabulary(req, res) {
  try {
    const { dayNumber } = req.params;
    const day = parseInt(dayNumber);

    if (isNaN(day) || day < 1 || day > 60) {
      return errorResponse(res, 'Invalid day number', 400);
    }

    const topic = await topicService.getTopicByDay(day);

    if (!topic) {
      return errorResponse(res, `Topic for day ${day} not found`, 404);
    }

    const vocabulary = await topicService.getTopicVocabulary(topic.topic_id);

    return successResponse(res, {
      message: 'Vocabulary retrieved successfully',
      vocabulary,
      count: vocabulary.length
    });

  } catch (error) {
    logger.error('[TopicController] Error getting vocabulary:', error);
    return errorResponse(res, error.message || 'Failed to get vocabulary', 500);
  }
}

/**
 * Initialize topics from seed file
 * POST /api/v1/topics/initialize
 */
async function initializeTopics(req, res) {
  try {
    const result = await topicService.initializeTopics();

    return successResponse(res, {
      message: 'Topics initialization completed',
      ...result
    });

  } catch (error) {
    logger.error('[TopicController] Error initializing topics:', error);
    return errorResponse(res, error.message || 'Failed to initialize topics', 500);
  }
}

module.exports = {
  getAllTopics,
  getTopicByDay,
  getUserCompletedTopics,
  getTopicVocabulary,
  initializeTopics
};

