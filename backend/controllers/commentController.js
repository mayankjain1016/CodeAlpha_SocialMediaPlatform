const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { isValidObjectId, sanitizeString } = require('../utils/validators');

const createComment = asyncHandler(async (req, res) => {
  const { id: postId } = req.params;
  let { text } = req.body;
  text = sanitizeString(text);

  if (!isValidObjectId(postId)) {
    throw ApiError.badRequest('Invalid post ID');
  }

  if (!text) {
    throw ApiError.badRequest('Comment text cannot be empty');
  }

  if (text.length > 280) {
    throw ApiError.badRequest('Comment text cannot exceed 280 characters');
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  const comment = await Comment.create({
    post: postId,
    author: req.user._id,
    text,
  });

  // Increment comments count on post
  post.commentsCount = (post.commentsCount || 0) + 1;
  await post.save();

  // Notify post author if not self
  if (post.author.toString() !== req.user._id.toString()) {
    await Notification.create({
      recipient: post.author,
      actor: req.user._id,
      type: 'comment',
      post: post._id,
    });
  }

  const populated = await Comment.findById(comment._id).populate('author', '_id name username avatarHue bannerPreset');

  res.status(201).json({
    message: 'Comment added',
    comment: {
      _id: populated._id,
      post: populated.post,
      text: populated.text,
      createdAt: populated.createdAt,
      author: {
        _id: populated.author._id,
        name: populated.author.name,
        username: populated.author.username,
        avatarHue: populated.author.avatarHue,
        bannerPreset: populated.author.bannerPreset,
      },
      canDelete: true,
    },
  });
});

const getComments = asyncHandler(async (req, res) => {
  const { id: postId } = req.params;

  if (!isValidObjectId(postId)) {
    throw ApiError.badRequest('Invalid post ID');
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw ApiError.notFound('Post not found');
  }

  const currentUserId = req.user ? req.user._id.toString() : null;
  const postAuthorId = post.author.toString();

  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .populate('author', '_id name username avatarHue bannerPreset')
    .lean();

  const formatted = comments.map(c => {
    const isCommentAuthor = currentUserId && c.author._id.toString() === currentUserId;
    const isPostAuthor = currentUserId && postAuthorId === currentUserId;

    return {
      _id: c._id,
      post: c.post,
      text: c.text,
      createdAt: c.createdAt,
      author: {
        _id: c.author._id,
        name: c.author.name,
        username: c.author.username,
        avatarHue: c.author.avatarHue,
        bannerPreset: c.author.bannerPreset,
      },
      canDelete: Boolean(isCommentAuthor || isPostAuthor),
    };
  });

  res.json({ comments: formatted });
});

const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid comment ID');
  }

  const comment = await Comment.findById(id);
  if (!comment) {
    throw ApiError.notFound('Comment not found');
  }

  const post = await Post.findById(comment.post);
  const currentUserId = req.user._id.toString();

  const isCommentAuthor = comment.author.toString() === currentUserId;
  const isPostAuthor = post && post.author.toString() === currentUserId;

  if (!isCommentAuthor && !isPostAuthor) {
    throw ApiError.forbidden('You are not authorized to delete this comment');
  }

  await Comment.findByIdAndDelete(id);

  if (post) {
    post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);
    await post.save();
  }

  res.json({ message: 'Comment deleted successfully' });
});

module.exports = {
  createComment,
  getComments,
  deleteComment,
};
