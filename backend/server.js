// server.js — LexiLearn v1.1 (Modular Backend)

require('dotenv').config();
const http = require('http');
const { createApp } = require('./src/app');
const { attachRealtime } = require('./src/ws/socket');

const app = createApp();
const server = http.createServer(app);
attachRealtime(server);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server + Realtime running at http://localhost:${PORT}`);
});
