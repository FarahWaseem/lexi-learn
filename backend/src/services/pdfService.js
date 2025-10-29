// backend/src/services/pdfService.js
// PDF generation service for lesson summaries

const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

/**
 * Generate PDF for session summary
 * @param {Object} summaryData - Complete session summary data
 * @param {string} userName - User's display name
 * @returns {PDFDocument} PDF document stream
 */
function generateSessionPDF(summaryData, userName = 'Student') {
  try {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `LexiLearn Lesson Summary - Day ${summaryData.topic?.day_number || ''}`,
        Author: 'LexiLearn',
        Subject: 'Lesson Summary',
        CreatedDate: new Date()
      }
    });

    // Colors
    const ACCENT = '#3B82F6';
    const LINE = '#E5E7EB';
    const MUTED = '#6B7280';

    // Helper functions
    const drawLine = () => {
      doc.moveTo(52, doc.y).lineTo(doc.page.width - 52, doc.y).strokeColor(LINE).stroke();
      doc.moveDown(0.4);
    };

    const sectionTitle = (text) => {
      doc.fontSize(14).fillColor('#111827').text(text, { underline: true });
      doc.moveDown(0.3);
    };

    const keyValue = (key, value) => {
      doc.fontSize(11).fillColor('#6B7280').text(key + ':', { continued: true });
      doc.fillColor('#111827').text('  ' + value);
      doc.moveDown(0.2);
    };

    const scoreBar = (label, score) => {
      const barWidth = 400;
      const barHeight = 20;
      const fillWidth = (score / 100) * barWidth;

      doc.fontSize(11).fillColor('#111827').text(label);
      doc.moveDown(0.2);

      const y = doc.y;
      // Background bar
      doc.roundedRect(52, y, barWidth, barHeight, 5)
        .fillColor('#F3F4F6')
        .fill();

      // Score bar
      if (fillWidth > 0) {
        doc.roundedRect(52, y, fillWidth, barHeight, 5)
          .fillColor(ACCENT)
          .fill();
      }

      // Score text
      doc.fontSize(10)
        .fillColor('#111827')
        .text(`${score}%`, 52 + barWidth + 10, y + 5);

      doc.moveDown(1.2);
    };

    const pill = (text) => {
      const w = doc.widthOfString(text) + 20;
      const h = 24;
      const x = doc.x;
      const y = doc.y;

      doc.roundedRect(x, y, w, h, 12)
        .fillColor('#DBEAFE')
        .fill()
        .fillColor('#1E40AF')
        .fontSize(10)
        .text(text, x + 10, y + 7);

      doc.x = x + w + 8;
    };

    // ====== Build Document ======
    
    // Header
    doc.save();
    doc.rect(40, 40, doc.page.width - 80, 70).fill(ACCENT);
    doc.fill('#fff')
      .fontSize(16)
      .text('LexiLearn — Lesson Summary', 52, 52, { 
        width: doc.page.width - 104, 
        align: 'left' 
      });
    doc.fontSize(12).text(`Student: ${userName}`, 52, 78, { 
      width: doc.page.width - 104, 
      align: 'left' 
    });
    doc.restore();

    doc.moveDown(2);

    // Title
    const topic = summaryData.topic || {};
    doc.fontSize(18)
      .fillColor('#111827')
      .text(`Day ${topic.day_number || ''}: ${topic.topic_name || 'Lesson'}`);
    doc.moveDown(0.3);

    // Dates
    const startedAt = new Date(summaryData.session?.started_at || Date.now());
    const completedAt = new Date(summaryData.session?.completed_at || Date.now());
    doc.fontSize(10)
      .fillColor(MUTED)
      .text(`Started: ${startedAt.toLocaleString()}     Completed: ${completedAt.toLocaleString()}`);
    drawLine();

    // Overview Section
    sectionTitle('Overview');
    keyValue('Student', userName);
    keyValue('Lesson Title', topic.topic_name || '-');
    keyValue('Day', String(topic.day_number || '-'));
    keyValue('Status', String(summaryData.session?.status || 'Completed'));
    keyValue('Total Questions', String(summaryData.totalQuestions || 0));
    doc.moveDown(0.4);

    // Performance Scores
    scoreBar('Overall Score', summaryData.overallScore || 0);
    scoreBar('Fluency', summaryData.fluencyAvg || 0);
    scoreBar('Grammar', summaryData.grammarAvg || 0);
    scoreBar('Vocabulary', summaryData.vocabAvg || 0);
    drawLine();

    // Vocabulary Section
    const vocabulary = summaryData.vocabulary || [];
    if (vocabulary.length > 0) {
      sectionTitle('Vocabulary');
      doc.moveDown(0.2);

      vocabulary.slice(0, 6).forEach((word, idx) => {
        if (idx > 0 && idx % 2 === 0) {
          doc.moveDown(0.4);
        }
        pill(`${word.word}: ${word.meaning || ''}`);
      });

      doc.moveDown(1);
      drawLine();
    }

    // Questions and Answers Section
    sectionTitle('Questions & Answers');
    doc.moveDown(0.3);

    const attempts = summaryData.attempts || [];
    attempts.forEach((attempt, idx) => {
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
      }

      // Question
      doc.fontSize(12)
        .fillColor('#111827')
        .text(`Q${idx + 1}: ${attempt.question_prompt || 'Question'}`, { 
          underline: true 
        });
      doc.moveDown(0.2);

      // User's answer
      const userUtterance = (attempt.utterances || []).find(u => u.role === 'user');
      const userText = userUtterance?.text || 'No answer provided';
      doc.fontSize(11)
        .fillColor('#374151')
        .text(`Your answer: ${userText}`);
      doc.moveDown(0.3);

      // Correction feedback
      if (attempt.correction) {
        const corr = attempt.correction;
        
        doc.fontSize(11)
          .fillColor('#111827')
          .text('Feedback:');
        doc.fontSize(10)
          .fillColor('#374151')
          .text(corr.feedback || 'No feedback available', { 
            width: doc.page.width - 104 
          });
        doc.moveDown(0.3);

        // Scores
        const scores = [];
        if (corr.fluency_score != null) scores.push(`Fluency: ${corr.fluency_score}`);
        if (corr.grammar_score != null) scores.push(`Grammar: ${corr.grammar_score}`);
        if (corr.vocab_score != null) scores.push(`Vocab: ${corr.vocab_score}`);
        
        if (scores.length > 0) {
          doc.fontSize(10).fillColor(MUTED).text(scores.join(' • '));
        }
      }

      doc.moveDown(0.6);
      drawLine();
    });

    // Footer on all pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const pageLabel = `Page ${i + 1} of ${range.count}`;
      doc.fontSize(9)
        .fillColor(MUTED)
        .text(pageLabel, 40, doc.page.height - 30, {
          width: doc.page.width - 80,
          align: 'center'
        });
    }

    logger.info('[PDFService] PDF document generated successfully');
    return doc;

  } catch (error) {
    logger.error('[PDFService] Error generating PDF:', error);
    throw error;
  }
}

module.exports = {
  generateSessionPDF
};

