const express = require('express');
const { createStory, getStories, viewStory } = require('../controllers/storyController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createStory);
router.get('/', optionalAuth, getStories);
router.post('/:id/view', requireAuth, viewStory);

module.exports = router;
