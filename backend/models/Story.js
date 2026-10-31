const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      maxlength: [200, 'Story text cannot exceed 200 characters'],
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    media: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      default: null,
    },
    backgroundColor: {
      type: String,
      default: 'linear-gradient(135deg, #FF007A 0%, #FF5A36 50%, #FFA41B 100%)',
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expires: '1s' },
    },
  },
  {
    timestamps: true,
  }
);

storySchema.index({ createdAt: -1 });
storySchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
