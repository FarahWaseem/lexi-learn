// backend/src/controllers/sessionController.js
// HTTP request handlers for session management

const sessionService = require('../services/sessionService');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Start a new session
 * POST /api/v1/sessions/start or POST /api/v1/sessions
 */
async function startSession(req, res) {
  try {
    const { dayNumber } = req.body;
    const userId = req.userId; // Set by ensureUserExists middleware

    if (!dayNumber) {
      return errorResponse(res, 'Day number is required', 400);
    }

    if (dayNumber < 1 || dayNumber > 60) {
      return errorResponse(res, 'Day number must be between 1 and 60', 400);
    }

    const result = await sessionService.startSession(userId, dayNumber);

    logger.info(`[SessionController] Session started: ${result.session.session_id}`);

    return successResponse(res, {
      message: 'Session started successfully',
      ...result
    }, 201);

  } catch (error) {
    logger.error('[SessionController] Error starting session:', error);
    return errorResponse(res, error.message || 'Failed to start session', 500);
  }
}

/**
 * Finish a session
 * POST /api/v1/sessions/:id/finish
 */
async function finishSession(req, res) {
  try {
    const { id } = req.params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      return errorResponse(res, 'Invalid session ID', 400);
    }

    const result = await sessionService.finishSession(sessionId);

    logger.info(`[SessionController] Session finished: ${sessionId}`);

    return successResponse(res, {
      message: 'Session finished successfully',
      ...result
    });

  } catch (error) {
    logger.error('[SessionController] Error finishing session:', error);
    return errorResponse(res, error.message || 'Failed to finish session', 500);
  }
}

/**
 * Get session summary
 * GET /api/v1/sessions/:id/summary
 */
async function getSessionSummary(req, res) {
  try {
    const { id } = req.params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      return errorResponse(res, 'Invalid session ID', 400);
    }

    const summary = await sessionService.generateSessionSummary(sessionId);

    return successResponse(res, {
      message: 'Session summary retrieved successfully',
      ...summary
    });

  } catch (error) {
    logger.error('[SessionController] Error getting session summary:', error);
    return errorResponse(res, error.message || 'Failed to get session summary', 500);
  }
}

/**
 * Get detailed session summary (for PDF export)
 * GET /api/v1/sessions/:id/summary/detailed
 */
async function getDetailedSummary(req, res) {
  try {
    const { id } = req.params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      return errorResponse(res, 'Invalid session ID', 400);
    }

    const summary = await sessionService.getDetailedSummary(sessionId);

    return successResponse(res, {
      message: 'Detailed summary retrieved successfully',
      ...summary
    });

  } catch (error) {
    logger.error('[SessionController] Error getting detailed summary:', error);
    return errorResponse(res, error.message || 'Failed to get detailed summary', 500);
  }
}

/**
 * Get latest session for user
 * GET /api/v1/sessions/latest
 */
async function getLatestSession(req, res) {
  try {
    const userId = req.userId;

    const session = await sessionService.getLatestSession(userId);

    if (!session) {
      return successResponse(res, {
        message: 'No sessions found',
        session: null
      });
    }

    return successResponse(res, {
      message: 'Latest session retrieved successfully',
      session
    });

  } catch (error) {
    logger.error('[SessionController] Error getting latest session:', error);
    return errorResponse(res, error.message || 'Failed to get latest session', 500);
  }
}

/**
 * Get session details
 * GET /api/v1/sessions/:id
 */
async function getSessionDetails(req, res) {
  try {
    const { id } = req.params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      return errorResponse(res, 'Invalid session ID', 400);
    }

    const details = await sessionService.getSessionDetails(sessionId);

    return successResponse(res, {
      message: 'Session details retrieved successfully',
      ...details
    });

  } catch (error) {
    logger.error('[SessionController] Error getting session details:', error);
    return errorResponse(res, error.message || 'Failed to get session details', 500);
  }
}

module.exports = {
  startSession,
  finishSession,
  getSessionSummary,
  getDetailedSummary,
  getLatestSession,
  getSessionDetails
};

