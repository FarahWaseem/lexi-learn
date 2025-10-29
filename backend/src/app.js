const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
require('dotenv').config();

// Polyfill fetch for correction service
global.fetch = global.fetch || require('node-fetch');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { connectDB } = require('./config/database');
const { initializeWebSocket } = require('./config/websocket');
const { registerWebSocketHandlers } = require('./controllers/websocketController');

// Import routes
const vocabRoutes = require('./routes/vocabRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const topicRoutes = require('./routes/topicRoutes');
const userRoutes = require('./routes/userRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration - Allow both React (3000) and Vite (5173) ports
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.CORS_ORIGIN || 'http://localhost:3000'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/v1/vocab', vocabRoutes);
app.use('/api/v1/lessons', lessonRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/topics', topicRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/export', exportRoutes);

// Backward compatibility routes (for old frontend)
app.use('/api/sessions', sessionRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/me', userRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize WebSocket server
const io = initializeWebSocket(server);
registerWebSocketHandlers(io);

// Connect to database and start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server initialized`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };