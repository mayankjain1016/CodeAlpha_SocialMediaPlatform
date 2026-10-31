import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { setAuth, isAuthenticated } from '../core/auth.js';
import { showToast } from '../core/toast.js';

if (isAuthenticated()) {
  window.location.href = '/';
}

renderAppShell('register');

const form = document.getElementById('register-form');
const nameInput = document.getElementById('reg-name');
const usernameInput = document.getElementById('reg-username');
const emailInput = document.getElementById('reg-email');
const passwordInput = document.getElementById('reg-password');
const submitBtn = document.getElementById('register-submit-btn') || document.getElementById('reg-submit-btn');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput ? nameInput.value.trim() : '';
    const username = usernameInput ? usernameInput.value.trim().toLowerCase() : '';
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!name || !username || !email || !password) {
      showToast('Please fill out all fields');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';
    }

    try {
      const res = await api.post('/auth/register', {
        name,
        username,
        email,
        password
      });

      setAuth(res.token, res.user);
      showToast(`Welcome to Sangam, ${res.user.name}!`);

      setTimeout(() => {
        window.location.href = '/';
      }, 400);
    } catch (err) {
      showToast(err.message || 'Registration failed');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    }
  });
}
