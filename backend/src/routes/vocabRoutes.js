const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateRequest, schemas } = require('../middleware/validationMiddleware');
const {
  getVocabWords,
  createVocabWord,
  updateVocabWord,
  deleteVocabWord,
  getVocabWordById,
  searchVocabWords,
  getVocabStats
} = require('../controllers/vocabController');

// Public routes (if needed)
// router.get('/public', getPublicVocabWords);

// Protected routes
router.use(protect); // All routes below this middleware are protected

// GET /api/v1/vocab - Get all vocab words with pagination and filtering
router.get('/', validateRequest(schemas.pagination), getVocabWords);

// GET /api/v1/vocab/search - Search vocab words
router.get('/search', searchVocabWords);

// GET /api/v1/vocab/stats - Get vocabulary statistics
router.get('/stats', getVocabStats);

// GET /api/v1/vocab/:id - Get specific vocab word
router.get('/:id', getVocabWordById);

// POST /api/v1/vocab - Create new vocab word
router.post('/', validateRequest(schemas.createVocab), createVocabWord);

// PUT /api/v1/vocab/:id - Update vocab word
router.put('/:id', validateRequest(schemas.updateVocab), updateVocabWord);

// DELETE /api/v1/vocab/:id - Delete vocab word
router.delete('/:id', deleteVocabWord);

module.exports = router;
