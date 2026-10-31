const TOKEN_KEY = 'sangam_token';
const USER_KEY = 'sangam_user';

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('auth:change', { detail: { isAuthenticated: true, user } }));
};

export const updateCurrentUser = (userUpdates) => {
  const current = getCurrentUser() || {};
  const updated = { ...current, ...userUpdates };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('auth:change', { detail: { isAuthenticated: true, user: updated } }));
  return updated;
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent('auth:change', { detail: { isAuthenticated: false, user: null } }));
};

export const isAuthenticated = () => {
  return Boolean(getToken());
};
