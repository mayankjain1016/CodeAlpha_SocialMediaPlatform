import { renderAppShell } from '../core/shell.js';
import { api } from '../core/api.js';
import { renderAvatarHTML } from '../core/avatar.js';
import { renderTopicChips } from '../components/topicChips.js';
import { openGuestModal, openModal, closeModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';
import { isAuthenticated } from '../core/auth.js';
import { escapeHTML, timeAgo } from '../core/utils.js';

let currentTopic = '';
let nextCursor = null;
let isLoading = false;
let hasReachedEnd = false;

const masonryContainer = document.getElementById('explore-masonry-container');
const loadingIndicator = document.getElementById('explore-loading');

export const initExplorePage = async () => {
  renderAppShell('explore');

  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  currentTopic = urlParams.get('topic') || urlParams.get('tag') || '';

  // Render Topic Chips
  const topicChipsMount = document.getElementById('explore-topics-mount');
  if (topicChipsMount) {
    renderTopicChips(topicChipsMount, currentTopic, (selected) => {
      currentTopic = selected;
      // Update URL without reload
      const newUrl = selected ? `/explore?topic=${encodeURIComponent(selected)}` : '/explore';
      window.history.pushState({}, '', newUrl);
      refreshExplore();
    });
  }

  // Load Initial Explore Content
  await refreshExplore();

  // Infinite Scroll Observer
  setupInfiniteScroll();
};

const refreshExplore = async () => {
  nextCursor = null;
  hasReachedEnd = false;
  if (masonryContainer) masonryContainer.innerHTML = '';
  await loadMoreExplore();
};

const loadMoreExplore = async () => {
  if (isLoading || hasReachedEnd) return;
  isLoading = true;

  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
    loadingIndicator.textContent = 'Discovering more ideas...';
  }

  try {
    const params = new URLSearchParams();
    params.set('limit', '12');
    if (nextCursor) params.set('cursor', nextCursor);
    if (currentTopic) params.set('topic', currentTopic);

    const res = await api.get(`/posts/explore?${params.toString()}`);
    const posts = res.posts || res.items || [];
    nextCursor = res.nextCursor || null;

    if (posts.length === 0 && (!masonryContainer.children.length)) {
      masonryContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px 20px; text-align: center; color: var(--text-muted);">
          <div style="margin-bottom: 12px; color: var(--text-muted); display: flex; justify-content: center;">
            <svg class="icon icon-lg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
          </div>
          <div style="font-weight: 700; font-size: var(--text-base); color: var(--text-main); margin-bottom: 4px;">Nothing here yet</div>
          <div style="font-size: var(--text-xs);">Try exploring another topic or share your own thoughts!</div>
        </div>
      `;
      hasReachedEnd = true;
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      return;
    }

    posts.forEach(post => {
      const card = createMasonryCard(post);
      masonryContainer.appendChild(card);
    });

    if (!nextCursor || posts.length < 12) {
      hasReachedEnd = true;
      if (loadingIndicator) loadingIndicator.textContent = 'You have reached the end of the stream';
    } else {
      if (loadingIndicator) loadingIndicator.style.display = 'none';
    }

  } catch (err) {
    console.error('Failed to load explore posts:', err);
    if (loadingIndicator) loadingIndicator.textContent = 'Error loading explore. Tap to retry.';
  } finally {
    isLoading = false;
  }
};

/**
 * Create Pinterest-style Masonry Card
 */
const createMasonryCard = (post) => {
  const card = document.createElement('article');
  card.className = 'masonry-card';
  card.id = `explore-${post._id}`;

  const author = post.author || { name: 'Anonymous', username: 'unknown' };
  const hasImage = Boolean(post.image);

  card.innerHTML = `
    ${hasImage ? `
      <img src="${escapeHTML(post.image)}" alt="Explore image" class="masonry-card-img" loading="lazy" />
    ` : `
      <div style="padding: 24px; background: var(--grad-sunrise-soft); min-height: 140px; display: flex; flex-direction: column; justify-content: space-between;">
        <p style="font-size: var(--text-base); font-weight: 600; line-height: 1.5; color: var(--text-main); margin: 0;">
          ${escapeHTML(post.text || '')}
        </p>
      </div>
    `}

    <!-- Pinterest Hover Overlay -->
    <div class="masonry-overlay">
      <div class="masonry-top-actions">
        <button type="button" class="btn-save-pinterest" aria-label="Save bookmark">
          ${post.bookmarkedByMe ? 'Saved' : 'Save'}
        </button>
      </div>

      <div class="masonry-bottom-info">
        <div class="masonry-author-chip">
          ${renderAvatarHTML(author, 'avatar-xs')}
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px;">
            ${escapeHTML(author.name)}
          </span>
        </div>

        <div class="masonry-stats-row">
          <span>❤️ ${post.likesCount || 0}</span>
          <span>💬 ${post.commentsCount || 0}</span>
        </div>
      </div>
    </div>
  `;

  // Quick Save Button on Hover
  const saveBtn = card.querySelector('.btn-save-pinterest');
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!isAuthenticated()) {
        openGuestModal('save posts to your collection');
        return;
      }
      try {
        const res = await api.post(`/posts/${post._id}/bookmark`);
        post.bookmarkedByMe = res.bookmarked;
        saveBtn.textContent = res.bookmarked ? 'Saved' : 'Save';
        showToast(res.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
      } catch (err) {
        showToast(err.message || 'Failed to save');
      }
    });
  }

  // Click card to open Rich Detail Modal
  card.addEventListener('click', () => {
    openExploreDetailModal(post);
  });

  return card;
};

/**
 * Open Pinterest-style rich modal viewer with details, comments, and related suggestions
 */
const openExploreDetailModal = async (post) => {
  const content = document.createElement('div');
  const author = post.author || { name: 'Anonymous', username: 'unknown' };

  content.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      ${post.image ? `
        <div style="width: 100%; border-radius: var(--rad-md); overflow: hidden; background: #000; max-height: 500px; display: flex; align-items: center; justify-content: center;">
          <img src="${escapeHTML(post.image)}" alt="Full view" style="max-width: 100%; max-height: 500px; object-fit: contain;" />
        </div>
      ` : ''}

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 0;">
        <a href="/u/${escapeHTML(author.username)}" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit;">
          ${renderAvatarHTML(author, 'avatar-sm')}
          <div>
            <div style="font-weight: 700; font-size: var(--text-sm);">${escapeHTML(author.name)}</div>
            <div style="font-size: var(--text-2xs); color: var(--text-muted);">@${escapeHTML(author.username)} &middot; ${timeAgo(post.createdAt)}</div>
          </div>
        </a>
        <a href="/post/${post._id}" class="btn btn-primary btn-sm">Full Discussion ↗</a>
      </div>

      ${post.text ? `
        <div style="font-size: var(--text-base); line-height: 1.5; color: var(--text-main);">
          ${escapeHTML(post.text)}
        </div>
      ` : ''}

      <!-- Stats strip -->
      <div style="display: flex; gap: 16px; font-size: var(--text-xs); color: var(--text-secondary); border-top: 1px solid var(--border-hairline); padding-top: 12px;">
        <span><strong>${post.likesCount || 0}</strong> reactions</span>
        <span><strong>${post.commentsCount || 0}</strong> comments</span>
      </div>
    </div>
  `;

  openModal('Explore Discovery', content);
};

const setupInfiniteScroll = () => {
  if (!loadingIndicator) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && !hasReachedEnd) {
      loadMoreExplore();
    }
  }, { rootMargin: '350px' });

  observer.observe(loadingIndicator);
};

document.addEventListener('DOMContentLoaded', initExplorePage);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initExplorePage();
}
