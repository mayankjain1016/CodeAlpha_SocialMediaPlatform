import { icons } from './icons.js';

let previousFocusedElement = null;

export const openModal = (modalElement) => {
  previousFocusedElement = document.activeElement;
  modalElement.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Find focusable elements
  const focusables = modalElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusables.length > 0) {
    focusables[0].focus();
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal(modalElement);
    }

    if (e.key === 'Tab' && focusables.length > 0) {
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };

  modalElement._keyHandler = handleKeyDown;
  document.addEventListener('keydown', handleKeyDown);

  // Close on backdrop click
  modalElement.onclick = (e) => {
    if (e.target === modalElement) {
      closeModal(modalElement);
    }
  };
};

export const closeModal = (modalElement) => {
  if (!modalElement) return;
  modalElement.classList.remove('active');
  document.body.style.overflow = '';

  if (modalElement._keyHandler) {
    document.removeEventListener('keydown', modalElement._keyHandler);
    delete modalElement._keyHandler;
  }

  if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
    previousFocusedElement.focus();
  }
};

/**
 * Promise-based confirmation dialog modal
 */
export const confirmModal = ({ title, message, confirmText = 'Confirm', confirmDanger = false }) => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div class="modal-header">
          <h3 id="confirm-modal-title" class="modal-title">${title}</h3>
          <button class="btn-icon modal-close-btn" aria-label="Close dialog">${icons.x()}</button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); margin: 0;">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary cancel-btn">Cancel</button>
          <button class="btn ${confirmDanger ? 'btn-danger' : 'btn-primary'} confirm-btn">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    openModal(overlay);

    const cleanup = (result) => {
      closeModal(overlay);
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 300);
      resolve(result);
    };

    overlay.querySelector('.cancel-btn').onclick = () => cleanup(false);
    overlay.querySelector('.modal-close-btn').onclick = () => cleanup(false);
    overlay.querySelector('.confirm-btn').onclick = () => cleanup(true);
  });
};

/**
 * Reusable "Join Sangam" guest modal
 */
export const openGuestModal = (actionName = 'perform this action') => {
  let modal = document.getElementById('guest-join-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'guest-join-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="guest-title">
        <div class="modal-header">
          <h3 id="guest-title" class="modal-title">Join Sangam</h3>
          <button class="btn-icon modal-close-btn" aria-label="Close dialog">${icons.x()}</button>
        </div>
        <div class="modal-body" style="text-align: center; padding: var(--space-6) var(--space-4);">
          <div style="width: 56px; height: 56px; margin: 0 auto var(--space-4); border-radius: var(--radius-full); background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center;">
            ${icons.sparkles('nav-icon')}
          </div>
          <h4 style="font-size: var(--text-lg); margin-bottom: var(--space-2);">Connect, share and discover</h4>
          <p id="guest-action-hint" style="color: var(--text-secondary); max-width: 340px; margin: 0 auto var(--space-6);">Create an account or log in to ${actionName}.</p>
          <div style="display: flex; flex-direction: column; gap: var(--space-3); max-width: 280px; margin: 0 auto;">
            <a href="/login" class="btn btn-primary" style="width: 100%;">Log In</a>
            <a href="/register" class="btn btn-secondary" style="width: 100%;">Create Account</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close-btn').onclick = () => closeModal(modal);
  }

  const hint = modal.querySelector('#guest-action-hint');
  if (hint) {
    hint.textContent = `Create an account or log in to ${actionName}.`;
  }

  openModal(modal);
};
