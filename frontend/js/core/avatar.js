/**
 * Deterministic avatar generator using hue and initials
 */
export const getInitials = (name = '') => {
  if (!name) return 'S';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

export const getAvatarGradient = (hue = 210) => {
  const h1 = Number(hue) || 210;
  const h2 = (h1 + 45) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 75%, 50%) 0%, hsl(${h2}, 85%, 38%) 100%)`;
};

export const renderAvatarHTML = (user = {}, sizeClass = 'avatar-md') => {
  const name = user.name || user.username || 'Sangam';
  const initials = getInitials(name);
  const hue = user.avatarHue !== undefined ? user.avatarHue : 215;
  const bg = getAvatarGradient(hue);

  return `<div class="avatar ${sizeClass}" style="background: ${bg};" aria-label="${name}'s avatar">
    <span>${initials}</span>
  </div>`;
};
