const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middlewares
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folders
const PUBLIC = path.join(__dirname, '..', 'public');
const UPLOADS = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
app.use(express.static(PUBLIC));

// Routes
app.get('/', (req, res) => {
    res.send('✅ Backend is running successfully on port 3001');
  });

app.use('/api/day', require('./routes/audioRoutes'));

  
module.exports = app;