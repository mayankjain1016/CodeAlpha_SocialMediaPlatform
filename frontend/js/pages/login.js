import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { setAuth, isAuthenticated } from '../core/auth.js';
import { showToast } from '../core/toast.js';
import { icons } from '../core/icons.js';

// Redirect if already authenticated
if (isAuthenticated()) {
  window.location.href = '/';
}

// Render minimal auth topbar
renderAppShell('login');

// Form elements
const form = document.getElementById('login-form');
const emailInput = document.getElementById('login-email') || document.getElementById('login-identifier');
const passwordInput = document.getElementById('login-password');
const submitBtn = document.getElementById('login-submit-btn');
const pwToggleBtn = document.getElementById('login-password-toggle');

const emailError = document.getElementById('login-email-error');
const passwordError = document.getElementById('login-password-error');
const formError = document.getElementById('login-form-error');

// Show field error
const showError = (field, message) => {
  if (field === 'email' && emailInput && emailError) {
    emailInput.classList.add('is-invalid');
    emailError.textContent = message;
    emailError.style.display = 'flex';
  } else if (field === 'password' && passwordInput && passwordError) {
    passwordInput.classList.add('is-invalid');
    passwordError.textContent = message;
    passwordError.style.display = 'flex';
  } else if (formError) {
    formError.textContent = message;
    formError.style.display = 'flex';
  }
};

// Clear all errors
const clearErrors = () => {
  if (emailInput) emailInput.classList.remove('is-invalid');
  if (passwordInput) passwordInput.classList.remove('is-invalid');
  if (emailError) {
    emailError.style.display = 'none';
    emailError.textContent = '';
  }
  if (passwordError) {
    passwordError.style.display = 'none';
    passwordError.textContent = '';
  }
  if (formError) {
    formError.style.display = 'none';
    formError.textContent = '';
  }
};

// Clear error on input
if (emailInput) {
  emailInput.addEventListener('input', () => {
    emailInput.classList.remove('is-invalid');
    if (emailError) emailError.style.display = 'none';
    if (formError) formError.style.display = 'none';
  });
}

if (passwordInput) {
  passwordInput.addEventListener('input', () => {
    passwordInput.classList.remove('is-invalid');
    if (passwordError) passwordError.style.display = 'none';
    if (formError) formError.style.display = 'none';
  });
}

// Show/Hide password toggle
if (pwToggleBtn && passwordInput) {
  pwToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPass = passwordInput.type === 'password';
    passwordInput.type = isPass ? 'text' : 'password';
    pwToggleBtn.innerHTML = isPass ? icons.eyeOff() : icons.eye();
    pwToggleBtn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
    pwToggleBtn.setAttribute('title', isPass ? 'Hide password' : 'Show password');
  });
}

// Perform login request
const performLogin = async (login, password) => {
  clearErrors();

  let hasError = false;
  if (!login) {
    showError('email', 'Please enter your email or username');
    hasError = true;
  }
  if (!password) {
    showError('password', 'Please enter your password');
    hasError = true;
  }
  if (hasError) return;

  // Button spinner
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    submitBtn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span>Logging in...</span>`;
  }

  try {
    const res = await api.post('/auth/login', { login, password });
    setAuth(res.token, res.user);

    showToast(`Welcome back, ${res.user.name}!`);

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || '/';

    setTimeout(() => {
      window.location.href = redirect;
    }, 350);
  } catch (err) {
    const msg = err.message || 'Invalid username or password';
    const lower = msg.toLowerCase();

    if (lower.includes('password')) {
      showError('password', msg);
    } else if (lower.includes('user') || lower.includes('email') || lower.includes('account') || lower.includes('found')) {
      showError('email', msg);
    } else {
      showError('form', msg);
    }

    showToast(msg);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
      submitBtn.innerHTML = `<span>Log In</span>`;
    }
  }
};

// Form submit event
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const login = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    performLogin(login, password);
  });
}
