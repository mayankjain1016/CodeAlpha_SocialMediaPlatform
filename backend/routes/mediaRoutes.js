const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { requireAuth } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiters');

// Larger JSON body limit (2MB) specifically for media dataUrl upload
const jsonMediaParser = express.json({ limit: '2mb' });

router.post('/', requireAuth, writeLimiter, jsonMediaParser, mediaController.uploadMedia);
router.get('/:id', mediaController.getMedia);

module.exports = router;
