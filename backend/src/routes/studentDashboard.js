const express = require('express');
const router = express.Router();
const { requireAuth } = require('../services/clerk');
const {
  getStudentDashboard,
  getStudentStats,
  getRecentLessons,
  getPracticeHistory,
  getNextLesson,
} = require('../controllers/studentDashboardController');

/**
 * 📚 Student Dashboard Routes
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

// GET /api/student/dashboard - Get all dashboard data
router.get('/dashboard', requireAuth, extractUserId, getStudentDashboard);

// GET /api/student/stats - Get only stats (for header)
router.get('/stats', requireAuth, extractUserId, getStudentStats);

// GET /api/student/recent-lessons - Get recent completed lessons
router.get('/recent-lessons', requireAuth, extractUserId, getRecentLessons);

// GET /api/student/practice-history - Get practice history
router.get('/practice-history', requireAuth, extractUserId, getPracticeHistory);

// GET /api/student/next-lesson - Get next lesson to study
router.get('/next-lesson', requireAuth, extractUserId, getNextLesson);

module.exports = router;

