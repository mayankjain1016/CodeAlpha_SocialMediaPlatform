/**
 * Extracts hashtags (#tag) and mentions (@username) from plain post text
 */
const extractHashtagsAndMentions = (text) => {
  if (!text || typeof text !== 'string') {
    return { hashtags: [], mentions: [] };
  }

  // Hashtag regex: matches #word with letters, numbers, underscores
  const hashtagMatches = text.match(/#([a-zA-Z0-9_]+)/g);
  const hashtags = hashtagMatches
    ? [...new Set(hashtagMatches.map(t => t.slice(1).toLowerCase()))]
    : [];

  // Mention regex: matches @username with 3-20 chars (letters, numbers, underscores)
  const mentionMatches = text.match(/@([a-zA-Z0-9_]{3,20})/g);
  const mentions = mentionMatches
    ? [...new Set(mentionMatches.map(m => m.slice(1).toLowerCase()))]
    : [];

  return { hashtags, mentions };
};

module.exports = {
  extractHashtagsAndMentions,
};
