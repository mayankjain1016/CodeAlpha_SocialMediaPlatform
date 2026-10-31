const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const notifications = await Notification.find({ recipient: currentUserId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('actor', '_id name username avatarHue')
    .populate('post', '_id text image')
    .lean();

  const formatted = notifications.map(n => ({
    _id: n._id,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt,
    actor: n.actor ? {
      _id: n.actor._id,
      name: n.actor.name,
      username: n.actor.username,
      avatarHue: n.actor.avatarHue,
    } : null,
    post: n.post ? {
      _id: n.post._id,
      text: n.post.text,
      image: n.post.image,
    } : null,
  }));

  res.json({ notifications: formatted });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });

  res.json({ count });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { $set: { read: true } }
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAllRead,
};
