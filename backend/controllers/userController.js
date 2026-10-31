const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { isValidObjectId, escapeRegex, sanitizeString } = require('../utils/validators');
const { sanitizeUser } = require('./authController');

const getProfile = asyncHandler(async (req, res) => {
  const username = sanitizeString(req.params.username).toLowerCase();

  const user = await User.findOne({ username })
    .select('_id name username bio avatarHue bannerPreset followers following createdAt');

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const postsCount = await Post.countDocuments({ author: user._id });

  const currentUserId = req.user ? req.user._id.toString() : null;
  const isMe = currentUserId === user._id.toString();
  const isFollowing = currentUserId
    ? user.followers.some(id => id.toString() === currentUserId)
    : false;

  res.json({
    user: {
      _id: user._id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      avatarHue: user.avatarHue,
      bannerPreset: user.bannerPreset,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      postsCount,
      createdAt: user.createdAt,
      isMe,
      isFollowing,
    },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  let { name, bio, bannerPreset } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (name !== undefined) {
    name = sanitizeString(name);
    if (!name || name.length > 50) {
      throw ApiError.badRequest('Name is required and must not exceed 50 characters');
    }
    user.name = name;
  }

  if (bio !== undefined) {
    bio = sanitizeString(bio);
    if (bio.length > 160) {
      throw ApiError.badRequest('Bio must not exceed 160 characters');
    }
    user.bio = bio;
  }

  if (bannerPreset !== undefined) {
    const preset = parseInt(bannerPreset, 10);
    if (isNaN(preset) || preset < 0 || preset > 7) {
      throw ApiError.badRequest('Banner preset must be a number between 0 and 7');
    }
    user.bannerPreset = preset;
  }

  await user.save();

  res.json({
    message: 'Profile updated successfully',
    user: sanitizeUser(user),
  });
});

const toggleFollow = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const currentUserId = req.user._id;

  if (!isValidObjectId(targetId)) {
    throw ApiError.badRequest('Invalid target user ID');
  }

  if (targetId === currentUserId.toString()) {
    throw ApiError.badRequest('You cannot follow yourself');
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    throw ApiError.notFound('User not found');
  }

  const currentUser = await User.findById(currentUserId);
  const isFollowing = currentUser.following.some(id => id.toString() === targetId);

  if (isFollowing) {
    // Unfollow
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId.toString());
    await Promise.all([currentUser.save(), targetUser.save()]);

    return res.json({
      following: false,
      followersCount: targetUser.followers.length,
    });
  } else {
    // Follow
    currentUser.following.push(targetId);
    targetUser.followers.push(currentUserId);
    await Promise.all([currentUser.save(), targetUser.save()]);

    // Create notification (actor = currentUser, recipient = targetUser, type = follow)
    // Never notify yourself
    await Notification.create({
      recipient: targetUser._id,
      actor: currentUser._id,
      type: 'follow',
    });

    return res.json({
      following: true,
      followersCount: targetUser.followers.length,
    });
  }
});

const getFollowers = asyncHandler(async (req, res) => {
  const username = sanitizeString(req.params.username).toLowerCase();
  const user = await User.findOne({ username }).populate({
    path: 'followers',
    select: '_id name username bio avatarHue bannerPreset followers following',
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const currentUserId = req.user ? req.user._id.toString() : null;

  const followers = user.followers.map(f => ({
    _id: f._id,
    name: f.name,
    username: f.username,
    bio: f.bio,
    avatarHue: f.avatarHue,
    bannerPreset: f.bannerPreset,
    followersCount: f.followers?.length || 0,
    followingCount: f.following?.length || 0,
    isFollowing: currentUserId ? f.followers?.some(id => id.toString() === currentUserId) : false,
    isMe: currentUserId === f._id.toString(),
  }));

  res.json({ users: followers });
});

const getFollowing = asyncHandler(async (req, res) => {
  const username = sanitizeString(req.params.username).toLowerCase();
  const user = await User.findOne({ username }).populate({
    path: 'following',
    select: '_id name username bio avatarHue bannerPreset followers following',
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const currentUserId = req.user ? req.user._id.toString() : null;

  const following = user.following.map(f => ({
    _id: f._id,
    name: f.name,
    username: f.username,
    bio: f.bio,
    avatarHue: f.avatarHue,
    bannerPreset: f.bannerPreset,
    followersCount: f.followers?.length || 0,
    followingCount: f.following?.length || 0,
    isFollowing: currentUserId ? f.followers?.some(id => id.toString() === currentUserId) : false,
    isMe: currentUserId === f._id.toString(),
  }));

  res.json({ users: following });
});

const searchUsers = asyncHandler(async (req, res) => {
  const query = sanitizeString(req.query.q);
  if (!query) {
    return res.json({ users: [] });
  }

  const safeQuery = escapeRegex(query);
  const regex = new RegExp(safeQuery, 'i');

  const users = await User.find({
    $or: [{ username: regex }, { name: regex }],
  })
    .select('_id name username bio avatarHue bannerPreset followers following')
    .limit(8)
    .lean();

  const currentUserId = req.user ? req.user._id.toString() : null;

  const formatted = users.map(u => ({
    _id: u._id,
    name: u.name,
    username: u.username,
    bio: u.bio,
    avatarHue: u.avatarHue,
    bannerPreset: u.bannerPreset,
    followersCount: u.followers?.length || 0,
    followingCount: u.following?.length || 0,
    isFollowing: currentUserId ? u.followers?.some(id => id.toString() === currentUserId) : false,
    isMe: currentUserId === u._id.toString(),
  }));

  res.json({ users: formatted });
});

const getSuggestions = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const currentUser = await User.findById(currentUserId).select('following');

  // People I do not follow and not myself
  const excludedIds = [...currentUser.following, currentUserId];

  // Find users not in excludedIds, sorted by follower count descending
  const candidates = await User.find({
    _id: { $nin: excludedIds },
  })
    .select('_id name username bio avatarHue bannerPreset followers following')
    .sort({ 'followers.length': -1 })
    .limit(10)
    .lean();

  // Sort by mutual follows if available, or take top 5
  const formatted = candidates.slice(0, 5).map(u => ({
    _id: u._id,
    name: u.name,
    username: u.username,
    bio: u.bio,
    avatarHue: u.avatarHue,
    bannerPreset: u.bannerPreset,
    followersCount: u.followers?.length || 0,
    followingCount: u.following?.length || 0,
    isFollowing: false,
    isMe: false,
  }));

  res.json({ users: formatted });
});

module.exports = {
  getProfile,
  updateProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
  searchUsers,
  getSuggestions,
};
