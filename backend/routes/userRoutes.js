const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiters');

// Search & Suggestions
router.get('/search', optionalAuth, userController.searchUsers);
router.get('/suggestions', requireAuth, userController.getSuggestions);

// Current user profile update
router.put('/me', requireAuth, writeLimiter, userController.updateProfile);

// Follow / Unfollow
router.post('/:id/follow', requireAuth, writeLimiter, userController.toggleFollow);

// Followers & Following lists
router.get('/:username/followers', optionalAuth, userController.getFollowers);
router.get('/:username/following', optionalAuth, userController.getFollowing);

// User profile by username
router.get('/:username', optionalAuth, userController.getProfile);

module.exports = router;
