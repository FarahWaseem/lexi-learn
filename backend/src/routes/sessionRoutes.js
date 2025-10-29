// backend/src/routes/sessionRoutes.js
// Routes for session management

const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const optionalAuth = require('../middleware/optionalAuthMiddleware');

// Apply authentication (optional in dev mode)
router.use(optionalAuth);

/**
 * @route   POST /api/v1/sessions/start
 * @desc    Start a new lesson session
 * @access  Private
 */
router.post('/start', sessionController.startSession);

/**
 * @route   POST /api/v1/sessions
 * @desc    Start a new lesson session (alias)
 * @access  Private
 */
router.post('/', sessionController.startSession);

/**
 * @route   POST /api/v1/sessions/:id/finish
 * @desc    Finish a lesson session
 * @access  Private
 */
router.post('/:id/finish', sessionController.finishSession);

/**
 * @route   GET /api/v1/sessions/:id/summary
 * @desc    Get session summary
 * @access  Private
 */
router.get('/:id/summary', sessionController.getSessionSummary);

/**
 * @route   GET /api/v1/sessions/:id/summary/detailed
 * @desc    Get detailed session summary (for lesson summary page)
 * @access  Private
 */
router.get('/:id/summary/detailed', sessionController.getDetailedSummary);

/**
 * @route   GET /api/v1/sessions/latest
 * @desc    Get user's latest session
 * @access  Private
 */
router.get('/latest', sessionController.getLatestSession);

/**
 * @route   GET /api/v1/sessions/:id/lesson-summary
 * @desc    Get detailed lesson summary (backward compatibility)
 * @access  Private
 */
router.get('/:id/lesson-summary', sessionController.getDetailedSummary);

/**
 * @route   GET /api/v1/sessions/:id
 * @desc    Get session details
 * @access  Private
 */
router.get('/:id', sessionController.getSessionDetails);

module.exports = router;

