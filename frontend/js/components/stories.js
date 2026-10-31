import { api } from '../core/api.js';
import { getCurrentUser, isAuthenticated } from '../core/auth.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { openGuestModal, openModal, closeModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';
import { escapeHTML } from '../core/utils.js';

let activeStoryGroup = null;
let activeStoryIndex = 0;
let storyTimer = null;
let storyStartTime = 0;
let storyElapsedTime = 0;
let isPaused = false;
const STORY_DURATION = 5000; // 5 seconds per story

/**
 * Fetch and render the Instagram-style Stories Row
 */
export const renderStoriesRow = async (containerEl) => {
  if (!containerEl) return;

  const user = getCurrentUser();
  const loggedIn = isAuthenticated();

  try {
    const res = await api.get('/stories');
    const storyGroups = res.stories || [];

    let yourStoryGroup = null;
    let otherGroups = [];

    if (loggedIn && user) {
      yourStoryGroup = storyGroups.find(g => g.author._id === user.id || g.author._id === user._id);
      otherGroups = storyGroups.filter(g => g.author._id !== user.id && g.author._id !== user._id);
    } else {
      otherGroups = storyGroups;
    }

    let html = `
      <div class="stories-container">
        <div class="stories-row" id="stories-scroll-row">
          <!-- Your Story Circle -->
          <button class="story-circle-item" id="your-story-btn" aria-label="Add or view your story">
            <div class="story-circle-wrap ${yourStoryGroup ? (yourStoryGroup.hasUnseen ? 'story-ring-unseen' : 'story-ring-seen') : ''}">
              <div class="story-avatar-inner">
                ${renderAvatarHTML(user, 'avatar-md')}
              </div>
              ${!yourStoryGroup ? `<div class="story-add-badge">+</div>` : ''}
            </div>
            <span class="story-username-label">Your story</span>
          </button>
    `;

    otherGroups.forEach((group, idx) => {
      const ringClass = group.hasUnseen ? 'story-ring-unseen' : 'story-ring-seen';
      html += `
        <button class="story-circle-item story-group-trigger" data-group-index="${idx}" aria-label="View story from ${escapeHTML(group.author.name)}">
          <div class="story-circle-wrap ${ringClass}">
            <div class="story-avatar-inner">
              ${renderAvatarHTML(group.author, 'avatar-md')}
            </div>
          </div>
          <span class="story-username-label">${escapeHTML(group.author.username || group.author.name)}</span>
        </button>
      `;
    });

    html += `
        </div>
      </div>
    `;

    containerEl.innerHTML = html;

    // Attach listeners
    const yourStoryBtn = containerEl.querySelector('#your-story-btn');
    if (yourStoryBtn) {
      yourStoryBtn.addEventListener('click', () => {
        if (!loggedIn) {
          openGuestModal('join Sangam and post stories');
          return;
        }
        if (yourStoryGroup && yourStoryGroup.items.length > 0) {
          openStoryViewer(yourStoryGroup, 0, () => renderStoriesRow(containerEl));
        } else {
          openCreateStoryModal(() => renderStoriesRow(containerEl));
        }
      });
    }

    const groupBtns = containerEl.querySelectorAll('.story-group-trigger');
    groupBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.groupIndex, 10);
        const group = otherGroups[idx];
        if (group) {
          openStoryViewer(group, 0, () => renderStoriesRow(containerEl));
        }
      });
    });

  } catch (err) {
    console.error('Failed to load stories:', err);
    containerEl.innerHTML = '';
  }
};

/**
 * Open Fullscreen Story Viewer
 */
