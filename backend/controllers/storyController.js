const Story = require('../models/Story');
const User = require('../models/User');
const Media = require('../models/Media');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { isValidObjectId, sanitizeString } = require('../utils/validators');

const createStory = asyncHandler(async (req, res) => {
  let { text, backgroundColor, mediaId } = req.body;
  text = sanitizeString(text);

  if (!text && !mediaId) {
    throw ApiError.badRequest('Story must contain either an image or text');
  }

  let imageUrl = null;
  let mediaRef = null;

  if (mediaId) {
    if (!isValidObjectId(mediaId)) {
      throw ApiError.badRequest('Invalid media ID');
    }
    const media = await Media.findById(mediaId);
    if (!media) {
      throw ApiError.notFound('Media attachment not found');
    }
    mediaRef = media._id;
    imageUrl = `/api/media/${media._id}`;
  }

  const story = await Story.create({
    author: req.user._id,
    text,
    image: imageUrl,
    media: mediaRef,
    backgroundColor: backgroundColor || 'linear-gradient(135deg, #FF007A 0%, #FF5A36 50%, #FFA41B 100%)',
    viewers: [],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await story.populate('author', '_id name username avatarHue bannerPreset');

  res.status(201).json({
    story,
  });
});

const getStories = asyncHandler(async (req, res) => {
  const currentUserId = req.user ? req.user._id : null;
  const currentUserIdStr = currentUserId ? currentUserId.toString() : null;

  const now = new Date();
  const activeStories = await Story.find({ expiresAt: { $gt: now } })
    .sort({ createdAt: 1 })
    .populate('author', '_id name username avatarHue bannerPreset')
    .lean();

  // Group stories by author
  const authorMap = new Map();

  activeStories.forEach(story => {
    if (!story.author) return;
    const authorId = story.author._id.toString();

    const isViewedByMe = currentUserIdStr && Array.isArray(story.viewers)
      ? story.viewers.some(v => (v._id || v).toString() === currentUserIdStr)
      : false;

    const formattedStory = {
      _id: story._id,
      text: story.text,
      image: story.image,
      backgroundColor: story.backgroundColor,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      viewedByMe: Boolean(isViewedByMe),
      viewersCount: story.viewers?.length || 0,
    };

    if (!authorMap.has(authorId)) {
      authorMap.set(authorId, {
        author: {
          _id: story.author._id,
          name: story.author.name,
          username: story.author.username,
          avatarHue: story.author.avatarHue,
          bannerPreset: story.author.bannerPreset,
          isMe: currentUserIdStr === authorId,
        },
        hasUnseen: !isViewedByMe,
        stories: [formattedStory],
        latestStoryTime: story.createdAt,
      });
    } else {
      const group = authorMap.get(authorId);
      group.stories.push(formattedStory);
      group.latestStoryTime = story.createdAt;
      if (!isViewedByMe) {
        group.hasUnseen = true;
      }
    }
  });

  // Sort groups: current user's group first, then groups with unseen stories, then latest
  const groups = Array.from(authorMap.values()).sort((a, b) => {
    if (a.author.isMe) return -1;
    if (b.author.isMe) return 1;
    if (a.hasUnseen && !b.hasUnseen) return -1;
    if (!a.hasUnseen && b.hasUnseen) return 1;
    return new Date(b.latestStoryTime) - new Date(a.latestStoryTime);
  });

  res.json({
    groups,
  });
});

const viewStory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user._id;

  if (!isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid story ID');
  }

  const story = await Story.findById(id);
  if (!story) {
    throw ApiError.notFound('Story not found or expired');
  }

  const alreadyViewed = story.viewers.some(v => v.toString() === currentUserId.toString());
  if (!alreadyViewed) {
    story.viewers.push(currentUserId);
    await story.save();
  }

  res.json({
    viewed: true,
    viewersCount: story.viewers.length,
  });
});

module.exports = {
  createStory,
  getStories,
  viewStory,
};
