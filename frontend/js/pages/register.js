import { api } from '../core/api.js';
import { setAuth, isAuthenticated } from '../core/auth.js';
import { icons } from '../core/icons.js';
import { showToast } from '../core/toast.js';

const form = document.getElementById('register-form');
const nameInput = document.getElementById('reg-name');
const usernameInput = document.getElementById('reg-username');
const emailInput = document.getElementById('reg-email');
const passwordInput = document.getElementById('reg-password');
const pwToggle = document.getElementById('reg-pw-toggle');
const strengthFill = document.getElementById('strength-fill');
const strengthLabel = document.getElementById('strength-label');
const submitBtn = document.getElementById('reg-submit-btn');
const generalError = document.getElementById('reg-general-error');

if (isAuthenticated()) {
  window.location.href = '/';
}

// Password show/hide toggle
let isPasswordVisible = false;
pwToggle.onclick = () => {
  isPasswordVisible = !isPasswordVisible;
  passwordInput.type = isPasswordVisible ? 'text' : 'password';
  pwToggle.innerHTML = isPasswordVisible ? icons.eyeOff() : icons.eye();
};

// Password strength meter calculation
passwordInput.addEventListener('input', () => {
  const val = passwordInput.value;
  let score = 0;

  if (val.length >= 6) score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  if (val.length === 0) {
    strengthFill.style.width = '0';
    strengthLabel.textContent = '';
  } else if (score <= 1) {
    strengthFill.style.width = '25%';
    strengthFill.style.backgroundColor = 'var(--red-500)';
    strengthLabel.textContent = 'Weak';
    strengthLabel.style.color = 'var(--red-500)';
  } else if (score === 2) {
    strengthFill.style.width = '50%';
    strengthFill.style.backgroundColor = 'var(--amber-500)';
    strengthLabel.textContent = 'Fair';
    strengthLabel.style.color = 'var(--amber-500)';
  } else if (score === 3 || score === 4) {
    strengthFill.style.width = '75%';
    strengthFill.style.backgroundColor = 'var(--primary)';
    strengthLabel.textContent = 'Good';
    strengthLabel.style.color = 'var(--primary)';
  } else {
    strengthFill.style.width = '100%';
    strengthFill.style.backgroundColor = 'var(--emerald-500)';
    strengthLabel.textContent = 'Strong';
    strengthLabel.style.color = 'var(--emerald-500)';
  }
});

form.onsubmit = async (e) => {
  e.preventDefault();
  generalError.style.display = 'none';
  generalError.textContent = '';

  const name = nameInput.value.trim();
  const username = usernameInput.value.trim().toLowerCase();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!name || !username || !email || !password) {
    generalError.textContent = 'Please fill out all fields.';
    generalError.style.display = 'block';
    return;
  }

  if (password.length < 6) {
    generalError.textContent = 'Password must be at least 6 characters.';
    generalError.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-spinner"></span>';

  try {
    const res = await api.post('/auth/register', {
      name,
      username,
      email,
      password,
    });

    setAuth(res.token, res.user);
    showToast(`Welcome to Sangam, ${res.user.name}!`, 'success');

    setTimeout(() => {
      window.location.href = '/';
    }, 400);
  } catch (err) {
    generalError.textContent = err.message || 'Registration failed. Please check your details.';
    generalError.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
};
