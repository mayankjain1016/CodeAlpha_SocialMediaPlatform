import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { setAuth, isAuthenticated } from '../core/auth.js';
import { showToast } from '../core/toast.js';

if (isAuthenticated()) {
  window.location.href = '/';
}

renderAppShell('login');

const form = document.getElementById('login-form');
const emailInput = document.getElementById('login-email') || document.getElementById('login-identifier');
const passwordInput = document.getElementById('login-password');
const submitBtn = document.getElementById('login-submit-btn');
const demoChip = document.getElementById('demo-fill-chip');

if (demoChip && emailInput && passwordInput) {
  demoChip.addEventListener('click', () => {
    emailInput.value = 'demo@sangam.in';
    passwordInput.value = 'Demo@123';
    showToast('Demo credentials filled!');
  });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const login = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!login || !password) {
      showToast('Please fill in both fields');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
    }

    try {
      const res = await api.post('/auth/login', { login, password });
      setAuth(res.token, res.user);

      showToast(`Welcome back, ${res.user.name}!`);

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/';

      setTimeout(() => {
        window.location.href = redirect;
      }, 400);
    } catch (err) {
      showToast(err.message || 'Invalid username or password');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
      }
    }
  });
}
