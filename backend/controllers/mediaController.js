const Media = require('../models/Media');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { isValidObjectId } = require('../utils/validators');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 400 * 1024; // 400 KB

const uploadMedia = asyncHandler(async (req, res) => {
  const { dataUrl } = req.body;

  if (!dataUrl || typeof dataUrl !== 'string') {
    throw ApiError.badRequest('Please provide a valid image data URL');
  }

  // Regex to parse data URL
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw ApiError.badRequest('Invalid data URL format. Expected data:image/...;base64,...');
  }

  const mimeType = matches[1].toLowerCase();
  const base64Data = matches[2];

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw ApiError.badRequest('Only JPEG, PNG, and WebP images are allowed');
  }

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > MAX_BYTES) {
    throw ApiError.badRequest(`Image exceeds maximum allowed size of 400 KB (actual: ${Math.round(buffer.length / 1024)} KB)`);
  }

  const media = await Media.create({
    data: buffer,
    mimeType,
    size: buffer.length,
    uploader: req.user._id,
  });

  res.status(201).json({
    id: media._id,
    url: `/api/media/${media._id}`,
  });
});

const getMedia = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid media ID');
  }

  const media = await Media.findById(id);
  if (!media) {
    throw ApiError.notFound('Media not found');
  }

  res.set('Content-Type', media.mimeType);
  res.set('Content-Length', media.data.length);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(media.data);
});

module.exports = {
  uploadMedia,
  getMedia,
};
