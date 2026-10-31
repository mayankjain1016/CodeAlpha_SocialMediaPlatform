const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');

const getTrending = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Aggregate hashtags from posts in the last 7 days
  let trending = await Post.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo }, 'hashtags.0': { $exists: true } } },
    { $unwind: '$hashtags' },
    { $group: { _id: '$hashtags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
    { $project: { _id: 0, tag: '$_id', count: 1 } },
  ]);

  // If fewer than 4 trending tags in 7 days, fallback to all-time top hashtags
  if (trending.length < 4) {
    const allTime = await Post.aggregate([
      { $match: { 'hashtags.0': { $exists: true } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $project: { _id: 0, tag: '$_id', count: 1 } },
    ]);
    trending = allTime;
  }

  res.json({ trending });
});

module.exports = {
  getTrending,
};
