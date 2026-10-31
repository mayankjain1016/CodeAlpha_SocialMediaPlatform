/**
 * Deterministic Abstract Generative SVG Avatar System
 * "Where rivers meet" &mdash; Organic confluence ribbons, fluid waves, and brand gradients
 * Completely self-contained: No external image requests.
 */

// Simple deterministic hash function from string
const hashString = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getInitials = (name = '') => {
  if (!name) return 'S';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

/**
 * Generates an organic confluence SVG avatar
 */
export const generateAbstractAvatarSVG = (username = 'sangam', avatarHue = 215, size = 64) => {
  const hash = hashString(username);
  const h1 = Number(avatarHue) || (hash % 360);
  const h2 = (h1 + 45 + (hash % 90)) % 360;

  // Curated color harmonies blending teal, marigold, coral and warm earth tones
  const palette = [
    `hsl(${h1}, 78%, 42%)`,
    `hsl(${h2}, 88%, 56%)`,
    `hsl(${(h1 + 180) % 360}, 65%, 48%)`,
    `#FFA41B`, // Marigold
    `#0E7C86`, // River Teal
    `#FF5A5F`, // Coral
  ];

  const colorA = palette[hash % palette.length];
  const colorB = palette[(hash + 1) % palette.length];
  const colorC = palette[(hash + 3) % palette.length];

  // Dynamic geometric curve points based on hash
  const r1 = 28 + (hash % 16);
  const r2 = 22 + ((hash >> 2) % 14);
  const cx1 = 20 + ((hash >> 4) % 40);
  const cy1 = 20 + ((hash >> 6) % 40);
  const cx2 = 60 - ((hash >> 8) % 35);
  const cy2 = 60 - ((hash >> 10) % 35);

  const initials = getInitials(username);
  const id = `av_${Math.abs(hash)}_${h1}`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="${size}" height="${size}" class="avatar-svg-inner" role="img" aria-label="${username}'s avatar">
      <defs>
        <clipPath id="${id}_clip">
          <circle cx="40" cy="40" r="40"/>
        </clipPath>
        <linearGradient id="${id}_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colorA}"/>
          <stop offset="100%" stop-color="${colorB}"/>
        </linearGradient>
        <radialGradient id="${id}_glow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <g clip-path="url(#${id}_clip)">
        <!-- Base Gradient Canvas -->
        <rect width="80" height="80" fill="url(#${id}_bg)"/>

        <!-- Flowing River Confluence Ribbons & Waves -->
        <circle cx="${cx1}" cy="${cy1}" r="${r1}" fill="${colorC}" opacity="0.65" style="mix-blend-mode: overlay;"/>
        <circle cx="${cx2}" cy="${cy2}" r="${r2}" fill="${colorB}" opacity="0.75" style="mix-blend-mode: color-dodge;"/>
        
        <path d="M-10 40 Q 20 ${10 + (hash % 30)}, 50 40 T 90 ${50 + (hash % 20)} L 90 90 L -10 90 Z" fill="${colorA}" opacity="0.55"/>
        <path d="M-10 60 C 20 ${70 - (hash % 20)}, 60 ${20 + (hash % 30)}, 90 60 L 90 90 L -10 90 Z" fill="#FFA41B" opacity="0.35"/>

        <!-- Soft top-light glow -->
        <circle cx="40" cy="40" r="40" fill="url(#${id}_glow)"/>

        <!-- Contrast Initials Badge Overlay -->
        <text x="40" y="47" text-anchor="middle" font-family="'Bricolage Grotesque', sans-serif" font-weight="800" font-size="24" fill="#FFFFFF" opacity="0.95" style="text-shadow: 0 2px 8px rgba(20,17,15,0.45); letter-spacing: -0.04em;">
          ${initials}
        </text>
      </g>
    </svg>
  `;
};

/**
 * Render Avatar HTML markup with optional story gradient ring
 */
export const renderAvatarHTML = (user = {}, sizeClass = 'avatar-md', hasRing = false) => {
  const username = user.username || user.name || 'sangam';
  const hue = user.avatarHue !== undefined ? user.avatarHue : hashString(username) % 360;

  const svgMarkup = generateAbstractAvatarSVG(username, hue);

  const ringClass = hasRing ? 'avatar-story-ring' : '';

  return `
    <div class="avatar ${sizeClass} ${ringClass}" data-user="${username}" aria-label="${user.name || username}'s avatar">
      <div class="avatar-inner">
        ${svgMarkup}
      </div>
    </div>
  `;
};
