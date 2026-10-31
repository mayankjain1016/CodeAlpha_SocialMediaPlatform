import { icons } from './icons.js';

let container = null;

const ensureContainer = () => {
  if (!container) {
    container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
  }
  return container;
};

export const showToast = (message, type = 'info', duration = 3500) => {
  const root = ensureContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconName = type === 'success' ? 'check' : type === 'error' ? 'x' : 'sparkles';
  const iconSvg = icons[iconName] ? icons[iconName]('nav-icon') : '';

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; font-weight: 500; font-size: 0.9rem;">
      <span style="color: ${type === 'success' ? 'var(--emerald-500)' : type === 'error' ? 'var(--red-500)' : 'var(--primary)'}">${iconSvg}</span>
      <span>${message}</span>
    </div>
    <div class="toast-progress"></div>
  `;

  root.appendChild(toast);

  // Trigger entrance transition
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  const progressBar = toast.querySelector('.toast-progress');
  let startTime = Date.now();
  let remaining = duration;
  let timerId = null;
  let isPaused = false;

  const startTimer = () => {
    startTime = Date.now();
    progressBar.style.transition = `transform ${remaining}ms linear`;
    progressBar.style.transform = 'scaleX(0)';

    timerId = setTimeout(() => {
      dismissToast(toast);
    }, remaining);
  };

  const pauseTimer = () => {
    if (isPaused) return;
    isPaused = true;
    clearTimeout(timerId);
    const elapsed = Date.now() - startTime;
    remaining = Math.max(0, remaining - elapsed);
    progressBar.style.transition = 'none';
    const computedScale = remaining / duration;
    progressBar.style.transform = `scaleX(${computedScale})`;
  };

  const resumeTimer = () => {
    if (!isPaused) return;
    isPaused = false;
    startTimer();
  };

  toast.addEventListener('mouseenter', pauseTimer);
  toast.addEventListener('mouseleave', resumeTimer);

  startTimer();

  return toast;
};

const dismissToast = (toast) => {
  toast.classList.remove('show');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
};
