const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiters');

// Feed, Explore, Bookmarks (must be defined before /:id)
router.get('/feed', requireAuth, postController.getFeed);
router.get('/explore', optionalAuth, postController.getExplorePosts);
router.get('/bookmarks', requireAuth, postController.getBookmarks);
router.get('/user/:username', optionalAuth, postController.getUserPosts);

// Create post
router.post('/', requireAuth, writeLimiter, postController.createPost);

// Single post operations
router.get('/:id', optionalAuth, postController.getPostById);
router.delete('/:id', requireAuth, postController.deletePost);
router.post('/:id/like', requireAuth, writeLimiter, postController.toggleLike);
router.post('/:id/bookmark', requireAuth, writeLimiter, postController.toggleBookmark);

// Comments nested under post
router.post('/:id/comments', requireAuth, writeLimiter, commentController.createComment);
router.get('/:id/comments', optionalAuth, commentController.getComments);

module.exports = router;
