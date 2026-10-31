const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Media = require('../models/Media');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { extractHashtagsAndMentions } = require('../utils/hashtags');
const { isValidObjectId, sanitizeString } = require('../utils/validators');

/**
 * Format post document for JSON response with author summary and user-specific flags
 */
const formatPost = (post, currentUserId = null, userBookmarks = new Set()) => {
  const author = post.author || {};
  const currentUserIdStr = currentUserId ? currentUserId.toString() : null;

  const isLiked = currentUserIdStr && post.likes
    ? post.likes.some(id => (id._id || id).toString() === currentUserIdStr)
    : false;

  const isBookmarked = currentUserIdStr
    ? userBookmarks.has(post._id.toString())
    : false;

  return {
    _id: post._id,
    text: post.text,
    image: post.image,
    media: post.media,
    hashtags: post.hashtags || [],
    mentions: post.mentions || [],
    likesCount: post.likesCount !== undefined ? post.likesCount : (post.likes?.length || 0),
    commentsCount: post.commentsCount || 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: {
      _id: author._id,
      name: author.name,
      username: author.username,
      avatarHue: author.avatarHue,
      bannerPreset: author.bannerPreset,
    },
    likedByMe: Boolean(isLiked),
    bookmarkedByMe: Boolean(isBookmarked),
  };
};

/**
 * Helper to fetch user bookmarks as a Set for fast O(1) checks
 */
const getUserBookmarksSet = async (userId) => {
  if (!userId) return new Set();
  const user = await User.findById(userId).select('bookmarks').lean();
  if (!user || !user.bookmarks) return new Set();
  return new Set(user.bookmarks.map(id => id.toString()));
};

const createPost = asyncHandler(async (req, res) => {
  let { text, mediaId } = req.body;
  text = sanitizeString(text);

  if (!text && !mediaId) {
    throw ApiError.badRequest('Post must contain either text or an image');
  }

  if (text.length > 280) {
    throw ApiError.badRequest('Post text cannot exceed 280 characters');
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

  const { hashtags, mentions } = extractHashtagsAndMentions(text);

  const post = await Post.create({
    author: req.user._id,
    text,
    image: imageUrl,
    media: mediaRef,
    hashtags,
    mentions,
    likes: [],
    likesCount: 0,
    commentsCount: 0,
  });

  // Handle mention notifications
  if (mentions.length > 0) {
    const mentionedUsers = await User.find({
      username: { $in: mentions },
      _id: { $ne: req.user._id }, // Never notify yourself
    }).select('_id');

    if (mentionedUsers.length > 0) {
      const notifs = mentionedUsers.map(u => ({
        recipient: u._id,
        actor: req.user._id,
        type: 'mention',
        post: post._id,
      }));
      await Notification.insertMany(notifs);
    }
  }

  const populated = await Post.findById(post._id).populate('author', '_id name username avatarHue bannerPreset');

  res.status(201).json({
    message: 'Post created successfully',
    post: formatPost(populated, req.user._id, new Set()),
  });
});

const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid post ID');
  }

  const post = await Post.findById(id);
  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  if (post.author.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only delete your own posts');
  }

  // Delete associated media if present
  if (post.media) {
    await Media.findByIdAndDelete(post.media);
  }

  // Delete associated comments and notifications
  await Promise.all([
    Post.findByIdAndDelete(id),
    Comment.deleteMany({ post: id }),
    Notification.deleteMany({ post: id }),
    User.updateMany({ bookmarks: id }, { $pull: { bookmarks: id } }),
  ]);

  res.json({ message: 'Post deleted successfully' });
});

const getFeed = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const currentUser = await User.findById(currentUserId).select('following');
  const feedAuthors = [...(currentUser.following || []), currentUserId];

  const limit = Math.min(parseInt(req.query.limit, 10) || 15, 30);
  const cursor = req.query.cursor;

  const query = {
    author: { $in: feedAuthors },
  };

  if (cursor && isValidObjectId(cursor)) {
    const cursorDoc = await Post.findById(cursor).select('createdAt');
    if (cursorDoc) {
      query.createdAt = { $lt: cursorDoc.createdAt };
    }
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate('author', '_id name username avatarHue bannerPreset')
    .lean();

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id.toString() : null;

  const bookmarksSet = await getUserBookmarksSet(currentUserId);
  const formattedItems = items.map(p => formatPost(p, currentUserId, bookmarksSet));

  res.json({
    items: formattedItems,
    nextCursor,
  });
});

