/**
 * Motion utilities and interactive animations
 */

const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Ripple effect on button click
 */
export const initButtonRipples = () => {
  if (prefersReducedMotion()) return;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-primary, .btn-compose');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    btn.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
};

/**
 * Like heart spring and 6-8 particles burst
 */
export const playLikeAnimation = (btnElement, isLiked) => {
  if (prefersReducedMotion()) return;

  const icon = btnElement.querySelector('.action-icon');
  if (!icon) return;

  if (isLiked) {
    icon.style.animation = 'heartSpring 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
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
      const distance = 22 + Math.random() * 8;
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
    }, 500);
  } else {
    icon.style.transform = 'scale(0.85)';
    setTimeout(() => {
      icon.style.transform = '';
    }, 150);
  }
};

/**
 * Bookmark bounce animation
 */
export const playBookmarkAnimation = (btnElement, isBookmarked) => {
  if (prefersReducedMotion()) return;

  const icon = btnElement.querySelector('.action-icon');
  if (!icon) return;

  if (isBookmarked) {
    icon.style.animation = 'bookmarkBounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
    icon.addEventListener('animationend', () => {
      icon.style.animation = '';
    }, { once: true });
  }
};

/**
 * Animate numeric counter rolling up
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
  }, 120);
};

/**
 * Smooth Count-Up effect for profile stats counters
 */
export const countUp = (element, targetValue, duration = 800) => {
  if (!element) return;
  const target = Number(targetValue) || 0;
  if (prefersReducedMotion() || target === 0) {
    element.textContent = target.toLocaleString();
    return;
  }

  const startTime = performance.now();
  const step = (currentTime) => {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    // Ease out cubic
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
    const delay = Math.min(index * 35, 300);
    item.style.animationDelay = `${delay}ms`;
    item.classList.add('animate-rise');
  });
};

/**
 * Scroll listener for sticky header elevation & blur hairline border
 */
export const initHeaderScrollWatcher = () => {
  const header = document.querySelector('.sticky-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 15) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
};
