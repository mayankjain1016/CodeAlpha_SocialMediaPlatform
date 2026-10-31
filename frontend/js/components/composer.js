import { api } from '../core/api.js';
import { getCurrentUser, isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { icons } from '../core/icons.js';
import { showToast } from '../core/toast.js';
import { openGuestModal, openModal, closeModal } from '../core/modal.js';

const HANDPICKED_EMOJIS = ['✨', '🚀', '💡', '🔥', '☕', '❤️', '🌊', '🌿', '🎨', '⚡', '💬', '🌸', '🙏', '🎯', '👏', '🤝', '☀️', '🌙'];

/**
 * Compress an image file using an offscreen canvas to max 1200px and under 400KB
 */
export const compressImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        if (dataUrl.length > 540000) {
          quality = 0.65;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Initialize Composer either in an inline container or as an overlay Modal
 */
export const initComposer = (containerOrOptions, maybeOptions = {}) => {
  let container = null;
  let options = {};

  if (containerOrOptions instanceof HTMLElement) {
    container = containerOrOptions;
    options = maybeOptions;
  } else if (containerOrOptions && typeof containerOrOptions === 'object') {
    options = containerOrOptions;
  }

  // If called without DOM container, open as a modal!
  if (!container) {
    if (!isAuthenticated()) {
      openGuestModal('create a post');
      return;
    }

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-composer-inner';
    openModal('Create Post', modalContent);

    renderComposerInContainer(modalContent, {
      ...options,
      onSuccess: (newPost) => {
        closeModal();
        if (options.onCreated) options.onCreated(newPost);
        if (options.onSuccess) options.onSuccess(newPost);
      }
    });
    return;
  }

  renderComposerInContainer(container, options);
};

const renderComposerInContainer = (container, options = {}) => {
  const user = getCurrentUser() || { name: 'You', username: 'guest' };
  let selectedImageDataUrl = null;
  const MAX_CHARS = 280;
  const CIRCUMFERENCE = 69.1;

  container.innerHTML = `
    <div class="composer-card" style="border: none; box-shadow: none; padding: 0;">
      <div style="display: flex; gap: 12px; align-items: flex-start;">
        ${renderAvatarHTML(user, 'avatar-md')}
        <div style="flex: 1; min-width: 0;">
          <textarea class="composer-textarea form-textarea" placeholder="What's happening? Share a thought, link, or photo..." maxlength="280" rows="3" style="min-height: 80px; width: 100%; border: none; background: transparent; padding: 4px; font-size: var(--text-base);"></textarea>
        </div>
      </div>

      <div class="composer-preview-wrap" style="display: none; position: relative; margin-top: 12px; border-radius: var(--rad-md); overflow: hidden; background: #000;">
        <img class="composer-preview-img" src="" alt="Preview" style="max-height: 280px; width: 100%; object-fit: contain; display: block;" />
        <button type="button" class="composer-preview-remove" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); border: none; color: #FFF; width: 28px; height: 28px; border-radius: var(--rad-full); cursor: pointer; display: flex; align-items: center; justify-content: center;">
          &times;
        </button>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-hairline); margin-top: 14px; padding-top: 12px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <input type="file" class="composer-file-input" accept="image/jpeg,image/png,image/webp" style="display: none;" />
          <button type="button" class="btn-icon composer-img-btn" title="Add image" aria-label="Add image" style="color: #10B981;">
            ${icons.image()}
          </button>
          
          <div style="position: relative;">
            <button type="button" class="btn-icon composer-emoji-btn" title="Add emoji" aria-label="Add emoji" style="color: #FFA41B;">
              ${icons.smile()}
            </button>
            <div class="emoji-popover" style="display: none; position: absolute; bottom: calc(100% + 8px); left: 0; background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: var(--rad-md); box-shadow: var(--shadow-floating); padding: 8px; grid-template-columns: repeat(6, 1fr); gap: 4px; z-index: 100; min-width: 200px;">
              ${HANDPICKED_EMOJIS.map(em => `<button type="button" class="emoji-btn" data-emoji="${em}" style="background: none; border: none; font-size: 1.3rem; padding: 4px; cursor: pointer; border-radius: 4px;">${em}</button>`).join('')}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="char-ring-wrap" title="Characters remaining" style="width: 24px; height: 24px;">
            <svg viewBox="0 0 28 28" style="width: 100%; height: 100%; transform: rotate(-90deg);">
              <circle cx="14" cy="14" r="11" fill="none" stroke="var(--border-hairline)" stroke-width="2.5"/>
              <circle class="char-ring-progress" cx="14" cy="14" r="11" fill="none" stroke="var(--primary)" stroke-width="2.5"
                stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${CIRCUMFERENCE}" style="transition: stroke-dashoffset 0.15s;"/>
            </svg>
          </div>
          <button type="button" class="btn btn-gradient btn-compose" disabled>
            <span>Post</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const textarea = container.querySelector('.composer-textarea');
  const fileInput = container.querySelector('.composer-file-input');
  const imgBtn = container.querySelector('.composer-img-btn');
  const emojiBtn = container.querySelector('.composer-emoji-btn');
  const emojiPopover = container.querySelector('.emoji-popover');
  const previewWrap = container.querySelector('.composer-preview-wrap');
  const previewImg = container.querySelector('.composer-preview-img');
  const removeImgBtn = container.querySelector('.composer-preview-remove');
  const submitBtn = container.querySelector('.btn-compose');
  const ringProgress = container.querySelector('.char-ring-progress');

  if (options.initialContent) {
    textarea.value = options.initialContent;
  }

  const updateState = () => {
    const len = textarea.value.length;
    const progress = Math.min(len / MAX_CHARS, 1);
    const offset = CIRCUMFERENCE * (1 - progress);
    ringProgress.style.strokeDashoffset = offset;

    const hasContent = len > 0 || Boolean(selectedImageDataUrl);
    submitBtn.disabled = !hasContent;
  };

  textarea.addEventListener('input', updateState);
  updateState();

  if (options.focusPhoto) {
    setTimeout(() => fileInput.click(), 100);
  }

  // Emoji Popover
  emojiBtn.onclick = (e) => {
    e.stopPropagation();
    const isVisible = emojiPopover.style.display === 'grid';
    emojiPopover.style.display = isVisible ? 'none' : 'grid';
  };

  document.addEventListener('click', (e) => {
    if (!emojiPopover.contains(e.target) && !emojiBtn.contains(e.target)) {
      emojiPopover.style.display = 'none';
    }
  });

  emojiPopover.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const emoji = btn.dataset.emoji;
      textarea.value += emoji;
      textarea.focus();
      emojiPopover.style.display = 'none';
      updateState();
    };
  });

  imgBtn.onclick = () => {
    fileInput.click();
  };

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      imgBtn.disabled = true;
      const compressed = await compressImageFile(file);
      selectedImageDataUrl = compressed;
      previewImg.src = compressed;
      previewWrap.style.display = 'block';
      updateState();
    } catch (err) {
      showToast(err.message);
    } finally {
      imgBtn.disabled = false;
      fileInput.value = '';
    }
  });

  removeImgBtn.onclick = () => {
    selectedImageDataUrl = null;
    previewImg.src = '';
    previewWrap.style.display = 'none';
    updateState();
  };

  submitBtn.onclick = async () => {
    const text = textarea.value.trim();
    if (!text && !selectedImageDataUrl) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
      let mediaId = null;
      if (selectedImageDataUrl) {
        const mediaRes = await api.post('/media', { dataUrl: selectedImageDataUrl });
        mediaId = mediaRes.id;
      }

      const res = await api.post('/posts', { text, mediaId });
      showToast('Post published!');

      if (options.onSuccess) {
        options.onSuccess(res.post);
      }
    } catch (err) {
      showToast(err.message || 'Failed to post');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post';
    }
  };
};
