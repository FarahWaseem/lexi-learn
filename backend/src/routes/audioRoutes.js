const express = require('express');
const router = express.Router();
const upload = require('../utils/multerConfig');
const { handleAudioUpload } = require('../controllers/audioController');

router.post('/:day/answer/:idx', upload.single('audio'), handleAudioUpload);


module.exports = router;