const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const transcribe = async (inputPath) => {
  const wavPath = inputPath.replace(path.extname(inputPath), '.wav');

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav')
      .on('error', (err) => {
        reject(new Error('FFmpeg error: ' + err.message));
      })
      .on('end', () => {
        exec(`python whisper_run.py "${wavPath}"`, (error, stdout, stderr) => {
          if (error) {
            reject(new Error('Whisper error: ' + error.message));
          }
          resolve(stdout.trim());
        });
      })
      .save(wavPath);
  });
};

module.exports = { transcribe };