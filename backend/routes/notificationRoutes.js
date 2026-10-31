const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, notificationController.getNotifications);
router.get('/unread-count', requireAuth, notificationController.getUnreadCount);
router.post('/read-all', requireAuth, notificationController.markAllRead);

module.exports = router;
