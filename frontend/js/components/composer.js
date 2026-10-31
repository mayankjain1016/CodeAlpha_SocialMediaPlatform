import { api } from '../core/api.js';
import { getCurrentUser, isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { icons } from '../core/icons.js';
import { showToast } from '../core/toast.js';
import { openGuestModal } from '../core/modal.js';

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

export const initComposer = (container, { onSuccess = null } = {}) => {
  if (!container) return;

  const user = getCurrentUser() || { name: 'You', username: 'guest', avatarHue: 175 };
  let selectedImageDataUrl = null;
  const MAX_CHARS = 280;
  const CIRCUMFERENCE = 69.1; // 2 * PI * 11

  container.innerHTML = `
    <div class="composer-card">
      <div class="composer-header">
        ${renderAvatarHTML(user, 'avatar-md')}
        <div style="flex: 1; min-width: 0;">
          <textarea class="composer-textarea" placeholder="Where rivers meet... share a story, idea, or thought" maxlength="280" aria-label="Compose post text"></textarea>
        </div>
      </div>

      <div class="composer-preview-wrap" style="display: none;">
        <img class="composer-preview-img" src="" alt="Attached image preview">
        <button class="composer-preview-remove" title="Remove image" aria-label="Remove image">
          ${icons.x()}
        </button>
      </div>

      <div class="composer-footer">
        <div class="composer-tools">
          <input type="file" class="composer-file-input" accept="image/jpeg,image/png,image/webp" style="display: none;" aria-label="Upload image">
          <button type="button" class="btn-icon composer-img-btn" title="Add image" aria-label="Add image">
            ${icons.image()}
          </button>
          
          <div style="position: relative;">
            <button type="button" class="btn-icon composer-emoji-btn" title="Add emoji" aria-label="Add emoji">
              ${icons.smile()}
            </button>
            <div class="emoji-popover" style="display: none;">
              ${HANDPICKED_EMOJIS.map(em => `<button type="button" class="emoji-btn" data-emoji="${em}">${em}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="composer-submit-group">
          <div class="char-ring-wrap" title="Characters remaining">
            <svg class="char-ring-svg" viewBox="0 0 28 28">
              <circle class="char-ring-bg" cx="14" cy="14" r="11" fill="none" stroke-width="2.5"/>
              <circle class="char-ring-progress" cx="14" cy="14" r="11" fill="none" stroke-width="2.5"
                stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${CIRCUMFERENCE}"/>
            </svg>
          </div>
          <button class="btn btn-primary btn-compose" disabled>
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

  // Auto-grow textarea
  const updateTextareaHeight = () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 320)}px`;
  };

  // Update character progress ring and submit button state
  const updateState = () => {
    const len = textarea.value.length;
    const progress = Math.min(len / MAX_CHARS, 1);
    const offset = CIRCUMFERENCE * (1 - progress);
    ringProgress.style.strokeDashoffset = offset;

    ringProgress.classList.remove('warn', 'danger');
    if (len >= MAX_CHARS) {
      ringProgress.classList.add('danger');
    } else if (len >= 240) {
      ringProgress.classList.add('warn');
    }

    const hasContent = len > 0 || Boolean(selectedImageDataUrl);
    submitBtn.disabled = !hasContent;
  };

  textarea.addEventListener('input', () => {
    updateTextareaHeight();
    updateState();
  });

  // Emoji Popover Toggle
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

  // Emoji Click
  emojiPopover.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const emoji = btn.dataset.emoji;
      const start = textarea.selectionStart || textarea.value.length;
      const end = textarea.selectionEnd || textarea.value.length;
      const text = textarea.value;
      textarea.value = text.substring(0, start) + emoji + text.substring(end);
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      emojiPopover.style.display = 'none';
      updateTextareaHeight();
      updateState();
    };
  });

  // Attach Image trigger
  imgBtn.onclick = () => {
    if (!isAuthenticated()) {
      openGuestModal('attach photos');
      return;
    }
    fileInput.click();
  };

  const handleSelectedFile = async (file) => {
    if (!file) return;
    try {
      imgBtn.disabled = true;
      const compressed = await compressImageFile(file);
      selectedImageDataUrl = compressed;
      previewImg.src = compressed;
      previewWrap.style.display = 'block';
      updateState();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      imgBtn.disabled = false;
      fileInput.value = '';
    }
  };

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleSelectedFile(file);
  });

  // Drag and drop image onto composer
  const composerCard = container.querySelector('.composer-card');
  composerCard.addEventListener('dragover', (e) => {
    e.preventDefault();
    composerCard.style.outline = '2px dashed var(--accent-primary)';
  });

  composerCard.addEventListener('dragleave', () => {
    composerCard.style.outline = '';
  });

  composerCard.addEventListener('drop', (e) => {
    e.preventDefault();
    composerCard.style.outline = '';
    if (!isAuthenticated()) {
      openGuestModal('attach photos');
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  });

  // Remove attached image
  removeImgBtn.onclick = () => {
    selectedImageDataUrl = null;
    previewImg.src = '';
    previewWrap.style.display = 'none';
    updateState();
  };

  // Submit Post with morphing button
  submitBtn.onclick = async () => {
    if (!isAuthenticated()) {
      openGuestModal('publish posts');
      return;
    }

    const text = textarea.value.trim();
    if (!text && !selectedImageDataUrl) return;

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<span class="btn-spinner"></span>';

    try {
      let mediaId = null;

      if (selectedImageDataUrl) {
        const mediaRes = await api.post('/media', { dataUrl: selectedImageDataUrl });
        mediaId = mediaRes.id;
      }

      const res = await api.post('/posts', { text, mediaId });

      // Reset form
      textarea.value = '';
      selectedImageDataUrl = null;
      previewWrap.style.display = 'none';
      previewImg.src = '';
      updateTextareaHeight();
      updateState();

      showToast('Post published to Sangam!', 'success');

      if (typeof onSuccess === 'function') {
        onSuccess(res.post);
      }
    } catch (err) {
      showToast(err.message || 'Failed to publish post', 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.innerHTML = '<span>Post</span>';
      updateState();
    }
  };
};
