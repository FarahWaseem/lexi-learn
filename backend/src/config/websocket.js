// backend/src/config/websocket.js
// WebSocket configuration and initialization for Socket.IO

const { Server: IOServer } = require('socket.io');
const { verifyToken } = require('@clerk/backend');
const logger = require('../utils/logger');

/**
 * Initialize WebSocket server with authentication
 * @param {http.Server} server - HTTP server instance
 * @returns {SocketIO.Server} Configured Socket.IO server
 */
function initializeWebSocket(server) {
  const io = new IOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Allow localhost on any port
        if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
          return callback(null, true);
        }

        // Allow configured frontend URL
        if (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL)) {
          return callback(null, true);
        }

        // Reject other origins
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // WebSocket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        logger.warn('[WebSocket] Connection attempt without token');
        return next(new Error('Authentication token required'));
      }

      // Verify Clerk token
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });

      if (!payload || !payload.sub) {
        logger.warn('[WebSocket] Invalid token payload');
        return next(new Error('Invalid authentication token'));
      }

      // Store user info in socket data
      socket.data.clerkUserId = payload.sub;
      socket.data.sessionId = payload.sid;

      logger.info(`[WebSocket] User authenticated: ${payload.sub}`);
      next();

    } catch (error) {
      logger.error('[WebSocket] Authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection event handler
  io.on('connection', (socket) => {
    const userId = socket.data.clerkUserId;
    logger.info(`[WebSocket] Client connected: ${socket.id} (User: ${userId})`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    socket.on('disconnect', (reason) => {
      logger.info(`[WebSocket] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });

    socket.on('error', (error) => {
      logger.error(`[WebSocket] Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('[WebSocket] Socket.IO server initialized');
  return io;
}

module.exports = { initializeWebSocket };

