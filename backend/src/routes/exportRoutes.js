// backend/src/routes/exportRoutes.js
// Routes for export functionality

const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const optionalAuth = require('../middleware/optionalAuthMiddleware');

// Apply authentication (optional in dev mode)
router.use(optionalAuth);

/**
 * @route   GET /api/v1/export/sessions/:id/pdf
 * @desc    Export session summary as PDF
 * @access  Private
 */
router.get('/sessions/:id/pdf', exportController.exportSessionPDF);

module.exports = router;

