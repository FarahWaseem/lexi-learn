const express = require('express');
const router = express.Router();
const { authenticateClerk } = require('../middleware/clerkMiddleware');
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

const {
  getVocabNotebook,
  addWordToNotebook,
  updateWordInNotebook,
  deleteWordFromNotebook,
  getVocabStats: getNotebookStats
} = require('../controllers/vocabNotebookController');

// Public routes (if needed)
// router.get('/public', getPublicVocabWords);

// Protected routes
router.use(authenticateClerk); // All routes below this middleware are protected with Clerk

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

// ============================================
// VocabNotebook specific routes (compatible with frontend)
// ============================================

// GET /api/v1/vocab/notebook - Get vocabulary notebook
router.get('/notebook', getVocabNotebook);

// POST /api/v1/vocab/notebook - Add word to notebook
router.post('/notebook', validateRequest(schemas.createVocab), addWordToNotebook);

// PUT /api/v1/vocab/notebook/:id - Update word in notebook
router.put('/notebook/:id', validateRequest(schemas.updateVocab), updateWordInNotebook);

// DELETE /api/v1/vocab/notebook/:id - Delete word from notebook
router.delete('/notebook/:id', deleteWordFromNotebook);

// GET /api/v1/vocab/notebook/stats - Get notebook statistics
router.get('/notebook/stats', getNotebookStats);

module.exports = router;
