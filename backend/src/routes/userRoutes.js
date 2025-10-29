// backend/src/routes/userRoutes.js
// Routes for user management

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const optionalAuth = require('../middleware/optionalAuthMiddleware');

// Apply authentication (optional in dev mode)
router.use(optionalAuth);

/**
 * @route   GET /api/v1/user/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', userController.getMe);

/**
 * @route   PATCH /api/v1/user/me
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/me', userController.updateProfile);

/**
 * @route   GET /api/v1/user/topics
 * @desc    Get user's completed topics
 * @access  Private
 */
router.get('/topics', userController.getUserTopics);

module.exports = router;

