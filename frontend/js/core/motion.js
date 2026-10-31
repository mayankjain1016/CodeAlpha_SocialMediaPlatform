/**
 * Motion & Interaction System
 * "Where rivers meet" &mdash; 60fps spring transitions, particles, spotlights, 3D tilt
 */

export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Cursor-following soft spotlight highlight for cards (desktop only)
 */
export const initCardSpotlights = () => {
  if (prefersReducedMotion() || window.innerWidth < 860) return;

  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.spotlight-card, .post-card');
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }, { passive: true });
};

/**
 * 3D perspective pointer tilt for special cards (e.g., Profile Header)
 */
export const initCardTilt = (element) => {
  if (!element || prefersReducedMotion() || window.innerWidth < 1024) return;

  element.style.transformStyle = 'preserve-3d';
  element.style.transition = 'transform 0.15s ease-out';

  const onPointerMove = (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    element.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.008, 1.008, 1.008)`;
  };

  const onPointerLeave = () => {
    element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  element.addEventListener('pointermove', onPointerMove, { passive: true });
  element.addEventListener('pointerleave', onPointerLeave, { passive: true });
};

/**
 * Double-click / double-tap heart burst
 */
export const triggerDoubleTapHeart = (containerElement, onLiked = null) => {
  if (prefersReducedMotion()) {
    if (typeof onLiked === 'function') onLiked();
    return;
  }

  const heart = document.createElement('div');
  heart.className = 'double-click-heart';
  heart.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
  containerElement.appendChild(heart);

  if (typeof onLiked === 'function') onLiked();

  setTimeout(() => {
    heart.remove();
  }, 850);
};

/**
 * Like button spring + particle burst
 */
export const playLikeAnimation = (btnElement, isLiked) => {
  if (prefersReducedMotion()) return;

  const icon = btnElement.querySelector('svg');
  if (!icon) return;

  if (isLiked) {
    icon.style.animation = 'heartSpring 0.4s var(--ease-spring)';
    icon.addEventListener('animationend', () => {
      icon.style.animation = '';
    }, { once: true });

    // Spawn 8 particle dots around heart
    const container = document.createElement('div');
    container.className = 'like-particle-container';
    btnElement.appendChild(container);

    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i * (360 / particleCount)) * (Math.PI / 180);
      const distance = 20 + Math.random() * 8;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      const p = document.createElement('div');
      p.className = 'like-particle';
      p.style.setProperty('--tx', `${tx}px`);
      p.style.setProperty('--ty', `${ty}px`);
      container.appendChild(p);
    }

    setTimeout(() => {
      container.remove();
    }, 550);
  }
};

/**
 * Bookmark bounce
 */
export const playBookmarkAnimation = (btnElement, isBookmarked) => {
  if (prefersReducedMotion()) return;

  const icon = btnElement.querySelector('svg');
  if (!icon) return;

  if (isBookmarked) {
    icon.style.animation = 'bookmarkBounce 0.38s var(--ease-spring)';
    icon.addEventListener('animationend', () => {
      icon.style.animation = '';
    }, { once: true });
  }
};

/**
 * Roll numeric counter
 */
export const rollCount = (countEl, newCount) => {
  if (!countEl) return;
  if (prefersReducedMotion()) {
    countEl.textContent = newCount > 0 ? String(newCount) : '';
    return;
  }

  countEl.classList.add('changing');
  setTimeout(() => {
    countEl.textContent = newCount > 0 ? String(newCount) : '';
    countEl.classList.remove('changing');
  }, 110);
};

/**
 * Smooth Count-Up effect for profile stats and landing page metrics
 */
export const countUp = (element, targetValue, duration = 900) => {
  if (!element) return;
  const target = Number(targetValue) || 0;
  if (prefersReducedMotion() || target === 0) {
    element.textContent = target.toLocaleString();
    return;
  }

  const startTime = performance.now();
  const step = (currentTime) => {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = target.toLocaleString();
    }
  };

  requestAnimationFrame(step);
};

/**
 * Staggered fade & rise for lists of cards
 */
export const staggerEntrance = (container, selector = '.post-card') => {
  if (prefersReducedMotion()) return;

  const items = container.querySelectorAll(selector);
  items.forEach((item, index) => {
    const delay = Math.min(index * 40, 320);
    item.style.animationDelay = `${delay}ms`;
    item.classList.add('animate-rise');
  });
};

/**
 * Watch scroll position to shrink and elevate the floating pill navbar
 */
export const initNavbarScrollWatcher = () => {
  const navbar = document.querySelector('.top-navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
};