export const openStoryViewer = (storyGroup, startIndex = 0, onComplete) => {
  activeStoryGroup = storyGroup;
  activeStoryIndex = startIndex;

  // Remove existing viewer if any
  const existing = document.getElementById('story-viewer-modal');
  if (existing) existing.remove();

  const viewer = document.createElement('div');
  viewer.id = 'story-viewer-modal';
  viewer.className = 'story-viewer-backdrop';

  document.body.appendChild(viewer);

  const renderCurrentStory = () => {
    if (!activeStoryGroup || !activeStoryGroup.items[activeStoryIndex]) {
      closeStoryViewer();
      if (onComplete) onComplete();
      return;
    }

    const story = activeStoryGroup.items[activeStoryIndex];
    const totalStories = activeStoryGroup.items.length;

    // Build progress bars
    let progressBarsHTML = '';
    for (let i = 0; i < totalStories; i++) {
      const isCompleted = i < activeStoryIndex ? 'completed' : '';
      progressBarsHTML += `
        <div class="story-progress-track ${isCompleted}" id="story-track-${i}">
          <div class="story-progress-fill" id="story-fill-${i}"></div>
        </div>
      `;
    }

    // Media or Text
    let mediaHTML = '';
    let bgStyle = '';
    if (story.image) {
      mediaHTML = `<img src="${story.image}" alt="Story" class="story-image-full" />`;
    } else {
      bgStyle = `background: ${story.backgroundColor || 'linear-gradient(135deg, #FF007A, #FFA41B)'};`;
      mediaHTML = `<div class="story-text-canvas">${escapeHTML(story.text || '')}</div>`;
    }

    viewer.innerHTML = `
      <div class="story-viewer-card" style="${bgStyle}">
        <div class="story-progress-strip">
          ${progressBarsHTML}
        </div>

        <div class="story-viewer-topbar">
          <div class="story-author-info">
            ${renderAvatarHTML(activeStoryGroup.author, 'avatar-xs')}
            <div>
              <div class="story-author-name">${escapeHTML(activeStoryGroup.author.name)}</div>
              <div class="story-time-ago">${formatStoryTime(story.createdAt)}</div>
            </div>
          </div>
          <button class="story-viewer-close" id="story-close-btn" aria-label="Close story">&times;</button>
        </div>

        <div class="story-content-canvas">
          ${mediaHTML}
          <div class="story-tap-left" id="story-tap-prev"></div>
          <div class="story-tap-right" id="story-tap-next"></div>
        </div>
      </div>
    `;

    // Mark as viewed
    api.post(`/stories/${story._id}/view`).catch(() => {});
    story.viewed = true;

    // Attach controls
    const closeBtn = viewer.querySelector('#story-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeStoryViewer();
        if (onComplete) onComplete();
      });
    }

    const prevArea = viewer.querySelector('#story-tap-prev');
    const nextArea = viewer.querySelector('#story-tap-next');

    if (prevArea) {
      prevArea.addEventListener('click', () => {
        if (activeStoryIndex > 0) {
          activeStoryIndex--;
          renderCurrentStory();
        } else {
          closeStoryViewer();
          if (onComplete) onComplete();
        }
      });
    }

    if (nextArea) {
      nextArea.addEventListener('click', () => {
        advanceStory();
      });
    }

    // Hold to pause
    const card = viewer.querySelector('.story-viewer-card');
    if (card) {
      card.addEventListener('pointerdown', pauseStory);
      card.addEventListener('pointerup', resumeStory);
      card.addEventListener('pointercancel', resumeStory);
    }

    // Start 5s progress timer
    startStoryProgress(activeStoryIndex);
  };

  const advanceStory = () => {
    clearTimeout(storyTimer);
    if (activeStoryIndex < activeStoryGroup.items.length - 1) {
      activeStoryIndex++;
      renderCurrentStory();
    } else {
      closeStoryViewer();
      if (onComplete) onComplete();
    }
  };

  const startStoryProgress = (idx) => {
    clearTimeout(storyTimer);
    const fillEl = viewer.querySelector(`#story-fill-${idx}`);
    if (!fillEl) return;

    fillEl.style.transition = `width ${STORY_DURATION}ms linear`;
    // Force reflow
    void fillEl.offsetWidth;
    fillEl.style.width = '100%';

    storyStartTime = Date.now();
    storyElapsedTime = 0;
    isPaused = false;

    storyTimer = setTimeout(() => {
      advanceStory();
    }, STORY_DURATION);
  };

  const pauseStory = () => {
    if (isPaused) return;
    isPaused = true;
    storyElapsedTime = Date.now() - storyStartTime;
    clearTimeout(storyTimer);

    const fillEl = viewer.querySelector(`#story-fill-${activeStoryIndex}`);
    if (fillEl) {
      const currentWidth = (storyElapsedTime / STORY_DURATION) * 100;
      fillEl.style.transition = 'none';
      fillEl.style.width = `${currentWidth}%`;
    }
  };

  const resumeStory = () => {
    if (!isPaused) return;
    isPaused = false;
    const remainingTime = Math.max(0, STORY_DURATION - storyElapsedTime);

    const fillEl = viewer.querySelector(`#story-fill-${activeStoryIndex}`);
    if (fillEl) {
      fillEl.style.transition = `width ${remainingTime}ms linear`;
      void fillEl.offsetWidth;
      fillEl.style.width = '100%';
    }

    storyTimer = setTimeout(() => {
      advanceStory();
    }, remainingTime);
  };

  // Keyboard navigation (Esc / Arrow keys)
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeStoryViewer();
      if (onComplete) onComplete();
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      advanceStory();
    } else if (e.key === 'ArrowLeft') {
      if (activeStoryIndex > 0) {
        activeStoryIndex--;
        renderCurrentStory();
      }
    }
  };

  window.addEventListener('keydown', onKeyDown);
  viewer._onKeyDown = onKeyDown;

  renderCurrentStory();
};

