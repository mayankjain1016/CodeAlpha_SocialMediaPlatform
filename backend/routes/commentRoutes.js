const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { requireAuth } = require('../middleware/auth');

router.delete('/:id', requireAuth, commentController.deleteComment);

module.exports = router;
