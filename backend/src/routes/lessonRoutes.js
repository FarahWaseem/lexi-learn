const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
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

// Public routes (if needed)
// router.get('/public', getPublicLessons);

// Protected routes
router.use(protect); // All routes below this middleware are protected

// GET /api/v1/lessons - Get all lessons
router.get('/', getLessons);

// GET /api/v1/lessons/:id - Get specific lesson
router.get('/:id', getLessonById);

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

