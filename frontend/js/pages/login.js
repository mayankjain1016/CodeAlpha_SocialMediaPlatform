import { api } from '../core/api.js';
import { setAuth, isAuthenticated } from '../core/auth.js';
import { icons } from '../core/icons.js';
import { showToast } from '../core/toast.js';

const form = document.getElementById('login-form');
const identifierInput = document.getElementById('login-identifier');
const passwordInput = document.getElementById('login-password');
const submitBtn = document.getElementById('login-submit-btn');
const toggleBtn = document.getElementById('pw-toggle-btn');
const generalError = document.getElementById('login-general-error');
const quickFillBtn = document.getElementById('quick-fill-btn');

if (isAuthenticated()) {
  window.location.href = '/';
}

let isPasswordVisible = false;
if (toggleBtn) {
  toggleBtn.onclick = () => {
    isPasswordVisible = !isPasswordVisible;
    passwordInput.type = isPasswordVisible ? 'text' : 'password';
    toggleBtn.innerHTML = isPasswordVisible ? icons.eyeOff() : icons.eye();
  };
}

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
  submitBtn.classList.add('loading');
  submitBtn.innerHTML = '<span class="btn-spinner"></span>';

  try {
    const res = await api.post('/auth/login', { login, password });
    setAuth(res.token, res.user);

    // Morph button into checkmark
    submitBtn.classList.remove('loading');
    submitBtn.style.backgroundColor = 'var(--teal-600)';
    submitBtn.innerHTML = `<span>${icons.check()} Signed In</span>`;

    showToast(`Welcome back, ${res.user.name}!`, 'success');

    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect') || '/';

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 450);
  } catch (err) {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Sign In</span>';
    generalError.textContent = err.message || 'Invalid username or password.';
    generalError.style.display = 'block';
  }
};
