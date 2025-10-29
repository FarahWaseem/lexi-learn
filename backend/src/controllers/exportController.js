// backend/src/controllers/exportController.js
// HTTP request handlers for export functionality (PDF)

const sessionService = require('../services/sessionService');
const userModel = require('../models/userModel');
const pdfService = require('../services/pdfService');
const logger = require('../utils/logger');

/**
 * Export session as PDF
 * GET /api/v1/sessions/:id/export/pdf
 */
async function exportSessionPDF(req, res) {
  try {
    const { id } = req.params;
    const sessionId = parseInt(id);
    const userId = req.userId;

    if (isNaN(sessionId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid session ID' 
      });
    }

    // Get detailed session summary
    const summary = await sessionService.getDetailedSummary(sessionId);

    if (!summary) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    // Verify session belongs to user
    if (summary.session.user_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Get user info for PDF
    const user = await userModel.getUserById(userId);
    const userName = user 
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email 
      : 'Student';

    // Generate PDF
    const doc = pdfService.generateSessionPDF(summary, userName);

    // Set response headers
    const filename = `LexiLearn-Day${summary.topic?.day_number || sessionId}-Summary.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();

    logger.info(`[ExportController] PDF exported for session ${sessionId}`);

  } catch (error) {
    logger.error('[ExportController] Error exporting PDF:', error);
    
    // Only send JSON error if headers not sent
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to export PDF' 
      });
    }
  }
}

module.exports = {
  exportSessionPDF
};

