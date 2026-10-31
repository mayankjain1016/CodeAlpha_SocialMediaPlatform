import { api } from '../core/api.js';
import { setAuth, isAuthenticated } from '../core/auth.js';
import { icons } from '../core/icons.js';
import { showToast } from '../core/toast.js';

const form = document.getElementById('login-form');
const identifierInput = document.getElementById('login-identifier');
const passwordInput = document.getElementById('login-password');
const submitBtn = document.getElementById('login-submit-btn');
const toggleBtn = document.getElementById('pw-toggle-btn');
const eyeIcon = document.getElementById('pw-eye-icon');
const generalError = document.getElementById('login-general-error');
const quickFillBtn = document.getElementById('quick-fill-btn');

// If already authenticated, redirect to home
if (isAuthenticated()) {
  window.location.href = '/';
}

// Password toggle
let isPasswordVisible = false;
toggleBtn.onclick = () => {
  isPasswordVisible = !isPasswordVisible;
  passwordInput.type = isPasswordVisible ? 'text' : 'password';
  toggleBtn.innerHTML = isPasswordVisible ? icons.eyeOff() : icons.eye();
};

// Quick fill demo credentials
if (quickFillBtn) {
  quickFillBtn.onclick = () => {
    identifierInput.value = 'demo@sangam.in';
    passwordInput.value = 'Demo@123';
  };
}

form.onsubmit = async (e) => {
  e.preventDefault();
  generalError.style.display = 'none';
  generalError.textContent = '';

  const login = identifierInput.value.trim();
  const password = passwordInput.value;

  if (!login || !password) {
    generalError.textContent = 'Please fill in both fields.';
    generalError.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-spinner"></span>';

  try {
    const res = await api.post('/auth/login', { login, password });
    setAuth(res.token, res.user);

    showToast(`Welcome back, ${res.user.name}!`, 'success');

    // Handle redirect parameter
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect') || '/';

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 400);
  } catch (err) {
    generalError.textContent = err.message || 'Invalid username or password.';
    generalError.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
};
