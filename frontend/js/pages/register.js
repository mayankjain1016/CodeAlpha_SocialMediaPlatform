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
renderAppShell('register');

// Form elements
const form = document.getElementById('register-form');
const nameInput = document.getElementById('reg-name');
const usernameInput = document.getElementById('reg-username');
const emailInput = document.getElementById('reg-email');
const passwordInput = document.getElementById('reg-password');
const submitBtn = document.getElementById('register-submit-btn') || document.getElementById('reg-submit-btn');
const pwToggleBtn = document.getElementById('reg-password-toggle');

const nameError = document.getElementById('reg-name-error');
const usernameError = document.getElementById('reg-username-error');
const emailError = document.getElementById('reg-email-error');
const passwordError = document.getElementById('reg-password-error');
const formError = document.getElementById('reg-form-error');

// Show field error
const showError = (field, message) => {
  if (field === 'name' && nameInput && nameError) {
    nameInput.classList.add('is-invalid');
    nameError.textContent = message;
    nameError.style.display = 'flex';
  } else if (field === 'username' && usernameInput && usernameError) {
    usernameInput.classList.add('is-invalid');
    usernameError.textContent = message;
    usernameError.style.display = 'flex';
  } else if (field === 'email' && emailInput && emailError) {
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
  [nameInput, usernameInput, emailInput, passwordInput].forEach(inp => {
    if (inp) inp.classList.remove('is-invalid');
  });
  [nameError, usernameError, emailError, passwordError, formError].forEach(err => {
    if (err) {
      err.style.display = 'none';
      err.textContent = '';
    }
  });
};

// Clear errors on typing
[
  [nameInput, nameError],
  [usernameInput, usernameError],
  [emailInput, emailError],
  [passwordInput, passwordError]
].forEach(([inp, errEl]) => {
  if (inp) {
    inp.addEventListener('input', () => {
      inp.classList.remove('is-invalid');
      if (errEl) errEl.style.display = 'none';
      if (formError) formError.style.display = 'none';
    });
  }
});

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

// Form submit event
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const name = nameInput ? nameInput.value.trim() : '';
    const username = usernameInput ? usernameInput.value.trim().toLowerCase() : '';
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const password = passwordInput ? passwordInput.value : '';

    let hasError = false;

    if (!name) {
      showError('name', 'Please enter your full name');
      hasError = true;
    }

    if (!username) {
      showError('username', 'Please choose a username');
      hasError = true;
    } else if (username.length < 3) {
      showError('username', 'Username must be at least 3 characters');
      hasError = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showError('username', 'Username can only contain letters, numbers, and underscores');
      hasError = true;
    }

    if (!email) {
      showError('email', 'Please enter your email address');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('email', 'Please enter a valid email address');
      hasError = true;
    }

    if (!password) {
      showError('password', 'Please create a password');
      hasError = true;
    } else if (password.length < 6) {
      showError('password', 'Password must be at least 6 characters');
      hasError = true;
    }

    if (hasError) return;

    // Button spinner
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
      submitBtn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span>Creating account...</span>`;
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
      const msg = err.message || 'Registration failed';
      const lower = msg.toLowerCase();

      if (lower.includes('email')) {
        showError('email', msg);
      } else if (lower.includes('username')) {
        showError('username', msg);
      } else if (lower.includes('password')) {
        showError('password', msg);
      } else if (lower.includes('name')) {
        showError('name', msg);
      } else {
        showError('form', msg);
      }

      showToast(msg);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        submitBtn.innerHTML = `<span>Create Account</span>`;
      }
    }
  });
}
