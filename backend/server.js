require('dotenv').config();
const { server } = require('./src/app');

const PORT = process.env.PORT || 3001;

// Don't call listen here - app.js already handles it
// This file is now just for backwards compatibility