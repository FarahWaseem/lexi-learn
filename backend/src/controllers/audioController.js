const path = require('path');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

exports.handleAudioUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  const inputPath = req.file.path;
  const wavPath = inputPath.replace(path.extname(inputPath), '.wav');

  console.log('FFmpeg input:', inputPath);
  console.log('FFmpeg output:', wavPath);

  ffmpeg(inputPath)
    .toFormat('wav')
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      return res.status(500).json({ error: 'Audio conversion failed', details: err.message });
    })
    .on('end', () => {
      console.log('Conversion finished.');
      exec(`python whisper_run.py "${wavPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error('Whisper error:', error);
          console.error('Whisper stderr:', stderr);
          return res.status(500).json({ error: 'Transcription failed', details: error.message });
        }

        const transcript = stdout.trim();
        res.json({ transcript });
      });
    })
    .save(wavPath);
};