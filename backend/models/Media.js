const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    data: {
      type: Buffer,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/webp'],
    },
    size: {
      type: Number,
      required: true,
      max: [400 * 1024, 'Media size cannot exceed 400 KB'],
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Media', mediaSchema);
