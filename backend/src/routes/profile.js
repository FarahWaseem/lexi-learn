const express = require('express');
const router = express.Router();
const { requireAuth } = require('../services/clerk');
const {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  getAchievements,
  getActivity,
  deleteAccount,
} = require('../controllers/profileController');

/**
 * 👤 Profile Routes
 * All routes are protected with Clerk authentication
 */

// Middleware to extract userId from Clerk
const extractUserId = async (req, res, next) => {
  try {
    const { requireUser } = require('../services/clerk');
    req.userId = await requireUser(req);
    next();
  } catch (err) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
};

// GET /api/profile - Get user profile
router.get('/', requireAuth, extractUserId, getProfile);

// PUT /api/profile - Update user profile
router.put('/', requireAuth, extractUserId, updateProfile);

// GET /api/profile/settings - Get user settings
router.get('/settings', requireAuth, extractUserId, getSettings);

// PUT /api/profile/settings - Update user settings
router.put('/settings', requireAuth, extractUserId, updateSettings);

// GET /api/profile/achievements - Get user achievements
router.get('/achievements', requireAuth, extractUserId, getAchievements);

// GET /api/profile/activity - Get user activity history
router.get('/activity', requireAuth, extractUserId, getActivity);

// DELETE /api/profile/account - Delete user account
router.delete('/account', requireAuth, extractUserId, deleteAccount);

module.exports = router;

