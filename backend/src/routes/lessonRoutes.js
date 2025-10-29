const express = require('express');
const router = express.Router();
const { authenticateClerk } = require('../middleware/clerkMiddleware');
const { validateRequest, schemas } = require('../middleware/validationMiddleware');
const {
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonWords,
  addWordToLesson,
  removeWordFromLesson
} = require('../controllers/lessonController');

const {
  getLessons: getLessonsForUI,
  getLessonById: getLessonByIdForUI,
  startLesson,
  completeLesson,
  getLessonStats
} = require('../controllers/lessonsController');

const {
  getLessonsForUI: getLessonsUI,
  getLessonDetailsForUI,
  startLessonSession,
  completeLessonSession,
  getLessonStatistics
} = require('../controllers/lessonsUIController');

// Public routes (if needed)
// router.get('/public', getPublicLessons);

// Protected routes
router.use(authenticateClerk); // All routes below this middleware are protected with Clerk

// ============================================
// Lessons UI Routes (compatible with Lessons.jsx)
// ============================================

// GET /api/v1/lessons/ui - Get all lessons for UI
router.get('/ui', getLessonsUI);

// GET /api/v1/lessons/ui/:id - Get specific lesson for UI
router.get('/ui/:id', getLessonDetailsForUI);

// POST /api/v1/lessons/ui/:id/start - Start lesson session
router.post('/ui/:id/start', startLessonSession);

// POST /api/v1/lessons/ui/:id/complete - Complete lesson session
router.post('/ui/:id/complete', completeLessonSession);

// GET /api/v1/lessons/ui/stats - Get lesson statistics
router.get('/ui/stats', getLessonStatistics);

// ============================================
// General Lessons Routes
// ============================================

// GET /api/v1/lessons - Get all lessons
router.get('/', getLessonsForUI);

// GET /api/v1/lessons/:id - Get specific lesson
router.get('/:id', getLessonByIdForUI);

// POST /api/v1/lessons/:id/start - Start lesson session
router.post('/:id/start', startLesson);

// POST /api/v1/lessons/:id/complete - Complete lesson session
router.post('/:id/complete', completeLesson);

// GET /api/v1/lessons/stats - Get lesson statistics
router.get('/stats', getLessonStats);

// ============================================
// Admin/Management Routes
// ============================================

// GET /api/v1/lessons/admin - Get all lessons (admin)
router.get('/admin', getLessons);

// GET /api/v1/lessons/:id/words - Get words for a lesson
router.get('/:id/words', getLessonWords);

// POST /api/v1/lessons - Create new lesson
router.post('/', validateRequest(schemas.createLesson), createLesson);

// PUT /api/v1/lessons/:id - Update lesson
router.put('/:id', updateLesson);

// DELETE /api/v1/lessons/:id - Delete lesson
router.delete('/:id', deleteLesson);

// POST /api/v1/lessons/:id/words - Add word to lesson
router.post('/:id/words', addWordToLesson);

// DELETE /api/v1/lessons/:id/words/:wordId - Remove word from lesson
router.delete('/:id/words/:wordId', removeWordFromLesson);

module.exports = router;

