import { getCurrentUser, isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { openGuestModal } from '../core/modal.js';
import { openStoryViewer, openCreateStoryModal } from './stories.js';
import { initComposer } from './composer.js';
import { icons } from '../core/icons.js';
import { escapeHTML } from '../core/utils.js';

/**
 * Render the Facebook-style Create Post Card at the top of the feed
 */
export const renderCreatePostCard = (containerEl, onPostCreated) => {
  if (!containerEl) return;

  const user = getCurrentUser();
  const loggedIn = isAuthenticated();
  const firstName = user ? (user.name ? user.name.split(' ')[0] : 'there') : '';

  const html = `
    <div class="create-post-card">
      <div class="create-post-top">
        ${renderAvatarHTML(user, 'avatar-md')}
        <button class="create-post-prompt-btn" id="feed-composer-prompt">
          What's on your mind${firstName ? `, ${escapeHTML(firstName)}` : ''}?
        </button>
      </div>

      <div class="create-post-actions">
        <button class="create-action-chip" id="action-chip-photo">
          <span class="chip-icon-photo">${icons.image('icon-sm')}</span>
          <span>Photo</span>
        </button>
        <button class="create-action-chip" id="action-chip-story">
          <span class="chip-icon-story">${icons.story('icon-sm')}</span>
          <span>Story</span>
        </button>
        <button class="create-action-chip" id="action-chip-tag">
          <span class="chip-icon-tag" style="font-weight: 700; font-size: 14px;">#</span>
          <span>Topic</span>
        </button>
      </div>
    </div>
  `;

  containerEl.innerHTML = html;

  const promptBtn = containerEl.querySelector('#feed-composer-prompt');
  const photoBtn = containerEl.querySelector('#action-chip-photo');
  const storyBtn = containerEl.querySelector('#action-chip-story');
  const tagBtn = containerEl.querySelector('#action-chip-tag');

  const triggerPostModal = (defaultText = '', focusPhoto = false) => {
    if (!loggedIn) {
      openGuestModal('create a post');
      return;
    }
    initComposer({
      onCreated: (newPost) => {
        if (onPostCreated) onPostCreated(newPost);
      },
      initialContent: defaultText,
      focusPhoto: focusPhoto
    });
  };

  if (promptBtn) {
    promptBtn.addEventListener('click', () => triggerPostModal());
  }

  if (photoBtn) {
    photoBtn.addEventListener('click', () => triggerPostModal('', true));
  }

  if (storyBtn) {
    storyBtn.addEventListener('click', () => {
      if (!loggedIn) {
        openGuestModal('share a story');
        return;
      }
      openCreateStoryModal();
    });
  }

  if (tagBtn) {
    tagBtn.addEventListener('click', () => triggerPostModal('#'));
  }
};
