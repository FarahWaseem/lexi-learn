// backend/src/controllers/userController.js
// HTTP request handlers for user management

const userModel = require('../models/userModel');
const sessionModel = require('../models/sessionModel');
const correctionModel = require('../models/correctionModel');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Get current user profile
 * GET /api/v1/user/me
 */
async function getMe(req, res) {
  try {
    const userId = req.userId;

    const user = await userModel.getUserById(userId);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Get user stats
    const stats = await userModel.getUserStats(userId);
    const averageScores = await correctionModel.getUserAverageScores(userId, 10);

    return successResponse(res, {
      message: 'User profile retrieved successfully',
      user: {
        id: user.user_id,
        clerkId: user.clerk_user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        streak: user.streak,
        createdAt: user.created_at,
        lastActive: user.last_active
      },
      stats: {
        totalSessions: parseInt(stats?.total_sessions || 0),
        completedSessions: parseInt(stats?.completed_sessions || 0),
        uniqueTopicsStudied: parseInt(stats?.unique_topics_studied || 0),
        streak: user.streak || 0
      },
      averageScores
    });

  } catch (error) {
    logger.error('[UserController] Error getting user profile:', error);
    return errorResponse(res, error.message || 'Failed to get user profile', 500);
  }
}

/**
 * Get user's completed topics
 * GET /api/v1/user/topics
 */
async function getUserTopics(req, res) {
  try {
    const userId = req.userId;

    const completedTopicIds = await sessionModel.getUserCompletedTopics(userId);

    return successResponse(res, {
      message: 'User topics retrieved successfully',
      completedTopics: completedTopicIds,
      count: completedTopicIds.length
    });

  } catch (error) {
    logger.error('[UserController] Error getting user topics:', error);
    return errorResponse(res, error.message || 'Failed to get user topics', 500);
  }
}

/**
 * Update user profile
 * PATCH /api/v1/user/me
 */
async function updateProfile(req, res) {
  try {
    const userId = req.userId;
    const { firstName, lastName, email } = req.body;

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, 'No fields to update', 400);
    }

    const updatedUser = await userModel.updateUser(userId, updates);

    return successResponse(res, {
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.user_id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name
      }
    });

  } catch (error) {
    logger.error('[UserController] Error updating profile:', error);
    return errorResponse(res, error.message || 'Failed to update profile', 500);
  }
}

module.exports = {
  getMe,
  getUserTopics,
  updateProfile
};

