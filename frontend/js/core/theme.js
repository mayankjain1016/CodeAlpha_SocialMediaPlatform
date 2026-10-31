const THEME_KEY = 'sangam_theme';

export const getStoredTheme = () => {
  return localStorage.getItem(THEME_KEY);
};

export const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const getCurrentTheme = () => {
  return document.documentElement.getAttribute('data-theme') || getStoredTheme() || getSystemTheme();
};

export const setTheme = (theme, animate = true) => {
  if (animate) {
    document.documentElement.classList.add('theme-transition');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  }

  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  window.dispatchEvent(new CustomEvent('theme:change', { detail: { theme } }));
};

export const toggleTheme = () => {
  const current = getCurrentTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next, true);
  return next;
};

// Initialize system listener if no manual theme stored
if (!getStoredTheme()) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!getStoredTheme()) {
      setTheme(e.matches ? 'dark' : 'light', true);
    }
  });
}
