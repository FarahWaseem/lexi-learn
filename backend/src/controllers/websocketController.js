// backend/src/controllers/websocketController.js
// WebSocket event handlers for real-time lesson flow

const sessionService = require('../services/sessionService');
const topicService = require('../services/topicService');
const attemptModel = require('../models/attemptModel');
const utteranceModel = require('../models/utteranceModel');
const correctionModel = require('../models/correctionModel');
const sessionModel = require('../models/sessionModel');
const { generateCorrection } = require('../services/correctionService');
const logger = require('../utils/logger');

/**
 * Register WebSocket event handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function registerWebSocketHandlers(io) {
  io.on('connection', (socket) => {
    const userId = socket.data.uuidUserId;
    logger.info(`[WebSocket] Client connected: ${socket.id} (User: ${userId})`);

    /**
     * Event: start_day
     * Client initiates a new lesson for a specific day
     */
    socket.on('start_day', async ({ dayNumber = 1 }) => {
      try {
        logger.info(`[WebSocket] start_day event: day ${dayNumber} by user ${userId}`);

        // Start session and get topic details
        const { session, topic, questions, totalQuestions } = await sessionService.startSession(
          userId,
          dayNumber
        );

        // Get vocabulary for the topic
        const vocabulary = await topicService.getTopicVocabulary(topic.topic_id);

        // Emit welcome messages
        io.to(socket.id).emit('system_say', { 
          text: 'Awesome! Great decision to study today.' 
        });

        io.to(socket.id).emit('system_say', {
          text: `Day ${topic.day_number} — Topic: ${topic.topic_name}. Let's get started!`
        });

        // Emit session ready
        io.to(socket.id).emit('session_ready', {
          sessionId: session.session_id,
          dayNumber: topic.day_number
        });

        // Emit vocabulary
        io.to(socket.id).emit('topic_vocab', {
          dayNumber: topic.day_number,
          vocab: vocabulary || []
        });

        // Store session data in socket for this connection
        socket.data.currentSession = {
          sessionId: session.session_id,
          topicId: topic.topic_id,
          questions,
          totalQuestions
        };

        // Start with first question
        await askQuestion(socket, session.session_id, questions, 0);

      } catch (error) {
        logger.error('[WebSocket] Error in start_day:', error);
        io.to(socket.id).emit('error', {
          message: error.message || 'Failed to start lesson'
        });
      }
    });

    /**
     * Event: time_up
     * Client notifies that timer has expired for a question
     */
    socket.on('time_up', ({ questionIdx }) => {
      logger.info(`[WebSocket] time_up event: question ${questionIdx}`);
      // Echo back to client
      io.to(socket.id).emit('time_up', { questionIdx });
    });

    /**
     * Event: user_final_text
     * Client submits final answer for a question
     */
    socket.on('user_final_text', async ({ sessionId, questionIdx, text, mode, durationSec }) => {
      try {
        logger.info(`[WebSocket] user_final_text event: session ${sessionId}, question ${questionIdx}`);

        const sessionData = socket.data.currentSession;
        if (!sessionData) {
          throw new Error('No active session');
        }

        // Get the question from stored data
        const question = sessionData.questions[questionIdx - 1];
        if (!question) {
          throw new Error('Question not found');
        }

        // Create or get attempt
        const attempt = await attemptModel.ensureAttempt(sessionId, question.question_id);

        // Save user utterance
        await utteranceModel.createUserUtterance({
          attemptId: attempt.attempt_id,
          text: text || '',
          audioUrl: null
        });

        // Generate AI correction
        const correction = await generateCorrection(text || '');

        // Process for spoken vs typed mode
        const isSpoken = String(mode || '').toLowerCase() === 'spoken';
        let filteredIssues = correction.issues || [];
        let speakingBlock = '';

        if (isSpoken) {
          // Filter out noise issues for spoken mode
          const noisePattern = /(capitalize|capitalization|upper case|question mark|punctuation|comma|period)/i;
          filteredIssues = filteredIssues.filter(
            it => !noisePattern.test(`${it.type || ''} ${it.note || ''}`)
          );

          // Calculate speaking metrics
          const raw = String(text || '').trim();
          const words = raw.split(/\s+/).filter(Boolean);
          const secs = Math.max(1, Number(durationSec || 0));
          const wpm = Math.round((words.length / secs) * 60);

          const fillers = (raw.match(/\b(um+|uh+|erm+|like|you know)\b/gi) || []).length;
          const repeats = (raw.match(/\b(\w+)\s+\1\b/gi) || []).length;

          const tips = [];
          tips.push(`Speaking speed ≈ ${wpm} wpm (target 110–160 for clarity).`);
          if (fillers > 0) {
            tips.push(`Try fewer fillers (found ~${fillers}). Pause instead of "um/uh/like".`);
          }
          if (repeats > 0) {
            tips.push(`A bit of repetition detected (~${repeats}). Finish ideas then move on.`);
          }

          speakingBlock = tips.length > 0 ? '\n\nSpeaking tips:\n- ' + tips.join('\n- ') : '';
        }

        // Build detailed feedback
        const prettyFeedback = String(correction.feedback || '')
          .replace(/^feedback:\s*/i, '')
          .trim();

        const correctedPart = correction.corrected
          ? `\n\nCorrected (for reference):\n${correction.corrected}`
          : '';

        const issuesPart = filteredIssues.length > 0
          ? '\n\nKey issues:\n' +
            filteredIssues
              .slice(0, 10)
              .map((it, i) => 
                `- ${i + 1}. [${it.type || 'grammar'}] "${it.before}" → "${it.after}" — ${it.note || ''}`
              )
              .join('\n')
          : '';

        const finalFeedback = (isSpoken
          ? `Speaking feedback: ${prettyFeedback || 'Good speaking effort.'}${speakingBlock}${correctedPart}${issuesPart}`
          : `Feedback: ${prettyFeedback || 'Good effort. See suggested fixes.'}${correctedPart}${issuesPart}`
        )
          .replace(/\n{3,}/g, '\n\n')
          .slice(0, 3000);

        // Save correction to database
        await correctionModel.createCorrection({
          attemptId: attempt.attempt_id,
          originalText: text || '',
          correctedText: correction.corrected || text || '',
          feedback: finalFeedback,
          issues: filteredIssues,
          fluencyScore: correction.fluency,
          grammarScore: correction.grammar,
          vocabScore: correction.vocab
        });

        // Save AI feedback as utterance
        await utteranceModel.createAiUtterance({
          attemptId: attempt.attempt_id,
          text: `Feedback:\n${finalFeedback}`
        });

        // Complete the attempt
        await attemptModel.completeAttempt(attempt.attempt_id);

        // Emit feedback to client
        io.to(socket.id).emit('correction_ready', {
          questionIdx,
          transcript: text || '',
          feedback: finalFeedback,
          corrected: correction.corrected,
          issues: filteredIssues,
          scores: {
            fluency: correction.fluency,
            grammar: correction.grammar,
            vocab: correction.vocab
          }
        });

        // Check if there are more questions
        const nextIdx = questionIdx + 1;
        if (nextIdx <= sessionData.totalQuestions) {
          // Emit awaiting next question
          io.to(socket.id).emit('awaiting_next', { nextIdx });

          // Set up listener for ready_for_next
          const onReady = async (payload = {}) => {
            if (Number(payload.afterQuestion) === questionIdx) {
              socket.off('ready_for_next', onReady);
              await askQuestion(socket, sessionId, sessionData.questions, nextIdx - 1);
            }
          };
          socket.on('ready_for_next', onReady);

        } else {
          // Lesson finished
          await sessionModel.finishSession(sessionId);
          io.to(socket.id).emit('lesson_finished', { sessionId });

          // Generate and send summary
          try {
            const summary = await sessionService.generateSessionSummary(sessionId);
            io.to(socket.id).emit('summary_ready', summary);
          } catch (summaryError) {
            logger.error('[WebSocket] Error generating summary:', summaryError);
          }
        }

      } catch (error) {
        logger.error('[WebSocket] Error in user_final_text:', error);
        io.to(socket.id).emit('error', {
          message: error.message || 'Failed to process answer'
        });
      }
    });

    /**
     * Event: ready_for_next
     * Client is ready to move to next question
     * (Handled dynamically in user_final_text handler)
     */

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      logger.info(`[WebSocket] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  logger.info('[WebSocket] Event handlers registered');
}

/**
 * Helper: Ask a question to the client
 */
async function askQuestion(socket, sessionId, questions, questionIndex) {
  try {
    const question = questions[questionIndex];
    
    if (!question) {
      throw new Error('Question not found');
    }

    const questionIdx = questionIndex + 1; // 1-based index for client

    // Create attempt and save question as AI utterance
    const attempt = await attemptModel.ensureAttempt(sessionId, question.question_id);
    await utteranceModel.createAiUtterance({
      attemptId: attempt.attempt_id,
      text: `Q${questionIdx}: ${question.prompt}`
    });

    // Emit question to client
    socket.emit('ask_question', {
      sessionId,
      questionIdx,
      prompt: question.prompt,
      seconds: 10 // Timer reference for client
    });

    logger.info(`[WebSocket] Asked question ${questionIdx} for session ${sessionId}`);

  } catch (error) {
    logger.error('[WebSocket] Error asking question:', error);
    socket.emit('error', {
      message: error.message || 'Failed to ask question'
    });
  }
}

module.exports = {
  registerWebSocketHandlers
};

