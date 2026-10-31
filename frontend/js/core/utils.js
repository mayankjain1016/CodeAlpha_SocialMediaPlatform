/**
 * Escape HTML to prevent XSS injection
 */
export const escapeHTML = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Linkify hashtags and mentions inside user-generated text
 * IMPORTANT: MUST call escapeHTML first to prevent XSS
 */
export const linkify = (text) => {
  const safeText = escapeHTML(text);

  // Linkify hashtags: #tag -> /explore?tag=tag
  const withHashtags = safeText.replace(
    /#([a-zA-Z0-9_]+)/g,
    '<a href="/explore?tag=$1" class="tag-pill" onclick="event.stopPropagation()">#$1</a>'
  );

  // Linkify mentions: @username -> /u/username
  const withMentions = withHashtags.replace(
    /@([a-zA-Z0-9_]{3,20})/g,
    '<a href="/u/$1" class="mention-pill" onclick="event.stopPropagation()">@$1</a>'
  );

  return withMentions;

};

/**
 * Short relative time format (e.g. 'Just now', '5m', '3h', '2d', '12 Oct')
 */
export const timeAgo = (dateInput) => {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Full formatted date string for title tooltip
 */
export const formatFullDate = (dateInput) => {
  const date = new Date(dateInput);
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

/**
 * Number formatting (1.2K, 45K, 1.1M)
 */
export const formatCount = (count) => {
  if (!count || count <= 0) return '';
  if (count < 1000) return String(count);
  if (count < 1000000) return `${(count / 1000).toFixed(count < 10000 ? 1 : 0)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

/**
 * Debounce helper
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};
