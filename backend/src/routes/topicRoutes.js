// backend/src/routes/topicRoutes.js
// Routes for topics and questions

const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const optionalAuth = require('../middleware/optionalAuthMiddleware');

// Apply authentication (optional in dev mode)
router.use(optionalAuth);

/**
 * @route   GET /api/v1/topics
 * @desc    Get all topics
 * @access  Private
 */
router.get('/', topicController.getAllTopics);

/**
 * @route   GET /api/v1/topics/user/completed
 * @desc    Get user's completed topics
 * @access  Private
 */
router.get('/user/completed', topicController.getUserCompletedTopics);

/**
 * @route   POST /api/v1/topics/initialize
 * @desc    Initialize topics from seed file
 * @access  Private (Admin only in production)
 */
router.post('/initialize', topicController.initializeTopics);

/**
 * @route   GET /api/v1/topics/:dayNumber
 * @desc    Get topic by day number
 * @access  Private
 */
router.get('/:dayNumber', topicController.getTopicByDay);

/**
 * @route   GET /api/v1/topics/:dayNumber/vocabulary
 * @desc    Get vocabulary for a topic
 * @access  Private
 */
router.get('/:dayNumber/vocabulary', topicController.getTopicVocabulary);

module.exports = router;

