/**
 * Abstract Generative SVG Avatar System + Neutral Silhouette for Guests
 * Renders cleanly at 24, 32, 40, 56, and 96px without text overflow.
 */

const hashString = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getInitials = (name = '', username = '') => {
  const clean = (name || username || '').trim();
  if (!clean) return 'S';
  const parts = clean.split(/[\s_\-\.]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

/**
 * Neutral Person Silhouette for unauthenticated guests
 */
export const renderGuestAvatarSVG = () => {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="avatar-svg-inner avatar-silhouette" style="width: 58%; height: 58%; color: var(--text-muted); margin: auto;">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  `;
};

/**
 * Generates an organic confluence SVG avatar with centered 2-letter initials
 */
export const generateAbstractAvatarSVG = (username = 'sangam', name = '', avatarHue = 215) => {
  const hash = hashString(username);
  const h1 = Number(avatarHue) || (hash % 360);
  const h2 = (h1 + 45 + (hash % 90)) % 360;

  const palette = [
    `hsl(${h1}, 78%, 42%)`,
    `hsl(${h2}, 88%, 56%)`,
    `hsl(${(h1 + 180) % 360}, 65%, 48%)`,
    '#FFA41B', // Marigold
    '#0E7C86', // River Teal
    '#FF5A5F', // Coral
  ];

  const colorA = palette[hash % palette.length];
  const colorB = palette[(hash + 1) % palette.length];
  const colorC = palette[(hash + 3) % palette.length];

  const initials = getInitials(name, username);
  const id = `av_${Math.abs(hash)}_${h1}`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" class="avatar-svg-inner" role="img" aria-label="${name || username}'s avatar">
      <defs>
        <clipPath id="${id}_clip">
          <circle cx="40" cy="40" r="40"/>
        </clipPath>
        <linearGradient id="${id}_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colorA}"/>
          <stop offset="100%" stop-color="${colorB}"/>
        </linearGradient>
      </defs>

      <g clip-path="url(#${id}_clip)">
        <!-- Base Gradient -->
        <rect width="80" height="80" fill="url(#${id}_bg)"/>

        <!-- Flowing Confluence Ribbons -->
        <circle cx="28" cy="24" r="30" fill="${colorC}" opacity="0.55"/>
        <circle cx="56" cy="56" r="28" fill="${colorB}" opacity="0.65"/>
        <path d="M-10 50 Q 20 20, 50 45 T 90 40 L 90 90 L -10 90 Z" fill="${colorA}" opacity="0.45"/>

        <!-- Centered High-Contrast Initials (Strictly fits 80x80 circle) -->
        <text x="40" y="42" text-anchor="middle" dominant-baseline="central" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="28" fill="#FFFFFF" opacity="0.98" style="text-shadow: 0 1px 4px rgba(0,0,0,0.45); letter-spacing: -0.02em;">
          ${initials}
        </text>
      </g>
    </svg>
  `;
};

/**
 * Render Avatar HTML markup with size modifiers (xs: 24px, sm: 32px, md: 40px, lg: 56px, xl: 96px)
 */
export const renderAvatarHTML = (user = null, sizeClass = 'avatar-md', hasRing = false) => {
  const isGuest = !user || (!user.username && !user.name) || user.isGuest || user === 'guest';

  const ringClass = hasRing ? 'avatar-story-ring' : '';

  if (isGuest) {
    return `
      <div class="avatar ${sizeClass} ${ringClass}" aria-label="Guest avatar">
        <div class="avatar-inner" style="background: var(--bg-surface-2); display: flex; align-items: center; justify-content: center;">
          ${renderGuestAvatarSVG()}
        </div>
      </div>
    `;
  }

  // If user has a real photo avatar
  if (user.avatar) {
    return `
      <div class="avatar ${sizeClass} ${ringClass}" data-user="${user.username || ''}" aria-label="${user.name || user.username}'s avatar">
        <div class="avatar-inner">
          <img src="${user.avatar}" alt="${user.name || user.username}" class="avatar-img" loading="lazy" />
        </div>
      </div>
    `;
  }

  const username = user.username || user.name || 'sangam';
  const name = user.name || '';
  const hue = user.avatarHue !== undefined ? user.avatarHue : hashString(username) % 360;
  const svgMarkup = generateAbstractAvatarSVG(username, name, hue);

  return `
    <div class="avatar ${sizeClass} ${ringClass}" data-user="${username}" aria-label="${name || username}'s avatar">
      <div class="avatar-inner">
        ${svgMarkup}
      </div>
    </div>
  `;
};
