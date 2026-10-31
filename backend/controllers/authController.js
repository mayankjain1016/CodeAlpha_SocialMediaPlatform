const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { USERNAME_REGEX, EMAIL_REGEX, sanitizeString } = require('../utils/validators');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const sanitizeUser = (user) => {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarHue: user.avatarHue,
    bannerPreset: user.bannerPreset,
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
    createdAt: user.createdAt,
  };
};

const register = asyncHandler(async (req, res) => {
  let { name, username, email, password } = req.body;

  name = sanitizeString(name);
  username = sanitizeString(username).toLowerCase();
  email = sanitizeString(email).toLowerCase();

  if (!name || !username || !email || !password) {
    throw ApiError.badRequest('All fields (name, username, email, password) are required');
  }

  if (name.length > 50) {
    throw ApiError.badRequest('Name must not exceed 50 characters');
  }

  if (!USERNAME_REGEX.test(username)) {
    throw ApiError.badRequest('Username must be 3-20 characters and contain only letters, numbers, and underscores');
  }

  if (!EMAIL_REGEX.test(email)) {
    throw ApiError.badRequest('Please provide a valid email address');
  }

  if (password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters long');
  }

  // Check unique username & email
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    if (existingUser.username === username) {
      throw ApiError.conflict('Username is already taken');
    }
    throw ApiError.conflict('Email is already registered');
  }

  const avatarHue = Math.floor(Math.random() * 361);
  const bannerPreset = Math.floor(Math.random() * 8);

  const user = await User.create({
    name,
    username,
    email,
    password,
    avatarHue,
    bannerPreset,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: sanitizeUser(user),
  });
});

const login = asyncHandler(async (req, res) => {
  let { login, password } = req.body;
  login = sanitizeString(login).toLowerCase();

  if (!login || !password) {
    throw ApiError.badRequest('Please provide your username/email and password');
  }

  // Search by either username or email
  const user = await User.findOne({
    $or: [{ username: login }, { email: login }],
  }).select('+password');

  // Generic login error message for security
  if (!user) {
    throw ApiError.unauthorized('Invalid username/email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid username/email or password');
  }

  const token = generateToken(user._id);

  res.json({
    message: 'Login successful',
    token,
    user: sanitizeUser(user),
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.json({
    user: sanitizeUser(user),
  });
});

module.exports = {
  register,
  login,
  getMe,
  sanitizeUser,
};
