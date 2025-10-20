const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');
const cors = require('cors');


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PUBLIC = path.join(__dirname, 'public');
const UPLOADS = path.join(__dirname, 'uploads');
app.use(express.static(PUBLIC));
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));

// Storage
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

app.post('/api/day/:day/answer/:idx', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  const inputPath = req.file.path; // multer gives us the full path
  const wavPath = inputPath.replace(path.extname(inputPath), '.wav');

  console.log("FFmpeg input:", inputPath);
  console.log("FFmpeg output:", wavPath);

  // Convert the file to WAV
  ffmpeg(inputPath)
    .toFormat('wav')
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      return res.status(500).json({ error: 'Audio conversion failed', details: err.message });
    })
    .on('end', () => {
      console.log('Conversion finished.');
      // After conversion, run Whisper
      exec(`python whisper_run.py "${wavPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error('Whisper error:', error);
          console.error('Whisper stderr:', stderr);
          return res.status(500).json({ error: 'Whisper transcription failed', details: error.message });
        }

        const transcript = stdout.trim();
        res.json({ transcript });
      });
    })
    .save(wavPath);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});