/**
 * Close Story Viewer
 */
export const closeStoryViewer = () => {
  clearTimeout(storyTimer);
  const viewer = document.getElementById('story-viewer-modal');
  if (viewer) {
    if (viewer._onKeyDown) {
      window.removeEventListener('keydown', viewer._onKeyDown);
    }
    viewer.remove();
  }
};

/**
 * Open Create Story Modal
 */
export const openCreateStoryModal = (onCreated) => {
  const content = document.createElement('div');
  content.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="form-group">
        <label class="form-label">Story Text</label>
        <textarea id="story-create-text" class="form-textarea" placeholder="What's happening right now?" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Story Background Style</label>
        <div style="display: flex; gap: 10px; margin-top: 4px;">
          <button type="button" class="story-bg-choice active" data-bg="linear-gradient(135deg, #FF007A, #FFA41B)" style="width: 38px; height: 38px; border-radius: var(--rad-full); border: 2px solid #FFF; background: linear-gradient(135deg, #FF007A, #FFA41B); cursor: pointer;"></button>
          <button type="button" class="story-bg-choice" data-bg="linear-gradient(135deg, #6366F1, #3B82F6)" style="width: 38px; height: 38px; border-radius: var(--rad-full); border: 2px solid transparent; background: linear-gradient(135deg, #6366F1, #3B82F6); cursor: pointer;"></button>
          <button type="button" class="story-bg-choice" data-bg="linear-gradient(135deg, #10B981, #06B6D4)" style="width: 38px; height: 38px; border-radius: var(--rad-full); border: 2px solid transparent; background: linear-gradient(135deg, #10B981, #06B6D4); cursor: pointer;"></button>
          <button type="button" class="story-bg-choice" data-bg="#111116" style="width: 38px; height: 38px; border-radius: var(--rad-full); border: 2px solid transparent; background: #111116; cursor: pointer;"></button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Or Add Photo URL / Seed Path</label>
        <input type="text" id="story-create-image" class="form-input" placeholder="e.g. /assets/images/seed/dev_laptop.jpg or https://..." />
      </div>

      <button type="button" id="submit-story-btn" class="btn btn-gradient btn-lg" style="width: 100%; margin-top: 8px;">
        Share to Your Story
      </button>
    </div>
  `;

  let selectedBg = 'linear-gradient(135deg, #FF007A, #FFA41B)';
  const bgBtns = content.querySelectorAll('.story-bg-choice');
  bgBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      bgBtns.forEach(b => b.style.borderColor = 'transparent');
      btn.style.borderColor = '#FFF';
      selectedBg = btn.dataset.bg;
    });
  });

  const submitBtn = content.querySelector('#submit-story-btn');
  submitBtn.addEventListener('click', async () => {
    const text = content.querySelector('#story-create-text').value.trim();
    const image = content.querySelector('#story-create-image').value.trim();

    if (!text && !image) {
      showToast('Please enter text or an image for your story');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sharing...';
      await api.post('/stories', {
        text,
        image,
        backgroundColor: selectedBg
      });
      showToast('Story added successfully!');
      closeModal();
      if (onCreated) onCreated();
    } catch (err) {
      showToast(err.message || 'Failed to post story');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Share to Your Story';
    }
  });

  openModal('Add to Your Story', content);
};

const formatStoryTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};