const getExplorePosts = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 15, 30);
  const cursor = req.query.cursor;
  const tag = req.query.tag ? sanitizeString(req.query.tag).toLowerCase() : null;

  const query = {};
  if (tag) {
    query.hashtags = tag.replace(/^#/, '');
  }

  if (cursor && isValidObjectId(cursor)) {
    const cursorDoc = await Post.findById(cursor).select('createdAt');
    if (cursorDoc) {
      query.createdAt = { $lt: cursorDoc.createdAt };
    }
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate('author', '_id name username avatarHue bannerPreset')
    .lean();

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id.toString() : null;

  const currentUserId = req.user ? req.user._id : null;
  const bookmarksSet = await getUserBookmarksSet(currentUserId);
  const formattedItems = items.map(p => formatPost(p, currentUserId, bookmarksSet));

  res.json({
    items: formattedItems,
    nextCursor,
  });
});

const getUserPosts = asyncHandler(async (req, res) => {
  const username = sanitizeString(req.params.username).toLowerCase();
  const user = await User.findOne({ username }).select('_id');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 15, 30);
  const cursor = req.query.cursor;
  const mediaOnly = req.query.mediaOnly === 'true';

  const query = { author: user._id };
  if (mediaOnly) {
    query.image = { $ne: null };
  }

  if (cursor && isValidObjectId(cursor)) {
    const cursorDoc = await Post.findById(cursor).select('createdAt');
    if (cursorDoc) {
      query.createdAt = { $lt: cursorDoc.createdAt };
    }
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate('author', '_id name username avatarHue bannerPreset')
    .lean();

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id.toString() : null;

  const currentUserId = req.user ? req.user._id : null;
  const bookmarksSet = await getUserBookmarksSet(currentUserId);
  const formattedItems = items.map(p => formatPost(p, currentUserId, bookmarksSet));

  res.json({
    items: formattedItems,
    nextCursor,
  });
});

const getBookmarks = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const user = await User.findById(currentUserId).select('bookmarks');

  const limit = Math.min(parseInt(req.query.limit, 10) || 15, 30);
  const cursor = req.query.cursor;

  const bookmarkIds = user.bookmarks || [];

  const query = { _id: { $in: bookmarkIds } };

  if (cursor && isValidObjectId(cursor)) {
    const cursorDoc = await Post.findById(cursor).select('createdAt');
    if (cursorDoc) {
      query.createdAt = { $lt: cursorDoc.createdAt };
    }
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate('author', '_id name username avatarHue bannerPreset')
    .lean();

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id.toString() : null;

  const bookmarksSet = new Set(bookmarkIds.map(id => id.toString()));
  const formattedItems = items.map(p => formatPost(p, currentUserId, bookmarksSet));

  res.json({
    items: formattedItems,
    nextCursor,
  });
});

const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid post ID');
  }

  const post = await Post.findById(id).populate('author', '_id name username avatarHue bannerPreset');
  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  const currentUserId = req.user ? req.user._id : null;
  const bookmarksSet = await getUserBookmarksSet(currentUserId);

  res.json({
    post: formatPost(post, currentUserId, bookmarksSet),
  });
});

const toggleLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user._id;

  if (!isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid post ID');
  }

  const post = await Post.findById(id);
  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  const isLiked = post.likes.some(uId => uId.toString() === currentUserId.toString());

  if (isLiked) {
    // Unlike
    post.likes = post.likes.filter(uId => uId.toString() !== currentUserId.toString());
    post.likesCount = Math.max(0, post.likes.length);
    await post.save();

    return res.json({
      liked: false,
      likesCount: post.likesCount,
    });
  } else {
    // Like
    post.likes.push(currentUserId);
    post.likesCount = post.likes.length;
    await post.save();

    // Create notification if not author
    if (post.author.toString() !== currentUserId.toString()) {
      await Notification.create({
        recipient: post.author,
        actor: currentUserId,
        type: 'like',
        post: post._id,
      });
    }

    return res.json({
      liked: true,
      likesCount: post.likesCount,
    });
  }
});

const toggleBookmark = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user._id;

  if (!isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid post ID');
  }

  const post = await Post.findById(id);
  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  const user = await User.findById(currentUserId);
  const isBookmarked = user.bookmarks.some(bId => bId.toString() === id);

  if (isBookmarked) {
    // Unbookmark
    user.bookmarks = user.bookmarks.filter(bId => bId.toString() !== id);
    await user.save();
    return res.json({ bookmarked: false });
  } else {
    // Bookmark
    user.bookmarks.push(id);
    await user.save();
    return res.json({ bookmarked: true });
  }
});

module.exports = {
  createPost,
  deletePost,
  getFeed,
  getExplorePosts,
  getUserPosts,
  getBookmarks,
  getPostById,
  toggleLike,
  toggleBookmark,
  formatPost,
};
